let playerGrid = document.getElementById("playerGrid");
let pcGrid = document.getElementById("pcGrid");
let player2Grid = document.getElementById("player2Grid");
let startGameButton = document.getElementById("startGame");
let restartGameButton = document.getElementById("restartGame");
let scoreBoard = document.getElementById("score");
let rotateShipButton = document.getElementById("rotateShip");

let playerShips = [];
let placedShips = [];
let shipSizes = [2, 3, 3, 4, 4];
let gameStarted = false;
let score = 0;
let playerTurn = true;
let currentShipIndex = 0;

function createGrid(gridElement, isPlayer) {
    gridElement.innerHTML = "";
    for (let i = 0; i < 100; i++) {
        let square = document.createElement("div");
        square.dataset.index = i;

        if (isPlayer) {
            square.addEventListener("dragover", (e) => e.preventDefault());
            square.addEventListener("drop", (e) => {
                e.preventDefault();
                const shipIndex = parseInt(e.dataTransfer.getData("text/plain"));
                placeShip(square, shipIndex);
            });
        } else {
            square.addEventListener("click", () => playerShoot(square));
        }

        gridElement.appendChild(square);
    }
}

function createShipSelection() {
    player2Grid.innerHTML = "";
    shipSizes.forEach((size, index) => {
        let ship = document.createElement("div");
        ship.classList.add("ship-selection");
        ship.setAttribute("draggable", "true");
        ship.dataset.size = size;
        ship.dataset.index = index;

        for (let i = 0; i < size; i++) {
            let cell = document.createElement("div");
            cell.classList.add("ship-cell");
            ship.appendChild(cell);
        }

        ship.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            currentShipIndex = index;
        });

        player2Grid.appendChild(ship);
    });
}

function placeShip(square, shipIndex) {
    if (gameStarted || placedShips.includes(shipIndex)) return;

    let size = shipSizes[shipIndex];
    let index = parseInt(square.dataset.index);
    let shipCells = [];
    
    for (let i = 0; i < size; i++) {
        let position = index + i;
        if (position % 10 < index % 10) return;
        let cell = playerGrid.children[position];
        if (!cell || cell.classList.contains("ship")) return;
        shipCells.push(cell);
    }

    shipCells.forEach(cell => cell.classList.add("ship"));
    placedShips.push(shipIndex);
}

function rotateShip() {
    let ship = player2Grid.children[currentShipIndex];
    ship.classList.toggle("rotate");
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

    scoreBoard.textContent = `Body: ${score}`;
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
    placedShips = [];
    score = 0;
    playerTurn = true;
    createGrid(playerGrid, true);
    createGrid(pcGrid, false);
    createShipSelection();
    scoreBoard.textContent = "Body: 0";
    startGameButton.disabled = false;
});

function openTab(tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    const tabButtons = document.getElementsByClassName("tab-button");

    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    event.currentTarget.classList.add("active");
}

createGrid(playerGrid, true);
createGrid(pcGrid, false);
createShipSelection();
