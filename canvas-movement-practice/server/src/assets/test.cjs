const fs = require ("fs");
const map = fs.readFileSync("./src/assets/mapDesert_Desert.csv", "utf8");
const section = map.split("\n");
const map2D = section.map(s => s.split(",").map(n => parseInt(n)));
console.log(map2D);
