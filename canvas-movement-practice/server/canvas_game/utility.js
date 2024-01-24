"use strict";
const uuid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
const getDistance = (x1, y1, x2, y2) => {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
};
const getMapOffset = (myPlayer, canW, canH, TILE_SIZE, mapLen) => {
    let x = myPlayer.x - canW / 2 - TILE_SIZE < 0 ? myPlayer.x : canW / 2;
    let y = myPlayer.y - canH / 2 < 0 ? myPlayer.y : canH / 2;
    const map_dim = mapLen * TILE_SIZE - TILE_SIZE;
    let xx = map_dim - myPlayer.x < canW / 2 ?
        (canW / 2) - (map_dim - myPlayer.x + TILE_SIZE) : 0;
    let yy = map_dim - myPlayer.y < canH / 2 ?
        (canH / 2) - (map_dim - myPlayer.y + TILE_SIZE) : 0;
    const offsetX = x + xx;
    const offsetY = y + yy;
    return { offsetX, offsetY };
};
let to;
to = (els, skill, time, interval) => {
    els[skill]["dmg"].updateTextContents(time);
    if (time <= 0) {
        els[skill]["dmg"].addClass("hidden");
        return;
    }
    ;
    setTimeout(() => { to(els, skill, time - interval, interval); }, interval);
};
const triggerCd = (els, skill, time, interval) => {
    to(els, skill, time, interval);
};
