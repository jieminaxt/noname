import { lib } from "../../../noname.js";

// ============================================================
// 开关读取：undefined 视为开启，严格 === false 才算关闭
// ============================================================
export const FLAG = {
	onai: () => lib.config.extension_自用ai_onai !== false,
	checkopt: () => lib.config.extension_自用ai_checkopt !== false,
	brain: () => lib.config.extension_自用ai_brain !== false,
	profile: () => lib.config.extension_自用ai_aiprofile === true,
};

// ============================================================
// patch 基建：防重入 + 原函数备份 + 开关回退包装
// 每个模块用独立命名空间，避免互相覆盖
// ============================================================
const backups = new Map();

export function backup(obj, key, ns) {
	const id = ns + ":" + key;
	if (!backups.has(id)) {
		backups.set(id, obj[key]);
	}
	return backups.get(id);
}

/**
 * @param { object } obj
 * @param { string } key
 * @param { string } ns 命名空间（防重入标记）
 * @param { (original: any) => Function } factory 接收原函数，返回新函数（仅执行一次）
 * @param { () => boolean } enabled 开关判断，false 时透传原函数
 */
export function patch(obj, key, ns, factory, enabled) {
	if (backups.has(ns + ":" + key)) return;
	const original = backup(obj, key, ns);
	const replacement = factory(original);
	obj[key] = function (...args) {
		if (!enabled()) {
			return original.apply(this, args);
		}
		try {
			return replacement.apply(this, args);
		} catch (e) {
			console.log("[自用ai]", ns + "." + key, e);
			return original.apply(this, args);
		}
	};
}

export function hasPatched(ns) {
	for (const id of backups.keys()) {
		if (id.startsWith(ns + ":")) return true;
	}
	return false;
}
