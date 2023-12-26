const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    init();
});

addEventListener('click', () => {
    init();
});


const GRAVITY = 0.25;
const FRICTION = 0.90;
const RADIUS = 25;

class Ball {
    constructor(x, y, radius, color, dx, dy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
    }

    update() {
        this.draw()
        // the reason this.dy is also used is because at times the ball may reach too much over the height and the change in direction of dy won't be large enough to get the balls out of the this.y that's larger than the screen height. Then Else will reset the dy to positive locking the ball off screen.
        if (this.y + this.radius + this.dy > canvas.height)
            this.dy = -this.dy * FRICTION;
        else
            this.dy += GRAVITY;

        if (this.x + this.radius + this.dx > canvas.width ||
            this.x - this.radius + this.dx <= 0)
            this.dx = -this.dx * FRICTION;

        this.y += this.dy;
        this.x += this.dx;
    }

    draw() {
        cx.beginPath();
        cx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        cx.fillStyle = this.color;
        cx.fill();
        cx.stroke();
        cx.closePath();
    }
}

let colors = ["#5F0F40", "#FB8B24", "#E36414", "#9A031E"];
colors = ["#BCECE0", "#36EEE0", "#F652A0", "#4C5270"];
let ballArr = [];
const init = () => {
    ballArr = [];
    for (let i = 0; i < 250; i++) {
        const c = colors[parseInt(getRandom(0, colors.length))];
        ballArr.push(
            new Ball(
                getRandom(0 + RADIUS, innerWidth - RADIUS),
                getRandom(0 + RADIUS, innerHeight - RADIUS),
                getRandom(10, 30),
                c,
                getRandom(-2, 2),
                getRandom(-2, 2),
            ))
    }

}

const animate = () => {
    requestAnimationFrame(animate);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (let ball of ballArr)
        ball.update();

}
init();
animate();
