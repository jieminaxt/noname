'use strict';
import { lib, game, ui, get, ai, _status } from "../../../noname.js";

const txhjModeImport = function () {
	//------------------------//
	lib.skill._txhj_skill_maxCards = {
		mod: {
			ignoredHandcard: function (card, player) {
				if (card && typeof card.hasGaintag === 'function' && card.hasGaintag("牌库")) return true;
			},
			cardDiscardable: function (card, player, name) {
				if (name == "phaseDiscard" && card && typeof card.hasGaintag === 'function' && card.hasGaintag("牌库")) return false;
			},
			maxHandcardBase: function (player, num) {
				if (player == game.me && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing) {
					return num + lib.config.taixuhuanjing.maxHs;
				}
				if (player !== game.me && player.side === false && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing?.Apocalypse?.maxHs > 0) {
					return num + lib.config.taixuhuanjing.Apocalypse.maxHs;
				}
			},
		},
	};
	lib.skill._txhj_skill_TianfuBuff = {
		trigger: {
			player: "phaseDrawBegin2",
			source: "damageBegin1"
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me) return false;
			if (event.name == 'damage') {
				return lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.buff.includes('力胜千钧') && event.num > 0;
			} else {
				return lib.config.txhjtianfuData[lib.config.taixuhuanjing.season].tianfu.buff.includes('生财有道') && !event.numFixed;
			}
		},
		content: async function (event, trigger, player) {
			trigger.num++;
			if (trigger.name == "damage") {
				game.log(player, '触发了【力胜千钧】');
			} else {
				game.log(player, '触发了【生财有道】');
			}
		},
	};
	lib.skill._txhj_skill_Apocalypse = {
		mod: {
			cardUsable: function (card, player, num) {
				if (player !== game.me && player.side === false && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing?.Apocalypse?.sha > 0) {
					if (card.name == "sha") return num + lib.config.taixuhuanjing.Apocalypse.sha;
				}
			},
		},
		trigger: {
			player: ["phaseDrawBegin2", "damageBegin4"],
			source: "damageBegin2"
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, triggerName) {
			if (player === game.me || player.side !== false || lib.config.taixuhuanjing?.Apocalypse?.mark <= 0) return false;
			switch (triggerName) {
				case 'phaseDrawBegin2': return lib.config.taixuhuanjing?.Apocalypse?.draw > 0 && !event.numFixed;
				case 'damageBegin2': return lib.config.taixuhuanjing?.Apocalypse?.damage > 0;
				case 'damageBegin4': return lib.config.taixuhuanjing?.Apocalypse?.damageZero > 0 && event.num > 0;
				default: return false;
			}
		},
		content: async function (event, trigger, player) {
			switch (event.triggername) {
				case 'phaseDrawBegin2': trigger.num += lib.config.taixuhuanjing.Apocalypse.draw; break;
				case 'damageBegin2': trigger.num += lib.config.taixuhuanjing.Apocalypse.damage; break;
				case 'damageBegin4': trigger.num -= lib.config.taixuhuanjing.Apocalypse.damageZero; break;
				default: return;
			}
		}
	};
	lib.skill._txhj_skill_Apocalypse_0 = {
		trigger: {
			player: "gainAfter",
			global: "loseAsyncAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player !== game.me || !lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(0) || _status.currentPhase != player) return false;
			return event.getParent().name == 'draw' && event.getParent(2).name != 'phaseDraw';
		},
		content: async function (event, trigger, player) {
			let num = trigger.cards.length;
			await player.randomDiscard("h", num);
		}
	};
	lib.skill._txhj_skill_Apocalypse_1 = {
		mod: {
			"cardEnabled2": function (card, player) {
				let suit = player.storage.txhj_skill_Apocalypse_1;
				if (get.itemtype(card) == "card" && suit && suit.includes(get.suit(card))) return false;
			},
			cardDiscardable: function (card, player) {
				let suit = player.storage.txhj_skill_Apocalypse_1;
				if (suit && suit.includes(get.suit(card))) return false;
			},
		},
		trigger: {
			global: "roundStart"
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player !== game.me || !lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(1)) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			if (!player.hasSkill("txhj_skill_Apocalypse_1")) await player.addSkill("txhj_skill_Apocalypse_1");
			const suits = ['spade', 'heart', 'diamond', 'club'];
			let suitCounts = suits.map(suit => ({
				name: suit,
				value: player.countCards('h', suit)
			}));
			suitCounts.sort((a, b) => b.value - a.value);
			let topSuits = suitCounts.slice(0, 2).map(suit => suit.name);
			let result = await player.judge(function (card) {
				return !topSuits.includes(get.suit(card)) ? 2 : -2;
			}).forResult();
			player.storage.txhj_skill_Apocalypse_1 = result.suit;

		},
	}
	lib.skill.txhj_skill_Apocalypse_1 = {
		init: function (player) {
			player.storage.txhj_skill_Apocalypse_1 = null;
			player.markSkill("txhj_skill_Apocalypse_1");
		},
		mark: true,
		marktext: "禁",
		intro: {
			name: "禁止",
			content: function (storage, player) {
				return `不能使用、打出或弃置${get.translation(storage)}牌`;
			}
		},
	};
	lib.translate._txhj_skill_Apocalypse_1 = "末日";
	lib.skill._txhj_skill_Apocalypse_2 = {
		trigger: {
			player: "loseAfter",
			global: "loseAsyncAfter",
		},
		filter: function (event, player) {
			if (player !== game.me || !lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(2)) return false;
			return event.type == "discard" && event.getl(player).cards2.length > 0 && _status.currentPhase == player;
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		content: async function (event, trigger, player) {
			await player.loseHp();
			if (trigger.getl(player).cards2.length > 2) await player.loseHp();
		},
	};
	lib.skill._txhj_skill_Apocalypse_3 = {
		trigger: {
			source: "damageBegin",
		},
		filter: function (event, player) {
			if (player !== game.me || !lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(3)) return false;
			return player.getRoundHistory('sourceDamage').length > 0;
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		content: async function (event, trigger, player) {
			const num = player.getRoundHistory('sourceDamage').length;
			const dcard = player.randomDiscard('h', num);
			if (dcard.length < num) trigger.cancel();
		},
	};
	lib.skill._txhj_skill_Apocalypse_4 = {
		trigger: {
			global: "phaseBegin",
		},
		filter: function (event, player) {
			const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
			if (player !== game.me || !Apocalypse?.debuff?.includes(4) && !Apocalypse.skill[2]) return false;
			return player.countCards('h') >= 0;
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		content: async function (event, trigger, player) {
			const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
			if (Apocalypse.debuff.includes(4)) {
				const target = game.players.filter(p => p != player);
				for (const p of target) {
					const cards = player.getCards('h', c => !c.hasGaintag("牌库"));
					if (cards && cards.length > 0) {
						const card = cards.randomGet();
						if (card) {
							await player.give(card, p);
						}
					}
				}
			}
			if (Apocalypse.skill[2] > 0) {
				const target = game.players.filter(p => p != player && p.isEnemiesOf(player));
				for (const p of target) {
					const cards = player.getCards('h', c => !c.hasGaintag("牌库"));
					if (cards && cards.length > 0) {
						const card = cards.randomGets(Apocalypse.skill[2]);
						if (card) {
							await player.give(card, p);
						}
					}
				}
			}
		},
	};
	lib.skill._txhj_skill_Apocalypse_5 = {
		mod: {
			cardEnabled2(card, player) {
				if (player == game.me && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(5)) {
					if (card.name == "sha" && !card.hasNature()) {
						return false;
					}
				}
			},
			cardRespondable(card, player) {
				if (player == game.me && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(5)) {
					if (card.name == "sha" && !card.hasNature()) {
						return false;
					}
				}
			}
		}
	};
	lib.skill._txhj_skill_Apocalypse_6 = {
		trigger: {
			player: "phaseEndBegin",
		},
		filter: function (event, player) {
			const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
			if (player !== game.me || !Apocalypse?.debuff?.includes(6)) return false;
			return player.isDamaged();
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		content: async function (event, trigger, player) {
			player.maxHp = player.hp;
		}
	};
	lib.skill._txhj_skill_Apocalypse_7 = {
		trigger: {
			player: "phaseDrawBefore",
		},
		filter: function (event, player) {
			const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
			if (player !== game.me || !Apocalypse?.debuff?.includes(7)) return false;
			return true;
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		content: async function (event, trigger, player) {
			trigger.cancel();
		}
	};
	lib.skill._txhj_skill_Apocalypse_8 = {
		mod: {
			cardEnabled(card, player) {
				if (player == game.me && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(8)) {
					if (_status.currentPhase != player) {
						return;
					}
					console.log(player.countUsed());
					if (player.countUsed() >= 3) {
						return false;
					}
				}
			},
			cardSavable(card, player) {
				if (player == game.me && get.mode() == 'taixuhuanjing' && lib.config.taixuhuanjing?.Apocalypse?.debuff?.includes(8)) {
					if (_status.currentPhase != player) {
						return;
					}
					if (player.countUsed() >= 3) {
						return false;
					}
				}
			},
		}
	};
	lib.skill._txhj_skill_Apocalypse_50_1 = {
		trigger: {
			player: "loseAfter",
			global: ["loseAsyncAfter", "equipAfter", "addToExpansionAfter", "gainAfter", "addJudgeAfter"],
		},
		filter: function (event, player) {
			const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
			if (player !== game.me || !Apocalypse.skill[1]) return false;
			return true;
		},
		priority: 6,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		content: async function (event, trigger, player) {
			const Apocalypse = lib.config.taixuhuanjing.Apocalypse;
			if (player.countCards('h') >= Apocalypse.skill[1] && !player.hasSkill('baiban')) {
				await player.addSkill('baiban');
			} else if (player.countCards('h') < Apocalypse.skill[1] && player.hasSkill('baiban')) {
				await player.removeSkill('baiban');
			}
		}
	};
	lib.skill._txhj_skill_Timelimit = {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		direct: true,
		filter: function (event, player) {
			return get.mode() == 'taixuhuanjing' && player == game.me;
		},
		content: function () {
			var event1 = _status.TaiXuHuanJingGame.event;
			var event2 = game.eventPack[event1.season][event1.chapter][event1.id];
			if (event2.type == 'main' || event2.type == 'micheng' || event2.type == 'dungeons' || event2.type == 'side' || event2.type == 'boss' || event2.type == 'Ultimate') {
				if (event2.target == 'repair') {
					for (var i = 0; i < game.players.length; i++) {
						if (game.players[i].side == true && game.players[i] != game.me) {
							if (game.players[i].hp == game.players[i].maxHp && game.players[i].exten && game.players[i].exten.type == 'boss') {
								game.TaiXuHuanJingState(true);
								return;
							}
						}
					}
				}
				if (event2.max > 1 && game.roundNumber > event2.max) {
					if (event2.target == 'subsist') {
						game.TaiXuHuanJingState(true);
						return;
					}
					game.TaiXuHuanJingState(false);
					return;
				}
			}
		},
	};
	/*
		lib.skill._txhj_skill_Timelimit = {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		direct: true,
		filter: function(event, player) {
			return get.mode() == 'taixuhuanjing' && player == game.me;
		},
		content: function() {
			var event1 = _status.TaiXuHuanJingGame.event;
			var event2 = game.eventPack[event1.season][event1.chapter][event1.id];
			if (event2.type == 'main' ||event2.type == 'micheng' ||event2.type == 'dungeons' ||event2.type == 'side' || event2.type == 'boss' || event2.type == 'Ultimate') {
				if (event2.max > 1 && game.roundNumber > event2.max) {
					if (event2.target == 'subsist') {
						game.TaiXuHuanJingState(true);
					} else {
						if (event2.unique && event2.unique == true) {
							game.TaiXuHuanJingState(false);
						} else {
							game.TaiXuHuanJingState(null);
						}
					}
					return;
				}
				if (event2.target == 'repair') {
					for (var i = 0; i < game.players.length; i++) {
						if (game.players[i].side == true && game.players[i] != game.me) {
							if (game.players[i].hp == game.players[i].maxHp && game.players[i].exten && game.players[i].exten.type == 'boss') {
								game.TaiXuHuanJingState(true);
								break;
							}
						}
					}
				}
			}
		},
	};
	*/
	lib.skill._txhj_skill_addEffectStyle = {
		trigger: {
			player: "enterGame",
			global: "gameStart",
		},
		usable: 1,
		forced: true,
		popup: false,
		priority: 16,
		filter: function (event, player) {
			return get.mode() == 'taixuhuanjing' && player == game.me;
		},
		content: function () {
			player.buff = {};
			var buffBox = document.createElement("div");
			buffBox.classList.add("playerbuffstyle2");
			function createBuff(ele, name) {
				if (!ele || !name) return;
				const buff = game.buffPack[name];
				if (!buff) return;
				var img = new Image();

				img.classList.add("SLBuff");
				game.promises.checkFile('extension/太虚幻境/image/buff/' + name + '.png').then(function (result) {
					if (result === 1) {
						img.src = txhjPack.path + '/image/buff/' + name + '.png';
					} else {
						console.log('未找到图片：' + 'extension/太虚幻境/image/buff/' + name + '.png');
						img.src = txhjPack.path + '/image/buff/moren.png';
					}
				});
				//img.src = txhjPack.path + '/image/buff/' + name + '.png';
				img.setAttribute("id", name);
				var desc = document.createElement("div");
				desc.classList.add("SLBuffDesc");

				desc.innerHTML = "<p style='color: gold;margin: 2%;'>" + buff.name + "</p>" +
					"<p style='margin: 2%;'>" + buff.info + "</p>";
				desc.style.display = "none";
				img.desc = desc;
				document.body.appendChild(desc);
				img.addEventListener("click", function () {
					event.cancelBubble = true;
					event.returnValue = false;
					return false;
				});
				img.onmouseover = function () {
					this.desc.style.display = "block";
				};
				img.onmouseout = function () {
					this.desc.style.display = "none";
				};
				img.update = function () {
					this.classList.add("SLBuffAnim");
					var that = this;
					setTimeout(function () {
						that.classList.remove("SLBuffAnim");
					}, 1000);
				};
				img.remove = function () {
					this.desc.remove();
					var t = this;
					t.parentNode.removeChild(t);
					delete game.me.buff[name];
				};
				player.buff[name] = img;

				ele.appendChild(img);
			}

			txhj.createBuff = createBuff;

			var ssui = document.getElementsByClassName("skill-control");
			if (false) {
				const ssuif = ssui[0].getElementsByClassName("trigger");
				if (ssuif?.length > 0) ssuif[0].style.float = "right";
				if (buffBox && ssui[0].firstChild) ssui[0].insertBefore(buffBox, ssui[0].firstChild);
			} else {
				buffBox.classList.remove("playerbuffstyle2");
				buffBox.classList.add("playerbuffstyle3");
				ui.arena.appendChild(buffBox);
			}
			player.buff.update = function () {
				var buffs = lib.config.taixuhuanjing.buff;
				for (var i = 0; i < buffs.length; i++) {
					var buff = buffs[i];
					if (player.buff[buff]) continue;
					createBuff(buffBox, buff);
				}
			}
			game.me.buff.update();
			//lib.config.taixuhuanjing.buff.push('buff_txhj_wuzhongshengshan');
			//lib.config.taixuhuanjing.buff.remove('buff_txhj_wuzhongshengshan');
			//举个栗子-移除buff图标
			//game.me.buff['luluSkill1'].remove();
			//举个栗子-添加buff图标
			//txhj.createBuff(document.querySelector("#arena > div.skill-control > div.playerbuffstyle2"),'luluSkill1');

		}
	};
	//------------------------------------//
	//--------------------------------------------------------------//
	if (get.mode() === 'taixuhuanjing') {

		lib.skill._txhj_skill_gaincard = {
			trigger: { player: 'gainEnd' },
			forced: true,
			direct: true,
			locked: true,
			noRemove: true,
			noDisabled: true,
			filter: function (event, player) {
				return event.cards && event.cards.length > 0 && player == game.me && _status?.modeNode;
			},
			content: function () {
				var num = trigger.cards.length;
				_status.modeNode.score.gaincard += num;
			}
		};
		lib.skill._txhj_skill_discard = {
			trigger: { player: 'discardAfter' },
			forced: true,
			direct: true,
			locked: true,
			noRemove: true,
			noDisabled: true,
			filter: function (event, player) {
				return event.cards.length > 0 && player == game.me && _status?.modeNode;
			},
			content: function () {
				var num = trigger.cards.length;
				_status.modeNode.score.discard += num;
			}
		};
		lib.skill._txhj_skill_usecard = {
			trigger: { player: "useCardAfter" },
			forced: true,
			direct: true,
			locked: true,
			noRemove: true,
			noDisabled: true,
			filter: function (event, player) {
				return event.card && player == game.me && _status.modeNode;
			},
			content: function () {
				_status.modeNode.score.usecard++;
			}
		};
		lib.skill._txhj_skill_damage = {
			trigger: { global: 'damageEnd' },
			silent: true,
			filter: function (event, player) {
				return (event.source == game.me || event.player == game.me) && event.num > 0 && _status?.modeNode;
			},
			content: function () {
				if (trigger.source == game.me) {
					_status.modeNode.score.damage += trigger.num;
				}
				else {
					_status.modeNode.score.damaged += trigger.num;
				}
			},
		};
		lib.skill._txhj_skills_kill = {
			trigger: { source: "dieBegin" },
			priority: 99999,
			forced: true,
			noRemove: true,
			noDisabled: true,
			filter: function (event, player) {
				return (event.source && player == game.me && event.source.isIn()) && _status?.modeNode;
			},
			content: function () {
				_status.modeNode.score.kill++;
			},
		};
		var txhjUseSkill = game.trySkillAudio;
		game.trySkillAudio = function (skill, player, directaudio) {
			txhjUseSkill(skill, player, directaudio);
			game.countPlayer(function (current) {
				var skills = [];
				if (current.hiddenSkills.length == 0) {
					if (current.name && !current.name2) {
						for (var i = 0; i < lib.character[current.name][3].length; i++) {
							skills.push(lib.character[current.name][3][i]);
						}
					}
					if (current.name && current.name2) {
						for (var i = 0; i < lib.character[current.name][3].length; i++) {
							skills.push(lib.character[current.name][3][i]);
						}
						for (var i = 0; i < lib.character[current.name2][3].length; i++) {
							skills.push(lib.character[current.name2][3][i]);
						}
					}
				}
				if (skills.includes(skill) && current == game.me && _status.modeNode) {
					_status.modeNode.score.skill++;
				}
			});
		};

		//宝物栏效果

		lib.skill._txhj_equip5 = {
			trigger: {
				player: 'equipBegin'
			},
			charlotte: true,
			direct: true,
			firstDo: true,
			priority: 1000,
			filter: function (event, player) {
				return event?.card?.cards?.length > 0 && player.countCards('e', {
					subtype: 'equip5'
				}) >= 1 && get.subtype(event.card) == 'equip5';
			},
			content: function () {
				"step 0"
				if (trigger.card.clone) trigger.card.clone.moveDelete(player);
				trigger.untrigger();
				trigger.finish();
				"step 1"
				var es = player.getCards('e', {
					subtype: 'equip5'
				});
				player.$equip(trigger.card.cards[0]);
				game.addVideo('equip', player, get.cardInfo(trigger.card));
				game.log(player, '装备了', trigger.card);
				if (es.length == 2) {
					player.discard(es[0]);
				}
				"step 2"
				var info = get.info(trigger.card);
				if (info.onEquip && (!info.filterEquip || info.filterEquip(trigger.card, player))) {
					var next = game.createEvent('equip_' + trigger.card.name);
					next.setContent(info.onEquip);
					next.player = player;
					next.trigger.card = trigger.card;
					game.delayx();
				}
				delete player.equiping;
				"step 3"
				var es = player.getCards('e', {
					subtype: 'equip5'
				});
				if (es.length == 2) {
					es[0].classList.remove('equip6');
					es[1].classList.remove('equip5');
					es[0].classList.add('equip5');
					es[1].classList.add('equip6');
				}
			},
			ai: {
				effect: {
					player: function (card, player, target) {
						if (player.countCards('e', {
							subtype: 'equip5'
						}) == 1 && get.subtype(card) == 'equip5') return [1, 10];
					}
				}
			},
		};
		lib.skill.twsidao = {
			audio: 2,
			trigger: {
				global: 'phaseBefore',
				player: 'enterGame',
			},
			forced: true,
			locked: false,
			filter: function (event, player) {
				return (event.name != 'phase' || game.phaseNumber == 0) && !player.storage.twsidao;
			},
			content: function () {
				'step 0'
				player.chooseButton(['请选择你的初始法宝', [
					['txhj_lingbaoxianhu', 'txhj_taijifuchen', 'txhj_chongyingshenfu'], 'vcard'
				]], true).set('ai', function (button) {
					return button.link[2] == 'txhj_chongyingshenfu' ? 2 : 1;
				});
				'step 1'
				if (result.bool) {
					var card = game.createCard2(result.links[0][2]);
					lib.inpile.add(result.links[0][2]);
					player.storage.twsidao = card;
					player.chooseUseTarget(card, 'nopopup', true);
				}
			},
			group: "twsidao_equip",

		};

		lib.skill.twsidao_equip = {
			audio: 'twsidao',
			trigger: {
				player: 'phaseZhunbeiBegin'
			},
			forced: true,
			filter: function (event, player) {
				var card = player.storage.twsidao;
				return card && card.isInPile() && player.hasUseTarget(card);
			},
			content: function () {
				player.chooseUseTarget(player.storage.twsidao, 'nopopup', true);
			},
		};
		lib.translate.twsidao_equip = "司道";

		lib.skill.polu = {
			audio: 2,
			trigger: {
				player: 'phaseZhunbeiBegin'
			},
			forced: true,
			filter: function (event, player) {
				if (!lib.inpile.includes('txhj_piliche')) return true;
				return !!get.cardPile(function (card) {
					return card.name == 'txhj_piliche';
				});
			},
			content: function () {
				var card;
				if (!lib.inpile.includes('txhj_piliche')) {
					card = game.createCard2('txhj_piliche', 'diamond', 1);
					lib.inpile.push('txhj_piliche');
				} else card = get.cardPile(function (card) {
					return card.name == 'txhj_piliche';
				});
				player.chooseUseTarget(card, true, 'nopopup');
			},
			group: "polu_damage",
		};
		lib.skill.polu_damage = {
			trigger: {
				player: 'damageEnd'
			},
			forced: true,
			filter: function (event, player) {
				return !player.getEquip('txhj_piliche');
			},
			content: function () {
				'step 0'
				event.count = trigger.num;
				'step 1'
				event.count--;
				player.draw();
				'step 2'
				var card = get.cardPile2(function (card) {
					return get.subtype(card, false) == 'equip1' && player.canUse(card, player);
				});
				if (card) player.chooseUseTarget(card, true, 'nopopup');
				'step 3'
				if (event.count > 0 && !player.getEquip('txhj_piliche')) event.goto(1);
			},
		};
		lib.translate.polu_damage = "破橹";

		//焚城掠土和卧龙秘策两个祝福
		lib.card.huogong = {
			audio: true,
			fullskin: true,
			type: 'trick',
			enable: true,
			filterTarget: function (card, player, target) {

				return target.countCards('h') > 0;
			},
			content: function () {
				"step 0"
				if (target.countCards('h') == 0) {
					event.finish();
					return;
				}
				target.chooseCard(true).ai = function (card) {
					if (_status.event.getRand() < 0.5) return Math.random();
					return get.value(card);
				};
				"step 1"
				event.dialog = ui.create.dialog(get.translation(target) + '展示的手牌', result.cards);
				event.videoId = lib.status.videoId++;

				game.broadcast('createDialog', event.videoId, get.translation(target) + '展示的手牌', result.cards);
				game.addVideo('cardDialog', null, [get.translation(target) + '展示的手牌', get.cardsInfo(result.cards), event.videoId]);
				event.card2 = result.cards[0];
				game.log(target, '展示了', event.card2);
				event._result = {};

				if (player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_wolongmice')) {
					game.log(player, '发动了【卧龙秘策】');
					player.buffUpdate(event.name);
					var order = {
						color: get.color(event.card2)
					};
				} else {
					var order = {
						suit: get.suit(event.card2)
					};
				}
				player.chooseToDiscard(order, function (card) {
					var evt = _status.event.getParent();
					if (get.damageEffect(evt.target, evt.player, evt.player, 'fire') > 0) {
						return 7 - get.value(card, evt.player);
					}
					return -1;
				}).set('prompt', false);
				game.delay(2);
				"step 2"
				if (result.bool) {

					if (player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_fenchengluetu')) {
						game.log(player, '触发了【焚城掠土】');
						player.buffUpdate(event.name);
						player.gain(event.card2, 'log', 'gain2');
					}
					target.damage('fire', event.baseDamage || 1);
				} else {
					target.addTempSkill('huogong2');
				}
				event.dialog.close();
				game.addVideo('cardDialog', null, event.videoId);
				game.broadcast('closeDialog', event.videoId);
			},
			ai: {
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
								_status.event.filterCard({
									name: 'huogong'
								}, player, _status.event)) {
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
								_status.event.filterCard({
									name: 'huogong'
								}, player, _status.event)) {
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
					}
				},
				tag: {
					damage: 1,
					fireDamage: 1,
					natureDamage: 1,
					norepeat: 1
				}
			}
		};


		//替换国风玉袍
		lib.skill.guofengyupao = {
			equipSkill: true,
			mod: {
				targetEnabled: function (card, player, target, now) {
					if (target.hasSkillTag('unequip2')) return;
					if (player == target || get.type(card) != 'trick') return;
					if (player.hasSkillTag('unequip', false, {
						name: card ? card.name : null,
						target: target,
						card: card
					}) || player.hasSkillTag('unequip_ai', false, {
						name: card ? card.name : null,
						target: target,
						card: card
					})) return;
					return false;
				}
			},
		};

		//太极拂尘——拂尘荡魔+深寒雪饮
		lib.skill.gx_taijifuchen = {
			trigger: {
				player: 'useCardToPlayered'
			},
			forced: true,
			equipSkill: true,
			filter: function (event, player) {
				return event.card && event.card.name == 'sha';
			},
			logTarget: 'target',
			content: function () {
				'step 0'
				event.count = 1;
				'step 1'
				var suit = get.suit(trigger.card);
				var num = trigger.target.countCards('h', 'shan');
				var next = trigger.target.chooseToDiscard('弃置一张牌，或不能响应' + get.translation(trigger.card), 'he').set('ai', function (card) {
					var num = _status.event.num;
					if (num == 0) return 0;
					if (card.name == 'shan') return num > 1 ? 2 : 0;
					return (get.suit(card) != _status.event.suit ? 9 : 6) - get.value(card);
				}).set('num', num);
				if (lib.suit.includes(suit)) {
					next.set('prompt2', '若弃置的是' + get.translation(suit) + '牌，则改为' + get.translation(player) + '获得之');
					next.set('suit', suit);
				}
				'step 2'
				if (result.bool) {
					var card = result.cards[0];
					if (get.suit(card, trigger.target) == get.suit(trigger.card, false) && get.position(card) == 'd') {
						player.gain(card, 'gain2');
					} else {

						if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shenhanxueyin') && player == game.me) {
							player.buffUpdate(event.name);
							game.log(player, '触发了【深寒雪饮】');
							player.gain(card, 'gain2');

						}
					}
					if (event.count > 0) {
						game.log(player, '发动了【拂尘荡魔】');
						player.buffUpdate(event.name);
						event.count--;
						event.goto(1);
					} else {
						event.finish();
					}
				} else {
					trigger.directHit.add(trigger.target);
				}
			},
		};

		//寒冰剑—拂尘荡魔+深寒雪饮
		lib.skill.hanbing_skill = {
			equipSkill: true,
			trigger: {
				source: 'damageBegin2'
			},
			audio: true,
			filter: function (event, player) {
				return event.card && event.card.name == 'sha' && event.notLink() && event.player.getCards('he').length > 0;
			},
			check: function (event, player) {
				var target = event.player;
				var eff = get.damageEffect(target, player, player, event.nature);
				if (get.attitude(player, target) > 0) {
					if (eff >= 0) return false;
					return true;
				}
				if (eff <= 0) return true;
				if (target.hp == 1) return false;
				if (event.num > 1 || player.hasSkill('tianxianjiu') ||
					player.hasSkill('luoyi2') || player.hasSkill('reluoyi2')) return false;
				if (target.countCards('he') < 2) return false;
				var num = 0;
				var cards = target.getCards('he');
				for (var i = 0; i < cards.length; i++) {
					if (get.value(cards[i]) > 6) num++;
				}
				if (num >= 2) return true;
				return false;
			},
			logTarget: "player",
			content: function () {
				"step 0"
				trigger.cancel();
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_fuchendangmo') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【拂尘荡魔】');
					event.count = 2;
				} else {
					event.count = 1;
				}
				"step 1"
				if (trigger.player.countDiscardableCards(player, 'he')) {
					player.line(trigger.player);
					player.discardPlayerCard('he', trigger.player, true);
				} else {
					event.finish();
				}
				"step 2"
				if (result.bool && lib.config.taixuhuanjing.buff.includes('buff_txhj_shenhanxueyin')) {
					var card = result.cards[0];
					player.buffUpdate(event.name);
					game.log(player, '触发了【深寒雪饮】');
					player.gain(card, 'gain2');
				}
				"step 3"
				if (event.count > 0) {
					event.count--;
					event.goto(1);
				} else {
					event.finish();
				}
			},
		};

		//雌雄双股剑—拂尘荡魔+深寒雪饮
		lib.skill.cixiong_skill = {
			equipSkill: true,
			trigger: {
				player: 'useCardToPlayered'
			},
			audio: true,
			logTarget: 'target',
			check: function (event, player) {
				if (get.attitude(player, event.target) > 0) return true;
				var target = event.target;
				return target.countCards('h') == 0 || !target.hasSkillTag('noh');
			},
			filter: function (event, player) {
				if (event.card.name != 'sha') return false;
				return player.differentSexFrom(event.target);
			},
			content: function () {
				"step 0"
				var num = 1;
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_fuchendangmo') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【拂尘荡魔】');
					num++;
				}
				var str = '弃置' + get.cnNumber(num, true) + '张手牌，或令';
				trigger.target.chooseToDiscard(str + get.translation(player) + '摸一张牌', num).set('ai', function (card) {
					var trigger = _status.event.getTrigger();
					return -get.attitude(trigger.target, trigger.player) - get.value(card);
				});
				"step 1"
				if (result.bool) {
					//----------------------//
					if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shenhanxueyin')) {
						var card = result.cards;
						player.buffUpdate(event.name);
						game.log(player, '触发了【深寒雪饮】');
						player.gain(card, 'gain2');
					} else {
						event.finish();
					}
					//---------------------//
				} else {
					player.draw();
				}
			},
		};

		//无双方天戟—拂尘荡魔+深寒雪饮
		lib.skill.wushuangfangtianji_skill = {
			equipSkill: true,
			trigger: {
				source: "damageSource",
			},
			filter: function (event, player) {
				return event.card && event.card.name == 'sha';
			},
			content: function () {
				'step 0'
				player.line(trigger.player, 'white');
				if (!trigger.player.countCards('he')) {
					event.goto(1);
				} else {
					event.goto(2);
				}
				'step 1'
				player.draw();
				event.finish();
				'step 2'
				player.chooseControl('摸一张牌', '弃置其一张牌', function (event, player) {
					if (get.attitude(player, trigger.player) > 2) return '摸一张牌';
					return '弃置其一张牌';
				});
				'step 3'
				if (result.control == '摸一张牌') {
					player.draw();
					event.finish();
				} else {
					event.goto(4);
				}
				'step 4'
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_fuchendangmo') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【拂尘荡魔】');
					event.count = 1;
				} else {
					event.count = 0;
				}

				'step 5'
				if (trigger.player.countCards('he')) {
					player.line(trigger.player);
					player.discardPlayerCard(trigger.player, 'he', true);
				} else {
					event.finish();
				}
				'step 6'
				if (result.bool && lib.config.taixuhuanjing.buff.includes('buff_txhj_shenhanxueyin')) {
					var card = result.cards[0];
					player.buffUpdate(event.name);
					game.log(player, '触发了【深寒雪饮】');
					player.gain(card, 'gain2');
				}
				'step 7'
				if (event.count > 0) {
					event.count--;
					event.goto(5);
				} else {
					event.finish();
				}
			},
		};

		//麒麟弓—拂尘荡魔+深寒雪饮
		lib.translate.qilin_info = '当你使用【杀】对目标角色造成伤害时，你可以弃置其装备区里的一张宝物牌。';
		lib.translate.qilin_skill_info = '当你使用【杀】对目标角色造成伤害时，你可以弃置其装备区里的一张宝物牌。';
		lib.skill.qilin_skill = {
			equipSkill: true,
			trigger: { source: 'damageBegin2' },
			filter: function (event, player) {
				return event.card && event.card.name == 'sha' && event.notLink() && event.player.getCards('e', { subtype: 'equip5' }).length > 0;
			},
			direct: true,
			audio: true,
			content: function () {
				"step 0"
				if (trigger.player.countCards('e', { subtype: 'equip5' }) > 1 && lib.config.taixuhuanjing.buff.includes('buff_txhj_fuchendangmo') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【拂尘荡魔】');
					event.fuchener = true;
				}
				"step 1"
				var att = (get.attitude(player, trigger.player) <= 0);
				var next = player.chooseButton();
				next.set('att', att);
				next.set('createDialog', ['是否发动【麒麟弓】，弃置' + get.translation(trigger.player) + '的一张宝物牌？', trigger.player.getCards('e', { subtype: 'equip5' })]);
				next.set('ai', function (button) {
					if (_status.event.att) return get.buttonValue(button);
					return 0;
				});
				"step 2"
				if (result.bool) {
					if (!event.activated) player.logSkill('qilin_skill', trigger.player);
					trigger.player.discard(result.links[0]);
					event.cs = result.links;
					if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shenhanxueyin') && player == game.me) {
						event.goto(3);
					} else {
						event.goto(4);
					}
				}
				else event.finish();
				"step 3"
				var card = event.cs;
				player.buffUpdate(event.name);
				game.log(player, '触发了【深寒雪饮】');
				player.gain(card, 'gain2');
				"step 4"
				event.activated = true;
				if (!event.added && event.fuchener) {
					event.added = true;
					event.goto(1);
				}
			},
		};

		//贯石斧—上将的膂力		
		lib.skill.guanshi_skill = {
			equipSkill: true,
			trigger: {
				player: 'shaMiss'
			},
			direct: true,
			audio: true,
			filter: function (event, player) {
				if (player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli')) return player.countCards('he', function (card) {
					return card != player.getEquip('guanshi');
				}) >= 1 && event.target.isAlive();

				return player.countCards('he', function (card) {
					return card != player.getEquip('guanshi');
				}) >= 2 && event.target.isAlive();
			},
			content: function () {
				"step 0"
				var num = 1;
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【上将的膂力】');
				} else {
					num++;
				}
				var next = player.chooseToDiscard(get.prompt('guanshi'), num, 'he', function (card) {
					return _status.event.player.getEquip('guanshi') != card;
				});
				next.logSkill = 'guanshi_skill';
				next.set('ai', function (card) {
					var evt = _status.event.getTrigger();
					if (get.attitude(evt.player, evt.target) < 0) {
						if (evt.baseDamage + evt.extraDamage >= Math.min(2, evt.target.hp)) {
							return 8 - get.value(card)
						}
						return 5 - get.value(card)
					}
					return -1;
				});
				"step 1"
				if (result.bool) {
					trigger.untrigger();
					trigger.trigger('shaHit');
					trigger._result.bool = false;
					trigger._result.result = null;
				}
			},
			ai: {
				directHit_ai: true,
				skillTagFilter: function (player, tag, arg) {
					if (player._guanshi_temp) return;
					player._guanshi_temp = true;
					var bool = (get.attitude(player, arg.target) < 0 && arg.card.name == 'sha' && player.countCards('he', function (card) {
						return card != player.getEquip('guanshi') && card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card)) && get.value(card) < 5;
					}) > 1);
					delete player._guanshi_temp;
					return bool;
				},
			},
		};

		//三尖两刃刀—上将的膂力
		lib.skill.sanjian_skill = {
			equipSkill: true,
			audio: true,
			trigger: { source: 'damageSource' },
			direct: true,
			filter: function (event, player) {
				if (event.player.isDead()) return false;
				//if(player.countCards('h')==0) return false;
				if (!event.card) return false;
				if (event.card.name != 'sha') return false;
				if (!event.notLink()) return false;
				return game.hasPlayer(function (current) {
					return current != event.player && get.distance(event.player, current) <= 1;
				});
			},
			content: function () {
				"step 0"
				var damaged = trigger.player;
				var str;
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli') && player == game.me) {
					str = '三尖两刃刀(上将的膂力):是否选择一个目标？';
				} else {
					str = '三尖两刃刀:是否弃置一张手牌牌并选择一个目标？';
				}
				player.chooseCardTarget({
					filterCard: lib.filter.cardDiscardable,
					//------------------------//
					selectCard: function (player, num) {
						var player = _status.event.player;
						var num = 0;
						if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli') && player == game.me) {
							return num;
						} else {
							num++;
							return num;
						}
					},
					//-----------------------------//
					filterTarget: function (card, player, target) {
						var damaged = _status.event.damaged;
						return get.distance(damaged, target) <= 1 && target != damaged;
					},
					ai1: function (card) {
						return 9 - get.value(card);
					},
					ai2: function (target) {
						var player = _status.event.player;
						return get.damageEffect(target, player, player);
					},
					prompt: str,
				}).set('damaged', damaged);
				"step 1"
				if (result.bool) {
					player.logSkill('sanjian_skill', result.targets);
					player.discard(result.cards);
					if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli') && player == game.me) {
						game.log(player, '发动了【上将的膂力】');
						player.buffUpdate(event.name);
					}
					result.targets[0].damage();
				}
			}
		};
		//倚天剑—上将的膂力
		lib.skill.yitianjian = {
			audio: true,
			trigger: {
				source: 'damageSource'
			},
			direct: true,
			equipSkill: true,
			filter: function (event, player) {
				return event.card && event.card.name == 'sha' && event.getParent().name == 'sha' && player.isDamaged() && player.countCards('h') > 0;
			},
			content: function () {
				'step 0'
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【上将的膂力】');
					player.recover();
					event.finish();
				} else {
					event.goto(1);
				}
				'step 1'
				player.chooseToDiscard('h', get.prompt('yitianjian'), '弃置一张手牌并回复1点体力').set('ai', (card) => 7 - get.value(card)).logSkill = 'yitianjian';
				'step 2'
				if (result.bool) player.recover();
			},
		};

		//烈淬刃—上将的膂力		
		lib.skill.pyzhuren_diamond = {
			audio: true,
			trigger: {
				source: 'damageBegin1'
			},
			direct: true,
			usable: 2,
			equipSkill: true,
			mod: {
				cardUsable: function (card, player, num) {
					var cardx = player.getEquip('pyzhuren_diamond');
					if (card.name == 'sha' && (!cardx || player.hasSkill('pyzhuren_diamond', null, false) || (!_status.pyzhuren_diamond_temp && !ui.selected.cards.includes(cardx)))) {
						return num + 1;
					}
				},
				cardEnabled2: function (card, player) {
					if (!_status.event.addCount_extra || player.hasSkill('pyzhuren_diamond', null, false)) return;
					if (card && card == player.getEquip('pyzhuren_diamond')) {
						_status.pyzhuren_diamond_temp = true;
						var bool = lib.filter.cardUsable(get.autoViewAs({
							name: 'sha'
						}, ui.selected.cards.concat([card])), player);
						delete _status.pyzhuren_diamond_temp;
						if (!bool) return false;
					}
				},
			},
			filter: function (event, player) {
				if (event.getParent().name != 'sha') return false;
				return player.countCards('he', function (card) {
					return card != player.getEquip('pyzhuren_diamond');
				}) >= 0;
			},
			content: function () {
				'step 0'
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_shangjiangdelvli') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【上将的膂力】');
					trigger.num++;
					event.finish();
				} else {
					event.goto(1);
				}
				'step 1'
				var next = player.chooseToDiscard('he', function (card, player) {
					return card != player.getEquip('pyzhuren_diamond');
				}, get.prompt(event.name, trigger.player), '弃置一张牌，令即将对其造成的伤害+1');
				next.ai = function (card) {
					if (_status.event.goon) return 6 - get.value(card);
					return -1;
				};
				next.set('goon', get.attitude(player, trigger.player) < 0 && !trigger.player.hasSkillTag('filterDamage', null, {
					player: player,
					card: trigger.card,
				}));
				next.logSkill = [event.name, trigger.player];
				'step 2'
				if (result.bool) trigger.num++;
				else player.storage.counttrigger.pyzhuren_diamond--;
			},
			ai: {
				expose: 0.25,
			},
		};


		//-----赛季【黄天之怒】专属-----//
		//施法：咒护
		lib.skill.twzhouhu = {
			audio: 2,
			mahouSkill: true,
			enable: 'phaseUse',
			usable: 1,
			filter: function (event, player) {
				return !player.hasSkill('twzhouhu_mahou') && player.countCards('h', lib.skill.twzhouhu.filterCard) > 0;
			},
			filterCard: { color: 'red' },
			check: function (card) {
				if (_status.event.player.isHealthy()) return 0;
				return 7 - get.value(card);
			},
			content: function () {
				'step 0'
				var list = ['1回合', '2回合', '3回合'];

				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_digongdebihu') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【地公的庇护】');
					list.push('4回合');

				}

				player.chooseControl(list).set('prompt', '请选择施法时长').set('ai', function () {
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
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_tiangongdebihu') && player == game.me && result.index > 0) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【天公的庇护】');
					if (!player.storage.tiangongzhouhu) {
						player.storage.tiangongzhouhu = true;
					}
				}

				player.storage.twzhouhu_mahou = [result.index + 1, result.index + 1];
				player.addTempSkill('twzhouhu_mahou', { player: 'die' });


				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_rengongdebihu') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【人公的庇护】');
					player.draw(1, true);

				}

			},
			ai: {
				order: 2,
				result: {
					player: 1,
				},
			},
			subSkill: {
				mahou: {
					trigger: { global: 'phaseEnd' },
					forced: true,
					popup: false,
					charlotte: true,
					content: function () {
						var list = player.storage.twzhouhu_mahou;
						list[1]--;
						if (list[1] == 0 || (list[1] == 1 && player.storage.tiangongzhouhu == true && player == game.me)) {
							game.log(player, '的“咒护”魔法生效');
							if (lib.config.taixuhuanjing.buff.includes('buff_txhj_tiangongdebihu') && player == game.me && player.storage.tiangongfengqi == true) {
								player.buffUpdate(event.name);
								game.log(player, '触发了【天公的庇护】');
								delete player.storage.tiangongzhouhu;

							}
							player.logSkill('twzhouhu');
							var num = list[0];
							player.recover(num);
							player.removeSkill('twzhouhu_mahou');
						}
						else {
							game.log(player, '的“咒护”魔法剩余', '#g' + (list[1]) + '回合');
							player.markSkill('twzhouhu_mahou');
						}
					},
					mark: true,
					onremove: true,
					marktext: '♗',
					intro: {
						name: '施法：咒护',
						markcount: function (storage) {
							if (storage) return storage[0] + '-' + storage[1];
							return 0;
						},
						content: function (storage) {
							if (storage) {
								return '经过' + storage[1] + '个“回合结束时”后，回复' + storage[0] + '点体力';
							}
							return '未指定施法效果';
						},
					},
				},
			},
		};

		//施法：丰祈
		lib.skill.twharvestinori = {
			audio: 2,
			mahouSkill: true,
			enable: 'phaseUse',
			usable: 1,
			filter: function (event, player) {
				return !player.hasSkill('twharvestinori_mahou') && player.countCards('h', lib.skill.twharvestinori.filterCard) > 0;
			},
			filterCard: { color: 'black' },
			check: function (card) {
				return 8 - get.value(card);
			},
			content: function () {
				'step 0'
				var list = ['1回合', '2回合', '3回合'];

				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_digongdebihu') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【地公的庇护】');
					list.push('4回合');

				}
				player.chooseControl(list).set('prompt', '请选择施法时长').set('ai', function () {
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
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_tiangongdebihu') && player == game.me && result.index > 0) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【天公的庇护】');
					if (!player.storage.tiangongfengqi) {
						player.storage.tiangongfengqi = true;
					}
				}
				player.storage.twharvestinori_mahou = [result.index + 1, result.index + 1];
				player.addTempSkill('twharvestinori_mahou', { player: 'die' });
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_rengongdebihu') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【人公的庇护】');
					player.draw(1, true);

				}

			},
			ai: {
				order: 8,
				result: {
					player: 1,
				},
			},
			subSkill: {
				mahou: {
					trigger: { global: 'phaseEnd' },
					forced: true,
					popup: false,
					charlotte: true,
					content: function () {
						var list = player.storage.twharvestinori_mahou;
						list[1]--;
						if (list[1] == 0 || (list[1] == 1 && player.storage.tiangongfengqi == true && player == game.me)) {
							game.log(player, '的“丰祈”魔法生效');
							player.logSkill('twharvestinori');
							if (lib.config.taixuhuanjing.buff.includes('buff_txhj_tiangongdebihu') && player == game.me && player.storage.tiangongfengqi == true) {
								player.buffUpdate(event.name);
								game.log(player, '触发了【天公的庇护】');
								delete player.storage.tiangongfengqi;

							}
							var num = list[0] * 2;
							player.draw(num);
							player.removeSkill('twharvestinori_mahou');
						}
						else {
							game.log(player, '的“丰祈”魔法剩余', '#g' + (list[1]) + '回合');
							player.markSkill('twharvestinori_mahou');
						}
					},
					mark: true,
					onremove: true,
					marktext: '♗',
					intro: {
						name: '施法：丰祈',
						markcount: function (storage) {
							if (storage) return storage[0] + '-' + storage[1];
							return 0;
						},
						content: function (storage) {
							if (storage) {
								return '经过' + storage[1] + '个“回合结束时”后，摸' + storage[0] * 2 + '张牌';
							}
							return '未指定施法效果';
						},
					},
				},
			},
		};

		//施法：阻祸
		lib.skill.twzuhuo = {
			audio: 2,
			mahouSkill: true,
			enable: 'phaseUse',
			usable: 1,
			filter: function (event, player) {
				return !player.hasSkill('twzuhuo_mahou') && player.countCards('he', lib.skill.twzuhuo.filterCard) > 0;
			},
			filterCard: function (card) {
				return get.type(card) != 'basic';
			},
			position: 'he',
			check: function (card) {
				return 7 - get.value(card);
			},
			content: function () {
				'step 0'
				var list = ['1回合', '2回合', '3回合'];

				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_digongdebihu') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【地公的庇护】');
					list.push('4回合');

				}
				player.chooseControl(list).set('prompt', '请选择施法时长').set('ai', function () {
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
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_tiangongdebihu') && player == game.me && result.index > 0) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【天公的庇护】');
					if (!player.storage.tiangongzuhuo) {
						player.storage.tiangongzuhuo = true;
					}
				}
				player.storage.twzuhuo_mahou = [result.index + 1, result.index + 1];
				player.addTempSkill('twzuhuo_mahou', { player: 'die' });
				if (lib.config.taixuhuanjing.buff.includes('buff_txhj_rengongdebihu') && player == game.me) {
					player.buffUpdate(event.name);
					game.log(player, '触发了【人公的庇护】');
					player.draw(1, true);

				}

			},
			ai: {
				order: 2,
				result: {
					player: 1,
				},
			},
			subSkill: {
				mahou: {
					trigger: { global: 'phaseEnd' },
					forced: true,
					popup: false,
					charlotte: true,
					content: function () {
						var list = player.storage.twzuhuo_mahou;
						list[1]--;
						if (list[1] == 0 || (list[1] == 1 && player.storage.tiangongzuhuo == true && player == game.me)) {
							game.log(player, '的“阻祸”魔法生效');
							player.logSkill('twzuhuo');
							if (lib.config.taixuhuanjing.buff.includes('buff_txhj_tiangongdebihu') && player == game.me && player.storage.tiangongzuhuo == true) {
								player.buffUpdate(event.name);
								game.log(player, '触发了【天公的庇护】');
								delete player.storage.tiangongzuhuo;

							}
							var num = list[0];
							player.addSkill('twzuhuo_effect');
							player.addMark('twzuhuo_effect', num, false);
							player.removeSkill('twzuhuo_mahou');
						}
						else {
							game.log(player, '的“阻祸”魔法剩余', '#g' + (list[1]) + '回合');
							player.markSkill('twzuhuo_mahou');
						}
					},
					mark: true,
					onremove: true,
					marktext: '♗',
					intro: {
						name: '施法：阻祸',
						markcount: function (storage) {
							if (storage) return storage[0] + '-' + storage[1];
							return 0;
						},
						content: function (storage) {
							if (storage) {
								return '经过' + storage[1] + '个“回合结束时”后，获得' + storage[0] + '层“防止一次伤害”的效果';
							}
							return '未指定施法效果';
						},
					},
				},
				effect: {
					charlotte: true,
					onremove: true,
					trigger: { player: 'damageBegin2' },
					forced: true,
					filter: function (event, player) {
						return player.hasMark('twzuhuo_effect');
					},
					content: function () {
						trigger.cancel();
						player.removeMark('twzuhuo_effect', 1, false);
						if (!player.countMark('twzuhuo_effect')) player.removeSkill('twzuhuo_effect');
					},
					marktext: '阻︎',
					intro: {
						onremove: true,
						content: '防止接下来的#次伤害',
					},
				},
			},
		};
		//------------分割线-----------//
	}

	//---------------神器添加buff-----------------//
	lib.skill._txhj_shenqi = {
		trigger: {
			player: ["equipAfter"],
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		forced: true,
		priority: 7,
		filter: function (event, player) {
			if (!event.card || !get.modBuff(event.card)) return false;
			return player == game.me;
		},
		content: async function (event, trigger, player) {
			let cardname = trigger.card.name;
			let buff = get.modBuff(trigger.card);
			if (!buff) return;
			if (!lib.config.taixuhuanjing?.buff?.includes(buff[0])) {
				lib.config.taixuhuanjing.buff.push(buff[0]);
				if (game.me && game.me.buff) game.me.buff.update();
				if (buff[1]) game.log(get.translation(cardname) + ':', player, '获得了【' + buff[1] + '】');
			}
		},
	};

	//--------神器失去buff------//
	lib.skill._txhj_XXXshenqi = {
		trigger: {
			player: 'loseAfter',
			global: ['equipAfter', 'addJudgeAfter', 'gainAfter', 'loseAsyncAfter', 'addToExpansionAfter'],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		priority: 2,
		filter: function (event, player) {
			if (!event.cards || !event.cards.length) return false;
			var evt = event.getl(player);
			return player == game.me && evt && evt.player == player && evt.es && evt.es.length > 0 && evt.es.some(card => {
				return get.modBuff(card)
			});
		},
		content: async function (event, trigger, player) {
			var loselist = trigger.getl(player).es.filter(card => get.modBuff(card));
			for (let i of loselist) {
				let buff = get.modBuff(i);
				if (!buff) continue;
				if (lib.config.taixuhuanjing?.buff?.includes(buff[0])) {
					lib.config.taixuhuanjing.buff.remove(buff[0]);
					if (game.me && game.me.buff && game.me.buff[buff[0]]) game.me.buff[buff[0]].remove();
					if (buff[1]) game.log(get.translation(i.name) + ':', player, '失去了【' + buff[1] + '】');
				}
			}
		}
	};
	//----------------------------------------//	
	//-------------------------------------------------------------//
	//1 焱火
	lib.skill._buff_txhj_yanhuo = {
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			return event.nature == 'fire' && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_yanhuo');
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		forced: true,
		content: function () {
			game.log(player, '发动了【焱火】');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};

	//2 惊雷
	lib.skill._buff_txhj_jinglei = {
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			return event.nature == 'thunder' && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jinglei');
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '发动了【惊雷】');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};

	//3 熄火
	lib.skill._buff_txhj_xihuo = {
		trigger: {
			player: "damageBegin3",
		},
		filter: function (event, player) {
			return event.nature == 'fire' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_xihuo');
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '触发了【熄火】');
			trigger.num--;
			player.buffUpdate(event.name);
		},
	};

	//4 定雷
	lib.skill._buff_txhj_dinglei = {
		trigger: {
			player: "damageBegin3",
		},
		filter: function (event, player) {
			return event.nature == 'thunder' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_dinglei');
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '触发了【定雷】');
			trigger.num--;
			player.buffUpdate(event.name);
		},
	};

	//5 无中生杀 【六龙骖驾】
	lib.skill._buff_txhj_wuzhongshengsha = {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_liulongcanjia') && player != game.me) return true;

			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_wuzhongshengsha');
		},
		content: function () {
			game.log(player, '触发了【无中生杀】获得了【杀】');
			var card = get.cardPile(function (card) {
				return card.name == 'sha';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};


	//6 无中生闪  【绝尘金戈】
	lib.skill._buff_txhj_wuzhongshengshan = {
		trigger: {
			player: "phaseJieshuBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_juechenjinge') && player != game.me) return true;

			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_wuzhongshengshan');
		},
		content: function () {
			game.log(player, '触发了【无中生闪】获得了【闪】');
			var card = get.cardPile(function (card) {
				return card.name == 'shan';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};

	//7 丰裕生财
	lib.skill._buff_txhj_fengyushengcai = {
		trigger: {
			player: "roundStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && player.isHealthy() && lib.config.taixuhuanjing.buff.includes('buff_txhj_fengyushengcai');
		},
		content: function () {
			game.log(player, '未受伤，触发了【丰裕生财】');
			player.draw();
			player.buffUpdate(event.name);

		},
	};

	//8 击破敌阵
	lib.skill._buff_txhj_jipodizhen = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jipodizhen');
		},
		content: function () {

			if (trigger.player && trigger.player.isIn() && !trigger._notrigger.includes(trigger.player)) {
				trigger.player.randomDiscard(true, 'he');
				game.log(trigger.player, '【击破敌阵】弃置了一张牌');
			}
			player.buffUpdate(event.name);
		},
	};

	//9 文和缜略
	lib.skill._buff_txhj_wenhezhenlue = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return get.type(event.card) == 'trick' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_wenhezhenlue');
		},
		content: function () {
			game.log('【文和缜略】', trigger.card, '不可被无懈可击响应');
			trigger.nowuxie = true;
			player.buffUpdate(event.name);
		},

	};


	//10 文和计备 （衍生）
	lib.skill._buff_txhj_wenhejibei = {
		mode: ["taixuhuanjing"],
		charlotte: true,
		ruleSkill: true,
		mod: {
			targetEnabled: function (card, player, target) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_wenhejibei')) return;
				if (get.type(card) == 'delay') {
					return false;
				}
			},
		}
	};

	//11 月英的智慧 （衍生）
	lib.skill._buff_txhj_yueyingdezhihui = {
		mode: ["taixuhuanjing"],
		charlotte: true,
		ruleSkill: true,
		mod: {
			targetInRange: function (card, player, target, now) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_yueyingdezhihui')) return;
				var type = get.type(card);
				if (type == 'trick' || type == 'delay') return true;
			},
		}
	};

	//12 长兵广刃 （衍生）
	lib.skill._buff_txhj_changbingguangren = {
		mode: ["taixuhuanjing"],
		charlotte: true,
		ruleSkill: true,
		mod: {
			attackRange: function (player, num) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_changbingguangren')) return;
				return num + 3;
			},
		}
	};

	//13 富足
	lib.skill._buff_txhj_fuzu = {
		trigger: {
			global: "gameDrawAfter",
		},
		forced: true,
		priority: 2,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && player.countCards('h') != player.maxHp && lib.config.taixuhuanjing.buff.includes('buff_txhj_fuzu');
		},
		content: function () {
			game.log(player, '触发了【富足】');
			player.buffUpdate(event.name);
		},
	};

	//14 枭姬的勇武
	lib.skill._buff_txhj_xiaojideyongwu = {
		trigger: {
			player: 'loseAfter',
			global: ['equipAfter', 'addJudgeAfter', 'gainAfter', 'loseAsyncAfter', 'addToExpansionAfter'],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		frequent: true,
		filter: function (event, player) {
			var evt = event.getl(player);
			return evt && evt.player == player && player == game.me && !player.hasSkill("xiaoji") && lib.config.taixuhuanjing.buff.includes('buff_txhj_xiaojideyongwu') && evt.es && evt.es.length > 0;
		},
		content: function () {
			"step 0"
			event.count = trigger.getl(player).es.length;
			"step 1"
			event.count--;
			player.draw(2);
			game.log(player, '发动了【枭姬的勇武】');
			"step 2"
			if (event.count > 0) {
				event.goto(1);
			} else {
				event.finish();
			}
			player.buffUpdate(event.name);
		},
	};

	//15 雄姿英发 （衍生）
	lib.skill._buff_txhj_xiongziyingfa = {
		mod: {
			maxHandcardBase: function (player, num) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_xiongziyingfa')) return;
				return player.maxHp;
			}
		},
		trigger: {
			player: "phaseDrawBegin2",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		preHidden: true,
		filter: function (event, player) {
			return !event.numFixed && player == game.me && !player.hasSkill("reyingzi") && lib.config.taixuhuanjing.buff.includes('buff_txhj_xiongziyingfa');
		},
		content: function () {
			game.log(player, '触发了【雄姿英发】');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};


	//16 吴相的心血 （衍生）
	lib.skill._buff_txhj_wuxiangdexinxue = {
		mode: ["taixuhuanjing"],
		charlotte: true,
		ruleSkill: true,
		mod: {
			maxHandcard: function (player, num) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_wuxiangdexinxue')) return;
				return num + 3;
			},
		},

	};

	//18 破阵之锋 【飞龙夺凤】
	lib.skill._buff_txhj_pozhenzhifeng = {
		trigger: {
			player: ["phaseUseBegin", "equipAfter"],
			global: ['addJudgeAfter', 'gainAfter', 'loseAsyncAfter', 'addToExpansionAfter'],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		priority: 10,
		filter: function (event, player) {

			if (player.getEquip('txhj_feilong') && player != game.me) return _status.currentPhase == player && player.isPhaseUsing() && !player.hasSkill('txhj_pozhenzhifeng');
			return lib.config.taixuhuanjing.buff.includes('buff_txhj_pozhenzhifeng') && player == game.me && player.isPhaseUsing() && _status.currentPhase == player && player.getEquip(1) && !player.hasSkill('txhj_pozhenzhifeng');

		},
		popup: false,
		content: function () {

			player.addTempSkill('txhj_pozhenzhifeng', { player: "phaseUseAfter" });
			game.log(player, '获得了【破阵之锋】');
			player.buffUpdate(event.name);
		},

	};

	//19 燕人之怒
	lib.skill._buff_txhj_yanrenzhinu = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.card.name != 'sha') return false;
			var evt = event.getParent('phaseUse');
			if (!evt || evt.player != player) return false;
			var index = player.getHistory('useCard', function (evtx) {
				return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
			}).indexOf(event);
			return index == 1 && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_yanrenzhinu');
		},
		content: function () {
			var evt = trigger.getParent('phaseUse');
			var index = player.getHistory('useCard', function (evtx) {
				return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
			}).indexOf(trigger);
			if (index == 1) {

				game.log(trigger.card, '不可被响应');
				trigger.directHit.addArray(game.players);
			}
			player.buffUpdate(event.name);
		},
	};

	//20 遁甲咒法
	lib.skill._buff_txhj_dunjiazhoufa = {

		trigger: {
			player: "shaBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.nature && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_dunjiazhoufa');
		},
		content: function () {
			game.log(trigger.card, '不可被【闪】响应');
			trigger.directHit = true;
			player.buffUpdate(event.name);
		},

	};

	//21 子义的勇战
	lib.skill._buff_txhj_ziyideyongzhan = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.card.name != 'sha') return false;
			var evt = event.getParent('phaseUse');
			if (!evt || evt.player != player) return false;
			var index = player.getHistory('useCard', function (evtx) {
				return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
			}).indexOf(event);
			return index == 1 && event.notLink() && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_ziyideyongzhan');
		},
		content: function () {
			var evt = trigger.getParent('phaseUse');
			var index = player.getHistory('useCard', function (evtx) {
				return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
			}).indexOf(trigger);
			if (index == 1) {

				game.log(trigger.card, '造成的伤害将+1');
				if (typeof trigger.baseDamage != 'number') trigger.baseDamage = 1;
				trigger.baseDamage++;
			}
			player.buffUpdate(event.name);
		},
	};

	//22 焱火之刃 【赤焰镇魂琴】
	lib.skill._buff_txhj_yanhuozhiren = {
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			if (player.getEquip('txhj_chiyanzhenhunqin') && player != game.me)
				return event.nature == 'fire' && event.notLink() && player.getEquip(1);

			return event.nature == 'fire' && event.notLink() && player.getEquip(1) && (player.getEquip('txhj_chiyanzhenhunqin') || player == game.me) && lib.config.taixuhuanjing.buff.includes('buff_txhj_yanhuozhiren');
		},
		priority: 4,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log('【焱火之刃】火焰伤害+1');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};

	//23 惊雷之刃
	lib.skill._buff_txhj_jingleizhiren = {
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			return event.nature == 'thunder' && event.notLink() && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jingleizhiren');
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		forced: true,
		content: function () {
			game.log('【惊雷之刃】雷电伤害+1');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};

	//24 应急措施甲
	lib.skill._buff_txhj_yingjicuoshijia = {
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_yingjicuoshijia')) return false;
			var evt = event.getl(player);
			return evt && evt.es && evt.es.some(c => get.subtype(c) == "equip2");
		},
		content: function () {
			game.log(player, '触发了【应急措施甲】');
			player.recover(1, true);
			player.buffUpdate(event.name);
		},

	};

	//25 应急措施乙
	lib.skill._buff_txhj_yingjicuoshiyi = {
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_yingjicuoshiyi')) return false;
			var evt = event.getl(player);
			return evt && evt.es && evt.es.some(c => get.subtype(c) == "equip2");
		},
		content: function () {

			game.log(player, '触发了【应急措施乙】');
			player.draw(2, true);
			player.buffUpdate(event.name);
		},

	};

	//26 熄火之铠
	lib.skill._buff_txhj_xihuozhikai = {
		trigger: {
			player: "damageBegin3",
		},
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_xihuozhikai')) return false;
			return event?.nature == 'fire' && player.getEquip("equip2");
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '触发了【熄火之铠】');
			trigger.num--;
			player.buffUpdate(event.name);
		},

	};

	//27 定雷之铠
	lib.skill._buff_txhj_dingleizhikai = {
		trigger: {
			player: "damageBegin3",
		},
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_dingleizhikai')) return false;
			return event?.nature == 'thunder' && player.getEquip("equip2");
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '触发了【定雷之铠】');
			trigger.num--;
			player.buffUpdate(event.name);
		},

	};

	//28 月英的机巧
	lib.skill._buff_txhj_yueyingdejiqiao = {

		trigger: {
			player: "judgeEnd",
		},
		preHidden: true,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_yueyingdejiqiao')) return false;
			return get.position(event.result.card, true) == 'o' && player.countCards('e');
		},
		content: function () {
			game.log('月英的机巧:摸一张牌');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};

	//29 太平咒法
	lib.skill._buff_txhj_taipingzhoufa = {
		trigger: {
			player: "shaBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			return event.card && event.card.name == 'sha' && event.notLink() && event.card.nature && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_taipingzhoufa');
		},
		content: function () {
			game.log('属性【杀】造成的伤害+1');
			if (typeof trigger.extraDamage != 'number') {
				trigger.extraDamage = 0;
			}
			trigger.extraDamage++;
			player.buffUpdate(event.name);
		},
	};

	//30 白驹鞬出
	lib.skill._buff_txhj_baijujianchu = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_baijujianchu')) return false;
			return event?.card?.name == 'sha' && !event?.nature;
		},
		content: function () {
			if (trigger.player && trigger.player.isIn() && !trigger._notrigger.includes(trigger.player)) {
				trigger.player.randomDiscard(true, 'he');
				game.log(player, '对', trigger.player, '发动了【白驹鞬出】');
			}
			player.buffUpdate(event.name);
		},
	};

	//31 绝境之策 【国风玉袍】
	lib.skill._buff_txhj_juejingzhice = {
		trigger: {
			player: "shanEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_guofengyupao') && player != game.me)
				return !player.countCards('h');
			return !player.countCards('h') && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_juejingzhice');
		},
		content: function () {

			game.log('绝境之策:', player, '摸了两张牌');
			player.draw(2, true);
			player.buffUpdate(event.name);

		},
	};

	//32 续命神药
	lib.skill._buff_txhj_xumingshenyao = {
		trigger: {
			target: "taoBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.player == player && player.hp <= 0 && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_xumingshenyao');
		},
		content: function () {
			game.log('续命神药:回复量+1');
			player.recover(true);
			player.buffUpdate(event.name);
		},
	};

	//33 无为之乐  （衍生）
	lib.skill._buff_txhj_wuweizhile = {
		trigger: {
			player: "judgeEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		locked: false,
		filter: function (event, player, card) {
			return event.cardname == 'lebu' && event.player != game.me && event.result && event.result.suit != 'heart' && _status.currentPhase != game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_wuweizhile');
		},
		content: function () {
			event.player = trigger.player;
			game.log(trigger.player, '触发了【无为之乐】');
			if (!trigger.player.hasSkill("txhj_wuweizhile")) {
				trigger.player.addSkill("txhj_wuweizhile");
			}
			trigger.player.addMark("txhj_wuweizhile", 1, false);
			event.finish();
			player.buffUpdate(event.name);
		},
	};

	//34 远断敌略 （衍生）
	lib.skill._buff_txhj_yuanduandilue = {
		mode: ["taixuhuanjing"],
		charlotte: true,
		ruleSkill: true,
		mod: {
			targetInRange: function (card, player, target, now) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_yuanduandilue')) return;

				if (card.name == 'bingliang') return true;
			}
		},
	};

	//35 截辎之道
	lib.skill._buff_txhj_jiezizhidao = {

		trigger: {
			player: "judgeEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		locked: false,
		filter: function (event, player, card) {
			return event.cardname == 'bingliang' && event.result && event.result.suit != 'club' && lib.config.taixuhuanjing.buff.includes('buff_txhj_jiezizhidao');
		},
		content: function () {

			game.log(player, '触发了【截辎之道】');

			game.me.draw(1, true);

			player.buffUpdate(event.name);

			event.finish();

		},

	};

	//36 黄天逆转 （衍生）
	lib.skill._buff_txhj_huangtiannizhuan = {
		trigger: {
			global: "gameStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huangtiannizhuan');
		},
		content: async function (event, trigger, player) {
			let list = player.getEnemies().sortBySeat();
			if (!list.length) return;
			for (let target of list) {
				player.line(target, 'green');
				await target.addSkill('txhj_huangtiannizhuan');
				await target.addMark('txhj_huangtiannizhuan', 1, false);
			}
			game.log(list, '获得了负面效果:【黄天逆转】');
			player.buffUpdate(event.name);
		},
	};

	//37 洞察之眼  

	lib.skill._buff_txhj_dongchazhiyan = {
		trigger: {
			player: "useCardToTargeted",

		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		priority: 10,
		filter: function (event, player) {

			return event.card.name == 'shunshou' && _status.currentPhase == player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_dongchazhiyan');

		},
		popup: false,
		content: function () {

			game.log(player, '触发了【洞察之眼】');
			player.addTempSkill('txhj_kapaikeshi', 'useCardToAfter');
			player.buffUpdate(event.name);
		},

	};


	//38 明镜之眼
	lib.skill._buff_txhj_mingjingzhiyan = {
		trigger: {
			player: "useCardToTargeted",

		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		priority: 10,
		filter: function (event, player) {

			return event.card.name == 'guohe' && _status.currentPhase == player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_mingjingzhiyan');

		},
		popup: false,
		content: function () {
			game.log(player, '触发了【明镜之眼】');
			player.addTempSkill('txhj_kapaikeshi', 'useCardToAfter');
			player.buffUpdate(event.name);
		},
	};

	//39 巨象之锋
	lib.skill._buff_txhj_juxiangzhifeng = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'nanman' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_juxiangzhifeng');
		},
		logTarget: "target",
		content: function () {
			'step 0'
			var num = trigger.target.countCards('h', 'sha');
			var next = trigger.target.chooseToDiscard('弃置一张牌，或不能响应' + get.translation(trigger.card), 'he').set('ai', function (card) {
				var num = _status.event.num;
				if (num == 0) return 0;
				if (card.name == 'sha') return num > 1 ? 2 : 0;
				return 6 - get.value(card);
			}).set('num', num);
			'step 1'
			if (result.bool == false) {
				game.log('【巨象之锋】:', trigger.target, '不可响应', trigger.card);
				trigger.directHit.add(trigger.target);
			}
			player.buffUpdate(event.name);
		},
	};

	//40 乱击锋矢
	lib.skill._buff_txhj_luanjifengshi = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'wanjian' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_luanjifengshi');
		},
		logTarget: "target",
		content: function () {
			'step 0'
			var num = trigger.target.countCards('h', 'shan');
			var next = trigger.target.chooseToDiscard('弃置一张牌，或不能响应' + get.translation(trigger.card), 'he').set('ai', function (card) {
				var num = _status.event.num;
				if (num == 0) return 0;
				if (card.name == 'shan') return num > 1 ? 2 : 0;
				return 6 - get.value(card);
			}).set('num', num);
			'step 1'
			if (result.bool == false) {
				game.log('【乱击锋矢】:', trigger.target, '不可响应', trigger.card);
				trigger.directHit.add(trigger.target);
			}
			player.buffUpdate(event.name);
		},
	};

	//41 桃园义誓 （衍生）
	lib.skill._buff_txhj_taoyuanyishi = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		priority: 3,
		filter: function (event, player, card) {

			return event.card && event.card.name == 'taoyuan' && event.target && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_taoyuanyishi');

		},
		content: function () {

			if (!player.hasSkill('txhj_taoyuanyishi')) {
				player.addTempSkill('txhj_taoyuanyishi', 'useCardToAfter');
			}
			player.buffUpdate(event.name);
		},

	};

	//42 好施的报偿
	lib.skill._buff_txhj_haoshidebaochang = {
		trigger: {
			player: "useCardEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			return event.card && event.card.name == 'wugu' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_haoshidebaochang');
		},
		content: function () {

			game.log(player, '发动了【好施的报偿】');
			player.draw(1, true);
			player.buffUpdate(event.name);

		},
	};

	//43 夺策己用
	lib.skill._buff_txhj_duocejiyong = {
		trigger: {
			player: "useCard",
		},
		frequent: true,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.respondTo && event.respondTo[0] && event.card && event.card.name == 'wuxie' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_duocejiyong');
		},
		content: function () {
			var cards = trigger.respondTo[1].cards;

			player.gain(cards, 'log', 'gain2');

			game.log(player, '触发了【夺策己用】');
			player.buffUpdate(event.name);

		},
	};




	//46 博闻强识

	//47 巨富雄豪  【虚妄之冕】
	/*	lib.skill._buff_txhj_jufuxionghao = {
		trigger: {
				player: "useCardAfter",
			},
			forced: true,
			direct: true,
			filter: function(event, player) {
				if (_status.currentPhase != player&&player!=game.me) return false;
				if (_status.currentPhase != player&&player==game.me) return false;
				var suit = get.suit(event.card, 'heart');
				var suits = [];
				var cards = player.getCards("e");
				for (var i = 0; i < cards.length; i++) {
					if (get.subtype(cards[i]) == "equip3" || get.subtype(cards[i]) == "equip4") suits.push(get.suit(cards[i]));
				}
				
				 if(player!=game.me&&player.getEquip('txhj_xuwangzhimian'))
				  return suits.includes(get.suit(event.card)) && player.getHistory('custom', function(evt) {
					return evt.jufuxionghao_name == suit;
				}).length == 0;
				
				  return lib.config.taixuhuanjing.buff.includes('buff_txhj_jufuxionghao')&&player==game.me&&suits.includes(get.suit(event.card)) && player.getHistory('custom', function(evt) {
					return evt.jufuxionghao_name == suit;
			}).length == 0;
	
			},
			content: function() {
				'step 0'
				event.suit = get.suit(trigger.card, 'heart');
				game.log(player, '触发了【巨富雄豪】');
				player.buffUpdate(event.name);
				player.draw();
				'step 1'
				player.getHistory('custom').push({
					jufuxionghao_name: event.suit
				});
	
			},
		};*/

	//48 马均的改造 （涉及游戏外获得卡牌）

	//49 仙葫汲取  【灵宝仙葫】（涉及游戏结算）

	//50 拂尘荡魔  【太极拂尘】   （不存在相关trigger时机，或者重写卡牌）

	//51 神符化邪 【冲应神符】
	lib.skill._buff_txhj_shenfuhuaxie = {
		trigger: {
			player: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_chongyingshenfu') && player != game.me)
				return get.itemtype(event.cards) == 'cards' && get.position(event.cards[0], true) == 'o' && !player.hasSkill('jianxiong');
			return get.itemtype(event.cards) == 'cards' && get.position(event.cards[0], true) == 'o' && !player.hasSkill('jianxiong') && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shenfuhuaxie');
		},
		content: function () {
			player.gain(trigger.cards, 'gain2');
			game.log(player, '触发了【神符化邪】');
			player.buffUpdate(event.name);
		},
	};

	//52 攻之宝物
	lib.skill._buff_txhj_gongzhibaowu = {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			//	if (player.getEquip('txhj_xuwangzhimian') && player != game.me)
			return (player.getEquip(3) || player.getEquip(4)) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_gongzhibaowu');
		},
		content: function () {
			game.log(player, '触发了【攻之宝物】获得了【杀】');
			var card = get.cardPile(function (card) {
				return card.name == 'sha';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};

	//53 防之宝物
	lib.skill._buff_txhj_fangzhibaowu = {
		trigger: {
			player: "phaseJieshuBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return (player.getEquip(3) || player.getEquip(4)) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_fangzhibaowu');
		},
		content: function () {
			game.log(player, '触发了【防之宝物】获得了【闪】');
			var card = get.cardPile(function (card) {
				return card.name == 'shan';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};

	//54 碎盔裂甲
	lib.skill._buff_txhj_suikuiliejia = {
		trigger: {
			source: "damageEnd",
		},
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && event.notLink() && event.player.getCards('e', {
				subtype: 'equip2'
			}).length > 0 && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_suikuiliejia');
		},
		priority: 16,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			"step 0"
			var att = (get.attitude(player, trigger.player) <= 0);
			var next = player.chooseButton();
			next.set('att', att);
			next.set('createDialog', ['【碎盔裂甲】:弃置' + get.translation(trigger.player) + '的一张防具牌', trigger.player.getCards('e', {
				subtype: 'equip2'
			})]);
			next.set('ai', function (button) {
				if (_status.event.att) return get.buttonValue(button);
				return 0;
			});
			"step 1"
			if (result.bool) {

				trigger.player.discard(result.links[0]);
			}
			game.log(player, '触发了【碎盔裂甲】');
			player.buffUpdate(event.name);
		},
	};

	//55 一鼓作气
	lib.skill._buff_txhj_yiguzuoqi = {


		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.card.name != 'sha') return false;
			var evt = event.getParent('phaseUse');
			if (!evt || evt.player != player) return false;
			var index = player.getHistory('useCard', function (evtx) {
				return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
			}).indexOf(event);
			return index == 1 && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_yiguzuoqi');
		},
		content: function () {
			var evt = trigger.getParent('phaseUse');
			var index = player.getHistory('useCard', function (evtx) {
				return evtx.card.name == 'sha' && evtx.getParent('phaseUse') == evt;
			}).indexOf(trigger);
			if (index == 1) {

				game.log(player, '触发了【一鼓作气】');
				player.draw(1, true);
			}
			player.buffUpdate(event.name);
		},
	};
	//56 上将的膂力

	//57 深寒雪饮

	//58 修罗的怜悯
	lib.skill._buff_txhj_xiuluodelianmin = {
		trigger: {
			global: "recoverEnd"
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.source && event.source == player && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_xiuluodelianmin');
		},
		content: function () {
			game.log(player, '触发了【修罗的怜悯】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};

	//59 策备不虞
	lib.skill._buff_txhj_cebeibuyu = {
		trigger: {
			player: "damageBegin3",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && (get.type(event.card, 'trick') == 'trick' || get.type(event.card, 'delay') == 'delay') && player.getEquip(2) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_cebeibuyu');
		},
		content: function () {

			game.log(player, '触发了【策备不虞】:', trigger.card, '造成的伤害-1');
			trigger.num--;
			player.buffUpdate(event.name);
		},
	};

	//60 公台之智
	lib.skill._buff_txhj_gongtaizhizhi = {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && player.getEquip(2) && player.isHealthy() && lib.config.taixuhuanjing.buff.includes('buff_txhj_gongtaizhizhi');
		},
		content: function () {
			game.log(player, '未受伤，触发了【公台之智】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};

	//61 天下无双！
	lib.skill._buff_txhj_tianxiawushuang = {
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player, card) {
			if (event.nature) return false

			return event.card && event.card.name == 'sha' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_tianxiawushuang');
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '触发了【天下无双!】:', trigger.card, '伤害+1');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};

	//62 击剑长歌
	lib.skill._buff_txhj_jijianchangge = {
		trigger: {
			player: ["useCard", "respond"],
		},
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && _status.currentPhase != player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jijianchangge');
		},
		direct: true,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {

			game.log(player, '触发了【击剑长歌】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};

	//63 黄天之怒
	lib.skill._buff_txhj_huangtianzhinu = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.nature && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huangtianzhinu');
		},
		content: function () {

			if (trigger.player && trigger.player.isIn() && !trigger._notrigger.includes(trigger.player)) {
				trigger.player.randomDiscard(true, 'he');
				game.log(trigger.player, '【黄天之怒】弃置了一张牌');
			}
			player.buffUpdate(event.name);
		},
	};

	//64 洛神绝章 （衍生）
	lib.skill._buff_txhj_luoshenjuezhang = {
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_luoshenjuezhang')) return false;
			const his = player.getRoundHistory("useSkill", evt => evt.skill == '_buff_txhj_luoshenjuezhang').length;
			return event.card && get.name(event.card) == 'shan' && his == 0;
		},
		content: function () {
			game.log(player, '获得了【洛神绝章】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};

	//65 神医之道
	lib.skill._buff_txhj_shenyizhidao = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'tao' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shenyizhidao');
		},
		content: function () {
			game.log(player, '触发了【神医之道】');
			trigger.baseDamage++;
			player.buffUpdate(event.name);
		},
	};

	//66 魔王的佳酿	（衍生）
	lib.skill._buff_txhj_mowangdejianiang = {
		trigger: {
			player: "useCardEnd",
		},
		filter: function (event, player, card) {
			return event.card && event.card.name == 'jiu' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_mowangdejianiang');
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			if (!player.hasSkill('txhj_mowangdejianiang')) {
				player.addTempSkill('txhj_mowangdejianiang', {
					player: 'phaseAfter'
				});
			}
			player.storage.txhj_mowangdejianiang++;
			player.syncStorage('txhj_mowangdejianiang');
			player.markSkill('txhj_mowangdejianiang');
			player.buffUpdate(event.name);
		},
	};

	//67 酣怒
	lib.skill._buff_txhj_hannu = {
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			return event.card && event.card.name == 'jiu' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_hannu');
		},
		content: function () {
			game.log(player, '触发了【酣怒】');
			var card = get.cardPile(function (card) {
				return card.name == 'sha';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};

	//68 国色绝艳
	lib.skill._buff_txhj_guosejueyan = {

		trigger: {
			player: "judgeEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		locked: false,
		filter: function (event, player, card) {
			return event.cardname == 'lebu' && event.result && event.result.suit != 'heart' && lib.config.taixuhuanjing.buff.includes('buff_txhj_guosejueyan');
		},
		content: function () {

			game.log(game.me, '触发了【国色绝艳】');
			game.me.draw(1, true);
			player.buffUpdate(event.name);
		},

	};

	//69 命运的旨意
	lib.skill._buff_txhj_mingyundezhiyi = {
		trigger: {
			player: "useCardEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'shandian' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_mingyundezhiyi');

		},
		content: function () {
			"step 0"
			event.list = player.getEnemies().sortBySeat();
			game.log(player, '发动了【命运的旨意】');
			"step 1"
			if (event.list.length) {
				var target = event.list.shift();
				if (!target.isLinked()) {
					target.link();
					player.line(target, 'green');
				}
				event.redo();
			} else {

				event.finish();
			}
			player.buffUpdate(event.name);
		},
	};

	//70 系盟之利

	lib.skill._buff_txhj_ximengzhili = {
		trigger: {
			player: "drawBefore",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.getParent().name == 'txhj_yuanjiao' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_ximengzhili');
		},
		content: function () {
			game.log(player, '触发了【系盟之利】');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};
	//71 横行无忌
	lib.skill._buff_txhj_hengxingwuji = {
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'guohe' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_hengxingwuji');
		},
		content: function () {
			game.log(player, '触发了【横行无忌】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};

	//72 十二奇策·进 （衍生）
	lib.skill._buff_txhj_shierqicejin = {
		trigger: {
			global: "gameStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shierqicejin');
		},
		content: async function (event, trigger, player) {
			let list = player.getFriends().sortBySeat();
			if (!list.length) return;
			for (let target of list) {
				player.line(target, 'green');
				await target.addSkill('txhj_shierqicejin');
			}
			game.log(list, '获得了正面效果:【十二奇策·进】');
			player.buffUpdate(event.name);
		},
	};

	//73 十二奇策·退 （衍生）
	lib.skill._buff_txhj_shierqicetui = {
		trigger: {
			global: "gameStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shierqicetui');
		},
		content: async function (event, trigger, player) {
			let list = player.getEnemies().sortBySeat();
			if (!list.length) return;
			for (let target of list) {
				player.line(target, 'green');
				await target.addSkill('txhj_shierqicetui')
			}
			game.log(list, '获得了负面效果:【十二奇策·退】');
			player.buffUpdate(event.name);
		},
	};

	//74 破釜沉舟  （衍生）
	lib.skill._buff_txhj_pofuchenzhou = {
		trigger: {
			player: ["phaseBegin", "phaseEnd"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		priority: 7,
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_pofuchenzhou');
		},
		content: function () {
			if (player.hasSkill('txhj_pofuchenzhou')) {
				player.addSkill('txhj_pofuchenzhou');
			}
			player.draw(1, true);
			game.log(player, '触发了【破釜沉舟】');
			player.buffUpdate(event.name);
		},
	};

	//75 黄天已立
	lib.skill._buff_txhj_huangtianyili = {
		trigger: { global: 'judge' },
		direct: true,
		forced: true,
		priority: 7,
		filter: function (event, player) {
			return event.player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huangtianyili');
		},
		content: function () {
			"step 1"
			player.popup('spade');
			if (!trigger.fixedResult || trigger.fixedResult) trigger.fixedResult = {};
			player.buffUpdate(event.name);
			game.log('【黄天已立】:', player, '的判定结果视为♠️');
			trigger.fixedResult.suit = 'spade';
			trigger.fixedResult.color = get.color({ suit: 'spade' });

		},
	};

	//76 黄天之诅
	lib.skill._buff_txhj_huangtianzhizu = {
		trigger: { global: 'judge' },
		direct: true,
		forced: true,
		priority: 5,
		filter: function (event, player) {
			return event.player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huangtianzhizu');
		},
		content: function () {
			"step 1"
			player.popup('spade');
			if (!trigger.fixedResult || trigger.fixedResult) trigger.fixedResult = {};
			player.buffUpdate(event.name);
			game.log('【黄天之诅】:', player, '的判定结果视为♠<b>5</b>️');
			trigger.fixedResult = {
				suit: 'spade',
				color: get.color({ suit: 'spade' }),
				number: 5,
			};

		},
	};

	//77 黄天之悯
	lib.skill._buff_txhj_huangtianzhimin = {
		trigger: { player: 'judgeEnd' },
		preHidden: true,
		forced: true,
		filter: function (event, player) {
			return get.position(event.result.card, true) == 'o' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huangtianzhimin');
		},
		content: function () {
			game.log('【黄天之悯】:', player, '摸一张牌');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};
	//-------------------------------------------------------------//

	//-----------类mod技能，和一些开局加入的技能------------//

	//特殊效果  AI手牌可视
	lib.skill.txhj_kapaikeshi = {
		charlotte: true,
		direct: true,
		forced: true,
		locked: true,
		ai: {
			viewHandcard: true,
		},
	};


	//破阵之锋
	lib.skill.txhj_pozhenzhifeng = {
		init: function (player, skill) {
			game.log(player, '获得了临时效果【破阵之锋】');
		},
		onremove: function (player, skill) {
			game.log(player, '失去了临时效果【破阵之锋】');
		},
		forced: true,
		trigger: {
			player: "useCardToBegin",
		},
		filter: function (event, player) {
			if (event.target == game.me) return false;
			return event.targets && event.targets.length >= 1 && player.getEnemies().includes(event.target) && player.getEquip(1) && player == game.me;

		},
		content: function () {
			player.buffUpdate(event.name);
		},
		ai: {
			unequip: true,
			skillTagFilter: function (player, tag, arg) {
				if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_pozhenzhifeng') && !player.getEquip('txhj_feilong')) return false; if (arg && arg.target && arg.target.isEnemiesOf(player) && (player.getEquip(1) || player.getEquip('txhj_feilong'))) return true;
				return false;
			}
		},
	};
	//33 无为之乐
	lib.skill.txhj_wuweizhile = {
		forced: true,
		mark: true,
		marktext: "💔️",
		intro: {
			name: "无为之乐",
			content: "本局游戏手牌上限-#",
		},
		mod: {
			maxHandcard: function (player, num) {

				var n = player.countMark("txhj_wuweizhile");

				return num - n;

			},
		}
	};

	//34 远断敌略
	lib.skill.txhj_yuanduandilue = {
		forced: true,

	};

	//36 黄天逆转
	lib.skill.txhj_huangtiannizhuan = {
		charlotte: true,
		marktext: '☯',
		intro: {
			name: '黄天逆转',
			content: '本局游戏内计算【闪电】的效果时反转#次',
		},
		mod: {
			judge: function (player, result) {
				if (_status.event.cardname == 'shandian' && player.countMark('txhj_huangtiannizhuan') % 2 == 1) {
					if (result.bool == false) {
						result.bool = true;
					} else {
						result.bool = false;
					}
				}
			}
		},
	};
	//41 桃园义誓
	lib.skill.txhj_taoyuanyishi = {
		init: function (player, skill) {
			game.log(player, '获得了【桃园义誓】');
		},
		onremove: function (player, skill) {
			game.log(player, '失去了【桃园义誓】');
		},
		global: "taoyuanyishiX",
	};

	lib.skill.taoyuanyishiX = {
		trigger: {
			player: "recoverBefore",
		},

		forced: true,
		filter: function (event, player) {
			if (event.player.isEnemyOf(game.me)) return false

			return event.player.isFriendOf(game.me);
		},
		content: function () {

			trigger.num++;
			game.log('【桃园义誓】:', trigger.player, '回复量+1');

		},
	};


	//66 魔王的佳酿 
	lib.skill.txhj_mowangdejianiang = {
		init: function (player, skill) {
			game.log(player, '获得了【魔王的佳酿】');
			player.storage.txhj_mowangdejianiang = 0;
			player.syncStorage('txhj_mowangdejianiang');
			player.markSkill('txhj_mowangdejianiang');
		},
		onremove: function (player, skill) {
			game.log(player, '失去了【魔王的佳酿】');
		},
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			if (event.getParent(2).jiu == true) return false
			return !player.hasSkill('jiu') && event.card && event.notLink() && event.card.name == 'sha';
		},
		group: "txhj_jianiang_clear",
		priority: 6,
		forced: true,
		content: function () {
			var n = player.storage.txhj_mowangdejianiang;
			player.buffUpdate(event.name);
			game.log(player, '发动了【魔王的佳酿】');
			trigger.num += n;
		},
		marktext: "佳酿",
		intro: {
			name: "魔王的佳酿",
			content: "本回合酒的持续效果增加。【杀】伤害+#,直到回合结束",
		},
	};
	lib.skill.txhj_jianiang_clear = {
		trigger: {
			player: "phaseEnd",
		},
		filter: function (event, player) {
			return player.storage.txhj_mowangdejianiang > 0;
		},
		forced: true,
		content: function () {
			var a = player.storage.txhj_mowangdejianiang;
			player.storage.txhj_mowangdejianiang -= a;
			player.syncStorage('txhj_mowangdejianiang');
			player.unmarkSkill('txhj_mowangdejianiang');
		},
	};

	//72 十二奇策·进
	lib.skill.txhj_shierqicejin = {
		trigger: {
			target: "useCardToTarget",
		},
		mark: true,
		marktext: "奇策·进",
		intro: {
			name: "十二奇策·进",
			content: "本局游戏中，成为玩家使用【万箭齐发】或【南蛮入侵】的目标时，取消之。",
		},
		forced: true,
		filter: function (event, player) {
			return event.player == game.me && ['wanjian', 'nanman'].includes(event.card.name);
		},
		content: function () {
			trigger.targets.remove(player);
			trigger.getParent().triggeredTargets2.remove(player);
			trigger.untrigger();
			trigger.cancel();
			game.log(player, '受【十二奇策·进】保护');
		},
	};

	//73 十二奇策·退
	lib.skill.txhj_shierqicetui = {
		trigger: {
			target: "useCardToTarget",
		},
		mark: true,
		marktext: "奇策·退",
		intro: {
			name: "十二奇策·退",
			content: "本局游戏中，成为玩家使用【五谷丰登】或【桃园结义】的目标时，取消之。",
		},
		forced: true,
		filter: function (event, player) {
			return event.player == game.me && ['wugu', 'taoyuan'].includes(event.card.name);
		},
		content: function () {
			trigger.getParent().excluded.add(player);
			game.log(player, '受【十二奇策·退】排斥');
		},
	};

	//74 破釜沉舟
	lib.skill.txhj_pofuchenzhou = {
		init: function (player, skill) {
			player.markSkill('txhj_pofuchenzhou');
		},
		mark: true,
		marktext: "破釜",
		intro: {
			name: "破釜沉舟",
			content: "本局游戏，回合开始/结束阶段，摸一张牌。",
		},
		charlotte: true,
		mode: ["taixuhuanjing"],
	};

	//魔改和缝改的buff（非官方）
	//凌波微步
	lib.skill._buff_txhj_lingboweibu = {
		trigger: {
			global: "roundEnd",
		},
		forced: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_lingboweibu') || player != game.me) return false;
			if (game.roundNumber == 0) return false;
			let num = player.getRoundHistory("damage")?.length || 0;
			return num == 0;
		},
		content: async function (event, trigger, player) {
			const targets = game.filterPlayer(function (current) {
				return current.isIn() && current != player;
			});
			let num = targets.length;
			await Promise.all(
				targets.map(async (target, index) => {
					await target.loseHp();
				}));
			if (num > 0) player.draw(num);
			game.log(player, '触发了【凌波微步】');
			player.buffUpdate(event.name);
		},
	};
	//纸上谈兵
	lib.skill._buff_txhj_zhishangtanbing = {
		trigger: {
			player: "loseHpEnd",
		},
		forced: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_zhishangtanbing');
		},
		content: function () {
			player.draw();
			game.log(player, '触发了【纸上谈兵】');
			player.buffUpdate(event.name);
		},
	};
	//势如破竹
	lib.skill._buff_txhj_shirupozhu = {
		trigger: {
			source: "damageBegin1",
		},
		forced: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return !event.player.countCards("h") && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shirupozhu');
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【势如破竹】');
			player.buffUpdate(event.name);
		},
	};
	//刀光剑影
	lib.skill._buff_txhj_daoguangjianying = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return get.type(event.card, 'basic') == 'basic' && !event.card.isCard && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_daoguangjianying');
		},
		content: function () {
			trigger.directHit.addArray(game.players);
			game.log(player, '触发了【刀光剑影】');
			player.buffUpdate(event.name);
		},
	};
	//蛮花飞影
	lib.skill._buff_txhj_manhuafeiying = {
		trigger: {
			global: "useCard",
		},
		forced: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'shan' && event.player != player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_manhuafeiying');
		},
		content: function () {
			trigger.player.damage();
			game.log(player, '触发了【蛮花飞影】');
			player.buffUpdate(event.name);
		},
	};
	//艳丽红颜
	lib.skill._buff_txhj_yanlihongyan = {
		trigger: { global: 'judge' },
		direct: true,
		forced: true,
		priority: 7,
		filter: function (event, player) {
			return event.player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_yanlihongyan');
		},
		content: function () {
			"step 1"
			player.popup('heart');
			if (!trigger.fixedResult || trigger.fixedResult) trigger.fixedResult = {};
			player.buffUpdate(event.name);
			game.log('【艳丽红颜】:', player, '的判定结果视为♥️️');
			trigger.fixedResult.suit = 'heart';
			trigger.fixedResult.color = get.color({ suit: 'heart' });

		},
	};
	//魔骑的扬威
	lib.skill._buff_txhj_moqiyangwei = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			if (event.nature) return false

			return event.card && event.card.name == 'sha' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_moqiyangwei');
		},
		content: function () {

			if (trigger.player && trigger.player.isIn() && !trigger._notrigger.includes(trigger.player)) {
				player.draw(2, true);
				game.log(player, '对', trigger.player, '发动了【魔骑的扬威】');
			}
			player.buffUpdate(event.name);
		},
	};
	//狂狼之噬
	lib.skill._buff_txhj_kuanglangzhishi = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_kuanglangzhishi');
		},
		content: function () {

			if (trigger.player && trigger.player.isIn() && !trigger._notrigger.includes(trigger.player)) {
				player.recover(1, true);
				game.log(trigger.player, '【狂狼之噬】回复了1点体力');
			}
			player.buffUpdate(event.name);
		},
	};
	//凉勇之骁
	lib.skill._buff_txhj_liangyongzhixiao = {
		trigger: { player: 'useCard' },
		forced: true,
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && get.color(event.card) == 'black' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_liangyongzhixiao');
		},
		content: function () {
			trigger.directHit.addArray(game.players);
			game.log(player, '触发了【凉勇之骁】');
			player.buffUpdate(event.name);
		},
	};
	//汉室衰微
	lib.skill._buff_txhj_hanshishuaiwei = {
		trigger: { global: 'phaseJieshuBegin' },
		forced: true,
		filter: function (event, player) {
			return player != event.player && event.player.isIn() && event.player.isMinHp() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_hanshishuaiwei');
		},
		logTarget: 'player',
		content: function () {
			trigger.player.loseHp();
			game.log(player, '触发了【汉室衰微】');
			player.buffUpdate(event.name);
		},
	};
	//反间之计
	lib.skill._buff_txhj_fanjianzhiji = {
		trigger: {
			source: "gainEnd",
		},
		forced: true,
		filter: function (event, player) {
			var evt = event.getl(player);
			return evt && evt.hs && evt.hs.length > 0 && event.player && event.player != player && event.player.isIn() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_fanjianzhiji');
		},
		content: function () {
			trigger.player.damage();
			game.log(player, '触发了【反间之计】');
			player.buffUpdate(event.name);
		},
	};
	//不世之功
	lib.skill._buff_txhj_bushizhigong = {
		trigger: { player: 'compare', target: 'compare' },
		filter: function (event, player) {
			return !event.iwhile && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_bushizhigong');
		},
		forced: true,
		content: function () {
			game.log(player, '拼点牌点数视为', '#yK');
			if (player == trigger.player) {
				trigger.num1 = 13;
			}
			else {
				trigger.num2 = 13;
				game.log(player, '触发了【不世之功】');
				player.buffUpdate(event.name);
			}
		},
	};
	//百步穿杨
	lib.skill._buff_txhj_baibuchuanyang = {
		trigger: { source: 'damageBegin1' },
		check: function (event, player) {
			return get.attitude(player, event.player) <= 0;
		},
		forced: true,
		filter: function (event, player) {
			return event.card && !event.player.inRange(player) && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_baibuchuanyang');
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【百步穿杨】');
			player.buffUpdate(event.name);
		},
	};
	//国色天香
	lib.skill._buff_txhj_guosetianxiang = {
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		usable: 1,
		forced: true,
		charlotte: true,
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_guosetianxiang')) return false;
			let evt = event.getl?.(player);
			return evt?.cards2?.length && _status.currentPhase != player;
		},
		content: function () {
			player.draw(2, true);
			game.log(player, '触发了【国色天香】');
			player.buffUpdate(event.name);
		},
	};
	//勇冠三军
	lib.skill._buff_txhj_yongguansanjun = {
		trigger: { player: 'useCard' },
		//frequent:true,
		forced: true,
		preHidden: true,
		filter: function (event, player) {
			return (get.type(event.card) == 'basic' && event.card.isCard) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_yongguansanjun');
		},
		content: function () {
			player.gain(get.cardPile(function (card) {
				return get.type(card, 'trick') == 'trick';
			}), 'gain2');
			game.log(player, '触发了【勇冠三军】');
			player.buffUpdate(event.name);
		},
	};
	lib.translate.buff_txhj_yongguansanjun = '勇冠三军';
	//黄天已也死了
	lib.skill._buff_txhj_huangtianyisi = {
		trigger: { player: 'judgeEnd' },
		preHidden: true,
		forced: true,
		filter: function (event, player) {
			return get.position(event.result.card, true) == 'o' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huangtianyisi');
		},
		content: function () {
			game.log('【黄天也死了】:', player, '摸一张牌');
			player.loseHp(1, true);
			player.buffUpdate(event.name);
		},
	};
	//尾蜂的采酿
	lib.skill._buff_txhj_weifengcainiang = {
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			return event.card && event.card.name == 'tao' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_weifengcainiang');
		},
		content: function () {
			game.log(player, '触发了【尾蜂的采酿】');
			var card = get.cardPile(function (card) {
				return card.name == 'shan';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};
	//老者的嘱托
	lib.skill._buff_txhj_laozhedezhutuo = {
		trigger: {
			player: ["useCard", "respond"],
		},
		filter: function (event, player) {
			return event.card && event.card.name == 'shan' && _status.currentPhase != player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_laozhedezhutuo');
		},
		direct: true,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {

			game.log(player, '触发了【老者的嘱托】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};
	//荧惑兽心
	lib.skill._buff_txhj_yinghuoshouxin = {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && player.getEquip(2) && player.isHealthy() && lib.config.taixuhuanjing.buff.includes('buff_txhj_yinghuoshouxin');
		},
		content: function () {
			game.log(player, '未受伤，触发了【荧惑兽心】');
			player.gainMaxHp(1, true);
			player.buffUpdate(event.name);
		},
	};
	//折刀断器
	lib.skill._buff_txhj_zhedaoduanqi = {
		trigger: {
			source: "damageEnd",
		},
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && event.notLink() && event.player.getCards('e', {
				subtype: 'equip1'
			}).length > 0 && player.getEquip(1) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_zhedaoduanqi');
		},
		priority: 16,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			"step 0"
			var att = (get.attitude(player, trigger.player) <= 0);
			var next = player.chooseButton();
			next.set('att', att);
			next.set('createDialog', ['【碎盔裂甲】:弃置' + get.translation(trigger.player) + '的一张武器牌', trigger.player.getCards('e', {
				subtype: 'equip1'
			})]);
			next.set('ai', function (button) {
				if (_status.event.att) return get.buttonValue(button);
				return 0;
			});
			"step 1"
			if (result.bool) {

				trigger.player.discard(result.links[0]);
			}
			game.log(player, '触发了【折刀断器】');
			player.buffUpdate(event.name);
		},
	};
	//火势逆风
	lib.skill._buff_txhj_huoshinifeng = {
		trigger: {
			global: "gameStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huoshinifeng');
		},
		content: async function (event, trigger, player) {
			let list = player.getEnemies().sortBySeat();
			if (!list.length) return;
			for (let target of list) {
				player.line(target, 'green');
				await target.addSkill('txhj_huoshinifeng');
				await target.addMark('txhj_huoshinifeng', 1, false);
			}
			game.log(list, '获得了负面效果:【火势逆风】');
			player.buffUpdate(event.name);

		},
	};
	//火势逆风衍生
	lib.skill.txhj_huoshinifeng = {
		charlotte: true,
		marktext: '☯',
		intro: {
			name: '火势逆风',
			content: '本局游戏内计算【火山】的效果时反转#次',
		},
		mod: {
			judge: function (player, result) {
				if (_status.event.cardname == 'huoshan' && player.countMark('txhj_huoshinifeng') % 2 == 1) {
					if (result.bool == false) {
						result.bool = true;
					} else {
						result.bool = false;
					}
				}
			}
		},
	};
	//冰封
	lib.skill._buff_txhj_bingfeng = {
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			return event.nature == 'ice' && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_bingfeng');
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		content: function () {
			game.log(player, '发动了【冰封】');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};
	//杀戮无赦
	lib.skill._buff_txhj_shanluwushe = {
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shanluwushe');
		},
		content: function () {
			game.log(player, '触发了【杀戮无赦】');
			player.draw(1, true);
			player.buffUpdate(event.name);
		},
	};
	//毒仕的迷烟
	lib.skill._buff_txhj_dushidemiyan = {
		trigger: { global: 'judge' },
		direct: true,
		forced: true,
		priority: 5,
		filter: function (event, player) {
			return event.player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_dushidemiyan');
		},
		content: function () {
			"step 1"
			player.popup('spade');
			if (!trigger.fixedResult || trigger.fixedResult) trigger.fixedResult = {};
			player.buffUpdate(event.name);
			game.log('【毒仕的迷烟】:', player, '的判定结果视为♣️<b>4</b>️');
			trigger.fixedResult = {
				suit: 'club',
				color: get.color({ suit: 'club' }),
				number: 4,
			};

		},
	};
	//趁虚而入
	lib.skill._buff_txhj_chenxverru = {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_houzi') && player != game.me)
				return (player.getEquip(3) || player.getEquip(4)) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_chenxverru');
		},
		content: function () {
			game.log(player, '触发了【趁虚而入】获得了【趁火打劫】');
			var card = get.cardPile(function (card) {
				return card.name == 'zhujinqiyuan';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};
	//讨贼锋矢
	lib.skill._buff_txhj_taozeifengshi = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_taozeifengshi');
		},
		logTarget: "target",
		content: function () {
			'step 0'
			var num = trigger.target.countCards('h', 'shan');
			var next = trigger.target.chooseToDiscard('弃置一张牌，或不能响应' + get.translation(trigger.card), 'he').set('ai', function (card) {
				var num = _status.event.num;
				if (num == 0) return 0;
				if (card.name == 'shan') return num > 1 ? 2 : 0;
				return 6 - get.value(card);
			}).set('num', num);
			'step 1'
			if (result.bool == false) {
				game.log('【讨贼锋矢】:', trigger.target, '不可响应', trigger.card);
				trigger.directHit.add(trigger.target);
			}
			player.buffUpdate(event.name);
		},
	};
	//百里偷劫
	lib.skill._buff_txhj_bailitoujie = {
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		mod: {
			targetInRange: function (card, player, target) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_bailitoujie')) return;
				if (card.name == 'shunshou') return true;
			}
		},
	};
	//虎豹冲杀
	lib.skill._buff_txhj_hubaochongsha = {
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		mod: {
			targetInRange: function (card, player, target) {
				if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_hubaochongsha')) return;
				let type = get.type(card);
				if (type == 'basic') return true;
			},
		}
	};
	//黄巾符身
	lib.skill._buff_txhj_huangjinfushen = {
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		mod: {
			targetEnabled: function (card, player, target) {
				if (target != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_huangjinfushen')) return;
				if (get.type(card) == 'trick') {
					return false;
				}
			},
		}
	};
	//暗箭之摧
	lib.skill._buff_txhj_anjianzhicui = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return get.type(event.card) == 'basic' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_anjianzhicui');
		},
		content: function () {
			game.log('【暗箭之摧】', trigger.card, '不可被闪避');
			trigger.directHit.addArray(game.players);
			player.buffUpdate(event.name);
		},
	};
	//蛮族造乱
	lib.skill._buff_txhj_manzuzaoluan = {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_houzi') && player != game.me) return true;

			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_manzuzaoluan');
		},
		content: function () {
			game.log(player, '触发了【蛮族造乱】获得了【南蛮入侵】');
			var card = get.cardPile(function (card) {
				return card.name == 'nanman';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};
	//急攻速战	  
	lib.skill._buff_txhj_jigongsuzhan = {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_houzi') && player != game.me) return true;

			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jigongsuzhan');
		},
		content: function () {
			game.log(player, '触发了【急攻速战】获得了伤害类型锦囊牌');
			var card = get.cardPile(function (card) {
				return get.type(card, 'trick') == 'trick' && get.tag(card, 'damage');
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};
	//趫捷勇猛
	lib.skill._buff_txhj_qiaojieyongmeng = {
		trigger: { player: 'phaseJieshuBegin' },
		forced: true,
		/*check:function(event,player){*/
		filter: function (event, player) {
			if (player.getEquip('txhj_houzi') && player != game.me) return true;
			return /*event.player.hp+player.countCards('h')<4 && */player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_qiaojieyongmeng');
		},
		content: function () {
			game.log(player, '触发了【趫捷勇猛】效果');
			player.draw(player.countCards('e') + 1);
			player.buffUpdate(event.name);
		},
	};
	//以少胜多
	lib.skill._buff_txhj_yishaoshengduo = {
		trigger: { source: 'damageBegin1' },
		logTarget: 'player',
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			var target = event.player;
			return event.getParent().name == 'sha' && player.countCards('h') < target.countCards('h') && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_yishaoshengduo');
		},
		content: function () {
			game.log(player, '触发了【以少胜多】的效果');
			trigger.num += 2;
			player.buffUpdate(event.name);
		},
	};
	//摧封无懈
	lib.skill._buff_txhj_cuifengwuxie = {
		trigger: {
			player: "phaseJieshuBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player.getEquip('txhj_houzi') && player != game.me) return true;

			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_cuifengwuxie');
		},
		content: function () {
			game.log(player, '触发了【摧封无懈】获得了【无懈可击】');
			var card = get.cardPile(function (card) {
				return card.name == 'wuxie';
			});
			if (card) player.gain(card, 'gain2');
			player.buffUpdate(event.name);
		},
	};
	//箭支充足
	lib.skill._buff_txhj_jianzhichongzu = {
		trigger: {
			player: "useCardEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, card) {
			return event.card && event.card.name == 'wanjian' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jianzhichongzu');
		},
		content: function () {

			game.log(player, '发动了【箭支充足】');
			player.draw(1, true);
			player.buffUpdate(event.name);

		},
	};
	//抽刀伺动
	lib.skill._buff_txhj_choudaosidong = {
		trigger: {
			player: "useCard",
		},
		frequent: true,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.respondTo && event.respondTo[0] && event.card && event.card.name == 'shan' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_choudaosidong');
		},
		content: function () {
			var cards = trigger.respondTo[1].cards;

			player.gain(cards, 'log', 'gain2');

			game.log(player, '触发了【抽刀伺动】');
			player.buffUpdate(event.name);

		},
	};
	//虚伪的尊威
	lib.skill._buff_txhj_xuweidezunwei = {
		trigger: {
			player: "drawBefore",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.getParent().name == 'wuzhong' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_xuweidezunwei');
		},
		content: function () {
			game.log(player, '触发了【虚伪的尊威】');
			trigger.num++;
			player.buffUpdate(event.name);
		},
	};
	//龙腾虎胆
	lib.skill._buff_txhj_longtenghudan = {
		trigger: { player: 'useCard1' },
		forced: true,
		popup: false,
		silent: true,
		firstDo: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'sha' && event.notLink() && !event.card.isCard && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_longtenghudan');
		},
		content: function () {
			game.log(player, '触发了【龙腾虎胆】');
			trigger.baseDamage++;
			player.buffUpdate(event.name);
		},
	};
	/*以下buff代码全部摘自其他魔改大佬的魔改buff，感谢其代码制作!*/
	//闭月羞花
	lib.skill._buff_txhj_shenhundiandao = {
		trigger: { source: 'damageBegin1' },
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player.isTurnedOver() && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shenhundiandao');
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【神魂颠倒】');
			player.buffUpdate(event.name);
		},
	};
	//先登夺魁
	lib.skill._buff_txhj_xiandengduokui = {
		mod: {
			cardnumber: function (card, player) {
				if (player.countUsed('sha', true) > 0 && card.name == "sha" && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_xiandengduokui')) return 11;
			},
		},
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return get.number(event.card) == 11 && event.card.name == "sha" && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_xiandengduokui');
		},
		content: function () {
			game.log(player, '触发了【先登夺魁】');
			if (typeof trigger.baseDamage != 'number') trigger.baseDamage = 1;
			trigger.baseDamage++;
			player.buffUpdate(event.name);
		},
	};
	//明查秋毫
	lib.skill._buff_txhj_mingchaqiuhao = {
		trigger: {
			global: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player.hp >= event.player.hp && event.player != player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_mingchaqiuhao');
		},
		content: function () {
			game.log(player, '触发了【明察秋毫】');
			player.buffUpdate(event.name);
			player.useCard({ name: 'zhibi', isCard: true }, trigger.player, false);
		},
	};


	//------------------------------//
	//-----------手杀国服太虚技能增补------------//

	//谋断，搬运自国战吕蒙
	lib.skill.txhj_mouduan = {
		trigger: {
			player: "phaseJieshuBegin",
		},
		//priority:2,
		audio: "botu",
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
	};

	lib.translate.txhj_mouduan = "谋断";
	lib.translate.txhj_mouduan_info = "结束阶段，若你于本回合内使用过四种花色或三种类别的牌，则你可以移动场上的一张牌。";


	//缮甲，手杀海外服为ol增强版本
	//新杀改了之后，本体没独立出来旧的ol技能也是离谱
	lib.skill.olshanjia = {
		group: ["olshanjia_count"],
		locked: false,
		mod: {
			aiValue: function (player, card, num) {
				if ((player.storage.olshanjia || 0) < 3 && get.type(card) == 'equip' && !get.cardtag(card, 'gifts')) {
					return num / player.hp;
				}
			},
		},
		subSkill: {
			count: {
				forced: true,
				silent: true,
				popup: false,
				trigger: {
					player: "loseEnd",
				},
				filter: function (event, player) {
					return event.cards2 && event.cards2.length > 0;
				},
				content: function () {
					lib.skill.olshanjia.sync(player);
				},
			},
		},
		audio: "shanjia",
		trigger: {
			player: "phaseUseBegin",
		},
		intro: {
			content: "本局游戏内已失去过#张装备牌",
		},
		frequent: true,
		sync: function (player) {
			var history = player.actionHistory;
			var num = 0;
			for (var i = 0; i < history.length; i++) {
				for (var j = 0; j < history[i].lose.length; j++) {
					if (history[i].lose[j].parent.name == 'useCard') continue;
					num += history[i].lose[j].cards2.filter(function (card) {
						return get.type(card, false) == 'equip';
					}).length;
				}
			}
			player.storage.olshanjia = num;
			if (num > 0) player.markSkill('olshanjia');
		},
		content: function () {
			'step 0'
			player.draw(3);
			'step 1'
			lib.skill.olshanjia.sync(player);
			var num = 3 - player.storage.olshanjia;
			if (num > 0) {
				player.chooseToDiscard('he', true, num).ai = get.disvalue;
			}
			'step 2'
			var bool = true;
			if (result.cards) {
				for (var i = 0; i < result.cards.length; i++) {
					if (['basic', 'trick'].includes(get.type(result.cards[i], 'trick', result.cards[i].original == 'h' ? player : false))) {
						bool = false; break;
					}
				}
			}
			if (bool) {
				player.chooseUseTarget({ name: 'sha' }, '是否视为使用一张【杀】？', false, 'nodistance');
			}
		},
		ai: {
			threaten: 3,
			noe: true,
			reverseOrder: true,
			skillTagFilter: function (player) {
				if (player.storage.olshanjia > 2) return false;
			},
			effect: {
				target: function (card, player, target) {
					if (player.storage.olshanjia < 3 && get.type(card) == 'equip' && !get.cardtag(card, 'gifts')) return [1, 3];
				},
			},
		},
	};

	lib.translate.olshanjia = "缮甲";
	lib.translate.olshanjia_info = "出牌阶段开始时，你可以摸三张牌，然后弃置3-X张牌(X为你本局游戏内失去过的装备牌的数目且至多为3)。若你没有以此法弃置基本牌或锦囊牌，则你可以视为使用了一张不计入出牌阶段使用次数的【杀】。";


	//玄雷，搬运自对战断狱仲达
	lib.skill.boss_xuanlei = {
		audio: true,
		trigger: { player: 'phaseBegin' },
		forced: true,
		filter: function (event, player) {
			return game.hasPlayer(function (current) {
				return current.isEnemyOf(player) && current.countCards('j');
			});
		},
		content: function () {
			"step 0"
			event.targets = game.filterPlayer(function (current) {
				return current.isEnemyOf(player) && current.countCards('j');
			});
			event.targets.sort(lib.sort.seat);
			player.line(event.targets, 'thunder');
			"step 1"
			if (event.targets.length) {
				event.targets.shift().damage('thunder');
				event.redo();
			}
		}
	};

	lib.translate.boss_xuanlei = '玄雷';
	lib.translate.boss_xuanlei_info = '锁定技，准备阶段，令所有判定区内有牌的敌方角色受到1点雷电伤害。';


	//旋略，搬运自国战凌统
	lib.skill.txhj_xuanlve = {
		trigger: {
			player: 'loseAfter',
			global: ['equipAfter', 'addJudgeAfter', 'gainAfter', 'loseAsyncAfter', 'addToExpansionAfter'],
		},
		direct: true,
		preHidden: true,
		filter: function (event, player) {
			var evt = event.getl(player);
			return evt && evt.es && evt.es.length > 0;
		},
		content: function () {
			'step 0'
			player.chooseTarget(get.prompt('txhj_xuanlve'), '弃置一名其他角色的一张牌', function (card, player, target) {
				return target != player && target.countDiscardableCards(player, 'he');
			}).set('ai', function (target) {
				var player = _status.event.player;
				return get.effect(target, { name: 'guohe_copy2' }, player, player);
			}).setHiddenSkill(event.name);
			'step 1'
			if (result.bool) {
				player.logSkill('txhj_xuanlve', result.targets);
				player.discardPlayerCard(result.targets[0], 'he', true);
			}
		},
		ai: {
			noe: true,
			reverseEquip: true,
			effect: {
				target: function (card, player, target, current) {
					if (get.type(card) == 'equip') return [1, 1];
				}
			}
		}
	};

	lib.translate.txhj_xuanlve = '旋略';
	lib.translate.txhj_xuanlve_info = '当你失去装备区里的牌后，你可以弃置一名其他角色的一张牌。';


	//穿云，搬运自对战绝尘妙才
	//这个技能和新杀童渊的技能穿云同名，但是两个技能执行的效果不一样，童渊技能是造成伤害掉对面装备
	lib.skill.boss_chuanyun = {
		audio: true,
		trigger: { player: 'phaseEnd' },
		direct: true,
		content: function () {
			"step 0"
			player.chooseTarget(get.prompt('boss_chuanyun'), function (card, player, target) {
				return player.hp < target.hp;
			}).ai = function (target) {
				return get.damageEffect(target, player, player);
			}
			"step 1"
			if (result.bool) {
				player.logSkill('boss_chuanyun', result.targets);
				result.targets[0].damage();
			}
		},
	};

	lib.translate.boss_chuanyun = '穿云';
	lib.translate.boss_chuanyun_info = '结束阶段，你可以对体力比你多的一名其他角色造成1点伤害。';


	//暴敛，搬运自boss牛头&黑无常
	lib.skill.boss_baolian = {
		trigger: { player: 'phaseJieshuBegin' },
		forced: true,
		content: function () {
			player.draw(2);
		}
	};

	lib.translate.boss_baolian = '暴敛';
	lib.translate.boss_baolian_info = '锁定技，结束阶段，你摸两张牌。';


	//灵锋，搬运自对战昭烈玄德
	lib.skill.boss_lingfeng = {
		audio: 2,
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
	};

	lib.translate.boss_lingfeng = '灵锋';
	lib.translate.boss_lingfeng_info = '摸牌阶段，你可以改为亮出牌堆顶的两张牌，然后获得之，若这些牌的颜色不同，你令一名敌方角色失去1点体力。';


	//殷富，搬运自缘之空的个人扩展
	//开黑节地主的新增技能，懂的都懂，大鬼的最爱
	lib.skill.dz_gs_yinfu = {
		trigger: { player: "phaseBegin" },
		filter: function (event, player) {
			return player.getDamagedHp() >= game.roundNumber;
		},
		charlotte: true,
		forced: true,
		locked: false,
		content: function () {
			player.recover();
			if (player.getAllHistory("useSkill", (evt) => evt.skill == "dz_gs_yinfu").length >= 3) player.removeSkill("dz_gs_yinfu");
		},
	};

	lib.translate.dz_gs_yinfu = "殷富";
	lib.translate.dz_gs_yinfu_info = "回合开始时，若你已损失的体力值不小于游戏轮次，你回复1点体力。该技能发动三次后，你失去技能“殷富”。";


	//雷厉，搬运自对战绝尘妙才
	lib.skill.boss_leili = {
		audio: 2,
		trigger: { source: 'damageEnd' },
		direct: true,
		filter: function (event) {
			return event.card && event.card.name == 'sha';
		},
		content: function () {
			"step 0"
			player.chooseTarget(get.prompt('boss_leili'), function (card, player, target) {
				if (target == trigger.player) return false;
				return target.isEnemyOf(player);
			}).ai = function (target) {
				return get.damageEffect(target, player, player, 'thunder');
			}
			"step 1"
			if (result.bool) {
				player.logSkill('boss_leili', result.targets);
				result.targets[0].damage('thunder');
			}
		},
		ai: {
			expose: 0.2,
			threaten: 1.3
		}
	};

	lib.translate.boss_leili = '雷厉';
	lib.translate.boss_leili_info = '每当你的【杀】造成伤害后，你可以对另一名敌方角色造成1点雷电伤害。';


	//风行，搬运自对战绝尘妙才
	lib.skill.boss_fengxing = {
		audio: true,
		trigger: { player: 'phaseBegin' },
		direct: true,
		content: function () {
			"step 0"
			player.chooseTarget(get.prompt('boss_fengxing'), function (card, player, target) {
				if (target.isFriendOf(player)) return false;
				return lib.filter.targetEnabled({ name: 'sha' }, player, target);
			}).ai = function (target) {
				return get.effect(target, { name: 'sha' }, player);
			}
			"step 1"
			if (result.bool) {
				player.logSkill('boss_fengxing');
				player.useCard({ name: 'sha' }, result.targets, false);
			}
		},
		ai: {
			expose: 0.2,
			threaten: 1.3
		}
	};

	lib.translate.boss_fengxing = '风行';
	lib.translate.boss_fengxing_info = '准备阶段，你可以选择一名敌方角色，若如此做，视为对其使用了一张【杀】。';


	//驭兽，搬运自boss罗刹
	lib.skill.boss_yushou = {
		trigger: { player: 'phaseUseBegin' },
		content: function () {
			var list = game.filterPlayer(function (current) {
				return player.canUse('nanman', current) && current.isEnemyOf(player);
			});
			list.sort(lib.sort.seat);
			player.useCard({ name: 'nanman' }, list);
		}
	};

	lib.translate.boss_yushou = '驭兽';
	lib.translate.boss_yushou_info = '出牌阶段开始时，你可以对所有敌方角色使用一张南蛮入侵。';


	//吸星，搬运自boss黑无常
	lib.skill.boss_xixing = {
		trigger: { player: 'phaseZhunbeiBegin' },
		direct: true,
		content: function () {
			"step 0"
			player.chooseTarget(get.prompt('boss_xixing'), function (card, player, target) {
				return player != target && target.isLinked();
			}).ai = function (target) {
				return get.damageEffect(target, player, player, 'thunder');
			}
			"step 1"
			if (result.bool) {
				player.logSkill('boss_xixing', result.targets);
				result.targets[0].damage('thunder');
				player.recover();
			}
		},
	};

	lib.translate.boss_xixing = '吸星';
	lib.translate.boss_xixing_info = '准备阶段，对任意一名横置的其他角色造成1点雷电伤害，然后回复1点体力。';


	//魔炎，搬运自boss罗刹
	lib.skill.boss_moyany = {
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
			} else {
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
	};

	lib.translate.boss_moyany = '魔炎';
	lib.translate.boss_moyany_info = '每当你于回合外失去牌时，你可以进行一次判定，若结果为红色，你对一名其他角色造成2点火焰伤害。';


	//丹术，搬运自boss夜叉
	lib.skill.boss_danshu = {
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
	};

	lib.translate.boss_danshu = '丹术';
	lib.translate.boss_danshu_info = '每当你于回合外失去牌时，你可以进行一次判定，若结果为红色，你回复1点体力。';


	//天陨，搬运自对战炽羽朱雀
	lib.skill.boss_tianyun = {
		trigger: { player: 'phaseEnd' },
		direct: true,
		content: function () {
			"step 0"
			event.forceDie = true;
			player.chooseTarget(get.prompt('boss_tianyun'), function (card, player, target) {
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
				player.logSkill('boss_tianyun', result.targets, 'fire');
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
	};

	lib.translate.boss_tianyun = '天陨';
	lib.translate.boss_tianyun_info = '结束阶段，你可以失去1点体力，然后令一名敌方角色随机受到2~3点火焰伤害并弃置其装备区里的所有牌。';



	//魔道，搬运自boss罗刹、夜叉及法轮王
	lib.skill.boss_modao = {
		trigger: { player: 'phaseZhunbeiBegin' },
		forced: true,
		content: function () {
			player.draw(2);
		}
	};

	lib.translate.boss_modao = '魔道';
	lib.translate.boss_modao_info = '锁定技，准备阶段，你摸两张牌。';


	//绝汲，搬运自对战巧魁儁乂
	lib.skill.boss_jueji = {
		audio: 2,
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
	};

	lib.translate.boss_jueji = '绝汲';
	lib.translate.boss_jueji_info = '敌方角色摸牌阶段，若其已受伤，你可以令其少摸一张牌。';


	//魔箭，搬运自boss夜叉
	lib.skill.boss_mojian = {
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
	};

	lib.translate.boss_mojian = '魔箭';
	lib.translate.boss_mojian_info = '出牌阶段开始时，你可以对所有敌方角色使用一张万箭齐发。';


	//炼狱，搬运自boss马面
	lib.skill.boss_lianyu = {
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
	};

	lib.translate.boss_lianyu = '炼狱';
	lib.translate.boss_lianyu_info = '结束阶段，你可以对所有敌方角色造成1点火焰伤害。';


	//控魂，搬运自对战断狱仲达
	lib.skill.boss_skonghun = {
		audio: true,
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
	};

	lib.translate.boss_skonghun = '控魂';
	lib.translate.boss_skonghun_info = '出牌阶段开始时，若你已损失体力值不小于敌方角色数，你可以对所有敌方角色各造成1点雷电伤害，然后你恢复X点体力（X为受到伤害的角色数）。';




	//震怒，本体没技能，因为技能简单所以萌新自己抄了抄其他技能的写法
	lib.skill.boss_zhennu = {
		trigger: { player: 'phaseZhunbeiBegin' },
		forced: true,
		content: function () {
			'step 0'
			event.list = game.filterPlayer(function (current) {
				return current != player;
			});
			event.list.sort(lib.sort.seat);
			player.line(event.list, 'green');
			'step 1'
			var target = event.list.shift();
			target.damage();
			if (event.list.length) event.redo();
		},
		ai: {
			threaten: 2
		}
	};

	lib.translate.boss_zhennu = '震怒';
	lib.translate.boss_zhennu_info = '锁定技，准备阶段，你对所有其他角色造成1点伤害。';


	//除害，改自手杀周处技能，去除了使命
	lib.skill.txhj_chuhai = {
		audio: 'chuhai',
		enable: 'phaseUse',
		usable: 1,
		filter: function (event, player) {
			return !player.hasSkillTag('noCompareSource');
		},
		filterTarget: function (card, player, target) {
			return target != player && target.countCards('h') > 0 &&
				!target.hasSkillTag('noCompareTarget');
		},
		prompt: '与一名其他角色进行拼点',
		content: function () {
			'step 0'
			player.draw();
			'step 1'
			if (player.canCompare(target)) player.chooseToCompare(target);
			else event.finish();
			'step 2'
			if (result.bool) {
				player.storage.txhj_chuhai2 = target;
				player.addTempSkill('txhj_chuhai2', 'phaseUseEnd');
				if (target.countCards('h') > 0) {
					player.viewHandcards(target);
					var types = [], cards = [], hs = target.getCards('h');
					for (var i of hs) {
						types.add(get.type2(i, target));
					}
					for (var i of types) {
						var card = get.cardPile(function (card) {
							return get.type2(card, false) == i;
						});
						if (card) cards.push(card);
					}
					if (cards.length) player.gain(cards, 'gain2', 'log');
				}
			}
		},
		subSkill: {
			add: {
				trigger: { player: 'compare' },
				forced: true,
				popup: false,
				filter: function (event, player) {
					return event.getParent().name == 'txhj_chuhai' && event.num1 < 13 && player.countCards('e') < 4;
				},
				content: function () {
					var num = 4 - player.countCards('e');
					game.log(player, '的拼点牌点数+', num);
					trigger.num1 = Math.min(13, trigger.num1 + num);
				}
			},
		},
		ai: {
			order: 9,
			result: {
				target: function (player, target) {
					if (player.countCards('hs', function (card) {
						return get.tag(card, 'damage') > 0 && player.canUse(card, target, null, true) &&
							get.effect(target, card, player, player) > 0 && player.hasValueTarget(card, null, true);
					}) > 0) return -3;
					return -1;
				},
			},
		},
	};
	lib.skill.txhj_chuhai2 = {
		trigger: { source: 'damageSource' },
		forced: true,
		charlotte: true,
		onremove: true,
		filter: function (event, player) {
			if (event.player != player.storage.txhj_chuhai2) return false;
			for (var i = 1; i < 6; i++) {
				if (player.isEmpty(i)) return true;
			}
			return false;
		},
		content: function () {
			for (var i = 1; i < 7; i++) {
				if (player.isEmpty(i)) {
					var sub = 'equip' + i, card = get.cardPile(function (card) {
						return get.subtype(card, false) == sub && !get.cardtag(card, 'gifts');
					});
					if (card) {
						player.$gain2(card);
						game.delayx();
						player.equip(card);
						break;
					}
				}
			}
		},
	};

	lib.translate.txhj_chuhai = '除害';
	lib.translate.txhj_chuhai_info = '出牌阶段限一次，你可以摸一张牌，然后和一名其他角色拼点。若你赢，则你观看其手牌，并从牌堆/弃牌堆中获得其手牌中包含的类型的牌各一张，且当你于此阶段内对其造成伤害后，你将牌堆/弃牌堆中的一张装备牌置于你的一个空置装备栏内。';
	//-----------------------------------//侍灵-----------------------------------//
	//侍·强取豪夺
	lib.skill._buff_txhj_shi_qiangquhaoduo = {//
		trigger: {
			global: ["loseAfter", "loseAsyncAfter"],
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.type != 'discard') return false;
			if ((event.discarder || event.getParent(2).player) != player) return false;
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_qiangquhaoduo') || player != game.me) return false;
			return event.cards && event.cards.length > 0 && get.skillIdInServantData(event.getParent(2).name);
		},
		content: function () {
			for (var i = 0; i < trigger.cards.length; i++) {
				var card = trigger.player.getCards('he', p => get.type(p) == get.type(trigger.cards[i]));
				player.gain(card, 'gain2');
			}
			game.log(player, '触发了【侍·强取豪夺】');
			player.buffUpdate(event.name);
		},
	};
	//侍·锐不可当
	lib.skill._buff_txhj_shi_ruibukedang = {//
		trigger: {
			source: "damageEnd",
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_ruibukedang') || player != game.me) return false;
			return event.num && event.num > 0 && get.skillIdInServantData(event.getParent().name);
		},
		content: function () {
			var targets = player.getEnemies().filter(p => {
				return p.isIn();
			}).randomGet();
			targets.damage();
			game.log(player, '触发了【侍·锐不可当】');
			player.buffUpdate(event.name);
		},
	};
	//侍·魔法大师
	lib.skill._buff_txhj_shi_mofadashi = {//
		trigger: {
			player: "judgeEnd",
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_mofadashi') || player != game.me) return false;
			return event.result.card && get.skillIdInServantData(event.getParent().name);
		},
		content: function () {
			var suits = lib.suit.slice(0);
			suits.remove(get.suit(trigger.result.card));
			var cards = [];
			for (var i = 0; i < suits.length; i++) {
				var card = get.cardPile2(function (card) {
					return get.suit(card) == suits[i] && !cards.includes(card);
				});
				if (card) cards.push(card);
			}
			if (cards) player.gain(cards, 'gain2');
			game.log(player, '触发了【侍·魔法大师】');
			player.buffUpdate(event.name);
		},
	};
	//侍·妙手回春
	lib.skill._buff_txhj_shi_miaoshouhuichun = {//
		trigger: {
			player: "recoverEnd",
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_miaoshouhuichun') || player != game.me) return false;
			return event.num && event.num > 0 && get.skillIdInServantData(event.getParent().name);
		},
		content: function () {
			if (player.isDamaged()) {
				player.recover();
			} else {
				player.draw(2);
			}
			game.log(player, '触发了【侍·妙手回春】');
			player.buffUpdate(event.name);
		},
	};
	//才天命赋
	lib.skill._buff_txhj_shi_caitianmingfu = {//
		trigger: {
			player: ['useSkillEnd', 'logSkill'],
		},
		usable: 10,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_caitianmingfu') || player != game.me) return false;

			return get.skillIdInServantData(event.skill, 0);
		},
		content: function () {
			player.draw();
			game.log(player, '触发了【才天命赋】');
			player.buffUpdate(event.name);
		},
	};
	//神灵赐祝
	lib.skill._buff_txhj_shi_shenlingcizhu = {//
		trigger: {
			player: ['useSkillEnd', 'logSkill'],
		},
		usable: 10,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_shenlingcizhu') || player != game.me) return false;
			return get.skillIdInServantData(event.skill, 1);
		},
		content: function () {
			player.draw();
			game.log(player, '触发了【神灵赐祝】');
			player.buffUpdate(event.name);
		},
	};
	//应天受命
	lib.skill._buff_txhj_shi_yingtianshouming = {//
		trigger: {
			player: ['useSkillEnd', 'logSkill'],
		},
		usable: 10,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_yingtianshouming') || player != game.me) return false;
			return get.skillIdInServantData(event.skill, 2);
		},
		content: function () {
			player.draw();
			game.log(player, '触发了【应天受命】');
			player.buffUpdate(event.name);
		},
	};
	//侍·固若金汤
	lib.skill._buff_txhj_shi_guruojintang = {//
		trigger: {
			player: ["damageCancelled", "damageZero"],
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_guruojintang') || player != game.me) return false;
			for (var i of event.childEvents) {
				if (i && i.current && i.current.skill) {
					return player.countCards('h') < player.maxHp && get.skillIdInServantData(i.current.skill);
				}
			}
		},
		content: function () {
			player.drawTo(player.maxHp);
			game.log(player, '触发了【侍·固若金汤】');
			player.buffUpdate(event.name);
		},
	};
	//侍·雪上加霜
	lib.skill._buff_txhj_shi_xveshangjiashuang = {//
		trigger: {
			player: "gainEnd",
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_xveshangjiashuang') || player != game.me) return false;
			if (!event.source || event.source == player || !event.source.isIn() || !event.cards || event.cards.length == 0) return false;
			var evt = event.getl(event.source);
			return evt && evt.cards2 && evt.cards2.length > 0 && get.skillIdInServantData(event.getParent(2).name);
		},
		content: async function (event, trigger, player) {
			var targets = player.getEnemies().filter(p => {
				return p.countCards('he') > 0;
			});
			await Promise.all(
				targets.map(async (target, index) => {
					await target.randomDiscard('he');
				}));
			game.log(player, '触发了【侍·雪上加霜】');
			player.buffUpdate(event.name);
		},
	};
	//侍·疾风骤雨
	lib.skill._buff_txhj_shi_jifengzhouyu = {//
		trigger: {
			player: "gainEnd",
		},
		usable: 1,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shi_jifengzhouyu') || player != game.me) return false;
			if (event.source || !event.cards || event.cards.length == 0) return false;
			return get.skillIdInServantData(event.getParent(2).name);
		},
		content: function () {
			player.draw(2);
			game.log(player, '触发了【侍·疾风骤雨】');
			player.buffUpdate(event.name);
		},
	};
	//----------------------------------------------------//
	//乱世兴军
	lib.skill._buff_txhj_luanshixingjun = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			var num = get.number(event.card);
			return num && (num === 3 || num === 6 || num === 9) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_luanshixingjun');
		},
		content: function () {
			trigger.directHit.addArray(game.players);
			game.log(player, '触发了【乱世兴军】');
			player.buffUpdate(event.name);
		},
	};
	//劫命掠财
	lib.skill._buff_txhj_jieminglvecai = {
		trigger: {
			player: "gainEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.source && event.source != game.me && event.source.isIn() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jieminglvecai');
		},
		content: function () {
			trigger.source.loseHp();
			game.log(player, '触发了【劫命掠财】');
			player.buffUpdate(event.name);
		},
	};
	//催攻急进
	lib.skill._buff_txhj_cuigongjijin = {
		trigger: {
			global: ["useCard", "useCardAfter"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player, eventname) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_cuigongjijin') || player != game.me) return false;
			if (event.card.name != "sha") return false;
			var evt = event.getParent("phase");
			if (!evt) return false;
			var index = event.player.getHistory("useCard", function (evtx) {
				return evtx.card.name == "sha" && evtx.getParent("phase") == evt;
			}).indexOf(event);
			if (eventname === "useCardAfter" && index == 0) return !event.player.getHistory("sourceDamage", function (evt) {
				return evt.card === event.card;
			}).length;
			return index == 0;
		},
		content: function () {
			if (event.triggername === "useCard") {
				trigger.baseDamage++;
			} else {
				trigger.player.damage();
			}
			game.log(player, '触发了【催攻急进】');
			player.buffUpdate(event.name);
		},
	};
	//善算谋划
	lib.skill._buff_txhj_shansuanmouhua = {
		trigger: {
			global: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			var evt = player.getLastUsed(1);
			if (!evt || !evt.card || !event.card) return false;
			return get.type(event.card, 'trick') == 'trick' && get.name(evt.card) == get.name(event.card) && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_shansuanmouhua');
		},
		content: function () {
			player.gainMaxHp();
			game.log(player, '触发了【善算谋划】');
			player.buffUpdate(event.name);
		},
	};
	//所向披靡
	lib.skill._buff_txhj_suoxiangpimi = {
		trigger: {
			source: "damageBegin1",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return !event.player.countCards("e") && event.notLink() && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_suoxiangpimi');
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【所向披靡】');
			player.buffUpdate(event.name);
		},
	};
	//忠贞义烈
	lib.skill._buff_txhj_zhongzhenyilie = {
		trigger: {
			player: "loseHpEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_zhongzhenyilie');
		},
		content: function () {
			player.gainMaxHp();
			game.log(player, '触发了【忠贞义烈】');
			player.buffUpdate(event.name);
		},
	};
	//名门望族
	lib.skill._buff_txhj_mingmenwangzu = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return get.type(event.card, 'trick') == 'trick' && !event.card.isCard && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_mingmenwangzu');
		},
		content: function () {
			trigger.directHit.addArray(game.players);
			game.log(player, '触发了【名门望族】');
			player.buffUpdate(event.name);
		},
	};
	//有智而迟
	lib.skill._buff_txhj_youzhierchi = {
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player.getHistory("damage").length == 1 && event.player != player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_youzhierchi');
		},
		content: function () {
			player.recover();
			game.log(player, '触发了【有智而迟】');
			player.buffUpdate(event.name);
		},
	};
	//三尖两刃
	lib.skill._buff_txhj_sanjianliangren = {
		trigger: {
			player: ["chooseToCompareAfter", "compareMultipleAfter"],
			target: ["chooseToCompareAfter", "compareMultipleAfter"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_sanjianliangren');
		},
		content: function () {
			var triggerlist = [];
			for (var i of trigger.lose_list) {
				triggerlist.push(i[0]);
			}
			for (var i of trigger.lose_list) {
				if (i[0] == trigger.result.winner || i[0] == trigger.result.forceWinner) {
					triggerlist.remove(i[0]);
				}
			}
			for (var i = 0; i < triggerlist.length; i++) {
				triggerlist[i].loseHp();
			}
			game.log(player, '触发了【三尖两刃】');
			player.buffUpdate(event.name);
		},
	};
	//背水一战
	lib.skill._buff_txhj_beishuiyizhan = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_beishuiyizhan');
		},
		content: function () {
			player.loseHp();
			player.addTempSkill('buff_txhj_beishuiyizhan', 'phaseAfter');
			player.addMark('buff_txhj_beishuiyizhan');
			game.log(player, '触发了【背水一战】');
			player.buffUpdate(event.name);
		},
	};
	lib.skill.buff_txhj_beishuiyizhan = {
		mark: true,
		marktext: "背",
		intro: {
			name: "背水一战",
			content: "出杀次数+#",
		},
		onremove(player) {
			player.removeMark('buff_txhj_beishuiyizhan', Infinity);
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + player.countMark('buff_txhj_beishuiyizhan');
			},
		},
	}
	//激烈昂扬
	lib.skill._buff_txhj_jilieangyang = {
		trigger: {
			player: "phaseBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_jilieangyang');
		},
		content: async function (event, trigger, player) {
			await player.loseHp();
			const num = player.maxHp - player.hp;
			await player.addTempSkill('buff_txhj_jilieangyang', 'phaseUseAfter');
			player.addMark('buff_txhj_jilieangyang', num);
			game.log(player, '触发了【激烈昂扬】');
			player.buffUpdate(event.name);
		},
	};
	lib.skill.buff_txhj_jilieangyang = {
		mark: true,
		marktext: "激",
		intro: {
			name: "激烈昂扬",
			content: "出杀次数+#",
		},
		onremove(player) {
			player.removeMark('buff_txhj_jilieangyang', Infinity);
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + player.countMark('buff_txhj_jilieangyang');
			},
		},
	}
	//再衰三竭
	lib.skill._buff_txhj_zaishuaisanjie = {
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha' && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_zaishuaisanjie')) return num + 1;
			},
		},
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.card.name != 'sha') return false;
			const num = player.getHistory("sourceDamage", function (evt) {
				return evt.card == event.card;
			}).length;
			return !num && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_zaishuaisanjie');
		},
		content: function () {
			if (!player.hasSkill("buff_txhj_zaishuaisanjie")) player.addSkill("buff_txhj_zaishuaisanjie");
			player.addMark('buff_txhj_zaishuaisanjie');
			game.log(player, '触发了【再衰三竭】');
			player.buffUpdate(event.name);
		},
	};
	lib.skill.buff_txhj_zaishuaisanjie = {
		trigger: {
			player: "damageBegin3",
		},
		mark: true,
		marktext: "竭",
		intro: {
			name: "再衰三竭",
			content: "下次受到的伤害+#",
		},
		charlotte: true,
		onremove: true,
		forced: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_zaishuaisanjie') && player.countMark('buff_txhj_zaishuaisanjie') > 0;
		},
		content: function () {
			trigger.num += player.countMark('buff_txhj_zaishuaisanjie');
			player.removeSkill(event.name);
			if (player.buff && player.buff['buff_txhj_zaishuaisanjie']) {
				player.buff['buff_txhj_zaishuaisanjie'].update();
			}
		},
	};
	//奇谋妙计
	lib.skill._buff_txhj_qimoumiaoji = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.card.name != "shunshou" && event.card.name != "guohe" && event.card.name != "wuzhong") return false;
			return event.card.isCard && event.cards && event.cards.length && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_qimoumiaoji');
		},
		content: function () {
			trigger.effectCount = 2;
			game.log('【奇谋妙计】', trigger.card, '结算两次');
			player.buffUpdate(event.name);
		},
	};
	//福星高照
	lib.skill._buff_txhj_fuxinggaozhao = {
		trigger: {
			global: "phaseBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			var num = Math.floor(player.maxHp / 2);
			return num && player.hp < num && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_fuxinggaozhao');
		},
		content: function () {
			player.recover();
			game.log(player, '触发了【福星高照】');
			player.buffUpdate(event.name);
		},
	};
	//威震华夏
	lib.skill._buff_txhj_weizhenhuaxia = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!event.targets || !event.targets.length) {
				return false;
			}
			if (event.card.name != 'sha') return false;
			return event.card && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_weizhenhuaxia');
		},
		content: async function (event, trigger, player) {
			const suit = get.suit(trigger.card);
			const targets = trigger.targets;
			if (num > 0) {
				await Promise.all(
					targets.map(async (target, index) => {
						if (target.isIn()) {
							await target.addTempSkill('buff_txhj_weizhenhuaxia');
							target.storage.buff_txhj_weizhenhuaxia?.add(suit);
							target.update();
						}
					}));
			}
			game.log(player, '触发了【威震华夏】');
			player.buffUpdate(event.name);
		},
	};
	lib.skill.buff_txhj_weizhenhuaxia = {
		mark: true,
		marktext: "威",
		intro: {
			content: function (suit) {
				return "不能使用或打出" + get.translation(suit) + "的手牌";
			},
			name: "威震华夏",
		},
		charlotte: true,
		mode: ["taixuhuanjing"],
		init: function (player) {
			player.storage.buff_txhj_weizhenhuaxia = [];
		},
		onremove: true,
		mod: {
			cardEnabled2(card, player) {
				const suit = get.suit(card);
				if (player.storage.buff_txhj_weizhenhuaxia.includes(suit)) return false;
			},
		},
	};
	//勇猛无前
	lib.skill._buff_txhj_yongmengwuqian = {
		trigger: {
			source: "damageBegin1",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && event.notLink() && lib.config.taixuhuanjing.buff.includes('buff_txhj_yongmengwuqian');
		},
		content: function () {
			trigger.num++;
			player.loseHp();
			game.log(player, '触发了【勇猛无前】');
			player.buffUpdate(event.name);
		},
	};
	//贩酒无汙
	lib.skill._buff_txhj_fanjiuwuwu = {
		trigger: {
			global: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.card && event.card.name == 'jiu' && event.player != player && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_fanjiuwuwu');
		},
		content: function () {
			trigger.player.damage();
			game.log(player, '触发了【贩酒无汙】');
			player.buffUpdate(event.name);
		},
	};
	//荒淫无度
	lib.skill._buff_txhj_huangyinwudu = {
		trigger: {
			source: "damageBegin1",
			player: "damageBegin3",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_huangyinwudu')) return false;
			if (event.player == player && (!event.source || !event.source.hasSex("female"))) return false;
			if (event.player != player && (!event.player || !event.player.hasSex("female"))) return false;
			return event.notLink();
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【荒淫无度】');
			player.buffUpdate(event.name);
		},
	};
	//威龙猛将
	lib.skill._buff_txhj_weilongmengjiang = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return !event.card.isCard && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_weilongmengjiang');
		},
		content: function () {
			var card = trigger.target.getCards("h").randomGet();
			player.gain(card, trigger.target);
			game.log(player, '触发了【威龙猛将】');
			player.buffUpdate(event.name);
		},
	};
	//攻城掠地
	lib.skill._buff_txhj_gongchenglvedi = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!event.card || !get.tag(event.card, "damage") || !lib.config.taixuhuanjing.buff.includes('buff_txhj_gongchenglvedi')) return false;
			var num = player.getHistory("sourceDamage", evt => {
				if (!evt || !evt.card) return false;
				if (event.card.name == "sha") {
					if (game.hasNature(event.card)) return evt.card.name == event.card.name && evt.card.nature == event.card.nature;
					return evt.card.name == event.card.name && !game.hasNature(evt.card) && !game.hasNature(event.card);
				} else {
					return evt.card.name == event.card.name;
				}
			}).length;
			return num < 2 && player == game.me;
		},
		content: function () {
			var card = get.cardPile((card) => {
				if (trigger.card.name === "sha") {
					if (game.hasNature(trigger.card)) return card.name === trigger.card.name && card.nature == trigger.card.nature;
					return card.name === trigger.card.name && !game.hasNature(card);
				} else {
					return card.name === trigger.card.name;
				}
			});
			if (card) {
				player.gain(card, "gain2");
				game.log(player, '触发了【攻城掠地】');
				player.buffUpdate(event.name);
			}
		},
	};
	//祸福相依
	lib.skill._buff_txhj_fuhuoxiangyi = {
		trigger: {
			player: ["loseAfter"],
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			var evt = event.getl(player);
			return evt?.cards2?.length > 1 && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_fuhuoxiangyi');
		},
		content: function () {
			player.draw();
			game.log(player, '触发了【祸福相依】');
			player.buffUpdate(event.name);
		},
	};
	//魔仕绝策
	lib.skill._buff_txhj_moshijuece = {
		trigger: {
			source: "damageBegin1",
			target: "useCardToTargeted",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_moshijuece')) return false;
			if (get.type(event.card) == "trick") {
				if (event.name == "damage") {
					return get.color(event.card) == 'black' && event.notLink();
				} else {
					return get.color(event.card) == 'red' && event.notLink();
				}
			}
		},
		content: function () {
			if (trigger.name == "damage") {
				trigger.num++;
			} else { player.loseHp(); }
			game.log(player, '触发了【魔仕绝策】');
			player.buffUpdate(event.name);
		},
	};
	//略施小计
	lib.skill._buff_txhj_lveshixiaoji = {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_lveshixiaoji');
		},
		content: function () {
			var cards = [];
			var zhinang = get.zhinangs();
			for (var i = 0; i < zhinang.length; i++) {
				var cardname = zhinang[i];
				var cards1 = get.cardPile((card) => {
					return card.name === cardname;
				})
				cards.push(cards1);
			};
			if (cards.length) player.gain(cards, "gain2");
			game.log(player, '触发了【略施小计】');
			player.buffUpdate(event.name);
		},
	};
	//威风堂堂
	lib.skill._buff_txhj_weifengtangtang = {
		trigger: {
			source: 'damageBegin1',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!event.card || !get.tag(event.card, "damage") || !lib.config.taixuhuanjing.buff.includes('buff_txhj_weifengtangtang')) return false;
			var num = player.getRoundHistory("sourceDamage", evt => {
				if (!evt || !evt.card) return false;
				if (event.card.name == "sha") {
					if (game.hasNature(event.card)) return evt.card.name == event.card.name && evt.card.nature == event.card.nature;
					return evt.card.name == event.card.name && !game.hasNature(evt.card) && !game.hasNature(event.card);
				} else {
					return evt.card.name == event.card.name;
				}
			}).length;
			return num < 1 && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_weifengtangtang');
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【威风堂堂】');
			player.buffUpdate(event.name);
		},
	};
	//无间魔神
	lib.skill._buff_txhj_wujianmoshen = {
		trigger: {
			source: 'damageBegin3',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (event.num < 3) return false;
			return player == game.me && event.notLink() && lib.config.taixuhuanjing.buff.includes('buff_txhj_wujianmoshen');
		},
		content: function () {
			'step 0'
			trigger.num += trigger.num;
			'step 1'
			var num = Math.floor(player.maxHp / 2);
			player.loseMaxHp(num);
			game.log(player, '触发了【无间魔神】');
			player.buffUpdate(event.name);
		},
	};
	//火凤燎原
	lib.skill._buff_txhj_huofengliaoyuan = {
		trigger: {
			source: 'damageEnd',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			return event.hasNature("fire") && player == game.me && lib.config.taixuhuanjing.buff.includes('buff_txhj_huofengliaoyuan');
		},
		content: function () {
			player.draw();
			game.log(player, '触发了【火凤燎原】');
			player.buffUpdate(event.name);
		},
	};
	//庭柱之力
	lib.skill._buff_txhj_tingzhuzhili = {
		trigger: {
			source: 'damageBegin1',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (player != game.me || !lib.config.taixuhuanjing.buff.includes('buff_txhj_tingzhuzhili') || !event.card) return false;
			return event.notLink() && get.is.convertedCard(event.card) && get.type(event.card, 'trick') == 'trick' && get.tag(event.card, 'damage');
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【庭柱之力】');
			player.buffUpdate(event.name);
		},
	};
	//步步为营
	lib.skill._buff_txhj_bubuweiying = {
		trigger: {
			source: 'damageBegin1',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!event.card || event.card.name != 'sha' || !lib.config.taixuhuanjing.buff.includes('buff_txhj_bubuweiying') || player != game.me) return false;
			var num1 = player.getRoundHistory("useCard", evt => {
				if (!evt || !evt.card) return false;
				return evt.card.name == 'sha';
			}).length;
			var num2 = game.roundNumber;
			return num2 > num1 && event.notLink();
		},
		content: function () {
			trigger.num++;
			game.log(player, '触发了【步步为营】');
			player.buffUpdate(event.name);
		},
	};
	//万夫莫敌
	lib.skill._buff_txhj_wanfumodi = {
		trigger: {
			player: 'phaseZhunbeiBegin',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_wanfumodi') || player != game.me) return false;
			return true;
		},
		content: function () {
			var cards = [];
			var natures = lib.inpile_nature.slice(0);
			for (var i = 0; i < natures.length; i++) {
				cards.push(get.cardPile((card) => {
					if (card.name == 'sha' && game.hasNature(card)) {
						return card.nature == natures[i];
					}
				}))
			};
			cards.push(get.cardPile((card) => {
				return card.name == 'sha' && !game.hasNature(card);
			}));
			if (cards) player.gain(cards, 'gain2');
			game.log(player, '触发了【万夫莫敌】');
			player.buffUpdate(event.name);
		},
	};
	//闭月羞花
	lib.skill._buff_txhj_biyuexiuhua = {
		trigger: {
			player: 'damageBegin3',
		},
		forced: true,
		usable: 1,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_biyuexiuhua') || player != game.me) return false;
			return event.source && event.source.hasSex('male');
		},
		content: function () {
			trigger.num--;
			game.log(player, '触发了【闭月羞花】');
			player.buffUpdate(event.name);
		},
	};
	//天性烈直
	lib.skill._buff_txhj_tianxingliezhi = {
		trigger: {
			player: 'damageBegin4',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_tianxingliezhi') || player != game.me) return false;
			var num = player.getRoundHistory("useSkill", evt => {
				return evt.skill == '_buff_txhj_tianxingliezhi';
			}).length;
			return event.num > 0 && num < 2;
		},
		content: function () {
			var targets = player.getEnemies().filter(p => {
				return p.countCards('he') > 0;
			}).randomGet();
			if (targets) targets.randomDiscard();
			game.log(player, '触发了【天性烈直】');
			player.buffUpdate(event.name);
		},
	};
	//代汉虚梦
	lib.skill._buff_txhj_daihanxumeng = {
		trigger: {
			player: ['phaseDrawBegin', 'phaseJieshuBegin']
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_daihanxumeng') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			var num1 = game.countPlayer(function (current) {
				return current.isIn();
			});
			if (trigger.name === 'phaseDraw') {
				trigger.num += num1;
			}
			if (trigger.name === 'phaseJieshu') {
				player.randomDiscard('h', num1);
				if (player.countCards('h') == 0) player.loseMaxHp();
			}
			game.log(player, '触发了【代汉虚梦】');
			player.buffUpdate(event.name);
		},
	};
	//骄纵恣意
	lib.skill._buff_txhj_jiaozongziyi = {
		trigger: {
			player: 'phaseDrawBegin',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_jiaozongziyi') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			var num1 = game.countPlayer(function (current) {
				return current.isIn() && current != player;
			});
			trigger.num += num1;
			game.log(player, '触发了【骄纵恣意】');
			player.buffUpdate(event.name);

		},
	};
	//铜墙草壁
	lib.skill._buff_txhj_tongqiangcaobi = {
		trigger: {
			player: 'damageBegin3',
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_tongqiangcaobi') || player != game.me) return false;
			return event.card && (event.card.name == 'sha' || get.type(event.card, 'trick') == 'trick') && event.notLink();
		},
		content: async function (event, trigger, player) {
			if (trigger.card.name == 'sha') {
				trigger.num--;
			} else if (get.type(trigger.card, 'trick') == 'trick') {
				trigger.num++;
			}
			game.log(player, '触发了【铜墙草壁】');
			player.buffUpdate(event.name);
		},
	};
	//丧尸骸龙
	lib.skill._buff_txhj_sangshihailong = {
		trigger: {
			global: "roundEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_sangshihailong') || player != game.me) return false;
			if (game.roundNumber == 0) return false;
			let num = player.getRoundHistory("damage")?.length || 0;
			return num == 0;
		},
		content: async function (event, trigger, player) {
			let targets = game.filterPlayer(function (current) {
				return current.isIn() && current !== player;
			});
			const num = targets.length;
			if (num > 0) {
				await Promise.all(
					targets.map(async (target, index) => {
						await target.loseMaxHp();
					}));
				await player.gainMaxHp(num);
			}
			game.log(player, '触发了【丧尸骸龙】');
			player.buffUpdate(event.name);
		},
	};
	//大梦先觉
	lib.skill._buff_txhj_damengxianjue = {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_damengxianjue') || player != game.me) return false;
			return game.roundNumber <= 2;
		},
		content: async function (event, trigger, player) {
			if (game.roundNumber < 2 && !player.storage.txhj_damengxianjue) {
				player.storage.txhj_damengxianjue = {
					hp: player.hp,
					maxHp: player.maxHp
				}
			} else if (game.roundNumber == 2 && player.storage.txhj_damengxianjue) {
				player.hp = player.storage.txhj_damengxianjue.hp;
				player.maxHp = player.storage.txhj_damengxianjue.maxHp;
				game.log(player, '触发了【大梦先觉】');
				player.buffUpdate(event.name);
			}
		},
	};
	//一往无前
	lib.skill._buff_txhj_yiwangwuqian = {
		trigger: {
			player: ["phaseEnd", "useCardToTargeted"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_yiwangwuqian') || player != game.me) return false;
			if (event.name == 'phase') {
				let num = 0;
				game.players.forEach(function (current) {
					if (current.maxHp > num && current != player) num += current.maxHp;
				});
				let target = game.filterPlayer(current => current != player && current.maxHp == num);
				return target && target.length == 1 && player.canUse("sha", target[0], false, false);
			} else if (event.name == "useCardToTargeted") {
				return event.card && event.card.name == "sha" && event.skill && event.skill == "_buff_txhj_yiwangwuqian";
			}
		},
		content: async function (event, trigger, player) {
			if (trigger.name == 'phase') {
				let num = 0;
				game.players.forEach(function (current) {
					if (current.maxHp > num && current != player) num += current.maxHp;
				});
				let target = game.filterPlayer(current => current != player && current.maxHp == num);
				if (target && target.length > 0) {
					await player.useCard({ name: "sha" }, target[0], false, "_buff_txhj_yiwangwuqian");
				}
				return;
			} else if (trigger.name == "useCardToTargeted") {
				let suit = [], cards = [];
				player.getHistory('lose', evt => {
					if (evt.type == "discard") cards.addArray(evt.cards2);
				});
				if (!cards.length) return;
				for (let i of cards) {
					if (!suit.includes(get.suit(i))) suit.add(get.suit(i));
				}
				let num = suit.length;
				trigger.parent.baseDamage += num;
			}
			game.log(player, '触发了【一往无前】');
			player.buffUpdate(event.name);
		},
	};
	//言出法随
	lib.skill._buff_txhj_yanchufasui = {
		trigger: {
			source: "dieAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_yanchufasui') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			await player.draw(3);
			game.log(player, '触发了【言出法随】');
			player.buffUpdate(event.name);
		},
	};
	//闭关自守
	lib.skill._buff_txhj_biguanzishou = {
		trigger: {
			player: "phaseUseBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_biguanzishou') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			await player.gainMaxHp();
			game.log(player, '触发了【闭关自守】');
			player.buffUpdate(event.name);
		},
	};
	//竭泽而渔
	lib.skill._buff_txhj_jiezeeryu = {
		trigger: {
			player: "loseAfter",
			global: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_jiezeeryu') || player != game.me) return false;
			var evt = event.getl(player);
			return evt?.cards2?.length && _status.currentPhase == player && event.type == 'discard';
		},
		content: async function (event, trigger, player) {
			await player.draw();
			game.log(player, '触发了【竭泽而渔】');
			player.buffUpdate(event.name);
		},
	};
	//酒助雄图
	lib.skill._buff_txhj_jiuzhuxiongtu = {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "jiu" && lib.config.taixuhuanjing.buff.includes('buff_txhj_jiuzhuxiongtu') && player == game.me) return num + 1;
				return;
			},
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
	};
	//帘窥壁听
	lib.skill.buff_txhj_liankuibiting = {
		init: function (player, skill) {
			player.markSkill('buff_txhj_liankuibiting');
		},
		onremove: true,
		marktext: "帘",
		intro: {
			name: "帘窥壁听",
			markcount: function (num) {
				return (num || 0).toString();
			},
			content: function (num) {
				return `获得牌进度：${(num || 0)}/3`;
			}
		},
	};
	lib.skill._buff_txhj_liankuibiting = {
		trigger: {
			player: "gainEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_liankuibiting') || player != game.me) return false;
			return _status.currentPhase != player && event.cards && event.cards.length > 0 && player.countMark("buff_txhj_liankuibiting") + event.cards.length >= 3;
		},
		content: async function (event, trigger, player) {
			if (!player.hasSkill("buff_txhj_liankuibiting")) await player.addSkill("buff_txhj_liankuibiting");
			player.addMark("buff_txhj_liankuibiting", trigger.cards.length, false);
			while (player.countMark("buff_txhj_liankuibiting") >= 3) {
				let card = get.cardPile2(function (card) {
					return get.type(card, false) == 'basic';
				});
				player.removeMark("buff_txhj_liankuibiting", 3, false);
				if (card) await player.gain(card, 'gain2');
				game.log(player, '获得了', card)
			}
			game.log(player, '触发了【帘窥壁听】');
			player.buffUpdate(event.name);
		},
	};
	//镇南将军
	lib.skill.buff_txhj_zhennanjiangjun = {
		init: function (player, skill) {
			player.markSkill('buff_txhj_zhennanjiangjun');
		},
		onremove: true,
		marktext: "镇",
		intro: {
			name: "镇南将军",
			markcount: function (num) {
				return (num || 0).toString();
			},
			content: function (num) {
				return `未造成伤害回合数：${(num || 0)}`;
			}
		},
	};
	lib.skill._buff_txhj_zhennanjiangjun = {
		trigger: {
			player: "phaseEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_zhennanjiangjun') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			if (!player.hasSkill("buff_txhj_zhennanjiangjun")) await player.addSkill("buff_txhj_zhennanjiangjun");
			let damage = player.getHistory('sourceDamage', evt => evt.num >= 0);
			if (!damage || damage.length <= 0) player.addMark("buff_txhj_zhennanjiangjun", 1, false);
			let targets = game.players.filter(p => p != player);
			let num = (player.countMark("buff_txhj_zhennanjiangjun") || 0) + 1;
			await Promise.all(
				targets.map(async (target, index) => {
					await target.loseHp(num);
				}));
			game.log(player, '触发了【镇南将军】');
			player.buffUpdate(event.name);
		},
	};
	//中庸之道
	lib.skill._buff_txhj_zhongyongzhidao = {
		trigger: {
			player: "phaseUseEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_zhongyongzhidao') || player != game.me) return false;
			return player.countCards("h") == player.getHandcardLimit();
		},
		content: async function (event, trigger, player) {
			await player.addTempSkills('stdshangjian', { player: "phaseBegin" });
			game.log(player, '触发了【中庸之道】');
			player.buffUpdate(event.name);
		},
	};
	//乱世良妆
	lib.skill._buff_txhj_luanshiliangzhuang = {
		trigger: {
			player: ["gainMaxHpAfter", "loseMaxHpAfter"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_luanshiliangzhuang') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			let targer = player.getEnemies().randomGet();
			await targer.loseHp(2);
			game.log(player, '触发了【乱世良妆】');
			player.buffUpdate(event.name);
		},
	};
	//素锦奇略
	lib.skill._buff_txhj_sujinqilve = {
		trigger: {
			player: "phaseUseEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_sujinqilve') || player != game.me) return false;
			let color = [];
			player.getHistory("useCard", evt => {
				if (!color.includes(get.color(evt.card, false))) color.push(get.color(evt.card, false))
			});
			return color.length < 2;
		},
		content: async function (event, trigger, player) {
			player.skip('phaseDiscard');
			game.log(player, '触发了【素锦奇略】');
			player.buffUpdate(event.name);
		},
	};
	//陷阵之志
	lib.skill.buff_txhj_xianzhenzhizhi = {
		trigger: {
			source: "damageEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		init: function (player, skill) {
			player.storage.buff_txhj_xianzhenzhizhi = null;
			player.markSkill('buff_txhj_xianzhenzhizhi');
		},
		mark: true,
		marktext: "陷",
		intro: {
			name: "陷阵之志",
			content: "player",
		},
		onremove: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_xianzhenzhizhi') || player != game.me) return false;
			return event.player;
		},
		content: async function (event, trigger, player) {
			const storage = player.storage.buff_txhj_xianzhenzhizhi;
			if (storage && storage == trigger.player) {
				await player.draw();
			}
			player.storage.buff_txhj_xianzhenzhizhi = trigger.player;
			game.log(player, '触发了【陷阵之志】');
			player.buffUpdate(event.name);
		},
	};
	lib.skill._buff_txhj_xianzhenzhizhi = {
		trigger: {
			player: "phaseUseBefore",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		priority: 10,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_xianzhenzhizhi') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			await player.addTempSkill('buff_txhj_xianzhenzhizhi');
		},
	};
	//顺风使帆
	lib.skill._buff_txhj_shunfengshifan = {
		trigger: {
			source: "damagebegin3",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		priority: 10,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shunfengshifan') || player != game.me) return false;
			return event.card && event.card.name == "sha" && _status.currentPhase != player;
		},
		content: async function (event, trigger, player) {
			trigger.num += 1;
			game.log(player, '触发了【顺风使帆】');
			player.buffUpdate(event.name);
		},
	};
	//觉而后思
	lib.skill._buff_txhj_jueerhousi = {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		priority: 10,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_jueerhousi') || player != game.me) return false;
			let num = player.getAllHistory('sourceDamage').reduce((sum, evt) => sum + evt.num, 0);
			return game.roundNumber == 2 && num > 0;
		},
		content: async function (event, trigger, player) {
			let num = player.getAllHistory('sourceDamage').reduce((sum, evt) => sum + evt.num, 0);
			let cards = [];
			[...ui.discardPile.childNodes].forEach(card => {
				if (player.hasAllHistory('useCard', evt => evt && evt.cards && evt.cards.includes(card))) cards.push(card);
			});
			if (!cards || !cards.length) return;
			if (cards.length > num) cards = cards.randomGets(num);
			player.gain(cards, 'gain2');
			game.log(player, '触发了【觉而后思】');
			player.buffUpdate(event.name);
		},
	};
	//白骨铸王
	lib.skill._buff_txhj_baiguzhuwang = {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha" && lib.config.taixuhuanjing.buff.includes('buff_txhj_baiguzhuwang') && player == game.me) return num + game.dead.length;
				return;
			},
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
	};
	//知行合一
	lib.skill._buff_txhj_zhixingheyi = {
		mod: {
			maxHandcard(player, num) {
				if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_zhixingheyi') || player != game.me) return;
				let num2 = 0;
				player.getAllHistory('gain', evt => {
					if (evt && evt.cards && evt.cards.length > 0) {
						num2 += evt.cards.length;
					}
				});
				return num + Math.floor(num2 / 5);
			},
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
	};
	//47 巨富雄豪
	lib.skill._buff_txhj_jufuxionghao = {
		trigger: {
			player: "useCardBefore",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_jufuxionghao') || player != game.me) return false;
			return !player.hasSkill('buff_txhj_jufuxionghao_suit') && (player.getEquip(3) || player.getEquip(4));
		},
		content: async function (event, trigger, player) {
			await player.addTempSkill('buff_txhj_jufuxionghao_suit');
		},
	};
	lib.skill.buff_txhj_jufuxionghao = {
		trigger: {
			player: "useCardBegin",
		},
		init: function (player) {
			player.storage.buff_txhj_jufuxionghao = [];
		},
		marktext: "富",
		intro: {
			name: "巨富雄豪",
			content: function (suit) {
				return "本回合已使用过" + get.translation(suit);
			},
		},
		onremove: true,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_jufuxionghao') || player != game.me) return false;
			if (!player.getEquip(3) && !player.getEquip(4)) return false;
			let suit = get.suit(event.card) == (get.suit(player.getEquip(3)) || get.suit(event.card) == get.suit(player.getEquip(4)));
			return event.card && !player.storage.buff_txhj_jufuxionghao.includes(suit) && suit;
		},
		content: async function (event, trigger, player) {
			let suit = get.suit(trigger.card);
			player.storage.buff_txhj_jufuxionghao.push(get.suit(suit));
			await player.draw();
			game.log(player, '触发了【巨富雄豪】');
			player.buffUpdate(event.name);
		},
	},
		//腾云驾雾
		lib.skill._buff_txhj_tengyunjiawu = {
			trigger: {
				player: "useCardToBegin",
			},
			forced: true,
			charlotte: true,
			ruleSkill: true,
			mode: ["taixuhuanjing"],
			filter: function (event, player) {
				if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_tengyunjiawu') || player != game.me) return false;
				if (!event.card) return false;
				var has = !game.getGlobalHistory("everything", evt => {
					return evt && evt.triggername == 'useCardToBegin' && evt.parent.player == player && evt.parent.card && evt.parent.card != event.card;
				}).some(evtx => {
					return get.name(event.card) == get.name(evtx.parent.card) && get.nature(event.card) == get.nature(evtx.parent.card)
				});
				return has;
			},
			content: async function (event, trigger, player) {
				let card = [];
				let target = game.filterPlayer(p => p != player && p.countCards('hej', { name: get.name(trigger.card), nature: get.nature(trigger.card) }) > 0).randomGet();
				if (!target) return;
				card.push(...target.getCards('hej', { name: get.name(trigger.card), nature: get.nature(trigger.card) }));
				if (!card || !card.length) return;
				card = card.randomGet();
				await target.loseToDiscardpile(card);
				game.log(player, '触发了【腾云驾雾】');
				player.buffUpdate(event.name);
			},
		};
	//智救护吏
	lib.skill._buff_txhj_zhijiuhuli = {
		trigger: {
			player: ["chooseToCompareAfter", "compareMultipleAfter"],
			target: ["chooseToCompareAfter", "compareMultipleAfter"],
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_zhijiuhuli') || player != game.me) return false;
			if (event.preserve) {
				return false;
			}
			return event.player == player && !get.owner(event.card1);
		},
		content: async function (event, trigger, player) {
			const card = get.cardPile(function (card) {
				return get.number(card) > get.number(trigger.card1);
			});
			if (!card) return;
			await player.gain(card, 'gain2');
			game.log(player, '触发了【智救护吏】');
			player.buffUpdate(event.name);
		},
	};
	//嗣位永祧
	lib.skill._buff_txhj_siweiyongtao = {
		mod: {
			cardUsable(card, player, num) {
				if (card.name != "sha" || !lib.config.taixuhuanjing.buff.includes('buff_txhj_siweiyongtao') || player != game.me) return;
				let cardname = [];
				player.getAllHistory('useCard', evt => {
					if (evt && evt.card) {
						cardname.add(evt.card.name);
					}
				});
				const num2 = Math.floor(cardname.length / 4)
				return num + num2;
			},
			maxHandcard(player, num) {
				if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_siweiyongtao') || player != game.me) return;
				let cardname = [];
				player.getAllHistory('useCard', evt => {
					if (evt && evt.card) {
						cardname.add(evt.card.name);
					}
				});
				const num2 = Math.floor(cardname.length / 4) * 2
				return num + num2;
			},
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
	};
	//布声断恩
	lib.skill._buff_txhj_bushengduanen = {
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_bushengduanen') || player != game.me) return false;
			if (event.targets.length == 1 && event.targets.includes(player)) return false;
			return get.type(event.card) == "trick" && !get.tag(event.card, "damage");
		},
		multitarget: true,
		content: async function (event, trigger, player) {
			let targets = trigger.targets;
			targets = targets.filter(i => i != player);
			if (!targets.length) return;
			await Promise.all(
				targets.map(async (target, index) => {
					await target.loseHp();
				}));
			game.log(player, '触发了【布声断恩】');
			player.buffUpdate(event.name);
		},
	};
	//戟骨饮血
	lib.skill._buff_txhj_jiguyinxue = {
		trigger: {
			source: "damageEnd",
		},
		usable: 3,
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_jiguyinxue') || player != game.me) return false;
			const num = game.getGlobalHistory("everything", evt => {
				return evt.name == "useCard" && evt?.card?.name == "sha" && evt.targets;
			}).reduce((list, evt) => {
				return list.addArray(evt.targets);
			}, []).length;
			return num > 0;
		},
		content: async function (event, trigger, player) {
			const num = game.getGlobalHistory("everything", evt => {
				return evt.name == "useCard" && evt?.card?.name == "sha" && evt.targets;
			}).reduce((list, evt) => {
				return list.addArray(evt.targets);
			}, []).length;
			await player.draw(num);
			game.log(player, '触发了【戟骨饮血】');
			player.buffUpdate(event.name);
		},
	};
	//单打独斗
	lib.skill._buff_txhj_dandadudou = {
		trigger: {
			player: "phaseJieshuBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_dandadudou') || player != game.me) return false;
			const num = player.getRoundHistory('useCard', evt => {
				return get.is.virtualCard(evt.card);
			}).length;
			return num > 0;
		},
		content: async function (event, trigger, player) {
			const target = player.getEnemies().randomGet();
			const num = player.getRoundHistory('useCard', evt => {
				return get.is.virtualCard(evt.card);
			}).length;
			await target.damage(num);
			game.log(player, '触发了【单打独斗】');
			player.buffUpdate(event.name);
		},
	};
	//火灼苦躯
	lib.skill._buff_txhj_huozhuokuqu = {
		trigger: {
			source: "damageBegin1",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_huozhuokuqu') || player != game.me) return false;
			return event.player.isIn() && event.player.isLinked() && event.nature == 'fire';
		},
		content: async function (event, trigger, player) {
			await trigger.player.loseHp();
			await player.loseHp();
			game.log(player, '触发了【火灼苦躯】');
			player.buffUpdate(event.name);
		},
	};
	//八门集智
	lib.skill._buff_txhj_bamenjizhi = {
		trigger: {
			player: "phaseUseEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_bamenjizhi') || player != game.me) return false;
			return player.countCards("h") > 0;
		},
		content: async function (event, trigger, player) {
			const maxNumber = Math.max(...player.getCards('h').map(c => get.number(c)));
			const card = player.getCards('h').filter(c => get.number(c) == maxNumber).randomGet();
			const num = get.cardNameLength(card);
			await player.addTempSkill("buff_txhj_bamenjizhi");
			player.storage.buff_txhj_bamenjizhi = num;
			await player.draw(num);
			game.log(player, '触发了【八门集智】');
			player.buffUpdate(event.name);
		},
	};
	//八门集智
	lib.skill.buff_txhj_bamenjizhi = {
		init: function (player) {
			player.storage.buff_txhj_bamenjizhi = 0;
		},
		onremove: true,
		mod: {
			maxHandcard(player, num) {
				if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_bamenjizhi') || player != game.me) return;
				const num2 = player.storage.buff_txhj_bamenjizhi || 0;
				return num + num2;
			},
		},
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
	};
	//望梅止渴
	lib.skill._buff_txhj_wangmeizhike = {
		trigger: {
			player: "useCard1",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_wangmeizhike') || player != game.me) return false;
			const bool = true;
			if (!(event.card && (get.name(event.card) == "sha" || get.name(event.card) == "tao") && event.cards && get.is.convertedCard(event.card))) return false;
			for (let card of event.cards) {
				const suit = get.suit(card);
				if (suit !== "heart") {
					return false;
				}
			}
			return bool;
		},
		content: async function (event, trigger, player) {
			trigger.baseDamage++;
			game.log(player, '触发了【望梅止渴】');
			player.buffUpdate(event.name);
		},
	};
	//翩若惊鸿
	lib.skill._buff_txhj_pianruojinghong = {
		trigger: {
			player: "useCard1",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_pianruojinghong') || player != game.me) return false;
			return get.is.convertedCard(event.card);
		},
		content: async function (event, trigger, player) {
			let card = get.cardPile2(function (card) {
				return get.color(card) == get.color(trigger.card);
			});
			await player.gain(card, "gain2");
			game.log(player, '触发了【翩若惊鸿】');
			player.buffUpdate(event.name);
		},
	};
	//登锋履刃
	lib.skill._buff_txhj_dengfenglvren = {
		trigger: {
			player: "useCard1",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_dengfenglvren') || player != game.me) return false;
			return get.is.virtualCard(event.card);
		},
		content: async function (event, trigger, player) {
			trigger.baseDamage++;
			game.log(player, '触发了【登锋履刃】');
			player.buffUpdate(event.name);
		},
	};
	//十胜十败
	lib.skill._buff_txhj_shishengshibai = {
		trigger: {
			player: "changeHpBegin",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_shishengshibai') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			if (!player.hasSkill("buff_txhj_shishengshibai")) await player.addSkill("buff_txhj_shishengshibai");
			player.addMark("buff_txhj_shishengshibai", false);
			if (player.countMark("buff_txhj_shishengshibai") >= 10) {
				let targer = player.getEnemies().randomGet();
				player.removeMark("buff_txhj_shishengshibai", 10, false);
				if (targer) await targer.damage(player.getDamagedHp(true));
			}
			game.log(player, '触发了【十胜十败】');
			player.buffUpdate(event.name);
		},
	};
	lib.skill.buff_txhj_shishengshibai = {
		init: function (player, skill) {
			player.markSkill('buff_txhj_shishengshibai');
		},
		onremove: true,
		marktext: "胜",
		intro: {
			name: "十胜十败",
			markcount: function (num) {
				return (num || 0).toString();
			},
			content: function (num) {
				return `十胜十败进度：${(num || 0)}/10`;
			}
		},
	};
	//横槊赋诗
	lib.skill._buff_txhj_hengshuofushi = {
		trigger: {
			player: "useCard",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_hengshuofushi') || player != game.me) return false;
			return event.card && get.name(event.card) == "jiu";
		},
		content: async function (event, trigger, player) {
			await player.gain(get.cardPile2("sha"), "gain2");
			game.log(player, '触发了【横槊赋诗】');
			player.buffUpdate(event.name);
		},
	};
	//孟德新书
	lib.skill._buff_txhj_mengdexinshu = {
		trigger: {
			player: "loseAfter",
			global: "loseAsyncAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_mengdexinshu') || player != game.me) return false;
			if (event.type != "discard" || _status.currentPhase != player) {
				return false;
			}
			return player.getHistory("lose", evt => {
				return evt.type == "discard" && evt?.getl(player)?.cards2?.length > 1;
			}).indexOf(event) == 0;
		},
		content: async function (event, trigger, player) {
			const num = trigger?.getl(player)?.cards2?.length || 0;
			await player.draw(Math.min(num, player.maxHp));
			game.log(player, '触发了【孟德新书】');
			player.buffUpdate(event.name);
		},
	};
	//移天易日
	lib.skill._buff_txhj_yitianyiri = {
		trigger: {
			player: "gainAfter",
			global: "loseAsyncAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_yitianyiri') || player != game.me) return false;
			const cards = event.getg?.(player) || [];
			if (cards.length != 2 || cards.some(i => get.type(i) !== "basic")) {
				return false;
			}
			return true;
		},
		content: async function (event, trigger, player) {
			const cards = trigger.getg?.(player) || [];
			await player.discard(cards);
			let gains = [];
			while (gains.length < 2) {
				const card = get.cardPile(i => get.type(i) == "trick" && !gains.includes(i), false, "random");
				if (card) {
					gains.push(card);
				} else {
					break;
				}
			}
			if (gains.length) await player.gain(gains, "gain2");
			game.log(player, '触发了【移天易日】');
			player.buffUpdate(event.name);
		},
	};
	//老骥伏枥
	lib.skill._buff_txhj_laojifuli = {
		trigger: {
			player: "dyingAfter",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_laojifuli') || player != game.me) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			player
				.when({ player: "useCard1", })
				.filter((evt, player, name) => get.name(evt.card) == "sha")
				.then(() => {
					trigger.baseDamage += game.roundNumber;
					game.log(player, '触发了【老骥伏枥】');
				});
			game.log(player, '触发了【老骥伏枥】');
			player.buffUpdate(event.name);
		},
	};
	//天下归心
	lib.skill._buff_txhj_tianxiaguixin = {
		trigger: {
			player: "phaseUseEnd",
		},
		forced: true,
		charlotte: true,
		ruleSkill: true,
		mode: ["taixuhuanjing"],
		filter: function (event, player) {
			if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_tianxiaguixin') || player != game.me) return false;
			return game.hasPlayer(p => p != player && p.countCards("h") <= player.countCards("h"));
		},
		content: async function (event, trigger, player) {
			const targets = game.filterPlayer(p => p != player && p.countCards("h") <= player.countCards("h"));
			for (const target of targets) {
				player.line(target, "green");
				await target.loseHp();
			}
			game.log(player, '触发了【天下归心】');
			player.buffUpdate(event.name);
		},
	};
	/*	
		//模板
		lib.skill._buff_txhj_xxxxxx = {
			trigger: {
				player: "xxxx",
			},
			forced: true,
			charlotte: true,
			ruleSkill: true,
			mode: ["taixuhuanjing"],
			filter: function (event, player) {
				if (!lib.config.taixuhuanjing.buff.includes('buff_txhj_xxxxxx') || player != game.me) return false;
				return true;
			},
			content: async function (event, trigger, player) {
				game.log(player, '触发了【模板】');
				player.buffUpdate(event.name);
			},
		};
		*/

};

export default txhjModeImport;
