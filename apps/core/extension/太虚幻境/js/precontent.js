import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import initCardPacks from "./extension_card.js";
import initNPCPack from "./extension_character.js";


const precontent = async function () {
    lib.poptip.add({
        id: "txhj_xiaoxiong",
        name: "枭雄",
        info: `枭雄技是一种特殊的技能。技能描述通常包含"枭雄技(Y)"。<br>1.发动技能时,你可以自己选择技能效果描述中的X的值(最大为Y)。<br>2.发动技能后,你本次选择的Y值不可再次被选择。<br>3.当第Y次发动技能后,该技能X的值永久固定为本次选择的Y值。`,
    })
    game.import('character', initNPCPack)
    game.import('card', initCardPacks);
    /**
   * 检查图片文件是否存在
   * @param {string} group - 分组名称（拼接路径用）
   * @returns {Promise<boolean>} - 文件存在返回true，不存在返回false
   */
    game.checkImageExists_taixuhuanjing = function (path) {
        return new Promise((resolve) => {
            // 拼接完整图片路径
            const img = new Image();
            const imgPath = lib.assetURL + path;
            // 跨域/缓存处理（可选）
            img.crossOrigin = 'anonymous'; // 解决跨域图片加载问题
            img.src = imgPath + '?t=' + Date.now(); // 加时间戳避免缓存

            // 图片加载成功 → 文件存在
            img.onload = () => {
                resolve(true);
                // 释放资源
                img.onload = img.onerror = null;
            };

            // 图片加载失败 → 文件不存在
            img.onerror = () => {
                resolve(false);
                // 释放资源
                img.onload = img.onerror = null;
            };
        });
    }
    game.extension_太虚幻境_copy = function (sdir /*源文件夹路径*/, fn /*文件名*/, ddir /*目标文件夹路径*/, callback) {
        game.ensureDirectory(ddir, function () {
        });
        game.readFile(sdir + '/' + fn, function (data) {
            game.writeFile(data, ddir, fn, (callback || function () {
            }));
        });
    };
    game.txhj_playAudioCall = function (name, num, repeat) {
        if (!repeat) {
            if (num === undefined || num === null) {
                game.playAudio('..', 'extension', '太虚幻境', 'image', 'audio', name);
            } else {
                game.playAudio('..', 'extension', '太虚幻境', 'image', 'audio', name + Math.ceil(Math.random() * num));
            }
        } else {
            if (num === undefined || num === null) {
                game.txhj_playGameAudio('..', 'extension', '太虚幻境', 'image', 'audio', name);
            } else {
                game.txhj_playGameAudio('..', 'extension', '太虚幻境', 'image', 'audio', name + Math.ceil(Math.random() * num));
            }
        }
    };
    game.txhj_playGameAudio = function () {
        if (_status.video && arguments[1] != 'video') return;
        var str = '';
        var onerror = null;
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === 'string' || typeof arguments[i] == 'number') {
                str += '/' + arguments[i];
            } else if (typeof arguments[i] == 'function') {
                onerror = arguments[i]
            }
            if (_status.video) break;
        }
        _status.skillaudio.add(str);
        game.addVideo('playAudio', null, str);
        setTimeout(function () {
            _status.skillaudio.remove(str);
        }, 1000);
        var audio = document.createElement('audio');
        audio.autoplay = true;
        audio.volume = lib.config.volumn_audio / 8;
        if (str.indexOf('.mp3') != -1 || str.indexOf('.ogg') != -1) {
            audio.src = lib.assetURL + 'audio' + str;
        } else {
            audio.src = lib.assetURL + 'audio' + str + '.mp3';
        }
        audio.addEventListener('ended', function () {
            this.remove();
        });
        audio.onerror = function () {
            if (this._changed) {
                this.remove();
                if (onerror) {
                    onerror();
                }
            } else {
                this.src = lib.assetURL + 'audio' + str + '.ogg';
                this._changed = true;
            }
        };
        ui.window.appendChild(audio);
        return audio;
    };
    game.txhj_TrySkillAudio = function (skill, player, directaudio, which, skin) {
        if (_status.qhly_viewRefreshing) return;
        var info = get.info(skill);
        if (!info) return;
        _status.qhly_previewAudio = true;
        if (true) {
            var audioname = skill;
            if (info.audioname2 && info.audioname2[player.name]) {
                audioname = info.audioname2[player.name];
                info = lib.skill[audioname];
            }
            var audioinfo = info.audio;
            if (typeof audioinfo == 'string' && lib.skill[audioinfo]) {
                audioname = audioinfo;
                audioinfo = lib.skill[audioname].audio;
            }
            if (typeof audioinfo == 'string') {
                if (audioinfo.indexOf('ext:') == 0) {
                    audioinfo = audioinfo.split(':');
                    if (audioinfo.length == 3) {
                        if (audioinfo[2] == 'true') {
                            game.playAudio('..', 'extension', audioinfo[1], audioname);
                        } else {
                            audioinfo[2] = parseInt(audioinfo[2]);
                            if (audioinfo[2]) {
                                if (typeof which == 'number') {
                                    game.playAudio('..', 'extension', audioinfo[1], audioname + (which % audioinfo[2] + 1));
                                } else {
                                    game.playAudio('..', 'extension', audioinfo[1], audioname + Math.ceil(audioinfo[2] * Math.random()));
                                }
                            }
                        }
                    }
                    delete _status.qhly_previewAudio;
                    return;
                }
            } else if (Array.isArray(audioinfo)) {
                audioname = audioinfo[0];
                audioinfo = audioinfo[1];
            }
            if (Array.isArray(info.audioname) && player) {
                if (info.audioname.includes(player.name)) {
                    audioname += '_' + player.name;
                } else if (info.audioname.includes(player.name1)) {
                    audioname += '_' + player.name1;
                } else if (info.audioname.includes(player.name2)) {
                    audioname += '_' + player.name2;
                }
            }
            if (typeof audioinfo == 'number') {
                if (typeof which == 'number') {
                    game.playAudio('skill', audioname + (which % audioinfo + 1));
                } else {
                    game.playAudio('skill', audioname + Math.ceil(audioinfo * Math.random()));
                }
            } else if (audioinfo) {
                game.playAudio('skill', audioname);
            } else if (true && info.audio !== false) {
                game.playSkillAudio(audioname);
            }
        }
    };
    game.txhj_checkFileExist = function (path, callback) {
        if (lib.node && lib.node.fs) {
            try {
                var stat = lib.node.fs.statSync(__dirname + '/' + path);
                callback(stat);
            } catch (e) {
                callback(false);
                return;
            }
        } else {
            resolveLocalFileSystemURL(lib.assetURL + path, (function (name) {
                return function (entry) {
                    callback(true);
                }
            }(name)), function () {
                callback(false);
            });
        }
    };
}

export default precontent;