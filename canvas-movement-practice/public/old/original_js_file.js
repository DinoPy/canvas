const socket = io("ws://localhost:5000");
//***************************************//
//************** SETUP *****************//
//***************************************//
const canvas = document.querySelector('canvas');
const cx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

//***************************************//
//************** CONTROLS  *****************//
//***************************************//
let keyControls = {
    up: false,
    down: false,
    left: false,
    right: false,
}
let mouseControls = {
    down: false,
    x: undefined,
    y: undefined,
}
window.addEventListener('keydown', (e) => {
    let keyControlCheck = keyControls;
    if (e.key === "w") keyControls.up = true;
    if (e.key === "a") keyControls.left = true;
    if (e.key === "r") keyControls.down = true;
    if (e.key === "s") keyControls.right = true;
    if (JSON.stringify(keyControlCheck) !== JSON.stringify(keyControl))
        socket.emit("player-movement", keyControls);
})
window.addEventListener('keyup', (e) => {
    if (e.key === "w") keyControls.up = false;
    if (e.key === "a") keyControls.left = false;
    if (e.key === "r") keyControls.down = false;
    if (e.key === "s") keyControls.right = false;
    socket.emit("player-movement", keyControls);

})
window.addEventListener('click', (e) => {
    mouseControls.down = true;
    mouseControls.x = e.x;
    mouseControls.y = e.y;
});

socket.on("players-data", obj => {
});






//***************************************//
//************** PLAYER *****************//
//***************************************//
class Player {
    constructor(x, y, width, height, vx, vy) {
        this.x = x || window.innerWidth / 2;
        this.y = y || window.innerWidth / 2;
        this.width = width || 50;
        this.height = height || 50;
        this.vx = vx || 5;
        this.vy = vy || 5;
    }

    draw() {
        cx.fillStyle = "orange";
        cx.fillRect(this.x, this.y, this.width, this.height);
    }

    shot() {
        const angle = Math.atan2(mouseControls.y - this.y, mouseControls.x - this.x);
        bullets.push(new Bullet(uuid(), this.x + this.width / 2, this.y + this.height / 2, angle))
        mouseControls.down = false;
        console.log(bullets.length, canvas.width);
    }

    update() {

        //************ KEY CONTROLS ****************//
        if (keyControls.right && this.x < window.innerWidth - this.width) this.x += this.vx;
        if (keyControls.left && this.x > 0) this.x -= this.vx;
        if (keyControls.up && this.y > 0) this.y -= this.vy;
        if (keyControls.down && this.y < innerHeight - this.height) this.y += this.vy;

        //************ MOUSE CONTROLS ****************//
        if (mouseControls.down)
            this.shot();

        this.draw();
    }
}

class Bullet {
    constructor(id, x, y, angle, radius, velocity) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius || 2;
        this.velocity = velocity || 10;
        this.angle = angle;
    }


    draw() {
        cx.beginPath();
        cx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        cx.fillStyle = "red";
        cx.fill();

        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;

        if (this.x > canvas.width || this.x < 0 || this.y > canvas.heght || this.y < 0) {
            bullets = bullets.filter(b => {
                return b.id !== this.id
            })
        }
    }
}

const player = new Player();
let bullets = [];

//***************************************//
//************** ANIMATION *****************//
//***************************************//
const animate = () => {
    requestAnimationFrame(animate);
    cx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let bullet of bullets) {
        bullet.draw()
    }

    player.update();
}

animate();
