import { lib, game, ui, get, ai, _status } from "../../noname.js";

import content from './js/content.js';
import precontent from './js/precontent.js';
import skill from './js/skill.js';
import translate from './js/translate.js';
import initCsrank from './js/extension_csrank.js';
import framework from './js/extension_framework.js';
export const type = "extension";
export default function () {
    window.txhjPack = {};
    window.txhj = {};
    txhj.isInitCardPileTx = ![];
    txhjPack.path = lib.assetURL + 'extension/太虚幻境';
    lib.init.css(txhjPack.path, 'extension_style');
    lib.init.css(txhjPack.path, 'extension_servant');
    lib.group.push('daqin');
    lib.translate.daqin = '秦';
    lib.groupnature.daqin = 'soil';
    lib.group.push('han');
    lib.translate.han = '汉';
    lib.groupnature.han = 'soil';
    if (lib.config['extension_' + '太虚幻境' + '_enable']) {
        lib.txhjExten = [];
        window.txhjModeImport = function (func) {
            lib.txhjExten.push(func);
        };
        framework();
    } else {
        return {
            name: "太虚幻境",
            editable: false,
            content: function () {
            },
            precontent: function () {
            },
            config: {},
            package: {
                intro: ""
                    + "开发版：2.0.5.5",
                author: "太虚幻境攻坚小分队",
                diskURL: "",
                forumURL: "",
                version: "2.0.5.5",
            },
        }
    }
    //昵称修复
    initCsrank();
    return {
        name: "太虚幻境",
        editable: false,
        arenaReady: function () {

        }, content: function (config, pack) {
            content(config, pack);
        }, prepare: function () {

        }, precontent: precontent,
        config: {}, help: {}, package: {
            character: {
                character: {
                },
                translate: {
                },
            },
            card: {
                card: {
                },
                translate: {
                },
                list: [],
            },
            skill: {
                skill: skill,
                translate: translate,
            },
            intro: "" + "开发版：2.0.5.5",
            author: "太虚幻境攻坚小分队",
            diskURL: "",
            forumURL: "",
            version: "2.0.5.5",
        }, files: { "character": [], "card": [], "skill": [], "audio": [] }, connect: false
    }

};