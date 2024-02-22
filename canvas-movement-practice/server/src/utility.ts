import fs from "fs";
import { TILE_SIZE, BUFFS, OBSTACLES } from "./constants";
import { MapType, SquareColisionParams, PlayerType, PlayerStats, BuffKey } from "./types";

// MAP PARSING FUNCTION
export function parseCsvMap(mapName: "mapDesert_Ground" | "mapDesert_Objects") {
    const map = fs.readFileSync(`./server/src/assets/${mapName}.csv`, "utf8");
    const section = map.split("\n");
    section.pop();
    const map2D = section.map(s => s.split(",").map(n => {
        const id = parseInt(n);
        return id >= 0 ? { id } : undefined;
    }));
    return map2D;
}

// AID TO GAME LOGIC
export const isSquareColiding = (sq1: SquareColisionParams, sq2: SquareColisionParams) => {
    if (sq1.x + sq1.width + sq2.width > sq2.x + sq2.width &&
        sq1.x <= sq2.x + sq2.width &&
        sq1.y + sq1.height + sq2.height >= sq2.y + sq2.height &&
        sq1.y <= sq2.y + sq2.height)
        return true;

    return false;
};

export const isAttackColiding = (p1: PlayerType, p2: PlayerType) => {
    // we need 4 ifs for all directions.
    if (p1.direction === "right") {
        // on each check for collision we use P1 as first argument.
        return isSquareColiding(
            {
                x: p1.x + p1.width / 2,
                y: p1.y + 15,
                width: 35,
                height: 70,
            },
            {
                x: p2.x + p2.hbPaddingX,
                y: p2.y + p2.hbPaddingY,
                width: p2.hbWidth,
                height: p2.hbHeight,
            }
        );
    } else if (p1.direction === "left") {
        return isSquareColiding(
            {
                x: p1.x,
                y: p1.y + 10,
                width: 35,
                height: 70,
            },
            {
                x: p2.x + p2.hbPaddingX,
                y: p2.y + p2.hbPaddingY,
                width: p2.hbWidth,
                height: p2.hbHeight,
            }
        );
    } else if (p1.direction === "up") {
        return isSquareColiding(
            {
                x: p1.x + 10,
                y: p1.y,
                width: 75,
                height: 30,
            },
            {
                x: p2.x + p2.hbPaddingX,
                y: p2.y + p2.hbPaddingY,
                width: p2.hbWidth,
                height: p2.hbHeight,
            },
        );
    } else if (p1.direction === "down") {
        return isSquareColiding(
            {
                x: p1.x + 10,
                y: p1.y + p2.hbHeight,
                width: 75,
                height: 30,
            },
            {
                x: p2.x + p2.hbPaddingX,
                y: p2.y + p2.hbPaddingY,
                width: p2.hbWidth,
                height: p2.hbHeight,
            }
        );
    }

}

export const isColidingWithEnvironment = (map: MapType, player: SquareColisionParams) => {
    const col = Math.ceil(player.x / TILE_SIZE);
    const row = Math.ceil(player.y / TILE_SIZE);

    for (let r = row - 1; r <= row + 1; r++) {
        r = Math.min(map.length - 1, Math.max( 0, r));
        for (let c = col - 1; c <= col + 1; c++) {
            c = Math.min(map.length - 1, Math.max( 0, c));
            if (!map[r][c])
                continue;
            if (isSquareColiding(
                // very specific dimensions to the warrior animation.
                player,
                {
                    x: c * TILE_SIZE,
                    y: r * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                },
            )) return true;
        }
    }

    /*
    for (let row = 0; row < map.length; row++) {
        for (let col = 0, rl = map[0].length; col < rl; col++) {
            if (!map[row][col])
                continue;
            if (isSquareColiding(
                // very specific dimensions to the warrior animation.
                player,
                {
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                },
            )) return true;
        }
    }
    return false;
    */
}

type respawnCoordsType = (map: MapType) => { x: number, y: number };
export const generateRespawnCoords: respawnCoordsType = (map: MapType) => {
    const x = Math.trunc(Math.random() * (map.length * TILE_SIZE - 96));
    const y = Math.trunc(Math.random() * (map.length * TILE_SIZE - 96));

    if (!isColidingWithEnvironment(map, { x, y, width: 96, height: 96 }))
        return { x, y };
    else
        return generateRespawnCoords(map);
}


type spawnRandomBuffType = () => { x: number, y: number, buff: BuffKey };
export const spawnRandomBuff: spawnRandomBuffType = () => {
    const buffsList: BuffKey[] = Object.keys(BUFFS) as BuffKey[];
    const randomBuff = buffsList[Math.floor(Math.random() * buffsList.length)];
    const coords = generateRespawnCoords(OBSTACLES);

    return {
        x: coords.x,
        y: coords.y,
        buff: randomBuff,
    };
};


// Function to recursively sum the values of two objects
export function sumPlayerStats(obj1: PlayerStats, obj2: PlayerStats, action: "apply" | "remove"): PlayerStats {
    const result: PlayerStats = {
        regen: merge(obj1.regen, obj2.regen, action),
        life: merge(obj1.life, obj2.life, action),
        crit: merge(obj1.crit, obj2.crit, action),
        attack: merge(obj1.attack, obj2.attack, action),
        armor: merge(obj1.armor, obj2.armor, action),
        movement: merge(obj1.movement, obj2.movement, action)
    };
    return result;
}

// Helper function to sum values of two nested objects
export function merge<T extends Record<string, any>>(obj1: T, obj2: T, action: "apply" | "remove" = "apply"): T {
    const result: Partial<T> = {};
    for (const key in obj1) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            result[key] = merge(obj1[key], obj2[key], action) as T[Extract<keyof T, string>];
        } else {
            if (action === "apply")
                result[key] = parseFloat(((obj1[key] || 0) + (obj2[key] || 0)).toFixed(2)) as T[Extract<keyof T, string>];
            else if (action === "remove")
                result[key] = parseFloat(((obj1[key] || 0) - (obj2[key] || 0)).toFixed(2)) as T[Extract<keyof T, string>];
        }
    }
    return result as T;
}


export const UUIDGeneratorBrowser = (): string => {
    //@ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).toString().replace(/[018]/g, (c) => {
        const random = crypto.getRandomValues(new Uint8Array(1))[0];
        const randomHex = random & (15 >> (c / 4));
        return (c ^ randomHex).toString(16);
    });
};
