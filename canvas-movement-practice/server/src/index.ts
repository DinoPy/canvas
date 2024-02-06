import path from "path";
import { createServer } from "http";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Server } from "socket.io";

import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, PlayerStats, BuffKey, keyControlsType, BuffList, PlayerType, ProjectileType, BuffObjectType, GameType } from "./types.ts";
import { MAP, OBSTACLES, TICK_RATE, TILE_SIZE, BUFFS } from "./constants.ts";
import { isAttackColiding, isSquareColiding, isColidingWithEnvironment, generateRespawnCoords, spawnRandomBuff, UUIDGeneratorBrowser } from "./utility.ts";

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

//io.path("/game");

class Game implements GameType {
    name: string;
    id: string;
    password: string;
    gameConfig: { maxPlayers: number };
    pickableBuffConfig: { respawnTime: number; maxNumber: number };
    players: PlayerListType;
    projectiles: Projectile[];
    pickableBuffs: Buff[];
    lastPlayed: number;

    constructor(roomObj: { name: string; id: string; password: string, maxPlayers: number }) {
        this.name = roomObj.name;
        this.id = roomObj.id;
        this.password = roomObj.password;
        this.gameConfig = { maxPlayers: roomObj.maxPlayers };
        this.pickableBuffConfig = { respawnTime: 7000, maxNumber: 3 };
        this.players = {};
        this.projectiles = [];
        this.pickableBuffs = [];
        this.lastPlayed = +new Date;


        setInterval(() => {
            if (this.pickableBuffs.length >= this.pickableBuffConfig.maxNumber) return;
            const newPickableBuff = spawnRandomBuff();
            const currentBuff = BUFFS[newPickableBuff.buff];
            this.pickableBuffs.push(new Buff(newPickableBuff.x, newPickableBuff.y, newPickableBuff.buff, currentBuff.duration, currentBuff.name, currentBuff.tier, this.id));
        }, 2000);

        // The game room will erase itself if not played for more than ~10 minutes
        // This interval exists x number of rooms, not good.
        setInterval(() => {
            if (Object.keys(this.players).length > 0) this.lastPlayed = +new Date;
            if (+new Date - this.lastPlayed > 1000 * 60 * 10) delete games[this.id];
        }, 1000 * 60 * 5);
    };

    tick(delta: number) {
        if (Object.keys(this.players).length > 0) {
            for (let pl in this.players) {
                this.players[pl].checkState();
                this.players[pl].move();
                this.players[pl].attackCheckHit();
                this.players[pl].updateDashStatus();
                this.players[pl].triggerRegen();
                this.players[pl].updateBuffs();
                this.players[pl].checkColisionWithBuff();
            }

            for (let i in this.projectiles) {
                this.projectiles[i].move(delta);
                this.projectiles[i].checkHit();
            }
            this.projectiles = this.projectiles.filter((proj: Projectile) => {
                let isAlive = proj.life > 0;
                if (!isAlive && this.players[proj.ownerId]?.projectileCount)
                    this.players[proj.ownerId].projectileCount--;
                return isAlive;
            });

            io.to(this.id).emit("playersData", { pl: this.players, bl: this.projectiles, bffs: this.pickableBuffs });
        }
    }

};

class Player implements PlayerType {
    id: string;
    name: string;
    avatarIndex: number;
    roomId: string;
    x: number; hbPaddingX: number;
    y: number; hbPaddingY: number;
    width: number; hbWidth: number;
    height: number; hbHeight: number;
    keyControls: keyControlsType;
    score: number;
    isAttacking: boolean;
    state: "idle" | "attack" | "run";
    direction: "down" | "up" | "left" | "right";
    projectileCount: number;
    dash: { isDashing: boolean, dashStart: null | number, cooldown: number, dashDuration: number };
    attack1_alreadyHit: string[];
    playerStats: PlayerStats;
    playerBuffStats: PlayerStats;
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } | {};

    constructor(id: string, x: number, y: number, name: string, avatarIndex: number, roomId: string) {
        this.id = id;
        this.name = name;
        this.avatarIndex = avatarIndex;
        this.roomId = roomId;
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
        this.projectileCount = 0;
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
        for (let p in games[this.roomId].players)
            if (p !== this.id) {
                if (this.isAttacking && !this.attack1_alreadyHit.includes(p)) {
                    const playerList = games[this.roomId].players;
                    if (isAttackColiding(this, playerList[p]) && !playerList[p].dash.isDashing) {
                        this.attack1_alreadyHit.push(p);
                        const dmgDetails = Player.calculateDamage(playerList[this.id], playerList[p], "physical", 1);
                        playerList[p].playerStats.life.current -= dmgDetails.damage;
                        io.to(p).emit("damageTaken", dmgDetails);
                        io.to(this.id).emit("damageDealt", { to: p, ...dmgDetails });
                    }

                    if (playerList[p].playerStats.life.current <= 0) {
                        const coords = generateRespawnCoords(OBSTACLES);
                        playerList[p].x = coords.x;
                        playerList[p].y = coords.y;
                        playerList[p].playerStats.life.current = playerList[p].playerStats.life.max;
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
        const currRoomPickableBuffs = games[this.roomId].pickableBuffs;
        for (let index in currRoomPickableBuffs) {
            if (isSquareColiding(
                {
                    x: this.x + this.hbPaddingX,
                    y: this.y + this.hbPaddingY,
                    width: this.hbWidth,
                    height: this.hbHeight
                },
                { x: currRoomPickableBuffs[index].x, y: currRoomPickableBuffs[index].y, width: 32, height: 32 },
            )) {
                Buff.applyToPlayer(games[this.roomId].players[this.id], games[this.roomId].pickableBuffs[index].type);
                games[this.roomId].pickableBuffs.splice(parseInt(index), 1)
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

class Projectile implements ProjectileType {
    x: number; width: number;
    y: number; height: number;
    angle: number;
    ownerId: string;
    roomId: string;
    life: number;
    score: number;
    velocity: number;
    constructor(x: number, y: number, angle: number, ownerId: string, roomId: string) {
        this.x = x; this.width = 16;
        this.y = y; this.height = 11;
        this.angle = angle;
        this.ownerId = ownerId;
        this.roomId = roomId;
        this.life = 1000;
        this.score = 0;
        this.velocity = 30;
    }

    move(delta: number) {
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;
        this.life -= delta;

        if (isColidingWithEnvironment(OBSTACLES, { x: this.x, y: this.y, width: 16, height: 11 }))
            this.life = 0;
    }

    checkHit() {
        const playerList = games[this.roomId].players;
        for (let p in playerList)
            if (p !== this.ownerId) {
                if (isSquareColiding(
                    {
                        x: playerList[p].x + playerList[p].hbPaddingX,
                        y: playerList[p].y + playerList[p].hbPaddingY,
                        width: playerList[p].hbWidth,
                        height: playerList[p].hbHeight
                    },
                    { x: this.x, y: this.y, width: this.width, height: this.height },
                )) {
                    if (!playerList[p].dash.isDashing) {
                        const dmgDetails = Player.calculateDamage(playerList[this.ownerId], playerList[p], "physical", 0.6);
                        playerList[p].playerStats.life.current -= dmgDetails.damage;
                        io.to(p).emit("damageTaken", dmgDetails);
                        io.to(this.ownerId).emit("damageDealt", { to: p, ...dmgDetails });
                    }
                    this.life = 0;
                }

                if (playerList[p].playerStats.life.current <= 0) {
                    const coords = generateRespawnCoords(OBSTACLES);
                    playerList[p].x = coords.x;
                    playerList[p].y = coords.y;
                    playerList[p].playerStats.life.current = 100;
                }
            }
    }
}

class Buff implements BuffObjectType {
    x: number; y: number;
    type: BuffKey;
    duration: number;
    createdAt: Date;
    name: string;
    tier: number;
    roomId: string;
    constructor(x: number, y: number, type: BuffKey, duration: number, namee: string, tier: number, roomId: string) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.duration = duration;
        this.createdAt = new Date;
        this.name = namee;
        this.tier = tier;
        this.roomId = roomId;
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

type resolveDupeNameType = (name: string, index: number, players: PlayerListType) => string;
const resolveDupeName: resolveDupeNameType = (name, index, players: PlayerListType) => {
    let currName = index === 1 ? name : name + index;
    console.log(currName);
    const sameNameCount = Object.keys(players).filter(id => players[id].name === currName);
    if (sameNameCount.length === 0)
        return currName;
    else {
        index += 1;
        return resolveDupeName(name, index, players);
    }

}

type PlayerListType = { [key: string]: Player };
let games: { [key: string]: Game } = {};

const getExistingGameRooms = () => {
    const gameIds = Object.keys(games);
    if (gameIds.length === 0) {
        return [];
    }
    return gameIds.map(gameId => {
        return {
            id: games[gameId].id,
            name: games[gameId].name,
            maxPlayers: games[gameId].gameConfig.maxPlayers,
            onlinePlayers: Object.keys(games[gameId].players).length
        };
    });
};

async function main() {
    io.on("connection", (socket) => {
        socket.emit("gameData", { MAP, OBSTACLES, gameRooms: getExistingGameRooms() });
        socket.on("createRoom", (data) => {
            let id = UUIDGeneratorBrowser();
            const name = data.name.length > 0 ? data.name :
                `Room ${Object.keys(games).length + 1}`
            const gameConfig = { name: name, id: id, password: data.password, maxPlayers: data.maxPlayers };
            games[id] = new Game(gameConfig);
            io.emit("theRoomWasCreated", {
                name,
                id,
                number: Object.keys(games).length - 1,
                maxPlayers: data.maxPlayers,
                onlinePlayers: Object.keys(games[id].players).length
            });
        });
        socket.on("joinRoom", (config: { roomId: string, playerName: string, avatarIndex: number, password: string }) => {
            let id: string = config.roomId || "";
            if (Object.keys(games).length < 1) {
                id = UUIDGeneratorBrowser();
                games[id] = new Game({ id, name: "Room 1", password: "", maxPlayers: 5 })
                io.emit("theRoomWasCreated", {
                    name: "Room 1",
                    id,
                    number: Object.keys(games).length - 1,
                    maxPlayers: 5,
                    onlinePlayers: Object.keys(games[id].players).length
                });
            }
            if (games[id].password === config.password) {
                if ( Object.keys(games[id].players).length >= games[id].gameConfig.maxPlayers) return;
                const coords = generateRespawnCoords(OBSTACLES);
                games[id].players[socket.id] = new Player(
                    socket.id,
                    coords.x,
                    coords.y,
                    resolveDupeName(config.playerName, 1, games[id].players),
                    config.avatarIndex,
                    id,
                );
                socket.join(id);
                socket.data.roomId = id;
                io.to(socket.id).emit("playerJoinedRoom");
            } else {
                io.to(socket.id).emit("failedToValidateRoomPw");
            }

        });


        socket.on("playerMovement", (controls) => {
            const player = games[socket.data.roomId].players[socket.id];
            if (player)
                player.keyControls = controls;
        });

        socket.on("shoot", (projectile) => {
            const player = games[socket.data.roomId].players[socket.id];
            if (player?.projectileCount < 1) {
                player.projectileCount++;
                games[socket.data.roomId].projectiles.push(
                    new Projectile(
                        projectile.x,
                        projectile.y,
                        projectile.angle,
                        socket.id,
                        socket.data.roomId,
                    ));
            }
        });

        socket.on("dash", () => {
            const player = games[socket.data.roomId].players[socket.id];
            player.dash.isDashing = true;
            player.dash.dashStart = +new Date;
        });

        socket.on("attackMelee1", () => {
            const player = games[socket.data.roomId].players[socket.id];
            player.isAttacking = true;
            player.state = "attack";
        });

        socket.on("stopAttacking", (state) => {
            const player = games[socket.data.roomId].players[socket.id];
            player.isAttacking = false;
            player.state = state;
            player.attack1_alreadyHit = [];
        });

        socket.on("disconnect", () => {
            console.log("disconnected: ", socket.id);
            delete games[socket.data.roomId]?.players[socket.id];
        });
        console.log(socket.id, " connected");
    });

    httpServer.listen(5000, () => {
        console.log("connect on port 5000");
    });


    /*
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

        for (let i in projectiles) {
            projectiles[i].move(delta);
            projectiles[i].checkHit();
        }
        projectiles = projectiles.filter((b: Projectile) => {
            let isAlive = b.life > 0;
            if (!isAlive && players[b.ownerId]?.projectileCount)
                players[b.ownerId].projectileCount--;
            return isAlive;
        });

        io.emit("playersData", { pl: players, bl: projectiles, bffs: buffs });
    };
    */


    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        Object.keys(games).map((g) => {
            games[g].tick(delta);
        });
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}


function isNonEmptyBuffs(obj: any): obj is { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } {
    return Object.keys(obj).length > 0;
}

main();


