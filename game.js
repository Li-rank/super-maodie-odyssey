const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const bgMusic = document.getElementById("bgMusic");
bgMusic.loop = true;
const timerDisplay = document.getElementById("timer");

const imgIdle = new Image();
imgIdle.src = "Player1.GIF";
const imgRun = new Image();
imgRun.src = "Player2.GIF";
const imgObstacle = new Image();
imgObstacle.src = "Obstacle.GIF";
const bgImage = new Image();
bgImage.src = "sky.png";
bgImage.onload = () => {
  console.log("Background loaded");
};

const gravity = 0.5;
const jumpStrength = -12;
const moveSpeed = 4;
const maxJumpCount = 2; // 二段跳机制
let currentJumpCount = 0;
let gameStarted = false;
let gameOver = false;
let coins = [];//金币收集与生命
let coinCount = 0;
let lives = 1;
let cameraOffsetX = 0;
let startTime = 0;
let elapsedTime = 0;
let firstGeneratedX = 0;
let lastFrameTime = performance.now();
document.getElementById("hud").style.display = "none";

const player = {
  x: 100,
  y: 0,
  width: 50,
  height: 50,
  vx: 0,
  vy: 0,
  onGround: false,
  direction: 1,
  invincible: false // 无敌状态
};

let keys = {};
let obstacles = [];
let lastGeneratedX = 600;
let lastCoinX = 600;
let firstCoinX = player.x - 100;

function startGame() {// 开始游戏
  gameStarted = true;
  gameOver = false;
  startTime = performance.now();
  startButton.style.display = "none";
  document.getElementById("introPanel").classList.add("hidden-keep-space");
  document.getElementById("hud").style.display = "flex";

  player.y = canvas.height - 100;// 初始位置
  player.vx = 0;
  player.vy = 0;
  player.x = 100;
  cameraOffsetX = 0;

  obstacles = [];// 初始化
  coins = [];
  coinCount = 0;
  lives = 1;
  lastGeneratedX = 600;
  firstGeneratedX = player.x - 100;
  lastCoinX = player.x + 300;
  firstCoinX = player.x - 300;

  bgMusic.currentTime = 0;// 重置音乐
  bgMusic.play();
  requestAnimationFrame(gameLoop);
}

function updateTimer() {// 更新计时器
  const now = performance.now();
  elapsedTime = (now - startTime) / 1000;
  timerDisplay.textContent = `Time: ${elapsedTime.toFixed(1)}s`;
}

function updatePlayer(deltaTime) {// 更新玩家状态
  if (keys["a"] || keys["A"]) {
    player.vx = -moveSpeed;
    player.direction = -1;
  } else if (keys["d"] || keys["D"]) {
    player.vx = moveSpeed;
    player.direction = 1;
  } else {
    player.vx = 0;
  }

  player.vy += gravity * deltaTime;
  player.x += player.vx * deltaTime;
  player.y += player.vy * deltaTime;

  updateCameraOffset();

  if (player.y + player.height > canvas.height - 50) {// 检测玩家是否在地面上
    player.y = canvas.height - 50 - player.height;
    player.vy = 0;
    player.onGround = true;
    currentJumpCount = 0;
  } else {
    player.onGround = false;
  }

}
function updateCameraOffset() { // 更新镜头偏移量
  const leftMargin = 300;
  const rightMargin = 300;

  if (player.x - cameraOffsetX < leftMargin) {// 如果玩家接近左边界
    cameraOffsetX = player.x - leftMargin;// 更新镜头位置
  }
  if (player.x - cameraOffsetX > canvas.width - rightMargin) {// 如果玩家接近右边界
    cameraOffsetX = player.x - (canvas.width - rightMargin);// 更新镜头位置
  }
}

function updateObstacles(deltaTime) {// 更新障碍物
  for (let obs of obstacles) {
    obs.x += obs.vx * deltaTime;

    const leftBound = cameraOffsetX - 300;
    const rightBound = cameraOffsetX + canvas.width + 300;
    if (obs.x < leftBound || obs.x > rightBound) {
      obs.vx *= -1;
    }

    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    const hb = obs.hitbox || { offsetX: 0, offsetY: 0, width: obs.width, height: obs.height };

    if (// 检测玩家与障碍物碰撞
      px < obs.x + hb.offsetX + hb.width &&
      px + pw > obs.x + hb.offsetX &&
      py < obs.y + hb.offsetY + hb.height &&
      py + ph > obs.y + hb.offsetY
    ) {
      if (!player.invincible) {
        lives--;
        updateHUD();

        if (lives <= 0) {
          gameOver = true;
          bgMusic.pause();
        } else {
          player.vy = -15; // 向上反弹
          player.invincible = true;
          setTimeout(() => {
            player.invincible = false;
          }, 1000); // 1 秒无敌帧

        }
      }
    }
  }
  function updateHUD() {// 更新HUD显示
    document.getElementById("lives").textContent = `Lives: ${lives}`;
  }
  // 障碍生成
  while (lastGeneratedX < cameraOffsetX + 3000 || firstGeneratedX > cameraOffsetX - 3000) {
    const minGap = 300, maxGap = 400;// 控制障碍物生成间隔
    const direction = Math.random() < 0.5 ? "right" : "left";

    let x;
    if (direction === "right" && lastGeneratedX < cameraOffsetX + 3000) {
      x = lastGeneratedX + minGap + Math.random() * (maxGap - minGap);
      lastGeneratedX = x;
    } else if (direction === "left" && firstGeneratedX > cameraOffsetX - 3000) {
      x = firstGeneratedX - (minGap + Math.random() * (maxGap - minGap));
      firstGeneratedX = x;
    } else {
      continue; 
    }

    obstacles.push({// 创建障碍物
      x,
      y: canvas.height - 90,
      width: 97,
      height: 50,
      vx: Math.random() < 0.5 ? 2 : -2,
      hitbox: {// 碰撞盒，减小碰撞体积以避免图片边缘造成玩家意外碰撞
        offsetX: 10,
        offsetY: 5,
        width: 67,
        height: 35 // 减小碰撞体积
      }
    });
  }
}
function updateCoins(deltaTime) {// 更新金币状态
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.rotate += 0.1;

    if (
      player.x < coin.x + coin.size &&
      player.x + player.width > coin.x &&
      player.y < coin.y + coin.size &&
      player.y + player.height > coin.y
    ) {
      coins.splice(i, 1);
      coinCount++;
      if (coinCount % 3 === 0) lives++;
    }
  }

  // 同步显示
  document.getElementById("coins").textContent = `Coins: ${coinCount}`;
  document.getElementById("lives").textContent = `Lives: ${lives}`;

  // 生成金币
  while (lastCoinX < cameraOffsetX + 2000 || firstCoinX > cameraOffsetX - 2000) {// 控制金币生成间隔
    const minGap = 800, maxGap = 1500;
    const direction = Math.random() < 0.5 ? "right" : "left";

    let x;
    if (direction === "right" && lastCoinX < cameraOffsetX + 2000) {
      x = lastCoinX + minGap + Math.random() * (maxGap - minGap);
      lastCoinX = x;
    } else if (direction === "left" && firstCoinX > cameraOffsetX - 2000) {
      x = firstCoinX - (minGap + Math.random() * (maxGap - minGap));
      firstCoinX = x;
    } else {
      continue;
    }

    coins.push({ x, y: canvas.height - 120, size: 30, rotate: 0 });
  }
}

function drawBackground() {// 绘制背景
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bgWidth = bgImage.width || 1920;
  const bgHeight = canvas.height;
  const scrollX = cameraOffsetX * 0.5;
  const offset = scrollX % bgWidth;

  let startX = -offset;
  while (startX > 0) {
    startX -= bgWidth;
  }

  for (let x = startX; x < canvas.width; x += bgWidth) {
    ctx.drawImage(bgImage, x, 0, bgWidth, bgHeight);
  }
}


function draw() { // 绘制游戏画面
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  for (let coin of coins) {// 绘制金币
    if (!coin.collected) {
      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(coin.x - cameraOffsetX, coin.y, coin.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 显示金币数与生命数
  ctx.fillStyle = "#fff";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Coins: ${coinCount}`, 20, 30);
  ctx.fillText(`Lives: ${lives}`, 20, 60);

  ctx.fillStyle = "#654321";
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

  for (let obs of obstacles) {// 绘制障碍物
    ctx.save();
    const drawX = obs.x - cameraOffsetX;
    if (obs.vx > 0) {
      ctx.translate(drawX + obs.width, obs.y);
      ctx.scale(-1, 1);
      ctx.drawImage(imgObstacle, 0, 0, obs.width, obs.height);
    } else {
      ctx.drawImage(imgObstacle, drawX, obs.y, obs.width, obs.height);
    }
    ctx.restore();
  }

  ctx.save();
  if (player.direction === -1) { // 如果玩家朝左
    ctx.translate(player.x - cameraOffsetX + player.width, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(player.vx === 0 ? imgIdle : imgRun, 0, 0, player.width, player.height);
  } else {// 如果玩家朝右
    ctx.drawImage(
      player.vx === 0 ? imgIdle : imgRun,
      player.x - cameraOffsetX,
      player.y,
      player.width,
      player.height
    );
  }
  ctx.restore();

  if (gameOver) {// 游戏结束时绘制
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "40px sans-serif";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
  }
}

function gameLoop() {// 游戏主循环
  const now = performance.now();
  const deltaTime = (now - lastFrameTime) / 16.67;// 以60FPS为基准帧，标准帧时间为16.67ms
  lastFrameTime = now;
  if (!gameOver) {
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    updateCoins(deltaTime);
    updateTimer();
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    document.getElementById("hud").style.display = "none";

    const introPanel = document.getElementById("introPanel");
    introPanel.classList.remove("hidden", "hidden-keep-space");
    introPanel.innerHTML = `
      <h2>🎮 游戏结束</h2>
      <p>你坚持了 <strong>${elapsedTime.toFixed(1)}</strong> 秒</p>
      <p>收集金币：<strong>${coinCount}</strong> 枚</p>
      <button id="restartButton">再来一次</button>
    `;
    document.getElementById("restartButton").addEventListener("click", () => {
      window.location.reload();
    });
  }
}

startButton.addEventListener("click", startGame);

window.addEventListener("keydown", e => {// 处理按键按下
  keys[e.key] = true;
  if ((e.key === "w" || e.key === "W") && currentJumpCount < maxJumpCount) {
    player.vy = jumpStrength;
    currentJumpCount++;
  }
});

window.addEventListener("keyup", e => {// 处理按键释放
  keys[e.key] = false;
});

window.onload = () => {// 页面加载时绘制背景
  drawBackground();
};
