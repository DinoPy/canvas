import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { parseMap } from "./utility.js";

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
const TICK_RATE = 30;
const PLAYER_SPEED = 15;
const BULLET_SPEED = 25;
const TILE_SIZE = 32;
const HIT_POINTS = 20;

class Player {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.keyControls = {
            up: false,
            down: false,
            left: false,
            right: false
        }
        this.life = 100;
        this.score = 0;
    }

    move() {
        if (this.keyControls.up && this.y > 0)
            this.y = Math.max(this.y - PLAYER_SPEED, 0);
        else if (this.keyControls.down && this.y < MAP.length * TILE_SIZE)
            this.y = Math.min(this.y + PLAYER_SPEED, MAP.length * TILE_SIZE - 96);

        if (this.keyControls.left && this.x > 0)
            this.x = Math.max(this.x - PLAYER_SPEED, 0);
        else if (this.keyControls.right && this.x < MAP.length * TILE_SIZE)
            this.x = Math.min(this.x + PLAYER_SPEED, MAP.length * TILE_SIZE - 96);
    }

}

class Bullet {
    constructor(x, y, angle, ownerId) {
        this.x = x;
        this.y = y;
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
                const dist = getDistance(this.x, this.y, players[p].x, players[p].y);
                if (dist < TILE_SIZE / 0.8) {
                    players[p].life -= parseInt(Math.random() * HIT_POINTS);
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
        players[socket.id] = new Player(
            socket.id,
            parseInt(Math.random() * (MAP.length * TILE_SIZE)),
            parseInt(Math.random() * (MAP.length * TILE_SIZE)),
        );

        socket.emit("map", MAP);

        socket.on("player-movement", (controls) => {
            players[socket.id].keyControls = controls;
        });

        socket.on("shoot", (bullet) => {
            bullets.push(
                new Bullet(
                    players[socket.id].x + 96/2,
                    players[socket.id].y + 96/2,
                    bullet.angle,
                    socket.id
                ));
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
            players[pl].move();
        }

        for (let i in bullets) {
            bullets[i].move(delta);
            bullets[i].checkHit();
        }
        bullets = bullets.filter(b => b.life > 0);

        io.emit("players-data", { pl: players, bl: bullets });
    };

    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
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


