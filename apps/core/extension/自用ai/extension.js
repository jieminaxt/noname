import { lib, game, ui, get, ai, _status } from "../../noname.js";
import { bindProfileFlag, bindDumpFlag, profFlushNow } from "./js/profile.js";
import { installFuncKeyCache, installMemoLayer, installSelectableCache, installChooseRewrite } from "./js/perf.js";
import { install as installCheckopt } from "./js/checkopt.js";
import { installBrain } from "./js/brain.js";

export const type = "extension";

export default function () {
	return {
		name: "自用ai",
		arenaReady: function () { },
		content: function (config, pack) { },
		prepare: function () { },
		precontent: function () {
			// 安装顺序保证：所有 patch 必须在 CacheContext 代理首次
			// 访问 get.effect 等方法之前完成（代理 wrapFunc 在首次
			// 访问时闭包捕获函数引用），precontent 时机满足
			installFuncKeyCache();
			installMemoLayer();
			installSelectableCache();
			installChooseRewrite();
			installCheckopt();
			installBrain();
			bindProfileFlag(() => lib.config.extension_自用ai_aiprofile === true);
			bindDumpFlag(() => lib.config.extension_自用ai_dumpfile === true);
			if (lib.config.extension_自用ai_dumpfile === true) {
				setInterval(() => { profFlushNow(); }, 30000);
			}
		},
		config: {
			onai: {
				name: "ai性能优化",
				intro: "替换底层ai计算：决策期记忆化重型get计算、selectable缓存、贪心选择器重写；关闭后回退原函数",
				init: true,
			},
			checkopt: {
				name: "选牌检查优化",
				intro: "合并手牌重排、缓存技能事件选牌过滤结果，并缓存装备判定（get.owner/canEquip 决策期内复用），大量牌与装备场景更流畅；关闭后恢复原版行为",
				init: true,
			},
			brain: {
				name: "ai行为决策增强",
				intro: "持有价值场景系数（满血桃贬值/残血桃升值/无威胁闪贬值）与斩杀奖励、伤害溢出惩罚；关闭后回退原版估值",
				init: true,
			},
			aiprofile: {
				name: "ai耗时统计",
				intro: "决策耗时超过50ms时在控制台与游戏日志输出分项耗时；默认关闭",
				init: false,
			},
			dumpfile: {
				name: "性能落盘(真机导出)",
				intro: "配合ai耗时统计：把峰值行累积写入扩展目录 extension/自用ai/ai-perf-dump.txt（fs不可用回退localStorage，键 extension_自用ai_perf_dump）；每30s与对局结束刷新一次。真机验证后用文本发回分析",
				init: false,
			},
		},
		help: {},
		package: {
			character: { character: {}, translate: {} },
			card: { card: {}, translate: {}, list: [] },
			skill: { skill: {}, translate: {} },
			intro: "性能层多文件重构 + AI行为决策层：memo体系/selectable缓存/贪心选择器重写/updatehl去抖/技能事件选牌缓存/持有价值场景系数/斩杀与溢出修正",
			author: "无名玩家",
			diskURL: "",
			forumURL: "",
			version: "2.0",
		},
		files: { "character": [], "card": [], "skill": [], "audio": [] },
		connect: false
	};
};
