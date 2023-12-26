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

const getDistance = (x1, y1, x2, y2) => {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;

    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

class Circle {
    constructor(x, y, radius, color, index) {
        this.index = index;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    update() {
        this.draw();
        if (this.index === 0) {
            this.x = mouse.x;
            this.y = mouse.y;
        }
    }

    draw() {
        cx.beginPath();
        cx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        cx.fillStyle = this.color;
        cx.stroke();
        cx.fill();
        cx.closePath();
    }
}

let circles = [];
const init = () => {
    circles = [];
    circles.push(
        new Circle(
            innerWidth / 2,
            innerHeight / 2,
            50,
            "lime",
            25
        ))

    for (let i = 0; i < 1; i++) {
        circles.push(
            new Circle(
                25, 25, 25, "orange", i
            ))
    }
}

const animate = () => {
    requestAnimationFrame(animate);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (let c of circles)
        c.update();

    if (getDistance(circles[0].x, circles[0].y, circles[1].x, circles[1].y) <
        circles[0].radius + circles[1].radius) {
        circles[0].color = "yellow"
    } else {
        circles[0].color = "lime"
    }
}

init();
animate();
