const socket = io("ws://localhost:5000");
//***************************************//
//************** SETUP *****************//
//***************************************//
const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

//***************************************//
//************** CONTROLS  *****************//
//***************************************//
let keyControls = {
    up: false,
    down: false,
    left: false,
    right: false,
}
let mouseControls = {
    down: false,
    x: undefined,
    y: undefined,
}
window.addEventListener('keydown', (e) => {
    if ((e.key === "w" || e.key === "ArrowUp") && !keyControls.up) {
        keyControls.up = true;
        socket.emit("player-movement", keyControls);
    }
    if ((e.key === "a" || e.key === "ArrowLeft") && !keyControls.left) {
        keyControls.left = true;
        socket.emit("player-movement", keyControls);
    }
    if ((e.key === "r" || e.key === "ArrowDown") && !keyControls.down) {
        keyControls.down = true;
        socket.emit("player-movement", keyControls);
    }
    if ((e.key === "s" || e.key === "ArrowRight") && !keyControls.right) {
        keyControls.right = true;
        socket.emit("player-movement", keyControls);
    }
})
window.addEventListener('keyup', (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keyControls.up = false;
    if (e.key === "a" || e.key === "ArrowLeft") keyControls.left = false;
    if (e.key === "r" || e.key === "ArrowDown") keyControls.down = false;
    if (e.key === "s" || e.key === "ArrowRight") keyControls.right = false;
    socket.emit("player-movement", keyControls);

})
window.addEventListener('click', (e) => {
    mouseControls.down = true;
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

class Player {
    gameFrame = 0;
    animationStates = {
        "down": {
            name: "down",
            frames: 15,
        },
        "up": {
            name: "up",
            frames: 15,
        },
        "left": {
            name: "left",
            frames: 15,
        },
        "right": {
            name: "right",
            frames: 15,
        },
        "idle": {
            name: "idle",
            frames: 30
        }
    }
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = 96;
        this.height = 96;
        this.life = 100;
        this.score = 0;
        this.movementDirection = "down";
    }

    draw(camX, camY, pi) {
        if (keyControls.up || keyControls.down || keyControls.left || keyControls.right) {
            if (keyControls.up) this.movementDirection = "up";
            else if (keyControls.down) this.movementDirection = "down";
            if (keyControls.left) this.movementDirection = "left";
            else if (keyControls.right) this.movementDirection = "right";
        } else {
            this.movementDirection = "idle";
        }
        let frameX = 100 * (gameFrame % this.animationStates[this.movementDirection].frames)
        let frameY = 100 * Object.keys(this.animationStates).indexOf(this.movementDirection);

        cx.drawImage(
            this.movementDirection === "idle" ? warriorIdle : warriorRun,
            frameX,
            this.movementDirection === "idle" ? 0 : frameY,
            100,
            100,
            this.x - (camX || 0),
            this.y - (camY || 0),
            this.width,
            this.height,
        );

        cx.font = "16px Monserat";
        cx.fillText(
            `Player ${pi}`,
            this.x - (camX || 0) + this.width / 4,
            this.y - (camY || 0),
        )
        this.gameFrame++;
    }

    showStats(id) {
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        if (id === socket.id) {
            const text = `${this.life}  Sc: ${this.score}`
            cx.drawImage(
                heartImg,
                canvas.width - TILE_SIZE * 4,
                0,
                TILE_SIZE * 1.5,
                TILE_SIZE
            );
            cx.font = "16px Monserat";
            cx.fillText(
                text,
                canvas.width - TILE_SIZE * 2.75,
                TILE_SIZE / 2
            );
        }
    }

    shot(camX, camY, offsets) {
        const angle = Math.atan2(
            mouseControls.y - offsets.offsetY,
            mouseControls.x - offsets.offsetX
        )
        mouseControls.down = false;
        const bullet = {
            angle: angle,
            x: this.x - offsets.offsetX,
            y: this.y - offsets.offsetY,
        }
        console.log(this.x, this.y, bullet.x, bullet.y);
        socket.emit("shoot", bullet);
    }

    update(camX, camY, offsets, pi, id) {
        //************ MOUSE CONTROLS ****************/
        if (mouseControls.down)
            this.shot(camX, camY, offsets);

        this.draw(camX, camY, pi);
        this.showStats(id);
    }
}

const TILE_SIZE = 32;
let players = {};
let bullets = [];
let map = [[]];

//*********************************************//
//************** MULTIPLAYER *****************//
//*******************************************//

socket.on("connect", () => {
    players[socket.id] = new Player(socket.id);
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
    }

    for (let p in players) {
        if (!pl.hasOwnProperty(p))
            delete players[p];
    }

    bullets = bl;

});

//***************************************//
//************** ANIMATION *****************//
//***************************************//
const TILES_IN_ROW = 8;
const STAGGER_FRAME = 2;
let stagger = 0, gameFrame = 0, playerIndex = 0;
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
            cx.drawImage(rock, b.x - cameraX, b.y - cameraY);
        }

        for (let p in players) {
            playerIndex++;
            players[p].update(cameraX, cameraY, offsets, playerIndex, players[p].id);

        }
        playerIndex = 0;
        gameFrame++;
    }
    stagger += 1;
    requestAnimationFrame(animate);
}

animate();
