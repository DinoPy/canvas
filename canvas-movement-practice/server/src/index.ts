import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, PlayerStats, BuffType, BuffKey, MapType, keyControlsType, BuffList, InnerBuffProps, PlayerType, innerPropTypes, BuffProps } from "./types.ts";
import path from "path";
import { createServer } from "http";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Server } from "socket.io";

import { isAttackColiding, isSquareColiding, parseCsvMap, isColidingWithEnvironment, generateRespawnCoords, merge } from "./utility.ts";

const app: Express = express();
const httpServer = createServer(app);
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(httpServer, {
    serveClient: true,
});

app.use(cors());
app.use(express.json());

app.use("/game", express.static(path.join(__dirname, "../canvas_game/"), { index: "index.html" }));

app.get("/", (req: Request, res: Response) => {
    res.send("Home to TS converted server");
});

const MAP: MapType = parseCsvMap("mapDesert_Ground");
const OBSTACLES: MapType = parseCsvMap("mapDesert_Objects");
const TICK_RATE: number = 60;
const BULLET_SPEED: number = 25;
const TILE_SIZE: number = 32;

const BUFFS: BuffType<BuffKey> = {
    minorSwiftness: { movement: { speed: 0, multiplier: 0.2 }, duration: 30, name: "Minor Swiftness", tier: 1 },
    mediumSwiftness: { movement: { speed: 0, multiplier: 0.4 }, duration: 22, name: "Medium Swiftness", tier: 2 },
    majorSwiftness: { movement: { speed: 0, multiplier: 0.6 }, duration: 15, name: "Major Swiftness", tier: 3 },
    rejuvenationMinor: { regen: { amount: 0, multiplier: 0.25 }, duration: 30, name: "Minor Rejuvenation", tier: 1 },
    rejuvenationMedium: { regen: { amount: 0, multiplier: 0.50 }, duration: 22, name: "Medium Rejuvenation", tier: 2 },
    rejuvenationMajor: { regen: { amount: 0, multiplier: 1 }, duration: 15, name: "Major Rejuvenation", tier: 3 },
    minorFortification: { armor: { physical: 0, physicalMultiplier: 0.25 }, duration: 30, name: "Minor Fortification", tier: 1 },
    mediumFortification: { armor: { physical: 0, physicalMultiplier: 0.50 }, duration: 22, name: "Medium Fortification", tier: 2 },
    majorFortification: { armor: { physical: 0, physicalMultiplier: 1 }, duration: 15, name: "Major Fortification", tier: 3 },
    minorWarding: { armor: { magic: 0, magicMultiplier: 0.25 }, duration: 30, name: "Minor Warding", tier: 1 },
    mediumWarding: { armor: { magic: 0, magicMultiplier: 0.50 }, duration: 22, name: "Medium Warding", tier: 2 },
    majorWarding: { armor: { magic: 0, magicMultiplier: 1 }, duration: 15, name: "Major Warding", tier: 3 },
    minorStrengthening: { attack: { physical: 0, physicalMultiplier: 0.2 }, duration: 30, name: "Minor Strengthening", tier: 1 },
    mediumStrengthening: { attack: { physical: 0, physicalMultiplier: 0.4 }, duration: 22, name: "Medium Strengthening", tier: 2 },
    majorStrengthening: { attack: { physical: 0, physicalMultiplier: 0.6 }, duration: 15, name: "Major Strengthening", tier: 3 },
    minorEnchantment: { attack: { magic: 0, magicMultiplier: 0.2 }, duration: 30, name: "Minor Enchantment", tier: 1 },
    mediumEnchantment: { attack: { magic: 0, magicMultiplier: 0.4 }, duration: 22, name: "Medium Enchantment", tier: 2 },
    majorEnchantment: { attack: { magic: 0, magicMultiplier: 0.6 }, duration: 15, name: "Major Enchantment", tier: 3 },
    minorPrecision: { crit: { physicalRate: 0.05, magicRate: 0.05 }, duration: 30, name: "Minor Precision", tier: 1 },
    mediumPrecision: { crit: { physicalRate: 0.1, magicRate: 0.1 }, duration: 22, name: "Medium Precision", tier: 2 },
    majorPrecision: { crit: { physicalRate: 0.15, magicRate: 0.15 }, duration: 15, name: "Major Precision", tier: 3 },
    minorDevastation: { crit: { physicalDamage: 0.1, magicDamage: 0.1 }, duration: 30, name: "Minor Devastation", tier: 1 },
    mediumDevastation: { crit: { physicalDamage: 0.2, magicDamage: 0.2 }, duration: 22, name: "Medium Devastation", tier: 2 },
    majorDevastation: { crit: { physicalDamage: 0.3, magicDamage: 0.3 }, duration: 15, name: "Major Devastation", tier: 3 },
}

const spawnRandomBuff: () => { x: number, y: number, buff: BuffKey } = () => {
    const buffsList: BuffKey[] = Object.keys(BUFFS) as BuffKey[];
    const randomBuff = buffsList[Math.floor(Math.random() * buffsList.length)];
    const coords = generateRespawnCoords(OBSTACLES);

    return {
        x: coords.x,
        y: coords.y,
        buff: randomBuff,
    };
};

class Player {
    id: string;
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
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } | {};

    constructor(id: string, x: number, y: number, name: string, avatarIndex: number) {
        this.id = id;
        this.name = name;
        this.avatarIndex = avatarIndex;
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
        this.score = 0;
        this.isAttacking = false;
        this.state = "idle";
        this.direction = "down";
        this.bulletCount = 0;
        this.dash = {
            isDashing: false,
            dashStart: null,
            cooldown: 2500,
            dashDuration: 250,
        };
        this.attack1_alreadyHit = [];
        this.playerStats = {
            regen: {
                lastRegen: +new Date,
                amount: 1,
                multiplier: 1,
                interval: 1000,
            },
            life: {
                max: 100,
                multiplier: 1.5,
                current: 100,
            },
            crit: {
                physicalRate: 0.15,
                physicalDamage: 0.5,
                magicRate: 0.15,
                magicDamage: 0.5,
            },
            attack: {
                physical: 35,
                physicalMultiplier: 1,
                magic: 30,
                magicMultiplier: 1,
            },
            armor: {
                magic: 10,
                magicMultiplier: 1,
                physical: 10,
                physicalMultiplier: 1,
            },
            movement: {
                speed: 8,
                multiplier: 1,
            },
        };
        this.playerBuffStats = {
            regen: {
                lastRegen: 0,
                amount: 0,
                multiplier: 0,
                interval: 0,
            },
            life: {
                current: 0,
                max: 0,
                multiplier: 0,
            },
            crit: {
                physicalRate: 0,
                physicalDamage: 0,
                magicRate: 0,
                magicDamage: 0,
            },
            attack: {
                physical: 0,
                physicalMultiplier: 0,
                magic: 0,
                magicMultiplier: 0,
            },
            armor: {
                magic: 0,
                magicMultiplier: 0,
                physical: 0,
                physicalMultiplier: 0,
            },
            movement: {
                speed: 0,
                multiplier: 0,
            },
        }
        this.buffs = {};
    }

    checkState() {
        if (!this.keyControls.up && !this.keyControls.down && !this.keyControls.left && !this.keyControls.right && !this.isAttacking) this.state = "idle";
    }

    move() {
        const currentSpeed = this.playerStats.movement.speed * (this.playerStats.movement.multiplier + this.playerBuffStats.movement.multiplier) + this.playerBuffStats.movement.speed;
        const playerSpeed = this.dash.isDashing ? currentSpeed * 3 : currentSpeed;
        let playerX = this.x;
        let playerY = this.y;
        if (this.keyControls.up && this.y > 0) {
            this.y = Math.max(this.y - playerSpeed, 0);
            if (!this.isAttacking) this.state = "run";
            this.direction = "up";
        }
        else if (this.keyControls.down && this.y < MAP.length * TILE_SIZE) {
            this.y = Math.min(this.y + playerSpeed, MAP.length * TILE_SIZE - this.height);
            if (!this.isAttacking) this.state = "run";
            this.direction = "down";
        }
        if (isColidingWithEnvironment(OBSTACLES, { x: this.x + 27, y: this.y + 20, width: 41, height: 55 }))
            this.y = playerY;

        if (this.keyControls.left && this.x > 0) {
            this.x = Math.max(this.x - playerSpeed, 0);
            if (!this.isAttacking) this.state = "run";
            this.direction = "left";
        }
        else if (this.keyControls.right && this.x < MAP.length * TILE_SIZE) {
            this.x = Math.min(this.x + playerSpeed, MAP.length * TILE_SIZE - this.width);
            if (!this.isAttacking) this.state = "run";
            this.direction = "right";
        }
        if (isColidingWithEnvironment(OBSTACLES, { x: this.x + 27, y: this.y + 20, width: 41, height: 55 }))
            this.x = playerX;

    }

    attackCheckHit() {
        for (let p in players)
            if (p !== this.id) {
                if (this.isAttacking && !this.attack1_alreadyHit.includes(p)) {
                    if (isAttackColiding(this, players[p]) && !players[p].dash.isDashing) {
                        this.attack1_alreadyHit.push(p);
                        const dmgDetails = Player.calculateDamage(players[this.id], players[p], "physical", 1);
                        players[p].playerStats.life.current -= dmgDetails.damage;
                        io.to(p).emit("damageTaken", dmgDetails);
                        io.to(this.id).emit("damageDealt", { to: p, ...dmgDetails });
                    }

                    if (players[p].playerStats.life.current <= 0) {
                        const coords = generateRespawnCoords(OBSTACLES);
                        players[p].x = coords.x;
                        players[p].y = coords.y;
                        players[p].playerStats.life.current = players[p].playerStats.life.max;
                    }
                }
            }
    }

    updateDashStatus() {
        if (this.dash.isDashing && this.dash.dashStart !== null) {
            if (+new Date - this.dash.dashStart > this.dash.dashDuration) {
                this.dash.isDashing = false;
            }
        }
    }

    triggerRegen() {
        const maxLife = this.playerStats.life.max * (this.playerStats.life.multiplier + this.playerBuffStats.life.multiplier) + this.playerBuffStats.life.max;
        if (+new Date - this.playerStats.regen.lastRegen >
            this.playerStats.regen.interval &&
            this.playerStats.life.current <
            maxLife) {
            this.playerStats.life.current += (this.playerStats.regen.amount * (this.playerStats.regen.multiplier + this.playerBuffStats.regen.multiplier) + this.playerBuffStats.regen.amount);
            this.playerStats.life.current = this.playerStats.life.current > maxLife ? maxLife : this.playerStats.life.current;
            this.playerStats.regen.lastRegen = +new Date;
        }
    }

    updateBuffs() {
        const currentBuffs: BuffKey[] = Object.keys(this.buffs) as BuffKey[];
        if (isNonEmptyBuffs(this.buffs)) {
            for (let key of currentBuffs) {
                if (+new Date - this.buffs[key].since > this.buffs[key].duration * 1000) {
                    io.emit("playerBuffExpire", { name: this.name, buffName: this.buffs[key].name })
                    Buff.remove(this, key);
                }
            }
        }
    }

    checkColisionWithBuff() {
        for (let index in buffs) {
            if (isSquareColiding(
                {
                    x: this.x + this.hbPaddingX,
                    y: this.y + this.hbPaddingY,
                    width: this.hbWidth,
                    height: this.hbHeight
                },
                { x: buffs[index].x, y: buffs[index].y, width: 32, height: 32 },
            )) {
                Buff.applyToPlayer(players[this.id], buffs[index].type);
                buffs.splice(parseInt(index), 1)
            }
        }
    }

    static calculateDamage(dealer: Player, receiver: Player, type: "physical" | "magic", attackMultiplier: number) {
        const offenderCurrentCrit: number = dealer.playerStats.crit.physicalRate + dealer.playerBuffStats.crit.physicalRate;
        const isCrit: boolean = Math.random() < offenderCurrentCrit;
        let damage: number = Math.trunc((dealer.playerStats.attack.physical * (dealer.playerStats.attack.physicalMultiplier + dealer.playerBuffStats.attack.physicalMultiplier) + dealer.playerBuffStats.attack.physical) * attackMultiplier);
        if (isCrit) {
            const offenderCurrentCritDamage = dealer.playerStats.crit.physicalDamage + dealer.playerBuffStats.crit.physicalDamage;
            damage = Math.trunc(damage + (damage * offenderCurrentCritDamage));
        }

        const receiverArmor = receiver.playerStats.armor[type] * (receiver.playerStats.armor[`${type}Multiplier`] +
            receiver.playerBuffStats.armor[`${type}Multiplier`]) + receiver.playerBuffStats.armor[type]
        damage = Math.trunc(damage - receiverArmor);
        return { damage, isCrit };
    }
}

class Bullet {
    x: number; width: number;
    y: number; height: number;
    angle: number;
    ownerId: string;
    life: number;
    score: number;
    constructor(x: number, y: number, angle: number, ownerId: string) {
        this.x = x; this.width = 16;
        this.y = y; this.height = 11;
        this.angle = angle;
        this.ownerId = ownerId;
        this.life = 1000;
        this.score = 0;
    }

    move(delta: number) {
        this.x += Math.cos(this.angle) * BULLET_SPEED;
        this.y += Math.sin(this.angle) * BULLET_SPEED;
        this.life -= delta;

        if (isColidingWithEnvironment(OBSTACLES, { x: this.x, y: this.y, width: 16, height: 11 }))
            this.life = 0;
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
                    if (!players[p].dash.isDashing) {
                        const dmgDetails = Player.calculateDamage(players[this.ownerId], players[p], "physical", 0.6);
                        players[p].playerStats.life.current -= dmgDetails.damage;
                        io.to(p).emit("damageTaken", dmgDetails);
                        io.to(this.ownerId).emit("damageDealt", { to: p, ...dmgDetails });
                    }
                    this.life = 0;
                }

                if (players[p].playerStats.life.current <= 0) {
                    const coords = generateRespawnCoords(OBSTACLES);
                    players[p].x = coords.x;
                    players[p].y = coords.y;
                    players[p].playerStats.life.current = 100;
                }
            }
    }
}

class Buff {
    x: number; y: number;
    type: BuffKey;
    duration: number;
    createdAt: Date;
    name: string;
    tier: number;
    constructor(x: number, y: number, type: BuffKey, duration: number, namee: string, tier: number) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.duration = duration;
        this.createdAt = new Date;
        this.name = namee;
        this.tier = tier;
    }

    static applyProperties(action: "apply" | "remove", p: PlayerType, buff: BuffKey) {
        for (let prop in BUFFS[buff]) {
            if (!p.playerBuffStats.hasOwnProperty(prop)) continue;
            const outerProp: keyof BuffList = prop as keyof BuffList;
            for (let innerProp in BUFFS[buff][outerProp]) {
                if (!p.playerBuffStats[outerProp].hasOwnProperty(innerProp)) continue;
                action === "apply" ?
                //@ts-ignore
                    p.playerBuffStats[outerProp][innerProp] = parseFloat((p.playerBuffStats[outerProp][innerProp] + BUFFS[buff][outerProp][innerProp]).toFixed(2)) :
                //@ts-ignore
                    p.playerBuffStats[outerProp][innerProp] = parseFloat((p.playerBuffStats[outerProp][innerProp] - BUFFS[buff][prop][innerProp]).toFixed(2));
            }
        }

    }


    static applyToPlayer(p: Player, type: BuffKey) {
        if (!p.buffs.hasOwnProperty(type)) {
            this.applyProperties("apply", p, type);
            io.emit("playerBuffCollision", {
                name: p.name,
                buff: { name: BUFFS[type].name, tier: BUFFS[type].tier }
            })
        }
        //@ts-ignore
        p.buffs[type] = { since: +new Date, duration: BUFFS[type].duration, name: BUFFS[type].name, tier: BUFFS[type].tier };
    }

    static remove(p: Player, type: BuffKey) {
        if (isNonEmptyBuffs(p.buffs)) {
            this.applyProperties("remove", p, type);
            delete p.buffs[type];
        }
    };


}

const resolveDupeName: (name: string, index: number) => string = (name, index) => {
    let currName = index === 1 ? name : name + index;
    console.log(currName);
    const sameNameCount = Object.keys(players).filter(id => players[id].name === currName);
    if (sameNameCount.length === 0)
        return currName;
    else {
        index += 1;
        return resolveDupeName(name, index);
    }

}

let players: { [key: string]: Player } = {};
let bullets: Bullet[] = [];
let buffs: Buff[] = [];

async function main() {
    io.on("connection", (socket) => {
        socket.on("userReady", (data) => {
            const coords = generateRespawnCoords(OBSTACLES);
            players[socket.id] = new Player(
                socket.id,
                coords.x,
                coords.y,
                resolveDupeName(data.name, 1),
                data.avatarIndex
            );
        });

        socket.emit("map", { MAP, OBSTACLES });

        socket.on("playerMovement", (controls) => {
            if (players[socket.id])
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
        });

        socket.on("attackMelee1", () => {
            players[socket.id].isAttacking = true;
            players[socket.id].state = "attack";
        });

        socket.on("stopAttacking", (state) => {
            players[socket.id].isAttacking = false;
            players[socket.id].state = state;
            players[socket.id].attack1_alreadyHit = [];
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


    async function tick(delta: number, players: { [key: string]: Player }) {
        for (let pl in players) {
            players[pl].checkState();
            players[pl].move();
            players[pl].attackCheckHit();
            players[pl].updateDashStatus();
            players[pl].triggerRegen();
            players[pl].updateBuffs();
            players[pl].checkColisionWithBuff();
        }

        for (let i in bullets) {
            bullets[i].move(delta);
            bullets[i].checkHit();
        }
        bullets = bullets.filter((b: Bullet) => {
            let isAlive = b.life > 0;
            if (!isAlive && players[b.ownerId]?.bulletCount)
                players[b.ownerId].bulletCount--;
            return isAlive;
        });

        io.emit("playersData", { pl: players, bl: bullets, bffs: buffs });
    };

    setInterval(() => {
        if (buffs.length >= 2) return;
        const newBuff = spawnRandomBuff();
        buffs.push(new Buff(newBuff.x, newBuff.y, newBuff.buff, BUFFS[newBuff.buff].duration, BUFFS[newBuff.buff].name, BUFFS[newBuff.buff].tier));
    }, 2000);

    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        if (Object.keys(players).length > 0)
            tick(delta, players)
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}


const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;

    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function isNonEmptyBuffs(obj: any): obj is { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } {
    return Object.keys(obj).length > 0;
}

main();


