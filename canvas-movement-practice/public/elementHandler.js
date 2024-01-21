const abilitiesEl = document.querySelector("#abilitiesEl");
const playersEl = document.querySelector(".players-overlay");
export const keyboardMaps = {
    "qwerty": { up: "w", down: "s", left: "a", right: "d", dash: "e", melee: "Space", range: "Lb" },
    "colemak-dh": { up: "w", down: "r", left: "a", right: "s", dash: "t", melee: "Space", range: "Lb" },
}

export class ElHandler {
    constructor(type, elClass = "", textContent = "", src = "") {
        this.type = type;
        this.class = elClass;
        this.el = document.createElement(type);
        if (elClass.length > 1) this.el.classList.add(this.class);

        this.el.textContent = textContent;
        if (this.type === "img")
            this.el.src = src;
    }


    appendSelf(el) { el.append(this.el); }
    removeElement(el) { el.removeChild(this.el); }
    removeSelf() { this.el.remove() };

    returnSelf() { return this.el; }

    updateTextContents(content) { this.el.textContent = content; }

    addClass(cls) { this.el.classList.add(cls); }
    removeClass(cls) { this.el.classList.remove(cls); }
    toggleClass(cls) { this.el.classList.toggle(cls); }

}


export class GameUiHandler {
    constructor(cx, images) {
        this.skillSlotsEls = {};
        this.playerEls = {};
        this.cx = cx;
        this.images = images;
    }

    showPlayerUi(layout) {
        this.setUpSkillSlotKeys(layout);
        abilitiesEl.classList.remove("hidden");
        playersEl.classList.remove("hidden");
    }

    setUpSkillSlotKeys(layout) {
        this.skillSlotsEls["dash"]["key"].updateTextContents(keyboardMaps[layout].dash.toUpperCase())
        this.skillSlotsEls["melee"]["key"].updateTextContents(keyboardMaps[layout].melee.toUpperCase())
        this.skillSlotsEls["range"]["key"].updateTextContents(keyboardMaps[layout].range.toUpperCase())
    }

    appendSkillEls(name, obj) {
        this.skillSlotsEls = Object.assign(this.skillSlotsEls, { [name]: obj });
    }

    setUpSkill(index, imgPath) {
        const slotEl = new ElHandler("div", "skill-slot");
        slotEl.appendSelf(abilitiesEl);
        const imgEl = new ElHandler("img", "", "", imgPath);
        imgEl.appendSelf(slotEl.returnSelf());
        const dmgNumEl = new ElHandler("span", "cd-num", "0");
        dmgNumEl.addClass("hidden");
        dmgNumEl.appendSelf(slotEl.returnSelf());
        const keyEl = new ElHandler("span", "key-text", "w")
        keyEl.appendSelf(slotEl.returnSelf());

        this.appendSkillEls(index, {
            slot: slotEl,
            img: imgEl,
            dmg: dmgNumEl,
            key: keyEl,
        });
    }

    triggerCd(skill, els) {
        els[skill]["slot"].addClass("onCd");
        els[skill]["dmg"].removeClass("hidden");
    }

    updateCd(skill,time, els) {
        els[skill]["dmg"].updateTextContents(time);
    }
    removeCd(skill, els) {
        els[skill]["slot"].removeClass("onCd");
        els[skill]["dmg"].addClass("hidden");
    }

    returnSkillSlots() {
        return this.skillSlotsEls;
    }


    ////         PLAYERS UI           ///////
    appendPlayerEls(name, obj) {
        this.playerEls = Object.assign(this.playerEls, { [name]: obj });
    }

    setUpPlayerEl(name, avatarIndex) {
        const plEl = new ElHandler("div", "player-slot", "");
        const avatarEl = new ElHandler("img", "player-avatar", "", `./assets/avatars/con${avatarIndex}.png`);
        avatarEl.appendSelf(plEl.returnSelf());
        const rightContainerEl = new ElHandler("div", "plElRightHalf", "");
        const upperQuarterEl = new ElHandler("div", "plElUpperQuarter", "");
        const buffsEl = new ElHandler("div", "buffsEl", "");
        const plName = new ElHandler("span", "plName", name);
        plName.appendSelf(upperQuarterEl.returnSelf());
        const plStats = new ElHandler("span", "plStats", "");
        const plHeartIcon = new ElHandler("img", "plHeartIcon", "", "./assets/heart.png")
        plHeartIcon.appendSelf(plStats.returnSelf());
        const plLife = new ElHandler("span", "plLife", "");
        plLife.appendSelf(plStats.returnSelf());
        plStats.appendSelf(upperQuarterEl.returnSelf());

        upperQuarterEl.appendSelf(rightContainerEl.returnSelf());
        buffsEl.appendSelf(rightContainerEl.returnSelf());
        rightContainerEl.appendSelf(plEl.returnSelf());
        plEl.appendSelf(playersEl);

        this.appendPlayerEls(name, {el: plEl, name: plName, life: plLife, stats: plStats, heartIcon: plHeartIcon, buffs: buffsEl, durationEls: {}});
    }

    removePlayerEl(name) {
        this.playerEls[name].el.removeElement(playersEl);
        delete this.playerEls[name];
    }

    updatePlayers(players) {
        const playerNames = Object.keys(this.playerEls);
        for (let p of playerNames) {
            if (!players.find(i => i.name === p)) {
                this.removePlayerEl(p)
                continue;
            }
        }

        for (let p of players) {
            if (!this.playerEls.hasOwnProperty(p.name))
                this.setUpPlayerEl(p.name, p.avatarIndex);
            this.playerEls[p.name].life.updateTextContents(p.life);
        }

    }

    returnPlayerEls() {
        return this.playerEls;
    }

    addBuff(p, buff) {
        const frames = {1: "green.png", 2: "blue.png", 3: "gold.png"};
        const buffContainerEl = new ElHandler ("div", "buffContainer", "");
        const buffFrameEl = new ElHandler("img", "buffFrame", "",`./assets/frames/${frames[buff.tier]}`);
        const name = buff.name.split(" ")[1].toLowerCase();
        const buffIconEl = new ElHandler("img", "buffIcon","",  `./assets/icons/${name}.png`);
        const buffDurationEl = new ElHandler("span", "buffDuration", "");


        buffFrameEl.appendSelf(buffContainerEl.returnSelf());
        buffIconEl.appendSelf(buffContainerEl.returnSelf());
        buffDurationEl.appendSelf(buffContainerEl.returnSelf());

        buffContainerEl.appendSelf(this.playerEls[p].buffs.returnSelf());
        this.playerEls[p].durationEls[buff.name] = {
            container: buffContainerEl,
            duration: buffDurationEl,
        }
    }

    removeBuff(p, buffName) {
        this.playerEls[p].durationEls[buffName].container.removeSelf();
        delete this.playerEls[p].durationEls[buffName];
    }

    updateBuffDuration(pName, buff) {
        const timeLeft = buff.duration - parseInt((+new Date - buff.since)/1000);
        this.playerEls[pName].durationEls[buff.name].duration.updateTextContents(timeLeft);
    }
}

