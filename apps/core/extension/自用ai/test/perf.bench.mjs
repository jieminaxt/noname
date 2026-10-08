// 自用ai 扩展性能基准（相对无名杀本体原版）
// 用法：node apps/core/extension/自用ai/test/perf.bench.mjs
// 复用 headless 加载（bundle noname 源码 + 注入浏览器桩），但只跑扩展的可独立测量热点：
//   A. CacheContext 函数键序列化（原版每次 MD5(fn.toString()) vs WeakMap O(1)）
//   B. selectableCards 闭包缓存（原版每次 getCards("hes") vs 同决策缓存）
// 决策期 memo（P2）挂在 CacheContext 环境下，headless 无完整玩家数据无法精确跑通，
// 此处以函数键序列化成本为代理指标（memo hit 等于省掉一次完整 effect/order 展开）。
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const CORE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const WORKSPACE_ROOT = join(CORE_DIR, "../../");

// ----- fn-key 原始实现（本体 get/index.js 原版路径走 CacheContext._wrapParameterToCacheKey） -----
// 我们只需测量 patch 前后该方法的单次调用成本：原版 = MD5(fn.toString())，
// 优化 = WeakMap.get + 首次 MD5。测量时直接对比 (原始 MD5 路径) vs (patch 后) 调用耗时。

function resolveEsbuild() {
	const pnpmDir = join(WORKSPACE_ROOT, "node_modules/.pnpm");
	if (existsSync(pnpmDir)) {
		const versions = readdirSync(pnpmDir)
			.filter((d) => d.startsWith("esbuild@") && !d.includes("+"))
			.sort()
			.reverse();
		for (const v of versions) {
			const p = join(pnpmDir, v, "node_modules/esbuild/lib/main.js");
			if (existsSync(p)) return p;
		}
	}
	throw new Error("找不到 esbuild（pnpm store 无 esbuild@*）。请先安装：pnpm install --ignore-scripts");
}

const storageData = new Map();
const storage = {
	getItem: (k) => (storageData.has(k) ? storageData.get(k) : null),
	setItem: (k, v) => storageData.set(k, String(v)),
	removeItem: (k) => storageData.delete(k),
	clear: () => storageData.clear(),
	key: (i) => [...storageData.keys()][i] ?? null,
	get length() { return storageData.size; },
};
globalThis.localStorage = storage;
globalThis.sessionStorage = { ...storage };
globalThis.window = globalThis;
globalThis.self = globalThis;
globalThis.alert = () => {};
globalThis.confirm = () => false;
globalThis.prompt = () => null;
globalThis.open = () => null;
globalThis.close = () => {};
Object.defineProperty(globalThis, "navigator", { value: { userAgent: "node-test", platform: "linux" }, configurable: true });
globalThis.location = { href: "http://localhost/", origin: "http://localhost", protocol: "http:", host: "localhost", pathname: "/" };
globalThis.document = {
	createElement: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, addEventListener() {}, setAttribute() {}, appendChild() {} }),
	createDocumentFragment: () => ({ appendChild() {} }),
	getElementById: () => null,
	querySelector: () => null,
	querySelectorAll: () => [],
	addEventListener() {},
	body: { appendChild() {}, classList: { add() {}, remove() {}, contains() { return false; } }, style: {} },
	documentElement: { style: {}, classList: { add() {}, remove() {} } },
	head: { appendChild() {} },
	createTextNode: () => ({}),
};
globalThis.HTMLElement = class HTMLElement {};
globalThis.Element = class Element {};
globalThis.Node = class Node {};
for (const t of ["HTMLDivElement", "HTMLSpanElement", "HTMLImageElement", "HTMLInputElement", "HTMLCanvasElement", "HTMLParagraphElement", "HTMLAnchorElement", "HTMLButtonElement", "HTMLUListElement", "HTMLLIElement", "SVGElement", "CSSStyleDeclaration", "CustomEvent", "Event", "TouchEvent", "MouseEvent", "KeyboardEvent"]) {
	Object.defineProperty(globalThis, t, { value: class {}, configurable: true });
}
globalThis.indexedDB = { open() { return {}; } };
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;

const stubVue = {
	name: "stub-vue",
	setup(build) {
		build.onResolve({ filter: /\.vue$/ }, (args) => ({ path: args.path, namespace: "vue-stub" }));
		build.onLoad({ filter: /.*/, namespace: "vue-stub" }, () => ({ contents: "export default {};", loader: "js" }));
	},
};
const esbuildMain = resolveEsbuild();
const { build: esbuildBuild } = await import(esbuildMain);

const entrySrc = `
export { lib, game, ui, get, ai, _status } from "${join(CORE_DIR, "noname.js")}";
export { default as ext } from "${join(CORE_DIR, "extension/自用ai/extension.js")}";
export { FLAG, patch, backup } from "${join(CORE_DIR, "extension/自用ai/js/core.js")}";
export { CacheContext } from "${join(CORE_DIR, "noname/library/cache/cacheContext.js")}";
`;
const outfile = join(tmpdir(), "ai_perf_bundle.mjs");
await esbuildBuild({
	stdin: { contents: entrySrc, resolveDir: CORE_DIR, sourcefile: "perf_entry.mjs" },
	bundle: true,
	format: "esm",
	platform: "node",
	conditions: ["development"],
	alias: { "@": join(CORE_DIR, "noname") },
	outfile,
	plugins: [stubVue],
	logLevel: "warning",
});

const mod = await import(outfile);
const { lib, game, get, _status, ext, FLAG, patch, backup, CacheContext } = mod;
if (!lib.config) lib.config = {};

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const bench = (name, iters, fn) => {
	const t0 = now();
	fn();
	const dt = now() - t0;
	console.log(`  ${name}: ${dt.toFixed(0)}ms / ${iters}次 = ${(dt / iters * 1000).toFixed(1)}µs/次`);
	return dt;
};

console.log("=== A. CacheContext 函数键序列化（P1 WeakMap）===");
// 原版：CacheContext._wrapParameterToCacheKey 对 function 做 MD5(fn.toString())
// 优化：WeakMap 缓存（首次仍 MD5）
const fn = function (card) { return card.suit == "heart" ? 3 : 1; };
const N = 20000;

// patch 前的原始方法（本体路径）
const origWrap = CacheContext._wrapParameterToCacheKey;
const tRaw = bench("原版 MD5(fn.toString())", N, () => {
	for (let i = 0; i < N; i++) origWrap(fn);
});
// 安装扩展（P1 patch 生效）
lib.config.extension_自用ai_onai = true;
lib.config.extension_自用ai_aiprofile = false;
ext().precontent();
const tPatched = bench("优化 WeakMap", N, () => {
	for (let i = 0; i < N; i++) CacheContext._wrapParameterToCacheKey(fn);
});
console.log(`  加速比: ${(tRaw / Math.max(1e-9, tPatched)).toFixed(1)}x`);

console.log("\n=== B. selectableCards 闭包缓存（P3）===");
// 原版：get.selectableCards 每次重新 player.getCards("hes") 构建数组
// 优化：同决策（player+event+手牌代际）缓存 getCards 结果，只遍历过滤
// 模拟 80 张手牌
const mkFakeCard = (i) => ({
	classList: {
		contains: (cls) => cls === "selectable",
	},
	_sel: false,
	$i: i,
});
const fakeCards = [];
for (let i = 0; i < 80; i++) fakeCards.push(mkFakeCard(i));
const fakePlayer = {
	getCards: () => fakeCards.slice(0),
	countCards: () => fakeCards.length,
	getSkills: () => [],
	isDead: () => false,
};
_status.eventManager.eventStack.push({
	player: fakePlayer,
	filterCard: null,
});

const M = 2000;
// 原版路径（关闭 onai，patch 回退 original = player.getCards 每调用）
lib.config.extension_自用ai_onai = false;
const tSelRaw = bench("原版 每次重建", M, () => {
	for (let i = 0; i < M; i++) get.selectableCards();
});
// 优化路径
lib.config.extension_自用ai_onai = true;
const tSelPatched = bench("优化 闭包缓存", M, () => {
	for (let i = 0; i < M; i++) get.selectableCards();
});
console.log(`  加速比: ${(tSelRaw / Math.max(1e-9, tSelPatched)).toFixed(1)}x`);

console.log("\n=== C. 参考：80 牌决策期间单次 get.selectableCards 实际成本（profil 视角）===");
console.log(`  原版每决策轮约 ${(tSelRaw / M * 1000).toFixed(2)}µs 用于构建候选数组；优化后降到 ${(tSelPatched / M * 1000).toFixed(2)}µs`);

console.log("\n=== D. 决策期 memo（P2）：60 牌 × 3 轮 order 评价 ===");
// 场景：chooseToUse 的 AI 阶段会多轮试探（选牌→失败→redo），每轮对每张手牌
// 调 get.order。原版每轮全量重算（getSkills/expandSkills 展开全部技能）；
// 优化版按 _status.event 挂 memo，同事件内第二次起命中。
// headless 拿不到完整技能树，这里用指数退避的 order 计算函数模拟展开成本。
const libCard = lib.card;
const skillOrderNames = ["sha", "juedou", "huogong", "wanjian", "shandian", "tao", "wuxie", "guohe", "shunshou", "jiedao"];
skillOrderNames.forEach((n, idx) => {
	libCard[n] = libCard[n] || {};
	libCard[n].ai = libCard[n].ai || {};
	libCard[n].ai.order = 10 - idx;
});
const cards60 = [];
for (let i = 0; i < 60; i++) {
	cards60.push({ name: skillOrderNames[i % skillOrderNames.length], $ci: i });
}
const player60 = {
	getCards: () => cards60.slice(0),
	countCards: () => 60,
	getSkills: () => [],
	getModableSkills: () => [],
	getSkillsIncluding: () => [],
	isDead: () => false,
	hasSkill: () => false,
};
const now2 = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
console.log("  [headless 简化：'展开'用空技能集，原版每轮重建缓存为唯一多余成本]");

// 每轮 = new CacheContext 开始 → 遍历 60 张 get.order → 释放
const measureRound = (iterations) => {
	const t0 = now2();
	for (let r = 0; r < iterations; r++) {
		CacheContext.setCacheContext(new CacheContext());
		CacheContext.setInCacheEnvironment(true);
		for (let c = 0; c < cards60.length; c++) {
			get.order(cards60[c], player60);
		}
		CacheContext.setInCacheEnvironment(false);
		CacheContext.removeCacheContext();
		_status.eventManager.eventStack[0].$r = r; // 模拟事件阶段推进（本轮无关）
	}
	return now2() - t0;
};

const R = 5;
lib.config.extension_自用ai_onai = false;
const tOrderRaw = bench("原版 每轮全量", R * cards60.length, () => measureRound(R));
lib.config.extension_自用ai_onai = true;
const tOrderPatched = bench("优化 决策内memo", R * cards60.length, () => measureRound(R));
console.log(`  单次调用额外开销: ${((tOrderPatched / (R * cards60.length)) - (tOrderRaw / (R * cards60.length))).toFixed(1)}µs`);
console.log("  [headless 空技能集下 raw 无展开成本，仅测出 memo 机制的查询开销]");
console.log("  [真实对局中单次 get.order/get.effect 需先 expandSkills 遍历全部主动技能，");
console.log("   该成本随技能数线性增长，远超此查询开销，决策重试轮内命中即净省]");
console.log("  [量化指引：真局开启 aiprofile，观察 order/effect '重算' 与 '命中' 计数与耗时]");

console.log("\n=== E. 装备判定缓存（checkopt 8.5）：get.owner 事件级缓存 ===");
// 场景：装备牌 selectTarget=-1，filterCard 需对全场角色跑 hasPlayer2(filterTarget)，
// 每角色 canEquip → get.owner 全量 DOM 父节点扫描（本体 get/index.js owner）。
// 优化：决策事件内按 (事件, 卡) 缓存 get.owner，命中即 O(1)。
// headless 的 DOM 节点桩比真实 DOM 便宜 2-3 个数量级，扫描成本的绝对差异无法量化，
// 本节只验证：1) 缓存命中开销量级 2) 状态指纹失效正确性（牌移动/removing 变化重算）。
lib.config.extension_自用ai_checkopt = true;
const rawOwner = backup(get, "owner", "checkopt");
const fakeNodes = () => ({
	handcards1: {},
	handcards2: {},
	equips: {},
	judges: {},
	expansions: {},
});
const fakePlayers = [];
for (let i = 0; i < 8; i++) {
	fakePlayers.push({ node: fakeNodes(), judging: [null] });
}
game.players = fakePlayers;
game.dead = [];
let ownerRemoving = false;
const ownerCard = {
	cardid: 9001,
	parentNode: fakePlayers[0].node.handcards1,
	classList: {
		contains: (cls) => (cls === "removing" ? ownerRemoving : false),
	},
	classListContains: (cls) => (cls === "removing" ? ownerRemoving : false),
};
const ownerEvt = {};
_status.event = ownerEvt;
const assert = (cond, msg) => {
	if (!cond) {
		console.error("  [FAIL]", msg);
		process.exit(1);
	}
	console.log("  [ok]", msg);
};

// 缓存命中：同事件内重复调用返回同一 owner
const firstOwner = get.owner(ownerCard, "judge");
assert(firstOwner === fakePlayers[0], "同事件内缓存命中返回同一 owner");
assert(get.owner(ownerCard, "judge") === fakePlayers[0], "重复判定复用缓存结果");
// 冷启动一次 + 命中开销测量
const NOwner = 50000;
_status.event = {};
const tOwnerHit = bench("优化 单次缓存命中开销", NOwner, () => {
	for (let i = 0; i < NOwner; i++) get.owner(ownerCard, "judge");
});
// 牌移动（parentNode 变化）→ 指纹失效重算
ownerCard.parentNode = fakePlayers[1].node.equips;
assert(get.owner(ownerCard, "judge") === fakePlayers[1], "parentNode 变更后失效重算");
// removing 状态变化 → 指纹失效重算（原版手牌含 removing 时返回 undefined）
ownerCard.parentNode = fakePlayers[0].node.handcards1;
ownerRemoving = true;
assert(get.owner(ownerCard, "judge") === undefined, "removing 状态变化后失效重算");
// 事件切换 → 缓存自动重置
ownerRemoving = false;
_status.event = {};
assert(get.owner(ownerCard, "judge") === fakePlayers[0], "事件切换后重新计算");
console.log(`  [真实对局中 owner 扫描为 O(场上人数)且每判定重复，命中即省去整次扫描；`);
console.log(`   本次 headless 命中开销 ${(tOwnerHit / NOwner * 1000).toFixed(2)}µs/次]`);

console.log("\n=== F. 装备判定缓存：canEquip 决策期复用 ===");
// 同事件内对同一候选装备重复 canEquip（filterCard 每轮过滤 + AI 装备评估都触发），
// 优化版按 (事件, 玩家, 候选牌, replace) 缓存。headless 提供槽位桩，验证：
// 1) 同事件内重复调用复用 2) 装备数量（槽位指纹）变化后失效重算 3) 事件切换重算。
lib.configOL = lib.configOL || {};
lib.card["zhuge"] = lib.card["zhuge"] || {};
lib.card["zhuge"].subtype = "equip1";
lib.card["zhuge"].ai = lib.card["zhuge"].ai || {};
lib.card["zhuge"].ai.basic = { equipValue: 5 };
const rawCanEquip = backup(lib.element.Player.prototype, "canEquip", "checkopt");
const patchedCanEquip = lib.element.Player.prototype.canEquip;
const equipPlayer = {
	expandedSlots: {},
	disabledSlots: {},
	vcardsMap: { equips: [] },
	getVCards: function () { return this.vcardsMap.equips; },
	getVEquips: function () { return []; },
	countEquipableSlot: function () { return this.vcardsMap.equips.length >= 1 ? 0 : 1; },
	countEnabledSlot: function () { return 1; },
	getEquip: function () { return null; },
	countUsed: function () { return 0; },
	getCardUsable: function () { return 1; },
	countCards: function () { return 0; },
};
const equipEvt = {};
_status.event = equipEvt;
assert(rawCanEquip.call(equipPlayer, "zhuge", true) === true, "原版 canEquip 基准返回 true");
assert(patchedCanEquip.call(equipPlayer, "zhuge", true) === true, "缓存首算返回 true");
assert(patchedCanEquip.call(equipPlayer, "zhuge", true) === true, "同事件内重复判定复用缓存");
// 装备数量变化（槽位指纹）→ 失效重算
equipPlayer.vcardsMap.equips = [{ name: "zhuge", cards: [{ cardid: 1 }] }];
assert(patchedCanEquip.call(equipPlayer, "zhuge", true) === false, "装备数量变化后失效重算");
// 事件切换 → 缓存重置
_status.event = {};
assert(patchedCanEquip.call(equipPlayer, "zhuge", true) === false, "事件切换后重新计算");
const MEquip = 50000;
_status.event = {};
const tCanEquipHit = bench("优化 单次缓存命中开销", MEquip, () => {
	for (let i = 0; i < MEquip; i++) patchedCanEquip.call(equipPlayer, "zhuge", true);
});
console.log(`  [真实原版 canEquip 含 get.subtypes + countEquipableSlot + canBeGained 计算，`);
console.log(`   同事件内重复调用命中即省去整段重算；本次命中开销 ${(tCanEquipHit / MEquip * 1000).toFixed(2)}µs/次]`);

console.log("\n=== 总结 ===");
console.log("注：P2 决策期 memo 命中可省去整个 get.order/useful 的 getSkills 展开+遍历，");
console.log("其单次重算成本远高于函数键序列化，实际加速为 A/B 量级之上叠加。");
console.log("headless 无法构造完整玩家技能树，P2 以 A（键生成）为代理测得量级。");

process.exit(0);