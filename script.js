const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  floorY: canvas.height - 40,
};

let player = {
  lane: 0,
  x: 0,
  y: WORLD.floorY - 70,
  width: 42,
  height: 70,
  color: '#59c6ff',
};

let obstacles = [];
let stars = [];
let score = 0;
let best = Number(localStorage.getItem('clash3d-best') || 0);
let gameRunning = false;
let lastTime = 0;
let spawnTimer = 0;
let animationId = null;

bestEl.textContent = 'Best: ' + best;

function createStars() {
  stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * WORLD.width,
    y: Math.random() * WORLD.height * 0.7,
    r: Math.random() * 2 + 1,
    speed: Math.random() * 1.5 + 0.5,
  }));
}

function resetPlayer() {
  player.lane = 0;
  player.x = WORLD.width / 2;
  player.y = WORLD.floorY - 70;
}

function resetGame() {
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  scoreEl.textContent = 'Score: 0';
  statusEl.textContent = 'Running';
  gameRunning = true;
  resetPlayer();
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3) - 1;
  const size = 28 + Math.random() * 26;
  obstacles.push({
    lane,
    x: WORLD.width / 2 + lane * 110,
    y: -30,
    size,
    speed: 4 + Math.random() * 2.5 + score * 0.02,
    color: lane === 0 ? '#ff5d5d' : lane === -1 ? '#f5b700' : '#2ecc71'
  });
}

function update(dt) {
  if (!gameRunning) return;

  score += dt * 10;
  scoreEl.textContent = 'Score: ' + Math.floor(score);

  spawnTimer += dt * 1000;
  if (spawnTimer > 1100) {
    spawnTimer = 0;
    spawnObstacle();
  }

  for (const star of stars) {
    star.y += star.speed;
    if (star.y > WORLD.height * 0.7) {
      star.y = 0;
      star.x = Math.random() * WORLD.width;
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed * dt * 60;

    if (Math.abs(o.y - (WORLD.floorY - 70)) < 80 && o.lane === player.lane) {
      gameOver();
      return;
    }

    if (o.y > WORLD.height + 80) {
      obstacles.splice(i, 1);
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  sky.addColorStop(0, '#091425');
  sky.addColorStop(0.45, '#112236');
  sky.addColorStop(1, '#0d1f30');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  for (const star of stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(89,198,255,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const y = 40 + i * 22;
    const startX = WORLD.width / 2 - (y * 1.8);
    const endX = WORLD.width / 2 + (y * 1.8);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y + 220);
    ctx.stroke();
  }

  ctx.fillStyle = '#1d3557';
  ctx.fillRect(0, WORLD.floorY, WORLD.width, WORLD.height - WORLD.floorY);

  for (let i = -1; i <= 1; i++) {
    const laneX = WORLD.width / 2 + i * 110;
    ctx.strokeStyle = 'rgba(245,183,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(laneX, WORLD.floorY);
    ctx.lineTo(laneX, WORLD.height);
    ctx.stroke();
  }
}

function drawPlayer() {
  const px = WORLD.width / 2 + player.lane * 110;
  ctx.save();
  ctx.translate(px, player.y);
  ctx.fillStyle = player.color;
  ctx.fillRect(-player.width / 2, 0, player.width, player.height);
  ctx.fillStyle = '#dbeeff';
  ctx.fillRect(-8, -18, 16, 18);
  ctx.restore();
}

function drawObstacles() {
  for (const o of obstacles) {
    const x = WORLD.width / 2 + o.lane * 110;
    const y = o.y;
    const w = o.size;
    const h = o.size * 1.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = o.color;
    ctx.fillRect(-w / 2, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-w / 2 + 5, 8, w - 10, 8);
    ctx.restore();
  }
}

function draw() {
  drawBackground();
  drawObstacles();
  drawPlayer();
}

function tick(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.03);
  lastTime = timestamp;
  update(dt);
  draw();
  animationId = requestAnimationFrame(tick);
}

function gameOver() {
  gameRunning = false;
  statusEl.textContent = 'Game Over';
  if (Math.floor(score) > best) {
    best = Math.floor(score);
    localStorage.setItem('clash3d-best', String(best));
    bestEl.textContent = 'Best: ' + best;
  }
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();
  animationId = requestAnimationFrame(tick);
}

window.addEventListener('keydown', (e) => {
  if (!gameRunning) {
    if (e.key === 'Enter' || e.key === ' ') startGame();
    return;
  }

  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
    player.lane = Math.max(-1, player.lane - 1);
  }
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
    player.lane = Math.min(1, player.lane + 1);
  }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

createStars();
resetPlayer();
statusEl.textContent = 'Ready';
scoreEl.textContent = 'Score: 0';
requestAnimationFrame(tick);
