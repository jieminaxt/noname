import { game } from "../../../noname.js";

// ============================================================
// AI 性能分析器
// 配置开启后统计各环节累计耗时，超过 50ms 输出到游戏日志和控制台
// ============================================================
const profState = { pending: 0, times: new Map(), counts: new Map() };
let profFlag = () => false;

export function bindProfileFlag(fn) {
	profFlag = fn;
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
