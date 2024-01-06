const abilitiesEl = document.querySelector("#abilitiesEl");
const playersEl = document.querySelector(".players-overlay");
export const keyboardMaps = {
    "qwerty": { up: "w", down: "s", left: "a", right: "d", dash: "Shift", melee: "Space", range: "Lb" },
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

    returnSelf() { return this.el; }

    updateTextContents(content) { this.el.textContent = content; }

    addClass(cls) { this.el.classList.add(cls); }
    removeClass(cls) { this.el.classList.remove(cls); }
    toggleClass(cls) { this.el.classList.toggle(cls); }

}


export class GameUiHandler {
    constructor() {
        this.skillSlotsEls = {};
        this.playerEls = {};
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

    setUpPlayerEl(name) {
        const plEl = new ElHandler("span", "player-slot", name);
        plEl.appendSelf(playersEl);

        this.appendPlayerEls(name, plEl);
    }

    removePlayerEl(name) {
        this.playerEls[name].removeElement(playersEl);
        delete this.playerEls[name];
    }

    updatePlayers(players) {
        const playerNames = Object.keys(this.playerEls);
        for (let p of playerNames) {
            if (!players.includes(p)) {
                this.removePlayerEl(p)
                continue;
            }
        }

        for (let p of players)
            if (!this.playerEls.hasOwnProperty(p))
                this.setUpPlayerEl(p);
    }

    returnPlayerEls() {
        return this.playerEls;
    }

}

