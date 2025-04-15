let playerGrid = document.getElementById("playerGrid");
let pcGrid = document.getElementById("pcGrid");
let player2Grid = document.getElementById("player2Grid");
let startGameButton = document.getElementById("startGame");
let restartGameButton = document.getElementById("restartGame");
let scoreBoard = document.getElementById("score");

let playerShips = [];
let placedShips = [];
let shipSizes = [2, 3, 3, 4, 4];
let gameStarted = false;
let score = 0;
let playerTurn = true;
let currentShipIndex = 0;

let directions = ["right", "down", "left", "up"];
let currentDirectionIndex = 0;

let rotateDirectionButton = document.getElementById("rotateDirection");
rotateDirectionButton.addEventListener("click", () => {
    currentDirectionIndex = (currentDirectionIndex + 1) % directions.length;
    let dirText = {
        right: "→",
        down: "↓",
        left: "←",
        up: "↑"
    };
    rotateDirectionButton.textContent = `Smer: ${dirText[directions[currentDirectionIndex]]}`;

    [...player2Grid.children].forEach(ship => {
        ship.classList.remove("rotate-right", "rotate-down", "rotate-left", "rotate-up");
        ship.classList.add(`rotate-${directions[currentDirectionIndex]}`);
    });
});

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
        ship.classList.add("ship-selection", `rotate-${directions[currentDirectionIndex]}`);
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
        let position;
        let row = Math.floor(index / 10);
        let col = index % 10;

        switch (directions[currentDirectionIndex]) {
            case "right":
                position = index + i;
                if (Math.floor(position / 10) !== row) return;
                break;
            case "down":
                position = index + i * 10;
                if (position >= 100) return;
                break;
            case "left":
                position = index - i;
                if (position < 0 || Math.floor(position / 10) !== row) return;
                break;
            case "up":
                position = index - i * 10;
                if (position < 0) return;
                break;
        }

        let cell = playerGrid.children[position];
        if (!cell || cell.classList.contains("ship")) return;
        shipCells.push(cell);
    }

    shipCells.forEach(cell => cell.classList.add("ship"));
    placedShips.push(shipIndex);
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
    generateComputerShips(); // <- Dôležité
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

let computerShips = [];



function generateComputerShips() {
    computerShips = [];
    let usedIndexes = new Set();

    for (let size of shipSizes) {
        let placed = false;

        while (!placed) {
            let direction = directions[Math.floor(Math.random() * directions.length)];
            let index = Math.floor(Math.random() * 100);
            let positions = [];
            let valid = true;

            for (let i = 0; i < size; i++) {
                let pos;
                let row = Math.floor(index / 10);
                let col = index % 10;

                switch (direction) {
                    case "right":
                        pos = index + i;
                        if (Math.floor(pos / 10) !== row) valid = false;
                        break;
                    case "down":
                        pos = index + i * 10;
                        if (pos >= 100) valid = false;
                        break;
                    case "left":
                        pos = index - i;
                        if (pos < 0 || Math.floor(pos / 10) !== row) valid = false;
                        break;
                    case "up":
                        pos = index - i * 10;
                        if (pos < 0) valid = false;
                        break;
                }

                if (!valid || usedIndexes.has(pos)) {
                    valid = false;
                    break;
                }

                positions.push(pos);
            }

            if (valid) {
                positions.forEach(pos => {
                    usedIndexes.add(pos);
                    computerShips.push(pos);
                    pcGrid.children[pos].classList.add("ship");  //ak chcem aby lod neboli vydno tak pred riadok kodu dat toto => //
                });
                placed = true;
            }
        }
    }
}
