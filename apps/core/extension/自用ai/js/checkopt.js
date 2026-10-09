import { lib, game, ui, get, _status } from "../../../noname.js";
import { FLAG, patch, backup } from "./core.js";

const NS = "checkopt";

// ============================================================
// 选牌检查优化（开关：自用ai_checkopt）
// 1) Card.updateTransform 不再每张手牌同步调用 ui.updatehl()：
//    updatehl 是全量手牌重排（内含 getComputedStyle 强制 recalc
//    和 offsetWidth 强制 layout），弃牌类事件下每次 game.check
//    为 O(N²) 布局抖动。改为 ui.updatehlSoon() 去抖合并为一次。
// 2) 技能事件（event.skill）也启用选牌过滤缓存：原版 useCache
//    在 event.skill 时整体禁用，技能选牌每次 check 都全量重算
//    filterCard（cardEnabled+cardUsable 遍历全部技能 mod），是
//    "牌多卡顿"的主要来源。缓存键纳入全部三类选择状态，并在
//    filter 函数引用变化时整体失效，保证正确性。
// 3) 装备判定缓存：装备牌 selectTarget=-1，game.check 的
//    filterCard 需对全场角色跑 hasPlayer2(filterTarget)，每角色
//    触发 canEquip（player.js canEquip）→ get.owner 全量 DOM
//    父节点扫描（get/index.js owner）。决策事件内牌不移动、装备
//    区与槽位不变，故按 (事件,卡) 缓存 get.owner 结果（校验
//    parentNode/removing/feichu/emptyequip 状态，状态变化即失效），
//    并按 (事件,玩家,候选牌,replace) 缓存 canEquip 结果（校验装备
//    数量与槽位指纹）。关闭后回退原函数。
// 4) 决策期 VCard / modable 技能列表缓存：每次 filterCard 都会把
//    候选实体牌转成 VCard（cardEnabled/cardUsable 各一次），VCard
//    构造函数对每个属性走 get.name/suit/color/number/nature →
//    game.checkMod；而 checkMod 默认分支每次重算玩家 modable 技能
//    列表（getSkills+expandSkills+filter+sort）。60+ 手牌场景这两条
//    链是决策耗时大头，且同一决策事件内结果稳定：VCard 按
//    (事件,实体牌,参数) 缓存（命中校验 parentNode/removing/feichu/
//    owner 技能指纹/实体牌 skills 指纹），getModableSkills 按
//    (事件,玩家) 缓存（校验技能集合指纹）。关闭后回退原函数。
// 5) 决策期 AI 响应估值缓存：敌方 AI 估算"目标手里有没有闪/杀"时（get.effect_use
//    → sha 系卡的 mayHaveShan / 决斗与南蛮的 mayHaveSha）对目标手牌做全量扫描，
//    60+ 手牌下 sha 系单目标估值 6~9ms、决斗约 10ms，且同一决策内对每个可打牌
//    重复计算。决策事件内目标手牌/技能/体力不变（noname 自身也按事件做
//    putTempCache），按 (事件,目标,观察者,type,ignore,rvt) 缓存，命中校验
//    hp/maxHp/hujia/isZhu/手牌结构指纹/技能集合指纹。仅缓存确定性结果（rvt 为
//     "count"/"odds"），默认布尔分支依赖 getRand 随机数，不缓存。关闭后回退原函数。
// 6) 决策期已知手牌 getKnownCards 缓存：万箭/南蛮/杀系 AI 的响应估计（canShan/canSha
//    闭包与部分 getKnownCards 直调）在敌方决策里对同一 (目标,观察者) 反复做 O(手牌)
//    全扫，60+ 手牌下单次 6~15ms。决策事件内目标手牌与技能集合不变，按
//    (事件,目标,观察者,过滤器) 缓存，命中校验双方体力/手牌结构/技能集合指纹，任一
//    变化即失效；命中返回数组副本防调用方改坏缓存。函数/对象过滤器旁路原函数。
//    关闭后回退原函数。
// 7) 顺手/过河 AI 拆目标判定缓存：shunshou/guohe 的 ai.result.target 对每个目标做
//    三区（手牌/装备/判定）可拿/可弃全扫并逐牌估值，get.value 侧按 countPlayer 对
//    全场角色反复调用，get.effect_use 估值时同样再次命中同一函数，同一决策内对
//    (玩家,目标) 重复计算。决策事件内目标三区结构/体力/技能集合不变（noname 自身
//    同样按事件做 putTempCache），按 (事件,玩家,目标) 缓存，命中校验双方体力/技能
//    集合指纹 + 目标三区结构指纹（手牌数、装备/判定区牌名+cardid+viewAs），任一变化
//    即失效。仅缓存确定性结果：两函数的判定体均不含 getRand 随机数消耗。关闭后
//    回退原函数。
// ============================================================

export function ensureUpdatehlSoon() {
	if (!ui.updatehlSoon) {
		ui.updatehlSoon = function () {
			if (ui._updatehlSoon) {
				clearTimeout(ui._updatehlSoon);
			}
			ui._updatehlSoon = setTimeout(function () {
				delete ui._updatehlSoon;
				ui.updatehl();
			});
		};
	}
}

const uppercase = (t) => t[0].toUpperCase() + t.slice(1);

export function install() {
	ensureUpdatehlSoon();

	// 8.1 updateTransform：复刻原版，仅将 updatehl 换成去抖版
	if (!hasOwn(lib.element.Card.prototype, "updateTransformPatched")) {
		patch(lib.element.Card.prototype, "updateTransform", NS, (original) => function (bool, delay) {
			if (delay) {
				var that = this;
				setTimeout(function () {
					that.updateTransform(that.classList.contains("selected"));
				}, delay);
			} else {
				if (_status.event.player != game.me) {
					return;
				}
				if (this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.parentNode == ui.me) {
					ui.updatehlSoon();
				}
				if (this._transform && this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.parentNode == ui.me && (!_status.mousedown || _status.mouseleft) && (!this.parentNode.parentNode.classList.contains("scrollh") || game.layout == "long2" || game.layout == "nova")) {
					if (bool) {
						this.style.transform = this._transform + " translateY(-20px)";
					} else {
						this.style.transform = this._transform || "";
					}
				}
			}
		}, FLAG.checkopt);
	}

	// 8.2 缓存可用性判断：复刻 game.check 的 filterCache，multitarget
	// 检查一并纳入；按类型独立判断（原版是全局一票否决）
	const checkCacheable = function (event, type) {
		if (event.multitarget) {
			return false;
		}
		if (get.select(event[`select${uppercase(type)}`])[1] < 0) {
			return false;
		}
		const cardinfo = get.info(get.card() || {});
		if (cardinfo && cardinfo.complexTarget) {
			return false;
		}
		if (type === "button") {
			type = "select";
		}
		return !event[`complex${uppercase(type)}`];
	};

	// 8.3 processSelection：复刻原版，技能事件的缓存键纳入全部三类
	// 选择状态，且 filter 引用变化时整体失效；非技能事件的键值语义
	// 与原版完全一致
	patch(game.Check, "processSelection", NS, (original) => function ({ type, items, event, useCache, isSelectable }) {
		let ok = true,
			auto;
		let selectableItems = false;

		const uiSelected = ui.selected[`${type}s`];
		const range = get.select(event[`select${uppercase(type)}`]);

		if (event.forceAuto && uiSelected.length === range[1]) {
			auto = true;
		} else if (range[0] !== range[1] || range[0] > 1) {
			auto = false;
		}

		let cache;
		let firstCheck = false;

		if (useCache) {
			const filter = event[`filter${uppercase(type)}`];
			if (!event[`_${type}Choice`]) {
				event[`_${type}Choice`] = {};
			}
			if (event.skill && event[`_${type}Choice`]._filter !== filter) {
				event[`_${type}Choice`] = { _filter: filter };
			}
			let cacheId = 0;
			for (let Type of ["button", "card", "target"]) {
				if (type === Type && !event.skill) {
					break;
				}
				// 原版此处把 target 转换为 player 是永不可达死代码
				// （type===Type 在转换前就 break，ui.selected 也没有
				// players 键，只有 targets）。技能事件需要把 target
				// 选择状态纳入缓存键时，直接读真实的 targets 数组。
				const arr = Type === "target" ? ui.selected.targets : ui.selected[`${Type}s`];
				const idKey = Type === "target" ? "playerid" : `${Type}id`;
				arr.forEach(i => (cacheId ^= i[idKey]));
				if (type === Type) {
					break;
				}
			}
			if (!event[`_${type}Choice`][cacheId]) {
				event[`_${type}Choice`][cacheId] = [];
				firstCheck = true;
			}
			cache = event[`_${type}Choice`][cacheId];
		}

		items.forEach(item => {
			let selectable;
			if (!lib.filter.cardAiIncluded(item)) {
				selectable = false;
			} else if (!useCache) {
				selectable = isSelectable(item, event);
			} else {
				if (!firstCheck) {
					selectable = cache.includes(item);
				} else {
					selectable = isSelectable(item, event);
					if (selectable) {
						cache.push(item);
					}
				}
			}

			if (range[1] <= -1) {
				if (selectable) {
					item.classList.add("selected");
					uiSelected.add(item);
				} else {
					item.classList.remove("selected");
					uiSelected.remove(item);
				}
				if (item.updateTransform) {
					item.updateTransform(selectable);
				}
			} else {
				if (selectable && uiSelected.length < range[1]) {
					item.classList.add("selectable");
				} else {
					item.classList.remove("selectable");
				}
			}

			if (item.classList.contains("selectable")) {
				selectableItems = true;
			} else if (item.classList.contains("selected")) {
				item.classList.add("selectable");
			}

			game.callHook(`check${uppercase(type)}`, [item, event]);
		});

		if (event[`${type}Required`] && uiSelected.length === 0) {
			ok = false;
		} else if (uiSelected.length < range[0] && (!event.forced || selectableItems || event.complexSelect)) {
			ok = false;
		}

		if (typeof event.custom?.add?.[type] == "function") {
			event.custom.add[type]();
		}

		return { ok, auto };
	}, FLAG.checkopt);

	// 8.4 card/button/target：复刻原版，useCache 改为按类型自行计算，
	// 技能事件（event.skill）也允许启用缓存
	patch(game.Check, "card", NS, (original) => function (event, useCache) {
		const player = event.player;
		const cards = player.getCards(event.position);
		const isSelectable = (card, event) => {
			if (card.classList.contains("uncheck")) {
				return false;
			}
			if (player.isOut()) {
				return false;
			}
			if (!lib.filter.cardRespondable(card, player)) {
				return false;
			}
			return event.filterCard(card, player);
		};
		return game.Check.processSelection({ type: "card", items: cards, event, useCache: checkCacheable(event, "card"), isSelectable });
	}, FLAG.checkopt);

	patch(game.Check, "button", NS, (original) => function (event, useCache) {
		const player = event.player;
		const buttons = event.dialog.buttons;
		const isSelectable = (button, event) => {
			if (!lib.filter.buttonIncluded(button)) {
				return false;
			}
			if (button.classList.contains("unselectable")) {
				return false;
			}
			return event.filterButton(button, player);
		};
		return game.Check.processSelection({ type: "button", items: buttons, event, useCache: checkCacheable(event, "button"), isSelectable });
	}, FLAG.checkopt);

	patch(game.Check, "target", NS, (original) => function (event, useCache) {
		const player = event.player;
		const card = get.card();
		const targets = game.players.slice();
		if (event.deadTarget || (card && get.info(card)?.deadTarget)) {
			targets.addArray(game.dead);
		}
		const isSelectable = (target, event) => {
			if (game.chess && !(event.chessForceAll || (card && get.info(card)?.chessForceAll)) && player && get.distance(player, target, "pure") > 7) {
				return false;
			}
			if (target.isOut() && !event.includeOut && !(event.skill && get.info(event.skill)?.includeOut) && !(card && get.info(card)?.includeOut)) {
				return false;
			}
			if (target.classList.contains("uncheck")) {
				return false;
			}
			return event.filterTarget(card, player, target);
		};
		return game.Check.processSelection({ type: "target", items: targets, event, useCache: checkCacheable(event, "target"), isSelectable });
	}, FLAG.checkopt);

	// 8.5 装备判定缓存：get.owner 结果按 (事件, 卡) 缓存，canEquip
	// 按 (事件, 玩家, 候选牌, replace) 缓存。均校验状态指纹，状态
	// 变化（牌移动 / 装备增减 / 槽位切换）即失效，保证正确性。
	installEquipCache();

	// 8.6 决策期 VCard 构造 / modable 技能列表缓存（见文件头注释 4）
	installViewCache();
	// 8.7 决策期 AI 响应估值缓存（见文件头注释 5）
	installResponseEstimateCache();
	// 8.8 决策期已知手牌缓存（见文件头注释 6）
	installKnownCardsCache();
	// 8.9 顺手/过河 AI 拆目标判定缓存（见文件头注释 7）
	installTrickResultCache();
}

// 事件级缓存存储：WeakMap 以事件对象为键，事件结束即自动回收
const ownerStore = new WeakMap();
const canEquipStore = new WeakMap();

function slotFingerprint(player) {
	const es = player.expandedSlots || {};
	const ds = player.disabledSlots || {};
	let fp = player.getVCards("e").length + "|";
	for (const k in es) {
		fp += k + (es[k] ? 1 : 0);
	}
	fp += "|";
	for (const k in ds) {
		fp += k + (ds[k] ? 1 : 0);
	}
	return fp;
}

function equipCacheKey(name) {
	if (typeof name === "string") {
		return "s:" + name;
	}
	const t = get.itemtype(name);
	if (t === "card") {
		return "c:" + name.name + ":" + name.cardid;
	}
	if (t === "vcard") {
		return "v:" + name.name + ":" + (name.cards || []).map(c => c.cardid).join("|");
	}
	return "o:" + name;
}

function installEquipCache() {
	if (hasOwn(get, "ownerCached")) {
		return;
	}
	get.ownerCached = true;

	// 8.5.1 get.owner：决策事件内牌不移动，同事件内重复判定直接复用。
	// 缓存附带 parentNode 与 removing/feichu/emptyequip 状态指纹，
	// 牌移动或状态变化（如"失去"动画中的 removing）即命中失效。
	// timeout+destiny 组合是原函数的分支入口，不做缓存。
	patch(get, "owner", NS, (original) => function (card, method) {
		const event = _status.event;
		if (!card || !event || (card.timeout && card.destiny) || !card.parentNode) {
			return original.call(this, card, method);
		}
		let store = ownerStore.get(event);
		if (!store) {
			store = new Map();
			ownerStore.set(event, store);
		}
		const key = card.cardid + "|" + (method || "");
		const parent = card.parentNode;
		const removing = card.classList.contains("removing");
		const feichu = card.classListContains ? card.classListContains("feichu") : card.classList.contains("feichu");
		const emptyequip = card.classListContains ? card.classListContains("emptyequip") : card.classList.contains("emptyequip");
		const ent = store.get(key);
		if (ent && ent.parent === parent && ent.removing === removing && ent.feichu === feichu && ent.emptyequip === emptyequip) {
			return ent.ret;
		}
		const ret = original.call(this, card, method);
		store.set(key, { parent, removing, feichu, emptyequip, ret });
		return ret;
	}, FLAG.checkopt);

	// 8.5.2 player.canEquip：决策事件内装备区与槽位不变，按候选牌
	// 与 replace 缓存结果，并用装备数量/槽位指纹兜底失效。
	patch(lib.element.Player.prototype, "canEquip", NS, (original) => function (name, replace) {
		const event = _status.event;
		if (!event) {
			return original.call(this, name, replace);
		}
		let playerStore = canEquipStore.get(event);
		if (!playerStore) {
			playerStore = new Map();
			canEquipStore.set(event, playerStore);
		}
		let store = playerStore.get(this);
		if (!store) {
			store = new Map();
			playerStore.set(this, store);
		}
		const key = equipCacheKey(name) + "|" + (replace ? 1 : 0) + "|" + slotFingerprint(this);
		if (store.has(key)) {
			return store.get(key);
		}
		const ret = original.call(this, name, replace);
		store.set(key, ret);
		return ret;
	}, FLAG.checkopt);
}

// ============================================================
// 8.7 决策期 AI 响应估值缓存
// ============================================================

// 事件级缓存：mayHaveShan / mayHaveSha
const mhsStore = new WeakMap();
const mssStore = new WeakMap();

function responseStore(storeMap, event) {
	let store = storeMap.get(event);
	if (!store) {
		store = new Map();
		storeMap.set(event, store);
	}
	return store;
}

function handCountO1(player) {
	const node = player.node;
	if (!node) return 0;
	let n = 0;
	if (node.handcards1) n += node.handcards1.childNodes.length;
	if (node.handcards2) n += node.handcards2.childNodes.length;
	return n;
}

function installResponseEstimateCache() {
	if (hasOwn(lib.element.Player.prototype, "mayHaveResponseCached")) {
		return;
	}
	lib.element.Player.prototype.mayHaveResponseCached = true;

	// 8.7.1 player.mayHaveShan / mayHaveSha：敌方 AI 估算"目标手里有没有闪/杀"
	// 时会对目标手牌做全量扫描（getKnownCards + hs 两轮），60+ 手牌下 sha 系
	// 单目标估值 6~9ms、决斗 10ms，且同一决策内对每个破坏/响应候选反复重算。
	// 决策事件内目标手牌与技能集合不变（noname 自身同样按事件做 putTempCache），
	// 故按 (事件,目标,观察者,type,ignore,rvt) 缓存；命中校验 hp / maxHp / hujia /
	// isZhu / 手牌结构指纹 / 技能集合指纹，任一变化即失效。只缓存确定性结果
	// （rvt 为 "count"/"odds"），默认布尔分支依赖 getRand 随机数，不做缓存。
	function makeResponseEstimateCache(keyNs, storeMap, fnName) {
		patch(lib.element.Player.prototype, fnName, NS, (original) => function (viewer, type, ignore, rvt) {
			if (rvt !== "count" && rvt !== "odds") {
				return original.apply(this, arguments);
			}
			const event = _status.event;
			const ignoreOk = ignore === null || ignore === undefined || typeof ignore === "boolean";
			if (!event || get.itemtype(viewer) !== "player" || !ignoreOk) {
				return original.apply(this, arguments);
			}
			const me = this;
			const store = responseStore(storeMap, event);
			const key = keyNs + "|" + me.playerid + "|" + viewer.playerid + "|" + (type || "") + "|" + String(ignore) + "|" + rvt;
			const fp = me.hp + "|" + me.maxHp + "|" + me.hujia + "|" + (me.isZhu ? 1 : 0) + "|" + handCountO1(me) + "|" + modableFingerprint(me);
			const ent = store.get(key);
			if (ent && ent.fp === fp) {
				return ent.ret;
			}
			const ret = original.apply(this, arguments);
			store.set(key, { fp, ret });
			return ret;
		}, FLAG.checkopt);
	}
	makeResponseEstimateCache("shan", mhsStore, "mayHaveShan");
	makeResponseEstimateCache("sha", mssStore, "mayHaveSha");
}

function hasOwn(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
}

// ============================================================
// 8.8 决策期已知手牌 getKnownCards 缓存
// ============================================================

// 事件级缓存：同一决策事件内 getKnownCards(目标,观察者) 结果不变
const gkcStore = new WeakMap();

// 过滤器参数串化：字符串/数组返回稳定串，函数/对象属调用方现场闭包，不缓存
function gkcFilterKey(filter) {
	if (filter === undefined || filter === null) {
		return "";
	}
	if (typeof filter === "string") {
		return "s:" + filter;
	}
	if (Array.isArray(filter)) {
		return "a:" + filter.join(",");
	}
	return null;
}

function installKnownCardsCache() {
	if (hasOwn(lib.element.Player.prototype, "getKnownCardsCached")) {
		return;
	}
	lib.element.Player.prototype.getKnownCardsCached = true;
	// AOE/杀系 AI 的响应估计（wanjian/nanman 的 canShan/canSha 闭包、8.7 之外的
	// getKnownCards 直调路径）在敌方决策里对 (目标,观察者) 反复做 O(手牌) 全扫，
	// 60+ 手牌下单次 6~15ms。决策事件内目标手牌与技能集合不变（noname 自身也按
	// 事件做 putTempCache），按 (事件,目标,观察者,过滤器) 缓存，命中校验体力 / 手牌
	// 结构 / 双方技能集合指纹，任一变化即失效。命中返回数组副本，避免调用方改坏
	// 缓存。仅缓存无过滤器或字符串/数组这类稳定过滤器，函数/对象过滤器旁路原函数。
	patch(lib.element.Player.prototype, "getKnownCards", NS, (original) => function (other, filter) {
		if (gkcFilterKey(filter) === null) {
			return original.apply(this, arguments);
		}
		const event = _status.event;
		if (!event || get.itemtype(other) !== "player") {
			return original.apply(this, arguments);
		}
		const me = this;
		const store = responseStore(gkcStore, event);
		const key = "gkc|" + me.playerid + "|" + other.playerid + "|" + gkcFilterKey(filter);
		const fp =
			me.hp + "|" + me.maxHp + "|" + me.hujia + "|" + (me.isZhu ? 1 : 0) + "|" + handCountO1(me) + "|" +
			modableFingerprint(me) + "|" + modableFingerprint(other);
		const ent = store.get(key);
		if (ent && ent.fp === fp) {
			return Array.from(ent.ret);
		}
		const ret = original.apply(this, arguments);
		store.set(key, { fp, ret });
		return ret;
	}, FLAG.checkopt);
}

// ============================================================
// 8.9 顺手/过河 AI 拆目标判定缓存
// ============================================================

// 事件级缓存存储：WeakMap 以事件对象为键，事件结束即自动回收
const trickResultStore = new WeakMap();

// 防重入标记：真实时序中扩展 precontent 先于卡牌包加载（importCardPack），
// 此时 lib.card.shunshou 尚不存在，需挂到 lib.onload（boot 在卡牌加载完成
// 后消费）延迟安装；不能用对象属性标记（对象本身还不存在），故用模块级标记。
let trickResultCacheInstalled = false;

// 目标三区结构指纹：手牌数 + 装备区/判定区每张牌的 (name,cardid,viewAs)。
// 覆盖 ai.result.target 对 getGainableCards/getDiscardableCards 三区全扫的
// 全部判定输入：牌增减、装备/判定变化、viewAs 变化都会改变指纹。
function trickZoneFingerprint(node) {
	if (!node || !node.childNodes) return "";
	let fp = "";
	for (const c of node.childNodes) {
		if (!c || !c.name) continue;
		fp += (fp ? "," : "") + c.name + ":" + (c.cardid || "?") + (c.viewAs ? "#" + c.viewAs : "");
	}
	return fp;
}

function trickResultFingerprint(player, target) {
	return (
		player.playerid + "|" + player.hp + "|" + player.maxHp + "|" + player.hujia + "|" + (player.isZhu ? 1 : 0) + "|" +
		modableFingerprint(player) + "|" +
		target.playerid + "|" + target.hp + "|" + target.maxHp + "|" + target.hujia + "|" + (target.isZhu ? 1 : 0) + "|" +
		handCountO1(target) + "|" +
		trickZoneFingerprint(target.node.equips) + "|" +
		trickZoneFingerprint(target.node.judges)
	);
}

function installTrickResultCache() {
	// 真实浏览器时序：扩展 precontent 远早于 importCardPack，标准卡牌定义
	// （lib.card.shunshou/guohe）尚未注入。卡牌未就绪时不能直接 patch，
	// 挂 lib.onload 延迟到卡牌加载完成后再装；若 onload 也已被消费（说明
	// 启动早已完成、卡牌必然已就绪），则不再重试（该路径只会在测试等
	// 手工 loadCard 场景命中，届时 shunshou 已存在直接走下方正常安装）。
	const shCard = lib.card && lib.card.shunshou;
	const ghCard = lib.card && lib.card.guohe;
	if (!shCard || !ghCard || !shCard.ai || !ghCard.ai || !shCard.ai.result || !ghCard.ai.result) {
		if (Array.isArray(lib.onload)) {
			lib.onload.push(installTrickResultCache);
		}
		return;
	}
	if (trickResultCacheInstalled) {
		return;
	}
	trickResultCacheInstalled = true;

	// 8.9.1 shunshou.ai.result.target / guohe.ai.result.target：拆目标判定对
	// 目标三区做可拿/可弃全扫（getGainableCards/getDiscardableCards → 每张牌
	// canBeGained/canBeDiscarded 逐 skill mod），get.value 侧按 countPlayer 对
	// 全场角色反复调用、get.effect_use 估值时再次命中同一函数。决策事件内目标
	// 三区结构/体力/技能集合不变，按 (事件,玩家,目标) 缓存，命中校验双方体力/
	// 技能集合指纹 + 目标三区结构指纹，任一变化即失效。判定体不含 getRand，结果
	// 确定可缓存。关闭后回退原函数。
	function makeTrickResultCache(name, obj) {
		// 注意：patch/backup 的去重键是 ns+":"+key，不含对象。game.Check.target
		// 已占用 "checkopt:target"，故此处必须用独立命名空间，否则会被误判为
		// 已打补丁而静默跳过。
		patch(obj, "target", NS + ".trick." + name, (original) => function (player, target) {
			const event = _status.event;
			if (!event || get.itemtype(player) !== "player" || get.itemtype(target) !== "player") {
				return original.apply(this, arguments);
			}
			const store = responseStore(trickResultStore, event);
			const key = name + "|" + player.playerid + "|" + target.playerid;
			const fp = trickResultFingerprint(player, target);
			const ent = store.get(key);
			if (ent && ent.fp === fp) {
				return ent.ret;
			}
			const ret = original.apply(this, arguments);
			store.set(key, { fp, ret });
			return ret;
		}, FLAG.checkopt);
	}
	makeTrickResultCache("shunshou", lib.card.shunshou.ai.result);
	makeTrickResultCache("guohe", lib.card.guohe.ai.result);
}

// ============================================================
// 8.6 决策期 VCard / modable 技能列表缓存
// ============================================================

// 事件级缓存存储：WeakMap 以事件对象为键，事件结束即自动回收
const vcardStore = new WeakMap();
const modableStore = new WeakMap();

function hasCardClass(card, name) {
	return card.classList ? (card.classListContains ? card.classListContains(name) : card.classList.contains(name)) : false;
}

function objectKeys(fp, obj) {
	if (obj) fp += "|" + Object.keys(obj).join(",");
	return fp;
}

// 玩家技能集合指纹：覆盖 getSkills/filterSkills 的全部输入集合。
// 集合内容变化（技能增删 / 禁用 / 封禁 / 装备变化）→ 指纹变化 → 缓存失效。
function modableFingerprint(player) {
	let fp = (player.skills || []).join(",");
	fp = objectKeys(fp, player.additionalSkills);
	fp = objectKeys(fp, player.tempSkills);
	fp = objectKeys(fp, player.forbiddenSkills);
	fp = objectKeys(fp, player.disabledSkills);
	if (player.hiddenSkills && player.hiddenSkills.length) fp += "|h" + player.hiddenSkills.join(",");
	if (player.invisibleSkills && player.invisibleSkills.length) fp += "|i" + player.invisibleSkills.join(",");
	const blocker = player.storage && player.storage.skill_blocker;
	if (blocker && blocker.length) fp += "|b" + blocker.join(",");
	const es = (player.vcardsMap && player.vcardsMap.equips) || [];
	if (es.length) fp += "|e" + es.map(c => c.name + ":" + c.cardid).join(",");
	return fp;
}

function autoViewAsKey(card, cards, owner) {
	let c = "u";
	if (cards === "card") c = "c";
	else if (cards === false) c = "0";
	else if (typeof cards === "string") c = "s:" + cards;
	let o = "u";
	if (owner === false) o = "0";
	else if (owner && owner.playerid) o = "p:" + owner.playerid;
	return card.cardid + "|" + c + "|" + o;
}

// VCard 构造时套用的 owner：显式 player → 用之；owner=false → 无 owner（不套
// checkMod）；否则解析实体牌实际归属（走 8.5 get.owner 缓存，事件内免费）。
function vcardOwner(owner, card) {
	if (owner === false) return false;
	if (owner && owner.playerid) return owner;
	return get.owner(card) || false;
}

function installViewCache() {
	if (hasOwn(get, "autoViewAsCached")) {
		return;
	}
	get.autoViewAsCached = true;

	// 8.6.1 get.autoViewAs：实体牌 → VCard 的确定性构造按
	// (事件, 实体牌, 参数) 缓存。命中校验 parentNode / removing /
	// feichu / owner 技能指纹 / 实体牌 skills 指纹，任一变化（牌
	// 移动 / 失去 / 技能增删）即失效重建，保证正确性。命中返回
	// 浅克隆（字段值复用缓存、cards/skills/storage 重新拷引用），
	// 防止技能侧对返回 VCard 的属性写入泄漏到后续调用。
	patch(get, "autoViewAs", NS, (original) => function (card, cards, owner) {
		if (!(card instanceof lib.element.Card) || (cards !== undefined && cards !== "card" && cards !== false)) {
			return original.apply(this, arguments);
		}
		const event = _status.event;
		if (!event || !card.parentNode) {
			return original.apply(this, arguments);
		}
		const removing = hasCardClass(card, "removing");
		const feichu = hasCardClass(card, "feichu");
		if (removing || feichu) {
			return original.apply(this, arguments);
		}
		let store = vcardStore.get(event);
		if (!store) {
			store = new Map();
			vcardStore.set(event, store);
		}
		const key = autoViewAsKey(card, cards, owner);
		const ent = store.get(key);
		const realOwner = vcardOwner(owner, card);
		const modfp = realOwner ? modableFingerprint(realOwner) : "";
		const skillsfp = card.skills ? card.skills.join(",") : "";
		if (ent && ent.parent === card.parentNode && ent.removing === removing && ent.feichu === feichu && ent.modfp === modfp && ent.skillsfp === skillsfp) {
			const clone = Object.assign({}, ent.vcard);
			clone.cards = ent.vcard.cards ? ent.vcard.cards.slice() : [];
			clone.skills = ent.vcard.skills ? ent.vcard.skills.slice() : [];
			clone.storage = Object.assign({}, ent.vcard.storage);
			return clone;
		}
		const vcard = original.apply(this, arguments);
		store.set(key, { parent: card.parentNode, removing, feichu, modfp, skillsfp, vcard });
		return vcard;
	}, FLAG.checkopt);

	// 8.6.2 player.getModableSkills：checkMod 默认分支每次重算 modable
	// 技能列表（getSkills+expandSkills+filter+sort），是 VCard 构造之外的
	// 第二个热点。同一事件内技能集合未变时直接复用数组；指纹变化即重算。
	patch(lib.element.Player.prototype, "getModableSkills", NS, (original) => function () {
		const event = _status.event;
		if (!event) {
			return original.apply(this, arguments);
		}
		let store = modableStore.get(event);
		if (!store) {
			store = new Map();
			modableStore.set(event, store);
		}
		const fp = modableFingerprint(this);
		const ent = store.get(this);
		if (ent && ent.fp === fp) {
			return ent.skills;
		}
		const skills = original.apply(this, arguments);
		store.set(this, { fp, skills });
		return skills;
	}, FLAG.checkopt);
}
