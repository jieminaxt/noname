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

function hasOwn(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
}
