const API_ADRESS = 'http://localhost:8080/api/scoreboard'

const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_SPACE = 32;
const KEY_CODE_PAUSE = 80;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 400;
const LASER_MAX_SPEED = 350;
const LASER_COOLDOWN = 0.5;

const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 5.0;

const container = document.querySelector(".game");


const levels = [
    [
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
]


// const levels = [
//     [
//         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
//     ],
//     [
//         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
//         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
//     ],
//     [
//         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
//         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
//         [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
//     ],
// ]

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
            GAME_STATE.pause = true;
        } else {
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
    const player = document.createElement("img");
    player.src = "/src/img/player-blue-1.png";
    player.className = "player";
    container.appendChild(player);
    setPositions(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function updatePlayer(dt) {
    if (GAME_STATE.leftPressed) {
        GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
    } else if (GAME_STATE.rightPressed) {
        GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
    }

    GAME_STATE.playerX = clamp(GAME_STATE.playerX, PLAYER_WIDTH, GAME_WIDTH - PLAYER_WIDTH)

    if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
        createLaser(GAME_STATE.playerX, GAME_STATE.playerY);
        GAME_STATE.playerCooldown = LASER_COOLDOWN;
    }
    if (GAME_STATE.playerCooldown > 0) {
        GAME_STATE.playerCooldown -= dt;
    }
    const player = document.querySelector(".player")
    setPositions(player, GAME_STATE.playerX, GAME_STATE.playerY)
}

function destroyPlayer(player) {
    container.removeChild(player);
    GAME_STATE.gameOver = true;
}


function playerHasWonLevel() {
    return GAME_STATE.enemies.length === 0;
}


// LASER
function createLaser(x, y) {
    const element = document.createElement("img");
    element.src = "/src/img/laser-blue-1.png";
    element.className = "laser";
    container.appendChild(element);
    const laser = { x, y, element };
    GAME_STATE.lasers.push(laser);
    setPositions(element, x, y);
    const audio = new Audio("/src/sound/sfx-laser1.ogg");
    audio.play();
}


function updateLasers(dt) {
    const lasers = GAME_STATE.lasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y -= dt * LASER_MAX_SPEED;
        if (laser.y < 0) {
            destroyLaser(laser)
        }
        setPositions(laser.element, laser.x, laser.y)
        const r1 = laser.element.getBoundingClientRect();
        const enemies = GAME_STATE.enemies;
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.isDead) continue;
            const r2 = enemy.element.getBoundingClientRect();
            if (rectsIntersect(r1, r2)) {
                destroyEnemy(enemy);
                destroyLaser(laser)
            }
        }
    }

    GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}


////////////// ENEMY LASER
function createEnemyLaser(x, y) {
    const element = document.createElement("img");
    element.src = "/src/img/laser-red-5.png";
    element.className = "enemy-laser";
    container.appendChild(element);
    const laser = { x, y, element };
    GAME_STATE.enemyLasers.push(laser);
    setPositions(element)
}

function updateEnemyLasers(dt) {
    const lasers = GAME_STATE.enemyLasers;
    for (let i = 0; i < lasers.length; i++) {
        laser = lasers[i];
        laser.y += dt * LASER_MAX_SPEED;
        if (laser.y + 30 > GAME_HEIGHT) {
            destroyLaser(laser);
        }
        setPositions(laser.element, laser.x, laser.y);
        const r1 = laser.element.getBoundingClientRect();
        const player = document.querySelector(".player");
        const r2 = player.getBoundingClientRect();
        if (rectsIntersect(r1, r2)) {
            if (GAME_STATE.playerLifes === 0) {
                destroyPlayer(player);
                break;
            }
            GAME_STATE.playerLifes -= 1;
            document.getElementById("life").innerHTML = GAME_STATE.playerLifes
            destroyLaser(laser)
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
    const element = document.createElement("img");
    element.src = "/src/img/enemy-blue-1.png";
    element.className = "enemy";
    container.appendChild(element)
    const enemy = { x, y, cooldown: rand(2.0, ENEMY_COOLDOWN), element }
    GAME_STATE.enemies.push(enemy)
    setPositions(element, x, y)
}

let angle = 0
let radius = 30
function updateEnemy(dt) {
    const enemies = GAME_STATE.enemies
    angle = (angle + Math.PI / 360) % (Math.PI * 2);

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const x = enemy.x + radius * Math.cos(angle)
        const y = enemy.y + radius * Math.sin(angle)
        setPositions(enemy.element, x, y);
        enemy.cooldown -= dt;
        if (enemy.cooldown <= 0) {
            createEnemyLaser(x, y);
            enemy.cooldown = rand(2.0, ENEMY_COOLDOWN);
        }

    }
    GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function destroyEnemy(enemy) {
    container.removeChild(enemy.element);
    enemy.isDead = true;
    GAME_STATE.score += 10;
    document.getElementById("score").innerHTML = GAME_STATE.score
}


////////////////////////////////////////////////////////////////////////
function init(level) {
    GAME_STATE.level = level
    document.getElementById("score").innerHTML = GAME_STATE.score
    document.getElementById("life").innerHTML = GAME_STATE.playerLifes
    document.getElementById("time").innerHTML = 0
    document.getElementById("level").innerHTML = level

    const lasers = GAME_STATE.lasers;
    for (let i = 0; i < lasers.length; i++) {
        destroyLaser(lasers[i]);
    }

    createPlayer();
    createEnemies(level)
}


function createEnemies(level) {

    const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
    const pattern = levels[level - 1]
    for (let i = 0; i < pattern.length; i += 1) {
        const y = ENEMY_VERTICAL_PADDING + i * ENEMY_VERTICAL_SPACING;
        for (let j = 0; j < pattern[0].length; j += 1) {
            const x = j * enemySpacing + ENEMY_HORIZONTAL_PADDING;
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
    if (GAME_STATE.gameOver) {
        lose()
        return
    }

    if (playerHasWonLevel()) {
        if (GAME_STATE.level === levels.length) {
            win()
            return
        }

        document.querySelector(".back-to-menu-from-game").addEventListener("click", (e) => {
            start()
        })

        const player = document.querySelector(".player")
        destroyPlayer(player)
        GAME_STATE.gameOver = false
        GAME_STATE.level += 1
        level.textContent = GAME_STATE.level
        init(GAME_STATE.level)
    }


    if (!GAME_STATE.pause) {
        const currentTime = Date.now();
        const dt = (currentTime - GAME_STATE.lastTime) / 1000;
        GAME_STATE.lastTime = currentTime;
        GAME_STATE.time += 1 / 60

        document.getElementById("time").innerHTML = formatTime(GAME_STATE.time)

        updatePlayer(dt);
        updateLasers(dt);
        updateEnemy(dt);
        updateEnemyLasers(dt);
        document.querySelector(".pause").style.display = "none";
    } else {
        document.querySelector(".pause").style.display = "block";
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
    getScoreBoard()
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

document.querySelector(".pagination_1").addEventListener("click", (e) => {
    const table = document.querySelector(".scoreboard-table")
    table.innerHTML = '<tr><th>' + 'Rank' + '</th><th>' + 'Name' + '</th><th>' + 'Score' + '</th><td>' + 'Time' + '</td></tr>'
    getScoreBoard(skip = 0)
})
document.querySelector(".pagination_2").addEventListener("click", (e) => {
    const table = document.querySelector(".scoreboard-table")
    table.innerHTML = '<tr><th>' + 'Rank' + '</th><th>' + 'Name' + '</th><th>' + 'Score' + '</th><td>' + 'Time' + '</td></tr>'
    getScoreBoard(skip = 10)
})
document.querySelector(".pagination_3").addEventListener("click", (e) => {
    const table = document.querySelector(".scoreboard-table")
    table.innerHTML = '<tr><th>' + 'Rank' + '</th><th>' + 'Name' + '</th><th>' + 'Score' + '</th><td>' + 'Time' + '</td></tr>'
    getScoreBoard(skip = 20)
})
document.querySelector(".pagination_4").addEventListener("click", (e) => {
    const table = document.querySelector(".scoreboard-table")
    table.innerHTML = '<tr><th>' + 'Rank' + '</th><th>' + 'Name' + '</th><th>' + 'Score' + '</th><td>' + 'Time' + '</td></tr>'
    getScoreBoard(skip = 30)
})
document.querySelector(".pagination_5").addEventListener("click", (e) => {
    const table = document.querySelector(".scoreboard-table")
    table.innerHTML = '<tr><th>' + 'Rank' + '</th><th>' + 'Name' + '</th><th>' + 'Score' + '</th><td>' + 'Time' + '</td></tr>'
    getScoreBoard(skip = 40)
})
/////////////////////////// Win
function win() {
    clearDisplay();
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
    document.querySelector(".game-over").style.display = "block";
    document.querySelector(".name-input").style.display = "block";
    document.querySelector(".name-input").style.background = "#6b1818";
}


document.querySelector(".back-to-menu-from-lose").addEventListener("click", (e) => {
    start()
})

function clearDisplay() {
    document.querySelector(".main-menu").style.display = "none";
    document.querySelector(".pause").style.display = "none";
    document.querySelector(".scoreboard-display").style.display = "none";
    document.querySelector(".game-over").style.display = "none";
    document.querySelector(".congratulations").style.display = "none";
    document.querySelector(".name-input").style.display = "none";
}

/////////////////////////// get add score
function postScore() {
    player = document.querySelector('[name="player-name"]').value
    if (player == "") {
        alert("Name can not be empty");
        return;
    }

    var score = {
        player: player,
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
    getScoreBoard(0, player)
}

function getScoreBoard(skip, player) {
    fetch(API_ADRESS, {
        method: 'get'
    }).then(res => res.json())
        .then(res => parseScores(res, skip, player));
}

function parseScores(res, skip, player) {
    const table = document.querySelector(".scoreboard-table")
    let tableContent = table.innerHTML

    for (let i = 0; i < res.length; i++) {
        if (player == res[i].player) {
            let rank = i + 1
            let percentage = ((rank / res.length) * 100).toFixed(2)
            let topMessage = document.querySelector(".top-message")
            topMessage.innerHTML = `Congrats ${player}, you are in the top ${percentage}%, in the ${rank} position`
            break
        }
    }

    for (let i = skip; i < skip + 10; i++) {
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