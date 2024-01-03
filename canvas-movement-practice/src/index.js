import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { isAttackColiding, isSquareColiding, parseMap } from "./utility.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    serveClient: true,
});
app.use(express.static("public"));
app.use(cors());

let players = {};
let bullets = [];
const MAP = await parseMap();
const TICK_RATE = 60;
const PLAYER_HB_HEIGHT = 65;
const PLAYER_HB_WIDTH = 45;
const PLAYER_SPEED = 10;
const BULLET_SPEED = 25;
const TILE_SIZE = 32;
const RANGE1DAMAGE = 15;
const MELEE_ATTACK_1_TICK_DMG = 2;
const BASE_CRIT_MULTIPIER = 1;

class Player {
    constructor(id, x, y, name) {
        this.id = id;
        this.name = name;
        this.x = x; this.hbPaddingX = 25;
        this.y = y; this.hbPaddingY = 10;
        this.width = 96; this.hbWidth = 45;
        this.height = 96; this.hbHeight = 65;
        this.keyControls = {
            up: false,
            down: false,
            left: false,
            right: false
        }
        this.life = 100;
        this.score = 0;
        this.isAttacking = false;
        this.state = "idle";
        this.direction = "down";
        this.bulletCount = 0;
        this.critRate = 0.15;
        this.critDamage = 0.5;
        this.dash = {
            isDashing: false,
            dashStart: null,
            cooldown: 3000,
            dashDuration: 250,
        };
    }

    checkState() {
        if (!this.keyControls.up && !this.keyControls.down && !this.keyControls.left && !this.keyControls.right && !this.isAttacking) this.state = "idle";
    }

    move() {
        const playerSpeed = this.dash.isDashing ? PLAYER_SPEED * 3 : PLAYER_SPEED;
        if (this.keyControls.up && this.y > 0) {
            this.y = Math.max(this.y - playerSpeed, 0);
            if (!this.isAttacking) this.state = "run";
            this.direction = "up";
        }
        else if (this.keyControls.down && this.y < MAP.length * TILE_SIZE) {
            this.y = Math.min(this.y + playerSpeed, MAP.length * TILE_SIZE - PLAYER_HB_WIDTH);
            if (!this.isAttacking) this.state = "run";
            this.direction = "down";
        }

        if (this.keyControls.left && this.x > 0) {
            this.x = Math.max(this.x - playerSpeed, 0);
            if (!this.isAttacking) this.state = "run";
            this.direction = "left";
        }
        else if (this.keyControls.right && this.x < MAP.length * TILE_SIZE) {
            this.x = Math.min(this.x + playerSpeed, MAP.length * TILE_SIZE - PLAYER_HB_WIDTH);
            if (!this.isAttacking) this.state = "run";
            this.direction = "right";
        }

    }

    attackCheckHit() {
        for (let p in players)
            if (p !== this.id) {
                if (this.isAttacking) {
                    if (isAttackColiding(this, players[p])) {
                        const isCrit = Math.random() < players[this.id].critRate;
                        const damage = isCrit ? MELEE_ATTACK_1_TICK_DMG * (BASE_CRIT_MULTIPIER + this.critDamage) : MELEE_ATTACK_1_TICK_DMG;
                        players[p].life -= damage;
                        io.to(p).emit("damage-taken", { isCrit, damage });
                        io.to(this.id).emit("damage-dealt", { to: p, isCrit, damage, });
                    }

                    if (players[p].life <= 0) {
                        players[p].x = parseInt(Math.random() * (MAP.length * TILE_SIZE)),
                            players[p].y = parseInt(Math.random() * (MAP.length * TILE_SIZE)),
                            players[p].life = 100;
                        players[p].score -= 25;
                        players[this.id].score += 25;
                    }
                }
            }

    }

    updateDashStatus() {
        if (this.dash.isDashing) {
            if (+new Date - this.dash.dashStart > this.dash.dashDuration) {
                this.dash.isDashing = false;
            }
        }
    }

}

class Bullet {
    constructor(x, y, angle, ownerId) {
        this.x = x; this.width = 16;
        this.y = y; this.height = 11;
        this.angle = angle;
        this.ownerId = ownerId;
        this.life = 1000;
        this.score = 0;
    }

    move(delta) {
        this.x += Math.cos(this.angle) * BULLET_SPEED;
        this.y += Math.sin(this.angle) * BULLET_SPEED;
        this.life -= delta;
    }

    checkHit() {
        for (let p in players)
            if (p !== this.ownerId) {
                if (isSquareColiding(
                    {
                        x: players[p].x + players[p].hbPaddingX,
                        y: players[p].y + players[p].hbPaddingY,
                        width: players[p].hbWidth,
                        height: players[p].hbHeight
                    },
                    { x: this.x, y: this.y, width: this.width, height: this.height },
                )) {
                    const isCrit = Math.random() < players[this.ownerId].critRate;
                    const damage = isCrit ? RANGE1DAMAGE * (BASE_CRIT_MULTIPIER + players[this.ownerId].critDamage) : RANGE1DAMAGE;
                    players[p].life -= damage;
                    io.to(p).emit("damage-taken", {damage, isCrit});
                    io.to(this.ownerId).emit("damage-dealt", { to: p, isCrit, damage });
                    this.life = 0;
                }

                if (players[p].life <= 0) {
                    players[p].x = parseInt(Math.random() * (MAP.length * TILE_SIZE)),
                        players[p].y = parseInt(Math.random() * (MAP.length * TILE_SIZE)),
                        players[p].life = 100;
                    players[p].score -= 25;
                    players[this.ownerId].score += 25;
                }
            }
    }
}

async function main() {
    io.on("connection", (socket) => {

        socket.on("user-ready", (name) => {
            players[socket.id] = new Player(
                socket.id,
                parseInt(Math.random() * (MAP.length * TILE_SIZE)),
                parseInt(Math.random() * (MAP.length * TILE_SIZE)),
                name,
            );
            //players[socket.id].isReady = true;
            //players[socket.id].name = name;
        });

        socket.emit("map", MAP);

        socket.on("player-movement", (controls) => {
            players[socket.id].keyControls = controls;
        });

        socket.on("shoot", (bullet) => {
            if (players[socket.id]?.bulletCount < 1) {
                players[socket.id].bulletCount++;
                bullets.push(
                    new Bullet(
                        bullet.x,
                        bullet.y,
                        bullet.angle,
                        socket.id
                    ));
            }
        });

        socket.on("dash", () => {
            players[socket.id].dash.isDashing = true;
            players[socket.id].dash.dashStart = +new Date;
            console.log("triggerDash");
        });

        socket.on("attack-melee-1", () => {
            players[socket.id].isAttacking = true;
            players[socket.id].state = "attack";
        });

        socket.on("stop-attacking", (state) => {
            players[socket.id].isAttacking = false;
            players[socket.id].state = state;
        });

        socket.on("disconnect", () => {
            console.log("disconnected: ", socket.id);
            delete players[socket.id];
        });
        console.log(socket.id, " connected");
    });

    httpServer.listen(5000, () => {
        console.log("connect on port 5000");
    });


    async function tick(delta, players) {
        for (let pl in players) {
            players[pl].checkState();
            players[pl].move();
            players[pl].attackCheckHit();
            players[pl].updateDashStatus();
        }

        for (let i in bullets) {
            bullets[i].move(delta);
            bullets[i].checkHit();
        }
        bullets = bullets.filter(b => {
            let isAlive = b.life > 0;
            if (!isAlive && players[b.ownerId]?.bulletCount)
                players[b.ownerId].bulletCount--;
            return isAlive;
        });

        io.emit("players-data", { pl: players, bl: bullets });
    };

    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        if (Object.keys(players).length > 0)
            tick(delta, players)
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}


const getDistance = (x1, y1, x2, y2) => {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;

    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

main();


