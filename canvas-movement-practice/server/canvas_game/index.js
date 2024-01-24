const socket = io("https://050e-188-24-175-39.ngrok-free.app");
//***************************************//
//************** SETUP *****************//
//***************************************//
const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
import { GameUiHandler, keyboardMaps } from "./elementHandler.js";
import { Animation } from "./animationHandler.js";
const uiHandler = new GameUiHandler(cx);
uiHandler.setUpSkill("melee", "./assets/attackIcon.png");
uiHandler.setUpSkill("range", "./assets/rangeIcon.png");
uiHandler.setUpSkill("dash", "./assets/dashIcon.png");
const els = uiHandler.returnSkillSlots();
const overlayEl = document.querySelector(".overlay");
const playerNameEl = document.getElementById("playerName");
let playerLayout = "colemak-dh";
let ISREADY = false;
addEventListener("submit", (e) => {
    e.preventDefault();
    playerLayout = document.querySelector(`input[name="keyLayout"]:checked`).value;
    overlayEl.style.display = "none";
    uiHandler.showPlayerUi(playerLayout);
    ISREADY = true;
    const avatarIndex = parseInt(Math.random() * 42);
    socket.emit("user-ready", { name: playerNameEl.value, avatarIndex });
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
    dash: false,
};
let mouseControls = {
    down: false,
    x: undefined,
    y: undefined,
};
window.addEventListener('keydown', (e) => {
    if ((e.key === keyboardMaps[playerLayout].up || e.key === "ArrowUp") && !keyControls.up) {
        keyControls.up = true;
        if (ISREADY)
            socket.emit("player-movement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].left || e.key === "ArrowLeft") && !keyControls.left) {
        keyControls.left = true;
        if (ISREADY)
            socket.emit("player-movement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].down || e.key === "ArrowDown") && !keyControls.down) {
        keyControls.down = true;
        if (ISREADY)
            socket.emit("player-movement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].right || e.key === "ArrowRight") && !keyControls.right) {
        keyControls.right = true;
        if (ISREADY)
            socket.emit("player-movement", keyControls);
    }
    if (e.key === " " && !keyControls.space) {
        if (ISREADY)
            socket.emit("attack-melee-1");
        keyControls.space = true;
    }
    if (e.key === keyboardMaps[playerLayout].dash && !keyControls.dash) {
        keyControls.dash = true;
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === keyboardMaps[playerLayout].up || e.key === "ArrowUp")
        keyControls.up = false;
    if (e.key === keyboardMaps[playerLayout].left || e.key === "ArrowLeft")
        keyControls.left = false;
    if (e.key === keyboardMaps[playerLayout].down || e.key === "ArrowDown")
        keyControls.down = false;
    if (e.key === keyboardMaps[playerLayout].right || e.key === "ArrowRight")
        keyControls.right = false;
    if (e.key === " ")
        keyControls.space = false;
    if (e.key === keyboardMaps[playerLayout].dash)
        keyControls.dash = false;
    if (ISREADY)
        socket.emit("player-movement", keyControls);
});
window.addEventListener('click', (e) => {
    if (ISREADY)
        mouseControls.down = true;
    mouseControls.x = e.x;
    mouseControls.y = e.y;
});
document.body.addEventListener("blur", () => {
    Object.keys(keyControls).map(k => keyControls[k] = false);
});
//***************************************//
//************** PLAYER *****************//
//***************************************//
/////////// IMAGES //////////////
let images = {};
const mapImg = new Image();
mapImg.src = "./assets/Desert Tileset1.png";
const obstaclesImg = new Image();
obstaclesImg.src = "./assets/Desert Tileset.png";
images["dash"] = new Image();
images.dash.src = "./assets/dash2.png";
images["frame3"] = new Image();
images["frame2"] = new Image();
images["frame1"] = new Image();
images.frame3.src = "./assets/frames/gold.png";
images.frame2.src = "./assets/frames/blue.png";
images.frame1.src = "./assets/frames/green.png";
images.fortification = new Image();
images.enchantment = new Image();
images.devastation = new Image();
images.precision = new Image();
images.rejuvenation = new Image();
images.strengthening = new Image();
images.swiftness = new Image();
images.warding = new Image();
images.fortification.src = "./assets/icons/fortification.png";
images.enchantment.src = "./assets/icons/enchantment.png";
images.devastation.src = "./assets/icons/devastation.png";
images.precision.src = "./assets/icons/precision.png";
images.rejuvenation.src = "./assets/icons/rejuvenation.png";
images.strengthening.src = "./assets/icons/strengthening.png", images.swiftness.src = "./assets/icons/swiftness.png";
images.warding.src = "./assets/icons/warding.png";
const darkPoisonAnim = new Animation(cx, "./assets/Dark VFX 2.png", 15, 5, 48, 64, 48, 64);
const iceSpellAnim = new Animation(cx, "./assets/iceSpell.png", 10, 3, 48, 32, 48, 32);
const arrowAnim = new Animation(cx, "./assets/arrow.png", 1, 1, 1505, 531, 50, 25);
const water1Anim = new Animation(cx, "./assets/water1.png", 21, 4, 150, 100, 75, 50);
const flame1Anim = new Animation(cx, "./assets/flame1.png", 12, 4, 177.83, 100, 1000, 600);
const flame2Anim = new Animation(cx, "./assets/flame2.png", 11, 4, 142.81, 100, 500, 220);
class Player {
    animationStates = {
        "run-down": { name: "down", frames: 15, },
        "run-up": { name: "up", frames: 15, },
        "run-left": { name: "left", frames: 15, },
        "run-right": { name: "right", frames: 15, },
        "idle": { name: "idle", frames: 30 },
        "attack-down": { name: "down", frames: 15, },
        "attack-up": { name: "up", frames: 15, },
        "attack-left": { name: "left", frames: 15, },
        "attack-right": { name: "right", frames: 15, },
        "fire-burning": { name: "fire-burning", frame: 53 },
    };
    constructor(id, animations, avatarIndex, namee) {
        this.id = id;
        this.cls = "warrior";
        this.x = 0;
        this.y = 0;
        this.width = 96;
        this.height = 96;
        this.life = 100;
        this.score = 0;
        this.direction = "down";
        this.state = "idle";
        this.isAttacking = false;
        this.individualFrame = 0;
        this.name = namee || "Player";
        this.dash = {
            isDashing: false,
            dashStart: null,
            cooldown: 3000,
            dashDuration: 300,
        };
        this.avatarIndex = avatarIndex || 1;
        this.bulletCount = 0;
        this.animations = animations;
        this.buffs = {};
        this.playerBuffStats = {};
    }
    draw(camX, camY, gf) {
        if (this.dash.isDashing) {
            cx.globalAlpha = 0.4;
            cx.drawImage(images.dash, this.x - (camX || 0) - 15, this.y - (camY || 0) + 15, 60, 60);
            cx.globalAlpha = 1;
        }
        if (this.isAttacking && this.animations[this.cls + this.state].hasFrameEnded()) {
            els["melee"]["slot"].removeClass("onCd");
            if (ISREADY)
                socket.emit("stop-attacking", this.state);
            this.isAttacking = false;
            if (keyControls.up || keyControls.down || keyControls.left || keyControls.right)
                this.state = "run";
            else
                this.state = "idle";
        }
        this.animations[this.cls + this.state].drawImage(this.x - (camX || 0), this.y - (camY || 0), gf, this.direction);
        // Animation.drawPlayerSize(cx, this.x - (camX || 0), this.y - (camY || 0));
    }
    showStats(id, camX, camY) {
        cx.globalAlpha = 0.6;
        cx.fillStyle = "rgba(0,0,0,0.8)";
        cx.fillRect(this.x - (camX || 0) - 2, this.y - (camY || 0) + 3, 104, 9);
        cx.fillStyle = "red";
        cx.fillRect(this.x - (camX || 0), this.y - (camY || 0) + 5, (this.life / 150) * 100, 5);
        cx.globalAlpha = 1;
    }
    showName(camX, camY) {
        cx.fillStyle = "black";
        cx.font = "300 22px Rubik Doodle Shadow";
        cx.textAlign = "center";
        cx.fillText(this.name, this.x - (camX || 0) + this.width / 2, this.y - (camY || 0), this.width);
    }
    meleeAttack1(camX, camY) {
        if (keyControls.space && !this.isAttacking) {
            els["melee"]["slot"].addClass("onCd");
        }
        //cx.fillStyle = "rgba(0,0,0,0.2)";
        //cx.fillRect(this.x - (camX || 0) + 10, this.y - (camY || 0) + 65, 75, 30);
    }
    shot(camX, camY, offsets, id) {
        // any positive alteration of the bullet source needs to be decreased from the mouse coordonates.
        // the reason may be: that the bullet position is only altered visually and so.
        if (this.id === socket.id) {
            const angle = Math.atan2(mouseControls.y - offsets.offsetY - this.width / 2, mouseControls.x - offsets.offsetX - this.height / 2);
            mouseControls.down = false;
            const bullet = {
                angle: angle,
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
            };
            socket.emit("shoot", bullet);
        }
    }
    checkDashing() {
        if (this.id === socket.id && keyControls.dash && !this.dash.isDashing && +new Date - this.dash.dashStart > this.dash.cooldown) {
            socket.emit("dash");
            keyControls.dash = false;
            this.dash.dashStart = +new Date;
            uiHandler.triggerCd("dash", els);
        }
    }
    updateUi(gameFrame) {
        if (socket.id === this.id && gameFrame % 6 === 0) {
            if (!this.dash.isDashing &&
                this.dash.dashStart + this.dash.cooldown < +new Date) {
                uiHandler.removeCd("dash", els);
            }
            else {
                uiHandler.triggerCd("dash", els);
                uiHandler.updateCd("dash", (this.dash.cooldown / 1000 - Math.floor((+new Date - this.dash.dashStart) / 1000)), els);
            }
            if (!this.isAttacking)
                els["melee"]["slot"].removeClass("onCd");
            else
                els["melee"]["slot"].addClass("onCd");
            if (this.bulletCount > 0) {
                els["range"]["slot"].addClass("onCd");
            }
            else {
                els["range"]["slot"].removeClass("onCd");
            }
            const pls = Object.keys(players).map(p => ({ name: players[p].name, life: players[p].life, avatarIndex: players[p].avatarIndex }));
            uiHandler.updatePlayers(pls);
            for (let buff in this.buffs) {
                uiHandler.updateBuffDuration(this.name, this.buffs[buff]);
            }
        }
    }
    update(camX, camY, offsets, id, gameFrame) {
        //************ MOUSE CONTROLS ****************/
        if (mouseControls.down)
            this.shot(camX, camY, offsets);
        this.draw(camX, camY, gameFrame);
        this.showStats(id, camX, camY);
        this.showName(camX, camY);
        this.meleeAttack1(camX, camY);
        this.checkDashing();
        this.updateUi(gameFrame);
        this.individualFrame++;
    }
}
let damageNumbers = [];
class GameNumbers {
    constructor(user, amount, isCrit, type) {
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
    draw(camX, camY) {
        if (!players[this.user])
            return;
        cx.fillStyle = this.isCrit ? "red" : "white";
        cx.font = `300 ${this.isCrit ? "30" : "20"}px Rubik Doodle Shadow`;
        cx.fillText(this.amount, players[this.user].x - (camX || 0) + players[this.user].width / 2 + this.xOffset, players[this.user].y - (camY || 0) - 10 - this.yOffset);
        this.yOffset += 2;
    }
    ;
    checkDuration() {
        if (+new Date - this.at > this.duration)
            damageNumbers.pop();
    }
    update(camX, camY) {
        this.checkDuration();
        this.draw(camX, camY);
    }
    ;
}
const TILE_SIZE = 32;
let players = {};
let bullets = [];
let buffs = [];
let map = [[]];
let obstacles = [[]];
//*********************************************//
//************** MULTIPLAYER *****************//
//*******************************************//
socket.on("connect", () => {
    ISREADY = false;
    overlayEl.style.display = "flex";
});
socket.on("map", (m) => {
    console.log(m);
    map = m.MAP;
    obstacles = m.OBSTACLES;
});
socket.on("players-data", ({ pl, bl, bffs }) => {
    for (let p in pl) {
        if (!players.hasOwnProperty(pl[p].id)) {
            players[pl[p].id] = new Player(pl[p].id, {
                "warriorrun": new Animation(cx, "./assets/warrior_run.png", 15, 2, 100, 100, 96, 96),
                "warrioridle": new Animation(cx, "./assets/warrior_idle.png", 30, 3, 100, 100, 96, 96),
                "warriorattack": new Animation(cx, "./assets/warrior_attack.png", 15, 2, 100, 100, 96, 96),
            }, pl[p].avatarIndex, pl[p].name);
        }
        players[pl[p].id].x = pl[p].x;
        players[pl[p].id].y = pl[p].y;
        players[pl[p].id].life = pl[p].playerStats.life.current;
        players[pl[p].id].score = pl[p].score;
        players[pl[p].id].isAttacking = pl[p].isAttacking;
        players[pl[p].id].state = pl[p].state;
        players[pl[p].id].direction = pl[p].direction;
        players[pl[p].id].dash = pl[p].dash;
        players[pl[p].id].bulletCount = pl[p].bulletCount;
        players[pl[p].id].buffs = pl[p].buffs;
        //players[pl[p].id].playerBuffStats = pl[p].playerBuffStats;
    }
    for (let p in players) {
        if (!pl.hasOwnProperty(p))
            delete players[p];
    }
    bullets = bl;
    buffs = bffs;
});
socket.on("damage-taken", data => {
    damageNumbers.push(new GameNumbers(socket.id, data.damage, data.isCrit, "damage"));
});
socket.on("damage-dealt", data => {
    damageNumbers.push(new GameNumbers(data.to, data.damage, data.isCrit, "damage"));
});
socket.on("player-buff-collision", data => {
    uiHandler.addBuff(data.name, data.buff);
});
socket.on("player-buff-expire", data => {
    console.log("expired", data);
    uiHandler.removeBuff(data.name, data.buffName);
});
//***************************************//
//************** ANIMATION *****************//
//***************************************//
let angle = 0;
addEventListener("click", (e) => {
    angle = Math.atan2(e.y - 400 - 32 / 2, e.x - 400 - 48 / 2);
    console.log(angle);
});
const statsEl = document.querySelector("pre");
const TILES_IN_ROW = 35;
let gameFrame = 0;
const animate = () => {
    cx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let cameraX = 0, cameraY = 0, offsets;
    const myPlayer = players[socket.id];
    if (myPlayer) {
        offsets = getMapOffset(myPlayer, canvas.width, canvas.height, TILE_SIZE, map.length);
        cameraX = parseInt(myPlayer.x - offsets.offsetX);
        cameraY = parseInt(myPlayer.y - offsets.offsetY);
    }
    for (let row = 0; row < map.length; row++) {
        for (let col = 0, rl = map[0].length; col < rl; col++) {
            const { id } = map[row][col];
            const imgRow = parseInt(id / TILES_IN_ROW);
            const imgCol = id % TILES_IN_ROW;
            // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            cx.drawImage(mapImg, imgCol * TILE_SIZE, imgRow * TILE_SIZE, TILE_SIZE, TILE_SIZE, col * TILE_SIZE - cameraX, row * TILE_SIZE - cameraY, TILE_SIZE, TILE_SIZE);
        }
    }
    for (let row = 0; row < obstacles.length; row++) {
        for (let col = 0, rl = obstacles[0].length; col < rl; col++) {
            if (!obstacles[row][col])
                continue;
            const { id } = obstacles[row][col];
            const imgRow = parseInt(id / 35);
            const imgCol = id % 35;
            cx.drawImage(obstaclesImg, imgCol * TILE_SIZE, imgRow * TILE_SIZE, TILE_SIZE, TILE_SIZE, col * TILE_SIZE - cameraX, row * TILE_SIZE - cameraY, TILE_SIZE, TILE_SIZE);
        }
    }
    for (let b of bullets) {
        arrowAnim.drawRotated(b.x - cameraX, b.y - cameraY, gameFrame, b.angle);
    }
    for (let p in players) {
        players[p].update(cameraX, cameraY, offsets, players[p].id, gameFrame);
        /*
        if (p === socket.id) {
            statsEl.innerText = JSON.stringify(players[p].buffs, null, 2);
            statsEl.innerText += JSON.stringify(players[p].playerBuffStats, null, 2);
            statsEl.style = "position: absolute";
        }
        */
    }
    for (let buff of buffs) {
        cx.fillText(buff.name, buff.x - cameraX, buff.y - cameraY);
        cx.drawImage(images[`frame${buff.tier}`], buff.x - cameraX, buff.y - cameraY);
        const name = buff.name.split(" ")[1].toLowerCase();
        cx.drawImage(images[name], buff.x - cameraX, buff.y - cameraY);
    }
    for (let i in damageNumbers) {
        damageNumbers[i].update(cameraX, cameraY);
    }
    gameFrame++;
    darkPoisonAnim.drawImage(500 - cameraX, 500 - cameraY, gameFrame);
    iceSpellAnim.drawRotated(400 - cameraX, 400 - cameraY, gameFrame, angle);
    water1Anim.drawRotated(300 - cameraX, 300 - cameraY, gameFrame, angle);
    flame1Anim.drawRotated(400 - cameraX, 300 - cameraY, gameFrame, angle);
    flame2Anim.drawImage(500 - cameraX, 300 - cameraY, gameFrame, angle);
    requestAnimationFrame(animate);
};
animate();
