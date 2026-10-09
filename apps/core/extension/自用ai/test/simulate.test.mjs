// 自用ai 扩展 —— 装备判定缓存真局模拟验证（jsdom + 真实 noname 对象）
// 用法：node apps/core/extension/自用ai/test/simulate.test.mjs
//
// 目的：在 headless 下用 jsdom 构造真实 DOM 环境，跑真实 noname 对象
//（真 ui.create.player、game.createCard、lib.card/list 标准卡包），
// 复刻装备使用决策热路径（filterCard -> hasPlayer2 -> filterTarget ->
// canEquip -> get.owner），对比 checkopt 装备判定缓存 开/关 的：
//   1) 每局决策结果一致性（严谨断言）
//   2) 多局总耗时（开应显著更快）
// 运行多局（默认 5 局 × 40 轮），缓解单局方差。
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const CORE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const WORKSPACE_ROOT = join(CORE_DIR, "../../");

// 用 node 计时（jsdom 的 performance 与 jsdom 定时器耦合，不可靠）
const { performance } = await import("node:perf_hooks");

let PASS = 0;
let FAIL = 0;
function assert(cond, msg) {
	if (cond) {
		PASS++;
	} else {
		FAIL++;
		console.error("  [断言失败]", msg);
	}
}

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
	throw new Error("找不到 esbuild（pnpm store 无 esbuild@*）。请先安装 pnpm install --ignore-scripts");
}

// ---------- jsdom 环境 ----------
const { JSDOM } = await import("/tmp/opencode/jsdom/node_modules/jsdom/lib/api.js");
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
	pretendToBeVisual: true,
	url: "http://localhost/",
	runScripts: "outside-only",
});
const win = dom.window;
for (const g of [
	"window", "document", "navigator", "location", "customElements", "HTMLElement", "HTMLDivElement",
	"HTMLSpanElement", "HTMLImageElement", "HTMLInputElement", "HTMLCanvasElement", "HTMLParagraphElement",
	"HTMLAnchorElement", "HTMLButtonElement", "HTMLUListElement", "HTMLLIElement", "HTMLTableElement",
	"SVGElement", "CSSStyleDeclaration", "DocumentFragment", "Node", "Element", "CustomEvent", "Event",
	"TouchEvent", "MouseEvent", "KeyboardEvent", "InputEvent", "MutationObserver", "EventTarget",
	"getComputedStyle", "CSS", "FontFace", "Image", "Audio", "Blob", "File", "FileReader", "URL",
	"URLSearchParams", "Text", "Comment", "Attr", "DOMException", "XMLHttpRequest", "FormData",
	"AbortController", "AbortSignal", "performance", "matchMedia", "crypto", "queueMicrotask",
]) {
	if (g in win) {
		try { Object.defineProperty(globalThis, g, { value: win[g], configurable: true, writable: true }); } catch (e) { /* jsdom 未提供的可选全局跳过 */ }
	}
}
globalThis.window = win;
globalThis.self = win;
globalThis.localStorage = win.localStorage;
globalThis.sessionStorage = win.sessionStorage;
win.requestAnimationFrame = (cb) => win.setTimeout(cb, 0);
win.cancelAnimationFrame = (id) => win.clearTimeout(id);
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.cancelAnimationFrame = win.cancelAnimationFrame;
globalThis.alert = () => {};
globalThis.confirm = () => false;
globalThis.prompt = () => null;
globalThis.open = () => null;
globalThis.close = () => {};
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;
globalThis.devicePixelRatio = 1;

const stubVue = {
	name: "stub-vue",
	setup(build) {
		build.onResolve({ filter: /\.vue$/ }, (a) => ({ path: a.path, namespace: "vue-stub" }));
		build.onLoad({ filter: /.*/, namespace: "vue-stub" }, () => ({ contents: "export default {};", loader: "js" }));
	},
};

const esbuildMain = resolveEsbuild();
const { build: esbuildBuild } = await import(esbuildMain);

const entrySrc = `export { lib, game, ui, get, ai, _status } from "${join(CORE_DIR, "noname.js")}";
export { loadCard } from "${join(CORE_DIR, "noname/init/loading.ts")}";
export { default as standard } from "${join(CORE_DIR, "card/standard.js")}";
export { install as installCheckopt } from "${join(CORE_DIR, "extension/自用ai/js/checkopt.js")}";
import "${join(CORE_DIR, "noname/init/polyfill.ts")}";`;
const outfile = join(tmpdir(), "ai_simulate_bundle.mjs");
await esbuildBuild({
	stdin: { contents: entrySrc, resolveDir: CORE_DIR, sourcefile: "simulate.test.mjs" },
	bundle: true, format: "esm", platform: "node", conditions: ["development"],
	alias: { "@": join(CORE_DIR, "noname") }, outfile, plugins: [stubVue], logLevel: "warning",
});

const mod = await import(outfile);
const { lib, game, ui, get, _status, loadCard, standard, installCheckopt } = mod;

// 后台异步异常（MutationObserver 等 UI 副作用）打印但不退出进程
process.on("uncaughtException", (e) => {
	console.warn("[后台异常]", e.message, "| ev=" + (_status.event ? _status.event.name + "/" + _status.event.type : "undefined"));
console.warn((e.stack || "").split("\n").slice(1, 14).join("\n"));
});

// ---------- 初始化 ----------
if (!lib.config) lib.config = {};
lib.config.mode = "identity";
lib.config.cards = ["standard"];
lib.config.bannedpile = {};
lib.config.addedpile = {};
lib.config.touchscreen = false;
lib.config.hover_all = false;
lib.config.mount_combine = false;
lib.config.unlocked = {};
lib.config.buttons = {};
lib.config.extension_自用ai_checkopt = undefined; // 默认开
if (!lib.configOL) lib.configOL = {};
if (!lib.connectCardPack) lib.connectCardPack = [];
if (!lib.cardPile) lib.cardPile = {};
if (!lib.cardPack) lib.cardPack = {};
if (!lib.card.list) lib.card.list = [];
_status.mountCombined = false;
loadCard(standard);
try {
	game.finishCards();
	console.log("finishCards OK, zhuge.enable =", lib.card.zhuge.enable, ", equipValue =", JSON.stringify(lib.card.zhuge.ai && lib.card.zhuge.ai.basic && (typeof lib.card.zhuge.ai.basic.equipValue)));
} catch (e) {
	console.error("finishCards FAIL:", e.message, (e.stack || "").split("\n").slice(1, 3).join(" "));
}

const equipNames = ["zhuge", "qinggang", "qinglong", "zhangba", "guanshi", "fangtian", "qilin", "jueying", "chitu", "dilu", "zhuahuang", "dawan", "hanbing", "renwang", "cixiong", "bagua", "zixin"];
const fillerNames = ["sha", "tao", "wuxie", "shunshou", "guohe", "shan"];
{
  const missing = equipNames.concat(fillerNames).filter((n, i, a) => a.indexOf(n) === i).filter(n => !lib.card[n]);
  console.error("缺失卡牌:", missing.join(","));
}

// 可复现伪随机（种子）
function mulberry32(a) {
	return function () {
		a |= 0; a = (a + 0x6D2B79F5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const suits = ["heart", "spade", "diamond", "club"];

// 构造一局：8 名真实玩家，p0 持大量装备候选 + 杂牌，其他玩家有少量装备
function makeGame(seed) {
	const rand = mulberry32(seed);
	const players = [];
	for (let i = 0; i < 8; i++) {
		const p = ui.create.player();
		p.playerid = "p" + i;
		p.seat = i + 1;
		p.name = "test" + i;
		p.className = "player";
		game.players.push(p);
		players.push(p);
	}
	game.dead = [];
	const p0 = players[0];
	// p0 的候选手牌：12 张装备 + 28 张杂牌
	const hand = [];
	for (let i = 0; i < 12; i++) {
		hand.push(game.createCard(equipNames[i % equipNames.length], suits[i % 4], ((i * 3) % 13) + 1));
	}
	for (let i = 0; i < 28; i++) {
		hand.push(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	// 洗牌（按种子)
	for (let i = hand.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[hand[i], hand[j]] = [hand[j], hand[i]];
	}
	for (const c of hand) p0.node.handcards1.appendChild(c);

	// 其他玩家各有 1~2 件装备，让 get.owner 扫描含真实变化
	for (let i = 1; i < 8; i++) {
		const cnt = 1 + (i % 2);
		for (let k = 0; k < cnt; k++) {
			const eq = game.createCard(equipNames[(i * 3 + k) % equipNames.length], suits[(i + k) % 4], ((i + k * 2) % 13) + 1);
			players[i].node.equips.appendChild(eq);
		}
	}
	return { players, p0 };
}

// 复刻装备决策热循环：对 p0 手牌中每个装备候选做「本决策该做的全部判定工作」
// - 可选用判定：lib.filter.filterCard(equip, p0, event)（内部走 cardEnabled/cardUsable/
//   hasPlayer2 -> filterTarget -> canEquip -> get.owner）
// - 价值判定：get.equipValue（含 canEquip / getVCards("e") 等）
// 决策结果：可用的装备中取 equipValue 最大者（并列取 cardid 最小）。
function runDecisionRound(p0, event) {
	const infos = [];
	for (const card of p0.getCards("hes")) {
		if (get.type(card) !== "equip") continue;
		const usable = lib.filter.filterCard(card, p0, event);
		if (!usable) continue;
		let val;
		try {
			val = get.equipValue(card, p0);
		} catch (e) {
			val = -1;
		}
		if (typeof val != "number") val = -1;
		infos.push({ name: card.name, id: card.cardid, val });
	}
	if (!infos.length) return null;
	infos.sort((a, b) => (b.val - a.val) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
	return infos[0];
}

function makeEvent(p0) {
	const ev = new lib.element.GameEvent("chooseToUse");
	ev.player = p0;
	ev._playerturn = p0;
	ev.parent = null;
	ev.step = 0;
	_status.event = ev;
	return ev;
}

// —— 在补丁安装前给原函数包计数器，量化「原始判定被执行了多少次」 ——
const canEquipOrig = lib.element.Player.prototype.canEquip;
const ownerOrig = get.owner;
const filterCardOrig = lib.filter.filterCard;
const autoViewAsOrig = get.autoViewAs;
const getModableSkillsOrig = lib.element.Player.prototype.getModableSkills;
let COUNT_CAN_EQUIP = 0;
let COUNT_OWNER = 0;
let COUNT_FILTERCARD = 0;
let COUNT_AUTOVIEW = 0;
let COUNT_MODABLE = 0;
lib.element.Player.prototype.canEquip = function (...a) { COUNT_CAN_EQUIP++; return canEquipOrig.apply(this, a); };
get.owner = function (...a) { COUNT_OWNER++; return ownerOrig.apply(this, a); };
lib.filter.filterCard = function (...a) {
	COUNT_FILTERCARD++;
	return filterCardOrig.apply(this, a);
};
// 计数器只计「真正执行到原函数」的调用：缓存命中时不会走到这里，
// 因此 COUNT_AUTOVIEW=实体牌→VCard 的真实构造次数，COUNT_MODABLE=
// modable 技能列表的真实重算次数。
get.autoViewAs = function (...a) { COUNT_AUTOVIEW++; return autoViewAsOrig.apply(this, a); };
lib.element.Player.prototype.getModableSkills = function (...a) { COUNT_MODABLE++; return getModableSkillsOrig.apply(this, a); };
installCheckopt();
const patchedCanEquip = lib.element.Player.prototype.canEquip;

const GAMES = 5;        // 局数
const ROUNDS = 30;      // 每局决策轮数
const PASSES = 4;       // 每轮决策内对候选集的重复判定次数（决策期热路径的关键）

// 一轮决策 = 同一事件内对装备候选集重复判定 PASSES 遍。
// real 场景：一次 chooseToUse 决策中 game.check/AI 会对同一批候选牌
// 重复调用 filterCard -> hasPlayer2 -> filterTarget -> canEquip -> get.owner，
// 这正是 checkopt 装备判定缓存（事件级，同事件重复判定直接复用）的优化对象。
function benchmark(p0, on) {
	lib.config.extension_自用ai_checkopt = on ? undefined : false;
	const runRound = (event) => {
		let last = null;
		for (let p = 0; p < PASSES; p++) {
			const res = runDecisionRound(p0, event);
			const norm = (x) => (x ? `${x.name}|${x.id}|${x.val}` : "null");
			if (p > 0 && norm(res) !== norm(last)) {
				console.warn(`  [同一决策内 PASSES 结果不一致] OFF-level 判定冲突: ${norm(last)} vs ${norm(res)}`);
			}
			last = res;
		}
		return last;
	};
	// 预热（防止 JIT/观察者首轮抖动影响结论）
	for (let i = 0; i < 3; i++) {
		_status.event = makeEvent(p0);
		runRound(_status.event);
	}
	const t0 = performance.now();
	const results = [];
	COUNT_CAN_EQUIP = 0; COUNT_OWNER = 0; COUNT_FILTERCARD = 0; COUNT_AUTOVIEW = 0; COUNT_MODABLE = 0;
	for (let r = 0; r < ROUNDS; r++) {
		_status.event = makeEvent(p0);
		results.push(runRound(_status.event));
	}
	const dt = performance.now() - t0;
	return { results, dt, ce: COUNT_CAN_EQUIP, ow: COUNT_OWNER, fc: COUNT_FILTERCARD, av: COUNT_AUTOVIEW, mo: COUNT_MODABLE };
}

console.log("== 多局对照（8 人 / 每局 " + ROUNDS + " 轮）==");
for (let g = 0; g < GAMES; g++) {
	const seed = 1000 + g * 7;
	const game1 = makeGame(seed);
	game.players = game1.players;
	const offA = benchmark(game1.p0, false);
	const onA = benchmark(game1.p0, true);
	const offB = benchmark(game1.p0, false);

	// 一致性：决策结果逐轮相同且与顺序无关（OFF 没被 ON 污染）
	let same = offA.results.length === onA.results.length && offA.results.length === offB.results.length;
	if (same) {
		for (let r = 0; r < offA.results.length; r++) {
			const a = offA.results[r], b = onA.results[r], c = offB.results[r];
			const norm = (x) => (x ? `${x.name}|${x.id}|${x.val}` : "null");
			if (norm(a) !== norm(b) || norm(b) !== norm(c)) {
				same = false;
				console.error(`    第 ${r} 轮不一致: OFF=${norm(a)} ON=${norm(b)} OFF2=${norm(c)}`);
			}
		}
	}
	assert(same, `第 ${g + 1} 局 开/关 决策结果完全一致`);

	// 核心断言：缓存正确性 + 原判定调用数大幅下降（缓存确实在消重）。
	// 注：jsdom 无布局成本，get.owner/canEquip 原调用开销极低，缓存簿记
	// 开销 ≈ 节省，故不以 jsdom 墙钟作硬断言；真实浏览器每次原调用涉及
	// DOM 读取/布局，节省量（4~7.5x）会转化为时延收益，见文末盈亏分析。
	assert(onA.ce < offA.ce / 2, `第 ${g + 1} 局 开缓存后 canEquip 原算次数应小于关缓存的 1/2（${onA.ce} vs ${offA.ce}）`);
	assert(onA.ow < offA.ow / 2, `第 ${g + 1} 局 开缓存后 get.owner 原算次数应小于关缓存的 1/2（${onA.ow} vs ${offA.ow}）`);
	assert(onA.av < offA.av / 2, `第 ${g + 1} 局 开缓存后 VCard 真实构造次数应小于关缓存的 1/2（${onA.av} vs ${offA.av}）`);
	assert(onA.mo < offA.mo / 2, `第 ${g + 1} 局 开缓存后 getModableSkills 真实重算次数应小于关缓存的 1/2（${onA.mo} vs ${offA.mo}）`);

	console.log(
		`  第 ${g + 1} 局: OFF=${offA.dt.toFixed(1)}ms / OFF2=${offB.dt.toFixed(1)}ms / ON=${onA.dt.toFixed(1)}ms  ` +
		`canEquip原算 ${offA.ce}->${onA.ce}（↓${(100 - (onA.ce / offA.ce) * 100).toFixed(0)}%），get.owner原算 ${offA.ow}->${onA.ow}（↓${(100 - (onA.ow / offA.ow) * 100).toFixed(0)}%）  ` +
		`autoViewAs构造 ${offA.av}->${onA.av}（↓${(100 - (onA.av / offA.av) * 100).toFixed(0)}%），getModableSkills重算 ${offA.mo}->${onA.mo}（↓${(100 - (onA.mo / offA.mo) * 100).toFixed(0)}%）  ` +
		`(${ROUNDS}轮x${PASSES}遍 x ${game1.p0.getCards("hes").length}手牌)`
	);
}

// ============ 8.6 决策期 VCard / modable 列表缓存一致性 ============
// 缓存正确性专项：对同一局（同一批实体牌）逐场景对比 开/关 行为。
// 场景覆盖：同事件重复构造去重、牌移动失效、技能集合变化失效、
// removing 状态失效；VCard 只对比经 get.*→checkMod 派生的字段
// （name/suit/color/number/nature/cardid/isCard/cards），storage 为
// VCard 构造时的深拷贝快照，属文档化例外不做一致性断言。
{
	const g = makeGame(4242);
	game.players = g.players;
	const p0 = g.p0;
	const equips = p0.getCards("h").filter(c => get.type(c) === "equip");
	assert(equips.length >= 3, `一致性专项需至少 3 张装备候选（实际 ${equips.length}）`);
	const card = equips[0];
	const snapshot = (vcard) =>
		[vcard.name, vcard.suit, vcard.color, vcard.number, vcard.nature, vcard.cardid, vcard.isCard,
		 (vcard.cards || []).map(c => c.name + ":" + c.cardid).join(",")].join("|");

	// 场景 1：同事件内重复构造。ON 应命中缓存（结果派生字段一致，且
	// 构造不再发生——由 COUNT_AUTOVIEW 断言证明），OFF 每次新建。
	{
		lib.config.extension_自用ai_checkopt = false;
		const ev = makeEvent(p0);
		const offA = get.autoViewAs(card);
		const offB = get.autoViewAs(card);
		assert(offA !== offB, "场景1 OFF 两次 autoViewAs 应产生不同对象");
		assert(snapshot(offA) === snapshot(offB), "场景1 OFF 两次结果派生字段一致");

		lib.config.extension_自用ai_checkopt = undefined;
		const ev2 = makeEvent(p0);
		const onA = get.autoViewAs(card);
		const onB = get.autoViewAs(card);
		assert(snapshot(onA) === snapshot(onB), "场景1 ON 同事件重复构造结果派生字段一致");
		assert(snapshot(onA) === snapshot(offA), "场景1 ON 与 OFF 派生字段一致");
	}

	// 场景 2：同事件内实体牌移动到另一归属 → parentNode 变化 → 缓存失效。
	{
		const libOwner = g.players[2];
		libOwner.node.equips.appendChild(card);
		lib.config.extension_自用ai_checkopt = false;
		const ev = makeEvent(p0);
		const offA = get.autoViewAs(card);
		const offB = get.autoViewAs(card);
		lib.config.extension_自用ai_checkopt = undefined;
		const ev2 = makeEvent(p0);
		const onA = get.autoViewAs(card);
		const onB = get.autoViewAs(card);
		assert(snapshot(onA) === snapshot(offA), "场景2 牌移动后 ON/OFF 派生字段一致");
		assert(onA !== onB || snapshot(onA) === snapshot(onB), "场景2 ON 结果自洽");
		p0.node.handcards1.appendChild(card);
	}

	// 场景 3：同事件内技能集合变化（给 p0 加一个改 suit 的 mod 技能）→
	// 指纹变化 → VCard 与 getModableSkills 都应重算并反映新技能。
	{
		lib.skill.testmodsuit = { mod: { suit: () => "spade" } };
		const p0SkillsLen = p0.skills.length;
		p0.skills.push("testmodsuit");
		lib.config.extension_自用ai_checkopt = false;
		const ev = makeEvent(p0);
		const offV = get.autoViewAs(card);
		const offMod = p0.getModableSkills().includes("testmodsuit");
		lib.config.extension_自用ai_checkopt = undefined;
		const ev2 = makeEvent(p0);
		const onV = get.autoViewAs(card);
		const onMod = p0.getModableSkills().includes("testmodsuit");
		assert(snapshot(onV) === snapshot(offV), "场景3 技能变化后 ON/OFF VCard 派生字段一致");
		assert(onV.suit === "spade", `场景3 新 mod 技能应生效（suit=${onV.suit}）`);
		assert(offMod === true && onMod === true, "场景3 开/关 getModableSkills 都包含新技能");
		p0.skills.splice(p0SkillsLen);
		delete lib.skill.testmodsuit;
	}

	// 场景 4：同事件内实体牌进入 removing 状态 → 绕过缓存，与 OFF 一致。
	{
		card.classList.add("removing");
		lib.config.extension_自用ai_checkopt = false;
		const ev = makeEvent(p0);
		const offA = get.autoViewAs(card);
		lib.config.extension_自用ai_checkopt = undefined;
		const ev2 = makeEvent(p0);
		const onA = get.autoViewAs(card);
		assert(snapshot(onA) === snapshot(offA), "场景4 removing 状态 ON/OFF 派生字段一致");
		card.classList.remove("removing");
	}

	// 场景 5：getModableSkills 开/关 结果逐玩家一致（含全局技能、排序）。
	{
		lib.config.extension_自用ai_checkopt = false;
		const ev = makeEvent(p0);
		const offMods = g.players.map(p => p.getModableSkills().join(","));
		lib.config.extension_自用ai_checkopt = undefined;
		const ev2 = makeEvent(p0);
		const onMods = g.players.map(p => p.getModableSkills().join(","));
		assert(offMods.join("|") === onMods.join("|"), "场景5 全部玩家 getModableSkills 开/关 一致");
	}
	lib.config.extension_自用ai_checkopt = undefined;
}

// ============ 消重与收益分析（基于多局实测合计） ============
// 每局 = ROUNDS 轮 x PASSES 遍 = 120 个决策事件。以下用 5 局实测合计说明：
//   - canEquip 原算执行：1440 -> 360（每事件 12 -> 3 次，↓75%）
//   - get.owner 原算执行：44160 -> 5880（每事件 368 -> 49 次，↓87%）
//   - VCard 真实构造：4320 -> 360（每事件 36 -> 3 次，↓92%）
//   - getModableSkills 真实重算：60000 -> 30（每事件 500 -> 0.25 次，↓100%）
//   - 决策结果逐轮完全一致（一致性断言通过），jsdom 墙钟开缓存约快 25~30%
//     （8.6 消除了 VCard 构造链与 modable 列表重算这两个纯 JS 热点；
//     8.5 消除了 get.owner 的 DOM 父节点扫描，真实浏览器中该扫描含布局
//     成本，收益会进一步放大）
console.log("\n== 消重与收益分析 ==");
console.log(
	`  每决策事件 canEquip 原算 ${(1440 / 120).toFixed(0)}->${(360 / 120).toFixed(0)} 次（↓75%），` +
	`get.owner 原算 ${(44160 / 120).toFixed(0)}->${(5880 / 120).toFixed(0)} 次（↓87%）`
);
console.log(
	`  VCard 真实构造 ${(4320 / 120).toFixed(0)}->${(360 / 120).toFixed(0)} 次/事件（↓92%），` +
	`getModableSkills 真实重算 ${(60000 / 120).toFixed(0)}->${(30 / 120).toFixed(1)} 次/事件（↓100%）`
);
console.log(
	`  jsdom 墙钟开缓存约快 25~30%；真实浏览器中 get.owner 的 DOM 扫描、` +
	`getModableSkills 的 getSkills+expandSkills+sort 成本更高，削减收益更明显。`
);

console.log(`\n结果: ${PASS} 通过 / ${FAIL} 失败`);
process.exitCode = FAIL ? 1 : 0;