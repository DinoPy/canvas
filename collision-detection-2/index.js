const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
});

let mouse = {
    x: undefined,
    y: undefined
}
addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

const RADIUS = 25;

class Circle {
    constructor(x, y, radius, color, index) {
        this.index = index;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.mass = 1;
        this.velocity = {
            x: (Math.random() * 0.5) * 5,
            y: (Math.random() * 0.5) * 5,
        }
        this.opacity = 0;
    }

    update(circles) {
        this.draw();

        for (let c of circles) {
            if (c === this)
                continue;
            if (getDistance(this.x, this.y, c.x, c.y) < this.radius * 2) {
                resolveCollision(this, c);
                /*
                this.velocity.y = -this.velocity.y;
                this.velocity.x = -this.velocity.x;
                */
            }

        }

        if (getDistance(this.x, this.y, mouse.x, mouse.y) < RADIUS * 8 && this.opacity < 0.25) {
            this.opacity += 0.02;
        } else if (this.opacity > 0) {
            this.opacity -= 0.02;
            this.opacity = Math.max(0, this.opacity);
        }

        if (this.x >= innerWidth - this.radius || this.x <= 0 + this.radius)
            this.velocity.x = -this.velocity.x;
        if (this.y >= innerHeight - this.radius || this.y <= 0 + this.radius)
            this.velocity.y = -this.velocity.y;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

    }

    draw() {
        cx.beginPath();
        cx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        cx.save();
        cx.globalAlpha = this.opacity;
        cx.fillStyle = this.color;
        cx.fill();
        cx.restore();
        cx.strokeStyle = this.color;
        cx.stroke();
        cx.closePath();
    }
}

let colors = ["#845EC2", "#2C73D2", "#0081CF", "#0089BA", "#008E9B", "#008F7A"];
let circles = [];
const init = () => {
    circles = [];
    for (let i = 0; i < 100; i++) {
        let x = getRandom(RADIUS, innerWidth - RADIUS);
        let y = getRandom(RADIUS, innerHeight - RADIUS);
        if (i !== 0) {
            for (let j = 0; j < circles.length; j++) {
                if (getDistance(x, y, circles[j].x, circles[j].y) < RADIUS * 2) {
                    x = getRandom(RADIUS, innerWidth - RADIUS);
                    y = getRandom(RADIUS, innerHeight - RADIUS);
                    j = -1;
                }
            }
        }
        circles.push(
            new Circle(x, y, RADIUS, colors[parseInt(Math.random() * colors.length)], i))
    }
}

const animate = () => {
    requestAnimationFrame(animate);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (let c of circles)
        c.update(circles);
}

init();
animate();
