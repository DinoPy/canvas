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

class Square {
    constructor(x, y, width, height, color, index) {
        this.index = index;
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
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
        cx.fillStyle = this.color;
        cx.fillRect(this.x, this.y, this.width, this.height);
    }
}

let squares = [];
const init = () => {
    squares = [];
    squares.push(
        new Square(
            innerWidth / 2,
            innerHeight / 2,
            50,
            50,
            "lime",
            25
        ))

    for (let i = 0; i < 1; i++) {
        squares.push(
            new Square(
                25, 25, 50, 50, "orange", i
            ))
    }
}

const animate = () => {
    requestAnimationFrame(animate);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (let c of squares)
        c.update();

    // sq1.x + sq1.width + sq2.width >= sq2.x + sq1.width
    // sq1.x <= sq2.x + sq2.width + sq2.width
    // sq1.y + sq1.height + sq2.height >= sq2.y + sq2.height
    // sq1.y <= sq2.y + sq2.height
    if (squares[0].x + squares[0].width * 2 > squares[1].x + squares[1].width &&
        squares[0].x <= squares[1].x + squares[1].width &&
        squares[0].y + squares[0].height + squares[1].height >= squares[1].y + squares[1].height && squares[0].y <= squares[1].y + squares[1].height)
        console.log("colliding");
}

init();
animate();
