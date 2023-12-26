const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.height = innerHeight;
canvas.width = innerWidth;

const warrior_run_right = new Image();
warrior_run_right.src = `./assets/Right_Side/PNG Sequences/Warrior_clothes_1/Run/0_Warrior_Run_00${0}.png`;

const spriteWidth = 96, spriteHeight = 96;
let gameFrame = 0;
let stagger = 0;
const staggerFrame = 5;
let playerState = "walk";

const animationStates = [
    {
        name: "walk",
        frames: 14,
    },
    {
        name: "right",
        frames: 4,
    },
    {
        name: "left",
        frames: 4,
    },
    {
        name: "up",
        frames: 4,
    },
];

const spriteAnimations = ["walk", "right", "left", "up"];

const loop = () => {
    requestAnimationFrame(loop);
    if ((stagger % staggerFrame) == 0) {
        cx.clearRect(0, 0, canvas.width, canvas.height);
        let index = spriteAnimations.indexOf(playerState);
        let frameX = spriteWidth * (gameFrame % (animationStates[index].frames));
        let frameY = spriteHeight * index;
        cx.drawImage(sprite,frameX, frameY,spriteWidth,spriteHeight, 0, 0, 200, 200);
        gameFrame++;
    }
    stagger++;
}
loop();

