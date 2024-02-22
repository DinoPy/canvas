import { isNonEmptyObj, getMapOffset } from "./utility.js";
import { Directions } from "./animationHandler.js";
import { Socket } from "socket.io-client";
declare var io: any;
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:5000");
//***************************************//
//************** SETUP *****************//
//***************************************//
const canvas: HTMLCanvasElement = document.getElementById('canvas_game') as HTMLCanvasElement;
const cx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

import { GameUiHandler, keyboardMaps, skillElementsType } from "./elementHandler.js";
import { Animation } from "./animationHandler.js";

const uiHandler = new GameUiHandler(cx);
uiHandler.setUpSkill("melee1", "./assets/attackIcon.png");
uiHandler.setUpSkill("range1", "./assets/rangeIcon.png");
uiHandler.setUpSkill("movement1", "./assets/dashIcon.png");
uiHandler.setUpSkill("range2", "./assets/rangeIcon.png");
uiHandler.setUpSkill("range3", "./assets/rangeIcon.png");
uiHandler.setUpSkill("melee2", "./assets/attackIcon.png");
const els = uiHandler.returnSkillSlots() as skillElementsType;

const overlayEl: HTMLDivElement = document.getElementById("overlay") as HTMLDivElement;
const playerNameEl: HTMLInputElement = document.getElementById("playerName") as HTMLInputElement;
const keyboardLayerSelectorEl = document.getElementById("keyboardLayersContainer") as HTMLFieldSetElement;
const newRoomToggleEl = document.getElementById("newGameRoom") as HTMLButtonElement;
const gameRoomSelectorEl = document.getElementById("gameRooms") as HTMLDivElement;
const newRoomOverlayEl = document.getElementById("newRoomOverlay") as HTMLFormElement;
const newRoomAddEl = document.getElementById("addNewRoom") as HTMLButtonElement;
const roomPasswordEl = overlayEl.querySelector("#selectedRoomPassword") as HTMLInputElement;

let playerLayout: "colemak-dh" | "qwerty" = "colemak-dh";
let ISREADY: boolean = false;
let primaryPlayerId: string = "";

newRoomToggleEl.addEventListener("click", (e) => {
    e.preventDefault();
    roomPasswordEl.setCustomValidity("");
    roomPasswordEl.reportValidity();
    newRoomOverlayEl.classList.toggle("hidden");
});

newRoomAddEl.addEventListener("click", (e) => {
    const newRoomNameInputEl = document.getElementById("newRoomName") as HTMLInputElement;
    const newRoomPasswordInputEl = document.getElementById("newRoomPassword") as HTMLInputElement;
    const roomMaxPlEl = document.getElementById("newRoomMaxPlayers") as HTMLInputElement;
    socket.emit("createRoom", { name: newRoomNameInputEl.value, password: newRoomPasswordInputEl.value, maxPlayers: parseInt(roomMaxPlEl.value) })
    newRoomOverlayEl.classList.toggle("hidden");
});

overlayEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputEl: HTMLInputElement = keyboardLayerSelectorEl.querySelector(`input[name="keyLayout"]:checked`) as HTMLInputElement;
    if (inputEl && inputEl.value === "qwerty" || inputEl.value === "colemak-dh") {
        playerLayout = inputEl.value;
    }
    const avatarIndex: number = Math.trunc(Math.random() * 42);
    const checkedEl = gameRoomSelectorEl.querySelector(`input[type="radio"]:checked`) as HTMLInputElement;
    const roomId = checkedEl?.value;
    socket.emit("joinRoom", { playerName: playerNameEl.value, avatarIndex, roomId: roomId, password: roomPasswordEl.value });
    console.log(socket.id);
});

//***************************************//
//************** CONTROLS  *****************//
//***************************************//
let keyControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    movement1: false,
}
let mouseControls = {
    down: false,
    x: 0,
    y: 0,
}

let isAbilityPressed = {
    melee1: false,
    range1: false,
    movement1: false,
    range2: false,
    range3: false,
    melee2: false,
}
window.addEventListener('keydown', (e) => {
    if ((e.key === keyboardMaps[playerLayout].up || e.key === "ArrowUp") && !keyControls.up) {
        keyControls.up = true;
        if (ISREADY) socket.emit("playerMovement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].left || e.key === "ArrowLeft") && !keyControls.left) {
        keyControls.left = true;
        if (ISREADY) socket.emit("playerMovement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].down || e.key === "ArrowDown") && !keyControls.down) {
        keyControls.down = true;
        if (ISREADY) socket.emit("playerMovement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].right || e.key === "ArrowRight") && !keyControls.right) {
        keyControls.right = true;
        if (ISREADY) socket.emit("playerMovement", keyControls);
    }
    if (e.key === " " && !keyControls.space) {
        //if (ISREADY) socket.emit("attackMelee1");
        keyControls.space = true;
        isAbilityPressed.melee1 = true;
    }
    if (e.key === keyboardMaps[playerLayout].movement1 && !keyControls.movement1) {
        keyControls.movement1 = true;
    }
    if (e.key === keyboardMaps[playerLayout].range2 && !isAbilityPressed.range2) {
        isAbilityPressed.range2 = true;
    }
    if (e.key === keyboardMaps[playerLayout].range3 && !isAbilityPressed.range3) {
        isAbilityPressed.range3 = true;
    }
    if (e.key === keyboardMaps[playerLayout].melee2 && !isAbilityPressed.melee2) {
        isAbilityPressed.melee2 = true;
    }
})
window.addEventListener('keyup', (e) => {
    if (e.key === keyboardMaps[playerLayout].up || e.key === "ArrowUp") keyControls.up = false;
    if (e.key === keyboardMaps[playerLayout].left || e.key === "ArrowLeft") keyControls.left = false;
    if (e.key === keyboardMaps[playerLayout].down || e.key === "ArrowDown") keyControls.down = false;
    if (e.key === keyboardMaps[playerLayout].right || e.key === "ArrowRight") keyControls.right = false;
    if (e.key === " ") { keyControls.space = false; isAbilityPressed.melee1 };
    if (e.key === keyboardMaps[playerLayout].movement1) keyControls.movement1 = false;
    if (ISREADY) socket.emit("playerMovement", keyControls);

})
window.addEventListener('click', (e) => {
    if (ISREADY) isAbilityPressed.range1 = true;
});

let lastMouseMoveTime = 0;
const delay = 50;
window.addEventListener('mousemove', (e) => {
    const currentTime = +new Date();
    if (currentTime - lastMouseMoveTime > delay) {
        mouseControls.x = e.x;
        mouseControls.y = e.y;
        lastMouseMoveTime = currentTime;
    }
});

document.body.addEventListener("blur", () => {
    Object.keys(keyControls).map(k => {
        type Keys = "up" | "down" | "left" | "right" | "space" | "movement1";
        let key: Keys = k as Keys;
        keyControls[key] = false;
    })
});

//***************************************//
//************** PLAYER *****************//
//***************************************//

/////////// IMAGES //////////////
let images: ImagesObj = {
    dash: new Image(),
    frame3: new Image(),
    frame2: new Image(),
    frame1: new Image(),
    fortification: new Image(),
    enchantment: new Image(),
    devastation: new Image(),
    precision: new Image(),
    rejuvenation: new Image(),
    strengthening: new Image(),
    swiftness: new Image(),
    warding: new Image(),
};
const mapImg = new Image();
const obstaclesImg = new Image();
mapImg.src = "./assets/Desert Tileset1.png";
obstaclesImg.src = "./assets/Desert Tileset.png";
images.dash.src = "./assets/dash2.png";
images.frame3.src = "./assets/frames/gold.png";
images.frame2.src = "./assets/frames/blue.png";
images.frame1.src = "./assets/frames/green.png";
images.fortification.src = "./assets/icons/fortification.png";
images.enchantment.src = "./assets/icons/enchantment.png";
images.devastation.src = "./assets/icons/devastation.png";
images.precision.src = "./assets/icons/precision.png";
images.rejuvenation.src = "./assets/icons/rejuvenation.png";
images.strengthening.src = "./assets/icons/strengthening.png";
images.swiftness.src = "./assets/icons/swiftness.png";
images.warding.src = "./assets/icons/warding.png";

export type AnimOptionsType = "darkPoison" | "range3" | "melee2" | "melee3" | "range2" | "range1";
export type AnimListType = { [key in AnimOptionsType]: Animation }
const animations: AnimListType = {
    darkPoison: new Animation(cx, "./assets/Dark VFX 2.png", 15, 5, 48, 64, 48, 64),
    range1: new Animation(cx, "./assets/arrow.png", 1, 1, 1505, 531, 50, 25),
    range2: new Animation(cx, "./assets/water1.png", 21, 4, 150, 100, 150, 100),
    range3: new Animation(cx, "./assets/iceSpell.png", 10, 3, 48, 32, 48, 32),
    melee3: new Animation(cx, "./assets/flame1.png", 12, 4, 177.83, 100, 1000, 600),
    melee2: new Animation(cx, "./assets/flame2.png", 11, 4, 142.81, 100, 500, 220),
}
class Player implements PlayerType {
    id: string;
    roomId: string;
    cls: "warrior"
    x: number; y: number;
    width: number; height: number;
    life: number;
    direction: "down" | "up" | "left" | "right";
    state: "idle" | "attack" | "run";
    isAttacking: boolean;
    name: string;
    dash: { isDashing: boolean, dashStart: number; cooldown: number; dashDuration: number; };
    avatarIndex: number;
    bulletCount: number;
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } | {};
    animations: { [key: string]: AnimationType };
    abilities: { [key in AbilitiesType]: number }

    constructor(id: string, animations: { [key: string]: AnimationType }, avatarIndex: number, namee: string, roomId: string) {
        this.id = id;
        this.roomId = roomId;
        this.cls = "warrior";
        this.x = 0;
        this.y = 0;
        this.width = 96;
        this.height = 96;
        this.life = 100;
        this.direction = "down";
        this.state = "idle";
        this.isAttacking = false;
        this.name = namee || "Player";
        this.dash = { isDashing: false, dashStart: 0, cooldown: 3000, dashDuration: 300, };
        this.avatarIndex = avatarIndex || 1;
        this.bulletCount = 0;
        this.animations = animations;
        this.buffs = {};
        this.abilities = { "melee1": 0, "movement1": 0, "range1": 0, "range2": 0, "range3": 0, "melee2": 0 };
    }

    draw(camX: number, camY: number, gf: number) {
        if (this.dash.isDashing) {
            cx.globalAlpha = 0.4;
            cx.drawImage(images.dash,
                this.x - (camX || 0) - 15,
                this.y - (camY || 0) + 15,
                60,
                60
            )
            cx.globalAlpha = 1;
        }

        if (this.isAttacking && this.animations[this.cls + this.state].hasFrameEnded()) {
            if (ISREADY) socket.emit("stopAttacking", this.state);
            this.isAttacking = false;
            if (keyControls.up || keyControls.down || keyControls.left || keyControls.right) this.state = "run";
            else this.state = "idle";
        }
        this.animations[this.cls + this.state].drawImage(this.x - (camX || 0), this.y - (camY || 0), gf, this.direction);
        Animation.drawPlayerSize(cx, this.x - (camX || 0), this.y - (camY || 0));
    }

    showStats(id: string, camX: number, camY: number) {
        cx.globalAlpha = 0.6;
        cx.fillStyle = "rgba(0,0,0,0.8)"
        cx.fillRect(this.x - (camX || 0) - 2,
            this.y - (camY || 0) + 3,
            104, 9);
        cx.fillStyle = "red";
        cx.fillRect(this.x - (camX || 0),
            this.y - (camY || 0) + 5,
            (this.life / 150) * 100,
            5);
        cx.globalAlpha = 1;
    }

    showName(camX: number, camY: number) {
        cx.fillStyle = "black";
        cx.font = "300 22px Rubik Doodle Shadow";
        cx.textAlign = "center";
        cx.fillText(
            this.name,
            this.x - (camX || 0) + this.width / 2,
            this.y - (camY || 0),
            this.width
        )
    }

    meleeAttack1(camX: number, camY: number) {
        if (keyControls.space && !this.isAttacking) {
            els["melee1"]["slot"].addClass("onCd");
            const meleeSkillName = "melee1" as AbilitiesType;
            const data = {
                name: meleeSkillName,
                angle: 0,
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
            }
            if (this.id === primaryPlayerId)
                socket.emit("ability", data);
        }

        /*
        cx.fillStyle = "rgba(0,0,0,0.2)";
        cx.fillStyle = "lime";
        cx.fillRect(this.x - (camX || 0) + 0, this.y - (camY || 0) + 10, 35, 70);
        */

    }

    shot(offsets: CoordsOffsetsType, name: AbilitiesType) {
        // any positive alteration of the bullet source needs to be decreased from the mouse coordonates.
        // the reason may be: that the bullet position is only altered visually and so.
        if (this.id !== primaryPlayerId) return;
        const angle = Math.atan2(
            mouseControls.y - offsets.offsetY - this.width / 2,
            mouseControls.x - offsets.offsetX - this.height / 2
        )
        const data = {
            name: name,
            angle: angle,
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
        }

        socket.emit("ability", data);
        isAbilityPressed[name] = false;

    }

    checkDashing() {
        if (this.id === primaryPlayerId && keyControls.movement1 && !this.dash.isDashing && +new Date - this.dash.dashStart > this.dash.cooldown) {
            socket.emit("dash");
            socket.emit("ability", { angle: 0, x: 0, y: 0, name: "movement1" });

            keyControls.movement1 = false;
            this.dash.dashStart = +new Date;
            uiHandler.triggerCd("movement1", els);
        }

    }

    updateCooldowns() {
        const abilityList = Object.keys(this.abilities) as AbilitiesType[];
        for (let abilityName of abilityList) {
            const newValue = (this.abilities[abilityName] / 1000).toFixed(1);
            uiHandler.updateCd(abilityName, parseFloat(newValue), els);
            if (this.abilities[abilityName] > 0) {
                uiHandler.triggerCd(abilityName, els);
            }
            else {
                uiHandler.removeCd(abilityName, els);
            }
        }
    }

    updateUi(gameFrame: number) {
        if (primaryPlayerId === this.id && gameFrame % 6 === 0) {
            this.updateCooldowns();

            /*
            if (!this.dash.isDashing &&
                this.dash.dashStart + this.dash.cooldown < +new Date) {
                uiHandler.removeCd("movement1", els)
            } else {
                uiHandler.triggerCd("movement1", els);
                uiHandler.updateCd("movement1", (this.dash.cooldown / 1000 - Math.floor((+new Date - this.dash.dashStart) / 1000)), els);
            }

            if (!this.isAttacking) els["melee1"]["slot"].removeClass("onCd");
            else els["melee1"]["slot"].addClass("onCd");

            if (this.bulletCount > 0) {
                els["range1"]["slot"].addClass("onCd");
            } else {
                els["range1"]["slot"].removeClass("onCd");
            }
            */

            const pls = Object.keys(players).map(p => ({ name: players[p].name, life: players[p].life, avatarIndex: players[p].avatarIndex }))
            uiHandler.updatePlayers(pls);

            if (isNonEmptyObj<PlayerBuffData>(this.buffs)) {
                for (let buff in this.buffs) {
                    const currentBuff: BuffKey = buff as BuffKey;
                    uiHandler.updateBuffDuration(this.name, this.buffs[currentBuff]);
                }
            }
        }
    }

    update(camX: number, camY: number, offsets: CoordsOffsetsType, id: string, gameFrame: number) {
        if (isAbilityPressed.range1) this.shot(offsets, "range1");
        if (isAbilityPressed.range2) this.shot(offsets, "range2");
        if (isAbilityPressed.range3) this.shot(offsets, "range3");
        if (isAbilityPressed.melee2) this.shot(offsets, "melee2");


        this.draw(camX, camY, gameFrame);
        this.showStats(id, camX, camY);
        this.showName(camX, camY);
        this.meleeAttack1(camX, camY);
        this.checkDashing();
        this.updateUi(gameFrame);
    }
}

let damageNumbers: DamageNumbersType[] = [];
class GameNumbers {
    user: string;
    amount: number;
    isCrit: boolean;
    type: "damage";
    at: number;
    duration: number;
    xOffset: number; yOffset: number;
    bulletCount: number;

    constructor(user: string, amount: number, isCrit: boolean, type: "damage") {
        this.user = user;
        this.amount = amount;
        this.isCrit = isCrit;
        this.type = type;
        this.at = +new Date;
        this.duration = 700;
        this.xOffset = (Math.random() - 0.5) * players[user].width;
        this.yOffset = 0;
        this.bulletCount = 0;
    }

    draw(camX: number, camY: number) {
        if (!players[this.user]) return;
        cx.fillStyle = this.isCrit ? "red" : "white";
        cx.font = `300 ${this.isCrit ? "30" : "20"}px Rubik Doodle Shadow`
        cx.fillText(
            String(this.amount),
            players[this.user].x - (camX || 0) + players[this.user].width / 2 + this.xOffset,
            players[this.user].y - (camY || 0) - 10 - this.yOffset,
        );

        this.yOffset += 2;
    };

    checkDuration() {
        if (+new Date - this.at > this.duration)
            damageNumbers.pop();
    }

    update(camX: number, camY: number) {
        this.checkDuration();
        this.draw(camX, camY);
    };
}

const TILE_SIZE = 32;
type PlayersObject = { [key: string]: PlayerType };
let players: PlayersObject = {};
let bullets: BulletType[] = [];
let buffs: BuffObjectType[] = [];
let map: MapType = [[]];
let obstacles: MapType = [[]];

//*********************************************//
//************** MULTIPLAYER *****************//
//*******************************************//

socket.on("connect", () => {
    primaryPlayerId = socket.id as string;
    ISREADY = false;
    overlayEl.style.display = "flex";
    for (let i of Array.from(gameRoomSelectorEl.children)) {
        i.remove();
    }
})

socket.on("theRoomWasCreated", gameConfig => {
    console.log(gameConfig);
    uiHandler.appendGameRoom(gameConfig.name, gameConfig.id, gameConfig.maxPlayers, gameConfig.onlinePlayers, gameConfig.number)
});

socket.on("playerJoinedRoom", () => {
    overlayEl.style.display = "none";
    uiHandler.showPlayerUi(playerLayout);
    ISREADY = true;
});

socket.on("failedToValidateRoomPw", () => {
    console.log("failedToValidateRoomPw")
    roomPasswordEl.setCustomValidity("Entered password does not match selected room's password");
    roomPasswordEl.reportValidity();
    setTimeout(() => {
        roomPasswordEl.setCustomValidity("");
    }, 1000)
});

socket.on("gameData", (data) => {
    map = data.MAP;
    obstacles = data.OBSTACLES;

    uiHandler.showGameRooms(data.gameRooms);
});

socket.on("playersData", ({ pl, bl, bffs }) => {
    for (let p in pl) {
        if (!players.hasOwnProperty(pl[p].id)) {
            players[pl[p].id] = new Player(pl[p].id, {
                "warriorrun": new Animation(cx, "./assets/warrior_run.png", 15, 2, 100, 100, 96, 96),
                "warrioridle": new Animation(cx, "./assets/warrior_idle.png", 30, 3, 100, 100, 96, 96),
                "warriorattack": new Animation(cx, "./assets/warrior_attack.png", 15, 2, 100, 100, 96, 96),
            }, pl[p].avatarIndex, pl[p].name, pl[p].roomId);
        }
        players[pl[p].id].x = pl[p].x;
        players[pl[p].id].y = pl[p].y;
        players[pl[p].id].life = pl[p].playerStats.life.current;
        players[pl[p].id].isAttacking = pl[p].isAttacking;
        players[pl[p].id].state = pl[p].state;
        players[pl[p].id].direction = pl[p].direction;
        players[pl[p].id].dash = pl[p].dash;
        players[pl[p].id].bulletCount = pl[p].bulletCount;
        players[pl[p].id].buffs = pl[p].buffs;
        players[pl[p].id].abilities = pl[p].abilities;
        //players[pl[p].id].playerBuffStats = pl[p].playerBuffStats;
    }

    for (let p in players) {
        if (!pl.hasOwnProperty(p))
            delete players[p];
    }

    bullets = bl;
    buffs = bffs;

});

socket.on("damageTaken", data => {
    if (socket.id !== undefined)
        damageNumbers.push(new GameNumbers(socket.id, data.damage, data.isCrit, "damage"))
});

socket.on("damageDealt", data => {
    damageNumbers.push(new GameNumbers(data.to, data.damage, data.isCrit, "damage"))
});

socket.on("playerBuffCollision", data => {
    uiHandler.addBuff(data.name, data.buff);
});

socket.on("playerBuffExpire", data => {
    console.log("expired", data);
    uiHandler.removeBuff(data.name, data.buffName);
});

//***************************************//
//************** ANIMATION *****************//
//***************************************//
let angle = 0;

addEventListener("click", (e) => {
    angle = Math.atan2(
        e.y - 400 - 32 / 2,
        e.x - 400 - 48 / 2
    )
    console.log(angle);
})

const TILES_IN_ROW = 35;
let gameFrame = 0;
const animate = () => {
    cx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let cameraX = 0, cameraY = 0, offsets;
    const myPlayer = players[primaryPlayerId];
    if (myPlayer) {
        offsets = getMapOffset(myPlayer, canvas.width, canvas.height, TILE_SIZE, map.length);
        cameraX = Math.trunc(myPlayer.x - offsets.offsetX);
        cameraY = Math.trunc(myPlayer.y - offsets.offsetY);
    }

    for (let row = 0; row < map.length; row++) {
        for (let col = 0, rl = map[0].length; col < rl; col++) {
            const id = map[row][col]?.id;
            if (typeof id !== "number") continue;
            const imgRow = Math.trunc(id / TILES_IN_ROW);
            const imgCol = id % TILES_IN_ROW;

            cx.drawImage(
                mapImg,
                imgCol * TILE_SIZE,
                imgRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }


    for (let row = 0; row < obstacles.length; row++) {
        for (let col = 0, rl = obstacles[0].length; col < rl; col++) {
            const id = obstacles[row][col]?.id;
            if (typeof id !== "number") continue;
            const imgRow = Math.trunc(id / 35);
            const imgCol = id % 35;
            cx.drawImage(
                obstaclesImg,
                imgCol * TILE_SIZE,
                imgRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE
            );

        }
    }
    for (let b of bullets) {
        if (b.name === "range1" || b.name === "range2" || b.name === "range3" || b.name === "melee2")
            animations[b.name].drawRotated(b.x - cameraX, b.y - cameraY, gameFrame, b.angle);

    }

    for (let p in players) {
        let validatedOffset = offsets as { offsetX: number; offsetY: number };
        players[p].update(cameraX, cameraY, validatedOffset, players[p].id, gameFrame);
    }

    for (let buff of buffs) {
        cx.fillStyle = "black";
        cx.font = "300 22px Rubik Doodle Shadow";
        cx.textAlign = "center";
        cx.fillText(buff.name, buff.x - cameraX, buff.y - cameraY);
        const buffFrame = `frame${buff.tier}` as "frame1" | "frame2" | "frame3";
        cx.drawImage(images[buffFrame], buff.x - cameraX, buff.y - cameraY);
        const name = buff.name.split(" ")[1].toLowerCase() as ImportedImagesType;
        cx.drawImage(images[name], buff.x - cameraX, buff.y - cameraY);

    }

    for (let i in damageNumbers) {
        damageNumbers[i].update(cameraX, cameraY);
    }


    animations.melee2.drawImage(500 - cameraX, 300 - cameraY, gameFrame);
    animations.range3.drawRotated(400 - cameraX, 400 - cameraY, gameFrame, angle);
    animations.darkPoison.drawImage(500 - cameraX, 500 - cameraY, gameFrame)
    animations.melee3.drawRotated(400 - cameraX, 300 - cameraY, gameFrame, angle);

    gameFrame++;
    requestAnimationFrame(animate);
}

animate();





























export type GameRoomsType = {
    id: string;
    name: string;
    maxPlayers: number;
    onlinePlayers: number;
}
export interface ServerToClientEvents {
    gameData: (data: { MAP: MapType, OBSTACLES: MapType, gameRooms: GameRoomsType[] }) => void;
    theRoomWasCreated: (gameConfig: { name: string; id: string, number: number, maxPlayers: number, onlinePlayers: number }) => void;
    playersData: (data: { pl: { [key: string]: PlayerTypeServer }, bl: BulletType[], bffs: BuffObjectType[] }) => void;
    damageTaken: (dmgDetails: { damage: number; isCrit: boolean }) => void;
    damageDealt: (dmgDetails: { to: string; damage: number; isCrit: boolean }) => void;
    playerBuffCollision: (data: { name: string; buff: { name: string, tier: 1 | 2 | 3 } }) => void;
    playerBuffExpire: (data: { name: string, buffName: string }) => void;
    failedToValidateRoomPw: () => void;
    playerJoinedRoom: () => void;
}

export interface ClientToServerEvents {
    userReady: (data: { name: string; avatarIndex: number }) => void;
    playerMovement: (controls: keyControlsType) => void;
    shoot: (bullet: emitBulletArgType) => void;
    dash: () => void;
    attackMelee1: () => void;
    stopAttacking: (state: "idle" | "run" | "attack") => void;
    joinRoom: (config: { roomId: string, playerName: string, avatarIndex: number, password: string }) => void;
    createRoom: (data: { name: string, password: string, maxPlayers: number }) => void;
    ability: (data: { name: AbilitiesType; x: number; y: number; angle: number }) => void;
}

export type AbilitiesType = "melee1" | "movement1" | "range1" | "range2" | "range3" | "melee2";

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
}

export interface DamageNumbersType {
    user: string;
    amount: number;
    isCrit: boolean;
    type: "damage";
    at: number;
    duration: number;
    xOffset: number; yOffset: number;
    bulletCount: number;


    draw: (camX: number, camY: number) => void;
    checkDuration: () => void;
    update: (camX: number, camY: number) => void
}

export interface PlayerType {
    id: string;
    roomId: string;
    cls: "warrior"
    x: number; y: number;
    width: number; height: number;
    life: number;
    direction: "down" | "up" | "left" | "right";
    state: "idle" | "attack" | "run";
    isAttacking: boolean;
    name: string;
    dash: { isDashing: boolean, dashStart: number | null; cooldown: number; dashDuration: number; };
    avatarIndex: number;
    bulletCount: number;
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } | {};
    abilities: { [key in AbilitiesType]: number }

    draw: (camX: number, camY: number, gf: number) => void;
    showStats: (id: string, camX: number, camY: number) => void;
    showName: (camX: number, camY: number) => void;
    meleeAttack1: (camX: number, camY: number) => void;
    shot: (offsets: CoordsOffsetsType, name: AbilitiesType) => void;
    checkDashing: () => void;
    updateUi: (gameFrame: number) => void;
    update: (camX: number, camY: number, offsets: CoordsOffsetsType, id: string, gameFrame: number) => void;
}

export interface PlayerTypeServer {
    id: string;
    roomId: string;
    name: string;
    avatarIndex: number;
    x: number; hbPaddingX: number;
    y: number; hbPaddingY: number;
    width: number; hbWidth: number;
    height: number; hbHeight: number;
    keyControls: keyControlsType;
    score: number;
    isAttacking: boolean;
    state: "idle" | "attack" | "run";
    direction: "down" | "up" | "left" | "right";
    bulletCount: number;
    dash: { isDashing: boolean, dashStart: null | number, cooldown: number, dashDuration: number };
    attack1_alreadyHit: string[];
    playerStats: PlayerStats;
    playerBuffStats: PlayerStats;
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: 1 | 2 | 3 } } | {};
    abilities: { [key in AbilitiesType]: number }
}

export interface BulletType {
    name: AbilitiesType;
    x: number; width: number;
    y: number; height: number;
    angle: number;
    ownerId: string;
    life: number;
    score: number;
}

export interface BuffObjectType {
    x: number; y: number;
    type: BuffKey;
    duration: number;
    createdAt: Date;
    name: string;
    tier: 1 | 2 | 3;
}

export interface PlayerStats {
    regen: { lastRegen: number; amount: number; multiplier: number; interval: number };
    life: { max: number; multiplier: number; current: number };
    crit: { physicalRate: number; physicalDamage: number; magicRate: number; magicDamage: number };
    attack: { physical: number; physicalMultiplier: number; magic: number; magicMultiplier: number };
    armor: { magic: number; magicMultiplier: number; physical: number, physicalMultiplier: number; };
    movement: { speed: number; multiplier: number; };
}

export type InnerBuffProps = MovementBuff | RegenBuff | AttackArmorBuff | CritBuff;
export type BuffProps = { [key in innerPropTypes]: number };

export type BuffKey = "minorSwiftness" | "mediumSwiftness" | "majorSwiftness" | "rejuvenationMinor" | "rejuvenationMedium" | "rejuvenationMajor" |
    "minorFortification" | "mediumFortification" | "majorFortification" | "minorWarding" | "mediumWarding" | "majorWarding" |
    "minorStrengthening" | "mediumStrengthening" | "majorStrengthening" | "minorEnchantment" | "mediumEnchantment" | "majorEnchantment" |
    "minorPrecision" | "mediumPrecision" | "majorPrecision" | "minorDevastation" | "mediumDevastation" | "majorDevastation"

export type innerPropTypes = "lastRegen" | "amount" | "multiplier" | "interval" | "max" | "current" | "physicalRate" | "physicalDamage" | "magicRate" | "magicDamage" | "physical" | "physicalMultiplier" | "magic" | "magicMultiplier" | "speed";

export type MovementBuff = { speed: number; multiplier: number };
export type RegenBuff = { amount: number; multiplier: number };
export type AttackArmorBuff = { physical?: number; physicalMultiplier?: number; magic?: number; magicMultiplier?: number };
export type CritBuff = { physicalRate?: number; magicRate?: number; physicalDamage?: number; magicDamage?: number };

export type BuffList = {
    movement?: MovementBuff;
    regen?: RegenBuff;
    armor?: AttackArmorBuff;
    attack?: AttackArmorBuff;
    crit?: CritBuff;
}
export type PlayerBuffData = { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } };
export type BuffType<K extends BuffKey> = {
    [key in K]: { duration: number; name: string; tier: 1 | 2 | 3 } & BuffList;
}

export type MapType = ({ id: number } | undefined)[][];

export type keyControlsType = { up: boolean, down: boolean, left: boolean, right: boolean };

export type emitBulletArgType = { angle: number; x: number; y: number };

export interface SquareColisionParams { x: number; y: number; width: number; height: number }

export type CoordsOffsetsType = { offsetX: number; offsetY: number };
export interface AnimationType {
    cx: CanvasRenderingContext2D;
    sw: number; sh: number; dw: number; dh: number;
    animOffset: number;
    art: HTMLImageElement;
    individualFrame: number;
    frames: number;
    stagger: number;
    isPlaying: boolean;
    directions: { down: number; up: number; left: number; right: number };


    incrementFrame: (gf: number) => void;
    hasFrameEnded: () => boolean;
    drawImage: (dx: number, dy: number, gf: number, dir?: Directions, ox?: number, oy?: number) => void;
    drawRotated: (dx: number, dy: number, gf: number, angle: number, dir?: Directions) => void;
    playOnce: (x: number, y: number, gf: number) => void;
    playRepeatedly: (x: number, y: number, gf: number) => void;
    //drawPlayerSize: (cx: CanvasRenderingContext2D, x: number, y: number) => void;

}

export type ImportedImagesType = "dash" | "frame3" | "frame2" | "frame1" | "fortification" | "enchantment" | "devastation" | "precision" | "rejuvenation" | "strengthening" | "swiftness" | "warding";


export type ImagesObj = {
    [key in ImportedImagesType]: HTMLImageElement;
}
