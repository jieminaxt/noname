# agent.md — AI Agent 工作指南

本文件面向在此仓库工作的 AI Agent，汇总项目结构、验证命令、扩展开发约定与协作规范。

## 项目结构

无名杀（noname）pnpm monorepo：

| 路径 | 内容 |
|------|------|
| `apps/core/noname/` | 游戏本体核心代码（game、library、ui、get、ai、init 等） |
| `apps/core/extension/` | 扩展目录，每个扩展一个子目录，入口 `extension.js` |
| `apps/electron/`、`apps/mobile/` | 桌面与移动端壳 |
| `packages/extension/`、`packages/fs/`、`packages/jit/`、`packages/server/` | 支撑包 |
| `docs/` | 本体官方文档（英文命名，与本项目自定义文档分开维护） |

## 构建与验证命令

```bash
# 安装依赖（workspace 根目录，约 1.5 分钟）
pnpm install --ignore-scripts

# 本体 lint（零输出即通过；eslint.config.js 在根目录，flat config 向上解析）
node_modules/.bin/eslint apps/core/noname/

# 扩展 lint（指定单个文件）
node_modules/.bin/eslint "apps/core/extension/自用ai/extension.js"

# 扩展语法校验（Node 导入法：模块解析失败为 ERR_MODULE_NOT_FOUND 属正常，
# 出现 SyntaxError 才是真问题）
node -e "import('/workspace/apps/core/extension/自用ai/extension.js').then(()=>console.log('LOADED')).catch(e=>{console.log(e.code==='ERR_MODULE_NOT_FOUND'?'SYNTAX_OK':'FAIL: '+e.message)})"
```

环境已知问题：预装的 corepack pnpm shim 损坏（报 `Cannot find module .../corepack/v1/pnpm/12.4.2/bin/pnpm.cjs`）。修复方式：

```bash
# 覆盖安装真实 pnpm
npm install -g --force pnpm@10
```

长耗时任务（依赖安装、构建、启动开发服务器）使用 background terminal 系列工具管理，先 `background_terminal_list` 查重再创建。

### 开发服务器

```bash
# 根目录执行；同时启动 vite 客户端(8081)与文件服务(8089)，vite 端口以
# apps/core/vite.config.ts 的 port.client 为准
pnpm dev
```

- vite 已配置 `host: true` 与 `allowedHosts: [".monkeycode-ai.online"]`（预览域名访问必需，勿改回 127.0.0.1）。
- 验证顺序：curl 首页 200 → curl `/noname.js` 200 → curl 改动模块 200（vite 按需转换，请求即验证编译）。

## 协作规范（用户明确要求，必须遵守）

1. **本体代码只读**：`apps/core/noname/` 下的文件保持原版，所有优化、修复、功能一律写到扩展里实现。
2. **扩展 patch 必须带 config 开关**：开关关闭时运行时回退到备份的原函数，行为与未打补丁完全一致。
3. **回复使用中文**；输出中不使用 emoji。
4. **每轮改动后必须验证**：eslint + 语法校验；涉及游戏逻辑的复刻类改动，先提取独立断言脚本验证语义（参考 cacheId 键值验证脚本的做法）。
5. 提交前 `git status` 确认改动范围，只提交预期文件。

## 扩展开发约定

### 目录与导入

- 路径：`apps/core/extension/<名称>/extension.js`，导出 `export const type = "extension"` 与默认工厂函数。
- 本体对象导入：`import { lib, game, ui, get, ai, _status } from "../../noname.js"`。
- 缓存上下文：`import { CacheContext } from "../../noname/library/cache/cacheContext.js"`。

### config 开关

- 定义在返回对象的 `config` 字段，键名 `<扩展名>_<功能名>`，运行时通过 `lib.config.extension_<扩展名>_<功能名>` 读取。
- 判断模式：`lib.config.extension_自用ai_xxx === false` 时走原版逻辑（严格等于 false，undefined 视为开启）。
- 修改扩展配置会触发游戏重载扩展，patch 重新执行。

### patch 模式（本仓库既有风格）

```text
1. 防重入标记：if (!game.__xxxPatched) { game.__xxxPatched = true; ... }
2. 备份原引用：const original = 目标函数;
3. 替换入口首行判断开关：if (关闭) return original.call(this, ...);
4. 复刻原函数体时逐行对照本体源码，只改目标行为；
   复刻类逻辑先写独立断言脚本验证语义再合入。
```

### 时序

- `precontent` 在核心模块（lib/game/ui/get/ai）加载完成后、进局前执行，可安全 patch `lib.element.*`、`game.Check.*`、`ai.basic.*`、`get.*`。
- `Button.updateTransform` 是 getter（`library/element/button.js`），动态读取 `Card.prototype.updateTransform`，patch `lib.element.Card.prototype` 即可同时覆盖牌与按钮。

## 关键代码位置速查

| 功能 | 位置 |
|------|------|
| game.check 入口与 useCache 门槛 | `apps/core/noname/game/index.js`（check 约 7359 行起） |
| 选牌检查与选择缓存 | `apps/core/noname/game/check.js`（Check.processSelection） |
| mod 管道分发（checkMod） | `apps/core/noname/game/index.js`（约 9002 行）；getModableSkills 在 `library/element/player.js` 约 5613 行 |
| filter 链（cardEnabled/cardUsable/cardRespondable/cardDiscardable/filterCard） | `apps/core/noname/library/index.js`（filter 40 成员 10936-12044） |
| AI 姿态与评估（attitude/order/useful/value/effect/effect_use/damageEffect） | `apps/core/noname/get/index.js`（约 6548-7420 行） |
| 元信息（info/name/suit/autoViewAs/select） | `apps/core/noname/get/index.js`（约 1142-3855 行） |
| 集合遍历（expandSkills/hasPlayer/hasPlayer2/countPlayer） | `apps/core/noname/game/index.js`（约 10166-10240 行） |
| Player 类核心（getCards/countCards/hasSkill/hasSkillTag/getStat/getHistory/damage） | `apps/core/noname/library/element/player.js`（getCards 5432、hasSkill 13672、hasSkillTag 13771、getStat 12576、getHistory 12261、damage 8894） |
| VCard 视图与缓存键（iterableGetVCards/vcardsMap/getCacheKey/getTempCache） | player.js 5182/4125、ai/index.js 14、vcard.js 171 |
| UI 系统（UI 布局/Create 工厂/Click 交互/Check 选牌缓存） | `apps/core/noname/ui/index.js`（updatehl 434）、`ui/create/index.js`（div 578/dialog 1945/me 3798）、`ui/click/index.js`（button 2617/card 2673/target 2839/ok 3090）、`game/check.js`（processSelection 4） |
| UI 类全景（单例字段/布局函数族/手牌双路径/refresh 强制重排/动态座位） | `apps/core/noname/ui/index.js`（getSpreadOffset 187、refresh 220、updatec 237、updatex 366、updatejm 384、updatehl 434、updateh 552、updatehx 573、updated 594、updatez 601、update 615、updateConnectPlayerPositions 705、updatePlayerPositions 759、单例导出 804） |
| UI 元素类（Card/Button/Dialog/Control） | `library/element/card.js`（cardid 321、isKnownBy 791）、`button.js`、`dialog.js`（add 280）、`control.js` |
| GameEvent 与触发系统（loop 状态机/trigger 调度/arrangeTrigger/backup/编译器） | `library/element/gameEvent.ts`（trigger 462、backup 763、stepCache 1153）、`GameEvent/compilers/`、content.ts（arrangeTrigger 4017、createTrigger 4079）、lib/index.js（filterTrigger 11070） |
| 核心动作 content（useCard 17steps/useSkill/damage/gain/lose/changeHp 护甲抵扣） | `library/element/content.ts`（useCard 9756、useSkill 10486、discard 10902、respond 10933、gain 11241、lose 11652、damage 12038、recover 12229、loseHp 12258、changeHp 12322） |
| AI 启发式与缓存上下文（ai.basic 贪心选择器/CacheContext.inject/choose 类 content） | `apps/core/noname/ai/basic.js`（chooseButton 10/chooseCard 78/chooseTarget 172）、`library/cache/cacheContext.js`（inject 104）、player.js 16594（inject 注册）、content.ts（chooseToUse 5129、chooseToRespond 5468、chooseButton 7499、chooseCard 7778、chooseTarget 7899） |
| AI 打分回调装配（九事件工厂默认 ai/cacheOrder/cacheEffectUse/unuseful 家族） | `library/element/player.js`（chooseToUse 5815、chooseToRespond 5886、chooseToDiscard 6043、chooseButton 6419、chooseCard 6547、chooseTarget 6708、chooseBool 6927）、`get/index.js`（cacheOrder 6788、order 6795、cacheEffectUse 6843、effect_use 6861、unuseful 家族 6640、useful 6634） |
| 回合与阶段系统（phaseLoop 大循环/phase content 12 步/四阶段/stat 清零/useCache 弃牌） | `library/element/content.ts`（phaseLoop 3836、phase 4663、phaseJudge 4931、phaseDraw 4998、phaseUse 5034、phaseDiscard 5101、phaseJieshu 5125）、`game/index.js`（loop 7266、delay 族 7305、phaseLoop 8041）、player.js（phase 5764、phaseDraw 5784）、GameEvent/compilers/ContentCompilerBase.ts（isPrevented 39） |
| 触发注册体系（lib.hook 桶/hookmap/relatedTrigger/trigger 收集/filterTrigger 13 层） | `library/index.js`（hook 384、hooks 436、hookmap 466、relatedTrigger 468、filterTrigger 11070、filterEnable 11176）、player.js（addSkillTrigger 11067、removeSkillTrigger 11745、addTempSkill 11946、tempBanSkill 11993）、`game/index.js`（callHook 829、addGlobalSkill 6317、removeGlobalSkill 6366）、`library/hooks/index.ts:4`（defaultHooks 24 键）、`gameEvent.ts`（trigger 门控与收集 462-648、hookmap 早退 487、lib.hook 读取 623） |
| 判定系统（player.judge/judge content 两步/judge mod 原地修改/judgeFixing） | `library/element/player.js`（judge 9786）、`library/element/content.ts`（judge 12976、turnOver 13108）、`get/index.js`（judge 3658、judge2 3662）、`game/index.js`（checkMod 9002） |
| 牌堆与摸弃牌（get.cards/washCard/cardsGoto 家族/player.draw/randomDiscard） | `get/index.js`（cards 3626、bottomCards 1036）、`game/index.js`（washCard 755、cardsDiscard 1463、cardsGotoOrdering 1520、cardsGotoSpecial 1548、cardsGotoPile 1576、$cardsGotoPile 1618）、content.ts（cardsDiscard 2931、orderingDiscard 2965、cardsGotoOrdering 2971、cardsGotoSpecial 3020、cardsGotoPile 3056、draw 10756）、player.js（draw 7868、randomDiscard 7931） |
| when() 技能工厂（一次性技能/链式 API/闭包与字符串编译/enumerable 隔离） | `library/element/player.js`（when 817-1118、addAdditionalSkills 11890）、content.ts（triggered 置位 4051） |
| 胜负结算链（game.over 双语义/金币/天梯 MMR/统计表/录像/lib.onover/forceOver/调用方全景） | `game/index.js`（over 6547-7262、forceOver 6531、washCard maxShuffle→over 759）、content.ts（forceOver 3934）、player.js（out 9861）、get/index.js（cards 3643、bottomCards 1053）、`mode/identity.js`（checkResult 820、dieAfter 3159）、content.ts（dieAfter 调用点 12468） |
| 虚拟牌层与出牌组装（VCard 四形态/getCacheKey/autoViewAs/vcardsMap 三槽/useCard modSkill 固化/unsure 预检） | `library/element/vcard.js`（构造器 11-134、getCacheKey 171、initID 199）、`get/index.js`（autoViewAs 1142、info 3790、card 3826、vcardInfo 2384）、player.js（vcardsMap 180、iterableGetVCards 5182、addVirtualJudge 15663、addVirtualEquip 15793、useCard 7625、useSkill 7775）、`library/index.js`（filterEnable viewAs 预检 11215）、`card/standard.js`（sha 条目 99） |
| 装备系统（equip content 9 步/replaceEquip 槽位替换/装备技能 diff 生命周期/槽位容量） | content.ts（equip 948-1172、replaceEquip 866-946）、player.js（getEquips 1849、getVEquips 1864、countEquipableSlot 1769、canEquip 2147、addEquipTrigger 11638、removeVirtualEquip 11688、removeEquipTrigger 11708）、`get/index.js`（equipNum 3284、skillsFromEquips 450）、`library/index.js`（canBeReplaced 11009） |
| AI 姿态矩阵（get.attitude 四步链/rawAttitude 模式覆写/realAttitude 身份矩阵/situation 局势/customAttitude 扩展钩子） | `get/index.js`（attitude 6548、sgnAttitude 6577、difficulty 4729、aiStrategy 4942）、player.js（isMad 9502、addExpose 9525）、`mode/identity.js`（rawAttitude 3717、realAttitude 3890、situation 4524）、`mode/guozhan/src/patch/get.js`（rawAttitude 284）、cacheContext.js（proxy 缓存 143-174） |
| 响应链（chooseToRespond 六步/respond content/respondMap/autochoose 短路/装备解体/无懈响应面） | player.js（chooseToRespond 5886）、content.ts（chooseToRespond 5468-5709、respond 10933-11151、_triggerTo 10153-10243）、`library/index.js`（respondMap 950）、`get/index.js`（canRespond 3584）、player.js（canRespond 657）、`card/standard.js`（wuxie ai 1235） |
| 目标选择链与距离系统（chooseTarget 三步/chooseCardTarget·chooseButtonTarget/get.filter·get.select 协议/get.distance 七段管线/inRange 4 条 boolean mod/getAttackRange·getEquipRange） | player.js（chooseTarget 6708、inRange 3143、getAttackRange 12659、getEquipRange 12693、getGlobalFrom 12725）、content.ts（chooseTarget 7899-7918、chooseCardTarget 7920、chooseButtonTarget 7980）、`get/index.js`（select 3812、filter 4512、distance 3665-3778 attackTo TDZ 3755）、`game/check.js`（Check.target 130-147） |
| 濒死/阵亡/求桃链（dying 三步+filterStop/_save 求桃轮转 ai1=order·ai2=effect/changeHp 汇聚点护甲吸收+脱险钩子/die 六步/canSave/dieAfter·dieAfter2 模式覆写/revive·rest） | player.js（dying 9355、die 9379、revive 9427、rest 9396、canSave 2570）、content.ts（_save 14-114、loseHp 12259、changeHp 12322-12302、dying 12398、die 12455-12703、revive 12775）、`mode/identity.js`（dieAfter 3159、dieAfter2 3103、checkResult 820）、`game/GameEvent/compilers/ContentCompiler.ts`（regularize 49） |
| 事件泵与托管循环（loop 状态机 _triggered 0-5/PauseManager 5 Deferred/isMine 四条件与 AI 托管/switchToAuto 半路接管/game.check 补全 useCache·multitarget） | `game/GameEvent/gameEvent.ts`（start 226、loop 247、waitNext 306、checkSkipped 293、untrigger 650、cancel 677）、`game/PauseManager.ts`（5 Deferred、setDelay 11、waitPause 28）、`status/index.js`（paused/over 代理 113-153）、`ui/click/index.js`（auto 4430-4486）、`game/index.js`（loop 7266、pause/resume 7272-7300、check 7359-7487） |
| 回合系统全景（phaseLoop 轮次判定三模式/phase 十四步状态机/四阶段 content/每回合限一次实现链/insertPhase/phaseJudge 循环） | game/index.js（phaseLoop 8041）、player.js（phase 5764、insertPhase 5740、phaseXxx 工厂 5778+）、content.ts（phaseLoop 3836、phase 4663-4926、phaseDraw 4998、phaseUse 5034 stat 归零、phaseDiscard 5101、phaseJieshu 5125、phaseJudge 4931）、`library/index.js`（phaseName 14956） |
| 判定链（judge 工厂与两步 content/judging 栈与改判窗口 trigger("judge")/judge 函数协议 bool 正负/checkMod "judge"/judgeFixing/rejudge 标签 AI 估值/鬼才改判模板） | player.js（judge 9792）、content.ts（judge 12976-13107、turnOver 13108、link 13113）、`get/index.js`（judge 3658、judge2 3662、cards 洗牌 3637）、`card/standard.js`（lebu judge 3163、rejudge tag AI 3270）、`character/standard/skill.js`（guicai 391-472） |
| 摸弃牌堆与洗牌链（draw 四级摸牌来源/discard·modedDiscard·loseToDiscardpile 语义/washCard 洗牌与 maxShuffle 平局/_status.discarded 生命周期） | player.js（draw 7868、discard 8058、modedDiscard 8100）、content.ts（draw 10756、discard 10902、loseToDiscardpile 10913）、`game/index.js`（washCard 755-787）、`get/index.js`（cards 空堆 3638）、`library/element/card.js`（discard add 978）、content.ts（discarded 移除 11360/6452、清空 4788） |
| 标记系统（storage 双层模型/addMark·removeMark 触发事件载体 emptyEvent/markSkill·unmarkSkill/intro 协议 markcount·onunmark/updateMark 五级计数源/gaintag 桥接/蓄力值） | player.js（addMark 4790、removeMark 4750、setMark 4827、countMark 4840、updateMark 4860、updateMarks 4913、addCharge 4934、syncStorage 5678、markSkill 10489、unmarkSkill 10530、markCharacter 10610、mark 10648、unmark 10737）、content.ts（emptyEvent 11）、`character/xianding/skill.js`（addMark 触发消费样例 5971） |
| 获得链与 gaintag（gain 工厂三闭包 getd·getl·getg/content 五步：先行失去 type=gain→净化→getHistory("gain")·stat.gain 登记→公共区摘除→入手+动画协议/$gain·$gain2/$gainmod 钩子/gaintag 生命周期：eternal_ 永久·invisible 隐形·失去即清/addToExpansion） | player.js（gain 8548、$gain 15973、$gain2 16068、$draw 14229）、content.ts（gain 11241-11465、addToExpansion 11466、eternal 清理 11819/11881、手气卡清 gaintag 3800、hidden visible_ 协议 518）、`library/element/card.js`（addGaintag 219、removeGaintag 243、hasGaintag 253） |
| lib.skill 技能声明协议全景（finishSkill 注册总闸：translate 四级降级·inherit·模式过滤·viewAs AI 继承·limited 补全·subSkill 展开/enable 四形态/trigger 系字段/限次协议现状（frequency 已废弃）/AI 块字段汇总/charlotte·unique·zhuSkill·hiddenSkill 生命周期） | `game/index.js`（finishSkill 8677-8790）、`library/index.js`（filterEnable 11176、enable 四形态 11194）、player.js（getModableSkills 5613、unique/charlotte 过滤 5160）、`get/index.js`（ai.equipValue 双位置 6730、ai.tag 4673）、`game/index.js`（addGlobalSkill 6290） |
| chooseToUse content 深化（六步状态机：onChooseToUse 钩子→isMine check/fakeforce→AI 分支 _aiexclude+redo→chooseButton·precontent 二级→backup 固化 goto(0)→useResult 转交/chooseonly cost_data/useResult 分流 useCard(skill 第四参)·useSkill/onChooseToUse·onuse·precontent 三口时机） | content.ts（chooseToUse 5129-5467）、player.js（useResult 7578-7624） |
| useCard content 十七步（结算主线全表：Step0 动画三闭包+lose_map+stat 登记→useCard0/1/2·yingbian·useCard 五窗口→_triggerTo 四目标级时机（emptyEvent+redo 循环）→Step11-15 双循环（effectedCount×effectCount 外层+num 逐目标内层+四连摘除+content 子事件+customArgs 双段注入）→useCardEffectEnd→Step16 logAi+result） | content.ts（useCard 9756-10485、_triggerTo 10153、Step12 逐目标 10299） |
| 扩展开发速查总表（"我要做 X 挂哪里"：AI 决策与姿态/缓存与性能/新机制声明/UI 动画四类挂载点索引+禁区清单+决策路径总图；全部结论出自六至三十七章对应章节） | 本章为索引章，行号以各章为准 |
| 仓库结构与三端平台 / 扩展生命周期 / 官方扩展范本与入库白名单 / 配置持久化（test_game 三态） / 内容编译链与沙盒（三十九至四十三章） | `apps/core/package.json`、`apps/core/.gitignore`、`noname/init/index.ts`、`noname/init/import.ts`、`noname/library/element/GameEvent/compilers/StepCompiler.ts` |
| 模式系统与切换 / 双将协议与国战继承 / 身份判定与姿态矩阵 / 沙盒与扩展运行边界 / 联机同步与录像（四十五至四十九章） | `noname/mode/`、`noname/library/index.js:5764`、`noname/game/index.js:7832`、`noname/mode/guozhan/src/patch/`、`noname/util/sandbox/security.js:60`、`noname/library/element/player.js:13349` |
| UI 与 check 交互判定 / DOM 工厂与动态样式 / 动画与 transform 驱动链 / poptip 与 toast 提示语义 / 卡牌角色数据装载 / lib Proxy 与覆盖规则 / library 支撑模块（五十一至五十七章） | `noname/game/check.js`、`noname/ui/click/index.js`、`noname/library/hooks/index.ts`、`noname/library/cache/cacheContext.js`、`noname/init/loading.ts`、`noname/library/index.js:52` |
| 布局与主题系统 / 资源层与 assetURL 拼装 / 图片皮肤优先级链 / 构建系统与启动入口 / 脚本式加载与全局注入协议 / 状态容器与元素基类（五十九至六十四章） | `vite.config.ts`、`apps/core/game/config.json`、`noname/util/index.js:4`、`noname/init/polyfill.ts:140`、`noname/library/init/index.js:200`、`noname/status/index.js` |
| game 主体与事件循环 / Player 生命周期与方法清单 / 模式脚本内部结构对照 / 胜利判定体系 / 乱斗扩展点全景（六十六至七十章） | `noname/game/index.js:24`、`:10937`、`:6547`、`:7266`、`:7832`、`noname/library/element/player.js:9373`、`:5758`、`:5815`、`apps/core/mode/`（12 个模式文件）、`noname/mode/brawl.js:270` |
| AI 决策内核与三层缓存（AI 单例与 getCacheKey/Basic 三选择器与 get 打分钩子/选择器 content 与 AI 分支/processAI 接管点/CacheContext 与 stepCache 与 tempCache） | `noname/ai/index.js:4`、`:106`、`:111`、`noname/ai/basic.js:10`、`:78`、`:172`、`noname/library/element/content.ts:7430`、`:7709`、`:7830`、`noname/get/index.js:6582`、`:6634`、`:6788`、`noname/library/cache/cacheContext.js:104`、`:140`、`noname/library/element/gameEvent.ts:1153` |
| 选牌判定管线与 get 选牌打分内核 / 技能数据装载与元素层汇聚（game.check 调度与 Check.processSelection 三类选择器 / get.info·select·selectableX·useful·order·effect_use·attitude·judge·paramToCacheKey 与原型冻结 / library/skill.js 对象字面量装载与 lib.skill Proxy 与 lib.skill.global 与 info.sub 双端口径 / element/index.js 汇聚与循环依赖 / VCard.getCacheKey / ChildNodesWatcher） | `noname/game/index.js:7359`、`:7376`、`:7488`、`noname/game/check.js:4`、`:99`、`:113`、`:130`、`:148`、`:194`、`noname/get/index.js:3790`、`:3812`、`:4304`、`:4325`、`:4484`、`:6548`、`:6580`、`:6788`、`:6843`、`:6861`、`:745`、`:7827`、`noname/library/index.js:12299`、`:11086`、`:11337`、`noname/library/element/player.js:5157`、`:5871`、`:61`、`noname/library/skill.js:4`、`noname/library/element/vcard.js:171`、`noname/library/cache/childNodesWatcher.js:4` |
 | 交互闭环层（Click 类骨架与双层事件模型与动态派发与 windowmousedown/up 拖拽流程与四个选择方法与 ok/cancel 提交回滚与 game.check 全景普查与 AI 复用 check / lib.filter 40 成员完整判定树与 unchanged 哨兵惯用法与 cardEnabled/cardRespondable/cardUsable/filterCard/filterTrigger/filterEnable 门链与 _aiexclude 类型陷阱 / checkMod 修饰管道元参数解析与累加器语义与 modType 50 类清单与 mod 字段形态与 gameEvent.custom 双挂点与 getModableSkills 快路径） | `noname/ui/click/index.js:2`、`:2086`、`:2249`、`:2600`、`:2617`、`:2673`、`:2839`、`:3090`、`:3167`、`noname/ui/index.js:15`、`noname/init/index.ts:273`、`noname/library/element/card.js:36`、`:917`、`noname/library/element/content.ts:5129`、`noname/ui/create/index.js:2195`、`noname/ai/basic.js:62`、`noname/library/index.js:10936`、`:11030`、`:11070`、`:11175`、`:11347`、`:11391`、`:11474`、`:11581`、`:11596`、`:950`、`noname/game/index.js:9002`、`noname/library/element/player.js:5619`、`:16594`、`noname/library/element/gameEvent.ts:756`、`:963` |
  | 选择与触发层（chooseToUse 6 步 339 行与 chooseToRespond 5 步 271 行与 skip_shan 跳过与 chooseToDiscard 5 步 212 行与 card.uncheck/recheck 标签管理与 arrangeTrigger 调度与 filterTrigger 过滤与 silent 优先与 createTrigger 12 步执行与 hookTrigger.after 回调与 draw 四级牌源与 discard 可见弃牌与 changeHp 护甲吸收与濒死解决与 changeHujia 终端方法与 rest/restEnd 休整标记与 revive 座位链重建） | `noname/library/element/content.ts:5129`、`:5468`、`:5909`、`:4017`、`:4079`、`:10825`、`:10902`、`:12229`、`:12322`、`:12372`、`:12705`、`:12775` |
  | 牌 DOM 元素与 updateTransform | `apps/core/noname/library/element/card.js` |
| 手牌重排 updatehl | `apps/core/noname/ui/index.js` |
| check 的点击调用点（约 20 处） | `apps/core/noname/ui/click/index.js` |
| 自用ai 扩展（全部性能优化所在） | `apps/core/extension/自用ai/extension.js` |

函数行为与成本分析详见根目录 `知识库.md` 第六至三十八章；三十九至四十三章为项目 / 平台 / 扩展工程层（仓库结构、扩展生命周期、入库白名单、配置持久化、内容编译链），四十五至四十九章为模式与运行时边界（模式切换、双将协议、姿态矩阵、沙盒隔离、联机与录像），五十一至五十七章为交互与数据装载层（UI 与 check 判定、DOM 工厂与动态样式、动画与 transform、poptip 与 toast、卡牌角色装载、lib Proxy 与覆盖规则、library 支撑模块），五十九至六十四章为资源与构建层（布局与主题、assetURL 与资源生成、图片皮肤优先级、构建与启动入口、脚本式加载与全局注入、状态容器与元素基类），六十六至七十章为运行内核层（game 主体与事件循环、Player 生命周期与方法清单、模式脚本内部结构对照、胜利判定体系、乱斗扩展点全景），七十二至七十六章为 AI 决策与缓存支撑层（AI 单例与键生成、Basic 打分工厂、选择器 content 与 AI 分支、触发器注册与调度、三层缓存体系），七十八至八十章为选牌与数据装载层（game.check 与 Check 判定管线、get 选牌打分内核、技能数据装载与元素层汇聚），八十二至八十四章为交互闭环层（Click 类与事件派发闭环、lib.filter 完整判定树、checkMod 修饰管道路由），八十六至八十九章为卡牌结算与生命系统层（useSkill 结算链与事件工厂、牌流三剑客 gain/lose/addToExpansion、伤害-濒死-死亡生命系统、respond 响应结算），九十一至九十三章为阶段与判定层（phase 全家桶与回合循环、useCard 18 步 730 行卡牌使用结算、判定系统 judge/addJudge/turnOver/link），九十五至九十七章为选择与触发层（chooseToUse/chooseToRespond/chooseToDiscard 三方法交互选择系统、arrangeTrigger/createTrigger 触发器调度引擎、draw/discard/changeHp/changeHujia/rest/restEnd/revive 异步基础方法），九十九至一百零三章为批流拼点夺牌层（批量牌流 gaincardMultiple/discardMultiple/addToExpansionMultiple/loseToDiscardpileMultiple、拼点系统全谱、夺牌三连、展示查看移动技能挑选、批索引），一百零四至一百一十二章为 content.ts 全量收官层（宏物件与状态工具、装备栏与势力身份、议事·场控·牌区迁移、装备栏禁用·回合·随从分身、复用选目标·包加载·录像·联机等待·手气置换、phase 回合主循环·六阶段·赠予牌流、九大选择器统一框架、牌流杂项·体力上限·观星·拖拽排序、收官索引与全量覆盖声明）；一百一十三至一百二十二章为 player.js 全量收官层（构造与 DOM 骨架、辩论协力氏族换将换肤、状态标记技能牌区阶段工厂、九大选择器工厂、牌流状态生命三大家族、技能挂载标记临时技能体系、判定辅助历史阵营状态海、$ 特效与虚拟牌、获得动画特效死亡判定动画收尾、收官索引与全量覆盖声明，覆盖 player.js 16594 行全部 486 个顶层方法）；一百二十三至一百三十三章为 library/index.js 全量收官层（类骨架与全局字段区、机制数据区、configMenu 通用与外观/显示音频其它配置组与 extensionMenu、mode 十一模式配置区、状态帮助文件系统 UI 挂接 cheat、translate Proxy 与 element/card 内置牌、filter 40 成员全链、sort 排序器与 skill·character Proxy 与 message 联机消息 43 键、数据常量区含 namePrefix 前缀表、库导出收尾与全量覆盖声明，覆盖 library/index.js 15031 行全部区段；其中一百二十三至一百三十三章均已深化为逐项详解版，mode 十一模式、cheat 36 键、filter 40 成员、message 43 键、translate 246 键、namePrefix 113 条、characterPack 双重 Proxy 与 arenaReady 四段与 pinyins 元数据均按行号逐项成表）。content.ts 侧深化进度：一百零四至一百零九章已深化为逐项详解版（宏物件与状态工具、装备栏与势力身份、议事·场控·牌区迁移、装备栏禁用·回合·随从分身、复用选目标·包加载·录像·联机等待·手气置换、phase 回合主循环·六阶段·赠予牌流，均按行号逐项成表），一百一十至一百一十二章待续。

## 文档

- 项目技术知识沉淀：根目录 `知识库.md`
- 平台级记忆（行为指令与项目知识）：`.monkeycode/MEMORY.md`
- 本体官方文档：`docs/`
