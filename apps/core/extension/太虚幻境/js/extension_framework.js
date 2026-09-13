'use strict';
import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import { CacheContext } from "../../../noname/library/cache/cacheContext.js";
import { Servant, servantData } from "./extension_servant.js";
import buffPack from "./extension_buff.js";
import collectPack from "./extension_collect.js";
import { gainPack, examPack, changePack } from "../event/event_universal.js";
import txhjModeImport from "./extension_skill.js";

const framework = function () {
    lib.init.css(txhjPack.path, 'extension_style');
    lib.init.css(txhjPack.path, 'extension_servant');
    txhj.txhjModeImport = txhjModeImport;
    if (window.dui) {
        if (dui.isMobile()) {
            lib.init.css("" + lib.assetURL + "extension/太虚幻境", "extension_MobileStyle");
        } else {
            lib.init.css("" + lib.assetURL + "extension/太虚幻境", "extension_PcStyle");
        }
    } else {
        txhj.isMobile = navigator.userAgent.match(/(Android|iPhone|SymbianOS|Windows Phone|iPad|iPod)/i);
        if (txhj.isMobile) {
            lib.init.css("" + lib.assetURL + "extension/太虚幻境", "extension_MobileStyle");
        } else {
            lib.init.css("" + lib.assetURL + "extension/太虚幻境", "extension_PcStyle");
        }
    }
    txhj.rule = '太虚幻境玩法說明'
        + '<br>在此模式中，你挑戰若干個章節中隨機出現的關卡，通過戰鬥、使用挑戰中獲得的金幣購買或是經歷隨機的事件來獲得各種補強。'
        + '<br>你可以獲得新的技能、每次對局都會自動裝備的裝備、每次開局都會入手的個人牌庫牌，以及各類效果不同的祝福如果在挑戰關卡不慎失敗，就要重新開始;只有找到適合自己的組合搭配，才能挑戰最終首領，獲得這左慈修煉的太虚幻境中的“真傳之秘”'
        + '<br>本次挑戰開放五個難度，挑戰一個難度成功後即可解鎖更高難度。'
        + '<br>不同的難度下敵人的體力也不同，高難度甚至會有額外的技能加成。'
        + '<br>在賽季開放時間內，不用擔心必須要一口氣結束一整場挑戰哦'
        + '<br>每次進行選擇或者挑戰了關卡後都會存檔，賽季之中可以任意遊玩'
        + '<br>重複挑戰，嘗試強大的搭配、有趣的通關方式，擊敗最高難度的各類敵人吧!';
    game.taixuUIupdata = function (homeBody, bool, zoom, scale) {
        if (!homeBody) return;
        let resizeTimer = null;
        const debounce = (fn, delay) => {
            return () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(fn, delay);
            };
        };

        let setTaixuHomeSize = function () {
            const screenWidth = ui.window.offsetWidth || window.innerWidth;
            const screenHeight = ui.window.offsetHeight || window.innerHeight;
            let whr = zoom || 1920 / 1080;
            let sca = scale || 1;
            let width, height;
            if (screenWidth / whr > screenHeight) {
                height = screenHeight;
                width = height * whr;
            } else {
                width = screenWidth;
                height = screenWidth / whr;
            }
            homeBody.style.cssText += `
            width: ${Math.round(width)}px;
            height: ${Math.round(height)}px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(${sca});
            transform-origin: center center;
            box-sizing: border-box;
        `;
        };
        const reTaixuHomesize = debounce(setTaixuHomeSize, 500);
        if (bool) {
            setTaixuHomeSize();
            lib.onresize = lib.onresize.filter(fn => fn !== reTaixuHomesize);
            lib.onresize.push(reTaixuHomesize);
            window.addEventListener('resize', reTaixuHomesize);
        } else {
            lib.onresize = lib.onresize.filter(fn => fn !== reTaixuHomesize);
            window.removeEventListener('resize', reTaixuHomesize);
            clearTimeout(resizeTimer);
            homeBody.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    };
    game.examineModeConfig = async function () {
        var home = ui.create.div('.taixuhuanjing_examineModeHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_examineModeBody', home);
        game.taixuUIupdata(homeBody, true);
        game.saveConfig('examineModeConfig', undefined, false, async function () {
            document.body.removeChild(home);
            game.taixuUIupdata(homeBody, false);
            await game.taixuhuanjingHome();
        });
    };
    game.updateModeData = function () {
        if (!lib.config.taixuhuanjing) {
            lib.config.taixuhuanjing = {};
        }
        if (!lib.config.txhjtianfuData) {
            lib.config.txhjtianfuData = {};
        }
        var rank;
        var season;
        //var tianfuData = {};
        if (lib.config.taixuhuanjing) {
            rank = lib.config.taixuhuanjing.rank;
            season = lib.config.taixuhuanjing.season;
        }

        delete lib.config.taixuhuanjing;
        lib.config.taixuhuanjing = {
            name: null,/*当前角色*/
            point: null,/*当前点将*/
            revive: false,/*是否复活*/
            servant: {
                nickName: null,
                textName: null,
            },/*侍灵对象*/
            servants: [],/*当前侍灵*/
            level: 1,/*当前等级*/

            score: {/*得分统计*/
                gaincard: 0,
                usecard: 0,
                discard: 0,
                damage: 0,
                damaged: 0,
                kill: 0,
                skill: 0,
                round: 0,
                fight: 0,
                time: 0,
            },
            shop: {//商店价格乘值
                cardNum: 0,
                buffNum: 0,
                skillNum: 0,
                equipNum: 0,
                skillbuyNum: 0,
            },
            juguzhidao: {//商店价格乘值
                cardNum: false,
                buffNum: false,
                skillNum: false,
                equipNum: false
            },
            seasonPack: [//赛季列表
                'ChongYingChuLin',
                'HuangTianZhiNu',
                'HeJinZhuHuan',
                'MGBaWangZhengCheng',
                'MGGuanDuZhiZhan',
                'MGBeiDingZhongYuan',
                'HaiWaiFenghe',
                'GFWoLongDianJing',
                'GFHuangJinZhiLuan',
                'GFChangBanZhiZhan',
                'GFChiBiZhiZhan',
                'GFQiQinMengHuo',
                'GFGuanduZhiZhan',
                'LiGuoZhiLuan',
                'ShiChangShiZhiLuan',
                'QianLiZouDanJi',
                'NSHeZhongKangQin',
                'YcFuQinYiZhou',
                'YcWanChengZhiZhan',
                'PveShouweijiange',
                'PveKuibaSkMitan',
                'MGWoLongChuShan',
                'LuanShiXiaoXiong'
            ],
            collect: {
            },
            hp: 0,/*武将体力*/
            maxHp: 0,/*额外体力*/
            exp: 0,/*当前经验*/
            maxExp: 100,/*所需经验*/
            cards: [],/*可用牌组*/
            equips: [],/*可用装备*/
            equip1: null,/*武器栏name:'qinggang',suit:'spade',number:13*/
            equip2: null,/*防具栏*/
            equip3: null,/*宝物栏*/
            equip4: null,/*宝物栏{name:'chitu',suit:'spade',number:13}*/
            minHs: 0,/*初始手牌*/
            maxHs: 0,/*手牌上限*/

            effect: 'pinganwushi',/*突变效果*/
            buff: [],/*可用效果*/
            skills: [],/*备选技能*/
            maxSkills: 5,/*技能插槽*/
            useSkills: [],/*装载技能*/
            skillSource: {},/*技能来源*/

            rank: rank || 1,/*难度1:'普通',2:'困难',3:'噩梦',4:'炼狱',5:'血战',6:'末日',*/
            Apocalypse: {
                skill: {},/*末日技能*/
                debuff: [],/*末日效果*/
                debuffTranslate: [],/*末日效果描述*/
                mark: 0,/*末日积分*/
                draw: 0,/*敌方额外抽牌*/
                damageZero: 0,/*敌方额外减伤*/
                maxHp: 0,/*敌方额外体力*/
                maxHs: 0,/*敌方额外手牌上限*/
                sha: 0,/*敌方额外出杀*/
                damage: 0,/*敌方额外增伤*/
            },
            season: season || 'HuangTianZhiNu',/*当前赛季*/
            chapter: 0,/*游玩章节*/
            procedure: null,/*当前流程*/

            adjust: 0,/*调度次数*/
            skin: null,/*造型加成*/

            coin: 0,/*太虚金币*/
            usecoin: 0,/*已用太虚金币*/
            usebuff: 3,/*碧语灵裳次数*/
            maxCoin: 0,/*最大金币*/
            coinNum: 0,/*金币加值*/
            changeServant: [],/*更换侍灵事件*/
            skip: [],/*跳过事件*/
            exam: [],/*问答事件*/
            events: [],/*收集事件*/
            optional: [],
            optionalExam: [],/*通用事件*/
            bowenqiangzhi: null,/*bowenqiangzhi*/
        };
        if (lib.config.taixuhuanjing?.seasonPack) {
            for (let i of lib.config.taixuhuanjing.seasonPack) {
                if (!lib.config.txhjtianfuData[i]) {
                    lib.config.txhjtianfuData[i] = {};
                }
                if (!lib.config.txhjtianfuData[i].tianfu) {
                    lib.config.txhjtianfuData[i].tianfu = {
                        num: 0,
                        shopnum: 0,
                        buff: []
                    };
                }
            }
        }
        if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode[lib.config.taixuhuanjing.season] && lib.config.taixuhuanjingNode[lib.config.taixuhuanjing.season].rank > 1) {
            lib.config.taixuhuanjing.rank = lib.config.taixuhuanjingNode[lib.config.taixuhuanjing.season].rank;
        }
        game.saveConfig('txhjtianfuData', lib.config.txhjtianfuData);
        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);

    };

    //末日难度
    game.ApocalypseFunc = function (dialog, node) {
        let textlist200 = {
            0: [{ name: '你的回合内,当你于摸牌阶段外因摸牌而获得牌后,随机将等量的手牌置入弃牌堆', num: 200, item: 0 },
            { name: '每轮随机一种花色,你无法使用,打出或弃置该花色的手牌', num: 200, item: 1 }],
            1: [{ name: '你于回合内因弃置失去牌时,失去一点体力;若一次性失去大于两张牌,则额外失去一点体力', num: 200, item: 2 },
            { name: '当你造成伤害时,随机弃置x张手牌(x为你本回合造成伤害的次数);若弃牌数小于x,则防止此伤害', num: 200, item: 3 },],
            2: [{ name: '每个回合开始时,你交给每名其他角色各随机一张非牌库牌', num: 200, item: 4 },
            { name: '你不能使用或打出普通杀', num: 200, item: 5 },
            { name: '结束阶段,你将体力上限调整至与当前体力相同', num: 200, item: 6 },
            { name: '你跳过摸牌阶段', num: 200, item: 7 },
            { name: '出牌阶段,你至多使用三张牌', num: 200, item: 8 },
            ],
        }
        let item1 = Object.keys(textlist200).randomGet();
        textlist200 = textlist200[item1];
        textlist200.sort((a, b) => a.item - b.item)
        let textlist50 = [
            {
                name: '敌方角色摸牌阶段多摸', xg: [
                    { name: '1张牌', num: 10, value: 1 },
                    { name: '2张牌', num: 20, value: 2 },
                    { name: '5张牌', num: 50, value: 5 },
                ], value: 'draw'
            },
            {
                name: '敌方角色受到伤害减少', xg: [
                    { name: '1点', num: 10, value: 1 },
                    { name: '2点', num: 20, value: 2 },
                    { name: '3点', num: 50, value: 3 },
                ], value: 'damageZero'
            },
            {
                name: '敌方角色体力增加', xg: [
                    { name: '1点', num: 10, value: 1 },
                    { name: '2点', num: 20, value: 2, },
                    { name: '5点', num: 50, value: 5 },
                ], value: 'maxHp'
            },
            {
                name: '敌方角色手牌上限增加', xg: [
                    { name: '3张', num: 10, value: 3 },
                    { name: '10张', num: 20, value: 10 },
                    { name: '50张', num: 50, value: 50 },
                ], value: 'maxHs'
            },
            {
                name: '敌方角色每回合出杀次数增加', xg: [
                    { name: '1次', num: 10, value: 1 },
                    { name: '2次', num: 20, value: 2 },
                    { name: '5次', num: 50, value: 5 },
                ], value: 'sha'
            },
            {
                name: '敌方角色造成伤害增加', xg: [
                    { name: '1点', num: 10, value: 1 },
                    { name: '2点', num: 20, value: 2 },
                    { name: '3点', num: 50, value: 3 },
                ], value: 'damage'
            },
        ];
        if (item1 == 2) {
            let textlist50a = [
                {
                    name: '手牌数大于等于一定数目时,自身所有技能失效', xg: [
                        { name: '50张', num: 10, value: 50 },
                        { name: '30张', num: 20, value: 30 },
                        { name: '20张', num: 50, value: 20 },
                    ], value: 'skill', item: 1
                },
                {
                    name: '每个回合开始时,你交给每名敌方角色各随机X张非牌库牌', xg: [
                        { name: '1张', num: 100, value: 1 },
                        { name: '2张', num: 200, value: 2 },
                        { name: '3张', num: 400, value: 3 },
                    ], value: 'skill', item: 2
                },
            ];
            for (let i of textlist50a) {
                textlist50.push(i);
            }
        }
        const Div = ui.create.div('.taixuhuanjing_mrHome');
        const mrBody = ui.create.div('.taixuhuanjing_mrHomeBody', Div);
        const homeDiv = ui.create.div('.taixuhuanjing_mrHomeDiv', mrBody);
        const list200 = ui.create.div('.taixuhuanjing_mrlist200HomeBody', homeDiv);
        const list50 = ui.create.div('.taixuhuanjing_mrlist50HomeBody', homeDiv);
        const mrrankText = ui.create.div('.taixuhuanjing_mrrankText', `总分数:&nbsp;${lib.config.taixuhuanjing.Apocalypse.mark || 0}`, mrBody);
        const mrtopText1 = ui.create.div('.taixuhuanjing_mrtopText1', '自我突破(多选)', homeDiv);
        const mrtopText2 = ui.create.div('.taixuhuanjing_mrtopText2', '越战越勇(单选)', homeDiv);
        const okButton = ui.create.div('.taixuhuanjing_chooseCharacterOkButton', Div);
        var okText = ui.create.div('.taixuhuanjing_chooseCharacterOkText', okButton);
        okButton.addEventListener('click', function () {
            game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
            game.transitionAnimation();
            setTimeout(function () {
                dialog.delete();
                game.taixuUIupdata(node, false);
                game.chooseServant();
            }, 1000);
            event.stopPropagation();
            event.preventDefault();
            return false;
        });
        function updateApocalypseValue(data, bool) {
            const itemName = data.getAttribute('data-name');
            const itemValue = parseFloat(data.getAttribute('data-value'));
            const itemNum = parseFloat(data.getAttribute('data-num'));
            const item2 = parseFloat(data.getAttribute('data-item'));
            const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
            const delta = bool ? itemValue : -itemValue;
            const num = bool ? itemNum : -itemNum;
            if (itemName == 'skill') {
                if (bool) {
                    Apocalypse.skill[item2] = itemValue;
                } else {
                    delete Apocalypse.skill[item2];
                }
            } else {
                if (Apocalypse[itemName] !== undefined) {
                    Apocalypse[itemName] += delta;
                }
            }
            Apocalypse.mark += num;
        }
        //创建底部选项按钮
        for (let i = 0; i < textlist50.length; i++) {
            let buttonText = ui.create.div('.taixuhuanjing_mrtopTextButton', textlist50[i].name);
            let buttonDiv = ui.create.div('.taixuhuanjing_mrtopTextButtonDiv');
            for (let j = 0; j < textlist50[i].xg.length; j++) {
                let button = ui.create.div('.taixuhuanjing_mrtopText50Button', `${textlist50[i].xg[j].name}&nbsp;&nbsp;&nbsp;${textlist50[i].xg[j].num}分`);
                button.setAttribute('data-num', textlist50[i].xg[j].num);
                button.setAttribute('data-name', textlist50[i].value);
                button.setAttribute('data-value', textlist50[i].xg[j].value);
                if (textlist50[i].item) {
                    button.setAttribute('data-item', textlist50[i].item);
                }
                if (lib.config.taixuhuanjing.Apocalypse.mark > 0) {
                    for (let y in lib.config.taixuhuanjing.Apocalypse) {
                        if (y == textlist50[i].value && lib.config.taixuhuanjing.Apocalypse[y] == textlist50[i].xg[j].value) {
                            button.classList.add('selected');
                        }
                    }
                }
                button.addEventListener('click', () => {
                    game.txhj_playAudioCall('WinButton', null, true);
                    if (button.classList.contains('selected')) {
                        updateApocalypseValue(button, false);
                        button.classList.remove('selected');
                    } else {
                        Array.from(buttonDiv.getElementsByClassName('taixuhuanjing_mrtopText50Button')).forEach(button => {
                            if (button.classList.contains('selected')) {
                                updateApocalypseValue(button, false);
                                button.classList.remove('selected');
                            }
                        });
                        updateApocalypseValue(button, true);
                        button.classList.add('selected');
                    }
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                    mrrankText.innerHTML = `总分数:&nbsp;${lib.config.taixuhuanjing.Apocalypse.mark || 0}`;
                });
                buttonDiv.appendChild(button)
            }
            list50.appendChild(buttonText)
            buttonText.appendChild(buttonDiv)
        }
        //创建顶部选项按钮
        for (let i = 0; i < textlist200.length; i++) {
            const item = textlist200[i].item;
            const itemName = textlist200[i].name;
            const itemNum = textlist200[i].num;
            let button = ui.create.div('.taixuhuanjing_mrtopText200Button', `${itemName}&nbsp;&nbsp;&nbsp;${itemNum}分`);
            if (lib.config.taixuhuanjing.Apocalypse.mark > 0 && lib.config.taixuhuanjing.Apocalypse.debuff.includes(item)) {
                button.classList.add('selected');
            }
            button.addEventListener('click', () => {
                game.txhj_playAudioCall('WinButton', null, true);

                if (button.classList.contains('selected')) {
                    lib.config.taixuhuanjing.Apocalypse.debuff.remove(item);
                    lib.config.taixuhuanjing.Apocalypse.debuffTranslate.remove(itemName);
                    lib.config.taixuhuanjing.Apocalypse.mark -= itemNum;
                    button.classList.remove('selected');
                } else {
                    lib.config.taixuhuanjing.Apocalypse.debuff.push(item);
                    lib.config.taixuhuanjing.Apocalypse.debuffTranslate.push(itemName);
                    lib.config.taixuhuanjing.Apocalypse.mark += itemNum;
                    button.classList.add('selected');
                }
                mrrankText.innerHTML = `总分数:&nbsp;${lib.config.taixuhuanjing.Apocalypse.mark || 0}`;
            });
            list200.appendChild(button)
        }
        node.appendChild(Div);
    };
    /*记录*/
    game.txhjRecordHome = function () {
        let home = ui.create.div('.taixuhuanjing_collectHome');
        document.body.appendChild(home);
        let homeBody = ui.create.div('.taixuhuanjing_collectHomeBody', home);
        homeBody.setBackgroundImage('extension/太虚幻境/image/background/frame1.png');
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 2.0, 0.9);
        let homeBoxTitle = ui.create.div('.taixuhuanjing_collectHomeBoxTitle', homeBody);
        let homeBox = ui.create.div('.taixuhuanjing_collectHomeBox', homeBody);
        homeBox.style.overflowY = 'auto';
        lib.setScroll(homeBox);
        function func(node, num) {
            const div = ui.create.div('.taixuhuanjing_collectHomeBoxDiv');
            const divImp = ui.create.div('.taixuhuanjing_collectHomeBoxDivImp', div);
            divImp.setBackground(node.name, 'character');
            const divName = ui.create.div('.taixuhuanjing_collectHomeBoxDivName', '' + lib.translate[node.name], div);
            const divNum1 = ui.create.div('.taixuhuanjing_collectHomeBoxDivNum1', '' + num, div);
            const divNum2 = ui.create.div('.taixuhuanjing_collectHomeBoxDivNum2', '积分:' + node.total, div);
            let rankStr = lib.translate['txhj_' + node.season] + '';
            switch (node.rank) {
                case 6: rankStr += ' 末日' + node.Apocalypse.mark + '分'; break;
                case 5: rankStr += ' 血战'; break;
                case 4: rankStr += ' 炼狱'; break;
                case 3: rankStr += ' 噩梦'; break;
                case 2: rankStr += ' 困难'; break;
                default: rankStr += ' 普通';
            }
            const divRank = ui.create.div('.taixuhuanjing_collectHomeBoxDivRank', '' + rankStr, div);
            return div;
        };
        let list = [];
        for (let i in lib.config.taixuhuanjingRecord) {
            if (lib.config.taixuhuanjingRecord[i].total) {
                list.push(lib.config.taixuhuanjingRecord[i])
            }
        }
        list.sort(function (a, b) {
            let num1 = a.total || 0;
            let num2 = b.total || 0;
            return num2 - num1;
        });
        let num = 0;
        while (list.length && num < 30) {
            const node = list.shift();
            if (!lib.translate[node.name]) continue;
            homeBox.appendChild(func(node, num));
            num++;
        }
        let button = ui.create.div('.taixuhuanjing_collectHomeButton', home);
        button.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        home.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    /*图鉴*/
    game.collectHome = function () {
        var home = ui.create.div('.taixuhuanjing_collectHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_collectHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 2.0);
        var comps = {
            title: (function () {
                var title = ui.create.div('.taixuhuanjing_collectHomeTitle');
                return title;
            })(),
            showBox: (function () {
                var showBox = ui.create.div('.taixuhuanjing_collectShowBox');
                showBox.update = function (type) {
                    showBox.innerHTML = '';
                    if (type == 'all') {
                        function func(node) {
                            var div = ui.create.div('.taixuhuanjing_collectShowBoxAllDiv');
                            div.setBackgroundImage('extension/太虚幻境/image/icon/icon_type_' + node.type + '.png');
                            var num = 0;
                            var max = 0;

                            if (node.type !== 'character') {
                                var list2 = collectPack[node.type];
                                max = list2.length;
                                list2.forEach(item => {
                                    if (item.num >= item.min) {
                                        num++;
                                    }
                                });
                            } else {
                                var characterMin = collectPack.character.min;
                                Object.keys(collectPack.character).forEach(key => {
                                    if (collectPack.character[key].num >= characterMin) {
                                        num++;
                                    }
                                    max++;
                                });
                            }
                            var speedBox = ui.create.div('.taixuhuanjing_collectShowBoxAllDivSpeedBox', div);
                            var speedColor = ui.create.div('.taixuhuanjing_collectShowBoxAllDivSpeedColor', speedBox);
                            var winrate = Math.round(num / max * 10000) / 100;
                            if (winrate < 10) winrate = 10;
                            winrate = winrate + -100;
                            speedColor.style.left = "" + winrate + "%";
                            var divText = ui.create.div('.taixuhuanjing_collectShowBoxAllDivText', div);
                            divText.innerHTML = '进度: ' + num + '/' + max;
                            return div;
                        };
                        var list = [{ type: 'card', info: '卡牌' }, { type: 'equip', info: '装备' }, { type: 'skill', info: '技能' }, { type: 'buff', info: '祝福' }, { type: 'character', info: '角色' }];
                        var fragment = document.createDocumentFragment();
                        list.forEach(item => {
                            fragment.appendChild(func(item));
                        });
                        showBox.appendChild(fragment);
                    } else if (type == 'card') {
                        var showBoxcContent2 = ui.create.div('.taixuhuanjing_showBoxcContent2', showBox);
                        var showBoxcContent2Body = ui.create.div('.taixuhuanjing_showBoxcContent2Body', showBoxcContent2);
                        showBoxcContent2Body.nodes = {};
                        showBoxcContent2Body.choosingNow = null;
                        lib.setScroll(showBoxcContent2Body);
                        showBoxcContent2.update = function (node) {
                            showBoxcContent2Body.innerHTML = '';
                            var showBoxcContent2Title = ui.create.div('.taixuhuanjing_showBoxcContent2Title', showBoxcContent2Body, '?????');
                            var showBoxcContent2Text = ui.create.div('.taixuhuanjing_showBoxcContent2Text', showBoxcContent2Body);
                            showBoxcContent2Text.nodes = {};
                            showBoxcContent2Text.choosingNow = null;
                            lib.setScroll(showBoxcContent2Text);
                            if (node.num <= node.min) {
                                showBoxcContent2Text.style['background-color'] = 'rgb(117 107 87)';
                                showBoxcContent2Title.innerHTML = lib.translate[node.id];
                                showBoxcContent2Title.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + '.png');
                                showBoxcContent2Text.update = function (button) {
                                    showBoxcContent2Text.innerHTML = '';
                                    showBoxcContent2Text.click = null;
                                    var season = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '所属赛季', showBoxcContent2Text);
                                    var seasonText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate['txhj_' + node.sort], showBoxcContent2Text);
                                    var intro = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '描述', showBoxcContent2Text);
                                    var introText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate[node.id + '_info'], showBoxcContent2Text);
                                    var info = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '引文', showBoxcContent2Text);
                                    var infoText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + node.info, showBoxcContent2Text);
                                };
                                showBoxcContent2Text.update();
                            } else {
                                if (node.min == 1) {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得一次才能解锁';
                                } else {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得（' + node.num + '/' + node.min + '）次才能解锁';
                                }
                                showBoxcContent2Text.style["background"] = "none";
                            }
                        };
                        var showBoxcContent = ui.create.div('.taixuhuanjing_showBoxcContent', showBox);
                        var showBoxcContentBody = ui.create.div('.taixuhuanjing_showBoxcContentBody', showBoxcContent);
                        showBoxcContentBody.nodes = {};
                        showBoxcContentBody.choosingNow = null;
                        lib.setScroll(showBoxcContentBody);
                        showBoxcContent.update = function (type) {
                            showBoxcContentBody.innerHTML = '';
                            function func(node) {
                                var div = ui.create.div('.taixuhuanjing_showBoxcContentDivCard');
                                div.node = node;
                                if (!lib.card[node.id]) return;
                                var card = {
                                    name: node.id,
                                    suit: node.cardSuit,
                                    number: node.cardNumber,
                                    nature: node.cardNature || null,
                                }
                                var card2 = game.createCard(card);
                                card2.style.width = '95%';
                                card2.style.height = '95%';
                                card2.style.zIndex = 1;
                                card2.style.bottom = '2%';
                                card2.querySelector('.image').style.backgroundPosition = '65% 0';
                                card2.style["transform-origin"] = "center center";
                                div.appendChild(card2);
                                var divImp = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Imp', div);
                                var divText = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Text', divImp);
                                if (node.num < node.min) {
                                    //divImp.style.webkitFilter = "grayscale(1)";
                                }
                                var cardnum = card.number || '';
                                var cardname = card.name || '';
                                if (cardname == 'sha' && card.nature == 'thunder') {
                                    cardname = 'leisha';
                                }
                                if (cardname == 'sha' && card.nature == 'fire') {
                                    cardname = 'huosha';
                                }
                                if ([1, 11, 12, 13].includes(cardnum)) {
                                    cardnum = { '1': 'A', '11': 'J', '12': 'Q', '13': 'K' }[cardnum]
                                }
                                // //divText.innerHTML = cardnum + '<br>' + lib.translate[card.suit];
                                if (card.suit == 'heart' || card.suit == 'diamond') {
                                    divText.style.color = 'rgb(255,0,0)';
                                }
                                var cardImp = function (card) {
                                    var src = lib.card[card.name].image;
                                    if (src) {
                                        if (src.indexOf('ext:') == 0) {
                                            src = src.replace(/ext:/, 'extension/');
                                        }
                                        divImp.setBackgroundImage(src);
                                    } else {
                                        var img = new Image();
                                        img.src = lib.assetURL + 'image/card/' + card.name + '.png';
                                        img.onload = function () {
                                            divImp.setBackgroundImage('image/card/' + card.name + '.png');
                                        }
                                        img.onerror = function () {
                                            divImp.setBackgroundImage('image/card/' + card.name + '.png')
                                            if (card.name == 'yuheng_plus' || card.name == 'yuheng_pro') {
                                                divImp2.setBackgroundImage('image/card/yuheng.png');
                                            }
                                        }
                                    }
                                };
                                if (lib.config['extension_' + '十周年UI' + '_enable']) {
                                    var img = new Image();
                                    img.src = lib.assetURL + 'extension/十周年UI/image/card/' + cardname + '.webp';
                                    img.onload = function () {
                                        divImp.setBackgroundImage('extension/十周年UI/image/card/' + cardname + '.webp')
                                    }
                                    img.onerror = function () {
                                        //cardImp(card);
                                    }
                                } else {
                                    //cardImp(card);
                                }
                                div.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    if (showBoxcContentBody.choosingNow) {
                                        showBoxcContentBody.choosingNow.noChoiced();
                                    }
                                    this.choiced();
                                    showBoxcContent2.update(div.node);
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                div.choiced = function () {
                                    showBoxcContentBody.choosingNow = this;
                                    div.style.boxShadow = '-1px 0px 1px rgba(255,255,0,0.75),0px -1px 1px rgba(255,255,0,0.75),1px 0px 1px rgba(255,255,0,0.75),0px 1px 5px rgba(255,255,0,0.75)';
                                };
                                div.noChoiced = function () {
                                    showBoxcContentBody.choosingNow = null;
                                    div.style.boxShadow = 'none';
                                };
                                return div;
                            };
                            var list = [];
                            var cardList = collectPack.card;
                            for (var i = 0; i < cardList.length; i++) {
                                if (type == '全部') {
                                    list.push(cardList[i]);
                                } else if (type == '基本牌' && cardList[i].type == 'basic') {
                                    list.push(cardList[i]);
                                } else if (type == '锦囊牌' && (cardList[i].type == 'delay' || cardList[i].type == 'trick')) {
                                    list.push(cardList[i]);
                                }
                            }
                            var fragment = document.createDocumentFragment();
                            for (var i = 0; i < list.length; i++) {
                                const nodediv = func(list[i]);
                                if (nodediv) fragment.appendChild(nodediv);
                            }
                            showBoxcContentBody.appendChild(fragment);
                        };
                        var showBoxComps = {
                            showBoxTitles: (function () {
                                var showBoxTitles = ui.create.div('.taixuhuanjing_showBoxTitles');
                                showBoxTitles.nodes = {};
                                showBoxTitles.choosingNow = null;
                                function func(node) {
                                    var div = ui.create.div('.taixuhuanjing_showBoxTitle');
                                    var divText = ui.create.div('.taixuhuanjing_showBoxTitleText', '' + node, div);
                                    div.addEventListener("click", function (e) {
                                        game.txhj_playAudioCall('WinButton', null, true);
                                        this.choiced();
                                        e.stopPropagation();
                                        e.preventDefault();
                                        return false;
                                    });
                                    div.choiced = function () {
                                        if (showBoxTitles.choosingNow) {
                                            showBoxTitles.choosingNow.noChoiced();
                                        }
                                        showBoxTitles.choosingNow = this;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button18.png');
                                        showBoxcContent.update(node);
                                    };
                                    div.noChoiced = function () {
                                        showBoxTitles.choosingNow = null;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button19.png');
                                    };
                                    if (node == '全部') {
                                        div.choiced();
                                    }
                                    return div;
                                };
                                var list = ['全部', '基本牌', '锦囊牌'];
                                while (list.length) {
                                    showBoxTitles.appendChild(func(list.shift()));
                                };
                                return showBoxTitles;
                            })(),
                        }
                        for (var i in showBoxComps) {
                            showBox.appendChild(showBoxComps[i]);
                        }
                    } else if (type == 'equip') {
                        var showBoxcContent2 = ui.create.div('.taixuhuanjing_showBoxcContent2', showBox);
                        var showBoxcContent2Body = ui.create.div('.taixuhuanjing_showBoxcContent2Body', showBoxcContent2);
                        showBoxcContent2Body.nodes = {};
                        showBoxcContent2Body.choosingNow = null;
                        lib.setScroll(showBoxcContent2Body);
                        showBoxcContent2.update = function (node) {
                            showBoxcContent2Body.innerHTML = '';
                            var showBoxcContent2Title = ui.create.div('.taixuhuanjing_showBoxcContent2Title', showBoxcContent2Body, '?????');
                            var showBoxcContent2Text = ui.create.div('.taixuhuanjing_showBoxcContent2Text', showBoxcContent2Body);
                            showBoxcContent2Text.nodes = {};
                            showBoxcContent2Text.choosingNow = null;
                            lib.setScroll(showBoxcContent2Text);
                            if (node.num >= node.min) {
                                showBoxcContent2Text.style['background-color'] = 'rgb(117 107 87)';
                                showBoxcContent2Title.innerHTML = lib.translate[node.id];
                                showBoxcContent2Title.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + '.png');
                                var tab = ui.create.div('.taixuhuanjing_showBoxcContent2TitleTab', showBoxcContent2Title);
                                tab.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + 'tab.png');
                                showBoxcContent2Text.update = function (button) {
                                    showBoxcContent2Text.innerHTML = '';
                                    showBoxcContent2Text.click = null;
                                    var season = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '所属赛季', showBoxcContent2Text);
                                    var seasonText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate['txhj_' + node.sort], showBoxcContent2Text);
                                    var intro = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '描述', showBoxcContent2Text);
                                    var introText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate[node.id + '_info'], showBoxcContent2Text);
                                    var info = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '引文', showBoxcContent2Text);
                                    var infoText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + node.info, showBoxcContent2Text);
                                };
                                showBoxcContent2Text.update();
                            } else {
                                if (node.min == 1) {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得一次才能解锁';
                                } else {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得（' + node.num + '/' + node.min + '）次才能解锁';
                                }
                                showBoxcContent2Text.style["background"] = "none";
                            }
                        };
                        var showBoxcContent = ui.create.div('.taixuhuanjing_showBoxcContent', showBox);
                        var showBoxcContentBody = ui.create.div('.taixuhuanjing_showBoxcContentBody', showBoxcContent);
                        showBoxcContentBody.nodes = {};
                        showBoxcContentBody.choosingNow = null;
                        lib.setScroll(showBoxcContentBody);
                        showBoxcContent.update = function (type) {
                            showBoxcContentBody.innerHTML = '';
                            function func(node) {
                                var div = ui.create.div('.taixuhuanjing_showBoxcContentDivCard');
                                div.node = node;
                                if (!lib.card[node.id]) return;
                                var card = {
                                    name: node.id,
                                    suit: node.cardSuit,
                                    number: node.cardNumber,
                                }
                                var card2 = game.createCard(card);
                                card2.style.width = '95%';
                                card2.style.height = '95%';
                                card2.style.zIndex = 1;
                                card2.style.bottom = '2%';
                                card2.querySelector('.image').style.backgroundPosition = '65% 0';
                                card2.style["transform-origin"] = "center center";
                                div.appendChild(card2);
                                var divImp = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Imp', div);
                                var divText = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Text', divImp);
                                if (node.num < node.min) {
                                    divImp.style.webkitFilter = "grayscale(1)";
                                }
                                var cardnum = card.number || '';
                                if ([1, 11, 12, 13].includes(cardnum)) {
                                    cardnum = { '1': 'A', '11': 'J', '12': 'Q', '13': 'K' }[cardnum]
                                }
                                //divText.innerHTML = cardnum + '<br>' + lib.translate[card.suit];
                                if (card.suit == 'heart' || card.suit == 'diamond') {
                                    divText.style.color = 'rgb(255,0,0)';
                                }
                                var cardImp = function (card) {
                                    var src = lib.card[card.name].image;
                                    if (src) {
                                        if (src.indexOf('ext:') == 0) {
                                            src = src.replace(/ext:/, 'extension/');
                                        }
                                        divImp.setBackgroundImage(src);
                                    } else {
                                        var img = new Image();
                                        img.src = lib.assetURL + 'image/card/' + card.name + '.png';
                                        img.onload = function () {
                                            divImp.setBackgroundImage('image/card/' + card.name + '.png');
                                        }
                                        img.onerror = function () {
                                            divImp.setBackgroundImage('image/card/' + card.name + '.png');
                                        }
                                    }
                                };
                                if (lib.config['extension_' + '十周年UI' + '_enable']) {
                                    var img = new Image();
                                    img.src = lib.assetURL + 'extension/十周年UI/image/card/' + card.name + '.webp';
                                    img.onload = function () {
                                        divImp.setBackgroundImage('extension/十周年UI/image/card/' + card.name + '.webp')
                                    }
                                    img.onerror = function () {
                                        //cardImp(card);
                                    }
                                } else {
                                    //cardImp(card);
                                }
                                div.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    if (showBoxcContentBody.choosingNow) {
                                        showBoxcContentBody.choosingNow.noChoiced();
                                    }
                                    this.choiced();
                                    showBoxcContent2.update(div.node);
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                div.choiced = function () {
                                    showBoxcContentBody.choosingNow = this;
                                    div.style.boxShadow = '-1px 0px 1px rgba(255,255,0,0.75),0px -1px 1px rgba(255,255,0,0.75),1px 0px 1px rgba(255,255,0,0.75),0px 1px 5px rgba(255,255,0,0.75)';
                                };
                                div.noChoiced = function () {
                                    showBoxcContentBody.choosingNow = null;
                                    div.style.boxShadow = 'none';
                                };
                                return div;
                            };
                            var list = [];
                            var equipList = collectPack.equip;
                            for (const item of equipList) {
                                if (type == '全部') {
                                    list.push(item);
                                } else if (type == '武器' && item.type == 'equip1') {
                                    list.push(item);
                                } else if (type == '防具' && item.type == 'equip2') {
                                    list.push(item);
                                } else if (type == '宝物' && item.type == 'equip5') {
                                    list.push(item);
                                } else if (type == '神器' && item.unique) {
                                    list.push(item);
                                }
                            }
                            var fragment = document.createDocumentFragment();
                            for (var i = 0; i < list.length; i++) {
                                const nodediv = func(list[i]);
                                if (nodediv) fragment.appendChild(nodediv);
                            }
                            showBoxcContentBody.appendChild(fragment);
                        };
                        var showBoxComps = {
                            showBoxTitles: (function () {
                                var showBoxTitles = ui.create.div('.taixuhuanjing_showBoxTitles');
                                showBoxTitles.nodes = {};
                                showBoxTitles.choosingNow = null;

                                function func(node) {
                                    var div = ui.create.div('.taixuhuanjing_showBoxTitle');
                                    var divText = ui.create.div('.taixuhuanjing_showBoxTitleText', '' + node, div);
                                    div.addEventListener("click", function (e) {
                                        game.txhj_playAudioCall('WinButton', null, true);
                                        this.choiced();
                                        e.stopPropagation();
                                        e.preventDefault();
                                        return false;
                                    });
                                    div.choiced = function () {
                                        if (showBoxTitles.choosingNow) {
                                            showBoxTitles.choosingNow.noChoiced();
                                        }
                                        showBoxTitles.choosingNow = this;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button18.png');
                                        showBoxcContent.update(node);
                                    };
                                    div.noChoiced = function () {
                                        showBoxTitles.choosingNow = null;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button19.png');
                                    };
                                    if (node == '全部') {
                                        div.choiced();
                                    }
                                    return div;
                                };

                                var list = ['全部', '武器', '防具', '宝物', '神器'];
                                var fragment = document.createDocumentFragment();
                                for (var i = 0; i < list.length; i++) {
                                    fragment.appendChild(func(list[i]));
                                }
                                showBoxTitles.appendChild(fragment);
                                return showBoxTitles;
                            })()
                        };

                        var fragment = document.createDocumentFragment();
                        Object.keys(showBoxComps).forEach(function (key) {
                            fragment.appendChild(showBoxComps[key]);
                        });
                        showBox.appendChild(fragment);
                    } else if (type == 'skill') {
                        var showBoxcContent2 = ui.create.div('.taixuhuanjing_showBoxcContent2', showBox);
                        var showBoxcContent2Body = ui.create.div('.taixuhuanjing_showBoxcContent2Body', showBoxcContent2);
                        showBoxcContent2Body.nodes = {};
                        showBoxcContent2Body.choosingNow = null;
                        lib.setScroll(showBoxcContent2Body);
                        showBoxcContent2.update = function (node) {
                            showBoxcContent2Body.innerHTML = '';
                            var showBoxcContent2Title = ui.create.div('.taixuhuanjing_showBoxcContent2Title', showBoxcContent2Body, '?????');
                            var showBoxcContent2Text = ui.create.div('.taixuhuanjing_showBoxcContent2Text', showBoxcContent2Body);
                            showBoxcContent2Text.nodes = {};
                            showBoxcContent2Text.choosingNow = null;
                            lib.setScroll(showBoxcContent2Text);
                            if (node.num >= node.min) {
                                showBoxcContent2Text.style['background-color'] = 'rgb(117 107 87)';
                                showBoxcContent2Title.innerHTML = lib.translate[node.id];
                                showBoxcContent2Title.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + '.png');
                                var tab = ui.create.div('.taixuhuanjing_showBoxcContent2TitleTab', showBoxcContent2Title);
                                tab.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + 'tab.png');
                                showBoxcContent2Text.update = function (button) {
                                    showBoxcContent2Text.innerHTML = '';
                                    showBoxcContent2Text.click = null;
                                    var season = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '所属赛季', showBoxcContent2Text);
                                    var seasonText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate['txhj_' + node.sort], showBoxcContent2Text);
                                    var intro = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '描述', showBoxcContent2Text);
                                    var introText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate[node.id + '_info'], showBoxcContent2Text);
                                    var info = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '引文', showBoxcContent2Text);
                                    var infoText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + node.info, showBoxcContent2Text);
                                };
                                showBoxcContent2Text.update();
                            } else {
                                if (node.min == 1) {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得一次才能解锁';
                                } else {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得（' + node.num + '/' + node.min + '）次才能解锁';
                                }
                                showBoxcContent2Text.style["background"] = "none";
                            }
                        };
                        var showBoxcContent = ui.create.div('.taixuhuanjing_showBoxcContent', showBox);
                        var showBoxcContentBody = ui.create.div('.taixuhuanjing_showBoxcContentBody', showBoxcContent);
                        showBoxcContentBody.nodes = {};
                        showBoxcContentBody.choosingNow = null;
                        lib.setScroll(showBoxcContentBody);
                        showBoxcContent.update = function (type) {
                            showBoxcContentBody.innerHTML = '';
                            function func(node) {
                                var div = ui.create.div('.taixuhuanjing_showBoxcContentDivSkill');
                                div.node = node;
                                var divImp = ui.create.div('.taixuhuanjing_showBoxcContentDivSkillImp', div);
                                var skillName1 = ui.create.div('.taixuhuanjing_showBoxcContent2TextDivSkillName1', lib.translate[node.id] + '', divImp);
                                var skillName2 = ui.create.div('.taixuhuanjing_showBoxcContent2TextDivSkillName2', lib.translate[node.id] + '', divImp);
                                if (node.num < node.min) {
                                    divImp.style.webkitFilter = "grayscale(1)";
                                }
                                div.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    if (showBoxcContentBody.choosingNow) {
                                        showBoxcContentBody.choosingNow.noChoiced();
                                    }
                                    this.choiced();
                                    showBoxcContent2.update(div.node);
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                div.choiced = function () {
                                    showBoxcContentBody.choosingNow = this;
                                    div.style.boxShadow = '-1px 0px 1px rgba(255,255,0,0.75),0px -1px 1px rgba(255,255,0,0.75),1px 0px 1px rgba(255,255,0,0.75),0px 1px 5px rgba(255,255,0,0.75)';
                                };
                                div.noChoiced = function () {
                                    showBoxcContentBody.choosingNow = null;
                                    div.style.boxShadow = 'none';
                                };
                                return div;
                            };
                            var list = [];
                            var skillList = collectPack.skill;
                            for (const skill of skillList) {
                                if (!get.info(skill.id) || lib.translate[skill.id]) continue;

                                if (type == '全部') {
                                    list.push(skill);
                                } else if (type == '普通' && skill.rank == 1) {
                                    list.push(skill);
                                } else if (type == '精良' && skill.rank == 2) {
                                    list.push(skill);
                                } else if (type == '精品' && skill.rank == 3) {
                                    list.push(skill);
                                } else if (type == '史诗' && skill.rank == 4) {
                                    list.push(skill);
                                }
                            }

                            var fragment = document.createDocumentFragment();
                            for (var i = 0; i < list.length; i++) {
                                fragment.appendChild(func(list[i]));
                            }

                            showBoxcContentBody.appendChild(fragment);
                        };
                        var showBoxComps = {
                            showBoxTitles: (function () {
                                var showBoxTitles = ui.create.div('.taixuhuanjing_showBoxTitles');
                                showBoxTitles.nodes = {};
                                showBoxTitles.choosingNow = null;
                                function func(node) {
                                    var div = ui.create.div('.taixuhuanjing_showBoxTitle');
                                    var divText = ui.create.div('.taixuhuanjing_showBoxTitleText', '' + node, div);
                                    div.addEventListener("click", function (e) {
                                        game.txhj_playAudioCall('WinButton', null, true);
                                        this.choiced();
                                        e.stopPropagation();
                                        e.preventDefault();
                                        return false;
                                    });
                                    div.choiced = function () {
                                        if (showBoxTitles.choosingNow) {
                                            showBoxTitles.choosingNow.noChoiced();
                                        }
                                        showBoxTitles.choosingNow = this;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button18.png');
                                        showBoxcContent.update(node);
                                    };
                                    div.noChoiced = function () {
                                        showBoxTitles.choosingNow = null;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button19.png');
                                    };
                                    if (node == '全部') {
                                        div.choiced();
                                    }
                                    return div;
                                };
                                var list = ['全部', '普通', '精良', '精品', '史诗'];
                                while (list.length) {
                                    showBoxTitles.appendChild(func(list.shift()));
                                };
                                return showBoxTitles;
                            })(),
                        }
                        for (var i in showBoxComps) {
                            showBox.appendChild(showBoxComps[i]);
                        }
                    } else if (type == 'buff') {
                        var showBoxcContent2 = ui.create.div('.taixuhuanjing_showBoxcContent2', showBox);
                        var showBoxcContent2Body = ui.create.div('.taixuhuanjing_showBoxcContent2Body', showBoxcContent2);
                        showBoxcContent2Body.nodes = {};
                        showBoxcContent2Body.choosingNow = null;
                        lib.setScroll(showBoxcContent2Body);
                        showBoxcContent2.update = function (node) {
                            showBoxcContent2Body.innerHTML = '';
                            var showBoxcContent2Title = ui.create.div('.taixuhuanjing_showBoxcContent2Title', showBoxcContent2Body, '?????');
                            var showBoxcContent2Text = ui.create.div('.taixuhuanjing_showBoxcContent2Text', showBoxcContent2Body);
                            showBoxcContent2Text.nodes = {};
                            showBoxcContent2Text.choosingNow = null;
                            lib.setScroll(showBoxcContent2Text);
                            if (node.num >= node.min) {
                                showBoxcContent2Text.style['background-color'] = 'rgb(117 107 87)';
                                showBoxcContent2Title.innerHTML = buffPack[node.id].name;
                                showBoxcContent2Title.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + '.png');
                                var tab = ui.create.div('.taixuhuanjing_showBoxcContent2TitleTab', showBoxcContent2Title);
                                tab.setBackgroundImage('extension/太虚幻境/image/icon/icon_title' + node.rank + 'tab.png');
                                showBoxcContent2Text.update = function (button) {
                                    showBoxcContent2Text.innerHTML = '';
                                    showBoxcContent2Text.click = null;
                                    var season = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '所属赛季', showBoxcContent2Text);
                                    var seasonText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate['txhj_' + node.sort], showBoxcContent2Text);
                                    var intro = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '描述', showBoxcContent2Text);
                                    var introText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + buffPack[node.id].info, showBoxcContent2Text);
                                    var info = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '引文', showBoxcContent2Text);
                                    var infoText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + node.info, showBoxcContent2Text);
                                };
                                showBoxcContent2Text.update();
                            } else {
                                if (node.min == 1) {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得一次才能解锁';
                                } else {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得（' + node.num + '/' + node.min + '）次才能解锁';
                                }
                                showBoxcContent2Text.style["background"] = "none";
                            }
                        };
                        var showBoxcContent = ui.create.div('.taixuhuanjing_showBoxcContent', showBox);
                        var showBoxcContentBody = ui.create.div('.taixuhuanjing_showBoxcContentBody', showBoxcContent);
                        showBoxcContentBody.nodes = {};
                        showBoxcContentBody.choosingNow = null;
                        lib.setScroll(showBoxcContentBody);
                        showBoxcContent.update = function (type) {
                            showBoxcContentBody.innerHTML = '';
                            function func(node) {
                                var div = ui.create.div('.taixuhuanjing_showBoxcContentDivBuff');
                                div.node = node;
                                var divImp = ui.create.div('.taixuhuanjing_showBoxcContentDivBuffImp', div);
                                game.promises.checkFile('extension/太虚幻境/image/buff/' + node.id + '.png').then(function (result) {
                                    if (result === 1) {
                                        divImp.setBackgroundImage('extension/太虚幻境/image/buff/' + node.id + '.png');
                                    } else {
                                        console.log('未找到图片：' + 'extension/太虚幻境/image/buff/' + node.id + '.png');
                                        divImp.setBackgroundImage('extension/太虚幻境/image/buff/moren.png');
                                    }
                                });
                                //divImp.setBackgroundImage('extension/太虚幻境/image/buff/' + node.id + '.png');
                                if (node.num < node.min) {
                                    divImp.style.webkitFilter = "grayscale(1)";
                                }
                                div.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    if (showBoxcContentBody.choosingNow) {
                                        showBoxcContentBody.choosingNow.noChoiced();
                                    }
                                    this.choiced();
                                    showBoxcContent2.update(div.node);
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                div.choiced = function () {
                                    showBoxcContentBody.choosingNow = this;
                                    div.style.boxShadow = '-1px 0px 1px rgba(255,255,0,0.75),0px -1px 1px rgba(255,255,0,0.75),1px 0px 1px rgba(255,255,0,0.75),0px 1px 5px rgba(255,255,0,0.75)';
                                };
                                div.noChoiced = function () {
                                    showBoxcContentBody.choosingNow = null;
                                    div.style.boxShadow = 'none';
                                };
                                return div;
                            };
                            var list = [];
                            for (const buff of collectPack.buff) {
                                if (type == '全部') {
                                    list.push(buff);
                                } else if (type == '普通') {
                                    if (buff.rank == 1) {
                                        list.push(buff);
                                    }
                                } else if (type == '精良') {
                                    if (buff.rank == 2) {
                                        list.push(buff);
                                    }
                                } else if (type == '精品') {
                                    if (buff.rank == 3) {
                                        list.push(buff);
                                    }
                                } else if (type == '史诗') {
                                    if (buff.rank == 4) {
                                        list.push(buff);
                                    }
                                }
                            }
                            while (list.length) {
                                showBoxcContentBody.appendChild(func(list.shift()));
                            }
                        };
                        var showBoxComps = {
                            showBoxTitles: (function () {
                                var showBoxTitles = ui.create.div('.taixuhuanjing_showBoxTitles');
                                showBoxTitles.nodes = {};
                                showBoxTitles.choosingNow = null;

                                function func(node) {
                                    var div = ui.create.div('.taixuhuanjing_showBoxTitle');
                                    var divText = ui.create.div('.taixuhuanjing_showBoxTitleText', '' + node, div);

                                    div.addEventListener("click", function (e) {
                                        game.txhj_playAudioCall('WinButton', null, true);
                                        this.choiced();
                                        e.stopPropagation();
                                        e.preventDefault();
                                        return false;
                                    });

                                    div.choiced = function () {
                                        if (showBoxTitles.choosingNow) {
                                            showBoxTitles.choosingNow.noChoiced();
                                        }
                                        showBoxTitles.choosingNow = this;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button18.png');
                                        showBoxcContent.update(node);
                                    };

                                    div.noChoiced = function () {
                                        showBoxTitles.choosingNow = null;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button19.png');
                                    };

                                    if (node == '全部') {
                                        div.choiced();
                                    }

                                    return div;
                                };

                                var list = ['全部', '普通', '精良', '精品', '史诗'];
                                var fragment = document.createDocumentFragment();
                                for (var i = 0; i < list.length; i++) {
                                    fragment.appendChild(func(list[i]));
                                }
                                showBoxTitles.appendChild(fragment);
                                return showBoxTitles;
                            })()
                        };

                        var fragment = document.createDocumentFragment();
                        Object.keys(showBoxComps).forEach(function (key) {
                            fragment.appendChild(showBoxComps[key]);
                        });
                        showBox.appendChild(fragment);
                    } else if (type == 'character') {
                        var showBoxcContent2 = ui.create.div('.taixuhuanjing_showBoxcContent2', showBox);
                        var showBoxcContent2Body = ui.create.div('.taixuhuanjing_showBoxcContent2Body', showBoxcContent2);
                        showBoxcContent2Body.nodes = {};
                        showBoxcContent2Body.choosingNow = null;
                        lib.setScroll(showBoxcContent2Body);
                        showBoxcContent2.update = function (name) {
                            showBoxcContent2Body.innerHTML = '';
                            var showBoxcContent2Title = ui.create.div('.taixuhuanjing_showBoxcContent2Title', showBoxcContent2Body, '?????');
                            var showBoxcContent2Text = ui.create.div('.taixuhuanjing_showBoxcContent2Text', showBoxcContent2Body);
                            showBoxcContent2Text.nodes = {};
                            showBoxcContent2Text.choosingNow = null;
                            lib.setScroll(showBoxcContent2Text);
                            if (collectPack.character[name] && collectPack.character[name].num >= collectPack.character[name].min) {
                                showBoxcContent2Text.style['background-color'] = 'rgb(117 107 87)';
                                var showBoxcContent2Group = ui.create.div('.taixuhuanjing_showBoxcContent2Group', showBoxcContent2Body);
                                var getGroup = function (name) {
                                    var group = get.is.double(name, true);
                                    if (group) return group[0];
                                    return lib.character[name][1];
                                }
                                showBoxcContent2Group.style["background-image"] = "url(" + lib.assetURL + "extension/十周年UI/image/decoration/name_" + getGroup(name) + ".png)";
                                showBoxcContent2Title.innerHTML = lib.translate[name];
                                //var showBoxcContent2Season = ui.create.div('.taixuhuanjing_showBoxcContent2Season',showBoxcContent2Text,''+lib.translate['txhj_'+sort]);
                                showBoxcContent2Text.update = function (button) {
                                    showBoxcContent2Text.innerHTML = '';
                                    showBoxcContent2Text.click = null;
                                    if (button == '技能') {
                                        var div2 = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv2');
                                        function func(skill) {
                                            var div = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv');
                                            var skillName1 = ui.create.div('.taixuhuanjing_showBoxcContent2TextDivName1', lib.translate[skill] + '', div);
                                            var skillName2 = ui.create.div('.taixuhuanjing_showBoxcContent2TextDivName2', lib.translate[skill] + '', div);
                                            div.addEventListener("click", function (e) {
                                                game.txhj_playAudioCall('WinButton', null, true);
                                                game.txhj_TrySkillAudio(skill, { name: name }, null, [1, 2].randomGet());
                                                div.choiced();
                                                e.stopPropagation();
                                                e.preventDefault();
                                                return false;
                                            });
                                            div.choiced = function () {
                                                if (showBoxcContent2Text.choosingNow) {
                                                    showBoxcContent2Text.choosingNow.noChoiced();
                                                }
                                                showBoxcContent2Text.choosingNow = this;
                                                div.setBackgroundImage('extension/太虚幻境/image/icon/tnode-active.png');
                                                div2.innerHTML = "<p style='margin: 1%;'>" + lib.translate[skill + '_info'] + "</p>";
                                            };
                                            div.noChoiced = function () {
                                                showBoxcContent2Text.choosingNow = null;
                                                div.style.backgroundImage = 'none';
                                            };
                                            if (showBoxcContent2Text.click == null) {
                                                showBoxcContent2Text.click = skill;
                                                div.choiced();
                                            }
                                            return div;
                                        };
                                        var skills = get.character(name, 3).slice(0);
                                        while (skills.length) {
                                            showBoxcContent2Text.appendChild(func(skills.shift()));
                                        };
                                        showBoxcContent2Text.appendChild(div2);
                                    } else {
                                        var season = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '所属赛季', showBoxcContent2Text);
                                        var seasonText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + lib.translate['txhj_' + collectPack.character[name].sort], showBoxcContent2Text);
                                        var intro = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv3', '描述', showBoxcContent2Text);
                                        var introText = ui.create.div('.taixuhuanjing_showBoxcContent2TextDiv4', '' + collectPack.character[name].intro, showBoxcContent2Text);
                                    }
                                };
                                var showBoxcContent2Button1 = ui.create.div('.taixuhuanjing_showBoxcContent2Button1', '技能', showBoxcContent2Body);
                                var showBoxcContent2Button2 = ui.create.div('.taixuhuanjing_showBoxcContent2Button2', '背景', showBoxcContent2Body);
                                showBoxcContent2Button1.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    showBoxcContent2Text.update('技能');
                                    showBoxcContent2Button1.style.backgroundColor = 'rgb(56 40 5 / 50%)';
                                    showBoxcContent2Button2.style.backgroundColor = 'rgb(165 154 132 / 72%)';
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                showBoxcContent2Button2.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    showBoxcContent2Text.update('背景');
                                    showBoxcContent2Button2.style.backgroundColor = 'rgb(56 40 5 / 50%)';
                                    showBoxcContent2Button1.style.backgroundColor = 'rgb(165 154 132 / 72%)';
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                showBoxcContent2Button1.click();

                            } else {
                                if (collectPack.character[name].min == 1) {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得一次才能解锁';
                                } else {
                                    showBoxcContent2Text.innerHTML = '于幻境中获得（' + collectPack.character[name].num + '/' + collectPack.character[name].min + '）次才能解锁';
                                }
                                showBoxcContent2Text.style["background"] = "none";
                            }
                        };
                        var showBoxcContent = ui.create.div('.taixuhuanjing_showBoxcContent', showBox);
                        var showBoxcContentBody = ui.create.div('.taixuhuanjing_showBoxcContentBody', showBoxcContent);
                        showBoxcContentBody.nodes = {};
                        showBoxcContentBody.choosingNow = null;
                        lib.setScroll(showBoxcContentBody);
                        showBoxcContent.update = function (type) {
                            showBoxcContentBody.innerHTML = '';
                            function func(name) {
                                var div = ui.create.div('.taixuhuanjing_showBoxcContentDiv');
                                var divImp = ui.create.div('.taixuhuanjing_showBoxcContentDivImp', div);
                                divImp.setBackgroundImage("extension/太虚幻境/image/yuanhua/" + name + ".jpg");

                                if (collectPack.character[name] && collectPack.character[name].num < collectPack.character[name].min) {
                                    divImp.style.webkitFilter = "grayscale(1)";
                                }
                                div.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    if (showBoxcContentBody.choosingNow) {
                                        showBoxcContentBody.choosingNow.noChoiced();
                                    }
                                    this.choiced();
                                    showBoxcContent2.update(name);
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                div.choiced = function () {
                                    showBoxcContentBody.choosingNow = this;
                                    div.style.boxShadow = '-1px 0px 1px rgba(255,255,0,0.75),0px -1px 1px rgba(255,255,0,0.75),1px 0px 1px rgba(255,255,0,0.75),0px 1px 5px rgba(255,255,0,0.75)';
                                };
                                div.noChoiced = function () {
                                    showBoxcContentBody.choosingNow = null;
                                    div.style.boxShadow = 'none';
                                };
                                return div;
                            };
                            var list = [];
                            function isTypeMatch(character, type) {
                                if (character.type === type) {
                                    return true;
                                }
                                if (Array.isArray(character.type)) {
                                    return character.type.includes(type);
                                }
                                return false;
                            }
                            for (var i in collectPack.character) {
                                var character = collectPack.character[i];
                                if (type == '全部') {
                                    list.push(i);
                                } else if (type == '普通' && isTypeMatch(character, 'common')) {
                                    list.push(i);
                                } else if (type == '精英' && isTypeMatch(character, 'elite')) {
                                    list.push(i);
                                } else if (type == '领主' && isTypeMatch(character, 'ultimate')) {
                                    list.push(i);
                                } else if (type == '盟友' && isTypeMatch(character, 'friend')) {
                                    list.push(i);
                                }
                            }
                            var fragment = document.createDocumentFragment();
                            for (var i = 0; i < list.length; i++) {
                                fragment.appendChild(func(list[i]));
                            }
                            showBoxcContentBody.appendChild(fragment);
                        };
                        var showBoxComps = {
                            showBoxTitles: (function () {
                                var showBoxTitles = ui.create.div('.taixuhuanjing_showBoxTitles');
                                showBoxTitles.nodes = {};
                                showBoxTitles.choosingNow = null;
                                function func(node) {
                                    var div = ui.create.div('.taixuhuanjing_showBoxTitle');
                                    var divText = ui.create.div('.taixuhuanjing_showBoxTitleText', '' + node, div);
                                    div.addEventListener("click", function (event) {
                                        game.txhj_playAudioCall('WinButton', null, true);
                                        this.choiced();
                                        event.stopPropagation();
                                        event.preventDefault();
                                        return false;
                                    });
                                    div.choiced = function () {
                                        if (showBoxTitles.choosingNow) {
                                            showBoxTitles.choosingNow.noChoiced();
                                        }
                                        showBoxTitles.choosingNow = this;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button18.png');
                                        showBoxcContent.update(node);
                                    };
                                    div.noChoiced = function () {
                                        showBoxTitles.choosingNow = null;
                                        div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button19.png');
                                    };
                                    if (node == '全部') {
                                        div.choiced();
                                    }
                                    return div;
                                };
                                var list = ['全部', '普通', '精英', '领主', '盟友'];
                                var fragment = document.createDocumentFragment();
                                for (var i = 0; i < list.length; i++) {
                                    fragment.appendChild(func(list[i]));
                                }
                                showBoxTitles.appendChild(fragment);
                                return showBoxTitles;
                            })()
                        };
                        var fragment = document.createDocumentFragment();
                        Object.keys(showBoxComps).forEach(function (key) {
                            fragment.appendChild(showBoxComps[key]);
                        });
                        showBox.appendChild(fragment);
                    } else if (type == 'season') {
                        var showBoxcContent = ui.create.div('.taixuhuanjing_showBoxcContent3', showBox);
                        var showBoxcContent2 = ui.create.div('.taixuhuanjing_showBoxcContent3', showBox);
                        showBoxcContent2.setBackgroundImage('extension/太虚幻境/image/background/frame18.png');
                        showBoxcContent2.style.display = 'none';
                        showBoxcContent.update = function (type) {
                            showBoxcContent.innerHTML = '';
                            function func(name) {
                                var div = ui.create.div('.taixuhuanjing_showBoxcContentDivSeason');
                                var divImp1 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonImp1', div);
                                divImp1.setBackgroundImage('extension/太虚幻境/dlc/' + name + '/rogue_bg.png');
                                var divImp2 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonImp2', div);

                                var num = 0;
                                var max = 0;

                                function countItems(items, name) {
                                    items.forEach(item => {
                                        if (item.sort == name) {
                                            max++;
                                            if (item.num >= item.min) {
                                                num++;
                                            }
                                        }
                                    });
                                }

                                var nodes = ['card', 'equip', 'skill', 'buff'];
                                nodes.forEach(node => {
                                    countItems(collectPack[node], name);
                                });

                                countItems(Object.values(collectPack.character), name);

                                var speedBox = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonSpeedBox', div);
                                var speedColor = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonSpeedColor', speedBox);
                                var winrate = Math.max(0, Math.round(num / max * 10000) / 100);
                                var winrate2 = Math.max(winrate, 5);
                                speedColor.style.width = winrate2 + '%';

                                var divText = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonText', div);
                                divText.innerHTML = lib.translate['txhj_' + name] + ': ' + winrate + '%';

                                div.listen(function (e) {
                                    game.txhj_playAudioCall('WinButton', null, true);
                                    showBoxcContent2.innerHTML = '';
                                    showBoxcContent2.style.display = 'block';
                                    var cloneNode = ui.create.div('.taixuhuanjing_showBoxcContentDivSeason2', showBoxcContent2);
                                    var cloneNodeImp1 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonImp3', cloneNode);
                                    cloneNodeImp1.setBackgroundImage('extension/太虚幻境/dlc/' + name + '/rogue_bg.png');
                                    var cloneNodeImp2 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonImp4', cloneNode);
                                    var speedBox2 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonSpeedBox2', cloneNode);
                                    var speedColor2 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonSpeedColor2', speedBox2);
                                    speedColor2.style.width = "" + winrate2 + "%";
                                    var divText2 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonText2', cloneNode);
                                    divText2.innerHTML = lib.translate['txhj_' + name] + ': ' + winrate + '%';
                                    var divText3 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeasonText3', '' + game.seasonPack[name].info.randomGet(), showBoxcContent2);
                                    var nodesBox = ui.create.div('.taixuhuanjing_showBoxcContentDivSeason2NodesBox', showBoxcContent2);
                                    function func2(name2) {
                                        var div2 = ui.create.div('.taixuhuanjing_showBoxcContentDivSeason2Node');
                                        div2.setBackgroundImage('extension/太虚幻境/image/icon/icon_type_' + name2 + '.png');
                                        var num2 = 0;
                                        var max2 = 0;

                                        function countItems(items, name) {
                                            items.forEach(item => {
                                                if (item.sort == name) {
                                                    max2++;
                                                    if (item.num >= item.min) {
                                                        num2++;
                                                    }
                                                }
                                            });
                                        }

                                        if (name2 !== 'character') {
                                            countItems(collectPack[name2], name);
                                        } else {
                                            countItems(Object.values(collectPack.character), name);
                                        }

                                        var speedBox3 = ui.create.div('.taixuhuanjing_collectShowBoxAllDivSpeedBox', div2);
                                        var speedColor3 = ui.create.div('.taixuhuanjing_collectShowBoxAllDivSpeedColor', speedBox3);
                                        var winrate2 = Math.max(5, Math.round(num2 / max2 * 10000) / 100);
                                        winrate2 = winrate2 - 100;
                                        speedColor3.style.left = winrate2 + '%';

                                        var divText2 = ui.create.div('.taixuhuanjing_collectShowBoxAllDivText', div2);
                                        divText2.style.fontSize = '1.2vw';
                                        divText2.innerHTML = '进度: ' + num2 + '/' + max2;

                                        return div2;
                                    }
                                    var nodes = ['card', 'equip', 'skill', 'buff', 'character'];
                                    while (nodes.length) {
                                        nodesBox.appendChild(func2(nodes.shift()));
                                    }
                                    var button = ui.create.div('.taixuhuanjing_showBoxcContentDivSeason2button', showBoxcContent2);
                                    button.listen(function (e) {
                                        game.txhj_playAudioCall('WinButton', null, true);
                                        showBoxcContent2.innerHTML = '';
                                        showBoxcContent2.style.display = 'none';
                                        e.stopPropagation();
                                        e.preventDefault();
                                        return false;
                                    });
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                });
                                return div;
                            };
                            var list = [/*'ChongYingChuLin',*/'HuangTianZhiNu', 'HeJinZhuHuan', 'MGBaWangZhengCheng', 'MGGuanDuZhiZhan',/*'GFHuangJinZhiLuan',*/'GFChangBanZhiZhan',/*'GFChiBiZhiZhan','GFQiQinMengHuo',*/'LiGuoZhiLuan'];
                            while (list.length) {
                                showBoxcContent.appendChild(func(list.shift()));

                            }
                        };
                        showBoxcContent.update();
                    }
                };
                showBox.update('all');
                return showBox;
            })(),
            typeBox: (function () {
                var typeBox = ui.create.div('.taixuhuanjing_collectTypeBox');
                typeBox.nodes = {};
                typeBox.choosingNow = null;
                function func(node) {
                    var div;
                    if (node.type == 'season') {
                        div = ui.create.div('.taixuhuanjing_collectTypeDiv2');
                    } else {
                        div = ui.create.div('.taixuhuanjing_collectTypeDiv');
                    }
                    div.node = node;
                    var divText = ui.create.div('.taixuhuanjing_collectTypeDivText', '' + div.node.info, div);
                    div.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        this.choiced();
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    div.choiced = function () {
                        if (typeBox.choosingNow) {
                            typeBox.choosingNow.noChoiced();
                        }
                        typeBox.choosingNow = this;
                        if (div.node.type == 'season') {
                            div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button16.png');
                        } else {
                            div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button2.png');
                        }
                        if (comps && comps.showBox) {
                            comps.showBox.update(div.node.type);
                        }
                    };
                    div.noChoiced = function () {
                        typeBox.choosingNow = null;
                        if (div.node.type == 'season') {
                            div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button17.png');
                        } else {
                            div.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button1.png');
                        }
                    };
                    if (div.node.type == 'all') {
                        div.choiced();
                    }
                    return div;
                };
                var list = [{ type: 'all', info: '总览' }, { type: 'card', info: '卡牌' }, { type: 'equip', info: '装备' }, { type: 'skill', info: '技能' }, { type: 'buff', info: '祝福' }, { type: 'character', info: '角色' }, { type: 'season', info: '赛季' }];
                while (list.length) {
                    typeBox.appendChild(func(list.shift()));
                };
                return typeBox;
            })(),
        };
        for (var i in comps) {
            homeBody.appendChild(comps[i]);
        }
        var button = ui.create.div('.taixuhuanjing_collectHomeButton', home);
        button.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        home.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    /*天赋*/
    game.txhjTianFuHome = function () {
        const home = ui.create.div('.taixuhuanjing_collectHome');
        document.body.appendChild(home);
        const homeBody = ui.create.div('.taixuhuanjing_collectHomeBody', home);
        homeBody.setBackgroundImage('extension/太虚幻境/image/background/frame1.png');

        homeBody.addEventListener("click", stopEventPropagation);
        home.addEventListener("click", stopEventPropagation);

        game.taixuUIupdata(homeBody, true, 2.0, 0.9);

        const homeBoxTitle = ui.create.div('.taixuhuanjing_TianFuHomeBoxTitle', '天赋', homeBody);
        const homeBox = ui.create.div('.taixuhuanjing_TianFuHomeBox', homeBody);
        const homeBoxcz = ui.create.div('.taixuhuanjing_TianFuHomeBoxCz', '重置', homeBody);
        homeBoxcz.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            const str = `是否重置天赋点？`;
            game.purchasePrompt('重置天赋', str, homeBody, (bool) => {
                if (bool) {
                    lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.buff = [];
                    lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.num += lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.shopnum || 0;
                    lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.shopnum = 0;
                    game.saveConfig('txhjtianfuData', lib.config.txhjtianfuData);
                    home.delete();
                    game.taixuUIupdata(homeBody, false);
                    stopEventPropagation();
                }
            });
        });
        const infoPanel = createInfoPanel(homeBox);
        const talents = [
            { image: 'talent_10003.png', name: '生财有道', info: '摸牌阶段多摸一张牌', cost: '50' },
            { image: 'talent_10001.png', name: '富甲一方_1', info: '初始金币+50', cost: '100' },
            { image: 'talent_10004.png', name: '左躲右闪', info: '获得一张【闪】牌库牌', cost: '100' },
            { image: 'talent_10002.png', name: '以战养战_1', info: '战斗获得金币+10', cost: '100' },
            { image: 'talent_10001.png', name: '富甲一方_2', info: '初始金币+50', cost: '150' },
            { image: 'talent_10005.png', name: '囤粮积草', info: '手牌上限+1', cost: '150' },
            { image: 'talent_10002.png', name: '以战养战_2', info: '战斗获得金币+10', cost: '150' },
            { image: 'talent_10001.png', name: '富甲一方_3', info: '初始金币+50', cost: '200' },
            { image: 'talent_10006.png', name: '精力充沛', info: '初始体力+1', cost: '200' },
            { image: 'talent_10002.png', name: '以战养战_3', info: '战斗获得金币+10', cost: '200' },
            { image: 'talent_10001.png', name: '富甲一方_4', info: '初始金币+50', cost: '300' },
            { image: 'talent_10007.png', name: '桃李春风', info: '获得一张【桃】牌库牌', cost: '300' },
            { image: 'talent_10002.png', name: '以战养战_4', info: '战斗获得金币+10', cost: '300' },
            { image: 'talent_10001.png', name: '富甲一方_5', info: '初始金币+50', cost: '400' },
            { image: 'talent_10008.png', name: '多才多艺', info: '技能槽+1', cost: '400' },
            { image: 'talent_10002.png', name: '以战养战_5', info: '战斗获得金币+10', cost: '400' },
            { image: 'talent_10001.png', name: '富甲一方_6', info: '初始金币+50', cost: '500' },
            { image: 'talent_10009.png', name: '多多益善', info: '初始手牌+1', cost: '500' },
            { image: 'talent_10002.png', name: '以战养战_6', info: '战斗获得金币+10', cost: '500' },
            { image: 'talent_10001.png', name: '富甲一方_7', info: '初始金币+50', cost: '600' },
            { image: 'talent_10010.png', name: '过河拆桥', info: '获得一张【过河拆桥】牌库牌', cost: '600' },
            { image: 'talent_10002.png', name: '以战养战_7', info: '战斗获得金币+20', cost: '600' },
            { image: 'talent_10001.png', name: '富甲一方_8', info: '初始金币+50', cost: '700' },
            { image: 'talent_10011.png', name: '对酒当歌', info: '获得一张【酒】牌库牌', cost: '700' },
            { image: 'talent_10002.png', name: '以战养战_8', info: '战斗获得金币+20', cost: '700' },
            { image: 'talent_10012.png', name: '力胜千钧', info: '造成伤害+1', cost: '800' },
        ];
        const talentContainer = buildTalentGrid(talents, infoPanel, homeBody);

        homeBox.appendChild(infoPanel);
        homeBox.appendChild(talentContainer);

        const button = ui.create.div('.taixuhuanjing_collectHomeButton', home);
        button.addEventListener("click", () => {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            stopEventPropagation();
        });

        function stopEventPropagation(event) {
            if (event) {
                event?.stopPropagation?.();
                event?.preventDefault?.();
            }
            return false;
        }

        function createInfoPanel(parent) {
            const panel = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDiv', parent);
            panel.image = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivImg', panel);
            panel.coin = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivCoin', panel);
            panel.icon = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivIcon', panel);
            panel.name = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivIconName', panel);
            panel.info = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivIconInfo', panel);
            panel.cost = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivIconCost', panel);
            panel.btn = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivIconJs', panel);
            panel.lockTip = ui.create.div('.taixuhuanjing_TianFu2HomeBoxDivIconTj', panel);

            updateInfoPanel(panel);
            return panel;
        }

        function updateInfoPanel(panel) {
            const { season } = lib.config.taixuhuanjing;
            const data = lib.config.txhjtianfuData[season].tianfu;
            panel.coin.innerHTML = data.num;
        }

        function buildTalentGrid(talents, infoPanel, homeBody) {
            const container = ui.create.div('.taixuhuanjing_TianFuHomeBoxDiv');
            const config = lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu;

            talents.forEach((talent, i) => {
                const divImp = ui.create.div('.taixuhuanjing_TianFuHomeBoxDivImp');
                divImp.setBackgroundImage('extension/太虚幻境/image/talent_tree/' + talent.image);
                divImp.style.marginRight = "20%";
                divImp.style.marginBottom = "10%";
                divImp.setAttribute('data-name', talent.name);
                if (i !== 0) {
                    const layer = Math.ceil(i / 3);
                    const previousLayerBuffs = getPreviousLayerBuffs(layer, talents);
                    const allUnlocked = previousLayerBuffs.every(buffs => config.buff.includes(buffs));
                    if (!allUnlocked) {
                        const lockIcon = ui.create.div('.taixuhuanjing_divImpChooseBodyButtonsIcon', divImp);
                        divImp.style.webkitFilter = 'grayscale(1)';
                    }
                }

                divImp.addEventListener("click", () => {
                    game.txhj_playAudioCall('off', null, true);

                    const season = lib.config.taixuhuanjing.season;
                    const config = lib.config.txhjtianfuData[season].tianfu;
                    const namestr = talent.name.split('_')[0];
                    const isLocked = divImp.querySelector('.taixuhuanjing_divImpChooseBodyButtonsIcon');
                    const isUnlocked = config.buff.includes(talent.name);

                    infoPanel.lockTip.innerHTML = '';
                    infoPanel.cost.innerHTML = '';

                    if (isLocked && namestr !== '生财有道') {
                        infoPanel.btn.innerHTML = '';
                        infoPanel.lockTip.innerHTML = '解锁条件:解锁上一层全部天赋';
                    } else {
                        infoPanel.btn.removeEventListener("click", infoPanel.btn._listener);
                        infoPanel.btn.innerHTML = isUnlocked ? '已解锁' : '解锁';

                        const oldBtn = infoPanel.btn;
                        const newBtn = oldBtn.cloneNode(true);
                        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
                        infoPanel.btn = newBtn;

                        if (!isUnlocked && config.num >= talent.cost && infoPanel.btn.innerHTML == '解锁') {
                            function unlockHandler(e) {
                                e.stopPropagation();
                                e.preventDefault();

                                const str = `是否花费天赋点*${talent.cost}解锁${namestr}？`;
                                game.purchasePrompt('解锁天赋', str, homeBody, (bool) => {
                                    if (bool) {
                                        config.num -= Number(talent.cost);
                                        config.shopnum += Number(talent.cost);
                                        config.buff.push(talent.name);
                                        infoPanel.coin.innerHTML = config.num;
                                        game.saveConfig('txhjtianfuData', lib.config.txhjtianfuData);
                                        game.messagePopup(`解锁${namestr}成功`);

                                        infoPanel.btn.innerHTML = '已解锁';
                                        infoPanel.cost.innerHTML = '';
                                        infoPanel.icon.setBackgroundImage(talent.image);
                                        infoPanel.name.innerHTML = namestr;
                                        infoPanel.info.innerHTML = talent.info;
                                        updateTalentNode(talent, divImp, config, talents);
                                        newBtn.removeEventListener("click", unlockHandler);
                                    }
                                });
                            }

                            newBtn.addEventListener("click", unlockHandler);
                        }

                        const color = config.num >= talent.cost ? '#e5dba5' : 'red';
                        if (infoPanel.btn.innerHTML != '已解锁') {
                            infoPanel.cost.innerHTML = `所需天赋数量:${talent.cost}`;
                            infoPanel.cost.style.color = color;
                        }
                    }

                    infoPanel.icon.setBackgroundImage(talent.image);
                    infoPanel.name.innerHTML = namestr;
                    infoPanel.info.innerHTML = talent.info;
                    if (!isLocked || namestr == '生财有道') infoPanel.btn.innerHTML = isUnlocked ? '已解锁' : '解锁';
                    updateInfoPanel(infoPanel);
                    stopEventPropagation();
                });

                if ((i - 1) % 3 === 0 || i === 1) {
                    container.appendChild(document.createElement('br'));
                }
                container.appendChild(divImp);
            });

            return container;
        }
        function updateTalentNode(talent, nodeElement, config, talents) {
            const isUnlocked = config.buff.includes(talent.name);
            const lockIcon = nodeElement.querySelector('.taixuhuanjing_divImpChooseBodyButtonsIcon');

            if (isUnlocked) {
                if (lockIcon) lockIcon.remove();
                nodeElement.classList.add('unlocked');
                nodeElement.style.webkitFilter = 'none';
                updateNextLayerTalent(talent, talents, config);
            } else {
                nodeElement.classList.remove('unlocked');
            }
        }
        function updateNextLayerTalent(currentTalent, talents, config) {
            const currentIndex = talents.findIndex(t => t.name === currentTalent.name);
            if (currentIndex === -1) return;
            const nextLayerIndex = Math.ceil(currentIndex / 3);
            const nextLayerStart = nextLayerIndex * 3 + 1;
            const nextLayerEnd = Math.min(nextLayerStart + 3, talents.length);
            for (let i = nextLayerStart; i < nextLayerEnd; i++) {
                const talent = talents[i];
                const divImp = document.querySelector(`[data-name="${talent.name}"]`);
                if (!divImp) continue;
                const layer = Math.ceil(i / 3);
                const previousLayerBuffs = getPreviousLayerBuffs(layer, talents);
                const allUnlocked = previousLayerBuffs.every(buff => config.buff.includes(buff));
                const lockIcon = divImp.querySelector('.taixuhuanjing_divImpChooseBodyButtonsIcon');
                if (allUnlocked) {
                    if (lockIcon) lockIcon.remove();
                    divImp.classList.add('unlocked');
                    divImp.style.webkitFilter = 'none';
                } else {
                    divImp.classList.remove('unlocked');
                    divImp.style.webkitFilter = 'grayscale(1)';
                    if (!lockIcon) {
                        const newLockIcon = ui.create.div('.taixuhuanjing_divImpChooseBodyButtonsIcon', divImp);
                    }
                }
            }
        }
        function getPreviousLayerBuffs(layer, talents) {
            const result = [];
            const start = (layer - 2) * 3 + 1;
            const end = start + 3;
            if (layer - 1 == 0) {
                result.push(talents[0].name);
            } else {
                for (let j = start; j < end && j < talents.length; j++) {
                    if (!talents[j]) {
                        break;
                    }
                    result.push(talents[j].name);
                }
            }
            return result;
        }
    };
    game.taixuhuanjingHome = async function () {
        var home = ui.create.div('.taixuhuanjing_Home');
        document.body.appendChild(home);
        var zoom = 1;
        if (window.dui) {
            if (dui.isMobile()) {
                zoom = 0.9;
            } else {
                zoom = 1.1;
            }
            [
                '#system2',
                '.lbtn-paixu',
                '.lbtn-controls',
                '.latn-jilu',
                'img[src="extension/十周年UI/shoushaUI/lbtn/images/uibutton/liaotian.png"]'
            ].forEach(selector => {
                const el = document.querySelector(selector);
                if (el) {
                    el.style.setProperty('display', 'none', 'important');
                }
            });

            dui.effect.gameStart = function () {
                if (lib.config.extension_十周年UI_newDecadeStyle == 'on') {
                    game.playAudio('../extension', decadeUI.extensionName, 'audio/game_start.mp3');
                    var animation = decadeUI.animation;
                    var bounds = animation.getSpineBounds('effect_youxikaishi');
                    if (bounds == null) return;
                    var sz = bounds.size;
                    var scale = Math.min(animation.canvas.width / sz.x, animation.canvas.height / sz.y) * 0.76;
                    if (dcdAnim.dprAdaptive) scale /= 1.5
                    animation.playSpine({
                        name: 'effect_youxikaishi',
                        scale: scale
                    });
                } else {
                    game.playAudio('../extension', decadeUI.extensionName, 'audio/game_start_shousha.mp3');
                    var animation = decadeUI.animation;
                    var bounds = animation.getSpineBounds('effect_youxikaishi_shousha');
                    if (bounds == null) return;
                    var sz = bounds.size;
                    var scale = Math.min(animation.canvas.width / sz.x, animation.canvas.height / sz.y) * 0.8;
                    if (dcdAnim.dprAdaptive) scale /= 1.5
                    animation.playSpine({
                        name: 'effect_youxikaishi_shousha',
                        scale: scale
                    });
                }
            };
        } else {
            const isMobile = navigator.userAgent.match(/(Android|iPhone|SymbianOS|Windows Phone|iPad|iPod)/i);
            if (isMobile) {
                zoom = 0.9;
            } else {
                zoom = 1.1;
            }
        }
        game.documentZoom = game.deviceZoom * zoom;
        ui.updatez();

        const homeBody = ui.create.div('.taixuhuanjing_HomeBody', home);
        game.taixuUIupdata(homeBody, true, 2.05, 0.9);
        const body = ui.create.div('.taixuhuanjing_HomeBodyBackground1', homeBody);
        const season = lib.config.taixuhuanjing.season;

        const setBack = async function (setbody, string, season) {
            const isMobile = navigator.userAgent.match(/(Android|iPhone|SymbianOS|Windows Phone|iPad|iPod)/i);
            const img = `extension/太虚幻境/dlc/${season}/${string}_${season}.png`
            const bool = await game.checkImageExists_taixuhuanjing(img);

            if (bool) {
                setbody.setBackgroundImage(img);
            } else {
                if (string == "title") {
                    const textDiv = ui.create.div('.taixuhuanjing_HomeBodySeasonNameText', lib.translate['txhj_' + season], setbody);
                    if (isMobile) {
                        setTimeout(() => {
                            try {
                                const computedStyle = window.getComputedStyle(textDiv);
                                const fontSizeStr = computedStyle.fontSize;
                                const matchResult = fontSizeStr.match(/^(\d+(\.\d+)?)+(vw|px|rem|em)$/i);
                                const screenWidth = ui.window.offsetWidth || window.innerWidth;
                                const screenHeight = ui.window.offsetHeight || window.innerHeight;
                                const uiZoomStr = lib.config?.ui_zoom || '100%'; // 兜底默认100%
                                const zoomMatch = uiZoomStr.match(/^(\d+(\.\d+)?)%$/);
                                const uiZoom = zoomMatch ? parseFloat(zoomMatch[1]) / 100 : 1;
                                if (matchResult) {
                                    const [, numStr, , unit] = matchResult;
                                    const originalSize = parseFloat(numStr);
                                    if (!isNaN(originalSize)) {
                                        textDiv.style.fontSize = `${originalSize * (screenWidth / screenHeight - 0.3) * uiZoom}${unit}`;
                                    }
                                } else {
                                    console.warn('未匹配到有效字体格式：', fontSizeStr);
                                }
                            } catch (err) {
                                console.error('处理字体大小失败：', err);
                            }
                        }, 0);
                    }
                }
                setbody.setBackgroundImage(`extension/太虚幻境/event/common/${string}_common.png`);
            }
        }
        await setBack(body, 'bg', season);
        const Text = ui.create.div('.taixuhuanjing_HomeBodyText', homeBody);
        const updatetext = function () {
            setTimeout(function () {
                if (!game.seasonPack || !game.seasonPack[lib.config.taixuhuanjing.season]) {
                    updatetext();
                    return;
                }
                Text.innerHTML = game.seasonPack[lib.config.taixuhuanjing.season].info.randomGet();
            }, 1000);
        };
        updatetext();
        const seasonName = ui.create.div('.taixuhuanjing_HomeBodySeasonName', homeBody);

        await setBack(seasonName, 'title', season);
        body.update = async function () {
            const quody = document.querySelector('.taixuhuanjing_HomeBodySeasonNameText');
            if (quody) quody.remove();
            const season = lib.config.taixuhuanjing.season;
            if (season && game.seasonPack && game.seasonPack[season]) {
                await setBack(body, 'bg', season);
                await setBack(seasonName, 'title', season);
                if (game.seasonPack[season].info) {
                    Text.innerHTML = game.seasonPack[season].info.randomGet();
                }
            }
        };

        const seasonFunc = async function (seasonName) {
            const seasonDiv = ui.create.div('.taixuhuanjing_seasonChooseBodyButtonsDiv');
            await setBack(seasonDiv, 'title', seasonName);
            seasonDiv.node = seasonName;
            seasonDiv.listen(async function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                if (lib.config.taixuhuanjing && lib.config.taixuhuanjing.name != null) {
                    game.messagePopup('请完成当前挑战');
                    document.querySelector('.taixuhuanjing_seasonChooseBodyButtonsBody').remove();
                    e?.stopPropagation?.();
                    e?.preventDefault?.();
                    return;
                }
                game.updateModeData();
                home.replacePlayer();
                const config = lib.config.taixuhuanjing;
                const configNode = lib.config.taixuhuanjingNode;
                config.season = seasonName;
                if (!configNode || configNode[config.season] == undefined) {
                    lib.config.taixuhuanjing.rank = 1;
                } else if (configNode[config.season] && configNode[config.season].rank) {
                    lib.config.taixuhuanjing.rank = configNode[config.season].rank;
                }
                await body.update();
                document.querySelector('.taixuhuanjing_seasonChooseBodyButtonsBody').remove();
                game.messagePopup(lib.translate['txhj_' + lib.config.taixuhuanjing.season] + '赛季');
                game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            return seasonDiv;
        }
        seasonName.listen(async function (e) {
            const quody = document.querySelector('.taixuhuanjing_seasonChooseBodyButtonsBody');
            if (quody) {
                quody.remove();
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return;
            }
            const seasonBody = ui.create.div('.taixuhuanjing_seasonChooseBodyButtonsBody', homeBody);
            const config = lib.config.taixuhuanjing;
            let seasonPack = config.seasonPack;
            game.txhj_playAudioCall('WinButton', null, true);
            const fragment = document.createDocumentFragment();
            for (let season of seasonPack) {
                if (season) {
                    const seasonNode = await seasonFunc(season)
                    fragment.appendChild(seasonNode);
                }
            }
            seasonBody.appendChild(fragment);
            e?.stopPropagation?.();
            e?.preventDefault?.();
            return;
        });
        var rule = ui.create.div('.taixuhuanjing_HomeBodySeasonRule', seasonName);
        var ruleBox = ui.create.div('.taixuhuanjing_HomeBodySeasonBox', homeBody);
        var ruleShadow = ui.create.div('.taixuhuanjing_HomeBodySeasonTitleShadow', '太虚幻境通關指南', ruleBox);
        var ruleTitle = ui.create.div('.taixuhuanjing_HomeBodySeasonTitle', '太虚幻境通關指南', ruleBox);
        var ruleText = ui.create.div('.taixuhuanjing_HomeBodySeasonText', txhj.rule + '', ruleBox);
        lib.setScroll(ruleText);
        ruleBox.listen(function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        rule.listen(function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            ruleBox.style.display = 'block';
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        homeBody.listen(function (e) {
            ruleBox.style.display = 'none';
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        var tujianButton = ui.create.div('.taixuhuanjing_HomeBodyTuJianButton', homeBody).listen(function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            game.collectHome();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        var jiluButton = ui.create.div('.taixuhuanjing_HomeBodyJiLuButton', homeBody).listen(function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            game.txhjRecordHome();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        var tianfuButton = ui.create.div('.taixuhuanjing_HomeBodyTianFuButton', homeBody).listen(function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            game.txhjTianFuHome();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        var newJourne = ui.create.div('.taixuhuanjing_HomeBodyNewJourney', homeBody);
        newJourne.listen(function (e) {
            let num = 0;
            for (let key in lib.character) {
                if (!lib.filter.characterDisabled(key)) {
                    num++;
                }
            };
            if (num.length < 1) {
                game.messagePopup('武将不足，请开启武将包再来挑战吧');
                return;
            }
            game.txhj_playAudioCall('WinButton', null, true);
            ruleBox.style.display = 'none';
            const config = lib.config.taixuhuanjing;
            if (config.equip1 != null || config.equip2 != null || config.equip3 != null || config.equip4 != null) {
                game.updateModeData();
            }
            if (config == undefined) {
                game.updateModeData();
                home.replacePlayer();
                //rankBody.update();
            } else if (config.name != null) {
                var src = "是否删除当前挑战的进度?";
                var d = confirm(src);
                if (d == true) {
                    game.updateModeData();
                    home.replacePlayer();
                    //rankBody.update();
                }
                return;
            };
            home.delete();
            game.taixuUIupdata(homeBody, false);
            game.chooseCharacter();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        var oldJourne = ui.create.div('.taixuhuanjing_HomeBodyOldJourney', homeBody);
        oldJourne.listen(function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            ruleBox.style.display = 'none';
            if (lib.config.taixuhuanjing == undefined) {
                game.updateModeData();
            };
            if (lib.config.taixuhuanjing.name == null || !lib.config.taixuhuanjing.servants || !lib.config.taixuhuanjing.servants.length) {
                game.messagePopup('无相关进度');
                return;
            }
            _status.choiceCharacter = lib.config.taixuhuanjing.name;
            game.transitionAnimation();
            setTimeout(function () {
                home.delete();
                game.taixuUIupdata(homeBody, false);
                game.consoledesk();
            }, 1000);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        var point = ui.create.div('.taixuhuanjing_HomeBodyPoint', homeBody);
        point.listen(async function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            ruleBox.style.display = 'none';
            if (lib.config.taixuhuanjing == undefined) {
                game.updateModeData();
            };
            if (lib.config.taixuhuanjing && lib.config.taixuhuanjing.name != null) {
                game.messagePopup('请完成当前挑战');
                return;
            }
            await game.choiceCharacter(home);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        home.replacePlayer = function (value) {
            point.innerHTML = '';
            if (value) {
                if (!_status.choiceCharacter) return;
                var name = _status.choiceCharacter;
                lib.config.taixuhuanjing.point = name;
                //game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                point.innerHTML = '';
                var playImp1 = ui.create.div('.taixuhuanjing_HomeBodyPointImp1', point);
                var playImp2 = ui.create.div('.taixuhuanjing_HomeBodyPointImp2', playImp1);
                playImp2.setBackground(name, 'character');
                var nameText = ui.create.div('.taixuhuanjing_HomeBodyPointText', '' + lib.translate[name] + '', point);
            } else {
                if (!lib.config.taixuhuanjing || lib.config.taixuhuanjing.point == null) return;
                point.innerHTML = '';
                var name = lib.config.taixuhuanjing.point;
                var playImp1 = ui.create.div('.taixuhuanjing_HomeBodyPointImp1', point);
                var playImp2 = ui.create.div('.taixuhuanjing_HomeBodyPointImp2', playImp1);
                playImp2.setBackground(name, 'character');
                var nameText = ui.create.div('.taixuhuanjing_HomeBodyPointText', '' + lib.translate[name] + '', point);
            }
        }
        home.replacePlayer();
    };
    game.choiceCharacter = async function (view) {//点将
        var homeBody = ui.create.div('.taixuhuanjing_HomeBody2', view);
        game.taixuUIupdata(homeBody, true, 2.0, 0.9);

        var title = ui.create.div('.taixuhuanjing_PointTitle', homeBody);
        var body = ui.create.div('.taixuhuanjing_PointBody', homeBody);

        if (!lib.config.mode_config.taixuhuanjing.quankuo) {
            var list = {
                wei: ['chengyu', 'xunyou', 're_caocao', 're_simayi', 're_xiahoudun', 're_xuzhu', 're_guojia', 're_lidian', 'wangji', 'xizhicai', 're_zhenji', 'luzhi', 're_dianwei', 're_xunyu', 'simazhao', 'wangyuanji', 're_xuhuang',
                    'caoying', 'jiakui', 'yujin_yujin', 'caoren', 'ol_xiahouyuan'],
                wei2: ['chengyu', 'xunyou', 're_caocao', 're_simayi', 're_xiahoudun', 're_xuzhu', 're_guojia', 're_lidian', 'wangji', 'xizhicai', 're_zhenji', 'luzhi', 're_dianwei', 're_xunyu', 'simazhao', 'wangyuanji', 're_xuhuang',
                    'caoying', 'jiakui', 'yujin_yujin', 'caoren', 'ol_xiahouyuan'],
                shu: ['old_madai', 're_guanyu', 're_zhaoyun', 're_machao', 'zhaoxiang', 'qinmi', 're_zhugeliang', 'zhaotongzhaoguang', 'mayunlu', 'ol_sp_zhugeliang', 'zhugezhan', 'zhangyì', 're_huangzhong', 'wuban', 're_weiyan'],
                shu2: ['old_madai', 're_guanyu', 're_zhaoyun', 're_machao', 'zhaoxiang', 'qinmi', 're_zhugeliang', 'zhaotongzhaoguang', 'mayunlu', 'ol_sp_zhugeliang', 'zhugezhan', 'zhangyì', 're_huangzhong', 'wuban', 're_weiyan'],
                wu: ['sunru', 'zhugeke', 'liuzan', 're_ganning', 're_huanggai', 'zhuhuan', 'xushi', 're_sunquan', 'zhoufang', 're_xusheng'],
                wu2: ['sunru', 'zhugeke', 'liuzan', 're_ganning', 're_huanggai', 'zhuhuan', 'xushi', 're_sunquan', 'zhoufang', 're_xusheng'],
                qun: ['lvbu', 'dongzhuo', 'zhangbao', 'xin_liru', 're_zhangjiao', 're_lvbu', 'guotufengji', 'quyi', 'zhangrang', 'liuyan', 're_zhangliang', 'xuyou', 'sp_liuqi', 'lijue', 'guosi', 'xurong', 'zhangji', 'fanchou', 're_zhurong', 're_dongzhuo', 'zhangxiu', 'yj_xuhuang', 'ol_yujin', 're_liru', 'yj_ganning'],
                qun2: ['lvbu', 'dongzhuo', 'zhangbao', 'xin_liru', 're_zhangjiao', 're_lvbu', 'guotufengji', 'quyi', 'zhangrang', 'liuyan', 're_zhangliang', 'xuyou', 'sp_liuqi', 'lijue', 'guosi', 'xurong', 'zhangji', 'fanchou', 're_zhurong', 're_dongzhuo', 'zhangxiu', 'yj_xuhuang', 'ol_yujin', 're_liru', 'yj_ganning'],
                jin: [],
                jin2: [],
                shen: ['shen_guanyu', 'shen_lvmeng', 'shen_zhouyu', 'shen_lvbu', 'shen_zhaoyun', 'shen_simayi', 'shen_ganning', 'shen_zhangfei'],
                shen2: ['shen_guanyu', 'shen_lvmeng', 'shen_zhouyu', 'shen_lvbu', 'shen_zhaoyun', 'shen_simayi', 'shen_ganning', 'shen_zhangfei'],
                common: [],
                common2: [],
            }
            for (const key in list) {
                if (list.hasOwnProperty(key)) {
                    list[key] = list[key].filter(c => !lib.filter.characterDisabled(lib.character[c]));
                }
            }
            var list2 = [
                /*神*/
                'shen_guanyu', 'shen_lvmeng', 'shen_zhouyu', 'shen_lvbu', 'shen_zhaoyun', 'shen_simayi', 'shen_ganning', 'shen_zhangfei',
                /*魏*/
                'chengyu', 'xunyou', 're_caocao', 're_simayi', 're_xiahoudun', 're_xuzhu', 're_guojia', 're_lidian', 'wangji', 'xizhicai', 're_zhenji', 'luzhi', 're_dianwei', 're_xunyu', 'simazhao', 'wangyuanji', 're_xuhuang',
                'caoying', 'jiakui', 'yujin_yujin', 'caoren', 'ol_xiahouyuan',
                /*蜀*/
                'old_madai', 're_guanyu', 're_zhaoyun', 're_machao', 'zhaoxiang', 'qinmi', 're_zhugeliang', 'zhaotongzhaoguang', 'mayunlu', 'ol_sp_zhugeliang', 'zhugezhan', 'zhangyì', 're_huangzhong', 'wuban', 're_weiyan',
                /*吴*/
                'sunru', 'zhugeke', 'liuzan', 're_ganning', 're_huanggai', 'zhuhuan', 'xushi', 're_sunquan', 'zhoufang', 're_xusheng',
                /*群*/
                'lvbu', 'dongzhuo', 'zhangbao', 'xin_liru', 're_zhangjiao', 're_lvbu', 'guotufengji', 'quyi', 'zhangrang', 'liuyan', 're_zhangliang', 'xuyou', 'sp_liuqi', 'lijue', 'guosi', 'xurong', 'zhangji', 'fanchou', 're_zhurong', 're_dongzhuo', 'zhangxiu', 'yj_xuhuang', 'ol_yujin', 're_liru', 'yj_ganning',
            ];
            list2 = list2.filter(c => !lib.filter.characterDisabled(lib.character[c]));
            for (let i = 0; i < list2.length; i++) {
                if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.use && lib.config.taixuhuanjingNode.use[list2[i]]) {
                    list.common.push(list2[i]);
                    list.common2.push(list2[i]);
                }
            }
        } else {
            var grouplist = ['common'].concat(lib.group);
            var list = {
            };
            for (let i of grouplist) {
                list[i] = [];
                list[i + '2'] = [];
            }
            for (var characterpack in lib.characterPack) {
                if (characterpack == 'mode_extension_太虚幻境') continue;
                for (var character in lib.characterPack[characterpack]) {
                    if (lib.filter.characterDisabled(character)) continue;
                    if (!lib.character[character]) continue;
                    if (lib.character[character][4]) {
                        if (['forbidai', 'boss', 'hiddenboss', 'minskin', 'unseen'].some(i => lib.character[character][4].includes(i))) continue;
                    }
                    if (lib.character[character][1]) {
                        if (!grouplist.includes(lib.character[character][1])) {
                            list.common.push(character);
                            continue;
                        }
                    } else {
                        continue;
                    }
                    list[lib.character[character][1]].push(character);
                    list[lib.character[character][1] + '2'].push(character);
                    if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.use && lib.config.taixuhuanjingNode.use[character]) {
                        list.common.push(character);
                        list.common2.push(character);
                    }
                }
            }
        }
        var groupBody = ui.create.div('.taixuhuanjing_PointGroup', body);
        groupBody.addEventListener('wheel', function (e) {
            e.preventDefault();
            this.scrollLeft += e.deltaY;
        });
        var choicehoGroup = false;
        var choicehoPlay = false;
        var playBox = ui.create.div('.taixuhuanjing_PointPlayBox', body);
        var playBody = ui.create.div('.taixuhuanjing_PointPlayBody', playBox);
        lib.setScroll(playBody);
        function funcPlay(play) {
            var div = ui.create.div('.taixuhuanjing_PointPlayDiv');
            var rankBody = ui.create.div(".taixuhuanjing_characterDivMobileRankBody2", div);
            var playImp1 = ui.create.div('.taixuhuanjing_ChoiceCharacterPlayImp1', div);
            var playImp2 = ui.create.div('.taixuhuanjing_ChoiceCharacterPlayImp2', playImp1);
            var nameText = ui.create.div('.taixuhuanjing_ChoiceCharacterPlayText', playImp1);
            playImp2.setBackground(play, 'character');
            nameText.innerHTML = lib.translate[play];
            var rarity = game.getRarity(play);
            var star;
            switch (rarity) {
                case 'legend': star = 5; break;
                case 'epic': star = 4; break;
                case 'rare': star = 3; break;
                case 'common': star = 2; break;
                default: star = 1;
            }
            //星级修改
            if (lib.config.mode_config.taixuhuanjing.star && lib.config.mode_config.taixuhuanjing.star != 0) star = lib.config.mode_config.taixuhuanjing.star;
            while (star--) {
                var starIcon = ui.create.div(".taixuhuanjing_characterDivMobileStarICON2", rankBody);
            }
            div.listen(function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                var skills = get.character(play, 3).slice(0);
                game.txhj_TrySkillAudio(skills.randomGet(), { name: play }, null, [1, 2].randomGet());
                _status.choiceCharacter = play;
                if (playBody.choosingNow) {
                    playBody.choosingNow.noChoiced();
                }
                this.choiced();
                div.style.boxShadow = '-5px 0px 5px rgba(0,255,0,0.75),0px -5px 5px rgba(0,255,0,0.75),5px 0px 5px rgba(0,255,0,0.75),0px 5px 5px rgba(0,255,0,0.75)';
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            div.oncontextmenu = function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                game.pause();
                ui.click.charactercard(play, null, null, true, this);
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            };
            div.choiced = function () {
                playBody.choosingNow = this;
                div.style.boxShadow = '-5px 0px 5px rgba(255,255,0,0.75),0px -5px 5px rgba(255,255,0,0.75),5px 0px 5px rgba(255,255,0,0.75),0px 5px 5px rgba(255,255,0,0.75)';
            };
            div.noChoiced = function () {
                playBody.choosingNow = null;
                div.style.boxShadow = 'none';
            };
            div.onmouseover = function () {
                if (_status.choiceCharacter == undefined || _status.choiceCharacter != play) {
                    div.style.boxShadow = '-5px 0px 5px rgba(255,255,0,0.75),0px -5px 5px rgba(255,255,0,0.75),5px 0px 5px rgba(255,255,0,0.75),0px 5px 5px rgba(255,255,0,0.75)';
                };
            };
            div.onmouseout = function () {
                if (_status.choiceCharacter == undefined || _status.choiceCharacter != play) {
                    div.style.boxShadow = 'none';
                };
            };
            return div;
        };
        var playBodyUpdate = function (group) {
            playBody.innerHTML = '';
            var playlist = list[group].slice(0);
            var fragment = document.createDocumentFragment();

            if (group == 'common') {
                playlist.sort(function (a, b) {
                    var useConfig = lib.config.taixuhuanjingNode.use || {};
                    var num1 = useConfig[a] || 0;
                    var num2 = useConfig[b] || 0;
                    return num2 - num1;
                });
            }

            while (playlist.length) {
                var play = playlist.shift();
                fragment.appendChild(funcPlay(play));
            }

            playBody.appendChild(fragment);
        };
        playBodyUpdate('common');
        async function funcGroup(group) {
            let div = ui.create.div('.taixuhuanjing_PointGroupDiv');

            let config = {
                translate: group === 'common' ? '常用' : lib.translate[group],
                num: list[group + '2'].length,
                max: list[group].length,
                color: group === 'common' ? 'rgb(0,0,0)' : get.translation(group),
                backgroundImage: 'extension/太虚幻境/image/style/text_' + group + '.png',
                choicedBackgroundImage: 'extension/太虚幻境/image/icon/icon_point1.png'
            };
            let bool = await game.checkImageExists_taixuhuanjing(config.backgroundImage);
            let divName = ui.create.div('.taixuhuanjing_ChoiceCharacterGroupDivName', div);
            divName.setBackgroundImage(config.backgroundImage);
            if (!bool) {
                const span = ui.create.div('.taixuhuanjing_ChoiceCharacterGroupDivNameText', config.translate, divName);
                let color = lib.translate[group + 'Color'] ? lib.translate[group + 'Color'] : "#ffd700";
                span.style.color = color;
            }
            let divMax = ui.create.div('.taixuhuanjing_ChoiceCharacterGroupDivMax', config.num + '/' + config.max, div);
            div.listen(function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                if (groupBody.choosingNow) {
                    groupBody.choosingNow.noChoiced();
                }
                this.choiced();
                _status.choiceCharacter = undefined;
                playBodyUpdate(group);
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            div.choiced = function () {
                groupBody.choosingNow = this;
                div.setBackgroundImage(config.choicedBackgroundImage);
            };
            div.noChoiced = function () {
                groupBody.choosingNow = null;
                div.style.backgroundImage = 'none';
            };
            if (group === 'common') {
                div.choiced();
            }
            return div;
        }
        const fragment = document.createDocumentFragment();
        while (grouplist?.length > 0) {
            const group = grouplist.shift();
            if (list[group].length > 0 || list[group + '2'].length > 0) {
                const div = await funcGroup(group);
                fragment.appendChild(div);
            }
        }
        groupBody.appendChild(fragment);
        const okButton = ui.create.div('.taixuhuanjing_ChoiceCharacterOkButton', '确认选择', body);
        okButton.listen(e => {
            game.txhj_playAudioCall('off', null, true);
            game.taixuUIupdata(homeBody, false);
            view.removeChild(homeBody);
            if (_status.choiceCharacter) {
                view.replacePlayer(_status.choiceCharacter);
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        const SouButton = ui.create.div('.taixuhuanjing_ChoiceCharacterSouButton', '搜索', body);
        SouButton.listen(function () {
            var src = "请输入角色名";
            var overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            overlay.style.display = "flex";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "center";
            overlay.style.zIndex = "1000";
            var dialog = document.createElement("div");
            dialog.style.padding = "20px";
            dialog.style.border = "1px solid black";
            dialog.style.background = "white";
            dialog.style.borderRadius = "10px";
            dialog.style.backgroundColor = "rgba(46, 124, 207, 0.5)";
            dialog.style.zIndex = "1001";
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                dialog.style.position = "absolute";
                dialog.style.top = "175px";
                dialog.style.left = "50%";
                dialog.style.transform = "translateX(-50%)";
            }
            var label = document.createElement("label");
            label.textContent = src;
            label.style.display = "block";
            label.style.marginBottom = "10px";
            var input = document.createElement("input");
            input.type = "text";
            input.placeholder = "请输入角色名";
            input.value = '';
            var confirmButton = document.createElement("button");
            confirmButton.textContent = "确认";
            confirmButton.style.marginRight = "10px";
            confirmButton.onclick = function () {
                var userInput = input.value.trim();
                if (!list) {
                    game.messagePopup('请先加载角色列表');
                    return;
                }
                if (userInput) {
                    let soulist = [];
                    for (const i in list) {
                        list[i].forEach(function (name) {
                            if (!name) return;
                            if (get.translation(name).includes(userInput) || name.includes(userInput)) {
                                soulist.push(name);
                            }
                        });
                    }
                    if (soulist.length) {
                        soulist = Array.from(new Set(soulist));
                        _status.choiceCharacter = undefined;
                        playBody.innerHTML = '';
                        var fragment = document.createDocumentFragment();
                        while (soulist.length) {
                            var play = soulist.shift();
                            fragment.appendChild(funcPlay(play));
                            playBody.appendChild(fragment);
                        }
                    } else {
                        game.messagePopup("未找到角色");
                        return;
                    }
                } else {
                    game.messagePopup("请输入角色名");
                    return;
                }
                overlay.remove();
            };
            var cancelButton = document.createElement("button");
            cancelButton.textContent = "取消";
            cancelButton.onclick = function () {
                overlay.remove();
            };
            dialog.appendChild(label);
            dialog.appendChild(input);
            dialog.appendChild(confirmButton);
            dialog.appendChild(cancelButton);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        });
    };
    game.chooseCharacter = function () {//选择角色
        var dialog = ui.create.div('.taixuhuanjing_chooseCharacterDialog');
        document.body.appendChild(dialog);
        _status.choiceCharacter = undefined;
        var body = ui.create.div('.taixuhuanjing_chooseCharacterBody', dialog);
        game.taixuUIupdata(body, true, 2.4);
        var title = ui.create.div('.taixuhuanjing_consoledeskTitle', dialog);
        var titleText = ui.create.div('.taixuhuanjing_consoledeskTitleText', '请选择你的武将,挑战幻境', title);
        var playBody = ui.create.div('.taixuhuanjing_chooseCharacterPlayBody', body);
        var playBodyDiv = ui.create.div('.taixuhuanjing_chooseCharacterPlayBodyDiv', playBody);
        var playBodySkills = ui.create.div('.taixuhuanjing_chooseCharacterPlayBodySkills', playBody);

        var difficultyChooseBody = ui.create.div('.taixuhuanjing_chooseCharacterDifficultyChooseBody', body);
        var difficultyChooseBodyText = ui.create.div('.taixuhuanjing_chooseCharacterDifficultyChooseBodyText', difficultyChooseBody);
        var difficultyChooseBodyButton = ui.create.div('.taixuhuanjing_chooseCharacterDifficultyChooseBodyButton', difficultyChooseBody);
        function rankFunc(rankNode) {
            const difficultyChooseBodyButtonsDiv = ui.create.div('.taixuhuanjing_difficultyChooseBodyButtonsDiv', rankNode.name);

            difficultyChooseBodyButtonsDiv.node = rankNode;
            /* const seasonConfig = lib.config.taixuhuanjingNode[lib.config.taixuhuanjing.season];
             const isLocked = rankNode.num !== 1 && (!seasonConfig || seasonConfig.rank < rankNode.num);
             if (isLocked) {
                 // 可以在这里添加锁定图标或禁用点击
                 // var difficultyChooseBodyButtonsIcon = ui.create.div('.taixuhuanjing_difficultyChooseBodyButtonsIcon', difficultyChooseBodyButtonsDiv);
                 // difficultyChooseBodyButtonsDiv.style.pointerEvents = 'none';
             }*/
            difficultyChooseBodyButtonsDiv.listen(e => {
                game.txhj_playAudioCall('WinButton', null, true);
                const num = difficultyChooseBodyButtonsDiv.node.num;
                lib.config.taixuhuanjing.rank = num;
                difficultyChooseBodyButton.style.transform = 'rotate(90deg)';
                difficultyChooseBody.update();
                difficultyInfoBody.update();
                game.messagePopup(`${rankNode.name}难度`);
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            return difficultyChooseBodyButtonsDiv;
        }
        difficultyChooseBodyButton.listen(e => {
            game.txhj_playAudioCall('WinButton', null, true);
            if (difficultyChooseBodyButton.style.transform === 'rotate(270deg)') {
                difficultyChooseBodyButton.style.transform = 'rotate(90deg)';
                difficultyChooseBody.update();
            } else {
                difficultyChooseBodyButton.style.transform = 'rotate(270deg)';
                const ranks = [
                    { name: '普通', num: 1 },
                    { name: '困难', num: 2 },
                    { name: '噩梦', num: 3 },
                    { name: '炼狱', num: 4 },
                    { name: '血战', num: 5 },
                    { name: '末日', num: 6 }
                ];
                const fragment = document.createDocumentFragment();
                while (ranks.length) {
                    const rankNode = ranks.shift();
                    fragment.appendChild(rankFunc(rankNode));
                }
                difficultyChooseBody.appendChild(fragment);
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        difficultyChooseBody.update = () => {
            const rankMap = {
                6: '末日',
                5: '血战',
                4: '炼狱',
                3: '噩梦',
                2: '困难',
                1: '普通'
            };
            const rankStr = rankMap[lib.config.taixuhuanjing.rank] || '普通';
            difficultyChooseBodyText.innerHTML = `<p style='color: #fff;'>当前难度: </p>${rankStr}`;
            while (difficultyChooseBody.childNodes.length > 2) {
                difficultyChooseBody.removeChild(difficultyChooseBody.lastChild);
            }
        };
        difficultyChooseBody.update();
        var difficultyInfoBodyTitle = ui.create.div('.taixuhuanjing_chooseCharacterDifficultyInfoBodyTitle', '当前难度效果:', body);
        var difficultyInfoBody = ui.create.div('.taixuhuanjing_chooseCharacterDifficultyInfoBody', body);
        const difficultyDescriptions = {
            1: '每超出敌人1级，其额外+1体力及体力上限',
            2: '敌人额外+1体力及体力上限；每超出敌人1级，其额外+2体力及体力上限',
            3: '敌人额外+1体力及体力上限并拥有技能英姿与马术，每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1',
            4: '敌人额外+1体力及体力上限并拥有技能英姿与马术，装备一件随机装备；每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1',
            5: '敌人额外+1体力及体力上限并拥有技能英姿与马术，装备一件随机装备；每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1并获得鏖战祝福',
            6: '敌人额外+1体力及体力上限并拥有技能英姿与马术，装备一件随机装备；每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1并获得鏖战祝福'
        };
        difficultyInfoBody.update = () => {
            const rank = lib.config.taixuhuanjing.rank;
            const description = difficultyDescriptions[rank] || '未知难度';
            difficultyInfoBody.innerHTML = `<p style='color: #fff; margin: 4%;'>${description}</p>`;
        };
        difficultyInfoBody.update();

        var starBodyTitle = ui.create.div('.taixuhuanjing_chooseCharacterStarBodyTitle', '当前星级效果:', body);
        var starBody = ui.create.div('.taixuhuanjing_chooseCharacterStarBody', body);
        const rarityValues = {
            legend: 5,
            epic: 4,
            rare: 3,
            common: 2,
            default: 1
        };
        const starDescriptions = {
            1: '3个技能槽，手气卡次数1',
            2: '300金币，3个技能槽，手气卡次数3',
            3: '300金币，3个技能槽，手气卡次数3，初始手牌+1',
            4: '500金币，4个技能槽，手气卡次数4，初始手牌+1，额外+1体力及体力上限',
            5: '1000金币，5个技能槽，手气卡次数5，初始手牌+2，额外+2体力及体力上限'
        };
        starBody.update = (name) => {
            const rarity = game.getRarity(name);
            let value = rarityValues[rarity] || rarityValues.default;
            let star = value; // 默认根据稀有度确定星级

            // 如果配置中的星级不为 0，则使用配置中的星级
            if (lib.config.mode_config.taixuhuanjing.star != 0) {
                star = lib.config.mode_config.taixuhuanjing.star;
            }

            const description = starDescriptions[star] || '未知星级';
            starBody.innerHTML = `<p style='color: #fff; margin: 4%;'>${description}</p>`;
        };
        lib.setScroll(playBodySkills);
        playBody.update = function (name) {
            playBodyDiv.innerHTML = '';
            playBodyDiv.style.animationName = 'dlcAnimation-1';
            game.addCharacterDivMobile(name, true, playBodyDiv);
            game.txhj_playAudioCall('PopUp', null, true);
            setTimeout(function () {
                playBodySkills.innerHTML = '';
                playBodyDiv.style.animationName = 'none';
                playBodyDiv.style.opacity = '1';
                var intro = lib.character[name];
                if (!intro) {
                    intro = get.character(name)
                }
                if (!intro) return;
                var skillsComps = {
                    playName: (function () {
                        var info = lib.translate[name];
                        var playName = ui.create.div('.taixuhuanjing_chooseCharacterPlayBodySkills1');
                        playName.innerHTML = lib.translate[intro[1]] + '.' + info;
                        if (intro[1] == 'wei') {
                            playName.style.color = '#1E90FF';
                        } else if (intro[1] == 'shu') {
                            playName.style.color = '#FF7F24';
                        } else if (intro[1] == 'wu') {
                            playName.style.color = '#76EE00';
                        } else if (intro[1] == 'qun') {
                            playName.style.color = '#FFFF00';
                        } else if (intro[1] == 'jin') {
                            playName.style.color = '#9400D3';
                        } else {
                            playName.style.color = '#FF0000';
                        }
                        return playName;
                    })(),
                    playHp: (function (hp) {
                        var playHp = ui.create.div('.taixuhuanjing_chooseCharacterPlayBodySkills2');
                        if (typeof hp != 'number') {
                            var hp1 = get.infoHp(hp);
                            var hp2 = hp1;
                            var maxHp1 = get.infoMaxHp(hp);
                            if (hp1 < 16 && maxHp1 < 16) {
                                var num = maxHp1 - hp1;
                                while (hp1--) {
                                    var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                                    if (hp2 > 2) {
                                        tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                                    } else if (hp2 > 1) {
                                        tmp.setBackgroundImage('extension/太虚幻境/image/style/glass2.png');
                                    } else if (hp2 > 0) {
                                        tmp.setBackgroundImage('extension/太虚幻境/image/style/glass3.png');
                                    }
                                }
                                while (num--) {
                                    var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                                    tmp.setBackgroundImage('extension/太虚幻境/image/style/glass4.png');
                                }
                            } else {
                                var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                                tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                                var numbody = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpNum", hp + '', playHp);
                            }
                        } else if (hp <= 15) {
                            var num = hp;
                            while (num--) {
                                var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                                tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                            }
                        } else if (hp == Infinity) {
                            var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                            tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                            var numbody = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpNum", '∞', playHp);
                        } else {
                            var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                            tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                            var numbody = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpNum", hp + '', playHp);
                        }
                        return playHp;
                    })(intro[2]),
                    playSkills: (function () {
                        var skillInfo = "";
                        var skills = get.character(name, 3).slice(0);
                        for (var i = 0; i < skills.length; i++) {
                            if (skillInfo != "") skillInfo += "<p>";
                            skillInfo += "<br>" + get.translation([skills[i]]) + ":";
                            skillInfo += lib.translate[skills[i] + '_info'];
                        }
                        var playSkills = ui.create.div('.taixuhuanjing_chooseCharacterPlayBodySkills3');
                        playSkills.innerHTML = skillInfo;
                        return playSkills;
                    })(),
                }
                for (var i in skillsComps) {
                    playBodySkills.appendChild(skillsComps[i]);
                }
            }, 300);
        };
        var characterBody = ui.create.div('.taixuhuanjing_chooseCharacterCharacterBody', body);
        lib.setScroll(characterBody);
        function func(name) {
            var div = ui.create.div('.taixuhuanjing_chooseCharacterDiv');
            game.addCharacterDivMobile(name, true, div);
            div.listen(function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                var skills = get.character(name, 3).slice(0);
                game.txhj_TrySkillAudio(skills.randomGet(), { name: name }, null, [1, 2].randomGet());
                if (characterBody.choosingNow) {
                    characterBody.choosingNow.noChoiced();
                }
                this.choiced();
                div.style.boxShadow = '-5px 0px 5px rgba(0,255,0,0.75),0px -5px 5px rgba(0,255,0,0.75),5px 0px 5px rgba(0,255,0,0.75),0px 5px 5px rgba(0,255,0,0.75)';
                if (_status.choiceCharacter != name) {
                    _status.choiceCharacter = name;
                    playBody.update(name);
                    starBody.update(name);
                }
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            div.oncontextmenu = function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                game.pause();
                ui.click.charactercard(name, null, null, true, this);
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            };
            div.choiced = function () {
                characterBody.choosingNow = this;
                div.style.boxShadow = '-5px 0px 5px rgba(255,255,0,0.75),0px -5px 5px rgba(255,255,0,0.75),5px 0px 5px rgba(255,255,0,0.75),0px 5px 5px rgba(255,255,0,0.75)';
            };
            div.noChoiced = function () {
                characterBody.choosingNow = null;
                div.style.boxShadow = 'none';
            };
            div.onmouseover = function () {
                if (_status.choiceCharacter == undefined || _status.choiceCharacter != name) {
                    div.style.boxShadow = '-5px 0px 5px rgba(255,255,0,0.75),0px -5px 5px rgba(255,255,0,0.75),5px 0px 5px rgba(255,255,0,0.75),0px 5px 5px rgba(255,255,0,0.75)';
                };
            };
            div.onmouseout = function () {
                if (_status.choiceCharacter == undefined || _status.choiceCharacter != name) {
                    div.style.boxShadow = 'none';
                };
            };
            return div;
        };
        if (!lib.config.mode_config.taixuhuanjing.quankuo) {
            var list = [
                /*神*/
                'shen_guanyu', 'shen_lvmeng', 'shen_zhouyu', 'shen_lvbu', 'shen_zhaoyun', 'shen_simayi', 'shen_ganning', 'shen_zhangfei',
                /*魏*/
                'chengyu', 'xunyou', 're_caocao', 're_simayi', 're_xiahoudun', 're_xuzhu', 're_guojia', 're_lidian', 'wangji', 'xizhicai', 're_zhenji', 'luzhi', 're_dianwei', 're_xunyu', 'simazhao', 'wangyuanji', 're_xuhuang',
                'caoying', 'jiakui', 'yujin_yujin', 'caoren', 'ol_xiahouyuan',
                /*蜀*/
                'old_madai', 're_guanyu', 're_zhaoyun', 're_machao', 'zhaoxiang', 'qinmi', 're_zhugeliang', 'zhaotongzhaoguang', 'mayunlu', 'ol_sp_zhugeliang', 'zhugezhan', 'zhangyì', 're_huangzhong', 'wuban', 're_weiyan',
                /*吴*/
                'sunru', 'zhugeke', 'liuzan', 're_ganning', 're_huanggai', 'zhuhuan', 'xushi', 're_sunquan', 'zhoufang', 're_xusheng',
                /*群*/
                'lvbu', 'dongzhuo', 'zhangbao', 'xin_liru', 're_zhangjiao', 're_lvbu', 'guotufengji', 'quyi', 'zhangrang', 'liuyan', 're_zhangliang', 'xuyou', 'sp_liuqi', 'lijue', 'guosi', 'xurong', 'zhangji', 'fanchou', 're_zhurong', 're_dongzhuo', 'zhangxiu', 'yj_xuhuang', 'ol_yujin', 're_liru', 'yj_ganning',
            ];
            list = list.filter(c => !lib.filter.characterDisabled(lib.character[c]));
        } else {
            var list = [];
            const disabledCharacters = new Set(Object.keys(lib.character).filter(lib.filter.characterDisabled));
            const pointCharacter = lib.config.taixuhuanjing?.point;
            for (const i in lib.character) {
                if (disabledCharacters.has(i) || !lib.character[i] || (pointCharacter && i === pointCharacter)) {
                    continue;
                }
                list.push(i);
            }
        }

        function generateList(list, point) {
            return [point].concat(list.randomRemove(5));
        }
        function appendCharacters(characterBody, list2, func) {
            while (list2.length) {
                var name = list2.shift();
                if (name != null) {
                    characterBody.appendChild(func(name));
                }
            }
        }
        var list2 = generateList(list, lib.config.taixuhuanjing.point);
        appendCharacters(characterBody, list2, func);

        var okButton = ui.create.div('.taixuhuanjing_chooseCharacterOkButton', body);
        var okText = ui.create.div('.taixuhuanjing_chooseCharacterOkText', okButton);
        body.off = function () {
            game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
            if (lib.config.taixuhuanjing.rank == 6) {
                game.ApocalypseFunc(dialog, body);
            } else {
                game.transitionAnimation();
                setTimeout(function () {
                    dialog.delete();
                    game.taixuUIupdata(body, false);
                    game.chooseServant();
                }, 1000);
            }
        };

        var refreshButton = ui.create.div('.taixuhuanjing_chooseCharacterrefreshButton', body);
        refreshButton.addEventListener('click', function () {
            if (list.length < 5) {
                game.messagePopup('武将不足，请选择一名武将');
                return;
            }
            var newList2 = generateList(list, lib.config.taixuhuanjing.point);
            if (characterBody) {
                characterBody.innerHTML = '';
            }
            appendCharacters(characterBody, newList2, func);
        });
        okButton.listen(function (e) {
            if (!_status.choiceCharacter) {
                game.messagePopup('请选择一名武将');
                return;
            }
            if (!lib.character[_status.choiceCharacter]) {
                game.messagePopup('指定武将的武将包未开启');
                return;
            }

            game.txhj_playAudioCall('off', null, true);

            // 计算星级
            const rarity = game.getRarity(_status.choiceCharacter);
            let star = {
                legend: 5,
                epic: 4,
                rare: 3,
                common: 2
            }[rarity] || 1;

            // 星级修改
            if (lib.config.mode_config.taixuhuanjing.star && lib.config.mode_config.taixuhuanjing.star != 0) {
                star = lib.config.mode_config.taixuhuanjing.star;
            }

            // 更新配置
            const config = lib.config.taixuhuanjing;
            config.name = _status.choiceCharacter;
            config.point = _status.choiceCharacter;


            if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.use) {
                if (!lib.config.taixuhuanjingNode.use[_status.choiceCharacter]) {
                    lib.config.taixuhuanjingNode.use[_status.choiceCharacter] = 1;
                } else {
                    lib.config.taixuhuanjingNode.use[_status.choiceCharacter]++;
                }
                game.saveConfig('taixuhuanjingNode', lib.config.taixuhuanjingNode);
            }

            config.hp = get.infoHp(lib.character[_status.choiceCharacter][2]);
            config.maxHp = get.infoMaxHp(lib.character[_status.choiceCharacter][2]);

            const skills = get.character(_status.choiceCharacter, 3).slice(0);
            const skills2 = [];
            while (skills2.length < 5 && skills.length) {
                skills2.push(skills.shift());
            }
            config.skills = [];
            config.useSkills = skills2.slice(0);
            // 根据星级更新配置
            const baseAdjust = [0, 1, 3, 3, 4, 5];//脚气卡
            const baseMinHs = [0, 0, 1, 1, 1, 2];//初始手牌
            const baseHp = [0, 0, 0, 0, 1, 2];//体力
            const baseMaxSkills = [0, 2, 3, 3, 4, 5];//技能槽
            const baseCoin = [0, 0, 300, 300, 500, 1000];//金币
            function generateBaseCard(name) {
                return {
                    name: name,
                    suit: ['spade', 'heart', 'club', 'diamond'].randomGet(),
                    number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].randomGet(),
                    nature: '',
                };
            }
            const buffs = lib.config.txhjtianfuData[config.season].tianfu.buff;
            for (let i = 1; i <= 8; i++) {
                if (buffs.includes(`富甲一方_${i}`)) config.coin += 50;
                if (buffs.includes(`以战养战_${i}`)) {
                    config.coinNum += 10;
                    if (i == 7 || i == 8) config.coin += 10;
                }
            }
            const buffActions = {
                '囤粮积草': () => config.maxHs++,
                '精力充沛': () => { config.maxHp++; config.hp++; },
                '多才多艺': () => config.maxSkills++,
                '多多益善': () => config.minHs++,
                '左躲右闪': () => {
                    const cardData = generateBaseCard('shan');
                    config.cards.push(cardData)
                },
                '桃李春风': () => {
                    const cardData = generateBaseCard('tao');
                    config.cards.push(cardData)
                },
                '过河拆桥': () => {
                    const cardData = generateBaseCard('guohe');
                    config.cards.push(cardData)
                },
                '对酒当歌': () => {
                    const cardData = generateBaseCard('jiu');
                    config.cards.push(cardData)
                },
            };
            Object.entries(buffActions).forEach(([buffName, action]) => {
                if (buffs.includes(buffName)) action();
            });
            config.coin += baseCoin[star];
            config.maxCoin += baseCoin[star];
            config.maxSkills = skills2.length + baseMaxSkills[star];
            config.adjust += baseAdjust[star];
            config.minHs += baseMinHs[star];
            config.hp += baseHp[star];
            config.maxHp += baseHp[star];
            // 限制最大值
            if (config.hp > 20) config.hp = 20;
            if (config.maxHp > 20) config.maxHp = 20;
            if (config.maxSkills > 15) config.maxSkills = 15;
            body.off();
            event.stopPropagation();
            event.preventDefault();
            return false;
        });
    };
    game.chooseServant = function () {//选择侍灵
        const div = ui.create.div(".taixuhuanjing_chooseServantDiv");
        document.body.appendChild(div);

        const topTitle = ui.create.div('.taixuhuanjing_chooseServantTopTitle', div);
        topTitle.innerHTML = "请选择你的侍灵，挑战幻境";

        const body = ui.create.div(".taixuhuanjing_chooseServantBody", div);
        const iconDiv = ui.create.div('.taixuhuanjing_chooseServantIconDiv', body);

        if (typeof servantData !== 'undefined') {
            servantData.createServantIconList(iconDiv);

            const slDiv = ui.create.div('.taixuhuanjing_chooseSLDiv', body);
            txhj.sldiv = slDiv;
            slDiv.onclick = () => txhj.servant.randomPlayAction();

            const descDiv = ui.create.div('.taixuhuanjing_chooseSLDescDiv', body);
            txhj.descDiv = descDiv;

            txhj.initSLDesc = (ele) => {
                const headDiv = createHeadDiv(ele);
                const bodyDiv = createBodyDiv(ele);
                txhj.resetSkillDesc(ele);

                const btn = ui.create.div('.taixuhuanjing_chooseSLBtn', ele);
                ele.btn = btn;
                const btnText = ui.create.div('.taixuhuanjing_chooseSLBtnText', btn);
                btn.onclick = () => {
                    lib.config.taixuhuanjing.servants[0] = servant.nickName;
                    game.transitionAnimation();
                    if (servantData && servantData.skillDesc && servantData.skillDesc[servant.nickName]) {
                        const buffs = Object.keys(servantData.skillDesc[servant.nickName]);
                        buffs.forEach(buff => lib.config.taixuhuanjing.buff.push(buff));
                    }
                    setTimeout(() => {
                        div.delete();
                        if (lib.config.taixuhuanjing.rank > 1) {
                            if (txhj.servant) txhj.servant.hide();
                            game.chooseEffect();
                        } else {
                            game.consoledesk(_status.choiceCharacter);
                        }
                    }, 1000);
                };
            };

            txhj.resetSkillDesc = (ele) => {
                const div = ele.bodyDiv;
                div.innerHTML = '';
                const data = servantData.skillDesc[servant.nickName];
                if (data) {
                    Object.keys(data).forEach(key => {
                        const temp = ui.create.div(".taixuhuanjing_chooseSLSkillDescItem", div);
                        const name = ui.create.div(".taixuhuanjing_chooseSLSkillDescName", temp);
                        name.innerHTML = data[key].name;
                        const desc = ui.create.div(".taixuhuanjing_chooseSLSkillDescDesc", temp);
                        desc.innerHTML = data[key].desc;
                    });
                }
            };

            txhj.resetDescHead = (ele) => {
                const div = ele.headDiv;
                div.grade.src = `${txhjPack.path}/image/servant/icon/${txhj.servant.grade}.png`;
                div.textName.innerHTML = txhj.servant.textName;
            };

            txhj.updateSLDesc = (ele) => {
                txhj.resetDescHead(ele);
                txhj.resetSkillDesc(ele);
            };

            const createHeadDiv = (ele) => {
                const headDiv = ui.create.div('.taixuhuanjing_chooseSLHeadDiv', ele);
                ele.headDiv = headDiv;

                const grade = new Image(102, 98);
                grade.classList.add('taixuhuanjing_chooseSLHeadGrade');
                grade.src = `${txhjPack.path}/image/servant/icon/${txhj.servant.grade}.png`;
                grade.onerror = () => {
                    alert(`grade${txhj.servant.grade}.png not found`);
                    grade.onerror = null;
                };
                headDiv.appendChild(grade);
                headDiv.grade = grade;

                const textName = document.createElement("span");
                textName.classList.add("taixuhuanjing_chooseSLTextName");
                textName.innerHTML = txhj.servant.textName;
                headDiv.appendChild(textName);
                headDiv.textName = textName;

                return headDiv;
            };

            const createBodyDiv = (ele) => {
                const bodyDiv = ui.create.div('.taixuhuanjing_chooseSLBodyDiv', ele);
                ele.bodyDiv = bodyDiv;
                return bodyDiv;
            };
            if (!txhj.servant) {
                txhj.servant = new Servant("yueling", window.dcdAnim ? false : true);
            }
            const servant = txhj.servant;
            servant.chooseingPlay(slDiv);
            lib.config.taixuhuanjing.servants[0] = servant.nickName;
            txhj.initSLDesc(descDiv);
        }
    };

    game.changeServant = function (mode) {//变换侍灵
        var home = document.querySelector('.taixuhuanjing_Home2');
        if (!home) return;
        if (document.querySelector('.taixuhuanjing_addServantDiv') || document.querySelector('.taixuhuanjing_changeServantDiv')) {
            game.messagePopup('嗨，你好！！')
            return;
        }
        var changeDiv = '';
        if (mode == "add" && lib.config.taixuhuanjing.servants.length < 3) {
            changeDiv = ui.create.div('.taixuhuanjing_addServantDiv', home);
        } else if (mode == "change") {
            changeDiv = ui.create.div('.taixuhuanjing_changeServantDiv', home);
        } else {
            if (mode == "add") game.messagePopup('侍灵已达上限')
            return;
        }
        const str = mode == "add" ? "选择协战侍灵" : "替换侍灵";
        const topTitle = ui.create.div('.taixuhuanjing_changeServantTopTitle', str, changeDiv);
        const iconDiv = ui.create.div('.taixuhuanjing_changeServantIconDiv', changeDiv);
        iconDiv.addEventListener('wheel', function (event) {
            event.preventDefault();
            if (event.deltaY < 0) {
                iconDiv.scrollLeft -= 100;
            } else {
                iconDiv.scrollLeft += 100;
            }
        });
        if (typeof servantData !== 'undefined') {
            servantData.createServantIconList(iconDiv, mode);
            const descDiv = ui.create.div('.taixuhuanjing_changeSLDescDiv', changeDiv);
            txhj.descDiv = descDiv;
            txhj.changeinitSLDesc = (ele) => {
                const headDiv = createHeadDiv(ele, servant);
                const bodyDiv = createBodyDiv(ele);
                txhj.changeresetSkillDesc(ele, servant);
                const btn = ui.create.div('.taixuhuanjing_changeSLBtn', '确定', ele);
                ele.btn = btn;
                btn.onclick = () => {
                    if (mode == 'add') {
                        if (lib.config.taixuhuanjing.servants.includes(lib.config.taixuhuanjing.servant.nickName)) {
                            game.messagePopup('侍灵已存在,请重新选择');
                            return;
                        }
                        if (!lib.config.taixuhuanjing.servant.nickName || lib.config.taixuhuanjing.servant.nickName == null) {
                            game.messagePopup('侍灵未选择,请重新选择');
                            return;
                        }
                    } else if (mode == 'change') {
                        if (lib.config.taixuhuanjing.servants.includes(servant.nickName)) {
                            game.txhj_playAudioCall('off', null, true);
                            changeDiv.delete();
                            return;
                        }
                    }
                    function updateBuffs(oldServantName, newServantName) {
                        const skillDesc = servantData?.skillDesc;
                        if (!skillDesc) return;
                        if (oldServantName && skillDesc[oldServantName]) {
                            Object.keys(skillDesc[oldServantName]).forEach(buff =>
                                lib.config.taixuhuanjing.buff.remove(buff)
                            );
                        }
                        if (newServantName && skillDesc[newServantName]) {
                            Object.keys(skillDesc[newServantName]).forEach(buff =>
                                lib.config.taixuhuanjing.buff.push(buff)
                            );
                        }
                    }
                    if (mode === 'add') {
                        lib.config.taixuhuanjing.servants.push(lib.config.taixuhuanjing.servant.nickName);
                        // txhj.servant.nickName = lib.config.taixuhuanjing.servants[0];
                        updateBuffs(null, lib.config.taixuhuanjing.servant.nickName);
                        home.update(mode);
                    } else if (mode === 'change') {
                        const oldServant = lib.config.taixuhuanjing.servants[0];
                        lib.config.taixuhuanjing.servants[0] = servant.nickName;
                        updateBuffs(oldServant, servant.nickName);
                        home.update();
                    }
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                    game.txhj_playAudioCall('off', null, true);
                    changeDiv.delete();
                };
            };
            txhj.changeresetSkillDesc = (ele) => {
                const div = ele.bodyDiv;
                div.innerHTML = '';
                let data = {};
                if (mode == 'add') {
                    data = servantData.skillDesc[lib.config.taixuhuanjing.servant.nickName];
                } else {
                    data = servantData.skillDesc[servant.nickName];
                }
                if (data) {
                    Object.keys(data).forEach(key => {
                        const temp = ui.create.div(".taixuhuanjing_chooseSLSkillDescItem", div);
                        const name = ui.create.div(".taixuhuanjing_chooseSLSkillDescName", temp);
                        name.innerHTML = data[key].name;
                        const desc = ui.create.div(".taixuhuanjing_chooseSLSkillDescDesc", temp);
                        desc.innerHTML = data[key].desc;
                    });
                }
            };
            txhj.changeresetDescHead = (ele) => {
                const div = ele.headDiv;
                div.grade.src = `${txhjPack.path}/image/servant/icon/${txhj.servant.grade}.png`;
                div.textName.innerHTML = mode == 'add' ? lib.config.taixuhuanjing.servant.textName : txhj.servant.textName;
            };
            txhj.changeupdateSLDesc = (ele) => {
                txhj.changeresetDescHead(ele);
                txhj.changeresetSkillDesc(ele);
            };
            const createHeadDiv = (ele) => {
                const headDiv = ui.create.div('.taixuhuanjing_changeSLHeadDiv', ele);
                ele.headDiv = headDiv;
                const grade = new Image(102, 98);
                grade.classList.add('taixuhuanjing_changeSLHeadGrade');
                grade.src = `${txhjPack.path}/image/servant/icon/${txhj.servant.grade}.png`;
                grade.onerror = () => {
                    alert(`grade${txhj.servant.grade}.png not found`);
                    grade.onerror = null;
                };
                headDiv.appendChild(grade);
                headDiv.grade = grade;
                const textName = document.createElement("span");
                textName.classList.add("taixuhuanjing_changeSLTextName");
                textName.innerHTML = mode == 'add' ? lib.config.taixuhuanjing.servant.textName : txhj.servant.textName;
                headDiv.appendChild(textName);
                headDiv.textName = textName;
                return headDiv;
            };
            const createBodyDiv = (ele) => {
                const bodyDiv = ui.create.div('.taixuhuanjing_changeSLBodyDiv', ele);
                ele.bodyDiv = bodyDiv;
                return bodyDiv;
            };
            const servant = new Servant(lib.config.taixuhuanjing.servants[0], window.dcdAnim ? false : true);
            txhj.servant = servant;
            txhj.changeinitSLDesc(descDiv);
        }
    };
    game.chooseEffect = function (type) {//选择突变
        var dialog = ui.create.div('.taixuhuanjing_chooseEffectDialog');
        document.body.appendChild(dialog);
        var body = ui.create.div('.taixuhuanjing_chooseEffectBody', dialog);
        game.taixuUIupdata(body, true, 2.1);
        var title = ui.create.div('.taixuhuanjing_consoledeskTitle', dialog);
        var titleText = ui.create.div('.taixuhuanjing_consoledeskTitleText', '请选择突变形式', title);
        var box = ui.create.div('.taixuhuanjing_chooseEffectBox', body);
        var title = ui.create.div('.taixuhuanjing_chooseEffectTitle', '选择突变规则', box);
        var title2 = ui.create.div('.taixuhuanjing_chooseEffectTitle2', '选择突变规则', box);
        function func(name) {
            var div = ui.create.div('.taixuhuanjing_chooseEffectDiv');
            var divIcon = ui.create.div('.taixuhuanjing_chooseEffectDivIcon', div);
            divIcon.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_seed_txhj_' + name + '.png');
            var divIcon2 = ui.create.div('.taixuhuanjing_chooseEffectDivIcon2', divIcon);
            var divName = ui.create.div('.taixuhuanjing_chooseEffectDivName', '' + game.effectPack[name].name + '', div);
            var divInfo = ui.create.div('.taixuhuanjing_chooseEffectDivInfo', '' + game.effectPack[name].info + '', div);
            var divInfo2 = ui.create.div('.taixuhuanjing_chooseEffectDivInfo2', '奖励分数', div);
            var divNum = game.effectPack[name].num;
            if (divNum < 1) {
                divNum = Number(divNum * 100).toFixed(1) + '%';
            }
            var divInfo3 = ui.create.div('.taixuhuanjing_chooseEffectDivInfo3', '+' + divNum, div);
            var divButton = ui.create.div('.taixuhuanjing_chooseEffectDivButton', '选择', div);
            divButton.listen(function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                lib.config.taixuhuanjing.effect = name;
                if (game.effectPack[lib.config.taixuhuanjing.effect] && game.effectPack[lib.config.taixuhuanjing.effect].skill.length) {
                    var skills = game.effectPack[lib.config.taixuhuanjing.effect].skill.slice(0);
                    for (var ii = 0; ii < skills.length; ii++) {
                        if (lib.config.taixuhuanjing.useSkills.length < lib.config.taixuhuanjing.maxSkills) {
                            lib.config.taixuhuanjing.useSkills.add(skills[ii]);
                        } else if (!lib.config.taixuhuanjing.skills.includes(skills[ii])) {
                            lib.config.taixuhuanjing.skills.add(skills[ii]);
                        }
                    }
                }
                if (lib.config.taixuhuanjing.effect == 'huanjingcaoge') {
                    var equips = [];
                    for (var i = 0; i < txhjPack.cardPack.length; i++) {
                        if (lib.translate[txhjPack.cardPack[i].cardID] && get.type(txhjPack.cardPack[i].cardID) == 'equip') {
                            var num = get.cardRank(txhjPack.cardPack[i].cardID);
                            if (num <= lib.config.taixuhuanjing.rank) {
                                equips.push(txhjPack.cardPack[i].cardID);
                            }
                        }
                    }
                    var card = {
                        name: equips.randomGet(),
                        suit: ['spade', 'heart', 'club', 'diamond'].randomGet(),
                        number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].randomGet(),
                    }
                    setTimeout(() => {
                        game.messagePopup('获得装备[' + get.translation(card.name) + ']');
                    }, 2000);
                    if (get.subtype(card.name) != 'equip5' && get.subtype(card.name) != 'equip6' && lib.config.taixuhuanjing[get.subtype(card.name)] == null) {
                        lib.config.taixuhuanjing[get.subtype(card.name)] = card;
                    } else {
                        lib.config.taixuhuanjing.equips.push(card);
                    }
                } else if (lib.config.taixuhuanjing.effect == 'lingqiyiman') {
                    lib.config.taixuhuanjing.maxHp += 2;
                    lib.config.taixuhuanjing.hp += 2;
                } else if (lib.config.taixuhuanjing.effect == 'lingqikuijie') {
                    if (lib.config.taixuhuanjing.hp > 1 && lib.config.taixuhuanjing.maxHp > 1) {
                        lib.config.taixuhuanjing.maxHp -= 1;
                        lib.config.taixuhuanjing.hp -= 1;
                    }
                } else if (lib.config.taixuhuanjing.effect == 'chongfenbeizhan') {
                    lib.config.taixuhuanjing.minHs += 2;
                } else if (lib.config.taixuhuanjing.effect == 'cangcuchuji') {
                    lib.config.taixuhuanjing.minHs -= 3;
                }
                if (lib.config.taixuhuanjing.rank > 4) {
                    lib.config.taixuhuanjing.buff.push('buff_txhj_aozhan');
                }
                if (lib.config.taixuhuanjing.rank > 2) {
                    if (lib.config.taixuhuanjing.hp > 1 && lib.config.taixuhuanjing.maxHp > 1) {
                        lib.config.taixuhuanjing.hp--;
                        lib.config.taixuhuanjing.maxHp--;
                    }
                }

                lib.config.taixuhuanjing.buff.push('buff_txhj_bowenqiangzhi');
                // lib.config.taixuhuanjing.buff.push('buff_txhj_tengyunjiawu');
                // lib.config.taixuhuanjing.buff.push('buff_txhj_zhongyongzhidao');

                if (lib.config.taixuhuanjing.rank >= 0) {//测试
                    //  lib.config.taixuhuanjing.buff.push('buff_txhj_dengfenglvren');
                    //  lib.config.taixuhuanjing.buff.push('buff_txhj_wangmeizhike');
                    //  lib.config.taixuhuanjing.buff.push('buff_txhj_pianruojinghong');
                }
                game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                game.transitionAnimation();
                setTimeout(() => {
                    dialog.delete();
                    game.taixuUIupdata(body, false);
                    game.consoledesk(_status.choiceCharacter);
                }, 1000);
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            return div;
        };
        var effects = [];
        for (var i in game.effectPack) {
            if (i == 'pinganwushi') continue;
            if (game.effectPack[i].type == 'effect') {
                effects.add(i);
            }
        }
        var list = effects.randomGets(4);
        while (list.length) {
            box.appendChild(func(list.shift()));
        };
    };
    game.consoledesk = function () {
        ui.arena.hide();
        var home = ui.create.div('.taixuhuanjing_Home2');
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var exclusive;
        for (let i = 0; i < 3; i++) {
            const optional = lib.config.taixuhuanjing.optional[i];
            if (!exclusive && optional && optional != null && (optional.type == 'boss' || optional.type == 'Ultimate') && optional.exclusive) {
                exclusive = optional.exclusive;
            }
        }
        if (exclusive) {
            home.setBackgroundImage('extension/太虚幻境/dlc/' + season + '/chapter_' + chapter + '_' + exclusive + '.png');
        } else {
            home.setBackgroundImage('extension/太虚幻境/dlc/' + season + '/chapter_' + chapter + '.png');
        }
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_HomeBody3', home);
        game.taixuUIupdata(homeBody, true, 1.7);
        var name = _status.choiceCharacter;
        var title = ui.create.div('.taixuhuanjing_consoledeskTitle', home);
        var titleText = ui.create.div('.taixuhuanjing_consoledeskTitleText', '序章', title);
        var coinBody = ui.create.div('.taixuhuanjing_consoledeskCoinBody', homeBody);
        var change = ui.create.div('.taixuhuanjing_consoledeskChangeBody', homeBody);

        change.onclick = function () {
            game.changeServant('change');
        };
        var coinNum = ui.create.div('.taixuhuanjing_consoledeskCoinNum', 'X ' + lib.config.taixuhuanjing.coin, coinBody);
        coinNum.interval = setInterval(function () {
            if (lib.config.taixuhuanjing == undefined) return;
            coinNum.innerHTML = '🞩 ' + lib.config.taixuhuanjing.coin;
        }, 1000);
        var effectIcon = ui.create.div('.taixuhuanjing_consoledeskEffectIcon', homeBody);
        var effectIcon2 = ui.create.div('.taixuhuanjing_consoledeskEffectIcon2', effectIcon);
        effectIcon2.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_seed_txhj_' + lib.config.taixuhuanjing.effect + '.png');
        var str = '';
        var skills = game.effectPack[lib.config.taixuhuanjing.effect].skill.slice(0);
        for (var i = 0; i < skills.length; i++) {
            if (str != "") str += "<p>";
            str += "<br>" + get.translation([skills[i]]) + ":";
            str += lib.translate[skills[i] + '_info'];
        }
        var effectInfo = ui.create.div('.taixuhuanjing_consoledeskEffectInfo', effectIcon);
        effectInfo.innerHTML = "<p style='color: gold;margin: 2%;'>" + game.effectPack[lib.config.taixuhuanjing.effect].name + "</p>" + "<p style='margin: 2%;'>" + game.effectPack[lib.config.taixuhuanjing.effect].info + "</p>" + "<p style='margin: 2%;'>" + str + "</p>";
        effectIcon.onmouseover = function () {
            effectInfo.style.display = 'block';
        };
        effectIcon.onmouseout = function () {
            effectInfo.style.display = 'none';
        };
        var bottom = ui.create.div('.taixuhuanjing_consoledeskBottom', home);
        var playBody = ui.create.div('.taixuhuanjing_consoledeskPlayBody', homeBody);
        playBody.update = function () {
            playBody.innerHTML = '';
            var intro = lib.character[name];
            if (!intro) {
                for (var i in lib.characterPack) {
                    if (lib.characterPack[i][name]) {
                        intro = lib.characterPack[i][name];
                        break;
                    }
                }
            }
            var playComps = {
                bg: (function () {
                    var bg = ui.create.div('.taixuhuanjing_consoledeskPlayBg');
                    bg.setBackgroundImage('extension/太虚幻境/image/style/name2_' + intro[1] + '.png');
                    return bg;
                })(intro[1]),
                imp: (function () {
                    var imp = ui.create.div('.taixuhuanjing_consoledeskPlayImp1');
                    //修改千幻
                    imp.classList.add("qh-not-replace");
                    //修改
                    imp.setBackground(name, 'character');
                    const str = imp.style.backgroundImage;
                    if (!str) return;
                    if (lib.device == 'ios' || lib.device == 'android') {
                        var tmp = str.split('(')[1].split(')')[0];
                        if (tmp.indexOf('"') > -1) {
                            tmp = tmp.split('"')[1].split('"')[0];
                        }
                    } else {
                        var tmp = str.split('("')[1].split('")')[0];
                    }

                    var firstPromise = new Promise(function (resolve, reject) {
                        var reader = new FileReader();
                        var img = new Image();
                        img.src = lib.assetURL + decodeURI(tmp);
                        if (lib.device == 'ios' || lib.device == 'android') {
                            img.src = tmp;
                        }
                        var isAlphaBackground = 0;
                        var canvas = document.createElement('canvas');
                        var context = canvas.getContext('2d');
                        img.onload = function () {
                            var originWidth = this.width;
                            var originHeight = this.height;
                            canvas.width = originWidth;
                            canvas.height = originHeight;
                            context.clearRect(0, 0, originWidth, originHeight);
                            context.drawImage(img, 0, 0);
                            isAlphaBackground = 0;
                            var imageData = context.getImageData(0, 0, 50, 50).data;
                            for (var index = 3; index < 100; index += 4) {
                                if (imageData[index] != 255) {
                                    isAlphaBackground++;
                                    if (isAlphaBackground >= 25) {
                                        resolve();
                                        break;
                                    }
                                }
                            }
                        };
                    });
                    firstPromise.then(function (successMessage) {
                        imp.style.backgroundImage = 'none';
                        var imp2 = ui.create.div('.taixuhuanjing_consoledeskPlayImpX', imp);
                        //适配千幻
                        //   imp2.classList.add("qh-not-replace");
                        //
                        imp2.setBackground(name, 'character');
                    });
                    return imp;
                })(intro[1]),
                namebody: (function (name) {
                    var info = lib.translate[name];
                    var namebody = ui.create.div(".taixuhuanjing_consoledeskPlayName", info);
                    return namebody;
                })(name),
                playHp: (function (hp) {
                    var playHp = ui.create.div('.taixuhuanjing_consoledeskPlayHpBox');
                    var hp = lib.config.taixuhuanjing.hp;
                    var maxHp = lib.config.taixuhuanjing.maxHp;
                    if (hp < 6 && maxHp < 6) {
                        var num = maxHp - hp;
                        while (hp--) {
                            var tmp = ui.create.div(".taixuhuanjing_consoledeskPlayHpICON", playHp);
                            if (lib.config.taixuhuanjing.hp > 2) {
                                tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                            } else if (lib.config.taixuhuanjing.hp > 1) {
                                tmp.setBackgroundImage('extension/太虚幻境/image/style/glass2.png');
                            } else if (lib.config.taixuhuanjing.hp > 0) {
                                tmp.setBackgroundImage('extension/太虚幻境/image/style/glass3.png');
                            }
                        }
                        while (num--) {
                            var tmp = ui.create.div(".taixuhuanjing_consoledeskPlayHpICON", playHp);
                            tmp.setBackgroundImage('extension/太虚幻境/image/style/glass4.png');
                        }
                    } else {
                        var tmp = ui.create.div(".taixuhuanjing_consoledeskPlayHpICON2", playHp);
                        tmp.setBackgroundImage('extension/太虚幻境/image/style/glass1.png');
                        var numbody = ui.create.div(".taixuhuanjing_consoledeskPlayHpNum", hp + '', playHp);
                        numbody.innerHTML = hp + '<br>/<br>' + maxHp;
                    }
                    return playHp;
                })(intro[2]),
                playType: (function () {
                    var playType = ui.create.div('.taixuhuanjing_lookEventHomePlayType2');
                    playType.setBackgroundImage('extension/太虚幻境/image/style/identity_gameme.png');
                    return playType;
                })(),
            };
            for (var i in playComps) {
                playBody.appendChild(playComps[i]);
            }
        };
        playBody.oncontextmenu = function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            game.pause();
            ui.click.charactercard(name, null, null, true, this);
            e.stopPropagation();
            e.preventDefault();
            return false;
        };
        var skillBox = ui.create.div('.taixuhuanjing_consoledeskSkillBox', homeBody);
        var skillBody = ui.create.div('.taixuhuanjing_consoledeskSkillBody', skillBox);
        lib.setScroll(skillBody);
        skillBody.Update = function () {
            skillBody.innerHTML = '';
            var skills = lib.config.taixuhuanjing.skills.slice(0);
            var max = lib.config.taixuhuanjing.maxSkills;
            var useSkills = lib.config.taixuhuanjing.useSkills.slice(0);
            useSkills.reverse();/*倒序排列*/
            function funcSkill() {
                var div = ui.create.div('.taixuhuanjing_consoledeskSkillDiv');
                if (useSkills.length && (useSkills.length - 1) == max) {
                    var skill = useSkills.shift();
                    div.setBackgroundImage('extension/太虚幻境/image/icon/icon_skill_true.png');
                    var skillName = get.translation(skill);
                    var divText2 = ui.create.div('.taixuhuanjing_consoledeskSkillDivText2', '' + skillName + '', div);
                    var divText3 = ui.create.div('.taixuhuanjing_consoledeskSkillDivText3', '' + skillName + '', div);

                    var skillInfo = lib.translate[skill + '_info'];
                    var desc = ui.create.div('.taixuhuanjing_skillInfoDesc');
                    document.body.appendChild(desc);
                    desc.innerHTML = "<p style='color: gold;margin: 2%;'>" + skillName + "</p>" + "<p style='margin: 2%;'>" + skillInfo + "</p>";
                } else {
                    var divText = ui.create.div('.taixuhuanjing_consoledeskSkillDivText1', '技能槽', div);
                }
                div.onclick = function () {
                    game.txhj_playAudioCall('raw_equip', null, true);
                    game.lookSkill(home);
                }
                div.addEventListener("click", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
                div.onmouseover = function (e) {
                    if (!skill || !desc) return;
                    desc.style.display = "block";
                };
                div.onmouseout = function () {
                    if (!skill || !desc) return;
                    desc.style.display = "none";
                };

                return div;
            };
            while (max--) {
                skillBody.appendChild(funcSkill());
            };
        };

        var servantBox = ui.create.div('.taixuhuanjing_consoledeskServantBox', homeBody);
        servantBox.Update = function (mode) {
            mode = mode || undefined;
            if (mode && mode == 'add') {
                return;
            }
            servantBox.innerHTML = '';
            var existingBox = document.querySelector('.taixuhuanjing_consoledeskServantDiv');
            if (existingBox) {
                existingBox.parentNode.removeChild(servantDiv);
            }
            var servantDiv = ui.create.div('.taixuhuanjing_consoledeskServantDiv', servantBox);
            var servantName = ui.create.div('.taixuhuanjing_consoledeskServantName', '侍灵', servantBox);
            servantDiv.onclick = function () {
                txhj.servant.randomPlayAction();
            }
            if (!txhj.servant) {
                txhj.servant = new Servant(lib.config.taixuhuanjing.servants[0], window.dcdAnim ? false : true);
            }
            servantName.innerHTML = txhj.servant.textName;
            txhj.servant.consoledeskPlay(servantDiv);
        };

        var attributeBox = ui.create.div('.taixuhuanjing_consoledeskAttributeBox', homeBody);
        attributeBox.update = function () {
            attributeBox.innerHTML = '';
            var attributeComps = {
                attributeBody1: (function () {
                    var attributeBody1 = ui.create.div('.taixuhuanjing_consoledeskAttributeBody1');
                    function funcAttribute(text) {
                        var div = ui.create.div('.taixuhuanjing_consoledeskAttributeBody1Div');
                        var divText = ui.create.div('.taixuhuanjing_consoledeskAttributeBody1DivText', div);
                        var divText2 = ui.create.div('.taixuhuanjing_consoledeskAttributeBody1DivText2', div);
                        var str1 = '<span style="color:#916843;">' + text + ': </span>';
                        var str2 = '';
                        if (text == '初始手牌数') {
                            str2 = lib.config.taixuhuanjing.minHs;
                        } else if (text == '手牌上限') {
                            str2 = lib.config.taixuhuanjing.hp + lib.config.taixuhuanjing.maxHs;
                        } else if (text == '调度次数') {
                            str2 = lib.config.taixuhuanjing.adjust;
                        } else if (text == '造型加成') {
                            str2 = '0%';
                        }
                        divText.innerHTML = str1;
                        divText2.innerHTML = str2;

                        return div;
                    };
                    var list = ['初始手牌数', '手牌上限', '调度次数', '造型加成'];
                    while (list.length) {
                        attributeBody1.appendChild(funcAttribute(list.shift()));
                    }
                    return attributeBody1;
                })(),
                attributeBody2: (function () {
                    var attributeBody2 = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2');
                    lib.setScroll(attributeBody2);
                    attributeBody2.onmousewheel = function (evt) {
                        var node = this;
                        var num = 20;
                        var speed = 20;
                        clearInterval(node.interval);
                        evt.preventDefault();
                        if (evt.detail > 0 || evt.wheelDelta < 0) {
                            node.interval = setInterval(function () {
                                if (num-- && Math.abs(node.scrollLeft + node.clientWidth - node.scrollWidth) > 0) {
                                    node.scrollLeft += speed;
                                }
                                else {
                                    clearInterval(node.interval);
                                }
                            }, 16);
                        }
                        else {
                            node.interval = setInterval(function () {
                                if (num-- && node.scrollLeft > 0) {
                                    node.scrollLeft -= speed;
                                }
                                else {
                                    clearInterval(node.interval);
                                }
                            }, 16);
                        }
                    };
                    function funcAttribute(card) {
                        var div = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Div');
                        if (lib.config.taixuhuanjing.cards.length > 5) {
                            div.style.margin = '0% -35% 0% 0%';
                        } else if (lib.config.taixuhuanjing.cards.length > 2) {
                            div.style.margin = '0% -30% 0% 0%';
                        }
                        var card2 = game.createCard(card);
                        card2.style.width = '95%';
                        card2.style.height = '95%';
                        card2.style.zIndex = 1;
                        card2.style.bottom = '2%';
                        card2.querySelector('.image').style.backgroundPosition = '65% 0';
                        card2.style["transform-origin"] = "center center";
                        div.appendChild(card2);
                        var divImp = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Imp', div);
                        var divText = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Text', divImp);
                        var cardnum = card.number || '';
                        if ([1, 11, 12, 13].includes(cardnum)) {
                            cardnum = { '1': 'A', '11': 'J', '12': 'Q', '13': 'K' }[cardnum]
                        }
                        //divText.innerHTML = cardnum + '<br>' + lib.translate[card.suit];
                        if (card.suit == 'heart' || card.suit == 'diamond') {
                            divText.style.color = 'rgb(255,0,0)';
                        }
                        var cardImp = function (card) {
                            var src = lib.card[card.name].image;
                            if (src) {
                                if (src.indexOf('ext:') == 0) {
                                    src = src.replace(/ext:/, 'extension/');
                                }
                                divImp.setBackgroundImage(src);
                            } else {
                                var img = new Image();
                                img.src = lib.assetURL + 'image/card/' + card.name + '.png';
                                img.onload = function () {
                                    divImp.setBackgroundImage('image/card/' + card.name + '.png');
                                }
                                img.onerror = function () {
                                    divImp.setBackgroundImage('image/card/' + card.name + '.png')
                                    if (card.name == 'yuheng_plus' || card.name == 'yuheng_pro') {
                                        divImp2.setBackgroundImage('image/card/yuheng.png');
                                    }
                                }
                            }
                        };
                        if (lib.config['extension_' + '十周年UI' + '_enable']) {
                            var img = new Image();
                            img.src = lib.assetURL + 'extension/十周年UI/image/card/' + card.name + '.webp';
                            img.onload = function () {
                                divImp.setBackgroundImage('extension/十周年UI/image/card/' + card.name + '.webp')
                            }
                            img.onerror = function () {
                                //cardImp(card);
                            }
                        } else {
                            //cardImp(card);
                        }
                        return div;
                    };
                    var cards = lib.config.taixuhuanjing.cards.slice(0);
                    var list = [].concat(cards);
                    while (list.length) {
                        attributeBody2.appendChild(funcAttribute(list.shift()));
                    };
                    if (lib.config.taixuhuanjing.cards.length > 7) {
                        attributeBody2.style.boxShadow = '0 0 5px 3px rgba(80,80,80,0.65)';
                        var shadow = ui.create.div('.taixuhuanjing_consoledeskAttributeBody2Shadow', attributeBox);
                    }
                    return attributeBody2;
                })(),
                attributeBody3: (function () {
                    var attributeBody3 = ui.create.div('.taixuhuanjing_consoledeskAttributeBody3');
                    function funcAttribute(text) {
                        var div = ui.create.div('.taixuhuanjing_consoledeskAttributeBody3Div');
                        var str = text;
                        var str2 = '';
                        var equipInfo1;
                        var equipInfo2;
                        if (text == '武器栏' && lib.config.taixuhuanjing.equip1 != null) {
                            if (lib.config.taixuhuanjing.equip1.suit == 'heart' || lib.config.taixuhuanjing.equip1.suit == 'diamond') {
                                str = '<span style=\"color: red\">' + lib.translate[lib.config.taixuhuanjing.equip1.suit] + '</span>';
                            } else {
                                str = '<span style=\"color: #bffff9\">' + lib.translate[lib.config.taixuhuanjing.equip1.suit] + '</span>';
                            }
                            if (lib.config.taixuhuanjing.buff.includes('buff_txhj_majundegaizao')) {
                                if (lib.config.taixuhuanjing.equip1.name == 'zhuge') {
                                    lib.config.taixuhuanjing.equip1.name = 'rewrite_zhuge';
                                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                                }
                            }
                            str += lib.config.taixuhuanjing.equip1.number + get.translation(lib.config.taixuhuanjing.equip1.name);
                            equipInfo1 = get.translation(lib.config.taixuhuanjing.equip1.name);
                            equipInfo2 = lib.translate[lib.config.taixuhuanjing.equip1.name + '_info'];
                        } else if (text == '防具栏' && lib.config.taixuhuanjing.equip2 != null) {
                            if (lib.config.taixuhuanjing.equip2.suit == 'heart' || lib.config.taixuhuanjing.equip2.suit == 'diamond') {
                                str = '<span style=\"color: red\">' + lib.translate[lib.config.taixuhuanjing.equip2.suit] + '</span>';
                            } else {
                                str = '<span style=\"color: #bffff9\">' + lib.translate[lib.config.taixuhuanjing.equip2.suit] + '</span>';
                            }
                            if (lib.config.taixuhuanjing.buff.includes('buff_txhj_majundegaizao')) {
                                if (lib.config.taixuhuanjing.equip2.name == 'lanyinjia') {
                                    lib.config.taixuhuanjing.equip2.name = 'rewrite_lanyinjia';
                                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                                } else if (lib.config.taixuhuanjing.equip2.name == 'tengjia') {
                                    lib.config.taixuhuanjing.equip2.name = 'rewrite_tengjia';
                                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                                } else if (lib.config.taixuhuanjing.equip2.name == 'baiyin') {
                                    lib.config.taixuhuanjing.equip2.name = 'rewrite_baiyin';
                                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                                } else if (lib.config.taixuhuanjing.equip2.name == 'bagua') {
                                    lib.config.taixuhuanjing.equip2.name = 'rewrite_bagua';
                                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                                } else if (lib.config.taixuhuanjing.equip2.name == 'renwang') {
                                    lib.config.taixuhuanjing.equip2.name = 'rewrite_renwang';
                                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                                }
                            }
                            str += lib.config.taixuhuanjing.equip2.number + get.translation(lib.config.taixuhuanjing.equip2.name);
                            equipInfo1 = get.translation(lib.config.taixuhuanjing.equip2.name);
                            equipInfo2 = lib.translate[lib.config.taixuhuanjing.equip2.name + '_info'];
                        } else if (text == '宝物栏1' && lib.config.taixuhuanjing.equip3 != null) {
                            if (lib.config.taixuhuanjing.equip3.suit == 'heart' || lib.config.taixuhuanjing.equip3.suit == 'diamond') {
                                str = '<span style=\"color: red\">' + lib.translate[lib.config.taixuhuanjing.equip3.suit] + '</span>';
                            } else {
                                str = '<span style=\"color: #bffff9\">' + lib.translate[lib.config.taixuhuanjing.equip3.suit] + '</span>';
                            }
                            str += lib.config.taixuhuanjing.equip3.number + get.translation(lib.config.taixuhuanjing.equip3.name);
                            equipInfo1 = get.translation(lib.config.taixuhuanjing.equip3.name);
                            equipInfo2 = lib.translate[lib.config.taixuhuanjing.equip3.name + '_info'];
                        } else if (text == '宝物栏2' && lib.config.taixuhuanjing.equip4 != null) {
                            if (lib.config.taixuhuanjing.equip4.suit == 'heart' || lib.config.taixuhuanjing.equip4.suit == 'diamond') {
                                str = '<span style=\"color: red\">' + lib.translate[lib.config.taixuhuanjing.equip4.suit] + '</span>';
                            } else {
                                str = '<span style=\"color: #bffff9\">' + lib.translate[lib.config.taixuhuanjing.equip4.suit] + '</span>';
                            }
                            str += lib.config.taixuhuanjing.equip4.number + get.translation(lib.config.taixuhuanjing.equip4.name);
                            equipInfo1 = get.translation(lib.config.taixuhuanjing.equip4.name);
                            equipInfo2 = lib.translate[lib.config.taixuhuanjing.equip4.name + '_info'];
                        }
                        var desc = null;
                        if (equipInfo1 && equipInfo2) {
                            desc = ui.create.div('.taixuhuanjing_equipInfoDesc');
                            document.body.appendChild(desc);
                            desc.innerHTML = "<p style='color: gold;margin: 2%;'>" + equipInfo1 + "</p>" + "<p style='margin: 2%;'>" + "<br>" + equipInfo2 + "</p>";
                        }
                        div.addEventListener("click", function (e) {
                            game.txhj_playAudioCall('raw_equip', null, true);
                            game.lookEquip(home);
                            if (desc) {
                                desc.style.display = "none";
                            }
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                        });
                        div.onmouseover = function () {
                            if (!desc) return;
                            desc.style.display = "block";
                        };
                        let hideTimeout;
                        div.addEventListener('mouseleave', function () {
                            if (!desc) return;
                            hideTimeout = setTimeout(() => {
                                desc.style.display = "none";
                            }, 200);
                        });
                        div.innerHTML = '' + str + '';
                        return div;
                    };
                    var list = ['武器栏', '防具栏', '宝物栏1', '宝物栏2'];
                    while (list.length) {
                        attributeBody3.appendChild(funcAttribute(list.shift()));
                    };
                    return attributeBody3;
                })(),
                attributeBody4: (function () {
                    var attributeBody4 = ui.create.div('.taixuhuanjing_consoledeskAttributeBody4');
                    attributeBody4.innerHTML = '等级:' + lib.config.taixuhuanjing.level;
                    return attributeBody4;
                })(),
                attributeBody5: (function () {
                    var attributeBody5 = ui.create.div('.taixuhuanjing_consoledeskAttributeBody5');
                    var attributeBody5Imp = ui.create.div('.taixuhuanjing_consoledeskAttributeBody5Imp', attributeBody5);
                    var num = lib.config.taixuhuanjing.exp;
                    var max = lib.config.taixuhuanjing.maxExp;
                    var winrate = Math.round(num / max * 10000) / 100;
                    if (winrate < 1) winrate = 1;
                    attributeBody5Imp.style.width = "" + winrate + "%";
                    var attributeBody5Div = ui.create.div('.taixuhuanjing_consoledeskAttributeBody5Div', attributeBody5);
                    attributeBody5Div.innerHTML = num + '/' + max;
                    return attributeBody5;
                })(),
            }
            for (var i in attributeComps) {
                attributeBox.appendChild(attributeComps[i]);
            }
        };
        var buffBox = ui.create.div('.taixuhuanjing_consoledeskbuffBox', homeBody);
        buffBox.Update = function () {
            buffBox.innerHTML = '';
            function funcbuff(id) {
                const buff = buffPack[id];
                if (!buff) return;
                var div = ui.create.div('#taixuhuanjing_consoledeskBuffDiv');
                game.promises.checkFile('extension/太虚幻境/image/buff/' + id + '.png').then(function (result) {
                    if (result === 1) {
                        div.setBackgroundImage('extension/太虚幻境/image/buff/' + id + '.png');
                    } else {
                        console.log('未找到图片：' + 'extension/太虚幻境/image/buff/' + id + '.png');
                        div.setBackgroundImage('extension/太虚幻境/image/buff/moren.png');
                    }
                });
                //div.setBackgroundImage('extension/太虚幻境/image/buff/' + id + '.png');
                var infobody = ui.create.div('.taixuhuanjing_consoledeskbuffDivInfobody', div);

                var desc = document.createElement("div");
                desc.classList.add("SLBuffDesc");
                desc.innerHTML = "<p style='color: gold;margin: 2%;'>" + buff.name + "</p>" +
                    "<p style='margin: 2%;'>" + buff.info + "</p>";
                desc.style.display = "none";
                div.desc = desc;
                document.body.appendChild(desc);
                div.addEventListener("click", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
                div.onmouseover = function () {
                    div.style.zIndex = '10';
                    this.desc.style.display = "block";
                };
                div.onmouseout = function () {
                    div.style.zIndex = '1';
                    this.desc.style.display = "none";
                };
                return div;
            };
            /* var descobj = servantData.skillDesc[lib.config.taixuhuanjing.servants];
             var objkeys = Object.keys(descobj);
             for (const objkey of objkeys) {
                 if (!lib.config.taixuhuanjing.buff.includes(objkey)) {
                     lib.config.taixuhuanjing.buff.push(objkey);
                 }
             } */
            for (let i of lib.config.taixuhuanjing.servants) {
                var descobj = servantData.skillDesc[i];
                if (descobj !== undefined && descobj !== null && typeof descobj === 'object') {
                    var objkeys = Object.keys(descobj);
                    if (lib.config.taixuhuanjing.buff === undefined || lib.config.taixuhuanjing.buff === null || !Array.isArray(lib.config.taixuhuanjing.buff)) {
                        lib.config.taixuhuanjing.buff = [];
                    }
                    for (const objkey of objkeys) {
                        if (!lib.config.taixuhuanjing.buff.includes(objkey)) {
                            lib.config.taixuhuanjing.buff.push(objkey);
                        }
                    }
                }
            }
            var list1 = lib.config.taixuhuanjing.buff.slice(0);
            var list2 = [];
            while (list2.length < 8 && list1.length) {
                list2.push(list1.shift());
                if (list2.length >= 8 || !list1.length) {
                    var buffbody = ui.create.div('.taixuhuanjing_consoledeskbuffBody', buffBox);
                    while (list2.length) {
                        const buffNode = funcbuff(list2.shift());
                        if (buffNode instanceof Node) {
                            buffbody.appendChild(buffNode);
                        }
                    };
                }
            }
        };

        var eventBox = ui.create.div('.taixuhuanjing_consoledeskEventBox', homeBody);
        var eventTop = ui.create.div('.taixuhuanjing_consoledeskEventTop', homeBody);
        var eventTopImp = ui.create.div('.taixuhuanjing_consoledeskEventTopImp', eventTop);
        var eventTopBoss = ui.create.div('.taixuhuanjing_consoledeskEventTopBoss', eventTop);
        var eventTopStore = ui.create.div('.taixuhuanjing_consoledeskEventTopStore', eventTop);
        eventTopStore.style.display = 'none';
        var rankBody = ui.create.div('.taixuhuanjing_consoledeskRunkBody', homeBody);
        var rankText = ui.create.div('.taixuhuanjing_consoledeskRunkText', rankBody);
        var rankTextInfo = ui.create.div('.taixuhuanjing_consoledeskRunkTextInfo', rankBody);
        rankBody.onmouseover = function (e) {
            rankTextInfo.style.display = 'block';
            if (lib.config.taixuhuanjing.rank == 1) {
                rankTextInfo.innerHTML = "<p style='color: #fff;margin: 2%;'>" + '每超出敌人1级，其额外+1体力及体力上限' + "</p>";
            } else if (lib.config.taixuhuanjing.rank == 2) {
                rankTextInfo.innerHTML = "<p style='color: #fff;margin: 2%;'>" + '敌人额外+1体力及体力上限；每超出敌人1级，其额外+2体力及体力上限' + "</p>";
            } else if (lib.config.taixuhuanjing.rank == 3) {
                rankTextInfo.innerHTML = "<p style='color: #fff;margin: 2%;'>" + '敌人额外+1体力及体力上限并拥有技能英姿与马术，每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1' + "</p>";
            } else if (lib.config.taixuhuanjing.rank == 4) {
                rankTextInfo.innerHTML = "<p style='color: #fff;margin: 2%;'>" + '敌人额外+1体力及体力上限并拥有技能英姿与马术，装备一件随机武器；每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1' + "</p>";
            } else if (lib.config.taixuhuanjing.rank == 5) {
                rankTextInfo.innerHTML = "<p style='color: #fff;margin: 2%;'>" + '敌人额外+1体力及体力上限并拥有技能英姿与马术，装备一件随机武器；每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1并获得鏖战祝福' + "</p>";
            } else if (lib.config.taixuhuanjing.rank == 6) {
                rankTextInfo.innerHTML = "<p style='color: #fff;margin: 2%;'>" + '敌人额外+1体力及体力上限并拥有技能英姿与马术，装备一件随机武器；每超出敌人1级，其额外+2体力及体力上限；你的体力上限-1并获得鏖战祝福' + "</p>";
            }
        };
        rankBody.onmouseout = function () {
            rankTextInfo.style.display = 'none';
        };

        eventBox.Update = function () {
            eventBox.innerHTML = '';
            var optionalCount = 0;
            function loadOptionalEvents() {
                optionalCount = 0;
                for (let i = 0; i < 3; i++) {
                    if (lib.config.taixuhuanjing.optional[i] == null && lib.config.taixuhuanjing.procedure.length > 0) {
                        optionalCount++;
                        lib.config.taixuhuanjing.optional[i] = lib.config.taixuhuanjing.procedure.shift();
                        lib.config.taixuhuanjing.eventMin++;

                        const event = lib.config.taixuhuanjing.optional[i];
                        if (/^exam[1-4]$/.test(event.type)) {
                            if (!lib.config.taixuhuanjing.optionalExam.includes(event.id)) {
                                lib.config.taixuhuanjing.optionalExam.push(event.id);
                            }
                        }
                    }
                }
            }
            function addServantEvent(chapter) {
                const txhj_changeServant = {
                    id: 'txhj_changeServant',
                    name: '侍灵协战',
                    type: 'gain',
                    info: '侍灵乐园正在前方',
                    text: '你可以选择一项侍灵协战增益',
                    rank: 0,
                    level: 1,
                    unique: false,
                    change: true,
                    priority: 1,
                    buttons: [
                        { result: true, name: '选择一个侍灵协助战斗', effect: [{ name: 'addServant' }], random: 1, },
                        { result: "changeServant", name: '获得100金币', effect: [{ name: 'coin', number: 100 }], random: 1, },
                    ],
                    ext: 'txhj_changeServant',
                };
                const isChapter = [0, 2].includes(chapter);
                if (lib.config.taixuhuanjing.servants.length >= 3 || !isChapter || lib.config.taixuhuanjing.changeServant.includes(chapter)) return;
                lib.config.taixuhuanjing.changeServant.add(chapter);
                lib.config.taixuhuanjing.optional.unshift(txhj_changeServant);
                game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
            }
            addServantEvent(chapter)
            var update = function () {
                var rank = lib.config.taixuhuanjing.rank;
                var season = lib.config.taixuhuanjing.season;
                var chapter = lib.config.taixuhuanjing.chapter;
                if (!lib.config.taixuhuanjing.procedure) {
                    lib.config.taixuhuanjing.procedure = [];
                }
                lib.config.taixuhuanjing.eventMin = 0 + lib.config.taixuhuanjing.optionalExam.length;
                lib.config.taixuhuanjing.eventMax = game.seasonPack[season][chapter].procedure.length;
                var procedure = game.seasonPack[season][chapter].procedure.slice(0);
                while (procedure.length > 0) {
                    var type = procedure.shift();
                    var event;
                    if (['side', 'main', 'micheng', 'dungeons', 'boss', 'Ultimate'].includes(type)) {
                        event = game.randomBattle(type);
                    } else {
                        event = game.randomEvent(type);
                    }
                    if (event) {
                        lib.config.taixuhuanjing.procedure.push(event);
                    }
                }
                loadOptionalEvents();
                updateUI();
                game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
            };
            var update2 = function () {
                loadOptionalEvents();
                updateUI();
                if (optionalCount > 0) {
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                }
            };
            if (lib.config.taixuhuanjing.procedure != null) {
                update2();
            } else {
                update();
            }

            function updateUI() {
                var rank = lib.config.taixuhuanjing.rank;
                var season = lib.config.taixuhuanjing.season;
                var chapter = lib.config.taixuhuanjing.chapter;
                let str2 = '普通难度';
                switch (rank) {
                    case 2: str2 = '困难难度'; break;
                    case 3: str2 = '噩梦难度'; break;
                    case 4: str2 = '炼狱难度'; break;
                    case 5: str2 = '血战难度'; break;
                    case 6: str2 = '末日难度'; break;
                }
                let str = game.seasonPack[season][chapter].name + ' ' + game.seasonPack[season][chapter].info + ' ';
                rankText.innerHTML = str2;
                titleText.innerHTML = str + lib.config.taixuhuanjing.eventMin + '/' + lib.config.taixuhuanjing.eventMax;
                let num = lib.config.taixuhuanjing.eventMin;
                let max = lib.config.taixuhuanjing.eventMax;
                let winrate = Math.round(num / max * 10000) / 100;
                if (winrate < 1) winrate = 1;
                if (winrate > 100) winrate = 100;
                eventTopImp.style.width = winrate + "%";
                let store1 = 0, store2 = false;
                let procedure = game.seasonPack[season][chapter].procedure.slice(0);
                if (procedure.includes('store')) {
                    eventTopStore.style.display = 'block';
                    while (procedure.length) {
                        let type = procedure.shift();
                        if (!store2 && type !== 'store') {
                            store1++;
                        } else {
                            store2 = true;
                        }
                    }
                    let winrate2 = Math.round(store1 / max * 10000) / 100;
                    eventTopStore.style.left = winrate2 + "%";
                }
            }

            function funcBoss(node, side) {
                const div = ui.create.div('.taixuhuanjing_consoledeskEventDiv');
                const eventNode = {
                    id: node.id,
                    season: lib.config.taixuhuanjing.season,
                    chapter: lib.config.taixuhuanjing.chapter,
                };

                const divComps = {
                    divImp: ui.create.div('.taixuhuanjing_consoledeskEventDivImp'),
                    divRound: ui.create.div('.taixuhuanjing_consoledeskEventDivRound'),
                    divName: ui.create.div('.taixuhuanjing_consoledeskEventDivName', node.name),

                    divType: (function () {
                        var div = ui.create.div('.taixuhuanjing_consoledeskEventDivType', '事件');
                        div.style.color = '#9b8657';
                        return div;
                    })(),
                    divLine: ui.create.div('.taixuhuanjing_consoledeskEventDivLine'),
                    divInfo: ui.create.div('.taixuhuanjing_consoledeskEventDivInfo', node.info + ''),
                    divButton: ui.create.div('.taixuhuanjing_consoledeskEventDivButton', '查看')
                };

                divComps.divImp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_main_' + node.ext + '.png');

                divComps.divButton.addEventListener("click", function () {
                    game.txhj_playAudioCall('WinButton', null, true);
                    game.lookBoss(eventNode, home);
                    event.stopPropagation();
                    return false;
                });

                for (let comp in divComps) {
                    div.appendChild(divComps[comp]);
                }

                return div;
            }

            function funcEvent(node, side) {
                const div = ui.create.div('.taixuhuanjing_consoledeskEventDiv3');

                div.update = function (node) {
                    div.innerHTML = '';
                    div.style.opacity = '1';

                    const eventNode = {
                        id: node.id,
                        seat: node.seat,
                        name: node.name,
                        type: node.type,
                        info: node.info,
                        text: node.text,
                        level: node.level,
                        change: node.change || false,
                        season: lib.config.taixuhuanjing.season,
                        chapter: lib.config.taixuhuanjing.chapter,
                        buttons: node.buttons,
                        ext: node.ext,
                    };

                    const divComps = {
                        divImp: (function () {
                            var divImp = ui.create.div('.taixuhuanjing_consoledeskEventDivImp');
                            divImp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_main_' + node.ext + '.png');
                            divImp.classList.add("qh-not-replace");
                            return divImp;
                        })(),
                        divRound: ui.create.div('.taixuhuanjing_consoledeskEventDivRound'),
                        divName: (function () {
                            var div = ui.create.div('.taixuhuanjing_consoledeskEventDivName', node.name);
                            div.style.color = '#5a3327';
                            return div;
                        })(),
                        divType: ui.create.div('.taixuhuanjing_consoledeskEventDivType', '事件'),
                        divLine: ui.create.div('.taixuhuanjing_consoledeskEventDivLine'),
                        divInfo: (function () {
                            var div = ui.create.div('.taixuhuanjing_consoledeskEventDivInfo', node.info + '');
                            div.style.color = '##363636';
                            return div;
                        })(),
                        divOff: ui.create.div('.taixuhuanjing_consoledeskEventDivOff'),
                        divButton: ui.create.div('.taixuhuanjing_consoledeskEventDivButton', '查看'),
                    };

                    if (['side', 'main', 'micheng', 'dungeons', 'choose', 'boss', 'Ultimate'].includes(node.type)) {
                        divComps.divOff.style.pointerEvents = 'none';
                        divComps.divOff.style.display = 'none';
                    }

                    divComps.divOff.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('off', null, true);
                        div.number = 0;
                        if (get.eventState(eventNode) != true) {
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id === node.id && optional.seat === node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                    div.number = i;
                                }
                            }
                            lib.config.taixuhuanjing.skip.push(eventNode);
                            lib.config.taixuhuanjing.events.push(eventNode);
                            game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        };
                        div.innerHTML = '';
                        div.style.backgroundImage = 'none';
                        if (lib.config.taixuhuanjing.procedure != null) {
                            update2();
                        } else {
                            update();
                        }
                        setTimeout(() => {
                            const nextOpt = lib.config.taixuhuanjing.optional[div.number];
                            if (nextOpt && ['boss', 'Ultimate'].includes(nextOpt.type)) {
                                eventBox.removeChild(div);
                                eventBox.appendChild(funcBoss(nextOpt, div.number));
                            } else if (nextOpt) {
                                div.update(nextOpt);
                                div.setBackgroundImage('extension/太虚幻境/image/icon/icon_frame7.png');
                            } else {
                                eventBox.removeChild(div);
                            }
                        }, 500);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });

                    divComps.divButton.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (node.type === 'gain') {
                            game.lookEvent(eventNode, home);
                        } else if (['side', 'micheng', 'dungeons', 'main'].includes(node.type)) {
                            game.lookBoss(eventNode, home);
                        } else if (node.type === 'store') {
                            game.lookStore(eventNode, home);
                        } else if (/^exam[1-4]$/.test(node.type)) {
                            game.lookAnswer(eventNode, home);
                        } else if (node.type === 'trade') {
                            game.lookTrade(eventNode, home);
                        } else if (node.type === 'choose') {
                            game.lookChoose(eventNode, home);
                        }
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });

                    for (let comp in divComps) {
                        div.appendChild(divComps[comp]);
                    }

                    if (node.change === true) {
                        const changeButton = ui.create.div('.taixuhuanjing_consoledeskEventDivChangeButton', div);
                    }

                    if (/^exam[1-4]$/.test(node.type) && lib.config.taixuhuanjingNode?.forbidden && !lib.config.taixuhuanjingNode.forbidden.includes(node.id)) {
                        lib.config.taixuhuanjingNode.forbidden.push(node.id);
                        if (lib.config.taixuhuanjingNode.forbidden.length >= 50) {
                            lib.config.taixuhuanjingNode.forbidden.shift();
                        }
                        game.saveConfig('taixuhuanjingNode', lib.config.taixuhuanjingNode);
                    }

                    return div;
                };

                div.update(node);
                return div;
            }
            for (let i = 0; i < 3; i++) {
                if (lib.config.taixuhuanjing.optional[i] != null) {
                    const node = lib.config.taixuhuanjing.optional[i];
                    if (['boss', 'Ultimate'].includes(node.type)) {
                        eventBox.appendChild(funcBoss(node, i));
                        if (!exclusive && node.exclusive) {
                            home.setBackgroundImage('extension/太虚幻境/dlc/' + lib.config.taixuhuanjing.season + '/chapter_' + lib.config.taixuhuanjing.chapter + '_' + node.exclusive + '.png');
                        }
                    } else {
                        eventBox.appendChild(funcEvent(node, i));
                    }
                }
            }
        };
        home.off = function () {
            game.txhj_playAudioCall('off', null, true);
            clearInterval(coinNum.interval);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            if (_status.gameStart != undefined) {
                _status.gameStart = undefined;
                game.resume();
            } else {
                game.chooseCharacterTaiXuHuanJing();
                game.resume();
            }
        };
        home.update = function (mode) {
            mode = mode || undefined;
            for (let i = 1; i <= 4; i++) {
                const eqKey = 'equip' + i;
                const eqional = lib.config.taixuhuanjing[eqKey];
                if (eqional && eqional != null) {
                    game.equipBuffUpdate(eqional, true);
                }
            }
            if (lib.config.taixuhuanjing.useSkills.length > lib.config.taixuhuanjing.maxSkills || lib.config.taixuhuanjing.skills.length) {
                game.lookSkill(home, true);
            };
            if (lib.config.taixuhuanjing.equips.length) {
                game.lookEquip(home, true);
            }
            eventBox.Update();
            playBody.update();
            skillBody.Update();
            buffBox.Update();
            attributeBox.update();
            if (mode && mode == 'add') {
                servantBox.Update(mode);
            } else {
                servantBox.Update();
            }

        };
        home.update()
        var homeButton = ui.create.div('.taixuhuanjing_consoledeskHomeButton', home);
        homeButton.onclick = function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            homeButton.innerHTML = '';
            var homeButtonBox = ui.create.div('.taixuhuanjing_consoledeskHomeButtonBox', homeButton);
            homeButtonBox.onclick = function (e) {
                game.txhj_playAudioCall('off', null, true);
                homeButton.innerHTML = '';
                e.stopPropagation();
                e.preventDefault();
                return false;
            };
            var homeButtonMenu = ui.create.div('.taixuhuanjing_consoledeskHomeButtonMenu', homeButtonBox);
            homeButtonMenu.onclick = function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                homeButton.innerHTML = '';
                if (!ui.click.configMenu) return;
                game.closePopped();
                game.pause();
                ui.click.configMenu();
                ui.system1.classList.remove('shown');
                ui.system2.classList.remove('shown');
                e.stopPropagation();
                e.preventDefault();
                return false;
            };
            var homeButtonOut = ui.create.div('.taixuhuanjing_consoledeskHomeButtonOut', homeButtonBox);
            homeButtonOut.onclick = function (e) {
                game.txhj_playAudioCall('off', null, true);
                homeButton.innerHTML = '';
                window.location.reload();
                e.stopPropagation();
                e.preventDefault();
                return false;
            };
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        home.onclick = function (e) {
            homeButton.innerHTML = '';
            e.stopPropagation();
            e.preventDefault();
            return false;
        };
        if (_status.TaiXuHuanJingGame && _status.TaiXuHuanJingGame.return != null && _status.TaiXuHuanJingGame.event) {
            eventBox.style.display = 'none';
            var homeBody2 = ui.create.div('.taixuhuanjing_StateHomeGameScore', homeBody);
            var gameEvent = game.eventPack[lib.config.taixuhuanjing.season][lib.config.taixuhuanjing.chapter][_status.TaiXuHuanJingGame.event.id];
            var gameScoreBody = ui.create.div('.taixuhuanjing_StateHomeGameScoreBody', homeBody2);
            var scoreComps = {
                gameMeName: (function () {
                    var gameMeName = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyName', '' + lib.config.connect_nickname);
                    return gameMeName;
                })(),
                eventBox: (function () {
                    var eventBox = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyEventBox');
                    var eventTextBg = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyEventTextBg', eventBox);
                    var eventText = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyEventText', '击败', eventTextBg);
                    if (_status.TaiXuHuanJingGame.return == false) {
                        eventText.innerHTML = '不敌';
                    }
                    var eventImp = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyEventImp', eventBox);
                    eventImp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_main_' + gameEvent.ext + '.png');
                    var eventRound = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyEventRound', eventBox);
                    return eventBox;
                })(),
                nodeBox: (function () {
                    var nodeBox = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyNodeBox');
                    function nodeFunc(node) {
                        var nodeDiv = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyNodeDiv');
                        var nodeDivText = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyNodeDivText', nodeDiv, node.name);
                        var nodeDivNum = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyNodeDivNum', nodeDiv, node.num + '');
                        return nodeDiv;
                    };
                    /*时间转换*/
                    var formatDuring = function (time) {
                        var days = parseInt(time / (1 * 60 * 60 * 24));
                        var hours = parseInt((time % (1 * 60 * 60 * 24)) / (1 * 60 * 60));
                        var minutes = parseInt((time % (1 * 60 * 60)) / (1 * 60));
                        var seconds = Math.floor((time % (1 * 60)) / 1);
                        var str = '';
                        if (days > 0) {
                            str += days + ' 天 ';
                        }
                        if (hours > 0) {
                            str += hours + ' 时 ';
                        }
                        str += minutes + ' 分 ';
                        str += seconds + ' 秒 ';
                        return str;
                    };
                    // 获取当前日期
                    function getCurrentDate() {
                        const today = new Date();
                        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    }

                    // 检查是否是今天的第一次操作
                    function isDailyFirstAction() {
                        const lastDate = localStorage.getItem('lastActionDate');
                        const currentDate = getCurrentDate();

                        if (lastDate !== currentDate) {
                            localStorage.setItem('lastActionDate', currentDate);
                            return true;
                        }
                        return false;
                    }
                    var calculateValue = function () {
                        let num = 0;
                        let skillList = lib.config.taixuhuanjing.useSkills.slice();
                        for (let i = 0; i < txhjPack.skillRank.length; i++) {
                            for (let s = 0; s < skillList.length; s++) {
                                if (txhjPack.skillRank[i].skillID == skillList[s]) {
                                    num += txhjPack.skillRank[i].rank * 100;
                                }
                            }
                        }
                        let buffList = lib.config.taixuhuanjing.buff.slice();
                        for (let i in buffPack) {
                            for (let b = 0; b < buffList.length; b++) {
                                if (i == buffList[b]) {
                                    num += buffPack[i].rank * 100;
                                }
                            }
                        }
                        let cardList = lib.config.taixuhuanjing.cards.slice();
                        for (let i = 0; i < txhjPack.cardRank.length; i++) {
                            for (let c = 0; c < cardList.length; c++) {
                                if (txhjPack.cardRank[i].cardID == cardList[c].name) {
                                    num += txhjPack.cardRank[i].rank * 50;
                                }
                            }
                        }
                        ['equip1', 'equip2', 'equip3', 'equip4'].forEach(equipKey => {
                            const equip = lib.config.taixuhuanjing[equipKey];
                            if (equip != null) {
                                const rankItem = txhjPack.cardRank.find(item => item.cardID === equip.name);
                                if (rankItem) {
                                    num += rankItem.rank * 50;
                                }
                            }
                        });
                        return num;
                    };
                    let dieNum = lib.config.taixuhuanjing.revive == true ? 0 : 100;
                    let coin = lib.config.taixuhuanjing.coin;
                    let maxCoin = lib.config.taixuhuanjing.maxCoin;
                    let valueNum = calculateValue();
                    let fightNum = lib.config.taixuhuanjing.score.fight;
                    let fightNum2 = fightNum * 100;
                    let timeNum = formatDuring(lib.config.taixuhuanjing.score.time);
                    let effectNum = game.effectPack[lib.config.taixuhuanjing.effect].num;
                    let effectNum2 = 0;
                    if (effectNum > 1) {
                        effectNum2 = effectNum;
                    } else {
                        effectNum2 = (valueNum + fightNum2 + (maxCoin - coin)) * effectNum;
                    }
                    let Apocalypsenum = lib.config.taixuhuanjing.Apocalypse.mark;
                    var totalNum = Math.ceil(dieNum + valueNum + fightNum2 + (maxCoin - coin) + effectNum2 + Apocalypsenum);
                    if (_status.TaiXuHuanJingGame.return === true) {
                        let totalNum2 = totalNum * 0.10;
                        totalNum = totalNum2 + totalNum;
                        let timeID = lib.config.taixuhuanjing.time;
                        lib.config.taixuhuanjingRecord[timeID].total = totalNum;
                        game.saveConfig('taixuhuanjingRecord', lib.config.taixuhuanjingRecord);
                    }
                    let TianFuNum = lib.config.taixuhuanjing.rank ? lib.config.taixuhuanjing.rank * 10 + 40 : 50;
                    if (_status.TaiXuHuanJingGame.return === false) {
                        TianFuNum = Math.ceil(TianFuNum * 0.2);
                    } else {
                        if (isDailyFirstAction()) {
                            TianFuNum *= 5;
                        }
                    }
                    lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.num += TianFuNum;
                    game.saveConfig('txhjtianfuData', lib.config.txhjtianfuData);
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                    var nodeList = [
                        { name: '未死亡奖励', typr: 'die', num: dieNum },
                        { name: '末日加成', typr: 'Apocalypse', num: Apocalypsenum },
                        { name: '突变种子奖励', typr: 'effect', num: effectNum2 },
                        { name: '获得金币数', typr: 'coin', num: maxCoin },
                        { name: '持有内容价值', typr: 'value', num: valueNum },
                        { name: '挑战对局数', typr: 'battle', num: fightNum },
                        { name: '总计时间', typr: 'time', num: timeNum },
                        { name: '总积分', typr: 'total', num: totalNum },
                        { name: '天赋点', typr: 'TianFu', num: TianFuNum },
                    ];
                    while (nodeList.length) {
                        nodeBox.appendChild(nodeFunc(nodeList.shift()));
                    };
                    game.updateModeData();
                    return nodeBox;
                })(),
                clickPrompt: (function () {
                    var clickPrompt = ui.create.div('.taixuhuanjing_StateHomeGameScoreBodyClickPrompt', '点击继续');
                    clickPrompt.addEventListener("click", function (e) {
                        game.reload();
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return clickPrompt;
                })(),
            };
            for (var i in scoreComps) {
                gameScoreBody.appendChild(scoreComps[i]);
            }
            var gameIcon = ui.create.div('.taixuhuanjing_StateHomeGameIcon2', homeBody2);
            var gameText = ui.create.div('.taixuhuanjing_StateHomeGameText2', gameIcon);
            if (_status.TaiXuHuanJingGame.return == false) {
                gameIcon.setBackgroundImage('extension/太虚幻境/image/style/game_false_icon.png');
                gameText.setBackgroundImage('extension/太虚幻境/image/style/game_false_text.png');
                gameText.style.bottom = '28%';
                game.txhj_playAudioCall('Loss', null, true);
            } else {
                var gameInfo = ui.create.div('.taixuhuanjing_StateHomeGameInfo2', gameIcon);
                var gameText2 = ui.create.div('.taixuhuanjing_StateHomeGameText3', '恭喜最终通关', gameInfo);
                var gameText3 = ui.create.div('.taixuhuanjing_StateHomeGameText4', '恭喜最终通关', gameInfo);
                gameScoreBody.style.top = "20%";
                gameIcon.setBackgroundImage('extension/太虚幻境/image/style/game_true_icon.png');
                gameText.setBackgroundImage('extension/太虚幻境/image/style/game_win_text.png');
                game.txhj_playAudioCall('Win', null, true);
            }
        }
    };
    game.equipBuffUpdate = function (equip, type) {
        if (equip == null) return;
        var equipName = equip.name;
        if (!lib.card?.[equipName]?.txModBuff) return;
        let buff = lib.card[equipName].txModBuff;
        if (buff) {
            if (type == true && buff[0]) {
                if (!lib.config.taixuhuanjing.buff.includes(buff[0])) {
                    lib.config.taixuhuanjing.buff.push(buff[0]);
                }
            } else if (type == false && buff[0]) {
                if (lib.config.taixuhuanjing.buff.includes(buff[0])) {
                    lib.config.taixuhuanjing.buff.remove(buff[0]);
                }
            }
        }
    };
    game.randomEvent = function (type) {
        if (!type || type == 'random') {
            type = ['gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'exam'].randomGet();
        }
        var number = [4, 4, 4, 4, 3, 3, 3, 2, 2, 1].randomGet();
        var list1 = [];
        var list2 = [];
        var event;
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var obj = game.eventPack[season][chapter];
        var packs = JSON.parse(JSON.stringify(obj))
        for (var p in packs) {
            var pack = packs[p];
            if (pack.rank > rank) continue;
            if (pack.type != type) continue;
            pack.season = season;
            pack.chapter = chapter;
            if (get.eventReserve(pack) != true) {
                if (pack.forced && pack.forced == true) {
                    return pack;
                    break;
                } else {
                    list1.push(pack);
                }
            };
        }
        if (type == 'gain' || type == 'trade') {
            var obj = gainPack;
            var packs = JSON.parse(JSON.stringify(obj))
            for (var i in packs) {
                if (packs[i].type != 'gain' && packs[i].type != 'trade') continue;
                if (packs[i].rank > rank) continue;
                if (packs[i].priority != number) continue;
                list2.push(packs[i]);
            }
        } else if (type == 'exam') {
            var obj = examPack;
            var packs = JSON.parse(JSON.stringify(obj))
            for (var i in packs) {
                for (var s in packs[i]) {
                    var exam = packs[i][s];
                    if (exam.rank > rank) continue;
                    if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.forbidden && lib.config.taixuhuanjingNode.forbidden.includes(exam.id)) continue;
                    if (lib.config.taixuhuanjing.exam.includes(exam.id)) continue;
                    list2.push(exam);
                }
            }
        } else if (type == 'exam3') {
            var obj = examPack.exam1;
            var packs = JSON.parse(JSON.stringify(obj))
            for (var s in packs) {
                var exam = packs[s];
                if (exam.rank > rank) continue;
                if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.forbidden && lib.config.taixuhuanjingNode.forbidden.includes(exam.id)) continue;
                if (lib.config.taixuhuanjing.exam.includes(exam.id)) continue;
                list2.push(exam);
            }
        } else if (type == 'exam3') {
            var obj = examPack.exam2;
            var packs = JSON.parse(JSON.stringify(obj))
            for (var s in packs) {
                var exam = packs[s];
                if (exam.rank > rank) continue;
                if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.forbidden && lib.config.taixuhuanjingNode.forbidden.includes(exam.id)) continue;
                if (lib.config.taixuhuanjing.exam.includes(exam.id)) continue;
                list2.push(exam);
            }
        } else if (type == 'exam3') {
            var obj = examPack.exam3;
            var packs = JSON.parse(JSON.stringify(obj))
            for (var s in packs) {
                var exam = packs[s];
                if (exam.rank > rank) continue;
                if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.forbidden && lib.config.taixuhuanjingNode.forbidden.includes(exam.id)) continue;
                if (lib.config.taixuhuanjing.exam.includes(exam.id)) continue;
                list2.push(exam);
            }
        } else if (type == 'exam3') {
            var obj = examPack.exam4;
            var packs = JSON.parse(JSON.stringify(obj))
            for (var s in packs) {
                var exam = packs[s];
                if (exam.rank > rank) continue;
                if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.forbidden && lib.config.taixuhuanjingNode.forbidden.includes(exam.id)) continue;
                if (lib.config.taixuhuanjing.exam.includes(exam.id)) continue;
                list2.push(exam);
            }
        }
        if (list1.length < 5) {
            list1 = list1.concat(list2.randomGets(5 - list1.length));
        }
        while (!event && list1.length) {
            var ev = list1.randomGet();
            ev.seat = Math.ceil(Math.random() * 999);
            if (ev.type == 'gain' && ev.change != undefined && ev.change == false && changePack[ev.id] && Math.random() <= 0.03) {
                ev.change = true;
            }
            if (ev.random && Math.random() <= ev.random) {
                event = ev;
            } else if (!ev.random) {
                event = ev;
            }
        }
        return event;
    };
    /**
 * 添加游戏事件
 * 该函数用于根据类型添加一个游戏事件它可以是随机事件，也可以是特定类型的事件
 * @param {string} type - 事件类型，可以是'random'（随机）、'gain'（获得）、'trade'（交易）或'exam'（考试）
 * @returns {object} 返回一个事件对象，包含事件的详细信息
 */
    game.addSe = function (type) {
        // 如果没有指定类型或类型为'random'，则从一系列'gain'和一个'exam'中随机选择一个类型
        if (!type || type === 'random') {
            type = ['gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'exam'].randomGet();
        }
        // 随机选择一个优先级数字
        var number = [4, 4, 4, 4, 3, 3, 3, 2, 2, 1].randomGet();
        // 初始化两个事件列表
        var list1 = [];
        var list2 = [];
        // 获取当前的难度、赛季和章节
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        // 获取当前赛季和章节的事件包
        var obj = game.eventPack[season][chapter];
        var packs = JSON.parse(JSON.stringify(obj));
        // 遍历事件包，筛选出符合当前难度和类型的事件
        for (var p in packs) {
            var pack = packs[p];
            if (pack.rank > rank) continue;
            if (pack.type !== type) continue;
            pack.season = season;
            pack.chapter = chapter;
            // 如果事件不需要预留，则根据条件将其添加到list1中
            if (get.eventReserve(pack) !== true) {
                if (pack.forced && pack.forced === true) {
                    return pack;
                } else {
                    list1.push(pack);
                }
            }
        }
        // 根据不同的类型，从相应的事件包中筛选事件
        if (type === 'gain' || type === 'trade') {
            var gainPacks = JSON.parse(JSON.stringify(gainPack));
            for (var i in gainPacks) {
                var item = gainPacks[i];
                if (item.type !== 'gain' && item.type !== 'trade') continue;
                if (item.rank > rank) continue;
                if (item.priority !== number) continue;
                list2.push(item);
            }
        } else if (type.startsWith('exam')) {
            var examType = parseInt(type.replace('exam', ''), 10);
            var examPacks = JSON.parse(JSON.stringify(examPack[`exam${examType}`]));
            for (var s in examPacks) {
                var exam = examPacks[s];
                if (exam.rank > rank) continue;
                if (lib.config.taixuhuanjingNode && lib.config.taixuhuanjingNode.forbidden && lib.config.taixuhuanjingNode.forbidden.includes(exam.id)) continue;
                if (lib.config.taixuhuanjing.exam.includes(exam.id)) continue;
                list2.push(exam);
            }
        }

        // 如果list1中的事件数量小于5，则从list2中随机选择一些事件补充
        if (list1.length < 5) {
            list1 = list1.concat(list2.randomGets(5 - list1.length));
        }

        // 随机选择一个事件作为最终事件


        while (list1.length) {
            var ev = list1.randomGet();
            ev.seat = Math.ceil(Math.random() * 999);
            // 根据条件改变事件的属性
            if (ev.type === 'gain' && ev.change === false && changePack[ev.id] && Math.random() <= 0.03) {
                ev.change = true;
            }
            // 根据事件的随机属性决定是否选择该事件
            if (!ev.random || Math.random() <= ev.random) {
                return ev;
            }
        }
        // 返回最终选择的事件
        return null;
    };
    /*过滤已发生的事件*/
    game.continueEvent = function (event) {
        var obj = lib.config.taixuhuanjing.events
        var packs = JSON.parse(JSON.stringify(obj));
        for (var p in packs) {
            var pack = packs[p];
            if (pack.id == event.id) {
                return true;
            }
        }
        return false;
    };
    /**
 * 随机战斗事件选择函数
 * 根据给定的类型，从游戏事件包中选择一个合适的事件进行战斗
 * 该函数考虑了事件的难度、类型、赛季和章节等因素，以确保选择的事件符合当前游戏情境
 * 
 * @param {string} type - 事件类型，用于筛选符合条件的事件
 * @returns {Object|null} - 返回选中的事件对象，如果没有找到合适的事件，则返回null
 */
    game.randomBattle = function (type) {
        // 初始化事件列表，用于存储符合条件的事件
        var list = [];
        // 获取当前的难度、赛季和章节，这些信息用于筛选事件
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;//章节
        // 从事件包中获取当前赛季和章节的所有事件
        var obj = game.eventPack[season][chapter];
        // 深拷贝事件对象，以避免修改原始数据
        var packs = JSON.parse(JSON.stringify(obj))
        // 遍历所有事件，筛选符合条件的事件
        for (var p in packs) {
            var pack = packs[p];
            // 如果事件的排名高于当前排名，则跳过
            if (pack.rank > rank) continue;
            // 如果事件的类型不符合，则跳过
            if (pack.type != type) continue;
            // 如果事件有未完成的预留条件，则跳过
            if (get.eventReserve(pack) != true) {
                // 如果事件是强制触发的，则直接返回该事件
                if (pack.forced && pack.forced == true) {
                    return pack;
                    break;
                } else {
                    // 否则，将事件添加到事件列表中
                    list.push(pack);
                }
            }
        }
        // 初始化事件变量，用于存储最终选中的事件
        var event;
        // 从事件列表中随机选择一个事件，直到选中合适的事件
        while (!event && list.length) {
            var ev = list.randomGet();
            // 为事件分配一个随机座位号
            ev.seat = Math.ceil(Math.random() * 999);
            // 如果事件有随机性，并且随机结果符合条件，则选中该事件
            if (ev.random && Math.random() <= ev.random) {
                event = ev;
            } else if (!ev.random) {
                // 如果事件没有随机性，则直接选中
                event = ev;
            }
        }

        // 返回选中的事件，如果没有合适的事件，则返回null
        return event;
    };
    game.moveEffect = function (effect, bool) {
        if (!effect) return;
        if (!effect.name) return;
        if (effect.name == 'addServant') {
            game.changeServant('add');
            return;
        }
        if (!effect.number) return;
        var number = effect.number;
        // 从 cardPack 中查找指定 cardID 的牌组
        function getCardList(cardID) {
            var cardlist = [];
            var obj = txhjPack.cardPack;
            var key = Object.keys(obj);
            for (var i of key) {
                if (key[i].cardID === cardID) {
                    cardlist = key[i].list.slice(0);
                    break;
                }
            }
            return cardlist;
        }

        // 生成一个基础卡牌对象（随机花色、点数等）
        function generateBaseCard(name) {
            return {
                name: name,
                suit: ['spade', 'heart', 'club', 'diamond'].randomGet(),
                number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].randomGet(),
                nature: '',
            };
        }

        // 如果是 "sha" 牌，添加随机属性
        function maybeAddShaNature(card) {
            if (card.name === 'sha') {
                card.nature = ['', 'fire', 'thunder'].randomGet();
            }
            return card;
        }

        // 获取符合条件的卡牌列表（用于 randomCard / basic / trick）
        function collectCards(filterType) {
            var list = [];
            for (var i = 0; i < txhjPack.cardPack.length; i++) {
                var cardID = txhjPack.cardPack[i].cardID;
                if (!lib.translate[cardID]) continue;

                var type = get.type(cardID);
                if (type === 'equip') continue;

                if (filterType === 'basic' && type === 'basic') {
                    list.push(cardID);
                } else if (filterType === 'trick' && (type === 'trick' || type === 'delay')) {
                    list.push(cardID);
                } else if (filterType === 'all') {
                    list.push(cardID);
                }
            }
            return list;
        }

        // 获取符合条件的装备列表（用于 randomEquip / equip1 / equip2 / equip5）
        function collectEquips(filterType) {
            var list = [],
                list1 = [],
                list2 = [],
                list5 = [];

            for (var i = 0; i < txhjPack.cardPack.length; i++) {
                var cardID = txhjPack.cardPack[i].cardID;
                if (!lib.translate[cardID] || get.type(cardID) !== 'equip') continue;

                var subtype = get.subtype(cardID);
                list.push(cardID);

                if (subtype === 'equip1') list1.push(cardID);
                else if (subtype === 'equip2') list2.push(cardID);
                else if (['equip3', 'equip4', 'equip5', 'equip6'].includes(subtype)) list5.push(cardID);
            }
            switch (filterType) {
                case 'equip1': return list1;
                case 'equip2': return list2;
                case 'equip5': return list5;
                default: return list;
            }
        }
        if (effect.name == 'coin') {
            let num = lib.config.taixuhuanjing.coinNum;
            if (number < 0) {
                lib.config.taixuhuanjing.coin += number;
                lib.config.taixuhuanjing.maxCoin += number;
                game.messagePopup('金币+' + number);
                if (bool == true && num > 0) {
                    lib.config.taixuhuanjing.coin += num;
                    lib.config.taixuhuanjing.maxCoin += num;
                    game.messagePopup('以战养战,战斗获得金币+' + num);
                }
            } else {
                lib.config.taixuhuanjing.coin += number;
                lib.config.taixuhuanjing.maxCoin += number;
                game.messagePopup('金币+' + number);
                if (bool == true && num > 0) {
                    lib.config.taixuhuanjing.coin += num;
                    lib.config.taixuhuanjing.maxCoin += num;
                    if (num > 0) game.messagePopup('以战养战,战斗获得金币+' + num);
                }
            }
            if (lib.config.taixuhuanjing.coin < 0) {
                lib.config.taixuhuanjing.coin = 0;
            }
        } else if (effect.name == 'exp') {
            lib.config.taixuhuanjing.exp += number;
            game.messagePopup(number < 0 ? '经验' + number : '经验+' + number);

            // 经验值下限为0
            if (lib.config.taixuhuanjing.exp < 0) {
                lib.config.taixuhuanjing.exp = 0;
            }

            // 等级提升逻辑
            if (lib.config.taixuhuanjing.exp >= lib.config.taixuhuanjing.maxExp && lib.config.taixuhuanjing.level < 10) {
                const maxExpMap = {
                    2: 300,
                    3: 700,
                    4: 1200,
                    5: 1800,
                    6: 2300,
                    7: 3000,
                    8: 3500,
                    9: 4000
                };

                lib.config.taixuhuanjing.exp = 0;
                lib.config.taixuhuanjing.level += 1;

                const newLevel = lib.config.taixuhuanjing.level;
                if (newLevel in maxExpMap) {
                    lib.config.taixuhuanjing.maxExp = maxExpMap[newLevel];
                }

                game.messagePopup('等级提升至' + get.cnNumber(newLevel, true) + '级');
            }
        } else if (effect.name == 'hp') {
            if (number < 0) {
                lib.config.taixuhuanjing.hp += number;
                game.messagePopup('体力' + number);
            } else {
                lib.config.taixuhuanjing.hp += number;
                game.messagePopup('体力+' + number);
            }
            if (lib.config.taixuhuanjing.hp < 0) {
                lib.config.taixuhuanjing.hp = 1;
            }
            if (lib.config.taixuhuanjing.maxHp <= lib.config.taixuhuanjing.hp) {
                lib.config.taixuhuanjing.hp = lib.config.taixuhuanjing.maxHp;
            }
        } else if (effect.name == 'maxHp') {
            if (number < 0) {
                lib.config.taixuhuanjing.hp += number;
                lib.config.taixuhuanjing.maxHp += number;
                game.messagePopup('体力上限' + number);
            } else {
                lib.config.taixuhuanjing.hp += number;
                lib.config.taixuhuanjing.maxHp += number;
                game.messagePopup('体力上限+' + number);
            }
            if (lib.config.taixuhuanjing.maxHp < 0) {
                lib.config.taixuhuanjing.maxHp = 1;
            }
            if (lib.config.taixuhuanjing.maxHp <= lib.config.taixuhuanjing.hp) {
                lib.config.taixuhuanjing.hp = lib.config.taixuhuanjing.maxHp;
            }
        } else if (effect.name == 'minHs') {
            if (number < 0) {
                lib.config.taixuhuanjing.minHs += number;
                game.messagePopup('初始手牌' + number);
            } else {
                lib.config.taixuhuanjing.minHs += number;
                game.messagePopup('初始手牌+' + number);
            }
            /* if (lib.config.taixuhuanjing.minHs < 0) {
                 lib.config.taixuhuanjing.minHs = 0;
             }*/
        } else if (effect.name == 'maxHs') {
            if (number < 0) {
                lib.config.taixuhuanjing.maxHs += number;
                game.messagePopup('手牌上限' + number);
            } else {
                lib.config.taixuhuanjing.maxHs += number;
                game.messagePopup('手牌上限+' + number);
            }
            if (lib.config.taixuhuanjing.maxHs < 0) {
                lib.config.taixuhuanjing.maxHs = 0;
            }
        } else if (effect.name == 'adjust') {
            if (number < 0) {
                lib.config.taixuhuanjing.adjust += number;
                game.messagePopup('调度' + number);
            } else {
                lib.config.taixuhuanjing.adjust += number;
                game.messagePopup('调度+' + number);
            }
            if (lib.config.taixuhuanjing.adjust < 0) {
                lib.config.taixuhuanjing.adjust = 0;
            }
        } else if (effect.name == 'exp') {
            if (number < 0) {
                lib.config.taixuhuanjing.exp += number;
                game.messagePopup('经验' + number);
            } else {
                lib.config.taixuhuanjing.exp += number;
                game.messagePopup('经验+' + number);
            }
        } else if (effect.name == 'maxSkills') {
            if (number < 0) {
                lib.config.taixuhuanjing.maxSkills += number;
                game.messagePopup('技能插槽' + number);
            } else {
                lib.config.taixuhuanjing.maxSkills += number;
                game.messagePopup('技能插槽+' + number);
            }
            if (lib.config.taixuhuanjing.maxSkills < 0) {
                lib.config.taixuhuanjing.maxSkills = 0;
            }
        } else if (effect.name == 'card') {
            while (number--) {
                var card = getCardList(effect.result).randomGet() || maybeAddShaNature(generateBaseCard(effect.result));
                lib.config.taixuhuanjing.cards.push(card);
                game.messagePopup('获得卡牌[' + get.translation(card.name) + ']');
            }

        } else if (effect.name == 'removeCard') {
            while (number--) {
                if (lib.config.taixuhuanjing.cards.length) {
                    var card = lib.config.taixuhuanjing.cards.randomGet();
                    lib.config.taixuhuanjing.cards.remove(card);
                    game.messagePopup('失去卡牌[' + get.translation(card.name) + ']');
                }
            }
        } else if (effect.name == 'randomCard' || effect.name == 'basic' || effect.name == 'trick') {
            var cardIDs = collectCards(effect.name === 'randomCard' ? 'all' : effect.name);
            while (number-- && cardIDs.length) {
                var cardName = cardIDs.randomGet();
                var card = getCardList(cardName).randomGet() || maybeAddShaNature(generateBaseCard(cardName));
                lib.config.taixuhuanjing.cards.push(card);
                game.messagePopup(`获得${effect.name === 'randomCard' ? '随机卡牌' : effect.name === 'basic' ? '基本牌' : '锦囊牌'}[${get.translation(card.name)}]`);
            }
        } else if (effect.name == 'equip') {
            while (number--) {
                var card = getCardList(effect.result).randomGet() || generateBaseCard(effect.result);
                game.messagePopup('获得装备[' + get.translation(card.name) + ']');
                var subtype = get.subtype(card.name);
                if (['equip5', 'equip6'].includes(subtype) || lib.config.taixuhuanjing[subtype] !== null) {
                    lib.config.taixuhuanjing.equips.push(card);
                } else {
                    lib.config.taixuhuanjing[subtype] = card;
                }
            }
        } else if (effect.name == 'removeEquip') {
            while (number--) {
                let equips = ['equip1', 'equip2', 'equip3', 'equip4']
                    .map(prop => lib.config.taixuhuanjing[prop])
                    .filter(equip => equip != null);
                if (!equips.length) break;
                let equip = equips.randomGet();
                game.equipBuffUpdate(equip, false);
                ['equip1', 'equip2', 'equip3', 'equip4'].forEach(prop => {
                    let current = lib.config.taixuhuanjing[prop];
                    if (current && current.name === equip.name &&
                        current.suit === equip.suit &&
                        current.number === equip.number) {
                        lib.config.taixuhuanjing[prop] = null;
                    }
                });
                game.messagePopup('失去装备[' + get.translation(equip.name) + ']');
            }
        } else if (effect.name == 'randomEquip' || effect.name == 'equip1' || effect.name == 'equip2' || effect.name == 'equip5') {
            var equipIDs = collectEquips(effect.name === 'randomEquip' ? 'all' : effect.name);
            while (number-- && equipIDs.length) {
                var cardName = equipIDs.randomGet();
                var card = getCardList(cardName).randomGet() || generateBaseCard(cardName);
                var popupText = {
                    randomEquip: '随机装备',
                    equip1: '武器',
                    equip2: '防具',
                    equip5: '宝物'
                }[effect.name];

                game.messagePopup(`获得${popupText}[${get.translation(card.name)}]`);

                var subtype = get.subtype(card.name);
                if (['equip5', 'equip6'].includes(subtype) || lib.config.taixuhuanjing[subtype] !== null) {
                    lib.config.taixuhuanjing.equips.push(card);
                } else {
                    lib.config.taixuhuanjing[subtype] = card;
                }
            }

        } else if (effect.name == 'randomUnique') {
            var uniqueEquips = txhjPack.cardPack
                .filter(item => item.unique)
                .map(item => item.cardID)
                .filter(cardID => lib.translate[cardID] && get.type(cardID) === 'equip');

            while (number-- && uniqueEquips.length) {
                var cardName = uniqueEquips.randomGet();
                var card = getCardList(cardName).randomGet() || maybeAddShaNature(generateBaseCard(cardName));
                game.messagePopup('获得神器[' + get.translation(card.name) + ']');

                var subtype = get.subtype(card.name);
                if (['equip5', 'equip6'].includes(subtype) || lib.config.taixuhuanjing[subtype] !== null) {
                    lib.config.taixuhuanjing.equips.push(card);
                } else {
                    lib.config.taixuhuanjing[subtype] = card;
                }
            }
        } else if (effect.name == 'skill') {
            if (lib.config.taixuhuanjing.useSkills.length < lib.config.taixuhuanjing.maxSkills) {
                lib.config.taixuhuanjing.useSkills.add(effect.result);
            } else if (!lib.config.taixuhuanjing.skills.includes(effect.result)) {
                lib.config.taixuhuanjing.skills.add(effect.result);
            }
            game.messagePopup('获得技能【' + get.translation(effect.result) + '】');

        } else if (effect.name == 'removeSkill') {
            const skills = lib.config.taixuhuanjing.useSkills.slice(0)
                .filter(skill => {
                    const effect = game.effectPack[lib.config.taixuhuanjing.effect] || [];
                    if (effect.skill?.includes(skill)) return false;
                    return true;
                });
            while (number > 0 && skills.length > 0) {
                number--;
                const skill = skills.randomGet();
                if (!skill) continue;
                skills.remove(skill);
                lib.config.taixuhuanjing.useSkills.remove(skill);
                game.messagePopup('失去技能【' + get.translation(skill) + '】');
            }
        } else if (effect.name == 'randomSkill' || effect.name == 'attack' || effect.name == 'defense' || effect.name == 'assist' || effect.name == 'burst') {
            while (number--) {
                let skills = txhjPack.skillRank.slice(0);
                let listm = get.character(lib.config.taixuhuanjing.name, 3).slice(0);
                skills = skills.filter(skill => {
                    const skillID = skill.skillID;
                    return skillID && get.info(skillID) && lib.translate[skillID + '_info'] && !lib.config.taixuhuanjing.useSkills.includes(skillID) && !listm.includes(skillID);
                });
                let list = [];
                if (effect.name == 'randomSkill') {
                    for (let i = 0; i < skills.length; i++) {
                        if (!lib.config.taixuhuanjing.useSkills.includes(skills[i].skillID) && !listm.includes(skills[i].skillID)) {
                            list.push(skills[i]);
                        }
                    }
                } else {
                    for (let i = 0; i < skills.length; i++) {
                        if (lib.config.taixuhuanjing.useSkills.includes(skills[i].skillID) && listm.includes(skills[i].skillID)) continue;
                        if (effect.name == 'attack' && skills[i].type.includes('攻击')) {
                            list.push(skills[i]);
                        } else if (effect.name == 'defense' && skills[i].type.includes('防御')) {
                            list.push(skills[i]);
                        } else if (effect.name == 'assist' && skills[i].type.includes('控制')) {
                            list.push(skills[i]);
                        } else if (effect.name == 'burst' && skills[i].type.includes('爆发')) {
                            list.push(skills[i]);
                        }
                    }
                }
                if (list.length) {
                    let skill = list.randomGet();
                    if (lib.config.taixuhuanjing.useSkills.length < lib.config.taixuhuanjing.maxSkills) {
                        lib.config.taixuhuanjing.useSkills.add(skill.skillID);
                    } else if (!lib.config.taixuhuanjing.skills.includes(skill.skillID)) {
                        lib.config.taixuhuanjing.skills.add(skill.skillID);
                    }
                    game.messagePopup('获得技能【' + get.translation(skill.skillID) + '】');
                } else {
                    game.messagePopup('无此类型技能可获得');
                }

            }
        } else if (effect.name == 'buff') {
            if (!lib.config.taixuhuanjing.buff.includes(effect.result)) {
                lib.config.taixuhuanjing.buff.add(effect.result);
            };
            game.messagePopup('获得祝福【' + buffPack[effect.result].name + '】');

        } else if (effect.name == 'removeBuff') {
            const buffs = lib.config.taixuhuanjing.buff
                .slice(0)
                .filter(buff => buffPack[buff]?.store);
            while (number > 0 && buffs.length > 0) {
                number--;
                const buff = buffs.randomGet();
                if (!buff) continue;
                buffs.remove(buff);
                lib.config.taixuhuanjing.buff.remove(buff);
                game.messagePopup('失去祝福【' + buffPack[buff].name + '】');
            }
        } else if (effect.name == 'randomBuff') {
            var buffs = [];
            for (var i in buffPack) {
                if (buffPack[i].store == false) continue;
                if (!lib.config.taixuhuanjing.buff.includes(i)) {
                    buffs.push(i);
                }
            }
            if (!buffs.length) game.messagePopup('已获得所有祝福');
            while (number--) {
                if (buffs.length) {
                    var buff = buffs.randomGet();
                    lib.config.taixuhuanjing.buff.push(buff);
                    game.messagePopup('获得随机祝福【' + buffPack[buff].name + '】');
                }
            }
        }
    };
    game.eventResult = function (result) {
        if (result.effect && result.effect.length) {
            for (var i = 0; i < result.effect.length; i++) {
                game.moveEffect(result.effect[i], false);
            }
        }
    };
    game.lookChoose = function (node, view) {
        var home = ui.create.div('.taixuhuanjing_lookEventHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.6);

        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookEventHomeBox', homeBody);
        var boxComps = {
            imp: (function () {
                var ext = game.eventPack[node.season][node.chapter][node.id].ext;
                var imp = ui.create.div('.taixuhuanjing_lookEventHomeBoxImp');
                imp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_sub_' + ext + '.png');
                return imp;
            })(),
            title: (function () {
                var str = game.eventPack[node.season][node.chapter][node.id].name;
                var title = ui.create.div('.taixuhuanjing_lookEventHomeBoxTitle', '' + str + '');
                return title;
            })(),
            info: (function () {
                var str = game.eventPack[node.season][node.chapter][node.id].text;
                var info = ui.create.div('.taixuhuanjing_lookEventHomeBoxInfo', '' + str + '');
                return info;
            })(),
            buttonbg: (function () {
                var buttonbg = ui.create.div('.taixuhuanjing_lookEventHomeBoxButtonbg');
                function func2(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton1');
                    button.innerHTML = result.name;
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (result.result != null && get.eventState(node) != true) {
                            if (result.result == true) {
                                game.messagePopup('回答正确');
                            } else {
                                game.messagePopup('回答错误');
                            }
                            lib.config.taixuhuanjing.events.push(node);
                            game.eventResult(result, 'gain');
                        }

                        if (result.result != null) {
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                        }
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };
                function func(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton2');
                    button.innerHTML = result.name;
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        if (result.result != null && result.enemy.length) {
                            var number = 1 + result.enemy.length + result.friend.length;
                            _status.TaiXuHuanJingGame.number = number;
                            _status.TaiXuHuanJingGame.premise = result.premise;
                            _status.TaiXuHuanJingGame.event = node;
                            _status.TaiXuHuanJingGame.season = lib.config.taixuhuanjing.season;
                            _status.TaiXuHuanJingGame.chapter = lib.config.taixuhuanjing.chapter;
                            game.eventPack[node.season][node.chapter][node.id].enemy = result.enemy;
                            game.eventPack[node.season][node.chapter][node.id].friend = result.friend;
                            game.eventPack[node.season][node.chapter][node.id].spoils = result.spoils;
                            _status.TaiXuHuanJingGame.enemy = game.eventPack[node.season][node.chapter][node.id].enemy.slice(0);
                            _status.TaiXuHuanJingGame.friend = game.eventPack[node.season][node.chapter][node.id].friend.slice(0);
                            _status.TaiXuHuanJingGame.cards = lib.config.taixuhuanjing.cards;
                            _status.TaiXuHuanJingGame.skills = lib.config.taixuhuanjing.useSkills;
                            _status.gameStart = undefined;

                            game.chooseCharacterTaiXuHuanJing();
                            game.txhj_playAudioCall('QuickStart', null, true);
                            view.off(true);
                        } else if (result.result != null && result.buttons && result.buttons.length && (!result.enemy || !result.enemy.length)) {
                            if (result.result != null && get.eventState(node) != true) {
                                lib.config.taixuhuanjing.events.push(node);
                                if (result.spoils) {
                                    var spoils = result.spoils.slice(0);
                                    for (var i = 0; i < spoils.length; i++) {
                                        if (Math.random() <= spoils[i].random) {
                                            game.eventResult(spoils[i]);
                                        };
                                    };
                                }
                            }
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                            home.delete();
                            game.taixuUIupdata(homeBody, false);
                            game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                            if (result.buttons && result.buttons.length) {
                                var buttons = result.buttons.slice(0);
                                game.eventPack[node.season][node.chapter][node.id].buttons = buttons;
                                node.buttons = buttons;
                                setTimeout(function () {
                                    game.lookTrade(node, view);
                                }, 1000);
                            }
                        } else if (result.result != null) {
                            if (result.result != null && get.eventState(node) != true) {
                                lib.config.taixuhuanjing.events.push(node);
                                if (result.spoils) {
                                    var spoils = result.spoils.slice(0);
                                    for (var i = 0; i < spoils.length; i++) {
                                        if (Math.random() <= spoils[i].random) {
                                            game.eventResult(spoils[i]);
                                        };
                                    };
                                }
                            }
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                            home.delete();
                            game.taixuUIupdata(homeBody, false);
                            game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        }
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };

                var buttons = game.eventPack[node.season][node.chapter][node.id].buttons.slice(0);
                buttons.randomSort();
                if (buttons.length == 1 || buttons.length == 3) buttons.push({
                    result: null,
                    name: '思考一下',
                    effect: [],
                    number: 0,
                    buff: [],
                    card: [],
                    equip: [],
                    skill: [],
                });
                if (buttons.length < 3) {
                    while (buttons.length) {
                        buttonbg.appendChild(func2(buttons.shift()));
                    }
                } else {
                    while (buttons.length) {
                        buttonbg.appendChild(func(buttons.shift()));
                    }
                }
                return buttonbg;
            })(),
        }
        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }
        home.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookTrade = function (node, view) {
        var home = ui.create.div('.taixuhuanjing_lookEventHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.6);

        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookEventHomeBox', homeBody);
        var boxComps = {
            imp: (function () {
                var ext = node.ext;
                var imp = ui.create.div('.taixuhuanjing_lookEventHomeBoxImp');
                imp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_sub_' + ext + '.png');
                return imp;
            })(),
            title: (function () {
                var str = node.name;
                var title = ui.create.div('.taixuhuanjing_lookEventHomeBoxTitle', '' + str + '');
                return title;
            })(),
            info: (function () {
                var str = node.text;
                var info = ui.create.div('.taixuhuanjing_lookEventHomeBoxInfo', '' + str + '');
                return info;
            })(),
            buttonbg: (function () {
                var buttonbg = ui.create.div('.taixuhuanjing_lookEventHomeBoxButtonbg');
                function func(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton2');
                    button.innerHTML = result.name;
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (get.eventState(node) != true) {
                            lib.config.taixuhuanjing.events.push(node);
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                        }
                        game.eventResult(result, 'trade');
                        view.update();
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };
                function func2(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton1');
                    button.innerHTML = result.name;
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (get.eventState(node) != true) {
                            lib.config.taixuhuanjing.events.push(node);

                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                        }
                        game.eventResult(result, 'trade');
                        view.update();
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };
                var buttons = node.buttons.slice(0);
                if (buttons.length < 3) {
                    while (buttons.length) {
                        buttonbg.appendChild(func2(buttons.shift()));
                    }
                } else {
                    while (buttons.length) {
                        buttonbg.appendChild(func(buttons.shift()));
                    }
                }
                return buttonbg;
            })(),
        }
        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }
        home.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookAnswer = function (node, view) {
        var home = ui.create.div('.taixuhuanjing_lookEventHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.6);

        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookEventHomeBox', homeBody);
        var boxComps = {
            imp: (function () {
                var ext = node.ext;
                var imp = ui.create.div('.taixuhuanjing_lookEventHomeBoxImp');
                imp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_sub_' + ext + '.png');
                return imp;
            })(),
            title: (function () {
                var str = node.name;
                var title = ui.create.div('.taixuhuanjing_lookEventHomeBoxTitle', '' + str + '');
                return title;
            })(),
            info: (function () {
                var str = node.text;
                var info = ui.create.div('.taixuhuanjing_lookEventHomeBoxInfo', '' + str + '');
                return info;
            })(),
            buttonbg: (function () {
                var buttonbg = ui.create.div('.taixuhuanjing_lookEventHomeBoxButtonbg');
                var choiceList = node.buttons.slice(0);
                function func2(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton1');
                    button.innerHTML = result.name;
                    if (result.result == false && lib.config.taixuhuanjing.buff.add('buff_txhj_bowenqiangzhi')) {
                        button.innerHTML = result.name + '（错误）';
                        /*
                         if (lib.config.taixuhuanjing.bowenqiangzhi == result.name) {
                             button.innerHTML = result.name + '（错误）';
                         } else if (lib.config.taixuhuanjing.bowenqiangzhi == null) {
                             button.innerHTML = result.name + '（错误）';
                             lib.config.taixuhuanjing.bowenqiangzhi = result.name;
                             game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                         }*/
                    }
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (result.result != null) {
                            if (result.result == true) {
                                game.messagePopup('回答正确');
                            } else {
                                game.messagePopup('回答错误');
                            }
                            lib.config.taixuhuanjing.bowenqiangzhi = null;
                            if (!lib.config.taixuhuanjing.exam.includes(node.id)) {
                                lib.config.taixuhuanjing.exam.push(node.id);
                            }
                            game.eventResult(result, 'gain');
                        }

                        if (result.result != null) {
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                        }
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };
                function func(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton2');
                    button.innerHTML = result.name;
                    if (result.result == false && lib.config.taixuhuanjing.buff.includes('buff_txhj_bowenqiangzhi')) {
                        button.innerHTML = result.name + '（错误）';
                        /* if (lib.config.taixuhuanjing.bowenqiangzhi == result.name) {
                             button.innerHTML = result.name + '（错误）';
                         } else if (lib.config.taixuhuanjing.bowenqiangzhi == null) {
                             button.innerHTML = result.name + '（错误）';
                             lib.config.taixuhuanjing.bowenqiangzhi = result.name;
                             game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                         }*/
                    }
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (result.result != null) {
                            if (result.result == true) {
                                game.messagePopup('回答正确');
                            } else {
                                game.messagePopup('回答错误');
                            }
                            lib.config.taixuhuanjing.bowenqiangzhi = null;
                            if (!lib.config.taixuhuanjing.exam.includes(node.id)) {
                                lib.config.taixuhuanjing.exam.push(node.id);
                            }
                            game.eventResult(result, 'gain');
                        }

                        if (result.result != null) {
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                        }
                        view.update();
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };

                var buttons = node.buttons.slice(0);
                buttons.randomSort();
                if (buttons.length == 1 || buttons.length == 3) buttons.push({
                    result: null,
                    name: '思考一下',
                    effect: [],
                    number: 0,
                    buff: [],
                    card: [],
                    equip: [],
                    skill: [],
                });
                if (buttons.length < 3) {
                    while (buttons.length) {
                        buttonbg.appendChild(func2(buttons.shift()));
                    }
                } else {
                    while (buttons.length) {
                        buttonbg.appendChild(func(buttons.shift()));
                    }
                }
                return buttonbg;
            })(),
        }
        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }
        home.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookEvent = function (node, view) {
        var home = ui.create.div('.taixuhuanjing_lookEventHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.6);

        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookEventHomeBox', homeBody);
        var boxComps = {
            imp: (function () {
                var imp = ui.create.div('.taixuhuanjing_lookEventHomeBoxImp');
                imp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_sub_' + node.ext + '.png');
                return imp;
            })(),
            title: (function () {
                var str = node.name;
                var title = ui.create.div('.taixuhuanjing_lookEventHomeBoxTitle', '' + str + '');
                return title;
            })(),
            info: (function () {
                var str = node.text;
                var info = ui.create.div('.taixuhuanjing_lookEventHomeBoxInfo', '' + str + '');
                return info;
            })(),
            buttonbg: (function () {
                var buttonbg = ui.create.div('.taixuhuanjing_lookEventHomeBoxButtonbg');
                function func2(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton1');
                    button.innerHTML = result.name;
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (result.result != null && get.eventState(node) != true) {
                            lib.config.taixuhuanjing.events.push(node);
                            game.eventResult(result, 'gain');
                        }

                        if (result.result != null) {
                            game.changeEvent(node);
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                        }
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };
                function func(result) {
                    var button = ui.create.div('.taixuhuanjing_lookEventHomeBoxButton2');
                    button.innerHTML = result.name;
                    button.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (result.result != null && get.eventState(node) != true) {
                            lib.config.taixuhuanjing.events.push(node);
                            game.eventResult(result, 'gain');
                        }

                        if (result.result != null) {
                            game.changeEvent(node);
                            for (let i = 0; i < 3; i++) {
                                const optional = lib.config.taixuhuanjing.optional[i];
                                if (optional && optional.id == node.id && optional.seat == node.seat) {
                                    lib.config.taixuhuanjing.optional[i] = null;
                                }
                            }
                            view.update();
                        }
                        view.update();
                        home.delete();
                        game.taixuUIupdata(homeBody, false);
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return button;
                };
                var buttons = node.buttons.slice(0);
                if (buttons.length == 1 || buttons.length == 3) buttons.push({
                    result: null,
                    name: '思考一下',
                    effect: [],
                    number: 0,
                    buff: [],
                    card: [],
                    equip: [],
                    skill: [],
                });
                if (buttons.length < 3) {
                    while (buttons.length) {
                        buttonbg.appendChild(func2(buttons.shift()));
                    }
                } else {
                    while (buttons.length) {
                        buttonbg.appendChild(func(buttons.shift()));
                    }
                }
                return buttonbg;
            })(),
        }
        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }
        home.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookBoss = function (node, view) {
        var home = ui.create.div('.taixuhuanjing_lookEventHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookBossHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.6);
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookBossHomeBox', homeBody);
        var playBody = ui.create.div('.taixuhuanjing_lookEventHomePlayBody', box);
        var num = 0;
        //console.log(node.id);
        var enemyList = game.eventPack[node.season][node.chapter][node.id].enemy.slice(0);
        var friendList = game.eventPack[node.season][node.chapter][node.id].friend.slice(0);
        var playList = enemyList.concat(friendList);
        playBody.update = function () {
            playBody.innerHTML = '';
            var play = playList[num].name;
            var level = playList[num].level;
            var type = playList[num].type;
            var playComps = {
                playImp: (function () {
                    var playImp = ui.create.div('.taixuhuanjing_lookEventHomePlayImp');
                    //大图修改
                    let repl = '';
                    for (const packKey in lib.characterPack) {
                        const characters = lib.characterPack[packKey];
                        for (const charKey in characters) {
                            if (charKey == play) {
                                if (characters[charKey]?.trashBin?.length != 0) {
                                    repl = `${'extension/' + characters[charKey].trashBin[0].replace(/^ext:/, '')}`;
                                } else {
                                    repl = `image/character/${play}.jpg`;
                                }
                            }
                        }
                    }
                    if (repl.length == 0) repl = "ext:太虚幻境/image/yuanhua/" + play + ".jpg";
                    playImp.setBackgroundImage(repl);
                    return playImp;
                })(),
                playFrame: (function () {
                    var playFrame = ui.create.div('.taixuhuanjing_lookEventHomePlayFrame');
                    var enemys = playList;
                    var playArrow1 = ui.create.div('.taixuhuanjing_lookEventHomePlayArrow1', playFrame);
                    playArrow1.listen(function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        num--;
                        playBody.update();
                        textBox.update();
                    });
                    var playArrow2 = ui.create.div('.taixuhuanjing_lookEventHomePlayArrow2', playFrame);
                    playArrow2.listen(function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        num++;
                        playBody.update();
                        textBox.update();
                    });
                    playFrame.update = function () {
                        if (enemys.length == 1) {
                            playArrow1.style.display = 'none';
                            playArrow2.style.display = 'none';
                        }
                        if ((enemys.length - 1) > num) {
                            playArrow2.style.display = 'block';
                        } else {
                            playArrow2.style.display = 'none';
                        }
                        if (num > 0) {
                            playArrow1.style.display = 'block';
                        } else {
                            playArrow1.style.display = 'none';
                        }
                    };
                    playFrame.update();
                    return playFrame;
                })(),
                playText: (function () {
                    var playText = ui.create.div('.taixuhuanjing_lookEventHomePlayText');
                    var playText1 = ui.create.div('.taixuhuanjing_lookEventHomePlayText1', '等级' + level, playText);
                    var playHp = ui.create.div('.taixuhuanjing_lookEventHomePlayText2', playText);
                    var intro = lib.character[play];
                    if (!intro) {
                        for (var i in lib.characterPack) {
                            if (lib.characterPack[i][play]) {
                                intro = lib.characterPack[i][play];
                                break;
                            }
                        }
                    }
                    var hp = intro[2];
                    var hp1 = get.infoHp(hp);
                    var maxHp1 = get.infoMaxHp(hp);
                    var hp2 = playList[num].hp;
                    var maxHp2 = playList[num].maxHp;
                    hp1 += hp2;
                    maxHp1 += maxHp2;
                    if (lib.config.taixuhuanjing.rank > 1) {
                        hp1++;
                        maxHp1++;
                    }
                    if (hp1 < 8 && maxHp1 < 8) {
                        var num2 = maxHp1 - hp1;
                        while (hp1--) {
                            var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                            tmp.style["background-image"] = "url(" + lib.assetURL + "extension/太虚幻境/image/icon/maxHp.png)";
                        }
                        while (num2--) {
                            var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                            tmp.style["background-image"] = "url(" + lib.assetURL + "extension/太虚幻境/image/icon/maxHp.png)";
                            tmp.style.webkitFilter = "grayscale(1)";
                        }
                    } else {
                        var tmp = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpICON", playHp);
                        tmp.style["background-image"] = "url(" + lib.assetURL + "extension/太虚幻境/image/icon/maxHp.png)";
                        var numbody = ui.create.div(".taixuhuanjing_chooseCharacterPlayBodyHpNum", maxHp1 + '', playHp);
                    }
                    return playText;
                })(),
                playType: (function () {
                    var playType = ui.create.div('.taixuhuanjing_lookEventHomePlayType');
                    if (type == 'boss') {
                        playType.setBackgroundImage('extension/太虚幻境/image/style/identity_boss.png');
                    } else {
                        if (friendList.includes(playList[num])) {
                            playType.setBackgroundImage('extension/太虚幻境/image/style/identity_friend.png');
                        } else {
                            playType.setBackgroundImage('extension/太虚幻境/image/style/identity_enemy.png');
                        }
                    }
                    return playType;
                })(),
            }
            for (var i in playComps) {
                playBody.appendChild(playComps[i]);
            }
        };
        playBody.update();
        var title = ui.create.div('.taixuhuanjing_lookEventHomeTitle', box);
        var textBox = ui.create.div('.taixuhuanjing_lookEventHomeTextBox', box);
        textBox.update = function () {
            textBox.innerHTML = '';
            title.innerHTML = lib.translate[playList[num].name];
            let textTitle = ui.create.div('.taixuhuanjing_lookEventHomeTextTitle', textBox);
            let text = ui.create.div('.taixuhuanjing_lookEventHomeText', textBox);
            text.update = function (type) {
                text.innerHTML = '';
                let play = playList[num].name;
                let str = '';
                if (type == 'skill') {
                    let skills1 = get.character(play, 3).slice(0);
                    let skills2 = game.effectPack[lib.config.taixuhuanjing.effect].skill.slice(0);
                    if (playList[num].skills.length != 0) {
                        skills1 = skills1.concat(playList[num].skills);
                    }
                    let skills = skills1.concat(skills2);

                    if (lib.config.taixuhuanjing.rank > 2) {
                        if (!skills.includes('reyingzi')) {
                            skills.push('reyingzi');
                        }
                        if (!skills.includes('mashu')) {
                            skills.push('mashu');
                        }
                    }
                    for (var i = 0; i < skills.length; i++) {
                        if (str != "") str += "<p>";
                        str += "<br>" + get.translation([skills[i]]) + ":";
                        str += lib.translate[skills[i] + '_info'];
                    }
                    if (!skills.length) str += "<p>无技能";
                } else if (type == 'effect') {
                    var effects = playList[num].effect.slice(0);

                    if (lib.config.taixuhuanjing.rank > 1) {
                        game.effectPack.correct.info = '等级补正：你每超出其一级，其额外+2体力及体力上限';
                    }
                    if (lib.config.taixuhuanjing.rank == 2) {
                        effects.unshift('strengthen');
                    } else if (lib.config.taixuhuanjing.rank == 3) {
                        effects.unshift('nightmare');
                    } else if (lib.config.taixuhuanjing.rank >= 4) {
                        effects.unshift('purgatory');
                    }
                    const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
                    if (lib.config.taixuhuanjing.rank == 6 && Apocalypse.mark > 0) {
                        let str6 = '<br>末日难度补正:';
                        let debuffTranslate = Apocalypse.debuffTranslate;
                        let debuff = Apocalypse.debuff;
                        if (debuff.length > 0) {
                            for (let j of debuffTranslate) {
                                str6 += j + '<p>';
                            }
                        }
                        for (let i in Apocalypse) {
                            if (Apocalypse[i] <= 0) continue;
                            let num = Apocalypse[i];
                            switch (i) {
                                case 'draw':
                                    str6 += '摸牌阶段多摸' + num + '张牌<p>';
                                    break;
                                case 'damageZero':
                                    str6 += '受到伤害减少' + num + '点<p>';
                                    break;
                                case 'maxHp':
                                    str6 += '体力增加' + num + '点<p>';
                                    break;
                                case 'maxHs':
                                    str6 += '手牌上限增加' + num + '张<p>';
                                    break;
                                case 'sha':
                                    str6 += '每回合出杀次数增加' + num + '次<p>';
                                    break;
                                case 'damage':
                                    str6 += '造成伤害增加' + num + '点<p>';
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (Apocalypse.skill) {
                            for (const [key, value] of Object.entries(Apocalypse.skill)) {
                                switch (key) {
                                    case '1':
                                        str6 += `手牌数大于等于${value}张时,自身所有技能失效<p>`;
                                        break;
                                    case '2':
                                        str6 += `每个回合开始时,你交给每名敌方角色各随机${value}张非牌库牌<p>`;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                        str += str6;
                    }
                    for (var i = 0; i < effects.length; i++) {
                        if (str != "") str += "<p>";
                        str += "<br>" + game.effectPack[effects[i]].info;
                    }
                    if (!effects.length) str += "<p><br>无特殊效果";
                } else if (type == 'spoil') {
                    var spoils = playList[num].spoils.slice(0);
                    for (var i = 0; i < spoils.length; i++) {
                        if (str != "") str += "<p>";
                        str += "<br>" + spoils[i].name;
                    }
                    if (!spoils.length) str += "<p><br>无战利品";
                } else if (type == 'info') {
                    var info = '<p>' + get.characterIntro(playList[num].name);
                    str += info;
                    if (info == '') str = "<p><br>无背景资料";
                }
                text.innerHTML = str;
            };
            function func(str) {
                var buttonDiv = ui.create.div('.taixuhuanjing_lookEventHomeTextDiv', '' + str + '');
                buttonDiv.listen(function (e) {
                    game.txhj_playAudioCall('WinButton', null, true);
                    this.choiced();
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
                buttonDiv.choiced = function () {
                    if (textTitle.choosingNow) {
                        textTitle.choosingNow.noChoiced();
                    }
                    textTitle.choosingNow = this;
                    buttonDiv.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button10.png');
                    if (str == '技能') {
                        text.update('skill');
                    } else if (str == '特殊效果') {
                        text.update('effect');
                    } else if (str == '战利品') {
                        text.update('spoil');
                    } else if (str == '背景') {
                        text.update('info');
                    }
                };
                buttonDiv.noChoiced = function () {
                    textTitle.choosingNow = null;
                    buttonDiv.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button9.png');
                };
                if (str == '技能') {
                    buttonDiv.choiced();
                };
                return buttonDiv;
            };
            var list = ['技能', '特殊效果', '战利品', '背景'];
            while (list.length) {
                textTitle.appendChild(func(list.shift()));
            };
        };
        textBox.update();
        var button = ui.create.div('.taixuhuanjing_lookEventHomeButton', '挑战', box);
        button.addEventListener("click", function (e) {
            game.txhj_playAudioCall('WinButton', null, true);
            var number = 1 + game.eventPack[node.season][node.chapter][node.id].enemy.length + game.eventPack[node.season][node.chapter][node.id].friend.length;
            _status.TaiXuHuanJingGame.number = number;
            _status.TaiXuHuanJingGame.premise = game.eventPack[node.season][node.chapter][node.id].premise;
            _status.TaiXuHuanJingGame.event = node;
            _status.TaiXuHuanJingGame.season = lib.config.taixuhuanjing.season;
            _status.TaiXuHuanJingGame.chapter = lib.config.taixuhuanjing.chapter;
            _status.TaiXuHuanJingGame.enemy = game.eventPack[node.season][node.chapter][node.id].enemy.slice(0);
            _status.TaiXuHuanJingGame.friend = game.eventPack[node.season][node.chapter][node.id].friend.slice(0);
            _status.TaiXuHuanJingGame.cards = lib.config.taixuhuanjing.cards;
            _status.TaiXuHuanJingGame.skills = lib.config.taixuhuanjing.useSkills;
            _status.gameStart = undefined;
            game.txhj_playAudioCall('QuickStart', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            view.off(true);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        home.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookStore = function (node, view) {//创建商店
        var home = ui.create.div('.taixuhuanjing_lookEventHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        let skillList = [];
        for (let item of txhjPack.skillRank) {
            const skillID = item.skillID;
            if (get.info(skillID) && !lib.translate[skillID + '_info']) {
                continue;
            }
            skillList.add(skillID);
        }

        if (lib.config.mode_config.taixuhuanjing.quankuojineng) {
            var characterList = _status.connectMode ? get.charactersOL() : Object.keys(lib.character).filter(i => !lib.filter.characterDisabled2(i) && !lib.filter.characterDisabled(i));
            for (var i of characterList) {
                skillList.addArray((lib.character[i][3] || []).filter(skill => {
                    var info = get.info(skill);
                    return info && !info.zhuSkill && !info.hiddenSkill;
                }));
            }
        }

        game.taixuUIupdata(homeBody, true, 1.8, 0.7);

        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var level = changePack[node.id].level;

        var createCard = function (cardName) {
            var card = {
                name: cardName,
                suit: ['spade', 'heart', 'club', 'diamond'].randomGet(),
                number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].randomGet(),
                nature: ['', 'fire', 'thunder'].randomGet()
            };
            return card;
        };

        if (!lib.config.taixuhuanjing.store) {
            lib.config.taixuhuanjing.store = {};
        }
        if (!lib.config.taixuhuanjing.store[node.season]) {
            lib.config.taixuhuanjing.store[node.season] = {};
        }
        if (!lib.config.taixuhuanjing.store[node.season][node.chapter]) {
            lib.config.taixuhuanjing.store[node.season][node.chapter] = {};
        }

        if (!lib.config.taixuhuanjing.store[node.season][node.chapter][node.id]) {
            const levelConfig = {
                1: { cardRank: 3, skillRank: 3, buffRank: 3, cardCount: 4, equipCount: 4 },
                2: { cardRank: 4, skillRank: 4, buffRank: 4, buffCount: 4, skillCount: 4 },
                3: { cardRank: 2, skillRank: 2, buffRank: 2, cardCount: 3, equipCount: 3, buffCount: 3, skillCount: 3 },
                4: { cardRank: 2, skillRank: 2, buffRank: 2, cardCount: 6, equipCount: 6, buffCount: 6, skillCount: 6 },
                5: { cardRank: 5, skillRank: 3, buffRank: 4, cardCount: 2, equipCount: 5, buffCount: 3, skillCount: 5 },
                6: { cardRank: 4, skillRank: 2, buffRank: 5, cardCount: 3, equipCount: 4, skillCount: 4 }
            };

            const config = levelConfig[level];

            const cards = txhjPack.cardPack.filter(item => {
                const num = get.cardRank(item.cardID);
                const valid = lib.translate[item.cardID] &&
                    ((level === 1 && num < config.cardRank) ||
                        (level === 2 && num < config.cardRank) ||
                        (level === 3 && num > config.cardRank) ||
                        (level === 4 && num > config.cardRank) ||
                        (level === 5 && num <= config.cardRank) ||
                        (level === 6 && num < config.cardRank));
                return valid && get.type(item.cardID) !== 'equip';
            }).map(item => item.cardID);

            const equip = txhjPack.cardPack.filter(item => {
                const num = get.cardRank(item.cardID);
                const valid = lib.translate[item.cardID] &&
                    ((level === 1 && num < config.cardRank) ||
                        (level === 2 && num < config.cardRank) ||
                        (level === 3 && num > config.cardRank) ||
                        (level === 4 && num > config.cardRank) ||
                        (level === 5 && num <= config.cardRank) ||
                        (level === 6 && num < config.cardRank));
                return valid && get.type(item.cardID) === 'equip';
            }).map(item => item.cardID);

            const skills = txhjPack.skillRank.filter(item => {
                const num = get.skillRank(item.skillID);
                const skillID = item.skillID;
                return get.info(skillID) && lib.translate[skillID + '_info'] && !lib.config.taixuhuanjing.useSkills.includes(skillID) &&
                    ((level === 1 && num < config.skillRank) ||
                        (level === 2 && num < config.skillRank) ||
                        (level === 3 && num > config.skillRank) ||
                        (level === 4 && num > config.skillRank) ||
                        (level === 5 && num > config.skillRank) ||
                        (level === 6 && num < config.skillRank));
            }).map(item => item.skillID);

            const buffs = Object.keys(buffPack).filter(i => {
                const num = buffPack[i].rank;
                return buffPack[i].store !== false &&
                    !lib.config.taixuhuanjing.buff.includes(i) &&
                    ((level === 1 && num <= config.buffRank) ||
                        (level === 2 && num <= config.buffRank) ||
                        (level === 3 && num > config.buffRank) ||
                        (level === 4 && num > config.buffRank) ||
                        (level === 5 && num <= config.buffRank) ||
                        (level === 6 && num <= config.buffRank));
            });

            const cards2 = [], equips = [], buffs2 = [], skills2 = [];

            if (config.cardCount) {
                while (cards2.length < config.cardCount && cards.length) {
                    cards2.push(createCard(cards.randomRemove()));
                }
            }

            if (config.equipCount) {
                while (equips.length < config.equipCount && equip.length) {
                    equips.push(createCard(equip.randomRemove()));
                }
            }

            if (config.buffCount) {
                while (buffs2.length < config.buffCount && buffs.length) {
                    buffs2.push(buffs.randomRemove());
                }
            }

            if (config.skillCount) {
                while (skills2.length < config.skillCount && skills.length) {
                    skills2.push(skills.randomRemove());
                }
            }

            var store = {
                cardNum: 0,
                buffNum: 0,
                skillNum: 0,
                equipNum: 0,
                skills: skills2,
                buff: buffs2,
                equip: equips,
                cards: cards2
            };
            lib.config.taixuhuanjing.store[node.season][node.chapter][node.id] = store;
            game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
        }

        if (!lib.config.taixuhuanjing.store) {
            lib.config.taixuhuanjing.store = {};
        }
        if (!lib.config.taixuhuanjing.store[node.season]) {
            lib.config.taixuhuanjing.store[node.season] = {};
        }
        if (!lib.config.taixuhuanjing.store[node.season][node.chapter]) {
            lib.config.taixuhuanjing.store[node.season][node.chapter] = {};
        }
        if (!lib.config.taixuhuanjing.store[node.season][node.chapter][node.id]) createstorefiles();

        var coinBody = ui.create.div('.taixuhuanjing_consoledeskCoinBody2', homeBody);
        var coinIcon = ui.create.div('.taixuhuanjing_consoledeskCoinIcon', coinBody);
        var coinNum = ui.create.div('.taixuhuanjing_consoledeskCoinNum2', '' + lib.config.taixuhuanjing.coin + '', coinBody);
        coinNum.update = function () {
            coinNum.innerHTML = lib.config.taixuhuanjing.coin + '';
        };

        var statusstoremode = "buy";
        var box = ui.create.div('.taixuhuanjing_lookShopHomeBox', homeBody);
        var boxComps = {
            imp: (function () {
                var ext = changePack[node.id].ext;
                var imp = ui.create.div('.taixuhuanjing_lookShopHomeBoxImp');
                imp.setBackgroundImage('extension/太虚幻境/image/big_bg/rogue_shop_' + ext + '.png');
                return imp;
            })(),
            buttonbg: (function () {
                var buttonbg = ui.create.div('.taixuhuanjing_lookShopHomeBoxButtonbg');
                var textTitle = ui.create.div('.taixuhuanjing_lookShopHomeBoxButtonTitle', buttonbg);
                var textBox = ui.create.div('.taixuhuanjing_lookShopHomeBoxButtonBox', buttonbg);
                lib.setScroll(textBox);
                var bottom = ui.create.div('.taixuhuanjing_lookShopHomeBoxBottom', buttonbg);
                bottom.update = function (type) {
                    bottom.innerHTML = '';
                    if (type == '祝福') {
                        bottom.innerHTML = '每次购买一项' + type + '，额外消耗金币+300，当前已+' + lib.config.taixuhuanjing.shop.buffNum * 300;
                    } else if (type == '装备') {
                        bottom.innerHTML = ['有一人前来买刀', '老板，你这连弩怎么卖？', '盗版连弩两百块钱一件', '你嫌贵，我还嫌贵呢', '你瞧瞧现在牌堆里哪有装备牌？', '你是来找茬的吧，就问你要不要吧?'].randomGet();
                        if (lib.config.taixuhuanjing.shop.equipNum > 0) {
                            bottom.innerHTML = '每次购买一件' + type + '，额外消耗金币+200，当前已+' + lib.config.taixuhuanjing.shop.equipNum * 200;
                        }
                    } else if (type == '技能') {
                        bottom.innerHTML = ['失传秘籍十块钱一本', '在我这下过单的都脱单了'].randomGet();
                        if (lib.config.taixuhuanjing.shop.skillNum > 0) {
                            bottom.innerHTML = '每次购买一项' + type + '，额外消耗金币+200，当前已+' + lib.config.taixuhuanjing.shop.skillNum * 200;
                        }
                    } else if (type == '卡牌') {
                        bottom.innerHTML = ['鸡汤来咯！快！趁热喝！', '卖桃子咯，两块一斤，一斤两块', '走过路过 不要错过', '客官要不要来两斤上好的酒?'].randomGet();
                        if (lib.config.taixuhuanjing.shop.cardNum > 0) {
                            bottom.innerHTML = '每次购买一张' + type + '，额外消耗金币+200，当前已+' + lib.config.taixuhuanjing.shop.cardNum * 200;
                        }
                    }
                };

                _status.onmousewheel = true;
                textBox.onmousewheel = function (evt) {
                    if (_status.onmousewheel == false) return;
                    var node = this;
                    var num = 20;
                    var speed = 20;
                    clearInterval(node.interval);
                    evt.preventDefault();
                    if (evt.detail > 0 || evt.wheelDelta < 0) {
                        node.interval = setInterval(function () {
                            if (num-- && Math.abs(node.scrollLeft + node.clientWidth - node.scrollWidth) > 0) {
                                node.scrollLeft += speed;
                            } else {
                                clearInterval(node.interval);
                            }
                        }, 16);
                    } else {
                        node.interval = setInterval(function () {
                            if (num-- && node.scrollLeft > 0) {
                                node.scrollLeft -= speed;
                            } else {
                                clearInterval(node.interval);
                            }
                        }, 16);
                    }
                };

                // 封装创建商品 div 的函数
                function createItemDiv(itemType, item, isBuyMode) {
                    var div = ui.create.div('.taixuhuanjing_lookShopHomeBoxCardDiv');
                    var name, value, rank, skillInfo;
                    if (itemType === 'skill') {
                        if (item == '技能槽') {
                            name = '技能槽';
                            rank = 1;
                            const skillbuyNum = lib.config.taixuhuanjing.shop.skillbuyNum || 0;
                            value = isBuyMode ? 1000 + (500 * skillbuyNum) : 500;
                            skillInfo = '一个空置的技能槽';
                        } else {
                            name = get.translation(item);
                            rank = get.skillRank(item);
                            value = isBuyMode ? get.skillValue(item) + (lib.config.taixuhuanjing.shop.skillNum * 200) : get.skillValue(item) / 2;
                            skillInfo = '&emsp;&emsp;' + lib.translate[item + '_info'];
                        }
                        div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_rank' + rank + '.png');
                        var divTitle = ui.create.div('.taixuhuanjing_CardStyleDivTitle', '武将技', div);
                        var skillTitle = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillTitle', div);
                        var skillName1 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillName1', '' + name + '', skillTitle);
                        var skillName2 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillName2', '' + name + '', skillTitle);
                        var skillText1 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillText1', div);
                        var skillText2 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillText2', '' + skillInfo + '', skillText1);
                        lib.setScroll(skillText2);
                        skillText2.onmouseover = () => _status.onmousewheel = false;
                        skillText2.onmouseout = () => _status.onmousewheel = true;
                    } else if (itemType === 'buff') {
                        name = buffPack[item].name;
                        rank = buffPack[item].rank;
                        value = isBuyMode ? buffPack[item].value + (lib.config.taixuhuanjing.shop.buffNum * 300) : Math.ceil(buffPack[item].value / 2);
                        div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_rank' + rank + '.png');
                        var divTitle = ui.create.div('.taixuhuanjing_BuffStyleDivTitle', '' + name + '', div);
                        var divBg = ui.create.div('.taixuhuanjing_BuffStyleDivBg', div);
                        var divIcon = ui.create.div('.taixuhuanjing_BuffStyleDivIcon', divBg);
                        game.promises.checkFile('extension/太虚幻境/image/buff/' + item + '.png').then(function (result) {
                            if (result === 1) {
                                divIcon.setBackgroundImage('extension/太虚幻境/image/buff/' + item + '.png');
                            } else {
                                console.log('未找到图片：' + 'extension/太虚幻境/image/buff/' + item + '.png');
                                divIcon.setBackgroundImage('extension/太虚幻境/image/buff/moren.png');
                            }
                        });
                        // divIcon.setBackgroundImage('extension/太虚幻境/image/buff/' + item + '.png');
                        var divInfo = ui.create.div('.taixuhuanjing_BuffStyleDivInfo', div);
                        var buffinfo = buffPack[item].info;
                        if (buffPack[item].restore == true) {
                            buffinfo += "(当前拥有" + lib.config.taixuhuanjing[item] + "颗)";
                        }
                        divInfo.innerHTML = buffinfo;
                    } else if (itemType === 'cards' || itemType === 'equip') {
                        name = get.translation(item.name);
                        game.addCardStyle(item, div);
                        value = isBuyMode ? get.cardValue(item.name) + (lib.config.taixuhuanjing.shop.cardNum * 200) : get.cardValue(item.name) / 2;
                    }
                    var itemTypelist = {
                        skill: '技能',
                        buff: '祝福',
                        cards: '卡牌',
                        equip: '装备'
                    };
                    var divButton = ui.create.div('.taixuhuanjing_lookShopHomeBoxDivButton', '' + value + '', div);
                    if (value > 999) divButton.style.textIndent = '1.5vw';

                    divButton.listen(function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        var action = isBuyMode ? '购买' : '出售';
                        var str = `是否花费金币*${value}${action}${itemTypelist[itemType]}【${name}】？`;
                        game.purchasePrompt(`${action}${itemTypelist[itemType]}`, str, homeBody, function (bool) {
                            if (bool) {
                                if (isBuyMode) {
                                    handleBuy(itemType, item, value, itemTypelist[itemType], name);
                                } else {
                                    handleSell(itemType, item, value, itemTypelist[itemType], name);
                                }
                                view.update();
                                bottom.update(itemTypelist[itemType]);
                                textBox.update(itemType);
                                coinNum.update();
                            }
                        });
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    });

                    return div;
                }

                function handleBuy(itemType, item, cost, Typename, name) {
                    if (lib.config.taixuhuanjing.coin >= cost) {
                        lib.config.taixuhuanjing.coin -= cost;
                        if (itemType === 'skill') {
                            if (item == '技能槽') {
                                lib.config.taixuhuanjing.shop.skillbuyNum++;
                                lib.config.taixuhuanjing.maxSkills++;
                            } else {
                                lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].skills.remove(item);
                                if (lib.config.taixuhuanjing.useSkills.length < lib.config.taixuhuanjing.maxSkills) {
                                    lib.config.taixuhuanjing.useSkills.add(item);
                                } else if (!lib.config.taixuhuanjing.skills.includes(item)) {
                                    lib.config.taixuhuanjing.skills.add(item);
                                }
                            }
                        } else if (itemType === 'buff') {
                            if (buffPack[item].restore == true) {
                                if (!lib.config.taixuhuanjing[item]) {
                                    lib.config.taixuhuanjing[item] = 0;
                                }
                                lib.config.taixuhuanjing[item]++;
                                if (buffPack[item].health > 0) {
                                    lib.config.taixuhuanjing.maxHp += buffPack[item].health;
                                    lib.config.taixuhuanjing.hp += buffPack[item].health;
                                }
                            } else {
                                if (lib.config.taixuhuanjing.buff.includes("buff_txhj_juguzhidao") && lib.config.taixuhuanjing.juguzhidao.buffNum == false) {
                                    lib.config.taixuhuanjing.juguzhidao.buffNum == true;
                                } else {
                                    lib.config.taixuhuanjing.shop.buffNum++;
                                }
                            }
                            lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].buff.remove(item);
                            lib.config.taixuhuanjing.buff.add(item);
                        } else if (itemType === 'cards') {
                            lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].cards.remove(item);
                            lib.config.taixuhuanjing.cards.add(item);
                            if (lib.config.taixuhuanjing.buff.includes("buff_txhj_juguzhidao") && lib.config.taixuhuanjing.juguzhidao.cardNum == false) {
                                lib.config.taixuhuanjing.juguzhidao.cardNum == true;
                            } else {
                                lib.config.taixuhuanjing.shop.cardNum++;
                            }
                        } else if (itemType === 'equip') {
                            lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].equip.remove(item);
                            const subType = get.subtype(item.name);
                            if (subType !== 'equip5' && subType !== 'equip6' && !lib.config.taixuhuanjing[subType]) {
                                lib.config.taixuhuanjing[subType] = item;
                            } else {
                                lib.config.taixuhuanjing.equips.add(item);
                            }
                            if (lib.config.taixuhuanjing.buff.includes("buff_txhj_juguzhidao") && lib.config.taixuhuanjing.juguzhidao.equipNum == false) {
                                lib.config.taixuhuanjing.juguzhidao.equipNum == true;
                            } else {
                                lib.config.taixuhuanjing.shop.equipNum++;
                            }
                        }
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        game.messagePopup(`购买${Typename}【${name}】成功`);
                        lib.config.taixuhuanjing.usecoin += cost;
                        if (lib.config.taixuhuanjing.usecoin - 1200 > 0 && lib.config.taixuhuanjing.buff.includes("txhj_kongquemwSkill3") && lib.config.taixuhuanjing.usebuff > 0) {
                            lib.config.taixuhuanjing.usebuff--;
                            lib.config.taixuhuanjing.usecoin -= 1200;
                            const buffe = ['buff_txhj_pozhenzhifeng', 'buff_txhj_yanhuozhiren', 'buff_txhj_xianhujiqu', 'buff_txhj_fuchendangmo', 'buff_txhj_shenfuhuaxie', 'buff_txhj_juejingzhice', 'buff_txhj_wuzhongshengshan', 'buff_txhj_wuzhongshengsha'];
                            const random = Object.keys(buffPack).filter(i => buffPack[i].store !== false && buffPack[i].restore != true && !lib.config.taixuhuanjing.buff.includes(i) && !buffe.includes(i)).randomGet();
                            if (random) {
                                lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].buff.remove(random);
                                lib.config.taixuhuanjing.buff.add(random);
                                game.messagePopup(`碧语灵裳发动,获得祝福${buffPack[random].name}`);
                                view.update();
                            }
                        }
                    } else {
                        game.messagePopup('金币不足');
                    }
                }

                function handleSell(itemType, item, gain, Typename, name) {
                    lib.config.taixuhuanjing.coin += gain;
                    if (itemType === 'skill') {
                        if (item == '技能槽') {
                            lib.config.taixuhuanjing.maxSkills--;
                        } else {
                            lib.config.taixuhuanjing.useSkills.remove(item);
                        }
                    } else if (itemType === 'buff') {
                        if (buffPack[item].restore == true) {
                            lib.config.taixuhuanjing[item]--;
                            if (lib.config.taixuhuanjing[item] <= 0) {
                                lib.config.taixuhuanjing.buff.remove(item);
                            }
                            if (buffPack[item].health > 0) {
                                lib.config.taixuhuanjing.maxHp -= buffPack[item].health;
                            }
                        } else {
                            lib.config.taixuhuanjing.buff.remove(item);
                        }
                    } else if (itemType === 'cards') {
                        lib.config.taixuhuanjing.cards.remove(item);
                    } else if (itemType === 'equip') {
                        if (lib.config.taixuhuanjing.equips.includes(item)) {
                            lib.config.taixuhuanjing.equips.remove(item);
                        } else {
                            for (let i = 1; i <= 4; i++) {
                                const eqKey = 'equip' + i;
                                const eqional = lib.config.taixuhuanjing[eqKey];
                                if (eqional && eqional == item) {
                                    lib.config.taixuhuanjing[eqKey] = null;
                                }
                            }
                        }
                    }
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                    game.messagePopup(`出售${Typename}【${name}】成功`);
                }
                function refreshstorefiles(type) {
                    if (type === "cards") {
                        var cards4 = txhjPack.cardPack
                            .filter(item => lib.translate[item.cardID] && get.type(item.cardID) !== 'equip')
                            .map(item => item.cardID);
                        var cards5 = [];
                        while (cards5.length < 2) {
                            cards5.push(createCard(cards4.randomRemove()));
                        }
                        lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].cards = cards5;
                    } else if (type === "equip") {
                        var equip4 = txhjPack.cardPack
                            .filter(item => lib.translate[item.cardID] && get.type(item.cardID) === 'equip')
                            .map(item => item.cardID);
                        var equip5 = [];
                        while (equip5.length < 2) {
                            equip5.push(createCard(equip4.randomRemove()));
                        }
                        lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].equip = equip5;
                    } else if (type === "buff") {
                        var buff4 = Object.keys(buffPack)
                            .filter(i => buffPack[i].store !== false && !lib.config.taixuhuanjing.buff.includes(i));
                        if (buff4.length > 2) buff4 = buff4.randomGets(2);
                        lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].buff = buff4;
                    } else if (type === "skill") {
                        var skills4 = skillList.filter(i => !lib.config.taixuhuanjing.useSkills.includes(i));
                        if (skills4.length > 2) skills4 = skills4.randomGets(2);
                        lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].skills = skills4;
                    }
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                }
                var storefilenow = [];
                textBox.update = function (type) {
                    storefilenow = type;
                    textBox.innerHTML = '';
                    var items = [];
                    if (statusstoremode === "buy") {
                        if (type === 'skill') {
                            items = lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].skills.slice(0);
                            items.push('技能槽')
                        } else if (type === 'buff') {
                            items = lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].buff.slice(0);
                        } else if (type === 'cards') {
                            items = lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].cards.slice(0);
                        } else if (type === 'equip') {
                            items = lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].equip.slice(0);
                        }
                        while (items.length) {
                            textBox.appendChild(createItemDiv(type, items.shift(), true));
                        }
                    } else {
                        if (type === 'skill') {
                            items = lib.config.taixuhuanjing.useSkills.slice(0).filter(skill => {
                                const effect = game.effectPack[lib.config.taixuhuanjing.effect] || [];
                                if (effect.skill?.includes(skill)) return false;
                                return true;
                            });
                            while (items.length) {
                                textBox.appendChild(createItemDiv(type, items.shift(), false));
                            }
                            if (lib.config.taixuhuanjing.useSkills.length < lib.config.taixuhuanjing.maxSkills) {
                                textBox.appendChild(createItemDiv(type, "技能槽", false));
                            }
                        } else if (type === 'buff') {
                            var buffe = ['buff_txhj_pozhenzhifeng', 'buff_txhj_yanhuozhiren', 'buff_txhj_xianhujiqu', 'buff_txhj_fuchendangmo', 'buff_txhj_shenfuhuaxie', 'buff_txhj_juejingzhice', 'buff_txhj_wuzhongshengshan', 'buff_txhj_wuzhongshengsha'];
                            items = Object.keys(buffPack).filter(i => buffPack[i].store !== false && buffPack[i].restore != true && lib.config.taixuhuanjing.buff.includes(i) && !buffe.includes(i));
                            while (items.length) {
                                textBox.appendChild(createItemDiv(type, items.shift(), false));
                            }
                        } else if (type === 'cards') {
                            items = lib.config.taixuhuanjing.cards.slice(0);
                            while (items.length) {
                                textBox.appendChild(createItemDiv(type, items.shift(), false));
                            }
                        } else if (type === 'equip') {
                            items = [];
                            for (let i = 1; i <= 4; i++) {
                                const eqKey = 'equip' + i;
                                const eqional = lib.config.taixuhuanjing[eqKey];
                                if (eqional && eqional != null) {
                                    items.push(lib.config.taixuhuanjing[eqKey]);
                                }
                            }
                            for (let i of lib.config.taixuhuanjing.equips) {
                                items.push(i);
                            }
                            while (items.length) {
                                textBox.appendChild(createItemDiv(type, items.shift(), false));
                            }
                        }
                    }
                };

                var SellButton = ui.create.div('.taixuhuanjing_storeSellFileButton', homeBody);
                SellButton.innerHTML = "进入当铺";
                SellButton.addEventListener('click', function () {
                    game.txhj_playAudioCall('WinButton', null, true);
                    statusstoremode = statusstoremode === "buy" ? "sell" : "buy";
                    SellButton.innerHTML = statusstoremode === "buy" ? "进入当铺" : "返回商店";
                    view.update();
                    textBox.update(storefilenow);
                });

                var refreshButton = ui.create.div('.taixuhuanjing_storeFileRefreshButton', homeBody);
                refreshButton.addEventListener('click', function () {
                    game.txhj_playAudioCall('WinButton', null, true);
                    if (statusstoremode === "buy") {
                        var cost = 100;
                        if (lib.config.taixuhuanjing.coin < cost) {
                            game.messagePopup('金币不足');
                            return;
                        } else {
                            lib.config.taixuhuanjing.coin -= cost;
                            game.messagePopup('刷新成功，金币-' + cost);
                            lib.config.taixuhuanjing.usecoin += cost;
                            if (lib.config.taixuhuanjing.usecoin - 1200 > 0 && lib.config.taixuhuanjing.buff.includes("txhj_kongquemwSkill3") && lib.config.taixuhuanjing.usebuff > 0) {
                                lib.config.taixuhuanjing.usebuff--;
                                lib.config.taixuhuanjing.usecoin -= 1200;
                                const buffe = ['buff_txhj_pozhenzhifeng', 'buff_txhj_yanhuozhiren', 'buff_txhj_xianhujiqu', 'buff_txhj_fuchendangmo', 'buff_txhj_shenfuhuaxie', 'buff_txhj_juejingzhice', 'buff_txhj_wuzhongshengshan', 'buff_txhj_wuzhongshengsha'];
                                const random = Object.keys(buffPack).filter(i => buffPack[i].store !== false && buffPack[i].restore != true && !lib.config.taixuhuanjing.buff.includes(i) && !buffe.includes(i)).randomGet();
                                if (random) {
                                    lib.config.taixuhuanjing.store[node.season][node.chapter][node.id].buff.remove(random);
                                    lib.config.taixuhuanjing.buff.add(random);
                                    game.messagePopup(`碧语灵裳发动,获得祝福${buffPack[random].name}`);
                                    view.update();
                                }
                            }
                            coinNum.update();
                            refreshstorefiles(storefilenow);
                            textBox.update(storefilenow);
                        }
                    } else {
                        game.messagePopup('当前无内容可刷新');
                    }
                });

                var buttonText = '';
                function func(str) {
                    var buttonDiv = ui.create.div('.taixuhuanjing_lookShopHomeBoxButtonTextDiv', str);
                    buttonDiv.listen(function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        this.choiced();
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    buttonDiv.choiced = function () {
                        if (textTitle.choosingNow) {
                            textTitle.choosingNow.noChoiced();
                        }
                        textTitle.choosingNow = this;
                        buttonDiv.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button10.png');
                        if (str === '技能') {
                            bottom.update('技能');
                            textBox.update('skill');
                        } else if (str === '祝福') {
                            bottom.update('祝福');
                            textBox.update('buff');
                        } else if (str === '装备') {
                            bottom.update('装备');
                            textBox.update('equip');
                        } else if (str === '卡牌') {
                            bottom.update('卡牌');
                            textBox.update('cards');
                        }
                    };
                    buttonDiv.noChoiced = function () {
                        textTitle.choosingNow = null;
                        buttonDiv.setBackgroundImage('extension/太虚幻境/image/icon/icon_Button9.png');
                    };
                    if (str === buttonText) {
                        buttonDiv.choiced();
                    }
                    return buttonDiv;
                }
                let list;
                if (node.name == '私兵黑市') {
                    list = ['装备', '卡牌'];
                } else if (node.name == '暗巷红楼') {
                    list = ['技能', '祝福'];
                } else {
                    list = ['技能', '祝福', '装备', '卡牌'];
                }
                buttonText = list[0];
                while (list.length) {
                    textTitle.appendChild(func(list.shift()));
                }
                return buttonbg;
            })()
        };

        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }

        home.addEventListener("click", function (e) {
            game.txhj_playAudioCall('off', null, true);
            home.delete();
            game.taixuUIupdata(homeBody, false);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookEquip = function (view, type) {
        if (type && !lib.config.taixuhuanjing.equips.length) return;
        var home = document.getElementById('taixuhuanjing_adjustHome');
        if (home) return;
        var home = ui.create.div('#taixuhuanjing_adjustHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.7);
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookEquipHomeBox', homeBody);
        var list1 = [lib.config.taixuhuanjing.equip1, lib.config.taixuhuanjing.equip2, lib.config.taixuhuanjing.equip3, lib.config.taixuhuanjing.equip4];
        var list2 = lib.config.taixuhuanjing.equips.slice(0);
        var boxComps = {
            title: (function () {
                var title = ui.create.div('.taixuhuanjing_lookEquipHomeBoxTitle', '调整装备');
                return title;
            })(),
            text1: (function () {
                var text1 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxText', '当前携带装备');
                return text1;
            })(),
            equipBody: (function () {
                var equipBody = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipBody');

                function func(name) {
                    var equipDiv = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDiv');
                    equipDiv.nodes = {
                        use: false,
                        num: 0,
                    };
                    if (name == '武器栏') {
                        if (list1[0] != null) {
                            var card = list1[0];
                            var card2 = game.createCard(card.name, card.suit, card.number);
                            card2.style.width = '95%';
                            card2.style.height = '95%';
                            card2.style.zIndex = 1;
                            card2.style.bottom = '2%';
                            card2.querySelector('.image').style.backgroundPosition = '65% 0';
                            card2.style["transform-origin"] = "center center";
                            equipDiv.appendChild(card2);
                            equipDiv.nodes.use = true;
                            equipDiv.nodes.num = 0;
                        } else {
                            var equipText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDivText', '' + name + '', equipDiv);
                        }
                    } else if (name == '防具栏') {
                        if (list1[1] != null) {
                            var card = list1[1];
                            var card2 = game.createCard(card.name, card.suit, card.number);
                            card2.style.width = '95%';
                            card2.style.height = '95%';
                            card2.style.zIndex = 1;
                            card2.style.bottom = '2%';
                            card2.querySelector('.image').style.backgroundPosition = '65% 0';
                            card2.style["transform-origin"] = "center center";
                            equipDiv.appendChild(card2);
                            equipDiv.nodes.use = true;
                            equipDiv.nodes.num = 1;
                        } else {
                            var equipText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDivText', '' + name + '', equipDiv);
                        }
                    } else if (name == '宝物栏1') {
                        if (list1[2] != null) {
                            var card = list1[2];
                            var card2 = game.createCard(card.name, card.suit, card.number);
                            card2.style.width = '96%';
                            card2.style.height = '96%';
                            card2.style.zIndex = 1;
                            card2.style.bottom = '2%';
                            card2.querySelector('.image').style.backgroundPosition = '65% 0';
                            card2.style["transform-origin"] = "center center";
                            equipDiv.appendChild(card2);
                            equipDiv.nodes.use = true;
                            equipDiv.nodes.num = 2;
                        } else {
                            var equipText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDivText', '' + name + '', equipDiv);
                        }
                    } else if (name == '宝物栏2') {
                        if (list1[3] != null) {
                            var card = list1[3];
                            var card2 = game.createCard(card.name, card.suit, card.number);
                            card2.style.width = '95%';
                            card2.style.height = '95%';
                            card2.style.zIndex = 1;
                            card2.style.bottom = '2%';
                            card2.querySelector('.image').style.backgroundPosition = '65% 0';
                            card2.style["transform-origin"] = "center center";
                            equipDiv.appendChild(card2);
                            equipDiv.nodes.use = true;
                            equipDiv.nodes.num = 3;
                        } else {
                            var equipText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDivText', '' + name + '', equipDiv);
                        }
                    }
                    equipDiv.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (!type) return;
                        if (equipDiv.nodes.use == false) return;
                        equipDiv.update();
                        /* let index = equipDiv.nodes.num;
                         let equip = list1[index];
                         if (equip) {
                             list2.push(equip);
                             list1[index] = null;
                         }
                         game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                         boxComps.equipBody.update();
                         boxComps.equipBody3.update();*/
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    equipDiv.update = function () {
                        equipDiv.innerHTML = '';
                        var equipText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDivText', '' + name + '', equipDiv);
                        game.equipBuffUpdate(list1[equipDiv.nodes.num], false);
                        list2.push(list1[equipDiv.nodes.num]);
                        list1[equipDiv.nodes.num] = null;
                        boxComps.equipBody3.update();
                    }
                    return equipDiv;
                };
                equipBody.update = function () {
                    equipBody.innerHTML = '';
                    var list = ['武器栏', '防具栏', '宝物栏1', '宝物栏2'];
                    while (list.length) {
                        equipBody.appendChild(func(list.shift()));
                    };
                };
                equipBody.update();
                return equipBody;
            })(),
            equipBody2: (function () {
                var equipBody2 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipBody2');
                return equipBody2;
            })(),
            text2: (function () {
                var text2 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxText2', '备选装备');
                return text2;
            })(),
            equipBody3: (function () {
                var equipBody3 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipBody3');
                equipBody3.onmousewheel = function (evt) {
                    var node = this;
                    var num = 20;
                    var speed = 20;
                    clearInterval(node.interval);
                    evt.preventDefault();
                    if (evt.detail > 0 || evt.wheelDelta < 0) {
                        node.interval = setInterval(function () {
                            if (num-- && Math.abs(node.scrollLeft + node.clientWidth - node.scrollWidth) > 0) {
                                node.scrollLeft += speed;
                            }
                            else {
                                clearInterval(node.interval);
                            }
                        }, 16);
                    }
                    else {
                        node.interval = setInterval(function () {
                            if (num-- && node.scrollLeft > 0) {
                                node.scrollLeft -= speed;
                            }
                            else {
                                clearInterval(node.interval);
                            }
                        }, 16);
                    }
                };
                function func2(equip) {
                    var equipDiv = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDiv2');
                    var card2 = game.createCard(equip.name, equip.suit, equip.number);
                    equipDiv.nodes = {
                        use: false,
                    };
                    card2.style.width = '96%';
                    card2.style.height = '96%';
                    card2.style.zIndex = 1;
                    card2.style.bottom = '2%';
                    card2.querySelector('.image').style.backgroundPosition = '65% 0';
                    card2.style["transform-origin"] = "center center";
                    equipDiv.appendChild(card2);
                    for (var i = 0; i < list1.length; i++) {
                        if (list1[i] != null) {
                            if (list1[i].name == equip.name && list1[i].suit == equip.suit && list1[i].number == equip.number) {
                                var equipText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipDivText', '装备中', equipDiv);
                                equipDiv.nodes.use = true;
                                break;
                            }
                        }
                    }
                    equipDiv.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (equipDiv.nodes.use == true) return;
                        if (get.subtype(equip.name) == 'equip1') {
                            if (list1[0] != null) {
                                list2.push(list1[0]);
                            }
                            list1[0] = equip;
                        } else if (get.subtype(equip.name) == 'equip2') {
                            if (list1[1] != null) {
                                list2.push(list1[1]);
                            }
                            list1[1] = equip;
                        } else {
                            if (list1[2] == null) {
                                if (list1[2] != null) {
                                    list2.push(list1[2]);
                                }
                                list1[2] = equip;
                            } else {
                                if (list1[3] != null) {
                                    list2.push(list1[3]);
                                }
                                list1[3] = equip;
                            }
                        }
                        list2.remove(equip);
                        boxComps.equipBody.update();
                        boxComps.equipBody3.update();
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    return equipDiv;
                };
                equipBody3.update = function () {
                    equipBody3.innerHTML = '';
                    var list = list2.slice(0);
                    while (list.length) {
                        equipBody3.appendChild(func2(list.shift()));
                    };
                };
                equipBody3.update();
                return equipBody3;
            })(),
            button: (function () {
                var button = ui.create.div('.taixuhuanjing_lookEquipHomeBoxButton', '确认调整');
                button.addEventListener("click", function (e) {
                    game.txhj_playAudioCall('off', null, true);
                    lib.config.taixuhuanjing.equip1 = list1[0];
                    lib.config.taixuhuanjing.equip2 = list1[1];
                    lib.config.taixuhuanjing.equip3 = list1[2];
                    lib.config.taixuhuanjing.equip4 = list1[3];
                    lib.config.taixuhuanjing.equips = [];
                    game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                    if (view) {
                        setTimeout(function () {
                            view.update();
                        }, 1000);
                    }
                    home.delete();
                    game.taixuUIupdata(homeBody, false);
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
                return button;
            })(),
        }
        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }
        home.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.lookSkill = function (view, type) {
        if (type && !lib.config.taixuhuanjing.skills.length) return;
        var home = document.getElementById('taixuhuanjing_adjustHome');
        if (home) return;
        var home = ui.create.div('#taixuhuanjing_adjustHome');
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_lookEventHomeBody', home);
        homeBody.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        game.taixuUIupdata(homeBody, true, 1.8, 0.7);
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season;
        var chapter = lib.config.taixuhuanjing.chapter;
        var box = ui.create.div('.taixuhuanjing_lookEquipHomeBox', homeBody);
        var infoBox = ui.create.div('.taixuhuanjing_lookEquipHomeSkillInfoBox', homeBody);
        var skillInfo = ui.create.div('.taixuhuanjing_lookEquipHomeSkillInfo', infoBox);
        infoBox.style.display = 'none';

        var list1 = lib.config.taixuhuanjing.useSkills.slice(0);
        var list2 = lib.config.taixuhuanjing.skills.slice(0);
        var maxSkills = lib.config.taixuhuanjing.maxSkills;
        while (list1.length < maxSkills) {
            list1.push(null);
        }
        var boxComps = {
            title: (function () {
                var title = ui.create.div('.taixuhuanjing_lookEquipHomeBoxTitle', '调整技能');
                return title;
            })(),
            text1: (function () {
                var text1 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxText', '当前携带技能');
                return text1;
            })(),
            skillBody: (function () {
                var skillBody = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillBody');
                lib.setScroll(skillBody);
                function func(skillID, num) {
                    var skillButton = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButton');
                    if (skillID != null) {
                        skillButton.setBackgroundImage('extension/太虚幻境/image/icon/icon_skill_true.png');
                        var skillName = get.translation(skillID);
                        var divText2 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButtonText2', '' + skillName + '', skillButton);
                        var divText3 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButtonText3', '' + skillName + '', skillButton);
                    } else {
                        var divText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButtonText1', '技能槽', skillButton);
                    }
                    skillButton.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (!type) return;
                        if (skillID == null) return;
                        skillButton.update();
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    skillButton.update = function () {
                        skillButton.innerHTML = '';
                        skillButton.setBackgroundImage('extension/太虚幻境/image/icon/icon_skill_null.png');
                        var divText = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButtonText1', '技能槽', skillButton);
                        if (!list2.includes(skillID)) {
                            list2.push(skillID);
                        }
                        list1[num] = null;
                        skillID = null;
                        boxComps.skillBody2.update();
                    }
                    skillButton.onmousebuff_txhj_jianyanbaoshi = function () {
                        if (skillID == null) return;
                        var info = "<br>" + get.translation([skillID]) + ":<p>" + lib.translate[skillID + '_info'];
                        skillInfo.innerHTML = info;
                        infoBox.style.display = 'block';
                    };
                    skillButton.onmouseout = function () {
                        infoBox.style.display = 'none';
                    };
                    return skillButton;
                };
                skillBody.update = function () {
                    skillBody.innerHTML = '';
                    var list = list1.slice(0);
                    var num = 0;
                    while (list.length) {
                        skillBody.appendChild(func(list.shift(), num));
                        num++;
                    };
                };
                skillBody.update();
                return skillBody;
            })(),
            skillBody2: (function () {
                var skillBody2 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxEquipBody2');
                lib.setScroll(skillBody2);
                function func2(skillID) {
                    var skillButton = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButton2');
                    skillButton.setBackgroundImage('extension/太虚幻境/image/icon/icon_skill_true.png');
                    var skillName = get.translation(skillID);
                    var divText2 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButtonText2', '' + skillName + '', skillButton);
                    var divText3 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxSkillButtonText3', '' + skillName + '', skillButton);
                    if (list1.includes(skillID)) {
                        skillButton.style.webkitFilter = 'grayscale(1)';
                    }
                    skillButton.addEventListener("click", function (e) {
                        game.txhj_playAudioCall('WinButton', null, true);
                        if (!type) return;
                        if (list1.includes(skillID)) return;
                        skillButton.update();
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                    skillButton.update = function () {
                        var num;
                        for (var i = 0; i < list1.length; i++) {
                            if (list1[i] == null) {
                                list2.remove(skillID);
                                list1[i] = skillID;
                                boxComps.skillBody.update();
                                skillBody2.removeChild(skillButton);
                                skillButton.style.webkitFilter = 'grayscale(1)';
                                break;
                            }
                        }
                    }
                    skillButton.onmouseover = function () {
                        var info = "<br>" + get.translation([skillID]) + ":<p>" + lib.translate[skillID + '_info'];
                        skillInfo.innerHTML = info;
                        infoBox.style.display = 'block';
                    };
                    skillButton.onmouseout = function () {
                        infoBox.style.display = 'none';
                    };
                    return skillButton;
                };
                skillBody2.update = function () {
                    skillBody2.innerHTML = '';
                    var list = list2.slice(0);
                    while (list.length) {
                        skillBody2.appendChild(func2(list.shift()));
                    };
                };
                skillBody2.update();
                return skillBody2;
            })(),
            text2: (function () {
                var text2 = ui.create.div('.taixuhuanjing_lookEquipHomeBoxText2', '备选技能');
                return text2;
            })(),
            button: (function () {
                var button = ui.create.div('.taixuhuanjing_lookEquipHomeBoxButton', '确认调整');
                button.addEventListener("click", function (e) {
                    game.txhj_playAudioCall('off', null, true);
                    if (type) {
                        lib.config.taixuhuanjing.skills = [];
                        lib.config.taixuhuanjing.useSkills = [];
                        for (var i = 0; i < list1.length; i++) {
                            if (list1[i] != null) {
                                lib.config.taixuhuanjing.useSkills.push(list1[i])
                            }
                        }
                        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
                        setTimeout(function () {
                            view.update();
                        }, 1000);
                    }
                    home.delete();
                    game.taixuUIupdata(homeBody, false);
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
                return button;
            })(),
        }
        for (var i in boxComps) {
            box.appendChild(boxComps[i]);
        }
        home.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    };
    game.changeEvent = function (node, view) {
        var events = [];
        var change = [];
        for (let i = 0; i < 3; i++) {
            const optional = lib.config.taixuhuanjing.optional[i];
            if (optional && optional != null && optional.seat != node.seat && optional.change == true) {
                change.push(i);
            }
        }
        for (var i in changePack) {
            if (changePack[i].id) {
                if (node.level >= changePack[i].level) {
                    events.push(changePack[i].id);
                }
            }
        }
        events.randomSort();
        while (change.length) {
            var num = change.shift();
            var event = events.shift();
            lib.config.taixuhuanjing['optional' + num] = changePack[event];
        }
    };
    game.addCharacterDivMobile = function (name, packs, view) {
        var div = ui.create.div('.taixuhuanjing_characterDivMobile', view);
        var intro = lib.character[name];
        if (!intro) {
            for (var i in lib.characterPack) {
                if (lib.characterPack[i][name]) {
                    intro = lib.characterPack[i][name];
                    break;
                }
            }
        }
        var rarity = game.getRarity(name);
        var star;
        switch (rarity) {
            case 'legend': star = 5; break;
            case 'epic': star = 4; break;
            case 'rare': star = 3; break;
            case 'common': star = 2; break;
            default: star = 1;
        }
        //星级修改
        if (lib.config.mode_config.taixuhuanjing.star && lib.config.mode_config.taixuhuanjing.star != 0) star = lib.config.mode_config.taixuhuanjing.star;

        var bg = ui.create.div('.taixuhuanjing_consoledeskPlayBg');
        bg.setBackgroundImage('extension/太虚幻境/image/style/name2_' + intro[1] + '.png');

        var imp = ui.create.div('.taixuhuanjing_consoledeskPlayImp2');
        imp.classList.add("qh-not-replace");
        imp.setBackground(name, 'character');
        const str = imp.style.backgroundImage;
        if (!str) return;
        if (lib.device === 'ios' || lib.device === 'android') {
            if (str && str.trim() !== '') {
                var tmp = str.split('(')[1].split(')')[0];
                if (tmp.indexOf('"') > -1) {
                    tmp = tmp.split('"')[1].split('"')[0];
                } else {
                    tmp = tmp.split('"')[0];
                }
            }
        }

        var firstPromise = new Promise(function (resolve) {
            var img = new Image();
            img.src = lib.assetURL + decodeURI(tmp);
            if (lib.device === 'ios' || lib.device === 'android') {
                img.src = tmp;
            }
            img.onload = function () {
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.width = this.width;
                canvas.height = this.height;
                context.drawImage(img, 0, 0);
                var imageData = context.getImageData(0, 0, 50, 50).data;
                var isAlphaBackground = 0;
                for (var index = 3; index < 100; index += 4) {
                    if (imageData[index] !== 255) {
                        isAlphaBackground++;
                        if (isAlphaBackground >= 25) {
                            resolve();
                            break;
                        }
                    }
                }
            };
        });

        firstPromise.then(function () {
            imp.style.backgroundImage = 'none';
            var imp2 = ui.create.div('.taixuhuanjing_consoledeskPlayImpL', imp);
            imp2.setBackground(name, 'character');
        });

        var namebody = ui.create.div(".taixuhuanjing_characterDivMobileName", lib.translate[name]);

        var rankBody = ui.create.div(".taixuhuanjing_characterDivMobileRankBody");
        while (star--) {
            var starIcon = ui.create.div(".taixuhuanjing_characterDivMobileStarICON", rankBody);
        }

        div.appendChild(bg);
        div.appendChild(imp);
        div.appendChild(namebody);
        div.appendChild(rankBody);
    };
    game.addCardStyle = function (card, view) {
        var rank = get.cardRank(card.name);
        var div = ui.create.div('.taixuhuanjing_CardStyleDiv', view);
        if (rank > 1) {
            if (rank == 2) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_rare.png');
            if (rank == 3) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_epic.png');
            if (rank >= 4) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_legend.png');
            if (rank >= 5) div.setBackgroundImage('extension/太虚幻境/image/style/goods_skill_extra.png');
        };
        var divTitle = ui.create.div('.taixuhuanjing_CardStyleDivTitle', '' + get.translation(card.name) + '', div);
        var divCard = ui.create.div('.taixuhuanjing_CardStyleDivCard', div);
        var card2 = game.createCard(card.name, card.suit, card.number, card.nature);
        card2.style.width = '95%';
        card2.style.height = '95%';
        card2.style.zIndex = 1;
        card2.style.bottom = '2%';
        card2.querySelector('.image').style.backgroundPosition = '65% 0';
        card2.style["transform-origin"] = "center center";
        divCard.appendChild(card2);
        return div;
    };
    game.addBuffStyle = function (buff, view) {
        var rank = buffPack[buff].rank;
        var div = ui.create.div('.taixuhuanjing_BuffStyleDiv', view);
        if (rank > 1) {
            if (rank == 2) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_rare.png');
            if (rank == 3) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_epic.png');
            if (rank >= 4) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_legend.png');
            if (rank >= 5) div.setBackgroundImage('extension/太虚幻境/image/style/goods_skill_extra.png');
        };
        var divTitle = ui.create.div('.taixuhuanjing_BuffStyleDivTitle', '' + buffPack[buff].name + '', div);
        var divBg = ui.create.div('.taixuhuanjing_BuffStyleDivBg', div);
        var divIcon = ui.create.div('.taixuhuanjing_BuffStyleDivIcon', divBg);
        game.promises.checkFile('extension/太虚幻境/image/buff/' + buff + '.png').then(function (result) {
            if (result === 1) {
                divIcon.setBackgroundImage('extension/太虚幻境/image/buff/' + buff + '.png');
            } else {
                console.log('未找到图片：' + 'extension/太虚幻境/image/buff/' + buff + '.png');
                divIcon.setBackgroundImage('extension/太虚幻境/image/buff/moren.png');
            }
        });
        //divIcon.setBackgroundImage('extension/太虚幻境/image/buff/' + buff + '.png');
        var divInfo = ui.create.div('.taixuhuanjing_BuffStyleDivInfo', div);
        divInfo.innerHTML = buffPack[buff].info;
        return div;
    };
    game.addSkillStyle = function (skill, view) {
        var rank = get.skillRank(skill);
        var div = ui.create.div('.taixuhuanjing_BuffStyleDiv', view);
        if (rank > 1) {
            if (rank == 2) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_rare.png');
            if (rank == 3) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_epic.png');
            if (rank >= 4) div.setBackgroundImage('extension/太虚幻境/image/style/goods_effect_legend.png');
            if (rank >= 5) div.setBackgroundImage('extension/太虚幻境/image/style/goods_skill_extra.png');
        };
        var divTitle = ui.create.div('.taixuhuanjing_CardStyleDivTitle', '武将技', div);
        var name = get.translation(skill);
        var skillInfo = '&emsp;&emsp;' + lib.translate[skill + '_info'];
        var skillTitle = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillTitle', div);
        var skillName1 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillName1', '' + name + '', skillTitle);
        var skillName2 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillName2', '' + name + '', skillTitle);
        var skillText1 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillText1', div);
        var skillText2 = ui.create.div('.taixuhuanjing_lookShopHomeBoxSkillText2', '' + skillInfo + '', skillText1);
        lib.setScroll(skillText2);
        skillText2.onmouseover = function () {
            _status.onmousewheel = false;
        };
        skillText2.onmouseout = function () {
            _status.onmousewheel = true;
        };
        return div;
    };
    game.messagePopup = function (info) {
        var home = document.getElementById('taixuhuanjing_messagePopupHome');
        if (!home) {
            home = ui.create.div('#taixuhuanjing_messagePopupHome');
            document.body.appendChild(home);
            game.taixuUIupdata(home, true, 2.4);
        }
        var div = ui.create.div('.taixuhuanjing_messagePopupDiv', home);
        var bg = ui.create.div('.taixuhuanjing_messagePopupDivBg', div);
        var text = ui.create.div('.taixuhuanjing_messagePopupDivText', info + '', div);
        setTimeout(function () {
            home.removeChild(div);
        }, 1600);
    };
    game.gamePremise = function (info) {
        var home = document.getElementById('taixuhuanjing_gamePremiseHome');
        if (!home) {
            home = ui.create.div('#taixuhuanjing_gamePremiseHome');
            document.body.appendChild(home);
        }
        if (lib.config['extension_手杀ui_enable'] && lib.config.extension_手杀ui_yangShi == "on") {
            home.style.backgroundImage = 'none';
        } else {
            home.setBackgroundImage('extension/太虚幻境/image/icon/shenfen.png');
        }
        home.innerHTML = _status.TaiXuHuanJingGame.premise + '';
    };
    /**
    * 显示购买提示弹窗
    * 
    * 此函数创建并显示一个购买提示弹窗，用于在游戏界面中提示用户进行购买操作
    * 它接受四个参数：value（传递给弹窗的值，通常用于显示价格或数量），
    * info（关于购买的附加信息），view（弹窗显示的父容器），以及onDown（一个回调函数，
    * 在用户点击确认或取消按钮时调用）
    * 
    * @param {string|number} value - 显示在弹窗中的值，通常代表价格或数量
    * @param {string} info - 购买提示的详细信息
    * @param {HTMLElement} view - 弹窗展示的父容器
    * @param {Function} onDown - 点击按钮时的回调函数
    * @returns {HTMLElement} - 返回创建的弹窗元素
    */
    game.purchasePrompt = function (value, info, view, onDown) {
        // 创建弹窗的主容器
        const popup = ui.create.div('.taixuhuanjing_purchasePromptPopup', view);
        // 创建弹窗的内容容器
        const body = ui.create.div('.taixuhuanjing_purchasePromptBody', popup);

        // 阻止事件冒泡
        body.addEventListener('click', function (event) {
            event.stopPropagation();
            event.preventDefault();
        });

        /**
         * 创建并返回一个按钮
         * 
         * 此函数用于创建确认和取消按钮，并为它们添加点击事件监听器
         * 
         * @param {string} className - 按钮的CSS类名
         * @param {string} text - 按钮上显示的文本
         * @param {boolean|Function} callback - 点击按钮时的回调，通常是一个函数或表示操作结果的布尔值
         * @returns {HTMLElement} - 返回创建的按钮元素
         */
        const createButton = (className, text, callback) => {
            const button = ui.create.div(className, text);
            button.addEventListener('click', function (event) {
                if (typeof onDown === 'function') {
                    onDown(callback);
                }
                if (view.contains(popup)) {
                    view.removeChild(popup);
                }
                event.stopPropagation();
                event.preventDefault();
            });
            return button;
        };

        // 初始化弹窗内各个组件
        let valuelist = {

        }
        const comps = {
            title: ui.create.div('.taixuhuanjing_purchasePromptTitle', value),
            okButton: createButton('.taixuhuanjing_purchasePromptButton1', '确认', true),
            cancelButton: createButton('.taixuhuanjing_purchasePromptButton2', '取消', false),
            text: ui.create.div('.taixuhuanjing_purchasePromptText', info + ''),
        };

        // 将组件添加到弹窗内容容器中
        for (const key in comps) {
            body.appendChild(comps[key]);
        }

        // 处理弹窗外部点击关闭
        popup.addEventListener('click', function (event) {
            if (event.target === popup) {
                if (view.contains(popup)) {
                    view.removeChild(popup);
                }
                event.stopPropagation();
                event.preventDefault();
            }
        });

        // 返回弹窗内容容器
        return body;
    };

    game.levelUp = function (str, list, result, view) {
        game.txhj_playAudioCall('LevelUp', null, true);
        var homeBody = ui.create.div('.taixuhuanjing_StateHomeBody2', view);
        homeBody.oncontextmenu = function (e) {/*右键*/
            event.stopPropagation();
            event.preventDefault();
            return false;
        }
        var choice;
        var title = ui.create.div('.taixuhuanjing_StateHomeTitle', str + '', homeBody);
        var title2 = ui.create.div('.taixuhuanjing_StateHomeTitle2', '请选择以下 1 项效果获取', homeBody);
        var box = ui.create.div('.taixuhuanjing_StateHomeBox', homeBody);
        function func(spoil) {
            var div = ui.create.div('.taixuhuanjing_StateHomeBoxDiv');
            var bg1 = ui.create.div('.taixuhuanjing_StateHomeBoxDivBg1', div);
            var bg2 = ui.create.div('.taixuhuanjing_StateHomeBoxDivBg2', div);
            var name = spoil.name;
            var divName = ui.create.div('.taixuhuanjing_StateHomeBoxDivName', '' + name + '', div);

            if (spoil.type == 'randomSkill') {
                let skills = txhjPack.skillRank.slice(0);
                let listm = get.character(lib.config.taixuhuanjing.name, 3).slice(0);
                // 过滤无效和已使用的技能
                skills = skills.filter(skill => {
                    const skillID = skill.skillID;
                    return skillID && get.info(skillID) && lib.translate[skillID + '_info'] && !lib.config.taixuhuanjing.useSkills.includes(skillID) && !listm.includes(skillID);
                });
                let skill = skills.randomGet();
                div.choice = {
                    return: true,
                    name: '技能',
                    effect: [{ name: 'skill', number: 1, result: skill.skillID, source: 'levelup' }],
                };
                let skillName = get.translation(skill.skillID);
                let skillInfo = lib.translate[skill.skillID + '_info'];

                let divSkill = ui.create.div('.taixuhuanjing_StateHomeBoxDivSkill', div);
                let divSkillNameShadow = ui.create.div('.taixuhuanjing_StateHomeBoxDivSkillNameShadow', skillName, divSkill);
                let divSkillName = ui.create.div('.taixuhuanjing_StateHomeBoxDivSkillName', skillName, divSkill);
                let divInfo = ui.create.div('.taixuhuanjing_StateHomeBoxDivInfo2', skillInfo, div);
            } else if (spoil.type == 'randomCard') {
                let list = [];
                let cards = txhjPack.cardPack.slice(0);
                for (let i = 0; i < cards.length; i++) {
                    if (lib.translate[cards[i].cardID] && get.type(cards[i].cardID) != 'equip') {
                        list.push(cards[i].cardID);
                    }
                }
                let card = list.randomGet();
                div.choice = {
                    return: true,
                    name: '卡牌',
                    effect: [{ name: 'card', number: 1, result: card, source: 'levelup' }],
                };

                let divImp1 = ui.create.div('.taixuhuanjing_StateHomeBoxDivImp2', div);
                let card2 = game.createCard(card);
                card2.style.width = '95%';
                card2.style.height = '95%';
                card2.style.bottom = '20%';
                card2.querySelector('.image').style.backgroundPosition = '65% 0';
                card2.style["transform-origin"] = "center center";

                divImp1.appendChild(card2);

                let cardName = get.translation(card);
                let cardInfo = lib.translate[card + '_info'];
                let desc = ui.create.div('.taixuhuanjing_StateHomeBoxDivDesc');
                divImp1.appendChild(desc);
                desc.innerHTML = `<p style='color: gold;margin: 2%;'>${cardName}</p><p style='margin: 2%;'>${cardInfo}</p>`;

                divImp1.onmouseover = function (e) {
                    div.style.zIndex = '11';
                    let width = document.body.offsetWidth;
                    let height = document.body.offsetHeight;
                    let startX = e.clientX / game.documentZoom;
                    let startY = e.clientY / game.documentZoom;
                    let rise1 = Math.round(startX / width * 10000) / 100;
                    let rise2 = Math.round(startY / height * 10000) / 100;
                    if (rise1 > 70) {
                        desc.style.left = '-220%';
                    } else {
                        desc.style.left = '100%';
                    }
                    desc.style.top = '-' + rise2 + '%';
                    desc.style.display = 'block';
                };

                divImp1.onmouseout = function () {
                    div.style.zIndex = '10';
                    desc.style.display = 'none';
                };
            } else if (spoil.type == 'randomEquip') {
                var list = [];
                var cards = txhjPack.cardPack.slice(0);
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].unique == true) continue;
                    if (lib.translate[cards[i].cardID] && get.type(cards[i].cardID) == 'equip') {
                        list.push(cards[i].cardID);
                    }
                }
                var card = list.randomGet();
                div.choice = {
                    return: true,
                    name: '装备',
                    effect: [{ name: 'equip', number: 1, result: card, source: 'levelup' }],
                };
                var divImp1 = ui.create.div('.taixuhuanjing_StateHomeBoxDivImp2', div);
                let card2 = game.createCard(card);
                card2.style.width = '95%';
                card2.style.height = '95%';
                card2.style.bottom = '20%';
                card2.querySelector('.image').style.backgroundPosition = '65% 0';
                card2.style["transform-origin"] = "center center";
                divImp1.appendChild(card2);
                var cardName = get.translation(card);
                var cardInfo = lib.translate[card + '_info'];
                var desc = ui.create.div('.taixuhuanjing_StateHomeBoxDivDesc');
                divImp1.appendChild(desc);
                desc.innerHTML = `<p style='color: gold;margin: 2%;'>${cardName}</p><p style='margin: 2%;'>${cardInfo}</p>`;

                divImp1.onmouseover = function (e) {
                    div.style.zIndex = '11';
                    var width = document.body.offsetWidth;
                    var height = document.body.offsetHeight;
                    var startX = e.clientX / game.documentZoom;
                    var startY = e.clientY / game.documentZoom;
                    var rise1 = Math.round(startX / width * 10000) / 100;
                    var rise2 = Math.round(startY / height * 10000) / 100;
                    desc.style.left = rise1 > 70 ? "-220%" : "100%";
                    desc.style.top = `-${rise2}%`;
                    desc.style.display = "block";
                };
                divImp1.onmouseout = function () {
                    div.style.zIndex = '10';
                    desc.style.display = "none";
                };
            } else if (spoil.type == 'randomBuff') {
                var buffs = [];
                for (var i in buffPack) {
                    if (buffPack[i].store === false) continue;
                    if (!lib.config.taixuhuanjing.buff.includes(i)) {
                        buffs.push(i);
                    }
                }
                var buff = buffs.randomGet();
                div.choice = {
                    return: true,
                    name: '祝福',
                    effect: [{ name: 'buff', number: 1, result: buff, source: 'levelup' }],
                };

                var skillName = buffPack[buff].name;
                var divImpBg = ui.create.div('.taixuhuanjing_StateHomeBoxDivImpBg', div);
                var divImp = ui.create.div('.taixuhuanjing_StateHomeBoxDivImp', div);
                game.promises.checkFile('extension/太虚幻境/image/buff/' + buff + '.png').then(function (result) {
                    if (result === 1) {
                        divImp.setBackgroundImage('extension/太虚幻境/image/buff/' + buff + '.png');
                    } else {
                        console.log('未找到图片：' + 'extension/太虚幻境/image/buff/' + buff + '.png');
                        divImp.setBackgroundImage('extension/太虚幻境/image/buff/moren.png');
                    }
                });
                //divImp.setBackgroundImage('extension/太虚幻境/image/buff/' + buff + '.png');

                var skillInfo = buffPack[buff].info;
                var desc = ui.create.div('.taixuhuanjing_StateHomeBoxDivDesc');
                desc.style.width = "330%";
                divImp.appendChild(desc);
                desc.innerHTML = `<p style='color: gold;margin: 2%;'>${skillName}</p><p style='margin: 2%;'>${skillInfo}</p>`;
                divImp.onmouseover = function (e) {
                    div.style.zIndex = '11';
                    var width = document.body.offsetWidth;
                    var height = document.body.offsetHeight;
                    var startX = e.clientX / game.documentZoom;
                    var startY = e.clientY / game.documentZoom;
                    var rise1 = Math.round(startX / width * 10000) / 100;
                    var rise2 = Math.round(startY / height * 10000) / 100;
                    desc.style.left = rise1 > 70 ? "-330%" : "100%";
                    desc.style.top = `-${rise2}%`;
                    desc.style.display = "block";
                };
                divImp.onmouseout = function () {
                    div.style.zIndex = '10';
                    desc.style.display = "none";
                };

                var divInfo = ui.create.div('.taixuhuanjing_StateHomeBoxDivInfo1', skillName, div);
            } else {
                var divImp = ui.create.div('.taixuhuanjing_StateHomeBoxDivImp', div);
                const spoilTypes = {
                    coin: {
                        image: 'extension/太虚幻境/image/icon/coin.png',
                        text: '金币+300',
                        choice: {
                            return: true,
                            name: '金币',
                            effect: [{ name: 'coin', number: 300, source: 'levelup' }]
                        }
                    },
                    maxHp: {
                        image: 'extension/太虚幻境/image/icon/maxHp.png',
                        text: '体力上限+1',
                        choice: {
                            return: true,
                            name: '体力上限',
                            effect: [{ name: 'maxHp', number: 1, source: 'levelup' }]
                        }
                    },
                    hp: {
                        image: 'extension/太虚幻境/image/icon/hp.png',
                        text: '体力+1',
                        choice: {
                            return: true,
                            name: '体力',
                            effect: [{ name: 'hp', number: 1, source: 'levelup' }]
                        }
                    },
                    minHs: {
                        image: 'extension/太虚幻境/image/icon/minHs.png',
                        text: '初始手牌+1',
                        choice: {
                            return: true,
                            name: '初始手牌',
                            effect: [{ name: 'minHs', number: 1, source: 'levelup' }]
                        }
                    },
                    maxHs: {
                        image: 'extension/太虚幻境/image/icon/maxHs.png',
                        text: '手牌上限+2',
                        choice: {
                            return: true,
                            name: '手牌上限',
                            effect: [{ name: 'maxHs', number: 2, source: 'levelup' }]
                        }
                    },
                    adjust: {
                        image: 'extension/太虚幻境/image/icon/adjust.png',
                        text: '调度次数+1',
                        choice: {
                            return: true,
                            name: '调度次数',
                            effect: [{ name: 'adjust', number: 1, source: 'levelup' }]
                        }
                    }
                };
                if (spoilTypes[spoil.type]) {
                    const spoilType = spoilTypes[spoil.type];
                    divImp.setBackgroundImage(spoilType.image);
                    var divInfo = ui.create.div('.taixuhuanjing_StateHomeBoxDivInfo1', spoilType.text, div);
                    div.choice = spoilType.choice;
                }
            }
            div.listen(function (e) {
                game.txhj_playAudioCall('WinButton', null, true);
                choice = div.choice;
                if (box.choosingNow) {
                    box.choosingNow.noChoiced();
                }
                this.choiced();
                e?.stopPropagation?.();
                e?.preventDefault?.();
                return false;
            });
            div.choiced = function () {
                box.choosingNow = this;
                bg1.setBackgroundImage('extension/太虚幻境/image/icon/icon_frame18.png');
            };
            div.noChoiced = function () {
                box.choosingNow = null;
                bg1.style.backgroundImage = 'none';
            };
            return div;
        };
        while (list.length) {
            var spoil = list.shift();
            box.appendChild(func(spoil));
        }
        var button = ui.create.div('.taixuhuanjing_StateHomeBoxButton', '确认选择', box);
        button.listen(function (e) {
            if (!choice) {
                game.messagePopup('请选择一项效果');
                return;
            }
            game.txhj_playAudioCall('off', null, true);
            var list2 = [];
            if (result == true) {
                var season = lib.config.taixuhuanjing.season || _status.TaiXuHuanJingGame.season;
                var chapter = _status.TaiXuHuanJingGame.chapter;
                var id = _status.TaiXuHuanJingGame.event.id;

                var spoils = game.eventPack[season][chapter][id].spoils.slice(0);
                for (var i = 0; i < spoils.length; i++) {
                    if (Math.random() <= spoils[i].random) {
                        list2.push(spoils[i]);
                    };
                };
                var enemys = game.eventPack[season][chapter][id].enemy.slice(0);
                for (var i = 0; i < enemys.length; i++) {
                    if (enemys[i].spoils.length) {
                        var spoils2 = enemys[i].spoils.slice(0);
                        for (var ii = 0; ii < spoils2.length; ii++) {
                            if (Math.random() <= spoils2[ii].random) {
                                list2.push(spoils2[ii]);
                            }
                        }
                    }
                };
                if (lib.config.taixuhuanjing.buff.includes("txhj_aHaoSkill1")) {
                    list2.push({
                        result: true,
                        name: '随机装备',
                        effect: [{ name: 'randomEquip', number: 1 }],
                        random: 1,
                    });
                }
            }
            list2.push(choice);
            view.update(list2);
            view.removeChild(homeBody);
            event.stopPropagation();
            event.preventDefault();
            return false;
        });
    };
    game.cardPileTx = function () {
        if (!txhj.isInitCardPileTx) {
            lib.card.list = [];
            var list = [
                /*黑桃*/
                ["spade", "1", "shandian"],
                ["spade", "1", "juedou"],
                ["spade", "3", "shunshou"],
                ["spade", "3", "guohe"],
                ["spade", "3", "jiu"],
                ["spade", "4", "guohe"],
                ["spade", "4", "shunshou"],
                ["spade", "4", "sha", "thunder"],
                ["spade", "5", "sha", "thunder"],
                ["spade", "6", "sha", "thunder"],
                ["spade", "7", "nanman"],
                ["spade", "7", "sha"],
                ["spade", "7", "sha", "thunder"],
                ["spade", "8", "sha"],
                ["spade", "8", "sha"],
                ["spade", "8", "sha", "thunder"],
                ["spade", "9", "sha"],
                ["spade", "9", "sha"],
                ["spade", "9", "jiu"],
                ["spade", "10", "sha"],
                ["spade", "10", "sha"],
                ["spade", "10", "bingliang"],
                ["spade", "11", "wuxie"],
                ["spade", "11", "shunshou"],
                ["spade", "11", "tiesuo"],
                ["spade", "12", "guohe"],
                ["spade", "12", "tiesuo"],
                ["spade", "13", "nanman"],
                ["spade", "13", "wuxie"],
                /*红桃*/
                ["heart", "1", "taoyuan"],
                ["heart", "1", "wanjian"],
                ["heart", "1", "wuxie"],
                ["heart", "2", "shan"],
                ["heart", "2", "shan"],
                ["heart", "2", "huogong"],
                ["heart", "3", "wugu"],
                ["heart", "3", "tao"],
                ["heart", "3", "huogong"],
                ["heart", "4", "wugu"],
                ["heart", "4", "sha", "fire"],
                ["heart", "5", "tao"],
                ["heart", "6", "tao"],
                ["heart", "6", "tao"],
                ["heart", "6", "lebu"],
                ["heart", "7", "wuzhong"],
                ["heart", "7", "wuzhong"],
                ["heart", "7", "sha", "fire"],
                ["heart", "8", "tao"],
                ["heart", "8", "wuzhong"],
                ["heart", "8", "wuzhong"],
                ["heart", "9", "wuzhong"],
                ["heart", "9", "shan"],
                ["heart", "10", "sha"],
                ["heart", "10", "sha", "fire"],
                ["heart", "10", "wuzhong"],
                ["heart", "11", "sha"],
                ["heart", "11", "shan"],
                ["heart", "11", "wuzhong"],
                ["heart", "12", "tao"],
                ["heart", "12", "guohe"],
                ["heart", "12", "shan"],
                ["heart", "12", "shandian"],
                ["heart", "12", "wuzhong"],
                ["heart", "13", "wuxie"],
                /*方块*/
                ["diamond", "1", "juedou"],
                ["diamond", "2", "shan"],
                ["diamond", "2", "shan"],
                ["diamond", "2", "tao"],
                ["diamond", "3", "shunshou"],
                ["diamond", "4", "shan"],
                ["diamond", "4", "shunshou"],
                ["diamond", "4", "sha", "fire"],
                ["diamond", "5", "sha", "fire"],
                ["diamond", "6", "sha"],
                ["diamond", "6", "shan"],
                ["diamond", "6", "shan"],
                ["diamond", "7", "sha"],
                ["diamond", "7", "shan"],
                ["diamond", "7", "shan"],
                ["diamond", "8", "sha"],
                ["diamond", "8", "shan"],
                ["diamond", "9", "sha"],
                ["diamond", "9", "shan"],
                ["diamond", "9", "jiu"],
                ["diamond", "10", "sha"],
                ["diamond", "10", "shan"],
                ["diamond", "10", "shan"],
                ["diamond", "11", "shan"],
                ["diamond", "11", "shan"],
                ["diamond", "11", "shan"],
                ["diamond", "12", "wuxie"],
                ["diamond", "12", "tao"],
                ["diamond", "12", "huogong"],
                ["diamond", "13", "sha"],
                /*梅花*/
                ["club", "1", "juedou"],
                ["club", "2", "sha"],
                ["club", "3", "sha"],
                ["club", "3", "guohe"],
                ["club", "3", "jiu"],
                ["club", "4", "guohe"],
                ["club", "4", "sha"],
                ["club", "5", "sha"],
                ["club", "5", "sha", "thunder"],
                ["club", "6", "lebu"],
                ["club", "6", "sha"],
                ["club", "6", "sha", "thunder"],
                ["club", "7", "sha"],
                ["club", "7", "sha", "thunder"],
                ["club", "7", "nanman"],
                ["club", "8", "sha"],
                ["club", "8", "sha"],
                ["club", "8", "sha", "thunder"],
                ["club", "9", "sha"],
                ["club", "9", "sha"],
                ["club", "9", "jiu"],
                ["club", "10", "sha"],
                ["club", "10", "sha"],
                ["club", "10", "tiesuo"],
                ["club", "11", "sha"],
                ["club", "11", "sha"],
                ["club", "11", "tiesuo"],
                ["club", "12", "tiesuo"],
                ["club", "12", "wuxie"],
                ["club", "13", "tiesuo"],
                ["club", "13", "wuxie"],

                /*额外增加*/
                ["heart", "4", "txhj_jiedao"],
                ["heart", "8", "txhj_huoshaolianying"],
                ["spade", "5", "diaohu"],
                ["heart", "13", "txhj_yuanjiao"],
                ["spade", "1", "txhj_yiyi"],
                ["diamond", "6", "txhj_zhijizhibi"],
                ["heart", "9", "txhj_caomu"],
                ["diamond", "12", "txhj_shuiyan"],
                ["club", "3", "txhj_shengdong"],
                //魔改牌堆增补
                /* ["diamond", "7", "fudichouxin"],
                 ["spade", "10", "fudichouxin"],
                 ["heart", "5", "huoshan"],
                 ["club", "3", "jiejia"],
                 ["diamond", "3", "jiejia"],
                 ["club", "2", "huoshan"],
                 ["club", 4, "sha", "ice"],
                 ["spade", 7, "sha", "ice"],
                 ["spade", 8, "sha", "ice"],
                 ["spade", 9, "sha", "ice"],
                 ["spade", 6, "sha", "stab"],
                 ["club", 10, "sha", "stab"],
                 ["diamond", 13, "sha", "stab"],
                 ["heart", 1, "geanguanhuo"],
                 ["spade", 6, "geanguanhuo"],
                 ["heart", 7, "dongzhuxianji"],
                 ["club", 9, "zhulu_card"],
                 ["diamond", 1, "diaobingqianjiang"],
                 ["spade", 2, "diaobingqianjiang"],
                 ['club', 3, 'txhj_wangmeizhike'],
                 ['club', 5, 'txhj_wangmeizhike'],
                 ['heart', 1, 'txhj_wangmeizhike'],
                 ['heart', 7, 'txhj_wangmeizhike'],
                 ['spade', 12, 'txluojingxiashi'],
                 ["heart", "13", "txhj_zong"],
                 ["club", "2", "txhj_zong"],
                 ["diamond", "5", "txhj_zong"],
                 ["diamond", "6", "txhj_zong"],
                 ["spade", "9", "txhj_xionghuangjiu"],
                 ["spade", "12", "txhj_xionghuangjiu"],
                 ["diamond", "7", "txhj_xionghuangjiu"],
                 ["club", "1", "txhj_xionghuangjiu"],
                 ["club", "10", "txhj_tunliang"],
                 ["club", "4", "txhj_tunliang"],
                 ["diamond", "8", "txhj_tunliang"],
                 ["club", "4", "txhj_zong"],*/
            ];
            list = list.concat(list);
            list.randomSort();
            if (list.length) lib.card.list.addArray(list);
            txhj.isInitCardPileTx = true;
        } else {
            lib.card.list.randomSort();
        }
        return list;
    };
    game.taixuclearArena = function () {//清除函数
        game.clearConnect()
        if (ui?.auto?.classList && !ui.auto.classList.contains("hidden")) {
            ui.auto.classList.remove("hidden");
        }
        if (typeof lib.hook === 'object' && lib.hook !== null) {
            Object.getOwnPropertyNames(lib.hook).forEach(key => {
                if (key !== 'globalskill') {
                    delete lib.hook[key];
                } else {
                    if (typeof lib.hook.globalskill === 'object') {
                        Object.keys(lib.hook.globalskill).forEach(subKey => {
                            if (lib.hook.globalskill[subKey]?.node) {
                                delete lib.hook.globalskill[subKey].node;
                            }
                        });
                    }
                }
            });
        }
        if (_status) {
            _status.renku = [];
            _status.firstAct = null;
            _status.gameStart = undefined;
            _status.modeNode = null;
            _status.roundSkipped = false;
            _status.isRoundFilter = null;
            _status.lastPhasedPlayer = null;
            _status.seatNumSettled = false;
        }
        if (_status?.renku) _status.renku = [];
        [
            ui.control,
            ui.special,
            ui.ordering,
            ui.arenalog,
            ui.historybar,
            ui.cardPile,
            ui.discardPile,
            ui.sidebar,
            ui.sidebar3
        ].forEach(container => {
            if (container) container.innerHTML = '';
        });

        [
            ui.playerids, ui.mebg, ui.me, ui.handcards1Container, ui.handcards2Container,
            window.dui ? ui.equipSolts : undefined
        ].filter(element => element && element.parentNode).forEach(element => {
            try {
                element.parentNode.removeChild(element);
            } catch (e) {
                console.warn('移除元素失败:', element, e);
            }
        });

        if (Array.isArray(ui.thrown)) {
            ui.thrown.forEach(item => {
                if (item && item.parentNode) {
                    try {
                        item.parentNode.removeChild(item);
                    } catch (e) {
                        console.warn('移除thrown元素失败:', item, e);
                    }
                }
            });
            ui.thrown.length = 0;
        }
        document.querySelectorAll('.skill-dialog').forEach(el => {
            if (el && el.parentNode) {
                try {
                    el.parentNode.removeChild(el);
                } catch (e) {
                    console.warn('移除技能弹窗失败:', el, e);
                }
            }
        });
        if (lib.skill?._changeJudges) {
            const skillControl = document.querySelector(".skill-control");
            const judgesNode = game.me?.node?.judges;
            if (skillControl && judgesNode) {
                if (skillControl.contains(judgesNode)) {
                    try {
                        skillControl.removeChild(judgesNode);
                    } catch (e) {
                        console.warn('移除判定区节点失败:', judgesNode, e);
                    }
                }
            }
        }
        if (typeof ui.clear === 'function') {
            try {
                ui.clear();
            } catch (e) {
                console.warn('执行ui.clear失败:', e);
            }
        }
        document.querySelectorAll(".SLBuffDesc").forEach(ele => {
            if (ele && ele.parentNode) {
                try {
                    ele.parentNode.removeChild(ele);
                } catch (e) {
                    console.warn('移除SLBuffDesc失败:', ele, e);
                }
            }
        });
        const skillControl = document.querySelector(".skill-control");
        if (skillControl) {
            skillControl.style.display = 'none';
            document.querySelectorAll(".playerbuffstyle2").forEach(buff => {
                if (buff && buff.parentNode) {
                    try {
                        buff.parentNode.removeChild(buff);
                    } catch (e) {
                        console.warn('移除playerbuffstyle2失败:', buff, e);
                    }
                }
            });
        } else {
            document.querySelectorAll(".playerbuffstyle3").forEach(buff => {
                if (buff && buff.parentNode) {
                    try {
                        buff.parentNode.removeChild(buff);
                    } catch (e) {
                        console.warn('移除playerbuffstyle3失败:', buff, e);
                    }
                }
            });
        }
        const alivePlayers = Array.isArray(game.players) ? game.players : [];
        const deadPlayers = Array.isArray(game.dead) ? game.dead : [];
        const allPlayers = [...alivePlayers, ...deadPlayers].filter(player => player);
        allPlayers.forEach(player => {
            if (player.hasOwnProperty('stopDynamic')) {
                player.stopDynamic();
            }
            if (player?.node) {
                if (player.node.parentNode) {
                    try {
                        player.node.parentNode.removeChild(player.node);
                    } catch (e) {
                        console.warn('移除玩家节点失败:', player, e);
                    }
                }
                delete player.node;
            }
            if (typeof game.removePlayerOL === 'function') {
                try {
                    game.removePlayerOL(player);
                } catch (e) {
                    console.warn('执行removePlayerOL失败:', player, e);
                }
            }
        });
        if (Array.isArray(game.players)) game.players.length = 0;
        if (Array.isArray(game.dead)) game.dead.length = 0;
        game.me = null;
        game.zhu = null;
        if (CacheContext && typeof CacheContext.removeCacheContext === 'function') {
            try {
                CacheContext.removeCacheContext();
            } catch (e) {
                console.warn('清理缓存失败:', e);
            }
        }
    };
    game.TaiXuHuanJingState = function (type) {//对局结束
        'step 0'
        let players = game.players.concat(game.dead);
        for (var i = 0; i < players.length; i++) {
            if (typeof players[i].stopDynamic === 'function') {
                players[i].stopDynamic();
            }
            //游戏结束停止播放动皮
        }
       /* let evt = _status.event.getParent(1, true);
			while (evt?.name != "phaseLoop") {
				if (evt) {
					if (evt.name == "phase") {
						evt.pushHandler("onPhase", (evtx, option) => {
							evtx.step = 13;
							evtx.num = evtx.phaseList.length;
							game.broadcastAll(function (player) {
								player.classList.remove("glow_phase");
								if (_status.currentPhase) {
									game.log(_status.currentPhase, "结束了回合");
									delete _status.currentPhase;
								}
							}, evtx.player);
						});
					}
					evt.finish();
					evt._triggered = null;
					evt = evt.getParent(1, true);
				} else {
					break;
				}
			}
		_status.paused = false;*/
        if (_status?.renku) _status.renku = [];
        if (window.dui) {
            [
                '#system2',
                '.lbtn-paixu',
                '.lbtn-controls',
                '.latn-jilu',
                'img[src="extension/十周年UI/shoushaUI/lbtn/images/uibutton/liaotian.png"]'
            ].forEach(selector => {
                const el = document.querySelector(selector);
                if (el) {
                    el.style.setProperty('display', 'none', 'important');
                }
            });
        }          
        ui.arenalog.innerHTML = '';/*清除历史记录*/
        ui.historybar.innerHTML = '';/*清除出牌记录*/
        ui.cardPile.innerHTML = '';
        ui.discardPile.innerHTML = '';
        ui.sidebar.innerHTML = '';/*清除暂停记录*/
        ui.sidebar3.innerHTML = '';/*清除暂停记录*/
        let status = _status;
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season || _status.TaiXuHuanJingGame.season;
        var chapter = _status.TaiXuHuanJingGame.chapter;
        var num = lib.config.taixuhuanjing.exp;
     //   game.messagePopup(!_status.modeNode);
        //if (!_status.modeNode) return;
        if (_status.modeNode.buff.includes('buff_txhj_aozhan')) {
            if (game.me.hp > 0) {
                _status.modeNode.hp = game.me.hp;
                _status.modeNode.maxHp = game.me.maxHp;
            } else {
                _status.modeNode.hp = 1;
                _status.modeNode.maxHp = game.me.maxHp;
            }
        } else {
            if (type != null && _status.modeNode.buff.includes('buff_txhj_xianhujiqu')) {
                if (game.me.maxHp > _status.modeNode.maxHp) {
                    _status.modeNode.maxHp += game.me.maxHp - _status.modeNode.maxHp;
                }
            }
            _status.modeNode.hp = _status.modeNode.maxHp;
        }
        _status.modeNode.score.round += game.roundNumber;
        _status.modeNode.score.fight += 1;
        _status.modeNode.buff = _status.modeBuff.slice(0);
        _status.modeNode.useSkills = _status.modeSkill.slice(0);
        game.saveConfig('taixuhuanjing', _status.modeNode);
        _status.modeNode = null;
        _status.modeBuff = null;
        _status.modeSkill = null;
        
        var str2 = '普通';
        if (rank == 2) {
            str2 = '困难';
        } else if (rank == 3) {
            str2 = '噩梦';
        } else if (rank == 4) {
            str2 = '炼狱';
        } else if (rank == 5) {
            str2 = '血战';
        } else if (rank == 6) {
            str2 = '末日';
        }
        if (type == true && game.eventPack[season][chapter][_status.TaiXuHuanJingGame.event.id].type == 'Ultimate') {
            if (typeof chapter == 'string' && chapter.indexOf('IF') != -1) {
                if (!lib.config.taixuhuanjingRecord) lib.config.taixuhuanjingRecord = {};
                var timeID = (new Date()).getTime();
                lib.config.taixuhuanjing.time = timeID;
                if (!lib.config.taixuhuanjingRecord) lib.config.taixuhuanjingRecord = {};
                lib.config.taixuhuanjingRecord[timeID] = lib.config.taixuhuanjing;
                game.saveConfig('taixuhuanjingRecord', lib.config.taixuhuanjingRecord);
                _status.TaiXuHuanJingGame.return = true;
                /*game.updateModeData();
                game.over(true);
                return;*/
            }
            if (typeof chapter == 'number' && game.seasonPack[season][chapter + 'IF']) {
                var premise = game.seasonPack[season][chapter + 'IF'].premise.slice(0);
                var result = premise.length;
                for (var i = 0; i < premise.length; i++) {
                    for (var e = 0; e < lib.config.taixuhuanjing.events.length; e++) {
                        if (lib.config.taixuhuanjing.events[e].id == premise[i]) {
                            result--;
                        }
                    }
                }
                if (result == 0) {
                    var src = '恭喜您已通过：【' + game.seasonPack[season].name + '】（' + str2 + '）赛季试炼，' + "是否继续体验隐藏内容?";
                    var d = confirm(src);
                    if (d == true) {
                        lib.config.taixuhuanjing.chapter = chapter + 'IF';
                        delete lib.config.taixuhuanjing.store;
                        lib.config.taixuhuanjing.procedure = null;
                        lib.config.taixuhuanjing.optional = [];
                        lib.config.taixuhuanjing.optionalExam = [];
                        if (lib.config.taixuhuanjingNode[season] && lib.config.taixuhuanjingNode[season].rank && rank >= lib.config.taixuhuanjingNode[season].rank) {
                            lib.config.taixuhuanjingNode[season].rank++;

                            if (lib.config.taixuhuanjingNode[season].rank > 6) lib.config.taixuhuanjingNode[season].rank = 6;
                            if (lib.config.taixuhuanjingNode[season].reach && lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name]) {
                                lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name]++;
                            } else {
                                if (!lib.config.taixuhuanjingNode[season].reach) lib.config.taixuhuanjingNode[season].reach = {};
                                lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name] = 1;
                            }
                        } else {
                            lib.config.taixuhuanjingNode[season] = {
                                rank: 2,
                                reach: {},
                            }
                            lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name] = 1;
                        }
                        lib.config.taixuhuanjingNode.reach[lib.config.taixuhuanjing.name] = 1;
                        game.saveConfig('taixuhuanjingNode', lib.config.taixuhuanjingNode);
                    } else {
                        if (lib.config.taixuhuanjingNode[season] && lib.config.taixuhuanjingNode[season].rank && rank >= lib.config.taixuhuanjingNode[season].rank) {
                            lib.config.taixuhuanjingNode[season].rank++;
                            if (lib.config.taixuhuanjingNode[season].rank > 6) lib.config.taixuhuanjingNode[season].rank = 6;
                            if (lib.config.taixuhuanjingNode[season].reach && lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name]) {
                                lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name]++;
                            } else {
                                if (!lib.config.taixuhuanjingNode[season].reach) lib.config.taixuhuanjingNode[season].reach = {};
                                lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name] = 1;
                            }
                        } else {
                            lib.config.taixuhuanjingNode[season] = {
                                rank: 2,
                                reach: {},
                            }
                            lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name] = 1;
                        }
                        game.saveConfig('taixuhuanjingNode', lib.config.taixuhuanjingNode);
                        var timeID = (new Date()).getTime();
                        lib.config.taixuhuanjing.time = timeID;
                        if (!lib.config.taixuhuanjingRecord) lib.config.taixuhuanjingRecord = {};
                        lib.config.taixuhuanjingRecord[timeID] = lib.config.taixuhuanjing;
                        game.saveConfig('taixuhuanjingRecord', lib.config.taixuhuanjingRecord);
                        _status.TaiXuHuanJingGame.return = true;
                        /*game.updateModeData();
                        game.over(true);*/
                    }
                }
            } else {
                //alert('恭喜您已通过：【'+game.seasonPack[season].name+'】（'+str2+'）赛季试炼');
                if (lib.config.taixuhuanjingNode[season] && lib.config.taixuhuanjingNode[season].rank && rank >= lib.config.taixuhuanjingNode[season].rank) {
                    lib.config.taixuhuanjingNode[season].rank++;
                    if (lib.config.taixuhuanjingNode[season].rank > 6) lib.config.taixuhuanjingNode[season].rank = 6;
                    if (lib.config.taixuhuanjingNode[season].reach && lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name]) {
                        lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name]++;
                    } else {
                        if (!lib.config.taixuhuanjingNode[season].reach) lib.config.taixuhuanjingNode[season].reach = {};
                        lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name] = 1;
                    }
                } else {
                    lib.config.taixuhuanjingNode[season] = {
                        rank: 2,
                        reach: {},
                    }
                    lib.config.taixuhuanjingNode[season].reach[lib.config.taixuhuanjing.name] = 1;
                }
                game.saveConfig('taixuhuanjingNode', lib.config.taixuhuanjingNode);
                var timeID = (new Date()).getTime();
                lib.config.taixuhuanjing.time = timeID;
                if (!lib.config.taixuhuanjingRecord) lib.config.taixuhuanjingRecord = {};
                lib.config.taixuhuanjingRecord[timeID] = lib.config.taixuhuanjing;
                game.saveConfig('taixuhuanjingRecord', lib.config.taixuhuanjingRecord);
                _status.TaiXuHuanJingGame.return = true;
                /*game.updateModeData();
                game.over(true);
                return;*/
            }
        }
        'step 1'
        var home = ui.create.div('.taixuhuanjing_StateHome');
        home.oncontextmenu = function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        document.body.appendChild(home);
        var homeBody = ui.create.div('.taixuhuanjing_StateHomeBody', home);
        game.taixuUIupdata(homeBody, true, 2.0, 0.9);
        var gameIcon = ui.create.div('.taixuhuanjing_StateHomeGameIcon', homeBody);
        var gameText = ui.create.div('.taixuhuanjing_StateHomeGameText', gameIcon);
        var gameInfo = ui.create.div('.taixuhuanjing_StateHomeGameInfo', gameIcon);
        var okButton = ui.create.div('.taixuhuanjing_StateHomeOkButton', homeBody);
        var okText = ui.create.div('.taixuhuanjing_StateHomeOkText', okButton);
        okButton.listen(function (e) {
            game.txhj_playAudioCall('off', null, true);
            _status.gameStart = false;
            game.resume();
            setTimeout(function () {
                home.delete();
                game.taixuUIupdata(homeBody, false);
                game.clearArena();
            }, 500);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        if (type == null) {
            gameIcon.setBackgroundImage('extension/太虚幻境/image/style/game_false_icon.png');
            gameText.setBackgroundImage('extension/太虚幻境/image/style/game_false_text.png');
            game.txhj_playAudioCall('Loss', null, true);
            if (lib.config.taixuhuanjing.revive == false) {
                lib.config.taixuhuanjing.hp = lib.config.taixuhuanjing.maxHp;
                lib.config.taixuhuanjing.revive = true;
                game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
            } else {
                var timeID = (new Date()).getTime();
                lib.config.taixuhuanjing.time = timeID;
                if (!lib.config.taixuhuanjingRecord) lib.config.taixuhuanjingRecord = {};
                lib.config.taixuhuanjingRecord[timeID] = lib.config.taixuhuanjing;
                game.saveConfig('taixuhuanjingRecord', lib.config.taixuhuanjingRecord);
                _status.TaiXuHuanJingGame.return = false;
            }
            /*game.updateModeData();
            game.over(false);
            return;*/
        } else if (type == false) {
            gameIcon.setBackgroundImage('extension/太虚幻境/image/style/game_loss_icon.png');
            gameText.setBackgroundImage('extension/太虚幻境/image/style/game_loss_text.png');
            game.txhj_playAudioCall('Loss', null, true);
        } else {
            game.txhj_playAudioCall('Win', null, true);
        }
        'step 2”'
        //上一局最后用的牌和敌人死后弃牌会在下一局时显示的bug
        if (ui.thrown && ui.thrown.length > 0) {
            for (var i = 0; i < ui.thrown.length; i++) {
                ui.thrown[i].remove();
            }
        }
        //不知道会不会出其他bug
        if (lib.skill._changeJudges) {
            let ss = document.querySelector(".skill-control");
            ss.removeChild(game.me.node.judges)
        };
        //

        ui.clear();
        ui.mebg.remove();
        ui.me.remove();
        ui.handcards1Container.remove();
        ui.handcards2Container.remove();
        if (window.dui) {
            ui.equipSolts.remove();
            const handtip = document.querySelector(".handtip");
            if (handtip) {
                handtip.dataset.text = '';
                handtip.style.display = 'none';
            }
            ['.skill-control', '.dialog'].forEach(el => {
                const element = document.querySelector(el);
                if (element) {
                    element.style.display = 'none';
                }
            });
            const element = document.getElementById('dui-controls');
            if (element) {
                element.style.display = 'none';
            }
        }
        function clearSLBuff() {
            var buffDesc = document.querySelectorAll(".SLBuffDesc");
            if (buffDesc.length > 0) {
                for (const ele of buffDesc) {
                    ele.parentNode.removeChild(ele);
                }
            }
            var buffs = document.querySelectorAll(".playerbuffstyle3");
            if (buffs.length > 0) {
                for (const buff of buffs) {
                    buff.parentNode.removeChild(buff);
                }
            }
        }
        clearSLBuff();

       
        
    /*  let playersd = game.players.concat(game.dead);

    for (var i = 0; i < playersd.length; i++) {
    const player = playersd[i];
    game.removePlayerOL(player, false);
    if (player.jiubuff) {
        player.jiubuff.forEach(function (bufId) {
            txcsanm.hstop(bufId);
        });
        delete player.jiubuff;
    }
    if (player.node?.jiu) {
        player.node.jiu.delete();
        player.node.jiu2.delete();
        delete player.node.jiu;
        delete player.node.jiu2;
    }
    player.discardPlayerCard(player, Infinity, 'hej', true);
    player.clearSkills();
    player.actionHistory = [
        {
            useCard: [],
            respond: [],
            skipped: [],
            lose: [],
            gain: [],
            sourceDamage: [],
            damage: [],
            custom: [],
            useSkill: []
        }
    ];
    player.stat = [
        {
            card: {},
            skill: {},
            triggerSkill: {}
        }
    ];
    player.judging = [];
    player.popups = [];
    player.damagepopups = [];
    player.tempSkills = {};
    player.skipList = [];
    if (player.ai?.handcards) {
        player.ai.handcards.global = [];
        player.ai.handcards.source = [];
        player.ai.handcards.viewed = [];
    }
    player.vcardsMap = {
        handcards: [],
        equips: [],
        judges: []
    };
}*/

        _status.globalHistory = [{
            cardMove: [],
            custom: [],
            useCard: [],
            changeHp: [],
            everything: [],
        }];
        if (CacheContext && typeof CacheContext.removeCacheContext === 'function') {
            try {
                CacheContext.removeCacheContext();
            } catch (e) {
                console.warn('清理缓存失败:', e);
            }
        }
        //game.taixuclearArena();
        game.delay();
        game.pause();
        'step 3'
        var rank = lib.config.taixuhuanjing.rank;
        var season = lib.config.taixuhuanjing.season || _status.TaiXuHuanJingGame.season;
        var chapter = _status.TaiXuHuanJingGame.chapter;
        var num = lib.config.taixuhuanjing.exp;
        if (type !== null) {
            num += game.eventPack[season][chapter][_status.TaiXuHuanJingGame.event.id].exp;
        }
        var max = lib.config.taixuhuanjing.maxExp;
        var winrate = Math.max(1, Math.min(100, Math.round(num / max * 10000) / 100));
        var levelBody = ui.create.div('.taixuhuanjing_StateHomelevelBody', homeBody);
        var levelComps = {
            expbody: (function () {
                var expbody = ui.create.div('.taixuhuanjing_StateHomeExpBody');
                var attributeBody5Imp = ui.create.div('.taixuhuanjing_StateHomeExpBodyImp', expbody);
                attributeBody5Imp.style.width = winrate + '%';
                return expbody;
            })(),
            title: (function () {
                var title = ui.create.div('.taixuhuanjing_StateHomelevelTitle', '等级' + lib.config.taixuhuanjing.level);
                return title;
            })(),
        };
        for (var i in levelComps) {
            levelBody.appendChild(levelComps[i]);
        }
        var spoilsBody = ui.create.div('.taixuhuanjing_StateHomeSpoilsBody', homeBody);
        if (type === null) {
            ui.create.div('.taixuhuanjing_StateHomeAddExp', '经验+0', homeBody);
            ui.create.div('.taixuhuanjing_StateHomeSpoilsTitle', '获得战利品', spoilsBody);
            return;
        }

        ui.create.div('.taixuhuanjing_StateHomeAddExp', '经验+' + game.eventPack[season][chapter][_status.TaiXuHuanJingGame.event.id].exp, homeBody);
        homeBody.update = function (list) {
            spoilsBody.innerHTML = '';
            const title = ui.create.div('.taixuhuanjing_StateHomeSpoilsTitle', '获得战利品');
            const spoilsBox = ui.create.div('.taixuhuanjing_StateHomeSpoilsBox');
            const createSpoilItem = (spoil) => {
                const div = ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDiv');
                const divImp = ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivImp', div);
                switch (spoil.name) {
                    case 'randomSkill':
                    case 'randomCard':
                    case 'randomEquip':
                    case 'randomBuff':
                        divImp.setBackgroundImage('extension/太虚幻境/image/icon/random.png');
                        break;
                    case 'skill':
                        const skillName = get.translation(spoil.result);
                        const divImp3 = ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivImp3', divImp);
                        ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivName3', skillName, divImp3);
                        break;
                    case 'card':
                    case 'equip':
                        const divImp2 = ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivImp2', divImp);
                        const cardImp = (card) => {
                            if (lib.card[card].fullimage || lib.card[card].fullborder) {
                                divImp2.style.height = '120%';
                            }
                            const src = lib.card[card].image || `image/card/${card}.png`;
                            divImp2.setBackgroundImage(src.startsWith('ext:') ? src.replace('ext:', 'extension/') : src);
                        };
                        if (lib.config['extension_十周年UI_enable']) {
                            const img = new Image();
                            img.src = `${lib.assetURL}extension/十周年UI/image/card/${spoil.result}.webp`;
                            img.onload = () => {
                                divImp2.style.height = '120%';
                                divImp2.setBackgroundImage(`extension/十周年UI/image/card/${spoil.result}.webp`);
                            };
                            img.onerror = () => cardImp(spoil.result);
                        } else {
                            cardImp(spoil.result);
                        }
                        const cardName = get.translation(spoil.result);
                        ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivName', cardName, div);
                        break;
                    case 'buff':
                        game.promises.checkFile(`extension/太虚幻境/image/buff/${spoil.result}.png`).then(function (result) {
                            if (result === 1) {
                                divImp.setBackgroundImage(`extension/太虚幻境/image/buff/${spoil.result}.png`);
                            } else {
                                console.warn('未找到图片：' + `extension/太虚幻境/image/buff/${spoil.result}.png`);
                                divImp.setBackgroundImage(`extension/太虚幻境/image/buff/${spoil.result}.png`);
                            }
                        });
                        // divImp.setBackgroundImage(`extension/太虚幻境/image/buff/${spoil.result}.png`);
                        const buffName = buffPack[spoil.result].name;
                        ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivName', buffName, div);
                        break;
                    default:
                        divImp.setBackgroundImage(`extension/太虚幻境/image/icon/${spoil.name}.png`);
                        const effectName = game.effectPack[spoil.name].name;
                        const num1 = spoil.number;
                        ui.create.div('.taixuhuanjing_StateHomeSpoilsBoxDivName', `${effectName}+${num1}`, div);
                        break;
                }

                return div;
            };
            const list2 = list.flatMap(item => item.effect || []);
            list2.forEach(spoil => {
                let bool = spoil.source && spoil.source.includes('levelup');
                game.moveEffect(spoil, !bool);
                spoilsBox.appendChild(createSpoilItem(spoil));
            });
            spoilsBody.appendChild(title);
            spoilsBody.appendChild(spoilsBox);
        };
        if (num >= max && lib.config.taixuhuanjing.level < 10) {
            const list = [
                { name: '技能', type: 'randomSkill', info: '获得技能', num: 1, source: 'levelup' },
                { name: '卡牌', type: 'randomCard', info: '获得卡牌', num: 1, source: 'levelup' },
                { name: '装备', type: 'randomEquip', info: '获得装备', num: 1, source: 'levelup' },
                { name: '调度次数', type: 'adjust', info: '调度次数+1', num: 1, source: 'levelup' },
                { name: '体力上限', type: 'maxHp', info: '体力上限', num: 1, source: 'levelup' },
                { name: '初始手牌', type: 'minHs', info: '初始手牌+1', num: 1, source: 'levelup' },
                { name: '手牌上限', type: 'maxHs', info: '手牌上限+2', num: 2, source: 'levelup' },
                { name: '金币', type: 'coin', info: '金币+300', num: 300, source: 'levelup' },
                { name: '祝福', type: 'randomBuff', info: '获得祝福', num: 1, source: 'levelup' },
            ].randomGets(4);

            game.levelUp('等级提升', list, type, homeBody);
            lib.config.taixuhuanjing.exp = 0;
            lib.config.taixuhuanjing.level += 1;
            const maxExpMap = {
                2: 300,
                3: 700,
                4: 1200,
                5: 1800,
                6: 2300,
                7: 3000,
                8: 3500,
                9: 4000,
            };

            if (lib.config.taixuhuanjing.level in maxExpMap) {
                lib.config.taixuhuanjing.maxExp = maxExpMap[lib.config.taixuhuanjing.level];
            }

            game.messagePopup('等级提升至' + get.cnNumber(lib.config.taixuhuanjing.level, true) + '级');
        } else {
            if (type === true) {
                const event = game.eventPack[season][chapter][_status.TaiXuHuanJingGame.event.id];
                const list = [];
                event.spoils.forEach(spoil => {
                    if (Math.random() <= spoil.random) {
                        list.push(spoil);
                    }
                });
                event.enemy.forEach(enemy => {
                    if (enemy.spoils && enemy.spoils.length) {
                        enemy.spoils.forEach(spoil => {
                            if (Math.random() <= spoil.random) {
                                list.push(spoil);
                            }
                        });
                    }
                });
                if (lib.config.taixuhuanjing.buff.includes("txhj_aHaoSkill1")) {
                    list.push({
                        result: true,
                        name: '随机装备',
                        effect: [{ name: 'randomEquip', number: 1, source: 'buff' }],
                        random: 1,
                    });
                }
                homeBody.update(list);
            }
            lib.config.taixuhuanjing.exp = num;
        }
        lib.config.taixuhuanjing.events.push(_status.TaiXuHuanJingGame.event);
        if (game.eventPack[season][chapter][_status.TaiXuHuanJingGame.event.id].type === 'boss') {
            const eventPack = game.eventPack[season][chapter];
            const seasonPack = game.seasonPack[season];

            if (typeof chapter === 'number' && seasonPack[`${chapter}IF`]) {
                const premise = seasonPack[`${chapter}IF`].premise.slice(0);
                const result = premise.filter(id => !lib.config.taixuhuanjing.events.some(event => event.id === id)).length;

                if (result === 0) {
                    lib.config.taixuhuanjing.chapter = `${chapter}IF`;
                } else {
                    lib.config.taixuhuanjing.chapter++;
                }
            } else if (typeof chapter === 'string' && chapter.includes('IF')) {
                lib.config.taixuhuanjing.chapter = 1 + parseInt(chapter.split('IF')[0]);
            } else {
                lib.config.taixuhuanjing.chapter++;
                lib.config.taixuhuanjing.hp = lib.config.taixuhuanjing.maxHp;
                /*
                if (!game.eventPack['ChongYingChuLin'][chapter]) {
                            lib.config.taixuhuanjing.season = ['ChongYingChuLin','HuangTianZhiNu','HeJinZhuHuan','MGBaWangZhengCheng','MGGuanDuZhiZhan','HaiWaiFenghe','GFHuangJinZhiLuan','GFChangBanZhiZhan','GFChiBiZhiZhan','GFQiQinMengHuo','GFGuanduZhiZhan','LiGuoZhiLuan','ShiChangShiZhiLuan','QianLiZouDanJi','NSHeZhongKangQin','YcFuQinYiZhou','PveShouweijiange','PveKuibaSkMitan','MGWoLongChuShan'].randomGet();
                        }
                */
            }
            delete lib.config.taixuhuanjing.store;
            lib.config.taixuhuanjing.procedure = null;
            lib.config.taixuhuanjing.optional = [];
            lib.config.taixuhuanjing.optionalExam = [];
        }
        for (let i = 0; i < 3; i++) {
            const optional = lib.config.taixuhuanjing.optional[i];
            if (optional && optional != null && optional.id == _status.TaiXuHuanJingGame.event.id) {
                lib.config.taixuhuanjing.optional[i] = null;
            }
        }
        game.saveConfig('taixuhuanjing', lib.config.taixuhuanjing);
    };

    game.chooseCharacterTaiXuHuanJing = function () {//对局开始
        var next = game.createEvent('chooseCharacter', false);
        next.showConfig = true;
        next.setContent(function () {
            'step 0'
            delete _status.roundStart;
            game.roundNumber = 0;
            ui.arena.show();
            if (ui.auto.classList.contains("hidden")) ui.auto.classList.remove("hidden")
            if (window.dui) {
                const element = document.getElementById('dui-controls');
                if (element) {
                    element.style.removeProperty('display');
                }
                [
                    '#system2',
                    '.lbtn-paixu',
                    '.lbtn-controls',
                    '.latn-jilu',
                    '.skill-control',
                    '.hand-tip',
                    'img[src="extension/十周年UI/shoushaUI/lbtn/images/uibutton/liaotian.png"]'
                ].forEach(selector => {
                    const el = document.querySelector(selector);
                    if (el) {
                        el.style.removeProperty('display');
                    }
                });
            }
            ui.arenalog.innerHTML = '';/*清除历史记录*/
            ui.historybar.innerHTML = '';/*清除出牌记录*/
            ui.cardPile.innerHTML = '';
            ui.discardPile.innerHTML = '';
            ui.sidebar.innerHTML = '';/*清除暂停记录*/
            ui.sidebar3.innerHTML = '';/*清除暂停记录*/
            _status.txcs_yipoed = undefined; /*手杀特效*/
            //lib.card.list.randomSort();
            //game.clearArena();
            game.cardPileTx();
            'step 1'
            _status.modeBuff = lib.config.taixuhuanjing.buff.slice(0);
            _status.modeSkill = lib.config.taixuhuanjing.useSkills.slice(0);
            game.prepareArena(_status.TaiXuHuanJingGame.number);
            if (window.dui) {
                dui.bodySensor.events.pop();
            }
            'step 2'
            if (_status.gameStart == false) {
                game.pause();
                game.transitionAnimation();

                setTimeout(function () {
                    game.consoledesk();
                }, 1000);
            } else {
                game.resume();
            }
            'step 3'
            if (_status.gameStart == undefined) {
                _status.modeNode = lib.config.taixuhuanjing;
                lib.config.taixuhuanjing = _status.modeNode;
            };
           'step 4'
            if (_status.gameStart == undefined) {
                game.gameinit();
            }
          "step 5"
            if (_status.gameStart == undefined) {
                game.syncState();
                game.gamePremise();
                game.gameDraw(_status.firstAct || game.me);
                event.trigger('gameStart');
                if (_status.enterGame != undefined) {
                    for (var i = 0; i < game.players.length; i++) {
                        game.triggerEnter(game.players[i]);
                    }
                }
                _status.gameStart = true;
                _status.enterGame = true;
            }
           'step 6'
            game.phaseLoop(_status.firstAct || game.me);
           
           'step 7'
            if (_status.gameStart == true || _status.gameStart == false) {
                event.goto(2);
           }

        });
    };


    //*背景图片和背景音乐切换代码搬运自【金庸群侠传】扩展，还未询问作者，如侵犯了后续可以再删除，感谢金庸群侠传扩展代码的提供!
    //------------------------------------------背景图片---------------------------------------
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    if (lib.config.extension_太虚幻境_Background_Picture && lib.config.extension_太虚幻境_Background_Picture != "1") {
        lib.arenaReady.push(function () {
            game.txhjBackground_Picture();
        });
    };
    //------------------------------------------背景图片---------------------------------------
    //------------------------------------------背景音乐---------------------------------------
    //////////////////////////////////////////////////////////////////
    if (lib.config.extension_太虚幻境_Background_Music && lib.config.extension_太虚幻境_Background_Music != "1") {
        lib.arenaReady.push(function () {
            //ui.backgroundMusic.autoplay=true;
            //ui.backgroundMusic.pause();
            game.txhjplayBackgroundMusic();
            ui.backgroundMusic.addEventListener('ended', game.txhjplayBackgroundMusic);
        });
    };
    //------------------------------------------背景音乐结束---------------------------------------         

    game.addMode('taixuhuanjing', {
        name: 'taixuhuanjing',
        start: function () {
            "step 0"
            _status.mode = 'taixuhuanjing';
            "step 1"
            game.seasonPack = {};
            game.eventPack = {};
            game.tsymq_checkFileExist('extension/太虚幻境/dlc/', function (s) {
                if (s && game.getFileList) {
                    game.getFileList('extension/太虚幻境/dlc/', function (folders, files) {
                        if (folders) {
                            for (var f of folders) {
                                lib.init.js(lib.assetURL + 'extension/太虚幻境/dlc/' + f + '/extension_season.js', null, function () { }, function () {
                                    return;
                                });
                            }
                        }
                    });
                };
            });
            txhj.txhjModeImport();

            /*  for (const i in lib.cardPack) {
                  lib.cardPack[i].forEach(function (card) {
                      const cards = lib.card[card];
                      if (cards.type == 'equip' && cards.subtype == 'equip5') {
                          lib.card[card].subtype = 'equip4';
                      }
                  });
              }*/
            /* ["taipingyaoshu", "chitu", "zixin", "dawan", "jingfanma", "dilu", "zhuahuang", "hualiu", "jueying", "txhj_liulongcanjia", "txhj_juechenjinge"].forEach(i => {
                 if (i in lib.card) {
                     lib.card[i].subtype = "equip5";
                 }
             });*/
            if (lib.config.taixuhuanjingNode == undefined) {
                lib.config.taixuhuanjingNode = {
                    use: {},/*常用武将*/
                    forbidden: [],/*过滤部分问答*/
                };
                game.saveConfig('taixuhuanjingNode', lib.config.taixuhuanjingNode);
                game.updateModeData();
            };
            if (lib.config.taixuhuanjing == undefined) {
                game.updateModeData();
            }
            _status.TaiXuHuanJingGame = {
                event: null,
                number: 2,
                premise: '',
                enemy: [],
                friend: [],
                cards: [],
                skills: [],
                return: null,
            }
            "step 2"
            game.pause();
            game.taixuhuanjingHome();
            "step 3"
            game.chooseCharacterTaiXuHuanJing();
        },
        init: function () {
            document.interval = setInterval(function () {
                if (_status.modeNode == undefined) return;
                if (_status.modeNode.score == undefined) return;
                if (_status.modeNode.score.time == undefined) return;
                if (_status.gameStart == true && _status.enterGame == true) {
                    _status.modeNode.score.time++;
                }
            }, 1000);
        },

        game: {
            canReplaceViewpoint: () => true,
            txhjBackground_Picture: function () {
                var temp = lib.config['extension_太虚幻境_Background_Picture'];
                if (temp == 'auto') {
                    var list = [
                        'Chongyingshenfu',
                        'Huangtianzhinu',
                        'Hejinzhuhuan',
                        'Liguozhiluan',
                        'MGBawangzhengcheng',
                        'Huangjinqiyi',
                        'Huangjinzhiluan',
                        'ChangBanFengYu',
                        'ChangBanZhiZhan',
                        'Qiqinmenghuo',
                        'Huoshaowuchao',
                        'Guandu1',
                        'Guandu2',
                        'Guandu3',
                        'Hulaoguan',
                        'ShichangshiZL',
                        'Tianzishoukun',
                        'Hangongfudi',
                        'QianLiZouDanJi',
                        'Chibizhizhan',
                        /*'wms_JYBackground_honghuahui',*/
                    ];
                    if (_status.txhjBackground_Picture) list.remove(_status.txhjBackground_Picture);
                    temp = list.randomGet();
                }
                _status.txhjBackground_Picture = temp;
                if (temp !== '1') {
                    game.broadcastAll() + ui.background.setBackgroundImage("extension/太虚幻境/bgside/background/" + temp + ".jpg");
                } else {
                    game.broadcastAll() + ui.background.setBackgroundImage('bgside/background/' + lib.config.image_background + '.jpg');
                }
                var item = lib.config['extension_太虚幻境_Background_Picture'];
                if (item != "auto") {
                    if (_status.Background_Picture_timeout) {
                        clearTimeout(_status.Background_Picture_timeout);
                    };
                } else if (item == "auto") {
                    var autotime = lib.config['extension_太虚幻境_Background_Picture_auto'];

                    var Timeout = autotime ? parseInt(autotime) : 30000;

                    ///////////////////////////////////////////////////////
                    var Timeout2 = _status.Background_Picture_Timeout2;
                    if (_status.Background_Picture_timeout && Timeout2 && Timeout2 != Timeout) {
                        clearTimeout(_status.Background_Picture_timeout);
                    };
                    /////////////////////////////////////////////////
                    _status.Background_Picture_timeout = setTimeout(function () {
                        game.txhjBackground_Picture();
                    }, Timeout); /*Timeout*/
                    _status.Background_Picture_Timeout2 = Timeout;
                };
            },
            gameinit: function () {
                _status.firstAct = undefined;
                if (!lib.character[_status.choiceCharacter]) lib.character[_status.choiceCharacter] = get.character(_status.choiceCharacter);
                if (!lib.character[_status.choiceCharacter]) {
                    console.warn('无可用的角色数据:', _status.choiceCharacter);
                    return;
                }
                lib.character[_status.choiceCharacter][3] = _status.TaiXuHuanJingGame.skills.slice(0);
                let enemys = _status.TaiXuHuanJingGame.enemy.slice(0); // 敌方
                let friends = _status.TaiXuHuanJingGame.friend.slice(0); // 友方
                let players = enemys.concat(friends);
                players.sort((a, b) => a.seat - b.seat);
                let act = players.length > 0 && players[0].seat !== -1 ? players[0] : null;

                function getEmptySeats(players) {
                    if (!players.length) return [];
                    const seatSet = new Set();
                    let minSeat = Infinity;
                    let maxSeat = -Infinity;
                    for (const player of players) {
                        if (typeof player.seat === 'number' && !isNaN(player.seat) && player.seat >= 0) {
                            seatSet.add(player.seat);
                            minSeat = Math.min(minSeat, player.seat);
                            maxSeat = Math.max(maxSeat, player.seat);
                        }
                    }
                    if (minSeat === Infinity || maxSeat === -Infinity) return [];
                    const emptySeats = [];
                    for (let i = minSeat; i <= maxSeat; i++) {
                        if (!seatSet.has(i)) {
                            emptySeats.push(i);
                        }
                    }
                    return emptySeats;
                }
                const emptySeatsList = getEmptySeats(players);
                const firstEmptySeat = emptySeatsList.length > 0 ? emptySeatsList[0] : -1;
                for (let player of game.players) {
                    player.getId();
                    if (player === game.me) {
                        player.init(_status.choiceCharacter);
                        player.maxHp = lib.config.taixuhuanjing.maxHp;
                        player.hp = lib.config.taixuhuanjing.hp;
                        player.side = true;
                    } else {
                        let player_use = null;
                        if (firstEmptySeat == -1) {
                            player_use = players.shift();
                        } else {
                            player_use = players.splice(firstEmptySeat, 1)[0];
                            if (player_use == null) {
                                player_use = players.shift();
                            }
                        }
                        if (!player_use) {
                            console.warn('无可用的角色数据，跳过初始化:', player);
                            continue;
                        }
                        if (player_use.seat !== -1 && player_use === act) {
                            _status.firstAct = player;
                        }
                        player.init(player_use.name);
                        player.exten = player_use;
                        if (player_use.hp > 0 && player_use.hp !== -1) {
                            const hp1 = get.infoHp(player_use.hp);
                            const maxHp1 = get.infoMaxHp(player_use.hp);
                            player.maxHp = maxHp1;
                            player.hp = hp1;
                        }
                        if (player_use.effect?.includes('correct') && player_use.level < lib.config.taixuhuanjing.level) {
                            const num = lib.config.taixuhuanjing.level - player_use.level;
                            if (lib.config.taixuhuanjing.rank > 1) {
                                player.maxHp += num * 2;
                                player.hp += num * 2;
                            } else {
                                player.maxHp += num;
                                player.hp += num;
                            }
                        }
                        player.side = friends.includes(player_use);
                    }
                    player.update();
                }
                const startP = _status.firstAct || game.me;
                const startIndex = game.players.findIndex(player => player === startP) || 0;
                const vstartIndex = startIndex == -1 ? 0 : startIndex;
                const startPlayer = [...game.players.slice(vstartIndex), ...game.players.slice(0, vstartIndex)]
                for (let i = 0; i < startPlayer.length; i++) {
                    startPlayer[i].setSeatNum(i + 1);
                }
                for (let player of game.players) {
                    if (player === game.me) continue;
                    if (player.node?.identity) {
                        if (player.side === game.me?.side) {
                            player.node.identity.firstChild.innerHTML = '友';
                            player.identity = 'friend';
                        } else {
                            player.node.identity.firstChild.innerHTML = '敌';
                            player.identity = 'enemy';
                            if (player.exten && player.exten.type === 'boss') {
                                player.node.identity.firstChild.innerHTML = '神';
                            }
                        }
                        player.node.identity.dataset.color = `${player.side}`;
                    }
                }
                if (game.me && typeof game.me.seat === 'number') {
                    const dialogs = document.querySelectorAll('#arena > div.player > div.identity');
                    if (dialogs?.[0]) {
                        dialogs[0].setBackgroundImage('extension/太虚幻境/image/style/identity_gameme.png');
                    }
                }
            },
            initexten: function () {
                const config = lib.config.taixuhuanjing;
                function equipIfValid(equipConfig) {
                    if (equipConfig != null) {
                        const info = get.translation(equipConfig);
                        if (!lib.inpile.includes(equipConfig.name)) {
                            lib.inpile.push(equipConfig.name);
                            lib.inpile.sort(lib.sort.card);
                        }
                        if (info) {
                            game.me.equip(game.createCard(equipConfig.name, equipConfig.suit, equipConfig.number));
                        }
                    }
                }
                equipIfValid(config.equip1);
                equipIfValid(config.equip2);
                equipIfValid(config.equip3);
                equipIfValid(config.equip4);
                function getEquipCard(equipType) {
                    const equipMap = {
                        equip1: equips1,
                        equip2: equips2,
                        equip3: equips3
                    };
                    const equipArray = equipMap[equipType];
                    if (equipArray && equipArray.length > 0) {
                        const equipCard = equipArray.randomGet();
                        if (!lib.inpile.includes(equipCard)) {
                            lib.inpile.push(equipCard);
                            lib.inpile.sort(lib.sort.card);
                        }

                        equipArray.remove(equipCard);
                        return game.createCard(equipCard, ['spade', 'heart', 'club', 'diamond'].randomGet(), Array.from({ length: 13 }, (_, i) => i + 1).randomGet());
                    }
                    return null;
                }
                const equips0 = [];
                const equips1 = [];
                const equips2 = [];
                const equips3 = [];
                txhjPack.cardPack.forEach(card => {
                    equips0.push(card.cardID);
                    const num = get.cardRank(card.cardID);
                    if (num >= 3 && lib.translate[card.cardID] && get.type(card.cardID) === 'equip') {
                        const subtype = get.subtype(card.cardID);
                        if (subtype === 'equip1') {
                            equips1.push(card.cardID);
                        } else if (subtype === 'equip2') {
                            equips2.push(card.cardID);
                        } else {
                            equips3.push(card.cardID);
                        }
                    }
                });
                game.players.forEach(player => {
                    if (!player.exten || player == game.me) return;
                    const exten = player.exten;
                    if (exten.maxHp) {
                        player.maxHp += exten.maxHp;
                        player.hp += exten.maxHp;
                    }
                    if (exten.cards.length) {
                        const cards = exten.cards.map(cardName => game.createCard(cardName, ['spade', 'heart', 'club', 'diamond'].randomGet(), Array.from({ length: 13 }, (_, i) => i + 1).randomGet()));
                        if (cards.length) {
                            player.directgain(cards);
                        }
                    }
                    if (exten.skills.length) {
                        exten.skills.forEach(skill => player.addSkill(skill));
                    }
                    if (exten.equip.length) {
                        exten.equip.forEach(equipName => player.equip(game.createCard(equipName, ['spade', 'heart', 'club', 'diamond'].randomGet(), Array.from({ length: 13 }, (_, i) => i + 1).randomGet())));
                    }
                    if (player.side === false) {
                        if (config.rank > 1) {
                            player.maxHp++;
                            player.hp++;
                        }
                        if (config.rank > 2) {
                            player.addSkill('reyingzi');
                            player.addSkill('mashu');
                        }
                        if (config.rank > 3) {
                            const typelist = ['equip1', 'equip2', 'equip3'].randomSort();
                            if (config.effect === 'huanjingcaoge') {
                                const equip = typelist.shift();
                                const equipCard = getEquipCard(equip);
                                if (equipCard) {
                                    player.equip(equipCard);
                                }
                            } else {
                                typelist.remove(typelist.randomGet());
                            }
                            while (typelist.length) {
                                const equip = typelist.shift();
                                const equipCard = getEquipCard(equip);
                                if (equipCard) {
                                    player.equip(equipCard);
                                }
                            }
                        }
                        if (config.Apocalypse.maxHp > 0) {
                            player.maxHp += config.Apocalypse.maxHp;
                            player.hp += config.Apocalypse.maxHp;
                        }
                    }
                    const effect = config.effect;
                    if (effect === 'lingqiyiman') {
                        player.maxHp += 2;
                        player.hp += 2;
                    } else if (effect === 'lingqikuijie') {
                        if (player.maxHp > 1 && player.hp > 1) {
                            player.maxHp -= 1;
                            player.hp -= 1;
                        }
                    } else if (game.effectPack[effect] && game.effectPack[effect].skill.length) {
                        const skills = game.effectPack[effect].skill.slice(0);
                        skills.forEach(skill => {
                            if (!player.hasSkill(skill)) {
                                player.addSkill(skill);
                            }
                        });
                    }
                    player.update();
                });
            },
            transitionAnimation: function () {
                var dialog = ui.create.div('.taixuhuanjing_transitionDialog');
                document.body.appendChild(dialog);
                var topBody = ui.create.div('.taixuhuanjing_transitionDialogTopBody', dialog);
                var bottomLeft1 = ui.create.div('.taixuhuanjing_transitionDialogBottomLeft1', dialog);
                var bottomRight1 = ui.create.div('.taixuhuanjing_transitionDialogBottomRight1', dialog);
                var bottomLeft2 = ui.create.div('.taixuhuanjing_transitionDialogBottomLeft2', dialog);
                var bottomRight2 = ui.create.div('.taixuhuanjing_transitionDialogBottomRight2', dialog);
                setTimeout(function () {
                    dialog.delete();
                }, 2600);
            },
            gameDraw: function (player, num2 = 4) {
                if (get.mode() != 'taixuhuanjing') return;
                var next = game.createEvent('gameDraw');
                next.player = player || game.me;
                next.num = num2;
                next.setContent(async function () {
                    if (_status.brawl && _status.brawl.noGameDraw) {
                        return;
                    }
                    game.messagePopup(`分配手牌`);
                    let end = next.player, numx = next.num,event = _status.event;

                    const config = lib.config.taixuhuanjing;
                    do {

                        if (next.player == game.me) {
                            if (config.minHs >= 0) {
                                numx += config.minHs;
                            }
                            if (config.buff.includes('buff_txhj_pofuchenzhou')) {
                                numx = 1;
                            }
                            if (numx != game.me.maxHp && config.buff.includes('buff_txhj_fuzu')) {
                                numx = Math.min(game.me.maxHp, 30);
                            }
                        } else if (next.player?.exten) {
                            numx = next.player.exten.minHs;
                            if (config.rank > 4) {
                                numx += 3;
                            } else if (config.rank > 3) {
                                numx += 2;
                            } else if (config.rank > 2) {
                                numx += 1;
                            }
                            if (config.effect == 'chongfenbeizhan') {
                                numx += 2;
                            } else if (config.effect == 'cangcuchuji') {
                                numx -= 3;
                            }
                        }
                        if (typeof next.num == "function") {
                            numx = next.num(next.player);
                        }
                        /*otherPile主要是针对那些用专属牌堆，不从一般牌堆摸牌的角色（如陈寿），该属性目前只有两个键值对，且都为函数
                         *getCards函数与获得牌相关，只传入要获得的牌数num作为参数
                         *discard与手气卡换牌后弃置牌相关，只传入要弃置的牌card作为参数
                         */
                        const cards = [],
                            otherGetCards = event.otherPile?.[next.player.playerid]?.getCards;
                        //先看有没有专属牌堆，再看其他的
                        if (otherGetCards) {
                            cards.addArray(otherGetCards(numx));
                        } else if (next.player?.getTopCards && typeof next.player?.getTopCards === 'function') {
                            cards.addArray(next.player.getTopCards(numx));
                        } else {
                            cards.addArray(get.cards(numx));
                        }
                        //别问，问就是初始手牌要有标记 by 星の语
                        //event.gaintag支持函数、字符串、数组。数组就是添加一连串的标记；函数的返回格式为[[cards1,gaintag1],[cards2,gaintag2]...]
                        if (event.gaintag?.[next.player.playerid]) {
                            const gaintag = event.gaintag[next.player.playerid];
                            const list = typeof gaintag == "function" ? gaintag(numx, cards) : [[cards, gaintag]];
                            game.broadcastAll(
                                (player, list) => {
                                    for (let i = list.length - 1; i >= 0; i--) {
                                        next.player.directgain(list[i][0], null, list[i][1]);
                                    }
                                },
                                next.player,
                                list
                            );
                        } else {
                            next.player.directgain(cards);
                        }

                        if (next.player.singleHp === true && get.mode() != "guozhan" && (lib.config.mode != "doudizhu" || _status.mode != "online")) {
                            next.player.doubleDraw();
                        }
                        next.player._start_cards = next.player.getCards("h");
                        next.player = next.player.next;
                    } while (next.player != end);
                    let shouqika = lib.config.taixuhuanjing.adjust;
                    do {
                        if (!_status.auto && game.me.countCards("h")) {
                            const result = await game.me.chooseBool('可以免费使用' + shouqika + '次手气卡，是否更换手牌？').forResult();
                            if (result.bool) {
                                if (game.changeCoin) {
                                    game.changeCoin(-3);
                                }
                                const hs = game.me.getCards("h", c => !c.hasGaintag('牌库')),
                                    cards = [],
                                    otherGetCards = event.otherPile?.[game.me.playerid]?.getCards,
                                    otherDiscacrd = event.otherPile?.[game.me.playerid]?.discard;
                                //先弃牌
                                game.addVideo("lose", game.me, [get.cardsInfo(hs), [], [], []]);
                                for (let i = 0; i < hs.length; i++) {
                                    hs[i].removeGaintag(true);
                                    if (otherDiscacrd) {
                                        otherDiscacrd(hs[i]);
                                    } else {
                                        hs[i].discard(false);
                                    }
                                }
                                //再摸牌，先看有没有专属牌堆
                                if (otherGetCards) {
                                    cards.addArray(otherGetCards(hs.length));
                                } else {
                                    cards.addArray(get.cards(hs.length));
                                }
                                //添加标记相关
                                //别问，问就是初始手牌要有标记 by 星の语
                                //event.gaintag支持函数、字符串、数组。数组就是添加一连串的标记；函数的返回格式为[[cards1,gaintag1],[cards2,gaintag2]...]
                                if (event.gaintag?.[game.me.playerid]) {
                                    const gaintag = event.gaintag[game.me.playerid];
                                    const list = typeof gaintag == "function" ? gaintag(hs.length, cards) : [[cards, gaintag]];
                                    for (let i = list.length - 1; i >= 0; i--) {
                                        game.me.directgain(list[i][0], null, list[i][1]);
                                    }
                                } else {
                                    game.me.directgain(cards);
                                }
                                shouqika--;
                                game.me._start_cards = game.me.getCards("h");
                            } else {
                                game.me._start_cards = game.me.getCards("h");
                                break;
                            };
                        }
                        else {
                            break;
                        }
                    } while (shouqika > 0)

                    const hs1 = _status.TaiXuHuanJingGame.cards.map(cardData =>
                        game.createCard(cardData.name, cardData.suit, cardData.number, cardData.nature)
                    );
                    var hs2 = [];
                    var hs = game.me.getCards('h');
                    game.addVideo('lose', game.me, [get.cardsInfo(hs), [], []]);
                    for (var i = 0; i < hs.length; i++) {
                        hs2.push(hs[i]);
                        hs[i].discard(false);
                    };
                    if (hs1.length) {
                        game.me.directgain(hs1);
                    }
                    var hs3 = game.me.getCards('h');
                    for (var i = 0; i < hs3.length; i++) {
                        hs3[i].addGaintag('牌库');
                    };
                    if (hs2.length) {
                        game.me.directgain(hs2);
                    }
                    game.initexten();
                    var premise = _status.TaiXuHuanJingGame.premise;
                    game.messagePopup('' + premise + '');
                    if (lib.config['extension_' + '十周年UI' + '_enable']) {
                        setTimeout(decadeUI.effect.gameStart, 51);
                    };
                });
                return next;
            },
            phaseLoop(player) {
                let next = game.createEvent("phaseLoop");
                next.player = player;
                next._isStandardLoop = true;
                next.setContent(async function (event, trigger, player) {
                    let num = 1,
                        current = next.player;
                    while (current.getSeatNum() === 0) {
                        current.setSeatNum(num);
                        current = current.next;
                        num++;
                    }

                    while (_status.gameStart) {
                        if (!_status.gameStart) {
                            break;
                        }
                        if (game.players.includes(event.player)) {
                            lib.onphase.forEach(i => i());
                            const phase = event.player.phase();
                            event.next.remove(phase);
                            let isRoundEnd = false;
                            if (!_status.gameStart) {
                                break;
                            }

                            if (lib.onround.every(i => i(phase, event.player))) {
                                isRoundEnd = _status.roundSkipped;
                                if (_status.isRoundFilter) {
                                    isRoundEnd = _status.isRoundFilter(phase, event.player);
                                } else if (_status.seatNumSettled) {
                                    const seatNum = event.player.getSeatNum();
                                    if (seatNum != 0) {
                                        if (get.itemtype(_status.lastPhasedPlayer) != "player" || seatNum < _status.lastPhasedPlayer.getSeatNum()) {
                                            isRoundEnd = true;
                                        }
                                    }
                                } else if (event.player == _status.roundStart) {
                                    isRoundEnd = true;
                                }
                                if (isRoundEnd && _status.globalHistory.some(i => i.isRound)) {
                                    await event.trigger("roundEnd");
                                }
                            }
                            if (!_status.gameStart) {
                                break;
                            }

                            event.next.push(phase);
                            await phase;
                        }
                        if (!_status.gameStart) {
                            break;
                        }
                        await event.trigger("phaseOver");
                        if (!_status.gameStart) {
                            break;
                        }
                        let findNext = current => {
                            let players = game.players
                                .slice(0)
                                .concat(game.dead)
                                .sort((a, b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
                            let position = parseInt(current.dataset.position);
                            for (let i = 0; i < players.length; i++) {
                                if (parseInt(players[i].dataset.position) > position) {
                                    return players[i];
                                }
                            }
                            return players[0];
                        };
                        event.player = findNext(event.player);
                    }

                    if (!_status.gameStart) {
                        event.finish();
                        event._triggered = null;
                        next._isStandardLoop = false;
                    }
                });
                return next;
            },
            tsymq_checkFileExist: function (path, callback) {
                if (lib.node && lib.node.fs) {
                    try {
                        var stat = lib.node.fs.statSync(__dirname + '/' + path);
                        callback(stat);
                    } catch (e) {
                        callback(false);
                        return;
                    }
                } else {
                    resolveLocalFileSystemURL(localStorage.getItem('noname_inited') + path, (function (name) {
                        return function (entry) {
                            callback(true);
                        }
                    }(name)), function () {
                        callback(false);
                    });
                }
            },
            txhjplayBackgroundMusic: function () {
                //if(lib.config.background_music=='music_off'){
                //ui.backgroundMusic.src='';
                //}
                //ui.backgroundMusic.autoplay=true;
                var temp = lib.config.extension_太虚幻境_Background_Music;
                if (temp == '0') {
                    temp = Math.floor(2 + Math.random() * 70); //2加0到29
                    //生成一个范围2到63的整数
                    temp = temp.toString();
                    //转为字符串
                };
                ui.backgroundMusic.pause();
                var item = {
                    "2": "TX1.mp3",
                    "3": "TX2.mp3",
                    "4": "TX3.mp3",
                    "5": "DcQunxiong.mp3",
                    "6": "Xiafengwulin.mp3",
                    "7": "Doudizhu2.mp3",
                    "8": "Doudizhu.mp3",
                    /*   "9": "jy_bgm_zhuyuanqingge.mp3",
                       "10": "jy_bgm_jiangshanmeiren.mp3",*/
                };
                if (item[temp]) {
                    ui.backgroundMusic.src = lib.assetURL + 'extension/太虚幻境/audio/bgm/' + item[temp];
                } else {
                    game.playBackgroundMusic();
                    ui.backgroundMusic.addEventListener('ended', game.playBackgroundMusic);
                }
                /*
                if(lib.config.extension_太虚幻境_Background_Music&&lib.config.extension_太虚幻境_Background_Music!="1"){
                    ui.backgroundMusic.addEventListener('ended',game.txhjplayBackgroundMusic);    
                }
                else{
                    ui.backgroundMusic.addEventListener('ended',game.playBackgroundMusic); 
                }   
                */
            },
        },
        element: {
            player: {
                dieAfter: function (source) {
                    if (_status.mode !== 'taixuhuanjing') return;
                    const event1 = _status.TaiXuHuanJingGame.event;
                    const event2 = game.eventPack[event1.season][event1.chapter][event1.id];
                    if (game.me.isDead()) {
                        game.TaiXuHuanJingState(event2.unique ? false : null);
                        return;
                    }
                    const findEnemy = () => game.players.find(player => player.side === false);
                    if (event2.type === 'choose') {
                        const enemy = findEnemy();
                        if (!enemy) {
                            if (_status.auto) ui.auto.click();
                            game.TaiXuHuanJingState(true);
                        }
                        return;
                    }
                    if (event2.target === 'kill') {
                        const enemys = event2.enemy.slice(0);
                        const boss = enemys.find(enemy => enemy.type === 'boss' && enemy.name === this.name);
                        if (boss) {
                            if (_status.auto) ui.auto.click();
                            game.TaiXuHuanJingState(true);
                            return;
                        }
                    }
                    const enemy = findEnemy();
                    if (!enemy) {
                        if (_status.auto) ui.auto.click();
                        game.TaiXuHuanJingState(true);
                    }
                },
                dieAfter2: function (source) {
                    if (_status.mode != 'taixuhuanjing') return;
                    //十常侍
                    if (this.isOut() && _status.mbmowang_return[this.playerid]) return;
                    //bug修复
                    var friend;
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].side == this.side) {
                            friend = game.players[i]; break;
                        }
                    }
                    if (friend) {
                        if (source) {
                            if (source.side != this.side && game.hasPlayer(p => p.side != game.me.side)) {
                            game.messagePopup(`杀敌摸牌`);
                                if (source == game.me && lib.config.taixuhuanjing.rank > 1) {
                                    if (lib.config.taixuhuanjing.rank < 3) {
                                        source.draw(1);
                                    }
                                } else {
                                    source.draw(2);
                                }
                            }
                        }
                        else {
                            game.delay();
                        }
                    }
                },
                buffUpdate: function (name, str) {
                    if (!this || !name) return;
                    if (name.startsWith('_')) {
                        name = name.substring(1);
                    }
                    const info = buffPack[name];
                    if (this?.buff?.[name] && typeof this.buff[name].update === 'function') {
                        this.buff[name].update();
                        if (info.name && false) {
                            let str2 = `触发了【${info.name}】`;
                            if (str) str2 += `,${str}`;
                            game.log(this, str2)
                        }
                    } else return;
                },
            },
        },
        get: {
            modBuff: function (obj, method, player) {
                if (typeof obj == "string") obj = { name: obj };
                if (typeof obj != "object") return;
                let name = get.name(obj, player);
                let type = get.type(obj, player);
                if (type != 'equip') return;
                if (!lib.card[name] || !lib.card[name].txModBuff) return;
                return lib.card[name].txModBuff;
            },
            skillIdInServantData: function (skillId, number) {//检查触发技能是否存在于servantData.skillDesc的函数
                for (var i in servantData.skillDesc) {
                    if (typeof servantData.skillDesc[i] === 'object') {
                        if ((!number && number !== 0) || typeof number !== 'number') {
                            if (skillId in servantData.skillDesc[i]) {
                                return true;
                            }
                        } else {
                            if (Object.keys(servantData.skillDesc[i])[number]) {
                                if (skillId === Object.keys(servantData.skillDesc[i])[number]) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            },
            rawAttitude: function (from, to) {
                if (from.side === to.side) {
                    return from.exten && from.exten.type === 'boss' ? 10 : 6;
                } else {
                    if (from == game.me) {
                        return to.exten && to.exten.type === 'boss' ? -10 : -5;
                    }
                    return from !== game.me ? -5 : -10;
                }
            },
            cardRank: function (card) {
                const cards = txhjPack.cardRank.find(e => e.cardID === card);
                if (cards) {
                    return cards.rank || 1;
                }
                return 1;
            },
            cardValue: function (card) {
                const cards = txhjPack.cardRank.find(e => e.cardID === card);
                if (cards) {
                    return cards.value || 100;
                }
                return 100;
            },
            skillRank: function (skill) {
                const skills = txhjPack.skillRank.find(e => e.skillID === skill && e.rank);
                if (skills) {
                    return skills.rank;
                }
                return 1;
            },
            skillValue: function (skill) {
                const skills = txhjPack.skillRank.find(e => e.skillID === skill && e.value);
                if (skills) {
                    return skills.value;
                }
                return 500;
            },
            eventState: function (event) {
                const events = lib.config.taixuhuanjing.events.slice(0);
                return events.some(e => e && e.id === event.id && e.season === event.season && e.chapter === event.chapter && e.seat === event.seat);
            },
            eventReserve: function (event) {
                const events = lib.config.taixuhuanjing.procedure.slice(0);
                return events.some(e => e && e.id === event.id && e.season === event.season && e.chapter === event.chapter);
            },
        },
        skill: {},
        characterPack: {},
        translate: {
            enemy: '敌',
            friend: '友',
        },
        cardPack: {},
        posmap: {},
    }, {
        translate: '太虚幻境',
        extension: '太虚幻境',
        config: {
            quankuo: {
                name: '全扩将池',
                init: false,
                intro: '解除选择限制',
            },

            star: {
                init: 0,
                intro: "武将星级",
                name: "武将星级",
                item: {
                    0: "默认",
                    1: "一星",
                    2: "二星",
                    3: "三星",
                    4: "四星",
                    5: "五星",
                }
            },
            //*背景图片和背景音乐切换代码搬运自【金庸群侠传】扩展，还未询问作者，如侵犯了后续可以再删除，感谢金庸群侠传扩展代码的提供!
            //换背景壁纸
            "Background_Picture": {
                name: "太虚局内背景",
                intro: "太虚局内背景：可随意切换精美高清的背景图片。",
                init: lib.config.extension_太虚幻境_Background_Picture === undefined ? "1" : lib.config.extension_太虚幻境_Background_Picture,
                item: {
                    "1": "无背景",
                    "Chongyingshenfu": "冲应神符",
                    "Huangtianzhinu": "黄天之怒",
                    "Hejinzhuhuan": "何进诛宦",
                    "Liguozhiluan": "李郭之乱",
                    "MGBawangzhengcheng": "魔改霸王",
                    "Huangjinqiyi": "黄巾起义",
                    "Huangjinzhiluan": "黄巾之乱",
                    "ChangBanFengYu": "长坂坡风雨",
                    "ChangBanZhiZhan": "长板桥之战",
                    "Qiqinmenghuo": "七擒孟获",
                    "Huoshaowuchao": "火烧乌巢",
                    "Guandu1": "官渡之战1",
                    "Guandu2": "官渡之战2",
                    "Guandu3": "官渡之战3",
                    "Hulaoguan": "虎牢关",
                    "ShichangshiZL": "十常侍之乱",
                    "Tianzishoukun": "天子受困",
                    "Hangongfudi": "汉宫府邸",
                    "QianLiZouDanJi": "千里单骑",
                    "Chibizhizhan": "赤壁之战",
                    /*"wms_JYBackground_honghuahui": "红花群豪",
                    "auto": "自动换背景",*/
                },
                onclick: function (item) {
                    game.saveConfig('extension_太虚幻境_Background_Picture', item);
                    game.txhjBackground_Picture();
                },
                "visualMenu": function (node, link) { //link是冒号前面的，比如default:经典卡背，link就是default
                    node.style.height = node.offsetWidth * 0.67 + "px"; //高度设置成宽度的0.67倍
                    node.style.backgroundSize = '100% 100%'; //图片拉伸
                    node.className = 'button character txhjBackgroundname';
                    node.setBackgroundImage('extension/太虚幻境/bgside/background/' + link + '.jpg'); //设置图片
                },
            },
            //换音乐
            "Background_Music": {
                name: "太虚背景音乐",
                intro: "太虚背景音乐：可随意点播和切换太虚局内背景音乐",
                init: lib.config.extension_太虚幻境_Background_Music === undefined ? "1" : lib.config.extension_太虚幻境_Background_Music,
                item: {
                    "0": "随机播放",
                    "1": "默认音乐",
                    "2": "七擒孟获",
                    "3": "赤壁之战",
                    "4": "黄巾之乱",
                    "5": "群雄逐鹿",
                    "6": "侠风武林",
                    "7": "斗地主高声",
                    "8": "斗地主低声",
                    /*   "9": "竹林情歌",
                       "10": "爱江山更爱美人",*/
                },
                onclick: function (item) {
                    game.saveConfig('extension_太虚幻境_Background_Music', item);
                    game.txhjplayBackgroundMusic();
                    ui.backgroundMusic.addEventListener('ended', game.txhjplayBackgroundMusic);
                },
                "visualMenu": function (node, link) {
                    node.style.height = node.offsetWidth * 1.33 + "px";
                    node.style.backgroundSize = '100% 100%';
                    node.className = 'txhjmusicname';
                    node.setBackgroundImage('extension/太虚幻境/image/thumbnail/bgm/' + link + '.png');
                },
            },
            deleteModeNode: {
                name: '重置记录',
                init: false,
                restart: true,
                unfrequent: true,
                intro: '删除所有统计记录',
                onclick: function (bool) {
                    if (bool) {
                        var src = "是否删除所有记录并重新启动游戏？";
                        var d = confirm(src);
                        if (d == true) {
                            game.saveConfig('taixuhuanjingRecord', undefined)
                            game.saveConfig('taixuhuanjingNode', undefined)
                            game.saveConfig('txhjtianfuData', undefined);
                            game.saveConfig('taixuhuanjing', undefined);
                            game.reload()
                        }
                    }
                }
            },

        },
    });
    game.effectPack = {
        'correct': {
            name: '等级补正',
            type: 'correct',
            effect: 'buff',
            info: '等级补正：你每超出其一级，其额外+1体力及体力上限',
            num: 1,
            skill: [],
            button: '等级补正',
        },
        'strengthen': {
            name: '难度补正',
            type: 'strengthen',
            effect: 'buff',
            info: '难度补正：额外+1体力及体力上限',
            num: 1,
            skill: [],
            button: '难度补正',
        },
        'nightmare': {
            name: '难度补正',
            type: 'nightmare',
            effect: 'buff',
            info: '难度补正：额外+1体力及体力上限，拥有技能英姿、马术',
            num: 1,
            skill: [],
            button: '难度补正',
        },
        'purgatory': {
            name: '难度补正',
            type: 'purgatory',
            effect: 'buff',
            info: '难度补正：额外+1体力及体力上限，装备一件随机装备并拥有技能英姿、马术',
            num: 1,
            skill: [],
            button: '难度补正',
        },
        'pinganwushi': {
            name: '平安无事',
            type: 'effect',
            effect: 'buff',
            info: '无效果',
            num: 0,
            skill: [],
            button: '平安无事',
        },
        'lingqiyiman': {
            name: '灵气溢满',
            type: 'effect',
            effect: 'buff',
            info: '所有角色体力及体力上限+2',
            num: 200,
            skill: [],
            button: '灵气溢满',
        },
        'lingqikuijie': {
            name: '灵气匮竭',
            type: 'effect',
            effect: 'buff',
            info: '所有角色体力及体力上限-1',
            num: 0.4,
            skill: [],
            button: '灵气匮竭',
        },
        'xueyan': {
            name: '血宴',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【狂骨】',
            num: 0.4,
            skill: ['kuanggu'],
            button: '血宴',
        },
        'nanjianzhenxiong': {
            name: '难见真凶',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【绝情】',
            num: 0.4,
            skill: ['jueqing'],
            button: '难见真凶',
        },
        'libengyuehuai': {
            name: '礼崩乐坏',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【崩坏】',
            num: 0.4,
            skill: ['benghuai'],
            button: '礼崩乐坏',
        },
        'chongfenbeizhan': {
            name: '充分备战',
            type: 'effect',
            effect: 'buff',
            info: '所有角色初始手牌+2',
            num: 0.4,
            skill: [],
            button: '充分备战',
        },
        'cangcuchuji': {
            name: '仓促出击',
            type: 'effect',
            effect: 'buff',
            info: '所有角色初始手牌-3',
            num: 0.4,
            skill: [],
            button: '仓促出击',
        },
        'hongyanhuoshui': {
            name: '红颜祸水',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【红颜】',
            num: 0.4,
            skill: ['hongyan'],
            button: '红颜祸水',
        },
        'daodaozhiming': {
            name: '刀刀致命',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【贪食】【仇海】',
            num: 0.4,
            skill: ['txhj_tanshi', 'rechouhai'],
            button: '刀刀致命',
        },
        'xiaoxinxuanya': {
            name: '小心悬崖',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【缠怨】',
            num: 0.4,
            skill: ['chanyuan'],
            button: '小心悬崖',
        },
        'jiuzhuangrendan': {
            name: '酒壮人胆',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【醉酒】',
            num: 0.4,
            skill: ["txhj_zuijiu"],
            button: '酒壮人胆',
        },
        'pinsiduijue': {
            name: '拼死对决',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【矢志】',
            num: 0.4,
            skill: ['shizhi'],
            button: '拼死对决',
        },
        'xincunbuliang': {
            name: '心存不良',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【腹麟】',
            num: 0.4,
            skill: ['fulin'],
            button: '心存不良',
        },
        'bukelianzhan': {
            name: '不可恋战',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【亡阻】',
            num: 0.4,
            skill: ['txhj_wangzu'],
            button: '不可恋战',
        },
        'jianxuefangxiu': {
            name: '见血方休',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【虎啸】',
            num: 0.4,
            skill: ['txhj_oldhuxiao'],
            button: '见血方休',
        },
        'huanjingcaoge': {
            name: '幻境操戈',
            type: 'effect',
            effect: 'buff',
            info: '所有角色都会获得一件随机装备',
            num: 0.4,
            skill: [],
            button: '幻境操戈',
        },
        'rulangshigu': {
            name: '如狼噬骨',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【狼袭】',
            num: 0.4,
            skill: ['xinfu_langxi'],
            button: '如狼噬骨',
        },
        'yaowuyangwei': {
            name: '耀武扬威',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【耀武】',
            num: 0.4,
            skill: ['yaowu'],
            button: '耀武扬威',
        },
        'xianzhenpocheng': {
            name: '陷阵破城',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【陷阵】',
            num: 0.4,
            skill: ['xianzhen'],
            button: '陷阵破城',
        },
        'huangtiandangli': {
            name: '黄天当立',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【黄巾】',
            num: 0.4,
            skill: ['txhj_huangjin'],
            button: '黄天当立',
        },
        'ganjinshajue': {
            name: '赶尽杀绝',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【株连】',
            num: 0.4,
            skill: ['taixu_zhulian'],
            button: '赶尽杀绝',
        },
        'tanqiuwudu': {
            name: '贪求无度',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【协贿】',
            num: 0.4,
            skill: ['taixu_xiehui'],
            button: '贪求无度',
        },
        'beigonghuanluan': {
            name: '北宫宦乱',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【黄门】',
            num: 0.4,
            skill: ['txhj_huangmen'],
            button: '北宫宦乱',
        },
        'zhenfenjiang': {
            name: '情绪激昂',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【激昂】',
            num: 0.4,
            skill: ['jiang'],
            button: '情绪激昂',
        },
        'xiangzhangbayi': {
            name: '嚣张跋扈',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【挑衅】',
            num: 0.4,
            skill: ['tiaoxin'],
            button: '嚣张跋扈',
        },
        'rulianshi': {
            name: '入殓师',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【行殇】',
            num: 0.4,
            skill: ['xingshang'],
            button: '入殓师',
        },
        'yinsheroumi': {
            name: '淫奢肉糜',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【肉林】',
            num: 0.4,
            skill: ['roulin'],
            button: '淫奢肉糜',
        },
        'qianlizhuixi': {
            name: '千里追袭',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【追袭】',
            num: 0.4,
            skill: ['zhuixi'],
            button: '千里追袭',
        },
        'fenhuoqinyin': {
            name: '烽火琴音',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【琴音】',
            num: 0.4,
            skill: ['qinyin'],
            button: '烽火琴音',
        },
        'toulianghuanzhuy': {
            name: '偷梁换柱',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【夺刀】',
            num: 0.4,
            skill: ['xinduodao'],
            button: '偷梁换柱',
        },
        'hengxingbadao': {
            name: '横行霸道',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【横征】',
            num: 0.4,
            skill: ['hengzheng'],
            button: '横行霸道',
        },
        'manzusinue': {
            name: '蛮族肆虐',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【叛侵】',
            num: 0.4,
            skill: ['sppanqin'],
            button: '蛮族肆虐',
        },
        'taozhiyaoyao': {
            name: '逃之夭夭',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【度断】',
            num: 0.4,
            skill: ['duoduan'],
            button: '逃之夭夭',
        },
        'huangtianjiangshi': {
            name: '黄天降世',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【黄符】',
            num: 0.4,
            skill: ['txhuangfu'],
            button: '黄天降世',
        },
        'jiaolietanlang': {
            name: '狡鬣贪狼',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【贪狈】',
            num: 0.4,
            skill: ['xinfu_tanbei'],
            button: '狡鬣贪狼',
        },
        'binglangxiongbing': {
            name: '并狼凶兵',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【凶军】',
            num: 0.4,
            skill: ['twxiongjun'],
            button: '并狼凶兵',
        },
        'zhulangqifeng': {
            name: '诛狼骑锋',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【狼灭】',
            num: 0.4,
            skill: ['junklangmie'],
            button: '诛狼骑锋',
        },
        'yemuzhaoya': {
            name: '夜幕的爪牙',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【帷幕】',
            num: 0.4,
            skill: ['weimu'],
            button: '夜幕的爪牙',
        },
        'manzhonggushu': {
            name: '蛮中蛊术',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【蛮汲】',
            num: 0.4,
            skill: ['manji'],
            button: '蛮中蛊术',
        },
        'xianzhenjinling': {
            name: '陷阵禁令',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【禁酒】',
            num: 0.4,
            skill: ['rejinjiu'],
            button: '陷阵禁令',
        },
        'moucexielou': {
            name: '谋策泄露',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【谋溃】',
            num: 0.4,
            skill: ['moukui'],
            button: '谋策泄露',
        },
        'tengjiaxiongbing': {
            name: '藤甲雄兵',
            type: 'effect',
            effect: 'buff',
            info: '所有角色获得技能【蛮甲】',
            num: 0.4,
            skill: ['txmanjia'],
            button: '藤甲雄兵',
        },

        /*效果说明*/
        'addServant': {
            name: '添加侍灵,最多两个',
        },
        'randomBuff': {
            name: '随机祝福',
        },
        'randomCard': {
            name: '随机卡牌',
        },
        'randomEquip': {
            name: '随机装备',
        },
        'randomSkill': {
            name: '随机技能',
        },

        'removeBuff': {
            name: '移除随机祝福',
        },
        'removeCard': {
            name: '移除随机卡牌',
        },
        'removeEquip': {
            name: '移除随机装备',
        },
        'removeSkill': {
            name: '移除随机技能',
        },

        'buff': {
            name: '祝福',
        },
        'card': {
            name: '卡牌',
        },
        'equip': {
            name: '装备',
        },
        'skill': {
            name: '技能',
        },

        'hp': {
            name: '体力',
        },
        'maxHp': {
            name: '体力上限',
        },
        'minHs': {
            name: '初始手牌',
        },
        'maxHs': {
            name: '手牌上限',
        },

        'attack': {
            name: '攻击技能',
        },
        'defense': {
            name: '防御技能',
        },
        'assist': {
            name: '控制技能',
        },
        'burst': {
            name: '爆发技能',
        },

        'basic': {
            name: '基本牌',
        },
        'trick': {
            name: '锦囊牌',
        },
        'exp': {
            name: '经验',
        },
        'coin': {
            name: '金币',
        },
        'adjust': {
            name: '手气卡',
        },
        'maxSkills': {
            name: '技能插槽',
        },
        'equip1': {
            name: '武器',
        },
        'equip2': {
            name: '防具',
        },
        'equip5': {
            name: '宝物',
        },
    };
    return {};
};

export default framework;
