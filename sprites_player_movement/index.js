const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.height = innerHeight;
canvas.width = innerWidth;

let controls = {
    down: false,
    up: false,
    left: false,
    right: false,
}

addEventListener("keydown", (e) => {
    if (e.key === "w" && !controls.up)
        controls.up = true;
    if (e.key === "r" && !controls.down)
        controls.down = true;
    if (e.key === "a" && !controls.left)
        controls.left = true;
    if (e.key === "s" && !controls.right)
        controls.right = true;
});
addEventListener("keyup", (e) => {
    if (e.key === "w")
        controls.up = false;
    if (e.key === "r")
        controls.down = false;
    if (e.key === "a")
        controls.left = false;
    if (e.key === "s")
        controls.right = false;
});

const warrior_run = new Image();
warrior_run.src = `./warrior_run.png`;

const spriteWidth = 100, spriteHeight = 100;
let gameFrame = 0;
let stagger = 0;
const staggerFrame = 2;
let playerState = "down";

const animationStates = [
    {
        name: "down",
        frames: 15,
    },
    {
        name: "up",
        frames: 15,
    },
    {
        name: "left",
        frames: 15,
    },
    {
        name: "right",
        frames: 15,
    },
];

const spriteAnimations = ["down", "up", "left", "right"];

let x = 0, y = 0;
const loop = () => {
    requestAnimationFrame(loop);
    if ((stagger % staggerFrame) == 0) {
        cx.clearRect(0, 0, canvas.width, canvas.height);
        if (controls.up) {
            playerState = "up";
            y -= 10;
        } else if (controls.down) {
            playerState = "down";
            y += 10;
        }

        if (controls.left) {
            playerState = "left";
            x -= 10;
        } else if (controls.right) {
            playerState = "right";
            x += 10;
        }
        let index = spriteAnimations.indexOf(playerState);
        let frameX = spriteWidth * (gameFrame % (animationStates[index].frames));
        let frameY = spriteHeight * index;
        cx.drawImage(warrior_run, frameX, frameY, spriteWidth, spriteHeight, x, y, 100, 100);
        gameFrame++;
    }
    stagger++;
}
loop();

