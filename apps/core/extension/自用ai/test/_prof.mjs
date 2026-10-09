// 临时剖析：60+ 手牌场景装备决策热路径分阶段耗时分布（jsdom + 真实 noname 对象）
// 用法：node apps/core/extension/自用ai/test/_prof.mjs
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const CORE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const WORKSPACE_ROOT = join(CORE_DIR, "../../");
const { performance } = await import("node:perf_hooks");

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
	throw new Error("找不到 esbuild");
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
import "/tmp/opencode/promise-try-polyfill.mjs";
import "${join(CORE_DIR, "noname/init/polyfill.ts")}";
export { loadCard, loadCharacter } from "${join(CORE_DIR, "noname/init/loading.ts")}";
export { default as standard } from "${join(CORE_DIR, "card/standard.js")}";
export { install as installCheckopt } from "${join(CORE_DIR, "extension/自用ai/js/checkopt.js")}";
export { CacheContext } from "${join(CORE_DIR, "noname/library/cache/cacheContext.js")}";
import "${join(CORE_DIR, "character/standard/index.js")}";`;
const outfile = join(tmpdir(), "ai_prof_bundle.mjs");
await esbuildBuild({
	stdin: { contents: entrySrc, resolveDir: CORE_DIR, sourcefile: "_prof.mjs" },
	bundle: true, format: "esm", platform: "node", conditions: ["development"],
	alias: { "@": join(CORE_DIR, "noname"), "noname": join(CORE_DIR, "noname.js") },
	outfile, plugins: [stubVue], logLevel: "warning",
});

const mod = await import(outfile);
const { lib, game, ui, get, ai, _status, loadCard, loadCharacter, standard, installCheckopt, CacheContext } = mod;

process.on("uncaughtException", (e) => {
	console.warn("[后台异常]", e.message, "| ev=" + (_status.event ? _status.event.name + "/" + _status.event.type : "undefined"));
	if (e.stack) console.warn(e.stack.split("\n").slice(0, 7).join("\n"));
});

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
lib.config.forbid = [];
lib.config.customforbid = [];
lib.config.forbidlist = [];
lib.config.mode_config = {};
lib.config.extension_自用ai_checkopt = undefined;
if (!lib.configOL) lib.configOL = {};
if (!lib.connectCardPack) lib.connectCardPack = [];
if (!lib.connectCharacterPack) lib.connectCharacterPack = [];
if (!lib.cardPile) lib.cardPile = {};
if (!lib.cardPack) lib.cardPack = {};
if (!lib.card.list) lib.card.list = [];
_status.mountCombined = false;
loadCard(standard);
game.finishCards();
await Promise.all(_status.importing.character || []);
lib.config.characters = ["standard"];
lib.config.character = ["standard"];
Object.values(lib.imported.character).forEach(loadCharacter);

const equipNames = ["zhuge", "qinggang", "qinglong", "zhangba", "guanshi", "fangtian", "qilin", "jueying", "chitu", "dilu", "zhuahuang", "dawan", "hanbing", "renwang", "cixiong", "bagua", "zixin"];
const fillerNames = ["sha", "tao", "wuxie", "shunshou", "guohe", "shan"];

function mulberry32(a) {
	return function () {
		a |= 0; a = (a + 0x6D2B79F5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const suits = ["heart", "spade", "diamond", "club"];

function makeGame(seed, eqCount, fillerCount) {
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
	const hand = [];
	for (let i = 0; i < eqCount; i++) {
		hand.push(game.createCard(equipNames[i % equipNames.length], suits[i % 4], ((i * 3) % 13) + 1));
	}
	for (let i = 0; i < fillerCount; i++) {
		hand.push(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	for (let i = hand.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[hand[i], hand[j]] = [hand[j], hand[i]];
	}
	for (const c of hand) p0.node.handcards1.appendChild(c);
	for (let i = 1; i < 8; i++) {
		const cnt = 1 + (i % 2);
		for (let k = 0; k < cnt; k++) {
			const eq = game.createCard(equipNames[(i * 3 + k) % equipNames.length], suits[(i + k) % 4], ((i + k * 2) % 13) + 1);
			players[i].node.equips.appendChild(eq);
		}
	}
	return { players, p0 };
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

// ---- 分阶段计时包装（在 checkopt 补丁前包，补丁把包装作为 original 嵌套，只计真实执行） ----
const buckets = {};
function wrapTimed(obj, key, label) {
	const orig = obj[key];
	obj[key] = function (...a) {
		const s = performance.now();
		const r = orig.apply(this, a);
		const e = performance.now() - s;
		const b = buckets[label] || (buckets[label] = { calls: 0, ms: 0 });
		b.calls++;
		b.ms += e;
		return r;
	};
}

wrapTimed(lib.filter, "filterCard", "filterCard");
wrapTimed(lib.filter, "cardEnabled", "cardEnabled");
wrapTimed(lib.filter, "cardUsable", "cardUsable");
wrapTimed(lib.filter, "filterTarget", "filterTarget");
wrapTimed(lib.filter, "targetInRange", "targetInRange");
wrapTimed(lib.filter, "targetEnabledx", "targetEnabledx");
wrapTimed(game, "hasPlayer2", "hasPlayer2");
const _chkOrig = game.checkMod;
const chkCalls = {};
game.checkMod = function (...a) {
	const s = performance.now();
	const r = _chkOrig.apply(this, a);
	const e = performance.now() - s;
	const b = buckets["checkMod"] || (buckets["checkMod"] = { calls: 0, ms: 0 });
	b.calls++; b.ms += e;
	if (b.calls <= 400) {
		const st = new Error().stack.split("\n").slice(2, 5).map((x) => (x.match(/at\s+(\S+)/) || [])[1] || "?").join(" <- ");
		chkCalls[st] = (chkCalls[st] || 0) + 1;
	}
	return r;
};
wrapTimed(get, "autoViewAs", "get.autoViewAs");
wrapTimed(get, "distance", "get.distance");
wrapTimed(get, "equipValue", "get.equipValue");
wrapTimed(get, "owner", "get.owner");
wrapTimed(lib.element.Player.prototype, "canEquip", "canEquip");
wrapTimed(lib.element.Player.prototype, "getModableSkills", "getModableSkills");
wrapTimed(get, "vcards", "get.vcards");
if (process.env.TRACE121 === "1") {
	wrapTimed(game, "expandSkills", "game.expandSkills");
	wrapTimed(get, "result", "get.result");
	wrapTimed(get, "attitude", "get.attitude");
	wrapTimed(get, "tag", "get.tag");
	wrapTimed(get, "autoViewAs", "get.autoViewAs-trace");
	wrapTimed(get, "info", "get.info");
	wrapTimed(get, "value", "get.value");
	wrapTimed(get, "buttonValue", "get.buttonValue");
	wrapTimed(lib.element.Player.prototype, "getSkills", "player.getSkills");
	wrapTimed(lib.element.Player.prototype, "getCards", "player.getCards");
	wrapTimed(lib.element.Player.prototype, "countCards", "player.countCards");
	wrapTimed(lib.element.Player.prototype, "mayHaveShan", "player.mayHaveShan");
	wrapTimed(lib.element.Player.prototype, "mayHaveSha", "player.mayHaveSha");
	wrapTimed(lib.element.Player.prototype, "hasSkill", "player.hasSkill");
	wrapTimed(lib.element.Player.prototype, "hasSkillTag", "player.hasSkillTag");
	wrapTimed(lib.element.Player.prototype, "isPhaseUsing", "player.isPhaseUsing");
	wrapTimed(lib.element.Player.prototype, "getKnownCards", "player.getKnownCards");
	wrapTimed(lib.element.Player.prototype, "iterableGetCards", "player.iterableGetCards-trace");
	if (lib.element.Card?.prototype) {
		wrapTimed(lib.element.Card.prototype, "isKnownBy", "card.isKnownBy");
	}
	wrapTimed(get, "name", "get.name-trace");
	wrapTimed(lib.filter, "cardRespondable", "filter.cardRespondable");
	wrapTimed(lib.filter, "cardRespondable2", "filter.cardRespondable2");
}

installCheckopt();

function runRound(p0, event) {
	let usable = 0;
	for (const card of p0.getCards("hes")) {
		if (get.type(card) !== "equip") continue;
		if (lib.filter.filterCard(card, p0, event)) {
			usable++;
			try { get.equipValue(card, p0); } catch (e) {}
		}
	}
	return usable;
}

function profile(on, rounds, eqCount, fillerCount) {
	lib.config.extension_自用ai_checkopt = on ? undefined : false;
	const g = makeGame(1000 + (on ? 1 : 0), eqCount, fillerCount);
	game.players = g.players;
	// 预热（消除 JIT/观察者冷启动），不计时
	for (let r = 0; r < 3; r++) {
		_status.event = makeEvent(g.p0);
		runRound(g.p0, _status.event);
	}
	for (const k of Object.keys(buckets)) { buckets[k].calls = 0; buckets[k].ms = 0; }
	const t0 = performance.now();
	for (let r = 0; r < rounds; r++) {
		_status.event = makeEvent(g.p0);
		runRound(g.p0, _status.event);
	}
	const wall = performance.now() - t0;
	console.log(`\n== ${on ? "ON(缓存开)" : "OFF(缓存关)"}  ${rounds}轮 x 手牌(${eqCount}装备+${fillerCount}杂)  wall=${wall.toFixed(0)}ms ==`);
	const rows = Object.entries(buckets)
		.filter(([, b]) => b.calls)
		.map(([k, b]) => ({ k, calls: b.calls, ms: b.ms, avg: b.ms / b.calls * 1e6 }));
	rows.sort((a, b) => b.ms - a.ms);
	for (const r of rows) {
		console.log(`  ${r.k.padEnd(14)} ${r.ms.toFixed(1).padStart(8)}ms  ${String(r.calls).padStart(8)} 次  avg ${r.avg.toFixed(2)}µs`);
	}
	if (on) {
		const top = Object.entries(chkCalls).sort((a, b) => b[1] - a[1]).slice(0, 8);
		console.log("  checkMod 调用链采样:");
		for (const [st, n] of top) console.log(`    ${String(n).padStart(4)}x  ${st}`);
	}
	return wall;
}

const EQUIP_SKILLS = {
	bagua: ["bagua_skill"],
	zhuge: ["zhuge_skill"],
	cixiong: ["cixiong_skill"],
	qinggang: ["qinggang_skill"],
	qinglong: ["qinglong_skill", "qinglong_guozhan"],
	zhangba: ["zhangba_skill"],
	guanshi: ["guanshi_skill"],
	fangtian: ["fangtian_skill", "fangtian_guozhan"],
	qilin: ["qilin_skill"],
	hanbing: ["hanbing_skill"],
	renwang: ["renwang_skill"],
	jueying: [],
	dilu: [],
	zhuahuang: [],
	chitu: [],
	dawan: [],
	zixin: [],
};

// —— 全场装备横评 ——
// 1) 敌方 AI 评估「杀打向目标」：目标手牌 100 时无响应类技能 = 全手扫闪(约 5ms/次)，
//    有 respondShan 类技能则短路。看每件装备对目标防御估值是加速还是拖慢。
// 2) 托管阶段决策（自己出牌）：看装备技能是否改变自己 O(手牌×目标) 估值的系数。
function benchTargetEvalByEquip(skillsArr, handCount, rounds, playerCount = 10) {
	const g = makeGame(8100, 10, playerCount);
	const p0 = g.players[0];
	const attacker = g.players[1];
	for (let i = 0; i < g.players.length; i++) {
		const who = g.players[i];
		who.identity = i === 0 ? "fan" : "zhong";
		who.name = who.name1 = who.name2 = "caocao";
		who.hp = 3; who.maxHp = 3; who.hujia = 0;
		who.skills = skillsArr.slice();
		who.ai.friend = [];
		who.ai.enemy = [];
		who.ai.neutral = [];
	}
	attacker.ai.enemy = [p0];
	attacker.ai.friend = g.players.filter(w => w !== attacker);
	for (const c of p0.getCards("h").slice()) p0.node.handcards1.removeChild(c);
	for (let i = 0; i < handCount; i++) {
		p0.node.handcards1.appendChild(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	game.players = g.players;
	_status.event = makeEvent(attacker);
	const slash = game.createCard("sha", "spade", 7);
	if (!get.rawAttitude) {
		get.rawAttitude = (from, to) => {
			if (!from || !to || !from.ai) return 0;
			if (from.ai.enemy?.includes(to)) return -5;
			if (from.ai.friend?.includes(to)) return 5;
			return 1;
		};
	}
	CacheContext.setProxy({ lib, game, get, ai });
	CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
	CacheContext.setInCacheEnvironment(true);
	let w = 0;
	for (let r = 0; r < rounds; r++) {
		const s = performance.now();
		get.effect_use(p0, slash, attacker);
		w += performance.now() - s;
	}
	CacheContext.setInCacheEnvironment(false);
	CacheContext.removeCacheContext();
	return w / rounds * 1e3;
}

function benchPhaseByEquip(skillsArr, handCount, rounds) {
	const g = makeGame(9100, 10, 10);
	const p0 = g.players[0];
	for (let i = 0; i < g.players.length; i++) {
		const who = g.players[i];
		who.identity = i === 0 ? "fan" : "zhong";
		who.name = who.name1 = who.name2 = "caocao";
		who.hp = 3; who.maxHp = 3; who.hujia = 0;
		who.skills = skillsArr.slice();
		who.ai.friend = [];
		who.ai.enemy = [];
		who.ai.neutral = [];
		who.ai.enemy = g.players.filter(w => w !== who);
	}
	for (const c of p0.getCards("h").slice()) p0.node.handcards1.removeChild(c);
	if (!p0.vcardsMap) p0.vcardsMap = { handcards: [], equips: [], judges: [] };
	p0.vcardsMap.handcards = [];
	for (let i = 0; i < handCount; i++) {
		p0.node.handcards1.appendChild(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	p0.vcardsMap.handcards = p0.getCards("h");
	game.players = g.players;
	const ev = makeEvent(p0);
	ev.type = "phase";
	ev.position = "h";
	ev.selectCard = [1, 1];
	const targets = g.players.slice(1);
	if (!get.rawAttitude) {
		get.rawAttitude = (from, to) => {
			if (!from || !to || !from.ai) return 0;
			if (from.ai.enemy?.includes(to)) return -5;
			if (from.ai.friend?.includes(to)) return 5;
			return 1;
		};
	}
	CacheContext.setProxy({ lib, game, get, ai });
	CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
	CacheContext.setInCacheEnvironment(true);
	_status.event = ev;
	const cards = p0.getCards("h");
	let w = 0;
	for (let r = 0; r < rounds; r++) {
		const s = performance.now();
		for (const card of cards) {
			if (!lib.filter.filterCard(card, p0, ev)) continue;
			for (const t of targets) {
				get.effect_use(t, card, p0);
			}
		}
		w += performance.now() - s;
	}
	CacheContext.setInCacheEnvironment(false);
	CacheContext.removeCacheContext();
	return w / rounds * 1e3;
}

// —— 全部卡牌横评：敌方 AI 用每种牌对 13/100 手目标做 effect_use 估值 ——
function setupTargetGame(handCount, skillsArr, seed) {
	const g = makeGame(seed, 10, 6);
	const p0 = g.players[0];
	const attacker = g.players[1];
	for (let i = 0; i < g.players.length; i++) {
		const who = g.players[i];
		who.identity = i === 0 ? "fan" : "zhong";
		who.name = who.name1 = who.name2 = "caocao";
		who.hp = 3; who.maxHp = 3; who.hujia = 0;
		who.skills = skillsArr.slice();
		who.ai.friend = [];
		who.ai.enemy = [];
		who.ai.neutral = [];
	}
	attacker.ai.enemy = [p0];
	attacker.ai.friend = g.players.filter(w => w !== attacker);
	p0.node.handcards1.childNodes.forEach(n => n.remove());
	for (let i = 0; i < handCount; i++) {
		p0.node.handcards1.appendChild(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	g.p0 = p0;
	g.attacker = attacker;
	return { g, p0, attacker };
}

function benchCardMatrix() {
	console.log("\n########## 全部卡牌 effect_use 底层横评 ##########");
	const cardNames = Object.keys(lib.card);
	const families = {
		basic: [], trick: [], delay: [], equip: [], other: [],
	};
	for (const name of cardNames) {
		const def = lib.card[name] || {};
		const t = def.subtype || def.type || "other";
		const f = String(def.type);
		if (f.includes("delay")) families.delay.push(name);
		else if (f.includes("trick")) families.trick.push(name);
		else if (f.includes("equip")) families.equip.push(name);
		else if (f.includes("basic")) families.basic.push(name);
		else families.other.push(name);
	}
	const configs = [
		{ label: "13手/无技能", handCount: 13, skillsArr: [], rounds: 8, seed: 111 },
		{ label: "100手/无技能", handCount: 100, skillsArr: [], rounds: 6, seed: 112 },
		{ label: "100手/bagua", handCount: 100, skillsArr: ["bagua_skill"], rounds: 6, seed: 113 },
		{ label: "100手/qinggang", handCount: 100, skillsArr: ["qinggang_skill"], rounds: 6, seed: 114 },
	];
	for (const cfg of configs) {
		const { g, p0, attacker } = setupTargetGame(cfg.handCount, cfg.skillsArr, cfg.seed);
		game.players = g.players;
		_status.event = makeEvent(attacker);
		if (!get.rawAttitude) {
			get.rawAttitude = (from, to) => {
				if (!from || !to || !from.ai) return 0;
				if (from.ai.enemy?.includes(to)) return -5;
				if (from.ai.friend?.includes(to)) return 5;
				return 1;
			};
		}
		CacheContext.setProxy({ lib, game, get, ai });
		CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
		CacheContext.setInCacheEnvironment(true);
		const perCard = [];
		let total = 0, measured = 0, failed = 0;
		for (const name of cardNames) {
			let acc = 0, ok = 0;
			for (let r = 0; r < cfg.rounds; r++) {
				let c;
				try {
					c = game.createCard(name, "spade", (r % 9) + 2);
					const s = performance.now();
					get.effect_use(p0, c, attacker);
					acc += performance.now() - s;
					ok++;
				} catch (e) { failed++; continue; }
			}
			if (!ok) continue;
			const us = acc / ok * 1e3;
			perCard.push({ name, us, family: lib.card[name]?.type || "??" });
			total += acc; measured += ok;
		}
		perCard.sort((a, b) => b.us - a.us);
		const famAgg = {};
		for (const pc of perCard) {
			famAgg[pc.family] = famAgg[pc.family] || { n: 0, sum: 0 };
			famAgg[pc.family].n++;
			famAgg[pc.family].sum += pc.us;
		}
		CacheContext.setInCacheEnvironment(false);
		CacheContext.removeCacheContext();
		const top = perCard.slice(0, 10).map(p => `${p.name}=${p.us.toFixed(0)}µs`).join("  ");
		const agg = Object.entries(famAgg).map(([f, v]) => `${f}:${(v.sum / v.n).toFixed(0)}µs×${v.n}`).join("  ");
		console.log(`\n[${cfg.label}] ${measured} 张牌可评(fail=${failed})`);
		console.log(`  最慢TOP10: ${top}`);
		console.log(`  按类型均值: ${agg}`);
	}
}

function runEquipSuite() {
	console.log("\n########## 全部装备横评 ##########");
	const probe = [6, 10].map(n => `${n}p-13手=${benchTargetEvalByEquip([], 13, 60, n).toFixed(0)}µs  ${n}p-100手=${benchTargetEvalByEquip([], 100, 40, n).toFixed(0)}µs`).join(" | ");
	console.log("人数对照: " + probe);
	console.log("目标防御估值基准: 空手技能 13手=" + benchTargetEvalByEquip([], 13, 80).toFixed(0) + "µs/次  100手=" + benchTargetEvalByEquip([], 100, 60).toFixed(0) + "µs/次");
	console.log("自己阶段决策基准: 空技能 13手=" + benchPhaseByEquip([], 13, 8).toFixed(0) + "µs/决策  100手=" + benchPhaseByEquip([], 100, 3).toFixed(0) + "µs/决策");
	for (const [name, skillsArr] of Object.entries(EQUIP_SKILLS)) {
		const t13 = benchTargetEvalByEquip(skillsArr, 13, 60);
		const t100 = benchTargetEvalByEquip(skillsArr, 100, 40);
		const p13 = benchPhaseByEquip(skillsArr, 13, 6);
		const p100 = benchPhaseByEquip(skillsArr, 100, 2);
		console.log(`  ${name.padEnd(10)} 防御估值:${t13.toFixed(0)}µs@13 / ${t100.toFixed(0)}µs@100    阶段决策:${p13.toFixed(0)}µs@13 / ${p100.toFixed(0)}µs@100`);
	}
}
// 复刻 game.Check + AI chooseCard：共享 CacheContext 内对每张可用牌 × 每个目标
// 做 filterCard + effect_use 估值。handCount 对应 game.me.draw(N) 后的手牌量。
function benchPhaseDecision({ handCount, baguaOnSelf, rounds, off }) {
	lib.config.extension_自用ai_checkopt = off ? false : undefined;
	const g = makeGame(7000 + (baguaOnSelf ? 11 : 0), 10, 10);
	const p0 = g.players[0];
	for (let i = 0; i < g.players.length; i++) {
		const who = g.players[i];
		who.identity = i === 0 ? "fan" : "zhong";
		who.name = who.name1 = who.name2 = "caocao";
		who.hp = 3;
		who.maxHp = 3;
		who.hujia = 0;
		who.skills = [];
		who.ai.friend = [];
		who.ai.enemy = [];
		who.ai.neutral = [];
		who.ai.enemy = g.players.filter(w => w !== who);
	}
	if (baguaOnSelf) {
		p0.skills.push("bagua_skill");
	}
	for (const c of p0.getCards("h").slice()) p0.node.handcards1.removeChild(c);
	if (!p0.vcardsMap) p0.vcardsMap = { handcards: [], equips: [], judges: [] };
	p0.vcardsMap.handcards = [];
	for (let i = 0; i < handCount; i++) {
		p0.node.handcards1.appendChild(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	p0.vcardsMap.handcards = p0.getCards("h");
	game.players = g.players;
	const ev = makeEvent(p0);
	ev.type = "phase";
	ev.position = "h";
	ev.selectCard = [1, 1];
	const targets = g.players.slice(1);
	if (!get.rawAttitude) {
		get.rawAttitude = (from, to) => {
			if (!from || !to || !from.ai) return 0;
			if (from.ai.enemy?.includes(to)) return -5;
			if (from.ai.friend?.includes(to)) return 5;
			return 1;
		};
	}
	CacheContext.setProxy({ lib, game, get, ai });
	CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
	CacheContext.setInCacheEnvironment(true);
	_status.event = ev;
	let w = 0;
	const cards = p0.getCards("h");
	for (let r = 0; r < rounds; r++) {
		const s = performance.now();
		for (const card of cards) {
			if (!lib.filter.filterCard(card, p0, ev)) continue;
			for (const t of targets) {
				get.effect_use(t, card, p0);
			}
		}
		w += performance.now() - s;
	}
	CacheContext.setInCacheEnvironment(false);
	CacheContext.removeCacheContext();
	if (process.env.PD121 === "1") {
		const rows = Object.entries(buckets)
			.filter(([, b]) => b.calls)
			.map(([k, b]) => ({ k, calls: b.calls, ms: b.ms, avg: b.ms / b.calls * 1e6 }));
		rows.sort((a, b) => b.ms - a.ms);
		console.log(`  [PD121] 阶段决策 ${handCount}手 ${rounds}轮 桶明细:`);
		for (const r of rows.slice(0, 14)) console.log(`    ${r.k.padEnd(22)} ${r.ms.toFixed(1).padStart(8)}ms  ${String(r.calls).padStart(8)} 次  avg ${r.avg.toFixed(2)}µs`);
	}
	console.log(`  阶段决策×${rounds}(自己的手牌${handCount} 八卦=${baguaOnSelf})  ${w.toFixed(1)}ms  avg ${(w / rounds * 1e3).toFixed(0)}µs/决策`);
	return w;
}
// 复刻 chooseCard 的 AI 循环：共享一个 CacheContext 评估整个候选集，结束后移除。
// 托管 ON + 100 手牌 + 八卦阵(ai.effect.target 0.5) 正是该路径的放大组合。
function benchAIEffect({ handCount, baguaOnTarget, rounds }) {
	lib.config.extension_自用ai_checkopt = undefined;
	const g = makeGame(900 + (baguaOnTarget ? 3 : 0), 6, 6);
	const p0 = g.players[0];
	const attacker = g.players[1];
	for (let i = 0; i < g.players.length; i++) {
		const who = g.players[i];
		who.identity = i === 0 ? "fan" : "zhong";
		who.name = who.name1 = who.name2 = "caocao";
		who.hp = 3;
		who.maxHp = 3;
		who.hujia = 0;
		who.skills = [];
		who.ai.friend = [];
		who.ai.enemy = [];
		who.ai.neutral = [];
	}
	attacker.ai.enemy = [p0];
	attacker.ai.friend = g.players.filter(w => w !== attacker);
	if (baguaOnTarget) {
		p0.skills.push("bagua_skill");
	}
	p0.node.handcards1.childNodes.forEach(n => n.remove());
	const base = p0.getCards("h");
	for (const c of base.slice()) p0.node.handcards1.removeChild(c);
	for (let i = 0; i < handCount; i++) {
		p0.node.handcards1.appendChild(game.createCard(fillerNames[i % fillerNames.length], suits[i % 4], ((i * 5) % 13) + 1));
	}
	game.players = g.players;
	const ev0 = makeEvent(attacker);
	_status.event = ev0;
	const slash = game.createCard("sha", "spade", 7);
	if (!get.rawAttitude) {
		get.rawAttitude = (from, to) => {
			if (!from || !to || !from.ai) return 0;
			if (from.ai.enemy?.includes(to)) return -5;
			if (from.ai.friend?.includes(to)) return 5;
			return 1;
		};
	}
	CacheContext.setProxy({ lib, game, get, ai });
	CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
	CacheContext.setInCacheEnvironment(true);
	let w = 0;
	for (let r = 0; r < rounds; r++) {
		const s = performance.now();
		get.effect_use(p0, slash, attacker);
		w += performance.now() - s;
	}
	CacheContext.setInCacheEnvironment(false);
	CacheContext.removeCacheContext();
	console.log(`  AI评估×${rounds}(目标p0 手牌${handCount} 八卦=${baguaOnTarget})  ${w.toFixed(1)}ms  avg ${(w / rounds * 1e3).toFixed(2)}µs`);
	return w;
}
function equipP0(g) {
	const eq = g.p0.getCards("h").find(c => get.type(c) === "equip");
	if (!eq) return null;
	const vc = get.autoViewAs(eq, "card");
	g.p0.node.equips.appendChild(eq);
	if (!g.p0.vcardsMap) g.p0.vcardsMap = { handcards: [], equips: [], judges: [] };
	g.p0.vcardsMap.equips.push(vc);
	return eq;
}

function profileEquipped(on, rounds, eqCount, fillerCount) {
	lib.config.extension_自用ai_checkopt = on ? undefined : false;
	const g = makeGame(5000 + (on ? 1 : 0), eqCount, fillerCount);
	g.p0 = g.players[0];
	equipP0(g);
	g.p0.vcardsMap.handcards = g.p0.getCards("h").map(c => get.autoViewAs(c, "card"));
	game.players = g.players;
	for (let r = 0; r < 3; r++) {
		_status.event = makeEvent(g.p0);
		runRound(g.p0, _status.event);
	}
	for (const k of Object.keys(buckets)) { buckets[k].calls = 0; buckets[k].ms = 0; }
	const t0 = performance.now();
	for (let r = 0; r < rounds; r++) {
		_status.event = makeEvent(g.p0);
		runRound(g.p0, _status.event);
	}
	const wall = performance.now() - t0;
	console.log(`\n== ${on ? "ON" : "OFF"} [p0已装备]  ${rounds}轮 x 手牌(${eqCount}装备+${fillerCount}杂)  wall=${wall.toFixed(0)}ms ==`);
	const rows = Object.entries(buckets)
		.filter(([, b]) => b.calls)
		.map(([k, b]) => ({ k, calls: b.calls, ms: b.ms, avg: b.ms / b.calls * 1e6 }));
	rows.sort((a, b) => b.ms - a.ms);
	for (const r of rows) {
		console.log(`  ${r.k.padEnd(14)} ${r.ms.toFixed(1).padStart(8)}ms  ${String(r.calls).padStart(8)} 次  avg ${r.avg.toFixed(2)}µs`);
	}
	return wall;
}

// 单卡在 N 手目标上的 effect_use 单评成本（checkopt 开/关各测一次）
function benchSingleCard(name, handCount, rounds) {
	for (const on of [true, false]) {
		lib.config.extension_自用ai_checkopt = on ? undefined : false;
		const { g, p0, attacker } = setupTargetGame(handCount, [], 500);
		game.players = g.players;
		_status.event = makeEvent(attacker);
		if (!get.rawAttitude) {
			get.rawAttitude = (from, to) => {
				if (!from || !to || !from.ai) return 0;
				if (from.ai.enemy?.includes(to)) return -5;
				if (from.ai.friend?.includes(to)) return 5;
				return 1;
			};
		}
		CacheContext.setProxy({ lib, game, get, ai });
		CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
		CacheContext.setInCacheEnvironment(true);
		const c = game.createCard(name, "spade", 7);
		let acc = 0;
		for (let r = 0; r < rounds; r++) {
			const s = performance.now();
			get.effect_use(p0, c, attacker);
			acc += performance.now() - s;
		}
		CacheContext.setInCacheEnvironment(false);
		CacheContext.removeCacheContext();
		console.log(`  ${name} → ${handCount}手目标 ×${rounds}  ${on ? "开" : "关"}  total ${acc.toFixed(1)}ms  avg ${(acc / rounds * 1e3).toFixed(0)}µs/次`);
	}
}

// 定位 effect_use 内部热点：对 100 手无技能目标打 杀，统计子函数耗时桶
function benchEffectTrace() {
	for (const k of Object.keys(buckets)) delete buckets[k];
	const { g, p0, attacker } = setupTargetGame(100, [], 999);
	game.players = g.players;
	_status.event = makeEvent(attacker);
	if (!get.rawAttitude) {
		get.rawAttitude = (from, to) => {
			if (!from || !to || !from.ai) return 0;
			if (from.ai.enemy?.includes(to)) return -5;
			if (from.ai.friend?.includes(to)) return 5;
			return 1;
		};
	}
	CacheContext.setProxy({ lib, game, get, ai });
	CacheContext.setCacheContext(new CacheContext({ lib, game, get, ai }));
	CacheContext.setInCacheEnvironment(true);
	const cardNamesToTrace = ["sha", "juedou", "wanjian", "nanman", "shunshou", "guohe"];
	for (const cardName of cardNamesToTrace) {
		for (const k of Object.keys(buckets)) delete buckets[k];
		let mhsLogged = false, msssLogged = false;
		const pms = lib.element.Player.prototype.mayHaveShan;
		lib.element.Player.prototype.mayHaveShan = function (...a) {
			if (!mhsLogged) { mhsLogged = true; console.log("  [探测]首次 mayHaveShan 栈 (" + cardName + "):\n" + new Error().stack.split("\n").slice(2, 5).join("\n")); }
			return pms.apply(this, a);
		};
		const pmss = lib.element.Player.prototype.mayHaveSha;
		if (pmss && !lib.element.Player.prototype.mayHaveShan2) {
			lib.element.Player.prototype.mayHaveShan2 = true;
			lib.element.Player.prototype.mayHaveSha = function (...a) {
				if (!msssLogged) { msssLogged = true; console.log("  [探测]首次 mayHaveSha 栈 (" + cardName + "):\n" + new Error().stack.split("\n").slice(2, 5).join("\n")); }
				return pmss.apply(this, a);
			};
		}
		let gkcLogged = false;
		const pgkc = lib.element.Player.prototype.getKnownCards;
		if (pgkc && !lib.element.Player.prototype._gkcProbe) {
			lib.element.Player.prototype._gkcProbe = true;
			lib.element.Player.prototype.getKnownCards = function (...a) {
				if (!gkcLogged) {
					gkcLogged = true;
					const t0 = performance.now();
					const r = pgkc.apply(this, a);
					console.log(`  [探测]首次 getKnownCards 栈 (${cardName}) this=${get.identitystr ? "?" : "?"} other=${a[0]?.playerid ?? a[0]}  耗时${(performance.now() - t0).toFixed(1)}ms 返回${r.length}张`);
					return r;
				}
				return pgkc.apply(this, a);
			};
		}
		const c = game.createCard(cardName, "spade", 7);
		let w = 0;
		for (let r = 0; r < 50; r++) {
			const s = performance.now();
			get.effect_use(p0, c, attacker);
			w += performance.now() - s;
		}
		console.log(`\n  ==== ${cardName} → 100手目标 ×50: avg ${(w / 50 * 1e3).toFixed(0)}µs`);
		const rows = Object.entries(buckets).map(([k, v]) => { v.k = k; v.avg = (v.ms / v.calls) * 1e3; return v; });
		rows.sort((a, b) => b.ms - a.ms);
		for (const r of rows.slice(0, 8)) {
			console.log(`      ${r.k.padEnd(26)} ${r.ms.toFixed(1).padStart(8)}ms  ${String(r.calls).padStart(8)} 次  avg ${r.avg.toFixed(2)}µs`);
		}
	}
	CacheContext.setInCacheEnvironment(false);
	CacheContext.removeCacheContext();
}

// 60+ 手牌：30 装备 + 32 杂 = 62 张；OFF->ON->OFF2 分离冷热
const EQ = 30, FILL = 32, ROUNDS = 8;
if (process.env.TRACE121 === "1") {
	benchEffectTrace();
} else if (process.env.FAST121 === "1") {
	console.log("########## 8.7 校验：响应估值缓存 开→关 对照 ##########");
	benchAIEffect({ handCount: 100, baguaOnTarget: false, rounds: 60 });
	benchPhaseDecision({ handCount: 100, baguaOnSelf: false, rounds: 3 });
	console.log("########## 自家 100 手阶段决策 开↔关 对照 ##########");
	benchPhaseDecision({ handCount: 100, baguaOnSelf: false, rounds: 3, off: true });
	benchPhaseDecision({ handCount: 100, baguaOnSelf: false, rounds: 3 });
	benchPhaseDecision({ handCount: 100, baguaOnSelf: false, rounds: 3, off: true });
	console.log("########## 8.7 校验：各卡在 100 手目标上的单评成本（开/关） ##########");
	benchSingleCard("sha", 100, 60);
	benchSingleCard("juedou", 100, 60);
	benchSingleCard("wanjian", 100, 60);
	benchSingleCard("nanman", 100, 60);
	benchSingleCard("shunshou", 100, 60);
	benchSingleCard("guohe", 100, 60);
} else {
	profile(false, ROUNDS, EQ, FILL);
profile(true, ROUNDS, EQ, FILL);
profile(false, ROUNDS, EQ, FILL);
console.log("\n########## p0 已装备（复刻使用装备牌后的状态） ##########");
profileEquipped(false, ROUNDS, EQ, FILL);
profileEquipped(true, ROUNDS, EQ, FILL);
profileEquipped(false, ROUNDS, EQ, FILL);
console.log("\n########## AI 决策侧评估（攻击者在托管下打 杀 打向 p0） ##########");
benchAIEffect({ handCount: 13, baguaOnTarget: false, rounds: 200 });
benchAIEffect({ handCount: 13, baguaOnTarget: true, rounds: 200 });
benchAIEffect({ handCount: 100, baguaOnTarget: false, rounds: 200 });
benchAIEffect({ handCount: 100, baguaOnTarget: true, rounds: 200 });
console.log("\n########## 托管阶段决策（自己的手牌量在决定决策耗时） ##########");
benchPhaseDecision({ handCount: 13, baguaOnSelf: false, rounds: 20 });
benchPhaseDecision({ handCount: 13, baguaOnSelf: true, rounds: 20 });
benchPhaseDecision({ handCount: 80, baguaOnSelf: false, rounds: 5 });
benchPhaseDecision({ handCount: 80, baguaOnSelf: true, rounds: 5 });
benchPhaseDecision({ handCount: 100, baguaOnSelf: false, rounds: 3 });
benchPhaseDecision({ handCount: 100, baguaOnSelf: true, rounds: 3 });
benchCardMatrix();
	runEquipSuite();
}
