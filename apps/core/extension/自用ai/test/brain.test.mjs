// 自用ai 扩展 headless 测试
// 用法：node apps/core/extension/自用ai/test/brain.test.mjs
// 通过 esbuild 将 noname 全量源码 + 扩展 bundle 到内存，注入浏览器全局桩后
// 在 node 中加载，对扩展的开关语义、patch 安装、AI 行为层纯函数做断言。
// 退出码 0 = 全过，非 0 = 有失败。
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const CORE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const WORKSPACE_ROOT = join(CORE_DIR, "../../");

// ============================================================
// 1. esbuild 定位：pnpm store 下取最新 esbuild 版本
// ============================================================
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
	throw new Error(
		"找不到 esbuild（pnpm store 无 esbuild@*）。请先安装：pnpm install --ignore-scripts"
	);
}

// ============================================================
// 2. 浏览器全局桩：让 noname 源码在 node 下加载
// ============================================================
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

// ============================================================
// 3. bundle：noname + 扩展 + brain 纯函数导出
// ============================================================
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
export { scenarioUseful, killAdjust } from "${join(CORE_DIR, "extension/自用ai/js/brain.js")}";
export { FLAG } from "${join(CORE_DIR, "extension/自用ai/js/core.js")}";
`;
const outfile = join(tmpdir(), "ai_ext_bundle.mjs");
await esbuildBuild({
	stdin: { contents: entrySrc, resolveDir: CORE_DIR, sourcefile: "test_entry.mjs" },
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
const { lib, game, get, ui, _status, ext, scenarioUseful, killAdjust, FLAG } = mod;

// ============================================================
// 4. 断言
// ============================================================
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log("FAIL:", name); } };
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

console.log("===== 1. 加载与扩展协议 =====");
ok("lib/game/get/ui/_status 存在", lib && game && get && ui && _status);
const e = ext();
ok("扩展名", e.name === "自用ai");
ok("版本", e.package?.version === "2.0");
ok("四开关配置", Object.keys(e.config).length === 5);
ok("precontent 函数", typeof e.precontent === "function");

console.log("===== 2. FLAG 开关语义 =====");
if (!lib.config) lib.config = {};
delete lib.config.extension_自用ai_brain;
ok("undefined→开启", FLAG.brain() === true);
lib.config.extension_自用ai_brain = false;
ok("===false→关闭", FLAG.brain() === false);
lib.config.extension_自用ai_brain = true;
ok("true→开启", FLAG.brain() === true);
lib.config.extension_自用ai_onai = false;
ok("onai 独立关闭", FLAG.onai() === false);
delete lib.config.extension_自用ai_onai;
ok("onai undefined 开启", FLAG.onai() === true);
lib.config.extension_自用ai_aiprofile = true;
ok("profile ===true 开启", FLAG.profile() === true);
lib.config.extension_自用ai_aiprofile = false;
ok("profile ===false 关闭", FLAG.profile() === false);

console.log("===== 3. precontent 安装不崩 =====");
lib.config.extension_自用ai_brain = true;
const preErr = (() => { try { e.precontent(); return null; } catch (err) { return err; } })();
ok("precontent 无异常", preErr === null, preErr && preErr.message);

console.log("===== 4. killAdjust 纯函数 =====");
const origTag = get.tag, origAtt = get.attitude;
get.tag = (card, t) => (card && card.test_damage !== undefined ? card.test_damage : 0);
get.attitude = (view, target) => (target._test_att === undefined ? -1 : target._test_att);
const mkT = (hp, hujia = 0, att = -1) => ({
	hp, hujia, isIn: () => true,
	_test_att: att,
});
ok("非数字 final 原值", killAdjust({ name: "x" }, mkT(1), {}, null, false, "abc") === "abc");
ok("target 缺失原值", killAdjust({ name: "x" }, null, {}, null, false, 5) === 5);
ok("target 不在场原值", killAdjust({ name: "x" }, { hp: 1, isIn: () => false }, {}, null, false, 5) === 5);
ok("linking 跳过", killAdjust({ name: "x", test_damage: 3 }, mkT(1), {}, null, {}, 5) === 5);
ok("dmg=0 原值", killAdjust({ name: "x", test_damage: 0 }, mkT(1), {}, null, false, 5) === 5);
ok("无 damage 原值", killAdjust({ name: "x" }, mkT(1), {}, null, false, 5) === 5);
ok("view 为空原值", killAdjust({ name: "x", test_damage: 3 }, mkT(1), null, null, false, 5) === 5);
ok("view 等于 target", (() => { const t = mkT(3); return killAdjust({ name: "x", test_damage: 2 }, t, t, null, false, 5) === 5; })());
ok("友方跳过", killAdjust({ name: "x", test_damage: 3 }, mkT(1, 0, 0.5), {}, null, false, 5) === 5);
ok("态度中性跳过", killAdjust({ name: "x", test_damage: 3 }, mkT(1, 0, 0), {}, null, false, 5) === 5);
ok("斩杀+8", close(killAdjust({ name: "x", test_damage: 1 }, mkT(1), {}, null, false, 5), 13));
ok("斩杀(带护甲)+8", close(killAdjust({ name: "x", test_damage: 3 }, mkT(2, 1), {}, null, false, 5), 13));
ok("溢出惩罚5", close(killAdjust({ name: "x", test_damage: 3 }, mkT(1), {}, null, false, 5), 10));
ok("高溢出下限2", close(killAdjust({ name: "x", test_damage: 10 }, mkT(1), {}, null, false, 5), 7));
ok("非斩杀原值", killAdjust({ name: "x", test_damage: 1 }, mkT(2), {}, null, false, 5) === 5);
ok("负 final 斩杀", close(killAdjust({ name: "x", test_damage: 1 }, mkT(1), {}, null, false, -3), 5));
get.tag = origTag; get.attitude = origAtt;

console.log("===== 5. scenarioUseful 纯函数 =====");
const mkP = (hp, maxHp) => ({ hp, maxHp, getSkills: () => [], isDead: () => false, countCards: () => 0 });
const mkC = (name) => ({ name });
const origPlayers = game.players, origAtt2 = get.attitude;
get.attitude = (v, t) => -1;
ok("非三类牌原值", scenarioUseful(mkC("sha"), mkP(4, 4), 2) === 2);
ok("桃满血×0.4", close(scenarioUseful(mkC("tao"), mkP(4, 4), 5), 2));
ok("桃残血×1.4", close(scenarioUseful(mkC("tao"), mkP(1, 4), 5), 7));
ok("桃中间原值", scenarioUseful(mkC("tao"), mkP(2, 4), 5) === 5);
game.players = [mkP(4, 4), mkP(4, 4)];
ok("无懈2人×0.5", close(scenarioUseful(mkC("wuxie"), mkP(4, 4), 6), 3));
game.players = [mkP(4, 4), mkP(4, 4), mkP(4, 4)];
ok("无懈3人原值", scenarioUseful(mkC("wuxie"), mkP(4, 4), 6) === 6);
const enemyEmpty = { isDead: () => false, countCards: () => 0 };
const enemyHands = { isDead: () => false, countCards: () => 1 };
game.players = [mkP(4, 4), enemyEmpty];
ok("闪 敌无手牌×0.6", close(scenarioUseful(mkC("shan"), mkP(4, 4), 10), 6));
game.players = [mkP(4, 4), enemyHands];
ok("闪 敌有手牌原值", scenarioUseful(mkC("shan"), mkP(4, 4), 10) === 10);
game.players = [mkP(4, 4)];
get.attitude = (v, t) => 1;
ok("闪 无敌人原值", scenarioUseful(mkC("shan"), mkP(4, 4), 10) === 10);
game.players = origPlayers; get.attitude = origAtt2;

console.log("===== 6. patch 安装状态 =====");
ok("get.effect 被包装", !get.effect.toString().match(/^\s*effect\(target, card, player, player2, linking\)\s*\{/) );
ok("get.useful 被包装", !get.useful.toString().match(/^\s*useful\(card, player\)\s*\{/) );
lib.config.extension_自用ai_brain = false;
ok("brain 关闭 FLAG", FLAG.brain() === false);
lib.config.extension_自用ai_brain = true;
ok("install 幂等", (() => { try { e.precontent(); return true; } catch (err) { console.log("  幂等异常:", err.message); return false; } })());

console.log(`\n===== 结果：${pass} 通过, ${fail} 失败 =====`);
process.exit(fail === 0 ? 0 : 1);