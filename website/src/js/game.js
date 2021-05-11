const API_ADRESS = 'http://localhost:8080/api/scoreboard'

const dt = 1 / 60
const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_SPACE = 32;
const KEY_CODE_PAUSE = 80;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 350 * dt;
const LASER_MAX_SPEED = 350 * dt;
const LASER_COOLDOWN = 0.5;

const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 5.0;

const container = document.querySelector(".game");

let player

const hud = {
    level: document.getElementById("level"),
    life: document.getElementById("life"),
    score: document.getElementById("score"),
    time: document.getElementById("time"),
}

const laserElement = document.createElement("img");
laserElement.src = "/src/img/laser-blue-1.png";
laserElement.className = "laser";

const enemyLaserElement = document.createElement("img");
enemyLaserElement.src = "/src/img/laser-red-5.png";
enemyLaserElement.className = "laser";


const levels = [
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
    ],
]

const GAME_STATE = {
    lastTime: Date.now(),
    time: 0,
    leftPressed: false,
    rightPressed: false,
    spacePressed: false,
    playerX: 0,
    playerY: 0,
    playerCooldown: 0,
    playerLifes: 2,
    lasers: [],
    enemies: [],
    enemyLasers: [],
    gameOver: false,
    level: 0,
    score: 0,
    pause: false,
}

function rectsIntersect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

function setPositions(el, x, y) {
    el.style.transform = `translate(${x}px, ${y}px`;
}

function clamp(v, min, max) {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max
    } else {
        return v
    }
}

function rand(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return min + Math.random() * (max - min);
}

function onKeyDown(e) {
    if (e.keyCode === KEY_CODE_LEFT) {
        GAME_STATE.leftPressed = true;
    } else if (e.keyCode === KEY_CODE_RIGHT) {
        GAME_STATE.rightPressed = true;
    } else if (e.keyCode === KEY_CODE_SPACE) {
        GAME_STATE.spacePressed = true;
    } else if (e.keyCode === KEY_CODE_PAUSE) {
        if (!GAME_STATE.pause) {
            document.querySelector(".pause").style.display = "block";
            GAME_STATE.pause = true;
        } else {
            document.querySelector(".pause").style.display = "none";
            GAME_STATE.pause = false;
        }
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


// PLAYER 
function createPlayer() {
    GAME_STATE.playerX = GAME_WIDTH / 2;
    GAME_STATE.playerY = GAME_HEIGHT - 50;
    player = document.createElement("img");
    player.src = "/src/img/player-blue-1.png";
    player.className = "player";
    container.appendChild(player);
    setPositions(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function updatePlayer() {
    if (GAME_STATE.leftPressed) {
        GAME_STATE.playerX -= PLAYER_MAX_SPEED;
    } else if (GAME_STATE.rightPressed) {
        GAME_STATE.playerX += PLAYER_MAX_SPEED;
    }

    GAME_STATE.playerX = clamp(GAME_STATE.playerX, PLAYER_WIDTH, GAME_WIDTH - PLAYER_WIDTH)

    if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
        createLaser(GAME_STATE.playerX, GAME_STATE.playerY);
        GAME_STATE.playerCooldown = LASER_COOLDOWN;
    }
    if (GAME_STATE.playerCooldown > 0) {
        GAME_STATE.playerCooldown -= dt;
    }
    setPositions(player, GAME_STATE.playerX, GAME_STATE.playerY)
}

function destroyPlayer() {
    container.removeChild(player);
    GAME_STATE.gameOver = true;
}


function playerHasWonLevel() {
    return GAME_STATE.enemies.length === 0;
}


// LASER
function createLaser(x, y) {
    let laser = { x, y, element: laserElement.cloneNode(false) };
    container.appendChild(laser.element);
    GAME_STATE.lasers.push(laser);
    setPositions(laser.element, x, y);
    // let audio = new Audio("/src/sound/sfx-laser1.ogg");
    // audio.play();
}

function createEnemyLaser(x, y) {
    let laser = { x, y, element: enemyLaserElement.cloneNode(false) };
    container.appendChild(laser.element);
    GAME_STATE.enemyLasers.push(laser);
    setPositions(laser.element, laser.x, laser.y)
}



function updateLasers() {
    for (let i = 0; i < GAME_STATE.lasers.length; i++) {
        GAME_STATE.lasers[i].y -= LASER_MAX_SPEED;
        if (GAME_STATE.lasers[i].y < 0) {
            destroyLaser(GAME_STATE.lasers[i])
        }
        setPositions(GAME_STATE.lasers[i].element, GAME_STATE.lasers[i].x, GAME_STATE.lasers[i].y)
        let r1 = GAME_STATE.lasers[i].element.getBoundingClientRect();

        for (let j = 0; j < GAME_STATE.enemies.length; j++) {
            if (GAME_STATE.enemies[j].isDead) continue;
            let r2 = GAME_STATE.enemies[j].element.getBoundingClientRect();
            if (rectsIntersect(r1, r2)) {
                destroyEnemy(GAME_STATE.enemies[j]);
                destroyLaser(GAME_STATE.lasers[i]);
                break
            }
        }
    }
    GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}


function updateEnemyLasers() {
    for (let i = 0; i < GAME_STATE.enemyLasers.length; i++) {
        GAME_STATE.enemyLasers[i].y += LASER_MAX_SPEED;
        if (GAME_STATE.enemyLasers[i].y + 30 > GAME_HEIGHT) {
            destroyLaser(GAME_STATE.enemyLasers[i]);
        }
        setPositions(GAME_STATE.enemyLasers[i].element, GAME_STATE.enemyLasers[i].x, GAME_STATE.enemyLasers[i].y);
        let r1 = GAME_STATE.enemyLasers[i].element.getBoundingClientRect();
        let r2 = player.getBoundingClientRect();
        if (rectsIntersect(r1, r2)) {
            if (GAME_STATE.playerLifes === 0) {
                destroyPlayer();
                break;
            }
            GAME_STATE.playerLifes -= 1;
            hud.life.innerHTML = GAME_STATE.playerLifes
            destroyLaser(GAME_STATE.enemyLasers[i])
        }
    }
    GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead)
}

function destroyLaser(laser) {
    container.removeChild(laser.element)
    laser.isDead = true
}


// ENEMY
function createEnemy(x, y) {
    let element = document.createElement("img");
    element.src = "/src/img/enemy-blue-1.png";
    element.className = "enemy";
    container.appendChild(element)
    let enemy = { x, y, cooldown: rand(2.0, ENEMY_COOLDOWN), element }
    GAME_STATE.enemies.push(enemy)
    setPositions(element, x, y)
}

let angle = 0
let radius = 30
function updateEnemy() {
    angle = (angle + Math.PI / 360) % (Math.PI * 2);

    for (let i = 0; i < GAME_STATE.enemies.length; i++) {
        let x = GAME_STATE.enemies[i].x + radius * Math.cos(angle)
        let y = GAME_STATE.enemies[i].y + radius * Math.sin(angle)

        setPositions(GAME_STATE.enemies[i].element, x, y);
        GAME_STATE.enemies[i].cooldown -= dt;
        if (GAME_STATE.enemies[i].cooldown <= 0) {
            createEnemyLaser(x, y);
            GAME_STATE.enemies[i].cooldown = rand(2.0, ENEMY_COOLDOWN);
        }
    }
    GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function destroyEnemy(enemy) {
    container.removeChild(enemy.element);
    enemy.isDead = true;
    GAME_STATE.score += 10;
    hud.score.innerHTML = GAME_STATE.score
}


////////////////////////////////////////////////////////////////////////
function init(level) {
    container.style.display = "block"
    hud.score.innerHTML = GAME_STATE.score
    hud.life.innerHTML = GAME_STATE.playerLifes
    hud.time.innerHTML = 0
    hud.level.innerHTML = level
    GAME_STATE.level = level
    
    for (let i = 0; i < GAME_STATE.lasers.length; i++) {
        destroyLaser(GAME_STATE.lasers[i]);
    }

    createPlayer();
    createEnemies(level)
}


function createEnemies(level) {
    let enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
    let pattern = levels[level - 1]
    for (let i = 0; i < pattern.length; i += 1) {
        let y = ENEMY_VERTICAL_PADDING + i * ENEMY_VERTICAL_SPACING;
        for (let j = 0; j < pattern[0].length; j += 1) {
            let x = j * enemySpacing + ENEMY_HORIZONTAL_PADDING;
            if (pattern[i][j] === 1) {
                createEnemy(x, y);
            }
        }
    }
}


function reset() {
    if (document.querySelector(".player") !== null) {
        destroyPlayer(document.querySelector(".player"))
    }

    for (let i = 0; i < GAME_STATE.enemies.length; i++) {
        destroyEnemy(GAME_STATE.enemies[i]);
    }

    for (let i = 0; i < GAME_STATE.lasers.length; i++) {
        destroyLaser(GAME_STATE.lasers[i]);
    }

    for (let i = 0; i < GAME_STATE.enemyLasers.length; i++) {
        destroyLaser(GAME_STATE.enemyLasers[i]);
    }

    GAME_STATE.lastTime = Date.now();
    GAME_STATE.time = 0;
    GAME_STATE.leftPressed = false;
    GAME_STATE.rightPressed = false;
    GAME_STATE.spacePressed = false;
    GAME_STATE.playerX = 0;
    GAME_STATE.playerY = 0;
    GAME_STATE.playerCooldown = 0;
    GAME_STATE.playerLifes = 2;
    GAME_STATE.lasers = [];
    GAME_STATE.enemies = [];
    GAME_STATE.enemyLasers = [];
    GAME_STATE.gameOver = false;
    GAME_STATE.score = 0;
    GAME_STATE.pause = false;
    GAME_STATE.level = 0;
}

function update() {
    if (!GAME_STATE.pause) {
        GAME_STATE.time += dt
        hud.time.innerHTML = formatTime(GAME_STATE.time)

        updatePlayer();
        updateLasers();
        updateEnemy();
        updateEnemyLasers();
    }

    if (GAME_STATE.gameOver) {
        lose()
        return
    }


    if (playerHasWonLevel()) {
        if (GAME_STATE.level === levels.length) {
            win()
            return
        }

        destroyPlayer()
        GAME_STATE.gameOver = false
        GAME_STATE.level += 1

        init(GAME_STATE.level)
    }

    window.requestAnimationFrame(update);
}


/////////////////////////////////////////////////////////////
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

///////////////////////// Main menu and buttons
function start() {
    reset()
    clearDisplay();
    document.querySelector(".main-menu").style.display = "block";
}

function startGame() {
    reset();
    clearDisplay();
    init(1)
    update()
}

Array.from(document.getElementsByClassName("start-game")).forEach((el) => el.addEventListener("click", (e) => {
    startGame()
}))



document.querySelector(".scoreboard").addEventListener("click", (e) => {
    reset();
    clearDisplay();
    document.querySelector(".scoreboard-display").style.display = "block";
    getScoreBoard(0)
})

///////////////////////// Game pause
document.querySelector(".continue").addEventListener("click", (e) => {
    clearDisplay();
    GAME_STATE.pause = false;
})


document.querySelector(".back-to-menu-from-game").addEventListener("click", (e) => {
    start()
})

////////////////////////// Score
document.querySelector(".submit").addEventListener("click", (e) => {
    postScore()
})

////////////////////////// Scoreboard

document.querySelector(".back-to-menu-from-scoreboard").addEventListener("click", (e) => {
    start()
    const table = document.querySelector(".scoreboard-table")
    table.innerHTML = '<tr><th>' + 'Rank' + '</th><th>' + 'Name' + '</th><th>' + 'Score' + '</th><td>' + 'Time' + '</td></tr>'
})

document.querySelector(".prev-page").addEventListener("click", (e) => {
    let el = document.querySelector("#page-num")
    let pageNum = parseInt(el.textContent) - 1
    if (pageNum > 0) {
        el.innerHTML = pageNum

        getScoreBoard((pageNum - 1) * 5)
    }
})

document.querySelector(".next-page").addEventListener("click", (e) => {
    let el = document.querySelector("#page-num")
    let pageNum = parseInt(el.textContent) + 1

    if (pageNum <= 50) {
        el.innerHTML = pageNum
        getScoreBoard((pageNum - 1) * 5)
    }
})

/////////////////////////// Win
function win() {
    clearDisplay();
    container.style.display = "block"
    document.querySelector(".congratulations").style.display = "block";
    document.querySelector(".name-input").style.display = "block";
    document.querySelector(".name-input").style.background = "#c7a526";
}


document.querySelector(".back-to-menu-from-win").addEventListener("click", (e) => {
    start()
})

/////////////////////////// Lose
function lose() {
    clearDisplay();
    container.style.display = "block"
    document.querySelector(".game-over").style.display = "block";
    document.querySelector(".name-input").style.display = "block";
    document.querySelector(".name-input").style.background = "#6b1818";
}


document.querySelector(".back-to-menu-from-lose").addEventListener("click", (e) => {
    start()
})

function clearDisplay() {
    container.style.display = "none"
    document.querySelector(".main-menu").style.display = "none";
    document.querySelector(".pause").style.display = "none";
    document.querySelector(".scoreboard-display").style.display = "none";
    document.querySelector(".game-over").style.display = "none";
    document.querySelector(".congratulations").style.display = "none";
    document.querySelector(".name-input").style.display = "none";
}

/////////////////////////// get add score
function postScore() {
    playerName = document.querySelector('[name="player-name"]').value
    if (playerName == "") {
        alert("Name can not be empty");
        return;
    }

    var score = {
        player: playerName,
        score: GAME_STATE.score,
        time: Math.floor(GAME_STATE.time),
    };


    fetch(API_ADRESS, {
        method: 'post',
        body: JSON.stringify(score)
    }).then(res => console.log(res))

    reset()
    clearDisplay();
    document.querySelector(".scoreboard-display").style.display = "block";
    getScoreBoard(0, playerName)
}

function getScoreBoard(skip, playerName) {
    fetch(API_ADRESS, {
        method: 'get'
    }).then(res => res.json())
        .then(res => parseScores(res, skip, playerName));
}

function parseScores(res, skip, playerName) {
    let table = document.querySelector(".scoreboard-table")
    let tableContent = "<tr><th>Rank</th><th>Name</th><th>Score</th><th>Time</th></tr>"

    for (let i = 0; i < res.length; i++) {
        if (playerName == res[i].player) {
            let rank = i + 1
            let percentage = ((rank / res.length) * 100).toFixed(2)
            let topMessage = document.querySelector(".top-message")
            topMessage.innerHTML = `Congrats ${playerName}, you are in the top ${percentage}%, in the ${rank} position`
            break
        }
    }

    for (let i = skip; i < skip + 5; i++) {
        if (i >= res.length) {
            break
        }

        let rank = i + 1
        let time = formatTime(res[i].time)

        tableContent += '<tr><td>' +
            rank + '</td><td>' +
            res[i].player + '</td><td>' +
            res[i].score + '</td><td>' +
            time + '</td></tr>'
    }

    table.innerHTML = tableContent
}

function formatTime(seconds) {
    return [
        parseInt(seconds / 60),
        parseInt(seconds % 60)
    ]
        .join(":")
        .replace(/\b(\d)\b/g, "0$1")
}

start()