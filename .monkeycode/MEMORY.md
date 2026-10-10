# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
User instruction entries should follow this format:

[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
Entries discovered by the Agent during task execution should follow this format:

[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Deduplication Strategy
- Before adding a new entry, check for similar or identical instructions.
- If a duplicate is found, skip the new entry or merge it with the existing one.
- When merging, update the context or date information.
- This helps avoid redundant entries and keeps the memory file tidy.

## Entries

[User Instruction Summary]
- Date: 2026-09-19
- Context: 用户要求把 game.check 性能优化从本体代码移植到扩展
- Instructions:
  - 本体代码（apps/core/noname/）只读，所有优化/修复/新功能一律写到扩展里实现
  - 扩展 patch 必须添加 config 开关，开关关闭时运行时回退到原版行为
  - 项目文档：根目录 agent.md（Agent 工作指南）与 知识库.md（技术知识沉淀正本）
  - 知识库正本是根目录 知识库.md；.monkeycode/MEMORY.md 仅作轻量索引，超 150 行需合并压缩

[Project Knowledge Summary]
- Date: 2026-10-07
- Context: 用户反馈装上扩展后 AI 不出牌，Agent 定位并修复两处正确性 bug；后续三轮压测与微优化
- Category: Troubleshooting & Debugging
- Instructions:
  - **ui.selected 三数组键名是 buttons/cards/targets（无 players）**——game.Check.processSelection 的 `Type==="target"→Type="player"` 是死代码，扩展若访问 ui.selected.players 会 undefined.forEach 崩溃；技能事件读 ui.selected.targets + playerid
  - **ai.basic 三选择器缓存生命周期契约**：原版只在"打分循环段"临时 CacheContext.setCacheContext(new)+setInCacheEnvironment(true)，打分完立即 remove；get.selectableCards()、game.check()、技能字符串分支（ui.click.skill）、递归 chooseCard 全部在缓存环境外。扩展必须按打分段进/出缓存，包到 finally 会让 game.check() 的 filterCard 重算被缓存，特定技能路径静默卡死
  - **get.card memo 键须含已选牌内容指纹**（cardid/name 序列），不能只用数量——viewAs 函数依赖 ui.selected.cards 内容，数量相同但换牌会返回过期 VCard
  - **onai 不出牌根因（2026-10-07）**：P4 重写跳过 game.check() 直接 return true 导致 selectable classList/技能按钮状态过期，AI 估值全负→进回合弃牌。修复：game.check() 一律放 selected.add 之后、ok/range[1] 判断之前（对齐原版位置）。验证：P4-only 用牌 4→33，全开 6→27
  - **test_game 对局有原版随机卡死与 isOnline2 报错，勿误判为扩展 bug**：纯原版也偶发开局冻结；game.over 渲染时 `clients[i].isOnline2 is not a function`（原版 game/index.js:7069，clients 混入非 Player）
  - 冻结诊断法：对局日志尾部"连续多秒无新增文本"= event 泵冻结信号；真机 hook ai.basic 三函数计时 >100ms 或抛错定位决策瓶颈
  - **真机对比方法（probe40.mjs）**：同一套 versus 4 人 test_game，A=扩展全开、B=纯原版各跑 120s；precontent 在开局时才执行，须先等对局开始再 wrap ai.basic（否则被 patch 覆盖）；evaluate 内不能引用 node 侧常量须内联；test_game ~10-20% 概率开局卡死，需坏局检测+重试
  - 修复后基线（120s 真机）：扩展 chooseCard 平均 1.6ms/次、总耗时约原版 62%、调用次数约原版 70%；chooseButton 0.72ms vs 原版 5.83ms；扩展无 >10ms 决策尖峰
  - **60+ 手牌压测注入法**：不能直接 player.directgain(60张)（引擎空闲期破坏事件链→永久冻结）；正确做法是扩展内 patch 在决策函数内补牌到 60，async 决策环境内注入不打断 event 泵
  - 60 牌基线：扩展 chooseCard 平均 1.3-3.9ms、最大 4.8-16.7ms；原版平均 3.4-9.1ms、最大 76.7-85.2ms
  - **决策尖峰根因（曾现 273ms/1010ms）**：100 轮循环空转 + effect memo 命中路径花 871ms。修复：objKeyCache 加 cardid 兜底 Map（派生牌引用变化使 WeakMap 失效→反复全量 MD5，memoRefresh 时 clear）+ 三选择器 100ms 硬时限。修复后同局 3.86ms/16.7ms
  - **锦囊压测（probe53）**：get 层按牌名分桶计时可指认最慢牌（孙尚香技能 effect 1.98ms×1165 次）；tiesuo 铁索 complexTarget+selectTarget[1,2]+recastable 使估值成本随目标数放大。锦囊 60 牌：扩展 3.63ms vs 原版 11.7ms。chooseButton 重铸按钮瓶颈：recastable 锦囊 check 遍历全部手牌，每次决策 enterCache 新建缓存上下文使 value 全 miss
  - **第三轮优化三项**：wrapParamKey 数组改元素引用键拼接（targets 数组整体 MD5 失效问题）；memoKey 单参无 tag 直接返回 wrapParamKey（useful 加速）；chooseButton 主循环打分包 enterCache/exitCache（84ms→53ms）。bench P1 加速比 132x→319x

[Project Knowledge Summary]
- Date: 2026-09-19
- Context: Agent 运行 pnpm lint 时发现 corepack shim 损坏，改用全局 pnpm
- Category: Build Methods
- Instructions:
  - 环境预装 corepack pnpm shim 损坏，修复：npm install -g --force pnpm@10 覆盖 /usr/local/bin/pnpm
  - 依赖安装：workspace 根 pnpm install --ignore-scripts（约 1.5 分钟）
  - lint：根目录 node_modules/.bin/eslint apps/core/noname/（零输出即通过）
  - 开发服务器：根目录 pnpm dev（后台 terminal），vite 8081 + 文件服务 8089；vite.config.ts 已配 host:true 与 allowedHosts .monkeycode-ai.online（预览必需勿回退）

[Project Knowledge Summary]
- Date: 2026-10-09~2026-10-10
- Context: Agent 多轮深度研究 noname 引擎 AI 估值/缓存架构（知识库 100-141 章为正本），此处留行为性索引与关键结论
- Category: Troubleshooting & Debugging
- Instructions:
  - **知识库正本索引**：121-133 章=引擎核心结构（事件模型/触发链/filter 链/checkMod/估值入口/AI 决策循环/牌区迭代）；134-136 章=CacheContext 机制/技能 AI 分布/ai 基础设施层；137-141 章=get 层全函数实读（value 体系/effect 对照/useful/事件缓存/三层叠加）；142 章=checkopt 8.1-8.11 全量逐条档案 + P2 memo 全链路；143 章=牌使用价值链（canUse/hasValueTarget/useCard 工厂）+ lib.filter 链全形态 + ai.effect 使用侧分支分布统计；144 章=checkMod 管线 / phaseUse 出牌主循环 / get.distance 距离链 / get.select 协议；145 章=需求链残余外围函数族（技能排序/牌区迭代器/属性族四函数/归属 get.owner/距离防御族/ai.basic 三选择器原版-P4 逐条对照）；146 章=chooseToUse 事件处理器六步链（content.ts 5129）/ game.check 原版+game.Check 类四通道（check.js）/ 引擎 _typeChoice xor 候选判定缓存；147 章=player.useResult 分流 / gameEvent step-goto-redo 状态机 / StepCompiler 反编译切分+WeakMap 预编译缓存 / loop()+waitNext() 驱动主循环 / GameEventManager 事件栈；148 章=触发链执行机制（trigger 主循环→doingList 构造→arrangeTrigger 消费→createTrigger 技能工厂：cost/chooseBool 门票、content 执行、getIndex 多条/indexedData、cancelled 传播、hookmap 查表、relatedTrigger 共联映射）；149 章=useSkill 执行链（player.useSkill 工厂 7781 + content 六步 10486：discard/lose 分支、start.skill 计数、targets 逐目标 num++redo 循环、contentBefore/After 钩子、sourceSkill 分类）与 useCard 双执行器全表对比；150 章=get.attitude 敌友判定全链（6550：_trueMe 归一→cache.get.rawAttitude→isMad 反转→tempnofake+modAttitudeFrom/To 钩子）+ rawAttitude 由 mode.get 运行时挂载全局 get（loadModeAsync 13164 合并，白名单外无键缓存）+ identity 模式 realAttitude 身份系数表与 aishown 置信权重 + situation 全局势轴；151 章=响应决策面（sha 用 chooseToUse+toUse / 南蛮万箭决斗用 chooseToRespond+toRespond 双通道，standard.js 169-1371-1747-2159）+ mayHaveSha/Shan 概率模型（count/odds/bool 三态，bool 走 getRand 不可缓存）+ autochoose/skip_shan 短路；152 章=无懈可击响应全链（_wuxie 触发技能 useCardToBegin/phaseJudge→_info_map 状态对拼翻转 getParent(5)→find"谁有无懈"checkMod 四通道+hasWuxie→座次轮转 list.shift→ai1 三级决策 ±effect×state→useResult 落牌）+ hasWuxie 三路判定（实体牌/伪无懈 viewAs/隐藏牌 hiddenCard）+ neutralize 引擎置位（含 unneutralize 杀 directHit）+ _global_waiting 全局倒计时语义；153 章=ai.wuxie 评级函数全清单（15 处逐卡：nanman/wanjian 全量决策族 canSha/canShan 明隐双态、方向检测族 juedou/jiedao/huogong/tiesuo 等、兜底型 wugu/shengdong 返 0 或半随机）+ 与 _wuxie 兜底三级映射（判定牌无评级、无目标场景全兜底）+ getRand 脱敏分布（huogong/zhujinqiyuan 复用 getRand_guohe_wuxie）——扩展勿缓存 ai.wuxie 输出、对南万可包装重写；154 章=hiddenWuxie 隐藏无懈全链（修正 152.4：hasWuxie 实为四通道，hiddenWuxie 需传 info 门控，全库仅役鬼/追停两例）+ effect/damageEffect 结算双轨实读（get/index.js 7139-7377：player/target 技能环乘子 len2/len4、threaten 三态累乘、hp/手牌档位表、attitude 加权终值、自然伤害连环 O(人数)、damageEffect hujia÷1.3 委托）；155 章=attitude 覆写簿记（24 章清单补全：rawAttitude 九模式 + single 模式 attitude 本体覆写 mode/single.js:1847——同势力±10/敌对-10 identity 判等，无缓存/无 isMad/无 rawAttitude 层，仅保留 _trueMe+tempnofake 钩子，唯一 attitude 整体覆写例）——；156 章=finishCard 卡牌 AI 缺省归一协议（修正 35.4 表述：ai.basic 非 ai/basic.js 回调表，而是每牌条目字段容器，由 game/index.js 8863-8995 finishCard 统一填充——ai.basic.order=8+equipValue/20（reverseEquip 8.5-）/useful=2/equipValue（equip3→7、equip4→4、其他→1）/value=aiBasicValue 装备差值函数（method raw/raw2/缺省三分叉）/ai.result.target=1.5（trick）/get.equipResult（equip）；autoViewAs 浅继承 order（顶层→basic 兜底）；三常量 aiBasicOrder/aiBasicValue/aiResultTarget 定义在 finishCard 闭包 8865-8902；finishCard 与 finishSkill 对称构成 lib 注册归一协议全景）——基线第 14825 行
  - **checkopt 8.x 指纹协议**（checkopt.js，知识库 142 章）：modableFingerprint=skills+additional/temp/forbidden/disabled keys+hidden/invisible+skill_blocker+vcardsMap.equips；gciZoneFingerprint=childNodes 数+首尾 cardid；handCountO1=node.handcards1/2.childNodes.length 直接 DOM 计数。8.9 命名空间必须用 "checkopt.trick.X"（"checkopt:target" 被 game.Check.target 占用会误判已补丁跳过）；8.9 挂 lib.onload 延迟安装 + 模块级布尔防重入（target 对象 precontent 时不存在）
  - **P2 memo 键链路**（perf.js 48-227）：wrapParamKey=原始值直编码/函数+数组+对象走 objKeyCache(WeakMap 引用级)/对象再走 idKeyCache(Map cardid 二次兜底，memoRefresh 时 clear)；memoEnsure 懒刷新仅当 aiMemoStore.get(ev)!==currentMemoEntry；installMemo=FLAG.onai+memoEnsure 双守卫，effect/effect_use tagMode="derived"（memoIsDerived=args[1] 无 name 属性），get.card 无参派生缓存键=selCardsFingerprint
  - **引擎缓存三层叠加**：CacheContext proxy（单打分迭代，chooseXxx 每次迭代新建，`new CacheContext()` 空参与原版带参等价——构造函数遍历全局 proxyed，`CacheContext.setProxy({lib,game,get})` 在 init/index.ts:71 一次性设置）+ inject 类（per-player storageMap，cacheEnvironment 时生效，Player.prototype 23 方法含 countCards/getCardIndex/getSkills/canUse/getUseValue，player.js:16594）+ _stepCache/_tempCache（事件级，单 step 作用域，get.useful_raw 唯一消费方）。扩展 P2 按 _status.event 挂载跨迭代/跨 aiexclude 重试复用，代际（countCards("hesj")+人数）兜底
  - **rawAttitude 模式扩展点**：get.attitude(6550) 核心行调 cache.get.rawAttitude——各模式挂载（identity/versus/chess/boss/stone/brawl/doudizhu/guozhan/tafang）。attitude 分层=模式层 rawAttitude→缓存层 proxy→通用层（isMad/tempnofake/modAttitude）。rawAttitude 由 mode.get 经 loadModeAsync 13164 运行时合并进全局 get，不在 cacheSupportFunction 白名单→代理直通无键缓存。身份局 aishown=置信度缩放实数分（identity_mark/fanshown），非硬二分
  - **残余热点结论**（均被 P2 摊薄到首次路径）：hasSkillTag（getSkills 已被 inject 缓存，残余=expandSkills+arg 对象新建）、get.result 深拷贝（get.copy(info.ai.result)）、get.effect 玩家侧直调不走 delegate、顶层 effect/effect_use 每次 getSkills+expandSkills 新建数组。get.getModableSkills/owner/tag 已缓存或 O(1)。维持"不新增扩展补丁"收敛决策
  - **get.rawAttitude 源码树无定义**，真机由游戏运行时注入，测试环境需自行 stub（test/_prof.mjs）
  - **jsdom 微测低估真机 DOM 成本约 30 倍**，权威数据走真机落盘链路（game.writeFile→extension/自用ai/ai-perf-dump.txt + [单卡最慢] 行）
  - **P4 重写**（perf.js 345-354）：enterCache=setCacheContext(new CacheContext())+setInCacheEnvironment(true)+memoRefresh，exitCache 由 try/finally 保证；100ms 硬时限独立于 profiler。P1 funcKeyCache（函数引用 WeakMap 消 MD5，FLAG.onai 守卫）；P3 selectable 三闭包（代际校验数组缓存，classList 动态判断不缓存）
  - **get.value 内部每次调 geti()=getCardIndex("hs",...) 同名牌位置扫描**（8.10 覆盖）；**effect/effect_use 系数差异**（1血 ×3 vs ×2.5、0牌可响应 ×2.1 vs ×1.7，系数表见知识库 137.2/139.2）；**getUseValue**=每目标一次 cache.get.effect 全目标正效排序取前 range[1] 个求和（出牌价值核心，被 inject 缓存）
  - **chooseToUse AI 决策重试**：决策失败 `_aiexclude.add(skill/card)` + `event.redo()`（content.ts:5247-5289），重试不换事件对象——P2 按事件挂载跨轮复用的依据；`_aiexcludeclear` 决策成功时清空
  - **使用价值链/过滤链闭环**（知识库 143 章）：canUse(10784)=cardEnabled+cardUsable(次数闸)+targetInRange(距离闸)+targetEnabledx/targetEnabled 四闸；hasValueTarget/getUseValue 每目标一次 cache.get.effect（inject 覆盖）；useCard 工厂的 modSkill 预计算只在决策成功后一次执行（非热点），其 getModableSkills 走 8.6.2 缓存数组。lib.filter 链（library/index.js 10936 起）全部函数在 inject 23 清单外，判定成本由 8.6.2 摊薄 modable 技能列表；ai.effect 使用侧分支全库分布 player_use~204 处/target_use~176 处（每处为函数定义，返回 arr2/[4,附带] 为主），热点依赖 hasValueTarget/cache.get.effect 已摊薄。维持"不新增 filter/使用侧补丁"收敛决策。
