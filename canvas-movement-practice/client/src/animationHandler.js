export class Animation {
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
    constructor(cx, imgPath, frames, stagger = 1, sw, sh, dw, dh, animOffset = 0) {
        this.cx = cx;
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
        this.directions = {
            down: 0,
            up: 1,
            left: 2,
            right: 3,
        }
    }

    incrementFrame(gf) {
        if (gf % this.stagger === 0) this.individualFrame++;
        if (this.individualFrame === this.frames)
            this.individualFrame = 0;
    }

    hasFrameEnded() {
        if (this.individualFrame === this.frames - 1 ) {
            this.individualFrame = 0;
            return true;
        }
        return false;
    }

    /**
        * @param {number} dx - the x position the draw will start at;
        * @param {number} y - the y position the draw will start at;
    */
        //switch dir and gf params around so dir can be ignored and defaulted
    drawImage(dx, dy, gf, dir = "down", ox = 0, oy = 0) {
        this.animOffset = this.sh * this.directions[dir];
        this.cx.drawImage(
            this.art,
            this.sw * this.individualFrame,
            this.animOffset,
            this.sw,
            this.sh,
            dx,
            dy,
            this.dw,
            this.dh
        );
        this.incrementFrame(gf);
    }

    drawRotated(dx, dy, gf, angle, dir = "down") {
        this.cx.save();
        this.cx.translate(dx, dy);
        this.cx.rotate(angle);
        this.drawImage(-this.dw / 2, -this.dh / 2, gf, dir);
        this.cx.restore();
    }


    playOnce(x, y) {
        if (this.individualFrame >= this.frames) {
            this.isPlaying = false;
            this.individualFrame = 0;
        }
        if (this.isPlaying) {
            this.drawImage(x, y);
            this.incrementFrame(ifr);
        }
    }

    playRepeatedly(x, y) {
        if (this.isPlaying) {
            this.drawImage(x, y);
            this.incrementFrame();
        }
    }

    static drawPlayerSize(cx,x,y) {
        cx.fillStyle = "rgba(0,0,0,0.2)"
        cx.fillRect(
            x + 27,
            y + 20,
            41,
            55
        )
    }

}

export class AnimationHandler {
    constructor() {
        this.animations = {};
    }

    /**
        @param {String} name - Name of the animation
        @param {Animation} animObj - The particular animation object;
        @return {undefined} the return type is void
    */
    appendAnimation(name, animObj) {
        this.animations[name] = animObj
    }

    returnAnimations() {
        return this.animations;
    }

    animateEnvironment() {

    }

    animatePlayer(cls, state, dir, dx, dy, ifr) {
        console.log(cls + state, dir);
        this.animations[cls + state].drawImage(dx, dy, ifr, dir);
    }
}
