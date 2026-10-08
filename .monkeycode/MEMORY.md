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
  - 项目文档：根目录 agent.md（Agent 工作指南）与 知识库.md（技术知识沉淀）

[Project Knowledge Summary]
- Date: 2026-10-07
- Context: 用户反馈装上扩展后 AI 不出牌，Agent 定位并修复两处正确性 bug
- Category: Troubleshooting & Debugging
- Instructions:
  - **ui.selected 三数组键名是 buttons/cards/targets（无 players）**——原版 game.Check.processSelection 的 cacheId 循环里 `Type==="target"→Type="player"` 是永不可达死代码（type===Type 在转换前就 break），扩展若放行到该分支访问 ui.selected.players 会 undefined.forEach 崩溃；技能事件要纳入 target 选择状态时直接读 ui.selected.targets + playerid
  - **ai.basic 三选择器缓存生命周期契约**：原版只在"打分循环段"临时 CacheContext.setCacheContext(new)+setInCacheEnvironment(true)，打分完立即 remove；get.selectableCards()、game.check()、技能字符串分支（ui.click.skill）、递归 chooseCard 全部在缓存环境**外**执行。扩展整函数 enterCache() 包到 finally 会让 game.check() 的 filterCard 重算被缓存，技能事件下 UI 状态与真实脱节，特定技能路径静默卡死（无报错、event 泵冻结）；必须按打分段进/出缓存
  - **get.card memo 键须含已选牌内容指纹**（cardid/name 序列），不能只用数量——原版 get.card 在 _status.event.skill 且 info.viewAs 为函数时依赖 ui.selected.cards 的内容，数量相同但换牌（选 A 再选 B）时只按数量做键会返回过期 VCard
  - **onai 不出牌根因（2026-10-07 二次定位）**：perf.js 的 P4（ai.basic 三选择器重写）在选中最后一张牌时跳过 game.check() 直接 return true。game.check() 会刷新 selectable classList/技能按钮并计算 _status.multitarget，跳过它导致后续 chooseTarget 与 ui.click.ok 读到过期选择状态，AI 估值全负→判定无牌可出→进回合直接弃牌结束。修复：三个选择器的 game.check() 一律放在 selected.add 之后、ok/range[1] 判断之前（对齐原版 ai/basic.js 位置）。验证：P4-only 用牌 4→33（原版量级 26-45），全开 6→27，180s 长跑用杀 15/回合 11/无卡死
  - **test_game 对局有原版随机卡死与 isOnline2 报错，勿误判为扩展 bug**：纯原版（E 配置）跑 test_game 也会偶发开局即冻结（20s 无日志）；游戏打到底触发 game.over 渲染时 `clients[i].isOnline2 is not a function`（原版 game/index.js:7069，isOnline2 定义存在于 Player.prototype，报错来自 clients 列表混入非 Player 对象）。扩展不触碰 isOnline2/game.over
  - **respond step0 卡死为引擎随机（2026-10-07 多局对照确认）**：D 扩展全开 4 局中 1 局、E 原版 3 局中 1 局均卡死在 `respond step0`（出闪/无懈响应事件，无 JS error，对局日志停更）。respond 走 ai.chooseToRespond，不经扩展的 ai.basic 三选择器；判定扩展无责。检测手段：probe56 对照组（D/E 各 4 局 90s，probe 层注入 60 牌），卡死时抓 _status.event 栈
  - 冻结诊断法：对局日志尾部"连续多秒完全无新增文本"= event 泵冻结信号；真机 hook ai.basic 三函数计时 >100ms 或抛错定位决策瓶颈

[Project Knowledge Summary]
- Date: 2026-10-07
- Context: Agent 重新与原版对比 AI 决策效率并做微优化
- Category: Testing Methods
- Instructions:
  - 真机 AI 决策效率对比方法（probe40.mjs）：同一套 versus 4 人 test_game，A=扩展全开、B=纯原版各跑 120s；关键时序——precontent 在**开局时**才执行（patch 此时安装），必须先等对局开始（回合>0 或 用牌>0）再 wrap ai.basic 三函数，否则 wrap 会被 patch 覆盖；evaluate 内不能引用 node 侧常量（BUCKETS 等），须内联；test_game 对局有 ~10-20% 概率开局卡死，需坏局检测+重试
  - 2026-10-07 修复后基线（120s 真机，wrap 计时，随机局）：扩展 chooseCard 平均 1.6ms/次、总耗时约原版 62%、调用次数约原版 70%（重试少）；chooseButton 0.72ms vs 原版 5.83ms；chooseTarget 持平；扩展无 >10ms 决策尖峰（原版出现过 22-27ms）。两配置同口径对比受随机局影响有噪声，看趋势不看绝对值
  - **memo 键对象引用级 WeakMap 缓存**（perf.js wrapParamKey）：_wrapParameterToCacheKey 对 card/player 对象递归 Object.entries 全字段序列化，memo 命中路径也要先生成键再查表；决策期间同对象引用内容稳定（classList 变化不影响估值），按引用缓存键安全，命中路径键生成变 O(1)。selectable 三闭包同理缓存 filterCard/filterButton.toString().length（每次调用重复序列化）

[Project Knowledge Summary]
- Date: 2026-10-07
- Context: Agent 验证大量卡牌(60+)场景并修复决策尖峰
- Category: Testing Methods
- Instructions:
  - 60+ 手牌压测注入法：**不能直接 player.directgain(60张) 塞牌**——会在 test_game 引擎空闲期（_status.event 为 null）破坏事件链，页面不卡但引擎永久冻结（回合计数停，evaluate 正常）。正确做法是扩展内 patch（perf.js 临时开关），在决策函数内补牌到 60，async 决策环境内注入不打断 event 泵
  - 60+ 牌真机对比方法（probe50/51，100s）：D=扩展全开+aiprofile、E=onai/checkopt/brain 全关，均注入 60 牌；wrap ai.basic 三函数计时 + aiprofile 摘要；须跑多局取趋势（test_game 随机坏局 + 随机卡组造成局间大波动）
  - 60 牌基线（修复后）：D 扩展 chooseCard 平均 1.3-3.9ms、最大 4.8-16.7ms；E 原版平均 3.4-9.1ms、最大 76.7-85.2ms。扩展平均与尖峰均优于原版。原版 60 牌下同样有几十 ms 尖峰（iwhile=100 × 60 牌全量 effect）
  - **决策尖峰根因（D 局曾现平均 273ms/最大 1010ms）**：单决策 100 轮循环空转 + effect memo 命中 4927 次花 871ms（每次 ~180µs）。修复二：a) objKeyCache 加 **cardid 兜底 Map**（派生/viewAs 牌引用变化使 WeakMap 失效 → 反复全量 MD5），memoRefresh 时 clear；b) 三选择器循环加 **100ms 硬时限**（loopT0 独立于 profiler，防空转）。修复后同局型降到平均 3.86ms/最大 16.7ms
  - get.effect 的 memo 键派生模式（useSelTag=selCardsFingerprint）下，effect 命中路径慢的根源是 card 对象引用不稳定（get.card 派生缓存跨事件重建对象）
- Date: 2026-09-19
- Context: Agent 运行 pnpm lint 时发现 corepack shim 损坏，改用全局 pnpm 完成依赖安装与 lint
- Category: Build Methods
- Instructions:
  - 环境预装的 corepack pnpm shim 损坏（报 Cannot find module .../corepack/v1/pnpm/12.4.2/bin/pnpm.cjs），修复方式：npm install -g --force pnpm@10 覆盖 /usr/local/bin/pnpm
  - 依赖安装：workspace 根目录 pnpm install --ignore-scripts（约 1.5 分钟）
  - lint 实际命令：根目录 node_modules/.bin/eslint apps/core/noname/（eslint.config.js 在 workspace 根，flat config 向上解析）；零输出即通过
  - 开发服务器：根目录 pnpm dev（后台 terminal 运行），vite 客户端 8081 + 文件服务 8089；vite.config.ts 已配 host:true 与 allowedHosts .monkeycode-ai.online（预览必需，勿回退 127.0.0.1）；验证顺序 curl 首页/noname.js/改动模块均 200

[Project Knowledge Summary]
- Date: 2026-10-07
- Context: Agent 对锦囊(铁索/顺手)60+ 牌场景压测并做第三轮微优化
- Category: Testing Methods
- Instructions:
  - 锦囊压测方法（probe53）：在 probe50 基础上给 get 层加**按牌名分桶**计时（effect/order/useful/value/effect_use + 超50ms计数 + aiprofile 峰值 top5），可直接指出哪张牌的估值最慢（如孙尚香 star_sunshangxiang 技能 effect 1.98ms×1165 次）。注入牌表须含 tiesuo(铁索连环)/shunshou(顺手牵羊)
  - tiesuo（铁索连环）结构：card/extra.js:408，complexTarget + selectTarget[1,2] + recastable:true + ai.result.target 用 game.filterPlayer 全员遍历 → 多目标+全员遍历使估值成本随目标数放大；铁索 6 张基础牌（spade11/12、club10/11/12/13）
  - 锦囊 60 牌对比（120s）：D 扩展 chooseCard 平均 3.63ms vs E 原版 11.7ms，最大 22.8 vs 105.1ms；effect 总耗时 425ms vs 2907ms。扩展显著占优。但扩展仍有单峰：effect_use 重算 74.8ms
  - **chooseButton 重铸按钮瓶颈**：千头 pro recastable 锦囊在出牌阶段触发按钮决策，check 遍历全部手牌逐张算 value；每次决策 enterCache 新建缓存上下文导致 value 全 miss 重建（60 张×约0.6ms=35-48ms）。感知为单次 45-85ms 卡顿
  - **第三轮优化三项**：a) wrapParamKey 对数组改为"元素引用键拼接"（避免对 targets 数组整体 MD5，数组引用变化不再导致 WeakMap 失效全量展开）；b) memoKey 单参无 tag 时直接返回 wrapParamKey 结果（省每次拼接字符串，useful 单参命中路径加速）；c) chooseButton 主循环打分包 enterCache/exitCache（复用 value memo，按钮决策 84ms→53ms）。效果：bench P1 加速比 132x→319x
