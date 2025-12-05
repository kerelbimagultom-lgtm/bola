// Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width, HEIGHT = canvas.height;

const statusElt = document.getElementById("status");
const restartBtn = document.getElementById("restart");

// --- Game Elements ---
const PLAYER_SIZE = 28;
const BALL_RADIUS = 12;
const ENEMY_WIDTH = 28;
const ENEMY_HEIGHT = 28;
const GOAL_WIDTH = 80; // Lebar gawang
const GOAL_HEIGHT = 64; // Tinggi gawang

let gameOver = false;
let win = false;

// --- Player, Bola, Musuh ---
const player = {
  x: 90,
  y: HEIGHT / 2,
  size: PLAYER_SIZE,
  speed: 4,
  color: "#f7ed55"
};

const ball = {
  x: 180,
  y: HEIGHT / 2,
  r: BALL_RADIUS,
  vx: 0,
  vy: 0,
  friction: 0.96,
  color: "#fff"
};

const barcaKeepers = [
  // Bikin 3 keeper di depan gawang, bergerak horizontal masing-masing
  { x: WIDTH - 130, y: 140, w: ENEMY_WIDTH, h: ENEMY_HEIGHT, vx: 2.0, color: "#3491e2" },
  { x: WIDTH - 190, y: HEIGHT / 2 - ENEMY_HEIGHT / 2, w: ENEMY_WIDTH, h: ENEMY_HEIGHT, vx: 1.7, color: "#3491e2" },
  { x: WIDTH - 130, y: 230, w: ENEMY_WIDTH, h: ENEMY_HEIGHT, vx: -2.2, color: "#3491e2" }
];

// Area Gawang
const goal = {
  x: WIDTH - 36,
  y: HEIGHT / 2 - GOAL_HEIGHT / 2,
  w: GOAL_WIDTH,
  h: GOAL_HEIGHT
};

// --- Kontrol Keyboard ---
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  // Restart:
  if(gameOver && (e.key === "Enter" || e.key === " ")){
    restartGame();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// --- Game Main Loop & Logic ---
function updateGame(){
  // Gerakkan player
  let dx = 0, dy = 0;
  if(keys['ArrowLeft']) dx -= player.speed;
  if(keys['ArrowRight']) dx += player.speed;
  if(keys['ArrowUp']) dy -= player.speed;
  if(keys['ArrowDown']) dy += player.speed;

  player.x += dx; player.y += dy;
  // Boundary cek
  if(player.x < 0) player.x = 0;
  if(player.x > WIDTH - player.size) player.x = WIDTH - player.size;
  if(player.y < 0) player.y = 0;
  if(player.y > HEIGHT - player.size) player.y = HEIGHT - player.size;

  // Bola kena player? (dorong)
  let dist = Math.hypot(ball.x - (player.x + player.size/2), ball.y - (player.y + player.size/2));
  if(dist < BALL_RADIUS + player.size/2 ) {
    // Hitung arah push
    let ang = Math.atan2(ball.y - (player.y + player.size/2), ball.x - (player.x + player.size/2));
    ball.vx += Math.cos(ang) * 1.9; // power dorongan
    ball.vy += Math.sin(ang) * 1.9;
  }

  // Bola physics
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx *= ball.friction;
  ball.vy *= ball.friction;

  // Bola tepian lapangan
  if(ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -0.3; }
  if(ball.x + ball.r > WIDTH) { ball.x = WIDTH - ball.r; ball.vx *= -0.3; }
  if(ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -0.3; }
  if(ball.y + ball.r > HEIGHT) { ball.y = HEIGHT - ball.r; ball.vy *= -0.3; }

  // Tabrakan bola vs Keeper Barca (mantul/pantulan)
  for(let e of barcaKeepers){
    // Cek tabrakan bundar vs persegi
    let closestX = Math.max(e.x, Math.min(ball.x, e.x + e.w));
    let closestY = Math.max(e.y, Math.min(ball.y, e.y + e.h));
    let d = Math.hypot(ball.x - closestX, ball.y - closestY);
    if(d < BALL_RADIUS){
      // Pantulkan bola
      let ang = Math.atan2(ball.y - (e.y+e.h/2), ball.x - (e.x+e.w/2));
      ball.vx = Math.cos(ang) * 4;
      ball.vy = Math.sin(ang) * 4;
    }
  }

  // Keamanan bola stuck/langsung
  if(Math.abs(ball.vx)+Math.abs(ball.vy) < 0.13) {
    ball.vx = 0; ball.vy=0;
  }

  // Gerak keeper ke kiri-kanan
  for(let e of barcaKeepers){
    e.x += e.vx;
    // Batas area jaga
    if(e.x < WIDTH - goal.w - 38 || e.x > WIDTH - ENEMY_WIDTH - 6) e.vx *= -1;
  }

  // Cek KEBERHASILAN GOL
  if(
    ball.x + ball.r > goal.x &&
    ball.y > goal.y && ball.y < goal.y + goal.h &&
    !gameOver
  ){
    win = true;
    gameOver = true;
    statusElt.textContent = "GOOOOLLL!!! Selamat, bola masuk gawang Barca 🎉";
    restartBtn.style.display="inline-block";
  }

  // Cek jika pemain menabrak keeper (kamu kalah!)
  for(let e of barcaKeepers){
    let px = player.x + player.size/2, py = player.y + player.size/2;
    let ex = e.x + e.w/2, ey = e.y + e.h/2;
    let d = Math.hypot(px-ex, py-ey);
    if(d < (player.size/2 + ENEMY_WIDTH/2-5)){
      statusElt.textContent = "Kena barca keepers! Coba lagi.";
      gameOver = true;
      restartBtn.style.display="inline-block";
    }
  }
}

function drawGame(){
  // Lapangan
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // AREA GOAL Gawang Barca
  ctx.save();
  ctx.fillStyle = "#eee";
  ctx.fillRect(goal.x,goal.y,10,goal.h);
  // Jaring gawang depan (transparan, dekor)
  ctx.globalAlpha = 0.31;
  ctx.fillStyle = "#fff";
  ctx.fillRect(goal.x +10, goal.y, goal.w-10,goal.h);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Titik tengah/garis tengah
  ctx.strokeStyle = "#fdfdfd33";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH/2,0);
  ctx.lineTo(WIDTH/2,HEIGHT);
  ctx.stroke();

  ctx.beginPath(); // Lingkaran tengah
  ctx.arc(WIDTH/2, HEIGHT/2,45,0,2*Math.PI);
  ctx.stroke();

  // --- Gambar bola ---
  ctx.beginPath();
  ctx.arc(ball.x,ball.y, BALL_RADIUS, 0, 2*Math.PI);
  ctx.fillStyle = ball.color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#fff";
  ctx.fill();
  ctx.shadowBlur = 0;

  // --- Gambar Player ---
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.strokeStyle="#34562b";
  ctx.strokeRect(player.x, player.y, player.size, player.size);

  // --- Keeper Barca ---
  for(let e of barcaKeepers){
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x,e.y,e.w,e.h);
    ctx.strokeStyle="#0f144a";
    ctx.strokeRect(e.x,e.y,e.w,e.h);
    ctx.fillStyle='#f4314c';
    ctx.font='13px Arial';
    ctx.fillText("FCB",e.x+6,e.y+17);
  }
}

function gameLoop(){
  if(!gameOver){
    updateGame();
  }
  drawGame();
  requestAnimationFrame(gameLoop);
}

// Restart 
function restartGame(){
  // Reset player, bola, keeper
  player.x=90; player.y=HEIGHT/2;
  ball.x=180; ball.y=HEIGHT/2; ball.vx=0; ball.vy=0;

  barcaKeepers[0].x = WIDTH-130; barcaKeepers[0].vx=2;
  barcaKeepers[1].x = WIDTH-190; barcaKeepers[1].vx=1.7;
  barcaKeepers[2].x = WIDTH-130; barcaKeepers[2].vx = -2.2;

  gameOver = false;
  win = false;
  statusElt.textContent = "Gunakan panah untuk bergerak, dorong bola ke gawang Barca!";
  restartBtn.style.display="none";
}

// Tombol klik/kebalikan restart
restartBtn.onclick = restartGame;

// Mulai game loop
requestAnimationFrame(gameLoop);
