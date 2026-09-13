import { lib, game, ui, get, ai, _status } from "../../../noname.js";

const skill = {
    //------------------------------------//
    //NPC替换
    game: {
        changeBoss: function (name, player) {
            if (!player) {
                if (game.additionaldead) {
                    game.additionaldead.push(game.boss);
                }
                else {
                    game.additionaldead = [game.boss];
                }
                player = game.boss;
                delete game.boss;
            }

            player.delete();
            game.players.remove(player);
            game.dead.remove(player);
            var boss = ui.create.player();
            boss.getId();
            boss.init(name);
            boss.side = true;
            game.addVideo('bossSwap', player, (game.boss ? '_' : '') + boss.name);
            boss.dataset.position = player.dataset.position;
            if (game.me == player) {
                game.swapControl(boss);
            }
            game.players.push(boss.animate('zoominanim'));
            game.arrangePlayers();
            if (!game.boss) {
                game.boss = boss;
                boss.setIdentity('zhu');
                boss.identity = 'zhu';
            }
            else {
                boss.setIdentity('zhong');
                boss.identity = 'zhong';
            }
            ui.arena.appendChild(boss);
            boss.directgain(get.cards(4));
        },
    },
    //待援
    "txhj_daiyuan": {
        global: "txhj_daiyuan2",//全场调用此技能  
        forced: true,
        ai: {
            threaten: 2,
        },
    },

    "txhj_daiyuan2": {
        enable: 'phaseUse',
        direct: true,
        filter: function (event, player) {
            if (player.hasSkill("txhj_daiyuan") || !game.hasPlayer(function (target) {
                return target.hasSkill("txhj_daiyuan") && target.isDamaged();
            })) return false;
            if (player.hasSkill('txhj_daiyuanA') && player.hasSkill('txhj_daiyuanB')) return false;
            var num = player.countCards("he");
            if (num < 2) return false;
            var c = player.getCards("he")[0];
            var num1 = player.countCards("he", ca => get.color(ca, player) == get.color(c, player));
            var num2 = player.countCards("he", ca => get.type2(ca, player) == get.type2(c, player));
            if (player.hasSkill('txhj_daiyuanB') && num1 == num) return false;
            else if (player.hasSkill('txhj_daiyuanA') && num2 == num) return false;
            else return num1 + num2 < 2 * num;
        },
        content: function () {
            "step 0"
            var list = ['选项一', '选项二', 'cancel2'];
            if (player.hasSkill('txhj_daiyuanA')) {
                list.remove('选项一');
            }
            if (player.hasSkill('txhj_daiyuanB')) {
                list.remove('选项二');
            }

            var str = '弃置两张XX不同的牌，令【待援】角色回复一点体力';
            str = [str.replace(/XX/g, '颜色'), str.replace(/XX/g, '类型')];
            player.chooseControl(list).set('choiceList', str).set('ai', function () {
                if (player.countCards('he', card => get.value(card) < 6 && player.countCards('he', card1 => card != card1 && get.color(card, player) != get.color(card1, player) && get.value(card1) < 6) > 0) && list.includes('选项一')) return '选项一';
                if (player.countCards('he', card => get.value(card) < 6 && player.countCards('he', card1 => card != card1 && get.type2(card, player) != get.type2(card1, player) && get.value(card1) < 6) > 0) && list.includes('选项二')) return '选项二';
                return 'cancel2';
            });
            "step 1"
            if (result.control != 'cancel2') {
                event.control = result.control;
                event.filter1 = function (card) {
                    var color = get.color(card);
                    for (var i = 0; i < ui.selected.cards.length; i++) {
                        if (get.color(ui.selected.cards[i]) == color) return false;
                    }
                    return true;
                };
                event.filter2 = function (card) {
                    var type2 = get.type2(card);
                    for (var i = 0; i < ui.selected.cards.length; i++) {
                        if (get.type2(ui.selected.cards[i]) == type2) return false;
                    } return true;
                };
                var next = player.chooseToDiscard(2, 'he');
                next.set('ai', function (card) {
                    return 6 - get.value(card);
                });
                next.set('complexCard', true);
                if (result.control == '选项一') {
                    next.set('filterCard', event.filter1);
                    next.set('prompt2', '弃置两张颜色不同的牌');
                } else if (result.control == '选项二') {
                    next.set('filterCard', event.filter2);
                    next.set('prompt2', '弃置两张类型不同的牌');
                }
            } else event.finish();
            "step 2"
            if (result.bool) {
                if (event.control == '选择一') {
                    player.addTempSkill('txhj_daiyuanA');
                } else if (event.control == '选择二') {
                    player.addTempSkill('txhj_daiyuanB');
                }
                var target = game.findPlayer(function (current) {
                    return current.hasSkill('txhj_daiyuan') && current.isDamaged();
                });
                player.line(target, 'green');
                player.logSkill('txhj_daiyuan', target);
                target.recover();
            };
        },
        ai: {
            order: 1,
            result: {
                player: function (player) {
                    var target = game.findPlayer(function (target) {
                        return target.hasSkill("txhj_daiyuan") && target.isDamaged();
                    });
                    if (get.attitude(player, target) < 0) return 0;
                    var list = ['选项一', '选项二', 'cancel2'];
                    if (player.hasSkill('txhj_daiyuanA')) {
                        list.remove('选项一');
                    }
                    if (player.hasSkill('txhj_daiyuanB')) {
                        list.remove('选项二');
                    }
                    if (player.countCards("he", ca => get.value(ca) < 6 && player.countCards("he", c => ca != c && get.color(ca, player) != get.color(c, player) && get.value(c) < 6)) > 0 && list.includes('选项一')) return 1;
                    if (player.countCards("he", ca => get.value(ca) < 6 && player.countCards("he", c => ca != c && get.type2(ca, player) != get.type2(c, player) && get.value(c) < 6)) > 0 && list.includes('选项二')) return 1;
                    return 0;
                },
            },
            threaten: 5.7,
        },
    },

    "txhj_daiyuanA": {
        mark: true,
        marktext: "★️",
        intro: {
            name: "待援·颜色",
            content: "本回合已发动过【待援】选项一",
        },
    },

    "txhj_daiyuanB": {
        mark: true,
        marktext: "○",
        intro: {
            name: "待援·类型",
            content: "本回合已发动【待援】选项二",
        },
    },
    //------------------------//
    //醉酒
    "txhj_zuijiu": {
        trigger: {
            source: 'damageBegin1',
        },
        filter: function (event) {
            //限制事件卡牌必须为杀，notlink限制没有相关的加伤事件叠加。如果两个加伤技能的过滤器里面都有notlink判断，只触发其中一个。
            return event.card && event.card.name == 'sha' && event.notLink();
        },
        forced: true,
        content: function () {
            trigger.num++;
        },
        ai: {
            damageBonus: true,
        },
    },
    //-------------------------//
    //暴击
    "txhj_baoji": {
        trigger: {
            source: 'damageBegin1',
        },
        filter: function (event, player) {
            //醉酒改动一下，就OK。默认概率40%触发。如果选项里开启了幸运星模式则百分百触发。
            return get.isLuckyStar(player) || (event.card && event.card.name == 'sha' && event.getRand() < 0.4);
        },
        forced: true,
        content: function () {
            trigger.num++;
        },
        ai: {
            damageBonus: true
        },
    },
    //-------------------------//
    //拘魂
    "txhj_juhun": {
        group: ['txhj_juhun_phase', 'txhj_juhun_die'],
        subSkill: {
            phase: {
                trigger: {
                    player: "phaseAfter",
                },
                priority: -15,
                direct: true,
                content: function () {
                    player.storage.txhj_juhun = true;
                },
                sub: true,
            },
            die: {
                trigger: {
                    global: "die",
                },
                priority: -15,
                marktext: "拘魂",
                direct: true,
                filter: function (event, player) {
                    if (!player.storage.txhj_juhun) return false;
                    return event.player.side == player.side;
                },
                content: function () {
                    'step 0'
                    if (!player.storage.txhj_juhun_die) {
                        player.storage.txhj_juhun_die = []
                    };
                    'step 1'
                    player.storage.txhj_juhun_die.push(trigger.player);
                    player.markSkill('txhj_juhun_die');
                },
                intro: {
                    name: "上回合阵亡的友军",
                    content: "player",
                },
                sub: true,
            },
        },
        trigger: {
            player: "phaseBegin",
        },
        priority: 1,
        forced: true,
        locked: true,
        filter: function (event, player) {
            player.storage.txhj_juhun = false;
            if (!player.storage.txhj_juhun_die) player.storage.txhj_juhun_die = [];
            return player.storage.txhj_juhun_die.length > 0;
        },
        init: function (player, skill) {
            player.storage.txhj_juhun = false;
        },
        content: function () {
            'step 0'
            var revive = player.storage.txhj_juhun_die.randomGet();
            revive.revive(3);
            game.addVideo('revive', revive);
            revive.draw(3);
            'step 1'
            player.storage.txhj_juhun_die = [];
            player.unmarkSkill('txhj_juhun_die');
        },
    },
    //----------------------------//
    //鬼魅
    "txhj_guimei": {
        forced: true,
        mod: {
            targetEnabled: function (card, player, target) {
                if (get.type(card) == 'delay') {
                    return false;
                }
            },
        },
        ai: {
            threaten: 2.7
        }
    },
    //--------------------------//
    //暴敛
    "txhj_baolian": {
        trigger: { player: 'phaseJieshuBegin' },
        frequent: true,
        forced: true,
        preHidden: true,
        content: function () {
            player.draw(2);
        },
    },
    //-------------------------//
    //悲鸣
    "txhj_beiming": {
        trigger: { player: 'dieBegin' },
        forced: true,
        filter: function (event) {
            return event.source != undefined;
        },
        content: function () {
            trigger.source.discard(trigger.source.getCards('h'));
        },
        ai: {
            threaten: 0.7
        }
    },
    //----------------------//
    //狂暴
    "txhj_kuangbao": {
        trigger: {
            source: "damageBegin",
        },

        forced: true,
        init: function (player, storage) {
            player.storage.txhj_kuangbao = 0;
            player.syncStorage('txhj_kuangbao');
            player.markSkill('txhj_kuangbao');
        },
        mark: true,
        marktext: "狂暴",
        intro: {
            name: "狂暴",
            content: "造成的伤害+#",
        },
        filter: function (event, player) {
            return player.storage.txhj_kuangbao >= 1;

        },
        content: function () {
            var num = player.storage.txhj_kuangbao;
            trigger.num += num;
        },
        group: ["txhj_add", "txhj_clear"],
        ai: {
            threaten: 3.7
        },
    },

    //每轮开始记录一次，如果满足七轮条件，增加伤害收益
    "txhj_add": {
        trigger: {
            global: "roundStart",
        },
        mark: true,
        marktext: "⑦",
        intro: {
            name: "⑦",
            content: "已经连续#轮未进入濒死状态。",
        },
        init: function (player, storage) {
            player.storage.txhj_add = 0;
            player.syncStorage('txhj_add');
            player.markSkill('txhj_add');
        },
        forced: true,
        priority: 10,
        filter: function (event, player) {
            return !player.hasSkill("txhj_debuff") && game.roundNumber != 1;
        },
        content: function () {
            "step 0"
            player.storage.txhj_add++;
            player.syncStorage('txhj_add');
            player.markSkill('txhj_add');
            "step 1"
            if (player.storage.txhj_add == 7) {
                var num = player.storage.txhj_add;
                player.storage.txhj_add -= num;
                player.syncStorage('txhj_add');
                player.unmarkSkill('txhj_add');
                player.storage.txhj_kuangbao++;
                player.syncStorage('txhj_kuangbao');
                player.markSkill('txhj_kuangbao');
            }
        },
    },

    //进入濒死时，清空记录，并加上一个临时技能，用于判断。
    "txhj_clear": {
        trigger: {
            player: "dying",
        },
        forced: true,
        content: function () {
            "step 0"
            if (player.storage['txhj_add'] > 0) {
                var num = player.storage.txhj_add;
                player.storage['txhj_add'] -= num;
                player.syncStorage('txhj_add');
                player.unmarkSkill('txhj_add')
            };
            "step 1"
            if (!player.hasSkill('txhj_debuff')) {
                player.addSkill('txhj_debuff')
            };
        },

    },

    //进入濒死时，加上这个临时技能。
    "txhj_debuff": {
        trigger: {
            global: "roundStart",
        },
        forced: true,
        mark: true,
        marktext: "溃败",
        intro: {
            name: "溃败",
            content: "已进入过濒死状态，【狂暴】将于新的一轮重新计算。",
        },
        priority: 1,/*技能发动的优先级，考虑到要判断轮数结算，把它排在狂暴技能结算之后。*/
        content: function () {
            player.removeSkill("txhj_debuff");
        },
    },

    //--------------------------//
    //吞噬
    "txhj_tunshi": {
        trigger: {
            player: "phaseBegin",
        },
        forced: true,

        filter: function (event, player, target) {

            return game.hasPlayer(function (target) {
                return target.isEnemyOf(player) && target.countCards('h') > player.countCards('h');
            });

        },
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txhj_tunshi'), function (card, player, target) {
                return target.isEnemyOf(player) && target.countCards('h') > player.countCards('h');
            }, true).ai = function (target) {
                var att = get.attitude(player, target);

                return -att;
            };
            "step 1"
            if (result.bool) {
                player.logSkill('txhj_tunshi', result.targets);
                result.targets[0].damage();
            }
        },
        ai: {
            threaten: 2.7,
        },
    },

    //--------------------------//
    //穿云
    "txhj_chuanyun": {
        trigger: {
            player: "phaseEnd",
        },
        direct: true,

        filter: function (event, player, target) {

            return game.hasPlayer(function (target) {
                return target.isEnemyOf(player) && target.hp > player.hp;
            });

        },
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txhj_chuanyun'), function (card, player, target) {
                return target.isEnemyOf(player) && target.hp > player.hp;
            }).ai = function (target) {
                var att = get.attitude(player, target);

                return -att;
            };
            "step 1"
            if (result.bool) {
                player.logSkill('txhj_chuanyun', result.targets);
                result.targets[0].damage();
            }
        },
        ai: {
            threaten: 1.7,
        },
    },

    //------------------------//
    //鬼火
    "txhj_guihuo": {
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txhj_guihuo'), function (card, player, target) {
                return player != target;
            }).ai = function (target) {
                return get.damageEffect(target, player, player, 'fire');
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txhj_guihuo', result.targets);
                result.targets[0].damage('fire');
            }
        },
    },

    //-----------------------//
    //落雷
    "txhj_luolei": {
        trigger: { player: 'phaseZhunbeiBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txhj_luolei'), function (card, player, target) {
                return player != target;
            }).ai = function (target) {
                return get.damageEffect(target, player, player, 'thunder');
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txhj_luolei', result.targets);
                result.targets[0].damage('thunder');
            }
        },
    },


    //亡阻
    "txhj_wangzu": {
        trigger: {
            player: "dieBegin",
        },
        filter: function (event, player) {
            return _status.currentPhase != player;
        },
        forced: true,
        priority: 10,
        content: function () {
            var evt = _status.event.getParent('phaseUse');
            if (evt && evt.name == 'phaseUse') {
                evt.skipped = true;
                game.log(player, '发动了【亡阻】');
                event.finish();
            }
        },
        ai: {
            threaten: 5.7,
        },
    },
    /*黄天之怒*/
    //------黄巾------//
    "txhj_huangjin": {
        trigger: {
            target: 'useCardToTarget'
        },
        filter: function (event, player) {
            return get.name(event.card) == 'sha';
        },
        frequent: true,
        content: function () {
            'step 0'
            player.judge(function (result) {
                var a = Math.abs(get.number(trigger.card) - result.number);
                if (a <= 1) return 1;
                return -1;
            });
            'step 1'
            if (result.bool) {
                trigger.getParent().targets.length = 0;
                trigger.getParent().all_excluded = true;
                game.log(trigger.card, '对', player, '无效');
            }
        },
        ai: {
            threaten: 1.5,
        },
    },
    //------咒诅------//
    'txhj_zhouzu': {
        audio: 2,
        mahouSkill: true,
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && !current.hasSkill('txhj_zhouzu_mahou');
            });
        },
        filterTarget: function (card, player, target) {
            return target != player && !target.hasSkill('txhj_zhouzu_mahou');
        },
        content: function () {
            'step 0'
            player.chooseControl('1回合', '2回合', '3回合').set('prompt', '请选择施法时长').set('ai', function () {
                var player = _status.event.player;
                var safe = player.hp;
                if (safe < Math.min(3, game.countPlayer())) {
                    var next = player.next;
                    while (next != player && get.attitude(next, player) > 0) {
                        safe++;
                        next = next.next;
                    }
                }
                return Math.max(1, Math.min(safe, 3, game.countPlayer())) - 1;
            });
            'step 1'
            if (!player.storage.txhj_zhouzu_mahou) {
                player.storage.txhj_zhouzu_mahou = [result.index + 1, result.index + 1, target];
            }
            player.addTempSkill('txhj_zhouzu_mahou', { player: 'die' });
        },
        ai: {
            damage: true,
            thunderAttack: true,
            threaten: 2.5,
            order: 7,
            result: {
                target: function (player, target) {
                    var eff = get.damageEffect(target, player, target, 'thunder');

                    return eff;

                },
            },
        },
        subSkill: {
            mahou: {
                trigger: { global: 'phaseEnd' },
                forced: true,
                popup: false,
                charlotte: true,
                content: function () {
                    var list = player.storage.txhj_zhouzu_mahou;
                    list[1]--;
                    if (list[1] == 0) {
                        game.log(player, '的“咒诅”魔法生效');
                        player.logSkill('txhj_zhouzu');
                        var num = list[0];
                        var target = list[2];
                        if (target && target.isAlive()) {
                            player.line(target, 'thunder');
                            target.chooseToDiscard(num, true, 'he');
                            target.damage(1, 'thunder');
                        }
                        player.removeSkill('txhj_zhouzu_mahou');
                    }
                    else {
                        game.log(player, '的“咒诅”魔法剩余', '#g' + (list[1]) + '回合');
                        player.markSkill('txhj_zhouzu_mahou');
                    }
                },
                mark: true,
                onremove: true,
                marktext: '诅',
                intro: {
                    name: '施法：咒诅',
                    markcount: function (storage) {
                        if (storage) return storage[0] + '-' + storage[1];
                        return 0;
                    },
                    content: function (storage) {
                        if (storage) {
                            return '经过' + storage[1] + '个回合结束时，施法目标:' + get.translation(storage[2]) + '受到一点雷电伤害，弃置' + storage[0] + '张牌';
                        }
                        return '未指定施法效果';
                    },
                },
            },
        },
    },
    //------鬼门------//
    "txhj_guimen": {
        trigger: {
            player: 'loseAfter'
        },
        forced: true,
        filter: function (event, player) {
            if (event.type != 'discard' || !event.cards) return false;
            return event.cards.some(card => get.suit(card) == 'spade');
        },
        content: async function (event, trigger, player) {
            let list = [];
            var num = 0;
            trigger.cards.forEach(card => {
                if (get.suit(card) == 'spade') list.push(card);
            })
            while (list.length > 0) {
                let card = list.pop();
                game.log('即将对失去的', card, '进行判定');
                let judge = await player.judge(function (result) {
                    return get.number(card) - get.number(result) <= 1 ? 2 : -1;
                }).forResult();
                if (judge.bool && get.number(card) - get.number(judge) <= 1) {
                    num += 1;
                    game.log('鬼门临时选择次数+1');
                }
            }
            while (num > 0) {
                let result = await player.chooseTarget(true, '选择一个目标对其造成两点雷电伤害', function (card, player, target) {
                    return player != target;
                }).set('ai', (target) => {
                    let player = get.player();
                    return get.damageEffect(target, player, player, 'thunder');
                }).forResult();
                if (result?.bool && result?.targets?.length) {
                    player.line(result.targets[0], 'thunder');
                    await result.targets[0].damage(2, 'thunder');
                }
                num--;
            }
        },
        ai: {
            effect: {
                target: function (card) {
                    if (get.tag(card, 'loseCard')) {
                        return [0.5, 1];
                    }
                }
            }
        }
    },
    //------妖术------//
    'txhj_yaoshu': {
        mahouSkill: true,
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && !current.hasSkill('txhj_yaoshu_mahou');
            });
        },
        filterTarget: function (card, player, target) {
            return target != player && !target.hasSkill('txhj_yaoshu_mahou');
        },
        content: function () {
            'step 0'
            player.chooseControl('1回合', '2回合', '3回合').set('prompt', '请选择施法时长').set('ai', function () {
                var player = _status.event.player;
                var safe = Math.min(player.getHandcardLimit(), player.countCards('h', 'shan'));
                if (safe < Math.min(3, game.countPlayer())) {
                    var next = player.next;
                    while (next != player && get.attitude(next, player) > 0) {
                        safe++;
                        next = next.next;
                    }
                }
                return Math.max(2, Math.min(safe, 3, game.countPlayer())) - 1;
            });
            'step 1'
            if (!target.storage.txhj_yaoshu_mahou) {
                target.storage.txhj_yaoshu_mahou = [result.index + 1, result.index + 1];
            }
            target.addTempSkill('txhj_yaoshu_mahou', { player: 'die' });
        },
        ai: {
            order: 2,
            result: {
                player: 1,
                target: -0.5,
            },
        },
        subSkill: {
            mahou: {
                trigger: { global: 'phaseEnd' },
                forced: true,
                popup: false,
                charlotte: true,
                content: function () {
                    var list = player.storage.txhj_yaoshu_mahou;
                    list[1]--;
                    if (list[1] == 0) {
                        game.log(player, '的“妖术”魔法生效');
                        player.logSkill('txhj_yaoshu');
                        var num = list[0];
                        player.addSkill('txhj_yaoshu_effect');
                        player.addMark('txhj_yaoshu_effect', num, false);
                        player.removeSkill('txhj_yaoshu_mahou');
                    }
                    else {
                        game.log(player, '的“妖术”魔法剩余', '#g' + (list[1]) + '回合');
                        player.markSkill('txhj_yaoshu_mahou');
                    }
                },
                mark: true,
                onremove: true,
                marktext: '妖',
                intro: {
                    name: '施法：妖术',
                    markcount: function (storage) {
                        if (storage) return storage[0] + '-' + storage[1];
                        return 0;
                    },
                    content: function (storage) {
                        if (storage) {
                            return '经过' + storage[1] + '个回合结束后，获得' + storage[0] + '层“卡牌无效”的效果';
                        }
                        return '未指定施法效果';
                    },
                },
            },
            effect: {
                charlotte: true,
                onremove: true,
                trigger: { player: ['useCardToBefore', 'useCard'] },
                forced: true,
                filter: function (event, player) {
                    return player.hasMark('txhj_yaoshu_effect');
                },
                content: function () {
                    trigger.targets.length = 0;
                    trigger.all_excluded = true;
                    game.log(trigger.card, '无效');
                    player.removeMark('txhj_yaoshu_effect', 1, false);
                    if (!player.countMark('txhj_yaoshu_effect')) player.removeSkill('txhj_yaoshu_effect');
                },
                marktext: '妖︎',
                intro: {
                    onremove: true,
                    content: '接下来使用或打出的#张牌无效',
                },
            },
        },
    },
    //------咒法------//
    'txhj_zhoufa': {
        mahouSkill: true,
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && !current.hasSkill('txhj_zhoufa_mahou');
            });
        },
        filterTarget: function (card, player, target) {
            return target != player && !target.hasSkill('txhj_zhoufa_mahou');
        },
        content: function () {
            'step 0'
            player.chooseControl('1回合', '2回合', '3回合').set('prompt', '请选择施法时长').set('ai', function () {
                var player = _status.event.player;
                var safe = 1;
                if (safe < Math.min(3, game.countPlayer(), player.getDamagedHp())) {
                    var next = player.next;
                    while (next != player && get.attitude(next, player) > 0) {
                        safe++;
                        next = next.next;
                    }
                }
                return Math.max(1, Math.min(safe, 3, game.countPlayer(), player.getDamagedHp())) - 1;
            });
            'step 1'

            if (!player.storage.txhj_zhoufa_mahou) {
                player.storage.txhj_zhoufa_mahou = [result.index + 1, result.index + 1, target];
            }
            player.addTempSkill('txhj_zhoufa_mahou', { player: 'die' });
        },
        ai: {
            damage: true,
            thunderAttack: true,
            threaten: 5.5,
            order: 8,
            result: {
                target: function (player, target) {
                    var eff = get.damageEffect(target, player, target, 'thunder');
                    if (target.isLinked()) {
                        return eff / 10;
                    }
                    else {
                        return eff;
                    }
                },
            },
        },
        subSkill: {
            mahou: {
                trigger: { global: 'phaseEnd' },
                forced: true,
                popup: false,
                charlotte: true,
                content: function () {
                    var list = player.storage.txhj_zhoufa_mahou;
                    list[1]--;
                    if (list[1] == 0) {
                        game.log(player, '的“咒法”魔法生效');
                        player.logSkill('txhj_zhoufa');
                        var num = list[0];
                        var
                            target = list[2];
                        if (target && target.isAlive()) {
                            player.line(target, 'thunder');
                            target.damage(num, 'thunder');
                        }
                        player.removeSkill('txhj_zhoufa_mahou');
                    }
                    else {
                        game.log(player, '的“咒法”魔法剩余', '#g' + (list[1]) + '回合');
                        player.markSkill('txhj_zhoufa_mahou');
                    }
                },
                mark: true,
                onremove: true,
                marktext: '法',
                intro: {
                    name: '施法：咒法',
                    markcount: function (storage) {
                        if (storage) return storage[0] + '-' + storage[1];
                        return 0;
                    },
                    content: function (storage) {
                        if (storage) {
                            return '经过' + storage[1] + '个回合结束时后，施法目标:' + get.translation(storage[2]) + '受到' + storage[0] + '点雷电伤害';
                        }
                        return '未指定施法效果';
                    },
                },
            },
        },
    },
    //------尸怨------//
    "txhj_shiyuan": {
        forced: true,
        priority: 1,
        trigger: {
            source: "damageBegin1"
        },
        group: ["txhj_shiyuan_die", "txhj_shiyuan_fuhuo"],
        content: function () {
            trigger.num++;
        },
        subSkill: {
            die: {
                trigger: {
                    player: "dying"
                },
                forced: true,
                priority: 4,
                content: function () {
                    player.die();
                    game.log(player, '因【尸怨】直接死亡。');
                },
            },
            fuhuo: {
                trigger: {
                    source: ["dieAfter"],
                },
                priority: 5,
                forced: true,
                filter: function (event, player) {
                    if (player.identity == 'zhu' || event.player.identity == 'zhu') return false;
                    return event.player != player;
                },
                content: function () {
                    'step 0'
                    var target = trigger.player;
                    target.side = player.side;
                    target.identity = player.identity;
                    target.setIdentity(get.translation(player.identity));
                    target.node.identity.dataset.color = player.identity;
                    target.init('txhj_changyuanshibing');
                    target.maxHp = 3;
                    target.revive(Infinity);
                    target.draw(4);
                    target.update();
                },
            },
        },
        ai: {
            threaten: 1.5,
            effect: {
                'target_use': function (card, player, target) {
                    if (target.hp <= 2 && get.tag(card) == 'damage' && player.hasSkill('txhj_shiyuan')) {
                        return [1, 3]
                    }
                },
            },
        },
    },
    //------人望------//
    "txhj_renwang": {
        trigger: {
            player: "loseAfter",
            global: "cardsDiscardAfter",
        },
        forced: true,
        marktext: "方",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        mod: {
            maxHandcard: function (player, num) {
                if (player.getExpansions('txhj_renwang')) {
                    return num + player.getExpansions('txhj_renwang').length;
                } else {
                    return num;
                }
            },
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') {
                    if (player.getExpansions('txhj_renwang')) {
                        return num + Math.ceil(player.getExpansions('txhj_renwang').length / 5);
                    } else {
                        return num;
                    }
                }
            },
        },
        filter: function (event, player) {
            if (event.type == 'discard') return false;
            var evt = event.getParent();
            if (evt.name != 'orderingDiscard' || !evt.relatedEvent || evt.relatedEvent.player != player || !['useCard', 'respond'].includes(evt.relatedEvent.name)) return false;
            return (event.cards2 || event.cards).filterInD('d').length > 0;
        },
        content: function () {
            var card = trigger.cards[0];
            player.addToExpansion(card, 'gain2').gaintag.add('txhj_renwang');
        },
    },
    //------人方------//
    "txhj_renfang": {
        audio: 2,
        mahouSkill: true,
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return !player.hasSkill('txhj_renfang_mahou') && player.getExpansions('txhj_renwang').length >= 36;
        },
        prompt: "是否移去36张“方”，并施法？",
        content: function () {
            'step 0'
            var list = player.getExpansions('txhj_renwang');
            player.loseToDiscardpile(list.slice(0, 36));
            player.chooseControl('1回合', '2回合', '3回合').set('prompt', '请选择施法时长').set('ai', function () {
                var player = _status.event.player;
                var safe = 1;
                if (safe < Math.min(3, game.countPlayer(), player.getDamagedHp())) {
                    var next = player.next;
                    while (next != player && get.attitude(next, player) > 0) {
                        safe++;
                        next = next.next;
                    }
                }
                return Math.max(1, Math.min(safe, 3, game.countPlayer(), player.getDamagedHp())) - 1;
            });
            'step 1'
            player.storage.txhj_renfang_mahou = [result.index + 1, result.index + 1];
            player.addTempSkill('txhj_renfang_mahou', { player: 'die' });
        },
        ai: {
            order: 9,
            result: {
                player: 1,
            },
        },
        subSkill: {
            mahou: {
                trigger: { global: 'phaseEnd' },
                priority: 2,
                forced: true,
                popup: false,
                charlotte: true,
                content: function () {
                    "step 0"
                    var list = player.storage.txhj_renfang_mahou;
                    list[1]--;
                    if (list[1] == 0) {
                        game.log(player, '的“人方”魔法生效');
                        player.logSkill('txhj_renfang');
                        player.markSkill('txhj_renfang_mahou');
                        event.count = list[0];
                        event.goto(1);
                    }
                    else {
                        game.log(player, '的“人方”魔法剩余', '#g' + (list[1]) + '回合');
                        player.markSkill('txhj_renfang_mahou');
                        event.finish();
                    }
                    "step 1"
                    event.count--;
                    player.chooseTarget(true, '选择一个目标对其造成36点雷电伤害', function (card, player, target) {
                        return player != target && !target.hasSkill('txhj_renfang_miss');
                    }).ai = function (target) {
                        return get.damageEffect(target, player, player, 'thunder');
                    }
                    "step 2"
                    if (result.targets.length) {
                        player.line(result.targets, 'thunder');
                        result.targets[0].damage(36, 'thunder');
                        result.targets[0].addTempSkill('txhj_renfang_miss');
                        if (event.count > 0) {
                            event.goto(1);
                        } else {
                            player.removeSkill('txhj_renfang_mahou');
                            event.finish();
                        }
                    } else {
                        player.removeSkill('txhj_renfang_mahou');
                        event.finish();
                    }
                },
                mark: true,
                onremove: true,
                marktext: '⚡️',
                intro: {
                    name: '施法：人方',
                    markcount: function (storage) {
                        if (storage) return storage[0] + '-' + storage[1];
                        return 0;
                    },
                    content: function (storage) {
                        if (storage) {
                            return '经过' + storage[1] + '个“回合结束时”后，依次选择' + storage[0] + '名其他角色，对其各造成36点雷电伤害';
                        }
                        return '未指定施法效果';
                    },
                },
            },
            miss: {
                forced: true,
            },
        },
    },
    //------地咒------//
    "txhj_dizhou": {
        trigger: {
            player: ['phaseBegin', 'phaseEnd']
        },
        filter: function (event, player) {
            return player.countCards('he') > 0;
        },
        frequent: true,
        content: function () {
            'step 0'
            player.chooseCard('he', get.prompt('txhj_dizhou'), '将一张牌作为“地咒”置于武将牌上').set('ai', function (card) {
                if (player.getExpansions('txhj_dizhou')) {
                    var suit = get.suit(card);
                    for (var i of player.getExpansions('txhj_dizhou')) {
                        if (get.suit(i, false) == suit) return 4 - get.value(card);
                    }
                }
                return 5.5 - get.value(card);
            });
            'step 1'
            if (result.bool) {
                var card = result.cards[0];
                player.addToExpansion(card, 'gain2').gaintag.add('txhj_dizhou');
            }
            else event.finish();
            'step 2'
            game.delayx();

        },
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove: function (player, skill) {
            var cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
        },
        group: ['txhj_dizhou_use', 'txhj_dizhou_clear'],
        subSkill: {
            use: {
                trigger: { global: ['useCardToBefore'] },
                forced: true,
                locked: false,
                filter: function (event, player) {
                    if (event.player == player || event.player.isFriendsOf(player)) return false;
                    var cards = player.getExpansions('txhj_dizhou');
                    if (!player.getExpansions('txhj_dizhou') || !cards.length) return false;
                    var suit = get.suit(event.card, false);

                    if (suit == 'none') return false;
                    for (var i of player.getExpansions('txhj_dizhou')) {
                        if (get.suit(i, false) == suit) return true;
                    }
                    return false;
                },
                content: function () {
                    'step 0'
                    game.log('地咒:即将对', trigger.player, '使用的', trigger.card, '进行判定');
                    trigger.player.judge(function (card) {
                        if (get.color(card) == 'black') return 1;
                        return -1;
                    });
                    'step 1'
                    if (get.color(result.card) == 'black') {
                        if (trigger.player && trigger.player.isIn() && !trigger._notrigger.includes(trigger.player)) {
                            trigger.player.randomDiscard(true);
                        }
                    }
                    if (get.suit(result.card) == 'spade') {
                        trigger.targets.length = 0;
                        trigger.all_excluded = true;
                        trigger.cancel();
                        game.log(trigger.card, '无效');
                    }
                    if (get.number(result.card) > 1 && get.number(result.card) < 10 && get.suit(result.card) == 'spade') {
                        trigger.player.loseHp(1, true);
                    }

                },
            },
            clear: {
                trigger: {
                    player: 'damageEnd'
                },
                forced: true,
                filter: function (event, player) {
                    if (!player.getExpansions('txhj_dizhou').length) return false;
                    return true;
                },
                content: function () {
                    var cards = player.getExpansions('txhj_dizhou').randomGet();
                    player.loseToDiscardpile(cards);
                },
            },
        },
    },
    //------地遁------//
    "txhj_didun": {
        trigger: { global: 'judge' },
        filter: function (event, player) {
            return player.countCards('hes', { color: 'black' }) > 0;
        },
        direct: true,
        content: function () {
            "step 0"
            player.chooseCard(get.translation(trigger.player) + '的' + (trigger.judgestr || '') + '判定为' +
                get.translation(trigger.player.judging[0]) + '，' + get.prompt('txhj_didun'), 'hes', function (card) {
                    if (get.color(card) != 'black') return false;
                    var player = _status.event.player;
                    var mod2 = game.checkMod(card, player, 'unchanged', 'cardEnabled2', player);
                    if (mod2 != 'unchanged') return mod2;
                    var mod = game.checkMod(card, player, 'unchanged', 'cardRespondable', player);
                    if (mod != 'unchanged') return mod;
                    return true;
                }).set('ai', function (card) {
                    var trigger = _status.event.getTrigger();
                    var player = _status.event.player;
                    var judging = _status.event.judging;
                    var result = trigger.judge(card) - trigger.judge(judging);
                    var attitude = get.attitude(player, trigger.player);
                    if (attitude == 0 || result == 0) {
                        if (trigger.player != player) return 0;
                        if (game.hasPlayer(function (current) {
                            return get.attitude(player, current) < 0;
                        })) {
                            var checkx = lib.skill.xinleiji.judgeCheck(card, true) - lib.skill.xinleiji.judgeCheck(judging);
                            if (checkx > 0) return checkx;
                        }
                        return 0;
                    };
                    if (attitude > 0) {
                        return result;
                    }
                    else {
                        return -result;
                    }
                }).set('judging', trigger.player.judging[0]);
            "step 1"
            if (result.bool) {
                player.respond(result.cards, 'highlight', 'txhj_didun', 'noOrdering');
            }
            else {
                event.finish();
            }
            "step 2"
            if (result.bool) {
                var card = trigger.player.judging[0];
                player.$gain2(card);
                player.gain(card);
                if (get.color(card) == 'black') player.draw();
                trigger.player.judging[0] = result.cards[0];
                trigger.orderingCards.addArray(result.cards);
                game.log(trigger.player, '的判定牌改为', result.cards[0]);
            }
            "step 3"
            game.delay(2);
        },
        ai: {
            rejudge: true,
            tag: {
                rejudge: 1
            }
        }
    },
    //------亡怨------//
    "txhj_wangyuan": {
        trigger: { global: 'dieAfter' },
        forced: true,
        group: ["txhj_wangyuan_add"],
        init: function (player, skill) {
            player.storage.txhj_wangyuan = 0;
            player.syncStorage('txhj_wangyuan');
            player.markSkill('txhj_wangyuan');
        },
        marktext: "亡怨",
        intro: {
            name: "亡怨",
            content: "本局游戏，你造成的属性伤害基数+#",
        },
        content: function () {
            player.gainMaxHp();
            player.recover();
            player.storage.txhj_wangyuan++;
            player.syncStorage('txhj_wangyuan');
            player.markSkill('txhj_wangyuan');
        },
        ai: {
            threaten: 1.5
        },
        subSkill: {
            add: {
                forced: true,
                priority: 4,
                trigger: {
                    source: "damageBegin1",
                },
                filter: function (event, player) {
                    if (!event.nature) return false;
                    return event.notLink() && player.storage.txhj_wangyuan > 0;
                },
                content: function () {
                    var n = player.storage.txhj_wangyuan;
                    trigger.num += n;
                    if (trigger.card) {
                        game.log('亡怨:', trigger.card, '的属性伤害基数+' + n);
                    } else {
                        game.log('亡怨:属性伤害基数+' + n);
                    }
                },
            },
        },
    },
    //------注魂------//
    "txhj_zhuhun": {
        enable: "phaseUse",
        group: ["txhj_zhuhun_die"],
        usable: 1,
        filter: function (event, player) {
            if (!player.storage.txhj_zhuhun_die) player.storage.txhj_zhuhun_die = [];
            return player.storage.txhj_zhuhun_die.length > 0;
        },
        content: async function (event, trigger, player) {
            const list = player.storage.txhj_zhuhun_die;
            const result  = await player.chooseButton(ui.create.dialog('选择一名已阵亡的同阵营角色令其复活为【长怨尸兵】', list,), function ({ link }) {
                return get.attitude(link, get.player()) + Math.random();
            }).forResult();
            if (!result || !result.bool) return;
            const target = result.links[0];
            await target.init('txhj_changyuanshibing');
            target.maxHp = 3;
            await target.revive(Infinity);
            await target.draw(4);
            target.update();
            player.storage.txhj_zhuhun_die.remove(result.links[0]);
            player.markSkill('txhj_zhuhun_die');
        },
        subSkill: {
            die: {
                trigger: {
                    global: "die",
                },
                priority: -15,
                forced: true,
                marktext: "注魂",
                direct: true,
                init: function (player) {
                    player.storage.txhj_zhuhun_die = [];
                    player.markSkill('txhj_zhuhun_die');
                },
                filter: function (event, player) {
                    return event.player.isFriendOf(player);
                },
                content: async function (event, trigger, player) {
                    player.storage.txhj_zhuhun_die.add(trigger.player);
                    player.markSkill('txhj_zhuhun_die');
                },
                intro: {
                    name: "已阵亡的同阵营角色",
                    content: "player",
                },
                sub: true,
            },
        },
        ai: {
            order: 9,
            result: {
                player: 1,
            },
            threaten: 2.5,
        },
    },
    //------咒雷------//
    "txhj_zhoulei": {
        trigger: { global: 'drawAfter' },
        forced: true,
        logTarget: 'player',
        filter: function (event, player) {
            if (event.player == player) return false;
            var a = event.player.countCards('h');
            if (!player.countMark('txhj_zhoulei')) {
                var b = 0;
            } else {
                var b = player.countMark('txhj_zhoulei');
            }
            var c = 5 - b;
            return Math.abs(a - b) >= c;
        },
        content: function () {
            player.line(trigger.player, 'thunder');
            trigger.player.damage(1, 'thunder');
            if (player.countMark('txhj_zhoulei') < 5) {
                player.addMark('txhj_zhoulei', 1, false);
                game.log(player, '的【咒雷】已发动次数+1');
            }

        },
        intro: {
            name: "咒雷",
            content: function (storage, player) {
                if (!player.countMark('txhj_zhoulei')) {
                    var num = 0;
                } else {
                    var num = player.countMark("txhj_zhoulei");
                }
                var c = 5 - num;
                var str = '当一名其他角色摸牌后，若其与你的手牌数之差>=' + '<b>' + c + '</b>' + '，你对其造成1点雷电伤害。';
                return str;
            },
        },
        mark: true,
        marktext: '咒雷',
    },
    //------诡炎------//
    "txhj_guiyan": {
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        direct: true,
        priority: 2,
        forced: true,
        filter: function (event, player, target) {
            return game.hasPlayer(function (target) {
                return target.hp >= player.hp && target != player;
            });
        },
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txhj_guiyan'), true, function (card, player, target) {
                return target.hp >= player.hp && target != player;
            }).ai = function (target) {
                var att = get.attitude(player, target);

                return -att;
            };
            "step 1"
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill('txhj_guiyan', result.targets);
                player.line(target, 'fire');
                player.addTempSkill('txhj_guiyan_yan');

                player.storage.txhj_guiyan_yan = [];
                player.storage.txhj_guiyan_yan.push(target);
                player.markSkill('txhj_guiyan_yan');
                target.addTempSkill('txhj_guiyan_huo');
                if (!target.hasSkill('ranshang')) {
                    target.addSkill('ranshang');
                } else {
                    if (player.canUse('huogong', target)) {
                        player.useCard({ name: 'huogong', isCard: true }, target);
                        game.log('【诡炎】:', player, '即将对', target, '使用【火攻】');
                    } else {
                        event.finish();
                    }

                }
            }
        },
        ai: {
            threaten: 1.7,
        },
        subSkill: {
            yan: {
                mark: true,
                marktext: '诡炎',
                onremove: function (player, skill) {

                    player.storage.txhj_guiyan_yan = [];
                    player.unmarkSkill('txhj_guiyan_yan');
                },
                intro: {
                    name: '诡炎：标记目标',
                    markcount: function (storage) {
                        if (storage) return get.translation(storage[0]);
                        return 0;
                    },
                    content: function (storage) {
                        if (storage) {
                            return '本回合对' + get.translation(storage[0]) + '造成的伤害均视为火属性，且伤害+1';
                        }
                        return '无效果';
                    },
                },
                forced: true,
                priority: 30,
                trigger: {
                    source: "damageBegin1",
                },
                filter: function (event, player) {
                    if (event.player == player) return false;
                    return event.player && event.player.hasSkill('txhj_guiyan_huo');
                },
                content: function () {
                    player.line(trigger.player, 'fire');
                    trigger.nature = 'fire';
                    trigger.num++;
                },
            },
            huo: {
                forced: true,
            },
        },
    },
    //------邪风------//
    "txhj_xiefeng": {
        trigger: { player: 'phaseAfter' },
        direct: true,
        filter: function (event, player) {
            return player.countCards('he') > 0;
        },
        content: function () {
            'step 0'
            var prompt2 = '弃置至多三张牌并摸一张牌';
            var next = player.chooseToDiscard('he', [1, 3], get.prompt('txhj_xiefeng'), prompt2);
            next.set('ai', function (card) {
                return 6 - get.value(card);
            })
            next.logSkill = 'txhj_xiefeng';
            'step 1'
            if (result.bool) {
                var cards = result.cards;
                player.draw(1, true);
                player.addTempSkill('txhj_xiefeng_miss', { player: 'die' });
                player.addTempSkill('txhj_xiefeng_mianshang', { player: 'die' });
                if (player.storage.txhj_xiefeng_miss == undefined) {
                    player.storage.txhj_xiefeng_miss = 0;
                }
                player.storage.txhj_xiefeng_miss += cards.length;
                player.syncStorage('txhj_xiefeng_miss');
                player.markSkill('txhj_xiefeng_miss');
            }
        },
        subSkill: {
            miss: {
                trigger: { global: 'phaseEnd' },
                forced: true,
                popup: false,
                charlotte: true,
                content: function () {
                    player.storage.txhj_xiefeng_miss--;
                    player.syncStorage('txhj_xiefeng_miss');
                    player.markSkill('txhj_xiefeng_miss');
                    if (player.storage.txhj_xiefeng_miss == 0) {
                        game.log(player, '的【邪风】免伤效果失效');
                        player.logSkill('txhj_xiefeng');

                        player.unmarkSkill('txhj_xiefeng_miss');
                        player.removeSkill('txhj_xiefeng_miss');
                        player.removeSkill('txhj_xiefeng_mianshang');
                    }
                    else {
                        var a = player.storage.txhj_xiefeng_miss;
                        game.log(player, '的【邪风】免伤效果剩余', '#g' + a + '回合');
                        player.markSkill('txhj_xiefeng_miss');
                    }
                },
                mark: true,
                onremove: true,
                marktext: "邪风",
                intro: {
                    name: "邪风",
                    content: "接下来的#个回合，防止你受到的非雷电伤害。",
                },
            },
            mianshang: {
                trigger: { player: 'damageBegin4' },
                filter: function (event) {
                    if (event.nature != 'thunder') return true;
                    return false;
                },
                mark: true,
                forced: true,
                content: function () {
                    trigger.cancel();
                },
                ai: {
                    nofire: true,
                    nodamage: true,
                    effect: {
                        target: function (card, player, target, current) {
                            if (get.tag(card, 'damage') && !get.tag(card, 'thunderDamage')) return [0, 0];
                        }
                    },
                },
            },
        },
    },
    //侍灵
    // 金鸡独立
    datongSkill1: {
        trigger: { player: 'dying' },

        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        init: function (player) {
            player.datongSkill1 = false;
        },
        filter: function (event, player) {
            return !player.datongSkill1;
        },
        content: function () {
            var num = 1 - player.hp;
            if (num) player.recover(num);
            player.datongSkill1 = true;
            player.buffUpdate(event.name);
        }
    },
    //祥云瑞气
    "txhj_ruiSkill1": {
        trigger: {
            player: "phaseUseEnd",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player, target) {
            return game.hasPlayer(function (target) {
                return target.isEnemiesOf(player) && target.countCards('h') < player.countCards('h');
            });

        },
        content: function () {
            "step 0"
            var players = game.filterPlayer(function (current) {
                return current.countCards('h') <= player.countCards('h') && current.isEnemiesOf(player);
            });
            players.remove(player);
            event.players = players;
            player.line(players, 'green');
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                current.damage(1, 'fire');
                player.buffUpdate(event.name);
                event.redo();
            }
        },
        ai: {
            threaten: 3.7,
        },
    },
    // 神妙
    "txhj_ruiSkill2": {
        trigger: {
            player: ['phaseBegin', 'phaseEnd']
        },
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        content: async function (event, trigger, player) {
            let num = player.countCards('h') % 2;
            let list1 = player.getEnemies().sortBySeat();
            let list2 = player.getFriends(true).sortBySeat();
            if (num == 1 && list2.length > 0) {
                var target = list2.randomGet(1);
                game.log('神妙·奇:随机令一名我方角色摸一张牌');
                player.line(target, 'green');
                target.draw();
            } else if (list1.length > 0) {
                var target = list1.randomGet(1);
                game.log('神妙·偶:随机令一名敌方角色随机弃置一张牌');
                player.line(target, 'green');
                target.discard(target.getCards('he').randomGet());
            }
            player.buffUpdate(event.name);
        },
    },
    //洞若观火
    "txhj_ruiSkill3": {
        trigger: { target: 'useCardToTargeted' },
        filter: function (event, player) {
            return get.type(event.card) == 'trick' && event.player != player;
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        content: function () {
            "step 0"
            player.judge(function (result) {
                if (get.color(result) == 'red') return 2;
                return -1;
            }).judge2 = function (result) {
                return result.bool;
            };
            "step 1"
            if (result.bool) {

                trigger.getParent().excluded.add(player); player.gain(trigger.parent.cards, "gain2");
                player.buffUpdate(event.name);
            }
        }
    },
    // 神鬼不测
    "txhj_yanSkill1": {
        trigger: { target: 'useCardToTargeted' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return get.type(event.card) == 'trick' && event.player != player && event.targets.length == 1;
        },
        content: function () {
            "step 0"
            player.judge(function (result) {
                if (get.color(result) == 'black') return 2;
                return -1;
            }).judge2 = function (result) {
                return result.bool;
            };
            "step 1"
            if (result.bool) {
                trigger.targets.remove(player);
                trigger.getParent().triggeredTargets2.remove(player);
                trigger.untrigger();
                if (trigger.parent.card.name == "jiedao" && trigger.player.getEquip(1) == null) {
                    event.finish();
                }
                player.useCard(trigger.parent.card, trigger.player);
                player.buffUpdate(event.name);
            }
        }
    },
    "txhj_yanSkill2": {
        trigger: { player: 'damageEnd' },
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.source && event.source != player && event.source.isAlive();
        },
        content: function () {
            player.useCard({ name: 'sha' }, trigger.source, false);
            player.buffUpdate(event.name);
        },
        group: ['txhj_yanSkill2_recover'],
        subSkill: {
            recover: {
                trigger: { source: 'damageAfter' },
                forced: true,
                charlotte: true,
                ruleSkill: true,
                popup: false,
                filter: function (event) {
                    return event.parent.parent.parent.name == 'txhj_yanSkill2';
                },
                content: function () {
                    player.recover();
                }
            }
        }
    },
    "txhj_yanSkill3": {
        trigger: { source: 'damageEnd' },
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        content: function () {
            "step 0"
            player.judge();
            "step 1"
            if (result.color == 'red') {
                player.draw(2);
            } else if (result.color == 'black') {
                player.gainPlayerCard(trigger.player, 'he', true);
            }
            player.buffUpdate(event.name);
        }
    },

    // 神勇
    "txhj_aHaoSkill2": {
        trigger: {
            player: 'loseAfter',
            global: ['equipAfter', 'addJudgeAfter', 'gainAfter', 'loseAsyncAfter', 'addToExpansionAfter']
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            var evt = event.getl(player);
            return evt && evt.player == player && evt.es && evt.es.length > 0;
        },
        content: async function (event, trigger, player) {
            let targets = player.getEnemies().sortBySeat();
            for (let target of targets) {
                player.line(target, 'green');
                await target.damage();
            }
            player.buffUpdate(event.name);
        },
    },
    // 攫戾執猛
    "txhj_aHaoSkill3": {
        trigger: {
            player: 'phaseDrawBegin2'
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return !event.numFixed;
        },
        content: function () {
            trigger.num += player.countCards('e');
            player.buffUpdate(event.name);
        },
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') {
                    return num + player.countCards('e');
                }
            },
            maxHandcardBase: function (player, num) {
                return num + player.countCards('e');
            }
        }
    },
    "txhj_luluSkill1": {
        trigger: {
            player: 'phaseUseBegin'
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        content: function () {
            player.draw(2);
            player.buffUpdate(event.name);
        }
    },
    "txhj_luluSkill2": {
        trigger: {
            player: 'useCardToPlayered'
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            if (event.card.name != 'sha') return false;
            var hp = player.hp;
            var he = player.getCards('h');
            var list = [];
            player.getHistory('gain', function (evt) {
                if (evt && evt.cards) {
                    for (var i = 0; i < evt.cards.length; i++) {
                        if (he.includes(evt.cards[i])) list.add(evt.cards[i]);
                    }
                }
            });
            return list.length >= hp && player.countUsed('sha', true) <= 1 && event.notLink();
        },
        content: function () {
            var target = trigger.target;
            trigger.directHit.add(target);
            var id = target.playerid;
            var map = trigger.customArgs;
            if (!map[id]) map[id] = {};
            if (!map[id].extraDamage) map[id].extraDamage = 0;
            map[id].extraDamage++;
            player.buffUpdate(event.name);
        }
    },
    // 乐不可支
    "txhj_aleSkill1": {
        trigger: {
            target: "useCardToTargeted"
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        usable: 1,
        filter: function (event, player) {
            return event.target == player && get.type(event.card) == 'basic';
        },
        content: function () {
            player.getHistory('custom').push({ aleSkill1: true, e: trigger.getParent() });
            player.buffUpdate(event.name);
        },
        group: ['txhj_aleSkill1_after'],
        subSkill: {
            after: {
                trigger: {
                    global: ['useCardAfter']
                },
                forced: true,
                charlotte: true,
                popup: false,
                ruleSkill: true,
                usable: 1,
                filter: function (event, player) {
                    var damage = player.getHistory('damage', function (evt) {
                        return event.card && evt.card == event.card;
                    }).length;
                    var s = player.getHistory('custom', function (evt) {
                        return evt.aleSkill1 && evt.e == event;
                    }).length;
                    return !damage && s;
                },
                content: function () {
                    player.draw();
                    player.logSkill('txhj_aleSkill1');
                }
            }
        }
    },
    // 饞嘴王
    "txhj_aleSkill2": {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return player.isDamaged() && !player.isMaxHp();
        },
        content: function () {
            player.recover();
            //game.log(player, '触发了【饞嘴王】');
            player.buffUpdate(event.name);
        }
    },
    // 花容月貌
    "txhj_yueerSkill1": {
        trigger: { global: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.player.hasSex('male') && player.storage.yueerSkill1;
        },
        content: function () {
            player.recover();
            player.draw();
            player.storage.yueerSkill1 = false;
            //game.log(player, '触发了【花容月貌】');
            player.buffUpdate(event.name);
        },
        group: ['yueerSkillOver']
    },
    yueerSkillOver: {
        trigger: { global: ['roundStart'] },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            return !player.storage.yueerSkill1;
        },
        content: function () {
            player.storage.yueerSkill1 = true;
        }
    },
    // 娇面
    "txhj_yueerSkill2": {
        trigger: { player: 'phaseDiscardEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        content: function () {
            player.draw(2);
            //game.log(player, '触发了【娇面】');
            player.buffUpdate(event.name);
        }
    },
    // 墨玉点雪
    "txhj_liuliSkill1": {
        usable: 1,
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            let evt = event.getl?.(player);
            return evt?.cards2?.length && _status.currentPhase != player;
        },
        content: function () {
            _status.currentPhase.damage();
            //game.log(player, '触发了【墨玉点雪】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_liuliSkill2": {
        usable: 1,
        trigger: { global: 'phaseDiscardEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.player != player && event.player.getHistory('lose', function (evt) {
                if (evt.type == 'discard' && evt.getParent('phaseDiscard') == event) return true;
            }).length > 0;
        },
        content: function () {
            var card = get.discardPile(function (i) {
                return i;
            });
            if (card) player.gain(card, 'gain2');
            //game.log(player, '触发了【伶俐】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_manmanSkill1": {
        trigger: { player: 'phaseBegin' },
        charlotte: true,
        ruleSkill: true,
        forced: true,
        content: function () {
            player.chooseUseTarget({ name: 'nanman', isCard: true }, "弄鬼掉猴:回合开始时，你视为使用一张【南蛮入侵】");
            //game.log(player, '触发了【弄鬼掉猴】');
            player.buffUpdate(event.name);
        },
        group: ['txhj_manmanSkill1_damage'],
        subSkill: {
            damage: {
                trigger: { global: 'damageAfter' },
                forced: true,
                charlotte: true,
                ruleSkill: true,
                popup: false,
                filter: function (event, player) {
                    return event.card && event.card.name == "nanman" && player.getHistory('sourceDamage', function (evt) {
                        return evt.card == event.card;
                    }).length > 0;
                },
                content: function () {
                    player.draw(trigger.num);
                    //game.log(player, '触发了【弄鬼掉猴】');
                    player.buffUpdate(event.name);
                }
            }
        }
    },
    "txhj_manmanSkill2": {
        trigger: { source: 'damageAfter' },
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.player.isAlive() && event.player.countCards("he") > 0;
        },
        content: function () {
            player.gainPlayerCard(trigger.player, 'he', true);
            //game.log(player, '触发了【捣蛋】');
            player.buffUpdate(event.name);
        }
    },
    //矢无虚发
    "txhj_xiaoxiaoSkill1": {
        trigger: {
            global: "useCardAfter",
        },
        usable: 1,
        charlotte: true,
        forced: true,
        filter: function (event, player) {
            if (!event.card || get.type(event.card, 'trick') != 'trick' || !event.targets?.includes(player)) return false;
            const damage = player.getHistory("damage", evt => {
                return evt.card == event.card;
            }).length;
            return event.player != player && damage == 0;
        },
        content: function () {
            if (player.hp < player.maxHp) {
                player.recover();
            } else {
                player.draw();
            }
            game.log(player, '触发了【矢无虚发】');
            player.buffUpdate(event.name);
        },
    },
    //弓上弦
    "txhj_xiaoxiaoSkill2": {
        trigger: { player: 'phaseJieshuBegin' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && current.countCards('h');
            });
        },
        content: function () {
            "step 0"
            var players = game.filterPlayer(function (current) {
                return current.countCards('e') <= player.countCards('e');
            });
            players.remove(player);
            event.players = players;
            player.line(players, 'green');
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                var hs = current.getCards('h')
                if (hs.length) {
                    var card = hs.randomGet();
                    player.gain(card, current);
                    current.$giveAuto(card, player);
                }
                event.redo();
            }
            //game.log(player, '触发了【弓上弦】');
            player.buffUpdate(event.name);
        }
    },
    //轻舞飞扬
    "txhj_xuerenSkill1": {
        trigger: { player: 'phaseEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            return player.getStat('damage');
        },
        content: function () {
            player.draw(1, true);
            game.log(player, '发动了【轻舞飞扬】');
            player.buffUpdate(event.name);
        },
    },
    //倚天拔地
    "txhj_xuanwuSkill1": {
        trigger: {
            global: "recoverBefore",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {

            return event.player != player && !player.isHealthy();
        },
        content: function () {
            player.recover();
            game.log(player, '发动了【倚天拔地】');
            player.buffUpdate(event.name);
        },
    },
    //蛇影
    "txhj_xuanwuSkill2": {
        trigger: {
            player: "loseAfter",
        },
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (event.name != 'lose' || event.type != 'discard') return false;
            var evt = event.getl(player);
            return evt && evt.player == player && evt.hs && evt.hs.length > 0;
        },
        content: function () {
            "step 0"
            player.draw(Math.ceil(trigger.getl(player).hs.length / 2));
            event.count = Math.ceil(trigger.getl(player).hs.length / 2);
            "step 1"
            event.list = player.getEnemies().sortBySeat();
            "step 2"
            if (event.list.length) {
                var target = event.list.shift();
                player.line(target, 'green');
                target.damage(1, true);
                event.count--;
                if (event.count > 0) {
                    event.redo();
                } else {
                    event.finish();
                }
            }
            game.log(player, '发动了【蛇影】');
            player.buffUpdate(event.name);
        },
    },
    //玄冥真主
    "txhj_xuanwuSkill3": {
        trigger: {
            target: "useCardToTargeted",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player, card) {
            return get.number(event.card) <= player.countCards('h') && get.type(event.card, 'trick') == 'trick' && event.player != player && event.targets && event.targets.length;
        },
        content: function () {
            trigger.cancel();
            trigger.targets.remove(player);
            trigger.getParent().triggeredTargets2.remove(player);
            trigger.untrigger();
            game.log(player, '发动了【玄冥真主】');
            player.buffUpdate(event.name);
        },
    },
    //勇往直前
    "txhj_dundunSkill1": {
        trigger: { player: 'useCardToPlayered' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.card.name == 'sha';
        },
        content: function () {
            player.draw(1, true);
            player.buffUpdate(event.name);
        },
    },
    //忠誌
    "txhj_dundunSkill2": {
        trigger: { player: 'damageBegin4' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.num > 1;
        },
        content: function () {
            trigger.num--;
            player.buffUpdate(event.name);
        },
    },
    //狐火灵气
    "txhj_jiuweiSkill1": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        trigger: { global: 'phaseBegin' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player != event.player;
        },
        content: function () {
            if (!trigger.player.storage.txhj_jiuweiSkill1_disable) trigger.player.storage.txhj_jiuweiSkill1_disable = [];
            trigger.player.storage.txhj_jiuweiSkill1_disable.push(player);
            trigger.player.addTempSkill('txhj_jiuweiSkill1_disable', 'phaseAfter');
            player.buffUpdate(event.name);
        },
    },
    "txhj_jiuweiSkill1_disable": {
        trigger: {
            player: 'useCardToTarget'
        },
        priority: -7,
        filter: function (event, player) {
            return event.targets.length == 1 && event.targets.includes(player.storage.txhj_jiuweiSkill1_disable[0]) && get.type(event.card, "trick") == 'trick';
        },
        content: function () {
            trigger.excluded.add(player.storage.txhj_jiuweiSkill1_disable[0]);
            if (get.type(trigger.card, 'delay') == "delay") {
                var owner = get.owner(trigger.card);
                if (owner && owner.getCards('hej').includes(trigger.card)) owner.lose(trigger.card, ui.discardPile);
                else game.cardsDiscard(trigger.card);
                game.log(trigger.card, '进入了弃牌堆');
            }
            if (player.storage.txhj_jiuweiSkill1_disable[0].buff) {
                player.storage.txhj_jiuweiSkill1_disable[0].buff['txhj_jiuweiSkill1'].update();
            }
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        onremove: true,
        mark: true,
        marktext: "失",
        intro: {
            content: "本回合内对$使用锦囊牌会失效.",
        },
    },
    //秘思
    "txhj_jiuweiSkill2": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        trigger: { global: 'useCard' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            if (player != _status.currentPhase || event.player == player) return false;
            let res = event.player.getHistory("useCard", function (evt) {
                return get.type(evt.card) != 'trick';
            });
            return res.length == 1;
        },
        content: function () {
            trigger.targets = [];
            trigger.all_excluded = true;
            player.buffUpdate(event.name);
        }
    },
    //九尾之命
    "txhj_jiuweiSkill3": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        trigger: { player: 'damageEnd' },
        init: function (player) {
            player.storage.txhj_jiuweiSkill3_count = 0;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.num > 0 && player.storage.txhj_jiuweiSkill3_count < 9;
        },
        content: function () {
            let count = (9 - player.storage.txhj_jiuweiSkill3_count);
            if (count > 0) {
                player.draw(count);
                player.storage.txhj_jiuweiSkill3_count++;
            }
            player.buffUpdate(event.name);
        }
    },
    //雷奔云谲
    "txhj_tengsheSkill1": {
        trigger: { player: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        usable: 1,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return _status.currentPhase != player && !event.nature && event.source;
        },
        content: function () {
            player.useCard({ name: 'sha', nature: 'thunder', isCard: true }, trigger.source);
            player.buffUpdate(event.name);
        }
    },
    //紫电
    "txhj_tengsheSkill2": {
        trigger: { player: 'phaseAfter' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (player != game.me) return false;
            let count = 0;
            player.getEnemies().forEach(e => {
                if (e.isDamaged()) count++;
            });
            return count > 0;
        },
        content: function () {
            let len = [];
            player.getEnemies().forEach(e => {
                if (e.isDamaged()) len.push(e);
            });
            len.forEach(e => {
                e.damage(len.length == 1 ? 2 : 1, 'thunder', player);
            });
            player.buffUpdate(event.name);
        }
    },
    //迅雷风烈
    "txhj_tengsheSkill3": {
        trigger: { source: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        usable: 1,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.player != player && event.nature == "thunder";
        },
        content: function () {
            player.recover();
            player.draw(2);
            player.buffUpdate(event.name);
        }
    },
    //慷慨鸭昂
    "txhj_yayaSkill1": {
        trigger: {
            player: 'useCard',
            target: "useCardToTargeted"
        },
        usable: 4,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            if (event.name == 'useCard') {
                return get.color(event.card) == "red";
            }
            return event.player != player && get.color(event.card) == "red";
        },
        content: function () {
            player.draw();
            if (player.getHistory('useSkill', function (evt) {
                return evt && evt.skill && evt.skill == 'txhj_yayaSkill1';
            }).length % 4 === 0) {
                player.getEnemies().randomGet().damage();
            }
            player.buffUpdate(event.name);
        },

    },
    //鸭立
    "txhj_yayaSkill2": {
        trigger: {
            player: "dying"
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        init: function (player) {
            player.storage["txhj_yayaSkill2"] = false;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return !player.storage["txhj_yayaSkill2"];
        },
        content: function () {
            "step 0"
            var num = 1 - player.hp;
            if (num) player.recover(num);
            player.update();
            "step 1"
            player.addTempSkill("txhj_yayaSkill2_protected", { player: "phaseBegin" });
            player.storage["txhj_yayaSkill2"] = true;
            player.buffUpdate(event.name);
        }
    },
    "txhj_yayaSkill2_protected": {
        trigger: {
            player: ['damageBegin3', 'loseHpBefore', 'recoverBefore']
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        mark: true,
        marktext: "保",
        intro: {
            content: '你不能失去/回复体力和受到伤害'
        },
        content: function () {
            trigger.cancel();
        },
    },
    //承天之佑
    "txhj_youyouSkill1": {
        trigger: { player: 'damageAfter' },
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return _status.currentPhase != player;
        },
        content: function () {
            player.draw(2);
            player.buffUpdate(event.name);
        }
    },
    //守护
    "txhj_youyouSkill2": {
        trigger: { player: 'gainAfter' },
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            let evt = event.getParent('phaseDraw');
            return Object.keys(evt).length == 0 && event.getg(player).length > 1 && player.getFriends(true).filter(e => e.isDamaged()).length > 0;
        },
        content: function () {
            let players = player.getFriends(true).filter(e => e.isDamaged());
            if (players.length) players.randomGet().recover();
            player.buffUpdate(event.name);
        }
    },
    //麒麟之姿
    "txhj_qilinSkill1": {
        trigger: { player: 'phaseDrawEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            event.gains = player.getHistory('gain', function (evt) {
                if (evt.getParent().name != 'draw' || evt.getParent('phaseDraw') != event) return false;
                return true;
            });
            return event.gains.length && event.gains[0].parent.num > 0;
        },
        content: function () {
            player.draw(trigger.gains[0].parent.num);
            player.buffUpdate(event.name);
        }
    },
    //掌火
    "txhj_qilinSkill2": {
        trigger: { source: 'damageEnd' },
        usable: 2,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.nature == 'fire';
        },
        content: function () {
            player.recover();
            player.gainPlayerCard(trigger.player, 'he', true);
            player.buffUpdate(event.name);
        }
    },
    //腾焰飞芒
    "txhj_qilinSkill3": {
        trigger: { player: ['phaseUseBegin', 'phaseUseEnd'] },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return true;
        },
        content: function () {
            let target = player.getEnemies().randomGet();
            if (player.canUse('huogong', target)) {
                player.useCard({ name: 'huogong', isCard: true }, target);
            }
            player.buffUpdate(event.name);
        }
    },
    //灵绡旋歌
    "txhj_kongquemwSkill1": {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return true;
        },
        content: function () {
            const num = lib.config.taixuhuanjing?.cards?.length || 0;
            if (num > 0) player.addTempSkill('txhj_kongquemwSkill1_eff', { player: "phaseJieshuAfter" });
            player.buffUpdate(event.name);
        },
        subSkill: {
            eff: {
                trigger: {
                    player: "useCard",
                },
                usable: function (skill, player) {
                    return lib.config.taixuhuanjing.cards.length;
                },
                forced: true,
                charlotte: true,
                ruleSkill: true,
                filter: function (event, player) {
                    const num = lib.config.taixuhuanjing?.cards?.length || 0;
                    if (lib.config.taixuhuanjing.cards.length == 0) return false;
                    return event.card.name == 'tao' || (get.type2(event.card) == 'trick' && get.tag(event.card, 'damage'));
                },
                content: function () {
                    trigger.baseDamage++;
                    player.buffUpdate(event.name);
                },
            }
        }
    },
    //绮翎
    "txhj_kongquemwSkill2": {
        trigger: {
            player: "damageEnd",
            source: "damageSource",
        },
        usable: function (skill, player) {
            return lib.skill.txhj_kongquemwSkill2.getNum();
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        getNum: function () {
            let num = 0;
            for (let i = 1; i <= 4; i++) {
                const item = 'equip' + i;
                if (lib.config.taixuhuanjing[item] !== null) {
                    num++;
                }
            }
            return num;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return lib.skill.txhj_kongquemwSkill2.getNum() > 0;
        },
        content: function () {
            player.draw(lib.skill.txhj_kongquemwSkill2.getNum())
            player.buffUpdate(event.name);
        }
    },
    //娉婷万種
    "txhj_minminSkill1": {
        trigger: { player: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        usable: 1,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.num > 0;
        },
        content: function () {
            player.draw(trigger.num);
            player.buffUpdate(event.name);
        },
    },
    //依人
    "txhj_minminSkill2": {
        trigger: { player: 'gainAfter' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        usable: 2,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.getParent('draw').num >= 2 && player.getFriends(true).filter(e => e.isDamaged()).length > 0;
        },
        content: function () {
            let friends = player.getFriends(true).filter(e => e.isDamaged());
            if (friends.length) friends.randomGet().recover();
            player.buffUpdate(event.name);
        },
    },
    //披坚执锐
    "txhj_ditingSkill1": {
        trigger: { source: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return true;
        },
        content: function () {
            player.recover();
            player.buffUpdate(event.name);
        },
    },
    //轻健
    "txhj_ditingSkill2": {
        trigger: { player: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return true;
        },
        content: function () {
            player.gainMaxHp(1);
            player.buffUpdate(event.name);
        },
    },
    //巧捷万端
    "txhj_ditingSkill3": {
        trigger: { player: 'phaseEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.getHistory("useCard", function (evt) {
                return get.number(evt.card);
            }).length;
        },
        content: function () {
            let evts = player.getHistory("useCard", function (evt) {
                return get.number(evt.card);
            });
            function sum(arr) {
                let evt = [...new Set(arr.map(obj => get.number(obj.card)))];
                return evt.length;
            }
            let num = sum(evts);
            player.draw(num);
            let enemies = player.getEnemies();
            if (enemies.length < num) num = enemies.length;
            for (let i = 0; i < num; i++) {
                enemies[i].damage(1, player);
            }
            player.buffUpdate(event.name);
        },
    },
    //慧心巧思
    "txhj_qiaoqiaoSkill1": {
        trigger: {
            global: 'addJudgeBefore',
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        usable: 1,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.player != player;
        },
        content: function () {
            player.getEnemies().randomGet().loseHp();
            player.buffUpdate(event.name);
        },
    },
    //清婉
    "txhj_qiaoqiaoSkill2": {
        trigger: {
            player: 'phaseEnd',
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        usable: 1,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return true;
        },
        content: function () {
            player.drawTo((player.hp > 5 ? 5 : player.hp));
            player.buffUpdate(event.name);
        },
    },
    //侍灵技能扩充
    //以下技能代码全部搬运修改自K佬的【EpicFX】扩展，再次感谢K佬的侍灵素材和代码提供!   
    //魔改侍灵“阿先”
    "txhj_axianSkill2": {
        trigger: {
            player: 'phaseZhunbeiBegin'
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            return player.countCards('h') > player.hp;
        },
        content: function () {
            //game.log(player, '触发了【清德】');
            player.buffUpdate(event.name);
            player.gainMaxHp(1, true);
        },
    },
    "txhj_axianSkill1": {
        trigger: { player: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            return player.countMark('txhj_axianSkill1_silent') < 2;
        },
        content: function () {
            player.addTempSkill('txhj_axianSkill1_silent', 'roundStart');
            player.addMark('txhj_axianSkill1_silent', 1, false);
            let card = [get.cardPile(card => get.type(card) == "basic"), get.cardPile(card => get.type(card) == 'trick')];
            if (card) player.gain(card, 'gain2');
            //game.log(player, '触发了【中正卫主】,获得了', card);
            player.buffUpdate(event.name);
        },
        subSkill: {
            silent: {
                onremove: true,
                charlotte: true,
                sub: true,
                sourceSkill: "txhj_axianSkill1",
                "_priority": 0,
            },
        },
    },
    //鲲鹏（鲲鹏技能来自“關於”大佬的代码书写提供！） 
    "txhj_kunpengSkill3": {
        trigger: {
            player: "phaseUseEnd",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter(event, player) {
            return player.countCards("h") > player.hp;
        },
        content() {
            player.buffUpdate(event.name);
            game.log(player, '发动了【厚德载物】');
            player.gainMaxHp();
            player.recover();
        },
    },
    "txhj_kunpengSkill2": {
        trigger: {
            player: ["loseAfter"],
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        usable: 2,
        filter: function (event, player) {
            var evt = event?.getl(player);
            return evt?.cards2?.length > 1;
        },
        content: function () {
            var cards = [];
            var list = [];
            for (var i = 0; i < ui.cardPile.childNodes.length; i++) {
                var card = ui.cardPile.childNodes[i];
                if (!cards.includes(card) && !list.includes(card.name) && get.type(card) == 'basic') {
                    list.push(card.name);
                    cards.push(card)
                }
            }
            player.gain(cards, 'gain2');
            //game.log(player, '触发了【饱德】');
            player.buffUpdate(event.name);
        },
    },
    "txhj_kunpengSkill1": {
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return event.nature && player.getEnemies();
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        usable: 1,
        mode: ["taixuhuanjing"],
        content: function () {
            var target = player.getEnemies().randomGet();
            trigger.player = target;
            player.buffUpdate(event.name);
            game.log(player, '发动了【驭火掣电】');
        },
    },
    //夔牛
    "txhj_kuiniuSkill1": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'phaseDiscardEnd' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return (event.cards && event.cards.length) /*&& EpicFX.servant.probabilityOfBuff(2)*/;
        },
        content: async function (event, trigger, player) {
            player.buffUpdate(event.name);
            let useCountMax = trigger.cards.length;
            let useCount = 0;
            while (useCount < useCountMax) {
                useCount++;
                var card = get.cards()[0];
                await player.showCards(card);
                if (!player.hasUseTarget(card, false)) {
                    card.fix();
                    ui.discardPile.appendChild(card);
                    game.updateRoundNumber();
                }
                if (get.effect(player, card, player, player) >= 1 && player.canUse(card, player, false, false)) {
                    await player.useCard(card, player, false);
                } else {
                    let target = player.getEnemies().randomGet();
                    if (player.canUse(card, target, false, false))
                        await player.useCard(card, target, false);
                }
            }
        }
    },
    "txhj_kuiniuSkill2": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { global: 'phaseEnd' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.getHistory('useCard').length;
        },
        content: function () {
            player.draw(player.getHistory('useCard').length);
            //game.log(player, '触发了【辟邪】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_kuiniuSkill3": {
        usable: 2,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: "useCardAfter" },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return true;
        },
        content: function () {
            player.draw(2);
            //game.log(player, '触发了【聲震百里】');
            player.buffUpdate(event.name);
        }
    },
    //奇奇
    "txhj_qiqiSkill1": {
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'damageBegin4' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.isDamaged() /*&& EpicFX.servant.probabilityOfBuff(2)*/;
        },
        content: function () {
            'step 0'
            trigger.cancel();
            'step 1'
            player.loseMaxHp();
            //game.log(player, '触发了【道士假面】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_qiqiSkill2": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'phaseDiscardEnd' },
        init: function (player) {
            player.storage["txhj_qiqiSkill2_useCount"] = 0;
            player.storage["txhj_qiqiSkill2_maxHandcard"] = 0;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            let num = (player.storage["txhj_qiqiSkill2_useCount"] + 1) * 2;
            if (!event.cards || event.cards.length <= num) return false;
            return true;
        },
        content: function () {
            player.gainMaxHp(2);
            player.storage["txhj_qiqiSkill2_maxHandcard"] += 2;
            player.storage["txhj_qiqiSkill2_useCount"]++;
            //game.log(player, '触发了【取食】');
            player.buffUpdate(event.name);
        },
        mod: {
            maxHandcard: function (player, num) {
                return num + player.storage["txhj_qiqiSkill2_maxHandcard"];
            }
        }
    },
    //元元
    // 每回合限一次，当你在回合外失去红色牌后，你有20/30/40/60/80/100%的概率回复1点体力，若你体力值已满，则改为摸两张牌。
    "txhj_yuanyuanSkill1": {
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'loseAfter' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            var evt = event.getl(player);
            return _status.currentPhase != player && evt?.cards2?.some(card => get.color(card, player) == 'red');
        },
        content: function () {
            if (player.maxHp == player.hp) player.draw(2);
            else player.recover();
            //game.log(player, '触发了【斑斓暇日】');
            player.buffUpdate(event.name);
        }
    },
    // 每回合限一次，当你在回合外回复1点体力后，你随机弃置当前回合角色一张装备牌。
    "txhj_yuanyuanSkill2": {
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'recoverAfter' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return _status.currentPhase != player && _status.currentPhase.countCards('he', { type: 'equip' });
        },
        content: function () {
            _status.currentPhase.discard(player, _status.currentPhase.getCards('he', { type: 'equip' }).randomGet()).discarder = player;
            //game.log(player, '触发了【角斗】');
            player.buffUpdate(event.name);
        }
    },
    //阿贺
    // 每回合限两次，你使用黑色牌指定其他角色为目标时，有20/30/40/60/80/100%的概率随机弃置其一张牌。
    "txhj_aheSkill1": {
        usable: 2,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'useCardToBegin' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            if (get.color(event.card) != 'black') return false;
            return event.target && event.target != player /*&& EpicFX.servant.probabilityOfBuff(2) */ && event.target.countCards('he');
        },
        content: function () {
            var target = trigger.target;
            target.discard(target.getCards('he').randomGet()).discarder = player;
            //game.log(player, '触发了【始振萌动】');
            player.buffUpdate(event.name);
        }
    },
    // 每回合限两次，当敌方角色因弃置而失去牌时，你摸一张牌。
    "txhj_aheSkill2": {
        usable: 2,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { global: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"] },
        filter: function (event, player) {
            if (player != game.me) return false;
            let evt = event.getl(player);
            return event.player != player && event.type == 'discard' && player.isEnemyOf(event.player) && evt?.cards2?.length;
        },
        content: function () {
            player.draw();
            //game.log(player, '触发了【獭祭】');
            player.buffUpdate(event.name);
        }
    },
    //白泽 
    "txhj_baizeSkill3": {
        usable: 1,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { source: 'damageEnd' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.card && event.card.name == 'sha' && event.num > 0;
        },
        content: function () {
            player.recover(trigger.num);
            //game.log(player, '触发了【矢志不渝】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_baizeSkill2": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'phaseUseEnd' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.getEnemies().length > 0;
        },
        content: function () {
            //game.log(player, '触发了【傲节】');
            player.buffUpdate(event.name);
            player.useCard({ name: 'sha', isCard: true }, player.getEnemies(), false, "txhj_baizeSkill2");
        },
        group: ["txhj_baizeSkill2_add"],
        subSkill: {
            add: {
                forced: true,
                charlotte: true,
                trigger: { source: 'damageBefore' },
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha' && event.parent.skill == "txhj_baizeSkill2"
                        && player.getHistory("useCard", function (evt) {
                            return evt.card.name === "sha";
                        }).length <= 1;
                },
                content: function () {
                    trigger.num++;
                }
            }
        }
    },
    "txhj_baizeSkill1": {
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        trigger: { player: 'damageEnd' },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.countCards('h') > 0/*&& EpicFX.servant.probabilityOfBuff(2)*/;
        },
        content: function () {
            var cards = player.getCards('h').randomGets(trigger.num);
            player.discard(cards);
            player.recover(cards.length);
            //game.log(player, '触发了【循循渐进】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_jinwuSkill1": {
        trigger: { player: 'dying' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        init: function (player) {
            player.storage["txhj_jinwuSkill1_count"] = 0;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.storage["txhj_jinwuSkill1_count"] === 0;
        },
        content: function () {
            player.recover(player.maxHp);
            player.storage["txhj_jinwuSkill1_count"]++;
            //game.log(player, '触发了【永恒烈日】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_jinwuSkill2": {
        mod: {
            maxHandcardBase: function (player, num) {
                return player.maxHp;
            },
        },
        trigger: { player: 'useCardAfter' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            if (_status.currentPhase != player) return false;
            let type = get.type(event.card, 'trick');
            return player.getHistory('custom', function (evt) {
                return evt["txhj_jinwuSkill2_name"] == type;
            }).length == 0;
        },
        content: function () {
            "step 0"
            player.loseHp();
            "step 1"
            player.draw(Math.min(player.getDamagedHp(), 9));
            player.getHistory('custom').push({ "txhj_jinwuSkill2_name": get.type(trigger.card, 'trick') });
            //game.log(player, '触发了【三足】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_jinwuSkill3": {
        trigger: { global: 'phaseAfter' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            let num = player.getHistory("lose").reduce((num, evt) => {
                if (evt.getParent(3).name != "phaseDiscard" && evt.type == 'discard') {
                    num += evt.cards.length;
                }
                return num;
            }, 0);
            if (num > player.hp) {
                event.drawNum = num;
                return true;
            }
            return false;
        },
        content: function () {
            player.draw(trigger.drawNum);
            //game.log(player, '触发了【赤地千里】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_canglongSkill1": {
        trigger: { global: 'phaseZhunbeiBegin' },
        //forced:true,
        charlotte: true,
        ruleSkill: true,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player != event.player/* && EpicFX.servant.probabilityOfBuff(2)*/;
        },
        logTarget: 'player',
        content: function () {
            player.useCard({ name: 'sha' }, trigger.player).logSkill = 'txhj_canglongSkill1';
            //game.log(player, '触发了【风云变色】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_canglongSkill2": {
        usable: 1,
        trigger: {
            player: "useCard2",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.getHistory('useCard', function (evtx) {
                return evtx.card && evtx.card.name === "sha";
            }, event).length === 1;
        },
        content: function () {
            trigger.baseDamage++;
            //game.log(player, '触发了【鸣嗷】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_canglongSkill3": {
        trigger: {
            source: 'damageSource',
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        init: function (player) {
            player.storage["txhj_canglongSkill3_drawCount"] = 0;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return event.card && event.card.name == 'sha' && player.storage["txhj_canglongSkill3_drawCount"] < 5;
        },
        content: function () {
            player.draw(player.getHistory("useCard", function (evt) {
                return evt.card && evt.card.name === "sha";
            }).length);
            player.storage["txhj_canglongSkill3_drawCount"]++;
            //game.log(player, '触发了【披星戴月】');
            player.buffUpdate(event.name);
        },
        group: ["txhj_canglongSkill3_clear"],
        subSkill: {
            clear: {
                trigger: { global: 'phaseEnd' },
                forced: true,
                charlotte: true,
                filter: function (event, player) {
                    return player == game.me;
                },
                content: function () {
                    player.storage["txhj_canglongSkill3_drawCount"] = 0;
                }
            }
        }
    },
    "txhj_kangkangSkill1": {
        trigger: {
            player: 'damageEnd',
            source: 'damageSource',
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        init: function (player) {
            player.storage["txhj_kangkangSkill1_use"] = 0;
            player.storage["txhj_kangkangSkill1_draw"] = 0;
        },
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            return player.storage["txhj_kangkangSkill1_use"] < 2 /*&& EpicFX.servant.probabilityOfBuff(2)*/;
        },
        content: function () {
            player.draw();
            player.storage["txhj_kangkangSkill1_use"]++;
            player.storage["txhj_kangkangSkill1_draw"]++;
            //game.log(player, '触发了【丰收瑞鸣】');
            player.buffUpdate(event.name);
        },
        group: ["txhj_kangkangSkill1_twodraw", "txhj_kangkangSkill1_clear"],
        subSkill: {
            twodraw: {
                forced: true,
                charlotte: true,
                trigger: {
                    player: 'gainAfter',
                },
                filter: function (event, player) {
                    return event.parent.parent.name == "txhj_kangkangSkill1" && player.storage["txhj_kangkangSkill1_draw"] >= 2 &&/* EpicFX.servant.skillCanBeUsed(*/player == game.me;
                },
                content: function () {
                    player.recover();
                    player.storage["txhj_kangkangSkill1_draw"] = 0;
                }
            },
            clear: {
                trigger: { global: 'roundStart' },
                forced: true,
                charlotte: true,
                content: function () {
                    player.storage["txhj_kangkangSkill1_use"] = 0;
                }
            }
        }
    },
    "txhj_kangkangSkill2": {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return player == game.me;
        },
        content: function () {
            player.draw(2);
            if (player.isHealthy()) {
                let cards1 = player.getCards('j');
                if (cards1.length) {
                    player.discard(cards1, player, true);
                }
            }
            //game.log(player, '触发了【安康】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_niuniuSkill1": {
        usable: 2,
        trigger: {
            player: 'loseAfter',
            global: ['equipAfter', 'addJudgeAfter', 'gainAfter', 'loseAsyncAfter', 'addToExpansionAfter'],
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            if (player == _status.currentPhase) return false;
            if (event.name == 'gain' && event.player == player) return false;
            var evt = event.getl(player);
            return evt?.cards2?.length > 0;
        },
        content: function () {
            if (_status.currentPhase.countGainableCards(player, 'he') > 0) player.gainPlayerCard(_status.currentPhase, 'he', true);
            //game.log(player, '触发了【巧拙守真】');
            player.buffUpdate(event.name);
        }
    },
    "txhj_niuniuSkill2": {
        usable: 1,
        trigger: {
            player: 'gainAfter',
            global: 'loseAsyncAfter',
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            if (!(player == game.me)) return false;
            var cards = event.getg(player);
            if (!cards.length) return false;
            return game.hasPlayer(current => {
                return event.getl(current).cards2.length;
            });
        },
        content: function () {
            "step 0"
            player.judge(function () {
                return 1;
            });
            "step 1"
            if (result.suit === "heart") {
                player.recover();
                player.gain(result.card, 'gain2');
            } else {
                trigger.source.damage(player);
            }
            //game.log(player, '触发了【兕袭】');
            player.buffUpdate(event.name);
        }
    },
    /*普通技能区分线*/
    //————
    /*贪食 来源剑阁模式boss技能*/
    'txhj_tanshi': {
        trigger: { player: 'phaseEnd' },
        forced: true,
        check: function () {
            return false;
        },
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        content: function () {
            player.chooseToDiscard('h', true);
        }
    },
    tx_modao: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        content: function () {
            player.draw(2);
        }
    },
    tx_mojian: {
        trigger: { player: 'phaseUseBegin' },
        content: function () {
            var list = game.filterPlayer(function (current) {
                return player.canUse('wanjian', current) && current.isEnemyOf(player);
            });
            list.sort(lib.sort.seat);
            player.useCard({ name: 'wanjian' }, list);
        },
        ai: {
            threaten: 1.8
        }
    },
    tx_yushou: {
        trigger: { player: 'phaseUseBegin' },
        content: function () {
            var list = game.filterPlayer(function (current) {
                return player.canUse('nanman', current) && current.isEnemyOf(player);
            });
            list.sort(lib.sort.seat);
            player.useCard({ name: 'nanman' }, list);
        }
    },
    tx_moyany: {
        trigger: { player: 'loseEnd' },
        frequent: true,
        unique: true,
        filter: function (event, player) {
            return _status.currentPhase != player;
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'red' ? 1 : 0;
            });
            "step 1"
            if (result.bool) {
                player.chooseTarget(true, '选择一个目标对其造成两点火焰伤害', function (card, player, target) {
                    return player != target;
                }).ai = function (target) {
                    return get.damageEffect(target, player, player, 'fire');
                }
            }
            else {
                event.finish();
            }
            "step 2"
            if (result.targets.length) {
                player.line(result.targets, 'fire');
                result.targets[0].damage(2, 'fire');
            }
        },
        ai: {
            effect: {
                target: function (card) {
                    if (get.tag(card, 'loseCard')) {
                        return [0.5, 1];
                    }
                }
            }
        }
    },
    tx_danshu: {
        trigger: { player: 'loseEnd' },
        frequent: true,
        unique: true,
        filter: function (event, player) {
            return _status.currentPhase != player && player.hp < player.maxHp;
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'red' ? 1 : 0;
            });
            "step 1"
            if (result.color == 'red') {
                player.recover();
            }
        },
        ai: {
            effect: {
                target: function (card) {
                    if (get.tag(card, 'loseCard')) {
                        return [0.5, 1];
                    }
                }
            }
        }
    },
    txyirang: {
        audio: 'yirang',
        trigger: { player: 'phaseUseBegin' },
        direct: true,
        filter: function (event, player) {
            if (!player.countCards('he', function (card) {
                return get.type(card) != 'basic';
            })) {
                return false;
            }
            return game.hasPlayer(function (current) {
                return current.maxHp > player.maxHp;
            });
        },
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt2('txyirang'), function (card, player, target) {
                return target.maxHp > player.maxHp;
            }).set('ai', function (target) {
                return (get.attitude(_status.event.player, target) - 2) * target.maxHp;
            });
            'step 1'
            if (result.bool) {
                var cards = player.getCards('he', function (card) {
                    return get.type(card) != 'basic';
                });
                var target = result.targets[0];
                var types = [];
                for (var i = 0; i < cards.length; i++) {
                    types.add(get.type(cards[i], 'trick'));
                }
                player.logSkill('txyirang', target);
                player.give(cards, target);
                player.gainMaxHp(target.maxHp - player.maxHp, true);
                game.delay();
            }
        }
    },
    txayboji: {
        trigger: { player: "useCardToBefore" },
        usable: 1,
        // direct: true,
        filter: function (event, player) {
            return event.card.name == "sha" && event.targets.length == 1 && event.targets[0] != player;
        },
        content: function () {
            "step 0";
            player.chooseToDiscard(trigger.targets[0].get("h"), true);
            "step 1";
            if (result.bool) {
                trigger.targets[0].discard(trigger.targets[0].get("h"));
                player.draw(1);
            }
        },
    },
    txayhanji: {
        // 触发时机：造成伤害
        trigger: { source: 'damageBefore' },
        usable: 1,
        forced: true,
        // 触发效果
        filter: function (event, player) {
            // 对其他角色造成伤害
            return event.player != player && event.notLink();
        },
        content: function () {
            // 造成的伤害+1
            trigger.num++;
        },
    },
    tx_dqtianzi: {
        trigger: { player: ['damageEnd', 'phaseUseBegin'] },
        usable: 1,
        direct: true,
        content: function () {
            'step 0';
            player.chooseTarget('选择一名其他角色进行判定', function (card, player, target) {
                return target != player;
            }).ai = function (target) {
                var player = _status.event.player;
                return get.damageEffect(target, player, player);
            };
            'step 1';
            if (result.bool) {
                player.logSkill('tx_dqtianzi', result.targets);
                event.target = result.targets[0];
                player.judge(function (card) {
                    return get.color(card);
                });
            } else {
                event.finish();
            }
            'step 2';
            if (result.suit == 'diamond') {
                event.target.skip('phaseUse');
            } else if (result.color == 'black') {
                player.gainPlayerCard(event.target, 'h', [0, Infinity]);
            }
        },
    },
    xinmingjian: {
        audio: 2,
        usable: 2,
        enable: "phaseUse",
        filterTarget: function (card, player, target) {
            return player != target;
        },
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        filterCard: true,
        selectCard: [1, Infinity],
        discard: false,
        lose: false,
        delay: false,
        content: function () {
            target.gain(cards, player, 'giveAuto');
            target.addTempSkill('xinmingjian2', { player: 'phaseAfter' });
            target.storage.xinmingjian2++;
            target.updateMarks('xinmingjian2');
        },
        ai: {
            order: 1,
            result: {
                target: function (player, target) {
                    if (target.hasSkillTag('nogain')) return 0;
                    if (player.countCards('h') == player.countCards('h', 'du')) return -1;
                    if (target.hasJudge('lebu')) return 0;
                    if (get.attitude(player, target) > 3) {
                        var basis = get.threaten(target);
                        if (player == get.zhu(player) && player.hp <= 2 && player.countCards('h', 'shan') && !game.hasPlayer(function (current) {
                            return get.attitude(current, player) > 3 && current.countCards('h', 'tao') > 0;
                        })) return 0;
                        if (target.countCards('h') + player.countCards('h') > target.hp + 2) return basis * 0.8;
                        return basis;
                    }
                    return 0;
                },
            },
        },
    },
    "xinmingjian2": {
        charlotte: true,
        mark: true,
        intro: {
            content: "手牌上限不限制，出杀次数不限制",
        },
        init: function (player, skill) {
            if (!player.storage[skill]) player.storage[skill] = 0;
        },
        onremove: true,
        mod: {
            maxHandcard: function (player, num) {
                return num + Infinity;
            },
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + Infinity;
            },
        },
    },
    txmazhan: {
        locked: true,
        mod: {
            globalFrom: function (from, to, distance) {
                return distance - 2;
            },
            globalTo: function (from, to, distance) {
                return distance + 1;
            },
        },
    },
    txlieji: {
        trigger: {
            player: "useCardAfter"
        },
        usable: 1,
        priority: 9,
        direct: true,
        filter: function (event, player) {
            return event.targets && event.targets.length == 1 && (event.card.name == "sha" || get.type(event.card) == "trick");
        },
        content: function () {
            "step 0";
            player.draw();
            "step 1";
            game.log(player, "裂击效果发动，可以再次结算一次【", trigger.card.name, "】");
            player.useCard(trigger.card, trigger.targets, true);
        }
    },
    diycuidu: {
        audio: 2,
        trigger: { source: 'damageEnd' },
        derivation: ['diyzhongdu'],
        forced: true,
        unique: true,
        filter: function (event, player) {
            if (event._notrigger.includes(event.player)) return false;
            return event.player.isIn() && event.player.isEnemyOf(player) && !event.player.hasSkill('diyzhongdu');
        },
        logTarget: 'player',
        content: function () {
            trigger.player.addSkill('diyzhongdu');
            player.draw(2);
            if (player) {
                player.draw(0);
            }
        }
    },
    diychunxiao: {
        audio: 1,
        forced: true,
        trigger: {
            player: "phaseJieshuBegin",
        },
        filter: function (event, player) {
            return player.hp < player.maxHp && Math.random() <= 0.50;
        },
        content: function () {
            player.recover(player.maxHp - player.hp);
        },
    },
    diyzhongdu: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        mark: true,
        nopop: true,
        temp: true,
        intro: {
            content: '锁定技，回合开始时，你进行判定，若结果不为红桃，你受到1点无来源的伤害，若结果不为黑桃，此中毒效果失效。'
        },
        content: function () {
            'step 0'
            player.judge(function (card) {
                var suit = get.suit(card);
                if (suit == 'spade') return -1;
                if (suit == 'heart') return 1;
                return 0;
            });
            'step 1'
            if (result.suit != 'heart') {
                player.damage('nosource');
            }
            if (result.suit != 'spade') {
                player.removeSkill('diyzhongdu');
            }
        }
    },
    diyzhuiling: {
        audio: 1, trigger: { player: 'damageEnd' },
        filter: function (event) {
            return event.source != undefined;
        },
        logTarget: 'source',
        content: function () {
            trigger.source.damage(1).nature = ['fire', 'thunder', 'ice', 'poison'].randomGet();
        },
    },
    diyfeihua: {
        trigger: { player: 'phaseUseBegin' },
        content: function () {
            var name = ['zhibi', 'wanjian'].randomGet();
            player.useCard({ name: name }, game.filterPlayer(function (current) {
                return player.canUse({ name: name }, current)
            }), 'noai');
        },
    },
    txclanxieshu: {
        audio: 2,
        trigger: {
            player: "damageEnd",
            source: "damageSource",
        },
        filter: function (event, player) {
            return (event.card) && player.countCards('he') >= lib.skill.dcweidang.getLength(event.card);
        },
        content: function () {
            var card = trigger.card
            var num = lib.skill.dcweidang.getLength(card)
            player.chooseToDiscard(num, 'he', true)
            if (player.hp < player.maxHp)
                player.draw(player.getDamagedHp());
        },
        ai: {
            maixie: true,
            "maixie_hp": true,
            effect: {
                target: function (card, player, target) {
                    if (player.hasSkillTag('jueqing', false, target)) return [1, -1];
                    if (get.tag(card, 'damage')) return [1, 0.55];
                },
            },
        },
    },
    txshixin: {
        audio: 2,
        filter: function (event, player) {
            return event.player != player && get.type(event.card) == 'trick' || get.type(event.card) == 'delay';
        },
        trigger: {
            target: "useCardToBefore",
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                if (get.color(card) == 'black') return 1;
                return 0;
            });
            "step 1"
            if (result.color) {
                if (result.color == 'black') {
                    trigger.cancel();
                }
                else {
                    player.addTempSkill('txshixin_red', {
                        target: 'useCardToAfter',
                    });
                }
            }
        },
        subSkill: {
            red: {
                trigger: {
                    target: "useCardToAfter",
                },
                content: function () {
                    player.link();
                    //player.$gain2(trigger.cards);
                },
                sub: true,
            },
        },
    },
    txqyyouji: {
        audio: 2,
        trigger: { player: 'useCardToTargeted' },
        shaRelated: true,
        filter: function (event, player) {
            return event.isFirstTarget && event.targets.length == 1 && get.type(event.card, 'trick') == 'trick';
        },
        content: function () {
            trigger.getParent().targets = trigger.getParent().targets.concat(trigger.targets);
            trigger.getParent().triggeredTargets4 = trigger.getParent().triggeredTargets4.concat(trigger.targets);
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (player._txqyyouji_aiChecking) return;
                    if (target == player) {
                        player._txqyyouji_aiChecking = true;
                        var eff = get.effect(target, card, player, player);
                        delete player._txqyyouji_aiChecking;
                        if (eff < 3) return 'zerotarget';
                    }
                }
            }
        },
        mod: {
            attackRange: function (player, num) {
                return num + 0;
            },
        }
    },
    txmouduan: {
        trigger: {
            player: "phaseJieshuBegin",
        },
        //priority:2,
        audio: 2,
        filter: function (event, player) {
            var history = player.getHistory('useCard');
            var suits = [];
            var types = [];
            for (var i = 0; i < history.length; i++) {
                var suit = get.suit(history[i].card);
                if (suit) suits.add(suit);
                types.add(get.type(history[i].card))
            }
            return suits.length >= 4 || types.length >= 3;
        },
        check: function (event, player) {
            return player.canMoveCard(true);
        },
        content: function () {
            player.moveCard();
        },
    },
    txkaikang: {
        audio: "kaikang",
        trigger: { global: 'useCardToTargeted' },
        filter: function (event, player) {
            return event.card.name == 'sha' && event.target.isIn();
        },
        check: function (event, player) {
            return get.attitude(player, event.target) >= 0;
        },
        logTarget: 'target',
        content: function () {
            "step 0"
            player.draw();
            if (trigger.target != player) {
                player.chooseCard(true, 'he', '交给' + get.translation(trigger.target) + '一张牌').set('ai', function (card) {
                    if (get.position(card) == 'e') return -1;
                    if (card.name == 'shan') return 1;
                    if (get.type(card) == 'equip') return 0.5;
                    return 0;
                });
            }
            else {
                event.finish();
            }
            "step 1"
            player.give(result.cards, trigger.target, 'give');
            game.delay();
            event.card = result.cards[0];
            "step 2"
            if (trigger.target.getCards('h').includes(card) && get.type(card) == 'equip') {
                trigger.target.chooseUseTarget(card);
            }
        },
        ai: {
            threaten: 1.1
        }
    },
    txhuangfu: {
        audio: 2,
        trigger: { player: 'damageBegin4' },
        filter: function (event) {
            return event.nature == 'thunder';
        },
        forced: true,
        content: function () {
            trigger.cancel();
        },
        ai: {
            nofire: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.tag(card, 'thunderDamage')) return 'zerotarget';
                }
            }
        }
    },
    txleizhen: {
        audio: 2,
        trigger: { player: 'die' },
        forced: true,
        forceDie: true,
        filter: function (event) {
            return event.source && event.source.isIn();
        },
        logTarget: 'source',
        skillAnimation: true,
        animationColor: 'thunder',
        content: function () {
            trigger.source.damage(1, 'thunder');
        },
        ai: {
            threaten: 0.7
        }
    },
    txxiebi: {
        trigger: { player: 'damageBegin4' },
        forced: true,
        audio: true,
        filter: function (event, player) {
            if (event.num <= 1) return false;
            if (player.hasSkillTag('unequip2')) return false;
            if (event.source && event.source.hasSkillTag('unequip', false, {
                name: event.card ? event.card.name : null,
                target: player,
                card: event.card
            })) return false;
            return true;
        },
        //priority:-10,
        content: function () {
            trigger.num = 1;
        },
        ai: {
            filterDamage: true,
            skillTagFilter: function (player, tag, arg) {
                if (player.hasSkillTag('unequip2')) return false;
                if (arg && arg.player) {
                    if (arg.player.hasSkillTag('unequip', false, {
                        name: arg.card ? arg.card.name : null,
                        target: player,
                        card: arg.card,
                    })) return false;
                    if (arg.player.hasSkillTag('unequip_ai', false, {
                        name: arg.card ? arg.card.name : null,
                        target: player,
                        card: arg.card,
                    })) return false;
                    if (arg.player.hasSkillTag('jueqing', false, player)) return false;
                }
            },
        },
    },
    txlianbi: {
        audio: 2,
        locked: true,
        ai: {
            effect: {
                target: function (card) {
                    if (card.name == 'tiesuo') return 'zeroplayertarget';
                },
            },
        },
        group: ["txlianbi_1"],
        subSkill: {
            '1': {
                audio: 2,
                trigger: {
                    player: ['linkBefore', 'enterGame'],
                    global: 'phaseBefore',
                },
                forced: true,
                filter: function (event, player) {
                    if (event.name == 'link') return player.isLinked();
                    return (event.name != 'phase' || game.phaseNumber == 0) && !player.isLinked();
                },
                content: function () {
                    if (trigger.name != 'link') player.link(true);
                    else trigger.cancel();
                },
            },
        },
    },
    txfeiyan: {
        trigger: {
            global: "useCardToPlayer",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && event.player != player && event.targets.length == 1 &&
                get.distance(player, event.player, 'attack') <= 1 && player.countCards('h', 'sha') > 0;
        },
        direct: true,
        content: function () {
            "step 0"
            var check = get.attitude(player, trigger.player) < 0;
            player.chooseToUse({ name: 'sha' }, '飞燕：是否对' + get.translation(trigger.player) + '使用一张【杀】？').set('targetRequired', true).set('complexSelect', true).set('filterTarget', function (card, player, target) {
                if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) return false;
                return lib.filter.filterTarget.apply(this, arguments);
            }).set('ai', function () {
                if (_status.event.check) return 1;
                return 0;
            }).set('sourcex', trigger.player).set('check', check);
            "step 1"
            if (result.bool) {
                player.draw(2);
            }
            else event.finish();
        },
        mod: {
            aiValue: function (player, card, num) {
                if (card.name == 'sha') return 10;
            },
        },
    },
    txleili: {
        audio: 2,
        trigger: { source: 'damageEnd' },
        direct: true,
        filter: function (event) {
            return event.card && event.card.name == 'sha';
        },
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('diyleili'), function (card, player, target) {
                if (target == trigger.player) return false;
                return target.isEnemyOf(player);
            }).ai = function (target) {
                return get.damageEffect(target, player, player, 'thunder');
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txleili', result.targets);
                result.targets[0].damage('thunder');
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    cxyMoJun: {
        trigger: { global: "damageEnd" },
        filter: function (event, player) {
            if (!event.source || !event.source.isAlive()) return false;
            if (get.attitude(player, event.source) < 2) return false;
            if (!event.card || event.card.name != "sha") return false;
            return event.notLink();
        },
        forced: true,
        content: function () {
            'step 0'
            trigger.source.judge(function (card) {
                return get.color(card) == 'black' ? 2 : 0;
            });
            'step 1'
            if (result.bool) {
                event.targets = game.filterPlayer(function (current) {
                    return get.attitude(player, current) > 0;
                });
                event.targets.sort(lib.sort.seat);
                game.asyncDraw(event.targets);
            }
        },
    },
    cxyKuangXi: {//修复
        enable: "phaseUse",
        filter: function (event, player) {
            return !player.hasSkill("cxyKuangXi_temp");
        },
        selectTarget: 1,
        filterTarget: function (card, player, target) {
            return target != player;
        },
        content: async function (event, trigger, player) {
            await player.loseHp();
            await event.target.damage(player);
            let dying = event.target.getHistory("damage", function (evt) {
                return evt.getParent('cxyKuangXi') == event && evt._dyinged;
            }).length;
            console.log(event, dying);
            if (dying) {
                await player.addTempSkill("cxyKuangXi_temp", { player: "phaseAfter" });
            }
        },
        ai: {
            order: 7,
            result: {
                target: function (player, target) {
                    return get.damageEffect(target, player);
                },
                player: function (player, target) {
                    if (player.hp >= target.hp) {
                        return -0.9;
                    }
                    if (player.hp <= 2) {
                        return -10;
                    }
                    return get.effect(player, { name: "losehp" }, player, player);
                },
            },
        },
        subSkill: {
            temp: {
            },
        },
    },
    txbaobian: {
        audio: "baobian",
        trigger: {
            player: ["phaseBefore", "changeHp"],
        },
        forced: true,
        popup: false,
        init: function (player) {
            if (game.online) return;
            player.removeAdditionalSkill('txbaobian');
            var list = [];
            if (player.hp <= 3) {
                //if(trigger.num!=undefined&&trigger.num<0&&player.hp-trigger.num>1) player.logSkill('txbaobian');
                list.push('tiaoxin');
            }
            if (player.hp <= 2) {
                list.push('paoxiao');
            }
            if (player.hp <= 1) {
                list.push('shensu');
            }
            if (list.length) {
                player.addAdditionalSkill('txbaobian', list);
            }
        },
        derivation: ["tiaoxin", "paoxiao", "shensu"],
        content: function () {
            player.removeAdditionalSkill('txbaobian');
            var list = [];
            if (player.hp <= 3) {
                if (trigger.num != undefined && trigger.num < 0 && player.hp - trigger.num > 1) player.logSkill('txbaobian');
                list.push('tiaoxin');
            }
            if (player.hp <= 2) {
                list.push('paoxiao');
            }
            if (player.hp <= 1) {
                list.push('shensu');
            }
            if (list.length) {
                player.addAdditionalSkill('txbaobian', list);
            }
        },
        ai: {
            maixie: true,
            effect: {
                target: function (card, player, target) {
                    if (get.tag(card, 'damage')) {
                        if (!target.hasFriend()) return;
                        if (target.hp >= 4) return [0, 1];
                    }
                    if (get.tag(card, 'recover') && player.hp >= player.maxHp - 1) return [0, 0];
                },
            },
        },
    },
    //*搬运自诸侯伐董扩展，作者为程序员//
    cxy_BaoYing: {
        skillAnimation: true,
        animationColor: 'fire',
        mark: true,
        intro: { content: 'limited' },
        trigger: { global: 'dying' },
        filter: function (event, player) {
            if (player.storage.cxy_BaoYing) return false;
            if (get.mode() == 'identity') return get.attitude(player, event.player) > 0;
            return event.player.isFriendOf(player);
        },
        logTarget: 'player',
        content: function () {
            player.awakenSkill('cxy_BaoYing');
            trigger.player.recover(1 - trigger.player.hp);
        },
    },
    cxyYangWu: {
        trigger: { player: "phaseZhunbeiBegin" },
        direct: true,
        content: function () {
            "step 0"
            event.targets = game.filterPlayer(function (current) {
                return current != player;
            });
            event.targets.sort(lib.sort.seat);
            player.logSkill("cxyYangWu", event.targets);
            for (var i = 0; i < event.targets.length; i++) {
                event.targets[i].damage(player);
                game.delay();
            }
            "step 1"
            player.loseHp();
        },
    },
    cxyJingQi: {
        trigger: { global: "gameStart" },
        priority: 16,
        direct: true,
        content: function () {
            event.targets = game.filterPlayer(function (current) {
                return get.attitude(player, current) > 2;
            });
            event.targets.sort(lib.sort.seat);
            for (var i = 0; i < event.targets.length; i++) {
                event.targets[i].addSkill("cxyJingQi_buff");
                event.targets[i].markSkillCharacter('cxyJingQi', player, '精骑', '你计算与敌方角色的距离-1');
            }
        },
        subSkill: {
            buff: {
                mod: {
                    globalFrom: function (from, to, distance) {
                        if (game.hasPlayer(function (current) {
                            return current.hasSkill("cxyJingQi") && get.attitude(current, from) > 2;
                        })) {
                            return distance - 1;
                        }
                    },
                },
                temp: true,
                onremove: function (player) {
                    player.unmarkSkill('cxyJingQi');
                },
                trigger: { global: "dieAfter" },
                direct: true,
                filter: function (event, player) {
                    return !game.hasPlayer(function (current) {
                        return current.hasSkill("cxyJingQi") && get.attitude(current, player) > 2;
                    });
                },
                content: function () {
                    player.removeSkill("cxyJingQi_buff");
                },
            },
        },
    },
    cxyRuiQi: {
        trigger: { global: "phaseDrawBegin" },
        filter: function (event, player) {
            return get.attitude(player, event.player) > 2;
        },
        logTarget: 'player',
        forced: true,
        content: function () {
            trigger.num++;
        },
        ai: {
            threaten: 2.5,
        }
    },
    cxyJiaoXia: {
        trigger: { global: "phaseDiscardBefore" },
        filter: function (event, player) {
            return get.attitude(player, event.player) > 2;
        },
        forced: true,
        logTarget: 'player',
        content: function () {
            trigger.player.addTempSkill("cxyJiaoXia_buff", "phaseDiscardEnd");
        },
        subSkill: {
            buff: {
                mod: {
                    maxHandcard: function (player, num) {
                        var hs = player.getCards('h');
                        for (var i = 0; i < hs.length; i++) {
                            if (get.color(hs[i]) == 'black') {
                                num++;
                            }
                        }
                        return num;
                    },
                    cardDiscardable: function (card, player, name) {
                        if (name == 'phaseDiscard' && get.color(card) == 'black') return false;
                    }
                },
            },
        },
    },
    cxyTunJun: {
        trigger: { global: "roundStart" },
        filter: function (event, player) {
            return player.maxHp != 1;
        },
        forced: true,
        content: function () {
            "step 0"
            player.loseMaxHp();
            "step 1"
            player.draw(player.maxHp);
        },
    },
    cxyFengYing: {
        trigger: { global: "gameStart" },
        priority: 15,
        direct: true,
        content: function () {
            event.targets = game.filterPlayer(function (current) {
                return get.attitude(player, current) > 2;
            });
            event.targets.sort(lib.sort.seat);
            for (var i = 0; i < event.targets.length; i++) {
                event.targets[i].addSkill("cxyFengYing_buff");
                event.targets[i].markSkillCharacter('cxyFengYing', player, '凤营', '若你是体力值唯一最少的角色，则敌方角色不能使用牌指定你为目标');
            }
        },
        ai: { threaten: 3 },
        subSkill: {
            buff: {
                mod: {
                    targetEnabled: function (card, player, target) {
                        if (game.hasPlayer(function (current) {
                            return current.hasSkill("cxyFengYing") && get.attitude(current, target) > 0;
                        })) {
                            if (get.attitude(player, target) < 0 && !game.hasPlayer(function (current) {
                                return current != target && current.hp <= target.hp;
                            })) return false;
                        }
                    },
                },
                temp: true,
                onremove: function (player) {
                    player.unmarkSkill('cxyFengYing');
                },
                trigger: { global: "dieAfter" },
                direct: true,
                filter: function (event, player) {
                    return !game.hasPlayer(function (current) {
                        return current.hasSkill("cxyFengYing") && get.attitude(current, player) > 2;
                    });
                },
                content: function () {
                    player.removeSkill("cxyFengYing_buff");
                },
            },
        },
    },
    cxyFanGong: {
        trigger: { target: "useCardToAfter" },
        filter: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        direct: true,
        content: function () {
            player.chooseToUse("是否发动反攻，对" + get.translation(trigger.player) + "使用一张[杀]？", { name: "sha" }).set("filterTarget", function (card, player, target) {
                return target == _status.event.source;
            }).set("selectTarget", -1).set('source', trigger.player).set("logSkill", "cxyFanGong");
        },
    },
    cxyJieLve: {
        trigger: { source: "damageEnd" },
        filter: function (event, player) {
            if (!event.player.isAlive() || event.player == player) return false;
            return event.player.num("hej") > 0;
        },
        logTarget: "player",
        content: function () {
            "step 0"
            var num = 0;
            if (trigger.player.num("h")) num++;
            if (trigger.player.num("e")) num++;
            if (trigger.player.num("j")) num++;
            if (num) {
                player.gainPlayerCard(trigger.player, "hej", num, true).set("filterButton", function (button) {
                    for (var i = 0; i < ui.selected.buttons.length; i++) {
                        if (get.position(button.link) == get.position(ui.selected.buttons[i].link)) return false;
                    }
                    return true;
                });
            } else {
                event.finish();
            }
            "step 1"
            player.link();
        },
    },
    cxyMoQu: {
        group: ["cxyMoQu_sub1", "cxyMoQu_sub2"],
        subSkill: {
            sub1: {
                trigger: { global: "phaseEnd" },
                filter: function (event, player) {
                    return player.num('h') <= player.hp;
                },
                forced: true,
                content: function () {
                    player.draw(2);
                },
            },
            sub2: {
                trigger: { global: "damageEnd" },
                filter: function (event, player) {
                    return event.player != player && get.attitude(player, event.player) > 0;
                },
                forced: true,
                content: function () {
                    player.chooseToDiscard("魔躯：其他友方角色受到伤害后，你弃置一张牌", "he", true);
                },
            },
        },
    },
    cxyYaoWu: {
        trigger: { player: "damageBegin" },
        filter: function (event, player) {
            if (!event.source || !event.source.isAlive()) return false;
            return event.card && event.card.name == "sha" && get.color(event.card) == "red";
        },
        forced: true,
        content: function () {
            "step 0"
            if (trigger.source.hp == trigger.source.maxHp) {
                trigger.source.draw();
                event.finish();
            } else {
                trigger.source.chooseControl("回血", "摸牌", function (event, player) {
                    return "回血";
                }).prompt = "耀武：请选择回血或摸牌";
            }
            "step 1"
            if (result.control == "回血") {
                trigger.source.recover();
            } else {
                trigger.source.draw();
            }
        },
    },
    cxyYingHun: {
        trigger: { player: "phaseZhunbeiBegin" },
        filter: function (event, player) {
            return player.hp < player.maxHp;
        },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget("是否发动英魂？", function (card, player, target) {
                return target != player;
            }).ai = function (target) {
                if (get.attitude(player, target) > 2) return 5 + Math.random();
                var draw = player.maxHp - player.hp;
                var num = target.num('he') + 1;
                if (num == draw) return 4;
                if (num < draw) return Math.min(1, 4 - (draw - num));
                return Math.min(1, 4 - (draw - num) * 0.5);
            };
            "step 1"
            if (result.bool) {
                event.num = player.maxHp - player.hp;
                event.target = result.targets[0];
                event.list = ["摸" + event.num + "弃1", "摸1弃" + event.num];
                player.chooseControl(event.list, function (event, player) {
                    if (get.attitude(player, event.target) > 0) return event.list[0];
                    return event.list[1];
                }).prompt = "英魂：请选择一项";
            } else {
                event.finish();
            }
            "step 2"
            player.logSkill("cxyYingHun", event.target);
            if (result.control == event.list[0]) {
                event.target.draw(event.num);
                event.num = 1;
            } else {
                event.target.draw(1);
            }
            "step 3"
            event.target.chooseToDiscard("英魂：请弃置" + event.num + "张牌", event.num, "he", true);
        },
        ai: {
            //优先攻击孙坚
            threaten: 80,
        },
    },
    cxyPoLu: {
        group: ["cxyPoLu_sub1", "cxyPoLu_sub2"],
        ai: {
            //优先攻击孙坚
            threaten: 80,
        },
        subSkill: {
            sub1: {
                trigger: { player: "dieBegin" },
                forced: true,
                content: function () {
                    "step 0"
                    if (player.storage.cxyPoLu == undefined) {
                        player.storage.cxyPoLu = 0;
                    }
                    player.storage.cxyPoLu++;
                    event.targets = game.filterPlayer(function (target) {
                        return target != player && get.attitude(player, target) > 0;
                    });
                    event.targets.sort(lib.sort.seat);
                    "step 1"
                    player.line(event.targets);
                    game.asyncDraw(event.targets, player.storage.cxyPoLu);
                },
            },
            sub2: {
                trigger: { global: "dieAfter" },
                filter: function (event, player) {
                    return event.source && get.attitude(player, event.player) < 0 && get.attitude(player, event.source) > 0;
                },
                forced: true,
                content: function () {
                    "step 0"
                    if (player.storage.cxyPoLu == undefined) {
                        player.storage.cxyPoLu = 0;
                    }
                    player.storage.cxyPoLu++;
                    event.targets = game.filterPlayer(function (target) {
                        return get.attitude(player, target) > 0;
                    });
                    event.targets.sort(lib.sort.seat);
                    "step 1"
                    player.line(event.targets);
                    game.asyncDraw(event.targets, player.storage.cxyPoLu);
                }
            },
        },
    },
    //搬运诸侯伐董扩展到这.*//
    oldfuman: {
        audio: "fuman",
        enable: "phaseUse",
        filterTarget: function (card, player, target) {
            return !target.hasSkill('oldfuman2') && target != player;
        },
        filter: function (event, player) {
            return player.countCards('h', 'sha');
        },
        discard: false,
        lose: false,
        delay: false,
        filterCard: {
            name: "sha",
        },
        content: function () {
            target.gain(cards, player, 'giveAuto').gaintag.add('oldfuman');
            target.storage.oldfuman2 = player;
            target.addTempSkill('oldfuman2', { player: 'phaseAfter' });
        },
        check: function (card) {
            return 6 - get.value(card);
        },
        ai: {
            order: 2,
            result: {
                target: function (player, target) {
                    if (!target.hasSha()) return 1.2;
                    return 1;
                },
            },
        },
    },
    "oldfuman2": {
        mod: {
            aiOrder: function (player, card, num) {
                if (get.itemtype(card) == 'card' && card.hasGaintag('oldfuman') && player.storage.oldfuman2.isIn()) return num + get.sgn(get.attitude(player, player.storage.oldfuman2));
            },
        },
        trigger: {
            player: "useCard",
        },
        forced: true,
        filter: function (event, player) {
            if (!player.storage.oldfuman2.isIn()) return false;
            return player.getHistory('lose', function (evt) {
                if (evt.getParent() != event) return false;
                for (var i in evt.gaintag_map) {
                    if (evt.gaintag_map[i].includes('oldfuman')) return true;
                }
                return false;
            }).length > 0;
        },
        mark: true,
        intro: {
            content: "下个回合结束之前使用“抚蛮”牌时，令$摸一张牌",
        },
        content: function () {
            'step 0'
            game.delayx();
            'step 1'
            player.line(player.storage.oldfuman2, 'green');
            player.storage.oldfuman2.draw();
        },
        onremove: function (player) {
            delete player.storage.oldfuman2;
            player.removeGaintag('oldfuman');
        },
    },
    txhuao: {
        trigger: { player: 'phaseBegin' },
        forced: true,
        audio: 1,
        content: function () {
            'step 0'
            var card = get.cardPile(function (card) {
                return card.name == 'sha';
            });
            if (card) player.gain(card, 'gain2');
        },
    },
    hgkurou: {
        audio: "kurou",
        enable: "phaseUse",
        usable: 1,
        filterCard: true,
        check: function (card) {
            return 8 - get.value(card);
        },
        position: "he",
        content: function () {
            player.loseHp();
            player.draw(3);
            player.addTempSkill('hgkurou_effect');
        },
        ai: {
            order: 8,
            result: {
                player: function (player) {
                    if (player.hp <= 2) return player.countCards('h') == 0 ? 1 : 0;
                    if (player.countCards('h', { name: 'sha', color: 'red' })) return 1;
                    return player.countCards('h') <= player.hp ? 1 : 0;
                },
            },
        },
    },
    hgkurou_effect: {
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + 1;
            },
        },
    },
    gdsanchen: {
        audio: 'sanchen',
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            var stat = player.getStat('sanchen');
            return game.hasPlayer(function (current) {
                return (!stat || !stat.includes(current));
            });
        },
        filterTarget: function (card, player, target) {
            var stat = player.getStat('sanchen');
            return (!stat || !stat.includes(target));
        },
        content: function () {
            'step 0'
            var stat = player.getStat();
            if (!stat.sanchen) stat.sanchen = [];
            stat.sanchen.push(target);
            target.draw(3);
            'step 1'
            if (!target.countCards('he')) event.finish();
            else target.chooseToDiscard('he', true, 3).set('ai', function (card) {
                var list = ui.selected.cards.map(function (i) {
                    return get.type2(i);
                });
                if (!list.includes(get.type2(card))) return 7 - get.value(card);
                return -get.value(card);
            });
            'step 2'
            if (result.bool && result.cards && result.cards.length) {
                var list = [];
                for (var i of result.cards) list.add(get.type2(i));
                if (list.length == result.cards.length) {
                    target.draw();
                    player.getStat('skill').gdsanchen--;
                    player.addMark('gdsanchen', 1);
                }
            }
            else {
                target.draw();
                player.getStat('skill').sanchen--;
                player.addMark('gdsanchen', 1);
            }
        },
        ai: {
            order: 9,
            threaten: 1.7,
            result: {
                target: function (player, target) {
                    if (target.hasSkillTag('nogain')) return 0.1;
                    return Math.sqrt(target.countCards('he'));
                },
            },
        },
        marktext: '陈',
        intro: {
            name2: '陈',
            content: 'mark',
        },
    },
    txlveming: {
        init: function (player) {
            player.storage.txlveming = 0;
        },
        mark: true,
        intro: {
            content: "已发动过#次",
        },
        audio: "xinfu_lveming",
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            return player != target && target.countCards('e') > player.countCards('e');
        },
        content: function () {
            "step 0"
            var list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => get.strNumber(i));
            target.chooseControl(list).set('ai', function () {
                return get.rand(0, 12);
            }).set('prompt', '请选择一个点数');
            "step 1"
            if (result.control) {
                target.$damagepop(result.control, 'thunder');
                var num = result.index + 1;
                event.num = num;
            }
            else {
                target.$damagepop('K', 'thunder');
                event.num = 13;
            };
            game.log(target, '选择的点数是', '#y' + get.strNumber(event.num));
            player.storage.txlveming++;
            player.judge(function (card) {
                if (card.number == _status.event.getParent('txlveming').num) return 4;
                return 0;
            });
            "step 2"
            if (result.bool == true) {
                target.damage(3);
            }
            else {
                var card = target.getCards('hej').randomGet();
                player.gain(card, target, 'giveAuto', 'bySelf');
                target.damage(1);
            }
        },
        ai: {
            order: 9,
            result: {
                target: function (player, target) {
                    var numj = target.countCards('j');
                    var numhe = target.countCards('he');
                    if (numhe == 0) return numj > 0 ? 6 : -6;
                    return -6 - (numj + 1) / numhe;
                },
            },
            threaten: 1.1,
        },
    },
    txdaoxi: {
        audio: "jixi",
        usable: 3,
        filter: function (event, player) {
            return player.countCards('hes', { color: 'red' }) > 0;
        },
        enable: 'chooseToUse',
        filterCard: function (card) {
            return get.color(card) == 'red';
        },
        position: 'hes',
        viewAs: { name: 'shunshou' },
        prompt: '将一张红色牌当顺手牵羊使用',
        check: function (card) { return 6 - get.value(card) },
        ai: {
            threaten: 1.5
        }
    },
    txlangxi: {
        audio: "xinfu_langxi",
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player;
            });
        },
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txlangxi'), '对一名体力值不大于你的其他角色造成2-4点随机伤害', function (card, player, target) {
                return target != player;
            }).set('ai', function (target) {
                var player = _status.event.player;
                return get.damageEffect(target, player, player);
            });
            "step 1"
            if (result.bool && result.targets && result.targets.length) {
                player.logSkill('txlangxi', result.targets);
                var num = [2, 3, 4].randomGet();
                if (get.isLuckyStar(player)) num = 4;
                player.line(result.targets[0], 'green');
                result.targets[0].damage(num);
            }
        },
        ai: {
            expose: 0.25,
            threaten: 1.7,
        },
    },
    txkuangyi: {
        usable: 1,
        audio: "xinfu_yisuan",
        trigger: {
            player: "useCardEnd",
        },
        check: function (event, player) {
            return get.value(event.cards) + player.maxHp * 2 - 18 > 0;
        },
        prompt2: function (event, player) {
            return '你横置武将牌，然后获得' + get.translation(event.cards.filterInD()) + '。';
        },
        filter: function (event, player) {
            return player.isPhaseUsing() && get.type(event.card) !== 'trick' && get.type(event.card) == 'basic' && event.cards.filterInD().length > 0;
        },
        content: function () {
            player.link();
            player.gain(trigger.cards.filterInD(), 'gain2', 'log');
        },
    },
    txtanbei: {
        audio: "xinfu_tanbei",
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            return player != target;
        },
        content: function () {
            "step 0"
            if (target.countCards('hej') == 0) {
                event._result = { index: 1 };
            }
            else {
                target.chooseControl().set('choiceList', [
                    '令' + get.translation(player) + '随机获得你区域内的一张牌，然后其本回合内不能再对你使用牌。',
                    '令' + get.translation(player) + '本回合内对你使用牌没有次数与距离限制。',
                ]).set('ai', function () {
                    var list = [0, 1];
                    return list.randomGet();
                });
            }
            "step 1"
            player.addTempSkill('txtanbei_effect3');
            if (result.index == 0) {
                var card = target.getCards('hej').randomGet();
                player.gain(card, target, 'giveAuto', 'bySelf');
                target.addTempSkill('txtanbei_effect2');
            }
            else {
                target.addTempSkill('txtanbei_effect1');
                target.addTempSkill('fengyin');
            }
        },
        ai: {
            order: function () {
                return [2, 4, 6, 8, 10].randomGet();
            },
            result: {
                target: function (player, target) {
                    return -2 - target.countCards('h');
                },
            },
            threaten: 1.1,
        },
    },
    txtanbei_effect3: {
        charlotte: true,
        mod: {
            targetInRange: function (card, player, target) {
                if (target.hasSkill('txtanbei_effect1')) {
                    return true;
                }
            },
            cardUsableTarget: function (card, player, target) {
                if (target.hasSkill('txtanbei_effect1')) return true;
            },
            playerEnabled: function (card, player, target) {
                if (target.hasSkill('txtanbei_effect2')) return true;
            },
        },
    },
    "txtanbei_effect1": {
        charlotte: true,
    },
    "txtanbei_effect2": {
        charlotte: true,
    },
    ljxuechi: {
        audio: 2,
        trigger: { global: 'recoverBefore' },
        filter: function (event, player) {
            return player.countCards('h') < 3;
        },
        forced: true,
        direct: true,
        content: function () {
            trigger.player.logSkill('ljxuechi', player);
            trigger.cancel();
            player.draw();
        }
    },
    txzhuxin: {
        trigger: {
            global: "dying",
        },
        filter: function (event, player) {
            return event.source == player;
        },
        forced: true,
        content: function () {
            trigger.player.die()._triggered = null;
        },
    },
    txyicheng: {
        audio: "gzyicheng",
        trigger: { global: 'useCardToTargeted' },
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        preHidden: true,
        content: function () {
            'step 0'
            trigger.target.draw();
            'step 1'
            trigger.target.chooseToDiscard('he', true);
        }
    },
    txnianrui: {
        trigger: { player: 'phaseDrawBegin' },
        forced: true,
        content: function () {
            trigger.num += 2;
        },
        ai: {
            threaten: 1.6
        }
    },
    txmengtai: {
        group: ['txmengtai_begin', 'txmengtai_draw', 'txmengtai_use',
            'txmengtai_discard', 'txmengtai_end'],
        subSkill: {
            begin: {
                trigger: { player: 'phaseZhunbeiBegin' },
                forced: true,
                popup: false,
                content: function () {
                    player.storage.txmengtai_draw = true;
                    player.storage.txmengtai_use = true;
                }
            },
            draw: {
                trigger: { player: 'phaseDrawBegin' },
                forced: true,
                popup: false,
                content: function () {
                    player.storage.txmengtai_draw = false;
                }
            },
            use: {
                trigger: { player: 'phaseUseBegin' },
                forced: true,
                popup: false,
                content: function () {
                    player.storage.txmengtai_use = false;
                }
            },
            discard: {
                trigger: { player: 'phaseDiscardBefore' },
                forced: true,
                filter: function (event, player) {
                    if (player.storage.txmengtai_use) return true;
                    return false;
                },
                content: function () {
                    trigger.cancel();
                }
            },
            end: {
                trigger: { player: 'phaseJieshuBegin' },
                forced: true,
                filter: function (event, player) {
                    if (player.storage.txmengtai_draw) return true;
                    return false;
                },
                content: function () {
                    player.draw(3);
                }
            }
        }
    },
    txshouyi: {
        mod: {
            targetInRange: function () {
                return true;
            }
        },
    },
    txrenxing: {
        trigger: { global: ['damageEnd', 'recoverEnd'] },
        forced: true,
        filter: function (event, player) {
            return _status.currentPhase != player;
        },
        content: function () {
            player.draw();
        }
    },
    txyinli: {
        audio: 2,
        trigger: { global: 'phaseEnd' },
        forced: true,
        filter: function (event, player) {
            return player != event.player && game.getGlobalHistory('cardMove', function (evt) {
                if (evt.name != 'lose' || evt.type != 'discard') return false;
                for (var i of evt.cards) {
                    if (get.type(i, false) == 'equip' && get.position(i, true) == 'd') return true;
                }
                return false;
            }).length > 0;
        },
        content: function () {
            'step 0'
            var cards = [];
            game.getGlobalHistory('cardMove', function (evt) {
                if (evt.name != 'lose' || evt.type != 'discard') return false;
                for (var i of evt.cards) {
                    if (get.type(i, false) == 'equip' && get.position(i, true) == 'd') cards.push(i);
                }
            });
            player.chooseButton(['姻礼：获得装备牌', cards], [1, Infinity]).set('ai', function (button) {
                return get.value(button.link, _status.event.player);
            });
            'step 1'
            if (result.bool) player.gain(result.links, 'gain2');
        },
    },
    txzhulian: {
        audio: "mouzhu",
        trigger: {
            global: "gameStart",
        },
        forced: true,
        content: function () {
            if (!player.isLinked()) player.link();
        },
        ai: {
            result: {
                player: function (player, target) {
                    return 1;
                }
            }
        },
        group: ["txzhulian_link", "txzhulian_damage"],
        subSkill: {

            link: {
                audio: "mouzhu",
                trigger: {
                    player: "linkAfter",
                },
                filter: function (event, player) {
                    return !player.isLinked();
                },
                forced: true,
                content: function () {
                    player.link();
                },
            },
            damage: {
                audio: "mouzhu",
                trigger: {
                    player: "damageBegin",
                },
                forced: true,
                content: function () {
                    var players = game.filterPlayer();
                    for (var i = 0; i < players.length; i++) {
                        if (players[i] == player) continue;
                        if (get.distance(player, players[i], 'attack') > 1) continue;
                        if (players[i].isLinked()) continue;
                        players[i].link();
                    }
                },
                ai: {
                    effect: {
                        target: function (card, player, target, current) {
                            if (card.name == 'tiesuo') return 'zerotarget';
                            if (get.tag(card, 'damage') && get.tag(card, 'natureDamage')) {
                                var players = game.filterPlayer();
                                var count = 0;
                                for (var i = 0; i < players.length; i++) {
                                    if (players[i] == target) continue;
                                    if (get.distance(target, players[i], 'attack') > 1) continue;
                                    if (players[i].isLinked()) continue;
                                    count += get.damageEffect(players[i], player, target);
                                }
                                return [1, count];
                            }
                        },
                    },
                },
            },
        },
    },
    txkeji: {
        audio: "keji",
        forced: true,
        trigger: {
            player: "phaseDiscardBegin",
        },
        filter: function (event, player) {
            var list = [];
            player.getHistory('useCard', function (evt) {
                if (evt.isPhaseUsing(player)) {
                    var color = get.color(evt.card);
                    if (color != 'nocolor') list.add(color);
                }
            });
            return list.length <= 1;
        },
        content: function () {
            player.addTempSkill('txkeji_add', 'phaseAfter');
        },
    },
    txkeji_add: {
        mod: {
            maxHandcard: function (player, num) {
                return num + 4;
            },
        },
    },
    txnangce: {
        audio: 1,
        trigger: {
            player: "useCard",
        },
        filter: function (event, player) {
            return get.type(event.card) == 'trick';
        },
        check: function (event, player) {
            return get.attitude(player, _status.currentPhase) > 0;
        },
        content: function () {
            player.line(_status.currentPhase, 'green');
            _status.currentPhase.draw();
        },
        ai: {
            threaten: 1.4,
            noautowuxie: true,
        },
    },
    txduanzui: {
        skillAnimation: true,
        animationColor: 'fire',
        audio: true,
        trigger: { player: 'phaseEnd' },
        //forced:true,
        unique: true,
        filter: function (event, player) {
            for (var i = 0; i < game.players.length; i++) {
                if (game.players[i] != player && game.players[i].num('h')) return true;
            }
            return false;
        },
        content: function () {
            "step 0"
            var players = get.players(player);
            players.remove(player);
            event.players = players;
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                var hs = current.get('h')
                if (hs.length && hs.length < 3) {
                    current.damage('fire', 3 - hs.length);
                }
                event.redo();
            }
        }
    },
    txyingyang: {
        audio: "yingyang",
        trigger: { player: 'compare', target: 'compare' },
        filter: function (event) {
            return !event.iwhile;
        },
        direct: true,
        preHidden: true,
        content: function () {
            'step 0'
            player.chooseControl('点数+3', '点数-3', 'cancel2').set('prompt', get.prompt2('txyingyang')).set('ai', function () {
                if (_status.event.small) return 1;
                else return 0;
            }).set('small', trigger.small);
            'step 1'
            if (result.index != 2) {
                player.logSkill('txyingyang');
                if (result.index == 0) {
                    game.log(player, '拼点牌点数+3');
                    if (player == trigger.player) {
                        trigger.num1 += 3;
                        if (trigger.num1 > 13) trigger.num1 = 13;
                    }
                    else {
                        trigger.num2 += 3;
                        if (trigger.num2 > 13) trigger.num2 = 13;
                    }
                }
                else {
                    game.log(player, '拼点牌点数-3');
                    if (player == trigger.player) {
                        trigger.num1 -= 3;
                        if (trigger.num1 < 1) trigger.num1 = 1;
                    }
                    else {
                        trigger.num2 -= 3;
                        if (trigger.num2 < 1) trigger.num2 = 1;
                    }
                }
            }

        }
    },
    mdqianxi7: {
        audio: "qianxi",
        trigger: { player: 'phaseZhunbeiBegin' },
        preHidden: true,
        content: function () {
            "step 0"
            player.draw();
            player.chooseToDiscard('he', true);
            "step 1"
            if (!result.bool) {
                event.finish();
                return;
            }
            event.color = get.color(result.cards[0], result.cards[0].original == 'h' ? player : false);
            player.chooseTarget(function (card, player, target) {
                return player != target && get.distance(player, target) <= 1;
            }, true).set('ai', function (target) {
                return -get.attitude(_status.event.player, target);
            });
            "step 2"
            if (result.bool && result.targets.length) {
                result.targets[0].storage.mdqianxi72 = event.color;
                result.targets[0].addTempSkill('mdqianxi72');
                player.line(result.targets, 'green');
                game.addVideo('storage', result.targets[0], ['mdqianxi72', event.color]);
            }
        },
        ai: {
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                if (!arg.target.hasSkill('mdqianxi72')) return false;
                if (arg.card.name == 'sha') return arg.target.storage.mdqianxi72 == 'red' && (!arg.target.getEquip('bagua') || player.hasSkillTag('unequip', false, {
                    name: arg.card ? arg.card.name : null,
                    target: arg.target,
                    card: arg.card
                }) || player.hasSkillTag('unequip_ai', false, {
                    name: arg.card ? arg.card.name : null,
                    target: arg.target,
                    card: arg.card
                }));
                return arg.target.storage.mdqianxi72 == 'black';
            }
        },
    },
    mdqianxi72: {
        //trigger:{global:'phaseAfter'},
        forced: true,
        mark: true,
        audio: false,
        content: function () {
            player.removeSkill('mdqianxi72');
            delete player.storage.mdqianxi72;
        },
        mod: {
            cardEnabled2: function (card, player) {
                if (get.color(card) == player.storage.mdqianxi72 && get.position(card) == 'h') return false;
            },
        },
        intro: {
            content: function (color) {
                return '不能使用或打出' + get.translation(color) + '的手牌';
            }
        }
    },
    mdqianxi: {
        audio: "qianxi",
        trigger: { player: 'phaseZhunbeiBegin' },
        content: function () {
            "step 0"
            player.judge();
            "step 1"
            event.color = result.color;
            player.chooseTarget(function (card, player, target) {
                return player != target && get.distance(player, target) <= 1;
            }, true).set('ai', function (target) {
                return -get.attitude(_status.event.player, target);
            });
            "step 2"
            if (result.bool && result.targets.length) {
                result.targets[0].storage.mdqianxi72 = event.color;
                result.targets[0].addSkill('mdqianxi72');
                player.line(result.targets, 'green');
                game.addVideo('storage', result.targets[0], ['mdqianxi72', event.color]);
            }
        },
    },
    zylongdan: {
        group: ["zylongdan_sha", "zylongdan_shan", "zylongdan_draw", "zylongdan_shamiss", "zylongdan_shanafter"],
        subSkill: {
            shanafter: {
                sub: true,
                audio: "longdan_sha",
                trigger: {
                    player: "useCard",
                },
                //priority:1,
                filter: function (event, player) {
                    return event.skill == 'zylongdan_shan' && event.getParent(2).name == 'sha';
                },
                direct: true,
                content: function () {
                    "step 0"
                    player.chooseTarget("是否发动【龙胆】令一名其他角色回复1点体力？", function (card, player, target) {
                        return target != _status.event.source && target != player && target.isDamaged();
                    }).set('ai', function (target) {
                        return get.attitude(_status.event.player, target);
                    }).set('source', trigger.getParent(2).player);
                    "step 1"
                    if (result.bool && result.targets && result.targets.length) {
                        player.logSkill('zylongdan', result.targets[0]);
                        result.targets[0].recover();
                    }
                },
            },
            shamiss: {
                sub: true,
                audio: "longdan_sha",
                trigger: {
                    player: "shaMiss",
                },
                direct: true,
                filter: function (event, player) {
                    return event.skill == 'zylongdan_sha';
                },
                content: function () {
                    "step 0"
                    player.chooseTarget("是否发动【龙胆】对一名其他角色造成1点伤害？", function (card, player, target) {
                        return target != _status.event.target && target != player;
                    }).set('ai', function (target) {
                        return -get.attitude(_status.event.player, target);
                    }).set('target', trigger.target);
                    "step 1"
                    if (result.bool && result.targets && result.targets.length) {
                        player.logSkill('zylongdan', result.targets[0]);
                        result.targets[0].damage();
                    }
                },
            },
            draw: {
                trigger: {
                    player: ["useCard", "respond"],
                },
                audio: "longdan_sha",
                forced: true,
                locked: false,
                filter: function (event, player) {
                    if (!get.zhu(player, 'shouyue')) return false;
                    return event.skill == 'zylongdan_sha' || event.skill == 'zylongdan_shan';
                },
                content: function () {
                    player.draw();
                    //player.storage.fanghun2++;
                },
                sub: true,
            },
            sha: {
                audio: "longdan_sha",
                enable: ["chooseToUse", "chooseToRespond"],
                filterCard: {
                    name: "shan",
                },
                viewAs: {
                    name: "sha",
                },
                position: 'hs',
                viewAsFilter: function (player) {
                    if (!player.countCards('hs', 'shan')) return false;
                },
                prompt: "将一张闪当杀使用或打出",
                check: function () { return 1 },
                ai: {
                    effect: {
                        target: function (card, player, target, current) {
                            if (get.tag(card, 'respondSha') && current < 0) return 0.6
                        },
                    },
                    respondSha: true,
                    skillTagFilter: function (player) {
                        if (!player.countCards('hs', 'shan')) return false;
                    },
                    order: function () {
                        return get.order({ name: 'sha' }) + 0.1;
                    },
                },
                sub: true,
            },
            shan: {
                audio: "longdan_sha",
                enable: ['chooseToRespond', 'chooseToUse'],
                filterCard: {
                    name: "sha",
                },
                viewAs: {
                    name: "shan",
                },
                position: 'hs',
                prompt: "将一张杀当闪使用或打出",
                check: function () { return 1 },
                viewAsFilter: function (player) {
                    if (!player.countCards('hs', 'sha')) return false;
                },
                ai: {
                    respondShan: true,
                    skillTagFilter: function (player) {
                        if (!player.countCards('hs', 'sha')) return false;
                    },
                    effect: {
                        target: function (card, player, target, current) {
                            if (get.tag(card, 'respondShan') && current < 0) return 0.6
                        },
                    },
                },
                sub: true,
            },
        },
    },
    zglkongcheng: {
        audio: 2,
        group: ["zglkongcheng_gain", "zglkongcheng_got"],
        subSkill: {
            gain: {
                audio: "zglkongcheng",
                trigger: {
                    player: "gainBefore",
                },
                filter: function (event, player) {
                    return event.source && event.source != player && player != _status.currentPhase && !event.bySelf && player.countCards('h') == 0;
                },
                content: function () {
                    trigger.name = 'addToExpansion';
                    trigger.setContent('addToExpansion');
                    trigger.gaintag = ['zglkongcheng'];
                    trigger.untrigger();
                    trigger.trigger('addToExpansionBefore');
                },
                sub: true,
                forced: true,
            },
            got: {
                trigger: {
                    player: "phaseDrawBegin1",
                },
                filter: function (event, player) {
                    return player.getExpansions('zglkongcheng').length > 0;
                },
                content: function () {
                    player.gain(player.getExpansions('zglkongcheng'), 'draw');
                },
                sub: true,
                forced: true,
            },
        },
        audio: "zglkongcheng",
        trigger: {
            target: "useCardToTarget",
        },
        forced: true,
        check: function (event, player) {
            return get.effect(event.target, event.card, event.player, player) < 0;
        },
        filter: function (event, player) {
            return player.countCards('h') == 0 && (event.card.name == 'sha' || event.card.name == 'juedou');
        },
        content: function () {
            trigger.getParent().targets.remove(player);
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (target.countCards('h') == 0 && (card.name == 'sha' || card.name == 'juedou')) return 'zeroplayertarget';
                },
            },
        },
        intro: {
            markcount: 'expansion',
            mark: function (dialog, content, player) {
                var content = player.getExpansions('zglkongcheng');
                if (content && content.length) {
                    if (player == game.me || player.isUnderControl()) {
                        dialog.addAuto(content);
                    }
                    else {
                        return '共有' + get.cnNumber(content.length) + '张牌';
                    }
                }
            },
            content: function (content, player) {
                var content = player.getExpansions('zglkongcheng');
                if (content && content.length) {
                    if (player == game.me || player.isUnderControl()) {
                        return get.translation(content);
                    }
                    return '共有' + get.cnNumber(content.length) + '张牌';
                }
            },
        },
        onremove: function (player, skill) {
            var cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
        },
    },
    txjuxiang: {
        audio: "sbjuxiang",
        trigger: {
            player: 'phaseJieshuBegin',
        },
        forced: true,
        direct: true,
        filter: function (event, player) {
            return !player.hasHistory('useCard', evt => evt.card.name == 'nanman') && (!_status.txjuxiang_nanman || _status.txjuxiang_nanman.length);
        },
        group: ['txjuxiang_cancel', 'txjuxiang_gain'],
        content: function () {
            'step 0'
            if (!_status.txjuxiang_nanman) {
                _status.txjuxiang_nanman = [
                    { name: 'nanman', number: 7, suit: 'spade' },
                    { name: 'nanman', number: 9, suit: 'club' },
                ];
                game.broadcastAll(function () {
                    if (!lib.inpile.includes('nanman')) lib.inpile.add('nanman');
                });
            }
            player.chooseTarget(get.prompt('txjuxiang'), '将游戏外的随机一张【南蛮入侵】交给一名角色（剩余' + get.cnNumber(_status.txjuxiang_nanman.length) + '张）').set('ai', target => {
                var player = _status.event.player;
                return Math.max(0, target.getUseValue({ name: 'nanman' })) * get.attitude(player, target) * (target == player ? 0.5 : 1);
            });
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill('txjuxiang', target);
                if (!_status.txjuxiang_nanman.length) return;
                var info = _status.txjuxiang_nanman.randomRemove();
                var card = game.createCard2(info);
                target.gain(card, 'gain2').giver = player;
            }
        },
        ai: {
            expose: 0.05,
            effect: {
                target: function (card) {
                    if (card.name == 'nanman') return [0, 1];
                }
            }
        },
        subSkill: {
            cancel: {
                audio: 'sbjuxiang',
                trigger: { target: 'useCardToBefore' },
                forced: true,
                priority: 15,
                filter: function (event, player) {
                    return event.card.name == 'nanman';
                },
                content: function () {
                    trigger.cancel();
                }
            },
            gain: {
                audio: 'sbjuxiang',
                trigger: { global: 'useCardAfter' },
                forced: true,
                filter: function (event, player) {
                    return event.card.name == 'nanman' && event.player != player && event.cards.filterInD().length;
                },
                content: function () {
                    player.gain(trigger.cards.filterInD(), 'gain2');
                }
            }
        }
    },
    txdaoji: {
        audio: 'daoji',
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return player.hasCard(lib.skill.txdaoji.filterCard, 'he');
        },
        filterCard: function (card) {
            return get.type(card) != 'basic';
        },
        position: 'he',
        filterTarget: function (card, player, target) {
            return target != player && target.hasCard((card) => lib.filter.canBeGained(card, target, player), 'he');
        },
        check: function (card) {
            return 8 - get.value(card);
        },
        content: function () {
            'step 0'
            player.gainPlayerCard(target, 'he', true);
            'step 1'
            if (result.bool && result.cards && result.cards.length == 1) {
                var card = result.cards[0];
                if (player.getCards('h').includes(card)) {
                    var type = get.type(card);
                    if (type == 'basic') player.draw();
                    else if (type == 'equip') {
                        if (player.hasUseTarget(card)) player.chooseUseTarget(card, 'nopopup', true);
                        target.damage('nocard');
                    }
                }
            }
        },
        ai: {
            order: 6,
            result: {
                target: function (player, target) {
                    var eff = get.effect(target, { name: 'shunshou_copy2' }, player, target);
                    if (target.countCards('e') > 0) eff += get.damageEffect(target, player, target);
                    return eff;
                },
            },
        },
    },
    txhj_suoming: {
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && !current.isLinked();
            });
        },
        content: function () {
            "step 0"
            var num = game.countPlayer(function (current) {
                return current != player && !current.isLinked();
            });
            player.chooseTarget(get.prompt('txhj_suoming'), [1, num], function (card, player, target) {
                return !target.isLinked() && player != target;
            }).ai = function (target) {
                return -get.attitude(player, target);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txhj_suoming', result.targets);
                event.targets = result.targets;
                event.num = 0;
            }
            else {
                event.finish();
            }
            "step 2"
            if (event.num < event.targets.length) {
                event.targets[event.num].link();
                event.num++;
                event.redo();
            }
        },
    },
    txhj_huangmen: {
        trigger: {
            player: ["phaseZhunbeiBegin", "phaseJieshuBegin"],
        },
        forced: true,
        filter: function (event, player) {
            return player.countCards('h') === 0;
        },
        content: function () {
            var players = player.getEnemies();
            'step 0'
            player.chooseControl(['摸两张牌', '随机获得一名敌方角色的一张牌。']).set('prompt', '黄门：请选择一项').set('ai', function () {
                return Math.random() < 0.5 ? 0 : 1;
            });
            'step 1'
            if (result.index === 0) {
                player.draw(2);
            } else {
                var target = players.randomGet();
                var cards = target.getCards('he');
                if (cards.length > 0) {
                    player.gain(cards.randomGet(), 'gain2');
                }
            }
        }
    },
    txhj_mouqiang: {
        audio: 2,
        trigger: { player: 'damageEnd' },
        filter: function (event, player) {
            return event.num > 1 && event.source;
        },
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt('txhj_mouqiang'), function (card, player, target) {
                return true;
            }).set('ai', function (target) {
                return get.attitude(player, target);
            });
            'step 1'
            if (result.bool) {
                player.logSkill('txhj_mouqiang', result.targets);
                player.gainPlayerCard(result.targets[0], Math.floor(trigger.num / 2), 'he', true);
                result.targets[0].damage();
            }
            'step 2'
            if (result.bool) {
                result.cards.forEach(i => get.type(i) === 'basic' ? player.recover() : trigger.source.damage());
            }
        }
    },
    txhj_suzhi: {
        audio: 'gzsuzhi',
        derivation: 'fankui',
        mod: {
            targetInRange: function (card, player, target) {
                if (player == _status.currentPhase && player.countMark('txhj_suzhi_count') < 3 && get.type2(card) == 'trick') return true;
            },
        },
        trigger: { player: 'phaseJieshuBegin' },
        forced: true,
        filter: function (event, player) {
            return player.countMark('txhj_suzhi_count') < 3;
        },
        content: function () {
            player.addTempSkill('fankui', { player: 'phaseBegin' });
        },
        group: ['txhj_suzhi_damage', 'txhj_suzhi_draw', 'txhj_suzhi_gain'],
        preHidden: ['txhj_suzhi_damage', 'txhj_suzhi_draw', 'txhj_suzhi_gain'],
        subSkill: {
            damage: {
                audio: 'txhj_suzhi',
                trigger: { source: 'damageBegin1' },
                forced: true,
                filter: function (event, player) {
                    return player == _status.currentPhase && player.countMark('txhj_suzhi_count') < 3 && event.card &&
                        (event.card.name == 'sha' || event.card.name == 'juedou') && event.getParent().type == 'card';
                },
                content: function () {
                    trigger.num++;
                    player.addTempSkill('txhj_suzhi_count');
                    player.addMark('txhj_suzhi_count', 1, false);
                },
            },
            draw: {
                audio: 'txhj_suzhi',
                trigger: { player: 'useCard' },
                forced: true,
                filter: function (event, player) {
                    return player == _status.currentPhase && player.countMark('txhj_suzhi_count') < 3 && event.card.isCard && get.type2(event.card) == 'trick';
                },
                content: function () {
                    player.draw();
                    player.addTempSkill('txhj_suzhi_count');
                    player.addMark('txhj_suzhi_count', 1, false);
                },
            },
            gain: {
                audio: 'txhj_suzhi',
                trigger: { global: 'loseAfter' },
                forced: true,
                filter: function (event, player) {
                    if (player != _status.currentPhase || event.type != 'discard' || player == event.player || player.countMark('txhj_suzhi_count') >= 3) return false;
                    return event.player.countGainableCards(player, 'he') > 0;
                },
                logTarget: 'player',
                content: function () {
                    'step 0'
                    player.addTempSkill('txhj_suzhi_count');
                    player.addMark('txhj_suzhi_count', 1, false);
                    if (trigger.delay == false) game.delay();
                    'step 1'
                    player.gainPlayerCard(trigger.player, 'he', true);
                },
            },
            count: {
                onremove: true,
            },
        },
    },
    txmanjia: {
        group: ['txmanjia1', 'txmanjia2']
    },
    txmanjia1: {
        trigger: { target: ['useCardToBefore', 'shaBegin'] },
        forced: true,
        priority: 6,
        filter: function (event, player, name) {
            if (player.getEquip(2)) return false;
            if (name == 'shaBegin') return lib.skill.tengjia3.filter(event, player);
            return lib.skill.tengjia1.filter(event, player);
        },
        content: function () {
            trigger.cancel();
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (target.getEquip(2)) return;
                    return lib.skill.tengjia1.ai.effect.target.apply(this, arguments);
                }
            }
        }
    },
    txmanjia2: {
        trigger: { player: 'damageBegin3' },
        filter: function (event, player) {
            if (player.getEquip(2)) return false;
            if (event.nature == 'fire') return true;
        },
        forced: true,
        check: function () {
            return false;
        },
        content: function () {
            trigger.num++;
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (target.getEquip(2)) return;
                    return lib.skill.tengjia2.ai.effect.target.apply(this, arguments);
                }
            }
        }
    },
    //以下此技能是搬运自云将扩展的云花鬘蛮氏技能。
    txmanzhen: {
        audio: 2,
        trigger: {
            target: "useCardToBefore",
        },
        forced: true,
        priority: 15,
        filter: function (event, player) {
            return event.card.name == 'nanman';
        },
        content: function () {
            trigger.cancel();
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'nanman') return "zeroplayertarget";
                },
            },
        },
        group: ["txmanzhen_Use", "txmanzhen_damage"],
        subSkill: {
            Use: {
                audio: "txmanzhen",
                enable: "phaseUse",
                viewAs: {
                    name: "nanman",
                },
                usable: 1,
                filterCard: true,
                prompt: "将任意张手牌当做【南蛮入侵】并指定等量的角色使用",
                selectCard: function () {
                    if (ui.selected.targets.length) return [ui.selected.targets.length, Math.min(ui.selected.targets.length + 1, game.players.length - 1)];
                    return [1, game.countPlayer() - 1];
                },
                check: function (card) {
                    var player = _status.event.player;
                    if (game.countPlayer(function (current) {
                        return current != player && player.canUse('nanman', current) && get.effect(current, {
                            name: 'nanman'
                        }, player, player) > 0;
                    }) <= ui.selected.cards.length) return 0;
                    return 7 - get.value(card);
                },
                selectTarget: function () {
                    return ui.selected.cards.length;
                },
                ai: {
                    basic: {
                        order: 9,
                        useful: [5, 1],
                        value: 5,
                    },
                    result: {
                        "target_use": function (player, target) {
                            var nh = target.countCards('h');
                            if (nh == 0) return -2;
                            if (nh == 1) return -1.7
                            return -1.5;
                        },
                        target: function (player, target) {
                            var nh = target.countCards('h');
                            if (nh == 0) return -2;
                            if (nh == 1) return -1.7
                            return -1.5;
                        },
                    },
                    tag: {
                        respond: 1,
                        respondSha: 1,
                        damage: 1,
                        multitarget: 1,
                        multineg: 1,
                    },
                },
                sub: true,
            },
            damage: {
                audio: 'txmanzhen',
                trigger: {
                    source: "damageBegin1",
                },
                check: function (event, player) {
                    if (get.attitude(player, event.player) < 0 && player.storage.yunzhanyuan == false && player.hp > 1) return true;
                    if (get.attitude(player, event.player) < 0 && player.storage.yunzhanyuan == true && player.hp > 2) return true;
                    return false;
                },
                filter: function (event, player) {
                    return event.player.hp >= player.hp && event.card && event.card.name == 'nanman';
                },
                preHidden: true,
                prompt: function (event, player) {
                    var str = '';
                    str += '是否失去一点体力令' + get.translation(event.player) + '受到的伤害加一？'
                    return str;
                },
                content: function () {
                    player.loseHp();
                    trigger.num++;
                },
                sub: true,
            },
        },
    },
    //到这。
    txfusha: {
        audio: 1,
        trigger: { source: 'damageBegin1' },
        filter: function (event) {
            return event.card && event.card.name == 'sha' && event.notLink();
        },
        forced: true,
        content: function () {
            trigger.num++;
        }
    },
    txleizhou: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        content: function () {
            var list = game.players.slice(0);
            list.remove(player);
            if (list.length) {
                var target = list.randomGet();
                player.line(target);
                target.damage('thunder');
            }
        }
    },
    //小震怒
    txzhennu: {
        trigger: { player: 'phaseZhunbeiBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txzhennu'), function (card, player, target) {
                return player != target;
            }).ai = function (target) {
                return get.damageEffect(target, player, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txzhennu', result.targets);
                result.targets[0].damage();
            }
        },
    },
    txyongguan: {
        audio: 2,
        forced: true,
        trigger: { player: 'damageBegin4' },
        marktext: '勇',
        intro: {
            name2: '勇',
            content: '共有#个“勇”',
        },
        content: function () {
            trigger.cancel();
            player.addMark('txyongguan', trigger.num);
        },
        group: 'txyongguan_fate',
    },
    txyongguan_fate: {
        audio: 'txyongguan',
        trigger: { player: 'phaseEnd' },
        forced: true,
        filter: function (event, player) {
            return player.countMark('txyongguan') > 0;
        },
        content: function () {
            'step 0'
            event.forceDie = true;
            _status.txyongguan = player.countMark('txyongguan');
            /*	player.judge(function(card){
                    if(get.number(card)<_status.txyongguan) return -_status.txyongguan;
                    return 1;
                }).judge2=function(result){
                    return result.bool?true:false;
                };*/
            'step 1'
            delete _status.txyongguan;
            if (!result.bool) {
                player.chooseToDiscard([1, player.countMark('txyongguan')], 'h').ai = lib.skill.qiangxi.check;
            }
            else event.finish();
            'step 2'
            var num = player.countMark('txyongguan');
            if (result.cards && result.cards.length) num -= result.cards.length;
            if (num) player.loseHp(num);
            player.removeMark('txyongguan', 99999);
        },
    },
    txchengyuan: {
        audio: "hanyong",
        group: ['txchengyuan_color', 'txchengyuan_color2'],
        subSkill: {
            color: {
                trigger: { player: 'phaseZhunbeiBegin' },
                silent: true,
                content: function () {
                    player.storage.txchengyuan_color = ['black', 'red'];
                }
            },
            color2: {
                trigger: { player: 'useCard' },
                silent: true,
                filter: function (event, player) {
                    return Array.isArray(player.storage.txchengyuan_color) && _status.currentPhase == player;
                },
                content: function () {
                    player.storage.txchengyuan_color.remove(get.color(trigger.card));
                }
            }
        },
        trigger: { player: 'phaseDiscardBegin' },
        direct: true,
        filter: function (event, player) {
            if (!player.storage.txchengyuan_color) return false;
            var length = player.storage.txchengyuan_color.length;
            if (length == 0) return false;
            var hs = player.getCards('h');
            if (hs.length == 0) return false;
            if (length == 2) return true;
            var color = player.storage.txchengyuan_color[0];
            for (var i = 0; i < hs.length; i++) {
                if (get.color(hs[i]) == color) return true;
            }
            return false;
        },
        intro: {
            content: 'cards'
        },
        init: function (player) {
            player.storage.txchengyuan = [];
        },
        content: function () {
            'step 0'
            player.chooseCard(get.prompt('txchengyuan'), function (card) {
                return _status.event.player.storage.txchengyuan_color.includes(get.color(card));
            }).set('ai', function (card) {
                var player = _status.event.player;
                if (player.storage.txchengyuan.length == 2) {
                    if (!game.hasPlayer(function (current) {
                        return (current != player &&
                            get.damageEffect(current, player, player) > 0 &&
                            get.attitude(player, current) < 0)
                    })) return 0;
                }
                return 7 - get.value(card);
            });
            'step 1'
            if (result.bool) {
                player.logSkill('txchengyuan');
                if (player.storage.txchengyuan.length < 2) {
                    player.$give(result.cards, player);
                }
                player.lose(result.cards, ui.special);
                player.storage.txchengyuan = player.storage.txchengyuan.concat(result.cards);
                player.markSkill('txchengyuan');
                player.syncStorage('txchengyuan');
            }
            else {
                event.finish();
            }
            'step 2'
            if (player.storage.txchengyuan.length == 3) {
                player.$throw(player.storage.txchengyuan);
                while (player.storage.txchengyuan.length) {
                    player.storage.txchengyuan.shift().discard();
                }
                player.unmarkSkill('txchengyuan');
                player.chooseTarget(function (card, player, target) {
                    return target != player;
                }, '对一名其他角色造成两点伤害并弃置其装备区内的牌').set('ai', function (target) {
                    var player = _status.event.player;
                    if (get.attitude(player, target) > 0) return -1;
                    return get.damageEffect(target, player, player) + target.countCards('e') / 2;
                });
            }
            else {
                event.finish();
            }
            'step 3'
            if (result.bool) {
                var target = result.targets[0];
                target.damage(2);
                event.target = target;
                player.line(target, 'green');
            }
            else {
                event.finish();
            }
            'step 4'
            if (event.target && event.target.isIn()) {
                var es = event.target.getCards('e');
                if (es.length) {
                    event.target.discard(es);
                }
            }
        },
        ai: {
            threaten: 1.5
        }
    },
    txbenji: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forceDie: true,
        forced: true,
        content: function () {
            'step 0'
            player.chooseTarget('【奔激】：请选择一名角色，令其受到X点伤害（X为你损失的体力值）。', function (card, player, target) {
                return game.hasPlayer(function (current) {
                    return current != player;
                })
            }).set('forceDie', true).ai = function (target) {
                return -get.attitude(_status.event.player, target);
            };
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                player.line(target);
                target.damage(player.getDamagedHp());
                if (target.isIn() && !target.hasHistory('damage', function (evt) {
                    return evt.getParent('txbenji') == event && evt._dyinged;
                })) player.loseHp();
            }
        },
    },
    txyonglve: {
        audio: 2,
        enable: "chooseCard",
        check: function (event, player) {
            var player = _status.event.player;
            return (!player.hasCard(function (card) {
                var val = get.value(card);
                return val < 0 || (val <= 4 && (get.number(card) >= 11 || get.suit(card) == 'heart'));
            }, 'h')) ? 20 : 0;
        },
        filter: function (event) {
            return event.type == 'compare' && !event.directresult;
        },
        onCompare: function (player) {
            return game.cardsGotoOrdering(get.cards()).cards;
        },
    },
    txjiang: {
        shaRelated: true,
        audio: "sbjiang",
        //preHidden:true,	
        usable: 1,
        trigger: {
            player: 'useCardToPlayered',
            target: 'useCardToTargeted',
        },
        filter: function (event, player) {
            if (!(event.card.name == 'juedou' || (event.card.name == 'sha'))) return false;
            return player == event.target || event.getParent().triggeredTargets3.length == 1;
        },
        frequent: true,
        content: function () {
            player.draw(2);
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'sha') return [1, 0.6];
                },
                player: function (card, player, target) {
                    if (card.name == 'sha') return [1, 1];
                }
            }
        }
    },
    //风行	
    txfengxing: {
        audio: true,
        trigger: { player: 'phaseBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txfengxing'), function (card, player, target) {
                if (target.isFriendOf(player)) return false;
                return lib.filter.targetEnabled({ name: 'sha' }, player, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'sha' }, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txfengxing');
                player.useCard({ name: 'sha' }, result.targets, false);
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    //迷城事件
    jlbjijiang: {
        audio: 'jijiang1',
        unique: true,
        group: ['jlbjijiang1'],
        //zhuSkill:true,
        filter: function (event, player) {
            if (!player.hasSkill('jlbjijiang') || !game.hasPlayer(function (current) {
                return current != player && current.group == 'shu';
            })) return false;
            return !event.jlbjijiang && (event.type != 'phase' || !player.hasSkill('jlbjijiang3'));
        },
        enable: ['chooseToUse', 'chooseToRespond'],
        viewAs: { name: 'sha' },
        filterCard: function () { return false },
        selectCard: -1,
        ai: {
            order: function () {
                return get.order({ name: 'sha' }) + 0.3;
            },
            respondSha: true,
            skillTagFilter: function (player) {
                if (!player.hasSkill('jlbjijiang') || !game.hasPlayer(function (current) {
                    return current != player && current.group == 'shu';
                })) return false;
            },
        },
    },
    jlbjijiang1: {
        audio: "jijiang1",
        trigger: { player: ['useCardBegin', 'respondBegin'] },
        logTarget: 'targets',
        filter: function (event, player) {
            return event.skill == 'jlbjijiang';
        },
        forced: true,
        content: function () {
            "step 0"
            delete trigger.skill;
            trigger.getParent().set('jlbjijiang', true);
            "step 1"
            if (event.current == undefined) event.current = player.next;
            if (event.current == player) {
                player.addTempSkill('jlbjijiang3');
                event.finish();
                trigger.cancel();
                trigger.getParent().goto(0);
            }
            else if (event.current.group == 'shu') {
                var next = event.current.chooseToRespond('是否替' + get.translation(player) + '打出一张杀？', { name: 'sha' });
                next.set('ai', function () {
                    var event = _status.event;
                    return (get.attitude(event.player, event.source) - 2);
                });
                next.set('source', player);
                next.set('jlbjijiang', true);
                next.set('skillwarn', '替' + get.translation(player) + '打出一张杀');
                next.noOrdering = true;
                next.autochoose = lib.filter.autoRespondSha;
            }
            else {
                event.current = event.current.next;
                event.redo();
            }
            "step 2"
            if (result.bool) {
                event.finish();
                trigger.card = result.card;
                trigger.cards = result.cards;
                trigger.throw = false;
                if (typeof event.current.ai.shown == 'number' && event.current.ai.shown < 0.95) {
                    event.current.ai.shown += 0.3;
                    if (event.current.ai.shown > 0.95) event.current.ai.shown = 0.95;
                }
            }
            else {
                event.current = event.current.next;
                event.goto(1);
            }
        }
    },
    jlbjijiang3: {
        trigger: { global: ['useCardAfter', 'useSkillAfter', 'phaseAfter'] },
        silent: true,
        charlotte: true,
        filter: function (event) {
            return event.skill != 'jlbjijiang' && event.skill != 'qinwang';
        },
        content: function () {
            player.removeSkill('jlbjijiang3');
        }
    },
    jzjhuangtian: {
        unique: true,
        audio: 'huangtian2',
        global: 'jzjhuangtian2',
        //zhuSkill:true,
    },
    jzjhuangtian2: {
        audio: 2,
        enable: 'phaseUse',
        discard: false,
        lose: false,
        delay: false,
        line: true,
        prepare: function (cards, player, targets) {
            targets[0].logSkill('jzjhuangtian');
        },
        prompt: function () {
            var player = _status.event.player;
            var list = game.filterPlayer(function (target) {
                return target != player && target.hasSkill('jzjhuangtian', player);
            });
            var str = '将一张【闪】或【闪电】交给' + get.translation(list);
            if (list.length > 1) str += '中的一人';
            return str;
        },
        filter: function (event, player) {
            if (player.group != 'qun') return false;
            if (player.countCards('h', 'shan') + player.countCards('h', 'shandian') == 0) return 0;
            return game.hasPlayer(function (target) {
                return target != player && target.hasSkill('jzjhuangtian', player) && !target.hasSkill('jzjhuangtian3');
            });
        },
        filterCard: function (card) {
            return (card.name == 'shan' || card.name == 'shandian')
        },
        log: false,
        visible: true,
        filterTarget: function (card, player, target) {
            return target != player && target.hasSkill('jzjhuangtian', player) && !target.hasSkill('jzjhuangtian3');
        },
        //usable:1,
        //forceaudio:true,
        content: function () {
            player.give(cards, target);
            target.addTempSkill('jzjhuangtian3', 'phaseUseEnd');
        },
        ai: {
            expose: 0.3,
            order: 10,
            result: {
                target: 5
            }
        }
    },
    jzjhuangtian3: {},
    /*十常侍之乱*/
    txningming: {
        trigger: { player: 'damageEnd' },
        check: function (event, player) {
            return get.attitude(player, event.source) <= 0;
        },
        filter: function (event, player) {
            return event.source && event.source != player;
        },
        content: function () {
            "step 0"
            trigger.source.chooseCard('交出一张黑桃牌或流失一点体力', function (card) {
                return get.suit(card) == 'spade';
            }).ai = function (card) {
                return 6 - get.value(card);
            };
            "step 1"
            if (result.bool) {
                player.gain(result.cards[0], trigger.source);
                trigger.source.$give(1, player);
            }
            else {
                trigger.source.loseHp();
            }
        },
        ai: {
            maixie_defend: true,
            effect: {
                target: function (card, player, target) {
                    if (get.tag(card, 'damage')) return [1, 0, 0, -1];
                }
            }
        }
    },
    //装备技能转普通技能
    /*飞龙夺凤技能*/
    txfeilong: {
        subSkill: {
            blank: {
                init: function (player, skill) {
                    player.addSkillBlocker(skill);
                },
                onremove: function (player, skill) {
                    player.removeSkillBlocker(skill);
                },
                charlotte: true,
                skillBlocker: function (skill, player) {
                    return !lib.skill[skill].charlotte;
                },
                sub: true,
            },
        },
        trigger: {
            source: ["dieAfter"],
        },
        priority: -25,
        equipSkill: true,
        content: function () {
            'step 0'
            var target = trigger.player;
            target.addTempSkill('txfeilong_blank', { player: 'damageAfter' });
            target.side = player.side;
            target.identity = player.identity;
            target.setIdentity(get.translation(player.identity));
            target.node.identity.dataset.color = player.identity;
            target.revive(3);
            target.maxHp = 3;
            target.update();
        },
    },
    txshenfu: {
        trigger: { player: 'damageEnd' },
        forced: true,
        equipSkill: true,
        filter: function (event, player) {
            if (!event.card || !event.card.name || player.getStorage('txshenfu_effect').includes(event.card.name)) return false;
            if (player.hasSkillTag('unequip2')) return false;
            if (event.source.hasSkillTag('unequip', false, {
                name: event.card.name,
                target: player,
                card: event.card,
            })) return false;
            return true;
        },
        content: function () {
            player.markAuto('txshenfu_effect', [trigger.card.name]);
        },
        group: 'txshenfu_effect',
        subSkill: {
            effect: {
                trigger: { player: 'damageBegin4' },
                forced: true,
                equipSkill: true,
                filter: function (event, player) {
                    if (!event.card || !event.card.name || !player.storage.txshenfu_effect || !player.getStorage('txshenfu_effect').includes(event.card.name)) return false;
                    if (player.hasSkillTag('unequip2')) return false;
                    if (event.source.hasSkillTag('unequip', false, {
                        name: event.card.name,
                        target: player,
                        card: event.card,
                    })) return false;
                    return true;
                },
                content: function () {
                    trigger.num--;
                },
                onremove: true,
                intro: {
                    content: '受到$造成的伤害-1',
                },
            },
        },
    },
    /*赤焰镇魂琴技能*/
    txchiyan: {
        //equipSkill:true,
        trigger: {
            source: "damageBegin1",
        },
        priority: 5,
        forced: true,
        content: function () {
            trigger.nature = 'fire';
        },
    },
    /*国风玉袍*/
    txguofeng: {
        //equipSkill:true,
        mod: {
            targetEnabled: function (card, player, target, now) {
                if (target.hasSkillTag('unequip2')) return false;
                if (player != target) {
                    if (player.hasSkillTag('unequip', false, {
                        name: card ? card.name : null,
                        target: player,
                        card: card
                    })) { }
                    else if (get.type(card) == 'trick') return false;
                }
            },
        },
    },
    /*绝尘金戈技能*/
    txjuechen: {
        //equipSkill:true,
        global: "txjuechen2",
    },
    "txjuechen2": {
        equipSkill: true,
        mod: {
            globalTo: function (from, to, distance) {
                return distance + game.countPlayer(function (current) {
                    if (current == to) return;
                    if (current.side != to.side) return;
                    if (current.hasSkill('txjuechen')) return 1;
                });
            },
        },
    },
    /*霹雳车技能*/
    txpili: {
        //equipSkill:true,
        trigger: {
            source: "damageEnd",
        },
        filter: function (event, player) {
            return event.player != player && event.player.maxHp > 0 && event.player.isAlive();
        },
        "prompt2": function (event, player) {
            return '令其减少等同伤害值的体力上限。';
        },
        content: function () {
            trigger.player.loseMaxHp(trigger.num);
        },
    },
    "txpili2": {},
    /*雷击木*/
    "txbingren": {
        //equipSkill:true,
        trigger: {
            player: "useCard1",
        },
        filter: function (event, player) {
            if (event.card.name == 'sha' && !event.card.nature) return true;
        },

        check: function (event, player) {
            var eff = 0;
            for (var i = 0; i < event.targets.length; i++) {
                var target = event.targets[i];
                var eff1 = get.damageEffect(target, player, player);
                var eff2 = get.damageEffect(target, player, player, 'ice');
                eff += eff2;
                eff -= eff1;
            }
            return eff >= 0;
        },
        "prompt2": function (event, player) {
            return '将' + get.translation(event.card) + '改为冰属性';
        },
        content: function () {
            trigger.card.nature = 'ice';
            if (get.itemtype(trigger.card) == 'card') {
                var next = game.createEvent('txbingren_clear');
                next.card = trigger.card;
                event.next.remove(next);
                trigger.after.push(next);
                next.setContent(function () {
                    delete card.nature;
                });
            }
        },
    },
    /*虚妄之冕技能*/
    txxuwang: {
        //equipSkill:true,
        trigger: {
            player: "phaseDrawBegin",
        },
        forced: true,
        content: function () {
            trigger.num += 2;
        },
        mod: {
            maxHandcard: function (player, num) {
                return num - 1;
            },
        },
    },
    /*诸葛连弩*/
    txlianji: {
        equipSkill: true,
        firstDo: true,
        trigger: {
            player: "useCard1",
        },
        forced: true,
        filter: function (event, player) {
            return !event.audioed && event.card.name == 'sha' && player.countUsed('sha', true) > 1 && event.getParent().type == 'phase';
        },
        content: function () {
            trigger.audioed = true;
        },
        mod: {
            cardUsable: function (card, player, num) {
                var cardx = player.getEquip('txlianji');
                if (card.name == 'sha' && (!cardx || player.hasSkill('txlianji', null, false) || (!_status.rw_zhuge_temp && !ui.selected.cards.includes(cardx)))) {
                    return 4;
                }
            },
            "cardEnabled2": function (card, player) {
                if (!_status.event.addCount_extra || player.hasSkill('txlianji', null, false)) return;
                if (card && card == player.getEquip('txlianji')) {
                    try {
                        var cardz = get.card();
                    }
                    catch (e) {
                        return;
                    }
                    if (!cardz || cardz.name != 'sha') return;
                    _status.rw_zhuge_temp = true;
                    var bool = lib.filter.cardUsable(get.autoViewAs({ name: 'sha' }, ui.selected.cards.concat([card])), player);
                    delete _status.txlianji_temp;
                    if (!bool) return false;
                }
            },
        },
    },
    /*麒麟弓*/
    txlinwei: {
        equipSkill: true,
        trigger: {
            source: "damageBegin2",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && event.notLink() && event.player.getCards('e', { subtype: ['equip5'] }).length > 0
        },
        direct: true,
        content: function () {
            "step 0"
            var att = (get.attitude(player, trigger.player) <= 0);
            var next = player.chooseButton();
            next.set('att', att);
            next.set('createDialog', ['是否发动【麒麟弓】，弃置' + get.translation(trigger.player) + '的一张宝物牌？', trigger.player.getCards('e', { subtype: ['equip5'] })]);
            next.set('ai', function (button) {
                if (_status.event.att) return get.buttonValue(button);
                return 0;
            });
            "step 1"
            if (result.bool) {
                player.logSkill('txlinwei', trigger.player);
                trigger.player.discard(result.links[0]);
            }
        },
    },
    /*方天画戟技能*/
    txtianji: {
        trigger: {
            player: "useCard2",
        },
        direct: true,
        charlotte: true,
        forced: true,
        filter: function (event, player) {
            if (event.card.name != 'sha') return false;
            var evt = event.getParent('phaseUse');
            return evt && evt.player == player && player.getHistory('useCard', function (evtx) {
                return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
            })[0] == event && game.hasPlayer(function (current) {
                return !event.targets.includes(current) && lib.filter.filterTarget(event.card, player, current);
            });
        },
        content: function () {
            'step 0'
            var num = 2;
            if (Math.min(game.countPlayer()) >= 3) {
                player.chooseTarget('请选择至多' + num + '名其他角色也成为此【杀】的目标？', [1, num], true, function (card, player, target) {
                    return target != player && !trigger.targets.includes(target) && player.canUse({ name: 'sha' }, target);
                }).ai = function (target) {
                    return get.effect(target, { name: 'sha' }, _status.event.player);
                };
            }
            'step 1'
            if (result.bool && result.targets && result.targets.length) {
                var targets = result.targets;
                player.line(targets, trigger.card.nature);
                trigger.targets.addArray(targets);
            }
        },
    },
    txfuchen: {
        trigger: { player: 'useCardToPlayered' },
        forced: true,
        equipSkill: true,
        filter: function (event, player) {
            return event.card && event.card.name == 'sha';
        },
        logTarget: 'target',
        content: function () {
            'step 0'
            var suit = get.suit(trigger.card);
            var num = trigger.target.countCards('h', 'shan');
            var next = trigger.target.chooseToDiscard('弃置一张牌，或不能响应' + get.translation(trigger.card), 'he').set('ai', function (card) {
                var num = _status.event.num;
                if (num == 0) return 0;
                if (card.name == 'shan') return num > 1 ? 2 : 0;
                return (get.suit(card) != _status.event.suit ? 9 : 6) - get.value(card);
            }).set('num', num);
            if (lib.suit.includes(suit)) {
                next.set('prompt2', '若弃置的是' + get.suit(suit) + '牌，则改为' + get.translation(player) + '获得之');
                next.set('suit', suit);
            }
            'step 1'
            if (result.bool) {
                var card = result.cards[0];
                if (get.suit(card, trigger.target) == get.suit(trigger.card, false) && get.position(card) == 'd') player.gain(card, 'gain2');
            }
            else trigger.directHit.add(trigger.target);
        },
    },
    //以下代码搬运自【活动Boss】扩展
    hezong_zhangyi_qiaoshe: {
        trigger: {
            global: 'judge',
        },
        direct: true,
        content: function () {
            'step 0'
            var card = trigger.player.judging[0];
            var judge0 = trigger.judge(card);
            var judge1 = 0;
            var choice = trigger.no6 && card.number == 6 ? '+1' : 'cancel2';
            var attitude = get.attitude(player, trigger.player);
            var list = [];
            for (var i = -3; i < 4; i++) {
                if (i == 0) continue;
                list.push((i > 0 ? '+' : '') + i);
                if (!trigger.no6) {
                    var judge2 = (trigger.judge({ name: get.name(card), suit: get.suit(card), number: get.number(card) + i, nature: get.nature(card) }) - judge0) * attitude;
                    if (judge2 > judge1) {
                        choice = (i > 0 ? '+' : '') + i;
                        judge1 = judge2;
                    }
                }
            }
            list.push('cancel2');
            player.chooseControl(list).set('ai', function () { return _status.event.choice }).set('choice', choice).prompt = get.prompt2(event.name);
            'step 1'
            if (result.control != 'cancel2') {
                player.logSkill('hezong_zhangyi_qiaoshe');
                game.log(trigger.player, '判定结果点数', '#g' + result.control);
                player.popup(result.control, 'fire');
                if (!trigger.fixedResult) trigger.fixedResult = {};
                if (!trigger.fixedResult.number) trigger.fixedResult.number = get.number(trigger.player.judging[0]);
                trigger.fixedResult.number += Math.max(1 - trigger.fixedResult.number, Math.min(result.control, 13 - trigger.fixedResult.number));
            }
        },
    },
    "Tianshu_suoxue": {
        shaRelated: true,
        trigger: {
            player: "useCardToPlayered",
        },
        check: function (event, player) {
            if (player.countCards('h') < event.target.countCards('h')) return true;
            return (event.target.hasShan() && get.attitude(player, event.target) <= 0) || (((player.hasSkill("qugui2_bingyi") && (player.getStat().skill.qugui2_bingyi || 0) == 0) || (player.hasSkill("qugui2_bingyia") && (player.getStat().skill.qugui2_bingyia || 0) == 0) || (player.hasSkill("Tianshu_bingyi") && player.countCards('h') == 1)) && player.countCards('h') == 1) || (get.attitude(player, event.target) < 0 && get.effect(event.target, { name: 'sha' }, player) > 0);
        },
        filter: function (event, player) {
            return event.targets.length == 1 && event.card.name == 'sha' && (event.target.countCards('h') > player.countCards('h') || (event.target.countCards('h') < player.countCards('h') && player.hasCard(function (card) { return lib.filter.cardDiscardable(card, player, "Tianshu_suoxue") }, "h")));
        },
        logTarget: 'target',
        audio: "qugui2_suoxue",
        content: function () {
            if (trigger.target.countCards('h') > player.countCards('h')) player.drawTo(trigger.target.countCards('h'));
            else {
                player.chooseToDiscard(true, '【索穴】：弃置一张手牌令此【杀】不能被响应', 'h');
                var id = trigger.target.playerid;
                var map = trigger.getParent().customArgs;
                if (!map[id]) map[id] = {};
                if (typeof map[id].extraDamage != 'number') {
                    map[id].extraDamage = 0;
                }
                map[id].extraDamage++;
                trigger.getParent().directHit.add(trigger.target);
            }
        },
    },
    shanhe_juepan: {
        enable: 'phaseUse',
        usable: 1,
        position: 'he',
        selectCard: [1, 3],
        filter: function (event, player) {
            return player.countCards('he') > 0;
        },
        filterTarget: true,
        filterCard: (card, player) => player.canRecast(card),
        check: function (card) {
            return 6 - get.value(card);
        },
        discard: false,
        lose: false,
        delay: false,
        content: function () {
            'step 0'
            event.recast = player.recast(cards);
            'step 1'
            if (player.hasHistory('gain', evt => evt.getParent(2) == event.recast && evt.cards.some(value => get.name(value) == 'sha'))) {
                var num = 0;
                player.hasHistory('gain', evt => {
                    if (evt.getParent(2) == event.recast && evt.cards.some(value => get.name(value) == 'sha')) num += evt.cards.filter(function (card) { return get.name(card) == 'sha' }).length
                });
                event.num = num;
                target.damage(event.num);
            }
        },
        ai: {
            order: function (name, player) {
                return get.order({ name: 'sha' }) - 1;
            },
            result: {
                target: function (player, target) {
                    return get.damageEffect(target, player, target, [0, 1, 2, 3].randomGet());
                },
                player: 1
            },
            expose: 0.2,
            threaten: 1.2
        },
    },
    "Neihuan_huanshi": {
        group: ["Neihuan_huanshi_1", "Neihuan_huanshi_2", "Neihuan_huanshi_3", "Neihuan_huanshi_4"],
        audio: "ext:太虚幻境/audio/skill:true",
        forced: true,
        locked: true,
        subSkill: {
            "1": {
                trigger: {
                    player: "useCardToPlayered",
                },
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha' && player.getEnemies().includes(event.target) && !player.hasSkill("Neihuan_huanshi_silent1") && game.hasPlayer(function (current) {
                        return (current != player && current.countCards('h', { type: "basic" }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi'))
                    })
                },
                forced: true,
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return current != player && player.getFriends().includes(current) && current.countCards('h', { type: "basic" }) > 0 && current.hasSkill('Neihuan_huanshi');
                    }).randomGet();
                    list.discard(list.getCards('h', { type: "basic" }).randomGet());
                    player.logSkill('Neihuan_huanshi');
                    trigger.player.addTempSkill("Neihuan_huanshi_silent1");
                    trigger.nowuxie = true;
                    trigger.directHit.addArray(game.players);
                    game.log(trigger.card, '无法被', game.players, '抵消');
                },
                sub: true,
                popup: false,
            },
            "2": {
                trigger: {
                    target: "useCardToTarget",
                },
                filter: function (event, player) {
                    return event.card && get.type(event.card) == 'basic' && player.getEnemies().includes(event.player) && event.targets.length == 1 && !player.hasSkill("Neihuan_huanshi_silent2") && game.hasPlayer(function (current) {
                        return (current != player && current.countCards('h', { type: "basic" }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi'))
                    })
                },
                forced: true,
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return current != player && current.countCards('h', { type: "basic" }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi');
                    }).randomGet();
                    list.discard(list.getCards('h', { type: "basic" }).randomGet());
                    player.logSkill('Neihuan_huanshi');
                    trigger.target.addTempSkill("Neihuan_huanshi_silent2");
                    trigger.getParent().targets.remove(trigger.target);
                    game.log(trigger.card, '对', trigger.target, '无效');
                },
                sub: true,
                popup: false,
            },
            "3": {
                trigger: {
                    player: "useCardToPlayered",
                },
                filter: function (event, player) {
                    return ['trick'].includes(get.type(event.card)) && get.tag(event.card, 'damage') && player.getEnemies().includes(event.target) && !player.hasSkill("Neihuan_huanshi_silent1") && game.hasPlayer(function (current) {
                        return (current != player && current.countCards('h', { type: ['trick', 'delay'] }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi'))
                    })
                },
                forced: true,
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return current != player && current.countCards('h', { type: ['trick', 'delay'] }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi');
                    }).randomGet();
                    list.discard(list.getCards('h', { type: ['trick', 'delay'] }).randomGet());
                    player.logSkill('Neihuan_huanshi');
                    trigger.player.addTempSkill("Neihuan_huanshi_silent1");
                    trigger.nowuxie = true;
                    trigger.directHit.addArray(game.players);
                    game.log(trigger.card, '无法被', game.players, '抵消');
                },
                sub: true,
                popup: false,
            },
            "4": {
                trigger: {
                    target: "useCardToTarget",
                },
                filter: function (event, player) {
                    return (get.type(event.card) == 'trick' || get.type(event.card) == 'delay') && player.getEnemies().includes(event.player) && event.targets.length == 1 && !player.hasSkill("Neihuan_huanshi_silent2") && game.hasPlayer(function (current) {
                        return (current != player && current.countCards('h', { type: ['trick', 'delay'] }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi'))
                    })
                },
                forced: true,
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return current != player && current.countCards('h', { type: ['trick', 'delay'] }) > 0 && player.getFriends().includes(current) && current.hasSkill('Neihuan_huanshi');
                    }).randomGet();
                    list.discard(list.getCards('h', { type: ['trick', 'delay'] }).randomGet());
                    player.logSkill('Neihuan_huanshi');
                    trigger.target.addTempSkill("Neihuan_huanshi_silent2");
                    trigger.getParent().targets.remove(trigger.target);
                    game.log(trigger.card, '对', trigger.target, '无效');
                },
                sub: true,
                popup: false,
            },
            "silent1": {
                charlotte: true,
                sub: true,
            },
            "silent2": {
                charlotte: true,
                sub: true,
            },
        },
        forced: true,
        popup: false,
    },
    "Neihuan_jingshe": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "damageEnd",
        },
        filter: function (event, player) {
            return player.getEnemies().includes(_status.currentPhase) || event.num > 1;
        },
        forced: true,
        content: function () {
            if (player.getEnemies().includes(_status.currentPhase)) _status.currentPhase.addTempSkill('Neihuan_jingshe_buff', { player: ['phaseUseAfter', 'phaseAfter'] });
            if (trigger.num > 1) player.recover();
        },
        subSkill: {
            buff: {
                mark: true,
                marktext: "惊蛇",
                intro: {
                    name: "惊蛇",
                    content: "不能对拥有技能【惊蛇】的角色使用牌直到出牌阶段结束",
                },
                mod: {
                    playerEnabled: function (card, player, target) {
                        if (target.hasSkill("Neihuan_jingshe")) return false;
                    },
                    playerEnabled: function (card, player, target) {
                        if (target.hasSkill("Neihuan_jingshe")) return false;
                    },
                },
            },
        },
        ai: {
            "maixie_defend": true,
        },
    },
    "fenghuo_suohui": {
        trigger: {
            target: "useCardToTargeted",
        },
        forced: true,
        filter: function (event, player) {
            return event.player != player;
        },
        logTarget: "player",
        content: function () {
            "step 0"
            trigger.player.chooseCard('he', '交给' + get.translation(trigger.target) + '一张牌，否则令' + get.translation(trigger.target) + '摸两张牌').set('ai', function (card) {
                if (get.attitude(trigger.player, trigger.target) < 0) {
                    return 10 - get.value(card);
                }
                return 0;
            });
            "step 1"
            if (result.bool) {
                trigger.target.gain(result.cards, trigger.player, 'giveAuto');
            }
            else trigger.target.draw(2);
        },
        ai: {
            threaten: 1.1,
        },
    },
    txhuolu: {
        trigger: {
            player: "phaseUseBegin",
        },
        forced: true,
        filter: function (event, player) {
            return player.isMaxHandcard(true);
        },
        content: function () {
            'step 0'
            var num = player.countCards('h');
            var list = game.filterPlayer(function (current) {
                return !game.hasPlayer(function (current2) {
                    return current2.countCards('h') < current.countCards('h');
                })
            })
            if (list.length) {
                var target = list.randomGet();
                var num1 = target.countCards('h');
                player.chooseToDiscard((num - num1), true, 'h').set('ai', function (card) {
                    return 9 - get.value(card);
                });
            }
            'step 1'
            event.count = 2;
            'step 2'
            event.count--;
            'step 3'
            if (player.getEnemies().length > 0) {
                var list = game.filterPlayer(function (current) {
                    return player.getEnemies().includes(current);
                }).randomGet();
                list.damage();
            }
            "step 5"
            if (event.count > 0) event.goto(2);
            else event.finish();
        },
        ai: { expose: 0.2 },
    },
    Neihuan_niluan: {
        enable: 'phaseUse',
        viewAs: { name: 'sha' },
        check: function (card) {
            return 5.1 - get.value(card);
        },
        filterCard: { color: 'black' },
        position: 'hes',
        viewAsFilter: function (player) {
            return player.countCards('hes', lib.skill.Neihuan_niluan.filterCard) > 0;
        },
        group: 'Neihuan_niluan_clear',
    },
    Neihuan_niluan_clear: {
        trigger: { player: 'useCardAfter' },
        forced: true,
        direct: true,
        silent: true,
        charlotte: true,
        filter: function (event, player) {
            return event.skill == 'Neihuan_niluan' && event.addCount !== false && player.getHistory('sourceDamage', function (card) {
                return card.card == event.card;
            }).length == 0;
        },
        content: function () {
            trigger.addCount = false;
            if (player.stat[player.stat.length - 1].card.sha > 0) {
                player.stat[player.stat.length - 1].card.sha--;
            }
        },
    },
    "neihuan_heimu": {
        audio: "ext:太虚幻境/audio/skill:true",
        group: "neihuan_heimu_use",
        trigger: {
            global: "useCard",
        },
        filter: function (event, player) {
            return (event.player != player && player.getEnemies().includes(event.player)) && get.color(event.card) == 'black';
        },
        forced: true,
        content: function () {
            player.draw();
        },
        subSkill: {
            use: {
                trigger: {
                    player: "useCard",
                },
                filter: function (event, player) {
                    return get.color(event.card) == 'black';
                },
                forced: true,
                direct: true,
                audio: "neihuan_heimu",
                content: function () {
                    var target = player.getEnemies(function (current) {
                        return current.countCards('he');
                    }).randomGet();
                    if (target) {
                        player.logSkill('neihuan_heimu', target);
                        target.discard(target.getCards('he').randomGet());
                    }
                },
                ai: {
                    expose: 0.2
                },
            },
        },
    },
    "neihuan_andu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            global: "phaseEnd",
        },
        filter: function (event, player) {
            return player.getEnemies().includes(event.player) && player.hp >= event.player.hp;
        },
        forced: true,
        logTarget: "player",
        content: function () {
            trigger.player.damage();
        },
        ai: {
            expose: 0.2
        },
    },
    "Neihuan_biri": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return event.source && player.getEnemies().includes(event.source) && event.source.countCards('he', { type: ['trick', 'delay', 'equip'] }) > 0;
        },
        forced: true,
        logTarget: "source",
        content: function () {
            var he = [];
            var card = trigger.source.getCards('he', { type: 'basic' });
            var cards = trigger.source.getCards('he');
            var card1 = trigger.source.getCards('he', { color: 'red' });
            he = he.concat(cards);
            if (card) he.remove(card);
            trigger.source.discard(he);
            var card2 = [];
            card2 = card2.concat(cards)
            if (card) card2.remove(card);
            if (card1) card2.remove(card1);
            if (card2.length) trigger.num--;
        },
        ai: {
            "maixie_defend": true,
            effect: {
                target: function (card, player, target, current) {
                    if (player.hasSkillTag('jueqing', false, target) || player.hasSkillTag('damageBonus')) return;
                    if (get.tag(card, 'damage') && get.tag(card, 'damage') <= 1 && get.attitude(player, target) < 0 && player.countCards('he', { color: 'black', type: ['trick', 'delay', 'equip'] }) > 0) return [-1, 0];
                },
            },
        },
    },
    "neihuan_leixi": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: ["useCard", "respond"],
        },
        filter: function (event, player) {
            return ['sha', 'shan'].includes(event.card.name) && player != _status.currentPhase;
        },
        direct: true,
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt2('neihuan_leixi'), lib.filter.notMe).ai = function (target) {
                var player = _status.event.player;
                var att = get.attitude(player, target);
                if (att < 0) {
                    att = -Math.sqrt(-att);
                }
                else {
                    att = Math.sqrt(att);
                }
                if (event.color == 'red') return att * lib.card.guohe.ai.result.target(player, target);
                return get.damageEffect(target, player, player, 'thunder');
            };
            'step 1'
            if (result.bool) {
                player.logSkill('neihuan_leixi', result.targets);
                event.target = result.targets[0];
                event.target.judge();
            }
            else event.finish();
            'step 2'
            if (result.color == 'red') player.discardPlayerCard(target, 'he', 2, true);
            else target.damage(2);
        },
        ai: {
            expose: 0.2,
        },
    },
    "neihuan_huangjie": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "useCard",
        },
        filter: function (event, player) {
            var bool = true;
            if (event.targets) for (var i of event.targets) {
                if (player.getEnemies().includes(i)) bool = false;
            }
            return player.isPhaseUsing() && bool;
        },
        forced: true,
        content: function () {
            player.draw();
        },
    },
    "neihuan_chibi": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "phaseUseAfter",
        },
        filter: function (event, player) {
            return player.countCards('h', 'sha') == 0;
        },
        forced: true,
        content: function () {
            var cards = [];
            for (var i = 0; i < 2; i++) {
                var card = get.cardPile2(function (card) {
                    return card.name == 'sha' && !cards.includes(card);
                });
                if (card) cards.push(card);
            }
            if (cards.length) player.gain(cards, 'gain2');
        },
    },
    "zhangrang_yankong": {
        audio: "ext:太虚幻境/audio/skill:true",
        init: function (player) {
            player.storage.zhangrang_yankong_damage = 0;
        },
        locked: true,
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        filter: function (event, player) {
            return player.storage.zhangrang_yankong_damage < 4;
        },
        content: function () {
            player.addTempSkill('zhangrang_yankong_damage', { player: 'zhangrang_yankong_damageAfter' });
            player.storage.zhangrang_yankong_damage++;
            player.update();
        },
        ai: {
            maixie: true,
            "maixie_hp": true,
        },
        subSkill: {
            damage: {
                marktext: "炎恐",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        var num = player.storage.zhangrang_yankong_damage;
                        if (num == undefined) num = 0;
                        return "你下一次对敌方角色造成的伤害增加" + num + "点";
                    },
                },
                trigger: {
                    source: "damageBegin1",
                },
                filter: function (event, player) {
                    return player.getEnemies().includes(event.player) && player.storage.zhangrang_yankong_damage > 0;
                },
                forced: true,
                direct: true,
                content: function () {
                    player.logSkill('zhangrang_yankong');
                    trigger.num += player.storage.zhangrang_yankong_damage;
                    player.storage.zhangrang_yankong_damage = 0;
                    player.unmarkSkill("zhangrang_yankong_damage");
                    player.update();
                },
                ai: {
                    damageBonus: true,
                    skillTagFilter: function (player, tag, arg) {
                        if (player.getEnemies().includes(arg.target) && player.storage.zhangrang_yankong_damage > 0) return true;
                        return false;
                    },
                },
                sub: true,
            },
        },
    },
    "Neihuan_jiquan": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        forced: true,
        filter: function (event, player) {
            return player.isMaxHandcard(true) || player.countCards('h') < 10;
        },
        content: function () {
            "step 0"
            if (player.countCards('h') < 10) player.draw(10 - player.countCards('h'));
            "step 1"
            if (player.isMaxHandcard(true)) {
                var targets = game.filterPlayer(function (current) {
                    return player.getEnemies().includes(current);
                });
                if (targets.length > 0) {
                    targets.sort(lib.sort.seat);
                    event.targets = targets;
                    event.num = 0;
                } else {
                    event.finish();
                }
            }
            else {
                event.finish();
            }
            'step 2'
            if (num < event.targets.length) {
                if (event.targets[num].countCards('he')) {
                    player.line(event.targets[num]);
                    var hs = event.targets[num].getCards('he')
                    var card = hs.randomGet();
                    player.gain(card, event.targets[num]);
                    event.targets[num].$giveAuto(card, player);
                }
                event.num++;
                event.redo();
            }
        },
        ai: {
            nokeep: true,
            noh: true,
        },
    },
    //搬运到这.
    txfuji: {
        audio: true,
        trigger: {
            player: ["shaBefore"],
        },
        filter: function (event, player) {
            return !player.hasSkill('txfuji');
        },
        frequent: true,
        content: function () {
            player.addSkill('txfuji_a');
        },
        group: ["txfuji_b"],
        subSkill: {
            a: {
                trigger: {
                    source: "damageEnd",
                },
                forced: true,
                popup: false,
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha' && player.hasSkill('txfuji_a');
                },
                content: function () {
                    if (player.hasSkill('txfuji_a')) {
                        player.removeSkill('txfuji_a');
                    }
                    else {
                        event.finish();
                    }
                },
                sub: true,
            },
            b: {
                trigger: {
                    player: ["shaEnd"],
                },
                forced: true,
                popup: false,
                filter: function (event, player) {
                    return player.hasSkill('txfuji_a');
                },
                content: function () {
                    if (player.hasSkill('txfuji_a')) {
                        player.draw();
                        player.removeSkill('txfuji_a');
                    }
                    else {
                        event.finish();
                    }
                },
                sub: true,
            },
        },
    },
    txyuanwei: {
        audio: "drlt_congjian",
        trigger: {
            global: ["useCard", "respond"],
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha';
        },
        check: function (event, player) {
            return get.attitude(player, event.player) > 0;
        },
        logTarget: "player",
        content: function () {
            trigger.player.draw();
        },
        ai: {
            mingzhi: false,
            threaten: 2,
            expose: 0.2,
        },
    },
    txshiyuan: {
        audio: "shiyuan",
        trigger: { target: 'useCardToTargeted' },
        frequent: true,
        filter: function (event, player) {
            var num = 1;
            if (_status.currentPhase && _status.currentPhase != player && player.hasSkill('txyuwei', _status.currentPhase)) num = 2;
            return player != event.player && player.getHistory('gain', function (evt) {
                return evt.getParent(2).name == 'txshiyuan' && evt.cards.length == (2 + get.sgn(event.player.hp - player.hp));
            }).length < num;
        },
        content: function () {
            player.draw(2 + get.sgn(trigger.player.hp - player.hp));
        },
    },
    txyuwei: {
        //zhuSkill:true,
        locked: true,
        ai: { combo: 'txshiyuan' },
    },
    //何进诛宦赛季补充
    //以下代码全部搬运自【活动Boss】扩展，并特此非常感谢其作者（烟雨墨染）大佬 !!!
    "taixu_linglu": {
        global: ["taixu_linglu_jilu", "taixu_linglu_clear"],
        group: "taixu_linglu_die",
        init: function (player) {
            player.storage.taixu_linglu = [];
        },
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return !game.hasPlayer(function (current1) { return current1.hasSkill("taixu_linglu") && current1.storage.taixu_linglu.includes(current) }) });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名角色发布【令戮】强令。', function (card, player, target) { return !game.hasPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(target) }) }).set('ai', function (target) {
                if (target.countCards('hs') > 4 && target.hp >= 3 && game.countPlayer(function (current) { return get.attitude(target, current) < 0 && current.inRangeOf(target) }) > 0 && !target.hasUnknown()) return get.attitude(_status.event.player, target) > 0;
                return get.attitude(_status.event.player, target) < 0;
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_linglu', result.targets[0]);
                player.storage.taixu_linglu.add(result.targets[0]);
                result.targets[0].markSkill("taixu_linglu_jilu");
                player.update();
            }
        },
        subSkill: {
            jilu: {
                marktext: "令戮",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        var num = player.storage.taixu_linglu_jilu;
                        if (num == undefined) num = 0;
                        return "<li>任务目标：于你下回合结束前造成2点伤害<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(player) }).randomGet()) + "<br><li>已造成" + num + "点伤害";
                    },
                },
                trigger: {
                    source: "damageSource",
                },
                filter: function (event, player) {
                    return game.hasPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (player.storage.taixu_linglu_jilu == '' || player.storage.taixu_linglu_jilu == undefined) player.storage.taixu_linglu_jilu = 0;
                    player.storage.taixu_linglu_jilu += trigger.num;
                    player.update();
                },
            },
            clear: {
                trigger: {
                    player: "phaseEnd",
                },
                filter: function (event, player) {
                    return game.hasPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (player.storage.taixu_linglu_jilu >= 2) {
                        player.popup('强令成功');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(player) }).randomGet();
                        game.log(player, '成功完成了', event.list, '发布的', '#g【令戮】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.draw();
                            }
                        })
                        player.draw(2);
                        player.logSkill("taixu_linglu");
                    }
                    else {
                        player.popup('强令失败');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(player) }).randomGet();
                        game.log(player, '未完成', event.list, '发布的', '#g【令戮】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.discardPlayerCard(player, 'he', 1, true);
                            }
                        })
                        player.loseHp();
                        player.logSkill("taixu_linglu");
                    }
                    player.storage.taixu_linglu_jilu = 0;
                    player.unmarkSkill("taixu_linglu_jilu");
                    player.update();
                    event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_linglu") && current.storage.taixu_linglu.includes(player) }).randomGet();
                    event.list.storage.taixu_linglu.remove(player);
                    event.list.update();
                },
            },
            die: {
                trigger: {
                    player: 'dieBegin'
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                filter: function (event, player) {
                    return player.storage.taixu_linglu && game.hasPlayer(function (current) { return player.storage.taixu_linglu.includes(current) });
                },
                content: function () {
                    game.countPlayer(function (current) {
                        if (player.storage.taixu_linglu.includes(current)) {
                            player.storage.taixu_linglu.remove(current);
                            current.storage.taixu_linglu_jilu = 0;
                            current.unmarkSkill("taixu_linglu_jilu");
                            current.update();
                        }
                    })
                    player.update();
                },
            },
        },
    },
    "taixu_mouzhu": {
        init: function (player) {
            player.storage.taixu_mouzhu = 0;
        },
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            return target != player;
        },
        content: function () {
            'step 0'
            event.mubiao = game.filterPlayer(function (current) { return current != player && current != target && current.hp <= player.hp }).sortBySeat();
            "step 1"
            if (event.mubiao.length > 0) event.count = 0;
            else event.finish();
            "step 2"
            if (!event.mubiao[event.count].countCards('he')) event.goto(4);
            else event.mubiao[event.count].chooseCard('he', '交给' + get.translation(player) + '一张牌').set('ai', function (card) {
                if (get.attitude(_status.event.player, player) > 0) return true;
                else return false;
            });
            "step 3"
            if (result.bool) {
                event.mubiao[event.count].give(result.cards, player) && player.storage.taixu_mouzhu++;
                if (typeof event.mubiao[event.count].ai.shown == 'number' && event.mubiao[event.count].ai.shown < 0.95) {
                    event.mubiao[event.count].ai.shown += 0.3;
                    if (event.mubiao[event.count].ai.shown > 0.95) event.mubiao[event.count].ai.shown = 0.95;
                }
                player.update();
            }
            "step 4"
            event.count++;
            "step 5"
            if (event.count < event.mubiao.length) event.goto(2);
            "step 6"
            if (player.storage.taixu_mouzhu == 0) {
                game.countPlayer(function (current) {
                    if (current == player || (current != player && current != target && current.hp <= player.hp)) {
                        current.loseHp();
                    }
                })
                event.finish();
            }
            else {
                var list = ["sha", "juedou"];
                if (!player.canUse('sha', target, false)) list.remove('sha');
                if (!player.canUse('juedou', target, false)) list.remove('juedou');
                if (!list.length) event.goto(8);
                else if (list.length == 1) event._result = { control: list[0] };
                else target.chooseControl(list, true).set('prompt', '' + get.translation(player) + '视为对' + get.translation(target) + '使用一张【杀】或【决斗】。').ai = function () { return get.effect(target, { name: 'sha' }, player, player) >= get.effect(target, { name: 'juedou' }, player, player) ? 'sha' : 'juedou' };
            }
            "step 7"
            var next = player.useCard({ name: result.control, isCard: true }, target, 'noai');
            var num = Math.min((player.storage.taixu_mouzhu), 4);
            next.baseDamage = num;
            "step 8"
            if (player.storage.taixu_mouzhu > 0) player.storage.taixu_mouzhu = 0;
            player.update();
        },
        ai: {
            expose: 0.2,
            threaten: 2,
            order: 8,
            result: {
                player: function (card, player, target, current) {
                    if (game.hasPlayer(function (current) { return current != player && current.hp <= player.hp && get.attitude(current, player) > 0 && current.countCards('he') > 0 }) || (game.countPlayer(function (current) { return current != player && current.hp <= player.hp && get.attitude(current, player) <= 0 }) > game.countPlayer(function (current) { return current == player || (current != player && current.hp <= player.hp && get.attitude(current, player) > 0) }) && !game.hasPlayer(function (current) { return current != player && current.hp <= player.hp && get.attitude(current, player) > 0 && current.countCards('he') == 0 }))) return 1;
                    else return -1;
                },
                target: -1,
            },
        },
    },
    "taixu_mouqiang": {
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        filter: function (event, player) {
            return event.num > 1 && event.source && event.source.isIn() && event.source != player && event.source.countCards('he') > 0;
        },
        content: function () {
            "step 0"
            var num = Math.floor(trigger.num / 2);
            player.gainPlayerCard('he', trigger.source, num, true);
            event.num1 = 0;
            event.num2 = 0;
            "step 1"
            if (result.bool && result.links && result.links.length) {
                for (var i = 0; i < result.links.length; i++) {
                    if (get.type(result.links[i]) == 'basic') event.num1++;
                    else event.num2++;
                }
            }
            "step 2"
            if (event.num1 > 0) player.recover(event.num1);
            if (event.num2 > 0) trigger.source.damage(event.num2);
        },
    },
    txhj_zhuwei: {
        audio: 'zhuwei',
        trigger: { player: 'judgeEnd' },
        filter: function (event) {
            if (get.owner(event.result.card)) return false;
            if (event.nogain && event.nogain(event.result.card)) return false;
            return true;
            //return event.result.card.name=='sha'||event.result.card.name=='juedou';
        },
        frequent: true,
        preHidden: true,
        content: function () {
            'step 0'
            player.gain(trigger.result.card, 'gain2');
            player.chooseBool('是否令' + get.translation(_status.currentPhase) + '本回合的手牌上限和使用【杀】的次数上限+1？').ai = function () {
                return get.attitude(player, _status.currentPhase) > 0;
            };
            'step 1'
            if (result.bool) {
                var target = _status.currentPhase;
                if (!target.hasSkill('txhj_zhuwei_eff')) {
                    target.addTempSkill('txhj_zhuwei_eff');
                    target.storage.txhj_zhuwei_eff = 1;
                }
                else target.storage.txhj_zhuwei_eff++;
                target.updateMarks();
            }
        },
        subSkill: {
            eff: {
                sub: true,
                mod: {
                    cardUsable: function (card, player, num) {
                        if (card.name == 'sha') return num + player.storage.txhj_zhuwei_eff;
                    },
                    maxHandcard: function (player, num) { return num + player.storage.txhj_zhuwei_eff }
                },
                mark: true,
                charlotte: true,
                intro: {
                    content: function (storage) {
                        if (storage) return '使用【杀】的次数上限+' + storage + '，手牌上限+' + storage;
                    }
                }
            }
        },
    },
    "taixu_xiehui": {
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return current != player });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名其他角色发布【胁贿】强令。', function (card, player, target) { return target != player }).set('ai', function (target) {
                return get.attitude(_status.event.player, target) <= 0 || (get.attitude(_status.event.player, target) < 0 && get.damageEffect(target, _status.event.player, _status.event.player) > 0);
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_xiehui', result.targets[0]);
                event.target = result.targets[0];
                event.target.chooseCard('he', 2).set('prompt', '交给' + get.translation(player) + '两张牌').set('ai', function (card) { return 6 - get.value(card) });
            }
            else event.finish();
            'step 2'
            if (result.bool) {
                event.target.popup('强令成功');
                game.log(event.target, '成功完成了', player, '发布的', '#g【胁贿】', '强令');
                game.countPlayer(function (current) {
                    if (current.hasSkill("taixu_yishi") && (current == player || player.getFriends().includes(current))) {
                        current.logSkill("taixu_yishi");
                        current.draw();
                    }
                })
                event.target.give(result.cards, player);
            }
            else {
                event.target.popup('强令失败');
                game.log(event.target, '未完成', player, '发布的', '#g【胁贿】', '强令');
                game.countPlayer(function (current) {
                    if (current.hasSkill("taixu_yishi") && (current == player || player.getFriends().includes(current))) {
                        current.logSkill("taixu_yishi");
                        current.discardPlayerCard(event.target, 'he', 1, true);
                    }
                })
                event.target.damage();
            }
        },
    },
    "taixu_zhulian": {
        global: ["taixu_zhulian_jilu", "taixu_zhulian_clear"],
        group: "taixu_zhulian_die",
        init: function (player) {
            player.storage.taixu_zhulian = [];
        },
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return current != player && !game.hasPlayer(function (current1) { return current1.hasSkill("taixu_zhulian") && current1.storage.taixu_zhulian.includes(current) }) });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名其他角色发布【株连】强令。', function (card, player, target) { return target != player && !game.hasPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(target) }) }).set('ai', function (target) {
                if (game.countPlayer(function (current) { return get.attitude(target, current) < 0 && current.inRangeOf(target) }) > 0 || player.isLinked() || target.isLinked()) return get.attitude(_status.event.player, target) > 0;
                else return 0;
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_zhulian', result.targets[0]);
                player.storage.taixu_zhulian.add(result.targets[0]);
                result.targets[0].markSkill("taixu_zhulian_jilu");
                player.update();
            }
        },
        subSkill: {
            jilu: {
                marktext: "株连",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        return "<li>任务目标：下一次使用【杀】造成伤害<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(player) }).randomGet()) + "";
                    },
                },
                trigger: {
                    source: "damageSource",
                },
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha' && game.hasPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    player.storage.taixu_zhulian_use = true;
                    if (player.storage.taixu_zhulian_jilu == '' || player.storage.taixu_zhulian_jilu == undefined) player.storage.taixu_zhulian_jilu = [];
                    player.storage.taixu_zhulian_jilu.add(trigger.player);
                    player.update();
                },
            },
            clear: {
                trigger: {
                    player: "useCardAfter",
                },
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha' && game.hasPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (player.storage.taixu_zhulian_use) {
                        player.popup('强令成功');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(player) }).randomGet(); game.log(player, '成功完成了', event.list, '发布的', '#g【株连】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.draw();
                            }
                        })
                        event.list.logSkill("taixu_zhulian");
                        for (var i = 0; i < player.storage.taixu_zhulian_jilu.length; i++) {
                            if (player.storage.taixu_zhulian_jilu[i].countCards('he') > 0) event.list.gainPlayerCard('he', player.storage.taixu_zhulian_jilu[i], 1, true);
                        }
                    }
                    else {
                        player.popup('强令失败');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(player) }).randomGet();
                        game.log(player, '未完成', event.list, '发布的', '#g【株连】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.discardPlayerCard(player, 'he', 1, true);
                            }
                        })
                        player.link() && player.logSkill("taixu_zhulian");
                        event.list.link() && event.list.logSkill("taixu_zhulian");
                    }
                    player.storage.taixu_zhulian_jilu = [];
                    player.storage.taixu_zhulian_use = false;
                    player.unmarkSkill("taixu_zhulian_jilu");
                    player.update();
                    event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhulian") && current.storage.taixu_zhulian.includes(player) }).randomGet();
                    event.list.storage.taixu_zhulian.remove(player);
                    event.list.update();
                },
            },
            die: {
                trigger: {
                    player: 'dieBegin'
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                filter: function (event, player) {
                    return player.storage.taixu_zhulian && game.hasPlayer(function (current) { return player.storage.taixu_zhulian.includes(current) });
                },
                content: function () {
                    game.countPlayer(function (current) {
                        if (player.storage.taixu_zhulian.includes(current)) {
                            player.storage.taixu_zhulian.remove(current);
                            current.storage.taixu_zhulian_jilu = [];
                            current.storage.taixu_zhulian_use = false;
                            current.unmarkSkill("taixu_zhulian_jilu");
                            current.update();
                        }
                    })
                    player.update();
                },
            },
        },
    },
    "taixu_quanqing": {
        global: ["taixu_quanqing_jilu", "taixu_quanqing_clear"],
        group: "taixu_quanqing_die",
        init: function (player) {
            player.storage.taixu_quanqing = [];
        },
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return current != player && !game.hasPlayer(function (current1) { return current1.hasSkill("taixu_quanqing") && current1.storage.taixu_quanqing.includes(current) }) });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名其他角色发布【权倾】强令。', function (card, player, target) { return target != player && !game.hasPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(target) }) }).set('ai', function (target) {
                return get.attitude(_status.event.player, target) < 0;
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_quanqing', result.targets[0]);
                player.storage.taixu_quanqing.add(result.targets[0]);
                result.targets[0].markSkill("taixu_quanqing_jilu");
                player.update();
            }
        },
        subSkill: {
            jilu: {
                marktext: "权倾",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        var skills = player.getSkills().filter(function (skill) {
                            var info = get.info(skill);
                            return info && !info.charlotte;
                        });
                        var history = player.getHistory('useSkill');
                        for (var i of history) {
                            if ((skills.includes(i.sourceSkill) || skills.includes(i.skill)) && game.hasPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) })) player.storage.taixu_quanqing_use = true;
                        }
                        if (!player.storage.taixu_quanqing_use) return "<li>任务目标：于你回合结束前不发动技能<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) }).randomGet()) + "<br><li>未发动过技能";
                        return "<li>任务目标：于你回合结束前不发动技能<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) }).randomGet()) + "<br><li>已发动过技能";
                    },
                },
            },
            clear: {
                trigger: {
                    player: "phaseEnd",
                },
                filter: function (event, player) {
                    return game.hasPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (!player.storage.taixu_quanqing_use) {
                        player.popup('强令成功');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) }).randomGet();
                        game.log(player, '成功完成了', event.list, '发布的', '#g【权倾】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.draw();
                            }
                        })
                        player.turnOver();
                        player.logSkill("taixu_quanqing");
                    }
                    else {
                        player.popup('强令失败');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) }).randomGet();
                        game.log(player, '未完成', event.list, '发布的', '#g【权倾】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.discardPlayerCard(player, 'he', 1, true);
                            }
                        })
                        event.list.gainMaxHp(2);
                        event.list.recover(2);
                        event.list.logSkill("taixu_quanqing");
                    }
                    player.storage.taixu_quanqing_use = false;
                    player.unmarkSkill("taixu_quanqing_jilu");
                    player.update();
                    event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_quanqing") && current.storage.taixu_quanqing.includes(player) }).randomGet();
                    event.list.storage.taixu_quanqing.remove(player);
                    event.list.update();
                },
            },
            die: {
                trigger: {
                    player: 'dieBegin'
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                filter: function (event, player) {
                    return player.storage.taixu_quanqing && game.hasPlayer(function (current) { return player.storage.taixu_quanqing.includes(current) });
                },
                content: function () {
                    game.countPlayer(function (current) {
                        if (player.storage.taixu_quanqing.includes(current)) {
                            player.storage.taixu_quanqing.remove(current);
                            current.storage.taixu_quanqing_use = false;
                            current.unmarkSkill("taixu_quanqing_jilu");
                            current.update();
                        }
                    })
                    player.update();
                },
            },
        },
    },
    "taixu_jinxing": {
        global: ["taixu_jinxing_jilu", "taixu_jinxing_clear"],
        group: "taixu_jinxing_die",
        init: function (player) {
            player.storage.taixu_jinxing = [];
        },
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return current != player && !game.hasPlayer(function (current1) { return current1.hasSkill("taixu_jinxing") && current1.storage.taixu_jinxing.includes(current) }) });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名其他角色发布【禁行】强令。', function (card, player, target) { return target != player && !game.hasPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(target) }) }).set('ai', function (target) {
                return get.attitude(_status.event.player, target) <= 0;
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_jinxing', result.targets[0]);
                player.storage.taixu_jinxing.add(result.targets[0]);
                result.targets[0].markSkill("taixu_jinxing_jilu");
                player.update();
            }
        },
        subSkill: {
            jilu: {
                marktext: "禁行",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        if (!player.storage.taixu_jinxing_use) return "<li>任务目标：于你回合结束前不使用基本牌<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) }).randomGet()) + "<br><li>未使用过基本牌";
                        return "<li>任务目标：于你回合结束前不使用基本牌<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) }).randomGet()) + "<br><li>已使用过基本牌";
                    },
                },
                trigger: {
                    player: "useCardAfter",
                },
                filter: function (event, player) {
                    return get.type(event.card) == 'basic' && game.hasPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (!player.storage.taixu_jinxing_use) {
                        player.storage.taixu_jinxing_use = true;
                        player.update();
                    }
                    if (player.storage.taixu_jinxing_jilu == '' || player.storage.taixu_jinxing_jilu == undefined) player.storage.taixu_jinxing_jilu = [];
                    for (var i = 0; i < trigger.cards.length; i++) {
                        if (get.type(trigger.cards[i]) == 'basic') player.storage.taixu_jinxing_jilu.add(trigger.cards[i]);
                    }
                    player.update();
                },
            },
            clear: {
                trigger: {
                    player: "phaseEnd",
                },
                filter: function (event, player) {
                    return game.hasPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    "step 0"
                    if (!player.storage.taixu_jinxing_use) {
                        player.popup('强令成功');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) }).randomGet();
                        game.log(player, '成功完成了', event.list, '发布的', '#g【禁行】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.draw();
                            }
                        })
                        event.goto(2);
                    }
                    else {
                        player.popup('强令失败');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) }).randomGet();
                        game.log(player, '未完成', event.list, '发布的', '#g【禁行】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.discardPlayerCard(player, 'he', 1, true);
                            }
                        })
                        event.list.chooseControl('失去体力', '获得牌').ai = function () {
                            if (get.attitude(_status.event.player, player) >= 0 || player.storage.taixu_jinxing_jilu.length >= 2) return '获得牌';
                            if (get.attitude(_status.event.player, player) < 0 && player.hp == 1) return '失去体力';
                            else return ['失去体力', '获得牌'].randomGet();
                        };
                    }
                    "step 1"
                    if (result.control == "失去体力") {
                        player.loseHp();
                        player.logSkill('taixu_jinxing');
                        event.goto(2);
                    }
                    else {
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) }).randomGet();
                        event.cards = player.storage.taixu_jinxing_jilu;
                        event.list.gain(event.cards, 'gain2');
                        if (player.countCards('h') > 0) event.list.gain(player.getCards('h').randomGet(), player, 'giveAuto', 'bySelf');
                        event.list.logSkill('taixu_jinxing');
                    }
                    "step 2"
                    player.storage.taixu_jinxing_jilu = [];
                    player.storage.taixu_jinxing_use = false;
                    player.unmarkSkill("taixu_jinxing_jilu");
                    player.update();
                    event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_jinxing") && current.storage.taixu_jinxing.includes(player) }).randomGet();
                    event.list.storage.taixu_jinxing.remove(player);
                    event.list.update();
                },
            },
            die: {
                trigger: {
                    player: 'dieBegin'
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                filter: function (event, player) {
                    return player.storage.taixu_jinxing && game.hasPlayer(function (current) { return player.storage.taixu_jinxing.includes(current) });
                },
                content: function () {
                    game.countPlayer(function (current) {
                        if (player.storage.taixu_jinxing.includes(current)) {
                            player.storage.taixu_jinxing.remove(current);
                            current.storage.taixu_jinxing_jilu = [];
                            current.storage.taixu_jinxing_use = false;
                            current.unmarkSkill("taixu_jinxing_jilu");
                            current.update();
                        }
                    })
                    player.update();
                },
            },
        },
    },
    "taixu_yishi": {
        charlotte: true,
    },
    "taixu_jinwei": {
        group: ["taixu_jinwei_2", "taixu_jinwei_4"],
        enable: 'chooseToUse',
        viewAs: { name: 'sha' },
        filterCard: function () { return false },
        selectCard: -1,
        check: function (event, player) {
            return player.countCards('h', 'sha') == 0;
        },
        filter: function (event, player) {
            if (!game.hasPlayer(function (current) {
                return current != player && current.hasSkill("taixu_jinwei") && current.countCards('he') > 0;
            })) return false;
            return !event.taixu_jinwei && (event.type != 'phase' || !player.hasSkill('taixu_jinwei_3'));
        },
        ai: {
            order: function () {
                return get.order({ name: 'sha' });
            },
            respondSha: true,
            skillTagFilter: function (player) {
                if (!game.hasPlayer(function (current) {
                    return current != player && current.hasSkill("taixu_jinwei") && current.countCards('he') > 0;
                })) return false;
            },
        },
        subSkill: {
            2: {
                trigger: {
                    player: 'useCardBegin'
                },
                logTarget: 'targets',
                filter: function (event, player) {
                    return event.skill == 'taixu_jinwei';
                },
                forced: true,
                content: function () {
                    "step 0"
                    delete trigger.skill;
                    trigger.getParent().set('taixu_jinwei', true);
                    "step 1"
                    if (event.current == undefined) event.current = player.next;
                    if (event.current == player) {
                        player.addTempSkill('taixu_jinwei_3');
                        event.finish();
                        trigger.cancel();
                        trigger.getParent().goto(0);
                    }
                    else if (event.current != player && event.current.hasSkill("taixu_jinwei") && event.current.countCards('he') > 0) {
                        var next = event.current.chooseToDiscard('he', 1).set('prompt', '是否弃置一张牌，然后代替' + get.translation(player) + '使用一张杀').set('ai', function (card) {
                            var num = event.current.countCards('h', 'sha');
                            if (num == 0) return 0;
                            if (get.attitude(_status.event.player, player) <= 0) return 0;
                            if (card.name == 'sha') return num > 1 ? 2 : 0;
                            return 8 - get.value(card);
                        });
                    }
                    else {
                        event.current = event.current.next;
                        event.redo();
                    }
                    "step 2"
                    if (result.bool) {
                        event.current.chooseToRespond('是否替' + get.translation(player) + '使用一张杀？', { name: 'sha' }).set('ai', function (card) { return true });
                    }
                    else {
                        event.current = event.current.next;
                        event.goto(1);
                    }
                    "step 3"
                    if (result.bool) {
                        event.finish();
                        trigger.card = result.card;
                        trigger.cards = result.cards;
                        trigger.throw = false;
                        if (typeof event.current.ai.shown == 'number' && event.current.ai.shown < 0.95) {
                            event.current.ai.shown += 0.3;
                            if (event.current.ai.shown > 0.95) event.current.ai.shown = 0.95;
                        }
                    }
                    else {
                        event.current = event.current.next;
                        event.goto(1);
                    }
                },
            },
            3: {
                trigger: { global: ['useCardAfter', 'useSkillAfter', 'phaseAfter'] },
                silent: true,
                charlotte: true,
                filter: function (event) {
                    return event.skill != 'taixu_jinwei';
                },
                content: function () {
                    player.removeSkill('taixu_jinwei_3');
                }
            },
            4: {
                trigger: { player: 'chooseToUseBefore' },
                filter: function (event, player) {
                    if (event.responded) return false;
                    if (player.storage.taixu_jinwei_4) return false;
                    if (!event.filterCard({ name: 'shan' }, player, event)) return false;
                    return game.hasPlayer(function (current) {
                        return current != player && current.hasSkill("taixu_jinwei") && current.countCards('he') > 0;
                    });
                },
                check: function (event, player) {
                    if (get.damageEffect(player, event.player, player) >= 0) return false;
                    return player.countCards('h', 'shan') == 0;
                },
                content: function () {
                    "step 0"
                    if (event.current == undefined) event.current = player.next;
                    if (event.current == player) {
                        event.finish();
                    }
                    else if (event.current.hasSkill("taixu_jinwei") && event.current.countCards('he') > 0) {
                        if ((event.current == game.me && !_status.auto) || (
                            get.attitude(event.current, player) > 2) ||
                            event.current.isOnline()) {
                            player.storage.taixu_jinwei_4 = true;
                            var next = event.current.chooseToDiscard('he', 1).set('prompt', '是否弃置一张牌，然后代替' + get.translation(player) + '使用一张闪').set('ai', function (card) {
                                var num = event.current.countCards('h', 'shan');
                                if (num == 0) return 0;
                                if (get.attitude(_status.event.player, player) <= 0) return 0;
                                if (card.name == 'shan') return num > 1 ? 2 : 0;
                                return 8 - get.value(card);
                            });
                        }
                    }
                    "step 1"
                    player.storage.taixu_jinwei_4 = false;
                    if (result.bool) {
                        event.current.chooseToRespond('是否替' + get.translation(player) + '使用一张闪？', { name: 'shan' }).set('ai', function (card) { return true });
                    }
                    else {
                        event.current = event.current.next;
                        event.goto(0);
                    }
                    "step 2"
                    if (result.bool) {
                        event.finish();
                        trigger.result = { bool: true, card: { name: 'shan', isCard: true } };
                        trigger.responded = true;
                        trigger.animate = false;
                        if (typeof event.current.ai.shown == 'number' && event.current.ai.shown < 0.95) {
                            event.current.ai.shown += 0.3;
                            if (event.current.ai.shown > 0.95) event.current.ai.shown = 0.95;
                        }
                    }
                    else {
                        event.current = event.current.next;
                        event.goto(0);
                    }
                },
                ai: {
                    respondShan: true,
                    skillTagFilter: function (player) {
                        if (player.storage.taixu_jinwei_4) return false;
                        return game.hasPlayer(function (current) {
                            return current != player && current.hasSkill("taixu_jinwei") && current.countCards('he') > 0;
                        });
                    },
                },
            },
        },
    },
    "taixu_zhanhuo": {
        global: ["taixu_zhanhuo_jilu", "taixu_zhanhuo_clear"],
        group: "taixu_zhanhuo_die",
        init: function (player) {
            player.storage.taixu_zhanhuo = [];
        },
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return !game.hasPlayer(function (current1) { return current1.hasSkill("taixu_zhanhuo") && current1.storage.taixu_zhanhuo.includes(current) }) });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名角色发布【斩获】强令。', function (card, player, target) { return !game.hasPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(target) }) }).set('ai', function (target) {
                return get.attitude(_status.event.player, target) > 0;
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_zhanhuo', result.targets[0]);
                player.storage.taixu_zhanhuo.add(result.targets[0]);
                result.targets[0].markSkill("taixu_zhanhuo_jilu");
                player.update();
            }
        },
        subSkill: {
            jilu: {
                marktext: "斩获",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        return "<li>任务目标：为下一个造成濒死伤害的来源<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) }).randomGet()) + "";
                    },
                },
                trigger: {
                    global: "dying",
                },
                filter: function (event, player) {
                    return event.source && event.source == player && game.hasPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) }) && !player.storage.taixu_zhanhuo_use;
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    player.storage.taixu_zhanhuo_use = true;
                    player.logSkill("taixu_zhanhuo");
                    player.update();
                },
            },
            clear: {
                trigger: {
                    global: ["dyingAfter", "die"],
                },
                filter: function (event, player) {
                    return game.hasPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (player.storage.taixu_zhanhuo_use) {
                        player.popup('强令成功');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) }).randomGet();
                        game.log(player, '成功完成了', event.list, '发布的', '#g【斩获】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.draw();
                            }
                        })
                        var name = event.triggername;
                        if (name == 'dyingAfter') {
                            player.logSkill("taixu_zhanhuo");
                            player.draw(2);
                        }
                        else {
                            event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) }).randomGet();
                            player.logSkill("taixu_zhanhuo") && event.list.logSkill("taixu_zhanhuo");
                            game.asyncDraw([player, event.list], [3, 1]);
                        }
                    }
                    else {
                        player.popup('强令失败');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) }).randomGet();
                        game.log(player, '未完成', event.list, '发布的', '#g【斩获】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.discardPlayerCard(player, 'he', 1, true);
                            }
                        })
                    }
                    player.storage.taixu_zhanhuo_use = false;
                    player.unmarkSkill("taixu_zhanhuo_jilu");
                    player.update();
                    event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhanhuo") && current.storage.taixu_zhanhuo.includes(player) }).randomGet();
                    event.list.storage.taixu_zhanhuo.remove(player);
                    event.list.update();
                },
            },
            die: {
                trigger: {
                    player: 'dieBegin'
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                filter: function (event, player) {
                    return player.storage.taixu_zhanhuo && game.hasPlayer(function (current) { return player.storage.taixu_zhanhuo.includes(current) });
                },
                content: function () {
                    game.countPlayer(function (current) {
                        if (player.storage.taixu_zhanhuo.includes(current)) {
                            player.storage.taixu_zhanhuo.remove(current);
                            current.storage.taixu_zhanhuo_use = false;
                            current.unmarkSkill("taixu_zhanhuo_jilu");
                            current.update();
                        }
                    })
                    player.update();
                },
            },
        },
    },
    "taixu_jiaoxie": {
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return current != player && current.countCards('e') > 0 });
        },
        content: function () {
            "step 0"
            player.chooseTarget('对一名其他角色发布【缴械】强令。', function (card, player, target) { return target != player && target.countCards('e') > 0 }).set('ai', function (target) {
                return get.attitude(_status.event.player, target) <= 0 || (get.attitude(_status.event.player, target) < 0 && get.damageEffect(target, _status.event.player, _status.event.player) > 0);
            });
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_jiaoxie', result.targets[0]);
                event.target = result.targets[0];
                var num = event.target.countCards('e');
                event.target.chooseCard('e', [1, num]).set('prompt', '将你装备区内的任意张牌交给' + get.translation(player) + '').set('ai', function (card) { return 6 - get.value(card) });
            }
            else event.finish();
            'step 2'
            if (result.bool) {
                event.target.popup('强令成功');
                game.log(event.target, '成功完成了', player, '发布的', '#g【缴械】', '强令');
                game.countPlayer(function (current) {
                    if (current.hasSkill("taixu_yishi") && (current == player || player.getFriends().includes(current))) {
                        current.logSkill("taixu_yishi");
                        current.draw();
                    }
                })
                event.target.give(result.cards, player);
                event.target.draw(result.cards.length);
            }
            else {
                event.target.popup('强令失败');
                game.log(event.target, '未完成', player, '发布的', '#g【缴械】', '强令');
                game.countPlayer(function (current) {
                    if (current.hasSkill("taixu_yishi") && (current == player || player.getFriends().includes(current))) {
                        current.logSkill("taixu_yishi");
                        current.discardPlayerCard(event.target, 'he', 1, true);
                    }
                })
                event.target.damage();
            }
        },
    },
    "taixu_zhuosheng": {
        global: ["taixu_zhuosheng_jilu", "taixu_zhuosheng_clear"],
        group: "taixu_zhuosheng_die",
        init: function (player) {
            player.storage.taixu_zhuosheng = [];
        },
        trigger: {
            player: "phaseUseBegin",
        },
        direct: true,
        filter: function (event, player) {
            return player.countCards('he') > 0 && game.hasPlayer(function (current) { return current != player && !game.hasPlayer(function (current1) { return current1.hasSkill("taixu_zhuosheng") && current1.storage.taixu_zhuosheng.includes(current) }) });
        },
        content: function () {
            "step 0"
            player.chooseToDiscard(1, 'he').set('prompt', '是否弃置一张牌，然后对一名其他角色发布【擢升】强令。').set('ai', function (card) {
                if (game.countPlayer(function (current) { return current != player && get.attitude(player, current) > 0 }) > 0) return 4 - get.value(card);
                else return 0;
            });
            "step 1"
            if (result.bool) {
                player.chooseTarget(true, '令一名其他角色执行【擢升】强令任务。', function (card, player, target) { return target != player && !game.hasPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(target) }) }).set('ai', function (target) {
                    return get.attitude(_status.event.player, target) > 0;
                });
            }
            else event.finish();
            "step 2"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('taixu_zhuosheng', result.targets[0]);
                player.storage.taixu_zhuosheng.add(result.targets[0]);
                result.targets[0].markSkill("taixu_zhuosheng_jilu");
                player.update();
            }
        },
        subSkill: {
            jilu: {
                marktext: "擢升",
                mark: true,
                locked: true,
                intro: {
                    content: function (storage, player, skill) {
                        var num = player.storage.taixu_zhuosheng_jilu;
                        if (num == undefined) num = 0;
                        return "<li>任务目标：于你回合结束前获得至少五张牌<br><li>发布者：" + get.translation(game.filterPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) }).randomGet()) + "<br><li>已获得" + num + "张牌";
                    },
                },
                trigger: {
                    player: "gainEnd",
                },
                filter: function (event, player) {
                    return event.cards && event.cards.length > 0 && game.hasPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    if (player.storage.taixu_zhuosheng_jilu == '' || player.storage.taixu_zhuosheng_jilu == undefined) player.storage.taixu_zhuosheng_jilu = 0;
                    player.storage.taixu_zhuosheng_jilu += trigger.cards.length;
                    player.update();
                },
            },
            clear: {
                trigger: {
                    player: "phaseEnd",
                },
                filter: function (event, player) {
                    return game.hasPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) });
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                content: function () {
                    "step 0"
                    if (player.storage.taixu_zhuosheng_jilu >= 5) {
                        player.popup('强令成功');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) }).randomGet();
                        game.log(player, '成功完成了', event.list, '发布的', '#g【擢升】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.draw();
                            }
                        })
                        player.gainMaxHp();
                        player.recover();
                        player.logSkill("taixu_zhuosheng");
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) }).randomGet();
                        if (event.list && player.countCards('he', function (card) { return get.type(card) != 'basic' }) > 0) {
                            player.chooseCard('〖擢升〗交给' + get.translation(event.list) + '一张非基本牌', 'he', true, function (card) { return get.type(card) != 'basic' }).set('ai', function (card) { return 7 - get.value(card) });
                        }
                        else event.goto(2);
                    }
                    else {
                        player.popup('强令失败');
                        event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) }).randomGet();
                        game.log(player, '未完成', event.list, '发布的', '#g【擢升】', '强令');
                        game.countPlayer(function (current) {
                            if (current.hasSkill("taixu_yishi") && (event.list == current || event.list.getFriends().includes(current))) {
                                current.logSkill("taixu_yishi");
                                current.discardPlayerCard(player, 'he', 1, true);
                            }
                        })
                        event.goto(2);
                    }
                    "step 1"
                    if (result.bool) {
                        event.list.gain(result.cards, player, 'giveAuto');
                    }
                    "step 2"
                    player.storage.taixu_zhuosheng_jilu = 0;
                    player.unmarkSkill("taixu_zhuosheng_jilu");
                    player.update();
                    event.list = game.filterPlayer(function (current) { return current.hasSkill("taixu_zhuosheng") && current.storage.taixu_zhuosheng.includes(player) }).randomGet();
                    event.list.storage.taixu_zhuosheng.remove(player);
                    event.list.update();
                },
            },
            die: {
                trigger: {
                    player: 'dieBegin'
                },
                charlotte: true,
                direct: true,
                silent: true,
                forced: true,
                filter: function (event, player) {
                    return player.storage.taixu_zhuosheng && game.hasPlayer(function (current) { return player.storage.taixu_zhuosheng.includes(current) });
                },
                content: function () {
                    game.countPlayer(function (current) {
                        if (player.storage.taixu_zhuosheng.includes(current)) {
                            player.storage.taixu_zhuosheng.remove(current);
                            current.storage.taixu_zhuosheng_jilu = 0;
                            current.unmarkSkill("taixu_zhuosheng_jilu");
                            current.update();
                        }
                    })
                    player.update();
                },
            },
        },
    },
    xiongshi_fuqi: {
        audio: 2,
        forced: true,
        charlotte: true,
        trigger: {
            player: "useCard",
        },
        filter: function (event, player) {
            return event.card && (get.type(event.card) == 'trick' || get.type(event.card) == 'basic' && !['shan', 'tao', 'jiu', 'du'].includes(event.card.name)) && game.hasPlayer(function (current) {
                return current != player && get.distance(current, player) >= 0;
            });
        },
        content: function () {
            trigger.directHit.addArray(game.filterPlayer(function (current) {
                return current != player && get.distance(current, player) >= 0;
            }));
        },
        ai: {
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                return get.distance(arg.target, player) >= 0;
            },
        },
    },
    "diy_xiongshiSkill3": {
        trigger: {
            source: "damageBegin1",
        },
        audio: true,
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        priority: 1,
        group: 'xiongshi_fuqi',
        filter: function (event, player) {
            return event.card && event.getParent().name == event.card.name && event.getParent(2).targets && event.getParent(2).targets.length == 1 && player.countCards("h") > event.player.countCards("h");
        },
        logTarget: "player",
        content: function () {
            /*trigger.num++;		
                'step 1'*/
            var card = get.cardPile2(card => get.type(card, false) == 'basic');
            if (card) player.gain(card, 'gain2');
            //},
        },
    },
    "diy_xiongshiSkill1": {
        audio: true,
        trigger: {
            player: "damageEnd",
        },

        filter: function (event, player) {
            return event.nature && (event.nature == "thunder" || event.nature == "fire");
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        priority: 1,
        content: function () {
            if (trigger.nature == "thunder") {
                player.draw(player.maxHp);
            } else {
                var card = game.createCard("bingliang");
                player.line(trigger.source);
                trigger.source.addJudge(card);
                player.gain(get.cardPile(function (card) {
                    return get.name(card) == "sha";
                }), "gain2");
            }
        },
    },
    "diy_xiongshiSkill2": {
        trigger: { source: 'damageEnd' },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        priority: 1,
        filter: function (event, player) {
            if (event.parent.name == 'diy_xiongshiSkill2') return false;
            return game.hasPlayer(function (current) {
                return current != event.player && current != player;
            });
        },
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt2('diy_xiongshiSkill2'), function (card, player, target) {
                return target != trigger.player && target != player;
            }).set('ai', function (target) {
                return get.damageEffect(target, player, player);
            });
            'step 1'
            if (result.bool) {
                player.logSkill('diy_xiongshiSkill2', result.targets);
                result.targets[0].damage(player);
            }
        },
        ai: {
            threaten: 1.5
        }
    },
    /*合纵抗秦*/
    //以下代码全部搬运自【合纵抗秦】扩展!
    "bubing_fangzhen": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            target: "useCardToTargeted",
        },
        filter: function (event, player) {
            if (event.player.group == 'daqin' || event.player == player || !player.canUse({
                name: 'sha'
            }, event.player)) return false;
            if ((event.card.name == 'sha' || get.type(event.card) == 'trick') && get.distance(event.player, player,
                'attack') <= 1) return true;
            return false;
        },
        forced: true,
        content: function () {
            "step 0"
            player.judge(function (card) {
                return (get.color(card) == 'black') ? 2 : -1;
            });
            "step 1"
            if (result.judge > 0) {
                player.useCard({
                    name: 'sha'
                }, trigger.player, false);
            }
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (!target.inRange(player)) return;
                    if (player.group == 'daqin') return;
                    if (card.name != 'sha' && get.type(card) != 'trick') return;
                    var maixie = (player.hasSkillTag('maixie') || player.hasSkillTag('maixie_hp'));
                    var shan = player.countCards('h', 'shan');
                    var taojiu = (player.countCards('h', 'tao') + player.countCards('h', 'jiu'));
                    var hp = player.hp;
                    if (player.getEquip('tengjia') && get.attitude(player, target) <= 0) {
                        if (get.itemtype(_status.pileTop) == 'card') {
                            if (get.color(_status.pileTop) != 'black' && get.attitude(player, target) <= 0) return 3;
                        } else {
                            return;
                        }
                        if (target.getEquip('zhuque') || target.getEquip('qinggang')) {
                            if (shan == 0) {
                                if (maixie && (hp > 1 || taojiu > 0) && !game.players.hasSkill('daqin_wuan')) return 2;
                                return -2;
                            } else {
                                return 0.2;
                            }
                        }
                        return 1;
                    }
                    if (player.getEquip('bagua') && get.attitude(player, target) <= 0) {
                        if (get.itemtype(_status.pileTop) == 'card') {
                            if (get.color(_status.pileTop) != 'black' && get.attitude(player, target) <= 0) return 3;
                        } else {
                            return;
                        }
                        if (target.getEquip('qinggang')) {
                            if (shan == 0) {
                                if (maixie && (hp > 1 || taojiu > 0) && !game.players.hasSkill('daqin_wuan')) return 2;
                                return -1;
                            } else {
                                return 0.2;
                            }
                        }
                        return 0.5;
                    }
                },
            },
        },
    },
    "bubing_changbing": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            attackFrom: function (from, to, distance) {
                return distance - 2;
            },
        },
    },
    "shangyang_bianfa": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            selectTarget: function (card, player, range) {
                if (_status.kangqinEvent == '变法图强' && card.name == 'shangyangbianfa' && range[1] != -1) range[1]++;
            },
        },
        enable: "chooseToUse",
        usable: 1,
        filterCard: function (card) {
            return get.type(card) == 'trick';
        },
        viewAs: {
            name: "shangyangbianfa",
        },
        viewAsFilter: function (player) {
            if (!player.countCards('h', {
                type: 'trick'
            })) return false;
        },
        prompt: "将一张普通锦囊牌当作【商鞅变法】使用",
        check: function (card) {
            return 9 - get.value(card);
        },
        ai: {
            basic: {
                order: 10,
                useful: 1,
                value: 5.5,
            },
            result: {
                target: -1.5,
            },
            tag: {
                damage: 1,
            },
        },
    },
    "shangyang_limu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "useCard",
        },
        forced: true,
        filter: function (event) {
            return get.type(event.card) == 'trick';
        },
        content: function () {
            trigger.nowuxie = true;
        },
    },
    "shangyang_kencao": {
        audio: "ext:太虚幻境/audio/skill:true",
        init: function (player) {
            if (!player.storage.shangyang_kencao) player.storage.shangyang_kencao = 0;
        },
        marktext: "功",
        intro: {
            content: "当前有#个“功”标记",
        },
        trigger: {
            global: "damageAfter",
        },
        forced: true,
        filter: function (event, player) {
            return event.source && event.source.group == 'daqin' && event.source.isAlive();
        },
        content: function () {
            if (trigger.source == player) {
                player.markSkill('shangyang_kencao');
                player.storage.shangyang_kencao += trigger.num;
                player.syncStorage('shangyang_kencao');
                game.log(player, '获得了', trigger.num, '个“功”标记');
                if (player.storage.shangyang_kencao >= 3) {
                    game.log(player, '移去了', player.storage.shangyang_kencao, '个“功”标记');
                    player.storage.shangyang_kencao = 0;
                    player.syncStorage('shangyang_kencao');
                    if (player.storage.shangyang_kencao <= 0) player.unmarkSkill('shangyang_kencao');
                    player.gainMaxHp();
                    player.recover();
                }
            } else {
                player.line(trigger.source);
                if (trigger.source.storage.shangyang_kencao == undefined) trigger.source.storage.shangyang_kencao = 0;
                trigger.source.markSkill('shangyang_kencao');
                trigger.source.storage.shangyang_kencao += trigger.num;
                trigger.source.syncStorage('shangyang_kencao');
                game.log(trigger.source, '获得了', trigger.num, '个“功”标记');
                if (trigger.source.storage.shangyang_kencao >= 3) {
                    game.log(trigger.source, '移去了', trigger.source.storage.shangyang_kencao, '个“功”标记');
                    trigger.source.storage.shangyang_kencao = 0;
                    trigger.source.syncStorage('shangyang_kencao');
                    if (trigger.source.storage.shangyang_kencao <= 0) trigger.source.unmarkSkill('shangyang_kencao');
                    trigger.source.gainMaxHp();
                    trigger.source.recover();
                }
            }
        },
    },
    zhangyi_lianheng: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: 'phaseBegin',
        },
        forced: true,
        content: function () {
            var list = game.filterPlayer(function (current) {
                current.removeSkill('zhangyi_lianheng_mark');
                return current.group != 'daqin';
            });
            if (list.length > 1) {
                var target = list.randomGet();
                player.line(target);
                target.addSkill('zhangyi_lianheng_mark');
            }
        },
        group: 'zhangyi_lianheng_init',
        subSkill: {
            mark: {
                charlotte: true,
                mod: {
                    playerEnabled: function (card, player, target) {
                        if (target.group == 'daqin' || _status.kangqinEvent == '合纵连横' && target.isLinked()) return false;
                    }
                },
                marktext: '横',
                mark: true,
                intro: {
                    content: function () {
                        if (_status.kangqinEvent == '合纵连横') return '不能对秦势力角色和已横置的角色使用牌';
                        return '不能对秦势力角色使用牌';
                    },
                },
            },
            init: {
                trigger: {
                    global: 'gameDrawAfter'
                },
                forced: true,
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return current.group != 'daqin';
                    });
                    if (list.length) {
                        var target = list.randomGet();
                        player.line(target);
                        target.addSkill('zhangyi_lianheng_mark');
                    }
                },
            },
        },
    },
    zhangyi_xichu: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            target: 'useCardToTarget'
        },
        forced: true,
        filter: function (event, player) {
            return event.card.name == 'sha' && game.hasPlayer(function (current) {
                return current != player && current != event.player && lib.filter.targetInRange(event.card, event.player,
                    current);
            });
        },
        content: function () {
            'step 0'
            trigger.player.chooseToDiscard('戏楚：弃置一张点数为6的牌，或令' + get.translation(player) + '将此【杀】转移', function (card) {
                return get.number(card) == 6;
            }).ai = function (card) {
                return 100 - get.value(card)
            };
            'step 1'
            if (!result.bool) {
                player.chooseTarget(true, '将此【杀】转移给' + get.translation(trigger.player) + '攻击范围内的一名角色', true, function (card,
                    player, target) {
                    var trigger = _status.event.getTrigger();
                    return target != player && target != trigger.player && !trigger.targets.includes(target) && lib.filter.targetInRange(
                        trigger.card, trigger.player, target)
                }).ai = function (target) {
                    var trigger = _status.event.getTrigger();
                    return get.effect(target, trigger.card, trigger.player, _status.event.player);
                };
            } else event.finish();
            'step 2'
            if (result.bool) {
                player.line(result.targets[0]);
                trigger.targets[trigger.targets.indexOf(player)] = result.targets[0];
            }
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'sha' && !player.countCards('h', {
                        number: '6'
                    }) && game.hasPlayer(function (current) {
                        return current != player && current != target && lib.filter.targetInRange(card, player, current);
                    })) return 'zeroplayertarget';
                },
            },
        },
    },
    zhangyi_xiongbian: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            target: 'useCardToTarget'
        },
        forced: true,
        filter: function (event, player) {
            return get.type(event.card) == 'trick';
        },
        content: function () {
            'step 0'
            player.judge(function (result) {
                if (result.number == 6) return 1;
                return -1;
            }).set('no6', get.attitude(player, trigger.player) > 0);
            'step 1'
            if (result.bool) {
                trigger.getParent().targets.length = 0;
                trigger.getParent().all_excluded = true;
            }
        },
    },
    zhangyi_qiaoshe: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            global: 'judge',
        },
        direct: true,
        content: function () {
            'step 0'
            var card = trigger.player.judging[0];
            var judge0 = trigger.judge(card);
            var judge1 = 0;
            var choice = trigger.no6 && card.number == 6 ? '+1' : 'cancel2';
            var attitude = get.attitude(player, trigger.player);
            var list = [];
            for (var i = -3; i < 4; i++) {
                if (i == 0) continue;
                list.push((i > 0 ? '+' : '') + i);
                if (!trigger.no6) {
                    var judge2 = (trigger.judge({
                        name: get.name(card),
                        suit: get.suit(card),
                        number: get.number(card) + i,
                        nature: get.nature(card),
                    }) - judge0) * attitude;
                    if (judge2 > judge1) {
                        choice = (i > 0 ? '+' : '') + i;
                        judge1 = judge2;
                    }
                }
            }
            list.push('cancel2');
            player.chooseControl(list).set('ai', function () {
                return _status.event.choice;
            }).set('choice', choice).prompt = get.prompt2(event.name);
            'step 1'
            if (result.control != 'cancel2') {
                player.logSkill(event.name, trigger.player);
                game.log(trigger.player, '判定结果点数', '#g' + result.control);
                player.popup(result.control, 'fire');
                if (!trigger.fixedResult) trigger.fixedResult = {};
                if (!trigger.fixedResult.number) trigger.fixedResult.number = get.number(trigger.player.judging[0]);
                trigger.fixedResult.number += parseInt(result.control);
            }
        },
    },
    txshuzhen: {
        audio: 2,
        enable: 'chooseToUse',
        usable: 2,
        filterCard: function (card) {
            return get.color(card) == 'black';
        },
        position: 'hes',
        viewAs: { name: 'tao' },
        viewAsFilter: function (player) {
            if (!player.countCards('hes', { color: 'black' })) return false;
            return true;
        },
        prompt: '将一张黑色牌当桃使用',
        check: function (card) {
            if (_status.event.type == 'dying') return 1 / Math.max(0.1, get.value(card));
            return 4 - get.value(card);
        },
        ai: {
            threaten: 1.5,
        }
    },
    "miyue_zhangzheng": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "phaseBefore",
        },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && current.group != 'daqin';
            });
        },
        content: function () {
            'step 0'
            event.players = game.filterPlayer(function (current) {
                return current != player && current.group != 'daqin';
            }).sortBySeat();
            'step 1'
            if (event.players.length) {
                event.current = event.players.shift();
                player.line(event.current);
                if (event.current.countCards('h')) {
                    event.current.chooseToDiscard('h', '弃置一张手牌或失去一点体力').set('ai', function (card) {
                        return 7 - get.value(card);
                    });
                    event.tempbool = false;
                } else {
                    event.tempbool = true;
                }
            } else {
                event.finish();
            }
            'step 2'
            if (event.tempbool || result.bool == false) {
                event.current.loseHp();
            }
            event.goto(1);
        },
    },
    "miyue_taihou": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            target: "useCardToTargeted",
        },
        forced: true,
        filter: function (event, player) {
            return event.player != player && event.player.sex == 'male' && event.card && (event.card.name == 'sha' || get
                .type(event.card) == 'trick');
        },
        content: function () {
            'step 0'
            player.line(trigger.player);
            var type = get.type(trigger.card);
            var eff = get.effect(player, trigger.card, trigger.player, trigger.player);
            trigger.player.chooseToDiscard('弃置一张' + get.translation(type) + '牌，否则' + get.translation(trigger.card) + '对' +
                get.translation(player) + '无效',
                function (card) {
                    return get.type(card) == type;
                }).set('ai', function (card) {
                    if (_status.event.eff > 0) {
                        return 10 - get.value(card);
                    }
                    return 0;
                }).set('type', type).set('eff', eff);
            'step 1'
            if (!result.bool) {
                trigger.getParent().excluded.add(player);
            }
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (player.sex != "male") return;
                    var type = get.type(card);
                    if (get.name(card) != 'sha' && type != 'trick') return;
                    if (!player.hasCard(function (otherCard) {
                        return otherCard != card && get.type(otherCard) == type &&
                            get.value(otherCard) < 10;
                    })) return 'zeroplayertarget';
                },
            },
        },
    },
    "miyue_youmie": {
        audio: "ext:太虚幻境/audio/skill:true",
        prompt: "出牌阶段限一次，你可以将一张牌交给一名角色，若如此做，直到你的下个回合开始，该角色于其回合外无法使用或打出牌。",
        enable: "phaseUse",
        usable: 1,
        filter: function (event, player) {
            return player.countCards('he') > 0;
        },
        discard: false,
        line: true,
        prepare: "give",
        position: "he",
        filterCard: true,
        filterTarget: true,
        check: function (card) {
            if (get.position(card) == 'e') return -1;
            return 5 - get.value(card);
        },
        content: function () {
            target.gain(cards, player);
            target.addSkill('miyue_youmie_debuff');
        },
        ai: {
            order: 1,
            result: {
                target: function (player, target) {
                    return -1;
                },
            },
        },
        group: ["miyue_youmie_delete"],
        subSkill: {
            debuff: {
                mark: true,
                marktext: "灭",
                mod: {
                    cardEnabled: function (card, player, target) {
                        if (_status.currentPhase != player) return false;
                    },
                    cardUsable: function (card, player, target) {
                        if (_status.currentPhase != player) return false;
                    },
                    cardRespondable: function (card, player, target) {
                        if (_status.currentPhase != player) return false;
                    },
                    cardSavable: function (card, player, target) {
                        if (_status.currentPhase != player) return false;
                    },
                },
                intro: {
                    content: "回合外不能使用或打出卡牌",
                },
                sub: true,
            },
            delete: {
                trigger: {
                    player: "phaseBefore",
                },
                forced: true,
                direct: true,
                popup: false,
                filter: function (event, player) {
                    return game.hasPlayer(function (current) {
                        return current.hasSkill('miyue_youmie_debuff');
                    });
                },
                content: function () {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].hasSkill('miyue_youmie_debuff')) {
                            player.line(game.players[i]);
                            game.players[i].removeSkill('miyue_youmie_debuff');
                        }
                    }
                },
                sub: true,
            },
        },
    },
    "miyue_yintui": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "loseEnd",
        },
        forced: true,
        filter: function (event, player) {
            if (player.countCards('h')) return false;
            for (var i = 0; i < event.cards.length; i++) {
                if (event.cards[i].original == 'h') return true;
            }
            return false;
        },
        content: function () {
            player.turnOver();
        },
        ai: {
            noh: true,
            skillTagFilter: function (player, tag) {
                if (tag == 'noh') {
                    if (player.countCards('h') != 1 || player.isTurnedOver()) return false;
                }
            },
        },
        group: ["miyue_yintui_damage"],
        subSkill: {
            damage: {
                audio: 'miyue_yintui',
                trigger: {
                    player: "damageBegin3",
                },
                forced: true,
                filter: function (event, player) {
                    return player.isTurnedOver();
                },
                content: function () {
                    trigger.num--;
                    player.draw();
                },
                ai: {
                    "maixie": true,
                    skillTagFilter: function (player, tag) {
                        if (tag == 'maixie') {
                            if (!player.isTurnedOver()) return false;
                        }
                    },
                    effect: {
                        target: function (card, player, target) {
                            if (player.hasSkillTag('jueqing')) return;
                            if (target.hujia) return;
                            if (!target.isTurnedOver()) return;
                            if (get.tag(card, 'damage')) return [1, 1];
                        },
                    },
                },
                sub: true,
            },
        },
    },
    "baiqi_wuan": {
        audio: "ext:太虚幻境/audio/skill:true",
        locked: true,
        global: "baiqi_wuan_buff",
        subSkill: {
            buff: {
                mod: {
                    cardUsable: function (card, player, num) {
                        if (player.group == 'daqin' && card.name == 'sha') {
                            return num + game.countPlayer(function (current) {
                                return current.hasSkill('baiqi_wuan')
                            });
                        }
                    },
                },
                sub: true,
            },
        },
    },
    "baiqi_shashen": {
        audio: "ext:太虚幻境/audio/skill:true",
        enable: ["chooseToRespond", "chooseToUse"],
        filterCard: true,
        viewAs: {
            name: "sha",
        },
        viewAsFilter: function (player) {
            if (!player.countCards('h')) return false;
        },
        prompt: "将一张手牌当作【杀】使用或打出",
        check: function (card) {
            return 4 - get.value(card);
        },
        group: ["baiqi_shashen_i"],
        subSkill: {
            i: {
                audio: 'baiqi_shashen',
                trigger: {
                    source: "damageEnd",
                },
                forced: true,
                sub: true,
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha' && player.getHistory('useCard', function (evt) {
                        return evt.card.name == 'sha';
                    }).indexOf(event.getParent('useCard')) == 0;
                },
                content: function () {
                    player.draw();
                },
            },
        },
        ai: {
            skillTagFilter: function (player) {
                if (!player.countCards('h')) return false;
            },
            respondSha: true,
        },
    },
    "baiqi_fachu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            source: "dying",
        },
        forced: true,
        filter: function (event, player) {
            return event.getParent().name == 'damage' && event.player.group != 'daqin';
        },
        content: function () {
            var list = [];
            for (var i = 1; i <= 5; i++) {
                if (trigger.player.isDisabled(i)) continue;
                list.add('equip' + ((i == 3 || i == 4) ? 6 : i));
            }
            if (list.length) {
                player.line(trigger.player);
                var num = list.randomGet();
                trigger.player.disableEquip(num);
                if (num == 'equip6') {
                    trigger.player.disableEquip(3);
                    trigger.player.disableEquip(4);
                }
            } else {
                trigger.player.loseMaxHp().source = player;
            }
        },
    },
    "baiqi_changsheng": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            targetInRange: function (card) {
                if (card.name == 'sha') return true;
            },
        },
        trigger: {
            player: "useCardToTargeted",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && !player.inRange(event.target);
        },
        forced: true,
        content: function () { },
    },
    "qibing_changjian": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            attackFrom: function (from, to, distance) {
                return distance - 1;
            },
        },
        trigger: {
            player: "useCard2",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha';
        },
        forced: true,
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt('qibing_changjian'), '为' + get.translation(trigger.card) + '增加一个目标，或取消并令' +
                get.translation(trigger.card) + '伤害＋1',
                function (card, player, target) {
                    return !_status.event.sourcex.includes(target) && player.canUse('sha', target);
                }).set('sourcex', trigger.targets).set('ai', function (target) {
                    var player = _status.event.player;
                    return get.effect(target, {
                        name: 'sha'
                    }, player, player);
                });
            'step 1'
            if (result.bool) {
                if (!event.isMine() && !_status.connectMode) game.delayx();
                event.target = result.targets[0];
                player.line(event.target);
                trigger.targets.push(event.target);
            } else {
                if (!trigger.baseDamage) ttrigger.baseDamage = 1;
                trigger.baseDamage++;
            }
        },
    },
    "qibing_liangju": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "useCardToPlayered",
        },
        forced: true,
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        content: function () {
            "step 0"
            trigger.target.judge(function (card) {
                return (get.suit(card) == 'spade') ? -2 : 0;
            });
            "step 1"
            if (result.judge < 0) {
                trigger.getParent().directHit.add(trigger.target);
            }
        },
        group: ["qibing_liangju_judge"],
        subSkill: {
            judge: {
                audio: 'qibing_liangju',
                trigger: {
                    target: "useCardToTargeted",
                },
                filter: function (event, player) {
                    if (event.player == player) return false;
                    if (event.card.name == 'sha') return true;
                    return false;
                },
                forced: true,
                content: function () {
                    "step 0"
                    player.judge(function (card) {
                        return (get.suit(card) == 'heart') ? 2 : -1;
                    });
                    "step 1"
                    if (result.judge > 0) {
                        trigger.getParent().excluded.add(player);
                    }
                },
                sub: true,
            },
        },
    },
    //龙羽飞
    txlongyi: {
        enable: ['chooseToUse', 'chooseToRespond'],
        usable: 2,
        filter: function (event, player) {
            if (event.type == 'wuxie') return false;
            var hs = player.getCards('h');
            if (!hs.length) return false;
            for (var i of hs) {
                if (game.checkMod(i, player, 'unchanged', 'cardEnabled2', player) === false) return false;
            }
            for (var i of lib.inpile) {
                if (i != 'du' && get.type(i) == 'basic' && event.filterCard({ name: i, cards: hs }, player, event)) return true;
                if (i == 'sha') {
                    var list = ['fire', 'thunder', 'ice'];
                    for (var j of list) {
                        if (event.filterCard({ name: i, nature: j, cards: hs }, player, event)) return true;
                    }
                }
            }
            return false;
        },
        chooseButton: {
            dialog: function (event, player) {
                var vcards = [], hs = player.getCards('h');
                for (var i of lib.inpile) {
                    if (i != 'du' && get.type(i) == 'basic' && event.filterCard({ name: i, cards: hs }, player, event)) vcards.push(['基本', '', i]);
                    if (i == 'sha') {
                        for (var j of lib.inpile_nature) {
                            if (event.filterCard({ name: i, nature: j, cards: hs }, player, event)) vcards.push(['基本', '', i, j]);
                        }
                    }
                }
                return ui.create.dialog('龙裔', [vcards, 'vcard']);
            },
            check: function (button, player) {
                if (_status.event.getParent().type != 'phase') return 1;
                return _status.event.player.getUseValue({ name: button.link[2], nature: button.link[3] });
            },
            backup: function (links, player) {
                return {
                    audio: 'longyi',
                    popname: true,
                    viewAs: { name: links[0][2], nature: links[0][3] },
                    filterCard: true,
                    selectCard: -1,
                    position: 'h',
                }
            },
            prompt: function (links, player) {
                return '将所有手牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用或打出';
            }
        },
        hiddenCard: function (player, name) {
            return name != 'du' && get.type(name) == 'basic' && player.countCards('h') > 0;
        },
        ai: {
            respondSha: true,
            respondShan: true,
            skillTagFilter: function (player) {
                return player.countCards('h') > 0;
            },
            order: 0.5,
            result: {
                player: function (player) {
                    if (_status.event.dying) {
                        return get.attitude(player, _status.event.dying);
                    }
                    if (_status.event.type == 'respondShan') return 1;
                    var val = 0, hs = player.getCards('h'), max = 0;
                    for (var i of hs) {
                        val += get.value(i, player);
                        if (get.type(i, player) == 'trick') max += 5;
                    }
                    if (player.hasSkill('zhenjue')) max += 7;
                    return val <= max ? 1 : 0;
                },
            },
        },
        group: 'txlongyi_effect',
        subSkill: {
            effect: {
                trigger: { player: ['useCard', 'respond'] },
                forced: true,
                charlotte: true,
                popup: false,
                filter: function (event, player) {
                    if (event.skill != 'txlongyi_backup') return false;
                    for (var i of event.cards) {
                        var type = get.type2(i, player);
                        if (type == 'equip' || type == 'trick') return true;
                    }
                    return false;
                },
                content: function () {
                    var map = {};
                    for (var i of trigger.cards) {
                        map[get.type2(i, player)] = true;
                    }
                    if (map.trick) player.draw();
                    if (map.equip && trigger.directHit) trigger.directHit.addArray(game.players);
                },
            },
            backup: {},
        },
    },
    //以下代码全部搬运自【RE:英雄杀】扩展!
    txrenwang: {
        selectCard: 2,
        audio: "ext:太虚幻境/audio/skill:true",
        enable: "phaseUse",
        usable: 1,
        filter: function (event, player) {
            return player.countCards('he') > 1;
        },
        filterTarget: function (card, player, target) {
            return player != target && target.countCards('h') > player.countCards('h');
        },
        filterCard: true,
        position: "he",
        content: function () {
            player.draw(target.countCards('h') - player.countCards('h'));
        },
        check: function (card) { return 8 - get.value(card) },
        ai: {
            order: 2,
            result: {
                player: function (player) {
                    if (player.countCards('he') < 3) return 4;
                    return 1;
                },
                target: function (player, target) {
                    if (target.countCards('h') + 2 > player.countCards('h') - 2) return 5;

                    if (target.countCards('h') > player.countCards('h')) return 2;
                    return 0;
                },
            },
            threaten: 0.3,
        },
    },
    txshiwei: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            global: "loseAfter",
        },
        check: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        filter: function (event, player) {
            if (event.player.countCards('h')) return false;
            if (event.player == player) return false;
            if (!event.player.isAlive()) return false;
            return event.hs && event.hs.length > 0;
        },
        content: function () {
            player.line(trigger.player, 'green');
            trigger.player.addSkill('txshiwei2');
            trigger.player.addToExpansion(get.cards(), 'gain2').gaintag.add('txshiwei2');
        },
        ai: {
            threaten: 1.1,
        },
    },
    txshiwei2: {
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        charlotte: true,
        forced: true,
        silent: true,
        onremove: function (player, skill) {
            var cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
        },
        trigger: { player: 'phaseBegin' },
        content: function () {
            player.skip('phaseUse');
            player.removeSkill('txshiwei2');
        },
    },
    "txhunpofu": {
        audio: "ext:太虚幻境/audio/skill:2",
        trigger: {
            source: "damageBegin1",
        },
        forced: true,
        filter: function (event, player) {
            return player.isDamaged() && event.card && (event.card.name == 'sha' || event.card.name == 'juedou');
        },
        content: function () {
            trigger.num++;
        },
    },
    "txhongmen": {
        audio: "ext:太虚幻境/audio/skill:2",
        trigger: { player: 'phaseZhunbeiBegin' },
        filter: function (event, player) {
            return player.isDamaged();
        },
        direct: true,
        content: function () {
            'step 0'
            event.num = player.maxHp - player.hp; player.chooseTarget(get.prompt('txhongmen'), '令一名其他角色弃置' + get.cnNumber(event.num, true) + '张牌', function (card, player, target) {
                return player != target;
            }, function (target) {
                var att = get.attitude(_status.event.player, target);
                return -att;
            });
            'step 1'
            if (result.bool) {
                player.logSkill('txhongmen', result.targets[0]);
                result.targets[0].chooseToDiscard(event.num, true, 'he');
            }
            else {
                event.finish();
            }
        },
        ai: {
            threaten: 1.2,
            expose: 0.4,
        },
    },
    /*合纵抗秦2*/
    "lvbuwei_jugu": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            maxHandcard: function (player, num) {
                return num + player.maxHp;
            },
        },
        trigger: {
            global: "gameDrawAfter",
            player: "enterGame",
        },
        forced: true,
        content: function () {
            player.draw(player.maxHp);
        },
    },
    "lvbuwei_qihuo": {
        audio: "ext:太虚幻境/audio/skill:true",
        enable: "phaseUse",
        usable: 1,
        delay: 0,
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        content: function () {
            'step 0'
            event.list = [];
            event.cardNum = [];
            var hs = player.getCards('h');
            for (var i = 0; i < hs.length; i++) {
                var card = hs[i];
                if (event.list.includes(get.type(card, 'trick'))) {
                    event.cardNum[event.list.indexOf(get.type(card, 'trick'))]++;
                    continue;
                }
                event.list.push(get.type(card, 'trick'));
                event.cardNum.push(1);
            }
            'step 1'
            player.chooseControl(event.list, function (event, player) {
                return event.list[event.cardNum.indexOf(Math.max.apply(null, event.cardNum))] || event.list.randomGet();
            }).prompt = "奇货：请选择一种类别";
            'step 2'
            var cards = player.getCards('h', function (card) {
                return get.type(card, 'trick') == result.control;
            });
            player.discard(cards);
            player.draw(cards.length * 2);
        },
        ai: {
            order: 1,
            result: {
                player: 4,
            },
            threaten: 1.55,
        },
    },
    "lvbuwei_chunqiu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: ['useCard', 'respond']
        },
        filter: function (event, player) {
            var list = ['useCard', 'respond'];
            list.remove(event.name);
            return player.getHistory(event.name)[0] == event && !player.getHistory(list[0].length);
        },
        content: function () {
            player.draw();
        },
    },
    "lvbuwei_baixiang": {
        audio: "ext:太虚幻境/audio/skill:true",
        skillAnimation: true,
        animationColor: "thunfer",
        unique: true,
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        forced: true,
        filter: function (event, player) {
            return player.countCards('h') >= player.hp * 3 && !player.storage.lvbuwei_baixiang;
        },
        derivation: ["lvbuwei_zhongfu"],
        content: function () {
            'step 0'
            player.storage.lvbuwei_baixiang = true;
            player.awakenSkill('lvbuwei_baixiang');
            'step 1'
            var num = player.maxHp - player.hp;
            if (num > 0) player.recover(num);
            player.addSkill('lvbuwei_zhongfu');
            game.log(player, '获得了技能〖仲父〗')
        },
        ai: {
            maixie: true,
            skillTagFilter: function (player, tag) {
                if (tag == 'maixie') {
                    if (player.storage.lvbuwei_baixiang || player.countCards('h') < player.hp * 3 || player.hp < 3) return false;
                }
            },
            effect: {
                target: function (card, player, target) {
                    if (target.storage.lvbuwei_baixiang || !get.tag(card, 'damage')) return;
                    var num = (target.hp - get.tag(card, 'damage')) * 3;
                    if (num > 0 && target.countCards('h') >= num) return [0.5, 1];
                },
            },
        },
    },
    "lvbuwei_zhongfu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "phaseBefore",
        },
        forced: true,
        content: function () {
            var skill = ['new_rejianxiong', 'rerende', 'rezhiheng'].randomGet();
            player.addTempSkill(skill, {
                player: "phaseBefore"
            });
            game.log(player, '获得了技能', '〖', skill, '〗');
        },
    },
    "zhaoji_shanwu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: "useCardToPlayered",
        },
        forced: true,
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                return (get.color(card) == 'black') ? 2 : 0;
            });
            "step 1"
            if (result.judge > 0) {
                trigger.getParent().directHit.add(trigger.target);
            }
        },
        ai: {
            effect: {
                player: function (card, player, target, current) {
                    if (get.name(card) != 'sha' || get.attitude(player, target) > 0) return;
                    if (target.hasSkillTag('respondShan')) return [1.2, 0];
                }
            },
        },
        group: ["zhaoji_shanwu_judge"],
        subSkill: {
            judge: {
                audio: 'zhaoji_shanwu',
                trigger: {
                    target: "useCardToTargeted",
                },
                filter: function (event, player) {
                    if (event.player == player) return false;
                    if (event.card.name == 'sha') return true;
                    return false;
                },
                forced: true,
                content: function () {
                    "step 0"
                    player.judge(function (card) {
                        return (get.color(card) == 'red') ? 2 : 0;
                    });
                    "step 1"
                    if (result.judge > 0) {
                        trigger.getParent().excluded.add(player);
                    }
                },
                sub: true,
                ai: {
                    effect: {
                        target: function (card, player, target, current) {
                            if (get.name(card) == 'sha') return [0.5, 0];
                        }
                    },
                },
            },
        },
    },
    "zhaoji_daqi": {
        audio: "ext:太虚幻境/audio/skill:true",
        init: function (player) {
            if (!player.storage.zhaoji_daqi) player.storage.zhaoji_daqi = 0;
        },
        marktext: "期",
        intro: {
            content: "当前有#个“期”标记",
        },
        trigger: {
            player: "phaseBefore",
        },
        forced: true,
        filter: function (event, player) {
            return player.storage.zhaoji_daqi != Infinity && player.storage.zhaoji_daqi >= 10;
        },
        content: function () {
            game.log(player, '失去了', player.storage.zhaoji_daqi, '个“期”标记');
            player.storage.zhaoji_daqi = 0;
            player.syncStorage('zhaoji_daqi');
            player.unmarkSkill('zhaoji_daqi');
            var hp = player.maxHp - player.hp;
            var card = player.maxHp - player.countCards('h');
            if (hp > 0) player.recover(hp);
            if (card > 0) player.draw(card);
            player.storage.zhaoji_huoluan = true;
        },
        group: ["zhaoji_daqi_damage", "zhaoji_daqi_card"],
        subSkill: {
            damage: {
                trigger: {
                    player: "damageAfter",
                    source: "damageSource",
                },
                audio: 'zhaoji_daqi',
                forced: true,
                content: function () {
                    player.storage.zhaoji_daqi += trigger.num;
                    player.markSkill('zhaoji_daqi');
                    game.log(player, '获得了', trigger.num, '个“期”标记');
                    player.syncStorage('zhaoji_daqi');
                },
                sub: true,
            },
            card: {
                audio: 'zhaoji_daqi',
                trigger: {
                    player: ["useCard", "respond"],
                },
                forced: true,
                content: function () {
                    player.storage.zhaoji_daqi++;
                    player.markSkill('zhaoji_daqi');
                    game.log(player, '获得了1个“期”标记');
                    player.syncStorage('zhaoji_daqi');
                },
                sub: true,
            },
        },
    },
    "zhaoji_xianji": {
        audio: "ext:太虚幻境/audio/skill:true",
        init: function (player) {
            player.storage.nzry_dinghuo = false;
        },
        intro: {
            content: "limited",
        },
        unique: true,
        mark: true,
        skillAnimation: true,
        animationColor: "thunder",
        enable: "phaseUse",
        filter: function (event, player) {
            return !player.storage.zhaoji_xianji && player.storage.zhaoji_daqi > 0;
        },
        check: function (event, player) {
            var hp = player.maxHp - player.hp;
            var card = 3 - player.countCards('he');
            if ((hp + card) > 0) return true;
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('zhaoji_xianji');
            player.storage.zhaoji_xianji = true;
            'step 1'
            var hs = player.getCards('he');
            if (hs.length) player.discard(hs);
            game.log(player, '失去了', player.storage.zhaoji_daqi, '个“期”标记');
            player.storage.zhaoji_daqi = 0;
            player.syncStorage('zhaoji_daqi');
            player.unmarkSkill('zhaoji_daqi');
            player.loseMaxHp();
            'step 2'
            var hp = player.maxHp - player.hp;
            var card = player.maxHp - player.countCards('h');
            if (hp > 0) player.recover(hp);
            if (card > 0) player.draw(card);
            player.storage.zhaoji_huoluan = true;
        },
        ai: {
            order: 1,
            result: {
                player: function (player, target) {
                    var hp = player.maxHp - player.hp;
                    var card = player.maxHp - player.countCards('h');
                    return 0 + hp + card;
                },
            },
        },
    },
    "zhaoji_huoluan": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: ["zhaoji_daqiAfter", "zhaoji_xianjiAfter"],
        },
        forced: true,
        content: function () {
            'step 0'
            event.targets = game.filterPlayer();
            event.targets.remove(player);
            event.targets.sort(lib.sort.seat);
            player.line(event.targets);
            event.targets2 = event.targets.slice(0);
            'step 1'
            if (event.targets2.length) {
                event.targets2.shift().damage('nocard');
                event.redo();
            }
        },
    },
    txshangnu: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: ["phaseZhunbeiBegin", "damageEnd"],
        },
        forced: true,
        filter: function (event, player) {
            return !player.getEquip('qinnu');
        },
        content: function () {
            if (trigger.name == 'phaseZhunbei') {
                player.useCard(game.createCard('qinnu', 'club', 2), player);
            }
            else {
                player.draw(1);
            }
        },
    },
    zhaogao_zhilu: {
        audio: "ext:太虚幻境/audio/skill:true",
        group: 'zhaogao_zhilu2',
        enable: ['chooseToUse', 'chooseToRespond'],
        viewAs: {
            name: 'sha'
        },
        filterCard: {
            color: 'black'
        },
        check: function (card) {
            return 1 / (get.value(card) || 0.5)
        },
        viewAsFilter: function (player) {
            return player.countCards('h', {
                color: 'black'
            }) > 0;
        },
        ai: {
            respondSha: true,
            skillTagFilter: function (player) {
                return player.countCards('h', {
                    color: 'black'
                }) > 0;
            },
        },
    },
    zhaogao_zhilu2: {
        audio: 'zhaogao_zhilu',
        enable: ['chooseToUse', 'chooseToRespond'],
        viewAs: {
            name: 'shan'
        },
        filterCard: {
            color: 'red'
        },
        check: function (card) {
            return 1 / (get.value(card) || 0.5)
        },
        viewAsFilter: function (player) {
            return player.countCards('h', {
                color: 'red'
            }) > 0;
        },
        ai: {
            respondShan: true,
            skillTagFilter: function (player) {
                return player.countCards('h', {
                    color: 'red'
                }) > 0;
            },
        },
    },
    zhaogao_gaizhao: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            target: 'useCardToTarget'
        },
        direct: true,
        filter: function (event, player) {
            if (get.info(event.card).multitarget) return false;
            var type = get.type(event.card);
            var name = get.name(event.card);
            if (name != 'sha' && type != 'trick') return false;
            return game.hasPlayer(function (current) {
                return current != player && current.group == 'daqin' && !event.targets.includes(current);
            });
        },
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt(event.name), '将' + get.translation(trigger.card) + '转移给其他秦势力角色', function (card,
                player, target) {
                var trigger = _status.event.getTrigger();
                return target.group == 'daqin' && !trigger.targets.includes(target) && lib.filter.targetEnabled2(trigger.card,
                    trigger.player, target);
            }).set('rawEffect', get.effect(player, trigger.card, trigger.player, player))
                .ai = function (target) {
                    var trigger = _status.event.getTrigger();
                    var rawEffect = _status.event.rawEffect;
                    var effectTarget = 0.1 + get.effect(target, trigger.card, trigger.player, _status.event.player);
                    return effectTarget - rawEffect;
                };
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill(event.name, target);
                trigger.targets[trigger.targets.indexOf(player)] = target;
            }
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (get.attitude(player, target) > 0 || _status.gaizhaoEffect) return;
                    if (get.name(card) != 'sha' && get.type(card) != 'trick') return;
                    if (get.info(card).multitarget || get.info(card).selectTarget == -1) return;
                    var players = game.filterPlayer(function (current) {
                        return current != target && current.group == 'daqin';
                    });
                    if (!players.length) return;
                    _status.gaizhaoEffect = true;
                    for (var i = 0; i < players.length; i++) {
                        //console.log(`${ lib.translate[player.name] }视角，${lib.translate[card.name]}对${lib.translate[players[i].name]}的效果为${get.effect(players[i], card, player, player)}`)
                        if (get.effect(players[i], card, player, player) <= 0) {
                            delete _status.gaizhaoEffect;
                            return 'zeroplayertarget';
                        }
                    }
                    delete _status.gaizhaoEffect;
                }
            },
        }
    },
    zhaogao_haizhong: {
        global: 'zhaogao_haizhong_debuff',
        audio: "ext:太虚幻境/audio/skill:true",
        intro: {
            content: 'mark',
        },
        trigger: {
            global: 'recoverAfter'
        },
        forced: true,
        filter: function (event, player) {
            return event.player.group != 'daqin' && event.player.isAlive();
        },
        logTarget: 'player',
        content: function () {
            'step 0'
            if (!trigger.player.storage[event.name]) trigger.player.storage[event.name] = 0;
            trigger.player.storage[event.name]++;
            event.num = Math.max(1, trigger.player.storage[event.name]);
            trigger.player.markSkill(event.name);
            if (_status.dying.length) return event.finish();
            trigger.player.chooseToDiscard('害忠：弃置一张红色牌，或受到' + event.num + '点伤害', {
                color: 'red'
            }).ai = function (card) {
                var trigger = _status.event.getTrigger();
                var value = get.value(card);
                if (trigger.player.hp <= 0 && value > 0) return 100 - get.value(card);
                return 9 - value;
            };
            'step 1'
            if (!result.bool) {
                if (trigger.player.hp <= num) trigger.player.addTempSkill('zhaogao_haizhong_dying', 'damageAfter');
                trigger.player.damage(num);
            }
        },
        subSkill: {
            dying: {
                charlotte: true,
                ai: {
                    effect: {
                        target: function (card, player, target) {
                            if (get.name(card) == 'tao' && player != target) return 'zeroplayertarget';
                        },
                    },
                },
            },
            debuff: {
                ai: {
                    effect: {
                        player: function (card, player, target) {
                            if (player.group == 'daqin' || ['tao', 'jiu'].includes(get.name(card)) == false || target != player)
                                return;
                            if (get.name(card) == 'jiu' && !player.isDying()) return;
                            if (!player.hasCard(function (otherCard) {
                                return otherCard != card && get.color(otherCard) == 'red';
                            })) return 'zeroplayertarget';
                        },
                        target: function (card, player, target) {
                            if (target.group == 'daqin' || get.name(card) != 'tao' || player == target) return;
                            if (!target.countCards('h')) return 'zeroplayertarget';
                        },
                    },
                },
            },
        }
    },
    zhaogao_aili: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: 'phaseUseBegin'
        },
        forced: true,
        content: function () {
            var list = [];
            for (var i = 0; i < 2; i++) {
                var cardx = get.cardPile2(function (card) {
                    return get.type(card) == 'trick' && !list.includes(card)
                });
                if (cardx) list.push(cardx);
            }
            if (list.length) player.gain(list, 'draw');
        },
    },
    "yingzheng_yitong": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            targetInRange: function (card) {
                if (card.name == 'sha' || card.name == 'shunshou') return true;
            },
        },
        trigger: {
            player: ['useCard2', 'useCardToPlayer']
        },
        forced: true,
        filter: function (event, player) {
            if (!['shunshou', 'guohe', 'sha', 'huogong'].includes(event.card.name)) return false;
            return game.hasPlayer(function (current) {
                return current.group != 'daqin' && !event.targets.includes(current);
            });
        },
        content: function () {
            trigger.targets.addArray(game.filterPlayer(function (current) {
                return current.group != 'daqin' && !trigger.targets.includes(current);
            }));
            player.line(trigger.targets);
        },
    },
    "yingzheng_shihuang": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            global: "phaseAfter",
        },
        forced: true,
        filter: function (event, player) {
            var num = game.roundNumber / 100 * 6;
            if (num > 1) num = 1;
            return event.player != player && Math.random() <= num;
        },
        content: function () {
            player.insertPhase();
        },
    },
    "yingzheng_fenshu": {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            global: "useCard",
        },
        forced: true,
        filter: function (event, player) {
            if (event.player == _status.currentPhase && event.player.group != 'daqin' && get.type(event.card) == 'trick') {
                return event.player.getHistory('useCard', function (card) {
                    return get.type(card.card) == 'trick';
                }).indexOf(event) == 0;
            }
            return false;
        },
        content: function () {
            trigger.targets.length = 0;
            trigger.all_excluded = true;
        },
    },
    txkqzulong: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            player: ["phaseZhunbeiBegin", "damageEnd"],
        },
        group: 'txkqzulong1',
        forced: true,
        filter: function (event, player) {
            return !player.getEquip('zhenlongchangjian');
        },
        content: function () {
            if (trigger.name == 'phaseZhunbei') {
                player.useCard(game.createCard('zhenlongchangjian', 'spade', 7), player);
            }
            else {
                player.draw(1);
            }
        },
    },
    txkqzulong1: {
        trigger: {
            player: ["phaseZhunbeiBegin", "damageEnd"],
        },
        forced: true,
        filter: function (event, player) {
            return !player.getEquip('chuanguoyuxi');
        },
        content: function () {
            if (trigger.name == 'phaseZhunbei') {
                player.useCard(game.createCard('chuanguoyuxi', 'diamond', 13), player);
            }
            else {
                player.draw(0);
            }
        },
    },
    txxinchao: {
        audio: "ext:太虚幻境/audio/skill:4",
        trigger: {
            player: 'phaseZhunbeiBegin'
        },
        unique: true,
        content: function () {
            "step 0"
            event.players = get.players(player);
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                if (current.isEnemyOf(player)) {
                    player.line(current, 'poison');
                    current.damage(2, 'poison');
                }
                event.redo();
            }
        },
        ai: {
            threaten: 2
        }
    },
    txxinli: {
        audio: 2,
        trigger: { global: 'dieAfter' },
        forced: true,
        content: function () {
            player.gainMaxHp(2);
            player.recover(2);
            player.draw();
        },
        ai: {
            threaten: 1.5
        },
    },
    spjianqu1: {
        trigger: { player: 'dying' },
        check: function (event, player) {
            if (get.attitude(player, event.player) < 4) return false;
            if (player.countCards('h', function (card) {
                var mod2 = game.checkMod(card, player, 'unchanged', 'cardEnabled2', player);
                if (mod2 != 'unchanged') return mod2;
                var mod = game.checkMod(card, player, event.player, 'unchanged', 'cardSavable', player);
                if (mod != 'unchanged') return mod;
                var savable = get.info(card).savable;
                if (typeof savable == 'function') savable = savable(card, player, event.player);
                return savable;
            }) >= 1 - event.player.hp) return false;
            if (event.player == player || event.player == get.zhu(player)) return true;
            if (_status.currentPhase && get.damageEffect(_status.currentPhase, player, player) < 0) return false;
            return !player.hasUnknown();
        },
        filter: function (event, player) {
            return event.player.hp <= 0;
        },
        logTarget: 'player',
        content: function () {
            /*		'step 0'
                    var hs=player.getCards('h')
                    if(hs.length) player.discard(hs);*/
            'step 0'
            var num = 1 - trigger.player.hp;
            if (num) trigger.player.recover(num);
        },
    },
    spjianqu: {
        audio: "ext:太虚幻境/audio/skill:3",
        trigger: { player: 'damageBegin3' },
        forced: true,
        preHidden: true,
        group: 'spjianqu1',
        filter: function (event, player) {
            return event.num > 0 && event.source;
        },
        content: function () {
            trigger.num--;
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (player.hasSkillTag('jueqing', false, target)) return;
                    if (!player.isUnseen(2)) return;
                    var num = get.tag(card, 'damage');
                    if (num) {
                        if (num > 1) return 0.5;
                        return 0;
                    }
                }
            }
        },
    },
    /*复活侯备技*/
    txhouyuana: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuana = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuana) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuana');
            player.storage.txhouyuana = true;
            player.discard(player.getCards('hj'));
            'step 1'
            player.uninit();
            player.init('txhj_yufan');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuana) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuana) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    txhouyuanb: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuanb = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuanb) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuanb');
            player.storage.txhouyuanb = true;
            player.discard(player.getCards('hj'));
            'step 1'
            player.uninit();
            player.init('txhj_xuezong');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuanb) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuanb) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    txcbwuyou: {
        audio: 1,
        trigger: {
            player: "phaseDrawBefore",
        },
        forced: true,
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了摸牌阶段');
        },
    },
    "txbaoji": {
        trigger: {
            source: 'damageBegin1',
        },
        filter: function (event, player) {
            //醉酒改动一下，就OK。默认概率80%触发。如果选项里开启了幸运星模式则百分百触发。
            return get.isLuckyStar(player) || (event.card && event.getRand() < 0.8);
        },
        forced: true,
        content: function () {
            trigger.num++;
        },
        ai: {
            damageBonus: true
        },
    },
    txhj_zhennu: {
        audio: "zhennu",
        trigger: {
            player: 'phaseZhunbeiBegin'
        },
        unique: true,
        content: function () {
            "step 0"
            event.players = get.players(player);
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                if (current.isEnemyOf(player)) {
                    player.line(current, 'poison');
                    current.damage(1, 'poison');
                }
                event.redo();
            }
        },
        ai: {
            threaten: 2
        }
    },
    /*千里走单骑*/
    //以下技能代码全部搬运自【活动BOSS】扩展，感谢其作者“烟雨墨染”大佬的技能创作书写!
    qianli_tingqiang: {
        trigger: {
            source: 'damageBegin1',
        },
        filter: function (event, player) {
            return event.player.countCards('h') > 0 && (event.player.countCards('h', { color: 'red' }) == 0 || event.player.countCards('h', { color: 'black' }) == 0);
        },
        forced: true,
        content: function () {
            trigger.num++;
        }
    },
    "danji_shili": {
        trigger: {
            player: ["phaseUseBegin", "phaseDiscardBegin"],
        },
        direct: true,
        audio: "ext:太虚幻境/audio/skill:true",
        content: function () {
            "step 0"
            player.chooseToDiscard(get.prompt('danji_shili'), '弃置一张手牌令所有敌方角色弃置所有同花色的手牌。', 'h').set('ai', function (card) {
                return 9 - get.value(card);
            }).logSkill = 'danji_shili';
            "step 1"
            if (result.bool) {
                var suit = get.suit(result.cards[0]);
                game.countPlayer(function (current) {
                    if (current != player && player.getEnemies().includes(current)) {
                        var hs = current.getCards('h', { suit: suit });
                        if (hs.length) {
                            current.discard(hs);
                        }
                    }
                })
            }
        },
        ai: {
            expose: 0.2
        },
    },
    "qianli_yangbai": {
        init: function (player) {
            if (!player.storage.qianli_yangbai) player.storage.qianli_yangbai = 0;
        },
        trigger: {
            global: "phaseEnd",
        },
        group: ["qianli_yangbai_damage"],
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return event.player.isAlive() && event.player != player && !player.inRangeOf(event.player) && player.getEnemies().includes(event.player);
        },
        forced: true,
        content: function () {
            trigger.player.damage(2);
            var e1 = trigger.player.getEquip(1);
            if (trigger.player.getEquip(1)) trigger.player.discard(e1, 'notBySelf');
        },
        subSkill: {
            xiaoguo: {
                marktext: "佯败",
                mod: {
                    globalFrom: function (from, to, distance) {
                        if (from.storage.qianli_yangbai_xiaoguo2.includes(to)) return distance + from.countMark("qianli_yangbai_xiaoguo");
                    },
                },
                intro: {
                    name: "佯败",
                    content: function (storage, player, skill) {
                        return "与" + get.translation(player.storage.qianli_yangbai_xiaoguo2) + "计算距离时+" + player.storage.qianli_yangbai_xiaoguo + "";
                    },
                },
                direct: true,
                unique: true,
                forced: true,
                popup: false,
                onremove: function (player) {
                    player.removeMark("qianli_yangbai_xiaoguo", player.countMark("qianli_yangbai_xiaoguo"));
                    player.unmarkSkill("qianli_yangbai_xiaoguo");
                    delete player.storage.qianli_yangbai_xiaoguo2;
                },
                sub: true,
            },
            damage: {
                trigger: {
                    player: "damageEnd",
                },
                filter: function (event, player) {
                    return event.source && event.source != player && event.card && event.card.name == 'sha' && player.getEnemies().includes(event.source);
                },
                forced: true,
                logTarget: "source",
                audio: "qianli_yangbai",
                content: function () {
                    if (!trigger.source.hasSkill("qianli_yangbai_xiaoguo")) trigger.source.addTempSkill("qianli_yangbai_xiaoguo");
                    trigger.source.addMark("qianli_yangbai_xiaoguo");
                    if (!trigger.source.storage.qianli_yangbai_xiaoguo2) trigger.source.storage.qianli_yangbai_xiaoguo2 = [];
                    if (!trigger.source.storage.qianli_yangbai_xiaoguo2.includes(player)) trigger.source.storage.qianli_yangbai_xiaoguo2.push(player);
                    trigger.source.markSkill("qianli_yangbai_xiaoguo");
                    trigger.source.updateMarks("qianli_yangbai_xiaoguo");
                },
                sub: true,
            },
        },
        ai: { expose: 0.2 },
    },
    "qianli_xili": {
        trigger: {
            global: "damageBegin1",
        },
        direct: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return event.source && event.source != player && event.source == _status.currentPhase && event.source.hasSkill('qianli_xili') && !event.player.hasSkill('qianli_xili') && player.countCards('he') > 0 && !player.hasSkill('qianli_xili2');
        },
        content: function () {
            'step 0'
            player.chooseToDiscard('是否弃置一张牌，令' + get.translation(trigger.source) + '对' + get.translation(trigger.player) + '的伤害+1，且你与其各摸两张牌？', 'he').set('logSkill', ['qianli_xili', trigger.player]).ai = function (card) {
                return 9 - get.value(card);
            };
            'step 1'
            if (result.bool) {
                game.asyncDraw([trigger.source, player], 2);
                trigger.num++;
                player.addTempSkill('qianli_xili2');
            }
            else event.finish();
            'step 2'
            game.delayx();
        },
    },
    "qianli_xili2": {
        charlotte: true,
    },
    "danji_xianfeng": {
        global: "danji_xianfeng_distance",
        locked: true,
        ai: {
            threaten: 2.7,
        },
        subSkill: {
            distance: {
                mod: {
                    globalTo: function (from, to, distance) {
                        if (game.hasPlayer(function (current) {
                            return current.hasSkill('danji_xianfeng') && current != to && current.getFriends().includes(to) && current.getEnemies().includes(from);
                        })) return distance + 1;
                    },
                },
                sub: true,
            },
        },
    },
    "danji_anjian": {
        trigger: {
            player: "useCardToPlayered",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return event.card.name == 'sha' && !event.target.inRange(player);
        },
        logTarget: "target",
        content: function () {
            trigger.getParent().reanjian_buffed = true;
            var map = trigger.customArgs;
            var id = trigger.target.playerid;
            if (!map[id]) map[id] = {};
            if (!map[id].extraDamage) map[id].extraDamage = 0;
            map[id].extraDamage++;
            trigger.target.addTempSkill('danji_anjian2');
            trigger.target.addTempSkill('danji_anjian4');
            trigger.target.storage.danji_anjian2.add(trigger.card);
        },
        ai: {
            "unequip_ai": true,
            skillTagFilter: function (player, tag, arg) {
                if (arg && arg.name == 'sha' && arg.target && !arg.target.inRange(player)) return true;
                return false;
            },
        },
    },
    "danji_anjian2": {
        firstDo: true,
        ai: {
            "unequip2": true,
        },
        init: function (player, skill) {
            if (!player.storage[skill]) player.storage[skill] = [];
        },
        onremove: true,
        trigger: {
            player: ["damage", "damageCancelled", "damageZero"],
            target: ["shaMiss", "useCardToExcluded"],
        },
        charlotte: true,
        filter: function (event, player) {
            return player.storage.danji_anjian2 && event.card && player.storage.danji_anjian2.includes(event.card);
        },
        direct: true,
        forced: true,
        popup: false,
        priority: 12,
        content: function () {
            player.storage.danji_anjian2.remove(trigger.card);
            if (!player.storage.danji_anjian2.length) player.removeSkill('danji_anjian2');
        },
    },
    "danji_anjian3": {
        mod: {
            cardSavable: function (card) {
                if (card.name == 'tao') return false;
            },
        },
    },
    "danji_anjian4": {
        trigger: {
            player: "dyingBegin",
        },
        forced: true,
        direct: true,
        firstDo: true,
        filter: function (event, player) {
            return event.getParent(2).reanjian_buffed = true;
        },
        content: function () {
            player.addTempSkill('danji_anjian3', { global: ['dyingEnd', 'phaseEnd'] });
        },
        popup: false,
    },
    qianli_wangong: {
        enable: 'chooseToUse',
        mod: {
            cardUsable: function (card, player, num) {
                if (card.storage && card.storage.qianli_wangong) return Infinity;
            },
            targetInRange: function (card) {
                if (card.storage && card.storage.qianli_wangong) return true;
            },
        },
        viewAsFilter: function (player) {
            return player.hasCard(function (card) {
                return get.type(card) == 'equip';
            }, 'ehs');
        },
        position: 'hes',
        filterCard: { type: 'equip' },
        viewAs: {
            name: 'sha',
            storage: { qianli_wangong: true },
        },
        check: function (card) {
            return 6 - get.value(card);
        },
        ai: {
            respondSha: true,
            skillTagFilter: function (player) {
                return player.hasCard(function (card) {
                    return get.type(card) == 'equip';
                }, 'ehs');
            },
        },
        group: 'qianli_wangong_base',
        subSkill: {
            base: {
                trigger: {
                    player: "useCard1",
                },
                forced: true,
                popup: false,
                firstDo: true,
                filter: function (event, player) {
                    return event.skill == 'qianli_wangong' && event.targets.length > 0;
                },
                content: function () {
                    var num = (get.distance(player, trigger.targets[0]));
                    trigger.baseDamage += Math.min(num, 3) - 1;
                    game.log(trigger.card, '造成的伤害基础值改为', Math.min((get.distance(player, trigger.targets[0])), 3));
                },
            },
        },
    },
    "danji_cangbi": {
        audio: "ext:太虚幻境/audio/skill:true",
        group: ["danji_cangbi_skip", "danji_cangbi_sha", "danji_cangbi_trick"],
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        usable: 1,
        content: function () {
            player.draw()
        },
        subSkill: {
            skip: {
                trigger: {
                    player: "phaseBegin",
                },
                forced: true,
                audio: "danji_cangbi",
                filter: function (event, player) {
                    return player.hp == player.maxHp;
                },
                content: function () {
                    player.addTempSkill("danji_cangbi_xiaoguo");
                },
                sub: true,
            },
            sha: {
                trigger: {
                    target: "useCardToTargeted",
                },
                forced: true,
                usable: 1,
                audio: "danji_cangbi",
                filter: function (event, player) {
                    return event.player != player && event.card && event.card.name == 'sha' && player.hp == player.maxHp && event.player.isPhaseUsing();
                },
                content: function () {
                    trigger.getParent().excluded.add(player);
                    game.log(trigger.card, '对', player, '无效');
                },
                sub: true,
            },
            trick: {
                trigger: {
                    target: "useCardToTargeted",
                },
                forced: true,
                usable: 1,
                audio: "danji_cangbi",
                filter: function (event, player) {
                    return event.player != player && event.card && get.type(event.card) == 'trick' && player.hp < player.maxHp && event.player.isPhaseUsing();
                },
                content: function () {
                    trigger.getParent().excluded.add(player);
                    game.log(trigger.card, '对', player, '无效');
                },
                sub: true,
            },
            xiaoguo: {
                trigger: {
                    player: ["phaseDiscardBefore", "phaseUseBefore"],
                },
                forced: true,
                direct: true,
                content: function () {
                    trigger.cancel();
                },
                sub: true,
                popup: false,
            },
        },
    },
    "danji_fencha": {
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        content: function () {
            'step 0'
            event.chufa = [0, 1, 2, 3].randomGet();
            'step 1'
            if (event.chufa > 2) {
                trigger.player.gainMaxHp();
                trigger.player.update();
                player.logSkill("danji_fencha");
            } else {
                event.finish();
            }
        },
        popup: false,
    },
    "danji_choudao": {
        audio: "ext:太虚幻境/audio/skill:true",
        mod: {
            targetInRange: function (card, player, target) {
                return true;
            },
        },
        forced: true,
        locked: true,
        trigger: {
            player: "useCardToPlayered",
        },
        forced: true,
        direct: true,
        filter: function (event, player) {
            return event.isFirstTarget && game.hasPlayer(function (current) { return player.getEnemies().includes(current) && event.targets.includes(current) });
        },
        content: function () {
            let list = player.getEnemies(function (target) {
                return trigger.targets.includes(target);
            }).randomGet();
            if (list) {
                player.logSkill('danji_choudao', list);
                if (list.countCards('he') > 0) {
                    list.randomDiscard('he', 2);
                }
                list.damage();
            }
        },
        ai: {
            "directHit_ai": true,
            threaten: 2,
        },
    },
    "danji_jiayan": {
        trigger: {
            player: "damageBegin4",
        },
        audio: "ext:太虚幻境/audio/skill:true",
        forced: true,
        filter: function (event, player) {
            return event.source && player.countCards('he') > 0;
        },
        content: function () {
            event.card = player.getCards('he').randomGet();
            player.discard(event.card);
            player.draw();
            trigger.cancel();
            player.loseHp();
            trigger.source.draw();
        },
    },
    "qianli_chuixi": {
        enable: "phaseUse",
        usable: 1,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return player.countCards('he') > 0;
        },
        filterTarget: function (card, player, target) {
            return player != target && player.getEnemies().includes(target);
        },
        content: function () {
            "step 0"
            event.num = 0;
            "step 1"
            player.chooseToDiscard(true, get.prompt('qianli_chuixi'), '弃置一张牌并对其造成1点伤害。', 'he', function (card) { return get.number(card) >= (2 * event.num) }).set('ai', function (card) {
                return 14 - get.number(card);
            });
            "step 2"
            if (result.bool) {
                event.num = get.number(result.cards[0]);
                target.damage();
            }
            "step 3"
            var card = player.getCards('he', function (card) { return get.number(card) >= (2 * event.num) }).randomGet();
            if (card && target.isIn()) {
                event.goto(1);
            }
            else event.finish();
        },
        ai: {
            order: 10,
            result: {
                target: -1,
            },
        },
    },
    "qianli_zonghuo": {
        init: function (player) {
            player.storage.qianli_zonghuo = 0;
        },
        mark: true,
        marktext: "纵火",
        intro: {
            name: "纵火",
            content: function (storage, player, skill) {
                var num = Math.min(player.storage.qianli_zonghuo + 1, 2);
                if (num == undefined) num = 1;
                return "本回合你下次造成的火焰伤害增加" + num + "点";
            },
        },
        group: "qianli_zonghuo_clear",
        trigger: {
            source: "damageBegin1",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event) {
            return event.nature == 'fire';
        },
        content: function () {
            "step 0"
            if (player.storage.qianli_zonghuo < 2) player.storage.qianli_zonghuo++;
            player.update();
            "step 1"
            var numMark = player.storage.qianli_zonghuo;
            trigger.num += numMark;
        },
        subSkill: {
            clear: {
                trigger: { global: ['phaseBefore', 'phaseAfter', 'phaseCancelled'] },
                forced: true,
                charlotte: true,
                direct: true,
                silent: true,
                filter: function (event, player) {
                    return player.storage.qianli_zonghuo > 0;
                },
                content: function () {
                    player.storage.qianli_zonghuo = 0;
                    player.update();
                },
                sub: true,
                popup: false,
            },
        },
    },
    "danji_huoji": {
        enable: "phaseUse",
        usable: 3,
        audio: "ext:太虚幻境/audio/skill:true",
        filterCard: function (card) {
            return get.color(card) == 'red';
        },
        viewAs: {
            name: "huogong",
            nature: "fire",
        },
        viewAsFilter: function (player) {
            if (!player.countCards('hs', { color: 'red' })) return false;
        },
        position: "hs",
        prompt: "将一张红色手牌当火攻使用",
        check: function (card) {
            var player = _status.currentPhase;
            if (player.countCards('h') > player.hp) {
                return 6 - get.value(card);
            }
            return 3 - get.value(card)
        },
        ai: {
            fireAttack: true,
            basic: {
                order: 4,
                value: [3, 1],
                useful: 1,
            },
            wuxie: function (target, card, player, current, state) {
                if (get.attitude(current, player) >= 0 && state > 0) return false;
            },
            result: {
                player: function (player) {
                    var nh = player.countCards('h');
                    if (nh <= player.hp && nh <= 4 && _status.event.name == 'chooseToUse') {
                        if (typeof _status.event.filterCard == 'function' &&
                            _status.event.filterCard({ name: 'huogong' }, player, _status.event)) {
                            return -10;
                        }
                        if (_status.event.skill) {
                            var viewAs = get.info(_status.event.skill).viewAs;
                            if (viewAs == 'huogong') return -10;
                            if (viewAs && viewAs.name == 'huogong') return -10;
                        }
                    }
                    return 0;
                },
                target: function (player, target) {
                    if (target.hasSkill('huogong2') || target.countCards('h') == 0) return 0;
                    if (player.countCards('h') <= 1) return 0;
                    if (target == player) {
                        if (typeof _status.event.filterCard == 'function' &&
                            _status.event.filterCard({ name: 'huogong' }, player, _status.event)) {
                            return -1.5;
                        }
                        if (_status.event.skill) {
                            var viewAs = get.info(_status.event.skill).viewAs;
                            if (viewAs == 'huogong') return -1.5;
                            if (viewAs && viewAs.name == 'huogong') return -1.5;
                        }
                        return 0;
                    }
                    return -1.5;
                },
            },
            tag: {
                damage: 1,
                fireDamage: 1,
                natureDamage: 1,
                norepeat: 1,
            },
        },
    },
    "danji_jiayi": {
        trigger: {
            player: "phaseBegin",
        },
        group: ["danji_jiayi_damage"],
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.getEnemies().includes(current) || current == player;
            });
        },
        content: function () {
            var cards = player.getCards("h", { color: "black" });
            player.discard(cards)
            game.countPlayer(function (current) {
                if (current != player && player.getEnemies().includes(current)) {
                    var hs = current.getCards('h', { color: 'black' });
                    if (hs.length) {
                        current.discard(hs);
                    }
                }
            })
            var cardssss = []
            for (var i = 0; i < cards.length; i++) {
                var cardss = get.discardPile(function (card) {
                    return get.color(card) == "red" && !cardssss.includes(card)
                })
                cardssss.push(cardss)
            }
            if (cardssss.length) player.gain(cardssss, "gain2");
        },
        subSkill: {
            damage: {
                trigger: {
                    source: "damageSource",
                },
                forced: true,
                audio: "danji_jiayi",
                filter: function (event, player) {
                    return event.card && get.color(event.card, player) == 'red';
                },
                content: function () {
                    player.draw(2);
                },
                sub: true,
            },
        },
        ai: {
            expose: 0.2
        },
    },
    "danji_jiashu": {
        marktext: "家书",
        mark: true,
        locked: true,
        intro: {
            content: function (storage, player, skill) {
                var num = player.countMark('danji_jiashu');
                if (num == undefined) num = 0;
                return "已拥有" + num + "枚家书标记";
            },
        },
        derivation: "mbmowang",
        trigger: {
            player: "gainEnd",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return !(event.getParent().name == 'draw' && event.getParent(2).name == 'phaseDraw');
        },
        content: function () {
            "step 0"
            player.addMark('danji_jiashu', trigger.cards.length);
            "step 1"
            var numMark = player.countMark('danji_jiashu');
            if (player.countMark('danji_jiashu') >= 7) {
                player.removeMark('danji_jiashu', numMark);
                player.removeSkill('danji_jiashu');
                player.draw(2);
                player.addSkill("mbmowang");
                if (get.mode() == 'taixuhuanjing') {
                    player.link();
                }
            }
        },
    },
    "danji_jingyi": {
        global: ["danji_jingyi_xiaoguo", "danji_jingyi_buff", "danji_jingyi_damage"],
        forced: true,
        locked: true,
        subSkill: {
            xiaoguo: {
                trigger: {
                    source: "damageBegin1",
                },
                forced: true,
                audio: "ext:太虚幻境/audio/skill:true",
                filter: function (event, player) {
                    return event.card && get.color(event.card) == "red" && game.hasPlayer(function (current) {
                        return current.hasSkill('danji_jingyi') && (current == player || current.getFriends().includes(player));
                    });
                },
                content: function () {
                    trigger.num++;
                },
                sub: true,
                popup: false,
            },
            damage: {
                trigger: {
                    player: "damageBegin4",
                },
                forced: true,
                audio: "danji_jingyi",
                filter: function (event, player) {
                    return event.card && get.color(event.card) == "red" && game.hasPlayer(function (current) {
                        return current.hasSkill('danji_jingyi') && (current == player || current.getFriends().includes(player));
                    });
                },
                content: function () {
                    trigger.num--;
                },
                ai: {
                    effect: {
                        target: function (card, player, target, current) {
                            if (player.hasSkillTag('jueqing', false, target) || player.hasSkillTag('damageBonus')) return;
                            if ((player.hasSkill('danji_zonghuo') || player.hasSkill('qianli_zonghuo')) && get.tag(card, 'fireDamage')) return;
                            if (get.tag(card, 'damage') && get.tag(card, 'damage') <= 1 && player.getEnemies().includes(target) && get.color(card) == "red" && game.hasPlayer(function (current) {
                                return current.hasSkill('danji_jingyi') && (current == target || current.getFriends().includes(target));
                            })) return 0;
                        },
                    },
                },
                sub: true,
                popup: false,
            },
            buff: {
                mod: {
                    targetInRange: function (card, player) {
                        if (get.color(card) == "red" && game.countPlayer(function (current) {
                            return current.hasSkill('danji_jingyi') && (current == player || player.getFriends().includes(current));
                        })) return true;
                    },
                    cardUsable: function (card, player) {
                        if (get.color(card) == "red") return Infinity == game.countPlayer(function (current) {
                            return current.hasSkill('danji_jingyi') && (current == player || player.getFriends().includes(current));
                        });
                    },
                },
                sub: true,
            },
        },
        popup: false,
    },
    "fenghuo_zhongyong": {
        trigger: {
            player: "useCardAfter",
        },
        audio: "ext:太虚幻境/audio/skill:true",
        direct: true,
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        content: function () {
            "step 0"
            event.cards = trigger.cards.filterInD();
            game.countPlayer2(function (current) {
                current.getHistory('useCard', function (evt) {
                    if (evt.card.name == 'shan' && evt.getParent(3) == trigger) event.cards.addArray(evt.cards.filterInD('od'));
                });
            });
            if (!event.cards.length) event.finish();
            player.chooseTarget(get.prompt2('fenghuo_zhongyong'), '令一名其他角色获得' + get.translation(event.cards), function (card, player, target) {
                return !_status.event.source.includes(target) && target != player;
            }).set('ai', function (target) {
                return get.attitude(_status.event.player, target);
            }).set('source', trigger.targets);
            "step 1"
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill('fenghuo_zhongyong', target);
                target.gain(cards, 'gain2');
                var red = false, black = false;
                for (var i of cards) {
                    var color = get.color(i, false);
                    if (color == 'red') red = true;
                    if (color == 'black') black = true;
                    if (red && black) break;
                }
                if (red) target.chooseToUse('是否使用一张杀？', { name: 'sha' }).set('filterTarget', function (card, player, target) {
                    return target != _status.event.sourcex && _status.event.sourcex.inRange(target) && lib.filter.targetEnabled.apply(this, arguments);
                }).set('sourcex', player).set('addCount', false);
                if (black) target.draw();
            }
        },
    },
    txzhuyi: {
        audio: "longyin",
        trigger: { global: 'damageBegin1' },
        usable: 2,
        filter: function (event) {
            return event.source;
        },
        check: function (event, player) {
            return get.attitude(player, event.source) > 0 && get.attitude(player, event.player) < 0;
        },
        prompt: function (event) {
            return get.translation(event.source) + '即将对' + get.translation(event.player) + '造成伤害，' + get.prompt('txzhuyi');
        },
        logTarget: 'source',
        content: function () {
            trigger.source.judge().callback = lib.skill.txzhuyi.callback;
        },
        callback: function () {
            var evt = event.getParent(2);
            if (event.judgeResult.color == 'red') {
                //game.cardsDiscard(card);
                evt._trigger.num++;
            }
            else {
                evt._trigger.source.recover();
            }
        },
    },
    //太虚曹丕颂威
    jcpsongwei: {
        unique: true,
        group: 'jcpsongwei2',
        audio: "songwei2",
        //zhuSkill:true,
    },
    jcpsongwei2: {
        audio: "songwei2",
        forceaudio: true,
        trigger: { global: 'judgeEnd' },
        filter: function (event, player) {
            if (event.player == player || event.player.group != 'wei') return false;
            if (event.result.color != 'black') return false;
            return player.hasSkill('jcpsongwei', event.player);
        },
        direct: true,
        content: function () {
            'step 0'
            trigger.player.chooseBool('是否发动【颂威】，令' + get.translation(player) + '摸一张牌？').set('choice', get.attitude(trigger.player, player) > 0);
            'step 1'
            if (result.bool) {
                player.logSkill('jcpsongwei2');
                trigger.player.line(player, 'green');
                player.draw();
            }
        }
    },
    //秦琪
    "txfengling": {
        marktext: "令",
        mark: true,
        locked: true,
        intro: {
            content: function (storage, player, skill) {
                var num = player.countMark('txfengling');
                if (num == undefined) num = 0;
                return "已拥有" + num + "个令标记";
            },
        },
        trigger: {
            global: "roundStart",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return player.countMark('txfengling') < 3;
        },
        content: function () {
            var numMark = trigger.player.countMark('txfengling');
            player.addMark('txfengling', 1);
        },
        group: ["txfengling_Draw", "txfengling_damage", "txfengling_dying", "txfengling_damageEnd"],
        subSkill: {
            Draw: {
                trigger: {
                    player: "phaseDrawBegin",
                },
                forced: true,
                filter: function (event, player) {
                    return player.countMark('txfengling') > 0;
                },
                content: function () {
                    player.logSkill('txfengling');
                    trigger.num += 3;
                },
                sub: true,
                mod: {
                    ignoredHandcard: function (card, player) {
                        if (player.countMark('txfengling') > 0) return true;
                    },
                    cardDiscardable: function (card, player, name) {
                        if (name == 'phaseDiscard' && player.countMark('txfengling') > 0) return false;
                    },
                },
                popup: false,
            },
            damage: {
                trigger: {
                    source: "damageBegin1",
                },
                forced: true,
                filter: function (event, player) {
                    return player.countMark('txfengling') > 2;
                },
                content: function () {
                    player.logSkill('txfengling');
                    trigger.num += 0;
                },
                sub: true,
                mod: {
                    cardUsable: function (card, player, num) {
                        if (card.name == 'sha' && player.countMark('txfengling') > 2) return Infinity;
                    },
                    targetInRange: function (card, player, target) {
                        if (player.countMark('txfengling') > 2) return true;
                    },
                },
                popup: false,
            },
            dying: {
                trigger: {
                    global: "dying",
                },
                forced: true,
                filter: function (event, player) {
                    return player.countMark('txfengling') > 0;
                },
                content: function () {
                    player.removeMark('txfengling', 1);
                    player.logSkill('txfengling');
                },
                sub: true,
                popup: false,
            },
            damageEnd: {
                trigger: {
                    player: "damageEnd",
                },
                forced: true,
                firstDo: true,
                filter: function (event, player) {
                    return player.countMark('txfengling') > 1;
                },
                content: function () {
                    player.logSkill('txfengling');
                    player.draw();
                },
                sub: true,
                popup: false,
            },
        },
    },
    "qianli_hengjiang": {
        group: "qianli_hengjiang_draw",
        trigger: {
            source: "damageSource",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.getEnemies().includes(current) && current != player && !current.isLinked();
            });
        },
        content: function () {
            var list = game.filterPlayer(function (current) {
                return player.getEnemies().includes(current) && current != player && !current.isLinked();
            }).randomGet();
            player.line(list);
            list.link();
        },
        subSkill: {
            draw: {
                trigger: {
                    global: "linkAfter",
                },
                forced: true,
                audio: "qianli_hengjiang",
                filter: function (event, player) {
                    return event.player.isLinked();
                },
                content: function () {
                    player.draw(1);
                },
            },
        },
    },
    "txzhangshi": {
        trigger: {
            player: "gainAfter",
        },
        usable: 3,
        forced: true,
        unique: true,
        audio: "ext:太虚幻境/audio/skill:true",
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) {
                return player.getEnemies().includes(current) && current != player;
            });
        },
        filter: function (event, player) {
            return !(event.getParent().name == 'draw' && event.getParent(2).name == 'phaseDraw');
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'red' ? 1 : 0;
            });
            "step 1"
            if (result.color == 'red') {
                game.countPlayer(function (current2) {
                    if (current2 != player && player.getEnemies().includes(current2)) {
                        current2.damage();
                    }
                })
            }
            if (result.color == 'black') {
                game.countPlayer(function (current) {
                    if (current != player && player.getEnemies().includes(current)) {
                        var hs = current.getCards('he');
                        if (hs.length) {
                            current.discard(hs.randomGet());
                        }
                    }
                })
            }
        },
        ai: {
            expose: 0.2,
        },
    },
    "qianli_xunwen": {
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        logTarget: 'source',
        filter: function (event, player) {
            return event.source && event.card;
        },
        content: function () {
            var suit1 = get.suit(trigger.card);
            if (suit1) {
                var cards = trigger.source.getCards('he', { suit: suit1 });
                if (cards.length) {
                    var card = trigger.source.getCards('he', { suit: suit1 }).randomGet();
                    trigger.source.discard(card);
                }
                else player.draw(2);
            }
            else player.draw(2);
        },
    },
    "fenghuo_fuzhe": {
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        logTarget: 'source',
        filter: function (event, player) {
            return event.source && event.card && event.source.countCards('h', function (card) { return get.name(card) == get.name(event.card) }) > 0;
        },
        content: function () {
            var cards = trigger.source.getCards('h', function (card) { return get.name(card) == get.name(trigger.card) });
            if (cards.length) {
                trigger.source.discard(cards);
            }
        },
    },
    "fenghuo_chongfeng": {
        trigger: { player: 'phaseZhunbeiBegin' },
        direct: true,
        content: function () {
            player.chooseUseTarget('###是否发动【冲锋】？###视为使用一张没有距离限制的【杀】', { name: 'sha' }, false, 'nodistance').logSkill = 'fenghuo_chongfeng';
        },
        ai: {
            threaten: function (player, target) {
                return 1.6;
            }
        }
    },
    ysweidi: {
        audio: "drlt_weidi",
        forceaudio: true,
        unique: true,
        //zhuSkill:true,
        trigger: {
            player: "phaseDiscardBegin",
        },
        direct: true,
        filter: function (event, player) {
            if (!player.hasSkill('ysweidi')) return false;
            return player.needsToDiscard() > 0 && game.countPlayer(function (current) { return current != player && current.group == 'qun' }) > 0;
        },
        content: function () {
            'step 0'
            var num = Math.min(player.needsToDiscard(), game.countPlayer(function (target) {
                return target != player && target.group == 'qun';
            }));
            if (num) {
                player.chooseCardTarget({
                    prompt: get.prompt('ysweidi'),
                    prompt2: '你可以将' + (num > 1 ? '至多' : '') + get.cnNumber(num) + '张手牌交给等量的其他群势力角色。先按顺序选中所有要给出的手牌，然后再按顺序选择等量的目标角色',
                    selectCard: [1, num],
                    selectTarget: function () {
                        return ui.selected.cards.length;
                    },
                    filterTarget: function (card, player, target) {
                        return target != player && target.group == 'qun';
                    },
                    complexSelect: true,
                    filterOk: function () {
                        return ui.selected.cards.length == ui.selected.targets.length;
                    },
                    ai1: function (card) {
                        var player = _status.event.player;
                        var value = get.value(card, player, 'raw');
                        if (game.hasPlayer(function (target) {
                            return (target != player && target.group == 'qun' && !ui.selected.targets.includes(target)) && (get.sgn(value) == get.sgn(get.attitude(player, target)))
                        })) return 1 / Math.max(1, get.useful(card));
                        return -1;
                    },
                    ai2: function (target) {
                        var player = _status.event.player;
                        var card = ui.selected.cards[ui.selected.targets.length];
                        if (card && get.value(card, player, 'raw') < 0) return -get.attitude(player, target);
                        return get.attitude(player, target);
                    },
                });
            }
            else event.finish();
            'step 1'
            if (result.bool && result.cards.length > 0) {
                var list = [];
                for (var i = 0; i < result.targets.length; i++) {
                    var target = result.targets[i];
                    var card = result.cards[i];
                    list.push([target, card]);
                }
                player.logSkill('ysweidi', result.targets);
                game.loseAsync({
                    gain_list: list,
                    player: player,
                    cards: result.cards,
                    giver: player,
                    animate: 'giveAuto',
                }).setContent('gaincardMultiple');
            }
            else event.finish();
        },
    },
    txhj_guiji: {
        trigger: { player: 'phaseJudgeBegin' },
        forced: true,
        content: function () {
            player.discard(player.getCards('j').randomGet());
        },
        filter: function (event, player) {
            return player.countCards('j') > 0;
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (get.type(card) == 'delay' && target.countCards('j') == 0) return 0.1;
                }
            }
        }
    },
    //魔改官渡之战
    txpodi: {
        shaRelated: true,
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: { player: 'useCardToPlayered' },
        direct: true,
        filter: function (event, player) {
            return event.card.name == 'sha' && event.target.hp > 0 && event.target.countCards('he') > 0;
        },
        content: function () {
            'step 0'
            var next = player.choosePlayerCard(trigger.target, 'he', [1, 2], get.prompt('txpodi', trigger.target));
            next.set('ai', function (button) {
                if (!_status.event.goon) return 0;
                var val = get.value(button.link);
                if (button.link == _status.event.target.getEquip(2)) return 2 * (val + 3);
                return val;
            });
            next.set('goon', get.attitude(player, trigger.target) <= 0);
            next.set('forceAuto', true);
            'step 1'
            if (result.bool) {
                var target = trigger.target;
                player.logSkill('txpodi', target);
                target.addSkill('txpodi2');
                target.addToExpansion('giveAuto', result.cards, target).gaintag.add('txpodi2');
            }
        },
        ai: {
            unequip_ai: true,
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                if (get.attitude(player, arg.target) > 0) return false;
                if (tag == 'directHit_ai') return arg.target.hp >= Math.max(1, arg.target.countCards('h') - 1);
                if (arg && arg.name == 'sha' && arg.target.getEquip(2)) return true;
                return false;
            }
        },
        group: 'txpodi3',
    },
    txpodi3: {
        audio: 'txpodi',
        trigger: { source: 'damageBegin1' },
        forced: true,
        locked: false,
        logTarget: 'player',
        filter: function (event, player) {
            var target = event.player;
            return event.getParent().name == 'sha' && player.countCards('h') >= target.countCards('h') && player.countCards('e') >= target.countCards('e');
        },
        content: function () {
            trigger.num++;
        },
    },
    txpodi2: {
        trigger: { global: 'phaseEnd' },
        forced: true,
        popup: false,
        charlotte: true,
        filter: function (event, player) {
            return player.getExpansions('txpodi2').length > 0;
        },
        content: function () {
            'step 0'
            var cards = player.getExpansions('txpodi2');
            player.gain(cards, 'draw');
            game.log(player, '收回了' + get.cnNumber(cards.length) + '张“破敌”牌');
            'step 1'
            player.removeSkill('txpodi2');
        },
        intro: {
            markcount: 'expansion',
            mark: function (dialog, storage, player) {
                var cards = player.getExpansions('txpodi2');
                if (player.isUnderControl(true)) dialog.addAuto(cards);
                else return '共有' + get.cnNumber(cards.length) + '张牌';
            },
        },
    },
    //搬运自【活动武将】扩展的欢杀高顺禁酒技能!
    minijinjiu: {
        mod: {
            cardname: function (card, player) {
                if (card.name == 'jiu') return 'sha';
            },
        },
        ai: {
            respondSha: true,
            skillTagFilter: function (player) {
                if (!player.countCards('h', 'jiu')) return false;
            },
        },
        group: 'minijinjiu_gain',
        global: 'minijinjiu_usejiu',
        audio: 'jinjiu',
        popup: false,
        silent: true,
        firstDo: true,
        trigger: { player: 'useCard1' },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && event.addCount !== false && event.cards &&
                event.cards.length == 1 && event.cards[0].name == 'jiu';
        },
        forced: true,
        content: function () {
            trigger.addCount = false;
            if (player.stat[player.stat.length - 1].card.sha > 0) {
                player.stat[player.stat.length - 1].card.sha--;
            }
        },
        subSkill: {
            gain: {
                trigger: { global: 'useCardAfter' },
                forced: true,
                audio: 'jinjiu',
                filter: function (event, player) {
                    return event.player != player && event.card.isCard && event.card.name == 'jiu' && event.cards.filterInD().length > 0;
                },
                logTarget: 'player',
                content: function () {
                    player.gain(trigger.cards.filterInD(), 'gain2');
                },
            },
            usejiu: {
                mod: {
                    cardEnabled: function (card, player) {
                        if (card.name == 'jiu' && _status.currentPhase && _status.currentPhase != player && _status.currentPhase.hasSkill('minijinjiu')) return false;
                    },
                    cardSavable: function (card, player) {
                        if (card.name == 'jiu' && _status.currentPhase && _status.currentPhase != player && _status.currentPhase.hasSkill('minijinjiu')) return false;
                    },
                },
            },
        },
    },
    txyongzhan: {
        shaRelated: true,
        audio: "shuangxiong",
        preHidden: true,
        trigger: {
            player: 'useCardToPlayered',
            target: 'useCardToTargeted',
        },
        filter: function (event, player) {
            if (!(event.card.name == 'juedou')) return false;
            return player == event.target || event.getParent().triggeredTargets3.length == 1;
        },
        frequent: true,
        content: function () {
            player.draw();
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'juedou') return [1, 0.6];
                },
                player: function (card, player, target) {
                    if (card.name == 'juedou') return [1, 1];
                }
            }
        }
    },
    txhj_xianxi: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: {
            global: "roundStart",
        },
        forced: true,
        content: function () {
            player.logSkill('txhj_xianxi');
            player.insertPhase(event.name);
            //console.log(player,trigger.player,event.name)
            if (trigger.player != player && !trigger._finished) {
                trigger.finish();
                trigger.untrigger(true);
                trigger._triggered = 5;
                trigger.player.insertPhase();
            }
        },
    },
    txchoudou: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        content: function () {
            player.chooseUseTarget('###是否发动【仇斗】？###视为使用一张没有距离限制的【决斗】', { name: 'juedou' }, false, 'nodistance').logSkill = 'txchoudou';
        },
        ai: {
            threaten: function (player, target) {
                return 1.6;
            }
        }
    },
    txjiuchi: {
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'jiu') return Infinity;
            },
        },
        audio: "oljiuchi",
        enable: 'chooseToUse',
        filterCard: function (card) {
            return get.color(card) == 'black';
        },
        viewAs: { name: 'jiu' },
        position: 'hes',
        viewAsFilter: function (player) {
            return player.hasCard(card => get.color(card) == 'black', 'hes');
        },
        prompt: '将一张黑色牌当酒使用',
        check: function (cardx, player) {
            if (player && player == cardx.player) return true;
            if (_status.event.type == 'dying') return 1;
            var player = _status.event.player;
            var shas = player.getCards('hes', function (card) {
                return card != cardx && get.name(card, player) == 'sha';
            });
            if (!shas.length) return -1;
            if (shas.length > 1 && (player.getCardUsable('sha') > 1 || player.countCards('hes', 'zhuge'))) {
                return 0;
            }
            shas.sort(function (a, b) {
                return get.order(b) - get.order(a);
            });
            var card = false;
            if (shas.length) {
                for (var i = 0; i < shas.length; i++) {
                    if (shas[i] != cardx && lib.filter.filterCard(shas[i], player)) {
                        card = shas[i]; break;
                    }
                }
            }
            if (card) {
                if (game.hasPlayer(function (current) {
                    return (get.attitude(player, current) < 0 &&
                        !current.hasShan()
                        && current.hp + current.countCards('h', { name: ['tao', 'jiu'] }) > 1 + (player.storage.jiu || 0)
                        && player.canUse(card, current, true, true) &&
                        !current.hasSkillTag('filterDamage', null, {
                            player: player,
                            card: card,
                            jiu: true,
                        }) &&
                        get.effect(current, card, player) > 0);
                })) {
                    return 4 - get.value(cardx);
                }
            }
            return -1;
        },
        ai: {
            threaten: 1.5,
        },
        trigger: { source: 'damageEnd' },
        locked: true,
        forced: true,
        filter: function (event, player) {
            if (event.name == 'chooseToUse') return player.hasCard(card => get.color(card) == 'black', 'hes');
            return event.card && event.card.name == 'sha' && event.getParent(2).jiu == true && !player.hasSkill('txjiuchi_air');
        },
        content: function () {
            player.logSkill('txjiuchi');
            player.addTempSkill('txjiuchi_air');
        },
        subSkill: {
            air: {},
        },
    },
    olranshang: {
        group: 'olranshang2',
        audio: 'ranshang',
        trigger: { player: 'damageEnd' },
        filter: function (event, player) {
            return event.nature == 'fire';
        },
        forced: true,
        check: function () {
            return false;
        },
        content: function () {
            player.addMark('olranshang', trigger.num);
        },
        intro: {
            name2: '燃',
            content: 'mark'
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (card.name == 'sha') {
                        if (card.nature == 'fire' || player.hasSkill('zhuque_skill')) return 2;
                    }
                    if (get.tag(card, 'fireDamage') && current < 0) return 2;
                }
            }
        },
    },
    olranshang2: {
        audio: "ranshang",
        trigger: { player: 'phaseJieshuBegin' },
        forced: true,
        filter: function (event, player) {
            return player.countMark('olranshang') > 0;
        },
        content: function () {
            player.loseHp(player.countMark('olranshang'));
        }
    },
    txsiwu: {
        mod: {
            targetEnabled: function (card, player, target) {
                if (get.type(card) == 'food') {
                    return false;
                }
            },
        },
        trigger: {
            player: ['phaseUseBegin'],
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        group: 'txsiwu2',
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了', event.triggername == 'phaseZhunbeiBefore' ? '用牌' : '出牌阶段');
        },
    },
    txsiwu2: {
        popup: false,
        trigger: {
            player: "phaseDiscardBegin",
        },
        forced: true,
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了弃牌阶段');
        },
    },
    txjianjia: {
        group: ['txjianjia1', 'txjianjia2']
    },
    txjianjia1: {
        trigger: { target: ['useCardToBefore', 'shaBegin'] },
        forced: true,
        priority: 6,
        filter: function (event, player, name) {
            if (player.getEquip(2)) return false;
            if (name == 'shaBegin') return lib.skill.tengjia3.filter(event, player);
            return lib.skill.tengjia1.filter(event, player);
        },
        content: function () {
            trigger.cancel();
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (target.getEquip(2)) return;
                    return lib.skill.tengjia1.ai.effect.target.apply(this, arguments);
                }
            }
        }
    },
    txjianjia2: {
        trigger: { player: 'damageBegin3' },
        filter: function (event, player) {
            if (player.getEquip(2)) return false;
            if (event.nature == 'poison') return true;
        },
        forced: true,
        check: function () {
            return false;
        },
        content: function () {
            trigger.num++;
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (target.getEquip(2)) return;
                    return lib.skill.tengjia2.ai.effect.target.apply(this, arguments);
                }
            }
        }
    },
    txliangwu: {
        trigger: {
            target: 'useCardToTarget',
            player: 'addJudgeBefore',
        },
        forced: true,
        preHidden: true,
        priority: 15,
        check: function (event, player) {
            return event.name == 'addJudge' || get.effect(event.target, event.card, event.player, player) < 0;
        },
        filter: function (event, player) {
            return event.card.name == (event.name == 'addJudge' ? 'wenyi' : 'juedou');
        },
        content: function () {
            if (trigger.name == 'addJudge') {
                trigger.cancel();
                var owner = get.owner(trigger.card);
                if (owner && owner.getCards('hej').includes(trigger.card)) owner.lose(trigger.card, ui.discardPile);
                else game.cardsDiscard(trigger.card);
                game.log(trigger.card, '进入了弃牌堆');
            }
            else trigger.getParent().targets.remove(player);
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (card.name == 'juedou' || card.name == 'wenyi') return 'zeroplayertarget';
                },
            }
        }
    },
    txhj_qingzhong: {
        audio: "qingzhong",
    },
    txhj_qingzhongx: {
        audio: 'weijing',
        trigger: { player: 'phaseUseBegin' },
        check: function (event, player) {
            if (game.hasPlayer(function (current) {
                return current != player && current.isMinHandcard() && get.attitude(player, current) > 0;
            })) {
                return true;
            }
            if (player.countCards('h') <= 2) return true;
            // if(player.countCards('h')<=3&&!player.countCards('h','shan')) return true;
            //if(player.countCards('h',{type:'basic'})<=1) return true;
            return false;
        },
        content: function () {
            player.draw(2);
            player.addTempSkill('txhj_qingzhongx_give');
        },
        subSkill: {
            give: {
                trigger: { player: 'phaseUseEnd' },
                filter: function (event, player) {
                    return !player.isMinHandcard(true);
                },
                audio: 'weijing',
                forced: true,
                content: function () {
                    'step 0'
                    var list = game.filterPlayer(function (current) {
                        return current.isMinHandcard();
                    });
                    if (list.length == 1) {
                        if (list[0] != player) {
                            player.line(list[0], 'green');
                            player.swapHandcards(list[0]);
                        }
                        event.finish();
                    }
                    else {
                        player.chooseTarget(true, '清忠：选择一名手牌最少的角色与其交换手牌', function (card, player, target) {
                            return target.isMinHandcard();
                        }).set('ai', function (target) {
                            return get.attitude(_status.event.player, target);
                        });
                    }
                    'step 1'
                    if (result.bool) {
                        var target = result.targets[0];
                        if (target != player) {
                            player.line(target, 'green');
                            player.swapHandcards(target);
                        }
                    }
                }
            }
        }
    },
    txjipo: {
        audio: "jigong",
        trigger: { player: 'useCard' },
        forced: true,
        group: 'txjipo_draw',
        filter: function (event, player) {
            return player.getHistory('useCard').length <= player.getDamagedHp();
        },
        content: function () {
            trigger.directHit.addArray(game.filterPlayer());
        },
        ai: {
            threaten: 1.5,
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                return player.countUsed() < player.getDamagedHp();
            },
        },
        mod: {
            targetInRange: function (card, player) {
                if (player.countUsed() < player.getDamagedHp()) return true;
            },
            cardUsable: function (card, player) {
                if (player.countUsed() < player.getDamagedHp()) return Infinity;
            },
            aiOrder: function (player, card, num) {
                if (player.countUsed() >= player.getDamagedHp()) return;
                var numx = get.info(card).usable;
                if (typeof numx == 'function') numx = num(card, player);
                if (typeof numx == 'number') return num + 10;
            },
        },
        subSkill: {
            draw: {
                audio: 'jigong',
                trigger: { player: 'phaseDrawBegin2' },
                forced: true,
                filter: function (event, player) {
                    return !event.numFixed && player.getDamagedHp() > 0;
                },
                content: function () {
                    trigger.num += 0;
                },
                ai: {
                    effect: {
                        target: function (card, player, target) {
                            if (get.tag(card, 'recover') && target.hp >= target.maxHp - 1 && target.maxHp > 1) return [0, 0];
                        }
                    }
                }
            }
        }
    },
    txfenlu: {
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txfenlu'), function (card, player, target) {
                if (target.isFriendOf(player)) return false;
                return lib.filter.targetEnabled({ name: 'sha' }, player, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'sha' }, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txfenlu');
                player.loseHp();
                player.useCard({ name: 'sha' }, result.targets, false);
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    txduwu: {
        trigger: { source: 'damageBegin1' },
        usable: 1,
        filter: function (event) {
            return event.card && event.card.name == 'sha' && event.notLink();
        },
        forced: true,
        content: function () {
            trigger.num++;
        }
    },
    //手杀何太后的鸩毒
    //此鸩毒技能代码搬运自【活动BOSS】扩展，感谢其作者烟雨墨染大佬!
    fenghuo_zhendu: {
        audio: 'zhendu',
        trigger: { global: 'phaseUseBegin' },
        filter: function (event, player) {
            return _status.currentPhase != player && player.countCards('h') > 0;
        },
        direct: true,
        content: function () {
            "step 0"
            var nono = (Math.abs(get.attitude(player, trigger.player)) < 3);
            if (player == trigger.player || get.damageEffect(trigger.player, player, player) <= 0 || !trigger.player.hasUseTarget({ name: 'jiu' }, null, true)) {
                nono = true;
            }
            else if (trigger.player.hp > 2) {
                nono = true;
            }
            else if (trigger.player.hp > 1 && player.countCards('h') < 3 && (trigger.player.canUse('sha', player) && !player.countCards('h', 'shan') && trigger.player.countCards('h') >= 3)) {
                nono = true;
            }
            var next = player.chooseToDiscard(get.prompt2('fenghuo_zhendu', trigger.player));
            next.set('ai', function (card) {
                if (_status.event.nono) return -1;
                return 7 - get.useful(card);
            });
            next.set('logSkill', ['fenghuo_zhendu', trigger.player]);
            next.set('nono', nono);
            next.setHiddenSkill('fenghuo_zhendu');
            "step 1"
            if (result.bool) {
                trigger.player.chooseUseTarget({ name: 'jiu' }, true, 'noTargetDelay', 'nodelayx');
            }
            else {
                event.finish();
            }
            "step 2"
            if (result.bool && trigger.player != player) trigger.player.damage();
        },
        ai: {
            threaten: 2,
            expose: 0.3
        }
    },//到这
    txqishi: {
        trigger: { player: 'useCard' },
        forced: true,
        filter: function (event) {
            return get.type(event.card) == 'trick';
        },
        content: function () {
            trigger.nowuxie = true;
        },
        mod: {
            targetEnabled: function (card, player, target) {
                if (get.type(card) == 'food') {
                    return false;
                }
            },
        }
    },
    txzhongzuo: {
        trigger: { player: 'damageEnd' },
        filter: function (event) {
            if (event._notrigger.includes(event.player)) return false;
            return event.num && event.source && event.player &&
                event.player.isIn() && event.source.isIn() && event.source != event.player;
        },
        check: function (event, player) {
            if (player.isPhaseUsing()) return true;
            if (event.player == player) return get.attitude(player, event.source) > -3;
            return get.attitude(player, event.player) > -3;
        },
        logTarget: function (event, player) {
            if (event.player == player) return event.source;
            return event.player;
        },
        preHidden: true,
        content: function () {
            "step 0"
            event.count = trigger.num;
            "step 1"
            game.asyncDraw([trigger.player, trigger.source]);
            event.count--;
            "step 2"
            game.delay();
            "step 3"
            if (event.count && player.hasSkill('txzhongzuo')) {
                player.chooseBool(get.prompt2('txzhongzuo', lib.skill.txzhongzuo.logTarget(trigger, player)))
            }
            else event.finish();
            "step 4"
            if (result.bool) {
                player.logSkill('txzhongzuo', lib.skill.txzhongzuo.logTarget(trigger, player));
                event.goto(1);
            }
        },
        ai: {
            maixie: true,
            maixie_hp: true
        }
    },
    txmingmen: {
        line: false,
        group: 'txmingmen_remove',
        check: function (card) {
            return 7 - get.value(card);
        },
    },
    txmingmen_remove: {
        trigger: { player: 'useCard2' },
        direct: true,
        filter: function (event, player) {
            return event.card.name == 'wanjian' && event.targets.length > 0;
        },
        line: false,
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt('txmingmen'), '为' + get.translation(trigger.card) + '减少一个目标', function (card, player, target) {
                return _status.event.targets.includes(target)
            }).set('targets', trigger.targets).set('ai', function (target) {
                var player = _status.event.player;
                return -get.effect(target, _status.event.getTrigger().card, player, player)
            });
            'step 1'
            if (result.bool) {
                player.logSkill('txmingmen', result.targets);
                trigger.targets.remove(result.targets[0]);
            }
        },
    },
    txxuejian: {
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txxuejian'), function (card, player, target) {
                if (target.isFriendOf(player)) return false;
                return lib.filter.targetEnabled({ name: 'wanjian' }, player, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'wanjian' }, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txxuejian');
                player.useCard({ name: 'wanjian' }, result.targets, false);
                player.useCard({ name: 'wanjian' }, result.targets, false);
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    //山寨垃圾版延命
    txyanming: {
        trigger: { target: 'useCardToTarget' },
        forced: true,
        filter: function (event, player) {
            return event.card.name != 'jiu' && event.card.name != 'tao' &&
                event.targets.length == 1 && event.card.isCard && event.cards.length == 1 && event.getParent(2).name != 'txyanming_timeout' &&
                get.position(event.cards[0], true) == 'o' && event.card.name == event.cards[0].name &&
                (!player.storage.txyanming || player.storage.txyanming[0].length < player.maxHp);
        },
        content: function () {
            trigger.targets.remove(player);
            trigger.getParent().triggeredTargets2.remove(player);
            trigger.untrigger();
            var card = trigger.cards[0];
            player.addToExpansion(card, 'gain2').gaintag.add('txyanming');
            if (!player.storage.txyanming) player.storage.txyanming = [[], []];
            player.storage.txyanming[0].push(card);
            player.storage.txyanming[1].push(trigger.player);
            game.delayx();
        },
        onremove: function (player, skill) {
            var cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
            delete player.storage[skill];
        },
        intro: {
            markcount: function (storage) {
                if (!storage) return 0;
                return storage[0].length;
            },
            mark: function (dialog, storage, player) {
                if (!storage) return;
                dialog.addAuto(storage[0]);
                dialog.addText(get.translation(storage[1]));
            },
            onunmark: function (storage, player) {
                player.storage.txyanming = [[], []];
            },
        },
        ai: {
            reverseEquip: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.type(card) == 'equip' && !get.tag(card, 'gifts') && target.storage.txyanming && target.storage.txyanming[1].length) {
                        var result1 = get.equipResult(player, target, card.name), subtype = get.subtype(card);
                        for (var i of target.storage.txyanming[0]) {
                            if (get.subtype(i, false) == subtype && get.equipResult(target, target, i.name) >= result1) return 'zerotarget';
                        }
                    }
                },
            },
        },
        group: 'txyanming_timeout',
        subSkill: {
            timeout: {
                audio: 'txyanming',
                trigger: { player: 'phaseJieshuBegin' },
                forced: true,
                filter: function (event, player) {
                    return player.storage.txyanming && player.storage.txyanming[0].length > 0;//=Math.max(1,player.getDamagedHp());
                },
                content: function () {
                    var list = player.storage.txyanming, card = list[0].shift(), source = list[1].shift();
                    if (player.getExpansions('txyanming').includes(card)) {
                        if (source && source.isIn() && source.canUse(card, player, false)) source.useCard(card, player, false);
                        else player.loseToDiscardpile(card);
                    }
                    if (list[0].length) event.redo();
                },
            },
        },
    },
    txshatun: {
        trigger: { player: 'phaseBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txshatun'), function (card, player, target) {
                if (target.isFriendOf(player)) return false;
                return lib.filter.targetEnabled({ name: 'juedou' }, player, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'juedou' }, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txshatun');
                player.useCard({ name: 'juedou' }, result.targets, false);
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    txdiyjuezhan: {
        audio: "ext:太虚幻境/audio/skill:true",
        trigger: { player: 'phaseJieshuBegin' },
        //direct:true,
        forced: true,
        content: function () {
            player.chooseUseTarget('###是否发动【绝战】？###视为使用一张【决斗】', { name: 'juedou' }, true, 'nodistance').logSkill = 'txdiyjuezhan';
            player.loseHp();
        },
        ai: {
            threaten: function (player, target) {
                return 1.6;
            }
        }
    },
    zxfudi: {
        trigger: { global: 'damageEnd' },
        direct: true,
        preHidden: true,
        audio: "gzfudi",
        filter: function (event, player) { return event.source && event.source.isAlive() && event.source != player && event.player == player && player.countCards('h') && event.num > 0 },
        content: function () {
            'step 0'
            var players = game.filterPlayer(function (current) {
                return current.isFriendOf(trigger.source) && current.hp >= player.hp && !game.hasPlayer(function (current2) {
                    return current2.hp > current.hp && current2.isFriendOf(trigger.source);
                })
            });
            var check = true;
            if (!players.length) check = false;
            else {
                if (get.attitude(player, trigger.source) >= 0) check = false;
            }
            player.chooseCard(get.prompt('zxfudi', trigger.source), '交给其一张手牌，然后对其势力中体力值最大且不小于你的一名角色造成1点伤害').set('aicheck', check).set('ai', function (card) {
                if (!_status.event.aicheck) return 0;
                return 9 - get.value(card);
            }).setHiddenSkill(event.name);
            'step 1'
            if (result.bool) {
                player.logSkill('zxfudi', trigger.source);
                player.give(result.cards, trigger.source);
            }
            else event.finish();
            'step 2'
            var list = game.filterPlayer(function (current) {
                return current.hp >= player.hp && current.isFriendOf(trigger.source) && !game.hasPlayer(function (current2) {
                    return current2.hp > current.hp && current2.isFriendOf(trigger.source);
                });
            });
            if (list.length) {
                if (list.length == 1) event._result = { bool: true, targets: list };
                else player.chooseTarget(true, '对' + get.translation(trigger.source) + '势力中体力值最大的一名角色造成1点伤害', function (card, player, target) {
                    return _status.event.list.includes(target);
                }).set('list', list).set('ai', function (target) { return get.damageEffect(target, player, player) });
            }
            else event.finish();
            'step 3'
            if (result.bool && result.targets.length) {
                player.line(result.targets[0]);
                result.targets[0].damage();
            }
        },
        ai: {
            maixie: true,
            maixie_defend: true,
            effect: {
                target: function (card, player, target) {
                    if (get.tag(card, 'damage') && target.hp > 1) {
                        if (player.hasSkillTag('jueqing', false, target)) return [1, -2];
                        if (!target.countCards('h')) return [1, -1];
                        if (game.countPlayer(function (current) { return current.isFriendOf(player) && current.hp >= target.hp - 1 })) return [1, 0, 0, -2];
                    }
                }
            }
        }
    },
    txjizhen: {
        audio: 'yanzheng',
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        filter: function (event, player) {
            for (var i = 0; i < game.players.length; i++) {
                if (game.players[i].isIn()) {
                    return true;
                }
            }
            return false;
        },
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt('txjizhen'), '令任意名角色各摸一张牌', [1, Infinity], function (card, player, target) {
                return target.isIn();
            }).set('ai', function (target) {
                return get.attitude(player, target);
            });
            'step 1'
            if (result.bool) {
                player.logSkill('txjizhen', result.targets);
                game.asyncDraw(result.targets);
            }
        },
        ai: {
            expose: 0.3,
            threaten: 1.3
        }
    },
    txhj_qiangzheng: {
        audio: 2,
        trigger: { player: 'phaseJieshuBegin' },
        forced: true,
        unique: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && current.countCards('h');
            });
        },
        content: function () {
            "step 0"
            var players = get.players(player);
            players.remove(player);
            event.players = players;
            player.line(players, 'green');
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                var hs = current.getCards('h')
                if (hs.length) {
                    var card = hs.randomGet();
                    player.gain(card, current);
                    current.$giveAuto(card, player);
                }
                event.redo();
            }
        }
    },
    txhj_xixing: {
        trigger: { player: 'phaseZhunbeiBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('txhj_xixing'), function (card, player, target) {
                return player != target && target.isLinked();
            }).ai = function (target) {
                return get.damageEffect(target, player, player, 'thunder');
            }
            "step 1"
            if (result.bool) {
                player.logSkill('txhj_xixing', result.targets);
                result.targets[0].damage('thunder');
                player.recover();
            }
        },
    },
    pytongling: {
        audio: 'daming',
        trigger: { source: 'damageSource' },
        filter: function (event, player) {
            if (event.player.isFriendOf(player)) return false;
            return player.isPhaseUsing() && event.player.isIn() && !player.hasSkill('pytongling_used');
        },
        direct: true,
        content: function () {
            'step 0'
            var str = '';
            if (get.itemtype(trigger.cards) == 'cards' && trigger.cards.filterInD().length) str += '；未造成伤害，其获得' + get.translation(trigger.cards.filterInD());
            player.chooseTarget(get.prompt('pytongling'), '令一名势力与你相同的角色选择是否对其使用一张牌。若使用且此牌：造成伤害，你与其各摸两张牌' + str, function (card, player, target) {
                return target.isFriendOf(player);
            }).set('ai', function (target) {
                var aim = _status.event.aim;
                var cards = target.getCards('hs', function (card) {
                    return target.canUse(card, aim, false) && get.effect(aim, card, target, player) > 0 && get.effect(aim, card, target, target) > 0;
                })
                if (cards.length) return cards.some(card => get.tag(card, 'damage')) ? 2 : 1;
                return 0;
            }).set('aim', trigger.player);
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                event.target = target;
                player.logSkill('pytongling', target);
                player.addTempSkill('pytongling_used', 'phaseUseAfter');
                player.line2([target, trigger.player]);
                target.chooseToUse(function (card, player, event) {
                    return lib.filter.filterCard.apply(this, arguments);
                }, '通令：是否对' + get.translation(trigger.player) + '使用一张牌？').set('targetRequired', true).set('complexSelect', true).set('filterTarget', function (card, player, target) {
                    if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) return false;
                    return lib.filter.targetEnabled.apply(this, arguments);
                }).set('sourcex', trigger.player).set('addCount', false);
            }
            else event.finish();
            'step 2'
            if (result.bool) {
                if (target.hasHistory('sourceDamage', evt => evt.getParent(4).name == 'pytongling')) {
                    player.draw(2, 'nodelay');
                    target.draw(2);
                }
                else {
                    if (get.itemtype(trigger.cards) == 'cards' && trigger.cards.filterInD().length && trigger.player.isIn()) trigger.player.gain(trigger.cards.filterInD(), 'gain2');
                }
            }
        },
        subSkill: { used: { charlotte: true } },
    },
    //海外星张郃
    twzhilve: {
        audio: 'zhilve',
        trigger: { player: 'phaseZhunbeiBegin' },
        content: function () {
            'step 0'
            if (!player.canMoveCard()) event._result = { index: 1 };
            else player.chooseControl().set('choiceList', [
                '移动场上的一张牌',
                '本回合的摸牌阶段多摸一张牌且第一张杀无距离次数限制',
            ]).set('ai', function () { return 1 });
            'step 1'
            if (result.index == 1) {
                player.addTempSkill('twzhilve_yingzi');
                if (!player.getHistory('useCard', function (card) {
                    return card.card.name == 'sha';
                }).length) player.addTempSkill('twzhilve_xiandeng');
                event.finish();
            }
            else player.moveCard(true);
            'step 2'
            if (result.position == 'e') player.loseHp();
            else player.addTempSkill('twzhilve_dis');
        },
        subSkill: {
            dis: {
                mod: {
                    maxHandcard: function (player, num) {
                        return num - 1;
                    },
                },
            },
            yingzi: {
                trigger: { player: 'phaseDrawBegin2' },
                popup: false,
                forced: true,
                filter: function (event, player) {
                    return !event.numFixed;
                },
                content: function () { trigger.num++ },
            },
            xiandeng: {
                mod: {
                    targetInRange: function (card, player) {
                        if (card.name == 'sha') return true;
                    },
                },
                trigger: { player: 'useCard1' },
                forced: true,
                popup: false,
                firstDo: true,
                filter: function (event, player) {
                    return event.card.name == 'sha';
                },
                content: function () {
                    player.removeSkill(event.name);
                    if (trigger.addCount !== false) {
                        trigger.addCount = false;
                        var stat = player.getStat('card');
                        if (stat && stat.sha) stat.sha--;
                    }
                },
            },
        },
    },
    new_shushen: {
        audio: "shushen",
        trigger: {
            player: "recoverAfter",
        },
        direct: true,
        preHidden: true,
        content: function () {
            'step 0'
            event.num = trigger.num || 1;
            "step 1"
            player.chooseTarget(get.prompt2('new_shushen'), function (card, player, target) {
                return target != player;
            }).set('ai', function (target) {
                return get.attitude(_status.event.player, target);
            }).setHiddenSkill('new_shushen');
            "step 2"
            if (result.bool) {
                player.logSkill('new_shushen', result.targets);
                result.targets[0].draw();
                if (event.num > 1) {
                    event.num--;
                    event.goto(1);
                }
            }
        },
        ai: {
            threaten: 0.8,
            expose: 0.1,
        },
    },
    tx_lianyu: {
        trigger: { player: 'phaseJieshuBegin' },
        unique: true,
        content: function () {
            "step 0"
            event.players = get.players(player);
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                if (current.isEnemyOf(player)) {
                    player.line(current, 'fire');
                    current.damage('fire');
                }
                event.redo();
            }
        },
        ai: {
            threaten: 2
        }
    },
    txhj_qiangduo: {
        audio: 2,
        trigger: { player: 'phaseZhunbeiBegin' },
        //forced:true,
        unique: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && current.countCards('he');
            });
        },
        content: function () {
            "step 0"
            var players = get.players(player);
            players.remove(player);
            event.players = players;
            player.line(players, 'green');
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                var hs = current.getCards('he')
                if (hs.length) {
                    var card = hs.randomGet();
                    player.gain(card, current);
                    current.$giveAuto(card, player);
                }
                event.redo();
            }
        }
    },
    txlipo: {
        trigger: { player: 'useCardToPlayered', target: 'useCardToTargeted' },
        forced: true,
        filter: function (event, player) {
            if (event.card.name != 'sha') return false;
            if (player == event.player) {
                return event.target.hasSex('male');
            }
            return event.player.hasSex('male');
        },
        check: function (event, player) {
            return player == event.player;
        },
        content: function () {
            var id = (player == trigger.player ? trigger.target : player).playerid;
            var map = trigger.getParent().customArgs;
            if (!map[id]) map[id] = {};
            if (typeof map[id].shanRequired == 'number') {
                map[id].shanRequired++;
            }
            else {
                map[id].shanRequired = 2;
            }
        },
        ai: {
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                if (arg.card.name != 'sha' || !arg.target.hasSex('male') || arg.target.countCards('h', 'shan') > 1) return false;
            },
        },
    },
    //新杀许靖

    txanzhan: {
        audio: 2,
        enable: 'chooseToUse',
        locked: false,
        mod: {
            targetInRange: function (card) {
                if (card.storage && card.storage.txanzhan) return true;
            },
        },
        viewAsFilter: function (player) {
            return player.hasCard(function (card) {
                return get.type(card) == 'basic';
            }, 'hs');
        },
        position: 'hs',
        filterCard: { type: 'basic' },
        viewAs: {
            name: 'sha',
            storage: { txanzhan: true },
        },
        check: function (card) {
            return 6 - get.value(card);
        },
        ai: {
            respondSha: true,
            skillTagFilter: function (player) {
                return player.hasCard(function (card) {
                    return get.type(card) == 'basic';
                }, 'hs');
            },
        },
        group: 'txanzhan_base',
        subSkill: {
            base: {
                trigger: { player: 'useCard1' },
                forced: true,
                popup: false,
                firstDo: true,
                filter: function (event, player) {
                    return event.skill == 'txanzhan' && event.targets.length > 0;
                },
                content: function () {
                    trigger.baseDamage = Math.min(6, get.distance(player, trigger.targets[0]));
                },
            },
        },
    },
    //虎牢关之战
    txaozhan: {
        forced: true,
        locked: true,
        charlotte: true,
        group: ["txaozhan_wuqi", "txaozhan_fangju", "txaozhan_zuoji", "txaozhan_baowu"],
        subSkill: {
            wuqi: {
                mod: {
                    cardUsable: function (card, player, num) {
                        if (player.getEquip(1) && card.name == 'sha') return num + 1;
                    },
                },
                sub: true,
            },
            fangju: {
                trigger: {
                    player: "damageBegin4",
                },
                forced: true,
                filter: function (event, player) {
                    return player.getEquip(2) && event.num > 1;
                },
                content: function () {
                    trigger.num = 1;
                },
                sub: true,
            },
            zuoji: {
                trigger: {
                    player: "phaseDrawBegin",
                },
                forced: true,
                filter: function (event, player) {
                    return (player.getEquip(3) || player.getEquip(4));
                },
                content: function () {
                    trigger.num++;
                },
                sub: true,
            },
            baowu: {
                trigger: {
                    player: "phaseJudgeBefore",
                },
                forced: true,
                filter: function (event, player) {
                    return player.getEquip(5);
                },
                content: function () {
                    trigger.cancel();
                    game.log(player, '跳过了判定阶段');
                },
                sub: true,
            },
        },
    },
    txjingjia: {
        group: ["txjingjia1", "txjingjia2", "txjingjia3"],
        trigger: {
            global: 'phaseBefore',
            player: 'enterGame',
        },
        forced: true,
        locked: false,
        filter: function (event, player) {
            return (event.name != 'phase' || game.phaseNumber == 0) && player.hasEquipableSlot(1);
        },
        content: function () {
            if (!lib.inpile.includes('wushuangfangtianji')) {
                lib.inpile.push('wushuangfangtianji');
                player.equip(game.createCard('wushuangfangtianji', 'diamond', 13));
            }
            else {
                var card = get.cardPile(function (card) {
                    return card.name == 'wushuangfangtianji' && !player.getEquips(1).includes(card);
                }, 'field');
                if (card) player.equip(card);
            }
        },
    },
    txjingjia1: {
        trigger: {
            global: 'phaseBefore',
            player: 'enterGame',
        },
        forced: true,
        locked: false,
        filter: function (event, player) {
            return (event.name != 'phase' || game.phaseNumber == 0) && player.hasEquipableSlot(2);
        },
        content: function () {
            if (!lib.inpile.includes('hongmianbaihuapao')) {
                lib.inpile.push('hongmianbaihuapao');
                player.equip(game.createCard('hongmianbaihuapao', 'club', 10));
            }
            else {
                var card = get.cardPile(function (card) {
                    return card.name == 'hongmianbaihuapao' && !player.getEquips(2).includes(card);
                }, 'field');
                if (card) player.equip(card);
            }
        },
    },
    txjingjia2: {
        trigger: {
            global: 'phaseBefore',
            player: 'enterGame',
        },
        forced: true,
        locked: false,
        filter: function (event, player) {
            return (event.name != 'phase' || game.phaseNumber == 0) && player.hasEquipableSlot(5);
        },
        content: function () {
            if (!lib.inpile.includes('shufazijinguan')) {
                lib.inpile.push('shufazijinguan');
                player.equip(game.createCard('shufazijinguan', 'spade', 7));
            }
            else {
                var card = get.cardPile(function (card) {
                    return card.name == 'shufazijinguan' && !player.getEquips(5).includes(card);
                }, 'field');
                if (card) player.equip(card);
            }
        },
    },
    txjingjia3: {
        trigger: {
            global: 'phaseBefore',
            player: 'enterGame',
        },
        forced: true,
        locked: false,
        filter: function (event, player) {
            return (event.name != 'phase' || game.phaseNumber == 0) && player.hasEquipableSlot(3);
        },
        content: function () {
            if (!lib.inpile.includes('chitu')) {
                lib.inpile.push('chitu');
                player.equip(game.createCard('chitu', 'heart', 2));
            }
            else {
                var card = get.cardPile(function (card) {
                    return card.name == 'chitu' && !player.getEquips(3).includes(card);
                }, 'field');
                if (card) player.equip(card);
            }
        },
    },
    txwudong: {
        trigger: { global: 'phaseAfter' },
        filter: function (summer, txhj_bosslvbu1) {
            return summer.player != txhj_bosslvbu1 && txhj_bosslvbu1.countCards('h') < txhj_bosslvbu1.hp;
        },
        line: { color: [251, 193, 217] },
        logTarget: 'player',
        charlotte: true,
        content: function () {
            'step 0'
            player.link();
            'step 1'
            player.draw(1);
            player.insertPhase();
            player.storage.lvbu_wudong = trigger.player;
            player.addTempSkill('lvbu_wudong');
        },
    },
    lvbu_wudong: {
        mark: 'character',
        intro: {
            content: '到$的距离视为1',
        },
        onremove: true,
        charlotte: true,
        mod: {
            globalFrom: function (umi, shiroha) {
                if (umi.storage.lvbu_wudong == wudong) return -Infinity;
            },
        },
    },
    wzpaoxiao: {
        audio: "paoxiao",
        trigger: {
            player: "useCard",
        },
        filter: function (event, player) {
            if (_status.currentPhase != player) return false;
            if (event.card.name != 'sha') return false;
            var history = player.getHistory('useCard', function (evt) {
                return evt.card.name == 'sha';
            });
            return history && history.indexOf(event) == 1;
        },
        forced: true,
        preHidden: true,
        content: function () {
            player.draw();
        },
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return Infinity;
            },
        },
        ai: {
            unequip: true,
            skillTagFilter: function (player, tag, arg) {
                if (!get.zhu(player, 'shouyue')) return false;
                if (arg && arg.name == 'sha') return true;
                return false;
            },
        },
    },
    txshenwei: {
        audio: "shenwei",
        unique: true,
        trigger: { player: 'phaseDrawBegin' },
        forced: true,
        content: function () {
            trigger.num += Math.min(3, game.players.length - 1);
        },
        mod: {
            maxHandcard: function (player, current) {
                return current + Math.min(3, game.players.length - 1);
            }
        }
    },
    txxiuluo: {
        audio: "xiuluo",
        trigger: { player: 'phaseZhunbeiBegin' },
        direct: true,
        filter: function (event, player) {
            return player.countCards('j') > 0;
        },
        content: function () {
            "step 0"
            var next = player.discardPlayerCard(player, 2, 'hj', '是否一张手牌来弃置一张花色相同的判定牌？');
            next.filterButton = function (button) {
                var card = button.link;
                if (!lib.filter.cardDiscardable(card, player)) return false;
                if (ui.selected.buttons.length == 0) return true;
                if (get.position(ui.selected.buttons[0].link) == 'h') {
                    if (get.position(card) != 'j') return false;
                }
                if (get.position(ui.selected.buttons[0].link) == 'j') {
                    if (get.position(card) != 'h') return false;
                }
                return get.suit(card) == get.suit(ui.selected.buttons[0].link)
            };
            next.ai = function (button) {
                var card = button.link;
                if (get.position(card) == 'h') {
                    return 11 - get.value(card);
                }
                if (card.name == 'lebu') return 5;
                if (card.name == 'bingliang') return 4;
                if (card.name == 'guiyoujie') return 3;
                return 2;
            };
            next.logSkill = 'txxiuluo';
            "step 1"
            if (result.bool && player.countCards('j')) event.goto(0);
        }
    },
    txhouyuan9: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuan9 = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuan9) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuan9');
            player.storage.txhouyuan9 = true;
            player.discard(player.getCards('hj'));
            'step 1'
            player.uninit();
            player.init('txhj_bosslvbu3');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuan9) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuan9) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    txshenqu: {
        audio: "shenqu",
        group: 'txshenqu2',
        trigger: { global: 'phaseZhunbeiBegin' },
        filter: function (event, player) {
            return player.countCards('h') <= player.maxHp;
        },
        frequent: true,
        content: function () {
            player.draw(2);
        }
    },
    txshenqu2: {
        trigger: { player: 'damageAfter' },
        direct: true,
        filter: function (event, player) {
            return player.hasSkillTag('respondTao') || player.countCards('h', 'tao') > 0;
        },
        content: function () {
            player.chooseToUse({ name: 'tao' }, '神躯：是否使用一张桃？').logSkill = 'txshenqu';
        }
    },
    txjiwu: {
        audio: "jiwu",
        enable: 'phaseUse',
        filter: function (event, player) {
            if (player.countCards('h') == 0) return false;
            if (!player.hasSkill('qiangxix')) return true;
            if (!player.hasSkill('retieji')) return true;
            if (!player.hasSkill('rexuanfeng')) return true;
            if (!player.hasSkill('wansha')) return true;
            return false;
        },
        filterCard: true,
        position: 'he',
        check: function (card) {
            if (get.position(card) == 'e' && _status.event.player.hasSkill('rexuanfeng')) return 16 - get.value(card);
            return 7 - get.value(card);
        },
        content: function () {
            'step 0'
            var list = [];
            if (!player.hasSkill('qiangxix')) list.push('qiangxix');
            if (!player.hasSkill('retieji')) list.push('retieji');
            if (!player.hasSkill('rexuanfeng')) list.push('rexuanfeng');
            if (!player.hasSkill('wansha')) list.push('wansha');
            if (list.length == 1) {
                player.addTempSkill(list[0]);
                event.finish();
            }
            else {
                player.chooseControl(list, function () {
                    if (list.includes('rexuanfeng') && player.countCards('he', { type: 'equip' })) return 'rexuanfeng';
                    if (!player.getStat().skill.qiangxix) {
                        if (player.hasSkill('qiangxix') && player.getEquip(1) && list.includes('rexuanfeng')) return 'rexuanfeng';
                        if (list.includes('wansha') || list.includes('qiangxix')) {
                            var players = game.filterPlayer();
                            for (var i = 0; i < players.length; i++) {
                                if (players[i].hp == 1 && get.attitude(player, players[i]) < 0) {
                                    if (list.includes('wansha')) return 'wansha';
                                    if (list.includes('qiangxix')) return 'qiangxix';
                                }
                            }
                        }
                    }
                    if (list.includes('qiangxix')) return 'qiangxix';
                    if (list.includes('wansha')) return 'wansha';
                    if (list.includes('rexuanfeng')) return 'rexuanfeng';
                    return 'retieji';
                }).set('prompt', '选择获得一项技能直到回合结束');
            }
            'step 1'
            player.addTempSkill(result.control);
            player.popup(get.translation(result.control));
        },
        ai: {
            order: function () {
                var player = _status.event.player;
                if (player.countCards('e', { type: 'equip' })) return 10;
                if (!player.getStat().skill.qiangxix) {
                    if (player.hasSkill('qiangxix') && player.getEquip(1) && !player.hasSkill('rexuanfeng')) return 10;
                    if (player.hasSkill('wansha')) return 1;
                    var players = game.filterPlayer();
                    for (var i = 0; i < players.length; i++) {
                        if (players[i].hp == 1 && get.attitude(player, players[i]) < 0) return 10;
                    }
                }
                return 1;
            },
            result: {
                player: function (player) {
                    if (player.countCards('e', { type: 'equip' })) return 1;
                    if (!player.getStat().skill.qiangxix) {
                        if (player.hasSkill('qiangxix') && player.getEquip(1) && !player.hasSkill('rexuanfeng')) return 1;
                        if (!player.hasSkill('wansha') || !player.hasSkill('qiangxix')) {
                            var players = game.filterPlayer();
                            for (var i = 0; i < players.length; i++) {
                                if (players[i].hp == 1 && get.attitude(player, players[i]) < 0) return 1;
                            }
                        }
                    }
                    return 0;
                }
            }
        }
    },
    //搬自阵面对决扩展
    zmquezhan: {
        enable: "phaseUse",
        usable: 1,
        audio: 'ext:太虚幻境/audio/skill:2',
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && player.canUse({ name: 'sha' }, current);
            });
        },
        filterTarget: function (card, player, target) {
            var length = ui.selected.cards.length;
            if (get.distance(player, target, 'attack') > 1) return false;
            return (length == 0 || length == 2) && player != target && player.canUse({ name: 'sha' }, target);
        },
        check: function (card) {
            return 6 - get.value(card);
        },
        filterCard: true,
        selectCard: [0, 2],
        position: "he",
        content: function () {
            "step 0"
            var list = ['失去体力', '翻面'];
            event.list = list;
            if (cards.length == 2) {
                event.goto(2);
            }
            else {
                player.chooseControl(event.list).set('ai', function (evt, player) {
                    var controls = _status.event.controls;
                    var player = _status.event.player;
                    if (player.isTurnedOver()) {
                        return '翻面';
                    }
                    if (player.countCards('h', 'tao') >= 1) {
                        return '失去体力';
                    }
                    return '失去体力';
                }).set('prompt', '雀斩：请选择一项，视为对' + get.translation(target) + '使用一张【杀】');
            }
            "step 1"
            if (result.control == '失去体力') {
                player.loseHp();
            }
            else if (result.control == '翻面') {
                player.turnOver();
            }
            "step 2"
            player.addTempSkill('zmquezhan2');
            player.storage.zmquezhan = target;
            player.useCard({ name: 'sha', isCard: true }, target, false);
        },
        ai: {
            order: 4,
            result: {
                target: function (player, target) {
                    if (player.countCards('he') <= 2 || !player.countCards('he', 'tao')) {
                        if (player.hp < 2) return 0;
                        if (target.hp >= player.hp) return 0;
                    }
                    return get.damageEffect(target, player);
                }
            }
        },
    },
    "zmquezhan2": {
        trigger: {
            player: "useCard",
        },
        silent: true,
        forced: true,
        popup: false,
        onremove: function (player) {
            delete player.storage.zmquezhan;
            delete player.storage.zmquezhan2;
        },
        filter: function (event, player) {
            var evt = event.getParent(2);
            return evt.skill == 'zmquezhan';
        },
        content: function () {
            player.storage.zmquezhan2 = trigger.card;
        },
        group: ["zmquezhan2_damage", "zmquezhan2_reset"],
        subSkill: {
            damage: {
                trigger: {
                    source: "damage",
                },
                silent: true,
                forced: true,
                popup: false,
                filter: function (event, player) {
                    return player.storage.zmquezhan && event.card == player.storage.zmquezhan2;
                },
                content: function () {
                    player.addTempSkill('zmquezhan3');
                },
                sub: true,
            },
            reset: {
                trigger: {
                    player: "useCardAfter",
                },
                forced: true,
                silent: true,
                popup: false,
                filter: function (event, player) {
                    return player.storage.zmquezhan && event.card == player.storage.zmquezhan2;
                },
                content: function () {
                    "step 0"
                    if (!player.hasSkill('zmquezhan3')) event.finish();
                    var list = ['弃牌', '失去体力', '翻面'];
                    event.list = list;
                    if (player.storage.zmquezhan.countCards('he') < 2) event.list.remove('弃牌');
                    player.storage.zmquezhan.chooseControl(event.list).set('ai', function (evt, player) {
                        var controls = _status.event.controls;
                        var player = _status.event.player;
                        if (player.isTurnedOver()) {
                            return '翻面';
                        }
                        if (controls.includes('弃牌')) {
                            return '弃牌';
                        }
                        else if (player.hp > 2 || player.countCards('h', 'tao') >= 1) {
                            return '失去体力';
                        }
                        return controls.randomGet();
                    }).set('prompt', '雀斩：请选择一项');
                    "step 1"
                    if (result.control == '弃牌') {
                        player.storage.zmquezhan.chooseToDiscard(2, 'he', true);
                    }
                    else if (result.control == '失去体力') {
                        player.storage.zmquezhan.loseHp();
                    }
                    else if (result.control == '翻面') {
                        player.storage.zmquezhan.turnOver();
                    }
                    "step 2"
                    player.removeSkill('zmquezhan3');
                    player.removeSkill('zmquezhan2');
                },
                sub: true,
            },
        },
    },
    "zmquezhan3": {
    },
    //副本pve技能
    txxiongshou: {
        group: ['txxiongshou_turn', 'txxiongshou_damage'],
        subSkill: {
            damage: {
                trigger: { source: 'damageBegin1' },
                forced: true,
                filter: function (event, player) {
                    return event.notLink() && event.card && event.card.name == 'sha' && event.player.hp < player.hp;
                },
                content: function () {
                    trigger.num++;
                }
            },
            turn: {
                trigger: { player: 'turnOverBefore' },
                priority: 20,
                forced: true,
                filter: function (event, player) {
                    return !player.isTurnedOver();
                },
                content: function () {
                    trigger.cancel();
                    game.log(player, '取消了翻面');
                },
            }
        },
        mod: {
            globalFrom: function (from, to, distance) {
                return distance - 1;
            }
        },
        ai: {
            noturn: true,
        }
    },
    txhouyuan0: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuan0 = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuan0) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuan0');
            player.storage.txhouyuan0 = true;
            player.discard(player.getCards('hej'));
            'step 1'
            player.uninit();
            player.init('txhj_zhuyin');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuan0) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuan0) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    txminbao: {
        global: 'txminbao2'
    },
    txminbao2: {
        trigger: { global: 'dieAfter' },
        forced: true,
        globalFixed: true,
        filter: function (event, player) {
            return event.player.hasSkill('txminbao') && event.player.isDead();
        },
        content: function () {
            trigger.player.line(player, 'fire');
            player.damage('nosource', 'fire').animate = false;
            player.$damage(trigger.player);
            player.$damagepop(-1, 'fire');
            if (lib.config.animation && !lib.config.low_performance) {
                player.$fire();
            }
            if (!event.parent.parent.txminbao_logv) {
                event.parent.parent.txminbao_logv = true;
                game.logv(trigger.player, 'txminbao', game.filterPlayer(), event.parent.parent);
            }
        }
    },
    txwuyou: {
        /*	mod:{
                targetEnabled:function(card,player,target){
                    if(get.type(card)=='delay'){
                        return false;
                    }
                },
            },*/
        trigger: {
            player: ['phaseZhunbeiBefore', 'phaseJieshuBefore'],
        },
        forced: true,
        audio: 2,
        group: 'txwuyou2',
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了', event.triggername == 'phaseZhunbeiBefore' ? '准备阶段' : '结束阶段');
        },
    },
    txwuyou2: {
        popup: false,
        trigger: {
            player: "phaseJudgeBefore",
        },
        forced: true,
        content: function () {
            /*	trigger.cancel();
                game.log(player,'跳过了判定阶段');*/
            player.skip('phaseDraw');
            player.skip('phaseUse');
        },
    },
    txxiongqu: {
        mod: {
            targetEnabled: function (card, player, target, now) {
                if (card.name == 'toulianghuanzhu' || card.name == 'fudichouxin') return false;
            }
        },
        audio: 2,
    },
    /*新杀龙舟npc*/
    //以下代码全部搬运自【活动Boss】扩展，并特此非常感谢其作者（烟雨墨染）大佬 !!!
    "taoshen_nutao": {
        audio: 1,
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.getEnemies().includes(current);
            });
        },
        content: function () {
            var list = game.filterPlayer(function (current) {
                return player.getEnemies().includes(current);
            }).randomGet();
            player.line(list);
            list.damage('thunder');
        },
        ai: {
            expose: 0.2,
        },
    },
    "caoe_shoujiang": {
        audio: 1,
        trigger: {
            player: "damageBegin4",
        },
        forced: true,
        filter: function (event, player) {
            if (event.num <= 1) return false;
            return true;
        },
        content: function () {
            trigger.num = 1;
            player.draw();
        },
        ai: {
            filterDamage: true,
            skillTagFilter: function (player, tag, arg) {
                if (arg && arg.player) {
                    if (player.hasSkillTag('jueqing', false, player)) return false;
                }
            },
        },
    },
    "zuogu_jisheng": {
        audio: 1,
        trigger: {
            player: "phaseDrawBefore",
        },
        forced: true,
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了摸牌阶段');
        },
        group: ["zuogu_jisheng_loseHp", "zuogu_jisheng_wudi"],
        subSkill: {
            loseHp: {
                trigger: {
                    player: "damageEnd",
                },
                forced: true,
                audio: "zuogu_jisheng",
                filter: function (event, player) {
                    return game.hasPlayer(function (current) {
                        return (player.getFriends().includes(current) || current == player) && (current.sex == 'male' || current.sex == 'female');
                    });
                },
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return (player.getFriends().includes(current) || current == player) && (current.sex == 'male' || current.sex == 'female');
                    }).randomGet();
                    list.loseHp(trigger.num);
                },
                ai: {
                    threaten: 1.1,
                    neg: true,
                },
            },
            wudi: {
                trigger: {
                    player: "damageBegin4",
                },
                forced: true,
                audio: "zuogu_jisheng",
                filter: function (event, player) {
                    return game.roundNumber % 2 == 0;
                },

                content: function () {
                    trigger.cancel();
                },
                ai: {
                    nodamage: true,
                    effect: {
                        target: function (card, player, target, current) {
                            if (player.hasSkillTag('jueqing', false, target)) return;
                            if (game.roundNumber % 2 == 1) return;
                            if (get.tag(card, 'damage')) return 0;
                        },
                    },
                },
            },
        },
    },
    "zuogu_zuogu": {
        trigger: {
            player: 'damageEnd'
        },
        forced: true,
        filter: function (event, player) {
            return event.source && event.source.isIn();
        },
        content: function () {
            if (player.getHistory('damage').indexOf(trigger) == 0) trigger.source.draw(2);
            if (player.getHistory('damage').indexOf(trigger) == 1) trigger.source.chooseToDiscard(2, 'he', true);
            if (player.getHistory('damage').indexOf(trigger) > 1) trigger.source.loseHp();
        },
    },
    "yougu_yougu": {
        trigger: {
            player: 'damageEnd'
        },
        forced: true,
        filter: function (event, player) {
            return event.source && event.source.isIn();
        },
        content: function () {
            if (player.getHistory('damage').indexOf(trigger) == 0) trigger.source.recover();
            if (player.getHistory('damage').indexOf(trigger) == 1) trigger.source.damage();
            if (player.getHistory('damage').indexOf(trigger) > 1) trigger.source.chooseToDiscard(2, 'he', true);
        },
    },
    "yougu_ousheng": {
        audio: 1,
        trigger: {
            player: "phaseDrawBefore",
        },
        forced: true,
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了摸牌阶段');
        },
        group: ["yougu_ousheng_loseHp", "yougu_ousheng_wudi"],
        subSkill: {
            loseHp: {
                trigger: {
                    player: "damageEnd",
                },
                forced: true,
                audio: "yougu_ousheng",
                filter: function (event, player) {
                    return game.hasPlayer(function (current) {
                        return (player.getFriends().includes(current) || current == player) && (current.sex == 'male' || current.sex == 'female');
                    });
                },
                content: function () {
                    var list = game.filterPlayer(function (current) {
                        return (player.getFriends().includes(current) || current == player) && (current.sex == 'male' || current.sex == 'female');
                    }).randomGet();
                    list.loseHp(trigger.num);
                },
                ai: {
                    threaten: 1.1,
                    neg: true,
                },
            },
            wudi: {
                trigger: {
                    player: "damageBegin4",
                },
                forced: true,
                audio: "yougu_ousheng",
                filter: function (event, player) {
                    return game.roundNumber % 2 == 1;
                },

                content: function () {
                    trigger.cancel();
                },
                ai: {
                    nodamage: true,
                    effect: {
                        target: function (card, player, target, current) {
                            if (player.hasSkillTag('jueqing', false, target)) return;
                            if (game.roundNumber % 2 == 0) return;
                            if (get.tag(card, 'damage')) return 0;
                        },
                    },
                },
            },
        },
    },
    txhouyuanlz: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuanlz = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuanlz) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuanlz');
            player.storage.txhouyuanlz = true;
            player.discard(player.getCards('hj'));
            'step 1'
            player.uninit();
            player.init('txhj_taoshen');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuanlz) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuanlz) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    "taoshen_xiongzi": {
        trigger: {
            player: "phaseDrawBegin2",
        },
        audio: 1,
        forced: true,
        filter: function (event, player) {
            return !event.numFixed;
        },
        content: function () {
            if (player.countCards('h') <= 2) {
                trigger.num += 3;
            } else { trigger.num++; }
        },
        ai: {
            threaten: 1.3,
        },
    },
    "taoshen_paoxiao": {
        audio: 1,
        firstDo: true,
        trigger: {
            player: "useCard",
        },
        forced: true,
        filter: function (event, player) {
            return !event.audioed && event.card.name == 'sha' && player.countUsed('sha', true) > 0 && event.getParent().type == 'phase';
        },
        content: function () {
            trigger.audioed = true;
            player.addTempSkill('taoshen_paoxiao_xiaoguo', 'phaseUseAfter');
        },
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return Infinity;
            },
        },
        ai: {
            threaten: 0.5,
            skillTagFilter: function (player, tag, arg) {
                if (!get.zhu(player, 'shouyue')) return false;
                if (arg && arg.name == 'sha') return true;
                return false;
            },
        },
        subSkill: {
            xiaoguo: {
                marktext: "咆哮",
                mark: true,
                intro: {
                    name: "咆哮",
                    content: "本阶段使用【杀】无距离限制",
                },
                charlotte: true,
                mod: {
                    targetInRange: function (card, player) {
                        if (card.name == 'sha') return true;
                    },
                },
                sub: true,
            },
        },
    },
    //以下代码搬运自【阵面对决】扩展!
    txqingshu: {
        trigger: {
            global: "phaseZhunbeiBegin",
        },
        direct: true,
        filter: function (event, player) {
            return event.player.isAlive() && event.player != player &&
                lib.filter.targetEnabled({ name: 'sha' }, player, event.player) && player.countCards('h');
        },
        content: function () {
            'step 0'
            var check = get.attitude(player, trigger.player) < 0;
            player.chooseToDiscard(get.prompt2('txqingshu')).set('ai', function (card) {
                if (_status.event.check) {
                    return 6 - get.value(card);
                }
                return 0;
            }).set('check', check);
            'step 1'
            if (result.bool) {
                player.logSkill('txqingshu');
                player.addTempSkill('txqingshu2');
                player.useCard({ name: 'sha', isCard: true }, trigger.player, false);
            }
        },
    },
    "txqingshu2": {
        trigger: {
            player: "useCard",
        },
        silent: true,
        forced: true,
        popup: false,
        onremove: function (player) {
            delete player.storage.txqingshu2;
        },
        filter: function (event, player) {
            var evt = event.getParent(2);
            return evt.skill == 'txqingshu';
        },
        content: function () {
            player.storage.txqingshu2 = trigger.card;
        },
        group: "txqingshu2_damage",
        subSkill: {
            damage: {
                trigger: {
                    source: "damageAfter",
                },
                silent: true,
                forced: true,
                popup: false,
                filter: function (event, player) {
                    return player.storage.txqingshu2 && event.card == player.storage.txqingshu2 &&
                        event.player.isAlive() && event.player.countCards('he');
                },
                content: function () {
                    player.removeSkill('txqingshu2');
                    player.discardPlayerCard('he', trigger.player, true);
                },
                sub: true,
            },
        },
    },
    txchihun: {
        enable: "phaseUse",
        usable: 1,
        filter: function (event, player) {
            return player.countCards('he');
        },
        filterTarget: function (card, player, target) {
            return !target.isLinked();
        },
        position: "he",
        check: function (card) {
            return 6 - get.value(card);
        },
        filterCard: true,
        content: function () {
            'step 0'
            event.card = cards[0];
            if (target == player) player.recover();
            else {
                target.link(true);
                player.discardPlayerCard(target, 'he', true);
            }
            'step 1'
            if (get.color(event.card) == 'red') {
                player.chooseTarget('是否将' + get.translation(event.card) + '交给一名其他角色？', function (card, player, target) {
                    return player != target;
                }).set('ai', function (target) {
                    return get.attitude(_status.event.player, target);
                });
            }
            else event.finish();
            'step 2'
            if (result.bool) {
                player.line(result.targets[0], 'green');
                result.targets[0].gain(event.card, 'gain2');
            }
        },
        mod: {
            targetInRange: function (card, player, target) {
                if (target.isLinked()) {
                    return true;
                }
            },
            cardUsable: function (card, player, num) {
                if (typeof num == 'number' && game.hasPlayer(function (current) {
                    return current.isLinked();
                })) return Infinity;
            },
        },
        ai: {
            order: 10,
            result: {
                target: function (player, target) {
                    if (player == target && player.isDamaged()) return 5;
                    return -2;
                },
            },
        },
    },
    //以下代码全部搬运自【活动Boss】扩展，并特此非常感谢其作者（烟雨墨染）大佬 !!!
    //超时空密探            
    mitan_lingshou: {
        //group:'mitan_chooseskill_meihuashishan',
        //derivation:'mitan_chooseskill_meihuashishan',
        unique: true,
        forced: true,
        trigger: { global: 'damageBegin4' },
        filter: function (event, player) {
            return event.player != player && player.getFriends().includes(event.player);
        },
        logTarget: 'player',
        content: function () {
            trigger.num--;
            player.loseHp();
            if (trigger.source && trigger.source.countCards('he') > 0) trigger.source.chooseToDiscard(2, 'he', true);
        },
        ai: {
            expose: 0.2
        },
    },
    mitan_meibiao: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'useCard' },
        forced: true,
        filter: function (event, player) {
            return get.suit(event.card) == 'club';
        },
        content: function () {
            trigger.directHit.addArray(game.filterPlayer(function (current) {
                return current != player;
            }));
            game.log(trigger.card, '无法被', game.filterPlayer(function (current) {
                return current != player;
            }), '响应');
            if (get.tag(trigger.card, 'damage')) {
                trigger.baseDamage += 2;
                game.log(trigger.card, '造成的伤害基础值加二');
            }
        },
    },
    mitan_biandao: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'phaseUseAfter' },
        filter: function (event, player) {
            return player.getHistory('sourceDamage').length == 0;
        },
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) {
                return current != player && player.getEnemies().includes(current);
            });
        },
        forced: true,
        content: function () {
            'step 0'
            event.list = game.filterPlayer(function (current) {
                return current != player && player.getEnemies().includes(current);
            });
            event.list.sort(lib.sort.seat);
            'step 1'
            var target = event.list.shift();
            target.damage([1, 2].randomGet());
            if (event.list.length) event.redo();
        },
        ai: {
            expose: 0.2,
            threaten: 1.2,
        },
    },
    mitan_yingyue: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'useCard2' },
        filter: function (event, player) {
            if (player != _status.currentPhase || !event.targets || event.targets.length != 1) return false;
            return (event.card.name == 'sha' || get.type(event.card) == 'trick') && game.hasPlayer(function (current) {
                return current != player && !event.targets.includes(current);
            });
        },
        usable: 1,
        direct: true,
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt('mitan_yingyue'), '为' + get.translation(trigger.card) + '增加一个目标', function (card, player, target) {
                var evt = _status.event.getTrigger();
                return !evt.targets.includes(target) && lib.filter.filterTarget(evt.card, player, target);
            }).set('ai', function (target) {
                var evt = _status.event.getTrigger(), eff = get.effect(target, evt.card, evt.player, evt.player);
                return eff;
            }).animate = false;
            'step 1'
            if (result.bool) {
                if (player != game.me && !player.isOnline()) game.delayx();
                event.target = result.targets[0];
            }
            else event.finish();
            'step 2'
            player.logSkill('mitan_yingyue', target);
            trigger.targets.push(target);
            game.log(target, '成为了', trigger.card, '的额外目标');
        },
    },
    mitan_huti: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'damageBegin4' },
        filter: function (event, player) {
            return event.source && event.source != player && !event.source.getHistory('sourceDamage').length;
        },
        forced: true,
        usable: 1,
        content: function () {
            trigger.cancel();
            player.discard(player.getCards('he', function (card) {
                return lib.filter.cardDiscardable(card, player, 'mitan_huti');
            }).randomGet());
        },
    },
    mitan_zhibi: {
        skillAnimation: true,
        animationColor: 'wood',
        limited: true,
        mark: true,
        enable: 'phaseUse',
        intro: {
            content: 'limited'
        },
        filterTarget: function (card, player, target) {
            return target != player && player.getEnemies().includes(target);
        },
        content: function () {
            player.awakenSkill('mitan_zhibi');
            target.addTempSkill('mitan_zhibi_block');
        },
        subSkill: {
            block: {
                init: function (player, skill) {
                    player.addSkillBlocker(skill);
                },
                onremove: function (player, skill) {
                    player.removeSkillBlocker(skill);
                },
                charlotte: true,
                locked: true,
                skillBlocker: function (skill, player) {
                    return skill != 'mitan_zhibi_block' && !lib.skill[skill].charlotte;
                },
                mark: true,
                marktext: '封印',
                intro: {
                    name: '知彼',
                    content: '本回合所有技能失效',
                },
            }
        },
        ai: {
            order: 9,
            result: {
                target: -1,
            },
        },
    },
    mitan_shenghu: {
        //group:'mitan_chooseskill_wuliuqi',
        //derivation:'mitan_chooseskill_wuliuqi',
        unique: true,
        forced: true,
        trigger: { global: 'damageBegin4' },
        filter: function (event, player) {
            return event.player != player && player.getFriends().includes(event.player);
        },
        logTarget: 'player',
        content: function () {
            trigger.num--;
            player.loseHp();
            game.asyncDraw([player, trigger.player]);
        },
        ai: {
            expose: 0.2
        },
    },
    mitan_feijian: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'phaseUseAfter' },
        filter: function (event, player) {
            return player.getEquip(1) && player.getHistory('sourceDamage', function (evt) {
                return evt.player != player;
            }).length;
        },
        forced: true,
        logTarget: function (event, player) {
            var list = [];
            player.getHistory('sourceDamage', function (evt) {
                if (!list.includes(evt.player) && evt.player != player) list.push(evt.player);
            });
            return list.sortBySeat();
        },
        content: function () {
            'step 0'
            var card = player.getEquip(1);
            if (card) player.discard(card);
            var list = lib.skill.mitan_feijian.logTarget(trigger, player).sortBySeat();
            if (!list.length) event.finish();
            else event.list = list;
            'step 1'
            var target = event.list.shift();
            target.damage([2, 3, 4].randomGet());
            if (event.list.length) event.redo();
        },
    },
    mitan_yirong: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { source: 'damageBefore' },
        filter: function (event, player) {
            return game.players.length > 2;
        },
        usable: 1,
        direct: true,
        forced: true,
        content: function () {
            var list = game.filterPlayer();
            list.remove(player);
            list.remove(trigger.player);
            var target = list.randomGet();
            player.logSkill('mitan_yirong', target);
            trigger.source = target;
        },
    },
    mitan_qingsuo: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'damageEnd' },
        filter: function (event, player) {
            return event.source != player;
        },
        forced: true,
        logTarget: 'source',
        content: function () {
            player.turnOver();
            trigger.source.turnOver();
        },
    },
    mitan_xuefa: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { source: 'damageSource' },
        filter: function (event, player) {
            return event.player != player && event.player.countCards('he');
        },
        forced: true,
        content: function () {
            trigger.player.discard(trigger.player.getCards('he').randomGets([1, 2, 3].randomGet()));
        },
    },
    //驱鬼逐邪
    //孟婆
    "boss_aotang": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "phaseBegin",
        },
        direct: true,
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) { return player.getEnemies().includes(current) });
        },
        content: function () {
            var list = game.filterPlayer(function (current) { return player.getEnemies().includes(current) }).randomGet();
            player.line(list);
            player.logSkill('boss_aotang', list);
            list.addSkill('boss_aotang_fengyin');
        },
        group: "boss_aotang_delete",
        subSkill: {
            "delete": {
                trigger: {
                    player: ["phaseBegin", "dieBegin"],
                },
                direct: true,
                priority: 20,
                forced: true,
                content: function () {
                    game.countPlayer(function (current) {
                        if (current.hasSkill('boss_aotang_fengyin')) {
                            current.removeSkill('boss_aotang_fengyin');
                        }
                    });
                },
                sub: true,
            },
            fengyin: {
                charlotte: true,
                init: function (player, skill) {
                    player.addSkillBlocker(skill);
                },
                onremove: function (player, skill) {
                    player.removeSkillBlocker(skill);
                },
                skillBlocker: function (skill, player) {
                    return skill != 'boss_aotang_fengyin' && !lib.skill[skill].charlotte;
                },
                mark: true,
                intro: {
                    name: "熬汤",
                    content: function (storage, player, skill) {
                        var str = '无失效技能';
                        var list = player.getSkills(null, false, false).filter(function (i) { return lib.skill.boss_aotang_fengyin.skillBlocker(i, player) });
                        if (list.length) str = ('失效技能：' + get.translation(list));
                        return str;
                    },
                },
            },
        },
    },
    "boss_guimeic": {
        audio: 'ext:太虚幻境/audio/skill:true',
        group: ["boss_guimeic_draw", "boss_guimeic_use"],
        trigger: {
            player: "turnOverBefore",
        },
        priority: 20,
        filter: function (event, player) {
            return !player.isTurnedOver();
        },
        forced: true,
        direct: true,
        content: function () {
            player.logSkill("boss_guimeic");
            trigger.cancel();
            game.log(player, '取消了翻面');
        },
        subSkill: {
            draw: {
                trigger: {
                    player: "phaseDrawSkipped",
                },
                forced: true,
                direct: true,
                content: function () {
                    player.logSkill("boss_guimeic");
                    player.draw();
                },
                sub: true,
            },
            use: {
                trigger: {
                    player: "phaseUseSkipped",
                },
                forced: true,
                direct: true,
                content: function () {
                    player.logSkill("boss_guimeic");
                    player.addTempSkill('boss_guimeic_xiaoguo');
                },
                sub: true,
            },
            xiaoguo: {
                mod: {
                    ignoredHandcard: function (card, player) {
                        return true;
                    },
                    cardDiscardable: function (card, player, name) {
                        if (name == 'phaseDiscard') return false;
                    },
                },
                direct: true,
                unique: true,
                forced: true,
                fixed: true,
                sub: true,
                popup: false,
            },
        },
        ai: {
            noturn: true,
            effect: {
                target: function (card, player, target) {
                    if (get.type(card) == 'delay') return 0.5;
                },
            },
        },
    },
    "boss_yunjv": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        filter: function (event, player) {
            return player.getEnemies().includes(event.player) && event.player.countCards('he') > 0 && event.player != player;
        },
        logTarget: 'player',
        content: function () {
            if (trigger.player.countCards('h') > 0) {
                var card1 = trigger.player.getCards('h').randomGet();
            }
            if (trigger.player.countCards('e') > 0) {
                var card2 = trigger.player.getCards('e').randomGet();
            }
            if (trigger.player.countCards('e') > 0 && trigger.player.countCards('h') == 0) trigger.player.discard(card2);
            if (trigger.player.countCards('e') == 0 && trigger.player.countCards('h') > 0) trigger.player.discard(card1);
            if (trigger.player.countCards('e') > 0 && trigger.player.countCards('h') > 0) trigger.player.discard([card1, card2]);
        },
        ai: {
            expose: 0.2,
        },
    },
    //日夜游神
    "boss_duane": {
        trigger: {
            global: "loseAfter",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            if (event.type != 'discard' || !event.cards2 || !event.cards2.length) return false;
            var evt = event.getParent('phaseDiscard');
            var cards = [];
            for (var i of event.cards2) {
                if (get.color(i) == 'black') cards.add(i);
            }
            return evt && evt.player == event.player && player.getEnemies().includes(evt.player) && evt.player.isIn() && event.cards2 && cards.length > 0;
        },
        forced: true,
        content: function () {
            trigger.player.loseHp()
        },
        ai: {
            expose: 0.2,
        },
    },
    "boss_huiyun": {
        enable: "phaseUse",
        usable: 1,
        audio: 'ext:太虚幻境/audio/skill:true',
        filterTarget: function (card, player, target) {
            return player != target && target.countCards('h') && player.getEnemies().includes(target);
        },
        content: function () {
            "step 0"
            target.showHandcards();
            "step 1"
            player.chooseCardButton(true, target, target.getCards('h'), [1, 2]).set('ai', function (card) {
                return get.value(card);
            });
            "step 2"
            if (result.bool) {
                target.discard(result.links.slice(0));
                var qbx = []
                if (result.links.slice(0).length > 1) qbx = '或与' + get.translation(result.links[1])
                player.chooseToDiscard('弃置一张与' + get.translation(result.links[0]) + qbx + '同名的牌对' + get.translation(target) + '造成两点伤害', function (card) {
                    var abc = card.name == result.links[0].name
                    if (result.links.slice(0).length > 1) abc = card.name == result.links[0].name || card.name == result.links[1].name;
                    return abc
                }).set('ai', function (card) {
                    if (get.attitude(player, target) < 0) {
                        return 10 - get.value(card);
                    }
                    return 0;
                })
            }
            "step 3"
            if (result.bool) target.damage(2)
        },
        ai: {
            order: 11,
            result: {
                target: function (player, target) {
                    return -target.countCards('h');
                },
                tag: {
                    loseCard: 1,
                    damage: 2,
                },
            },
            threaten: 1.1,
        },
    },
    "boss_zhoucha": {
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        unique: true,
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'red' ? 2 : -1;
            });
            "step 1"
            player.gain(result.card);
            player.$gain2(result.card);
            if (result.judge > 0) {
                player.addTempSkill('boss_zhoucha_xiaoguo');
            }
        },
        subSkill: {
            xiaoguo: {
                marktext: "昼刹",
                mark: true,
                intro: {
                    name: "昼刹",
                    content: "本回合使用【杀】的次数+2",
                },
                unique: true,
                direct: true,
                forced: true,
                mod: {
                    cardUsable: function (card, player, num) {
                        if (card.name == 'sha') return num + 2;
                    },
                },
                sub: true,
                popup: false,
            },
        },
    },
    "boss_yezhong": {
        trigger: {
            player: "phaseJieshuBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        unique: true,
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'black' ? 2 : -1;
            });
            "step 1"
            player.gain(result.card);
            player.$gain2(result.card);
            if (result.judge > 0) {
                game.countPlayer(function (current) {
                    if (current != player && player.getEnemies().includes(current)) {
                        var hs = current.getCards('h');
                        if (hs.length) {
                            player.line(current);
                            current.discard(hs.randomGet()).discarder = player;
                        }
                    }
                })
            }
        },
    },
    //牛头马面
    "boss_xiaoshoua": {
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        direct: true,
        forced: true,
        filter: function (event, player, target) {
            return game.hasPlayer(function (current) {
                return player != current && current.hp >= player.hp && player.getEnemies().includes(current)
            })
        },
        content: function () {
            "step 0"
            if (game.countPlayer(function (current) { return current.hp >= player.hp && current != player && player.getEnemies().includes(current) }) == 1) {
                var list = game.filterPlayer(function (current) { return current.hp >= player.hp && current != player && player.getEnemies().includes(current) }).randomGet();
                player.logSkill('boss_xiaoshoua', list);
                list.damage(2);
                event.finish();
            }
            else {
                player.chooseTarget(true, '选择【枭首】的目标', '对其造成2点伤害', function (card, player, target) {
                    return player != target && target.hp >= player.hp && player.getEnemies().includes(target);
                }, function (target) {
                    var att = get.attitude(player, target);
                    return -att && get.damageEffect(target, player, player) > 0;
                });
            }
            "step 1"
            if (result.bool) {
                player.line(result.targets[0]);
                player.logSkill('boss_xiaoshoua', result.targets[0]);
                result.targets[0].damage(2);
            }
        },
        ai: {
            expose: 0.2
        },
    },
    "boss_manji": {
        shaRelated: true,
        trigger: {
            player: "useCardToBefore",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            return event.card.name == 'sha' && event.target.countDiscardableCards(player, 'h') > 0 && event.targets.length == 1;
        },
        direct: true,
        content: function () {
            'step 0'
            player.discardPlayerCard(trigger.target, 'h', get.prompt('boss_manji', trigger.target)).set('ai', function (button) {
                if (!_status.event.att) return 0;
                return 1;
            }).set('logSkill', ['boss_manji', trigger.target]).set('att', get.attitude(player, trigger.target) <= 0);
            'step 1'
            if (result.bool && result.links && result.links.length) {
                if (result.links[0].name == 'sha') {
                    trigger.baseDamage++;
                    game.log(trigger.card, '造成的伤害基础值加一');
                }
                else player.gain(result.links[0], 'gain2', 'log');
            }
        },
    },
    "boss_shiyv": {
        trigger: {
            player: "phaseDrawBegin1",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        filter: function (event, player) {
            return !event.numFixed;
        },
        content: function () {
            trigger.changeToZero();
            var list = [];
            var list0 = [];
            var list1 = [];
            var list2 = [];
            get.cardPile2(function (card) {
                if (get.suit(card) == 'spade') list.push(card);
            });
            get.cardPile2(function (card2) {
                if (get.suit(card2) == 'heart') list2.push(card2);
            });
            get.cardPile2(function (card1) {
                if (get.suit(card1) == 'club') list1.push(card1);
            });
            get.cardPile2(function (card0) {
                if (get.suit(card0) == 'diamond') list0.push(card0);
            });
            var card = []
            var cards = []
            card.push(list.randomGet())
            card.push(list2.randomGet())
            card.push(list1.randomGet())
            card.push(list0.randomGet())
            for (var i = 0; i < card.length; i++) {
                cards.push(card[i]);
            };
            if (cards.length) {
                player.gain(cards, 'draw');
                game.log(player, '获得了', cards);
            }
        },
    },
    "boss_guizhao": {
        trigger: {
            player: "useCard",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        init: function (player) {
            player.storage.yyy = true;
            player.storage.ababab = true;
            player.storage.biubiubiu = true;
        },
        forced: true,
        direct: true,
        filter: function (event, player) {
            if (_status.currentPhase != player) return false;
            if (player.storage.yyy == false && player.storage.ababab == false && player.storage.biubiubiu == false) return false;
            return true
        },
        content: function () {
            if (player.storage.yyy == true && get.type(trigger.card) == 'basic') {
                player.draw()
                player.storage.yyy = false
                player.logSkill('boss_guizhao')
            }
            if (player.storage.ababab == true && (get.type(trigger.card) == 'trick' || get.type(trigger.card) == 'delay')) {
                player.draw()
                player.storage.ababab = false
                player.logSkill('boss_guizhao')
            }
            if (player.storage.biubiubiu == true && get.type(trigger.card) == 'equip') {
                player.draw()
                player.storage.biubiubiu = false
                player.logSkill('boss_guizhao')
            }
        },
        group: "boss_guizhao_1",
        subSkill: {
            "1": {
                trigger: {
                    global: "phaseAfter",
                },
                forced: true,
                charlotte: true,
                direct: true,
                silent: true,
                content: function () {
                    player.storage.yyy = true;
                    player.storage.ababab = true;
                    player.storage.biubiubiu = true;
                },
                sub: true,
                forced: true,
                popup: false,
            },
        },
    },
    //黑白无常
    "boss_xixinga": {
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.getEnemies().includes(current) && current != player;
            });
        },
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) {
                return current != player && player.getEnemies().includes(current);
            });
        },
        content: function () {
            game.countPlayer(function (current) {
                if (current != player && player.getEnemies().includes(current)) {
                    current.damage('thunder');
                }
            })
            player.recover();
        },
        ai: {
            expose: 0.2
        },
    },
    "boss_taipinga": {
        trigger: {
            player: "damageEnd",
        },
        direct: true,
        forced: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            return event.source && player.getEnemies().includes(event.source);
        },
        logTarget: "source",
        content: function () {
            "step 0"
            event.count = trigger.num;
            "step 1"
            event.count--;
            player.logSkill('boss_taipinga', trigger.source);
            var next = trigger.source.chooseToDiscard('h', 2, '弃置两张花色不同的手牌', function (card) {
                if (ui.selected.cards.length) {
                    return get.suit(card) != get.suit(ui.selected.cards[0]);
                }
                return trigger.source.countCards('h')
            }).set('complexCard', true);
            next.ai = function (card) {
                var source = _status.event.player;
                if (get.effect(source, { name: 'losehp' }, source, source) >= 0) return 0;
                return 8 - get.value(card);
            };
            "step 2"
            if (result.bool == false) trigger.source.loseHp()
            if (event.count) event.goto(1)
        },
        ai: {
            maixie_defend: true,
            effect: {
                target: function (card, player, target) {
                    if ((player.hasSkillTag('jueqing', false, target) || player.hasSkill("shanhe_zhangdu")) && get.tag(card, 'damage')) return [1, -1];
                    return 0.8;
                    if (get.tag(card, 'damage') && get.damageEffect(target, player, player) > 0) return [1, 0, 0, -1.5];
                }
            }
        }
    },
    "boss_mizuia": {
        trigger: {
            source: "damageSource",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        check: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && (event.nature || get.color(event.card) == 'red') && event.player.isIn() && event.player.countCards('he') > 0;
        },
        logTarget: 'player',
        content: function () {
            player.discardPlayerCard('he', trigger.player, 2, true);
        },
        mod: {
            aiOrder: function (player, card, num) {
                if (card && card.name == 'sha' && (get.tag(card, 'natureDamage') || get.color(card) == 'red')) return num + 0.1;
            },
        },
    },
    "boss_qiangzhenga": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "phaseJieshuBegin",
        },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current != player && player.getEnemies().includes(current) && current.countCards('h') < 3 && current.countCards('h') > 0;
            });
        },
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) {
                return current != player && player.getEnemies().includes(current) && current.countCards('h') < 3 && current.countCards('h') > 0;
            });
        },
        content: function () {
            game.countPlayer(function (current) {
                if (current != player && current.countCards('h') < 3 && current.countCards('h') > 0 && player.getEnemies().includes(current)) {
                    var card1 = current.getCards('h');
                    player.gain(card1, current);
                    current.$giveAuto(card1, player);
                }
            });
        },
        ai: {
            expose: 0.2
        },
    },
    //豹尾
    "boss_yinsha": {
        trigger: {
            global: "phaseUseBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        filter: function (event, player, target) {
            return event.player.countCards("h") > event.player.maxHp && event.player != player && player.getEnemies().includes(event.player);
        },
        content: function () {
            player.addTempSkill('boss_yinsha_xiaoguo')
        },
        subSkill: {
            xiaoguo: {
                marktext: "隐煞",
                mark: true,
                intro: {
                    name: "隐煞",
                    content: "本回合不能成为【杀】的目标",
                },
                direct: true,
                unique: true,
                forced: true,
                mod: {
                    targetEnabled: function (card, player, target, now) {
                        if (card.name == 'sha') return false;
                    },
                },
                sub: true,
                popup: false,
            },
        },
    },
    "boss_eli": {
        trigger: {
            source: "damageBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        derivation: "wansha",
        filter: function (event, player) {
            return !player.getStorage('boss_eli_chosen').includes(event.player) && player.getEnemies().includes(event.player);
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'red' ? 1 : 0;
            });
            player.addTempSkill('boss_eli_chosen', 'phaseAfter');
            player.markAuto('boss_eli_chosen', [trigger.player]);
            "step 1"
            if (result.color == 'red') {
                trigger.num++;
            }
            if (result.color == 'black') {
                player.addTempSkill('wansha');
            }
        },
        subSkill: {
            chosen: {
                charlotte: true,
                onremove: true,
                intro: { content: '本回合已对$发动过技能' },
            },
        },
    },
    "boss_guimeib": {
        audio: 'ext:太虚幻境/audio/skill:true',
        group: ["boss_guimeib_draw", "boss_guimeib_use"],
        trigger: {
            player: "turnOverBefore",
        },
        priority: 20,
        filter: function (event, player) {
            return !player.isTurnedOver();
        },
        forced: true,
        direct: true,
        content: function () {
            player.logSkill("boss_guimeib");
            trigger.cancel();
            game.log(player, '取消了翻面');
        },
        subSkill: {
            draw: {
                trigger: {
                    player: "phaseDrawSkipped",
                },
                forced: true,
                direct: true,
                content: function () {
                    player.logSkill("boss_guimeib");
                    player.draw();
                },
                sub: true,
            },
            use: {
                trigger: {
                    player: "phaseUseSkipped",
                },
                forced: true,
                direct: true,
                content: function () {
                    player.logSkill("boss_guimeib");
                    player.addTempSkill('boss_guimeib_xiaoguo');
                },
                sub: true,
            },
            xiaoguo: {
                mod: {
                    ignoredHandcard: function (card, player) {
                        return true;
                    },
                    cardDiscardable: function (card, player, name) {
                        if (name == 'phaseDiscard') return false;
                    },
                },
                direct: true,
                unique: true,
                forced: true,
                fixed: true,
                sub: true,
                popup: false,
            },
        },
        ai: {
            noturn: true,
            effect: {
                target: function (card, player, target) {
                    if (get.type(card) == 'delay') return 0.5;
                },
            },
        },
    },
    //鸟嘴
    "boss_bingyi": {
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter"],
        },
        usable: 1,
        forced: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            if (player.countCards('h')) return false;
            var evt = event.getl(player);
            return evt && evt.player == player && evt.hs && evt.hs.length > 0;
        },
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) {
                return (current == player || player.getFriends().includes(current)) && current.countCards('h') < 6;
            });
        },
        content: function () {
            game.countPlayer(function (current) {
                if (current == player || player.getFriends().includes(current) && current.countCards('h') < 6) {
                    current.drawTo(6);
                }
            })
        },
        ai: {
            expose: 0.2,
            threaten: 0.8,
            effect: {
                target: function (card) {
                    if (card.name == 'guohe' || card.name == 'liuxinghuoyu') return 0.5;
                },
            },
            noh: true,
            skillTagFilter: function (player, tag) {
                if (tag == 'noh') {
                    if (player.countCards('h') != 1) return false;
                }
            },
        },
    },
    "boss_suoxue": {
        shaRelated: true,
        trigger: {
            player: "useCardToPlayered",
        },
        check: function (event, player) {
            return (player.countCards('h') < event.target.countCards('h')) || (get.attitude(player, event.target) < 0);
        },
        filter: function (event, player) {
            return event.targets.length == 1 && event.card.name == 'sha' && event.target.countCards('h') != player.countCards('h');
        },
        logTarget: 'target',
        audio: 'ext:太虚幻境/audio/skill:true',
        content: function () {
            "step 0"
            if (trigger.target.countCards('h') > player.countCards('h')) {
                player.draw(trigger.target.countCards('h') - player.countCards('h'));
                event.finish();
            }
            "step 1"
            player.chooseToDiscard(get.prompt('boss_suoxue'), '弃置一张手牌令此【杀】不能被响应', 'h').set('ai', function (card) {
                return 9 - get.value(card);
            });
            "step 2"
            if (result.bool) {
                trigger.getParent().directHit.add(trigger.target);
                game.log(trigger.card, '无法被', trigger.target, '响应');
            }
        },
    },
    //黄蜂
    "boss_duzhen": {
        trigger: {
            player: "useCardToPlayered",
        },
        forced: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            return player.getEnemies().includes(event.target) && player == _status.currentPhase && event.target.countCards('he') > 0 && event.target != player && (event.card.name == 'sha' || get.type2(event.card) == 'trick');
        },
        logTarget: 'target',
        content: function () {
            trigger.target.discard(trigger.target.getCards('he', function (card) {
                if (trigger.target.countCards('e') && get.position(card) != 'e') return false;
                return true;
            }).randomGet());
        },
        ai: { expose: 0.2 },
    },
    "boss_mingchong": {
        trigger: {
            player: "die",
        },
        forced: true,
        forceDie: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player, target) {
            return game.hasPlayer(function (current) {
                return current != player && player.getFriends().includes(current);
            })
        },
        content: function () {
            game.countPlayer(function (current) {
                if (current != player && player.getFriends().includes(current)) {
                    var num = current.maxHp - current.countCards('h');
                    if (num > 0) current.draw(num);
                    current.addSkill('boss_duzhen');
                }
            })
        },
        ai: {
            threaten: 0.7
        }
    },
    //鱼鳃
    "boss_anchao": {
        audio: 'ext:太虚幻境/audio/skill:true',
        marktext: "暗潮",
        mark: true,
        locked: true,
        intro: {
            name: "暗潮",
            content: function (storage, player, skill) {
                var num = player.countMark('boss_anchao');
                if (num == undefined) num = 0;
                return "摸牌阶段多摸" + num + "张牌且回合内对敌方角色" + "造成的伤害增加+" + num + "点";
            },
        },
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        filter: function (event, player) {
            return event.player == player || player.getFriends().includes(event.player);
        },
        content: function () {
            var numMark = trigger.player.countMark('boss_anchao');
            if (trigger.player.getStat('damage') && numMark != undefined) {
                trigger.player.removeMark('boss_anchao', numMark);
            } else {
                trigger.player.addMark('boss_anchao', 1);
            }
        },
        group: ["boss_anchao_Draw", "boss_anchao_Damage"],
        subSkill: {
            Draw: {
                trigger: {
                    global: "phaseDrawBegin2",
                },
                forced: true,
                direct: true,
                filter: function (event, player) {
                    var numMark = event.player.countMark('boss_anchao');
                    return (event.player == player || player.getFriends().includes(event.player)) && numMark;
                },
                content: function () {
                    var numMark = trigger.player.countMark('boss_anchao');
                    trigger.num += numMark;
                    player.logSkill("boss_anchao");
                },
                sub: true,
            },
            Damage: {
                trigger: {
                    global: "damageBegin1",
                },
                forced: true,
                direct: true,
                filter: function (event, player) {
                    if (event.source == undefined || _status.currentPhase != event.source) return false;
                    var numMark = event.source.countMark('boss_anchao');
                    return (event.source == player || player.getFriends().includes(event.source)) && (event.player != player && player.getEnemies().includes(event.player)) && numMark;
                },
                content: function () {
                    var numMark = trigger.source.countMark('boss_anchao');
                    trigger.num += numMark;
                    player.logSkill("boss_anchao");
                },
                ai: {
                    damageBonus: true,
                },
                sub: true,
            },
        },
    },
    usesha: {
        mod: {
            cardUsable: function (card, player, num) {
                if (player.side != game.boss.side && card.name == 'sha') {
                    return num + 1;
                }
            },
        },
    },
    "boss_guixi": {
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.suit(card) == 'heart' ? 1 : -1;
            });
            "step 1"
            if (result.suit == 'heart') {
                player.recover();
            } else {
                player.loseHp();
            }
        },
    },
    //鬼王
    "boss_jizhou1": {
        trigger: {
            global: "phaseUseAfter",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        filter: function (event, player, target) {
            if (player.storage.boss_danshi == '' || player.storage.boss_danshi == undefined) player.storage.boss_danshi = 0;
            return player.getEnemies().includes(event.player);
        },
        content: function () {
            'step 0'
            player.judge();
            'step 1'
            var num = result.number;
            var next = trigger.player.chooseToDiscard('疾咒：弃置任意张点数之和大于' + get.cnNumber(num) + '的牌，否则失去1点体力', 'he');
            next.set('num', num);
            next.set('complexCard', true);
            next.set('selectCard', function () {
                var num = 0;
                for (var i = 0; i < ui.selected.cards.length; i++) {
                    num += get.number(ui.selected.cards[i]);
                }
                if (num > _status.event.num) return [ui.selected.cards.length, _status.event.player.countCards('he')];
                return ui.selected.cards.length + 2;
            });
            next.set('ai', function (card) {
                var player = _status.event.player;
                var num = _status.event.num;
                var numx = 0;
                for (var i of ui.selected.cards) {
                    numx += i.number;
                }
                if (numx > num && _status.event.player.countCards('he') < 3) return 0;
                if (numx > num && _status.event.player.countCards('he') > 3 && ui.selected.cards.length >= 3) return 0;
                if (card.number + numx > num) return 9 - get.value(card);
                return Math.max(9 - get.value(card), card.number);
            });
            'step 2'
            if (result.bool) {
                if (result.cards.length > 2) {
                    if (player.storage.boss_danshi == '' || player.storage.boss_danshi == undefined) player.storage.boss_danshi = 1;
                    else player.storage.boss_danshi++;
                    player.update();
                }
            }
            else trigger.player.loseHp();
        },
        ai: {
            expose: 0.2
        },
    },
    "boss_danshi": {
        init: function (player) {
            player.storage.boss_danshi = 0;
        },
        marktext: "噬",
        mark: true,
        intro: {
            name: "啖噬",
            content: function (storage, player, skill) {
                var num = player.storage.boss_danshi;
                if (num == undefined) num = 0;
                return "当前有" + num + "枚“噬”标记，下次受到的伤害增加" + num + "点";
            },
        },
        trigger: {
            player: "damageBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        filter: function (event, player, target) {
            return player.storage.boss_danshi > 0;
        },
        content: function () {
            var rbq = player.storage.boss_danshi
            trigger.num += rbq
            player.storage.boss_danshi--
            player.update();
        },
    },
    "boss_chihu": {
        trigger: {
            player: "phaseDrawBegin2",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.countCards('h') < current.countCards('h') && !event.numFixed;
            })
        },
        content: function () {
            trigger.num += 2;
        },
        group: "boss_chihu_1",
        subSkill: {
            "1": {
                trigger: {
                    source: "damageBegin",
                },
                forced: true,
                audio: "boss_chihu",
                filter: function (event, player) {
                    return game.hasPlayer(function (current1) {
                        return player.hp < current1.hp
                    })
                },
                content: function () {
                    trigger.num++;
                },
                sub: true,
            },
        },
    },
    "boss_tiemianhong1": {
        trigger: {
            target: "useCardToTargeted",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            if (!event.card) return false;
            var num = Math.random();
            return num <= 0.75 && get.color(event.card) == 'red' && event.card.name == 'sha';
        },
        forced: true,
        direct: true,
        content: function () {
            trigger.getParent().excluded.add(player);
            game.log(trigger.card, '对', player, '无效');
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (get.color(card) == 'red' && card.name == 'sha') return 0.5;
                },
            },
        },
    },
    //阎罗王
    "boss_difua": {
        trigger: {
            global: "phaseUseBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player, target) {
            return player.getEnemies().includes(event.player) && event.player.countCards("h") > event.player.maxHp;
        },
        forced: true,
        content: function () {
            var num = trigger.player.countCards("h") - trigger.player.maxHp
            trigger.player.chooseToDiscard('h', num, true).set('ai', function (card) { return 6 - get.value(card) });
        },
        ai: {
            expose: 0.2
        },
    },
    "boss_zhennub": {
        init: function (player) {
            player.storage.boss_zhennub = true;
        },
        trigger: { player: ['damageEnd', 'loseHpEnd', 'dyingAfter'], },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        skillAnimation: true,
        animationColor: "metal",
        filter: function (event, player) {
            return player.hp <= 8 && player.storage.boss_zhennub == true && !_status.dying.length;
        },
        content: function () {
            'step 0'
            player.draw(5);
            //player.insertPhase();
            player.storage.boss_zhennub = false;
            /*'step 1'	
            while(_status.event.name!='phaseLoop'){
            _status.event=_status.event.parent;
            }*/
        },
    },
    "boss_xingpan": {
        trigger: {
            player: "phaseUseBegin",
        },
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.getEnemies().includes(current) && current != player;
            });
        },
        forced: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        content: function () {
            'step 0'
            event.target = [];
            game.countPlayer(function (current) {
                if (player.getEnemies().includes(current) && current != player) {
                    event.target.push(current);
                    event.xueliang = current.hp;
                    event.shoupai = current.countCards('h');
                    event.mubiao = current;
                    event.mubiao2 = current;
                }
            });
            'step 1'
            if (event.target.length > 0) {
                for (var i = 0; i < event.target.length; i++) {
                    if (event.xueliang < event.target[i].hp) {
                        event.mubiao = event.target[i];
                        event.xueliang = event.target[i].hp;
                    }
                    else {
                        if (event.mubiao != event.target[i] && event.xueliang == event.target[i].hp && event.mubiao) delete event.mubiao;
                    }
                    if (event.shoupai < event.target[i].countCards('h')) {
                        event.mubiao2 = event.target[i];
                        event.shoupai = event.target[i].countCards('h');
                    }
                    else {
                        if (event.mubiao2 != event.target[i] && event.shoupai == event.target[i].countCards('h') && event.mubiao2) delete event.mubiao2;
                    }
                }
            }
            'step 2'
            var func = function (result) {
                if (get.color(result) == 'red' && event.mubiao2) return 10;
                if (get.color(result) == 'black' && event.mubiao) return 1;
                return -1;
            };
            player.judge(func);
            'step 3'
            event.color = result.color;
            if (event.color == 'red' && event.mubiao2) {
                if (event.shoupai % 2 == 0) event.num = event.shoupai / 2;
                else event.num = (event.shoupai - 1) / 2;
                if (event.num > 0) {
                    event.mubiao2.chooseCard('〖刑判〗交给' + get.translation(player) + get.cnNumber(event.num) + '张手牌', true, event.num).set('ai', function (card) {
                        return 7 - get.value(card);
                    });
                }
            }
            if (event.color == 'black' && event.mubiao) {
                event.mubiao.loseHp();
                event.finish();
            }
            'step 4'
            if (result.bool) {
                player.gain(result.cards, event.mubiao2, 'giveAuto');
            }
        },
    },
    "boss_dianwei": {
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        content: function () {
            "step 0"
            game.countPlayer(function (current) {
                if (player.getEnemies().includes(current) && !current.countCards("e")) {
                    player.useCard({ name: 'sha', isCard: true }, current, false, 'noai');
                }
            });
            "step 1"
            game.countPlayer(function (current) {
                if (player.getEnemies().includes(current) && current.countCards("e")) {
                    var eq = current.getCards('e');
                    if (eq.length) {
                        current.discard(eq.randomGet());
                    }
                }
            });
        },
        ai: {
            expose: 0.2
        },
    },
    "boss_xuanpan": {
        mark: true,
        marktext: "宣判",
        init: function (player) {
            player.storage.xuanpandamage = 0
            player.storage.xuanpandiscard = 0
            player.storage.xuanpandraw = 0
            player.storage.xuanpanrecover = 0
        },
        intro: {
            name: "宣判",
            mark: function (dialog, content, player) {
                if (player.storage.xuanpandamage > 0) dialog.addText('你已累计受到' + player.storage.xuanpandamage + '点伤害');
                if (player.storage.xuanpandiscard > 0) dialog.addText('你已累计弃置' + player.storage.xuanpandiscard + '张牌');
                if (player.storage.xuanpandraw > 0) dialog.addText(get.translation(_status.currentPhase) + '已累计摸了' + player.storage.xuanpandraw + '张牌');
                if (player.storage.xuanpanrecover > 0) dialog.addText(get.translation(_status.currentPhase) + '已累计回复了' + player.storage.xuanpanrecover + '点体力');
            },
        },
        trigger: {
            player: ["damageEnd", "discardEnd"],
            global: ["drawEnd", "recoverEnd", "phaseEnd"],
        },
        filter: function (event, player, name) {
            if (name == 'damageEnd') return event.source != player && player.getEnemies().includes(event.source) && _status.currentPhase == event.source && event.num > 0;
            if (name == 'drawEnd' || name == 'recoverEnd' || name == 'phaseEnd') return event.player != player && player.getEnemies().includes(event.player) && _status.currentPhase == event.player;
            if (name == 'discardEnd') return player.getEnemies().includes(_status.currentPhase) && _status.currentPhase != player;
        },
        direct: true,
        forced: true,
        charlotte: true,
        content: function () {
            var name = event.triggername
            if (name == 'damageEnd') player.storage.xuanpandamage += trigger.num;
            if (name == 'discardEnd') player.storage.xuanpandiscard += trigger.cards.length;
            if (name == 'drawEnd') player.storage.xuanpandraw += trigger.num;
            if (name == 'recoverEnd') player.storage.xuanpanrecover += trigger.num;
            if (name == 'phaseEnd') {
                if (player.storage.xuanpandamage > 3) {
                    player.logSkill('boss_xuanpan');
                    trigger.player.damage([0, 1, 2, 3, 4].randomGet());
                }
                if (player.storage.xuanpandamage > 0) player.storage.xuanpandamage = 0;
                if (player.storage.xuanpandiscard > 3) {
                    var num = [998, 999, 1000, 1000].randomGet();
                    if (num == 999) {
                        player.logSkill('boss_xuanpan');
                        trigger.player.discard('he', trigger.player.getCards('he').randomGet(), true);
                    }
                    if (num == 1000) {
                        player.logSkill('boss_xuanpan');
                        trigger.player.discard('he', trigger.player.getCards('he').randomGets([2, 3].randomGet()), true);
                    }
                }
                if (player.storage.xuanpandiscard > 0) player.storage.xuanpandiscard = 0
                if (player.storage.xuanpandraw > 7) {
                    player.logSkill('boss_xuanpan');
                    player.draw([0, 1, 2, 3, 4, 5, 6, 7, 8].randomGet())
                }
                if (player.storage.xuanpandraw > 0) player.storage.xuanpandraw = 0;
                if (player.storage.xuanpanrecover > 2) {
                    player.logSkill('boss_xuanpan');
                    player.recover([0, 1, 2, 3].randomGet());
                }
                if (player.storage.xuanpanrecover > 0) player.storage.xuanpanrecover = 0;
            }
        },
    },
    "boss_tiemianhong": {
        trigger: {
            target: "useCardToTargeted",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        filter: function (event, player) {
            if (!event.card) return false;
            var num = Math.random();
            return num <= 0.75 && get.color(event.card) == 'red' && event.card.name == 'sha';
        },
        forced: true,
        direct: true,
        content: function () {
            trigger.getParent().excluded.add(player);
            game.log(trigger.card, '对', player, '无效');
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (get.color(card) == 'red' && card.name == 'sha') return 0.5;
                },
            },
        },
    },
    //魁拔之战
    //幽弥狂
    "Kuiba_wuyao": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return event.source && event.num > 0;
        },
        forced: true,
        content: function () {
            'step 0'
            player.judge(function (card) {
                return get.color(card) == 'black' ? 2 : -2;
            });
            'step 1'
            if (result.judge > 0) {
                trigger.num--;
                if (player.getEnemies().includes(trigger.source) && trigger.source != player && player.countCards('hs', { name: 'sha' })) {
                    player.discard(player.getCards('h', { name: 'sha' }).randomGet());
                    player.useCard({ name: 'sha' }, trigger.source, false, 'noai');
                }
            }
        },
    },
    "Kuiba_sanjian": {
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + 1;
            },
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            source: "damageSource",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && event.player.countCards('he');
        },
        forced: true,
        logTarget: "player",
        content: function () {
            trigger.player.chooseToDiscard('he', 2, true);
        },
    },
    "Kuiba_baizhan": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "phaseUseBegin",
        },
        forced: true,
        content: function () {
            var cards = [];
            for (var i = 0; i < 2; i++) {
                var card = get.cardPile2(function (card) {
                    return card.name == 'sha' && !cards.includes(card);
                });
                if (card) cards.push(card);
            }
            if (cards.length) player.gain(cards, 'gain2');
        },
    },
    //灵守军
    "Kuiba_lingshou": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "damageBegin4",
        },
        filter: function (event, player) {
            return event.player != player && player.getFriends().includes(event.player);
        },
        forced: true,
        logTarget: "player",
        content: function () {
            trigger.num--;
            player.loseHp();
            if (trigger.source && trigger.source.countCards('he') > 0) trigger.source.chooseToDiscard(3, 'he', true);
        },
        ai: {
            expose: 0.2
        },
    },
    "Kuiba_lingshan": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return event.card && ['spade', 'diamond'].includes(get.suit(event.card, event.player));
        },
        forced: true,
        content: function () {
            trigger.num--;
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (!['spade', 'diamond'].includes(get.suit(card, player))) return;
                    if (player.hasSkillTag('jueqing', false, target) || player.hasSkill("shanhe_zhangdu") || player.hasSkillTag('damageBonus', false, { target: target, card: card })) return;
                    var num = get.tag(card, 'damage');
                    if (num) {
                        if (num > 1) return 0.5;
                        return 0;
                    }
                },
            },
        },
    },
    //灵乱军
    "Kuiba_lingluan": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "phaseJieshuBegin",
        },
        filter: function (event, player) {
            return event.player.countCards('he') > 0 && event.player != player && player.getEnemies().includes(event.player);
        },
        forced: true,
        logTarget: "player",
        content: function () {
            trigger.player.chooseToDiscard(2, 'he', true);
        },
        ai: {
            expose: 0.2
        },
    },
    //觉醒幽弥狂
    "Kuiba_yiyou": {
        derivation: ["new_yijue", "tianyi"],
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        content: function () {
            'step 0'
            player.judge().set('callback', function () {
                var player = _status.event.player;
                if (get.position(card, true) == 'o') player.gain(card, 'gain2');
            });
            'step 1'
            player.addTempSkill(result.color == 'red' ? 'new_yijue' : 'tianyi');
        },
    },
    //海问香
    "Kuiba_wenjia": {
        derivation: ["decadewuniang", "wushuang"],
        mark: true,
        marktext: "击毁",
        intro: {
            content: "mark",
            name: "纹甲",
        },
        group: ["Kuiba_wenjia_yingzi", "Kuiba_wenjia_damage"],
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "dieAfter",
        },
        forced: true,
        content: function () {
            player.addMark('Kuiba_wenjia', 1);
            var num = player.countMark('Kuiba_wenjia');
            if (num == 1) player.addSkillLog('decadewuniang');
            if (num == 2) player.addSkillLog('wushuang');
        },
        subSkill: {
            yingzi: {
                audio: "Kuiba_wenjia",
                trigger: {
                    player: "phaseDrawBegin2",
                },
                filter: function (event, player) {
                    return !event.numFixed && player.countMark('Kuiba_wenjia') > 0;
                },
                forced: true,
                content: function () {
                    trigger.num += player.countMark('Kuiba_wenjia');
                },
                ai: {
                    threaten: 1.6,
                },
                sub: true,
            },
            damage: {
                audio: "Kuiba_wenjia",
                trigger: {
                    source: "damageBegin1",
                },
                filter: function (event, player) {
                    return player.countMark('Kuiba_wenjia') >= 3;
                },
                forced: true,
                content: function () {
                    trigger.num++;
                },
                sub: true,
            },
        },
    },
    "Kuiba_huanguang": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "useCard2",
        },
        filter: function (event, player) {
            if (!player.isPhaseUsing() || get.type(event.card) != 'trick' || player.getHistory('useCard', function (evt) { return get.type(evt.card) == 'trick' }).length > 4) return false;
            if (event.targets && event.targets.length > 0) return true;
            var info = get.info(event.card);
            if (info.allowMultiple == false) return false;
            if (event.targets && !info.multitarget) {
                if (game.hasPlayer(function (current) {
                    return !event.targets.includes(current) && lib.filter.targetEnabled2(event.card, player, current) && lib.filter.targetInRange(event.card, player, current);
                })) return true;
            }
            return false;
        },
        direct: true,
        content: function () {
            'step 0'
            var prompt2 = '为' + get.translation(trigger.card) + '增加或减少一个目标'
            player.chooseTarget(get.prompt('Kuiba_huanguang'), function (card, player, target) {
                var player = _status.event.player;
                if (_status.event.targets.includes(target)) return true;
                return lib.filter.targetEnabled2(_status.event.card, player, target) && lib.filter.targetInRange(_status.event.card, player, target);
            }).set('prompt2', prompt2).set('ai', function (target) {
                var trigger = _status.event.getTrigger();
                var player = _status.event.player;
                return get.effect(target, trigger.card, player, player) * (_status.event.targets.includes(target) ? -1 : 1);
            }).set('targets', trigger.targets).set('card', trigger.card);
            'step 1'
            if (result.bool) {
                if (!event.isMine() && !event.isOnline()) game.delayx();
                event.targets = result.targets;
            }
            else event.finish();
            'step 2'
            if (event.targets) {
                player.logSkill('Kuiba_huanguang', event.targets);
                if (trigger.targets.includes(event.targets[0])) trigger.targets.removeArray(event.targets);
                else trigger.targets.addArray(event.targets);
            }
        },
    },
    "Kuiba_linyao": {
        mod: {
            targetEnabled: function (card, player, target) {
                if (player.getEnemies().includes(target) && get.color(card) == 'red' && get.type2(card) == 'trick') return false;
            },
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        inherit: "shixin",
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return (event.nature == 'fire');
        },
        forced: true,
        content: function () {
            trigger.cancel();
        },
        ai: {
            nofire: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.tag(card, 'fireDamage')) return 0;
                },
            },
        },
    },
    "Kuiba_jinghong": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "useCard",
        },
        filter: function (event, player) {
            return get.color(event.card, player) != 'none' && get.type2(event.card) == 'trick';
        },
        forced: true,
        content: function () {
            var color = ['red', 'black'];
            color.remove(get.color(trigger.card, player));
            color = color[0];
            var card = get.cardPile2(function (card) {
                return get.color(card) == color;
            });
            if (card) player.gain(card, 'gain2');
        },
    },
    //圣捷军
    "Kuiba_shengmeng": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return event.card && ['heart', 'club'].includes(get.suit(event.card, event.player));
        },
        forced: true,
        content: function () {
            trigger.num--;
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (!['heart', 'club'].includes(get.suit(card, player))) return;
                    if (player.hasSkillTag('jueqing', false, target) || player.hasSkill("shanhe_zhangdu") || player.hasSkillTag('damageBonus', false, { target: target, card: card })) return;
                    var num = get.tag(card, 'damage');
                    if (num) {
                        if (num > 1) return 0.5;
                        return 0;
                    }
                },
            },
        },
    },
    "Kuiba_shengjie": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "useCard",
        },
        filter: function (event, player, name) {
            return event.player != player && player.getEnemies().includes(event.player) && event.card && get.type(event.card) == 'trick' && game.hasPlayer(function (current) {
                return (current == player || player.getFriends().includes(current)) && event.targets.includes(current);
            });
        },
        forced: true,
        logTarget: "targets",
        content: function () {
            game.asyncDraw(trigger.targets, 2);
        },
        ai: {
            expose: 0.2
        },
    },
    //圣助军
    "Kuiba_shengzhu": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "phaseJieshuBegin",
        },
        filter: function (event, player) {
            return player.getFriends().includes(event.player) || event.player == player;
        },
        forced: true,
        logTarget: "player",
        content: function () {
            trigger.player.draw(2);
        },
        ai: {
            expose: 0.2
        },
    },
    //卡拉肖克潘
    "Kuiba_wangjian": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "useCardToPlayered",
        },
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        forced: true,
        logTarget: "target",
        content: function () {
            trigger.target.addTempSkill('qinggang2');
            trigger.target.storage.qinggang2.add(trigger.card);
            var id = trigger.target.playerid;
            var map = trigger.getParent().customArgs;
            if (!map[id]) map[id] = {};
            if (typeof map[id].extraDamage != 'number') map[id].extraDamage = 0;
            map[id].extraDamage++;
        },
        ai: {
            "unequip_ai": true,
            skillTagFilter: function (player, tag, arg) {
                if (arg && arg.name == 'sha') return true;
                return false;
            },
        },
    },
    "Kuiba_tianyi": {
        audio: 'ext:太虚幻境/audio/skill:true',
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            return player.canCompare(target);
        },
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        content: function () {
            "step 0"
            player.chooseToCompare(target);
            "step 1"
            if (result.bool) {
                player.addTempSkill('Kuiba_tianyi2');
            }
            else {
                player.addTempSkill('Kuiba_tianyi3');
            }
        },
        ai: {
            order: function (name, player) {
                var cards = player.getCards('h');
                if (player.countCards('h', 'sha') == 0) {
                    return 1;
                }
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].name != 'sha' && get.number(cards[i]) > 11 && get.value(cards[i]) < 7) {
                        return 9;
                    }
                }
                return get.order({ name: 'sha' }) - 1;
            },
            result: {
                player: function (player) {
                    if (player.countCards('h', 'sha') > 0) return 0.6;
                    var num = player.countCards('h');
                    if (num > player.hp) return 0;
                    if (num == 1) return -2;
                    if (num == 2) return -1;
                    return -0.7;
                },
                target: function (player, target) {
                    var num = target.countCards('h');
                    if (num == 1) return -1;
                    if (num == 2) return -0.7;
                    return -0.5
                },
            },
            threaten: 1.3,
        },
    },
    Kuiba_tianyi2: {
        mod: {
            targetInRange: function (card, player, target, now) {
                if (card.name == 'sha') return true;
            },
            selectTarget: function (card, player, range) {
                if (card.name == 'sha' && range[1] != -1) range[1]++;
            },
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + 1;
            }
        },
        charlotte: true,
    },
    Kuiba_tianyi3: {
        mod: {
            cardEnabled: function (card) { if (card.name == 'sha') return false }
        },
        charlotte: true,
    },
    "Kuiba_zhuandui": {
        group: ["Kuiba_zhuandui_use", "Kuiba_zhuandui_respond"],
        audio: 'ext:太虚幻境/audio/skill:true',
        subSkill: {
            use: {
                audio: "Kuiba_zhuandui",
                sub: true,
                trigger: {
                    player: "useCardToPlayered",
                },
                check: function (event, player) {
                    return get.attitude(player, event.target) < 0;
                },
                filter: function (event, player) {
                    return event.card.name == 'sha' && player.canCompare(event.target);
                },
                logTarget: "target",
                content: function () {
                    'step 0'
                    player.chooseToCompare(trigger.target);
                    'step 1'
                    if (result.bool) {
                        trigger.getParent().directHit.add(trigger.target);
                        game.log(trigger.card, '无法被', trigger.target, '响应');
                    }
                },
            },
            respond: {
                audio: "Kuiba_zhuandui",
                sub: true,
                trigger: {
                    target: "useCardToTargeted",
                },
                check: function (event, player) {
                    return get.effect(player, event.card, event.player, player) < 0;
                },
                filter: function (event, player) {
                    return event.card.name == 'sha' && player.canCompare(event.player);
                },
                logTarget: "player",
                content: function () {
                    'step 0'
                    player.chooseToCompare(trigger.player);
                    'step 1'
                    if (result.bool) {
                        trigger.getParent().excluded.add(player);
                        game.log(trigger.card, '对', player, '无效');
                    }
                },
            },
        },
        shaRelated: true,
        ai: {
            "directHit_ai": true,
            skillTagFilter: function (player, tag, arg) {
                if (player._Kuiba_zhuandui_temp) return false;
                player._Kuiba_zhuandui_temp = true;
                var bool = function () {
                    if (arg.card.name != 'sha' || get.attitude(player, arg.target) >= 0 || !arg.target.countCards('h')) return false;
                    if (arg.target.countCards('h') == 1 && (!arg.target.getEquip('bagua') || player.hasSkillTag('unequip', false, {
                        name: arg.card ? arg.card.name : null,
                        target: arg.target,
                        card: arg.card
                    }) || player.hasSkillTag('unequip_ai', false, {
                        name: arg.card ? arg.card.name : null,
                        target: arg.target,
                        card: arg.card
                    }))) return true;
                    return player.countCards('h', function (card) {
                        return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card)) && get.value(card) <= 4 && (get.number(card) >= (11 + arg.target.countCards('h') / 2) || get.suit(card, player) == 'heart');
                    }) > 0;
                }();
                delete player._Kuiba_zhuandui_temp;
                return bool;
            },
            effect: {
                target: function (card, player, target, current) {
                    if (card.name == 'sha' && current < 0) return 0.7;
                },
            },
        },
    },
    "Kuiba_tianbian": {
        audio: 'ext:太虚幻境/audio/skill:true',
        enable: "chooseCard",
        check: function (event, player) {
            var player = _status.event.player;
            return (!player.hasCard(function (card) {
                var val = get.value(card);
                return val < 0 || (val <= 4 && (get.number(card) >= 11 || get.suit(card) == 'heart'));
            }, 'h')) ? 20 : 0;
        },
        filter: function (event, player) {
            return event.type == 'compare' && !event.directresult;
        },
        onCompare: function (player) {
            return game.cardsGotoOrdering(get.cards()).cards;
        },
        group: "Kuiba_tianbian_number",
        subSkill: {
            number: {
                trigger: {
                    player: "compare",
                    target: "compare",
                },
                filter: function (event, player) {
                    if (event.iwhile) return false;
                    if (event.player == player) {
                        return get.suit(event.card1) == 'heart';//&&event.card1.vanishtag.includes('Kuiba_tianbian');
                    }
                    else {
                        return get.suit(event.card2) == 'heart';//&&event.card2.vanishtag.includes('Kuiba_tianbian');
                    }
                },
                direct: true,
                content: function () {
                    game.log(player, '拼点牌点数视为', '#yK');
                    if (player == trigger.player) {
                        trigger.num1 = 13;
                    }
                    else {
                        trigger.num2 = 13;
                    }
                },
                sub: true,
                forced: true,
                popup: false,
            },
        },
    },
    //圣斗军
    "Kuiba_shengdou": {
        global: "Kuiba_shengdou_buff",
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "useCardToPlayered",
        },
        filter: function (event, player) {
            return !event.card.Kuiba_shengdou && event.card && event.card.name == 'sha' && (player.getFriends().includes(event.player) || event.player == player) & game.hasPlayer(function (current) {
                return !event.targets.includes(current) && current.inRangeOf(event.player)
            });
        },
        direct: true,
        content: function () {
            'step 0'
            trigger.card.Kuiba_shengdou = true;
            player.chooseBool(get.prompt2('Kuiba_shengdou', trigger.player));
            'step 1'
            if (result.bool) {
                player.logSkill('Kuiba_shengdou', trigger.player);
                trigger.player.chooseTarget('为' + get.translation(trigger.card) + '增加一个目标', function (card, player, target) {
                    var evt = _status.event.getTrigger(), player = trigger.player;
                    return !evt.targets.includes(target) && lib.filter.filterTarget(evt.card, player, target);
                }).set('ai', function (target) {
                    var evt = _status.event.getTrigger(), eff = get.effect(target, evt.card, evt.player, evt.player);
                    return eff;
                });
            }
            else event.finish();
            'step 2'
            if (result.bool) {
                var target = result.targets[0];
                trigger.player.line(target);
                game.log(target, '成为了', trigger.card, '的额外目标');
                trigger.targets.push(target);
            }
        },
        ai: {
            expose: 0.2
        },
    },
    //圣护军
    "Kuiba_shenghu": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "damageBegin4",
        },
        filter: function (event, player) {
            return event.player != player && (player.getFriends().includes(event.player) || event.player == player);
        },
        forced: true,
        logTarget: "player",
        content: function () {
            trigger.num--;
            player.loseHp();
            game.asyncDraw([player, trigger.player], [1, 2]);
        },
        ai: {
            expose: 0.2
        },
    },
    //灵战军
    "Kuiba_lingzhan": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "damageBegin1",
        },
        filter: function (event, player) {
            return event.source && (player.getFriends().includes(event.source) || event.source == player) && _status.currentPhase == event.source && !event.source.getHistory('sourceDamage').length;
        },
        forced: true,
        logTarget: "source",
        content: function () {
            trigger.num++;
        },
        ai: {
            expose: 0.2
        },
    },
    //灵迅军
    "Kuiba_lingxun": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            global: "useCardToPlayered",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha' && event.player.countCards('h') > 0 && (player.getFriends().includes(event.target) || event.target == player) && (event.player != player && player.getEnemies().includes(event.player));
        },
        forced: true,
        logTarget: "player",
        content: function () {
            player.gain(trigger.player.getCards('h').randomGet(), trigger.player, 'giveAuto');
        },
        ai: {
            expose: 0.2
        },
    },
    //镜心
    "Kuiba_tianshen": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return get.type(event.card, 'trick') == 'trick';
        },
        forced: true,
        content: function () {
            trigger.cancel();
        },
        ai: {
            notrick: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.type(card) == 'trick' && get.tag(card, 'damage')) return 0;
                },
            },
        },
    },
    "Kuiba_guangshi": {
        mark: true,
        marktext: "光势",
        intro: {
            content: "mark",
            name: "光势",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: ["phaseJieshuBegin", "damageEnd"],
        },
        filter: function (event, player, name) {
            var num = player.countMark('Kuiba_guangshi');
            if (name == 'phaseJieshuBegin') return num < 3;
            return num > 0;
        },
        forced: true,
        content: function () {
            if (event.triggername == 'phaseJieshuBegin') player.addMark('Kuiba_guangshi', 3);
            else player.removeMark('Kuiba_guangshi', 1);
        },
    },
    "Kuiba_guangmie": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        limited: true,
        skillAnimation: true,
        animationColor: "thunder",
        filter: function (event, player) {
            return player.countMark('Kuiba_guangshi') > 2;
        },
        check: function (event, player) {
            var friend = 0, enemy = 0;
            for (var target of game.players) {
                if (target != player) {
                    if (get.attitude(player, target) > 0) friend += target.hp;
                    else enemy += target.hp;
                }
            }
            return enemy >= friend;
        },
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) {
                return player.getEnemies().includes(current) && current != player;
            });
        },
        content: function () {
            player.awakenSkill('Kuiba_guangmie');
            var num = player.countMark('Kuiba_guangshi');
            player.removeMark('Kuiba_guangshi', num);
            event.forceDie = true;
            for (var target of game.players) {
                if (player.getEnemies().includes(target) && target != player) target.loseHp(num);
            }
        },
        ai: {
            combo: "Kuiba_guangshi",
        },
        mark: true,
        intro: {
            content: "limited",
        },
        init: function (player, skill) {
            player.storage[skill] = false;
        },
    },
    //魁拔蛮吉
    "Kuiba_kuiti": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "damageBegin4",
        },
        filter: function (event, player) {
            return event.card && event.card.name == 'sha';
        },
        forced: true,
        content: function () {
            trigger.num--;
            player.draw();
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (player.hasSkillTag('jueqing', false, target) || player.hasSkill("shanhe_zhangdu") || player.hasSkillTag('damageBonus', false, { target: target, card: card })) return;
                    if (player.hasSkill('huomai')) return;
                    if (get.tag(card, 'damage') && get.tag(card, 'damage') == 1 && !player.hasSkillTag('damageBonus', false, { target: target, card: card }) && card.name == 'sha') return [0, 1];
                },
            },
        },
    },
    "Kuiba_bachong": {
        shaRelated: true,
        trigger: {
            player: "useCardToPlayered",
        },
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        forced: true,
        audio: 'ext:太虚幻境/audio/skill:true',
        logTarget: "target",
        content: function () {
            "step 0"
            var target = trigger.target;
            var num = target.countCards('h', 'shan');
            target.chooseToDiscard('请弃置一张牌，否则不能使用闪抵消此杀', 'he', 1).set('ai', function (card) {
                var num = _status.event.num;
                if (num == 0) return 0;
                if (card.name == 'shan') return num > 1 ? 2 : 0;
                return 8 - get.value(card);
            }).set('num', num);
            "step 1"
            if (!result.bool) {
                trigger.getParent().directHit.add(trigger.target);
                game.log(trigger.card, '无法被', trigger.target, '响应');
            }
        },
    },
    "Kuiba_qiheng": {
        skillAnimation: true,
        animationColor: "thunder",
        derivation: ["Kuiba_Kuiba"],
        trigger: {
            player: "phaseZhunbeiBegin",
        },
        audio: 'ext:太虚幻境/audio/skill:true',
        forced: true,
        unique: true,
        juexingji: true,
        filter: function (event, player) {
            return player.hp < player.maxHp / 2;
        },
        content: function () {
            player.awakenSkill('Kuiba_qiheng');
            var list = ['basic', 'equip', 'trick'], cards = [];
            for (var i of list) {
                var card = get.cardPile2(function (card) { return get.type(card) == i });
                if (card) cards.push(card);
            }
            if (cards.length) player.gain(cards, 'gain2');
            player.addSkill('Kuiba_Kuiba');
        },
    },
    "Kuiba_Kuiba": {
        group: ["Kuiba_Kuiba_yingzi", "Kuiba_Kuiba_damage"],
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: ["useCard2", "useCardToPlayer"],
        },
        forced: true,
        filter: function (event, player) {
            return ['sha', 'juedou'].includes(event.card.name) && game.hasPlayer(function (current) { return player.getEnemies().includes(current) && !event.targets.includes(current) && lib.filter.targetEnabled2(event.card, player, current) });
        },
        logTarget: function (event, player) {
            return game.filterPlayer(function (current) { return player.getEnemies().includes(current) && !event.targets.includes(current) && lib.filter.targetEnabled2(event.card, player, current) });
        },
        content: function () {
            var targets2 = game.filterPlayer(function (current) { return player.getEnemies().includes(current) && !trigger.targets.includes(current) && lib.filter.targetEnabled2(trigger.card, player, current) })
            targets2.sort(lib.sort.seat);
            trigger.targets.addArray(targets2);
            player.line(targets2);
            game.log(targets2, '成为了', trigger.card, '的目标');
        },
        subSkill: {
            yingzi: {
                audio: "Kuiba_Kuiba",
                trigger: {
                    player: "phaseDrawBegin2",
                },
                filter: function (event, player) {
                    return !event.numFixed;
                },
                forced: true,
                content: function () {
                    trigger.num += 2;
                },
                ai: {
                    threaten: 1.3,
                },
                sub: true,
            },
            damage: {
                audio: "Kuiba_Kuiba",
                trigger: {
                    source: "damageBegin1",
                },
                filter: function (event, player) {
                    return event.card && ['sha', 'juedou'].includes(event.card.name) && player.inRange(event.player);
                },
                forced: true,
                content: function () {
                    trigger.num++;
                },
                sub: true,
            },
        },
    },
    //觉醒蛮吉
    "Kuiba_kuiqu": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "damageEnd",
        },
        filter: function (event, player) {
            return event.num > 0;
        },
        forced: true,
        content: function () {
            'step 0'
            event.count = trigger.num;
            'step 1'
            event.count--;
            player.draw();
            if (trigger.source && player.getEnemies().includes(trigger.source) && trigger.source != player && trigger.source.countCards('he')) {
                player.line(trigger.source);
                trigger.source.discard(trigger.source.getCards('he').randomGet());
            }
            'step 2'
            if (event.count > 0) event.goto(1);
        },
    },
    "Kuiba_juli": {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: {
            player: "useCard",
        },
        filter: function (event, player) {
            return (event.card && event.card.name == 'sha' && game.hasPlayer(function (current) { return current != player && get.distance(player, current) == 1 })) || (event.card && ((get.type(event.card) == 'basic' && !['shan', 'tao', 'jiu', 'du'].includes(event.card.name)) || get.type(event.card) == 'trick') && game.hasPlayer(function (current) { return current != player && get.distance(current, player) > 1 }))
        },
        forced: true,
        content: function () {
            if (trigger.card && trigger.card.name == 'sha' && game.hasPlayer(function (current) { return current != player && get.distance(player, current) == 1 })) {
                trigger.baseDamage += (game.countPlayer(function (current) { return current != player && get.distance(player, current) == 1 })) - 1;
                game.log(trigger.card, '造成的伤害基础值改为', game.countPlayer(function (current) { return current != player && get.distance(player, current) == 1 }));
            }
            if (trigger.card && ((get.type(trigger.card) == 'basic' && !['shan', 'tao', 'jiu', 'du'].includes(trigger.card.name)) || get.type(trigger.card) == 'trick') && game.hasPlayer(function (current) { return current != player && get.distance(current, player) > 1 })) {
                trigger.directHit.addArray(game.filterPlayer(function (current) { return current != player && get.distance(current, player) > 1 }));
                game.log(trigger.card, '无法被', game.filterPlayer(function (current) { return current != player && get.distance(current, player) > 1 }), '响应');
            }
        },
        ai: {
            "directHit_ai": true,
            skillTagFilter: function (player, tag, arg) {
                return get.distance(arg.target, player) > 1;
            },
        },
    },
    txhouyuankb: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        forced: true,
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuankb = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuankb) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuankb');
            player.storage.txhouyuankb = true;
            player.discard(player.getCards('hj'));
            'step 1'
            player.uninit();
            player.init('txhj_kbmanjijx');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuankb) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuankb) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    //额外扩增①
    txgdfudou: {
        audio: 1,
        trigger: { source: 'damageBegin1' },
        filter: function (event) {
            return event.card && event.card.name == 'juedou' && event.notLink();
        },
        forced: true,
        content: function () {
            trigger.num++;
        }
    },
    txhouyuansp: {
        audio: 2,
        unique: true,
        enable: 'chooseToUse',
        mark: true,
        limited: true,
        skillAnimation: true,
        animationColor: 'orange',
        init: function (player) {
            player.storage.txhouyuansp = false;
        },
        filter: function (event, player) {
            if (player.storage.txhouyuansp) return false;
            if (event.type == 'dying') {
                if (player != event.dying) return false;
                return true;
            }
            else if (event.parent.name == 'phaseUse') {
                return true;
            }
            return false;
        },
        content: function () {
            'step 0'
            player.awakenSkill('txhouyuansp');
            player.storage.txhouyuansp = true;
            player.discard(player.getCards('hj'));
            'step 1'
            player.uninit();
            player.init('txhj_gdshenpei');
            'step 2'
            player.link(false);
            'step 3'
            player.turnOver(false);
            'step 4'
            player.draw(4);
            'step 5'
            if (player.hp < 3) {
                player.recover(player.maxHp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter: function (player, tag, target) {
                if (player != target || player.storage.txhouyuansp) return false;
            },
            save: true,
            result: {
                player: function (player) {
                    if (player.hp <= 0) return 10;
                    if (player.hp <= 1 && player.countCards('he') <= 1) return 10;
                    return 0;
                }
            },
            threaten: function (player, target) {
                if (!target.storage.txhouyuansp) return 0.6;
            }
        },
        intro: {
            content: 'limited'
        }
    },
    txyaozhuo: {
        audio: "cangchu",
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return player.canCompare(current);
            });
        },
        filterTarget: function (card, player, current) {
            return player.canCompare(current);
        },
        content: function () {
            'step 0'
            player.chooseToCompare(target);
            'step 1'
            if (result.bool) {
                target.skip('phaseDraw');
                target.addTempSkill('txyaozhuo2', { player: 'phaseDrawSkipped' });
            }
            else player.chooseToDiscard(2, 'he', true);
        },
        ai: {
            order: 1,
            result: {
                target: function (player, target) {
                    if (target.skipList.includes('phaseDraw') || target.hasSkill('pingkou')) return 0;
                    var hs = player.getCards('h').sort(function (a, b) {
                        return b.number - a.number;
                    });
                    var ts = target.getCards('h').sort(function (a, b) {
                        return b.number - a.number;
                    });
                    if (!hs.length || !ts.length) return 0;
                    if (hs[0].number > ts[0].number) return -1;
                    return 0;
                },
            },
        },
    },
    txyaozhuo2: {
        mark: true,
        intro: { content: '跳过下回合的摸牌阶段' },
    },
    txyoulie: {
        audio: 2,
        trigger: { global: 'phaseUseBegin' },
        filter: function (event, player) {
            if (!event.player.isAlive()) return false;
            return _status.connectMode && player.countCards('hes') || !_status.connectMode && player.hasCard(card => {
                return get.color(card) == 'red';
            }, 'hes');
        },
        direct: true,
        content: function () {
            'step 0'
            var next = player.chooseToUse();
            next.set('openskilldialog', `###${get.prompt('txyoulie')}###将一张红色牌当【杀】使用${player == trigger.player ? '' : `。若${get.translation(trigger.player)}受到了此【杀】的伤害，你获得其一张手牌。`
                }`);
            next.set('norestore', true);
            next.set('_backupevent', 'txyoulie_backup');
            next.set('addCount', false);
            next.set('logSkill', 'txyoulie');
            next.set('custom', {
                add: {},
                replace: { window: function () { } }
            });
            next.backup('txyoulie_backup');
            'step 1'
            if (result.bool) {
                if (trigger.player.isIn() && trigger.player.hasHistory('damage', evt => {
                    return evt.card && evt.card.storage && evt.card.storage.txyoulie;
                }) && trigger.player.countGainableCards(player, 'hj')) player.gainPlayerCard(trigger.player, 'hj', true);
            }
        },
        subSkill: {
            backup: {
                filterCard: function (card) {
                    return get.itemtype(card) == 'card' && get.color(card) == 'red';
                },
                viewAs: {
                    name: 'sha',
                    storage: { txyoulie: true },
                },
                selectCard: 1,
                position: 'hes',
                ai1: function (card) {
                    return 5 - get.value(card);
                },
                precontent: function () {
                    delete event.result.skill;
                },
            },
        },
    },
    sphuyuan: {
        audio: 'huyuan',
        trigger: { player: 'phaseJieshuBegin' },
        direct: true,
        preHidden: true,
        filter: function (event, player) {
            return player.countCards('he') > 0;
        },
        content: function () {
            'step 0'
            player.chooseCardTarget({
                filterCard: true,
                position: 'he',
                filterTarget: function (card, player, target) {
                    if (player == target) return false;
                    var card = ui.selected.cards[0];
                    if (get.type(card) != 'equip') return true;
                    return target.isEmpty(get.subtype(card));
                },
                prompt: get.prompt2('sphuyuan'),
                complexSelect: true,
                ai1: function (card) {
                    var player = _status.event.player;
                    if (get.type(card) != 'equip') return 0;
                    return 6 - get.value(card);
                },
                ai2: function (target) {
                    var player = _status.event.player, card = ui.selected.cards[0];
                    return get.effect(target, card, player, player);
                },
            }).setHiddenSkill('sphuyuan');
            'step 1'
            if (result.bool) {
                var target = result.targets[0], card = result.cards[0];
                player.logSkill('sphuyuan', target);
                if (get.type(card) == 'equip') {
                    player.$give(card, target, false);
                    game.delayx();
                    target.equip(card);
                }
                else {
                    player.give(card, target);
                    event.finish();
                }
            }
            else event.finish();
            'step 2'
            if (game.hasPlayer(function (current) {
                return current.hasCard(function (card) {
                    return lib.filter.canBeDiscarded(card, player, current);
                }, 'ej');
            })) {
                player.chooseTarget('是否弃置场上的一张牌？', function (card, player, target) {
                    return target.hasCard(function (card) {
                        return lib.filter.canBeDiscarded(card, player, target);
                    }, 'ej');
                });
            }
            else event.finish();
            'step 3'
            if (result.bool) {
                var target = result.targets[0];
                player.line(target, 'thunder');
                player.discardPlayerCard(target, true, 'ej');
            }
        },
    },
    txfujian: {
        audio: "xueyi",
        trigger: { source: 'damageBegin1' },
        filter: function (event) {
            return event.card && event.card.name == 'wanjian' && event.notLink();
        },
        forced: true,
        content: function () {
            trigger.num++;
        }
    },
    txdunjia: {
        mod: {
            targetInRange: function (card, player, target, now) {
                var type = get.type(card);
                if (type == 'food' || type == 'jiguan') return true;
            },
            canBeDiscarded: function (card) {
                if (get.position(card) == 'e' && ['equip4'].includes(get.subtype(card))) return false;
            },
        },
    },
    txqiangxi: {
        subSkill: {
            off: {
                sub: true,
            },
        },
        audio: "reqiangxi",
        enable: "phaseUse",
        filterCard: function (card) {
            return get.subtype(card) == 'equip1';
        },
        selectCard: function () {
            return [0, 1];
        },
        filterTarget: function (card, player, target) {
            if (player == target) return false;
            if (target.hasSkill('txqiangxi_off')) return false;
            return player.inRange(target);
        },
        content: function () {
            "step 0"
            if (cards.length == 0) {
                player.loseHp();
            }
            "step 1"
            target.addTempSkill('txqiangxi_off');
            target.damage(2, 'nocard');
        },
        check: function (card) {
            return 10 - get.value(card);
        },
        position: "he",
        ai: {
            order: 8.5,
            result: {
                target: function (player, target) {
                    if (!ui.selected.cards.length) {
                        if (player.hp < 2) return 0;
                        if (target.hp >= player.hp) return 0;
                    }
                    return get.damageEffect(target, player);
                },
            },
        },
        threaten: 1.5,
    },
    //守卫剑阁
    jgchiying: {
        audio: "sidi",
        trigger: { global: 'damageBegin4' },
        forced: true,
        filter: function (event, player) {
            if (event.num <= 1) return false;
            return event.player.isFriendOf(player);
        },
        content: function () {
            trigger.num = 1;
        }
    },
    jgjingfan: {
        global: 'jgjingfan2',
    },
    jgjingfan2: {
        mod: {
            globalFrom: function (from, to, distance) {
                if (to.isEnemyOf(from)) return;
                var players = game.filterPlayer();
                for (var i = 0; i < players.length; i++) {
                    if (players[i].hasSkill('jgjingfan') &&
                        players[i].isFriendOf(from) && players[i] != from) {
                        return distance - 1;
                    }
                }
            }
        }
    },
    jgjiaoxie: {
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return lib.skill.jgjiaoxie.filterTarget(null, player, current);
            });
        },
        filterTarget: function (card, player, target) {
            return target.isEnemyOf(player)/*&&target.type=='mech'*/ && target.countCards('he') > 0;
        },
        content: function () {
            'step 0'
            if (!target.countCards('he')) event.finish();
            else target.chooseCard('he', true, '将一张牌交给' + get.translation(player));
            'step 1'
            if (result.bool) {
                player.gain(result.cards, target, 'give');
            }
        },
        ai: {
            order: 9,
            result: {
                target: function (player, target) {
                    if (target.countCards('e', function (card) {
                        return get.value(card, target) <= 0;
                    }) > 0) return 1;
                    return -1;
                },
            },
        },
    },
    jglianyu: {
        trigger: { player: 'phaseEnd' },
        unique: true,
        content: function () {
            "step 0"
            event.players = game.filterPlayer(function (current) {
                return current.isEnemyOf(player);
            });
            "step 1"
            if (event.players.length) {
                var current = event.players.shift();
                player.line(current, 'fire');
                current.damage('fire');
                event.redo();
            }
        },
        ai: {
            threaten: 2
        }
    },
    jgjiguan: {
        mod: {
            targetEnabled: function (card, player, target) {
                if (card.name == 'lebu') {
                    return false;
                }
            }
        }
    },
    jglingyu: {
        trigger: { player: 'phaseEnd' },
        check: function (event, player) {
            if (player.isTurnedOver()) return true;
            var num = 0, players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].hp < players[i].maxHp &&
                    players[i].isFriendOf(player) && get.recoverEffect(players[i]) > 0) {
                    if (players[i].hp == 1) {
                        return true;
                    }
                    num++;
                    if (num >= 2) return true;
                }
            }
            return false;
        },
        content: function () {
            'step 0'
            player.turnOver();
            'step 1'
            var list = game.filterPlayer(function (current) {
                return current.isDamaged() && current.isFriendOf(player);
            });
            player.line(list, 'green');
            event.targets = list;
            'step 2'
            if (event.targets.length) {
                event.targets.shift().recover();
                event.redo();
            }
        },
        ai: {
            threaten: 1.5,
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'guiyoujie') return [0, 1];
                }
            }
        },
    },
    txlvecai: {
        mod: {
            targetInRange: function (card, player, target, now) {
                var type = get.type(card);
                if (type == 'basic' || type == 'delay') return true;
            },
            canBeDiscarded: function (card) {
                if (get.position(card) == 'e' && ['equip3', 'equip4'].includes(get.subtype(card))) return false;
            },
        },
    },
    jgqiwu: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'useCard' },
        direct: true,
        filter: function (event, player) {
            if (get.suit(event.card) == 'club') {
                return game.hasPlayer(function (current) {
                    return current.isFriendOf(player) && current.isDamaged();
                });
            }
            return false;
        },
        content: function () {
            "step 0"
            var noneed = (trigger.card.name == 'tao' && trigger.targets[0] == player && player.hp == player.maxHp - 1);
            player.chooseTarget(get.prompt('jgqiwu'), function (card, player, target) {
                return target.hp < target.maxHp && target.isFriendOf(player);
            }).ai = function (target) {
                var num = get.attitude(player, target);
                if (num > 0) {
                    if (noneed && player == target) {
                        num = 0.5;
                    }
                    else if (target.hp == 1) {
                        num += 3;
                    }
                    else if (target.hp == 2) {
                        num += 1;
                    }
                }
                return num;
            }
            "step 1"
            if (result.bool) {
                player.logSkill('qiwu', result.targets);
                result.targets[0].recover();
            }
        },
        ai: {
            expose: 0.3,
            threaten: 1.5
        }
    },
    jgtianyu: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'phaseEnd' },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.isEnemyOf(player) && !current.isLinked();
            });
        },
        content: function () {
            "step 0"
            event.targets = game.filterPlayer();
            event.targets.sort(lib.sort.seat);
            "step 1"
            if (event.targets.length) {
                var target = event.targets.shift();
                if (!target.isLinked() && target.isEnemyOf(player)) {
                    player.line(target, 'green');
                    target.link();
                }
                event.redo();
            }
        }
    },
    jgyuhuo: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'damageBegin2' },
        filter: function (event) {
            return event.nature == 'fire';
        },
        forced: true,
        content: function () {
            trigger.cancel();
        },
        ai: {
            nofire: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.tag(card, 'fireDamage')) return 0;
                }
            }
        }
    },
    jgfengjian: {
        trigger: { source: 'damageSource' },
        forced: true,
        filter: function (event, player) {
            return event.player.isAlive();
        },
        logTarget: 'player',
        content: function () {
            trigger.player.addTempSkill('jgfengjian2', { player: 'phaseAfter' });
            trigger.player.markAuto('jgfengjian2', [player]);
        },
    },
    jgfengjian2: {
        onremove: true,
        intro: {
            content: '不能对$使用牌',
        },
        mod: {
            playerEnabled: function (card, player, target) {
                if (player.getStorage('jgfengjian2').includes(target)) return false;
            },
        },
    },
    jgkeding: {
        trigger: { player: 'useCard2' },
        direct: true,
        filter: function (event, player) {
            if (!event.targets || event.targets.length != 1) return false;
            var card = event.card;
            if (card.name != 'sha' && get.type(card) != 'trick') return false;
            var info = get.info(card);
            if (info.allowMultiple == false) return false;
            if (!player.countCards('h')) return false;
            if (!info.multitarget) {
                if (game.hasPlayer(function (current) {
                    return !event.targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && lib.filter.targetInRange(card, player, current);
                })) {
                    return true;
                }
            }
            return false;
        },
        content: function () {
            'step 0'
            var card = trigger.card;
            var prompt2 = '弃置任意张手牌，并为' + get.translation(card) + '增加等量的目标';
            var targets = game.filterPlayer(function (current) {
                return !trigger.targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && lib.filter.targetInRange(card, player, current);
            });
            var max = 0;
            if (!trigger.targets[0].hasSkill('heiguangkai_skill')) max = targets.filter(function (target) {
                return get.effect(target, card, player, player) > 0;
            }).length;
            player.chooseCardTarget({
                prompt: get.prompt('jgkeding'),
                prompt2: prompt2,
                selectCard: function () {
                    var player = _status.event.player;
                    var targets = _status.event.targets;
                    return [Math.max(1, ui.selected.targets.length), Math.min(targets.length, player.countCards('h'))];
                },
                selectTarget: function () {
                    return ui.selected.cards.length;
                },
                position: 'h',
                filterCard: lib.filter.cardDiscardable,
                filterTarget: function (card, player, target) {
                    return _status.event.targets.includes(target);
                },
                targets: targets,
                ai1: function (card) {
                    if (ui.selected.cards.length >= _status.event.max) return 0;
                    return 5 - get.value(card);
                },
                ai2: function (target) {
                    if (target.hasSkill('heiguangkai_skill')) return 0;
                    var trigger = _status.event.getTrigger();
                    var player = _status.event.player;
                    return get.effect(target, trigger.card, player, player);
                },
                max: max,
            });
            'step 1'
            if (result.bool) {
                player.logSkill('jgkeding', result.targets);
                player.discard(result.cards);
                trigger.targets.addArray(result.targets);
            }
        },
    },
    zlbushi: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: { player: 'damageEnd' },
        frequent: true,
        preHidden: true,
        content: function () {
            'step 0'
            event.count = trigger.num;
            'step 1'
            event.count--;
            player.draw();
            'step 2'
            if (event.count > 0) {
                player.chooseBool(get.prompt2('zlbushi')).set('frequentSkill', 'zlbushi');
            }
            else event.finish();
            'step 3'
            if (result.bool) event.goto(1);
        },
        group: 'zlbushi_draw',
        subSkill: {
            draw: {
                trigger: { source: 'damageSource' },
                direct: true,
                noHidden: true,
                filter: function (event, player) {
                    return event.player.isEnemyOf(player) && event.player.isIn();
                },
                content: function () {
                    'step 0'
                    trigger.player.chooseBool('是否对' + get.translation(player) + '发动【布施】？', '你摸一张牌，然后其摸一张牌');
                    'step 1'
                    if (result.bool) {
                        player.logSkill('zlbushi', trigger.player);
                        game.asyncDraw([trigger.player, player]);
                    }
                    else event.finish();
                    'step 2'
                    game.delayx();
                },
            },
        },
    },
    jgbashi: {
        filter: function (event, player) {
            return event.player != player && event.card && (event.card.name == 'sha' || get.type(event.card) == 'trick') && !player.isTurnedOver();
        },
        logTarget: 'player',
        check: function (event, player) {
            if (event.getParent().excluded.includes(player)) return false;
            if (get.attitude(player, event.player) > 0) {
                return false;
            }
            if (get.tag(event.card, 'respondSha')) {
                if (player.countCards('h', { name: 'sha' }) == 0) {
                    return true;
                }
            }
            else if (get.tag(event.card, 'respondShan')) {
                if (player.countCards('h', { name: 'shan' }) == 0) {
                    return true;
                }
            }
            else if (get.tag(event.card, 'damage')) {
                if (event.card.name == 'shuiyanqijunx') return player.countCards('e') < 2;
                return true;
                //if(player.countCards('h')<2) return true;
            }
            return false;
        },
        trigger: { target: 'useCardToTargeted' },
        content: function () {
            player.turnOver();
            trigger.getParent().excluded.add(player);
        },
    },
    jgdanjing: {
        trigger: { global: 'dying' },
        filter: function (event, player) {
            return player.hp > 1 && event.player.hp < 1 && event.player.isFriendOf(player);
        },
        check: function (event, player) {
            var target = event.player;
            return get.attitude(player, target) > 0 && lib.filter.cardSavable({ name: 'tao', isCard: true }, player, target);
        },
        logTarget: 'player',
        content: function () {
            'step 0'
            player.loseHp();
            'step 1'
            var card = { name: 'tao', isCard: true };
            if (lib.filter.cardSavable(card, player, trigger.player)) player.useCard(card, trigger.player);
        },
    },
    jgdidong: {
        trigger: { player: 'phaseEnd' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('jgdidong'), function (card, player, target) {
                return target.isEnemyOf(player);
            }).ai = function (target) {
                var att = get.attitude(player, target);
                if (target.isTurnedOver()) {
                    if (att > 0) {
                        return att + 5;
                    }
                    return -1;
                }
                if (player.isTurnedOver()) {
                    return 5 - att;
                }
                return -att;
            };
            "step 1"
            if (result.bool) {
                player.logSkill('jgdidong', result.targets);
                result.targets[0].turnOver();
            }
        },
        ai: {
            threaten: 1.7
        }
    },
    jghuodi: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: { player: 'phaseEnd' },
        direct: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.isFriendOf(player) && current.isTurnedOver();
            });
        },
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('jghuodi'), function (card, player, target) {
                return !target.isFriendOf(player);
            }).ai = function (target) {
                if (target.isTurnedOver()) return 0;
                return -get.attitude(player, target);
            };
            "step 1"
            if (result.bool) {
                player.logSkill('jghuodi', result.targets);
                result.targets[0].turnOver();
            }
        },
        ai: {
            expose: 0.2
        }
    },
    jgjueji: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: { global: 'phaseDrawBegin' },
        filter: function (event, player) {
            if (event.player.isFriendOf(player)) {
                return false;
            }
            return event.num > 0 && event.player != player && event.player.hp < event.player.maxHp;
        },
        logTarget: 'player',
        content: function () {
            player.line(trigger.player, 'green');
            trigger.num--;
        },
        ai: {
            expose: 0.2,
            threaten: 1.4
        }
    },
    jgtanshi: {
        trigger: { player: 'phaseEnd' },
        forced: true,
        check: function () {
            return false;
        },
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        content: function () {
            player.chooseToDiscard('h', true);
        }
    },
    jgtunshi: {
        trigger: { player: 'phaseBegin' },
        forced: true,
        filter: function (event, player) {
            var nh = player.countCards('h');
            return game.hasPlayer(function (current) {
                return current.isEnemyOf(player) && current.countCards('h') > nh;
            });
        },
        content: function () {
            'step 0'
            var nh = player.countCards('h');
            var targets = game.filterPlayer(function (current) {
                return current.isEnemyOf(player) && current.countCards('h') > nh;
            });
            targets.sort(lib.sort.seat);
            event.targets = targets;
            'step 1'
            if (event.targets.length) {
                var current = event.targets.shift();
                current.damage();
                player.line(current, 'thunder');
                event.redo();
            }
        }
    },
    jgtianyun: {
        trigger: { player: 'phaseEnd' },
        direct: true,
        content: function () {
            "step 0"
            event.forceDie = true;
            player.chooseTarget(get.prompt('jgtianyun'), function (card, player, target) {
                return target.isEnemyOf(player);
            }).ai = function (target) {
                if (player.hp <= 1) return 0;
                if (get.attitude(player, target) > -3) return 0;
                var eff = get.damageEffect(target, player, player, 'fire');
                if (eff > 0) {
                    return eff + target.countCards('e') / 2;
                }
                return 0;
            }
            "step 1"
            if (result.bool) {
                player.logSkill('jgtianyun', result.targets, 'fire');
                player.loseHp();
                event.target = result.targets[0];
            }
            else {
                event.finish();
            }
            "step 2"
            if (event.target) {
                event.target.damage(Math.random() > 0.4 ? 2 : 3, 'fire');
            }
            "step 3"
            if (event.target) {
                var es = event.target.getCards('e');
                if (es.length) {
                    event.target.discard(es);
                }
            }
        },
        ai: {
            threaten: 2
        }
    },
    jgfenyong: {
        audio: "fenyong",
        trigger: { player: 'damageEnd' },
        content: function () {
            player.addTempSkill('jgfenyong2');
            player.draw(1);
        }
    },
    jgfenyong2: {
        audio: 'fenyong',
        mark: true,
        intro: {
            content: '记下仇恨'
        },
        trigger: { player: 'damageBegin3' },
        forced: true,
        content: function () {
            player.draw(0);
        },
        ai: {
            maixie: true,
            maixie_hp: true,
            nofire: true,
            nothunder: true,
            nodamage: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.tag(card, 'damage')) return [0, 0];
                }
            },
        }
    },
    jgxuehen: {
        audio: "xuehen",
        trigger: { global: 'phaseJieshuBegin' },
        forced: true,
        locked: false,
        filter: function (event, player) {
            return player.hasSkill('jgfenyong2') && event.player.isIn();
        },
        content: function () {
            'step 0'
            player.removeSkill('jgfenyong2');
            player.chooseControl('弃牌', '出杀', function () {
                var player = _status.event.player;
                var trigger = _status.event.getTrigger();
                if (get.attitude(player, trigger.player) < 0) {
                    var he = trigger.player.countCards('he');
                    if (he < 2) return '出杀';
                    if (player.maxHp - player.hp >= 2 && he <= 3) {
                        return '弃牌';
                    }
                    if (player.maxHp - player.hp >= 3 && he <= 5) {
                        return '弃牌';
                    }
                    if (player.maxHp - player.hp > 3) {
                        return '弃牌';
                    }
                    return '出杀';
                }
                return '出杀';
            }).set('prompt', '弃置' + get.translation(trigger.player) + get.cnNumber(player.maxHp - player.hp) + '张牌，或对任意一名角色使用一张杀');
            'step 1'
            if (result.control == '弃牌') {
                player.line(trigger.player, 'green');
                if (player.hp < player.maxHp && trigger.player.countCards('he')) {
                    player.discardPlayerCard(trigger.player, true, 'he', player.maxHp - player.hp);
                }
            }
            else {
                player.chooseUseTarget({ name: 'sha' }, true, false, 'nodistance');
            }
        }
    },
    jgtianhuo: {
        audio: "xintan",
        trigger: { player: 'phaseBegin' },
        forced: true,
        filter: function (event, player) {
            if (_status.mode != 'taixuhuanjing') return false;
            var players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].isEnemyOf(player)) {
                    return true;
                }
            }
        },
        content: function () {
            var target = game.findPlayer(function (current) {
                return current.isEnemyOf(player);
            });
            if (target) {
                player.line(target, 'fire');
                target.damage(Math.random() > 0.4 ? 0 : 1, 'fire');
            }
        },
        ai: {
            threaten: function (player, target) {
                if (_status.mode == 'taixuhuanjing') {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].isEnemyOf(target)) {
                            return 2;
                        }
                    }
                }
                return 1;
            }
        }
    },
    jgxiaorui: {
        trigger: { global: 'damageSource' },
        forced: true,
        logTarget: 'source',
        filter: function (event, player) {
            var target = event.source;
            return target && target == _status.currentPhase && target.isAlive() && target.isFriendOf(player) && event.card && event.card.name == 'sha' && event.getParent().type == 'card';
        },
        content: function () {
            var source = trigger.source;
            source.addTempSkill('jgxiaorui2');
            source.addMark('jgxiaorui2', 1, false);
        }
    },
    jgxiaorui2: {
        onremove: true,
        charlotte: true,
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + player.countMark('jgxiaorui2');
            },
        },
    },
    jghuchen: {
        trigger: {
            player: 'phaseDrawBegin2',
            source: 'dieAfter',
        },
        forced: true,
        filter: function (event, player) {
            if (event.name == 'die') return event.player.isEnemyOf(player);
            return !event.numFixed && player.countMark('jghuchen') > 0;
        },
        content: function () {
            if (trigger.name == 'die') player.addMark('jghuchen', 1);
            else trigger.num += player.countMark('jghuchen');
        },
        intro: {
            content: '已斩杀过$名敌将',
        },
    },
    jglingfeng: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: { player: 'phaseDrawBefore' },
        content: function () {
            "step 0"
            trigger.cancel();
            event.cards = get.cards(2);
            player.showCards(event.cards);
            "step 1"
            if (get.color(event.cards[0]) != get.color(event.cards[1])) {
                player.chooseTarget('是否令一名敌方角色失去1点体力？', function (card, player, target) {
                    return !target.isFriendOf(player);
                }).ai = function (target) {
                    return -get.attitude(player, target);
                }
            }
            "step 2"
            if (result.bool && result.targets && result.targets.length) {
                player.line(result.targets, 'green');
                result.targets[0].loseHp();
            }
            "step 3"
            player.gain(event.cards);
            player.$draw(event.cards);
            game.delay();
        },
        ai: {
            threaten: 1.4
        }
    },
    jgjizhen: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: { player: 'phaseEnd' },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.isFriendOf(player) && current.isDamaged();
            });
        },
        content: function () {
            var list = game.filterPlayer(function (current) {
                return current.isFriendOf(player) && current.isDamaged();
            });
            if (list.length) {
                player.line(list, 'green');
                game.asyncDraw(list);
            }
        },
        ai: {
            threaten: 1.4
        }
    },
    jgzhenwei: {
        global: 'jgzhenwei2',
        ai: {
            threaten: 1.5
        }
    },
    jgzhenwei2: {
        mod: {
            globalTo: function (from, to, distance) {
                if (to.isFriendOf(from)) return;
                var players = game.filterPlayer();
                for (var i = 0; i < players.length; i++) {
                    if (players[i].hasSkill('jgzhenwei') &&
                        players[i].isFriendOf(to) && players[i] != to) {
                        return distance + 1;
                    }
                }
            }
        }
    },
    jgbenlei: {
        audio: "nutao",
        trigger: { player: 'phaseBegin' },
        forced: true,
        filter: function (event, player) {
            if (_status.mode != 'taixuhuanjing') return false;
            var players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].isEnemyOf(player)) {
                    return true;
                }
            }
        },
        content: function () {
            var target = game.findPlayer(function (current) {
                return current.isEnemyOf(player);
            });
            if (target) {
                player.line(target, 'thunder');
                target.damage(Math.random() > 0.4 ? 2 : 3, 'thunder');
            }
        },
        ai: {
            threaten: function (player, target) {
                if (_status.mode == 'taixuhuanjing') {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].isEnemyOf(target)) {
                            return 2;
                        }
                    }
                }
                return 1;
            }
        }
    },
    lbjijiang: {
        audio: 'jijiang1',
        unique: true,
        group: ['lbjijiang1'],
        //zhuSkill:true,
        filter: function (event, player) {
            if (/*!player.hasZhuSkill('lbjijiang')||*/!game.hasPlayer(function (current) {
                return current != player && current.group == 'shu';
            })) return false;
            return !event.lbjijiang && (event.type != 'phase' || !player.hasSkill('lbjijiang3'));
        },
        enable: ['chooseToUse', 'chooseToRespond'],
        viewAs: { name: 'sha' },
        filterCard: function () { return false },
        selectCard: -1,
        ai: {
            order: function () {
                return get.order({ name: 'sha' }) + 0.3;
            },
            respondSha: true,
            skillTagFilter: function (player) {
                if (/*!player.hasZhuSkill('lbjijiang')||*/!game.hasPlayer(function (current) {
                    return current != player && current.group == 'shu';
                })) return false;
            },
        },
    },
    lbjijiang1: {
        audio: "jijiang1",
        trigger: { player: ['useCardBegin', 'respondBegin'] },
        logTarget: 'targets',
        filter: function (event, player) {
            return event.skill == 'lbjijiang';
        },
        forced: true,
        content: function () {
            "step 0"
            delete trigger.skill;
            trigger.getParent().set('lbjijiang', true);
            "step 1"
            if (event.current == undefined) event.current = player.next;
            if (event.current == player) {
                player.addTempSkill('lbjijiang3');
                event.finish();
                trigger.cancel();
                trigger.getParent().goto(0);
            }
            else if (event.current.group == 'shu') {
                var next = event.current.chooseToRespond('是否替' + get.translation(player) + '打出一张杀？', { name: 'sha' });
                next.set('ai', function () {
                    var event = _status.event;
                    return (get.attitude(event.player, event.source) - 2);
                });
                next.set('source', player);
                next.set('lbjijiang', true);
                next.set('skillwarn', '替' + get.translation(player) + '打出一张杀');
                next.noOrdering = true;
                next.autochoose = lib.filter.autoRespondSha;
            }
            else {
                event.current = event.current.next;
                event.redo();
            }
            "step 2"
            if (result.bool) {
                event.finish();
                trigger.card = result.card;
                trigger.cards = result.cards;
                trigger.throw = false;
                if (typeof event.current.ai.shown == 'number' && event.current.ai.shown < 0.95) {
                    event.current.ai.shown += 0.3;
                    if (event.current.ai.shown > 0.95) event.current.ai.shown = 0.95;
                }
            }
            else {
                event.current = event.current.next;
                event.goto(1);
            }
        }
    },
    lbjijiang3: {
        trigger: { global: ['useCardAfter', 'useSkillAfter', 'phaseAfter'] },
        silent: true,
        charlotte: true,
        filter: function (event) {
            return event.skill != 'lbjijiang' && event.skill != 'qinwang';
        },
        content: function () {
            player.removeSkill('lbjijiang3');
        }
    },
    jgguasha: {
        audio: "fuzhu",
        shaRelated: true,
        trigger: { player: 'useCardToPlayered' },
        check: function (event, player) {
            return get.attitude(player, event.target) <= 0;
        },
        filter: function (event, player) {
            return event.card.name == 'sha';
        },
        logTarget: 'target',
        preHidden: true,
        content: function () {
            "step 0"
            player.judge(function (card) {
                if (get.zhu(_status.event.player, 'shouyue')) {
                    if (get.suit(card) != 'heart') return 2;
                }
                else {
                    if (get.color(card) == 'black') return 2;
                }
                return -0.5;
            }).judge2 = function (result) {
                return result.bool;
            };
            "step 1"
            if (result.bool) {
                player.draw();
            }
        },
        ai: {
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                if (get.attitude(player, arg.target) > 0 || arg.card.name != 'sha' || !ui.cardPile.firstChild || get.color(ui.cardPile.firstChild, player) != 'black') return false;
            },
        },
    },
    jggongshen: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: { player: 'phaseEnd' },
        //mode:['versus'],
        filter: function (event, player) {
            if (_status.mode != 'taixuhuanjing') return false;
            var players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (/*players[i].type=='mech'*/players[i].isEnemyOf(player)) {
                    if (players[i].isEnemyOf(player)) return true;
                    if (players[i].hp < players[i].maxHp) return true;
                }
            }
            return false;
        },
        content: function () {
            var enemy, players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (/*players[i].type=='mech'*/players[i].hp < players[i].maxHp) {
                    if (players[i].isFriendOf(player)) {
                        if (players[i].hp < players[i].maxHp) {
                            player.line(players[i], 'green');
                            players[i].recover();
                            return;
                        }
                    }
                    else {
                        enemy = players[i];
                    }
                }
            }
            if (enemy) {
                player.line(enemy, 'fire');
                enemy.damage('fire');
            }
        },
    },
    jgjingmiao: {
        trigger: { global: 'useCardAfter' },
        filter: function (event, player) {
            return event.player.isEnemyOf(player) && event.card.name == 'wuxie';
        },
        logTarget: 'player',
        check: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        content: function () {
            player.line(trigger.player, 'green');
            trigger.player.loseHp();
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    jgzhinang: {
        trigger: { player: 'phaseBegin' },
        frequent: true,
        content: function () {
            "step 0"
            event.cards = get.cards(5);
            event.cards2 = [];
            for (var i = 0; i < event.cards.length; i++) {
                var type = get.type(event.cards[i], 'trick');
                if (type == 'trick' || type == 'delay') {
                    event.cards2.push(event.cards[i]);
                }
            }
            if (!event.isMine() || event.cards2.length == 0) {
                player.showCards(event.cards);
            }
            "step 1"
            if (event.cards2.length == 0) {
                event.finish();
            }
            else {
                var dialog = ui.create.dialog('将三张牌中的锦囊牌或延时性锦囊牌交给一己方名角色', 'hidden');
                dialog.add(event.cards);
                for (var i = 0; i < dialog.buttons.length; i++) {
                    if (event.cards2.includes(dialog.buttons[i].link)) {
                        dialog.buttons[i].style.opacity = 1;
                    }
                    else {
                        dialog.buttons[i].style.opacity = 0.5;
                    }
                }
                var next = player.chooseTarget(true, dialog, function (card, player, target) {
                    return target.isFriendOf(player);
                });
                next.ai = function (target) {
                    var att = get.attitude(player, target);
                    if (att > 0 && target.hasJudge('lebu')) {
                        return 0.1;
                    }
                    if (player.countCards('h') > player.hp) {
                        if (target == player) return Math.max(1, att - 2);
                    }
                    if (target == player) return att + 5;
                    return att;
                }
            }
            "step 2"
            if (result && result.targets && result.targets.length) {
                event.target = result.targets[0];
            }
            if (event.cards2.length) {
                player.line(event.target, 'green');
                event.target.gain(event.cards2, 'gain2', 'log');
            }
        },
        ai: {
            threaten: 1.3
        }
    },
    jgbiantian4: {
        trigger: { player: 'dieBegin' },
        forced: true,
        popup: false,
        content: function () {
            for (var i = 0; i < game.players.length; i++) {
                if (game.players[i].hasSkill('jgbiantian3')) {
                    game.players[i].removeSkill('jgbiantian3');
                    game.players[i].popup('jgbiantian3');
                }
                if (game.players[i].hasSkill('jgbiantian2')) {
                    game.players[i].removeSkill('jgbiantian2');
                    game.players[i].popup('jgbiantian2');
                }
            }
        }
    },
    jgbiantian: {
        trigger: { player: 'phaseBegin' },
        forced: true,
        unique: true,
        audio: 'ext:太虚幻境/audio/skill:2',
        group: 'jgbiantian4',
        content: function () {
            "step 0"
            for (var i = 0; i < game.players.length; i++) {
                if (game.players[i].hasSkill('jgbiantian3')) {
                    game.players[i].removeSkill('jgbiantian3');
                    game.players[i].popup('jgbiantian3');
                }
                if (game.players[i].hasSkill('jgbiantian2')) {
                    game.players[i].removeSkill('jgbiantian2');
                    game.players[i].popup('jgbiantian2');
                }
            }
            player.judge(function (card) {
                var color = get.color(card);
                if (color == 'black') return 1;
                if (color == 'red') return 0;
                return -1;
            });
            "step 1"
            var targets = [], players = game.filterPlayer();
            if (result.color == 'red') {
                game.trySkillAudio('jgbiantianx2');
                for (var i = 0; i < players.length; i++) {
                    if (!players[i].isFriendOf(player)) {
                        players[i].addSkill('jgbiantian3');
                        players[i].popup('kuangfeng');
                        targets.push(players[i]);
                    }
                }
                player.logSkill('kuangfeng', targets, 'fire');
            }
            else if (result.color == 'black') {
                game.trySkillAudio('jgbiantianx1');
                for (var i = 0; i < players.length; i++) {
                    if (players[i].isFriendOf(player)) {
                        players[i].addSkill('jgbiantian2');
                        players[i].popup('dawu');
                        targets.push(players[i]);
                    }
                }
                player.logSkill('dawu', targets, 'thunder');
            }
        },
        ai: {
            threaten: 1.6
        }
    },
    jgbiantian2: {
        audio: "jgbiantian",
        trigger: { player: 'damageBefore' },
        filter: function (event) {
            if (event.nature != 'thunder') return true;
            return false;
        },
        forced: true,
        mark: true,
        marktext: '雾',
        intro: {
            content: '已获得大雾标记'
        },
        content: function () {
            trigger.cancel();
        },
        ai: {
            nofire: true,
            nodamage: true,
            effect: {
                target: function (card, player, target, current) {
                    if (get.tag(card, 'damage') && !get.tag(card, 'thunderDamage')) return [0, 0];
                }
            }
        }
    },
    jgbiantian3: {
        trigger: { player: 'damageBegin3' },
        filter: function (event) {
            if (event.nature == 'fire') return true;
            return false;
        },
        mark: true,
        marktext: '风',
        intro: {
            content: '已获得狂风标记'
        },
        forced: true,
        content: function () {
            trigger.num++;
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (get.tag(card, 'fireDamage')) return 1.5;
                }
            }
        }
    },
    lowmojian: {
        trigger: { player: 'phaseUseBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('lowmojian'), function (card, player, target) {
                if (target.isFriendOf(player)) return false;
                return lib.filter.targetEnabled({ name: 'wanjian' }, player, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'wanjian' }, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('lowmojian');
                player.useCard({ name: 'wanjian' }, result.targets, false);
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    jgxuanlei: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'phaseBegin' },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.isEnemyOf(player) && current.countCards('ej');
            });
        },
        content: function () {
            "step 0"
            event.targets = game.filterPlayer(function (current) {
                return current.isEnemyOf(player) && current.countCards('ej');
            });
            event.targets.sort(lib.sort.seat);
            player.line(event.targets, 'thunder');
            "step 1"
            if (event.targets.length) {
                event.targets.shift().damage('thunder');
                event.redo();
            }
        }
    },
    jgfanshi: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'phaseEnd' },
        forced: true,
        check: function () {
            return false;
        },
        content: function () {
            player.loseHp();
        }
    },
    jgskonghun: {
        audio: 'ext:太虚幻境/audio/skill:true',
        trigger: { player: 'phaseUseBegin' },
        filter: function (event, player) {
            var num = player.maxHp - player.hp;
            if (num == 0) return false;
            for (var i = 0; i < game.players.length; i++) {
                if (game.players[i].side != player.side) {
                    num--;
                }
            }
            return num >= 0;
        },
        forced: true,
        content: function () {
            'step 0'
            var targets = game.filterPlayer(function (current) {
                return current.isEnemyOf(player);
            });
            targets.sort(lib.sort.seat);
            event.targets = targets;
            player.line(targets, 'thunder');
            event.num = targets.length;
            'step 1'
            if (event.targets.length) {
                event.targets.shift().damage('thunder');
                event.redo();
            }
            'step 2'
            player.recover(event.num);
        },
        ai: {
            threaten: function (player, target) {
                if (target.hp == 1) return 2;
                if (target.hp == 2 && game.players.length < 8) return 1.5;
                return 0.5;
            },
        }
    },
    jglanggu: {
        skillAnimation: true,
        animationColor: 'thunder',
        unique: true,
        juexingji: true,
        audio: "reguicai",
        derivation: 'refankui',
        trigger: { player: 'dying' },
        //priority:10,
        forced: true,
        filter: function (event, player) {
            return !player.storage.kunfen;
        },
        content: function () {
            "step 0"
            player.loseMaxHp();
            "step 1"
            if (player.hp < 2) {
                player.recover(2 - player.hp);
            }
            "step 2"
            player.addSkill('refankui');
            player.awakenSkill('jglanggu');
            player.awakenSkill('jgfanshi');
        },
    },
    lowbenlei: {
        audio: "releiji",
        trigger: { player: 'phaseBegin' },
        forced: true,
        filter: function (event, player) {
            if (_status.mode != 'taixuhuanjing') return false;
            var players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].isEnemyOf(player)) {
                    return true;
                }
            }
        },
        content: function () {
            var target = game.findPlayer(function (current) {
                return current.isEnemyOf(player);
            });
            if (target) {
                player.line(target, 'thunder');
                target.damage(Math.random() > 0.3 ? 1 : 2, 'thunder');
            }
        },
        ai: {
            threaten: function (player, target) {
                if (_status.mode == 'taixuhuanjing') {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].isEnemyOf(target)) {
                            return 2;
                        }
                    }
                }
                return 1;
            }
        }
    },
    jgnailuo: {
        trigger: { player: 'phaseEnd' },
        check: function (event, player) {
            if (player.isTurnedOver()) return true;
            var num = 0, players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].isEnemyOf(player)) {
                    var es = players[i].getCards('e');
                    for (var j = 0; j < es.length; j++) {
                        switch (get.subtype(es[j])) {
                            case 'equip1': num += 1; break;
                            case 'equip2': num += 2; break;
                            case 'equip3': num += 2; break;
                            case 'equip4': num += 1; break;
                            case 'equip5': num += 1.5; break;
                        }
                    }
                }
            }
            if (_status.mode == 'jiange') {
                for (var i = 0; i < players.length; i++) {
                    if (players[i].isFriendOf(player) && players[i].hasSkill('huodi')) {
                        return num > 0;
                    }
                }
            }
            return num >= 4;
        },
        filter: function (event, player) {
            var players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].isEnemyOf(player) && players[i].countCards('e')) {
                    return true;
                }
            }
            return false;
        },
        content: function () {
            'step 0'
            player.turnOver();
            'step 1'
            event.targets = get.players();
            'step 2'
            if (event.targets.length) {
                var current = event.targets.shift();
                if (current.isEnemyOf(player)) {
                    var es = current.getCards('e');
                    if (es.length) {
                        current.discard(es);
                        player.line(current, 'green');
                    }
                }
                event.redo();
            }
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'guiyoujie') return [0, 1];
                }
            }
        },
    },
    txhj_xianluan: {
        derivation: 'zhujinqiyuan',
        enable: 'chooseToUse',
        viewAs: { name: 'zhujinqiyuan' },
        filterCard: { suit: 'spade' },
        viewAsFilter: function (player) {
            return player.countCards('hes', { suit: 'spade' }) > 0;
        },
        position: 'hes',
        mod: {
            selectTarget: function (card, player, range) {
                if (card.name == 'zhujinqiyuan' && range[1] != -1) range[1]++;
            },
        },
        check: function (card) {
            var player = _status.event.player;
            if (game.countPlayer(function (current) {
                return player.canUse('zhujinqiyuan', current) && get.effect(current, { name: 'zhujinqiyuan' }, player, player) > 0;
            }) > 1) return 6 - get.value(card);
            return 4 - get.value(card);
        },
    },
    txhj_jiexi: {
        trigger: { player: ['damageEnd', 'recoverAfter'] },
        content: function () {
            'step 0'
            player.judge(function (card) {
                return get.suit(card) == 'club' ? 2 : -2;
            }).judge2 = function (result) {
                return result.bool;
            };
            'step 1'
            if (result.bool && game.hasPlayer(current => current != player)) {
                player.chooseTarget(lib.filter.notMe, true, '选择一名其他角色，对其造成1点冰属性伤害').set('ai', function (target) {
                    var player = _status.event.player;
                    return get.damageEffect(target, player, player, 'ice');
                });
            }
            else event.finish();
            'step 2'
            var target = result.targets[0];
            player.addExpose(0.2);
            player.line(target, 'ice');
            target.damage(2, 'ice');
        },
    },
    txhj_huofu: {
        enable: 'chooseToUse',
        viewAs: {
            name: 'jiu',
            isCard: true,
        },
        viewAsFilter: function (player) {
            return !player.hasJudge('huoshan') && player.countCards('hes', function (card) {
                return get.color(card) == 'black' && get.type(card, 'trick') != 'trick';
            });
        },
        filterCard: function (card) {
            return get.color(card) == 'black' && get.type(card, 'trick') != 'trick';
        },
        check: function (card) {
            return 7 + (_status.event.dying || _status.event.player).getDamagedHp() - get.value(card);
        },
        ignoreMod: true,
        position: 'hes',
        precontent: function () {
            player.logSkill('txhj_huofu');
            player.$throw(event.result.cards);
            player.addJudge({ name: 'huoshan' }, event.result.cards);
            event.result.card.cards = [];
            event.result.cards = [];
            delete event.result.skill;
            delete event.result.card.suit;
            delete event.result.card.number;
        },
        ai: {
            result: 0.5,
        },
    },
    hsjiang: {
        shaRelated: true,
        audio: "sbjiang",
        usable: 3,
        //preHidden:true,	
        trigger: {
            player: 'useCardToPlayered',
            target: 'useCardToTargeted',
        },
        filter: function (event, player) {
            if (!(event.card.name == 'juedou' || (event.card.name == 'sha'))) return false;
            return player == event.target || event.getParent().triggeredTargets3.length == 1;
        },
        frequent: true,
        content: function () {
            player.draw();
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'sha') return [1, 0.6];
                },
                player: function (card, player, target) {
                    if (card.name == 'sha') return [1, 1];
                }
            }
        }
    },
    txhj_dulie: {
        audio: "dulie",
        trigger: { target: 'useCardToTarget' },
        forced: true,
        logTarget: 'player',
        filter: function (event, player) {
            return event.card.name == 'sha' && event.player.hp > player.hp;
        },
        content: function () {
            'step 0'
            player.judge(function (result) {
                if (get.color(result) == 'red') return 2;
                return -1;
            }).judge2 = function (result) {
                return result.bool;
            };
            'step 1'
            if (result.bool) {
                trigger.targets.remove(player);
                trigger.getParent().triggeredTargets2.remove(player);
                trigger.untrigger();
            }
        },
        ai: {
            effect: {
                target: function (card, player, target, current, isLink) {
                    if (card.name == 'sha' && !isLink && player.hp > target.hp) return 0.5;
                },
            },
        },
        marktext: '围',
        intro: {
            name: '破围(围)',
            name2: '围',
            content: 'mark',
        },
    },
    txhj_nuzhan: {
        audio: 1,
        trigger: { source: 'damageBegin1' },
        filter: function (event) {
            return event.card && event.card.name == 'sha' && get.color(event.card) == 'black' && event.notLink();
        },
        forced: true,
        content: function () {
            trigger.num++;
        }
    },
    txbianshu: {
        group: ['txbianshu_change'],
        audio: 2,
        trigger: {
            global: 'phaseBefore',
            player: 'enterGame',
        },
        forced: true,
        filter: function (event, player) {
            return (event.name != 'phase' || game.phaseNumber == 0);
        },
        content: function () {
            'step 0'
            player.chooseControl('魏', '魏').set('prompt', "你发动了清流，请选择一个势力加入");
            'step 1'
            if (result.control) {
                player.storage.txbianshu_choose = result.control;
                if (result.control == '魏') {
                    player.changeGroup('wei');
                } else if (result.control == '魏') {
                    player.changeGroup('wei');
                }
            }
        },
        subSkill: {
            change: {
                trigger: {
                    player: 'dyingAfter'
                },
                direct: true,
                locked: true,
                filter: function (event, player) {
                    return player.storage.txbianshu_changed != true;
                },
                content: function () {
                    player.storage.txbianshu_changed = true;
                    player.logSkill("txbianshu");
                    var groupx = player.storage.txbianshu_choose;
                    if (groupx == '魏') {
                        player.changeGroup('wei');
                    } else if (groupx == '魏') {
                        player.changeGroup('wei');
                    }
                }
            }
        }
    },
    txhj_tianxi: {
        mod: {
            globalFrom: function (player, target, distance) {
                return distance - 7;
            },
        },
        trigger: { player: 'damageEnd' },
        forced: true,
        filter: function (event, player) {
            return player != _status.currentPhase;
        },
        content: function () {
            'step 0'
            var func = function (result) {
                if (get.color(result) == 'black') return 1;
                return 0;
            };
            if (get.itemtype(trigger.source) != 'player' || !player.canUse('shunshou', trigger.source, false)) func = function (result) {
                return 0;
            };
            else if (get.effect(trigger.source, { name: 'shunshou' }, player, player) < 0) func = function (result) {
                if (get.color(result) == 'black') return -1;
                return 0;
            };
            player.judge(func).judge2 = function (result) {
                return result.color == 'black' ? true : false;
            };
            'step 1'
            if (result.color == 'black' && get.itemtype(trigger.source) == 'player' && player.canUse('shunshou', trigger.source, false)) {
                player.useCard({ name: 'shunshou', isCard: true }, trigger.source, false, 'noai');
            }
        },
    },
    txhj_kexian: {
        audio: "olzaoxian",
        trigger: { player: 'phaseEnd' },
        forced: true,
        content: function () {
            'step 0'
            player.draw();
            'step 1'
            var next = player.phaseUse();
            event.next.remove(next);
            trigger.next.push(next);
        },
    },
    txhj_feidu: {
        trigger: { player: 'phaseUseBegin' },
        direct: true,
        //locked:true,
        forced: true,
        content: function () {
            'step 0'
            var list = [];
            if (player.storage._ichiban_no_takaramono) list.push('cancel2');
            player.chooseControl.apply(player, list).set('choiceList', [
                '令此阶段内的所有梅花牌视为【落井下石】',
                '令此阶段内的所有红色牌视为【顺手牵羊】'
            ]).set('prompt', player.storage._ichiban_no_takaramono ? get.prompt('txhj_feidu') : '飞渡：请选择一项').set('ai', function () {
                var player = _status.event.player;
                var shas = player.countCards('h', 'shan')
                if (shas > 0) {
                    if (game.hasPlayer(function (current) {
                        return get.attitude(player, current) < 0 && player.canUse('shunshou', current) && !current.hasShan() && get.effect(current, { name: 'shunshou' }, player, player) > 0;
                    })) return 1;
                    if (player.storage._ichiban_no_takaramono) return 'cancel2';
                }
                if (player.countCards('h', function (card) {
                    return get.color(card) == 'red' && card.name != 'shunshou' && player.hasValueTarget(card);
                }) == 0) return 0;
                if (player.storage._ichiban_no_takaramono) return 'cancel2';
                return 1;
            });
            'step 1'
            if (result.control != 'cancel2') {
                player.logSkill('txhj_feidu');
                player.addTempSkill('txhj_feidu' + result.index, 'phaseUseEnd')
            }
        },
    },
    txhj_feidu0: {
        mod: {
            cardname: function (card) {
                if (get.suit(card) == 'club') return 'txluojingxiashi';
            },
        },
    },
    txhj_feidu1: {
        mod: {
            cardname: function (card) {
                if (get.color(card) == 'red') return 'shunshou';
            },
        },
    },
    txhj_chihen: {
        audio: 2,
        trigger: { player: 'die' },
        forced: true,
        forceDie: true,
        filter: function (event) {
            return event.source && event.source.isIn();
        },
        logTarget: 'source',
        skillAnimation: true,
        animationColor: 'fire',
        content: function () {
            trigger.source.damage(1, 'fire');
        },
        ai: {
            threaten: 0.7
        }
    },
    txhj_pobing: {
        trigger: { player: 'loseEnd' },
        frequent: true,
        unique: true,
        filter: function (event, player) {
            return _status.currentPhase != player;
        },
        content: function () {
            "step 0"
            player.judge(function (card) {
                return get.color(card) == 'black' ? 1 : 0;
            });
            "step 1"
            if (result.bool) {
                player.chooseTarget(true, '选择一个目标对其造成两点冰属性伤害', function (card, player, target) {
                    return player != target;
                }).ai = function (target) {
                    return get.damageEffect(target, player, player, 'ice');
                }
            }
            else {
                event.finish();
            }
            "step 2"
            if (result.targets.length) {
                player.line(result.targets, 'ice');
                result.targets[0].damage(2, 'ice');
            }
        },
        ai: {
            effect: {
                target: function (card) {
                    if (get.tag(card, 'loseCard')) {
                        return [0.5, 1];
                    }
                }
            }
        }
    },
    txhj_luancheng: {
        trigger: { player: 'useCard' },
        forced: true,
        filter: function (event, player) {
            return get.color(event.card) == 'black';
        },
        content: function () {
            trigger.directHit.addArray(game.players);
            trigger.directHit.remove(player);
        },
    },
    mod: {
        cardUsable: function (card) {
            if (get.color(card) == 'black') return Infinity;
        },
        targetInRange: function (card) {
            if (get.color(card) == 'black') return true;
        },
        wuxieRespondable: function (card, player, target) {
            if (get.color(card) == 'black' && player != target) return false;
        }
    },
    //	group:'txhj_luancheng2',
    //},
    /*txhj_luancheng2:{
        trigger:{player:'useCard'},
        forced:true,
        filter:function(event,player){
            return get.color(event.card)=='black';
        },
        content:function(){
            trigger.directHit.addArray(game.players);
            trigger.directHit.remove(player);
        },
    },*/
    boss_fentian: {
        trigger: { source: 'damageBegin1' },
        forced: true,
        filter: function (event) {
            return event.nature != 'fire';
        },
        content: function () {
            trigger.nature = 'fire';
        },
        mod: {
            cardUsable: function (card) {
                if (get.color(card) == 'red') return Infinity;
            },
            targetInRange: function (card) {
                if (get.color(card) == 'red') return true;
            },
            wuxieRespondable: function (card, player, target) {
                if (get.color(card) == 'red' && player != target) return false;
            }
        },
        group: 'boss_fentian2',
    },
    txhj_gongmou: {
        unique: true,
        global: 'txhj_gongmou2'
    },
    txhj_gongmou2: {
        audio: "xinzili",
        enable: 'chooseToUse',
        forced: true,
        filter: function (event, player) {
            return event.type == 'dying' && event.dying.hasSkill('txhj_gongmou') && player.isEnemyOf(event.dying);
        },
        filterCard: function (card) {
            return get.color(card) == 'black';
        },
        position: 'he',
        viewAs: { name: 'jiu' },
        prompt: '将一张黑色牌当酒使用',
        check: function (card) { return 8 - get.value(card) },
        ai: {
            order: 5,
            skillTagFilter: function (player) {
                var event = _status.event;
                if (event.dying && event.dying.hasSkill('txhj_gongmou') && player.isEnemyOf(event.dying)) {
                    return player.countCards('he', { color: 'black' }) > 0 && _status.currentPhase != player;
                }
                else {
                    return false;
                }
            },
            save: true,
        }
    },
    txhj_fanshi: {
        trigger: { player: 'damageEnd' },
        forced: true,
        filter: function (event) {
            return event.source != undefined;
        },
        logTarget: 'source',
        content: function () {
            trigger.source.damage()/*.nature=['fire','thunder'].randomGet()*/;
        },
    },
    txhj_zhuri: {
        audio: 'ext:太虚幻境/audio/skill:2',
        direct: true,
        lastDo: true,
        init: function (player) {
            player.storage.txhj_zhuri_count = 0;
        },
        trigger: {
            player: ['phaseZhunbeiEnd', 'phaseJudgeEnd', 'phaseDrawEnd', 'phaseUseEnd', 'phaseDiscardEnd', 'phaseJieshuEnd'],
        },
        filter: function (event, player) {
            return player.storage.txhj_zhuri_count - player.countCards('h') != 0 && !player.hasSkill('txhj_zhuri_rec');
        },
        content: function () {
            'step 0'
            player.chooseTarget(get.prompt('txhj_zhuri'), false, (card, player, target) => {
                return player.canCompare(target);
            }).set('ai', (target) => -get.attitude(target, _status.event.player));
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                event.target = target;
                player.logSkill('txhj_zhuri', target);
                player.chooseToCompare(target);
            }
            else event.finish();
            'step 2'
            if (result.bool) {
                var cards = [];
                game.getGlobalHistory('cardMove', evt => {
                    if (evt.getParent(3) == event) cards.addArray(evt.cards.filterInD('d'));
                });
                if (cards.length) {
                    event.cards = cards;
                }
                else event.finish();
            }
            else {
                player.chooseControl(['横置武将牌', '本回合失去逐日']).set('ai', () => {
                    if (_status.event.getParent('phaseDiscard')) return '本回合失去逐日';
                    if (_status.event.player.hp > 0) return '横置武将牌';
                    return '本回合失去逐日';
                });
            }
            'step 3'
            if (result && result.control) {
                if (result.control == '横置武将牌') player.link();
                else player.addTempSkill('txhj_zhuri_rec', 'phaseEnd');
                event.finish();
            }
            else {
                var cardsx = event.cards.filter(i => get.position(i, true) == 'd' && player.hasUseTarget(i));
                if (!cardsx.length) event.finish();
                else player.chooseButton(['请使用一张拼点牌', cardsx]).set('filterButton', button => {
                    return _status.event.player.hasUseTarget(button.link);
                })
            }
            'step 4'
            if (result.bool) {
                var card = result.links[0];
                player.chooseUseTarget(true, card, false);
            }
        },
        group: 'txhj_zhuri_act',
        subSkill: {
            rec: { charlotte: true },
            act: {
                forced: true,
                charlotte: true,
                popup: false,
                firstDo: true,
                trigger: {
                    player: ['phaseZhunbeiBegin', 'phaseJudgeBegin', 'phaseDrawBegin', 'phaseUseBegin', 'phaseDiscardBegin', 'phaseJieshuBegin'],
                },
                content: function () {
                    player.storage.txhj_zhuri_count = player.countCards('h');
                }
            }
        }
    },
    txhj_bingluan: {
        trigger: {
            player: "damageEnd",
        },
        filter: function (event, player) {
            return event.source && event.source.countCards('h');
        },
        forced: true,
        logTarget: "source",
        content: function () {
            'step 0'
            var num = Math.min(player.getDamagedHp(), trigger.source.countCards('he'));
            trigger.source.chooseToDiscard(num, 'he', true);
            'step 1'
            trigger.source.draw();
        },
        ai: {
            "maixie_defend": true,
        },
    },
    txhj_quanji: {
        audio: "requanji",
        trigger: { player: ['damageEnd', 'phaseUseEnd'] },
        frequent: true,
        locked: false,
        notemp: true,
        filter: function (event, player) {
            if (event.name == 'phaseUse') return player.countCards('e') < player.hp;
            return event.num > 0;
        },
        content: function () {
            "step 0"
            event.count = trigger.num || 1;
            "step 1"
            event.count--;
            player.draw(2);
            "step 2"
            if (player.countCards('h')) {
                player.chooseCard('将一张手牌置于武将牌上作为“权”', true);
            }
            else {
                event.goto(4);
            }
            "step 3"
            if (result.cards && result.cards.length) {
                player.addToExpansion(result.cards, player, 'give').gaintag.add('quanji');
            }
            "step 4"
            if (event.count > 0 && player.hasSkill('txhj_quanji')) {
                player.chooseBool(get.prompt2('txhj_quanji')).set('frequentSkill', 'txhj_quanji');
            }
            else event.finish();
            "step 5"
            if (result.bool) {
                player.logSkill('txhj_quanji');
                event.goto(1);
            }
        },
        mod: {
            maxHandcard: function (player, num) {
                return num + player.getExpansions('quanji').length;
            }
        },
        onremove: function (player, skill) {
            var cards = player.getExpansions('quanji');
            if (cards.length) player.loseToDiscardpile(cards);
        },
        ai: {
            maixie: true,
            maixie_hp: true,
            threaten: 0.8,
            effect: {
                target: function (card, player, target) {
                    if (get.tag(card, 'damage')) {
                        if (player.hasSkillTag('jueqing', false, target)) return [1, -2];
                        if (!target.hasFriend()) return;
                        if (target.hp >= 4) return [0.5, get.tag(card, 'damage') * 2];
                        if (!target.hasSkill('paiyi') && target.hp > 1) return [0.5, get.tag(card, 'damage') * 1.5];
                        if (target.hp == 3) return [0.5, get.tag(card, 'damage') * 1.5];
                        if (target.hp == 2) return [1, get.tag(card, 'damage') * 0.5];
                    }
                }
            }
        }
    },
    txhj_paiyi: {
        enable: 'phaseUse',
        usable: 2,
        audio: "paiyi",
        filter: function (event, player) {
            return player.getExpansions('quanji').length > 0;
        },
        chooseButton: {
            dialog: function (event, player) {
                return ui.create.dialog('排异', player.getExpansions('quanji'), 'hidden')
            },
            backup: function (links, player) {
                return {
                    audio: 'paiyi',
                    filterTarget: true,
                    filterCard: function () { return false },
                    selectCard: -1,
                    card: links[0],
                    delay: false,
                    content: lib.skill.txhj_paiyi.contentx,
                    ai: {
                        order: 10,
                        result: {
                            target: function (player, target) {
                                if (player != target) return 0;
                                if (player.hasSkill('txhj_quanji') || (player.countCards('h') + 2 <= player.hp + player.getExpansions('quanji').length)) return 1;
                                return 0;
                            }
                        },
                    },
                }
            },
            prompt: function () { return '请选择〖排异〗的目标' },
        },
        contentx: function () {
            "step 0"
            var card = lib.skill.txhj_paiyi_backup.card;
            player.loseToDiscardpile(card);
            "step 1"
            target.draw(2);
            "step 2"
            if (target.countCards('h') > player.countCards('h')) {
                target.damage(2);
            }
        },
        ai: {
            order: 1,
            combo: 'quanji',
            result: {
                player: 1,
            }
        }
    },
    mbdingzhou: {
        audio: "dingzhou",
        enable: 'phaseUse',
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (c) {
                return c != player && c.countCards('e') + c.countCards('j') + 1 <= player.countCards('hes') && c.countCards('e') + c.countCards('j') > 0;
            })
        },
        filterTarget: function (card, player, target) {
            return target != player && target.countCards('e') + target.countCards('j') + 1 <= player.countCards('hes') && target.countCards('e') + target.countCards('j') > 0;
        },
        selectTarget: 1,
        content: function () {
            'step 0'
            player.chooseCard('he', true, target.countCards('e') + target.countCards('j') + 1, '选择交给' + get.translation(target) + (target.countCards('e') + target.countCards('j') + 1) + '张牌');
            'step 1'
            player.give(result.cards, target);
            player.line(target, 'green');
            'step 2'
            player.gain(target.getCards('ej'), 'gain2');
            target.line(player, 'green');
        }
    },
    mbzhimeng: {
        audio: "zhimeng",
        trigger: { player: 'phaseEnd' },
        filter: function (event, player) {
            return player.countCards('h') || game.hasPlayer(function (c) {
                return c != player && c.countCards('h');
            });
        },
        direct: true,
        locked: false,
        content: function () {
            'step 0'
            player.chooseTarget('选择一名其他角色一起分配手牌', function (card, player, target) {
                if (!_status.event.player.countCards('h')) return target.countCards('h');
                return true;
            }).set('ai', function (target) {
                var player = _status.event.player;
                var eff = 0;
                if (target.countCards('h') >= player.countCards('h')) {
                    eff += 2;
                    if (get.attitude(player, target) <= 0) eff += 4;
                }
                return eff;
            });
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill('mbzhimeng', target);
                event.target = target;
                var alloc = (player.countCards('h') + event.target.countCards('h')) / 2;
                event.alloc1 = Math.ceil(alloc);
                event.alloc2 = Math.floor(alloc);
            }
            else event.finish();
            'step 2'
            event.cards = player.getCards('h').concat(event.target.getCards('h'));
            player.lose(player.getCards('h'), ui.ordering);
            event.target.lose(event.target.getCards('h'), ui.ordering);
            'step 3'
            var p1c = event.cards.randomGets(event.alloc1);
            var p2c = event.cards.filter(function (i) {
                return !p1c.includes(i);
            })
            player.gain(p1c);
            event.target.gain(p2c);
        }
    },
    txfenyan: {
        audio: 'fencheng',
        trigger: { player: 'useCardToPlayer' },
        forced: true,
        filter: function (event, player) {
            if (get.type2(event.card) != 'trick') return false;
            return event.isFirstTarget && event.targets.some(i => i != player);
        },
        content: function () {
            var target = trigger.targets.filter(i => i != player).randomGet();
            player.line(target, 'fire');
            target.damage('fire');
        },
        ai: {
            effect: {
                player: function (card, player, target) {
                    if (ui.selected.targets.length) return;
                    if (player != target && get.type2(card) == 'trick') return [1, 0, 1, -2];
                },
            },
        },
    },
    /*神武再世*/
    swtanyu: {
        trigger: { player: 'phaseDiscardBefore' },
        forced: true,
        content: function () {
            trigger.cancel();
        },
        group: 'swtanyu_hp',
        subSkill: {
            hp: {
                trigger: { player: 'phaseJieshuBegin' },
                forced: true,
                popup: false,
                filter: function (event, player) {
                    return player.isMaxHandcard();
                },
                content: function () {
                    player.loseHp();
                }
            }
        }
    },
    swcangmu: {
        trigger: { player: 'phaseDrawBegin' },
        forced: true,
        content: function () {
            trigger.num += game.countPlayer() - 2;
        }
    },
    swjicai: {
        trigger: { global: 'recoverAfter' },
        forced: true,
        logTarget: 'player',
        content: function () {
            if (trigger.player == player) {
                player.draw(2);
            }
            else {
                game.asyncDraw([player, trigger.player]);
            }
        }
    },
    swwuzang: {
        trigger: { player: 'phaseDrawBegin' },
        forced: true,
        content: function () {
            trigger.num += Math.max(5, Math.floor(player.hp / 2)) - 2;
        },
        mod: {
            maxHandcard: function (player, num) {
                return num - player.hp;
            }
        }
    },
    swxiangde: {
        trigger: { player: 'damageBegin3' },
        forced: true,
        filter: function (event, player) {
            return event.source && event.source.isIn() && event.source != player && event.source.getEquip(1);
        },
        content: function () {
            trigger.num++;
        }
    },
    swyinzei: {
        trigger: { player: 'damageEnd' },
        forced: true,
        logTarget: 'source',
        filter: function (event, player) {
            return event.source && event.source.isIn() && event.source != player && event.source.countCards('he') && !player.countCards('h');
        },
        content: function () {
            trigger.source.randomDiscard();
        }
    },
    //区分线
    //以下代码来源于【活动Boss】扩展，感谢“烟雨墨染”大佬的创作！
    shanhai_duomo: {
        init: function (player) {
            if (!player.storage.shanhai_duomo) player.storage.shanhai_duomo = [0, 0, 0];
        },
        mark: true,
        intro: {
            markcount: () => undefined,
            content: function (storage) {
                return '<li>准备阶段摸' + storage[0] + '张牌' +
                    '<br><li>使用【杀】的次数上限+' + storage[1] +
                    '<br><li>手牌上限+' + storage[2];
            },
        },
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + player.storage.shanhai_duomo[1];
            },
            maxHandcard: function (player, num) {
                return num + player.storage.shanhai_duomo[2];
            },
        },
        trigger: { global: 'logSkill', player: ['phaseZhunbeiBegin', 'phaseBegin'] },
        filter: function (event, player) {
            var summer = player.storage.shanhai_duomo[0] + player.storage.shanhai_duomo[1] + player.storage.shanhai_duomo[2];
            if (summer >= 15 && event.name != 'phaseZhunbei') return false;
            if (event.name == 'phase') return true;
            if (event.name == 'phaseZhunbei') return player.storage.shanhai_duomo[0] > 0;
            return event.skill == 'shanhai_sixie' && event.player != player;
        },
        forced: true,
        content: function () {
            if (trigger.name == 'phaseZhunbei') {
                player.draw(player.storage.shanhai_duomo[0]);
                event.finish();
                return;
            }
            var summer = player.storage.shanhai_duomo[0] + player.storage.shanhai_duomo[1] + player.storage.shanhai_duomo[2];
            player.storage.shanhai_duomo[summer % 3]++;
        },
    },
    shanhai_meihuo: {
        enable: 'phaseUse',
        usable: 1,
        filterTarget: function (card, player, target) {
            return player.canCompare(target);
        },
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        content: function () {
            "step 0"
            player.chooseToCompare(target);
            "step 1"
            if (result.bool) {
                player.storage[event.name] = target;
                player.addTempSkill(event.name + 2);
            }
            else {
                player.addTempSkill(event.name + 3);
            }
        },
        ai: {
            order: function (name, player) {
                var cards = player.getCards('h');
                if (player.countCards('h', 'sha') == 0) {
                    return 1;
                }
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].name != 'sha' && get.number(cards[i]) > 11 && get.value(cards[i]) < 7) {
                        return 9;
                    }
                }
                return get.order({ name: 'sha' }) - 1;
            },
            result: {
                player: function (player) {
                    if (player.countCards('h', 'sha') > 0) return 0;
                    var num = player.countCards('h');
                    if (num > player.hp) return 0;
                    if (num == 1) return -2;
                    if (num == 2) return -1;
                    return -0.7;
                },
                target: function (player, target) {
                    var num = target.countCards('h');
                    if (num == 1) return -1;
                    if (num == 2) return -0.7;
                    return -0.5
                },
            },
            threaten: 1.3
        }
    },
    shanhai_meihuo2: {
        locked: true,
        charlotte: true,
        mod: {
            targetInRange: function (card, player, target) {
                if (target == player.storage.shanhai_meihuo) return true;
            },
            cardUsableTarget: function (card, player, target) {
                if (target == player.storage.shanhai_meihuo) return true;
            },
        },
        ai: {
            unequip: true,
            skillTagFilter: function (player, tag, arg) {
                if (arg.target != player.storage.shanhai_meihuo) return false;
            },
            effect: {
                player: function (card, player, target, current, isLink) {
                    if (isLink || !player.storage.shanhai_meihuo) return;
                    if (target != player.storage.shanhai_meihuo && ['sha', 'guohe', 'shunshou', 'huogong', 'juedou'].includes(card.name)) {
                        if (get.effect(player.storage.shanhai_meihuo, card, player, player) > 0) {
                            return [1, 2];
                        }
                    }
                }
            }
        },
    },
    shanhai_meihuo3: {
        locked: true,
        charlotte: true,
        mod: {
            cardEnabled: function (card) {
                if (card.name == 'sha') return false;
            },
            ignoredHandcard: function (card, player) {
                if (get.name(card) == 'sha') {
                    return true;
                }
            },
            cardDiscardable: function (card, player, name) {
                if (name == 'phaseDiscard' && get.name(card) == 'sha') {
                    return false;
                }
            },
        },
    },
    shanhai_qinyun: {
        mod: {
            aiValue: function (player, card, num) {
                if (get.name(card) != 'tao' && get.color(card) != 'red') return;
                var cards = player.getCards('hs', function (card) {
                    return get.name(card) == 'tao' || get.color(card) == 'red';
                });
                cards.sort(function (a, b) {
                    return (get.name(a) == 'tao' ? 1 : 2) - (get.name(b) == 'tao' ? 1 : 2);
                });
                var geti = function () {
                    if (cards.includes(card)) {
                        return cards.indexOf(card);
                    }
                    return cards.length;
                };
                return Math.max(num, [6.5, 4, 3, 2][Math.min(geti(), 2)]);
            },
            aiUseful: function () {
                return lib.skill.kanpo.mod.aiValue.apply(this, arguments);
            },
        },
        locked: false,
        enable: 'chooseToUse',
        viewAsFilter: function (player) {
            return player != _status.currentPhase && player.countCards('hes', { color: 'red' }) > 0;
        },
        filterCard: function (card) {
            return get.color(card) == 'red';
        },
        position: 'hes',
        viewAs: { name: 'tao' },
        prompt: '将一张红色牌当【桃】使用',
        check: function (card) { return 15 - get.value(card) },
        ai: {
            threaten: 1.5,
        }
    },
    shanhai_duanwei: {
        trigger: { player: 'phaseJudgeBegin' },
        filter: function (event, player) {
            return player.countCards('j') && player.countCards('h') > 1;
        },
        direct: true,
        content: function () {
            'step 0'
            player.chooseToDiscard('h', 2, get.prompt2('shanhai_duanwei')).set('ai', function (card) {
                return 6 - get.value(card)
            }).logSkill = 'shanhai_duanwei';
            'step 1'
            if (result.bool) {
                player.discardPlayerCard(1, player, 'j', true);
            }
        },
    },
    "wenhe_tianmu": {
        group: "wenhe_tianmu_weimu",
        trigger: {
            player: "useCardToPlayered",
            target: "useCardToTargeted",
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        filter: function (event, player) {
            return event.card.name == 'sha' && get.color(event.card) == 'black';
        },
        content: function () {
            player.draw();
        },
        mod: {
            aiOrder: function (player, card, num) {
                if (player.hasSkill("wenhe_niluan")) return;
                if (card && card.name == 'sha' && get.color(card) == 'black') return num + 0.15;
            },
        },
        subSkill: {
            weimu: {
                trigger: {
                    global: "useCard",
                },
                forced: true,
                firstDo: true,
                audio: "wenhe_tianmu",
                filter: function (event, player, card) {
                    if (get.color(event.card) != 'black') return false;
                    return event.card.name == 'nanman' && event.player != player || event.card.name == 'wanjian' && event.player != player || event.card.name == 'taoyuan' && player.hp < player.maxHp || event.card.name == 'wugu';
                },
                content: function () { },
                mod: {
                    targetEnabled: function (card) {
                        if ((get.type(card) == 'trick' || get.type(card) == 'delay') && get.color(card) == 'black') return false;
                    },
                },
                sub: true,
            },
        },
        ai: {
            effect: {
                target: function (card, player, target) {
                    if (card.name == 'sha' && get.color(card) == 'black') return [1, 0.6];
                },
                player: function (card, player, target) {
                    if (card.name == 'sha' && get.color(card) == 'black') return [1, 1];
                },
            }
        }
    },
    shanhe_cuanchao: {
        group: ["shanhe_cuanchao_basic", "shanhe_cuanchao_trick"],
        mark: true,
        locked: false,
        zhuanhuanji: true,
        marktext: '☯',
        intro: {
            content: function (storage, player, skill) {
                var str = player.storage.shanhe_cuanchao ? '当你成为锦囊牌的目标后，你可令此牌对你无效' : '当你成为基本牌的目标后，你可令此牌对你无效';
                return str;
            },
        },
        subSkill: {
            basic: {
                trigger: {
                    target: "useCardToTargeted",
                },
                filter: function (event, player) {
                    return !player.storage.shanhe_cuanchao && get.type(event.card) == 'basic' && !event.getParent().excluded.includes(player);
                },
                check: function (event, player) {
                    return (get.effect(player, event.card, event.player, event.player) > 0 && get.attitude(player, event.player) <= 0) || (get.effect(player, event.card, event.player, event.player) < 0 && get.attitude(player, event.player) > 0);
                },
                prompt2: function (event, player) {
                    return '是否令' + get.translation(event.card) + '对你无效？'
                },
                content: function () {
                    trigger.getParent().excluded.add(player);
                    game.log(trigger.card, '对', player, '无效');
                    player.changeZhuanhuanji('shanhe_cuanchao');
                },
            },
            trick: {
                trigger: {
                    target: "useCardToTargeted",
                },
                filter: function (event, player) {
                    return player.storage.shanhe_cuanchao && get.type2(event.card) == 'trick' && !event.getParent().excluded.includes(player);
                },
                check: function (event, player) {
                    return (get.effect(player, event.card, event.player, event.player) > 0 && get.attitude(player, event.player) <= 0) || (get.effect(player, event.card, event.player, event.player) < 0 && get.attitude(player, event.player) > 0);
                },
                prompt2: function (event, player) {
                    return '是否令' + get.translation(event.card) + '对你无效？'
                },
                content: function () {
                    trigger.getParent().excluded.add(player);
                    game.log(trigger.card, '对', player, '无效');
                    player.changeZhuanhuanji('shanhe_cuanchao');
                },
            },
        },
    },
    shanhe_baoli: {
        trigger: {
            source: "damageBegin1",
        },
        forced: true,
        content: function () {
            trigger.num++;
        },
        ai: {
            damageBonus: true,
        },
    },
    //官方技能补充
    wjmianyao: {
        audio: "dcmianyao",
        trigger: {
            player: 'phaseDrawEnd',
        },
        direct: true,
        filter: function (event, player) {
            return player.countCards('h') > 0;
        },
        content: function () {
            'step 0'
            player.chooseCard('h', get.prompt('wjmianyao'), '展示点数最小的一张牌并随机插入牌堆中，然后于回合结束时摸此牌点数张牌。', function (card, player) {
                var num = get.number(card, player);
                return !player.hasCard(card2 => {
                    return card != card2 && get.number(card2, player) < num;
                });
            }).set('ai', card => {
                var player = _status.event.player;
                var value = player.getUseValue(card, null, true);
                if (value > 5 && get.number(card) <= 2) return 0;
                return 1 + 1 / Math.max(0.1, value);
            });
            'step 1'
            if (result.bool) {
                player.logSkill('wjmianyao');
                var card = result.cards[0];
                event.card = card;
                player.showCards([card], get.translation(player) + '发动了【免徭】');
            }
            else event.finish();
            'step 2'
            player.$throw(1, 1000);
            player.lose(card, ui.cardPile).insert_index = function () {
                return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
            }
            player.addTempSkill('wjmianyao_draw');
            var num = get.number(card);
            if (num > 0) player.addMark('wjmianyao_draw', num, false);
        },
        subSkill: {
            draw: {
                trigger: {
                    player: 'phaseEnd',
                },
                filter: function (event, player) {
                    return player.hasMark('wjmianyao_draw');
                },
                forced: true,
                charlotte: true,
                onremove: true,
                content: function () {
                    player.draw(player.countMark('wjmianyao_draw'));
                },
            }
        }
    },
    scliantao: {
        audio: "olliantao",
        trigger: { player: 'phaseUseBegin' },
        check: function (event, player) {
            return player.countCards('h') > 2 && game.hasPlayer((c) => {
                return get.attitude(c, player) < 0 && get.damageEffect(c, player, player) > 0 && player.canUse('juedou', c);
            })
        },
        direct: true,
        content: function () {
            'step 0'
            player.chooseTarget('选择一名角色和他连续【决斗】', 1, lib.filter.notMe).set('ai', (target) => {
                return -get.attitude(_status.event.player, target);
            });
            'step 1'
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill('scliantao', target);
                event.target = target;
                _status.liantaoTarget = target;
                target.chooseControl(['红色', '黑色']).set('prompt', '选择一种花色');
            }
            else event.finish();
            'step 2'
            event.color = (result.control == '红色') ? 'red' : 'black';
            game.log(event.target, '选择了', '#y' + event.color);
            'step 3'
            if (player.countCards('h', card => get.color(card) == event.color) == 0 || player.hasSkill('scliantao_f')) event.goto(5);
            else player.chooseCard('h', '选择一张牌当作【决斗】', true, function (card, player) {
                return get.color(card) == event.color;
            })
            'step 4'
            if (result.bool) {
                player.useCard(get.autoViewAs({ name: 'juedou' }, result.cards), result.cards, event.target);
                event.goto(3);
            }
            'step 5'
            var h = player.getHistory('sourceDamage', e => {
                return e.card && e.card.name == 'juedou' && e.getParent('scliantao');
            })
            var c = h.length;
            if (c > 0) player.draw(c);
            else {
                if (player.getHistory('damage', e => {
                    return e.card && e.card.name == 'juedou' && e.getParent('scliantao');
                }).length == 0) {
                    player.draw(3);
                    player.addTempSkill('scliantao_b', 'phaseEnd');
                }
            }
            delete _status.liantaoTarget;
        },
        group: 'scliantao_d',
        subSkill: {
            d: {
                direct: true,
                charlotte: true,
                trigger: { global: 'dying' },
                filter: function (event, player) {
                    return player.isPhaseUsing() && _status.liantaoTarget && (event.player == player || event.player == _status.liantaoTarget);
                },
                content: function () {
                    player.addTempSkill('scliantao_f', 'phaseUseEnd');
                }
            },
            b: {
                mod: {
                    maxHandcard: function (player, num) {
                        return num + 3;
                    },
                    cardUsable: function (card, player, num) {
                        if (card.name == 'sha') return false;
                    },
                },
                onremove: true,
            },
            f: { charlotte: true }
        }
    },
    gdxiongsuan: {
        limited: true,
        enable: 'phaseUse',
        filterCard: true,
        filter: function (event, player) {
            return player.countCards('h');
        },
        check: function (card) {
            return 7 - get.value(card);
        },
        filterTarget: true,
        content: function () {
            'step 0'
            player.awakenSkill('gdxiongsuan');
            target.damage('nocard');
            'step 1'
            player.draw(3);
            var list = [];
            var skills = target.getOriginalSkills();
            for (var i = 0; i < skills.length; i++) {
                if (lib.skill[skills[i]].limited && target.awakenedSkills.includes(skills[i])) {
                    list.push(skills[i]);
                }
            }
            if (list.length == 1) {
                target.storage.gdxiongsuan_restore = list[0];
                target.addTempSkill('gdxiongsuan_restore', 'phaseZhunbeiBegin');
                event.finish();
            }
            else if (list.length > 1) {
                player.chooseControl(list).set('prompt', '选择一个限定技在回合结束后重置之');
            }
            else {
                event.finish();
            }
            'step 2'
            target.storage.gdxiongsuan_restore = result.control;
            target.addTempSkill('gdxiongsuan_restore', 'phaseZhunbeiBegin');
        },
        subSkill: {
            restore: {
                trigger: { global: 'phaseAfter' },
                silent: true,
                content: function () {
                    player.restoreSkill(player.storage.gdxiongsuan_restore);
                }
            }
        },
        ai: {
            order: 4,
            damage: true,
            result: {
                target: function (player, target) {
                    if (target.hp > 1) {
                        var skills = target.getOriginalSkills();
                        for (var i = 0; i < skills.length; i++) {
                            if (lib.skill[skills[i]].limited && target.awakenedSkills.includes(skills[i])) {
                                return 8;
                            }
                        }
                    }
                    if (target != player) return 0;
                    if (get.damageEffect(target, player, player) >= 0) return 10;
                    if (target.hp >= 4) return 5;
                    if (target.hp == 3) {
                        if (player.countCards('h') <= 2 && game.hasPlayer(function (current) {
                            return current.hp <= 1 && get.attitude(player, current) < 0;
                        })) {
                            return 3;
                        }
                    }
                    return 0;
                }
            }
        }
    },
    mbshichou: {
        audio: "ol_shichou",
        trigger: {
            player: "useCard2",
        },
        direct: true,
        filter: function (event, player) {
            return event.card && event.card.name == 'sha';//&&player.isDamaged();
        },
        content: function () {
            'step 0'
            var num = Math.max(1, player.getDamagedHp());
            player.chooseTarget('是否发动【誓仇】，令至多' + num + '名其他角色也成为此【杀】的目标？', [1, num], function (card, player, target) {
                return target != player && !trigger.targets.includes(target) && player.canUse({ name: 'sha' }, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'sha' }, _status.event.player);
            };
            'step 1'
            if (result.bool && result.targets && result.targets.length) {
                var targets = result.targets;
                player.logSkill('mbshichou', targets);
                player.line(targets, trigger.card.nature);
                trigger.targets.addArray(targets);
            }
        },
    },
    old_shanxie: {
        audio: "shanxie",
        enable: 'phaseUse',
        usable: 1,
        filterTarget: function (card, player, target) {
            return target != player && target.getEquip(1);
        },
        selectTarget: [0, 1],
        content: function () {
            'step 0'
            if (!target) {
                var card = get.cardPile2(function (card) {
                    return get.subtype(card) == 'equip1';
                });
                if (card) player.gain(card, 'gain2');
                event.finish();
            }
            else {
                var card = target.getEquip(1);
                if (card) {
                    event.card = card;
                    player.gain(card, target, 'give');
                }
                else event.finish();
            }
            'step 1'
            if (player.getCards('h').includes(card) && get.type(card, player) == 'equip' && player.hasUseTarget(card)) player.chooseUseTarget(card, true, 'nopopup');
            'step 2'
            var hs = target.getCards('h', function (card) {
                return target.canUse(get.autoViewAs({ name: 'sha' }, [card]), player, false);
            });
            if (hs.length) {
                if (hs.length == 1) event._result = { bool: true, cards: hs };
                else target.chooseCard('h', true, '将一张牌当做【杀】对' + get.translation(player) + '使用', function (card) {
                    return _status.event.cards.includes(card);
                }).set('cards', hs).set('ai', function (card) {
                    return get.effect(_status.event.getParent().player, get.autoViewAs({ name: 'sha', }, [card]), _status.event.player)
                })
            }
            else event.finish();
            'step 3'
            if (result.bool) target.useCard({ name: 'sha' }, result.cards, player, false);
        },
        ai: {
            order: 9,
            result: { player: 1 },
        },
        group: 'old_shanxie_exclude',
        subSkill: {
            exclude: {
                trigger: { global: 'useCard' },
                forced: true,
                locked: false,
                filter: function (event, player) {
                    if (event.card.name != 'shan' || event.getParent(2).player != player) return false;
                    var num = get.number(event.card);
                    return !num || num <= player.getAttackRange() * 2;
                },
                logTarget: 'player',
                content: function () {
                    trigger.all_excluded = true;
                },
            },
        },
    },
    mbshicai: {
        audio: 'nzry_shicai',
        subSkill: {
            "2": {
                audio: "nzry_shicai",
                sub: true,
            },
        },
        trigger: {
            player: "useCardAfter",
        },
        filter: function (event, player) {
            if (get.type(event.card) == 'delay') return false;
            if (get.type(event.card) != 'equip' && event.cards.filterInD().length <= 0) return false;
            if (get.type(event.card) == 'equip' && player.countCards('e', function (card) {
                return card = event.card;
            }) <= 0) return false;
            var history = player.getHistory('useCard');
            var evt = event;
            for (var i = 0; i < history.length; i++) {
                if (history[i] != evt && get.type2(history[i].card) == get.type2(event.card)) return false;
                else if (history[i] == evt) return true;
            }
            return false;
        },
        check: function (event, player) {
            if (get.type(event.card) == 'equip') {
                if (get.subtype(event.card) == 'equip6') return true;
                if (get.effect(event.targets[0], event.card, player, player) <= 0) return true;
                var eff1 = player.getUseValue(event.card);
                var subtype = get.subtype(event.card);
                return player.countCards('h', function (card) {
                    return get.subtype(card) == subtype && player.getUseValue(card) >= eff1;
                }) > 0;
            }
            return true;
        },
        prompt: function (event, player) {
            return get.prompt('mbshicai') + '（将' + get.translation(event.cards.filterInD().addArray(event.cards.filter(function (card) {
                return get.position(card) == 'e' && !event.cards.filterInD().includes(card);
            }))) + '置于牌堆顶）';
        },
        content: function () {
            'step 0'
            if (get.type(trigger.card) == 'equip') {
                player.lose(trigger.cards, ui.cardPile, 'insert');
                game.log(player, '将', trigger.cards, '置于了牌堆顶');
                event.goto(2);
            }
            else {
                event.cards = trigger.cards.filterInD();
                if (event.cards.length > 1) {
                    var next = player.chooseToMove('恃才：将牌按顺序置于牌堆顶');
                    next.set('list', [['牌堆顶', event.cards]]);
                    next.set('reverse', ((_status.currentPhase && _status.currentPhase.next) ? get.attitude(player, _status.currentPhase.next) > 0 : false));
                    next.set('processAI', function (list) {
                        var cards = list[0][1].slice(0);
                        cards.sort(function (a, b) {
                            return (_status.event.reverse ? 1 : -1) * (get.value(b) - get.value(a));
                        });
                        return [cards];
                    });
                }
            }
            'step 1'
            if (result.bool && result.moved && result.moved[0].length) cards = result.moved[0].slice(0);
            while (cards.length) {
                var card = cards.pop();
                if (get.position(card, true) == 'o') {
                    card.fix();
                    ui.cardPile.insertBefore(card, ui.cardPile.firstChild);
                    game.log(player, '将', card, '置于了牌堆顶');
                }
            }
            'step 2'
            game.updateRoundNumber();
            player.draw();
        },
        ai: {
            threaten: 1.8,
            reverseOrder: true,
            skillTagFilter: function (player) {
                if (player.getHistory('useCard', function (evt) {
                    return get.type(evt.card) == 'equip';
                }).length > 0) return false;
            },
            effect: {
                target: function (card, player, target) {
                    if (player == target && get.type(card) == 'equip' && !player.getHistory('useCard', function (evt) {
                        return get.type(evt.card) == 'equip'
                    }).length == 0) return [1, 3];
                },
            },
        },
    },
    spzhouxian: {
        audio: "zhouxian",
        trigger: { target: 'useCardToTargeted' },
        filter: function (event, player) {
            return event.player != player && get.tag(event.card, 'damage');
        },
        forced: true,
        content: function () {
            'step 0'
            var cards = get.cards(3);
            for (var i = cards.length; i--; i >= 0) {
                ui.cardPile.insertBefore(cards[i], ui.cardPile.firstChild);
            }
            game.updateRoundNumber();
            event.cards = cards;
            player.showCards(cards, get.translation(player) + '发动了【州贤】');
            'step 1'
            event.target = trigger.player;
            trigger.player.chooseToDiscard('he', '州贤：弃置一张其中有的类别的牌，或令此牌对' + get.translation(player) + '无效', (card, player) => {
                return _status.event.cards.some(cardx => get.type2(cardx) == get.type2(card));
            }).set('cards', event.cards).set('ai', card => {
                if (get.attitude(_status.event.player, _status.event.getParent().player) > 0) return 0;
                return 7.5 - get.value(card);
            });
            'step 2'
            if (!result.bool) trigger.getParent().excluded.add(player);
        },
    },
    'txhj_oldhuxiao': {
        shaRelated: true,
        audio: 'huxiao',
        trigger: { player: 'shaMiss' },
        forced: true,
        content: function () {
            if (player.stat[player.stat.length - 1].card.sha > 0) {
                player.stat[player.stat.length - 1].card.sha--;
            }
        }
    },
    //--------------------------------------//

    'txhj_jlsgsy_meihuo': {//搬运自极略扩展
        trigger: {
            player: "phaseUseBegin",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        priority: 1,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.hasCard(function (card) {
                    return get.tag(card, "damage");
                }) && current.isEnemiesOf(player);
            });
        },
        content: async function (event, trigger, player) {
            let target = game.filterPlayer(function (current) {
                return current.hasCard(function (card) {
                    return get.tag(card, "damage");
                }) && current.isEnemiesOf(player);
            }).randomGet();
            let target2 = game.filterPlayer(function (current) {
                return current.isEnemiesOf(player) && current != target;
            }).randomGet();
            if (!target2) return;
            let cards = target.getCards("h", card => get.tag(card, "damage"));
            while (cards.length) {
                let card = cards.shift();
                if (target.canUse(card, target2, false, false)) {
                    target.useCard(card, target2, false);
                } else {
                    break;
                }
            }
            //game.log(player, '触发了【魅惑】');
            player.buffUpdate(event.name);
        },
    },
    'txhj_jlsgsy_yaoyan': {//搬运自极略扩展
        trigger: {
            target: "useCardToTarget",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        priority: 1,
        filter: function (event, player) {
            return event.player != player && ['basic', 'trick'].includes(get.type(event.card))
                && !event.targets.includes(event.player);
        },
        logTarget: "player",
        content() {
            "step 0"
            player.logSkill(event.name, trigger.player);
            trigger.getParent().targets.push(trigger.player);
            trigger.getParent().triggeredTargets2.push(trigger.player);
            if (Math.random() < 0.5) {
                trigger.getParent().targets.remove(player);
                trigger.getParent().triggeredTargets2.remove(player);
                game.log(player, "从", trigger.card, "的目标中移除了");
            }
            game.delayx();
            "step 1"
            //game.log(player, '触发了【妖颜】');
            game.log(trigger.player, "成为", trigger.card, "的额外目标");
            player.buffUpdate(event.name);
        },
    },
    'txhj_jlsgsy_miluan': {//搬运自极略扩展
        trigger: { player: "damageEnd" },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        priority: 1,
        filter(event, player) {
            return game.filterPlayer(p => p != player).some(p => p.countCards('h'));
        },
        content() {
            'step 0'
            event.targets = game.filterPlayer(p => p != player);
            'step 1'
            if (event.targets.length) {
                var target = event.targets.shift();
                let cards = target.getCards('h');
                if (!cards.length) {
                    event.redo();
                    return;
                }
                player.gain(target, cards, 'bySelf');
                target.$give(cards.length, player);
                game.delayx(0.3);
                if (event.targets.length) {
                    event.redo();
                }
            }
            'step 2'
            let cnt = Math.floor(player.countCards('h') / 2);
            player.chooseCard(cnt, true);
            'step 3'
            if (!result.bool) {
                event.finish();
                return;
            }
            let dis = [];
            let len = game.filterPlayer(p => p != player).length;
            let base = Math.floor(result.cards.length / len);
            let i = 0, iMax = result.cards.length % len;
            for (; i != iMax; ++i) {
                dis.push(result.cards.randomRemove(base + 1));
            }
            while (dis.length < len) {
                dis.push(result.cards.randomRemove(base));
            }
            dis.randomSort();
            event.dis = dis;
            event.targets = game.filterPlayer(p => p != player).sortBySeat();
            'step 4'
            if (!event.targets.length) {
                event.finish();
                return;
            }
            {
                let target = event.targets.shift();
                let cards = event.dis.shift();
                target.gain(cards, player);
                player.$giveAuto(cards, target);
                // game.delayx(0.3);
                event.redo();
            }
            //game.log(player, '触发了【迷乱】');
            player.buffUpdate(event.name);
        },
    },
    'txhj_dctaji': {
        // audio: 'ext:太虚幻境/audio/skill:2',
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        forced: true,
        locked: false,
        charlotte: true,
        popup: false,
        filter: function (event, player) {
            var evt = event.getl(player);
            return evt && evt.hs && evt.hs.length;
        },
        content: function () {
            "step 0";
            var evt = trigger.getParent();
            var effects = [
                ["useCard",
                    function () {
                        var targets = player.getEnemies().filter(p => {
                            return p.countCards('he') > 0;
                        }).randomGet();
                        if (targets) targets.randomDiscard();
                    },
                ],
                ["respond", function () {
                    player.draw();
                },
                ],
                ["discard", function () {
                    player.recover();
                },],
                ["other", function () {
                    player.addSkill("txhj_dctaji_damage");
                    player.addMark("txhj_dctaji_damage", 1, false);
                    game.log(player, "下一次对其他角色造成的伤害", "#g+1");
                },],
            ];
            var name = evt.name;
            if (trigger.name == "loseAsync") name = evt.type;
            var list = ["useCard", "respond", "discard", "other"];
            if (!list.includes(name)) name = "other";
            var num = player.countMark("txhj_dchuiling") > 4 ? 2 : 1;
            for (var i = 0; i < num; i++) {
                if (!list.length) break;
                if (!list.includes(name)) name = list.randomRemove(1)[0];
                if (name == "useCard") list.remove("useCard");
                for (var effect of effects) {
                    if (effect[0] == name) {
                        list.remove(name);
                        var next = game.createEvent("txhj_dctaji_" + name);
                        next.player = player;
                        next.setContent(effect[1]);
                        break;
                    }
                }
            }
            //game.log(player, '触发了【踏寂】');
            player.buffUpdate(event.name);
        },
        subSkill: {
            damage: {
                trigger: {
                    source: "damageBegin1",
                },
                forced: true,
                charlotte: true,
                onremove: true,
                popup: false,
                filter: function (event, player) {
                    return event.player != player && event.notLink();
                },
                content: function () {
                    trigger.num += player.countMark("txhj_dctaji_damage");

                    player.removeSkill("txhj_dctaji_damage");
                },
                intro: {
                    content: "下次对其他角色造成伤害时，此伤害+#",
                },
                sub: true,
                sourceSkill: "txhj_dctaji",
                "_priority": 0,
            },
        },
        "_priority": 11,
    },
    'txhj_shhlianhua': {
        //  audio: 'ext:太虚幻境/audio/skill:2',
        trigger: {
            target: "useCardToTargeted",
        },
        forced: true,
        locked: false,
        charlotte: true,
        popup: false,
        filter: event => event.card.name == "sha",
        content: function () {
            "step 0";
            player.draw();
            //game.log(player, '触发了【莲华】');
            player.buffUpdate(event.name);
            "step 1";
            var eff = get.effect(player, trigger.card, trigger.player, trigger.player);
            trigger.player.chooseToDiscard("he", "弃置一张牌，或令" + get.translation(trigger.card) + "对" + get.translation(player) + "无效")
                .set("ai", function (card) {
                    if (_status.event.eff > 0) {
                        return 10 - get.value(card);
                    }
                    return 0;
                }).set("eff", eff);
            "step 2";
            if (result.bool == false) {
                trigger.getParent().excluded.add(player);
            }
        },
        ai: {
            effect: {
                target_use(card, player, target, current) {
                    if (card.name == "sha" && current < 0) return 0.7;
                },
            },
        },
        "_priority": 9,
    },
    'txhj_dchuiling': {
        trigger: {
            player: "useCard",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function () {
            return ui.discardPile.childNodes.length > 0;
        },
        onremove: true,
        mark: true,
        marktext: "灵",
        intro: {
            "name2": "灵",
            mark: function (dialog, storage, player) {
                dialog.addText("共有" + (storage || 0) + "个标记");
                dialog.addText("注：图标的颜色代表弃牌堆中较多的颜色");
            },
        },
        global: ["txhj_dchuiling_hint", "txhj_dchuiling_draw"],
        content: function () {
            "step 0";
            var mark = false;
            var red = 0,
                black = 0;
            for (var i = 0; i < ui.discardPile.childNodes.length; i++) {
                var color = get.color(ui.discardPile.childNodes[i]);
                if (color == "red") red++;
                if (color == "black") black++;
            }
            if (red == black) event.finish();
            else if (red > black) {
                player.recover();
                if (get.color(trigger.card) == "black") mark = true;
            } else {
                if (!event.isMine() && !event.isOnline()) game.delayx();
                var targets = player.getEnemies().filter(p => {
                    return p.countCards('he') > 0;
                }).randomGet();
                if (targets) targets.randomDiscard();
                if (get.color(trigger.card) == "red") mark = true;
            }
            if (mark) {
                player.addMark("txhj_dchuiling", 1);
            }
            "step 1";
            if (player.countMark("txhj_dchuiling") >= 8) {
                player.gainMaxHp();
                player.draw(2);
                player.addMark("txhj_dchuiling_draw", 1);
                player.removeMark("txhj_dchuiling", 4);
            }
        },
        subSkill: {
            hint: {
                trigger: {
                    global: ["loseAfter", "loseAsyncAfter", "cardsDiscardAfter", "equipAfter"],
                },
                forced: true,
                popup: false,
                lastDo: true,
                forceDie: true,
                forceOut: true,
                charlotte: true,
                filter: function (event, player) {
                    if (event._txhj_dchuiling_checked) return false;
                    event._txhj_dchuiling_checked = true;
                    var cards = event.getd();
                    if (!cards.filterInD("d").length) return false;
                    return true;
                },
                markColor: [["rgba(241, 42, 42, 0.75)", "black"], ["", ""], ["rgba(18, 4, 4, 0.75)", "rgb(200, 200, 200)"]],
                content: function () {
                    "step 0";
                    var red = 0,
                        black = 0;
                    for (var i = 0; i < ui.discardPile.childNodes.length; i++) {
                        var color = get.color(ui.discardPile.childNodes[i]);
                        if (color == "red") red++;
                        if (color == "black") black++;
                    }
                    if (trigger.name.indexOf("lose") == 0) {
                        var cards = trigger.getd().filterInD("d");
                        for (var i = 0; i < cards.length; i++) {
                            var color = get.color(cards[i]);
                            if (color == "red") red++;
                            if (color == "black") black++;
                        }
                    }
                    game.broadcastAll(function (ind) {
                        var bgColor = lib.skill.txhj_dchuiling_hint.markColor[ind][0],
                            text = '<span style="color: ' + lib.skill.txhj_dchuiling_hint.markColor[ind][1] + '">灵</span>';
                        for (var player of game.players) {
                            if (player.marks.txhj_dchuiling) {
                                player.marks.txhj_dchuiling.firstChild.style.backgroundColor = bgColor;
                                player.marks.txhj_dchuiling.firstChild.innerHTML = text;
                            }
                        }
                    }, Math.sign(black - red) + 1);
                },
                sub: true,
                sourceSkill: "txhj_dchuiling",
                "_priority": 0,
            },
            draw: {
                trigger: {
                    player: "phaseDrawBegin",
                },
                forced: true,
                popup: false,
                charlotte: true,
                onremove: true,
                mark: true,
                marktext: "力",
                intro: {
                    "name2": "力",
                    mark: function (dialog, storage, player) {
                        dialog.addText("摸牌阶段摸牌数" + (storage || 0));
                    },
                },
                filter: function (event, player) {
                    if (player.countMark('txhj_dchuiling_draw') > 0) return true;
                    return false;
                },
                content: function () {
                    trigger.num += player.countMark('txhj_dchuiling_draw');
                },
            },
        },
        mod: {
            aiOrder: function (player, card, num) {
                if (get.itemtype(card) != "card") return;
                var len = ui.discardPile.childNodes.length;
                if (!len) {
                    var type = get.type(card);
                    if (type == "basic" || type == "trick") {
                        if (player.getDamagedHp() > 0) {
                            return num + (get.color(card) == "red" ? 15 : 10);
                        }
                        return num + 10;
                    }
                    return;
                }
                if (len > 40) return;
                var red = 0,
                    black = 0;
                for (var i = 0; i < ui.discardPile.childNodes.length; i++) {
                    var color = get.color(ui.discardPile.childNodes[i]);
                    if (color == "red") red++;
                    if (color == "black") black++;
                }
                if (red == black) {
                    var type = get.type(card);
                    if (type == "basic" || type == "trick") {
                        if (player.getDamagedHp() > 0) {
                            return num + (get.color(card) == "red" ? 15 : 10);
                        }
                        return num + 10;
                    }
                    return;
                } else {
                    var color = get.color(card);
                    if ((color == "red" && red < black) || (color == "black" && red > black)) return num + 10;
                }
            },
        },
        "_priority": 10,
    },
    txhj_buff_shenxian: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: {
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        usable: 1,
        filter: function (event, player) {
            if (event.type != "discard" || _status.currentPhase == player || event.getlx === false) return false;
            if (event.name == "lose" && event.player == player) return false;
            var cards = event.cards.slice(0);
            var evt = event.getl(player);
            if (evt && evt.cards) cards.removeArray(evt.cards);
            for (var i = 0; i < cards.length; i++) {
                if (get.type(cards[i], null, event.hs && event.hs.includes(cards[i]) ? event.player : false) == "basic" && cards[i].original != "j") {
                    return true;
                }
            }
            return false;
        },
        content: function () {
            if (player.countCards('h') < Math.min(player.maxHp, 20)) {
                player.drawTo(Math.min(player.maxHp, 20));
            } else {
                player.gainMaxHp(trigger.cards.filter(p => get.type(p) == "basic").length);
            }
            //game.log(player, '触发了【甚贤】');
            player.buffUpdate(event.name);
        },
    },
    txhj_buff_qiangwu: {
        audio: 'ext:太虚幻境/audio/skill:2',
        trigger: {
            player: "phaseUseBegin",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        content: async function (event, trigger, player) {
          const result = await player.judge(card => {
                if (game.hasPlayer(cur => {
                    return get.event().player.canUse("sha", cur);
                }))
                    return get.number(card);
                return 1 / get.number(card);
            }).forResult();
            player.storage.txhj_buff_qiangwu = result.number;
            player.addTempSkill("txhj_buff_qiangwu3", "phaseUseEnd");
            //game.log(player, '触发了【枪舞】');
            player.buffUpdate(event.name);
        },
    },
    txhj_buff_qiangwu3: {
        mod: {
            targetInRange: function (card, player) {
                if (card.name == "sha") {
                    const num = get.number(card);
                    if (num == "unsure" || num < player.storage.txhj_buff_qiangwu) return true;
                }
            },
            cardUsable: function (card, player) {
                if (card.name == "sha") {
                    const num = get.number(card);
                    if (num == "unsure" || num > player.storage.txhj_buff_qiangwu) return true;
                }
            },
        },
        trigger: {
            player: "useCard1",
        },
        filter: function (event, player) {
            if (_status.currentPhase == player && event.card.name == "sha" && get.number(event.card) > player.storage.txhj_buff_qiangwu && event.addCount !== false) return true;
            return false;
        },
        forced: true,
        popup: false,
        firstDo: true,
        content: function () {
            trigger.addCount = false;
            if (player.stat[player.stat.length - 1].card.sha > 0) {
                player.stat[player.stat.length - 1].card.sha--;
            }
            player.buffUpdate(event.name);
        },
    },
    txhj_mozun: {
        trigger: {
            player: ['phaseZhunbeiBegin', 'phaseJieshuBegin'],
        },
        forced: true,
        content: async function (event, trigger, player) {
            if (trigger.name == 'phaseZhunbei') {
                let cards = [];
                let cardlist = [...Array.from(ui.cardPile.childNodes).concat(Array.from(ui.discardPile.childNodes)), ...game.players.flatMap(player => player.getCards('hej'))
                ].filter(card => get.type(card) !== 'equip');
                cardlist = cardlist.randomSort();
                let unCards = new Set();
                let unShaCards = new Set();
                cardlist.forEach(card => {
                    if (card.name != 'sha') {
                        if (!unCards.has(card.name)) {
                            unCards.add(card.name);
                            cards.push(card);
                        }
                    } else {
                        let key = `${card.nature}_${card.name}`;
                        if (!unShaCards.has(key)) {
                            unShaCards.add(key);
                            cards.push(card);
                        }
                    }
                });
                if (cards.length > 0) await player.gain(cards, 'gain2').gaintag.add("txhj_mozun");
            } else {
                let cards = await player.getCards('h', card => card.hasGaintag('txhj_mozun'));
                if (cards.length > 0) await player.loseToDiscardpile(cards);
            }
        },
        ai: {
            threaten: 4,
            nokeep: true,
            pretao: true,
        },
    },
    txhj_xieyu: {
        trigger: {
            global: 'roundStart',
        },
        forced: true,
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player) {
                if (player.storage.txhj_xieyu == true) return "所有角色受到雷属性伤害+1，防止你受到所有雷属性伤害以外的伤害。";
                return "所有角色受到火属性伤害+1，防止你受到所有火属性伤害以外的伤害。";
            },
        },
        content: function () {
            if (Math.random() < 0.5) player.changeZhuanhuanji('txhj_xieyu');
        },
        group: ['txhj_xieyu_1', 'txhj_xieyu_2'],
        subSkill: {
            1: {
                trigger: {
                    player: 'damageBegin4',
                },
                forced: true,
                filter: function (event, player) {
                    if (!event.nature) return true;
                    if (player.storage.txhj_xieyu == true) return event.nature != 'thunder';
                    return event.nature != 'fire';
                },
                content: function () {
                    trigger.cancel();
                },
            },
            2: {
                trigger: {
                    global: 'damageBegin1',
                },
                forced: true,
                filter: function (event, player) {
                    if (player.storage.txhj_xieyu == true) return event.nature && event.nature == 'thunder' && event.notLink();
                    return event.nature && event.nature == 'fire' && event.notLink();
                },
                content: function () {
                    trigger.num++;
                },
            },
        },
        ai: {
            threaten: 3,
            nodamage: function (player) {
                if (!player.getStorage("txhj_xieyu") || get.tag(card, "natureDamage")) return;
                return true;
            },
            nofire: function (player) {
                if (player.getStorage("txhj_xieyu") == true) return true;
                return;
            },
            nothunder: function (player) {
                if (player.getStorage("txhj_xieyu") != true) return true;
                return;
            },
            skillTagFilter: function (player, tag, arg) {
                if (tag === "nofire" && arg && arg.player) {
                    if (arg.player.hasSkillTag("jueqing", false, player)) return false;
                    if (player.getStorage("txhj_xieyu") != true) return false;
                }
                if (tag === "nothunder" && arg && arg.player) {
                    if (arg.player.hasSkillTag("jueqing", false, player)) return false;
                    if (player.getStorage("txhj_xieyu") == true) return false;
                }
                if (tag === "nodamage" && arg && arg.player) {
                    if (arg.player.hasSkillTag("jueqing", false, player)) return false;
                    if (!player.getStorage("txhj_xieyu")) return false;
                }
            },
            effect: {
                target: function (card, player, target) {
                    let tar = game.findPlayer(e => e.hasSkill('txhj_xieyu'));
                    if (player.hasSkillTag("jueqing", false, player)) return;
                    if (!get.tag(card, "damage")) return;
                    if (tar) {
                        if (target == tar) {
                            if (tar.getStorage("txhj_xieyu") && !get.tag(card, "natureDamage")) return "zeroplayertarget";
                            if (tar.getStorage("txhj_xieyu") != true && !get.tag(card, "fireDamage")) return "zeroplayertarget";
                            if (tar.getStorage("txhj_xieyu") == true && !get.tag(card, "thunderDamage")) return "zeroplayertarget";
                            if (tar.getStorage("txhj_xieyu") != true && get.tag(card, "fireDamage")) return [1, -1];
                            if (tar.getStorage("txhj_xieyu") == true && get.tag(card, "thunderDamage")) return [1, -1];
                        }
                        if ((player.hasSkillTag("fireattack", false, player) || get.tag(card, "fireDamage")) && tar.getStorage("txhj_xieyu") != true) return [1, -1];
                        if ((player.hasSkillTag("thunderattack", false, player) || get.tag(card, "thunderDamage")) && tar.getStorage("txhj_xieyu") == true) return [1, -1];
                    }
                },
            },
        },
    },
    txhj_poxie: {
        trigger: {
            global: 'damageBegin1',
        },
        forced: true,
        init: function (player) {
            player.storage.txhj_poxie = true;
        },
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player) {
                if (player.storage.txhj_poxie == true) return "其他角色可以交给你两张红色牌，然后其本回合造成的伤害均视为火属性；";
                return "其他角色可以交给你两张黑色牌，然后其本回合造成的伤害均视为雷属性；";
            },
        },
        filter: function (event, player) {
            if (!event.source) return false;
            return ((!event.nature || event.nature != 'thunder') && event.source.hasSkill('txhj_poxie_yin')) || (!event.nature || event.nature != 'fire') && event.source.hasSkill('txhj_poxie_yang');
        },
        content: function () {
            if (trigger.source.hasSkill('txhj_poxie_yang')) trigger.nature = 'fire';
            if (trigger.source.hasSkill('txhj_poxie_yin')) trigger.nature = 'thunder';
        },
        global: ['txhj_poxie_use'],
        group: ['txhj_poxie_die'],
        subSkill: {
            die: {
                trigger: {
                    player: ["dieBegin"],
                },
                forced: true,
                unique: true,
                popup: false,
                silent: true,
                content: function () {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].hasSkill('txhj_poxie_use')) {
                            game.players[i].removeSkill('txhj_poxie_use');
                        }
                        if (game.players[i].hasSkill('txhj_poxie_yang')) {
                            game.players[i].removeSkill('txhj_poxie_yang');
                        }
                        if (game.players[i].hasSkill('txhj_poxie_yin')) {
                            game.players[i].removeSkill('txhj_poxie_yin');
                        }
                    }
                }
            },
            use: {
                enable: "phaseUse",
                discard: false,
                lose: false,
                delay: false,
                line: true,
                selectCard: 2,
                prepare: function (cards, player, targets) {
                    targets[0].logSkill('txhj_poxie');
                },
                prompt: function () {
                    var player = _status.event.player;
                    var list = game.filterPlayer(function (target) {
                        return target != player && target.hasSkill('txhj_poxie', player);
                    });
                    let str = "将两张张红色牌或两张黑色牌交给" + get.translation(list);
                    if (list.length > 1) str += '中的一人';
                    return str;
                },
                filter: function (event, player) {
                    if (player.hasSkill('txhj_poxie')) return false;
                    let num = player.getHistory('useSkill', function (evt) {
                        return evt && evt.skill && evt.skill == 'txhj_poxie_use';
                    }).length;
                    if (num >= 2) return false;
                    let targets = game.filterPlayer(function (target) {
                        return target != player && target.hasSkill('txhj_poxie', player);
                    });
                    if (!targets[0]) return false;
                    if ((targets[0].storage.txhj_poxie == true && player.countCards('h', { color: 'red' }) < 2) || (targets[0].storage.txhj_poxie != true && player.countCards('h', { color: 'black' }) < 2)) return false;
                    return game.hasPlayer(function (target) {
                        return target != player && target.hasSkill('txhj_poxie', player);
                    });
                },
                filterCard: function (card) {
                    let player = _status.event.player;
                    let targets = game.filterPlayer(function (target) {
                        return target != player && target.hasSkill('txhj_poxie', player);
                    });
                    if (targets[0].storage.txhj_poxie == true) return get.color(card) == 'red';
                    return get.color(card) == 'black';
                },
                check: function (card) {
                    return 8 - get.value(card);
                },
                log: false,
                visible: true,
                filterTarget: function (card, player, target) {
                    return target != player && target.hasSkill('txhj_poxie', player);
                },
                async content(event, trigger, player) {
                    await player.give(event.cards, event.target);
                    if (event.target.storage.txhj_poxie == true) {
                        if (player.hasSkill('txhj_poxie_yin')) player.removeSkill('txhj_poxie_yin');
                        player.addTempSkill('txhj_poxie_yang', 'phaseUseEnd');
                        event.target.changeZhuanhuanji('txhj_poxie');
                    } else {
                        if (player.hasSkill('txhj_poxie_yang')) player.removeSkill('txhj_poxie_yang');
                        player.addTempSkill('txhj_poxie_yin', 'phaseUseEnd');
                        event.target.changeZhuanhuanji('txhj_poxie');
                    }
                },
                ai: {
                    order: 10,
                    result: {
                        player: function (player, target) {
                            if (player.hasSkillTag("jueqing", false, player)) return -1;
                            let num = player.getHistory('useSkill', function (evt) {
                                return evt && evt.skill && evt.skill == 'txhj_poxie_use';
                            }).length;
                            var list = game.filterPlayer(function (target) {
                                return target != player && target.hasSkill('txhj_poxie', player);
                            });
                            if (list.length > 0) {
                                for (let y of list) {
                                    for (var i = 0; i < game.players.length; i++) {
                                        if (game.players[i].hasSkill('txhj_xieyu')) {
                                            if (num >= 1) {
                                                if (game.players[i].getStorage("txhj_xieyu") != true && y.getStorage("txhj_poxie") == true) {
                                                    return 4;
                                                } else if (game.players[i].getStorage("txhj_xieyu") == true && y.getStorage("txhj_poxie") != true) {
                                                    return 4;
                                                }
                                            } else {
                                                return 2;
                                            }
                                        }
                                    }
                                }
                            }
                            return -3;
                        },
                        target: 2,
                    },
                },
            },
            yang: {
                mark: true,
                marktext: "阳",
                charlotte: true,
                intro: {
                    content(storage, player) {
                        return "造成的伤害均视为火属性；";
                    },
                },
                ai: {
                    fireattack: true,
                },
            },
            yin: {
                mark: true,
                marktext: "阴",
                charlotte: true,
                intro: {
                    content(storage, player) {
                        return "造成的伤害均视为雷属性；";
                    },
                },
                ai: {
                    thunderattack: true,
                },
            },
        },
    },
    txhj_jinmo: {
        trigger: {
            player: ['damageBegin3', 'phaseDiscardEnd', 'phaseEnd'],
        },
        forced: true,
        mark: true,
        marktext: "魔",
        intro: {
            content(storage, player) {
                return `你的弃牌阶段结束时，你受到${player.countMark('txhj_jinmo')}点伤害`;
            },
        },
        filter: function (event, player) {
            if (event.name === 'damage') {
                return event.num > 0;
            } else {
                return player.countMark('txhj_jinmo') > 0;
            }
            return false;
        },
        content: async function (event, trigger, player) {
            if (trigger.name === 'damage') {
                trigger.num--;
                player.addMark('txhj_jinmo', 1);
                return;
            } else if (trigger.name === 'phaseDiscard') {
                if (player.countMark('txhj_jinmo') > 0) {
                    await player.damage(player.countMark('txhj_jinmo'));
                    let cards = [];
                    let history = player.getHistory('sourceDamage', function (evt) {
                        return evt.getParent().name == event.name;
                    });
                    if (history.length > 0) {
                        let num = history[0].num;
                        for (var i = 0; i < num; i++) {
                            cards.push(get.cardPile((card) => {
                                return get.tag(card, 'damage') && !cards.includes(card);
                            }));
                        }
                    }
                    if (cards) await player.gain(cards, 'gain2');
                }
            } else if (trigger.name === 'phase') {
                player.removeMark('txhj_jinmo', Infinity);
                return;
            }
        },
    },
    txhj_hengyi: {
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha') return num + player.countMark('txhj_hengyi');
            },
        },
        trigger: {
            global: ['shaMiss', 'damageEnd', 'phaseEnd'],
        },
        forced: true,
        mark: true,
        marktext: "毅",
        intro: {
            content(storage, player) {
                return `出杀次数+${player.countMark('txhj_hengyi')}`;
            },
        },
        filter: function (event, player) {
            if (event.name == 'phase') {
                return player.countMark('txhj_hengyi') >= 7;
            } else {
                if (event.player == player || (event.player != player && player.storage.txhj_hengyi_txWith && player.storage.txhj_hengyi_txWith.includes(event.player))) return true;
            }
            return false;
        },
        content: async function (event, trigger, player) {
            if (trigger.name == 'phase') {
                player.removeMark('txhj_hengyi', Infinity);
                await player.recover();
                game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.name)}回复1点体力。</span>`)
                if (player.getStorage("txhj_hengyi_txWith") && player.getStorage("txhj_hengyi_txWith").length > 0) {
                    let targets = [...player.getStorage("txhj_hengyi_txWith")];
                    for (let target of targets) {
                        await target.recover();
                    }
                    game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.getStorage("txhj_hengyi_txWith"))}回复1点体力。</span>`)
                }
            } else {
                player.addMark('txhj_hengyi', 1);
            }
        },
        group: ['txhj_hengyi_tx'],
        subSkill: {
            tx: {
                trigger: {
                    player: "phaseBegin",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current !== player)) return false;
                    return true;
                },
                forced: true,
                ruleSkill: true,
                charlotte: true,
                content: async function (event, trigger, player) {
                    const result = await player.chooseTarget("请选择你的“同心”角色", lib.filter.notMe, [1, 2])
                        .set("ai", function (target) {
                            let player = _status.event.player;
                            return get.attitude(player, target) > 1;
                        }).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    player.line(targets, "green");
                    game.log(`<span style="color:#FF6EC7;">${get.translation(player.name)}选择了${get.translation(targets)}作为自己的同心角色</span>`);
                    player.markSkill("txhj_hengyi_tx");
                    player.storage.txhj_hengyi_txWith = targets;
                    player
                        .when({ player: "phaseBegin" }, false)
                        .assign({ firstDo: true })
                        .then(() => {
                            delete player.storage.txhj_hengyi_txWith;
                            player.unmarkSkill("txhj_hengyi_tx");
                        })
                        .finish();
                    await game.delayx();
                },
                marktext: "恒",
                intro: {
                    name: "同心",
                    content(_, player) {
                        return `当前同心角色：${get.translation(player.getStorage("txhj_hengyi_txWith"))}`;
                    },
                },
            },
        },
    },
    txhj_xianzhu: {
        enable: "phaseUse",
        usable: 1,
        content: function () {
            player.drawTo(player.maxHp);
            if (player.storage.txhj_xianzhu_txWith && player.storage.txhj_xianzhu_txWith.length > 0) {
                let target = player.storage.txhj_xianzhu_txWith[0];
                target.drawTo(target.maxHp);
                if (target.countCards("h") > player.countCards("h")) {
                    game.log('执行“同心”, ', player, '与同心角色下次受到的大于2点的伤害时，防止此伤害。');
                    target.addSkill('txhj_xianzhu_damage');
                    player.addSkill('txhj_xianzhu_damage');
                }
            }
        },
        ai: {
            order: 1,
            result: {
                player: function (player, target) {
                    if (player.getStorage("txhj_xianzhu_txWith").length > 0) {
                        let targets = player.storage.txhj_xianzhu_txWith[0];
                        if (targets.countCards("h") < targets.maxHp && targets.maxHp > player.maxHp) return Math.max(player.maxHp - player.countCards("h"), 1) + Math.max(targets.maxHp - targets.countCards("h"), 1) + 2;
                        return Math.max(player.maxHp - player.countCards("h"), 1) + Math.max(targets.maxHp - targets.countCards("h"), 1);
                    }
                    return Math.max(player.maxHp - player.countCards("h"), 1);
                },
            }
        },
        group: ['txhj_xianzhu_tx'],
        subSkill: {
            damage: {
                trigger: {
                    player: 'damageBegin3',
                },
                forced: true,
                mark: true,
                marktext: "助",
                intro: {
                    content(storage, player) {
                        return `下次受到的大于2点的伤害时，防止此伤害。`;
                    },
                },
                filter: function (event, player) {
                    return event.num >= 2;
                },
                content: function () {
                    trigger.cancel();
                    player.removeSkill('txhj_xianzhu_damage');
                },
            },
            tx: {
                trigger: {
                    player: "phaseBegin",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current !== player)) return false;
                    return true;
                },
                forced: true,
                ruleSkill: true,
                async content(event, trigger, player) {
                    const result = await player.chooseTarget("请选择你的“同心”角色", function (card, player, target) {
                        return player != target && player.group == target.group && target.hasSex('male');
                    }, 1)
                        .set("ai", function (target) {
                            let player = _status.event.player;
                            return get.attitude(player, target) > 1;
                        }).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    player.line(targets, "green");
                    game.log(`<span style="color:#FF6EC7;">${player}选择了${targets}作为自己的同心角色</span>`);
                    player.markSkill("txhj_xianzhu_tx");
                    player.storage.txhj_xianzhu_txWith = targets;
                    player
                        .when({ player: "phaseBegin" }, false)
                        .assign({ firstDo: true })
                        .then(() => {
                            delete player.storage.txhj_xianzhu_txWith;
                            player.unmarkSkill("txhj_xianzhu_tx");
                        })
                        .finish();
                    await game.delayx();
                },
                marktext: "贤",
                intro: {
                    name: "同心",
                    content(_, player) {
                        return `当前同心角色：${get.translation(player.getStorage("txhj_xianzhu_txWith"))}`;
                    },
                },
            },
        },
    },
    txhj_rulong: {
        trigger: {
            global: ["useCardToPlayer", "shaAfter"],
        },
        filter: function (event, player, trigger) {
            switch (trigger) {
                case "useCardToPlayer":
                    return event.card && get.name(event.card) == 'sha' && event.targets && event.targets.some((current) => {
                        return current != player && get.distance(current, player) <= 1;
                    });
                case "shaAfter":
                    return event.targets && event.targets.includes(player) && event.player != player && !event.player.hasHistory("sourceDamage", function (evt) {
                        return evt?.card && evt.card == event.card;
                    });
                default:
                    return false;
            }
        },
        priority: 1,
        check: function (event, player) {
            switch (event.name) {
                case 'sha':
                    return get.effect(event.player, { name: 'juedou' }, player, player) > 0;
                case 'useCardToPlayer':
                    if (!event.targets || !event.player) return;
                    let num = 0;
                    for (let i of event.targets) {
                        if (i == player) continue;
                        num += get.attitude(player, i);
                    }
                    if (!player.hasShan() || player.hp <= 2) num -= 3;
                    return num > 0;
                default:
                    return false;
            }
        },
        frequent: "check",
        content: async function (event, trigger, player) {
            switch (trigger.name) {
                case "useCardToPlayer":
                    trigger.targets.length = 0;
                    trigger.getParent().triggeredTargets1.length = 0;
                    trigger.targets.push(player);
                    trigger.getParent().triggeredTargets1.push(player);
                    break;
                case "sha":
                    player.useCard({ name: 'juedou' }, trigger.player);
                    break;
                default:
                    return;
            }
        },
    },
    txhj_heli: {
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            return player != target;
        },
        content: function () {
            'step 0'
            player.line(target, "green");
            let skill = target.getSkills(null, false, false).filter(skill => {
                var info = get.info(skill);
                if (!info || get.is.locked(skill) || info.charlotte || info.forced || info.persevereSkill) return false;
                return true;
            }).randomGet();
            if (skill) target.tempBanSkill(skill, 'phaseAfter');
            'step 1'
            player.useCard({ name: 'sha', isCard: true }, false, -1, target);
            game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.name)}视为对${get.translation(target.name)}使用一张无距离限制且不计入次数的【杀】</span>`);
            if (!player.storage.txhj_heli_txWith || !player.storage.txhj_heli_txWith.length) {
                event.finish();
            }
            'step 2'
            game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.getStorage("txhj_heli_txWith"))}视为对${get.translation(target.name)}使用一张无距离限制且不计入次数的【杀】</span>`);
            let targets = player.storage.txhj_heli_txWith[0];
            if (targets) targets.useCard({ name: 'sha', isCard: true }, false, -1, target);
        },
        ai: {
            order: 10,
            result: {
                target: function (player, target) {
                    if (player.getStorage("txhj_heli_txWith").length) return get.effect(target, { name: 'sha' }, player, target) * 2;
                    return get.effect(target, { name: 'sha' }, player, target);
                },
            }
        },
        group: ['txhj_heli_tx'],
        subSkill: {
            tx: {
                trigger: {
                    player: "phaseBegin",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current !== player)) return false;
                    return true;
                },
                forced: true,
                ruleSkill: true,
                async content(event, trigger, player) {
                    const result = await player.chooseTarget("请选择你的“同心”角色", function (card, player, target) {
                        return player != target;
                    }).set("ai", function (target) {
                        let player = _status.event.player;
                        if (get.attitude(player, target) > 1) return true;
                        return Math.random();
                    }).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    player.line(targets, "green");
                    game.log(`<span style="color:#FF6EC7;">${player}选择了${targets}作为自己的同心角色</span>`);
                    player.markSkill("txhj_heli_tx");
                    player.storage.txhj_heli_txWith = targets;
                    player
                        .when({ player: "phaseBegin" }, false)
                        .assign({ firstDo: true })
                        .then(() => {
                            delete player.storage.txhj_heli_txWith;
                            player.unmarkSkill("txhj_heli_tx");
                        })
                        .finish();
                    await game.delayx();
                },
                marktext: "合",
                aiCheck: [null],
                intro: {
                    name: "同心",
                    content(_, player) {
                        return `当前同心角色：${get.translation(player.getStorage("txhj_heli_txWith"))}`;
                    },
                },
            },
        },
    },
    txhj_liyong: {
        trigger: {
            player: "useCardToTargeted",
        },
        filter: function (event, player) {
            if (!event.card || event.card.name != 'sha') return false;
            return true;
        },
        forced: true,
        subfrequent: ['tx'],
        content: async function (event, trigger, player) {
            let cardList = [...ui.cardPile.childNodes];
            function gainshajiuCards(player, cardPack) {
                let cards = [];
                let name = new Set();
                for (let i = 0; i < cardPack.length; i++) {
                    const card = cardPack[i];
                    if ((card.name === 'sha' || card.name === 'jiu') && !name.has(card.name)) {
                        cards.push(card);
                        name.add(card.name);
                        cardPack.splice(i, 1);
                        i--;
                    }
                }
                if (cards.length > 0) player.gain(cards, 'gain2');
            }
            trigger.parent.baseDamage += 1;
            let num = player.getHistory('useSkill', function (evt) {
                return evt && evt.skill && evt.skill == 'txhj_liyong';
            }).length;
            await player.randomDiscard('h', num);
            if (player.hasSkill('txhj_liyong_draw')) return;
            if (player.countCards('h') - num <= 0) {
                player.addTempSkill('txhj_liyong_draw');
                game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.name)}从牌堆中获得一张【杀】和【酒】</span>`);
                gainshajiuCards(player, cardList);
            }
            if (!player.getStorage("txhj_liyong_txWith") || !player.getStorage("txhj_liyong_txWith").length) {
                return;
            }
            let targets = [...player.getStorage("txhj_liyong_txWith")];
            for (const target of targets) {
                gainshajiuCards(target, cardList);
            }
            game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.getStorage("txhj_liyong_txWith"))}从牌堆中获得一张【杀】和【酒】</span>`);
        },
        group: ['txhj_liyong_tx'],
        subSkill: {
            draw: {
                charlotte: true,
            },
            tx: {
                trigger: {
                    player: "phaseBegin",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current !== player)) return false;
                    return true;
                },
                check: function (event, player) {
                    return game.players.some(current => current !== player && current.isFriendsOf(player));
                },
                frequent: "check",
                prompt: "是否发动【戾湧】选择同心角色？",
                charlotte: true,
                ruleSkill: true,
                content: async function (event, trigger, player) {
                    const result = await player.chooseTarget("请选择你的“同心”角色", function (card, player, target) {
                        return player != target;
                    }).set("ai", function (target) {
                        let player = _status.event.player;
                        return get.attitude(player, target) > 1;
                    }).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    player.line(targets, "green");
                    game.log(`<span style="color:#FF6EC7;">${get.translation(player.name)}选择了${get.translation(targets)}作为自己的同心角色</span>`);
                    player.markSkill("txhj_liyong_tx");
                    player.storage.txhj_liyong_txWith = targets;
                    player
                        .when({ player: "phaseBegin" }, false)
                        .assign({ firstDo: true })
                        .then(() => {
                            delete player.storage.txhj_liyong_txWith;
                            player.unmarkSkill("txhj_liyong_tx");
                        })
                        .finish();
                    await game.delayx();
                },
                marktext: "戾",
                aiCheck: [null],
                intro: {
                    name: "同心",
                    content(_, player) {
                        return `当前同心角色：${get.translation(player.getStorage("txhj_liyong_txWith"))}`;
                    },
                },
            },
        },
    },
    txhj_weizhen: {
        trigger: {
            player: ["phaseUseBegin", "phaseDiscardEnd"],
        },
        frequent: true,
        init: function (player) {
            player.storage.txhj_weizhen = [];
            player.storage.txhj_weizhen_txWith = [];
        },
        marktext: "镇",
        intro: {
            name: "巍镇",
            content(_, player) {
                return `当前巍镇角色：${get.translation(player.getStorage("txhj_weizhen"))}`;
            },
        },
        content: async function (event, trigger, player) {
            if (trigger.name == "phaseUse") {
                const result = await player.chooseTarget("请选择“巍镇”的目标", function (card, player, target) {
                    return player != target;
                }).set("ai", function (target) {
                    let player = _status.event.player;
                    return get.attitude(player, target) <= 0;
                }).forResult();
                    const targets = result.targets;
                if (!targets || !targets.length) return;
                player.line(targets, "red");
                game.log(`<span style="color:#FF0000;">${get.translation(player.name)}对${get.translation(targets)}施加了“巍镇”</span>`);
                player.markSkill("txhj_weizhen");
                player.storage.txhj_weizhen = [...targets];
                await game.asyncDelayx();
            } else {
                if (!player.storage.txhj_weizhen[0]?.isIn()) player.storage.txhj_weizhen = [];
                if (player.storage.txhj_weizhen.length <= 0) return;
                const targer = player.storage.txhj_weizhen.pop();
                if (targer && (!targer.countMark('txhj_weizhen_damage') || targer.countMark('txhj_weizhen_damage') <= 0)) return;
                let result = await targer.chooseCard(`是否交出${targer.countMark('txhj_weizhen_damage')}张红色牌或者不能使用或打出手牌直到${get.translation(player.name)}下回合开始？`, { color: 'red' }, targer.countMark('txhj_weizhen_damage')).set("ai", function (card) {
                    return 8 - get.value(card);
                }).forResult();
                if (result.bool) {
                    await player.gain(result.cards, targer, 'giveAuto');
                    game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.name)}从牌堆中获得一张【决斗】</span>`);
                    await player.gain(get.cardPile('juedou'), 'gain2');
                    if (player.getStorage("txhj_weizhen_txWith").length > 0) {
                        await player.getStorage("txhj_weizhen_txWith").forEach(target => {
                            target.gain(get.cardPile('juedou'), 'gain2');
                        });
                        game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.getStorage("txhj_weizhen_txWith"))}从牌堆中获得一张【决斗】</span>`);
                    }
                } else {
                    await targer.addSkill('txhj_weizhen_nocard');
                }
                targer.removeMark('txhj_weizhen_damage', Infinity);
            }
        },
        group: ['txhj_weizhen_tx', 'txhj_weizhen_damage', 'txhj_weizhen_remove'],
        subSkill: {
            remove: {
                trigger: {
                    player: ["phaseBegin", "dieBegin"],
                },
                forced: true,
                unique: true,
                popup: false,
                silent: true,
                content: function () {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].hasSkill('txhj_weizhen_nocard')) {
                            game.players[i].removeSkill('txhj_weizhen_nocard');
                            game.players[i].popup('txhj_weizhen');
                        }
                    }
                },
            },
            nocard: {
                init: function (player) {
                    player.addMark('txhj_weizhen_nocard');
                },
                onremove: function (player) {
                    player.removeMark('txhj_weizhen_nocard', Infinity);
                },
                marktext: "镇",
                intro: {
                    name: "巍镇",
                    content(_, player) {
                        return `无法使用或打出任何手牌`;
                    },
                },
                charlotte: true,
                mod: {
                    cardEnabled: function (card, player) {
                        return false;
                    },
                    cardUsable: function (card, player) {
                        return false;
                    },
                    cardRespondable: function (card, player) {
                        return false;
                    },
                    cardSavable: function (card, player) {
                        return false;
                    },
                },
            },
            damage: {
                trigger: { source: 'damageEnd' },
                forced: true,
                charlotte: true,
                marktext: "镇",
                intro: {
                    name: "镇",
                    content: "mark",
                },
                filter: function (event, player) {
                    return player.getStorage("txhj_weizhen").includes(event.player) && event.num > 0;
                },
                content: async function (event, trigger, player) {
                    player.draw(trigger.num);
                    trigger.player.addMark("txhj_weizhen_damage", trigger.num);
                },
            },
            tx: {
                trigger: {
                    player: "phaseBegin",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current !== player)) return false;
                    return true;
                },
                forced: true,
                ruleSkill: true,
                charlotte: true,
                content: async function (event, trigger, player) {
                    const result = await player.chooseTarget("请选择你的“同心”角色", function (card, player, target) {
                        return player != target;
                    }).set("ai", function (target) {
                        let player = _status.event.player;
                        return get.attitude(player, target) > 1;
                    }).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    player.line(targets, "green");
                    game.log(`<span style="color:#FF6EC7;">${get.translation(player.name)}选择了${get.translation(targets)}作为自己的同心角色</span>`);
                    player.markSkill("txhj_weizhen_tx");
                    player.storage.txhj_weizhen_txWith = targets;
                    player.when({ player: "phaseBegin" }, false)
                        .assign({ firstDo: true })
                        .then(() => {
                            delete player.storage.txhj_weizhen_txWith;
                            player.unmarkSkill("txhj_weizhen_tx");
                        })
                        .finish();
                    await game.delayx();
                },
                marktext: "巍",
                aiCheck: [null],
                intro: {
                    name: "同心",
                    content(_, player) {
                        return `当前同心角色：${get.translation(player.getStorage("txhj_weizhen_txWith"))}`;
                    },
                },
            },
        },
    },
    txhj_hemou: {
        trigger: {
            player: "useCardAfter",
        },
        usable: 1,
        filter: function (event, player) {
            if (!event.card || get.type(event.card) != 'trick') return false;
            return true;
        },
        check: function (event, player) {
            return true;
        },
        frequent: true,
        content: async function (event, trigger, player) {
            let cardList = [...ui.cardPile.childNodes, ...ui.discardPile.childNodes];
            function gainNameCards(player, cardPack) {
                let cards = [];
                for (let y = 0; y < cardPack.length; y++) {
                    if (cards.length >= 1) break;
                    if (cardPack[y].name == trigger.card.name) {
                        cards.push(cardPack[y]);
                        cardPack.splice(y, 1);
                        y--;
                    }
                }
                if (cards.length > 0) player.gain(cards, 'gain2');
            }
            game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.name)}从牌堆或弃牌堆获得一张${get.translation(trigger.card.name)}</span>`);
            gainNameCards(player, cardList);
            if (!player.getStorage("txhj_hemou_txWith") || !player.getStorage("txhj_hemou_txWith").length) {
                return;
            }
            let targets = [...player.getStorage("txhj_hemou_txWith")];
            for (let target of targets) {
                gainNameCards(target, cardList);
            }
            game.log(`<span style="color:#FF6EC7;">执行“同心”,${get.translation(player.getStorage("txhj_hemou_txWith"))}从牌堆或弃牌堆获得一张${get.translation(trigger.card.name)}</span>`);
        },
        group: ['txhj_hemou_tx', 'txhj_hemou_draw'],
        subSkill: {
            draw: {
                trigger: {
                    player: "useCardToTargeted",
                },
                usable: 1,
                filter: function (event, player) {
                    if (!event.card || get.type(event.card) != 'trick') return false;
                    return true;
                },
                content: function () {
                    let target = [player];
                    if (player.getStorage("txhj_hemou_txWith").length > 0) target.push(...player.getStorage("txhj_hemou_txWith"));
                    game.asyncDraw(target);
                }
            },
            tx: {
                trigger: {
                    player: "phaseBegin",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current !== player)) return false;
                    return true;
                },
                forced: true,
                ruleSkill: true,
                charlotte: true,
                content: async function (event, trigger, player) {
                    const result = await player.chooseTarget("请选择你的“同心”角色", function (card, player, target) {
                        return player != target;
                    }).set("ai", function (target) {
                        let player = _status.event.player;
                        return get.attitude(player, target) > 1;
                    }).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    player.line(targets, "green");
                    game.log(`<span style="color:#FF6EC7;">${get.translation(player.name)}选择了${get.translation(targets)}作为自己的同心角色</span>`);
                    player.markSkill("txhj_hemou_tx");
                    player.storage.txhj_hemou_txWith = targets;
                    player
                        .when({ player: "phaseBegin" }, false)
                        .assign({ firstDo: true })
                        .then(() => {
                            delete player.storage.txhj_hemou_txWith;
                            player.unmarkSkill("txhj_hemou_tx");
                        })
                        .finish();
                    await game.delayx();
                },
                marktext: "谋",
                aiCheck: [null],
                intro: {
                    name: "同心",
                    content(_, player) {
                        return `当前同心角色：${get.translation(player.getStorage("txhj_hemou_txWith"))}`;
                    },
                },
            },
        },
    },
    txhj_fanji: {
        trigger: {
            source: "gainEnd",
        },
        forced: true,
        filter: function (event, player) {
            var evt = event.getl(player);
            return evt && evt.hs && evt.hs.length > 0 && event.player && event.player != player && event.player.isIn();
        },
        content: function () {
            'step 0'
            let num = trigger.player.getSkills(null, false, false).filter(skill => {
                var info = get.info(skill);
                if (!info || info.forced) return false;
                return true;
            }).length;
            player.draw(num);
            'step 1'
            trigger.player.addTempSkill('txhj_fanji_fengyin', {
                player: 'phaseBegin'
            })
        },
        group: ['txhj_fanji_remove'],
        subSkill: {
            remove: {
                trigger: {
                    player: ["phaseBegin", "dieBegin"],
                },
                forced: true,
                unique: true,
                popup: false,
                silent: true,
                content: function () {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].hasSkill('txhj_fanji_fengyin')) {
                            game.players[i].removeSkill('txhj_fanji_fengyin');
                            game.players[i].popup('txhj_fanji');
                        }
                    }
                },
            },
            fengyin: {
                init: function (player, skill) {
                    player.addSkillBlocker(skill);
                },
                onremove: function (player, skill) {
                    player.removeSkillBlocker(skill);
                },
                charlotte: true,
                skillBlocker: function (skill, player) {
                    return !lib.skill[skill].persevereSkill && !lib.skill[skill].charlotte && !get.is.locked(skill, player);
                },
                mark: true,
                intro: {
                    content: function (storage, player, skill) {
                        var list = player.getSkills(null, false, false).filter(function (i) {
                            return lib.skill.fengyin.skillBlocker(i, player);
                        });
                        if (list.length) return "失效技能：" + get.translation(list);
                        return "无失效技能";
                    },
                },
            },
        },
    },
    txhj_tianzi: {
        trigger: {
            player: ["damageEnd", "phaseUseBegin"],
        },
        filter: function (event, player) {
            return !player.hasSkill('txhj_tianzi_sunben');
        },
        check: function (event, player) {
            return game.players.some(current => current !== player && current.isEnemiesOf(player));
        },
        frequent: "check",
        content: async function (event, trigger, player) {
            await player.addSkill('txhj_tianzi_sunben');
            const result = await player.chooseTarget('选择一名其他角色进行判定', function (card, player, target) {
                return target != player;
            }).set("ai", function (target) {
                let player = _status.event.player;
                let num = -get.attitude(player, target);
                if (num > 0) {
                    num += target.countCards('h');
                    if (target.isPhaseUsing() && num > 0) {
                        if (target.countCards('h') > target.maxHp) num += target.countCards('h') - target.maxHp;
                        num += 1;
                    }
                }
                return num;
            }).forResult();
                    const target = result.targets;
            if (!target || !target.length) return;
            player.line(target[0], "green");
            player.logSkill('txhj_tianzi', target[0]);
            const result2 = await player.judge(function (card) {
                if (target[0].countCards('h') > target[0].maxHp * 2) {
                    return get.color(card) == 'black' ? 1 : 0;
                }
                return get.color(card) == 'red' ? 1 : 0;
            }).forResult();
                    const color = result2.color;
            game.log(player, '对', target[0], '发动了【天姿】');
            if (!color) return;
            if (color == 'red') {
                if (target[0].isPhaseUsing()) {
                    _status.event.getParent('phaseUse').skipped = true;
                } else {
                    target[0].skip('phaseUse');
                }
                return;
            } else if (color == 'black') {
                let card = target[0].getCards('h');
                player.gain(card, 'gain2');
            }
        },
        subSkill: {
            sunben: {
                charlotte: true,
                init: function (player) {
                    player.storage.txhj_tianzi_sunben = 0;
                },
                onremove: true,
                mark: true,
                intro: {
                    markcount: function (num) {
                        return (num || 0).toString();
                    },
                    content: "跳过阶段进度：#/1",
                },
                trigger: {
                    global: ["phaseSkipped", "phaseCancelled", "phaseZhunbeiSkipped", "phaseZhunbeiCancelled", "phaseJudgeSkipped", "phaseJudgeCancelled", "phaseUseSkipped", "phaseUseCancelled", "phaseDiscardSkipped", "phaseDiscardCancelled", "phaseJieshuSkipped", "phaseJieshuCancelled"],
                },
                filter: function (event, player) {
                    return event.player != player;
                },
                forced: true,
                popup: false,
                firstDo: true,
                content: function () {
                    "step 0";
                    player.addMark("txhj_tianzi_sunben", 1, false);
                    "step 1";
                    if (player.countMark("txhj_tianzi_sunben") >= 1) {
                        player.removeSkill("txhj_tianzi_sunben");
                        player.popup("天姿");
                        game.log(player, "恢复了技能", "#g【天姿】");
                    }
                },
            },
        },
    },
    txhj_jiang: {
        trigger: {
            player: "useCardToTargeted",
            target: "useCardToTargeted",
        },
        filter: function (event, player) {
            let num = 0;
            if (event.player == player && event.targets.length > 0) {
                for (var i = 0; i < event.targets.length; i++) {
                    if (event.player.countCards('h') < event.targets[i].countCards('h')) num += 1;
                }
            } else if (event.player != player && event.targets.includes(player)) {
                if (player.countCards('h') < event.player.countCards('h')) num += 1;
            }
            return !player.hasSkill('txhj_jiang_sunben') && num > 0;
        },
        check: function (event, player) {
            return event.player.countCards('h') - player.countCards('h') > 3;
        },
        content: async function (event, trigger, player) {
            await player.addSkill('txhj_jiang_sunben');
            let num = 0;
            if (trigger.player == player) {
                for (let i of trigger.targets) {
                    if (num < i.countCards('h')) num = i.countCards('h');
                }
            } else if (trigger.player != player) {
                num = trigger.player.countCards('h');
            }
            if (num) player.drawTo(num);
        },
        subSkill: {
            sunben: {
                charlotte: true,
                init: function (player) {
                    player.storage.txhj_jiang_sunben = 0;
                },
                onremove: true,
                mark: true,
                intro: {
                    markcount: function (num) {
                        return (num || 0).toString();
                    },
                    content: "造成或受到伤害进度：#/1",
                },
                trigger: {
                    global: "damageAfter",
                },
                filter: function (event, player) {
                    return (event.player == player) || (event.source && event.source == player);
                },
                forced: true,
                popup: false,
                firstDo: true,
                content: function () {
                    "step 0";
                    player.addMark("txhj_jiang_sunben", 1, false);
                    "step 1";
                    if (player.countMark("txhj_jiang_sunben") >= 1) {
                        player.removeSkill("txhj_jiang_sunben");
                        player.popup("激昂");
                        game.log(player, "恢复了技能", "#g【激昂】");
                    }
                },
            },
        },
    },
    txhj_hanji: {
        trigger: {
            source: "damageBegin2",
        },
        filter: function (event, player) {
            return !player.hasSkill('txhj_hanji_sunben') && event.notLink();
        },
        frequent: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        check: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        content: function () {
            player.addSkill('txhj_hanji_sunben');
            trigger.hanji = true;
            trigger.num += 1;
        },
        subSkill: {
            sunben: {
                charlotte: true,
                init: function (player) {
                    player.storage.txhj_hanji_sunben = 0;
                },
                onremove: true,
                mark: true,
                intro: {
                    markcount: function (num) {
                        return (num || 0).toString();
                    },
                    content: "造成伤害进度：#/1",
                },
                trigger: {
                    source: "damageBegin4",
                },
                filter: function (event, player) {
                    return event.player != player && !event.hanji;
                },
                forced: true,
                popup: false,
                firstDo: true,
                content: function () {
                    "step 0";
                    player.addMark("txhj_hanji_sunben", 1, false);
                    "step 1";
                    if (player.countMark("txhj_hanji_sunben") >= 1) {
                        player.removeSkill("txhj_hanji_sunben");
                        player.popup("悍激");
                        game.log(player, "恢复了技能", "#g【悍激】");
                    }
                },
            },
        },
    },
    txhj_boji: {
        trigger: {
            player: "useCardToTargeted",
        },
        filter: function (event, player) {
            if (!event.card || event.card.name != 'sha') return false;
            return !player.hasSkill('txhj_boji_sunben');
        },
        check: function (event, player) {
            return get.attitude(player, event.player) < 0;
        },
        content: function () {
            player.addSkill('txhj_boji_sunben');
            let card = trigger.target.getCards('h');
            if (card) trigger.target.discard(card);
        },
        subSkill: {
            sunben: {
                charlotte: true,
                init: function (player) {
                    player.storage.txhj_boji_sunben = 0;
                },
                onremove: true,
                mark: true,
                intro: {
                    markcount: function (num) {
                        return (num || 0).toString();
                    },
                    content: "获得牌进度：#/4",
                },
                trigger: {
                    player: "gainAfter",
                },
                filter: function (event, player) {
                    return event.getg(player).length > 1;
                },
                forced: true,
                popup: false,
                firstDo: true,
                content: function () {
                    "step 0";
                    player.addMark("txhj_boji_sunben", trigger.getg(player).length, false);
                    "step 1";
                    if (player.countMark("txhj_boji_sunben") >= 4) {
                        player.removeSkill("txhj_boji_sunben");
                        player.popup("搏激");
                        game.log(player, "恢复了技能", "#g【搏激】");
                    }
                },
            },
        },
    },
    txhj_xiangxin: {
        trigger: {
            player: "damageEnd",
        },
        filter: function (event, player) {
            return !player.hasSkill('txhj_xiangxin_sunben') && event.source && event.source != player;
        },
        check: function (event, player) {
            return get.attitude(player, event.source) < 0;
        },
        content: function () {
            player.addSkill('txhj_xiangxin_sunben');
            'step 0';
            trigger.source.chooseToDiscard(`弃置${trigger.num}张牌或者受到${trigger.num}点伤害`, trigger.num).ai = function (card) {
                if (get.attitude(trigger.source, player) < 0) {
                    if (trigger.source.needsToDiscard()) return 7 - get.value(card);
                    return 6 - get.value(card);
                }
                return false;
            }
            'step 1'
            if (result.bool) {
                event.finish();
            } else {
                trigger.source.damage(trigger.num);
            }
        },
        subSkill: {
            sunben: {
                charlotte: true,
                init: function (player) {
                    player.storage.txhj_xiangxin_sunben = 0;
                },
                onremove: true,
                mark: true,
                intro: {
                    markcount: function (num) {
                        return (num || 0).toString();
                    },
                    content: "弃牌堆进入牌进度：#/7",
                },
                trigger: {
                    global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter", "equipAfter"],
                },
                filter: function (event, player) {
                    var cards = event.getd();
                    if (!cards.length) return false;
                    var list = cards.slice();
                    game.checkGlobalHistory(
                        "cardMove",
                        function (evt) {
                            if (evt == event || evt.getParent() == event || (evt.name != "lose" && evt.name != "cardsDiscard")) return false;
                            if (evt.name == "lose" && evt.position != ui.discardPile) return false;
                            list.removeArray(evt.cards);
                        },
                        event
                    );
                    return list.length > 0;
                },
                forced: true,
                popup: false,
                firstDo: true,
                content: function () {
                    "step 0";
                    var cards = trigger.getd().slice();
                    game.checkGlobalHistory(
                        "cardMove",
                        function (evt) {
                            if (evt == trigger || evt.getParent() == trigger || (evt.name != "lose" && evt.name != "cardsDiscard")) return false;
                            if (evt.name == "lose" && evt.position != ui.discardPile) return false;
                            cards.removeArray(evt.cards);
                        },
                        trigger
                    );
                    player.addMark("txhj_xiangxin_sunben", cards.length, false);
                    "step 1";
                    if (player.countMark("txhj_xiangxin_sunben") >= 7) {
                        player.removeSkill("txhj_xiangxin_sunben");
                        player.popup("香心");
                        game.log(player, "恢复了技能", "#g【香心】");
                    }
                },
            },
        },
    },
    txhj_zhuicui: {
        trigger: {
            player: ["chooseToCompareAfter", "compareMultipleAfter"],
            target: ["chooseToCompareAfter", "compareMultipleAfter"],
        },
        forced: true,
        content: async function (event, trigger, player) {
            let triggerlist = [];
            const loseList = Array.from(trigger.lose_list || []);
            for (let i of loseList) {
                if (i[0] == player) continue;
                triggerlist.push(i[0]);
            }
            for (let i of loseList) {
                if (i[0] == trigger.result.winner || i[0] == trigger.result.forceWinner) {
                    triggerlist.remove(i[0]);
                }
            }
            for (let i = 0; i < triggerlist.length; i++) {
                await triggerlist[i].damage();
            }
        },
        "_priority": 0,
    },
    txhj_moshi: {
        trigger: {
            player: "useCardToTargeted",
        },
        forced: true,
        filter: function (event, player) {
            return event.card && get.type(event.card) == 'trick' && event.target.isEnemiesOf(player);
        },
        content: function () {
            if (get.color(trigger.card) == 'black') {
                if (trigger.target.isEnemiesOf(player)) {
                    trigger.target.loseHp();
                    if (!trigger.target.hasSkill('txhj_moshi_black')) trigger.target.addTempSkill('txhj_moshi_black', 'phaseUseEnd');
                    if (trigger.target.hasSkill('txhj_moshi_black') && trigger.target.hasSkill('txhj_moshi_red') && !trigger.target.hasSkill('fengyin')) trigger.target.addTempSkill('fengyin', { player: 'phaseBegin' });
                }
            } else if (get.color(trigger.card) == 'red') {
                if (trigger.target.isEnemiesOf(player)) {
                    trigger.target.damage('fire');
                    if (!trigger.target.hasSkill('txhj_moshi_red')) trigger.target.addTempSkill('txhj_moshi_red', 'phaseUseEnd');
                    if (trigger.target.hasSkill('txhj_moshi_red') && trigger.target.hasSkill('txhj_moshi_black') && !trigger.target.hasSkill('fengyin')) trigger.target.addTempSkill('fengyin', { player: 'phaseBegin' });
                }
            }
        },
        ai: {
            threaten: 2,
            jueqing: function (card) {
                if (get.type(card) != 'trick' || get.color(card) == 'red') return;
                if (get.color(card) == 'black') return true;
            },
            fireattack: function (card) {
                if (get.type(card) != 'trick' || get.color(card) == 'black') return;
                if (get.color(card) == 'red') return true;
            },
            effect: {
                player_use: function (card, player, target) {
                    if (get.type(card) != 'trick') return;
                    if (get.attitude(player, target) > 0) return;
                    if (get.color(card) == 'black' || get.color(card) == 'red') return [1, -1];
                    if ((get.color(card) == 'black' && target.hasSkill('txhj_moshi_red') && !target.hasSkill('txhj_moshi_black')) || (get.color(card) == 'red' && target.hasSkill('txhj_moshi_black') && !target.hasSkill('txhj_moshi_red'))) return [1, -3];
                },
            },
        },
        subSkill: {
            'red': {
                mark: true,
                marktext: "红",
                charlotte: true,
                intro: {
                    content(storage, player) {
                        return "已被红色锦囊指定为目标";
                    },
                },
            },
            'black': {
                mark: true,
                marktext: "黑",
                charlotte: true,
                intro: {
                    content(storage, player) {
                        return "已被黑色锦囊指定为目标";
                    },
                },
            },
        },
    },
    txhj_xinmouduan: {
        trigger: {
            player: "useCardToTarget",
        },
        forced: true,
        filter: function (event, player) {
            let skill = lib.skill.txhj_rujing.txhj_getBanSkill(event.target).filter(function (i) {
                var info = get.info(i);
                return info && !info.charlotte && !get.is.locked(i);
            });
            return event.card && get.type(event.card) == 'trick' && event.target.isEnemiesOf(player) && skill?.length > 0;
        },
        content: async function (event, trigger, player) {
            let skill = lib.skill.txhj_rujing.txhj_getBanSkill(trigger.target);
            if (!skill) return;
            skill = skill.filter(function (i) {
                var info = get.info(i);
                return info && !info.charlotte && !get.is.locked(i);
            }).randomGet();
            if (skill) {
                trigger.target.disableSkill("txhj_xinmouduan", skill);
                game.log(trigger.target, "的技能", `#g【${get.translation(skill)}】`, "暂时失效了");
                if (!trigger.target.hasSkill("txhj_xinmouduan_restore")) trigger.target.addSkill("txhj_xinmouduan_restore");
            }
        },
        subSkill: {
            restore: {
                trigger: {
                    player: "damageEnd",
                },
                forced: true,
                popup: false,
                charlotte: true,
                onremove(player) {
                    player.enableSkill("txhj_xinmouduan");
                    game.log(player, "恢复了技能");
                },
                filter: function (event, player) {
                    return player.hasSkill('txhj_xinmouduan_restore');
                },
                content: function () {
                    player.removeSkill('txhj_xinmouduan_restore');
                }
            }
        },
    },
    txhj_hailong: {
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        filter: function (event, player) {
            return true;
        },
        content: function () {
            let num = 0;
            game.players.forEach(
                e => {
                    if (e != player) {
                        e.loseMaxHp();
                        num++;
                    }
                })
            if (num > 0) {
                player.gainMaxHp(num);
                player.recover(num);
            }
        },
    },
    txhj_mowang: {
        trigger: {
            player: ["loseMaxHpBegin", "gainMaxHpBegin"],
        },
        forced: true,
        usable: 5,
        filter: function (event, player) {
            return event.num > 0;
        },
        content: async function (event, trigger, player) {
            await player.draw(Math.min(player.maxHp, 5));
            await player.getEnemies().randomGet().damage(2);
        },
    },
    txhj_shicheng: {
        trigger: {
            player: "phaseDrawBegin"
        },
        init: function (player) {
            lib.skill.baonvezhi.change(player, 0);
        },
        frequent: 'check',
        check: function (event, player) {
            return game.hasPlayer(function (current) {
                return get.attitude(player, current) <= 1 && get.distance(current, player) <= 1 && current.isDamaged();
            });
        },
        filter: function (event, player) {
            return player.countMark("baonvezhi") > 0 && game.hasPlayer(function (current) {
                return get.distance(current, player) <= 1 && current.isDamaged();
            });
        },
        content: async function (event, trigger, player) {
            trigger.cancel();
            let list = Array.from({ length: Math.min(player.countMark("baonvezhi"), game.filterPlayer().filter(e => e.isDamaged() && get.distance(e, player) <= 1).length) }, (_, i) => `消耗${i + 1}点暴虐值`);
            let next = await player.chooseControlList(list).set("prompt", "噬城：选择要消耗的暴虐值").set("ai", () => {
                let num = game.filterPlayer().filter(e => e.isDamaged() && get.distance(e, player) <= 1 && get.attitude(player, e) <= 1).length;
                return Math.max(1, num);
            }).forResult();
            if (!next.control) return;
            let num = next.index + 1;
            let result = await player.chooseTarget("请选择被扣减体力上限的角色", function (card, player, target) {
                return target.isDamaged() && get.distance(target, player) <= 1;
            }, [1, num]).set("ai", function (target) {
                let player = _status.event.player;
                return get.attitude(player, target) <= 1;
            }).forResult();
                    const targets = result.targets;
            if (targets) {
                lib.skill.baonvezhi.change(player, -next.index);
                for (let i of targets) {
                    await i.loseMaxHp();
                }
                await player.gainMaxHp(targets.length);
            }
        },
    },
    "txhj_chushan": {
        trigger: {
            global: "phaseBegin"
        },
        init: function (player) {
            player.storage.txhj_chushan = 0;
        },
        filter: function (event, player) {
            return player.storage.txhj_chushan < 5;
        },
        content: async function (event, trigger, player) {
            let list = ["bazhan", "huoji", "kanpo", "reguanxing", "kongcheng"][player.storage.txhj_chushan];
            await player.addSkills(list);
            player.storage.txhj_chushan++;
        }
    },
    "txhj_wuqian": {
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        frequent: 'check',
        check: function (event, player) {
            return player.countCards("h") >= 2;
        },
        filter: function (event, player) {
            return player.countCards("h") >= 2;
        },
        content: async function (event, trigger, player) {
            let next = await player.chooseToDiscard("h", 2, "选择弃置两张手牌？").set("ai", card => {
                return 8 - get.value(card);
            }).forResult();
            if (next.bool == true) {
                await player.addTempSkill(["wushuang", "llqshenwei"], { player: "phaseAfter" });
                let result = await player.chooseTarget("请选择非锁定技失效的角色", function (card, player, target) {
                    return player != target;
                }).set("ai", function (target) {
                    let player = get.player();
                    let num = target.getSkills(null, false, false).filter(skill => {
                        var info = get.info(skill);
                        if (info && !info.charlotte && !get.is.locked(skill)) {
                            return true;
                        }
                    }).length;
                    if (get.attitude(player, target) <= 1) {
                        return num;
                    }
                    return 0;
                }).forResult();
                    const target = result.targets;
                if (target) {
                    let skills = target[0].getSkills(null, false, false).filter(skill => {
                        var info = get.info(skill);
                        if (info && !info.charlotte && !get.is.locked(skill)) {
                            return true;
                        }
                    }).randomGets(2);
                    await target[0].tempBanSkill(skills, { player: "phaseAfter" });
                }
            }
        }
    },
    txhj_zhudao: {
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            let target1 = player.getAllHistory('useSkill', function (evt) {
                if (!evt || !evt.skill || !evt.targets) return false;
                return evt?.skill == 'txhj_zhudao';
            });
            if (target1) {
                let target2 = target1.slice(-1)[0]?.targets[0];
                return target != target2;
            }
            return true;
        },
        content: async function (event, trigger, player) {
            let target = event.target;
            let list = [
                '本局游戏内：摸牌阶段多模一张牌。',
                '本局游戏内：手牌上限+1。',
                '本局游戏内：出牌阶段出杀次数+1。'
            ];
            let result = await player.chooseButton([`###请选择祝祷效果###`, [list.sort((a, b) => a.length - b.length), "textbutton",],], true).set("ai", (button) => {
                let num = 0;
                switch (button.link) {
                    case "本局游戏内：摸牌阶段多模一张牌。":
                        num += 3;
                        break;
                    case "本局游戏内：手牌上限+1。":
                        num += 1;
                        break;
                    case "本局游戏内：出牌阶段出杀次数+1。":
                        num += 2;
                        break;
                    default:
                        break;
                }
                return num;
            }).forResult();
            const next = result.links;
            if (next) {
                switch (next[0]) {
                    case "本局游戏内：摸牌阶段多模一张牌。":
                        if (!target.hasSkill("txhj_zhudao_draw")) {
                            await target.addSkill("txhj_zhudao_draw");
                            target.addMark("txhj_zhudao_draw");
                        } else {
                            target.addMark("txhj_zhudao_draw");
                        }
                        game.log('本局游戏内', target, '的摸牌阶段多模一张牌')
                        break;
                    case "本局游戏内：手牌上限+1。":
                        if (!target.hasSkill("txhj_zhudao_hd")) {
                            await target.addSkill("txhj_zhudao_hd");
                            target.addMark("txhj_zhudao_hd");
                        } else {
                            target.addMark("txhj_zhudao_hd");
                        }
                        game.log('本局游戏内', target, '的手牌上限+1')
                        break;
                    case "本局游戏内：出牌阶段出杀次数+1。":
                        if (!target.hasSkill("txhj_zhudao_sha")) {
                            await target.addSkill("txhj_zhudao_sha");
                            target.addMark("txhj_zhudao_sha");
                        } else {
                            target.addMark("txhj_zhudao_sha");
                        }
                        game.log('本局游戏内', target, '出牌阶段出杀次数+1')
                        break;
                    default:
                        break;
                }
            }
        },
        ai: {
            order: 10,
            result: {
                target: function (player, target) {
                    return 3;
                },
            },
        },
        subSkill: {
            hd: {
                charlotte: true,
                mod: {
                    maxHandcard: function (player, num) {
                        let add = player.countMark("txhj_zhudao_hd");
                        return num + add;
                    },
                },
                marktext: '祝',
                intro: {
                    content: function (num, player) {
                        return `手牌上限+${num}`;
                    },
                },
            },
            sha: {
                charlotte: true,
                mod: {
                    cardUsable: function (card, player, num) {
                        let add = player.countMark("txhj_zhudao_sha");
                        if (card?.name == 'sha') return num + add;
                    },
                },
                marktext: '祝',
                intro: {
                    content: function (num, player) {
                        return `使用【杀】次数上限+${num}`;
                    },
                },
            },
            draw: {
                charlotte: true,
                trigger: { player: 'phaseDrawBegin2' },
                forced: true,
                filter: function (event, player) {
                    return !event.numFixed && player.countMark('txhj_zhudao_draw');
                },
                content: function () {
                    trigger.num += player.countMark('txhj_zhudao_draw');
                },
                marktext: '祝',
                intro: {
                    content(num, player) {
                        return `摸牌阶段摸牌数+${num}`;
                    },
                },
            },
        }
    },
    tx_yuelingSkill1: {
        trigger: {
            player: "phaseDiscardAfter",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.cards && event.cards.length > 0;
        },
        content: async function (event, trigger, player) {
            let cards = trigger.cards;
            for (let i of cards) {
                let target = player.getEnemies().randomGet();
                if (!player.canUse(i, target, false, false)) continue;
                await player.useCard(i, target, false);
            }
            player.buffUpdate(event.name);
        },
    },
    tx_yuelingSkill2: {
        trigger: {
            global: "phaseUseBegin",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.player != player && player.countCards('h') < event.player.countCards('h');
        },
        content: async function (event, trigger, player) {
            let num = Math.min(Math.abs(player.countCards('h') - trigger.player.countCards('h')), 5);
            let cards = trigger.player.getCards('h').randomGets(num);
            await player.loseMaxHp();
            await player.gain(cards, 'gain2');
            player.buffUpdate(event.name);
        },
    },
    tx_yuelingSkill3: {
        trigger: {
            player: "loseMaxHpEnd",
        },
        forced: true,
        charlotte: true,
        ruleSkill: true,
        popup: false,
        filter: function (event, player) {
            return event.num > 0;
        },
        content: async function (event, trigger, player) {
            let num = trigger.num;
            let num2 = player.maxHp - player.hp;
            let num3 = num - num2;
            if (num3 > 0) {
                await player.recoverTo(player.maxHp);
                await player.gainMaxHp(num3);
            } else {
                await player.recover(num);
            }
            player.buffUpdate(event.name);
        },
    },
    //北定中原
    bdchushan: {
        trigger: {
            player: "phaseBegin",
        },
        init: function (player) {
            player.storage.bdchushan = 0;
        },
        filter: function (event, player) {
            return player.storage.bdchushan < 5;
        },
        content: async function (event, trigger, player) {
            let list = ["bazhan", "huoji", "kanpo", "reguanxing", "kongcheng"][player.storage.bdchushan];
            await player.addSkills(list);
            player.storage.bdchushan++;
        },
        "_priority": 0,
    },
    bdniqu: {
        enable: "phaseUse",
        usable: 1,
        filterTarget: function (card, player, target) {
            return target != player;
        },
        content: function () {
            'step 0'
            target.damage('nocard', 'fire');
            'step 1'
            if (target.isAlive()) {
                player.draw(0);
            }
        },
        ai: {
            order: function (name, player) {
                return get.order({ name: 'sha' }) - 1;
            },
            result: {
                target: function (player, target) {
                    return get.damageEffect(target, player, target, 'fire');
                },
            },
        },
    },
    bdyongsi: {
        audio: ['yongsi1', 'yongsi2'],
        trigger: { player: ['phaseDrawBegin1', 'phaseDiscardBegin'] },
        forced: true,
        locked: true,
        filter: function (event, player, triggername) {
            if (triggername == 'phaseDiscardBegin') return true;
            return triggername == 'phaseDrawBegin1' && !event.numFixed;
        },
        content: async function (event, trigger, player) {
            switch (event.triggername) {
                case 'phaseDrawBegin1':
                    trigger.changeToZero();
                    await player.draw(game.countPlayer());
                    break;
                case 'phaseDiscardBegin':
                    let result = await player.chooseCard('he', '庸肆').set('prompt2', '重铸一张牌，或取消并回复一点体力').set('ai', function (card) {
                        return 4 - get.value(card);
                    }).forResult();
                    if (result?.bool && result?.cards?.length) {
                        await player.recast(result.cards[0]);
                    } else {
                        player.recover();
                    }
                    break;
                default:
                    return;
            }
        }
    },
    lowchongqi: {
        audio: 2,
        trigger: { player: 'useCardToPlayered' },
        direct: true,
        usable: 1,
        filter: function (event, player) {
            return (event.card.name == 'sha') && event.targets.length == 1 &&
                (event.target.countGainableCards(player, 'h') > 0 || player.hasCard(function (i) {
                    return _status.connectMode || get.type(i, player) == 'basic' && lib.filter.cardDiscardable(i, player, 'lowchongqi');
                }, 'h'));
        },
        content: function () {
            'step 0'
            var target = trigger.target;
            event.target = target;
            var list = [];
            if (target.countGainableCards(player, 'h') > 0) list.push('选项一');
            if (player.hasCard(function (i) {
                return get.type(i, player) == 'basic' && lib.filter.cardDiscardable(i, player, 'lowchongqi');
            }, 'h')) list.push('选项二');
            list.push('背水！');
            list.push('cancel2');
            player.chooseControl(list).set('choiceList', [
                '弃置' + get.translation(target) + '的一张牌',
                '弃置一张牌并令' + get.translation(trigger.card) + '伤害+1',
                '背水！横置武将牌并执行所有选项',
            ]).set('prompt', get.prompt('lowchongqi', target)).set('ai', function () {
                var evt = _status.event.getTrigger(), player = evt.player, target = evt.target, card = evt.card;
                if (get.attitude(player, target) > 0) return 'cancel2';
                var bool1 = target.countGainableCards(player, 'h') > 0;
                var bool2 = player.hasCard(function (i) {
                    return get.type(i, player) == 'basic' && lib.filter.cardDiscardable(i, player, 'lowchongqi') && get.value(card, player) < 5;
                }, 'h') && !target.hasSkillTag('filterDamage', null, {
                    player: player,
                    card: card,
                });
                if (bool1 && bool2 && (target.hp <= 2 || (player.isDamaged() && player.maxHp > 3))) return '背水！';
                if (bool1) return '选项一';
                if (bool2) return '选项二';
                return 'cancel2';
            });
            'step 1'
            if (result.control != 'cancel2') {
                player.logSkill('lowchongqi', target);
                event.control = result.control;
                if (event.control == '背水！') player.link();
            } else {
                player.storage.counttrigger.lowchongqi--;
                event.finish();
            }
            'step 2'
            if ((event.control == '选项一' || event.control == '背水！') && target.countGainableCards(player, 'h') > 0) player.discardPlayerCard(target, 'he', true);
            'step 3'
            if ((event.control == '选项二' || event.control == '背水！') && player.hasCard(function (i) {
                return lib.filter.cardDiscardable(i, player, 'lowchongqi');
            }, 'h')) {
                player.chooseToDiscard('he', '弃置一张牌', true);
            } else event.finish();
            'step 4'
            if (result.bool) trigger.getParent().baseDamage++;
        },
        ai: {
            directHit_ai: true,
            skillTagFilter: function (player, tag, arg) {
                if (!arg || !arg.card || !arg.target || (arg.card.name != 'sha')) return false;
                if (player.storage.counttrigger && player.storage.counttrigger.lowchongqi && player.storage.counttrigger.lowchongqi > 0) return false;
                if (arg.target.countCards('h') == 1 && (arg.card.name != 'sha' || !arg.target.getEquip('bagua') || player.hasSkillTag('unequip', false, {
                    name: arg.card ? arg.card.name : null,
                    target: arg.target,
                    card: arg.card
                }) || player.hasSkillTag('unequip_ai', false, {
                    name: arg.card ? arg.card.name : null,
                    target: arg.target,
                    card: arg.card
                }))) return true;
                return false;
            },
        },
    },
    bdshoufa: {
        audio: "mbshoufa",
        trigger: {
            source: 'damageSource',
        },
        usable: 2,
        filter: function (event, player, name) {
            return name == 'damageSource' || (event.source && event.source != player && event.source.isIn());
        },
        direct: true,
        content: async function (event, trigger, player) {
            let zhoufa = player.storage.mbzhoulin_zhoufa;
            let str = zhoufa ? [
                '令其受到1点无来源伤害',
                '你随机获得其一张牌',
                '你随机弃置其装备区的一张牌',
                '令其摸一张牌',
            ][['豹', '鹰', '熊', '兔'].indexOf(zhoufa)] : '令其随机执行一个效果';
            let result = await player.chooseTarget(get.prompt('bdshoufa'), '选择一名' + (event.triggername == 'damageSource' ? '' : '不') + '其他角色，' + str, (card, player, target) => {
                var name = _status.event.triggername;
                if (name == 'damageEnd' && get.distance(player, target) > 0) return false;
                if (name == 'damageSource' && get.distance(player, target) > 114514) return false;
                var zhoufa = player.storage.mbzhoulin_zhoufa;
                if (!zhoufa) return true;
                if (zhoufa == '豹' || zhoufa == '兔') return true;
                if (zhoufa == '鹰') return target.countCards('he');
                return target.countDiscardableCards(player, 'e');
            }).set('ai', target => {
                var player = _status.event.player;
                var zhoufa = player.storage.mbzhoulin_zhoufa;
                if (!zhoufa) return -get.attitude(player, target);
                switch (zhoufa) {
                    case '豹':
                        return get.damageEffect(target, player, player);
                    case '鹰':
                        return get.effect(target, { name: 'guohe_copy2' }, player, player);
                    case '熊':
                        let att = get.attitude(player, target), eff = 0;
                        target.getCards('e', card => {
                            var val = get.value(card, target);
                            eff = Math.max(eff, -val * att);
                        });
                        return eff;
                    case '兔':
                        return get.effect(target, { name: 'draw' }, player, player);
                }
            }).set('triggername', event.triggername).forResult();
            if (result.bool) {
                const target = result.targets[0];
                player.logSkill('bdshoufa', target);
                const bdshoufa = zhoufa ? zhoufa : ['豹', '鹰', '熊', '兔'].randomGet();
                game.log(target, '执行', '#g' + bdshoufa, '效果');
                switch (bdshoufa) {
                    case '豹':
                        target.damage('nosource', 2);
                        break;
                    case '鹰':
                        player.gain(target.getGainableCards(player, 'he',).randomGet(), target, 'giveAuto');
                        player.gain(target.getGainableCards(player, 'he',).randomGet(), target, 'giveAuto');
                        break;
                    case '熊':
                        target.disableEquip([1, 2, 3, 4, 5].randomGet());
                        break;
                    case '兔':
                        target.discard(target.getGainableCards(player, 'he').randomGet()).discarder = player;
                        break;
                }
            }
        },
    },
    bdlianzhan: {
        audio: "tongji", trigger: { source: 'damageSource' },
        forced: true,
        filter: function (event, player) {
            return /*get.distance(player,event.player)<=1&&player.isDamaged()*/player.isIn();
        },
        content: function () {
            player.draw(trigger.num);
        }
    },
    mganqi: {
        trigger: { global: 'useCard1' },
        audio: 2,
        forced: true,
        firstDo: true,
        filter: function (event, player, card) {
            if (get.color(event.card) != 'red') return false;
            return event.card.name == 'nanman' && player != event.player || event.card.name == 'wanjian' && player != event.player || event.card.name == 'taoyuan' && player.hp < player.maxHp || event.card.name == 'wugu';
        },
        content: function () { },
        mod: {
            targetEnabled: function (card) {
                if ((get.type(card) == 'trick' || get.type(card) == 'delay') &&
                    get.color(card) == 'red') return false;
            }
        }
    },
    mgjieliang: {
        audio: 2,
        enable: 'phaseUse',
        usable: 2,
        discard: false,
        lose: false,
        delay: false,
        //viewAs:{name:'lebu'},
        filter: function (event, player) {
            return player.countCards('hes', { suit: 'club' }) > 0;
        },
        position: 'hes',
        filterCard: { suit: 'club' },
        filterTarget: function (card, player, target) {
            if (get.position(ui.selected.cards[0]) != 's' && lib.filter.cardDiscardable(ui.selected.cards[0], player, 'mgjieliang') && target.hasJudge('bingliang')) return true;
            if (player == target) return false;
            if (!game.checkMod(ui.selected.cards[0], player, 'unchanged', 'cardEnabled2', player)) return false;
            return player.canUse({ name: 'bingliang', cards: ui.selected.cards }, target);
        },
        check: function (card) {
            return 7 - get.value(card);
        },
        content: function () {
            if (target.hasJudge('bingliang')) {
                player.discard(cards);
                target.discard(target.getJudge('bingliang'));
            }
            else {
                player.useCard({ name: 'bingliang' }, target, cards).audio = false;
            }
            player.draw(2);
        },
        ai: {
            result: {
                target: function (player, target) {
                    if (target.hasJudge('bingliang')) return -get.effect(target, { name: 'bingliang' }, player, target);
                    return get.effect(target, { name: 'bingliang' }, player, target);
                }
            },
            order: 9,
        }
    },
    mgyichou: {
        audio: 2,
        trigger: { player: 'damageEnd' },
        forced: true,
        logTarget: 'source',
        filter: function (event, player) {
            return event.source && player != event.source && event.source.countCards('he') > 0;
        },
        content: function () {
            /* 'step 0'
             event.count = trigger.num;*/
            'step 0'
            //event.count--;
            trigger.source.loseHp();
            'step 1'
            if (/*event.count > 0 &&*/ result.bool && lib.skill.mgyichou.filter(trigger, player) && player.hasSkill('mgyichou')) event.goto(1);
        },
        ai: {
            threaten: 0.8,
            maixie: true,
            maixie_defend: true,
        },
    },
    mgzhilve: {
        audio: "zhilve",
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        content: function () {
            'step 0'
            if (!player.canMoveCard()) event._result = { index: 1 };
            else player.chooseControl().set('choiceList', [
                '移动场上的一张牌',
                '本回合的摸牌阶段多摸X张牌且第一张杀无距离次数限制（X为游戏轮数）',
            ]).set('ai', function () { return 1 });
            'step 1'
            if (result.index == 1) {
                player.addTempSkill('mgzhilve_yingzi');
                player.addTempSkill('new_repaoxiao');
                if (!player.getHistory('useCard', function (card) {
                    return card.card.name == 'sha';
                }).length) player.addTempSkill('mgzhilve_xiandeng');
                event.finish();
            }
            else player.moveCard(true);
            'step 2'
            if (result.position == 'e') player.draw(0);
            else player.addTempSkill('mgzhilve_dis');
        },
        subSkill: {
            dis: {
                mod: {
                    maxHandcard: function (player, num) {
                        return num - 0;
                    },
                },
            },
            yingzi: {
                trigger: { player: 'phaseDrawBegin2' },
                popup: false,
                forced: true,
                filter: function (event, player) {
                    return !event.numFixed;
                },
                content: function () {
                    trigger.num += game.roundNumber;
                }
            },
        }
    },
    mgfengyin: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        content: function () {
            game.countPlayer(function (current) {
                if (current != player && !current.hasSkill('fengyin')) {
                    player.line(current, 'green');
                    current.addTempSkill('fengyin');
                }
            });
        }
    },
    mgwuqian: {
        audio: "wuqian",
        group: 'mgfengyin',
        enable: 'phaseUse',
        derivation: ['wushuang'],
        filter: function (event, player) {
            return player.countMark('baonu') >= 0;
        },
        filterTarget: function (card, player, target) {
            return target != player && !target.hasSkill('mgwuqian_targeted');
        },
        content: function () {
            player.removeMark('baonu', 0);
            player.addTempSkill('wushuang');
            player.storage.mgwuqian_target = target;
            player.addTempSkill('mgwuqian_target');
            target.addTempSkill('mgwuqian_targeted');
        },
        subSkill: {
            equip: {
                ai: {
                    unequip: true,
                    skillTagFilter: function (player, tag, arg) {
                        if (arg && arg.target && arg.target.hasSkill('mgwuqian_targeted')) return true;
                        return false;
                    }
                }
            },
            targeted: { ai: { unequip2: true } },
            target: {
                mark: 'character',
                onremove: true,
                intro: {
                    content: '获得无双且$防具失效直到回合结束'
                },
            }
        }
    },
    mgchukou: {
        trigger: { player: 'phaseBegin' },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt('mgchukou'), function (card, player, target) {
                if (target.isFriendOf(player)) return false;
                return lib.filter.targetEnabled({ name: 'juedou' }, player, target);
            }).ai = function (target) {
                return get.effect(target, { name: 'juedou' }, player);
            }
            "step 1"
            if (result.bool) {
                player.logSkill('mgchukou');
                player.useCard({ name: 'juedou' }, result.targets, false);
                player.draw();
            }
        },
        ai: {
            expose: 0.2,
            threaten: 1.3
        }
    },
    mgzhicai: {
        audio: 2,
        trigger: { player: 'useCard' },
        usable: 1,
        frequent: true,
        preHidden: true,
        filter: function (event) {
            return (get.type(event.card) == 'trick'/*&&event.card.isCard*/);
        },
        content: function () {
            player.gainMaxHp(4);
        },
        ai: {
            threaten: 1.4,
            noautowuxie: true,
        }
    },
    //宛城之战   
    wcxiaoxiong: {
        audio: 2,
        group: ["wcxiaoxiong1"],
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        filter: function (event, player) {
            return player.getEnemies().includes(event.player) && event.player.countCards('he') > 0 && event.player != player;
        },
        logTarget: 'player',
        content: function () {
            var card1 = trigger.player.getCards('he');
            trigger.player.discard(card1);
        },
        ai: {
            expose: 0.2,
        },
    },
    wcxiaoxiong1: {
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") return num + 1;
            },
        },
    },
    wckuangcheng: {
        group: ["wckuangcheng1", "wckuangcheng2"],
        trigger: {
            player: 'damageBegin4',
        },
        filter: function (event, player) {
            return (event.hasNature('fire') || game.hasNature(event.card, 'fire'));
        },
        forced: true,
        content: function () {
            trigger.cancel();
            player.recover(Math.min(player.getDamagedHp(), 2 * trigger.num)) && player.draw((player.getDamagedHp(), 2 * trigger.num));
        },
        ai: {
            nofire: true,
            effect: {
                target: function (card, player, target, current) {
                    if (target.getDamagedHp() > 0 && get.tag(card, 'fireDamage')) return [0, 1];
                    if (get.tag(card, 'fireDamage')) return 0;
                }
            }
        }
    },
    wckuangcheng1: {
        trigger: {
            player: 'damageBegin4',
        },
        filter: function (event, player) {
            return (event.hasNature('thunder') || game.hasNature(event.card, 'thunder'));
        },
        forced: true,
        content: function () {
            trigger.cancel();
            player.recover(Math.min(player.getDamagedHp(), 2 * trigger.num)) && player.draw((player.getDamagedHp(), 2 * trigger.num));
        },
        ai: {
            nothunder: true,
            effect: {
                target: function (card, player, target, current) {
                    if (target.getDamagedHp() > 0 && get.tag(card, 'thunderDamage')) return [0, 1];
                    if (get.tag(card, 'thunderDamage')) return 0;
                }
            }
        }
    },
    wckuangcheng2: {
        trigger: {
            player: 'damageBegin4',
        },
        filter: function (event, player) {
            return (event.hasNature('ice') || game.hasNature(event.card, 'ice'));
        },
        forced: true,
        content: function () {
            trigger.cancel();
            player.recover(Math.min(player.getDamagedHp(), 2 * trigger.num)) && player.draw((player.getDamagedHp(), 2 * trigger.num));
        },
        ai: {
            noice: true,
            effect: {
                target: function (card, player, target, current) {
                    if (target.getDamagedHp() > 0 && get.tag(card, 'iceDamage')) return [0, 1];
                    if (get.tag(card, 'iceDamage')) return 0;
                }
            }
        }
    },
    wchuihun: {
        trigger: { source: "damageBegin" },
        forced: true,
        content() {
            trigger.num++;
            trigger.wchuihun = true;
        },
        subSkill: {
            hp: {
                trigger: { source: "damageAfter" },
                silent: true,
                filter(event) {
                    return event.wchuihun;
                },
                content() {
                    player.draw(3);
                    player.recover();
                },
            },
        },
        group: "nsshijun_hp",
        ai: {
            halfneg: true,
        },
    },
    wcfupi: {
        enable: "phaseUse",
        usable: 1,
        audio: 2,
        delay: false,
        filterTarget(card, player, target) {
            if (player == target)
                return (
                    player.countCards("e", function (card) {
                        return lib.filter.cardDiscardable(card, player);
                    }) > 0
                );
            return target.countDiscardableCards(player, "e") > 0;
        },
        filter(event, player) {
            return game.hasPlayer(function (current) {
                return current.countCards("e") > 0;
            });
        },
        useShaValue(player) {
            let cache = _status.event.getTempCache("wcfupi", "useShaValue");
            if (cache) return cache;
            let eff = -Infinity,
                odds = 0,
                tar = null;
            game.countPlayer(cur => {
                if (!player.canUse("sha", cur, false)) return;
                let eff2 = get.effect(cur, { name: "sha" }, player, player);
                if (eff2 < eff) return;
                let directHit = 1 - cur.mayHaveShan(player, "use", null, "odds");
                if (get.attitude(player, cur) > 0) directHit = 1;
                else eff2 *= directHit;
                if (eff2 <= eff) return;
                tar = cur;
                eff = eff2;
                odds = directHit;
            });
            _status.event.putTempCache("wcfupi", "useShaValue", {
                tar,
                eff,
                odds,
            });
            return { tar, eff, odds };
        },
        content() {
            "step 0";
            if (player == target) player.chooseToDiscard("e", true);
            else player.discardPlayerCard(target, "e", true);
            "step 1";
            player.chooseUseTarget("sha", true, false, "nodistance");
            "step 2";
            var bool = game.hasPlayer2(function (current) {
                return (
                    current.getHistory("damage", function (evt) {
                        return evt.getParent("wcfupi") == event;
                    }).length > 0
                );
            });
            if (player == target && bool) player.draw(2);
            else if (player != target && !bool) player.recover();
        },
        ai: {
            order() {
                return get.order({ name: "sha" }) - 0.3;
            },
            result: {
                player(player, target) {
                    let cache = lib.skill.wcfupi.useShaValue(player),
                        eff = cache.eff / 10;
                    if (player === target) {
                        return 2 * cache.odds + eff;
                    }
                    return Math.min(2, player.countCards("h")) * (cache.odds - 1) + eff;
                },
                target(player, target) {
                    let att = get.attitude(player, target),
                        max = 0,
                        min = 1;
                    target.countCards("e", function (card) {
                        var val = get.value(card, target);
                        if (val > max) max = val;
                        if (val < min) min = val;
                    });
                    if (att <= 0) {
                        if (target.hasSkillTag("noe")) return 2 - max / 3;
                        if (min <= 0) return 1;
                        return -max / 3;
                    }
                    if (target.hasSkillTag("noe")) return 2 - min / 4;
                    if (min <= 0) return 1;
                    if (player === target) {
                        let cache = lib.skill.wcfupi.useShaValue(player);
                        return cache.eff / 10 - 1;
                    }
                    return 0;
                },
            },
        },
    },
    wcguanji: {
        trigger: {
            player: ["shaMiss", "eventNeutralized"],
        },
        direct: true,
        audio: true,
        filter(event, player) {
            if (event.type != "card" || event.card.name != "sha" || !event.target.isIn()) return false;
            var min = 1;
            if (!player.hasSkill("wcguanji", null, false)) min += get.sgn(player.getEquips("guanshi").length);
            return player.countCards("he") >= min;
        },
        content() {
            "step 0";
            var next = player
                .chooseToDiscard(get.prompt("guanshi"), 1, "he", function (card, player) {
                    if (_status.event.ignoreCard) return true;
                    var cards = player.getEquips("guanshi");
                    if (!cards.includes(card)) return true;
                    return cards.some(cardx => cardx != card && !ui.selected.cards.includes(cardx));
                })
                .set("ignoreCard", player.hasSkill("wcguanji", null, false))
                .set("complexCard", true);
            next.logSkill = "wcguanji";
            next.set("ai", function (card) {
                var evt = _status.event.getTrigger();
                if (get.attitude(evt.player, evt.target) < 0) {
                    if (evt.player.needsToDiscard()) return 15 - get.value(card);
                    if (evt.baseDamage + evt.extraDamage >= Math.min(1, evt.target.hp)) return 8 - get.value(card);
                    return 5 - get.value(card);
                }
                return -1;
            });
            "step 1";
            if (result.bool) {
                if (event.triggername == "shaMiss") {
                    trigger.untrigger();
                    trigger.trigger("shaHit");
                    trigger._result.bool = false;
                    trigger._result.result = null;
                } else {
                    trigger.unneutralize();
                }
            }
        },
        ai: {
            directHit_ai: true,
            skillTagFilter(player, tag, arg) {
                if (player._guanshi_temp) return;
                player._guanshi_temp = true;
                var bool =
                    get.attitude(player, arg.target) < 0 &&
                    arg.card &&
                    arg.card.name == "sha" &&
                    player.countCards("he", function (card) {
                        return card != player.getEquip("guanshi") && card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card)) && get.value(card) < 5;
                    }) > 1;
                delete player._guanshi_temp;
                return bool;
            },
        },
    },
    wcmihun: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filterTarget(card, player, target) {
            return player != target;
        },
        filterCard: true,
        position: "he",
        logAudio: () => 1,
        content() {
            player.gainPlayerCard(target, true, "h", target.countCards("h"));
            player.recover(player.maxHp - player.hp);
            player.addSkill("wcmihun2");
            player.storage.wcmihun = target;
        },
        check(card) {
            return 8 - get.value(card);
        },
        ai: {
            order: 10,
            result: {
                player(player, target) {
                    return target.countCards("h") - 1 + player.maxHp - player.hp;

                },
                target(player, target) {
                    return - target.countCards("h");

                },
            },
            threaten: 1.5,
        },
    },
    wcmihun2: {
        trigger: { player: "phaseUseEnd" },
        forced: true,
        audio: "wcmihun2.mp3",
        sourceSkill: "wcmihun",
        content() {
            "step 0";
            var cards = player.getCards("he");
            player.removeSkill("wcmihun2");
            if (player.storage.wcmihun.classList.contains("dead") || player.storage.wcmihun.hp <= 0 || cards.length == 0) {
                event.finish();
            } else {
                if (cards.length < player.storage.wcmihun.hp) event._result = { bool: true, cards: cards };
                else player.chooseCard("he", true, 1/*player.storage.wcmihun.hp*/, "迷魂：选择要交给" + get.translation(player.storage.wcmihun) + "的牌");
            }
            "step 1";
            player.give(result.cards, player.storage.wcmihun);
        },
    },
    wcfenlie: {
        audio: 2,
        trigger: { player: "phaseZhunbeiBegin" },
        frequent: true,
        preHidden: true,
        async content(event, trigger, player) {
            while (true) {
                if (event.cards == undefined) event.cards = [];
                const judgeEvent = player.judge(card => {
                    if (get.color(card) == "red") return 1.5;
                    return -1.5;
                });
                judgeEvent.judge2 = result => result.bool;
                if (get.mode() != "guozhan" && !player.hasSkillTag("rejudge"))
                    judgeEvent.set("callback", async event => {
                        if (event.judgeResult.color == "red" && get.position(event.card, true) == "o") await player.gain(event.card, "gain2");
                    });
                else
                    judgeEvent.set("callback", async event => {
                        if (event.judgeResult.color == "red") event.getParent().orderingCards.remove(event.card);
                    });
                const {
                    result: { judge, card },
                } = await judgeEvent;
                let bool;
                if (judge > 0) {
                    event.cards.push(card);
                   const boolre = await player.chooseBool("是否再次发动【奋烈】？").set("frequentSkill", "wcfenlie").forResult();
                    bool = boolre.bool
                } else {
                    for (let i = 0; i < event.cards.length; i++) {
                        if (get.position(event.cards[i], true) != "o") {
                            event.cards.splice(i, 1);
                            i--;
                        }
                    }
                    if (event.cards.length) {
                        // 异步函数最后一个Promise事件可以省略await
                        player.gain(event.cards, "gain2");
                    }
                    return;
                }
                if (!bool) {
                    if (event.cards.length) {
                        // 但还是建议加上
                        await player.gain(event.cards, "gain2");
                    }
                    return;
                }
            }
        },
    },
    dcmangtao: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filterCard: lib.filter.cardRecastable,
        selectCard() {
            return Math.ceil(_status.event.player.countCards("h") / 2);
        },
        check(card) {
            return 6.5 - get.value(card);
        },
        discard: false,
        lose: false,
        delay: false,
        content() {
            "step 0";
            player.recast(cards);
            "step 1";
            //player.addTempSkill("dcmangtao_help");
            player.chooseUseTarget(
                {
                    name: "shuiyanqijunx",
                    isCard: true,
                    storage: { dcmangtao: true },
                },
                true
            );
        },
        ai: {
            order() {
                return 0.9 * get.order({ name: "shuiyanqijunx" });
            },
            tag: {
                respond: 2,
                respondSha: 2,
                damage: 1,
            },
            result: {
                player(player) {
                    let target = null,
                        maxval = 0;
                    for (let i of game.players) {
                        let jdeff = get.effect(
                            i,
                            {
                                name: "shuiyanqijunx",
                                isCard: true,
                                cards: ui.selected.cards,
                                storage: { dcmangtao: true },
                            },
                            player,
                            player
                        );
                        if (
                            i === player ||
                            !player.canUse(
                                {
                                    name: "shuiyanqijunx",
                                    isCard: true,
                                    cards: ui.selected.cards,
                                    storage: { dcmangtao: true },
                                },
                                i
                            ) ||
                            jdeff < 0
                        )
                            continue;
                        let receff = 0;
                        game.filterPlayer(function (current) {
                            if (player != current && i.inRange(current) && current.isDamaged()) receff = Math.max(receff, get.recoverEffect(current, i, i));
                        });
                        if (jdeff + receff / 5 > maxval) {
                            target = i;
                            maxval = jdeff + receff / 5;
                        }
                    }
                    if (target) return maxval / 80;
                    return 0;
                },
            },
        },
        /*subSkill: {
            help: {
                trigger: { global: "damageSource" },
                filter(event, player) {
                    return (
                        event.card &&
                        event.card.storage &&
                        event.card.storage.dcmangtao &&
                        event.player.isIn() &&
                        event.getParent(2).targets.includes(event.player) &&
                        game.hasPlayer(current => {
                            return current != player && event.player.inRange(current) && current.isDamaged();
                        })
                    );
                },
                direct: true,
                forced: true,
                charlotte: true,
                content() {
                    "step 0";
                    player
                        .chooseTarget("莽涛：是否令其攻击范围内的一名其他角色回复1点体力？", (card, player, target) => {
                            if (_status.event.player == target) return false;
                            return target.isDamaged() && _status.event.targetx.inRange(target);
                        })
                        .set("targetx", trigger.player)
                        .set("ai", target => get.recoverEffect(target, _status.event.player, _status.event.player));
                    "step 1";
                    if (result.bool) {
                        var target = result.targets[0];
                        player.logSkill("dcmangtao_help", target);
                        target.recover(player);
                    }
                },
            },
        },*/
    },
    wctuxi: {
        audio: 2,
        trigger: {
            player: "useCard",
        },
        forced: true,
        filter(event, player) {
            if (!["juedou", "wanjian", "taoyuan", "huogong"].includes(get.name(event.card))) return false;
            return player.getAllHistory("useCard", evt => get.name(evt.card) === get.name(event.card)).indexOf(event) == 0;
        },
        content() {
            trigger.baseDamage++;
            trigger.addCount = false;
            const stat = player.getStat().card,
                name = trigger.card.name;
            if (typeof stat[name] === "number") stat[name]--;
            trigger.set(event.name, true);
            player
                .when({ player: "useCardAfter" })
                .filter((evt, player, name) => evt.card === trigger.card && evt.wctuxi)
                .then(() => {
                    if (trigger.cards.filterInD().length) player.gain(trigger.cards.filterInD(), "gain2");
                });
        },
    },
    wcchiying: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filterTarget: true,
        async content(event, trigger, player) {
            const target = event.targets[0];
            await target.link();
            await target.damage();
        },
        ai: {
            order: 1,
            result: {
                player(player, target) {
                    return get.effect(target, { name: "draw" }, player, player) + get.damageEffect(target, player, player);
                },
            },
        },
    },
    wczhushou: {
        trigger: { player: "phaseJieshuBegin" },
        forced: true,
        content() {
            "step 0";
            var card = get.cardPile(function (card) {
                return card.name == "shan";
            });
            if (card) {
                player.gain(card, "gain2");
            } else event.finish();
            "step 1";
            game.updateRoundNumber();
            player.link();
        },
    },
    dunzhen: {
        trigger: { target: "shaBefore" },
        forced: true,
        audio: "weimu",
        filter(event, player) {
            if (!player.hasEmptySlot(2)) return false;
            return event.card.name == "sha" && get.color(event.card) == "red";
        },
        content() {
            trigger.cancel();
        },
        ai: {
            effect: {
                target(card, player, target) {
                    if (player == target && get.subtypes(card).includes("equip2")) {
                        if (get.equipValue(card) <= 8) return 0;
                    }
                    if (!player.hasEmptySlot(2)) return;
                    if (card.name == "sha" && get.color(card) == "red") return "zeroplayertarget";
                },
            },
        },
    },
    wczhifa: {
        audio: "reduodao",
        trigger: { global: "useCard" },
        direct: true,
        filter(event, player) {
            if (player == event.player || get.type(event.card, false) != "trick" || (event.player.isDead() && !event.cards.filterInD().length)) return false;
            var all = event.player.getHistory("useCard");
            for (var i of all) {
                if (get.type(i.card, false) == "trick") return i == event;
            }
            return false;
        },
        content() {
            "step 0";
            var list = [];
            event.addIndex = 0;
            if (trigger.cards.filterInD().length > 0) list.push("获得" + get.translation(trigger.cards.filterInD()));
            else event.addIndex++;
            if (trigger.player.isIn()) list.push("令" + get.translation(trigger.player) + "本回合不能使用或打出【杀】");
            player
                .chooseControl("cancel2")
                .set("choiceList", list)
                .set("prompt", get.prompt("wczhifa", trigger.player))
                .set("ai", function () {
                    var evt = _status.event.getParent(),
                        player = evt.player,
                        evt2 = evt._trigger;
                    if (evt.addIndex == 0) {
                        var noob = get.attitude(player, evt2.player) < 0 ? 1 : "cancel2";
                        /*if (player.countMark("fuzhong") == 3) return noob;*/
                        if (get.effect(evt2.targets[0], evt2.card, evt2.player, player) <= 0) return 0;
                        return noob;
                    }
                    return get.attitude(player, evt2.player) < 0 ? 0 : "cancel2";
                });
            "step 1";
            if (result.control != "cancel2") {
                player.logSkill("wczhifa", trigger.player);
                game.delayx();
                if (result.index + event.addIndex == 0) {
                    player.gain(trigger.cards.filterInD(), "gain2");
                } else trigger.player.addTempSkill("wczhifa2");
            }
        },
    },
    wczhifa2: {
        charlotte: true,
        mark: true,
        mod: {
            cardEnabled(card) {
                if (card.name == "sha") return false;
            },
            cardRespondable(card) {
                if (card.name == "sha") return false;
            },
        },
        intro: {
            content: "本回合不能使用或打出杀",
        },
    },
    wcdaoji: {
        audio: "daoji",
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return player.hasCard(lib.skill.wcdaoji.filterCard, "he");
        },
        filterCard(card) {
            return get.type(card) != "equip";
        },
        position: "he",
        filterTarget(card, player, target) {
            return target != player && target.hasCard(card => lib.filter.canBeGained(card, target, player), "he");
        },
        check(card) {
            return 8 - get.value(card);
        },
        content() {
            "step 0";
            player.gainPlayerCard(target, "he", true);
            "step 1";
            if (result.bool && result.cards && result.cards.length == 1) {
                var card = result.cards[0];
                if (player.getCards("h").includes(card)) {
                    var type = get.type(card);
                    if (type == "basic") target.damage(2, "nocard");
                    else if (type == "trick") {
                        if (player.hasUseTarget(card)) player.chooseUseTarget(card, "nopopup", true);
                        target.damage("nocard");
                    }
                }
            }
        },
        ai: {
            order: 6,
            result: {
                target(player, target) {
                    var eff = get.effect(target, { name: "shunshou_copy2" }, player, target);
                    if (target.countCards("hej") > 0) eff += get.damageEffect(target, player, target);
                    return eff;
                },
            },
        },
    },
    wchuoyang: {
        audio: "huoshui",
        trigger: { player: "damageEnd" },
        direct: true,
        filter(event, player) {
            if (event.source && event.source.isIn()) return true;
            return game.hasPlayer(current => lib.skill.wcqingcheng.filterTarget(null, player, current));
        },
        content() {
            "step 0";
            event.addIndex = 0;
            var choiceList = [];
            if (trigger.source && trigger.source.isIn()) {
                choiceList.push("令" + get.translation(trigger.source) + "的所有非锁定技失效");
            } else event.addIndex++;
            if (game.hasPlayer(current => lib.skill.wcqingcheng.filterTarget(null, player, current))) choiceList.push("发动一次〖倾城〗");
            player
                .chooseControl("cancel2")
                .set("prompt", get.prompt("wchuoyang"))
                .set("choiceList", choiceList)
                .set("ai", function () {
                    var player = _status.event.player,
                        source = _status.event.getTrigger().source,
                        index = _status.event.getParent().addIndex;
                    if (
                        game.hasPlayer(function (current) {
                            return current != player && current.countCards("h") > 3 && get.attitude(player, current) < 0;
                        })
                    )
                        return 1 - index;
                    if (source && source.isIn() && get.attitude(player, source) < 0 && !source.hasSkill("fengyin")) return 0;
                    if (
                        game.hasPlayer(function (current) {
                            return current != player && current.countCards("h") > 0 && get.attitude(player, current) < 0;
                        })
                    )
                        return 1 - index;
                    return "cancel2";
                });
            "step 1";
            if (result.control != "cancel2") {
                if (result.index + event.addIndex == 0) {
                    var target = trigger.source;
                    player.logSkill("wchuoyang", target);
                    //target.removeSkill('fengyin');
                    target.addTempSkill("fengyin", { player: "phaseBegin" });
                    event.finish();
                } else
                    player.chooseTarget(true, "请选择〖倾城〗的目标", lib.skill.wcqingcheng.filterTarget).set("ai", function (target) {
                        var player = _status.event.player;
                        return get.effect(target, "wcqingcheng", player, player);
                    });
            } else event.finish();
            "step 2";
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill("wchuoyang", target);
                var next = game.createEvent("wchuoyang_wcqingcheng");
                next.player = player;
                next.target = target;
                next.setContent(lib.skill.wcqingcheng.content);
            }
        },
    },
    wcqingcheng: {
        audio: "qingcheng",
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return game.hasPlayer(current => lib.skill.wcqingcheng.filterTarget(null, player, current));
        },
        filterTarget(card, player, target) {
            return target != player;
        },
        content() {
            player.swapHandcards(target);
        },
        ai: {
            order: 1,
            result: {
                player(player, target) {
                    if (target.countCards("h") > 0) return -Math.max(get.value(target.getCards("h"), player) - get.value(player.getCards("h"), player), 0);
                    return 0;
                },
            },
        },
    },
    wckaikang: {
        audio: "kaikang",
        trigger: { global: 'useCardToTargeted' },
        filter: function (event, player) {
            return event.card.name == 'sha' && event.target.isIn();
        },
        check: function (event, player) {
            return get.attitude(player, event.target) >= 0;
        },
        logTarget: 'target',
        content: function () {
            "step 0"
            player.draw();
            if (trigger.target != player) {
                player.chooseCard(true, 'he', '交给' + get.translation(trigger.target) + '一张牌').set('ai', function (card) {
                    if (get.position(card) == 'e') return -1;
                    if (card.name == 'shan') return 1;
                    if (get.type(card) !== 'equip') return 0.5;
                    return 0;
                });
            }
            else {
                event.finish();
            }
            "step 1"
            player.give(result.cards, trigger.target, 'give');
            game.delay();
            event.card = result.cards[0];
            "step 2"
            if (trigger.target.getCards('h').includes(card) && get.type(card) !== 'equip') {
                trigger.target.chooseUseTarget(card);
            }
        },
        ai: {
            threaten: 1.1
        }
    },
    //卧龙点荆	
    djzhenlie: {
        audio: "zhenlie",
        usable: 1,
        filter(event, player) {
            return event.player != player && event.card && (event.card.name == "sha" || get.type(event.card) == "trick");
        },
        logTarget: "player",
        check(event, player) {
            if (event.getParent().excluded.includes(player)) return false;
            if (get.attitude(player, event.player) > 0 || (player.hp < 2 && !get.tag(event.card, "damage"))) return false;
            let evt = event.getParent(),
                directHit = (evt.nowuxie && get.type(event.card, "trick") === "trick") || (evt.directHit && evt.directHit.includes(player)) || (evt.customArgs && evt.customArgs.default && evt.customArgs.default.directHit2);
            if (get.tag(event.card, "respondSha")) {
                if (directHit || player.countCards("h", { name: "sha" }) === 0) return true;
            } else if (get.tag(event.card, "respondShan")) {
                if (directHit || player.countCards("h", { name: "shan" }) === 0) return true;
            } else if (get.tag(event.card, "damage")) {
                if (event.card.name === "huogong") return event.player.countCards("h") > 4 - player.hp - player.hujia;
                if (event.card.name === "shuiyanqijunx") return player.countCards("e") === 0;
                return true;
            } else if (player.hp > 2) {
                if (event.card.name === "shunshou" || (event.card.name === "zhujinqiyuan" && (event.card.yingbian || get.distance(event.player, player) < 0))) return true;
            }
            return false;
        },
        trigger: { target: "useCardToTargeted" },
        content() {
            "step 0";
            if (get.attitude(player, trigger.player) < 0 && trigger.player.countDiscardableCards(player, "he")) player.addTempSkill("djzhenlie_lose");
            player.loseHp();
            "step 1";
            player.removeSkill("djzhenlie_lose");
            trigger.getParent().excluded.add(player);
            "step 2";
            if (trigger.player.countCards("he")) {
                if (get.mode() !== "identity" || player.identity !== "nei") player.addExpose(0.12);
                player.discardPlayerCard(trigger.player, "he", true);
            }
        },
        subSkill: {
            lose: {
                charlotte: true,
            },
        },
        ai: {
            filterDamage: true,
            skillTagFilter: (player, tag, arg) => {
                return arg && arg.jiu == true;
            },
            effect: {
                target(card, player, target) {
                    if (target.hp <= 0 && target.hasSkill("djzhenlie_lose") && get.tag(card, "recover")) return [1, 1.2];
                },
            },
        },
    },
    djtushe: {
        audio: "xinfu_tushe",
        mod: {
            aiOrder(player, card, num) {
                if (get.tag(card, "multitarget")) {
                    if (player.countCards("h", { type: "basic" })) return num / 10;
                    return num * 10;
                }
                if (get.type(card) === "basic") return num + 10;
            },
            aiValue(player, card, num) {
                if (card.name === "zhangba") return 114514;
                if (["shan", "tao", "jiu"].includes(card.name)) {
                    if (player.getEquip("zhangba") && player.countCards("hs") > 1) return 0.01;
                    return num / 2;
                }
                if (get.tag(card, "multitarget")) return num + game.players.length;
            },
            aiUseful(player, card, num) {
                if (card.name === "zhangba") return 114514;
                if (get.name(card, player) === "shan") {
                    if (
                        player.countCards("hs", i => {
                            if (card === i || (card.cards && card.cards.includes(i))) return false;
                            return get.name(i, player) === "shan";
                        })
                    )
                        return -1;
                    return num / Math.pow(Math.max(1, player.hp), 2);
                }
            },
        },
        trigger: {
            player: "useCardToPlayered",
        },
        usable: 3,
        locked: false,
        frequent: true,
        filter(event, player) {
            if (get.type(event.card) == "equip") return false;
            if (event.getParent().triggeredTargets3.length > 1) return false;
            return event.targets.length > 0 && !player.countCards("h", { type: "basic" });
        },
        content() {
            player.draw(trigger.targets.length);
        },
        ai: {
            presha: true,
            pretao: true,
            threaten: 1.8,
            effect: {
                player_use(card, player, target) {
                    if (
                        typeof card === "object" &&
                        card.name !== "shan" &&
                        get.type(card) !== "equip" &&
                        !player.countCards("h", i => {
                            if (card === i || (card.cards && card.cards.includes(i))) return false;
                            return get.type(i) === "basic";
                        })
                    ) {
                        let targets = [],
                            evt = _status.event.getParent("useCard");
                        targets.addArray(ui.selected.targets);
                        if (evt && evt.card == card) targets.addArray(evt.targets);
                        if (targets.length) return [1, targets.length];
                        if (get.tag(card, "multitarget")) return [1, game.players.length - 1];
                        return [1, 1];
                    }
                },
            },
        },
    },
    djleiji: {
        audio: "leiji",
        trigger: { player: ["useCard", "respond"] },
        filter(event, player) {
            return event.card.name == "shan";
        },
        preHidden: true,
        line: "thunder",
        async cost(event, trigger, player) {
            const next = player.chooseTarget(get.prompt2("djleiji")).setHiddenSkill(event.name.slice(0, -5));
            next.ai = function (target) {
                if (target.hasSkill("hongyan")) return 0;
                return get.damageEffect(target, _status.event.player, _status.event.player, "thunder");
            };
            event.result = await next.forResult();
        },
        async content(event, trigger, player) {
            const [target] = event.targets;
            const next = target.judge(function (card) {
                if (get.color(card) == "black") return -4;
                return 0;
            });
            next.judge2 = function (result) {
                return result.bool == false ? true : false;
            };
            const result = await next.forResult();
                    const bool = result.bool;
            if (bool == false) {
                await target.damage(1, "thunder");
                player.recover();
            }
        },
        ai: {
            mingzhi: false,
            useShan: true,
            effect: {
                target_use(card, player, target, current) {
                    if (
                        get.tag(card, "respondShan") &&
                        !player.hasSkillTag(
                            "directHit_ai",
                            true,
                            {
                                target: target,
                                card: card,
                            },
                            true
                        ) &&
                        game.hasPlayer(function (current) {
                            return get.attitude(target, current) < 0 && get.damageEffect(current, target, target, "thunder") > 0;
                        })
                    ) {
                        if (card.name === "sha") {
                            if (
                                !target.mayHaveShan(
                                    player,
                                    "use",
                                    target.getCards("h", i => {
                                        return i.hasGaintag("sha_notshan");
                                    })
                                )
                            )
                                return;
                        } else if (!target.mayHaveShan(player)) return 1 - 0.1 * Math.min(5, target.countCards("hs"));
                        if (!target.hasSkillTag("rejudge")) return [1, 1];
                        let pos = player.hasSkillTag("viewHandcard", null, target, true) ? "hes" : "e";
                        if (
                            target.hasCard(function (cardx) {
                                return get.color(cardx) === "black";
                            }, pos)
                        )
                            return [1, 4];
                        if (pos === "e") return [1, Math.min(4, 1 + 0.75 * Math.max(1, target.countCards("hs")))];
                        return [1, 1];
                    }
                },
            },
        },
    },
    mgmoce: {
        audio: 2,
        group: ['mgmoce1', 'mgmoce2', 'mgmoce3'],
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        frequent: true,
        preHidden: true,
        filter: function (event, player) {
            return player.phaseNumber < 3;
        },
        check: function (event, player) {
            return player.phaseNumber < 0;
        },
        content: function () {
            if (player.phaseNumber < 2) {
                player.addSkill('niepan');
                game.log(player, "获得了技能", "#y涅槃");
            }
            else player.draw(0);
        },
    },
    mgmoce1: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        filter: function (event, player) {
            return player.phaseNumber < 4;
        },
        check: function (event, player) {
            return player.phaseNumber < 0;
        },
        content: function () {
            if (player.phaseNumber < 3) {
                player.draw(0);
            }
            else player.addSkill('duanbi');
        },
    },
    mgmoce2: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        filter: function (event, player) {
            return player.phaseNumber < 6;
        },
        check: function (event, player) {
            return player.phaseNumber < 0;
        },
        content: function () {
            if (player.phaseNumber < 5) {
                player.draw(0);
            }
            else player.addSkill('xinfencheng');
        },
    },
    mgmoce3: {
        trigger: { player: 'phaseZhunbeiBegin' },
        forced: true,
        filter: function (event, player) {
            return player.phaseNumber < 8;
        },
        check: function (event, player) {
            return player.phaseNumber < 0;
        },
        content: function () {
            if (player.phaseNumber < 7) {
                player.draw(0);
            }
            else player.addSkill('mbjuejin');
        },
    },
    djlianying: {
        audio: "lianying",
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        frequent: true,
        usable: 5,
        filter(event, player) {
            if (player.countCards("h")) return false;
            const evt = event.getl(player);
            return evt && evt.player == player && evt.hs && evt.hs.length > 0;
        },
        async content(event, trigger, player) {
            player.draw();
        },
        ai: {
            threaten: 0.8,
            effect: {
                player_use(card, player, target) {
                    if (player.countCards("h") === 1) return [1, 0.8];
                },
                target(card, player, target) {
                    if (get.tag(card, "loseCard") && target.countCards("h") === 1) return 0.5;
                },
            },
            noh: true,
            skillTagFilter(player, tag) {
                if (tag == "noh") {
                    if (player.countCards("h") != 1) return false;
                }
            },
        },
    },
    lowyiran: {
        trigger: { player: 'damageBegin3' },
        filter: function (event, player) {
            if (player.getEquip(2)) return false;
            if (event.nature == 'fire') return true;
        },
        forced: true,
        check: function () {
            return false;
        },
        content: function () {
            trigger.num++;
        },
        ai: {
            effect: {
                target: function (card, player, target, current) {
                    if (target.getEquip(2)) return;
                    return lib.skill.tengjia2.ai.effect.target.apply(this, arguments);
                }
            }
        }
    },
    mgganku: {
        audio: 2,
        trigger: { player: "die" },
        forced: true,
        forceDie: true,
        filter(event) {
            return event.source && event.source.isIn();
        },
        logTarget: "source",
        skillAnimation: true,
        animationColor: "thunder",
        content() {
            trigger.source.addSkills("lowyiran");
        },
        ai: {
            threaten: 0.7,
        },
    },
    mghonglao: {
        audio: 2,
        trigger: {
            global: "phaseBefore",
            player: ["enterGame", "damageEnd"],
        },
        filter(event, player) {
            if (event.name == "damage") return event.num > 0;
            return event.name != "phase" || game.phaseNumber == 0;
        },
        /*getIndex(event, player) {
            return event.num || 1;
        },*/
        async cost(event, trigger, player) {
            if (trigger.name == "damage") {
                const list = ["shuiyanqijunx"];
                /*list.addArray(get.zhinangs());*/
                const {
                    result: { bool, links },
                } = await player.chooseButton([get.prompt(event.skill), [list, "vcard"]]).set("ai", button => {
                    if (button.link[2] == "shuiyanqijunx" && player.countCards("hs", "shuiyanqijunx") < 2) return 10;
                    return get.value({ name: button.link[2] });
                });
                event.result = {
                    bool: bool,
                    cost_data: links,
                };
            } else event.result = { bool: true };
        },
        async content(event, trigger, player) {
            if (trigger.name == "damage") {
                const name = event.cost_data[0][2];
                if (name == "shuiyanqijunx") {
                    if (!lib.inpile.includes("shuiyanqijunx")) lib.inpile.add("shuiyanqijunx");
                    if (!_status.shuiyanqijunx_suits) _status.shuiyanqijunx_suits = lib.suit.slice(0);
                    if (_status.shuiyanqijunx_suits.length) {
                        await player.gain(game.createCard2("shuiyanqijunx", _status.shuiyanqijunx_suits.randomRemove(), 5), "gain2");
                        await player.draw(0);
                    } else {
                        const card = get.cardPile(card => card.name == name);
                        if (card) await player.gain(card, "gain2");
                    }
                } else {
                    const card = get.cardPile(card => card.name == name);
                    if (card) await player.gain(card, "gain2");
                }
            } else {
                if (!lib.inpile.includes("shuiyanqijunx")) lib.inpile.add("shuiyanqijunx");
                if (!_status.shuiyanqijunx_suits) _status.shuiyanqijunx_suits = lib.suit.slice(0);
                const list = _status.shuiyanqijunx_suits.randomRemove(2).map(i => game.createCard2("shuiyanqijunx", i, 5));
                if (list.length) await player.gain(list, "gain2", "log");
            }
        },
    },
    djxiaoji: {
        audio: 2,
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        frequent: true,
        usable: 3,
        getIndex(event, player) {
            const evt = event.getl(player);
            if (evt && evt.player === player && evt.es) return evt.es.length;
            return false;
        },
        async content(event, trigger, player) {
            player.draw(2);
        },
        ai: {
            noe: true,
            reverseEquip: true,
            effect: {
                target(card, player, target, current) {
                    if (get.type(card) == "equip" && !get.cardtag(card, "gifts")) return [1, 3];
                },
            },
        },
    },
    txtiesuo: {
        audio: 2,
        trigger: { player: "phaseUseBegin" },
        //filter:function(event,player){
        //	return game.hasPlayer(function(current){
        //		return !current.isLinked();
        //	});
        //},
        direct: true,
        content() {
            "step 0";
            player
                .chooseTarget(
                    //function(card,player,target){
                    //	return !target.isLinked();
                    //},
                    "是否发动【铁索】横置或重置一名角色？"
                )
                .set("ai", function (target) {
                    return get.effect(target, { name: "tiesuo" }, _status.event.player, _status.event.player);
                });
            "step 1";
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill("txtiesuo", target);
                target.link();
            }
        },
        ai: {
            expose: 0.2,
        },
    },
    djtianyun: {
        trigger: { player: 'phaseEnd' },
        direct: true,
        content: function () {
            "step 0"
            event.forceDie = true;
            player.chooseTarget(get.prompt('djtianyun'), function (card, player, target) {
                return target.isEnemyOf(player);
            }).ai = function (target) {
                if (player.hp <= 0) return 0;
                if (get.attitude(player, target) > -3) return 0;
                var eff = get.damageEffect(target, player, player, 'fire');
                if (eff > 0) {
                    return eff + target.countCards('e') / 2;
                }
                return 0;
            }
            "step 1"
            if (result.bool) {
                player.logSkill('djtianyun', result.targets, 'fire');
                player.loseHp();
                event.target = result.targets[0];
            }
            else {
                event.finish();
            }
            "step 2"
            if (event.target) {
                event.target.damage(2, 'fire');
            }
            "step 3"
            if (event.target) {
                var es = event.target.getCards('e');
                if (es.length) {
                    event.target.discard(es);
                }
            }
        },
        ai: {
            threaten: 2
        }
    },
    lowhengduo: {
        trigger: {
            global: "gainEnd",
        },
        forced: true,
        usable: 1,
        filter: function (event, player, name) {
            var num = Math.random();
            return event.player != player && player.getEnemies().includes(event.player) && (event.animate == 'draw' || event.getParent().name == 'draw') && num <= 1.0 && event.player.countCards('he') > 0;
        },
        logTarget: 'player',
        content: function () {
            player.gainPlayerCard(trigger.player, true);
        },
        ai: {
            expose: 0.25,
            threaten: 1,
        },
    },
    mgmaogong1: {
        audio: 2,
        trigger: { global: "phaseZhunbeiBegin" },
        direct: true,
        filter(event, player) {
            return event.player.isIn() && lib.filter.targetEnabled({ name: "sha" }, player, event.player) && (player.hasSha() || (_status.connectMode && player.countCards("he") > 0));
        },
        clearTime: true,
        content() {
            player
                .chooseToUse(function (card, player, event) {
                    if (get.name(card) != "sha") return false;
                    return lib.filter.filterCard.apply(this, arguments);
                }, "冒攻：是否对" + get.translation(trigger.player) + "使用一张杀？")
                .set("logSkill", "mgmaogong1")
                .set("complexSelect", true)
                .set("filterTarget", function (card, player, target) {
                    if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) return false;
                    return lib.filter.targetEnabled.apply(this, arguments);
                })
                .set("sourcex", trigger.player)
                .set("oncard", function (card) {
                    try {
                        card.mgmaogong1_tag = true;
                    } catch (e) {
                        alert("发生了一个导致【冒攻】无法正常触发无视防具效果的错误。请关闭十周年UI/手杀ui等扩展以解决");
                    }
                });
        },
        ai: {
            unequip: true,
            unequip_ai: true,
            skillTagFilter(player, tag, arg) {
                if (tag == "unequip_ai") {
                    if (_status.event.getParent().name != "mgmaogong1") return false;
                } else if (!arg || !arg.card || !arg.card.mgmaogong1_tag) return false;
            },
        },
    },
    mgmaogong: {
        audio: 2,
        group: ["mgmaogong1"],
        enable: ["chooseToUse", "chooseToRespond"],
        filterCard(card, player) {
            return get.type(card) != "jiguan";
        },
        usable: 1,
        locked: false,
        viewAs: { name: "sha", storage: { mgmaogong: true } },
        viewAsFilter(player) {
            if (!player.countCards("hes", card => get.type(card) != "jiguan")) return false;
        },
        position: "hes",
        selectCard() {
            return _status.event.skill == "mgmaogong" ? 1 : Infinity;
        },
        precontent() {
            if (player != _status.currentPhase) {
                player
                    .when({ player: ["useCard", "respond"] })
                    .filter(evt => evt.skill == "mgmaogong")
                    .then(() => player.draw());
            }
            event.getParent().addCount = false;
        },
        prompt: "将一张非机关牌当杀使用或打出",
        check(card) {
            var val = get.value(card);
            if (_status.event.name == "chooseToRespond") return 1 / Math.max(0.1, val);
            return 6 - val;
        },
        ai: {
            order(item, player) {
                var target = _status.currentPhase;
                if (!target || target != player) return 7;
                return 1;
            },
            respondSha: true,
            skillTagFilter(player) {
                if (!player.countCards("hes", card => get.type(card) != "jiguan")) return false;
            },
        },
        mod: {
            targetInRange(card) {
                if (card.storage?.mgmaogong) return true;
            },
            cardUsable(card, player, num) {
                if (card.storage?.mgmaogong) return Infinity;
            },
        },
    },
    txwuwei: {
        mod: {
            targetEnabled: function (card, player, target) {
                if (get.type(card) == 'food') {
                    return false;
                }
            },
        },
        trigger: {
            player: ['phaseUseBegin'],
        },
        forced: true,
        audio: "ext:太虚幻境/audio/skill:true",
        group: "txwuwei2",
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了', event.triggername == 'phaseZhunbeiBefore' ? '用牌' : '出牌阶段');
        },
    },
    txwuwei2: {
        popup: false,
        trigger: {
            player: "phaseDrawBefore",
        },
        forced: true,
        content: function () {
            trigger.cancel();
            game.log(player, '跳过了摸牌阶段');
        },
    },
    txwuyong: {
        audio: 2,
        locked: true,
        subSkill: {
            discard: {
                trigger: {
                    player: "gainAfter",
                    global: ["phaseEnd", "loseAsyncAfter"]/*"phaseEnd" */
                },
                audio: "txwuyong",
                forced: true,
                filter(event, player) {
                    if (_status.currentPhase != player) {
                        var he = player.getCards("h");
                        var bool = false;
                        player.getHistory("gain", function (evt) {
                            if (!bool && evt && evt.cards) {
                                for (var i = 0; i < evt.cards.length; i++) {
                                    if (he.includes(evt.cards[i])) bool = true;
                                    break;
                                }
                            }
                        });
                        return bool;
                    }
                    return false;
                },
                content() {
                    var he = player.getCards("h");
                    var list = [];
                    player.getHistory("gain", function (evt) {
                        if (evt && evt.cards) {
                            for (var i = 0; i < evt.cards.length; i++) {
                                if (he.includes(evt.cards[i])) list.add(evt.cards[i]);
                            }
                        }
                    });
                    player.$throw(list, 1000);
                    player.lose(list, ui.discardPile, "visible");
                    game.log(player, "将", list, "置入弃牌堆");
                },
            },
            mark: {
                trigger: {
                    player: "gainBegin",
                    global: "phaseBeginStart",
                },
                silent: true,
                filter(event, player) {
                    return event.name != "gain" || player != _status.currentPhase;
                },
                content() {
                    if (trigger.name == "gain") trigger.gaintag.add("txwuyong");
                    else player.removeGaintag("txwuyong");
                },
            },
            draw: {
                trigger: {
                    player: "gainAfter",
                    global: "loseAsyncAfter",
                },
                audio: "txwuyong",
                forced: true,
                filter(event, player) {
                    if (_status.currentPhase != player || event.getg(player).length == 0) return false;
                    return event.getParent(2).name != "txwuyong_draw";
                },
                content() {
                    player.draw("nodelay");
                },
            },
        },
        ai: {
            threaten: 1.2,
            nogain: 1,
            skillTagFilter(player) {
                return player != _status.currentPhase;
            },
        },
        group: ["txwuyong_draw", "txwuyong_discard", "txwuyong_mark"],
    },
    mghonglei: {
        audio: "leiji",
        trigger: { player: 'phaseUseEnd' },
        forced: true,
        filter: function (event, player) {
            if (_status.mode != 'taixuhuanjing') return false;
            var players = game.filterPlayer();
            for (var i = 0; i < players.length; i++) {
                if (players[i].isEnemyOf(player)) {
                    return true;
                }
            }
        },
        content: function () {
            var target = game.findPlayer(function (current) {
                return current.isEnemyOf(player);
            });
            if (target) {
                player.line(target, 'thunder');
                target.damage(Math.random() > 0.4 ? 2 : 3, 'thunder');
            }
        },
        ai: {
            threaten: function (player, target) {
                if (_status.mode == 'taixuhuanjing') {
                    for (var i = 0; i < game.players.length; i++) {
                        if (game.players[i].isEnemyOf(target)) {
                            return 2;
                        }
                    }
                }
                return 1;
            }
        }
    },
    lowtianyun: {
        trigger: { player: 'phaseEnd' },
        direct: true,
        content: function () {
            "step 0"
            event.forceDie = true;
            player.chooseTarget(get.prompt('lowtianyun'), function (card, player, target) {
                return target.isEnemyOf(player);
            }).ai = function (target) {
                if (player.hp <= 0) return 0;
                if (get.attitude(player, target) > -3) return 0;
                var eff = get.damageEffect(target, player, player, 'fire');
                if (eff > 0) {
                    return eff + target.countCards('e') / 2;
                }
                return 0;
            }
            "step 1"
            if (result.bool) {
                player.logSkill('lowtianyun', result.targets, 'fire');
                player.loseHp();
                event.target = result.targets[0];
            }
            else {
                event.finish();
            }
            "step 2"
            if (event.target) {
                event.target.damage(Math.random() > 0.4 ? 1 : 2, 'fire');
            }
            "step 3"
            if (event.target) {
                var es = event.target.getCards('e');
                if (es.length) {
                    event.target.discard(es);
                }
            }
        },
        ai: {
            threaten: 2
        }
    },
    txhj_mengjin: {
        trigger: {
            player: "shaBegin",
        },
        filter: function (event, player) {
            return event.target.countCards("he") > 0;
        },
        direct: true,
        content: async function (event, trigger, player) {
            var att = get.attitude(player, trigger.target);
            let result = await player.choosePlayerCard(get.prompt("spmengjin", trigger.target), "he", trigger.target).set('ai', (button) => {
                var val = get.buttonValue(button);
                if (att > 0) return -val;
                return val;
            }).forResult();
            if (result.bool) {
                await trigger.target.discard(result.links);
                player.logSkill("txhj_mengjin", trigger.target);
            }
        },
        ai: {
            expose: 0.2,
        },
        "_priority": 0,
    },

    txhj_fenhuan: {
        trigger: {
            player: ['dying', 'damageEnd']
        },
        usable: 1,
        frequent: true,
        filter: function (event, player) {
            return event.name === 'damage' ? player.hasSkill('txhj_fenhuan_from') : true;
        },
        content: async function (event, trigger, player) {
            if (trigger.name === 'damage') {
                trigger.num = Math.ceil(trigger.num / 2);
                return;
            } else {
                await player.recoverTo(1);
                player.addTempSkill('txhj_fenhuan_from');
            }
        },
        subSkill: {
            'from': {
                mod: {
                    globalTo(from, to, current) {
                        let num = 2 * game.countPlayer(function (current) {
                            return current.isIn()
                        });
                        return current + num;
                    },
                },
            }
        }
    },

    //乱世枭雄
    "txhj_shefeng": {
        trigger: {
            player: "gainAfter",
            global: "loseAsyncAfter",
        },
        init: function (player) {
            player.storage.txhj_shefeng = [1, 2, 3, 4];
        },
        filter: function (event, player) {
            const storage = player.storage.txhj_shefeng;
            if (!player.countCards("hes") || !event.source?.isIn() || _status.currentPhase != player) return false;
            if (!Array.isArray(storage) && player.countCards("hes") < storage) return false;
            if (Array.isArray(storage) && !storage.some(i => i <= player.countCards("hes"))) return false;
            return true;
        },
        check: function (event, player) {
            if (!event.source) return false;
            return get.attitude(player, event.source) < 0 && get.effect(event.source, { name: 'sha' }, player, player) > 0;
        },
        frequent: "check",
        cost: async function (event, trigger, player) {
            const storage = player.storage.txhj_shefeng;
            if (!Array.isArray(storage)) {
                event.result = {
                    bool: true,
                    cost_data: storage,
                };
                return;
            }
            const result = await player.chooseNumbers("枭雄:请选择x的值", [storage.filter(n => n <= player.countCards("hes"))]).set("processAI", function () {
                const player = get.event().player;
                const storage = player.storage.txhj_shefeng;
                const maxValue = Math.max.apply(null, storage.filter(i => i <= player.countCards("hes")));
                return [maxValue];
            }).forResult();
            if (!result.bool) return;
            let num = result.numbers[0];
            storage.remove(num);
            if (storage.length == 0) player.storage.txhj_shefeng = num;
            event.result = {
                bool: result.bool,
                cost_data: num,
            };
        },
        content: async function (event, trigger, player) {
            let { cost_data: num } = event;
            if (num) {
                await player.chooseToDiscard('hes', get.prompt2(event.name), num, true).set('ai', function (card) {
                    return 10 - get.value(card);
                }).forResult();
                while (num--) {
                    if (!trigger.source.isIn()) break;
                    await player.useCard({ name: "sha" }, trigger.source, "noai");
                }
            }
        },
    },
    "txhj_weifu": {
        trigger: {
            player: "useCardAfter",
        },
        init: function (player) {
            player.storage.txhj_weifu = [1, 2, 3];
        },
        filter: function (event, player) {
            return event.card && get.tag(event.card, "damage") && event.targets && event.targets?.length > 0;
        },
        check: function (event, player) {
            if (!event.targets) return false;
            for (const target of event.targets) {
                if (get.attitude(player, target) < 0) return true;
            }
            return false;
        },
        frequent: "check",
        cost: async function (event, trigger, player) {
            const storage = player.storage.txhj_weifu;
            if (!Array.isArray(storage)) {
                event.result = {
                    bool: true,
                    cost_data: storage,
                };
                return;
            }
            const result = await player.chooseNumbers("枭雄:请选择x的值", [storage]).set("processAI", function () {
                const player = get.event().player;
                const storage = player.storage.txhj_weifu;
                if (storage.includes(trigger.targets.length) && trigger.targets.length != 1) return [trigger.targets.length];
                const maxValue = Math.max.apply(null, storage);
                return [maxValue];
            }).forResult();
            if (!result.bool) return;
            let num = result.numbers[0];
            storage.remove(num);
            if (storage.length == 0) player.storage.txhj_weifu = num;
            event.result = {
                bool: result.bool,
                cost_data: num,
            };
        },
        content: async function (event, trigger, player) {
            const { cost_data: num } = event;
            let num2 = 0;
            for (const target of trigger.targets) {
                const card = await player.randomGain(target, "he", true);
                if (!!card) num2++
            }
            if (num2 >= num) {
                if (trigger.targets.length > 1) {
                    const result = await player.chooseTarget(`选择一名角色,令其失去${num}点体力`, function (card, player, target) {
                        const targets = get.event().targets;
                        return targets.includes(target);
                    }, true).set('ai', function (target) {
                        return -get.attitude(player, target);
                    }).set("targets", trigger.targets).forResult();
                    const targets = result.targets;
                    if (!targets || !targets.length) return;
                    await targets[0].loseHp(num);
                } else {
                    await trigger.targets[0].loseHp(num);
                }
            }
        },
    },
    "txhj_yanyi": {
        trigger: {
            global: "useCardAfter",
        },
        init: function (player) {
            player.storage.txhj_yanyi = [1, 2, 3];
        },
        filter: function (event, player) {
            if (!event.card || !get.tag(event.card, "damage") || !event.targets?.includes(player)) return false;
            const storage = player.storage.txhj_yanyi;
            const damage = player.getHistory("damage", evt => {
                return evt.card == event.card;
            }).length;
            if (!Array.isArray(storage) && player.countCards("hes", { color: "black" }) < storage) return false;
            if (Array.isArray(storage) && !storage.some(i => i <= player.countCards("hes", { color: "black" }))) return false;
            return player.countCards("hes", { color: "black" }) > 0 && damage == 0;
        },
        check: function (event, player) {
            if (!event.player) return false;
            return get.attitude(player, event.player) < 0;
        },
        frequent: "check",
        cost: async function (event, trigger, player) {
            const storage = player.storage.txhj_yanyi;
            if (!Array.isArray(storage)) {
                event.result = {
                    bool: true,
                    cost_data: storage,
                };
                return;
            }
            const result = await player.chooseNumbers("枭雄:请选择x的值", [storage.filter(n => n <= player.countCards("hes", { color: "black" }))]).set("processAI", function () {
                const player = get.event().player;
                const storage = player.storage.txhj_yanyi;
                const num = player.countCards("hes", { color: "black" });
                const minValue = Math.min.apply(null, storage);
                if (storage.includes(1) && num >= 1) return [1];
                return [minValue];
            }).forResult();
            if (!result.bool) return;
            let num = result.numbers[0];
            storage.remove(num);
            if (storage.length == 0) player.storage.txhj_yanyi = num;
            event.result = {
                bool: result.bool,
                cost_data: num,
            };
        },
        content: async function (event, trigger, player) {
            const { cost_data: num } = event;
            const result = await player.chooseCard("hes", true, `将${num}张黑色牌交给` + get.translation(trigger.player), num, function (card, player, target) {
                return get.color(card) == "black";
            }).set('ai', function (card) {
                return 8 - get.value(card);
            }).forResult();
            const cards = result.cards;
            if (!cards || !cards.length) return;
            await player.give(cards, trigger.player);
            await trigger.player.damage(cards.length);
        }
    },
    "txhj_quanyi": {
        trigger: {
            player: "useCardAfter",
        },
        init: function (player) {
            player.storage.txhj_quanyi = [1, 2, 3];
        },
        filter: function (event, player) {
            return _status.currentPhase != player;
        },
        check: function (event, player) {
            return true;
        },
        frequent: "check",
        cost: async function (event, trigger, player) {
            const storage = player.storage.txhj_quanyi;
            if (!Array.isArray(storage)) {
                event.result = {
                    bool: true,
                    cost_data: storage,
                };
                return;
            }
            const result = await player.chooseNumbers("枭雄:请选择x的值", [storage]).set("processAI", function () {
                const player = get.event().player;
                const storage = player.storage.txhj_quanyi;
                const minValue = Math.min.apply(null, storage);
                return [minValue];
            }).forResult();
            if (!result.bool) return;
            let num = result.numbers[0];
            storage.remove(num);
            if (storage.length == 0) player.storage.txhj_quanyi = num;
            event.result = {
                bool: result.bool,
                cost_data: num,
            };
        },
        content: async function (event, trigger, player) {
            const { cost_data: num } = event;
            const result = await player.chooseTarget(`将此牌交给一名其他角色，然后你获得其${num}张手牌`, lib.filter.notMe, true).set('ai', function (target) {
                return get.value(get.event().card) > 5 ? get.attitude(player, target) : -get.attitude(player, target);
            }).set("card", trigger.card).forResult();
            const targets = result.targets;
            if (!targets || !targets.length) return;
            await targets[0].gain(trigger.cards, "gain2");
            const result2 = await player.gainPlayerCard(targets[0], "h", num, true).forResult();
            const cards = result2.cards;
            if (!cards || !cards.length) return;
            player.addGaintag(cards, "txhj_quanyi");
            player.storage.txhj_quanyitar = targets[0];
            player.when({ global: "phaseJieshuBegin" })
                .filter((evt, p) => p.hasCard(card => {
                    return card.hasGaintag("txhj_quanyi");
                }, "h"))
                .then(() => {
                    let cards = player.getCards("h", card => {
                        return card.hasGaintag("txhj_quanyi");
                    });
                    player.give(cards, player.storage.txhj_quanyitar);
                    delete player.storage.txhj_quanyitar;
                });
        }
    },
    "txhj_baice": {
        enable: "phaseUse",
        init: function (player) {
            player.storage.txhj_baice = [1, 2, 3];
        },
        filter: function (event, player) {
            return !player.hasSkill("txhj_baice_eff");
        },
        content: async function (event, trigger, player) {
            const storage = player.storage.txhj_baice;
            let num = 0
            if (!Array.isArray(storage)) {
                num = storage;
            } else {
                const result = await player.chooseNumbers("枭雄:请选择x的值", [storage]).set("processAI", function () {
                    const player = get.event().player;
                    const storage = player.storage.txhj_baice;
                    const maxValue = Math.max.apply(null, storage);
                    return [maxValue];
                }).forResult();
                if (!result.bool) return;
                num = result.numbers[0];
                storage.remove(num);
                if (storage.length == 0) player.storage.txhj_baice = num;
            }
            const name = 'txhj_baice_effect';
            const result2 = await player.chooseToDiscard(num, "h", get.prompt2(event.name), num, true).set('ai', function (card) {
                if (get.tag(card, "damage")) {
                    return 6 - get.value(card);
                }
                if (card.name == "tao") {
                    return 5 - get.value(card);
                }
                return 10 - get.value(card);
            }).forResult();
            if (!result2 || !result2.bool) return;
            const cardh = player.getCards("h", card => get.tag(card, "damage") || card.name == "tao");
            if (!cardh.length) return;
            while (num--) {
                const card = cardh.randomGet();
                let tag = card.gaintag?.find(tag => tag.startsWith(name));
                if (tag) {
                    player.removeGaintag(tag, [card]);
                }
                let tagName;
                if (tag && tag.length > name.length) {
                    const suffix = parseInt(tag.slice(name.length));
                    if (!isNaN(suffix)) {
                        tagName = name + (suffix + 1);
                    } else {
                        tagName = "txhj_baice_effect1";
                    }
                } else {
                    tagName = "txhj_baice_effect1";
                }
                if (!lib.skill[tagName]) {
                    game.broadcastAll(
                        (tag, str) => {
                            lib.skill[tag] = {};
                            lib.translate[tag] = "百策+" + str;
                        },
                        tagName,
                        tagName.slice(name.length)
                    );
                }
                player.addGaintag([card], tagName);
            }
        },
        group: ["txhj_baice_effect", "txhj_baice_lose"],
        subSkill: {
            eff: {
                charlotte: true,
            },
            lose: {
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                filter: function (event, player) {
                    var evt = event.getl(player);
                    return _status.currentPhase == player && evt && evt.hs && evt.hs.length > 0 && player.countCards("h") < player.hp && !player.hasSkill("txhj_baice_eff");
                },
                forced: true,
                charlotte: true,
                popup: false,
                content: function () {
                    player.addTempSkill("txhj_baice_eff", "phaseAfter");
                },
            },
            effect: {
                charlotte: true,
                trigger: {
                    source: ["damageBegin1", "recoverBefore"],
                },
                filter(event, player) {
                    if (!event.card) {
                        return false;
                    }
                    const evt = event.getParent("useCard");
                    if (!evt || evt.card !== event.card || evt.cards?.length !== 1) {
                        return false;
                    }
                    return player.hasHistory(
                        "lose",
                        evtx =>
                            evtx.getParent() === evt &&
                            Object.keys(evtx.gaintag_map).some(i => {
                                return evtx.gaintag_map[i].some(tag => tag.startsWith("txhj_baice_effect"));
                            })
                    );
                },
                forced: true,
                logTarget: "player",
                content() {
                    const name = "txhj_baice_effect",
                        evt = trigger.getParent("useCard");
                    const evtx = player.getHistory(
                        "lose",
                        evtx =>
                            evtx.getParent() === evt &&
                            Object.keys(evtx.gaintag_map).some(i => {
                                return evtx.gaintag_map[i].some(tag => tag.startsWith(name));
                            })
                    )[0];
                    const num = Object.keys(evtx.gaintag_map).reduce((sum, i) => {
                        const tag = evtx.gaintag_map[i].find(tag => tag.startsWith(name));
                        if (tag) {
                            sum += parseInt(tag.slice(name.length));
                        }
                        return sum;
                    }, 0);
                    trigger.num += num;
                },
            },
        },
        mod: {
            aiValue(player, card, num) {
                const name = "txhj_baice_effect";
                const tag = card.gaintag?.find(tag => tag.startsWith(name));
                const num2 = tag ? parseInt(tag.slice(name.length)) : 0;
                return num + num2;
            },
            aiUseful() {
                return lib.skill.txhj_baice.mod.aiValue.apply(this, arguments);
            },
        },
        ai: {
            order() {
                return get.order({ name: "shunshou" }) - 0.1;
            },
            effect: {
                player: function (card, player, target) {
                    const name = "txhj_baice_effect";
                    const tag = card?.cards?.[0]?.gaintag?.find(tag => tag.startsWith(name));
                    const num = tag ? parseInt(tag.slice(name.length)) : 0;
                    if (tag) {
                        if (get.tag(card, "damage") || get.name == "tao" && player.getDamagedHp(true) >= 2 || _status.dying.some(p => p.isEnemiesOf(player))) return [1 + num, 0];
                    }
                },
            },
            result: {
                player: function (player, target, skill) {
                    const storage = player.storage.txhj_baice;
                    const num = Array.isArray(storage) ? Math.max.apply(null, storage) : storage;
                    if (((player?.countCards("h", "tao") && (player?.getDamagedHp(true) >= 2) || player?.countCards("h", c => get.tag(c, "damage")))) && player.countCards('h') - num > player.maxHp && player.countCards('h', c => get.value(c) <= 4)) return 1;
                }
            },
        },
    },
    txhj_jizhi: {
        audio: ["jizhi"],
        trigger: {
            player: "useCard",
        },
        frequent: true,
        preHidden: true,
        filter(event) {
            return get.type(event.card) == "trick";
        },
        async content(event, trigger, player) {
            player.draw();
        },
        ai: {
            threaten: 1.4,
            noautowuxie: true,
        },
    },
    txhj_duanjin: {
        trigger: {
            source: "damageBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            await player.draw(Math.min(5, player.getStat("damage")));
            await player.recover();
        },
        ai: {
            threaten: 1.4,
        },
    },
    txhj_xiongqu: {
        init(player) {
            player.storage.txhj_xiongqu = [1, 2];
        },
        enable: "phaseUse",
        usable: 1,
        filter: function (event, player) {
            return game.hasPlayer(p => p != player && p.countCards('he') > 0);
        },
        contentBefore: async function (event, trigger, player) {
            const storage = player.storage.txhj_xiongqu;
            if (!Array.isArray(storage)) {
                event.getParent().result = {
                    bool: true,
                    cost_data: storage,
                };
                return;
            }
            const result = await player.chooseNumbers("枭雄:请选择x的值", [storage]).set("processAI", function () {
                const player = get.event().player;
                const storage = player.storage.txhj_xiongqu;
                const minValue = Math.min.apply(null, storage);
                return [minValue];
            }).forResult();
            if (!result.bool) {
                delete player.getStat("skill").txhj_xiongqu;
                return;
            }
            let num = result.numbers[0];
            storage.remove(num);
            if (storage.length == 0) player.storage.txhj_xiongqu = num;
            event.getParent().result = {
                bool: result.bool,
                cost_data: num,
            };
        },
        content: async function (event, trigger, player) {
            if (!event.getParent()?.result?.bool) return;
            const { cost_data: num } = event.getParent().result;
            const result = await player.chooseTarget(`弃置其 ${num} 张牌，然后若其手牌数大于你，你对其造成 1 点伤害`, true).set('ai', function (target) {
                const player = get.event().player;
                return get.damageEffect(target, player, player);
            }).forResult();
            if (!result.targets || !result.targets.length) return;
            const result2 = await player.discardPlayerCard("he", targets[0], num, true).forResult();
            if (!result2 || !result2.bool) return;
            if (result.targets[0].countCards("h") > player.countCards("h")) {
                await result.targets[0].damage();
            }
        },
        ai: {
            order: 10,
            result: {
                player: 1,
            },
            threaten: 1.3,
        },
    },
    txhj_yinwei: {
        trigger: {
            global: 'damageEnd',
        },
        filter: function (event, player) {
            return event.player != player && _status.currentPhase != player && event.getParent('txhj_yinwei').name != 'txhj_yinwei' && event.player.isEnemiesOf(player);
        },
        forced: true,
        content: async function (event, trigger, player) {
            await trigger.player.damage(player.getFriends(true).length);
            let dying = trigger.player.getHistory("damage", function (evt) {
                return evt.getParent('txhj_yinwei') == event && evt._dyinged;
            }).length;
            if (dying) {
                trigger.player.addTempSkill("fengyin", { player: "phaseAfter" });
            }
        },
    },

};

export default skill;