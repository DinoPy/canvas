const canvas = document.getElementById("game");
const cx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
});

class Animation {
    /**
    * @constructor
    * @param {string} imgPath - animation image path, must have all the frames in one image
    * @param {number} frames - the number of frames the animation has
    * @param {number} stagger - the individual frame number
    * @param {number} sw - source width
    * @param {number} sh - source height
    * @param {number} dw - destination width
    * @param {number} dh - destination height
    * @param {number} animOffset - animation offset - applicable when more than one animation exist on the same image
    * @return {undefined} the return type is void
    */
    constructor(imgPath, frames, stagger = 1, sw, sh, dw, dh, animOffset = 0) {
        this.sw = sw;
        this.sh = sh;
        this.dw = dw;
        this.dh = dh;
        this.animOffset = animOffset * this.sh;
        this.art = new Image();
        this.art.src = imgPath;
        this.individualFrame = 0;
        this.frames = frames;
        this.stagger = stagger;
        this.isPlaying = true;
    }

    incrementFrame() {
        if (gameFrame % this.stagger === 0) this.individualFrame++;
    }

    /**
        * @param {number} x - the x position the draw will start at;
        * @param {number} y - the y position the draw will start at;
    */
    drawImage(x, y) {
        cx.drawImage(
            this.art,
            this.sw * (this.individualFrame % this.frames),
            this.animOffset,
            this.sw,
            this.sh,
            x,
            y,
            this.dw,
            this.dh
        );
    }


    playOnce(x, y) {
        if (this.individualFrame >= this.frames) {
            this.isPlaying = false;
            this.individualFrame = 0;
        }
        if (this.isPlaying) {
            this.drawImage(x, y);
            this.incrementFrame();
        }
    }

    playRepeatedly(x, y) {
        if (this.isPlaying) {
            this.drawImage(x, y);
            this.incrementFrame();
        }
    }

}

class AnimationHandler {
    currentlyAnimating = "idle";
    constructor() {
        this.animations = {};
    }

    /**
        @param {String} name - Name of the animation
        @param {Object} animData - MUST have:
            {
                imgPath: string,
                frames: number,
                stagger: number,
                sw: number,
                sh: number,
                dw: number,
                dh: number
            }
        @return {undefined} the return type is void
    */
    appendAnimation(name, obj) {
        this.animations[name] = new Animation(
            obj.imgPath,
            obj.frames,
            obj.stagger,
            obj.sw,
            obj.sh,
            obj.dw,
            obj.dh
        )
    }

    returnAnimations() {
        return this.animations;
    }

    animateEnvironment() {

    }
}

const animHandler = new AnimationHandler();
animHandler.appendAnimation("poisonAttack1",
    { imgPath: "../canvas-movement-practice/public/assets/Dark VFX 2.png", frames: 15, stagger: 4, sw: 48, sh: 64, dw: 96, dh: 128 })
animHandler.appendAnimation("warriorAttack1",
    { imgPath: "../canvas-movement-practice/public/assets/warrior_attack.png", frames: 15, stagger: 3, sw: 100, sh: 100, dw: 90, dh: 90 })


let gameFrame = 0;
const animate = () => {
    cx.clearRect(0, 0, canvas.width, canvas.height);
    animHandler.animations["poisonAttack1"].playOnce(200, 100);
    animHandler.animations["warriorAttack1"].playRepeatedly(100, 100);

    gameFrame++;
    requestAnimationFrame(animate);
}

animate();
