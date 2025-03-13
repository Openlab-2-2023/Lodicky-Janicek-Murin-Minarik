let player1Grid = document.getElementById("player1Grid");
let player2Grid = document.getElementById("player2Grid");
let startGameButton = document.getElementById("startGame");
let readyButton = document.getElementById("readyButton");
let restartGameButton = document.getElementById("restartGame");
let scoreBoard = document.getElementById("score");
let playerShips = [];
let computerShips = [];
let gameStarted = false;
let shipSizes = [2, 2, 3, 4, 4];
let placingShipIndex = 0;

function createGrid(gridElement, isPlayer) {
    gridElement.innerHTML = "";
    for (let i = 0; i < 100; i++) {
        let square = document.createElement("div");
        square.dataset.index = i;
        if (isPlayer) {
            square.addEventListener("click", () => placeShip(square));
        } else {
            square.addEventListener("click", () => shoot(square));
        }
        gridElement.appendChild(square);
    }
}

function placeShip(square) {
    if (gameStarted || placingShipIndex >= shipSizes.length) return;
    let index = parseInt(square.dataset.index);
    let size = shipSizes[placingShipIndex];
    let shipPlaced = [];
    
    for (let i = 0; i < size; i++) {
        let position = index + i;
        if (position % 10 < index % 10) return;
        let cell = player1Grid.children[position];
        if (!cell || cell.classList.contains("ship")) return;
        shipPlaced.push(cell);
    }
    
    shipPlaced.forEach(cell => cell.classList.add("ship"));
    playerShips.push(...shipPlaced);
    placingShipIndex++;
}

function generateRandomShips() {
    computerShips = [];
    shipSizes.forEach(size => {
        let index;
        let shipPlaced;
        do {
            index = Math.floor(Math.random() * 100);
            shipPlaced = [];
            for (let i = 0; i < size; i++) {
                let position = index + i;
                if (position % 10 < index % 10) break;
                shipPlaced.push(position);
            }
        } while (shipPlaced.some(pos => computerShips.includes(pos)));
        computerShips.push(...shipPlaced);
    });
}

readyButton.addEventListener("click", () => {
    playerShips.forEach(ship => ship.classList.add("ready"));
    startGameButton.disabled = false;
});

function shoot(square) {
    if (!gameStarted) return;
    let index = parseInt(square.dataset.index);
    if (computerShips.includes(index)) {
        square.classList.add("hit");
    } else {
        square.classList.add("miss");
    }
}

startGameButton.addEventListener("click", () => {
    gameStarted = true;
    generateRandomShips();
    let firstTurn = Math.random() < 0.5 ? "player" : "bot";
    console.log(`Začína: ${firstTurn}`);
});

restartGameButton.addEventListener("click", () => {
    gameStarted = false;
    playerShips = [];
    computerShips = [];
    placingShipIndex = 0;
    createGrid(player1Grid, true);
    createGrid(player2Grid, false);
    scoreBoard.textContent = "Skóre: 0";
});

createGrid(player1Grid, true);
createGrid(player2Grid, false);