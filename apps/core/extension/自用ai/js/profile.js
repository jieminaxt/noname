import { game, lib } from "../../../noname.js";

// ============================================================
// AI 性能分析器
// 配置开启后统计各环节累计耗时，超过 50ms 输出到游戏日志和控制台
// dumpfile 开启时：把 "AI耗时" 峰值行累积写入扩展目录文件，
// 供真机大量手牌场景导出分析（fs 不可用则回退 localStorage）
// ============================================================
const profState = { pending: 0, times: new Map(), counts: new Map() };
let profFlag = () => false;
let dumpFlag = () => false;
let dumpTimer = null;
const dumpLines = [];
const DUMP_PATH = "extension/自用ai/ai-perf-dump.txt";
const DUMP_LS_KEY = "extension_自用ai_perf_dump";
const DUMP_MAX_LINES = 5000;
// 单卡估值最慢采样：chooseCard 循环内每张候选牌 check 的耗时
let cardCheckTop = { card: null, ms: 0 };

export function bindProfileFlag(fn) {
	profFlag = fn;
}

export function bindDumpFlag(fn) {
	dumpFlag = fn;
}

function dumpCollect(line) {
	dumpLines.push(line);
	if (dumpLines.length > DUMP_MAX_LINES) dumpLines.splice(0, dumpLines.length - DUMP_MAX_LINES);
}

async function dumpFlush() {
	if (!dumpLines.length && !cardCheckTop.ms) return;
	const header = "自用ai 性能落盘 " + new Date().toISOString();
	let text = header + "\n" + dumpLines.join("\n");
	if (cardCheckTop.ms) {
		const c = cardCheckTop;
		let desc = typeof c.card === "string" ? "技能:" + c.card : (c.card && c.card.name ? c.card.name : "?");
		text += "\n[单卡最慢] " + desc + " " + c.ms.toFixed(1) + "ms\n";
	}
	text += "\n";
	let ok = false;
	// 真机(Cordova)首选：game.writeFile 写入扩展目录 extension/自用ai/ai-perf-dump.txt
	if (!ok && game && typeof game.writeFile === "function") {
		try {
			await new Promise((resolve) => {
				game.writeFile(new TextEncoder().encode(text).buffer, "extension/自用ai/", "ai-perf-dump.txt", () => resolve());
			});
			ok = true;
		} catch (e) {
			try { game.log("[自用ai] 性能落盘 writeFile 失败：" + String(e.message || e).slice(0, 80)); } catch (e2) { }
		}
	}
	// 桌面/其它：lib.fs.writeText
	if (!ok && lib.fs && typeof lib.fs.writeText === "function") {
		try {
			await lib.fs.writeText(DUMP_PATH, text);
			ok = true;
		} catch (e) {
			try { game.log("[自用ai] 性能落盘 fs 失败：" + String(e.message || e).slice(0, 80)); } catch (e2) { }
		}
	}
	// 最终回退：localStorage
	if (!ok) {
		try {
			localStorage.setItem(DUMP_LS_KEY, text);
		} catch (e) { }
	}
}

export function profOn() {
	return profFlag();
}

export function profCount(label, delta) {
	profState.counts.set(label, (profState.counts.get(label) || 0) + (delta || 1));
}

export function profAdd(label, ms) {
	if (!(ms > 0)) ms = 0;
	profState.pending += ms;
	profState.times.set(label, (profState.times.get(label) || 0) + ms);
	if (profState.pending >= 50) {
		const parts = [];
		profState.times.forEach((v, k) => parts.push(k + " " + v.toFixed(1) + "ms"));
		profState.counts.forEach((v, k) => parts.push(k + "×" + v));
		const line = "AI耗时 " + profState.pending.toFixed(1) + "ms：" + parts.join("，");
		console.log("[自用ai]", line);
		try {
			game.log(line);
		} catch (e) { }
		if (dumpFlag()) dumpCollect(line);
		profState.pending = 0;
		profState.times.clear();
		profState.counts.clear();
	}
}

export function profWrap(label, fn) {
	return function (...args) {
		if (!profOn()) return fn.apply(this, args);
		const t0 = performance.now();
		try {
			return fn.apply(this, args);
		} finally {
			profAdd(label, performance.now() - t0);
			profCount(label + "调用");
		}
	};
}

// 供 extension 定时调用：把累积行落盘
export function profFlushNow() {
	return dumpFlush();
}

// chooseCard 循环内单卡估值采样：记录本局最慢的单张候选估值
export function profCardCheck(card, ms) {
	if (ms > cardCheckTop.ms) {
		cardCheckTop = { card, ms };
	}
}
