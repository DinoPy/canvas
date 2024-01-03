import tmx from "tmx-parser";

export async function parseMap() {
    const map = await new Promise((resolve, reject) => {
        tmx.parseFile("./src/assets/map.tmx", (err, map) => {
            if (err)
                return reject(map);
            const tiles = map.layers[0].tiles;
            let parsedMap = [];
            for (let row = 0; row < map.height; row++) {
                let columns = [];
                for (let col = 0; col < map.width; col++) {
                    const t = tiles[row * 100 + col];
                    columns.push({ id: t.id, gid: t.gid });
                }
                parsedMap.push(columns);
            }

            resolve(parsedMap);
        });
    });

    return map;
}

export const isSquareColiding = (sq1, sq2) => {
    if (sq1.x + sq1.width + sq2.width > sq2.x + sq2.width &&
        sq1.x <= sq2.x + sq2.width &&
        sq1.y + sq1.height + sq2.height >= sq2.y + sq2.height &&
        sq1.y <= sq2.y + sq2.height)
        return true;

    return false;
};

export const isAttackColiding = (p1, p2) => {
    // we need 4 ifs for all directions.
    if (p1.direction === "right" ) {
        return isSquareColiding (
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
    } else if (p1.direction === "left" ) {
        return isSquareColiding (
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
    } else if (p1.direction === "up" ) {
        return isSquareColiding (
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
    } else if (p1.direction === "down" ) {
        return isSquareColiding (
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


