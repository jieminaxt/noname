
import { lib, game, ui, get, ai, _status } from "../../../noname.js";

const buffPack = {
    'buff_txhj_aozhan': {
        name: '鏖战',
        info: '对局结束时，你的体力和体力上限不回复',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'buff_txhj_aozhan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yanhuo': {
        name: '焱火',
        info: '你造成的火焰伤害+1',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_yanhuo'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jinglei': {
        name: '惊雷',
        info: '你造成的雷电伤害+1',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_jinglei'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xihuo': {
        name: '熄火',
        info: '你受到的火焰伤害-1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_xihuo'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_dinglei': {
        name: '定雷',
        info: '你受到的雷电伤害-1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_dinglei'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wuzhongshengsha': {
        name: '无中生杀',
        info: '准备阶段，你从牌堆或弃牌堆中获得一张[杀]',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wuzhongshengsha'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wuzhongshengshan': {
        name: '无中生闪',
        info: '结束阶段，你从牌堆或弃牌堆中获得一张[闪]',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wuzhongshengshan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fengyushengcai': {
        name: '丰裕生财',
        info: '每轮开始时，若你未受伤，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_fengyushengcai'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jipodizhen': {
        name: '击破敌阵',
        info: '你造成伤害后，随机弃置受伤角色区域内的一张牌',
        rank: 3,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jipodizhen'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wenhezhenlue': {
        name: '文和缜略',
        info: '你使用的锦囊牌不能被[无懈可击]响应',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_wenhezhenlue'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wenhejibei': {
        name: '文和计备',
        info: '你不能成为延时锦囊牌的目标',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_wenhejibei'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yueyingdezhihui': {
        name: '月英的智慧',
        info: '你使用锦囊牌无距离限制',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_yueyingdezhihui'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_changbingguangren': {
        name: '长兵广刃',
        info: '你的攻击范围+3',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_changbingguangren'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fuzu': {
        name: '富足',
        info: '游戏开始时，你的初始手牌数等于你的体力上限',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_fuzu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xiaojideyongwu': {
        name: '枭姬的勇武',
        info: '当你失去装备区内的牌时，摸两张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_xiaojideyongwu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xiongziyingfa': {
        name: '雄姿英发',
        info: '摸牌阶段，你多摸一张牌，你的手牌上限为你的体力上限',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_xiongziyingfa'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wuxiangdexinxue': {
        name: '吴相的心血',
        info: '你的手牌上限+3',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_wuxiangdexinxue'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_juguzhidao': {
        name: '巨贾之道',
        info: '你在商店购买每个类别内容第一次溢价时不溢价',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_juguzhidao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_pozhenzhifeng': {
        name: '破阵之锋',
        info: '出牌阶段，若你的装备区内有武器牌，敌方角色的防具失效',
        rank: 2,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_pozhenzhifeng'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yanrenzhinu': {
        name: '燕人之怒',
        info: '若你的装备区内有武器牌，你每阶段使用的第二张[杀]不能被响应',
        rank: 2,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_yanrenzhinu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_dunjiazhoufa': {
        name: '遁甲咒法',
        info: '若你的装备区内有武器牌，你的属性[杀]不能被响应',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_dunjiazhoufa'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_ziyideyongzhan': {
        name: '子义的勇战',
        info: '若你的装备区内有武器牌，你每阶段第二张[杀]造成的伤害+1',
        rank: 2,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_ziyideyongzhan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yanhuozhiren': {
        name: '焱火之刃',
        info: '若你的装备区内有武器牌，你造成的火焰伤害+1',
        rank: 2,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_yanhuozhiren'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jingleizhiren': {
        name: '惊雷之刃',
        info: '若你的装备区内有武器牌，你造成的雷电伤害+1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jingleizhiren'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yingjicuoshijia': {
        name: '应急措施甲',
        info: '当你失去防具时，回复1点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yingjicuoshijia'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yingjicuoshiyi': {
        name: '应急措施乙',
        info: '当你失去防具时，摸两张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yingjicuoshiyi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xihuozhikai': {
        name: '熄火之铠',
        info: '若你的装备区内有防具牌，你受到的火焰伤害-1',
        rank: 1,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_xihuozhikai'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_dingleizhikai': {
        name: '定雷之铠',
        info: '若你的装备区内有防具牌，你受到的雷电伤害-1',
        rank: 3,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_dingleizhikai'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yueyingdejiqiao': {
        name: '月英的机巧',
        info: '你的判定牌生效后，若你装备区内有牌，你摸一张牌',
        rank: 3,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_yueyingdejiqiao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_taipingzhoufa': {
        name: '太平咒法',
        info: '你使用属性[杀]造成的伤害+1',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_taipingzhoufa'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_baijujianchu': {
        name: '白驹鞬出',
        info: '当你使用普通[杀]造成伤害后，随机弃置目标角色的一张牌',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_baijujianchu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_juejingzhice': {
        name: '绝境之策',
        info: '当你使用[闪]后，若你没有手牌，你摸两张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_juejingzhice'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xumingshenyao': {
        name: '续命神药',
        info: '你的[桃]濒死回复量+1',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_xumingshenyao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wuweizhile': {
        name: '无为之乐',
        info: '场上其他角色的[乐不思蜀]生效后，其本局手牌上限-1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wuweizhile'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yuanduandilue': {
        name: '远断敌略',
        info: '你使用[兵粮寸断]无距离限制',
        rank: 3,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_yuanduandilue'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jiezizhidao': {
        name: '截辎之道',
        info: '场上的[兵粮寸断]生效后，你摸一张牌',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_jiezizhidao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_huangtiannizhuan': {
        name: '黄天逆转',
        info: '敌方角色的[闪电]判定效果反转',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_huangtiannizhuan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_dongchazhiyan': {
        name: '洞察之眼',
        info: '你使用[顺手牵羊]时，目标角色的手牌对你可见',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_dongchazhiyan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_mingjingzhiyan': {
        name: '明镜之眼',
        info: '你使用[过河拆桥]时，目标角色的手牌对你可见',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_mingjingzhiyan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_juxiangzhifeng': {
        name: '巨象之锋',
        info: '你使用的[南蛮入侵]需额外弃置一张牌才能响应',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_juxiangzhifeng'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_luanjifengshi': {
        name: '乱击锋矢',
        info: '你使用的[万箭齐发]需额外弃置一张牌才能响应',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_luanjifengshi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_taoyuanyishi': {
        name: '桃园义誓',
        info: '你使用的[桃园结义]对己方角色的回复量+1',
        rank: 2,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_taoyuanyishi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_haoshidebaochao': {
        name: '好施的报偿',
        info: '你使用[五谷丰登]后摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_haoshidebaochang'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_duocejiyong': {
        name: '夺策己用',
        info: '你使用[无懈可击]生效时，你获得被抵消的牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_duocejiyong'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wolongmice': {
        name: '卧龙秘策',
        info: '你使用[火攻]可以弃置同颜色的牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wolongmice'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fenchengluetu': {
        name: '焚城掠土',
        info: '你使用[火攻]造成伤害时，获得目标角色展示的牌',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_fenchengluetu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_bowenqiangzhi': {
        name: '博闻强识',
        info: '答题事件自动为你排除一个错误答案',
        rank: 3,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_bowenqiangzhi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jufuxionghao': {
        name: '巨富雄豪',
        info: '装备宝物时，你使用与宝物花色相同的牌时摸一张牌（每回合每种花色限一次）',
        rank: 3,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_jufuxionghao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_majundegaizao': {
        name: '马钧的改造',
        info: '当你获得装备牌后，若此牌可以进化为精械，进化之',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_majundegaizao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xianhujiqu': {
        name: '仙葫汲取',
        info: '战斗胜利后，若你的体力上限大于战斗前的体力上限，继承结束后的体力上限',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_xianhujiqu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fuchendangmo': {
        name: '拂尘荡魔',
        info: '当你因武器效果令其他角色弃牌时，弃牌数+1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_fuchendangmo'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shenfuhuaxie': {
        name: '神符化邪',
        info: '当你受到伤害后，你获得造成伤害的牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shenfuhuaxie'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_gongzhibaowu': {
        name: '攻之宝物',
        info: '当你的装备区内有宝物牌，准备阶段，你从牌堆或弃牌堆中获得一张[杀]',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_gongzhibaowu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fangzhibaowu': {
        name: '防之宝物',
        info: '若你的装备区内有宝物牌，结束阶段，你从牌堆或弃牌堆中获得一张[闪]',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_fangzhibaowu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_suikuiliejia': {
        name: '碎盔裂甲',
        info: '若你的装备区内有武器牌，你使用[杀]造成伤害后，你弃置目标角色的防具牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_suikuiliejia'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yiguzuoqi': {
        name: '一鼓作气',
        info: '若你的装备区内有武器牌，你每阶段使用第二张[杀]时，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yiguzuoqi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shangjiangdelvli': {
        name: '上将的膂力',
        info: '若你的装备区有武器牌，若你发动武器效果需要弃置牌，弃牌数-1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shangjiangdelvli'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shenhanxueyin': {
        name: '深寒雪饮',
        info: '若你的装备区内有武器牌，若你发动武器效果弃置了其他角色牌，改为获得之',
        rank: 2,
        store: true,
        value: 400,
        skills: [
            'buff_txhj_shenhanxueyin'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_xiuluodebeimin': {
        name: '修罗的悲悯',
        info: '若你装备区内有武器牌，你令一名角色回复体力后，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_xiuluodebeimin'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_cebeibuyu': {
        name: '策备不虞',
        info: '若你的装备区内有防具牌，你受到的锦囊伤害-1',
        rank: 2,
        store: true,
        value: 400,
        skills: [
            'buff_txhj_cebeibuyu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_gongtaizhizhi': {
        name: '公台之智',
        info: '若你的装备区内有防具牌，且你每轮未受到伤害，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_gongtaizhizhi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_tianxiawushuang': {
        name: '天下无双',
        info: '你的普通[杀]造成的伤害+1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tianxiawushaung'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jijianchangge': {
        name: '击剑长歌',
        info: '当你于回合外使用或打出一张[杀]后，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jijianchangge'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_huangtianzhinu': {
        name: '黄天之怒',
        info: '当你造成属性伤害后，随机弃置目标角色的一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huangtianzhinu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_luoshenjuezhang': {
        name: '洛神绝章',
        info: '每轮限一次，你使用[闪]后摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_luoshenjuezhang'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shenyizhidao': {
        name: '神医之道',
        info: '你的[桃]正常回复量+1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shenyizhidao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_mowangdejianiang': {
        name: '魔王的佳酿',
        info: '你的[酒]增加伤害效果持续至回合结束',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_mowangdejianiang'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_hannu': {
        name: '酣怒',
        info: '当你使用[酒]后，你获得牌堆中的一张[杀]',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_hannu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_gusoejueyan': {
        name: '国色绝艳',
        info: '场上的[乐不思蜀]生效后，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_guosejueyan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_mingyundezhiyi': {
        name: '命运的旨意',
        info: '当你使用[闪电]后，横置场上所有敌方角色',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_mingyundezhiyi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_ximengzhili': {
        name: '系盟之利',
        info: '你使用[远交近攻]多摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_ximengzhili'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_hengxingwuji': {
        name: '横行无忌',
        info: '你使用[过河拆桥]后摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_hengxingwuji'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shierqicejin': {
        name: '十二奇策进',
        info: '你使用的[南蛮入侵]和[万箭齐发]对己方角色无效（仍成为目标）',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shierqicejin'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shierqicetui': {
        name: '十二奇策退',
        info: '你使用的[桃园结义]和[五谷丰登]对敌方角色无效（仍成为目标）',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shierqicetui'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_pofuchenzhou': {
        name: '破釜沉舟',
        info: '你的初始手牌数为1，准备阶段和结束阶段，你摸一张牌，优先级高于(富足)',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_pofuchenzhou'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_huangtianyili': {
        name: '黄天已立',
        info: '你的判定结果花色视为黑桃',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huangtianyili'
        ],
        sort: 'HuanTianZhiNu'
    },
    'buff_txhj_huangtianzhizu': {
        name: '黄天之诅',
        info: '你的判定结果视为黑桃 5 ',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huangtianzhizu'
        ],
        sort: 'HuanTianZhiNu'
    },
    'buff_txhj_huangtianzhimin': {
        name: '黄天之悯',
        info: '你的判定牌生效后，你可以摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huangtianzhimin'
        ],
        sort: 'HuanTianZhiNu'
    },
    'buff_txhj_tiangongdebihu': {
        name: '天公的佑护',
        info: '若你在施法技能选择的 X 大于 1 ，你在（X-1）的结束阶段即可触发效果',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tiangongdebihu'
        ],
        sort: 'HuanTianZhiNu'
    },
    'buff_txhj_tiangongdebihu': {
        name: '地公的佑护',
        info: '你的施法技能 X 上限+1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_digongdebihu'
        ],
        sort: 'HuanTianZhiNu'
    },
    'buff_txhj_tiangongdebihu': {
        name: '人公的佑护',
        info: '你使用施法技能后，可以摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_rengongdebihu'
        ],
        sort: 'HuanTianZhiNu'
    },
    //魔改buff
    'buff_txhj_lingboweibu': {
        name: '凌波微步',
        info: '每轮结束时，若你本轮没有受到伤害，你令所有其他角色失去一点体力，然后你摸等量张牌',
        rank: 3,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_lingboweibu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_zhishangtanbing': {
        name: '纸上谈兵',
        info: '当你失去体力后，你摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_zhishangtanbing'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shirupozhu': {
        name: '势如破竹',
        info: '你对没有手牌的角色造成伤害+1',
        rank: 3,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shirupozhu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_daoguangjianying': {
        name: '刀光剑影',
        info: '你使用的转化基本牌不能被响应',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_daoguangjianying'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_manhuafeiying': {
        name: '蛮花飞影',
        info: '其他角色使用【闪】后受到来自你的一点伤害',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_manhuafeiying'
        ],
        sort: 'MGQiQinMengHuo'
    },
    'buff_txhj_yanlihongyan': {
        name: '艳丽红颜',
        info: '你的判定结果花色视为红桃',
        rank: 2,
        value: 370,
        store: true,
        skills: [
            'buff_txhj_yanlihongyan'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_moqiyangwei': {
        name: '魔骑的扬威',
        info: '当你使用普通[杀]造成伤害后，你立即摸两张牌',
        rank: 3,
        value: 720,
        store: true,
        skills: [
            'buff_txhj_moqiyangwei'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_kuanglangzhishi': {
        name: '狂狼之噬',
        info: '你造成伤害后，你回复1点体力值',
        rank: 3,
        value: 550,
        store: true,
        skills: [
            'buff_txhj_kuanglangzhishi'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_liangyongzhixiao': {
        name: '凉勇之骁',
        info: '你使用的黑色【杀】不可被响应',
        rank: 3,
        value: 700,
        store: true,
        skills: [
            'buff_txhj_liangyongzhixiao'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_hanshishuaiwei': {
        name: '汉室衰微',
        info: '其他角色的结束阶段开始时，若其体力值为全场最小，则其失去1点体力',
        rank: 2,
        value: 380,
        store: true,
        skills: [
            'buff_txhj_hanshishuaiwei'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_fanjianzhiji': {
        name: '反间之计',
        info: '其他角色获得你的手牌时，你对其造成1点伤害',
        rank: 3,
        value: 660,
        store: true,
        skills: [
            'buff_txhj_fanjianzhiji'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_bushizhigong': {
        name: '不世之功',
        info: '你拼点的牌点数视为K',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_bushizhigong'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_baibuchuanyang': {
        name: '百步穿杨',
        info: '你对攻击范围内没有你的角色造成的伤害+1',
        rank: 3,
        value: 800,
        store: true,
        skills: [
            'buff_txhj_baibuchuanyang'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_guosetianxiang': {
        name: '国色天香',
        info: '每回合限一次，当你于回合外失去牌时，你摸两张牌',
        rank: 2,
        value: 620,
        store: true,
        skills: [
            'buff_txhj_guosetianxiang'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_yongguansanjun': {
        name: '勇冠三军',
        info: '每当你使用基本牌后，从牌堆中随机获得一张锦囊牌',
        rank: 3,
        value: 900,
        store: true,
        skills: [
            'buff_txhj_yongguansanjun'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_huangtianyisi': {
        name: '黄天也死了',
        info: '你的判定牌生效后，你流失1点体力',
        rank: 1,
        value: 140,
        store: true,
        skills: [
            'buff_txhj_huangtianyisi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_weifengcainiang': {
        name: '尾蜂的采酿',
        info: '当你使用[桃]后，你获得牌堆中的一张[闪]',
        rank: 2,
        value: 390,
        store: true,
        skills: [
            'buff_txhj_weifengcainiang'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_laozhedezhutuo': {
        name: '老者的嘱托',
        info: '当你于回合外使用或打出一张[闪]后，你摸一张牌',
        rank: 2,
        value: 360,
        store: true,
        skills: [
            'buff_txhj_laozhedezhutuo'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_yinghuoshouxin': {
        name: '荧惑兽心',
        info: '若你的装备区内有防具牌，且你每轮未受到伤害，你增加1点体力上限',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yinghuoshouxin'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_zhedaoduanqi': {
        name: '折刀断器',
        info: '若你的装备区内有武器牌，你使用[杀]造成伤害后，你弃置目标角色的武器牌',
        rank: 2,
        value: 380,
        store: true,
        skills: [
            'buff_txhj_zhedaoduanqi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_huoshinifeng': {
        name: '火势逆风',
        info: '敌方角色的[火山]判定效果反转',
        rank: 2,
        value: 470,
        store: true,
        skills: [
            'buff_txhj_huoshinifeng'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_bingfeng': {
        name: '冰封',
        info: '你造成的寒冰伤害+1',
        rank: 2,
        value: 420,
        store: true,
        skills: [
            'buff_txhj_bingfeng'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_shanluwushe': {
        name: '杀戮无赦',
        info: '你使用[杀]结算后摸一张牌',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shanluwushe'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_dushidemiyan': {
        name: '毒仕的迷烟',
        info: '你的判定结果视为梅花4 ',
        rank: 1,
        value: 200,
        store: true,
        skills: [
            'buff_txhj_dushidemiyan'
        ],
        sort: 'LiGuoZhiLuan'
    },
    'buff_txhj_chenxverru': {
        name: '趁虚而入',
        info: '当你的装备区内有宝物牌，准备阶段，你从牌堆或弃牌堆中获得一张[逐近弃远]',
        rank: 1,
        value: 250,
        store: true,
        skills: [
            'buff_txhj_chenxverru'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_taozeifengshi': {
        name: '讨贼锋矢',
        info: '你使用的[杀]需额外弃置一张牌才能闪避',
        rank: 2,
        value: 450,
        store: true,
        skills: [
            'buff_txhj_taozeifengshi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_bailitoujie': {
        name: '百里偷劫',
        info: '你使用[顺手牵羊]无距离限制',
        rank: 2,
        value: 380,
        store: true,
        skills: [
            'buff_txhj_bailitoujie'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_hubaochongsha': {
        name: '虎豹冲杀',
        info: '你使用基本牌无距离限制',
        rank: 1,
        value: 250,
        store: true,
        skills: [
            'buff_txhj_hubaochongsha'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_huangjinfushen': {
        name: '黄巾符身',
        info: '你不能成为普通锦囊牌的目标',
        rank: 3,
        value: 700,
        store: true,
        skills: [
            'buff_txhj_huangjinfushen'
        ],
        sort: 'GFHuangJinZhiLuan'
    },
    'buff_txhj_anjianzhicui': {
        name: '暗箭之摧',
        info: '你使用的基本牌不能被[闪]响应',
        rank: 3,
        value: 650,
        store: true,
        skills: [
            'buff_txhj_anjianzhicui'
        ],
        sort: 'MGBaWangZhengCheng'
    },
    'buff_txhj_manzuzaoluan': {
        name: '蛮族造乱',
        info: '准备阶段，你从牌堆或弃牌堆中获得一张[南蛮入侵]',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_manzuzaoluan'
        ],
        sort: 'GFQiQinMengHuo'
    },
    'buff_txhj_jigongsuzhan': {
        name: '急攻速战',
        info: '准备阶段，你从牌堆或弃牌堆中获得一张伤害类锦囊牌',
        rank: 3,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_jigongsuzhan'
        ],
        sort: 'MGGuanDuZhiZhan'
    },
    'buff_txhj_qiaojieyongmeng': {
        name: '趫捷勇猛',
        info: '结束阶段，你摸X张牌（X为你装备区的牌数+1）',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_qiaojieyongmeng'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_yishaoshengduo': {
        name: '以少胜多',
        info: '你使用[杀]造成伤害后，若指定目标的手牌数大于你，该伤害+2',
        rank: 3,
        value: 450,
        store: true,
        skills: [
            'buff_txhj_yishaoshengduo'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_cuifengwuxie': {
        name: '摧封无懈',
        info: '结束阶段，你从牌堆或弃牌堆中获得一张[无懈可击]',
        rank: 2,
        value: 300,
        store: true,
        skills: [
            'buff_txhj_cuifengwuxie'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_jianzhichongzu': {
        name: '箭支充足',
        info: '你使用[万箭齐发]后摸一张牌',
        rank: 2,
        value: 300,
        store: true,
        skills: [
            'buff_txhj_jianzhichongzu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_choudaosidong': {
        name: '抽刀伺动',
        info: '你的回合外，你使用[闪]生效时，你获得被抵消的[杀]',
        rank: 2,
        value: 300,
        store: true,
        skills: [
            'buff_txhj_choudaosidong'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_xuweidezunwei': {
        name: '虚伪的尊威',
        info: '你使用[无中生有]多摸一张牌',
        rank: 3,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_xuweidezunwei'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_longtenghudan': {
        name: '龙腾虎胆',
        info: '你使用转化【杀】造成的伤害+1',
        rank: 2,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_longtenghudan'
        ],
        sort: 'HaiWaiFengHe'
    },
    /*以下为其他魔改大佬的魔改buff*/
    'buff_txhj_xiandengduokui': {
        name: '先登夺魁',
        info: '若你本回合使用过[杀]，你的[杀]均视为J点，你的J点[杀]伤害+1',
        rank: 4,
        value: 800,
        store: true,
        skills: [
            'buff_txhj_xiandengduokui'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_mingchaqiuhao': {
        name: '明查秋毫',
        info: '敌方角色的准备阶段，若其体力值不大于你，你对其使用一张[知己知彼]',
        rank: 1,
        value: 250,
        store: true,
        skills: [
            'buff_txhj_mingchaqiuhao'
        ],
        sort: 'HaiWaiFengHe'
    },
    /*分界线——*/
    'txhj_dundunSkill1': {
        name: '勇往直前',
        info: '当你使用【杀】指定目标后，你有10/20/40/60/80/100%的概率摸一张牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_dundunSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_dundunSkill2': {
        name: '忠誌',
        info: '当你受到伤害时，若此伤害值大于1，令该伤害-1',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_dundunSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jiuweiSkill1': {
        name: '狐火灵气',
        info: '其他角色回合开始时，你有10/20/40/60/80/100%的概率使其本回合以你为唯一目标的所有锦囊牌失效.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jiuweiSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jiuweiSkill2': {
        name: '秘思',
        info: '你的回合内，其他角色使用或打出的第一张非锦囊牌失效.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jiuweiSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jiuweiSkill3': {
        name: '九尾之命',
        info: '当你受到1点伤害后，你摸x张牌(x为9-此技能发动次数，当x为0时，此技能失效).',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jiuweiSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_tengsheSkill1': {
        name: '雷奔云谲',
        info: '每回合限一次，当你在回合外受到非属性伤害时20/30/40/60/80/100%对伤害来源使用一张雷属性的杀.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_tengsheSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_tengsheSkill2': {
        name: '紫电',
        info: '你的回合结束时对所有已受伤的敌方角色造成1点雷电伤害，如果仅有1名满足条件的敌方角色，则改为造成2点雷电伤害.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_tengsheSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_tengsheSkill3': {
        name: '迅雷风烈',
        info: '每回合限一次，当其他角色受到雷属性伤害时，你回复1点体力并摸两张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_tengsheSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_ditingSkill1': {
        name: '披坚执锐',
        info: '当你造成伤害后，你有10/20/40/60/80/100%的概率回复1点体力',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_ditingSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_ditingSkill2': {
        name: '轻健',
        info: '当你受到伤害后，增加一点体力上限',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_ditingSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_ditingSkill3': {
        name: '巧捷万端',
        info: '回合结束时，你摸x张牌，并对x名敌方角色造成1点伤害(x为本回合使用不同点数的牌的数量)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_ditingSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qilinSkill1': {
        name: '麒麟之姿',
        info: '摸牌阶段结束时，你有20/30/40/60/80/100%的概率摸x张牌(x为你摸牌阶段的摸牌数)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_qilinSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qilinSkill2': {
        name: '掌火',
        info: '每回合限两次，你造成火焰伤害后，你回复1点体力并获得该受伤角色的1张牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_qilinSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qilinSkill3': {
        name: '腾焰飞芒',
        info: '出牌阶段开始时和结束时，你视为对一名随机敌方角色使用一张【火攻】',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_qilinSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_youyouSkill1': {
        name: '承天之佑',
        info: '每回合限一次，当你于回合外受到伤害后，你有20/30/40/60/80/100%的概率摸两张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_youyouSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_youyouSkill2': {
        name: '守护',
        info: '每回合限一次，当你在摸牌阶段外一次性获得大于一张牌后，你随机令一名已受伤的友方角色回复1点体力.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_youyouSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_minminSkill1': {
        name: '娉婷万種',
        info: '每回合限一次，当你受到伤害后，你有10/20/40/60/80/100%的概率摸x张牌(x为本次伤害值)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_minminSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_minminSkill2': {
        name: '依人',
        info: '每回合限两次，当你一次性摸不小于2张牌后，你令一名随机友方已受伤角色回复一点体力',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_minminSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qiaoqiaoSkill1': {
        name: '慧心巧思',
        info: '每当延时类锦囊牌进入其他角色判定区时，你有20/30/40/60/80/100%的概率随机令一名敌方角色失去一点体力',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_qiaoqiaoSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qiaoqiaoSkill2': {
        name: '清婉',
        info: '回合结束时，你将手牌数摸至体力值。(至多为5)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_qiaoqiaoSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yayaSkill1': {
        name: '慷慨鸭昂',
        info: '每回合限四次，当你使用红色牌或被其他角色的红色牌指定为目标时，你有20/30/40/60/80/100%的概率摸一张牌；你每通过此技能获得4张牌，你对一名随机敌方角色造成1点伤害',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yayaSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yayaSkill2': {
        name: '鸭立',
        info: '每局对局限一次，当你进入濒死状态时，你将体力回复至1点，并在你受到伤害、流失体力、回复体力时防止之，直到你的下个回合开始',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yayaSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_datongSkill1': {
        name: '金鸡独立',
        info: '当你进入濒死状态时，你回复体力至1点 (每次对局限至多触发一次).',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_datongSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_luluSkill1': {
        name: '如虎添翼',
        info: '出牌阶段开始时，你摸两张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_luluSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_luluSkill2': {
        name: '虎威',
        info: '你于回合内使用第一张[杀]时，若你本回合获得牌数不小于x (x为你的当前体力值)，则你此[杀]不可响应且伤害+1.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_luluSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aleSkill1': {
        name: '乐不可支',
        info: '当你于一个回合第一次成为一张基本牌的目标后，若此牌未对你造成伤害，你摸一张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_aleSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aleSkill2': {
        name: '饞嘴王',
        info: '准备阶段，若你已受伤且体力值不是全场最高，你回复1点体力.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_aleSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_ruiSkill1': {
        name: '祥云瑞气',
        info: '出牌阶段结束时，你对手牌数小于你的敌方角色造成1点火焰伤害.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_ruiSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_ruiSkill2': {
        name: '神妙',
        info: '准备阶段和结束阶段，若你的手牌数为奇数，你令随机一个我方角色摸一张牌；若手牌数为偶数，你令随机一个敌方角色随机弃一张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_ruiSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_ruiSkill3': {
        name: '洞若观火',
        info: '当你成为其他角色使用的普通锦囊牌的目标时，你进行判定：若为红色，则此锦囊无效且你获得之.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_ruiSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yueerSkill1': {
        name: '花容月貌',
        info: '每轮限一次，当男性角色受到伤害后，你回复一点体力并摸一张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yueerSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yueerSkill2': {
        name: '娇面',
        info: '弃牌阶段结束时，你摸两张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yueerSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yanSkill1': {
        name: '神鬼不测',
        info: '当你成为其他角色使用的普通锦囊的唯一目标时，你进行判定：若为黑色，则改为你对使用者使用该锦囊.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yanSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yanSkill2': {
        name: '反计',
        info: '每回合限一次，当你受到其他角色的伤害后，你视为对伤害来源使用一张杀，若该杀造成伤害，则你回复1点体力.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yanSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yanSkill3': {
        name: '天外之火',
        info: '每回合限一次，当你对其他角色造成伤害后，进行一次判定：黑色你获得其一张牌，红色你摸两张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_yanSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_liuliSkill1': {
        name: '墨玉点雪',
        info: '其他角色的回合限一次，当你失去牌时，对当前回合角色造成1点伤害.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_liuliSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_liuliSkill2': {
        name: '伶俐',
        info: '每回合限一次，其他角色在弃牌阶段弃牌后，你从弃牌堆获得一张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_liuliSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_manmanSkill1': {
        name: '弄鬼掉猴',
        info: '回合开始时，你视为使用一张【南蛮入侵】;【南蛮入侵】每造成1点伤害你摸1张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_manmanSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_manmanSkill2': {
        name: '捣蛋',
        info: '每回合限一次，当你对其他角色造成伤害后，你随机获得其一张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_manmanSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_xiaoxiaoSkill1': {
        name: '矢无虚发',
        info: '每回合限一次，当你成为其他角色使用普通锦囊牌的目标后，若你没有受到伤害，则你回复1点体力（若体力已满则改为摸一张牌）',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_xiaoxiaoSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_xiaoxiaoSkill2': {
        name: '弓上弦',
        info: '弃牌阶段结束时，你从每名装备区装备数不大于你的其他角色处随机获得1张手牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_xiaoxiaoSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_xuerenSkill1': {
        name: '轻舞飞扬',
        info: '回合结束时，若你本回合造成过伤害，你摸一张牌.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_xuerenSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_xuanwuSkill1': {
        name: '倚天拔地',
        info: '当其他角色回复体力时，你回复1点体力.',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_xuanwuSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_xuanwuSkill2': {
        name: '蛇影',
        info: '每回合限一次，当你弃置手牌或手牌被弃置时，你随机对X名敌方角色造成1点伤害并摸X张牌。（X为你本次弃置手牌数除以2向上取整）',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_xuanwuSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_xuanwuSkill3': {
        name: '玄冥真主',
        info: '当其他角色使用锦囊牌指定你为目标时，若该牌点数小于等于你的手牌数，则该锦囊无效',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_xuanwuSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'diychunxiao': {
        name: '春晓',
        info: '你的回合结束时，你若为受伤状态，额外有50%的几率恢复至满体力值',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diuchunxiao'
        ],
        sort: 'ChongYingChuLin'
    },
    'diyzhuiling': {
        name: '追灵',
        info: '当你受到伤害时，你可以对伤害来源造成伤害的角色造成1点随机属性伤害（雷或火、冰或毒随机）',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diuzhuiling'
        ],
        sort: 'ChongYingChuLin'
    },
    'diycuidu': {
        name: '淬毒',
        info: '你对一名其他角色造成伤害后，若其没有“中毒”，你令其获得“中毒”，然后你摸两张牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diucuidu'
        ],
        sort: 'ChongYingChuLin'
    },
    'diyfeihua': {
        name: '飞花',
        info: '你的出牌阶段开始时，你可以视为随机使用一张【知己知彼】或【万箭齐发】',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diyfeihua'
        ],
        sort: 'ChongYingChuLin'
    },
    //以下侍灵全部搬运自K佬的【EpicFX】扩展，再次感谢K佬的侍灵素材和技能代码提供! 
    'txhj_axianSkill1': {
        name: '中正卫主',
        info: '每回合限两次，当你受到伤害后，你从牌堆中获得基本牌、锦囊牌各一张。',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_axianSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_axianSkill2': {
        name: '清德',
        info: '准备阶段，若你的手牌数大于体力值，你获得1点体力上限。',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_axianSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kunpengSkill3': {
        name: '厚德载物',
        info: '出牌阶段结束时，若你的手牌数大于当前体力值，你加一点体力上限，然后回复一点体力',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kunpengSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kunpengSkill2': {
        name: '饱德',
        info: '每回合限两次,当你一次性失去至少两张牌时，你从牌堆中获得不同牌名的基本牌各一张',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kunpengSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kunpengSkill1': {
        name: '驭火掣电',
        info: '每回合限一次，当你受到属性伤害时，你有20/30/40/60/80/100%将此伤害随机转移给一名敌方角色',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kunpengSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kuiniuSkill1': {
        name: '王者有德',
        info: '弃牌阶段结束时，你有20/30/40/60/80/100%的概率依次亮出并对随机目标使用牌堆顶的X张牌，这些牌无次数限制且无距离限制(X为本阶段你弃置牌的数量)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kuiniuSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kuiniuSkill2': {
        name: '辟邪',
        info: '每个回合结束时，你摸X张牌。(X为本回合你使用牌的张数)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kuiniuSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kuiniuSkill3': {
        name: '聲震百里',
        info: '每回合限两次，你使用牌后，摸两张牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kuiniuSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qiqiSkill1': {
        name: '道士假面',
        info: '每回合限一次，当你受到伤害时，若你受伤，你有20/30/40/60/80/100%的概率防止此伤害，减少1点体力上限',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_qiqiSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_qiqiSkill2': {
        name: '取食',
        info: '弃牌阶段结束时，若此阶段你弃置超过X张牌，你增加2点体力上限，手牌上限+2。(X为2倍本局游戏中取食发动次数且包括本次)',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_qiqiSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yuanyuanSkill1': {
        name: '斑斓暇日',
        info: '每回合限一次，当你在回合外失去红色牌后，你有20/30/40/60/80/100%的概率回复1点体力，若你体力值已满，则改为摸两张牌',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_yuanyuanSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_yuanyuanSkill2': {
        name: '角斗',
        info: '每回合限一次，当你在回合外回复1点体力后，你随机弃置当前回合角色一张装备牌',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_yuanyuanSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aheSkill1': {
        name: '始振萌动',
        info: '每回合限两次，你使用黑色牌指定其他角色为目标时，有20/30/40/60/80/100%的概率随机弃置其一张牌',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_aheSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aheSkill2': {
        name: '獭祭',
        info: '每回合限两次，当敌方角色因弃置而失去牌时，你摸一张牌',
        rank: 2,
        value: 9999,
        store: false,
        skills: [
            'txhj_aheSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_baizeSkill1': {
        name: '矢志不渝',
        info: '当你受到伤害后，你有20/30/40/60/80/100%的概率随机弃置受到伤害数的手牌，然后回复弃置手牌数的体力',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_baizeSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_baizeSkill2': {
        name: '傲节',
        info: '出牌阶段结束时，你视为对所有敌方角色使用一张无距离限制无次数限制的【杀】，若本次出牌阶段你未使用过【杀】，此【杀】造成的伤害+1',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_baizeSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_baizeSkill3': {
        name: '循循渐进',
        info: '每回合限一次，你使用【杀】结算结束后，若此【杀】造成过伤害，则你回复X点体力。(X为此杀造成的伤害数)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_baizeSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jinwuSkill1': {
        name: '永恒烈日',
        info: '当你第一次进入濒死状态时，你有20/30/40/60/80/100%的概率体力回复至体力上限',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jinwuSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jinwuSkill2': {
        name: '三足',
        info: '你的手牌上限等于体力上限。每回合每种类型限一次，当你使用牌后，你失去1点体力，然后摸X张牌。(X为你已损失的体力值且最大为9)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jinwuSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jinwuSkill3': {
        name: '赤地千里',
        info: '每个回合结束后，若本回合你在弃牌阶段外弃置的牌数大于体力值，则摸等同于弃置牌数的牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jinwuSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_canglongSkill1': {
        name: '风云变色',
        info: '其他角色的准备阶段，你有20/30/40/60/80/100%的概率视为对其使用一张无距离限制的【杀】（你可选择是否执行）',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_canglongSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_canglongSkill2': {
        name: '鸣嗷',
        info: '每回合你使用的第一张【杀】伤害 +1',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_canglongSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_canglongSkill3': {
        name: '披星戴月',
        info: '你的回合内，当你使用【杀】造成伤害后，你摸X张牌(X为本回合你使用【杀】的次数且上限为5)，该效果每回合限触发5次',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_canglongSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kangkangSkill1': {
        name: '丰收瑞鸣',
        info: '每轮限两次，你造成或受到伤害后有20/30/40/60/80/100%的概率摸1张牌。你每通过“丰收瑞鸣”摸2张牌时，你回复一点体力',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kangkangSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kangkangSkill2': {
        name: '安康',
        info: '准备阶段，你摸2张牌，若你未受伤，你弃置你判定区内的所有牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kangkangSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_niuniuSkill1': {
        name: '巧拙守真',
        info: '每回合限两次，当你于回合外失去牌后，你有20/30/40/60/80/100%的概率随机获得当前回合角色一张牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_niuniuSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_niuniuSkill2': {
        name: '兕袭',
        info: '每回合限一次，当你获得其他角色的牌时进行判定：若为红桃，你回复一点体力并获得判定牌；不为红桃，你对其造成1点伤害',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_niuniuSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'diy_xiongshiSkill1': {
        name: '霸体',
        info: '锁定技，当你受到雷电伤害后，你摸X张牌（X为你的体力上限）；当你受到火焰伤害后，你将一张【兵粮寸断】置入伤害来源判定区内并从牌堆中获得一张【杀】',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diy_xiongshiSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'diy_xiongshiSkill2': {
        name: '兽噬',
        info: '每当你造成一次伤害后，你可以对一名不为此目标的其他角色造成1点伤害',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diy_xiongshiSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'diy_xiongshiSkill3': {
        name: '狂狮愤戾',
        info: '当你使用牌时，其他角色不能使用或打出牌响应；你使用牌指定唯一目标造成伤害时，若你的手牌数大于其则你从牌堆中随机获得一张基本牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'diy_xiongshiSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'tx_yuelingSkill1': {
        name: '灵月之舞',
        info: '弃牌阶段结束时,你依次对随机目标使用弃牌阶段你弃置的牌(无次数限制且无距离限制)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'tx_yuelingSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'tx_yuelingSkill2': {
        name: '同辉',
        info: '其他角色出牌阶段开始时，若你手牌数小于其,则你减少1点体力上限,随机获得其x张牌(x为你与其手牌差值且最多为5)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'tx_yuelingSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'tx_yuelingSkill3': {
        name: '月华流转',
        info: '当你减少1点体力上限后，回复1点体力。若以此法回复体力超过体力上限时,超过部分的数值转化为体力上限',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'tx_yuelingSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aHaoSkill1': {
        name: '豪门贵胄',
        info: '每场战斗结束时，你获得一件随机装备',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_aHaoSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aHaoSkill2': {
        name: '神勇',
        info: '每当你在牌局内失去装备时对所有敌人造成1点伤害',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_aHaoSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_aHaoSkill3': {
        name: '攫戾執猛',
        info: '回合开始时，你摸牌阶段摸牌数、出杀次数、手牌上限+x (x为装备区的装备数)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_aHaoSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jlsgsy_meihuo': {
        name: '魅惑',
        info: '你的出牌阶段开始时,你随机指定一名手牌存在伤害类卡牌的敌方角色,令其对另一名随机敌方角色使用手牌中的伤害类卡牌(不满足则不发动)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jlsgsy_meihuo'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jlsgsy_yaoyan': {
        name: '妖颜',
        info: '当其他角色使用基本牌或非延时锦囊牌指定你为目标时，你令其也成为此牌的目标，随后有50%的概率将自己从目标中移除',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jlsgsy_yaoyan'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_jlsgsy_miluan': {
        name: '迷乱',
        info: '当你受到伤害后，你获得所有其他角色的手牌，然后将一半数量（向下取整）的手牌随机分配给其他角色',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_jlsgsy_miluan'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_dchuiling': {
        name: '汇灵',
        info: '当你使用牌时，若此牌颜色为弃牌堆中数量较少的颜色，你获得1枚“灵”标记(若你的“灵”标记大于等于8，则你移除4个“灵”标记获得一点体力上限，摸2张牌并令摸牌阶段摸牌数+1)。若弃牌堆中：红色牌数大于黑色牌数，你回复1点体力；黑色牌数大于红色牌数，你随机弃置一名敌方角色的一张牌',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_dchuiling'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_dctaji': {
        name: '踏寂',
        info: '当你失去手牌后，根据你失去牌的原因执行以下效果：1.使用：你随机弃置一名敌方角色一张牌；2.打出：你摸一张牌；3.弃置：你回复1点体力；4.其他：你下一次对其他角色造成伤害时，此伤害+1。(若你的汇灵标记大于4，则额外随机执行一项效果)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_dctaji'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_shhlianhua': {
        name: '莲华',
        info: '当你成为【杀】的目标后，你摸一张牌。然后此【杀】的使用者选择一项：①弃置一张牌。②令此【杀】对你无效',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_shhlianhua'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_buff_shenxian': {
        name: '甚贤',
        info: '每回合限一次，你的回合外，当有其他角色因弃置而失去基本牌时，若你的手牌数少于x，你摸牌至x。若你的手牌数不小于x，则改为获得y点体力上限。(x为你的体力上限且至多为20，y为其本次弃置的基本牌数)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_buff_shenxian'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_buff_qiangwu': {
        name: '枪舞',
        info: '出牌阶段开始前，你进行判定。直到回合结束，你使用点数小于判定结果的【杀】时不受距离限制，且你使用点数大于判定结果的【杀】时无使用次数限制',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_shhlianhua'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kongquemwSkill1': {
        name: '灵绡旋歌',
        info: '回合开始时,你令自己本回合接下来使用的x张伤害类卡牌或【桃】的伤害值或回复值+1(x为游戏开始时你拥有的牌库牌的数量)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kongquemwSkill1'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kongquemwSkill2': {
        name: '绮翎',
        info: '每回合限x次,当你造成或受到伤害后,摸x张牌(x为游戏开始时你装备区的牌数)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kongquemwSkill2'
        ],
        sort: 'ChongYingChuLin'
    },
    'txhj_kongquemwSkill3': {
        name: '碧语灵裳',
        info: '你每累计消耗1200金币后,随机获得一个来自过去赛季图鉴中的祝福(至多以此法获得三个)',
        rank: 3,
        value: 9999,
        store: false,
        skills: [
            'txhj_kongquemwSkill3'
        ],
        sort: 'ChongYingChuLin'
    },
    //----------------------------------------------------//
    'buff_txhj_luanshixingjun': {//
        name: '乱世兴军',
        info: '你使用的点数为3，6，9的牌无法被响应',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_luanshixingjun'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jieminglvecai': {//
        name: '劫命掠财',
        info: '当你获得其他角色的牌后其失去1点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jieminglvecai'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_cuigongjijin': {//
        name: '催攻急进',
        info: '每名角色回合内使用的第一张【杀】造成伤害+1，该【杀】没有造成伤害的角色受到你造成的1点伤害',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_cuigongjijin'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shansuanmouhua': {//
        name: '善算谋划',
        info: '当你连续使用两张同名锦囊后，你增加一点体力上限',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shansuanmouhua'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_suoxiangpimi': {//
        name: '所向披靡',
        info: '你对装备区没有牌的角色造成伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_suoxiangpimi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_zhongzhenyilie': {//
        name: '忠贞义烈',
        info: '当你失去体力后，增加一点体力上限',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_zhongzhenyilie'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_mingmenwangzu': {//
        name: '名门望族',
        info: '你使用转化的普通锦囊不能被响应',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_mingmenwangzu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_youzhierchi': {//
        name: '有智而迟',
        info: '其他角色的回合结束时，若你本回合仅受一次伤害，你回复一点体力值',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_youzhierchi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_sanjianliangren': {//
        name: '三尖两刃',
        info: '你参与的拼点结束后，没赢的一方失去一点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_sanjianliangren'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_beishuiyizhan': {//
        name: '背水一战',
        info: '当你造成伤害后，你失去一点体力，然后本回合出杀次数+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_beishuiyizhan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_jilieangyang': {//
        name: '激烈昂扬',
        info: '回合开始时，你失去1点体力，出牌阶段你可以多出X张【杀】(X为回合开始时你已损失的体力值)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jilieangyang'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_zaishuaisanjie': {//
        name: '再衰三竭',
        info: '出牌阶段你的出【杀】次数+1，若你使用【杀】未造成伤害，下一次受到的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_zaishuaisanjie'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_qimoumiaoji': {
        name: '奇谋妙计',
        info: '你使用非虚拟非转化的【顺手牵羊】【过河拆桥】【无中生有】结算两次',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_qimoumiaoji'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_weizhenhuaxia': {//
        name: '威震华夏',
        info: '当你使用【杀】指定目标时，你令其于此回合不能使用或打出与此【杀】花色相同的牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_weizhenhuaxia'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fuxinggaozhao': {//
        name: '福星高照',
        info: '回合开始时，若你体力值不大于体力上限的一半（向下取整）,你回复一点体力值',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_fuxinggaozhao'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_yongmengwuqian': {//
        name: '勇猛无前',
        info: '你造成的所有伤害+1,你造成伤害后失去一点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yongmengwuqian'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fanjiuwuwu': {//
        name: '贩酒无汙',
        info: '其他角色使用酒后受到来自你的一点伤害',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_fanjiuwuwu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_huangyinwudu': {//
        name: '荒淫无度',
        info: '你对女性角色或女性角色对你造成的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huangyinwudu'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_weilongmengjiang': {//
        name: '威龙猛将',
        info: '当你使用转化的【杀】指定目标后，你获得其一张手牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_weilongmengjiang'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_gongchenglvedi': {//
        name: '攻城掠地',
        info: '每回合每种牌名限一次，当你使用伤害类卡牌造成伤害后，你从牌堆或弃牌堆中获得一张同名的牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_gongchenglvedi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_fuhuoxiangyi': {//
        name: '福祸相依',
        info: '当你一次性失去不小于两张牌时，摸一张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_fuhuoxiangyi'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_moshijuece': {//
        name: '魔仕绝策',
        info: '你的黑色锦囊牌造成伤害+1，你被红色锦囊牌指定为目标后失去一点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_moshijuece'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_lveshixiaoji': {//
        name: '略施小计',
        info: '准备阶段，你自牌堆与弃牌堆中获得不同牌名的智囊牌各一张',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_lveshixiaoji'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_weifengtangtang': {//
        name: '威风堂堂',
        info: '每轮每种牌名限一次，当你使用伤害类卡牌造成伤害时，该伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_weifengtangtang'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_wujianmoshen': {//
        name: '无间魔神',
        info: '你造成的大于3点的伤害翻倍，此伤害结算结束后你体力上限减半（向上取整）',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wujianmoshen'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_huofengliaoyuan': {//
        name: '火凤燎原',
        info: '你造成火焰伤害后，摸一张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huofengliaoyuan'
        ],
        sort: 'ChongYingChuLin'
    },
    'buff_txhj_shenhundiandao': {//
        name: '神魂颠倒',
        info: '你翻面时，你造成的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shenhundiandao'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_tingzhuzhili': {//
        name: '庭柱之力',
        info: '你使用转化的伤害类锦囊造成的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tingzhuzhili'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_bubuweiying': {//
        name: '步步为营',
        info: '你使用的前x张【杀】造成伤害+1（x为当前游戏轮数）',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_bubuweiying'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_wanfumodi': {//
        name: '万夫莫敌',
        info: '准备阶段，你自牌堆或弃牌堆中获得所有类型的【杀】各一张',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wanfumodi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_biyuexiuhua': {//
        name: '闭月羞花',
        info: '男性角色回合内对你造成的第一次伤害-1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_biyuexiuhua'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_tianxingliezhi': {//
        name: '天性烈直',
        info: '每轮限两次，你受到一点伤害后随机弃置一名角色的一张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tianxingliezhi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_daihanxumeng': {//
        name: '代汉虚梦',
        info: '摸牌阶段，你额外摸x张牌，结束阶段你随机弃置x张手牌，若弃置全部手牌则你的体力上限减一(x为场上角色的数量)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_daihanxumeng'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_jiaozongziyi': {//
        name: '骄纵恣意',
        info: '摸牌阶段，你额外摸x张牌(x为场上其他角色的数量)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jiaozongziyi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_tongqiangcaobi': {//
        name: '铜墙草壁',
        info: '【杀】对你造成的伤害-1，锦囊牌对你造成的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tongqiangcaobi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_sangshihailong': {//
        name: '丧尸骸龙',
        info: '每轮结束时，若你本轮没有受到伤害，你令所有其他角色失去一点体力上限，然后你增加等量体力上限',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_sangshihailong'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_damengxianjue': {//
        name: '大梦先觉',
        info: '第一轮结束时，你将体力和体力上限调整至与游戏开始时相同',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_damengxianjue'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_yiwangwuqian': {//
        name: '一往无前',
        info: '出牌阶段结束时,若场上有体力值唯一最大的角色(除你以外),你视为对其使用一张无距离和次数限制的【杀】,且此【杀】伤害+x(x为你本回合弃置过的牌的花色数',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yiwangwuqian'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_yanchufasui': {//
        name: '言出法随',
        info: '当你杀死一名角色后，你摸三张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yanchufasui'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_biguanzishou': {//
        name: '闭关自守',
        info: '出牌阶段开始时,你加一点体力上限',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_biguanzishou'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_jiezeeryu': {//
        name: '竭泽而渔',
        info: '你的回合内,每当你因弃置失去牌时,你摸一张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jiezeeryu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_jiuzhuxiongtu': {//
        name: '酒助雄图',
        info: '每回合你可以额外使用一张【酒】',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jiuzhuxiongtu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_liankuibiting': {//
        name: '帘窥壁听',
        info: '你每于回合外获得三张牌时，随机获得一张基本牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_liankuibiting'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_zhennanjiangjun': {//
        name: '镇南将军',
        info: '结束阶段,你令其他角色失去x+1点体力(x为你本局游戏未造成伤害的出牌阶段数)',
        rank: 2,
        value: 1000,
        store: true,
        skills: [
            'buff_txhj_zhennanjiangjun'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_zhongyongzhidao': {//
        name: '中庸之道',
        info: '出牌阶段结束时,若你的手牌数等于手牌上限,你视为拥有【尚俭】直到你的下个回合开始',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_zhongyongzhidao'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_luanshiliangzhuang': {//
        name: '乱世良妆',
        info: '每当你的体力上限变动后随机令一名随机敌方角色失去2点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_luanshiliangzhuang'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_sujinqilve': {//
        name: '素锦奇略',
        info: '出牌阶段结束时,若你本回合使用的牌颜色均相同,跳过下个弃牌阶段',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_sujinqilve'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_xianzhenzhizhi': {//
        name: '陷阵之志',
        info: '出牌阶段,当你连续对同一名角色造成伤害后,你摸一张牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_xianzhenzhizhi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shunfengshifan': {//
        name: '顺风使帆',
        info: '你的回合外,你使用【杀】造成的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shunfengshifan'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_jueerhousi': {//
        name: '觉而后思',
        info: '第二轮开始时,你随机获得x张弃牌堆中你使用过的牌(为你第一轮造成伤害的伤害值)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jueerhousi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_baiguzhuwang': {//
        name: '白骨铸王',
        info: '你使用杀的次数上限+X(X为场上已阵亡的角色的数)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_baiguzhuwang'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_tengyunjiawu': {//
        name: '腾云驾雾',
        info: '每回合每种牌名限一次,你使用的杀和普通锦囊牌生效时,将场上其他角色区域内的随机一张同名牌置入弃牌堆',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tengyunjiawu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_zhixingheyi': {//
        name: '知行合一',
        info: '本局游戏,你每获得过5张牌,你的手牌上限便+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_zhixingheyi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_zhijiuhuli': {//
        name: '智救护吏',
        info: '你拼点结束后,从牌堆或弃牌堆中获得一张点数大于你拼点牌的牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_zhijiuhuli'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_siweiyongtao': {//
        name: '嗣位永祧',
        info: '你每使用或打出四张本局游戏未使用或打出过的牌名牌时,手牌上限+2且出【杀】次数+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_siweiyongtao'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_bushengduanen': {//
        name: '布声断恩',
        info: '你使用非伤害类锦囊牌指定其他目标后,目标角色失去1点体力',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_bushengduanen'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_jiguyinxue': {//
        name: '戟骨饮血',
        info: '每回合限三次,你造成伤害后,摸x张牌(x为本回合被【杀】指定过的角色数)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_jiguyinxue'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_dandadudou': {//
        name: '单打独斗',
        info: '结束阶段,你对随机一名敌方角色造成x点伤害(x为你本轮使用的虚拟牌的次数)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_dandadudou'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_huozhuokuqu': {//
        name: '火灼苦躯',
        info: '当你造成火焰伤害时,若其处于"连环状态",你与其各失去1点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_huozhuokuqu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_bamenjizhi': {//
        name: '八门集智',
        info: '出牌阶段结束时,你摸x张牌,且本回合手牌上限+x(x为你手牌中点数最大的牌的字数)',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_bamenjizhi'
        ],
        sort: 'HaiWaiFengHe'
    },

    'buff_txhj_wangmeizhike': {//
        name: '望梅止渴',
        info: '你使用红桃牌转化的【杀】或【桃】时,此牌的伤害值或回复值+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_wangmeizhike'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_pianruojinghong': {//
        name: '翩若惊鸿',
        info: '你使用转化的牌时,从牌堆中获得一张颜色相同的牌',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_pianruojinghong'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_dengfenglvren': {//
        name: '登锋履刃',
        info: '你使用虚拟牌,造成的伤害+1',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_dengfenglvren'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shishengshibai': {//
        name: '十胜十败',
        info: '你的体力值每变化十次时,随机对一名敌方角色造成等同于你已损失体力值的伤害',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_shishengshibai'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_hengshuofushi': {//
        name: '横槊赋诗',
        info: '你使用【酒】时,从牌堆中获得一张【杀】',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_hengshuofushi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_mengdexinshu': {//
        name: '孟德新书',
        info: '你的回合内首次弃置手牌时,摸等量牌（至多摸等同于体力上限的张数）',
        rank: 2,
        value: 600,
        store: true,
        skills: [
            'buff_txhj_mengdexinshu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_yitianyiri': {//
        name: '移天易日',
        info: '当你一次性获得两张基本牌后,弃置并从牌堆或弃牌堆随机获得两张锦囊',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_yitianyiri'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_laojifuli': {//
        name: '老骥伏枥',
        info: '你脱离濒死状态后,令自己下一张杀伤害+x（x为当前游戏轮数）',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_laojifuli'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_tianxiaguixin': {//
        name: '天下归心',
        info: '出牌阶段结束时,手牌数小于等于你的其他角色失去1点体力',
        rank: 1,
        value: 400,
        store: true,
        skills: [
            'buff_txhj_tianxiaguixin'
        ],
        sort: 'HaiWaiFengHe'
    },

    //-----------------------------------//侍灵-----------------------------------//
    'buff_txhj_shi_qiangquhaoduo': {//
        name: '侍·强取豪夺',
        info: '每回合限一次，当你因侍灵弃置其他角色牌后，你获得其所有相同类型的牌',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_qiangquhaoduo'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_ruibukedang': {//
        name: '侍·锐不可当',
        info: '每回合限一次，当你因侍灵造成伤害后，对随机敌方角色造成一点伤害',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_ruibukedang'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_mofadashi': {//
        name: '侍·魔法大师',
        info: '每回合限一次，当你因侍灵进行判定后，你从牌堆中获得与判定牌花色不同的牌各一张',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_mofadashi'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_miaoshouhuichun': {//
        name: '侍·妙手回春',
        info: '每回合限一次，当你因侍灵回复体力后，你回复一点体力（若体力已满则改为摸两张牌）',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_miaoshouhuichun'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_caitianmingfu': {//
        name: '才天命赋',
        info: '当你使用侍灵天赋技后，你摸一张牌（每回合限10次,天赋技为侍灵1号技）',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_caitianmingfu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_shenlingcizhu': {//
        name: '神灵赐祝',
        info: '当你使用侍灵灵祝技后，你摸一张牌（每回合限10次，灵祝技为侍灵2号技）',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_shenlingcizhu'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_yingtianshouming': {//
        name: '应天受命',
        info: '当你使用侍灵天命技后，你摸一张牌（每回合限10次，天命技为侍灵3号技）',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_yingtianshouming'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_guruojintang': {//
        name: '侍·固若金汤',
        info: '每回合限一次，当你因侍灵防止伤害后，你将手牌摸至体力上限',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_guruojintang'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_xveshangjiashuang': {//
        name: '侍·雪上加霜',
        info: '每回合限一次，当你因侍灵获得其他角色牌后，你令所有敌方角色随机弃置一张牌',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_xveshangjiashuang'
        ],
        sort: 'HaiWaiFengHe'
    },
    'buff_txhj_shi_jifengzhouyu': {//
        name: '侍·疾风骤雨',
        info: '每回合限一次，当你因侍灵从牌堆或弃牌堆获得牌后，你摸两张牌',
        rank: 1,
        value: 500,
        store: true,
        skills: [
            'buff_txhj_shi_jifengzhouyu'
        ],
        sort: 'HaiWaiFengHe'
    },
};
game.buffPack = buffPack;
export default buffPack;