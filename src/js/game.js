const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_SPACE = 32;

const enemyPattern = {
  1: [[0, 1, 0, 1, 0, 1, 0, 1, 0, 1 ],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0 ],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1 ]],
  2: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0 ],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0 ]],
  3: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]],
}


const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 600.0;
const LASER_MAX_SPEED = 300.0;
const LASER_COOLDOWN = 0.5;

const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 5.0;

let GAME_STATE = {
  lastTime: Date.now(),
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  playerX: 0,
  playerY: 0,
  playerCooldown: 0,
  lasers: [],
  enemies: [],
  enemyLasers: [],
  playerLives: 2,
  gameOver: false,
  levelSets: [50, 0],
  level: 1
};

const TimerState = {
  currentTime: 0,
  lastUpdate: 0
}

gameScore = 0
score = document.querySelector('.score')
lives = document.querySelector('.lives')
level = document.querySelector('.level')
timer = document.querySelector(".timer")

let isPaused = false
window.addEventListener('keyup', (e) => {
  if (!isPaused && e.keyCode == 80) {
    isPaused = true
  } else if (isPaused && e.keyCode == 80) {
    isPaused = false
  }

})

function isRectsConntact(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function setPosition(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function checkBorder(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function randomCooldown(min, max) {
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min);
}

function createPlayer(container) {
  GAME_STATE.playerX = GAME_WIDTH / 2;
  GAME_STATE.playerY = GAME_HEIGHT - 50;
  const player = document.createElement("img");
  player.src = "images/player.png";
  player.className = "player";
  container.appendChild(player);
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function destroyPlayer(container, player) {
  container.removeChild(player);
  GAME_STATE.gameOver = true;
}

function animatePlayer(dt, container) {
  if (GAME_STATE.leftPressed) {
    GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.rightPressed) {
    GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
  }

  GAME_STATE.playerX = checkBorder(
    GAME_STATE.playerX,
    PLAYER_WIDTH,
    GAME_WIDTH - PLAYER_WIDTH
  );

  if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
    createLaser(container, GAME_STATE.playerX, GAME_STATE.playerY);
    GAME_STATE.playerCooldown = LASER_COOLDOWN;
  }
  if (GAME_STATE.playerCooldown > 0) {
    GAME_STATE.playerCooldown -= dt;
  }

  const player = document.querySelector(".player");
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function createLaser(container, x, y) {
  const element = document.createElement("img");
  element.src = "images/player-laser.png";
  element.className = "laser";
  container.appendChild(element);
  const laser = { x, y, element };
  GAME_STATE.lasers.push(laser);
  const audio = new Audio("sound/sfx-laser1.ogg");
  audio.play();
  setPosition(element, x, y);
}

function animateLasers(dt, container) {
  const lasers = GAME_STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y -= dt * LASER_MAX_SPEED;
    if (laser.y - 20 < 0) {
      destroyLaser(container, laser);
    }
    setPosition(laser.element, laser.x, laser.y);
    const r1 = laser.element.getBoundingClientRect();
    const enemies = GAME_STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      if (enemy.isDead) continue;
      const r2 = enemy.element.getBoundingClientRect();
      if (isRectsConntact(r1, r2)) {
        destroyEnemy(container, enemy);
        destroyLaser(container, laser);
        break;
      }
    }
  }
  GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}

function destroyLaser(container, laser) {
  container.removeChild(laser.element);
  laser.isDead = true;
}

function createEnemy(container, x, y) {
  const element = document.createElement("img");
  element.src = "images/" + GAME_STATE.level +"_lvl_enemy.png";
  element.className = "enemy";
  container.appendChild(element);
  const enemy = {
    x,
    y,
    cooldown: randomCooldown(0.5, ENEMY_COOLDOWN),
    element
  };
  GAME_STATE.enemies.push(enemy);
  setPosition(element, x, y);
}

function animateEnemies(dt, container) {
  const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * GAME_STATE.levelSets[0];
  const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * GAME_STATE.levelSets[1];

  const enemies = GAME_STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const x = enemy.x + dx;
    const y = enemy.y + dy;
    setPosition(enemy.element, x, y);
    enemy.cooldown -= dt;
    if (enemy.cooldown <= 0) {
      createEnemyLaser(container, x, y);
      enemy.cooldown = ENEMY_COOLDOWN;
    }
  }
  GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function destroyEnemy(container, enemy) {
  container.removeChild(enemy.element);
  enemy.isDead = true;
  gameScore += 10
  score.textContent = gameScore
}

function createEnemyLaser(container, x, y) {
  const element = document.createElement("img");
  element.src = "images/enemy-laser.png";
  element.className = "enemy-laser";
  container.appendChild(element);
  const laser = { x, y, element };
  GAME_STATE.enemyLasers.push(laser);
  setPosition(element, x, y);
}

function animateEnemyLasers(dt, container) {
  const lasers = GAME_STATE.enemyLasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y += dt * LASER_MAX_SPEED;
    if (laser.y > GAME_HEIGHT - 20) {
      destroyLaser(container, laser);
    }
    setPosition(laser.element, laser.x, laser.y);
    const r1 = laser.element.getBoundingClientRect();
    const player = document.querySelector(".player");
    const r2 = player.getBoundingClientRect();
    if (isRectsConntact(r1, r2)) {
      if (GAME_STATE.playerLives === 0){
        destroyPlayer(container, player);
        break;
      }
      GAME_STATE.playerLives -= 1
      lives.textContent = GAME_STATE.playerLives
      destroyLaser(container, laser)
    }
  }
  GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
}

function init(level) {
  const container = document.querySelector(".game");
  const lasers = GAME_STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    destroyLaser(container, lasers[i]);
  }
  createPlayer(container);
  createEnemies(level)

}

function createEnemies(level){
  const container = document.querySelector(".game");
  const enemySpacing =
    (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
  const pattern = enemyPattern[level]
  for (let i = 0; i < pattern.length; i += 1){
    const y = ENEMY_VERTICAL_PADDING + i * ENEMY_VERTICAL_SPACING;
    for (let j = 0; j < pattern[0].length; j += 1){
      const x = j * enemySpacing + ENEMY_HORIZONTAL_PADDING;
      if (pattern[i][j] === 1){
          createEnemy(container, x, y);
      }
    }
  }
}

function playerHasWonLevel() {
  return GAME_STATE.enemies.length === 0;
}

function animate(e) {
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;
  const container = document.querySelector(".game");
  startTimer()
  
  if (GAME_STATE.gameOver) {
    document.querySelector(".game-over").style.display = "block";
    return;
  }
  
  if (playerHasWonLevel() && GAME_STATE.level == 3) {
    document.querySelector(".congratulations").style.display = "block";
    return;
  }

  if (playerHasWonLevel()){
    const player = document.querySelector(".player")
    destroyPlayer(container, player)
    GAME_STATE.gameOver = false
    GAME_STATE.levelSets = [50, 10]
    GAME_STATE.level += 1
    level.textContent = GAME_STATE.level
    init(GAME_STATE.level)
  }
  
  
  if (!isPaused) {
    animatePlayer(dt, container);
    animateLasers(dt, container);
    animateEnemies(dt, container);
    animateEnemyLasers(dt, container);
  }
  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(animate);
}

function onKeyDown(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = true;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = true;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = true;
  }
}

function onKeyUp(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = false;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = false;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = false;
  }
}

function timeParser(time){
    gameTime = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]) + 1
    minutes = ((Math.floor(gameTime / 60) < 10) ? "0" + Math.floor(gameTime / 60) :  Math.floor(gameTime / 60))
    seconds = ((gameTime % 60 < 10) ? "0" + gameTime % 60 : gameTime % 60 )
    return minutes + ":" + seconds
}

function startTimer(){
  TimerState.currentTime = Date.now()
    if (isPaused===false && TimerState.currentTime - TimerState.lastUpdate >= 1000){
        timer.innerHTML = timeParser(timer.innerHTML)
        TimerState.lastUpdate = Date.now()
    }
}

init(1);
animate()
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);