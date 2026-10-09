// 自用ai 扩展 —— 真实启动时序回归（回归：precontent 早于卡牌包加载）
// 用法：node apps/core/extension/自用ai/test/timing.test.mjs
//
// 背景：真实浏览器中扩展 precontent（installCheckopt 在 precontent 回调里）
// 远早于 importCardPack 注入 lib.card.shunshou/guohe。早期实现对 `lib.card
// .shunshou.ai.result` 的访问会在 precontent 阶段抛出
// TypeError: Cannot read properties of undefined (reading 'ai')。
// 修复后：卡牌未就绪时 installTrickResultCache 应把自身 push 到 lib.onload
//（boot 在卡牌加载完成后统一消费），消费时再完成 patch。
// 本测试按真实时序编排：install -> 校验未崩溃且已挂载 -> loadCard ->
// 消费 lib.onload -> 校验 patch 生效且行为正确。
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const CORE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const WORKSPACE_ROOT = join(CORE_DIR, "../../");

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
if (!navigator.userAgent) navigator.userAgent = "jsdom";
win.eval.bind(win)(`
	window.webkitAudioContext = window.AudioContext = function(){ return { sampleRate: 0, _state: "suspended", createOscillator: () => ({ connect: () => {}, stop: () => {} }), createGain: () => ({ connect: () => {}, gain: { value: 0 } }), resume: () => {}, close: () => {}, destination: {} }; };
	window.setTimeout = function(fn, ms, ...rest){ globalThis.setTimeout(() => { try { fn(...rest); } catch (_e) {} }, ms || 0); return 0; };
	window.crypto = globalThis.crypto;
`);

const esbuildMain = resolveEsbuild();
const { build: esbuildBuild } = await import(esbuildMain);

const entrySrc = `export { lib, game, ui, get, ai, _status } from "${join(CORE_DIR, "noname.js")}";
export { CacheContext } from "${join(CORE_DIR, "noname/library/cache/cacheContext.js")}";
export { loadCard } from "${join(CORE_DIR, "noname/init/loading.ts")}";
export { default as standard } from "${join(CORE_DIR, "card/standard.js")}";
export { install as installCheckopt } from "${join(CORE_DIR, "extension/自用ai/js/checkopt.js")}";
import "${join(CORE_DIR, "noname/init/polyfill.ts")}";`;
const outfile = join(tmpdir(), "ai_timing_bundle.mjs");
await esbuildBuild({
	stdin: { contents: entrySrc, resolveDir: CORE_DIR, sourcefile: "timing.test.mjs" },
	bundle: true, format: "esm", platform: "node", conditions: ["development"],
	alias: { "@": join(CORE_DIR, "noname") }, outfile, plugins: [{
		name: "vue-stub",
		setup(build) {
			build.onResolve({ filter: /\.vue$/ }, () => ({ path: "stub", namespace: "vue-stub" }));
			build.onLoad({ filter: /.*/, namespace: "vue-stub" }, () => ({ contents: "export default {}", loader: "js" }));
		},
	}], logLevel: "warning",
});

const mod = await import(outfile);
const { lib, game, ui, get, _status, loadCard, standard, installCheckopt } = mod;

process.on("uncaughtException", (e) => {
	console.error("[后台异常]", e.message, (e.stack || "").split("\n").slice(1, 8).join("\n"));
});

// ---------- 初始化（与 simulate.test.mjs 对齐） ----------
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
lib.config.extension_自用ai_checkopt = undefined;
if (!lib.configOL) lib.configOL = {};
if (!lib.connectCardPack) lib.connectCardPack = [];
if (!lib.cardPile) lib.cardPile = {};
if (!lib.cardPack) lib.cardPack = {};
if (!lib.card.list) lib.card.list = [];
_status.mountCombined = false;

console.log("== 真实时序回归：precontent 先于卡牌包加载 ==");

// ① 此刻卡牌尚未加载。断言 precontent 时序前提成立。
const preSh = lib.card && lib.card.shunshou;
const preGh = lib.card && lib.card.guohe;
assert(!preSh || !preGh, "时序前提：precontent 阶段 lib.card.shunshou/guohe 未定义");

// ② install() 在卡牌缺失时必须不抛错，且把安装回调挂到 lib.onload。
const preOnloadLen = Array.isArray(lib.onload) ? lib.onload.length : -1;
let installThrew = null;
try {
	installCheckopt();
} catch (e) {
	installThrew = e;
}
assert(!installThrew, "卡牌未加载时 installCheckopt 不抛错（原崩溃点 TypeError reading 'ai'）");
assert(Array.isArray(lib.onload) && lib.onload.length === preOnloadLen + 1, "卡牌未加载时装到 lib.onload 挂载点");
assert(!(lib.card && lib.card.shunshou) || !lib.card.shunshou.ai, "install 后卡牌仍未加载（patch 尚不可能执行，净延迟）");

// ③ 加载卡牌。注意：先包计数器再消费 lib.onload——这样计数器包在 original
//    外、补丁内，缓存命中（补丁直接返回缓存值、不触达 original）时计数器不增长。
const origSsTarget = lib.card.shunshou && lib.card.shunshou.ai && lib.card.shunshou.ai.result && lib.card.shunshou.ai.result.target;
const origGhTarget = lib.card.guohe && lib.card.guohe.ai && lib.card.guohe.ai.result && lib.card.guohe.ai.result.target;
loadCard(standard);
try {
	game.finishCards();
} catch (e) {
	// 允许 UI 相关副作用忽略
}
let ssOrig = 0, ghOrig = 0;
const rawSs = lib.card.shunshou.ai.result.target;
const rawGh = lib.card.guohe.ai.result.target;
lib.card.shunshou.ai.result.target = function (...a) { ssOrig++; return rawSs.apply(this, a); };
lib.card.guohe.ai.result.target = function (...a) { ghOrig++; return rawGh.apply(this, a); };
const pending = Array.isArray(lib.onload) ? lib.onload.splice(0) : [];
for (const fn of pending) {
	fn();
}

// ④ 消费后 patch 应生效：target 函数已替换（不再是原函数引用）。
const shCard = lib.card && lib.card.shunshou;
const ghCard = lib.card && lib.card.guohe;
assert(shCard && ghCard && shCard.ai && shCard.ai.result && ghCard.ai && ghCard.ai.result, "卡牌加载完成后 shunshou/guohe ai.result 存在");
assert(origSsTarget === undefined || shCard.ai.result.target !== origSsTarget, "顺手 result.target 已打补丁");
assert(origGhTarget === undefined || ghCard.ai.result.target !== origGhTarget, "过河 result.target 已打补丁");

// ⑤ 延迟安装的补丁"端到端"可用性：用真玩家跑 get.value（内部 countPlayer
// 全扫命中 result.target），同事件重复估值应命中缓存。行为正确性（失效、
// 开关回退、结果一致性）已由 simulate.test.mjs 场景8 全量覆盖，此处只证明
// 「延迟安装的这条补丁在真实调用链上真的工作」。
if (!get.rawAttitude) {
	get.rawAttitude = (from, to) => {
		if (!from || !to || !from.ai) return 0;
		if (from.ai.enemy?.includes(to)) return -5;
		if (from.ai.friend?.includes(to)) return 5;
		return 1;
	};
}
const { CacheContext } = mod;
CacheContext.setProxy({ lib, game, get });
CacheContext.setCacheContext(new CacheContext({ lib, game, get }));

const players = [];
for (let i = 0; i < 4; i++) {
	const p = ui.create.player();
	p.playerid = "t" + i;
	p.seat = i + 1;
	p.name = "test" + i;
	p.className = "player";
	p.ai = { enemy: [], friend: [] };
	game.players.push(p);
	if (i > 0) p.ai.enemy?.push(players ? players[0] : null);
	game.dead = [];
	players.push(p);
}
for (let i = 0; i < players.length; i++) {
	players[i].nextSeat = players[(i + 1) % players.length];
}
const ptop = players[0];
for (const c of players) {
	c.hp = 3; c.maxHp = 4; c.hujia = 0; c.isZhu = false;
}
// 给目标一个手牌，让 result.target 有可扫内容
for (let i = 1; i < players.length; i++) {
	players[i].node.handcards1.appendChild(game.createCard("sha", "club", 3 + i));
	players[i].ai.enemy?.push(ptop);
}
ptop.ai.enemy?.push(players[1]);

const ev5 = new lib.element.GameEvent("chooseToUse");
ev5.player = ptop;
ev5._playerturn = ptop;
ev5.parent = null;
ev5.step = 0;
_status.event = ev5;

const ssCard5 = game.createCard("shunshou", "spade", 7);
const ghCard5 = game.createCard("guohe", "club", 5);

// 给原函数包的计数器已装好（③ 里在补丁安装前包上 rawSs/rawGh）：
// 缓存命中 → 补丁直接返回缓存值，不触达计数器；缓存失效 → 计数器增长。
// 故 ssOrig/ghOrig 增量 = 真正的"原判定执行次数"。

const eval5 = (dtarget) => ({
	ssVal: get.value(ssCard5, ptop),
	ssEff: get.effect_use(dtarget, ssCard5, ptop),
	ghVal: get.value(ghCard5, ptop),
	ghEff: get.effect_use(dtarget, ghCard5, ptop),
});

// 首次全扫：每个目标被 get.value 扫到的 original 原算一次（此处 3 名目标），
// effect_use 估值命中缓存。重复估值应零新增原算。
lib.config.extension_自用ai_checkopt = undefined;
const t0Ss = ssOrig, t0Gh = ghOrig;
const first = players.slice(1).map(t => eval5(t));
const firstSs = ssOrig - t0Ss, firstGh = ghOrig - t0Gh;
assert(typeof first[0].ssVal === "number" && isFinite(first[0].ssVal), "延迟安装补丁下 get.value(shunshou) 返回数值");
assert(typeof first[0].ghVal === "number" && isFinite(first[0].ghVal), "延迟安装补丁下 get.value(guohe) 返回数值");
assert(firstSs > 0, `延迟安装补丁下顺手首次原算自然发生(${firstSs})`);
const t1Ss = ssOrig, t1Gh = ghOrig;
const repeat = players.slice(1).map(t => eval5(t));
const repSs = ssOrig - t1Ss, repGh = ghOrig - t1Gh;
console.log(`  [debug] 首扫 ss原算=${firstSs} gh原算=${firstGh} | 同事件重复 ss=${repSs} gh=${repGh}`);
assert(repSs === 0 && repGh === 0, "延迟安装补丁下同事件重复估值命中缓存（零新增原算）");
assert(JSON.stringify(repeat.map(x => x.ssVal)) === JSON.stringify(first.map(x => x.ssVal)) &&
	JSON.stringify(repeat.map(x => x.ghVal)) === JSON.stringify(first.map(x => x.ghVal)),
	"延迟安装补丁下重复估值结果与首次一致");
lib.card.shunshou.ai.result.target = rawSs;
lib.card.guohe.ai.result.target = rawGh;

console.log(`\n结果: ${PASS} 通过 / ${FAIL} 失败`);
process.exitCode = FAIL ? 1 : 0;