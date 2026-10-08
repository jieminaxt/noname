import { lib, game, get, _status } from "../../../noname.js";
import { FLAG, patch } from "./core.js";

const NS = "brain";

// ============================================================
// AI 行为决策层（开关：自用ai_brain）
// 原则：始终调用原函数拿到基准值，仅在开关开启时叠加场景修正；
// mod 管道（aiUseful/aiOrder/aiValue）与牌级钩子全部保持原语义。
//
// 1) get.useful 场景系数：满血桃贬值、残血桃升值、无威胁闪贬值、
//    单挑无懈贬值——解决原版"该留的牌不留"的持有价值失真
// 2) get.effect/effect_use 斩杀奖励与溢出惩罚：damage >= 目标承伤
//    上限（血+护甲）时加分，溢出越多惩罚越重——解决原版
//    "两点伤害和一刀劈满血敌人一样好"的浪费伤害倾向
// ============================================================

// 威胁快照：按评估者+手牌总数代际缓存，避免每次 useful 遍历全场
let threatEv = null;
let threatGen = "";
let threatVal = new Map();

function scanThreat(view) {
	const ev = _status.event;
	if (ev !== threatEv) {
		threatEv = ev;
		threatVal = new Map();
	}
	let handTotal = 0;
	for (const p of game.players) {
		handTotal += p.countCards("h");
	}
	const gen = handTotal + ":" + game.players.length;
	if (threatGen !== gen) {
		threatGen = gen;
		threatVal = new Map();
	}
	let val = threatVal.get(view);
	if (val === undefined) {
		let enemyHands = 0;
		let enemies = 0;
		for (const p of game.players) {
			if (p === view || p.isDead()) continue;
			if (get.attitude(view, p) < 0) {
				enemies++;
				enemyHands += p.countCards("h");
			}
		}
		val = { enemyHands: enemyHands, enemies: enemies };
		threatVal.set(view, val);
	}
	return val;
}

export function scenarioUseful(card, player, val) {
	const name = card && card.name;
	if (name === "tao") {
		if (player.hp >= player.maxHp) {
			return val * 0.4;
		}
		if (player.hp === 1) {
			return val * 1.4;
		}
	} else if (name === "shan") {
		const t = scanThreat(player);
		if (t.enemies > 0 && t.enemyHands === 0) {
			return val * 0.6;
		}
	} else if (name === "wuxie") {
		let alive = 0;
		for (const p of game.players) {
			if (!p.isDead()) alive++;
		}
		if (alive <= 2) {
			return val * 0.5;
		}
	}
	return val;
}

// 斩杀奖励与溢出惩罚
// cap = 目标血量+护甲；dmg >= cap 视为斩杀，净溢出部分按 1.5 分/点惩罚，
// 奖励下限 2 分保证"刚好斩杀"严格优于普通伤害
export function killAdjust(card, target, player, player2, linking, final) {
	if (linking) return final;
	if (typeof final !== "number") return final;
	if (!target || typeof target.isIn !== "function" || !target.isIn()) return final;
	const dmg = get.tag(card, "damage");
	if (typeof dmg !== "number" || dmg <= 0) return final;
	const view = player2 || player;
	if (!view || view === target) return final;
	if (get.attitude(view, target) >= 0) return final;
	const cap = target.hp + (target.hujia || 0);
	if (dmg >= cap) {
		const waste = dmg - cap;
		final += Math.max(2, 8 - waste * 1.5);
	}
	return final;
}

export function installBrain() {
	// useful：场景系数叠加在原值之上（unuseful/unuseful2/unuseful3
	// 经由 get.useful 自动继承修正）
	patch(get, "useful", NS, (original) => function (card, player) {
		const val = original.call(this, card, player);
		if (!FLAG.brain() || typeof val !== "number") return val;
		const p = player || _status.event.player;
		if (!p) return val;
		return scenarioUseful(card, p, val);
	}, () => true);

	// effect/effect_use：斩杀奖励与溢出惩罚作用在最终分值上
	patch(get, "effect", NS, (original) => function (target, card, player, player2, linking) {
		const val = original.call(this, target, card, player, player2, linking);
		if (!FLAG.brain()) return val;
		return killAdjust(card, target, player, player2, linking, val);
	}, () => true);

	patch(get, "effect_use", NS, (original) => function (target, card, player, player2, linking) {
		const val = original.call(this, target, card, player, player2, linking);
		if (!FLAG.brain()) return val;
		return killAdjust(card, target, player, player2, linking, val);
	}, () => true);
}
