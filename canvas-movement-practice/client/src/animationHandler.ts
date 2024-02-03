import { AnimationType } from ".";

export type Directions = "down" | "up" | "left" | "right";
export class Animation implements AnimationType {
    cx: CanvasRenderingContext2D;
    sw: number; sh: number; dw: number; dh: number;
    animOffset: number;
    art: HTMLImageElement;
    individualFrame: number;
    frames: number;
    stagger: number;
    isPlaying: boolean;
    directions: { down: number; up: number; left: number; right: number };

    constructor(cx: CanvasRenderingContext2D, imgPath: string, frames: number, stagger: number, sw: number, sh: number, dw: number, dh: number, animOffset: number = 0) {
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
        this.stagger = stagger | 0;
        this.isPlaying = true;
        this.directions = {
            down: 0,
            up: 1,
            left: 2,
            right: 3,
        }
    }

    incrementFrame(gf: number) {
        if (gf % this.stagger === 0) this.individualFrame++;
        if (this.individualFrame === this.frames)
            this.individualFrame = 0;
    }

    hasFrameEnded() {
        if (this.individualFrame === this.frames - 1) {
            this.individualFrame = 0;
            return true;
        }
        return false;
    }

    //switch dir and gf params around so dir can be ignored and defaulted
    drawImage(dx: number, dy: number, gf: number, dir: Directions = "down", ox: number = 0, oy: number = 0) {
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

    drawRotated(dx: number, dy: number, gf: number, angle: number, dir: Directions = "down") {
        this.cx.save();
        this.cx.translate(dx, dy);
        this.cx.rotate(angle);
        this.drawImage(-this.dw / 2, -this.dh / 2, gf, dir);
        this.cx.restore();
    }


    playOnce(x: number, y: number, gf: number) {
        if (this.individualFrame >= this.frames) {
            this.isPlaying = false;
            this.individualFrame = 0;
        }
        if (this.isPlaying) {
            this.drawImage(x, y, gf);
            this.incrementFrame(gf);
        }
    }

    playRepeatedly(x: number, y: number, gf: number) {
        if (this.isPlaying) {
            this.drawImage(x, y, gf);
            this.incrementFrame(gf);
        }
    }

    static drawPlayerSize(cx: CanvasRenderingContext2D, x: number, y: number) {
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
    animations: { [key: string]: AnimationType };
    constructor() {
        this.animations = {};
    }

    appendAnimation(name: string, animObj: AnimationType) {
        this.animations[name] = animObj
    }

    returnAnimations() {
        return this.animations;
    }
}
