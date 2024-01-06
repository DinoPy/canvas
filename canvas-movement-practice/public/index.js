const socket = io("ws://localhost:5000");
//***************************************//
//************** SETUP *****************//
//***************************************//
import { GameUiHandler, keyboardMaps } from "./elementHandler.js";

const uiHandler = new GameUiHandler();
uiHandler.setUpSkill("melee", "./assets/attackIcon.png");
uiHandler.setUpSkill("range", "./assets/rangeIcon.png");
uiHandler.setUpSkill("dash", "./assets/dashIcon.png");
const els = uiHandler.returnSkillSlots();

const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const overlayEl = document.querySelector(".overlay");
const playerNameEl = document.getElementById("playerName");
let playerLayout = "colemak-dh";

let ISREADY = false;

addEventListener("submit", (e) => {
    e.preventDefault();
    playerLayout = document.querySelector(`input[name="keyLayout"]:checked`).value
    overlayEl.style.display = "none";
    uiHandler.showPlayerUi(playerLayout);
    ISREADY = true;
    socket.emit("user-ready", playerNameEl.value);
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
}
let mouseControls = {
    down: false,
    x: undefined,
    y: undefined,
}
window.addEventListener('keydown', (e) => {
    if ((e.key === keyboardMaps[playerLayout].up || e.key === "ArrowUp") && !keyControls.up) {
        keyControls.up = true;
        if (ISREADY) socket.emit("player-movement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].left || e.key === "ArrowLeft") && !keyControls.left) {
        keyControls.left = true;
        if (ISREADY) socket.emit("player-movement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].down || e.key === "ArrowDown") && !keyControls.down) {
        keyControls.down = true;
        if (ISREADY) socket.emit("player-movement", keyControls);
    }
    if ((e.key === keyboardMaps[playerLayout].right || e.key === "ArrowRight") && !keyControls.right) {
        keyControls.right = true;
        if (ISREADY) socket.emit("player-movement", keyControls);
    }
    if (e.key === " " && !keyControls.space) {
        if (ISREADY) socket.emit("attack-melee-1");
        keyControls.space = true;
    }
    if (e.key === keyboardMaps[playerLayout].dash && !keyControls.dash) {
        keyControls.dash = true;
    }
})
window.addEventListener('keyup', (e) => {
    if (e.key === keyboardMaps[playerLayout].up || e.key === "ArrowUp") keyControls.up = false;
    if (e.key === keyboardMaps[playerLayout].left || e.key === "ArrowLeft") keyControls.left = false;
    if (e.key === keyboardMaps[playerLayout].down || e.key === "ArrowDown") keyControls.down = false;
    if (e.key === keyboardMaps[playerLayout].right || e.key === "ArrowRight") keyControls.right = false;
    if (e.key === " ") keyControls.space = false;
    if (e.key === keyboardMaps[playerLayout].dash) keyControls.dash = false;
    if (ISREADY) socket.emit("player-movement", keyControls);

})
window.addEventListener('click', (e) => {
    if (ISREADY) mouseControls.down = true;
    mouseControls.x = e.x;
    mouseControls.y = e.y;
});

//***************************************//
//************** PLAYER *****************//
//***************************************//
const rock = new Image();
rock.src = "./assets/rock.png";
const mapImg = new Image();
mapImg.src = "./assets/FieldsTileset.png";
const heartImg = new Image();
heartImg.src = "./assets/heart.png";
const warriorRun = new Image();
warriorRun.src = "./assets/warrior_run.png";
const warriorIdle = new Image();
warriorIdle.src = "./assets/warrior_idle.png";
const warriorAttack = new Image();
warriorAttack.src = "./assets/warrior_attack.png";
const dash = new Image();
dash.src = "./assets/dash2.png";
const fireBurning = new Image();
fireBurning.src = "./assets/fire-burning.png";

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
    }
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = 96;
        this.height = 96;
        this.life = 100;
        this.score = 0;
        this.direction = "down";
        this.state = "idle";
        this.isAttacking = false;
        this.individualFrame = 0;
        this.name = "Player";
        this.dash = {
            isDashing: false,
            dashStart: null,
            cooldown: 3000,
            dashDuration: 300,
        };
        this.bulletCount = 0;
    }

    draw(camX, camY) {
        if (this.dash.isDashing) {
            cx.globalAlpha = 0.4;
            cx.drawImage(dash,
                this.x - (camX || 0) - 15,
                this.y - (camY || 0) + 15,
                60,
                60
            )
            cx.globalAlpha = 1;
        }

        /*
            * get a switch that will call a functon to run an animation.
            * the switch is based on the state
            * on each switch change we should reset the indidual frame under some condition.
            *
        */

        let currentState = this.state === "idle" ? "idle" : `${this.state}-${this.direction}`
        let ox = this.individualFrame % this.animationStates[currentState].frames;
        let frameX = 100 * ox;
        let frameY = 100 * Object.keys(this.animationStates).indexOf(`run-${this.direction}`);
        if (this.isAttacking && ox === this.animationStates[currentState].frames - 1) {
            els["melee"]["slot"].removeClass("onCd");
            if (ISREADY) socket.emit("stop-attacking", this.state);
        }

        let spriteToUse = this.state === "attack" ? warriorAttack :
            this.state === "run" ? warriorRun : warriorIdle;

        cx.drawImage(
            spriteToUse,
            frameX + 10,
            (this.state === "idle" ? 0 : frameY) + 15,
            80,
            80,
            this.x - (camX || 0),
            this.y - (camY || 0),
            this.width,
            this.height,
        );

        //cx.fillStyle = "rgba(0,0,0,0.2)";
        //cx.fillRect(this.x - (camX || 0) + 25, this.y - (camY || 0) + 10, 45, 65)
        //cx.fillStyle = "rgba(0,0,0,0.2)";
        //cx.fillRect(this.x - (camX || 0), this.y - (camY || 0), this.width, this.height)
    }


    showStats(id, camX, camY) {
        const text = `${this.life}`
        const statsOffset = this.name.length * 3;
        cx.drawImage(
            heartImg,
            this.x - (camX || 0) + this.width / 2 + 4 + statsOffset,
            this.y - (camY || 0) - 25,
            60, 40
        );
        cx.font = "13px Rubik Doodle Shadow";
        cx.fillStyle = "white";
        cx.textAlign = "center";
        cx.textAlign = "start";
        cx.fillText(
            text,
            this.x - (camX || 0) + this.width / 2 + 22 + statsOffset,
            this.y - (camY || 0) - 3,
        );
    }

    showName(camX, camY) {
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

    meleeAttack1(camX, camY) {
        if (keyControls.space) {
            if (this.individualFrame > 14 || (!this.isAttacking && this.individualFrame >= 0)) this.individualFrame = 0;
            this.isAttacking = true;
            els["melee"]["slot"].addClass("onCd");
        }
        //cx.fillStyle = "rgba(0,0,0,0.2)";
        //cx.fillRect(this.x - (camX || 0) + 10, this.y - (camY || 0) + 65, 75, 30);
    }

    shot(camX, camY, offsets, id) {
        // any positive alteration of the bullet source needs to be decreased from the mouse coordonates.
        // the reason may be: that the bullet position is only altered visually and so

        if (this.id === socket.id) {
            const angle = Math.atan2(
                mouseControls.y - offsets.offsetY - this.width / 2,
                mouseControls.x - offsets.offsetX - this.height / 2
            )
            mouseControls.down = false;
            const bullet = {
                angle: angle,
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
            }
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
                uiHandler.removeCd("dash", els)
            } else {
                uiHandler.triggerCd("dash", els);
                uiHandler.updateCd("dash", (this.dash.cooldown / 1000 - Math.floor((+new Date - this.dash.dashStart) / 1000)), els);
            }

            if (!this.isAttacking) els["melee"]["slot"].removeClass("onCd");

            if (this.bulletCount > 0) {
                els["range"]["slot"].addClass("onCd");
            } else {
                els["range"]["slot"].removeClass("onCd");
            }

            const pls = Object.keys(players).map(p => players[p].name)
            uiHandler.updatePlayers(pls);
        }
    }

    update(camX, camY, offsets, id, gameFrame) {
        //************ MOUSE CONTROLS ****************/
        if (mouseControls.down)
            this.shot(camX, camY, offsets);
        this.draw(camX, camY);
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
        cx.fillStyle = this.isCrit ? "red" : "white";
        cx.font = `300 ${this.isCrit ? "30" : "20"}px Rubik Doodle Shadow`
        cx.fillText(
            this.amount,
            players[this.user].x - (camX || 0) + players[this.user].width / 2 + this.xOffset,
            players[this.user].y - (camY || 0) - 10 - this.yOffset,
        );

        this.yOffset += 2;
    };

    checkDuration() {
        if (+new Date - this.at > this.duration)
            damageNumbers.pop();
    }

    update(camX, camY) {
        this.checkDuration();
        this.draw(camX, camY);
    };
}

const TILE_SIZE = 32;
let players = {};
let bullets = [];
let map = [[]];

//*********************************************//
//************** MULTIPLAYER *****************//
//*******************************************//

socket.on("connect", () => {
    ISREADY = false;
    overlayEl.style.display = "flex";
});

socket.on("map", (m) => {
    map = m;
});

socket.on("players-data", ({ pl, bl }) => {
    for (let p in pl) {
        if (!players.hasOwnProperty(pl[p].id)) {
            players[pl[p].id] = new Player(pl[p].id);
        }
        players[pl[p].id].x = pl[p].x;
        players[pl[p].id].y = pl[p].y;
        players[pl[p].id].life = pl[p].life;
        players[pl[p].id].score = pl[p].score;
        players[pl[p].id].isAttacking = pl[p].isAttacking;
        players[pl[p].id].state = pl[p].state;
        players[pl[p].id].direction = pl[p].direction;
        players[pl[p].id].name = pl[p].name;
        players[pl[p].id].dash = pl[p].dash;
        players[pl[p].id].bulletCount = pl[p].bulletCount;

    }

    for (let p in players) {
        if (!pl.hasOwnProperty(p))
            delete players[p];
    }

    bullets = bl;

});

socket.on("damage-taken", data => {
    damageNumbers.push(new GameNumbers(socket.id, data.damage, data.isCrit, "damage"))
});

socket.on("damage-dealt", data => {
    damageNumbers.push(new GameNumbers(data.to, data.damage, data.isCrit, "damage"))
});

//***************************************//
//************** ANIMATION *****************//
//***************************************//
const TILES_IN_ROW = 8;
const STAGGER_FRAME = 2;
let stagger = 0, gameFrame = 0;
const animate = () => {
    if ((stagger % STAGGER_FRAME) === 0) {
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

        for (let b of bullets) {
            cx.drawImage(rock, b.x - cameraX, b.y - cameraY, 16, 11);
            //cx.fillRect(b.x - cameraX, b.y - cameraY, 16, 11);
        }

        for (let p in players) {
            players[p].update(cameraX, cameraY, offsets, players[p].id, gameFrame);
        }

        for (let i in damageNumbers) {
            damageNumbers[i].update(cameraX, cameraY);
        }

        gameFrame++;
    }
    stagger += 1;
    requestAnimationFrame(animate);
}

animate();

