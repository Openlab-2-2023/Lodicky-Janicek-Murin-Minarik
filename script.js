

let playerGrid = document.getElementById("playerGrid");
let pcGrid = document.getElementById("pcGrid");
let player2Grid = document.getElementById("player2Grid");
let startGameButton = document.getElementById("startGame");
let restartGameButton = document.getElementById("restartGame");
let scoreBoard = document.getElementById("score");
let playerShips = [];
let computerShips = [];
let gameStarted = false;
let shipSizes = [2, 3, 3, 4, 4];
let playerTurn = true;
let score = 0;
let placingShipIndex = null;

function createGrid(gridElement, isPlayer) {
    gridElement.innerHTML = "";
    for (let i = 0; i < 100; i++) {
        let square = document.createElement("div");
        square.dataset.index = i;
        if (!isPlayer) {
            square.addEventListener("click", () => playerShoot(square));
        } else {
            square.addEventListener("click", () => placeShip(square));
        }
        gridElement.appendChild(square);
    }
}

function createShipSelection() {
    player2Grid.innerHTML = "";
    shipSizes.forEach((size, index) => {
        let ship = document.createElement("div");
        ship.classList.add("ship-selection");
        ship.dataset.size = size;
        ship.dataset.index = index;
        for (let i = 0; i < size; i++) {
            let cell = document.createElement("div");
            cell.classList.add("ship-cell");
            cell.style.backgroundColor = "green";
            ship.appendChild(cell);
        }
        ship.addEventListener("click", () => selectShip(index));
        player2Grid.appendChild(ship);
    });
}

function selectShip(index) {
    placingShipIndex = index;
}

function placeShip(square) {
    if (gameStarted || placingShipIndex === null) return;
    let index = parseInt(square.dataset.index);
    let size = shipSizes[placingShipIndex];
    let shipPlaced = [];
    
    for (let i = 0; i < size; i++) {
        let position = index + i;
        if (position % 10 < index % 10) return;
        let cell = playerGrid.children[position];
        if (!cell || cell.classList.contains("ship")) return;
        shipPlaced.push(cell);
    }
    
    shipPlaced.forEach(cell => cell.classList.add("ship"));
    playerShips.push(...shipPlaced);
    placingShipIndex = null;
}

function playerShoot(square) {
    if (!gameStarted || !playerTurn) return;
    let index = parseInt(square.dataset.index);
    if (square.classList.contains("hit") || square.classList.contains("miss")) return;

    if (computerShips.includes(index)) {
        square.classList.add("hit");
        score += 5;
    } else {
        square.classList.add("miss");
    }
    scoreBoard.textContent = `Skóre: ${score}`;
    playerTurn = false;
    setTimeout(computerShoot, 1000);
}

function computerShoot() {
    let validShots = [...playerGrid.children].filter(cell => !cell.classList.contains("hit") && !cell.classList.contains("miss"));
    if (validShots.length === 0) return;
    let randomShot = validShots[Math.floor(Math.random() * validShots.length)];
    let index = parseInt(randomShot.dataset.index);

    if (playerShips.includes(index)) {
        randomShot.classList.add("hit");
    } else {
        randomShot.classList.add("miss");
    }
    playerTurn = true;
}

startGameButton.addEventListener("click", () => {
    gameStarted = true;
    startGameButton.disabled = true;
});

restartGameButton.addEventListener("click", () => {
    gameStarted = false;
    playerShips = [];
    computerShips = [];
    score = 0;
    placingShipIndex = null;
    playerTurn = true;
    createGrid(playerGrid, true);
    createGrid(pcGrid, false);
    createShipSelection();
    scoreBoard.textContent = "Skóre: 0";
    startGameButton.disabled = false;
});

createGrid(playerGrid, true);
createGrid(pcGrid, false);
createShipSelection();













