import { BuffKey, BuffType, PlayerType } from ".";
import { isNonEmptyObj } from "./utility.js";

const abilitiesEl = document.getElementById("abilitiesEl") as HTMLDivElement;
const playersEl = document.getElementById("playersOverlay") as HTMLDivElement;
export const keyboardMaps: KeyboardMapsType = {
    "querty": { up: "w", down: "s", left: "a", right: "d", dash: "e", melee: "Space", range: "Lb" },
    "colemak-dh": { up: "w", down: "r", left: "a", right: "s", dash: "t", melee: "Space", range: "Lb" },
}

export class ElHandler<T extends HTMLElement> {
    type: string;
    class: string;
    el: T;
    constructor(type: string, elClass = "", textContent = "", src = "") {
        this.type = type;
        this.class = elClass;
        this.el = document.createElement(type) as T;
        if (elClass.length > 1) this.el.classList.add(this.class);

        this.el.textContent = textContent;
        if (this.type === "img" && this.el instanceof HTMLImageElement)
            this.el.src = src;
    }


    appendSelf<N extends HTMLElement>(el: N) { el.append(this.el); }
    removeElement(el: T) { el.removeChild(this.el); }
    removeSelf() { this.el.remove() };

    returnSelf() { return this.el }

    updateTextContents(content: string | number) { this.el.textContent = String(content); }

    addClass(cls: string) { this.el.classList.add(cls); }
    removeClass(cls: string) { this.el.classList.remove(cls); }
    toggleClass(cls: string) { this.el.classList.toggle(cls); }

}

type skillsTypes = "dash" | "melee" | "range";

export class GameUiHandler {
    cx: CanvasRenderingContext2D;
    skillSlotsEls: skillElementsType | {};
    playerEls: PlayerContainerElsType;
    constructor(cx: CanvasRenderingContext2D) {
        this.skillSlotsEls = {};
        this.playerEls = {};
        this.cx = cx;
    }

    showPlayerUi(layout: keyof KeyboardMapsType) {
        this.setUpSkillSlotKeys(layout);
        abilitiesEl.classList.remove("hidden");
        playersEl.classList.remove("hidden");
    }

    setUpSkillSlotKeys(layout: keyof KeyboardMapsType) {
        if (!isNonEmptyObj<skillElementsType>(this.skillSlotsEls)) return;
        this.skillSlotsEls["dash"]["key"].updateTextContents(keyboardMaps[layout].dash.toUpperCase())
        this.skillSlotsEls["melee"]["key"].updateTextContents(keyboardMaps[layout].melee.toUpperCase())
        this.skillSlotsEls["range"]["key"].updateTextContents(keyboardMaps[layout].range.toUpperCase())
    }

    appendSkillEls(name: string, obj: { slot: ElHandler<HTMLDivElement>, img: ElHandler<HTMLImageElement>, dmg: ElHandler<HTMLSpanElement>, key: ElHandler<HTMLSpanElement> }) {
        this.skillSlotsEls = Object.assign(this.skillSlotsEls, { [name]: obj });
    }

    setUpSkill(index: string, imgPath: string) {
        const slotEl = new ElHandler<HTMLDivElement>("div", "skill-slot");
        slotEl.appendSelf(abilitiesEl);
        const imgEl = new ElHandler<HTMLImageElement>("img", "", "", imgPath);
        imgEl.appendSelf(slotEl.returnSelf());
        const dmgNumEl = new ElHandler<HTMLSpanElement>("span", "cd-num", "0");
        dmgNumEl.addClass("hidden");
        dmgNumEl.appendSelf(slotEl.returnSelf());
        const keyEl = new ElHandler<HTMLSpanElement>("span", "key-text", "w")
        keyEl.appendSelf(slotEl.returnSelf());

        this.appendSkillEls(index, {
            slot: slotEl,
            img: imgEl,
            dmg: dmgNumEl,
            key: keyEl,
        });
    }

    triggerCd(skill: SkillsListType, els: skillElementsType) {
        els[skill]["slot"].addClass("onCd");
        els[skill]["dmg"].removeClass("hidden");
    }

    updateCd(skill: SkillsListType, time: number, els: skillElementsType) {
        els[skill]["dmg"].updateTextContents(time);
    }
    removeCd(skill: SkillsListType, els: skillElementsType) {
        els[skill]["slot"].removeClass("onCd");
        els[skill]["dmg"].addClass("hidden");
    }

    returnSkillSlots() {
        return this.skillSlotsEls;
    }


    ////         PLAYERS UI           ///////
    appendPlayerEls(name: string, obj: PlayerUiElementsType) {
        this.playerEls = Object.assign(this.playerEls, { [name]: obj });
    }

    setUpPlayerEl(name: string, avatarIndex: number) {
        const plEl = new ElHandler<HTMLDivElement>("div", "player-slot", "");
        const avatarEl = new ElHandler<HTMLImageElement>("img", "player-avatar", "", `./assets/avatars/con${avatarIndex}.png`);
        avatarEl.appendSelf(plEl.returnSelf());
        const rightContainerEl = new ElHandler<HTMLDivElement>("div", "plElRightHalf", "");
        const upperQuarterEl = new ElHandler<HTMLDivElement>("div", "plElUpperQuarter", "");
        const buffsEl = new ElHandler<HTMLDivElement>("div", "buffsEl", "");
        const plName = new ElHandler<HTMLSpanElement>("span", "plName", name);
        plName.appendSelf(upperQuarterEl.returnSelf());
        const plStats = new ElHandler<HTMLSpanElement>("span", "plStats", "");
        const plHeartIcon = new ElHandler<HTMLImageElement>("img", "plHeartIcon", "", "./assets/heart.png")
        plHeartIcon.appendSelf(plStats.returnSelf());
        const plLife = new ElHandler<HTMLSpanElement>("span", "plLife", "");
        plLife.appendSelf(plStats.returnSelf());
        plStats.appendSelf(upperQuarterEl.returnSelf());

        upperQuarterEl.appendSelf(rightContainerEl.returnSelf());
        buffsEl.appendSelf(rightContainerEl.returnSelf());
        rightContainerEl.appendSelf(plEl.returnSelf());
        plEl.appendSelf(playersEl);

        this.appendPlayerEls(name, { el: plEl, name: plName, life: plLife, stats: plStats, heartIcon: plHeartIcon, buffs: buffsEl, durationEls: {} });
    }

    removePlayerEl(name: string) {
        this.playerEls[name].el.removeElement(playersEl);
        delete this.playerEls[name];
    }

    updatePlayers(players: { name: string; life: number; avatarIndex: number }[]) {
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

    addBuff(p: string, buff: { name: string; tier: 1 | 2 | 3 }) {
        const frames = { 1: "green.png", 2: "blue.png", 3: "gold.png" };
        const buffContainerEl = new ElHandler<HTMLDivElement>("div", "buffContainer", "");
        const buffFrameEl = new ElHandler<HTMLImageElement>("img", "buffFrame", "", `./assets/frames/${frames[buff.tier]}`);
        const name = buff.name.split(" ")[1].toLowerCase();
        const buffIconEl = new ElHandler<HTMLImageElement>("img", "buffIcon", "", `./assets/icons/${name}.png`);
        const buffDurationEl = new ElHandler<HTMLSpanElement>("span", "buffDuration", "");


        buffFrameEl.appendSelf(buffContainerEl.returnSelf());
        buffIconEl.appendSelf(buffContainerEl.returnSelf());
        buffDurationEl.appendSelf(buffContainerEl.returnSelf());

        buffContainerEl.appendSelf(this.playerEls[p].buffs.returnSelf());
        this.playerEls[p].durationEls[buff.name] = {
            container: buffContainerEl,
            duration: buffDurationEl,
        }
    }

    removeBuff(p: string, buffName: string) {
        this.playerEls[p].durationEls[buffName].container.removeSelf();
        delete this.playerEls[p].durationEls[buffName];
    }

    updateBuffDuration(pName: string, buff: { since: number; duration: number; name: string; tier: number }) {
        if (!this.playerEls[pName].durationEls[buff.name]?.duration) return;
        const timeLeft = buff.duration - Math.trunc((+new Date - buff.since) / 1000);
        this.playerEls[pName].durationEls[buff.name].duration.updateTextContents(timeLeft);
    }
}

type LayoutType = {
    up: string; down: string; left: string; right: string; dash: string; melee: string; range: string;
};

type KeyboardMapsType = {
    "querty": LayoutType;
    "colemak-dh": LayoutType;
}

type SkillsListType = "melee" | "range" | "dash";

export type skillElementsType = {
    [key in skillsTypes]: {
        slot: ElHandler<HTMLDivElement>;
        img: ElHandler<HTMLImageElement>;
        dmg: ElHandler<HTMLSpanElement>;
        key: ElHandler<HTMLSpanElement>
    } }

export type playerIndividualBuffType = { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } };

type PlayerUiElementsType = {
    el: ElHandler<HTMLDivElement>;
    name: ElHandler<HTMLSpanElement>;
    life: ElHandler<HTMLSpanElement>;
    stats: ElHandler<HTMLSpanElement>;
    heartIcon: ElHandler<HTMLImageElement>;
    buffs: ElHandler<HTMLDivElement>;
    durationEls: {
        [key: string]: {
            container: ElHandler<HTMLDivElement>;
            duration: ElHandler<HTMLSpanElement>;
        }
    }
}

type PlayerContainerElsType = {
    [key: string]: PlayerUiElementsType;
}
