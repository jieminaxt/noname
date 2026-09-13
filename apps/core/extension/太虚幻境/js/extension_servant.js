import { lib, game, ui, get, ai, _status } from "../../../noname.js";
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const Servant = /** @class */ (function () {
    function Servant(name, isPicture) {

        this.isPicture = isPicture;
        this.nickName = name;
        this.textName = servantData.servant[name].textName;
        this.setData();
        if (!isPicture) {
            this.initSLEvent();
        }
        if (typeof txhj !== 'undefined') {
            txhj.servantData = servantData;
        }
        lib.skill._slEnterGame = {
            trigger: {
                global: 'gameDrawBefore'
            },
            forced: true,
            filter: function (event, player) {
                return player == game.me;
            },
            content: function () {
                if (lib.config.taixuhuanjing?.servants) {
                    for (let i of lib.config.taixuhuanjing.servants) {
                        if (txhj.servantData.skillDesc[i]) {
                            const buffs = Object.keys(txhj.servantData.skillDesc[i]);
                            for (const buff of buffs) {
                                player.addSkill(buff);
                            }
                        }
                    }
                }
                if (txhj.servant && typeof txhj.servant.initZuodian === 'function') {
                    txhj.servant.initZuodian();
                    txhj.servant.isConsoledeskMoved = false;
                }
            }
        };
    }
    Servant.prototype.getData = function () {
        if (!this.nickName || this.nickName == "") {
            return null;
        }
        return servantData.servant[this.nickName];
    };

    Servant.prototype.update = function (nickName) {
        let pisPicture = window.dcdAnim ? false : true
        this.nickName = nickName;
        this.isPicture = pisPicture;
        this.textName = servantData.servant[nickName]?.textName || "未知侍灵";
        this.setData(); // 重新加载配置数据
        if (!pisPicture && !this.isPicture) {
            this.initSLEvent();
        }
    };

    /**
    * 设置Servant的数据
    * 此函数负责根据当前Servant的昵称获取其数据，并根据这些数据设置Servant的各种属性
    * 如果数据获取失败或昵称为空，则不会进行任何操作
    */
    Servant.prototype.setData = function (mode) {
        // 检查昵称是否为空，如果为空则直接返回，不执行后续操作
        if (!this.nickName || this.nickName == "") {
            return;
        }
        if (mode == 'add') this.nickName = lib.config.taixuhuanjing.servants[0];
        // 调用getData方法获取Servant的数据
        var obj = this.getData();
        // 如果获取到数据
        if (obj) {
            // 设置textName属性为获取到的数据中的textName值
            this.textName = obj.textName;
            // 根据条件判断设置name属性，决定使用图片路径还是动态资源路径
            if (this.isPicture || (!this.nickName || !servantData.action[this.nickName])) {
                this.name = txhjPack.path + "/image/servant/picture/" + this.nickName + ".png";
            } else {
                this.name = "../../../太虚幻境/image/servant/dynamic/" + this.textName + "/" + obj.dyName;
            }
            // 以下为设置其他属性，包括高度、宽度、角度、动作、透明度、剪辑槽、隐藏槽、循环模式、等级和数据
            this.height = obj.height;
            this.width = obj.width;
            this.angle = obj.angle;
            this.action = obj.action;
            this.opacity = obj.opacity;
            this.clipSlots = obj.clipSlots;
            this.hideSlots = obj.hideSlots;
            this.loop = obj.loop;
            this.grade = obj.grade;
            this.data = obj;
            // 设置actions属性为getAction方法返回的动作列表
            this.actions = this.getAction();
        } else {
            // 如果未找到Servant数据，弹出警告框提示用户
            alert("Servant " + this.nickName + " not found");
        }
    };

    Servant.prototype.play = function () {
        var that = this;
        dcdAnim.dprAdaptive = true;
        var jsonServantData = servantData.servant[that.nickName];
        if (jsonServantData && jsonServantData.json && jsonServantData.json == true) {
            dcdAnim.loadSpine(this.name, "json", function () {
                that.nowPlay = dcdAnim.playSpine(obj);
                // console.log(that.nowPlay);
            })
        } else {
            dcdAnim.loadSpine(this.name, "skel", function () {
                that.nowPlay = dcdAnim.playSpine(obj);
                // console.log(that.nowPlay);
            })
        }
    }


    Servant.prototype.chooseingPlay = function (ele, reset) {//选择侍灵界面切换侍灵动画
        ele.style.backgroundImage = "";
        if (this.isPicture || (!this.nickName || !servantData.action[this.nickName])) {
            ele.style.backgroundImage = "url(" + txhjPack.path + "/image/servant/picture/" + this.nickName + ".png)";
            // ele.style.backgroundImage = "url(" + this.name + ")";
            ele.style.backgroundSize = "contain";
            ele.style.backgroundRepeat = "no-repeat";
            ele.style.backgroundPosition = "center";
            return;
        }
        if (reset && this.nowPlay) {
            dcdAnim.stopSpine(this.nowPlay);
            this.stopAnimation();
        }
        if (this.data && (this.data.chooseServant || data.pc.chooseServant)) {
            this.referNode = ele;
            this.x = isMobileDevice() ? this.data.chooseServant.x : this.data.pc.chooseServant.x;
            this.y = isMobileDevice() ? this.data.chooseServant.y : this.data.pc.chooseServant.y;
            this.scale = isMobileDevice() ? this.data.chooseServant.scale : this.data.pc.chooseServant.scale;
            var obj = Object.assign({}, this);
            if (!dcdAnim.dprAdaptive) dcdAnim.dprAdaptive = true;
            if (dcdAnim.hasSpine(this.nickName)) {
                this.nowPlay = dcdAnim.playSpine(obj);
            } else {
                var that = this;
                var jsonServantData = servantData.servant[that.nickName];
                if (jsonServantData && jsonServantData.json && jsonServantData.json == true) {
                    dcdAnim.loadSpine(this.name, "json", function () {
                        that.nowPlay = dcdAnim.playSpine(obj);
                    });
                } else {
                    dcdAnim.loadSpine(that.name, "skel", function () {
                        that.nowPlay = dcdAnim.playSpine(obj);
                        that.animationsList = that.nowPlay;
                    });
                }
            }
            this.show();
        } else {
            return;
        }
    };

    Servant.prototype.stopAnimation = function () {
        if (!dcdAnim) return;
        const nodes = dcdAnim.nodes;
        if (!nodes) return;
        function disposeSprite(sprite) {
            if (!sprite.completed) {
                sprite.completed = true;
                if (sprite.skeleton && sprite.skeleton.state) {
                    sprite.skeleton.state.setEmptyAnimation(0);
                }
            }
            if (sprite.skeleton && typeof sprite.skeleton.dispose === 'function') {
                sprite.skeleton.dispose();
            }
            if (sprite.texture && typeof sprite.texture.dispose === 'function') {
                sprite.texture.dispose();
            }
        }
        if (Array.isArray(nodes)) {
            for (let sprite in nodes) {
                let className = nodes[sprite]?.referNode?.className;
                if (className == 'taixuhuanjing_consoledeskServantDiv' || className == 'taixuhuanjing_chooseSLDiv' || className == 'taixuhuanjing_wait') disposeSprite(nodes[sprite]);
            }
        }
    };

    Servant.prototype.consoledeskPlay = function (ele) {
        ele.style.backgroundImage = '';
        if (this.isPicture || (!this.nickName || !servantData.action[this.nickName]) || typeof dcdAnim === 'undefined') {
            ele.style.backgroundImage = "url(" + txhjPack.path + "/image/servant/picture/" + this.nickName + ".png)";
            ele.style.backgroundSize = "contain";
            ele.style.backgroundRepeat = "no-repeat";
            ele.style.backgroundPosition = "center";
            return;
        }
        var that = this;
        if (!this.nowPlay) {
            this.stopAnimation();
            if (this.data && this.data.consoledesk) {
                this.x = this.data.consoledesk.x;
                this.y = this.data.consoledesk.y;
                this.scale = this.data.consoledesk.scale;
                var obj = Object.assign({}, this);
                var jsonServantData = servantData.servant[that.nickName];
                if (jsonServantData && jsonServantData.json && jsonServantData.json === true) {
                    if (typeof dcdAnim !== 'undefined') {
                        dcdAnim.loadSpine(this.name, "json", function () {
                            if (!dcdAnim.dprAdaptive) dcdAnim.dprAdaptive = true;
                            that.nowPlay = dcdAnim.playSpine(obj);
                            play.call(this)
                        });
                    } else {
                        console.error('dcdAnim is not defined. Make sure it is properly loaded and available.');
                    }
                } else {
                    if (typeof dcdAnim !== 'undefined') {
                        dcdAnim.loadSpine(this.name, "skel", function () {
                            if (!dcdAnim.dprAdaptive) dcdAnim.dprAdaptive = true;
                            that.nowPlay = dcdAnim.playSpine(obj);
                            play.call(this)
                        });
                    } else {
                        console.error('dcdAnim is not defined. Make sure it is properly loaded and available.');
                    }
                }
            } else {
                return;
            }
        } else {
            this.show();
            if (!this.isConsoledeskMoved) play.call(this);
        }
        function play() {
            if (that.nowPlay && that.data && (that.data.consoledesk || (that.data.pc && that.data.pc.consoledesk))) {
                that.nowPlay.referNode = ele;
                that.nowPlay.x = isMobileDevice() ? that.data.consoledesk.x : that.data.pc.consoledesk.x;
                that.nowPlay.y = isMobileDevice() ? that.data.consoledesk.y : that.data.pc.consoledesk.y;
                that.nowPlay.scale = isMobileDevice() ? that.data.consoledesk.scale : that.data.pc.consoledesk.scale;
                that.nowPlay.referFollow = true;
                setTimeout(() => {
                    if (that.nowPlay) {
                        that.nowPlay.referFollow = false;
                    }
                }, 1000);
                this.isConsoledeskMoved = true;
            }
        }
    };

    Servant.prototype.playAction = function (action) {
        var data = servantData.action[this.nickName];
        if (!data) return;
        if (!this.nowPlay) {
            return;
        }
        if (data.TeShu) {
            if (typeof this.nowPlay.setAction === 'function' && this.nowPlay && this.nowPlay.skeleton) {
                this.nowPlay.setAction(action);
                this.nowPlay.skeleton.state.addAnimation(0, "TeShu", false, 0.01);
                this.nowPlay.skeleton.state.addListener({
                    complete: function () {
                        this.nowPlay.skeleton.state.setAnimation(0, "DaiJi", true);
                    }.bind(this)
                });
            }
        }
        if (data.daiji) {
            if (typeof this.nowPlay.setAction === 'function') {
                this.nowPlay.setAction(action);
                this.nowPlay.skeleton.state.addAnimation(0, "daiji1", true, -0.01);
            }
        }
    };

    Servant.prototype.getAction = function () {
        var list = [];
        if (this.nickName && servantData.action[this.nickName]) {
            var data = servantData.action[this.nickName];
            if (data) {
                delete data.jingzhi;
                delete data.zuodian;
                // delete data.gongji;
                for (var key in data) {
                    for (var i = 1; i <= data[key]; i++) {
                        list.push(key + i);
                    }
                }
                var index = list.indexOf("daiji1");
                var indes = list.indexOf("DaiJi");
                var indey = list.indexOf("daiji");
                list.splice(index, 1);
                list.splice(indes, 1);
                list.splice(indey, 1);
                return list;
            }
            return;
        } else {
            return;
        }
    };

    Servant.prototype.randomPlayAction = function () {
        if (this.isPicture || (!this.nickName || !servantData.action[this.nickName])) return;
        var list = this.actions;
        if (Array.isArray(list) && list.length > 0) {
            var index = Math.floor(Math.random() * list.length);
            this.playAction(list[index]);
        } else {
            return;
        }
    };

    Servant.prototype.getDirection = function (ele, sl) {
        var width = document.body.clientWidth / 2;
        var pos = this.getCoordinate(ele);
        if (!pos) return false;
        var isLeft = pos.x >= width ? false : true;
        if (sl) {
            if (isLeft) {
                return { x: [0, 1.2], y: [0, 0], isLeft: isLeft };
            } else return { x: [0, -0.1], y: [0, 0], isLeft: isLeft };
        } else {
            if (isLeft) {
                return { x: [0, 0.4], y: [0, 0.5], isLeft: isLeft };
            } else return { x: [0, 0.63], y: [0, 0.5], isLeft: isLeft };
        }
    };

    Servant.prototype.getCoordinate = function (ele) {
        if (!ele && !decadeUI) return false;
        var rect = ele.getBoundingClientRect();
        return {
            x: rect.left,
            y: decadeUI.get.bodySize().height - rect.bottom,
            width: rect.width,
            height: rect.height
        };
    };

    Servant.prototype.initSLEvent = function () {
        lib.skill._slDamage = {
            trigger: {
                source: 'damageBegin'
            },
            forced: true,
            filter: function (event, player) {
                const actually = txhj.servant.nickName;
                const serdata = txhj.servantData.action[actually];
                if (!serdata || typeof event.num !== "number") return false;
                return player === game.me && event.num > 0 && (serdata.gongji || serdata.GongJi);
            },
            content: function () {
                function isMobileDevice() {
                    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                }

                if (txhj && txhj.servant) {
                    txhj.servant.hide();
                }

                const target = trigger.player;
                const direction = txhj.servant.getDirection(target, true);
                if (!direction) return;

                const actually = txhj.servant.nickName;
                const serdata = txhj.servantData.action[actually];
                if (!serdata) return;

                let action;
                if (serdata.gongji) {
                    action = direction.isLeft ? "gongji2" : "gongji1";
                } else if (serdata.GongJi) {
                    action = "GongJi";
                }
                const sprite = { ...txhj.servant };
                sprite.x = direction.x;
                sprite.y = sprite.data.special ? sprite.data.py.gj.y : direction.y;

                /*   if (actually == 'kunpeng') {
                       if (direction.isLeft) {//是左
                           sprite.x[1] = sprite.x[1] + 0.48;
                       } else {
                           sprite.x[1] = sprite.x[1] - 0.58;
                       }
                       sprite.y[1] = sprite.y[1] + 0.5;
                   } else if (actually == 'jiuwei') {
                       if (direction.isLeft) {
                           sprite.x[1] = sprite.x[1] + 1.13;
                       } else {
                           sprite.x[1] = sprite.x[1] - 1.28;
                       }
                       sprite.y[1] = sprite.y[1] + 0.15;
                   } else {*/
                if (direction.isLeft) {
                    sprite.x[1] = sprite.x[1] + 0.48;
                } else {
                    sprite.x[1] = sprite.x[1] - 0.58;
                }
                sprite.y[1] = sprite.y[1] + 0.15;
                // }

                const scaleData = isMobileDevice() ? sprite.data.match : sprite.data.pc?.match;
                if (scaleData && scaleData.scale !== undefined) {
                    sprite.scale = scaleData.scale;
                } else {
                    return;
                }

                if (action === "GongJi") sprite.flipX = direction.isLeft;
                sprite.referNode = target;
                sprite.referFollow = true;
                sprite.action = action;
                sprite.loop = false;
                if (!txhj.servant) return;

                sprite.oncomplete = function () {
                    if (txhj.servant?.nowPlay?.opacity === 0) {
                        txhj.servant.show();
                    }
                    // 重置位置
                    txhj.servant.x = scaleData.x;
                    txhj.servant.y = scaleData.y;
                };
                dcdAnim.playSpine(sprite); // 更新当前动画引用
                game.playAudio(".", "extension", "太虚幻境/audio/servant", txhj.servant.nickName + ".mp3");
            }
        };


        lib.skill._slUseCard = {
            trigger: {
                player: 'useCardBefore'
            },
            forced: true,
            filter: function (event, player) {
                if (txhj && txhj.servant && txhj.servant.nowPlay) {
                    var actually = txhj.servant.nickName;
                    var serdata = txhj.servantData.action[actually];
                    return player == game.me && (txhj.servant.nowPlay.opacity == 1 || txhj.servant.nowPlay.opacity === undefined) && serdata && (serdata.hasOwnProperty('jingnang') || serdata.hasOwnProperty('TeShu'));
                } else {
                    return false;
                }
            },
            content: function () {
                var card = trigger.card;
                var actually = txhj.servant.nickName;
                var serdata = txhj.servantData.action[actually];
                if (serdata) {
                    if (get.type(card) == 'trick' || card.name == 'tao' || card.name == 'jiu') {
                        if (serdata.jingnang) {
                            txhj.servant.playAction("jinnang1");
                        } else if (serdata.TeShu) {
                            txhj.servant.playAction("TeShu");
                        } else {
                            return;
                        }
                    }
                }
            }
        };

        lib.skill._slHurt = {
            trigger: {
                player: ['damageBegin4', 'loseHpEnd']
            },
            filter: function (event, player) {
                return player == game.me;
            },
            forced: true,
            content: function () {
                if (txhj.servantData.action[txhj.servant.nickName] && txhj.servantData.action[txhj.servant.nickName].shouji !== undefined) {
                    var action = txhj.servantData.action[txhj.servant.nickName].shouji;
                    if (action == 1) {
                        txhj.servant.playAction("shouji1");
                    } else {
                        var number = Math.floor(Math.random() * action) + 1;
                        txhj.servant.playAction("shouji" + number);
                    }
                } else {
                    return;
                }

            }
        };
    }

    Servant.prototype.initZuodian = function () {
        var handcard = document.getElementsByClassName("hand-wrap");
        var waitDivs = document.querySelectorAll(".taixuhuanjing_wait");
        waitDivs.forEach(function (waitDiv) {
            var zuodianDiv = waitDiv.querySelector(".taixuhuanjing_zuodian");
            if (zuodianDiv && zuodianDiv.textContent !== this.textName) {
                waitDiv.remove();
            }
        }, this);

        if (!this.zuoDian) {
            let waitDiv = document.createElement("div");
            waitDiv.classList.add("taixuhuanjing_wait");
            waitDiv.onclick = function () {
                txhj.servant.randomPlayAction();
            }
            var zdDiv = document.createElement("div");
            zdDiv.innerHTML = this.textName;
            zdDiv.classList.add("taixuhuanjing_zuodian");
            waitDiv.appendChild(zdDiv);
            this.zuoDian = waitDiv;
            document.body.appendChild(waitDiv);
            var shoushaUI = document.getElementsByClassName("lbtn-controls");

            function createBtn() {
                const existingBtn = Array.from(document.querySelectorAll('.lbtn-control')).find(el => {
                    const inlineStyle = el.style.cssText;
                    return inlineStyle.includes('background-image: url(&quot;extension/太虚幻境/image/servant/btn.png&quot;)');
                });
                if (existingBtn) {
                    return existingBtn;
                }
                var btn = document.createElement("div");
                btn.classList.add("lbtn-control");
                btn.style.backgroundImage = "url(" + txhjPack.path + "/image/servant/btn.png)";
                btn.style.backgroundRepeat = "no-repeat";
                btn.onclick = function () {
                    game.playAudio(".", "extension", "太虚幻境/audio", "clickBtn.mp3");
                    var wdiv = getComputedStyle(waitDiv).display;
                    if (wdiv == "none") {
                        waitDiv.style.display = "block";
                        if (handcard[0]) {
                            handcard[0].style.left = "245px";
                        }
                        ui.updatehl();
                        if (!txhj.servant.isPicture) {
                            txhj.servant.show();
                        }
                    } else {
                        waitDiv.style.display = "none";
                        if (handcard[0]) {
                            handcard[0].style.left = "98px";
                        }
                        ui.updatehl();
                        if (!txhj.servant.isPicture) {
                            txhj.servant.hide();
                        }
                    }
                }
                return btn;
            }

            if (shoushaUI.length > 0) {
                var oneEle = shoushaUI[0].firstChild;
                shoushaUI[0].insertBefore(createBtn(), oneEle);
            } else {
                var btn = createBtn();
                btn.classList.add("onlyBtn");
                document.body.appendChild(btn);
            }
        }
        if (handcard[0]) {
            handcard[0].style.left = "245px";
        }
        ui.updatehl();
        // this.nowPlay.x = this.data.x;
        // this.nowPlay.y = this.data.y;
        if ((this.isPicture && !this.zuoDian.picture) || (!this.nickName || !servantData.action[this.nickName])) {
            var picture = new Image();
            picture.src = this.name;
            picture.classList.add("taixuhuanjing_matchPicture");
            this.zuoDian.picture = picture;
            this.zuoDian.style.display = "none";
            this.zuoDian.appendChild(picture);
        } else {
            if (this.nowPlay === undefined) {
                this.nowPlay = {};
            }
            if (this.data && (this.data.match || this.data.pc.match)) {
                this.nowPlay.x = isMobileDevice() ? this.data.match.x : this.data.pc.match.x;
                this.nowPlay.y = isMobileDevice() ? this.data.match.y : this.data.pc.match.y;
                this.nowPlay.scale = isMobileDevice() ? this.data.match.scale : this.data.pc.match.scale;
                this.nowPlay.referNode = this.zuoDian;
                this.nowPlay.referFollow = true;
                setTimeout(() => {
                    txhj.servant.nowPlay.referFollow = false;
                }, 500);
            } else { return }
        }
    };

    Servant.prototype.initSLSkill = function () {

    }

    Servant.prototype.hide = function () {
        if (this.nowPlay) {
            this.nowPlay.speed = 0;
            this.nowPlay.opacity = 0;
        }
    };

    Servant.prototype.show = function () {
        if (this.nowPlay) {
            this.nowPlay.speed = 1;
            this.nowPlay.opacity = 1;
        }
    };

    // Servant.prototype.getSuitableScale = function () {
    //     var scale = this.data.chooseServant.scale;
    //     if (isMobileDevice()) {
    //         return scale;
    //     } else {
    //         return scale*=1.4;
    //     }
    // }

    return Servant;
}());

const servantData = {
    "servant": {
        /*//添加图片侍灵支持
        extension\太虚幻境\image\servant\icon        这是选择侍灵界面的头像路径
        extension\太虚幻境\image\servant\picture     这是侍灵全身像路径
        extension\太虚幻境\image\servant\dynamic + 侍灵中文名称     这是侍灵特效路径
        仅图片不需要太麻烦
        "kunpeng1": {  //侍灵id 与图片保持一致
            textName: "威灵尽显",   //侍灵显示的名字，
            grade: 3//稀有度
        },
        特效侍灵样式
        "威灵尽显": {  //侍灵格式参考
            textName: "威灵尽显",   //侍灵显示的名字，
            nickName: '威灵尽显',
            grade: 3
    }
            "威灵尽显": {  //侍灵格式参考
            textName: "威灵尽显",   //侍灵显示的名字，
            nickName: '威灵尽显',  //侍灵的隐藏名字，
            dyName: 'XingXiang', //侍灵动态文件的名字
            json: true,//如果文件是json格式要使用此标签json: true,
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.57],
                scale: 0.20,
            },
            action: 'DaiJi',//待机时执行的动作
            loop: true,//是否循环
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.70],
                y: [-20, 0.30],
                scale: 0.50,
            },
            consoledesk: {//主界面的侍灵坐标及缩放//主界面的坐标与缩放
                x: undefined,
                y: [5, 0.60],
                scale: 0.20
            },
            pc: {//电脑版参数
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.15,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.30,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.20
                },
            },
            grade: 3//稀有度
        },
        },*/

        "临军对阵": {
            textName: "临军对阵",
            nickName: '临军对阵',
            dyName: 'XingXiang',
            match: {//对局内的坐标与缩放
                x: [0, 1.4],
                y: [0, -0.2],
                scale: 0.15,
            },
            action: 'DaiJi',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 1.2],
                y: [0, 0],
                scale: 0.25,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 1.4],
                y: [0, 0.05],
                scale: 0.15
            },
            pc: {//应该是电脑版参数
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.92],
                    scale: 0.15,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.25,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 1.15],
                    scale: 0.20
                },
            },
            grade: 4//稀有度
        },

        "威灵尽显": {
            textName: "威灵尽显",//宠物名
            nickName: '威灵尽显',
            dyName: 'XingXiang',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, -0.25],
                scale: 0.20,
            },
            action: 'DaiJi',//待机动作
            loop: true,//是否循环
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 1.2],
                y: [0, -0.25],
                scale: 0.35,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 1.2],
                y: [0, -0.35],
                scale: 0.20
            },
            pc: {//应该是电脑版参数
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.15,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.30,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.20
                },
            },
            grade: 4//稀有度
        },

        "妖狐之魅": {
            textName: "妖狐之魅",//宠物名
            nickName: '妖狐之魅',
            dyName: 'mo_diaochan_001',
            json: true,
            match: {//对局内的坐标与缩放//局内
                x: [0, 1.3],
                y: [0, -0.35],
                scale: 0.20,
            },
            action: 'daiji',//待机动作
            loop: true,//是否循环
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 1],
                y: [0, 0],
                scale: 0.50,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 1.3],
                y: [0, -0.45],
                scale: 0.20
            },
            pc: {//应该是电脑版参数
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.20,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.65,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.25
                },
            },
            grade: 4//稀有度
        },

        //①以下侍灵全部搬运自K佬的【EpicFX】扩展，再次感谢K佬的侍灵素材和技能代码提供!  
        "yueling": {
            textName: "月灵",
            nickName: 'yueling',
            dyName: 'servant_0',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 4//稀有度
        },
        "kongquemingwang": {
            textName: "孔雀明王",
            nickName: 'kongquemingwang',
            dyName: 'servant_0',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.4],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.35],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.47],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.30],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.35],
                    scale: 0.3
                },
            },
            grade: 4//稀有度
        },
        "qilin": {
            textName: "麒麟",
            nickName: 'qilin',
            dyName: 'qilin',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "diting": {
            textName: "谛听",
            nickName: 'diting',
            dyName: 'diting',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "kunpeng": {//白板侍灵（暂未书写技能代码）
            textName: "鲲鹏",//坤坤
            nickName: 'kunpeng',
            dyName: 'kunpeng',
            match: {//对局内的坐标与缩放
                x: [0, 0.46],
                y: [0, 0.40],
                scale: 0.22,
            },
            action: 'daiji1',//待机时执行动作
            loop: true,//循环
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.45],
                y: [0, 0.43],
                scale: 0.60,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.42],
                y: [0, 0.28],
                scale: 0.24
            },
            pc: {//电脑版坐标
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.37],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.52],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 3//稀有度
        },
        "baize": {
            textName: "白泽",
            nickName: 'baize',
            dyName: 'baize',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [45, 0.01],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.46],
                y: [-86, 0.20],
                scale: 0.60,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0.09, 0.01],
                scale: 0.21
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.23],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "kuiniu": {
            textName: "夔牛",
            nickName: 'kuiniu',
            dyName: 'kuiniu',
            match: {//对局内的坐标与缩放
                x: [0, 0.54],
                y: [0, 0.22],
                scale: 0.11,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.53],
                y: [0, 0.10],
                scale: 0.25,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.53],
                y: [0, 0.07],
                scale: 0.11
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.08,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.25,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.11
                },
            },
            grade: 3
        },
        "chunzhihua": {
            textName: "春之花",
            nickName: 'chunzhihua',
            dyName: 'chunzhihua',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.21],
                scale: 0.29,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.50],
                y: [-20, 0.20],
                scale: 0.45,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [-15, 0.20],
                scale: 0.30
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.4,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.25
                },
            },
            grade: 3
        },
        //②以下侍灵全部搬运自K佬的【EpicFX】扩展，再次感谢K佬的侍灵素材和技能代码提供!    
        "xuanwu": {
            textName: "玄武",
            nickName: 'xuanwu',
            dyName: 'xuanwu',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "jinwu": {
            textName: "金乌",
            nickName: 'jinwu',
            dyName: 'jinwu',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [35, 0.01],
                scale: 0.08,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [-53, 0.01],
                scale: 0.16,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [-18, 0.01],
                scale: 0.09
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.07,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.12,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.1
                },
            },
            grade: 3
        },
        "canglong": {
            textName: "苍龙",
            nickName: 'canglong',
            dyName: 'canglong',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.62],
                scale: 0.13,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.56],
                scale: 0.28,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.62],
                scale: 0.14
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.56],
                    scale: 0.12,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.4],
                    scale: 0.2,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.50],
                    scale: 0.11
                },
            },
            grade: 3
        },
        "xiongshi": {//此侍灵为魔改，非官方技能
            textName: "雄狮",
            nickName: 'xiongshi',
            dyName: 'xiongshi',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.25],
                scale: 0.3,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.3
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.18],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.07],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "tengshe": {
            textName: "腾蛇",
            nickName: 'tengshe',
            dyName: 'tengshe',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.6],
                scale: 0.15,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.45],
                scale: 0.25,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.45],
                scale: 0.15
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.64],
                    scale: 0.15,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.25],
                    scale: 0.2,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.72],
                    scale: 0.2
                },
            },
            grade: 3
        },
        "rui": {
            textName: "瑞",
            nickName: 'rui',
            dyName: 'rui',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.18],
                scale: 0.3,
            },
            action: 'daiji1',
            loop: true,
            py: {
                zd: {
                    x: [0, 1.2],
                    y: [0, 0.01],
                }
            },
            gjsj: 1100,
            yc: 500,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.5],
                y: [0, 0.05],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: 0,
                scale: 0.3
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.14],
                    scale: 0.32,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.02],
                    scale: 0.35
                },
            },
            grade: 3
        },
        "yan": {
            textName: "焱",
            nickName: 'yan',
            dyName: 'yan',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.25],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1500,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.08],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.23],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.1],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "jiuwei": {
            textName: "九尾",
            nickName: 'jiuwei',
            dyName: 'jiuwei',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.64,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.3],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.4,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.15],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "ahao": {
            textName: "阿豪",
            nickName: 'ahao',
            dyName: 'ahao',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.25],
                scale: 0.3,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.3
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.18],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.07],
                    scale: 0.3
                },
            },
            grade: 3
        },
        "ahe": {
            textName: "阿贺",
            nickName: 'ahe',
            dyName: 'ahe',
            match: {//对局内的坐标与缩放
                x: [0, 0.63],
                y: [45, 0.29],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.55],
                y: [0, 0.51],
                scale: 0.66,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.63],
                y: [0, 0.39],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.55],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.52],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.55],
                    scale: 0.3
                },
            },
            grade: 1
        },
        "ale": {
            textName: "阿乐",
            nickName: 'ale',
            dyName: 'ale',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.21],
                scale: 0.31,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1700,
            yc: 400,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.31
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.15],
                    scale: 0.32,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.02],
                    scale: 0.35
                },
            },
            grade: 2
        },
        "dundun": {
            textName: "阿猛",
            nickName: 'dundun',
            dyName: 'dundun',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 2
        },
        "axian": {
            textName: "阿先",
            nickName: 'axian',
            dyName: 'axian',
            match: {
                x: [0, 0.52],
                y: [0, 0.23],
                scale: 0.19,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {
                x: [0, 0.53],
                y: [-10, 0.01],
                scale: 0.41,
            },
            consoledesk: {
                x: [0, 0.56],
                y: [0, 0.07],
                scale: 0.18
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.2,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.37,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.2
                },
            },
            grade: 1
        },
        "kangkang": {
            textName: "皮皮",
            nickName: 'kangkang',
            dyName: 'kangkang',
            action: 'daiji4',
            loop: true,
            gjsj: 1900,
            yc: 300,
            match: {//对局内的坐标与缩放
                x: [0, 0.66],
                y: [0, 0.68],
                scale: 0.40,
            },
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.56],
                y: [0, 0.59],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.66],
                y: [0, 0.60],
                scale: 0.38
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.18],
                    scale: 0.28,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.45],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.35
                },
            },
            grade: 2
        },
        "yaya": {
            textName: "鸭鸭",
            nickName: 'yaya',
            dyName: 'yaya',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 2
        },
        "manman": {
            textName: "蠻蠻",
            nickName: 'manman',
            dyName: 'manman',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.18],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: 0,
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: 0,
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.13],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.01],
                    scale: 0.35
                },
            },
            grade: 2
        },
        "xiaoxiao": {
            textName: "枭枭",
            nickName: 'xiaoxiao',
            dyName: 'xiaoxiao',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.19],
                scale: 0.5,
            },
            action: 'daiji1',
            loop: true,
            div: {
                width: "141",
                height: "136",
                left: "110",
            },
            HD: {
                x: [0, 0.5],
                y: [0, 0.01],
            },
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 1.2,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.55],
                y: [0, 0.01],
                scale: 0.5
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.15],
                    scale: 0.6,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.8,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.01],
                    scale: 0.6
                },
            },
            grade: 2
        },
        "lulu": {
            textName: "鲁鲁",
            nickName: 'lulu',
            dyName: 'lulu',
            action: 'daiji1',
            loop: true,
            gjsj: 1900,
            yc: 300,
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.24],
                scale: 0.28,
            },
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.0],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.07],
                scale: 0.3
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.18],
                    scale: 0.28,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.1],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.35
                },
            },
            grade: 2
        },
        "qiaoqiao": {
            textName: "乔乔",
            nickName: 'qiaoqiao',
            dyName: 'qiaoqiao',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.15,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.04],
                scale: 0.25,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.15,
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.2],
                    scale: 0.15,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.35,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.2
                },
            },
            grade: 2
        },
        "niuniu": {
            textName: "牛牛",
            nickName: 'niuniu',
            dyName: 'niuniu',
            action: 'daiji1',
            loop: true,
            gjsj: 1900,
            yc: 300,
            match: {//对局内的坐标与缩放
                x: [0, 0.54],
                y: [0, 0.20],
                scale: 0.37
                /*    x: [0,0.66],
                    y: [0,0.68],
                    scale: 0.40,*/
            },
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.50],
                y: [0, 0.07],
                scale: 0.64,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.54],
                y: [0, 0.03],
                scale: 0.36
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.18],
                    scale: 0.28,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.35
                },
            },
            grade: 2
        },
        "yuanyuan": {
            textName: "元元",
            nickName: 'yuanyuan',
            dyName: 'yuanyuan',
            match: {//对局内的坐标与缩放
                x: [0, 0.54],
                y: [0, 0.18],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.53],
                y: [-10, 0.01],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.53],
                y: [0, 0.01],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 1
        },
        "qiqi": {
            textName: "奇奇",
            nickName: 'qiqi',
            dyName: 'qiqi',
            match: {//对局内的坐标与缩放
                x: [0, 0.54],
                y: [0, 0.18],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: [0, 0.53],
                y: [-10, 0.01],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: [0, 0.53],
                y: [0, 0.01],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 1
        },
        "youyou": {
            textName: "佑佑",
            nickName: 'youyou',
            dyName: 'youyou',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 2
        },
        "minmin": {
            textName: "敏敏",
            nickName: 'minmin',
            dyName: 'minmin',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.23],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.1],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.17],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.05],
                    scale: 0.3
                },
            },
            grade: 2
        },
        "xueren": {
            textName: "雪人",
            nickName: 'xueren',
            dyName: 'xueren',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.18],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1600,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: 0,
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.13],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.01],
                    scale: 0.35
                },
            },
            grade: 0
        },
        "yueer": {
            textName: "玥儿",
            nickName: 'yueer',
            dyName: 'yueer',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.2],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 2300,
            yc: 500,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.02],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.15],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.02],
                    scale: 0.35
                },
            },
            grade: 2
        },
        "liuli": {
            textName: "琉璃",
            nickName: 'liuli',
            dyName: 'liuli',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.65],
                scale: 0.25,
            },
            action: 'daiji1',
            loop: true,
            py: {
                gj: {
                    x: [0, 0.55],
                    y: [0, 0.5]
                }
            },
            gjsj: 1900,
            yc: 400,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.75],
                scale: 0.6,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.55],
                scale: 0.25
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.5],
                    scale: 0.25,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.7],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.52],
                    scale: 0.3
                },
            },
            grade: 2,
            special: true
        },
        "datong": {
            textName: "大桶",
            nickName: 'datong',
            dyName: 'datong',
            match: {//对局内的坐标与缩放
                x: undefined,
                y: [0, 0.18],
                scale: 0.3,
            },
            action: 'daiji1',
            loop: true,
            gjsj: 1890,
            chooseServant: {//选择侍灵时的坐标与缩放
                x: undefined,
                y: [0, 0.05],
                scale: 0.65,
            },
            consoledesk: {//主界面的侍灵坐标及缩放
                x: undefined,
                y: [0, 0.01],
                scale: 0.3
            },
            pc: {
                match: {//对局内的坐标与缩放
                    x: undefined,
                    y: [0, 0.15],
                    scale: 0.32,
                },
                chooseServant: {//选择侍灵时的坐标与缩放
                    x: undefined,
                    y: [0, 0.0],
                    scale: 0.55,
                },
                consoledesk: {//主界面的侍灵坐标及缩放
                    x: undefined,
                    y: [0, 0.02],
                    scale: 0.4
                },
            },
            grade: 0
        },
    },
    "action": {//动作
        威灵尽显: {//动作拥有者id
            DaiJi: true,
            GongJi: true,
            ChuChang: true,
            TeShu: true,
        },
        月灵: {//动作拥有者id
            DaiJi: true,
            GongJi: true,
            ChuChang: true,
            TeShu: true,
        },
        妖狐之魅: {//动作拥有者id
            daiji: true,
        },
        临军对阵: {
            DaiJi: true,
            GongJi: true,
            ChuChang: true,
            TeShu: true,
        },
        kongquemingwang: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        dundun: {
            daiji: 3,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        jiuwei: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        chunzhihua: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        kunpeng: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        baize: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        kuiniu: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        yuanyuan: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        qiqi: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        ahe: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        jinwu: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        canglong: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        kangkang: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        niuniu: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        xiongshi: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        tengshe: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        qilin: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        diting: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        minmin: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        qiaoqiao: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        yaya: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        youyou: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        lulu: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        datong: {
            daiji: 2,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 1,
            zuodian: false
        },
        yueer: {
            daiji: 3,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        yueling: {
            daiji: 3,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        axian: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        ale: {
            daiji: 3,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        yan: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: false
        },
        ahao: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: false
        },
        rui: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        liuli: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: true
        },
        manman: {
            daiji: 3,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: false
        },
        xiaoxiao: {
            daiji: 3,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: false
        },
        xuanwu: {
            daiji: 4,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 2,
            zuodian: false
        },
        xueren: {
            daiji: 2,
            gongji: 2,
            jingzhi: true,
            jinnang: 1,
            shouji: 1,
            zuodian: false
        },
    },
    "skillDesc": {
        /*技能例子参考
          "kunpeng1": {//拥有buff的侍灵
              "txhj_dundunSkill1": {  //buff的id
                  name: "勇往直前",   //选择侍灵界面的buff名称
                  desc: "当你使用【杀】指定目标后，你有10/20/40/60/80/100%的概率摸一张牌"//选择侍灵界面的buff效果描述
              },
          },*/
        "临军对阵": {//拥有buff的侍灵
            "buff_txhj_wanfumodi": {
                name: "万夫莫敌",
                desc: "准备阶段，你自牌堆或弃牌堆中获得所有类型的【杀】各一张"
            },
            "txhj_buff_shenxian": {
                name: "甚贤",
                desc: "每回合限一次，你的回合外，当有其他角色因弃置而失去基本牌时，若你的手牌数少于x，你摸牌至x。若你的手牌数不小于x，则改为获得y点体力上限。(x为你的体力上限且至多为20，y为其本次弃置的基本牌数)"
            },
            "txhj_buff_qiangwu": {
                name: "枪舞",
                desc: "出牌阶段开始前，你进行判定。直到回合结束，你使用点数小于判定结果的【杀】时不受距离限制，且你使用点数大于判定结果的【杀】时无使用次数限制"
            },
        },
        "威灵尽显": {//拥有buff的侍灵
            "txhj_dchuiling": {
                name: "汇灵",
                desc: "当你使用牌时，若此牌颜色为弃牌堆中数量较少的颜色，你获得1枚“灵”标记(若你的“灵”标记大于等于8，则移除4个“灵”标记获得一点体力上限，摸2张牌并令摸牌阶段摸牌数+1)。若弃牌堆中：红色牌数大于黑色牌数，你回复1点体力；黑色牌数大于红色牌数，你随机弃置一名敌方角色的一张牌"
            },
            "txhj_dctaji": {
                name: "踏寂",
                desc: "当你失去手牌后，根据你失去牌的原因执行以下效果，并额外随机执行一项：1.使用：你随机弃置一名敌方角色一张牌；2.打出：你摸一张牌；3.弃置：你回复1点体力；4.其他：你下一次对其他角色造成伤害时，此伤害+1。(若你的汇灵标记大于4，则额外随机执行一项效果)"
            },
            "txhj_shhlianhua": {
                name: "莲华",
                desc: "当你成为【杀】的目标后，你摸一张牌。然后此【杀】的使用者选择一项：①弃置一张牌。②令此【杀】对你无效"
            },
        },
        "妖狐之魅": {//拥有buff的侍灵
            "txhj_jlsgsy_meihuo": {
                name: "魅惑",
                desc: "你的出牌阶段开始时,你随机指定一名手牌存在伤害类卡牌的敌方角色,令其对另一名随机敌方角色使用手牌中的伤害类卡牌(不满足则不发动)",
            },
            "txhj_jlsgsy_yaoyan": {
                name: "妖颜",
                desc: "锁定技，当其他角色使用基本牌或非延时锦囊牌指定你为目标时，你令其也成为此牌的目标，随后有50%的概率将自己从目标中移除"
            },
            "txhj_jlsgsy_miluan": {
                name: "迷乱",
                desc: "当你受到伤害后，你获得所有其他角色的手牌，然后将一半数量（向下取整）的手牌随机分配给其他角色"
            },
        },
        "kunpeng1": {//拥有buff的侍灵
            "txhj_jiuweiSkill1": {
                name: "狐火灵气",
                desc: "其他角色回合开始时，你有10/20/40/60/80/100%的概率使其本回合以你为唯一目标的所有锦囊牌失效"
            },
            "txhj_qiqiSkill2": {
                name: "取食",
                desc: "弃牌阶段结束时，若此阶段你弃置超过X张牌，你增加2点体力上限，手牌上限+2。(X为2倍本局游戏中取食发动次数且包括本次)"
            },
            "txhj_kunpengSkill3": {
                name: "厚德载物",
                desc: "出牌阶段结束时，若你的手牌数大于当前体力值，你加一点体力上限，然后回复一点体力"
            },

        },
        "dundun": {
            "txhj_dundunSkill1": {
                name: "勇往直前",
                desc: "当你使用【杀】指定目标后，你有10/20/40/60/80/100%的概率摸一张牌"
            },
            "txhj_dundunSkill2": {
                name: "忠誌",
                desc: "当你受到伤害时，若此伤害值大于1，令该伤害-1"
            },
        },
        "jiuwei": {
            "txhj_jiuweiSkill1": {
                name: "狐火灵气",
                desc: "其他角色回合开始时，你有10/20/40/60/80/100%的概率使其本回合以你为唯一目标的所有锦囊牌失效"
            },
            "txhj_jiuweiSkill2": {
                name: "秘思",
                desc: "你的回合内，其他角色使用或打出的第一张非锦囊牌失效"
            },
            "txhj_jiuweiSkill3": {
                name: "九尾之命",
                desc: "当你受到1点伤害后，你摸x张牌(x为9-此技能发动次数，当x为0时，此技能失效)"
            },
        },
        "chunzhihua": {
            "diychunxiao": {
                name: "春晓",
                desc: "你的回合结束时，你若为受伤状态，额外有50%的几率恢复至满体力值"
            },
            "diycuidu": {
                name: "淬毒",
                desc: "你对一名其他角色造成伤害后，若其没有“中毒”，你令其获得“中毒”，然后你摸两张牌"
            },
            "diyzhuiling": {
                name: "追灵",
                desc: "当你受到伤害时，你可以对伤害来源造成伤害的角色造成1点随机属性伤害（雷或火、冰或毒随机）"
            },
            "diyfeihua": {
                name: "飞花",
                desc: "你的出牌阶段开始时，你可以视为随机使用一张【知己知彼】或【万箭齐发】"
            },
        },
        //以下侍灵全部搬运自K佬的【EpicFX】扩展，再次感谢K佬的侍灵素材和技能代码提供!
        "axian": {
            "txhj_axianSkill1": {
                name: "中正卫主",
                desc: "每回合限两次，当你受到伤害后，你从牌堆中获得基本牌、锦囊牌各一张"
            },
            "txhj_axianSkill2": {
                name: "清德",
                desc: "准备阶段，若你的手牌数大于体力值，你获得1点体力上限"
            },
        },
        "kunpeng": {
            "txhj_kunpengSkill1": {
                name: "驭火掣电",
                desc: "每回合限一次，当你受到属性伤害时，你有20/30/40/60/80/100%将此伤害随机转移给一名敌方角色"
            },
            "txhj_kunpengSkill2": {
                name: "饱德",
                desc: "每回合限两次，当你一次性失去至少两张牌时，你从牌堆中获得不同牌名的基本牌各一张"
            },
            "txhj_kunpengSkill3": {
                name: "厚德载物",
                desc: "出牌阶段结束时，若你的手牌数大于当前体力值，你加一点体力上限，然后回复一点体力"
            },
        },
        "kuiniu": {
            "txhj_kuiniuSkill1": {
                name: "王者有德",
                desc: "弃牌阶段结束时，你有20/30/40/60/80/100%的概率依次亮出并对随机目标使用牌堆顶的X张牌，这些牌无次数限制且无距离限制(X为本阶段你弃置牌的数量)",
            },
            "txhj_kuiniuSkill2": {
                name: "辟邪",
                desc: "每个回合结束时，你摸X张牌。(X为本回合你使用牌的张数)"
            },
            "txhj_kuiniuSkill3": {
                name: "聲震百里",
                desc: "每回合限两次，你使用牌后，摸两张牌"
            },
        },
        "yuanyuan": {
            "txhj_yuanyuanSkill1": {
                name: "斑斓暇日",
                desc: "每回合限一次，当你在回合外失去红色牌后，你有20/30/40/60/80/100%的概率回复1点体力，若你体力值已满，则改为摸两张牌"
            },
            "txhj_yuanyuanSkill2": {
                name: "角斗",
                desc: "每回合限一次，当你在回合外回复1点体力后，你随机弃置当前回合角色一张装备牌"
            },
        },
        "qiqi": {
            "txhj_qiqiSkill1": {
                name: "道士假面",
                desc: "每回合限一次，当你受到伤害时，若你受伤，你有20/30/40/60/80/100%的概率防止此伤害，减少1点体力上限"
            },
            "txhj_qiqiSkill2": {
                name: "取食",
                desc: "弃牌阶段结束时，若此阶段你弃置超过X张牌，你增加2点体力上限，手牌上限+2。(X为2倍本局游戏中取食发动次数且包括本次)"
            },
        },
        "ahe": {
            "txhj_aheSkill1": {
                name: "始振萌动",
                desc: "每回合限两次，你使用黑色牌指定其他角色为目标时，有20/30/40/60/80/100%的概率随机弃置其一张牌"
            },
            "txhj_aheSkill2": {
                name: "獭祭",
                desc: "每回合限两次，当敌方角色因弃置而失去牌时，你摸一张牌"
            },
        },
        "baize": {
            "txhj_baizeSkill1": {
                name: "矢志不渝",
                desc: "当你受到伤害后，你有20/30/40/60/80/100%的概率随机弃置受到伤害数的手牌，然后回复弃置手牌数的体力",
            },
            "txhj_baizeSkill2": {
                name: "傲节",
                desc: "出牌阶段结束时，你视为对所有敌方角色使用一张无距离限制无次数限制的【杀】，若本次出牌阶段你未使用过【杀】，此【杀】造成的伤害+1"
            },
            "txhj_baizeSkill3": {
                name: "循循渐进",
                desc: "每回合限一次，你使用【杀】结算结束后，若此【杀】造成过伤害，则你回复X点体力。(X为此杀造成的伤害数)"
            },
        },
        "jinwu": {
            "txhj_jinwuSkill1": {
                name: "永恒烈日",
                desc: "当你第一次进入濒死状态时，你有20/30/40/60/80/100%的概率体力回复至体力上限"
            },
            "txhj_jinwuSkill2": {
                name: "三足",
                desc: "你的手牌上限等于体力上限。每回合每种类型限一次，当你使用牌后，你失去1点体力，然后摸X张牌。(X为你已损失的体力值且最大为9)"
            },
            "txhj_jinwuSkill3": {
                name: "赤地千里",
                desc: "每个回合结束后，若本回合你在弃牌阶段外弃置的牌数大于体力值，则摸等同于弃置牌数的牌"
            },
        },
        "canglong": {
            "txhj_canglongSkill1": {
                name: "风云变色",
                desc: "其他角色的准备阶段，你有20/30/40/60/80/100%的概率视为对其使用一张无距离限制的【杀】（你可选择是否执行）",
            },
            "txhj_canglongSkill2": {
                name: "鸣嗷",
                desc: "每回合你使用的第一张【杀】伤害 +1"
            },
            "txhj_canglongSkill3": {
                name: "披星戴月",
                desc: "你的回合内，当你使用【杀】造成伤害后，你摸X张牌(X为本回合你使用【杀】的次数且上限为5)，该效果每回合限触发5次"
            },
        },
        "kangkang": {
            "txhj_kangkangSkill1": {
                name: "丰收瑞鸣",
                desc: "每轮限两次，你造成或受到伤害后有20/30/40/60/80/100%的概率摸1张牌。你每通过“丰收瑞鸣”摸2张牌时，你回复一点体力",
            },
            "txhj_kangkangSkill2": {
                name: "安康",
                desc: "准备阶段，你摸2张牌，若你未受伤，你弃置你判定区内的所有牌"
            },
        },
        "niuniu": {
            "txhj_niuniuSkill1": {
                name: "巧拙守真",
                desc: "每回合限两次，当你于回合外失去牌后，你有20/30/40/60/80/100%的概率随机获得当前回合角色一张牌",
            },
            "txhj_niuniuSkill2": {
                name: "兕袭",
                desc: "每回合限一次，当你获得其他角色的牌时进行判定：若为红桃，你回复一点体力并获得判定牌；不为红桃，你对其造成1点伤害"
            },
        },
        "xiongshi": {
            "diy_xiongshiSkill1": {
                name: "霸体",
                desc: "锁定技，当你受到雷电伤害后，你摸X张牌（X为你的体力上限）；当你受到火焰伤害后，你将一张【兵粮寸断】置入伤害来源判定区内并从牌堆中获得一张【杀】",
            },
            "diy_xiongshiSkill2": {
                name: "兽噬",
                desc: "每当你造成一次伤害后，你可以对一名不为此目标的其他角色造成1点伤害"
            },
            "diy_xiongshiSkill3": {
                name: "狂狮愤戾",
                desc: "当你使用牌时，其他角色不能使用或打出牌响应；你使用牌指定唯一目标造成伤害时，若你的手牌数大于其则你从牌堆中随机获得一张基本牌",
            },
        },
        "tengshe": {
            "txhj_tengsheSkill1": {
                name: "雷奔云谲",
                desc: "每回合限一次，当你在回合外受到非属性伤害时20/30/40/60/80/100%对伤害来源使用一张雷属性的杀"
            },
            "txhj_tengsheSkill2": {
                name: "紫电",
                desc: "你的回合结束时对所有已受伤的敌方角色造成1点雷电伤害，如果仅有1名满足条件的敌方角色，则改为造成2点雷电伤害"
            },
            "txhj_tengsheSkill3": {
                name: "迅雷风烈",
                desc: "每回合限一次，当其他角色受到雷属性伤害时，你回复1点体力并摸两张牌"
            },
        },
        "qilin": {
            "txhj_qilinSkill1": {
                name: "麒麟之姿",
                desc: "摸牌阶段结束时，你有20/30/40/60/80/100%的概率摸x张牌(x为你摸牌阶段的摸牌数)"
            },
            "txhj_qilinSkill2": {
                name: "掌火",
                desc: "每回合限两次，你造成火焰伤害后，你回复1点体力并获得该受伤角色的1张牌"
            },
            "txhj_qilinSkill3": {
                name: "腾焰飞芒",
                desc: "出牌阶段开始时和结束时，你视为对一名随机敌方角色使用一张【火攻】"
            },
        },
        "diting": {
            "txhj_ditingSkill1": {
                name: "披坚执锐",
                desc: "当你造成伤害后，你有10/20/40/60/80/100%的概率回复1点体力"
            },
            "txhj_ditingSkill2": {
                name: "轻健",
                desc: "当你受到伤害后，增加一点体力上限"
            },
            "txhj_ditingSkill3": {
                name: "巧捷万端",
                desc: "回合结束时，你摸x张牌，并对x名敌方角色造成1点伤害(x为本回合使用不同点数的牌的数量)"
            },
        },
        "yaya": {
            "txhj_yayaSkill1": {
                name: "慷慨鸭昂",
                desc: "每回合限四次，当你使用红色牌或被其他角色的红色牌指定为目标时，你有20/30/40/60/80/100%的概率摸一张牌；你每通过此技能获得4张牌，你对一名随机敌方角色造成1点伤害"
            },
            "txhj_yayaSkill2": {
                name: "鸭立",
                desc: "每局对局限一次，当你进入濒死状态时，你将体力回复至1点，并在你受到伤害、流失体力、回复体力时防止之，直到你的下个回合开始"
            },
        },
        "youyou": {
            "txhj_youyouSkill1": {
                name: "承天之佑",
                desc: "每回合限一次，当你于回合外受到伤害后，你有20/30/40/60/80/100%的概率摸两张牌"
            },
            "txhj_youyouSkill2": {
                name: "守护",
                desc: "每回合限一次，当你在摸牌阶段外一次性获得大于一张牌后，你随机令一名已受伤的友方角色回复1点体力"
            },
        },
        "minmin": {
            "txhj_minminSkill1": {
                name: "娉婷万種",
                desc: "每回合限一次，当你受到伤害后，你有10/20/40/60/80/100%的概率摸x张牌(x为本次伤害值)"
            },
            "txhj_minminSkill2": {
                name: "依人",
                desc: "每回合限两次，当你一次性摸不小于2张牌后，你令一名随机友方已受伤角色回复一点体力"
            },
        },
        "qiaoqiao": {
            "txhj_qiaoqiaoSkill1": {
                name: "慧心巧思",
                desc: "每当延时类锦囊牌进入其他角色判定区时，你有20/30/40/60/80/100%的概率随机令一名敌方角色失去一点体力"
            },
            "txhj_qiaoqiaoSkill2": {
                name: "清婉",
                desc: "回合结束时，你将手牌数摸至体力值。(至多为5)"
            },
        },
        "lulu": {
            "txhj_luluSkill1": {
                name: "如虎添翼",
                desc: "出牌阶段开始时，你摸两张牌"
            },
            "txhj_luluSkill2": {
                name: "虎威",
                desc: "你于回合内使用第一张[杀]时，若你本回合获得牌数不小于x (x为你的当前体力值)，则你此[杀]不可响应且伤害+1"
            },
        },
        "datong": {
            "txhj_datongSkill1": {
                name: "金鸡独立",
                desc: "当你进入濒死状态时，你回复体力至1点 (每次对局限至多触发一次)"
            },
        },
        "ale": {
            "txhj_aleSkill1": {
                name: "乐不可支",
                desc: "当你于一个回合第一次成为一张基本牌的目标后，若此牌未对你造成伤害，你摸一张牌"
            },
            "txhj_aleSkill2": {
                name: "饞嘴王",
                desc: "准备阶段，若你已受伤且体力值不是全场最高，你回复1点体力"
            },
        },
        "rui": {
            "txhj_ruiSkill1": {
                name: "祥云瑞氣",
                desc: "出牌阶段结束时，你对手牌数小于你的敌方角色造成1点火焰伤害"
            },
            "txhj_ruiSkill2": {
                name: "神妙",
                desc: "准备阶段和结束阶段，若你的手牌数为奇数，你令随机一个我方角色摸一张牌；若手牌数为偶数，你令随机一个敌方角色随机弃一张牌"
            },
            "txhj_ruiSkill3": {
                name: "洞若观火",
                desc: "当你成为其他角色使用的普通锦囊牌的目标时，你进行判定：若为红色，则此锦囊无效且你获得之"
            },
        },
        "yueer": {
            "txhj_yueerSkill1": {
                name: "花容月貌",
                desc: "每轮限一次，当男性角色受到伤害后，你回复一点体力并摸一张牌"
            },
            "txhj_yueerSkill2": {
                name: "娇面",
                desc: "弃牌阶段结束时，你摸两张牌"
            },
        },
        "yan": {
            "txhj_yanSkill1": {
                name: "神鬼不测",
                desc: "当你成为其他角色使用的普通锦囊的唯一目标时，你进行判定：若为黑色，则改为你对使用者使用该锦囊"
            },
            "txhj_yanSkill2": {
                name: "反计",
                desc: "每回合限一次，当你受到其他角色的伤害后，你视为对伤害来源使用一张杀，若该杀造成伤害，则你回复1点体力"
            },
            "txhj_yanSkill3": {
                name: "天外之火",
                desc: "每回合限一次，当你对其他角色造成伤害后，进行一次判定：黑色你获得其一张牌，红色你摸两张牌"
            },
        },
        "ahao": {
            "txhj_aHaoSkill1": {
                name: "豪门贵胄",
                desc: "每场战斗结束时，你获得1件随机装备"
            },
            "txhj_aHaoSkill2": {
                name: "神勇",
                desc: "每当你在牌局内失去装备时对所有敌人造成1点伤害"
            },
            "txhj_aHaoSkill3": {
                name: "攫戾執猛",
                desc: "回合开始时，你摸牌阶段摸牌数、出杀次数、手牌上限+x (x为装备区的装备数)"
            },
        },
        "liuli": {
            "txhj_liuliSkill1": {
                name: "墨玉点雪",
                desc: "其他角色的回合限一次，当你失去牌时，对当前回合角色造成1点伤害"
            },
            "txhj_liuliSkill2": {
                name: "伶俐",
                desc: "每回合限一次，其他角色在弃牌阶段弃牌后，你从弃牌堆获得一张牌"
            },
        },
        "manman": {
            "txhj_manmanSkill1": {
                name: "弄鬼掉猴",
                desc: "回合开始时，你视为使用一张【南蛮入侵】;【南蛮入侵】每造成1点伤害你摸1张牌"
            },
            "txhj_manmanSkill2": {
                name: "捣蛋",
                desc: "每回合限一次，当你对其他角色造成伤害后，你随机获得其一张牌"
            },
        },
        "xiaoxiao": {
            "txhj_xiaoxiaoSkill1": {
                name: "矢无虚发",
                desc: "每回合限一次，当你成为其他角色使用普通锦囊牌的目标后，若你没有受到伤害，则你回复1点体力（若体力已满则改为摸一张牌）"
            },
            "txhj_xiaoxiaoSkill2": {
                name: "弓上弦",
                desc: "弃牌阶段结束时，你从每名装备区装备数不大于你的其他角色处随机获得1张手牌"
            }
        },
        "xueren": {
            "txhj_xuerenSkill1": {
                name: "轻舞飞扬",
                desc: "回合结束时，若你本回合造成过伤害，你摸一张牌"
            },
        },
        "xuanwu": {
            "txhj_xuanwuSkill1": {
                name: "倚天拔地",
                desc: "当其他角色回复体力时，你回复1点体力"
            },
            "txhj_xuanwuSkill2": {
                name: "蛇影",
                desc: "每回合限一次，当你弃置手牌或手牌被弃置时，你随机对X名敌方角色造成1点伤害并摸X张牌。（X为你本次弃置手牌数除以2向上取整）"
            },
            "txhj_xuanwuSkill3": {
                name: "玄冥真主",
                desc: "当其他角色使用锦囊牌指定你为目标时，若该牌点数小于等于你的手牌数，则该锦囊无效"
            }
        },
        "yueling": {
            "tx_yuelingSkill1": {
                name: "灵月之舞",
                desc: "弃牌阶段结束时,你依次对随机目标使用弃牌阶段你弃置的牌(无次数限制且无距离限制)"
            },
            "tx_yuelingSkill2": {
                name: "同辉",
                desc: "其他角色出牌阶段开始时，若你手牌数小于其,则你减少1点体力上限,随机获得其x张牌(x为你与其手牌差值且最多为5)"
            },
            "tx_yuelingSkill3": {
                name: "月华流转",
                desc: "当你减少1点体力上限后，回复1点体力。若以此法回复体力超过体力上限时,超过部分的数值转化为体力上限"
            }
        },
        "kongquemingwang": {
            "txhj_kongquemwSkill1": {
                name: "灵绡旋歌",
                desc: "回合开始时,你令自己本回合接下来使用的x张伤害类卡牌或【桃】的伤害值或回复值+1(x为游戏开始时你拥有的牌库牌的数量)"
            },
            "txhj_kongquemwSkill2": {
                name: "绮翎",
                desc: "每回合限x次,当你造成或受到伤害后,摸x张牌(x为游戏开始时你装备区的牌数)"
            },
            "txhj_kongquemwSkill3": {
                name: "碧语灵裳",
                desc: "你每累计消耗1200金币后,随机获得一个来自过去赛季图鉴中的祝福(至多以此法获得三个)"
            }
        }
    },
    createServantIconList: function (ele, mode) {
        var data = servantData.servant;
        var keys = Object.keys(data)
        for (let i of keys) {
            if (mode) {
                if (lib.config.taixuhuanjing.servants.includes(i)) continue;
            }
            var div = ui.create.div('.taixuhuanjing_servantSelectIcon', ele);
            var img = new Image(88, 88);
            img.classList.add("taixuhuanjing_servantSelectIcon_img");
            img.src = txhjPack.path + '/image/servant/icon/' + i + '.png';
            div.appendChild(img);
            img.onerror = function () {
                console.warn("Servant icon not found: " + i);
                this.onerror = null;
            }
            img.servantName = i;
            img.onclick = function (ev) {
                if (this.servantName == txhj.servant.nickName) return;
                if (!mode || mode != 'add') txhj.servant.nickName = this.servantName;
                if (!mode) {
                    txhj.servant.update(this.servantName);
                    txhj.servant.chooseingPlay(txhj.sldiv, true);
                    txhj.updateSLDesc(txhj.descDiv)
                } else if (mode == 'add') {
                    lib.config.taixuhuanjing.servant.nickName = this.servantName;
                    lib.config.taixuhuanjing.servant.textName = servantData.servant[this.servantName].textName;
                    txhj.changeupdateSLDesc(txhj.descDiv)
                } else if (mode == 'change') {
                    txhj.servant.update(this.servantName);
                    txhj.changeupdateSLDesc(txhj.descDiv)
                }
            }
            div.classList.add("frame" + data[i].grade);
        }
    }
}



export { Servant, servantData };