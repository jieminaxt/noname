import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import { CacheContext } from "../../../noname/library/cache/cacheContext.js";
import { FLAG, patch, backup } from "./core.js";
import { profOn, profCount, profAdd } from "./profile.js";

const NS = "perf";

// ============================================================
// P1：CacheContext 函数 Key 缓存（WeakMap，避免重复 MD5 序列化）
// ============================================================
export function installFuncKeyCache() {
	if (CacheContext.__rawWrapBackup === undefined) {
		CacheContext.__rawWrapBackup = CacheContext._wrapParameterToCacheKey;
	}
	if (!CacheContext.__aiFuncPatchActive) {
		const rawWrap = CacheContext.__rawWrapBackup;
		const funcKeyMap = new WeakMap();
		CacheContext._wrapParameterToCacheKey = function (param) {
			if (!FLAG.onai()) {
				return rawWrap.call(CacheContext, param);
			}
			if (typeof param === "function") {
				let key = funcKeyMap.get(param);
				if (key === undefined) {
					key = rawWrap.call(CacheContext, param);
					funcKeyMap.set(param, key);
				}
				return key;
			}
			return rawWrap.call(CacheContext, param);
		};
		CacheContext.__aiFuncPatchActive = true;
	}
}

// ============================================================
// P2：AI 决策期内记忆化重型 get 计算
// order/effect/effect_use/value/useful/equipValue 每次调用都
// 重新执行 getSkills+expandSkills 数组分配和逐技能循环，且此前
// 完全无缓存。存储按事件对象（WeakMap）挂载：chooseToUse 的 AI
// 流程在目标收益不达标时会 aiexclude 后 event.redo() 整体重试，
// 每轮重试都会新建 CacheContext，按上下文挂缓存会导致重试轮次
// 全量重算；重试轮次间游戏状态不变，按事件挂载即可跨轮复用。
// 代际校验（手牌数+场上人数）兜底：状态真变化时自动清空。
// effect/effect_use 的 card 参数缺省时派生自 get.card()（依赖
// ui.selected.cards），键内带上已选牌数保证逐迭代重算。
// ============================================================
const aiMemoStore = new WeakMap();
const originalGetCard = backup(get, "card", NS);
const memoRaw = {};

const memoGen = () => {
	const p = _status.event.player;
	return (p ? p.countCards("hesj") : 0) + "|" + game.players.length + "|" + game.dead.length;
};

let currentMemoEntry = null;
const memoRefresh = () => {
	const ev = _status.event;
	const gen = memoGen();
	let entry = aiMemoStore.get(ev);
	if (entry === undefined || entry.gen !== gen) {
		entry = { gen: gen, fns: new Map() };
		aiMemoStore.set(ev, entry);
	}
	currentMemoEntry = entry;
	idKeyCache.clear();
};

// 懒建立：仅当当前事件尚未建立缓存条目时才刷新（跨事件安全），
// 同事件内零开销；非缓存环境返回 false
const memoEnsure = () => {
	if (!CacheContext.getCacheContext()) return false;
	const ev = _status.event;
	if (!ev) return false;
	if (aiMemoStore.get(ev) !== currentMemoEntry) {
		memoRefresh();
	}
	return true;
};

const memoIsDerived = (cardArg) =>
	cardArg == null || (typeof cardArg === "object" && !("name" in cardArg));

// 已选卡牌内容指纹（viewAs 函数依赖内容而非数量）
const selCardsFingerprint = () => {
	const sel = ui.selected.cards;
	let key = sel.length + "#";
	for (let i = 0; i < sel.length; i++) {
		const c = sel[i];
		if (typeof c === "string") {
			key += "s:" + c;
		} else if (c && c.cardid) {
			key += "c:" + c.cardid;
		} else {
			key += "x:" + ((c && c.name) || "?");
		}
		key += "|";
	}
	return key;
};

// 对象参数键引用级缓存：_wrapParameterToCacheKey 对 card/player 对象会递归
// Object.entries 全字段序列化，命中路径也要先生成键再查表，大对象重复成本高。
// 决策期间同一对象引用内容稳定（classList 变化不影响估值），按引用缓存键安全。
// function 由 P1 的 WeakMap 覆盖，此处同样受益。
const objKeyCache = new WeakMap();
const idKeyCache = new Map();
const wrapParamKey = (param) => {
	if (param === null || param === undefined) return "n";
	const t = typeof param;
	if (t === "string" || t === "number" || t === "boolean") return t + ":" + param;
	if (t === "function") {
		let k = objKeyCache.get(param);
		if (k === undefined) {
			k = CacheContext._wrapParameterToCacheKey(param);
			objKeyCache.set(param, k);
		}
		return k;
	}
	if (Array.isArray(param)) {
		let k = objKeyCache.get(param);
		if (k === undefined) {
			let s = "A" + param.length + ":";
			for (let i = 0; i < param.length; i++) {
				s += wrapParamKey(param[i]) + ";";
			}
			objKeyCache.set(param, s);
			k = s;
		}
		return k;
	}
	let k = objKeyCache.get(param);
	if (k === undefined) {
		const cid = param.cardid;
		if (cid !== undefined) {
			k = idKeyCache.get(cid);
			if (k !== undefined) return k;
		}
		k = CacheContext._wrapParameterToCacheKey(param);
		objKeyCache.set(param, k);
		if (cid !== undefined) idKeyCache.set(cid, k);
	}
	return k;
};

const memoKey = (args, useSelTag) => {
	if (useSelTag) {
		let key = selCardsFingerprint();
		for (let i = 0; i < args.length; i++) {
			key += wrapParamKey(args[i]) + "|";
		}
		return key;
	}
	if (args.length === 1) return wrapParamKey(args[0]);
	let key = "";
	for (let i = 0; i < args.length; i++) {
		key += wrapParamKey(args[i]) + "|";
	}
	return key;
};

const installMemo = (name, tagMode) => {
	const raw = (memoRaw[name] = get[name]);
	get[name] = function (...args) {
		if (!FLAG.onai()) return raw.apply(this, args);
		if (!memoEnsure()) return raw.apply(this, args);
		const useTag = tagMode === "derived" ? memoIsDerived(args[1]) : tagMode;
		let key;
		try {
			key = memoKey(args, useTag);
		} catch (e) {
			return raw.apply(this, args);
		}
		const subMap = currentMemoEntry.fns;
		let sub = subMap.get(name);
		if (sub === undefined) {
			sub = new Map();
			subMap.set(name, sub);
		}
		if (sub.has(key)) {
			if (profOn()) profCount(name + "命中");
			return sub.get(key);
		}
		if (profOn()) {
			const t0 = performance.now();
			const ret = raw.apply(this, args);
			profAdd(name + "重算", performance.now() - t0);
			sub.set(key, ret);
			return ret;
		}
		const ret = raw.apply(this, args);
		sub.set(key, ret);
		return ret;
	};
};

export function installMemoLayer() {
	installMemo("order", false);
	installMemo("value", false);
	installMemo("useful", false);
	installMemo("equipValue", false);
	installMemo("effect", "derived");
	installMemo("effect_use", "derived");

	// get.card 只有无参调用才走派生缓存（带 original 参数的调用直接透传）
	get.card = function (...args) {
		if (FLAG.onai() === false || args.length > 0) {
			return originalGetCard.apply(this, args);
		}
		if (!memoEnsure()) return originalGetCard.apply(this, args);
		const subMap = currentMemoEntry.fns;
		let sub = subMap.get("card");
		if (sub === undefined) {
			sub = new Map();
			subMap.set("card", sub);
		}
		// 键 = 已选牌数 + 各牌 cardid/内容指纹：viewAs 为函数时
		// get.card 依赖 ui.selected.cards 的内容而非数量，数量相同
		// 但换牌时必须重算（选 A 再选 B 是两张不同的牌）
		const key = selCardsFingerprint();
		if (sub.has(key)) return sub.get(key);
		const ret = originalGetCard.apply(this, args);
		sub.set(key, ret);
		return ret;
	};
}

// ============================================================
// P3：selectable* 三闭包缓存
// ============================================================
export function installSelectableCache() {
	// selectableCards：以 (player, event, 手牌代际) 为键，同一次决策内跳过 getCards("hes")；
	// 代际校验保证决策中途手牌变化（如 chooseCard 选中技能牌后递归）时自动刷新
	patch(get, "selectableCards", NS, (original) => {
		let cachedPlayer = null;
		let cachedEvent = null;
		let cachedGen = "";
		let cachedAllCards = [];
		let cachedFilterCard = null;
		let cachedFilterLen = 0;
		return function (sort) {
			const event = _status.event;
			const player = event.player;
			if (!player) return [];
			if (cachedFilterCard !== event.filterCard) {
				cachedFilterCard = event.filterCard;
				cachedFilterLen = event.filterCard ? event.filterCard.toString().length : 0;
			}
			const gen = player.countCards("hes") + (cachedFilterLen ? "#" + cachedFilterLen : "");
			if (cachedPlayer !== player || cachedEvent !== event || cachedGen !== gen) {
				cachedPlayer = player;
				cachedEvent = event;
				cachedGen = gen;
				cachedAllCards = player.getCards("hes");
			}
			const selectable = [];
			for (let i = 0; i < cachedAllCards.length; i++) {
				const cl = cachedAllCards[i].classList;
				if (cl.contains("selectable") && !cl.contains("selected")) {
					selectable.push(cachedAllCards[i]);
				}
			}
			if (sort) selectable.sort(sort);
			return selectable;
		};
	}, FLAG.onai);

	// selectableButtons：dialog.buttons 是 dialog 自身的稳定引用，按 dialog+数量代际缓存安全
	patch(get, "selectableButtons", NS, (original) => {
		let cachedDialog = null;
		let cachedGen = "";
		let cachedAllButtons = [];
		let cachedFilterButton = null;
		let cachedFilterBLen = 0;
		return function (sort) {
			const event = _status.event;
			if (!event.player || !event.dialog) return [];
			const dialog = event.dialog;
			const buttons = dialog.buttons || [];
			if (cachedFilterButton !== event.filterButton) {
				cachedFilterButton = event.filterButton;
				cachedFilterBLen = event.filterButton ? event.filterButton.toString().length : 0;
			}
			const gen = buttons.length + (cachedFilterBLen ? "#" + cachedFilterBLen : "");
			if (cachedDialog !== dialog || cachedGen !== gen) {
				cachedDialog = dialog;
				cachedGen = gen;
				cachedAllButtons = buttons;
			}
			const selectable = [];
			for (let i = 0; i < cachedAllButtons.length; i++) {
				const cl = cachedAllButtons[i].classList;
				if (cl.contains("selectable") && !cl.contains("selected")) {
					selectable.push(cachedAllButtons[i]);
				}
			}
			if (sort) selectable.sort(sort);
			return selectable;
		};
	}, FLAG.onai);

	// selectableTargets：以 (event, deadTarget, 存活人数) 为键，game.players 会因角色死亡变化
	patch(get, "selectableTargets", NS, (original) => {
		let cachedEvent = null;
		let cachedDeadTarget = null;
		let cachedGen = "";
		let cachedAllPlayers = [];
		return function (sort) {
			const event = _status.event;
			const card = get.card();
			const deadTarget = event.deadTarget ||
				(event.skill && get.info(event.skill)?.deadTarget) ||
				(card && get.info(card)?.deadTarget);
			const gen = game.players.length + ":" + game.dead.length + (deadTarget ? "#d" : "");
			if (cachedEvent !== event || cachedDeadTarget !== deadTarget || cachedGen !== gen) {
				cachedEvent = event;
				cachedDeadTarget = deadTarget;
				cachedGen = gen;
				cachedAllPlayers = game.players.slice(0);
				if (deadTarget) cachedAllPlayers.addArray(game.dead);
			}
			const selectable = [];
			for (let i = 0; i < cachedAllPlayers.length; i++) {
				const cl = cachedAllPlayers[i].classList;
				if (cl.contains("selectable") && !cl.contains("selected")) {
					selectable.push(cachedAllPlayers[i]);
				}
			}
			if (sort) {
				selectable.sort(sort);
			} else {
				selectable.randomSort();
			}
			return selectable;
		};
	}, FLAG.onai);
}

// ============================================================
// P4：ai.basic 三个贪心选择器重写
// 变量外提 + 复用 check 结果 + 决策完成时跳过 game.check()
// CacheContext 每次决策新建：storageMap/sourceMap 仅单决策内有效
// ============================================================
const enterCache = () => {
	CacheContext.setCacheContext(new CacheContext());
	CacheContext.setInCacheEnvironment(true);
	memoRefresh();
};

const exitCache = () => {
	CacheContext.setInCacheEnvironment(false);
	CacheContext.removeCacheContext();
};

export function installChooseRewrite() {
	patch(ai.basic, "chooseButton", NS, (original) => function (check) {
		const event = _status.event;
		const forced = event.forced;
		const selected = ui.selected.buttons;
		let ok = false;
		let iwhile = 100;
		const loopT0 = performance.now();

		const profEnabled = profOn();
		const profT0 = profEnabled ? performance.now() : 0;
		let profIters = 0;

		try {
			while (iwhile--) {
				if (profEnabled) profIters++;
				if (performance.now() - loopT0 > 100) break;
				const range = get.select(event.selectButton);
				if (selected.length >= range[0]) ok = true;

				if (range[1] <= -1) {
					enterCache();
					try {
						let j = 0;
						for (let i = 0; i < selected.length; i++) {
							j += check(selected[i]);
						}
						return j > 0;
					} finally {
						exitCache();
					}
				}

				const buttons = get.selectableButtons();
				if (buttons.length === 0) return ok;

				const buttons2 = buttons.slice(0);
				let ix = 0;
				enterCache();
				try {
					let maxVal = check(buttons[0], buttons2);
					for (let i = 1; i < buttons.length; i++) {
						const val = check(buttons[i], buttons2);
						if (val > maxVal) {
							ix = i;
							maxVal = val;
						}
					}
					if (maxVal <= 0 && (!forced || ok)) return ok;
				} finally {
					exitCache();
				}

				buttons[ix].classList.add("selected");
				selected.add(buttons[ix]);
				game.check();
				if (selected.length >= range[0]) ok = true;
				if (selected.length === range[1]) return true;
			}
		} finally {
			if (profEnabled) {
				profAdd("chooseButton", performance.now() - profT0);
				profCount("chooseButton调用");
				profCount("chooseButton轮数", profIters);
			}
		}
		return ok;
	}, FLAG.onai);

	patch(ai.basic, "chooseCard", NS, (original) => function (check) {
		const event = _status.event;
		if (event.filterCard == void 0) return check() > 0;

		const forced = event.forced;
		const noSkill = event.player && event.player._noSkill;
		const skillCards = noSkill ? null : get.skills();
		const hasSkillCards = skillCards != null && skillCards.length > 0;
		const selected = ui.selected.cards;
		let ok = false;
		let iwhile = 100;
		const loopT0 = performance.now();

		const profEnabled = profOn();
		const profT0 = profEnabled ? performance.now() : 0;
		let profIters = 0;

		try {
			while (iwhile--) {
				if (profEnabled) profIters++;
				if (performance.now() - loopT0 > 100) break;
				const range = get.select(event.selectCard);
				if (selected.length >= range[0]) ok = true;

				if (range[1] <= -1) {
					if (selected.length === 0) return true;
					enterCache();
					try {
						let j = 0;
						for (let i = 0; i < selected.length; i++) {
							const effect = check(selected[i]);
							j += effect < 0 ? -Math.sqrt(-effect) : Math.sqrt(effect);
						}
						return j > 0;
					} finally {
						exitCache();
					}
				}

				const cards = get.selectableCards();
				if (hasSkillCards) {
					for (let i = 0; i < skillCards.length; i++) {
						cards.push(skillCards[i]);
					}
				}
				if (cards.length === 0) return ok;

				const cards2 = cards.slice(0);
				let ix = 0;
				enterCache();
				try {
					let maxVal = check(cards[0], cards2);
					for (let i = 1; i < cards.length; i++) {
						const val = check(cards[i], cards2);
						if (val > maxVal) {
							ix = i;
							maxVal = val;
						}
					}
					if (maxVal <= 0 && (!forced || ok)) return ok;
				} finally {
					exitCache();
				}

				if (typeof cards[ix] === "string") {
					ui.click.skill(cards[ix]);
					const info = get.info(event.skill);
					if (info.filterCard) {
						check = info.check || get.unuseful2;
						return this.chooseCard(check);
					} else {
						return true;
					}
			} else {
				cards[ix].classList.add("selected");
				selected.add(cards[ix]);
				game.check();
				if (selected.length >= range[0]) ok = true;
				if (selected.length === range[1]) return true;
			}
			}
		} finally {
			if (profEnabled) {
				profAdd("chooseCard", performance.now() - profT0);
				profCount("chooseCard调用");
				profCount("chooseCard轮数", profIters);
			}
		}
		return ok;
	}, FLAG.onai);

	patch(ai.basic, "chooseTarget", NS, (original) => function (check) {
		const event = _status.event;
		if (event.filterTarget == void 0) return check() > 0;

		const forced = event.forced;
		const selected = ui.selected.targets;
		let ok = false;
		let iwhile = 100;
		const loopT0 = performance.now();

		try {
			while (iwhile--) {
				if (performance.now() - loopT0 > 100) break;
				const range = get.select(event.selectTarget);
				if (selected.length >= range[0]) ok = true;

				if (range[1] <= -1) {
					enterCache();
					try {
						let j = 0;
						for (let i = 0; i < selected.length; i++) {
							const effect = check(selected[i]);
							j += effect < 0 ? -Math.sqrt(-effect) : Math.sqrt(effect);
						}
						return j > 0;
					} finally {
						exitCache();
					}
				} else if (range[1] === 0) {
					return check() > 0;
				}

				const targets = get.selectableTargets();
				if (targets.length === 0) return range[0] === 0 || ok;

				const targets2 = targets.slice(0);
				let ix = 0;
				enterCache();
				try {
					let maxVal = check(targets[0], targets2);
					for (let i = 1; i < targets.length; i++) {
						const val = check(targets[i], targets2);
						if (val > maxVal) {
							ix = i;
							maxVal = val;
						}
					}
					if (maxVal <= 0 && (!forced || ok)) return ok;
				} finally {
					exitCache();
				}

				targets[ix].classList.add("selected");
				selected.add(targets[ix]);
				game.check();
				if (selected.length >= range[0]) ok = true;
				if (selected.length === range[1]) return true;
			}
		} finally {
			exitCache();
		}
		return ok;
	}, FLAG.onai);
}
