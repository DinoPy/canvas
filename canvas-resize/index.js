const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const c = canvas.getContext("2d");

// Rectangle //
// takes any CSS color and applies it to the next Rect
//c.fillStyle = "lime";
// x, y, width, height
//c.fillRect(100, 100, 100, 100);
//c.fillRect(200, 200, 100, 100);
//c.fillRect(400, 100, 100, 100);

// Line //
//c.beginPath()
//c.moveTo(50, 300);
//c.lineTo(300, 100);
//c.moveTo(300, 300);
//c.lineTo(250, 400);
// takes any CSS color and applies it to the next strokes
//c.strokeStyle = "#2f22bc";
//c.stroke();

// Arc //
// begins a line, without it previous line will be connected to next ones.

let mouse = {
    over: false,
    x: undefined,
    y: undefined,
}
window.addEventListener("mouseover", (e) => mouse.over = true)
window.addEventListener("mouseout", (e) => mouse.over = false);
window.addEventListener("mousemove", (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});


const CIRCLE_WIDTH = 200;
const CIRCLE_HEIGHT = 200;
const CIRCLE_RADIUS = 5;
const PEAK_VELOCITY = 7;
const CIRCLE_COUNT = Math.random() * 2500;


class Circle {
    MAX_RADIUS = 40;
    MIN_RADIUS = 5;
    REACTION_RANGE = 50;
    constructor(dx, dy, x, y, radius, style) {
        this.dx = dx;
        this.dy = dy;
        this.x = x;
        this.y = y;
        this.originalRadius = radius;
        this.radius = this.originalRadius || this.MIN_RADIUS;
        this.style = style;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        // c.strokeStyle = this.style;
        c.fillStyle = this.style;
        c.fill("nonzero");
        // c.stroke();
    }

    update() {
        this.draw();
        if (this.x + this.radius > innerWidth || this.x - this.radius < 0)
            this.dx = -this.dx;
        if (this.y + this.radius > innerHeight || this.y - this.radius < 0)
            this.dy = -this.dy;
        this.x += this.dx;
        this.y += this.dy;

        if (mouse.x - this.x < this.REACTION_RANGE && mouse.x - this.x > -this.REACTION_RANGE && mouse.y - this.y < this.REACTION_RANGE && mouse.y - this.y > -this.REACTION_RANGE) {
            if (mouse.over) {
                this.radius > this.MAX_RADIUS ? {} : this.radius += 1;
            }
        } else if (this.radius > this.originalRadius) {
            this.radius -= 1;
        }
    }
}

let colorArray = [
    "#ffaa33",
    "#9933aaa",
    "#003300",
    "#4411aa",
    "#ff1100",
];

let circles = [];
for (let i = 1; i <= CIRCLE_COUNT; i++) {
    const x = Math.random() * (innerWidth - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;
    const y = Math.random() * (innerHeight - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;
    const dx = (Math.random() * 0.5) * PEAK_VELOCITY; // x velocity
    const dy = (Math.random() * 0.5) * PEAK_VELOCITY; // y velocity
    const radius = (Math.random() * CIRCLE_RADIUS) + 1;
    //const randomStyle = `rgb(${Math.random() * 250}, ${Math.random() * 255}, ${Math.random() * 255})`;
    const style = colorArray[parseInt(Math.random() * colorArray.length)];

    circles.push(new Circle(dx, dy, x, y, radius, style))
}

function animate() {
    requestAnimationFrame(animate);
    // clearRect will clear all rectangles on the page so the function is required outside the Circle class behavior.
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (let circle of circles)
        circle.update();
}

animate();
