import tmx from "tmx-parser";

export async function parseMap () {
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
                    columns.push({id: t.id, gid: t.gid});
                }
                parsedMap.push(columns);
            }

            resolve(parsedMap);
        });
    });

    return map;
}
