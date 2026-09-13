import { lib, game, ui, get, ai, _status } from "../../../noname.js";

export default function (config, pack) {
    delete lib.extensionMenu['extension_太虚幻境'].delete;
    lib.extensionMenu['extension_太虚幻境'].author = {
        name: '制作组：太虚幻境攻坚小分队',
        clear: true,
        nopointer: true,
    };
    lib.group.push('daqin');
    lib.translate.daqin = '秦';
    lib.groupnature.daqin = 'soil';
    lib.group.push('han');
    lib.translate.han = '汉';
    lib.groupnature.han = 'soil';
    //---------制作小组-------//
    lib.extensionMenu.extension_太虚幻境.chengyuan3 = {
        "name": '<div class="hth_menu">后期魔改开发组▶</div>',
        "clear": true,
        "onclick": function () {
            if (this.txhj_more == undefined) {
                var more = ui.create.div('.txhj_more',
                    '<div style="text-align:left"><font size=3px>' +
                    '<br>【侍灵兼技能buff、特效】：EngJ.K' +
                    '<br>【技能补充+搬运源】：烟雨墨染#《活动Boss》扩展' +
                    '<br>【代码摸鱼】：GfNin' +
                    '<br>【指导顾问+扩展宣传】：娃闻名止啼，吾氪十万休' +
                    '<br>【技能池兼优化整理】：某个不为人知的萌新' +
                    '<br>【魔改缝合】：冬致夏陌' +
                    '<br>【魔改标题素材】：行者' +
                    '<br>【鲲鹏代码提供】：關於' +
                    '<br>【海外新官方buff代码书写】：小数点（对方最近和你有互动，加好友了解更多        .）' +
                    '<br>【太虚视频流程素材提供】：B站#阿尔卡那愚者Joker' +
                    '<br>【扩展兼容适配】：喜欢到处逛的萌新' +
                    '</font></div>');
                this.parentNode.insertBefore(more, this.nextSibling);
                this.txhj_more = more;
                this.innerHTML = '<div class="hth_menu">后期魔改开发组▼</div>';
            }
            else {
                this.parentNode.removeChild(this.txhj_more);
                delete this.txhj_more;
                this.innerHTML = '<div class="hth_menu">后期魔改开发组▶</div>';
            };
        },
    };
    // 覆盖 $equip 函数
   /* var _playerProto = lib.element.Player.prototype;
    var originalEquip = _playerProto.$equip;
    _playerProto.$equip = function (card) {
        if (get.mode() === "taixuhuanjing") {
            if (!card || !this) return;
            game.broadcast(
                function (player, card) {
                    player.$equip(card);
                },
                this,
                card
            );
            var validNode = this.node.equips.childNodes[i];
            if (!validNode) {
                return;
            }
            if (typeof card.fix === 'function') {
                card.fix();
            }
            if (card.style) {
                card.style.transform = "";
                card.classList.remove("drawinghidden");
                delete card._transform;
            }
            var player = this;
            var equipNum = get.equipNum(card);
            var equipped = false;
            if (player.node.equips) {
                for (var i = 0; i < player.node.equips.childNodes.length; i++) {
                    if (get.equipNum(player.node.equips.childNodes[i]) >= equipNum) {
                        if (player.node.equips.childNodes[i] === validNode) {
                            player.node.equips.insertBefore(card, player.node.equips.childNodes[i + 1] || player.node.equips.lastChild);
                        } else {
                            player.node.equips.insertBefore(card, validNode);
                        }
                        equipped = true;
                        break;
                    }
                }
                if (!equipped) {
                    player.node.equips.appendChild(card);
                    if (_status.discarded) {
                        _status.discarded.remove(card);
                    }
                }
            }
            var info = get.info(card);
            if (info && info.skills) {
                for (var i = 0; i < info.skills.length; i++) {
                    player.addSkillTrigger(info.skills[i]);
                }
            }
            return player;
        } else {
            originalEquip.call(this, card);
        }
    };*/

    lib.extensionMenu.extension_太虚幻境.chengyuan2 = {
        "name": '<div class="hth_menu">二期开发组▶</div>',
        "clear": true,
        "onclick": function () {
            if (this.txhj_more == undefined) {
                var more = ui.create.div('.txhj_more',
                    '<div style="text-align:left"><font size=3px>' +
                    '<br>【技能、祝福】：无中一无中' +
                    '<br>【侍灵、特效】：EngJ.K' +
                    '<br>【技能创作】：铝宝' +
                    '<br>【机制整合】：糖送' +
                    '<br>【摸鱼大佬】：咸鱼' +
                    '<br>【资料整理】：紫乔' +
                    '</font></div>');
                this.parentNode.insertBefore(more, this.nextSibling);
                this.txhj_more = more;
                this.innerHTML = '<div class="hth_menu">二期开发组▼</div>';
            }
            else {
                this.parentNode.removeChild(this.txhj_more);
                delete this.txhj_more;
                this.innerHTML = '<div class="hth_menu">二期开发组▶</div>';
            };
        },
    };
    lib.extensionMenu.extension_太虚幻境.chengyuan1 = {
        "name": '<div class="hth_menu">一期开发组▶</div>',
        "clear": true,
        "onclick": function () {
            if (this.txhj_more == undefined) {
                var more = ui.create.div('.txhj_more',
                    '<div style="text-align:left"><font size=3px>' +
                    '<br>【技能、祝福】：无中一无中' +
                    '<br>【侍灵、特效】：EngJ.K' +
                    '<br>【卡牌、装备】：零二' +
                    '<br>【勤务、测试】：远道' +
                    '<br>【素材、文案】：喋血长歌' +
                    '<br>【技术支持】：Helasisy' +
                    '<br>【技术顾问】：俺杀' +
                    '<br>【机制整合】：糖送盐萌青' +
                    '<br>【摸鱼大佬】：咸鱼大佬' +
                    '</font></div>');
                this.parentNode.insertBefore(more, this.nextSibling);
                this.txhj_more = more;
                this.innerHTML = '<div class="hth_menu">一期开发组▼</div>';
            }
            else {
                this.parentNode.removeChild(this.txhj_more);
                delete this.txhj_more;
                this.innerHTML = '<div class="hth_menu">一期开发组▶</div>';
            };
        },
    };
    //--------------------------// 

    if (get.mode() != 'taixuhuanjing') {
        if (lib.config.cards.includes('太虚幻境')) {
            lib.config.cards.remove('太虚幻境');
        }
        if (lib.config.all.cards.includes('太虚幻境')) {
            lib.config.all.cards.remove('太虚幻境');
        }
        for (var i in lib.card) {
            if (i.indexOf('txhj_') != -1) {
                delete lib.card[i];
            }
        }
        delete lib.characterPack.mode_extension_太虚幻境;
    } else {
        if (lib.config['extension_EngEX_enable']) {
            var check = 0;
            if (lib.config['extension_EngEX_SSServant']) {
                game.saveConfig('extension_EngEX_SSServant', false);
                check++;
            }
            if (lib.config['extension_EngEX_shop']) {
                game.saveConfig('extension_EngEX_shop', false);
                check++;
            }
            if (check > 0) {
                game.reload();
            }
        }
        if (lib.config['extension_十周年UI_enable']) {
            if (!lib.config['extension_十周年UI_rightLayout']) {
                game.saveConfig('extension_十周年UI_rightLayout', true);
                game.reload();
            }
        }
        if (!lib.config.dev) game.saveConfig('dev', true);
        lib.cheat.i();
        if (!lib.txhjExten) lib.txhjExten = [];
        lib.txhjExten.forEach(item => item(lib, game, ui, get, ai, _status, config));
        /*非专属模式屏蔽武将/卡牌包*/
        /* if (get.mode() != 'taixuhuanjing') {
             if (lib.config.cards.includes('太虚幻境')) {
                 lib.config.cards.remove('太虚幻境');
             }
             if (lib.config.all.cards.includes('太虚幻境')) {
                 lib.config.all.cards.remove('太虚幻境');
             }
             for (var i in lib.card){
                 if (i.indexOf('txhj_')!=-1) {
                     delete lib.card[i];
                 }
             }
             delete lib.characterPack.mode_extension_太虚幻境;
         } else {
             if (lib.config['extension_EngEX_enable']) {
                 var check = 0;
                 if (lib.config['extension_EngEX_SSServant']) {
                     game.saveConfig('extension_EngEX_SSServant', false);
                     check++;
                 }
                 if (lib.config['extension_EngEX_shop']) {
                     game.saveConfig('extension_EngEX_shop', false);
                     check++;
                 }
                 if (check > 0) {
                     game.reload();
                 }
             }
             if (lib.config['extension_十周年UI_enable']) {
                 if (!lib.config['extension_十周年UI_rightLayout']) {
                     game.saveConfig('extension_十周年UI_rightLayout', true);
                     game.reload();
                 }
             }
             if (!lib.config.dev) game.saveConfig('dev', true);
             lib.cheat.i();
             lib.txhjExten.forEach(item => item(lib, game, ui, get, ai, _status, config)); */
        /*将素材复制到十周年*/
        /*if (game.getFileList) {
            game.getFileList('extension/太虚幻境/copy/decadeUI', function (folders, files) {
                if (folders) {
                    var arr1 = Array.from(folders);
                    arr1.forEach(function (s) {
                        var path = 'extension/太虚幻境/copy/decadeUI/' + s;
                        (function (path, foldername) {
                            game.getFileList(path, function (folders, files) {
                                if (files) {
                                    var arr = Array.from(files);
                                    arr.forEach(function (j) {
                                        (function () {
                                            game.ensureDirectory('extension/十周年UI/image/' + foldername, function () { });
                                            game.readFile(path + '/' + j, function (data) {
                                                game.writeFile(data, 'extension/十周年UI/image/' + foldername, j, function () {
                                                    game.removeFile(path + '/' + j);
                                                });
                                            });
                                        })(j);
                                    });
                                }
                            });
                        })(path, s);
                    });
                }
            });
        }*/
        /*赛季名称*/
        window.seasonPacks = [];
        lib.translate['ChongYingChuLin'] = '初涉幻境';
        game.txhj_checkFileExist('extension/太虚幻境/dlc', function (s) {
            if (s && game.getFileList) {
                game.getFileList('extension/太虚幻境/dlc', function (folders, files) {
                    if (folders) {
                        for (var s of folders) {
                            if (lib.translate[s]) {
                                seasonPacks.push(s);
                            }
                        }
                    }
                });
            };
        });
    };
    console.log('太虚幻境完成加载');
};
