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
    generateComputerShips();
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
                    pcGrid.children[pos].classList.add("ship");
                });
                placed = true;
            }
        }
    }
}

startGameButton.addEventListener("click", () => {
    gameStarted = true;
    startGameButton.disabled = true;
    generateComputerShips();

    [...playerGrid.children, ...pcGrid.children].forEach(cell => {
        cell.style.backgroundColor = "white";
        cell.style.border = "1px solid #ccc";
        cell.classList.remove("hit", "miss", "sunk");
    });
});

function playerShoot(square) {
    if (!gameStarted || !playerTurn) return;
    let index = parseInt(square.dataset.index);
    if (square.classList.contains("hit") || square.classList.contains("miss")) return;

    if (computerShips.includes(index)) {
        square.classList.add("hit");
        square.style.backgroundColor = "red";
        score += 5;

        let shipCells = computerShips.filter(pos => {
            let cell = pcGrid.children[pos];
            return cell.classList.contains("hit");
        });

        if (isShipSunk(index, computerShips, pcGrid)) {
            shipCells.forEach(pos => {
                let sunkCell = pcGrid.children[pos];
                sunkCell.classList.add("sunk");
                sunkCell.style.backgroundColor = "black";
            });
        } else {
            return;
        }
    } else {
        square.classList.add("miss");
        square.style.backgroundColor = "blue";
        playerTurn = false;
        setTimeout(() => computerShoot(), 1000);
    }

    scoreBoard.textContent = `Body: ${score}`;
}

function isShipSunk(index, shipList, grid) {
    let directionsToCheck = [1, -1, 10, -10];
    for (let dir of directionsToCheck) {
        let positions = [];
        let i = index;
        while (shipList.includes(i)) {
            positions.push(i);
            i += dir;
        }
        if (positions.every(pos => grid.children[pos].classList.contains("hit"))) {
            return true;
        }
    }
    return false;
}

let difficulty = "easy";
document.querySelectorAll(".obtiaznost button").forEach(btn => {
    btn.addEventListener("click", () => {
        difficulty = btn.textContent.toLowerCase();
    });
});

function computerShoot() {
    if (difficulty === "easy") {
        let validShots = [...playerGrid.children].filter(cell =>
            !cell.classList.contains("hit") &&
            !cell.classList.contains("miss")
        );
        if (validShots.length === 0) return;
        let randomShot = validShots[Math.floor(Math.random() * validShots.length)];
        shootCell(randomShot);
    }

}

function shootCell(cell) {
    let index = parseInt(cell.dataset.index);
    if (playerShips.includes(index)) {
        cell.classList.add("hit");
        cell.style.backgroundColor = "red";
    } else {
        cell.classList.add("miss");
        cell.style.backgroundColor = "blue";
        playerTurn = true;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const playerGrid = document.getElementById("playerGrid");
    const pcGrid = document.getElementById("pcGrid");

    const createGrid = (gridElement) => {
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement("div");
            cell.dataset.index = i;
            gridElement.appendChild(cell);
        }
    };


    const getCell = (grid, index) => grid.children[index];

    const markShip = (grid, ships, isPlayer) => {
        if (isPlayer) {
            ships.flat().forEach(index => {
                getCell(grid, index).classList.add("ship");
            });
        }
    };

    markShip(playerGrid, playerShips, true);

    const handleShot = (grid, ships, index, isPlayer) => {
        const cell = getCell(grid, index);
        if (cell.classList.contains("hit") || cell.classList.contains("miss")) return;

        let hit = false;
        for (const ship of ships) {
            if (ship.includes(index)) {
                cell.classList.add("hit", "disabled");
                hit = true;

                const allHit = ship.every(i => getCell(grid, i).classList.contains("hit"));
                if (allHit) {
                    ship.forEach(i => {
                        getCell(grid, i).classList.remove("hit");
                        getCell(grid, i).classList.add("sunk");
                    });
                }
                break;
            }
        }
        if (!hit) {
            cell.classList.add("miss", "disabled");
        }
    };

    pcGrid.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        if (!isNaN(index)) {
            handleShot(pcGrid, pcShips, index, false);
            setTimeout(() => {
                const available = Array.from(playerGrid.children)
                    .filter(c => !c.classList.contains("hit") && !c.classList.contains("miss"));
                if (available.length > 0) {
                    const randCell = available[Math.floor(Math.random() * available.length)];
                    const playerIndex = parseInt(randCell.dataset.index);
                    handleShot(playerGrid, playerShips, playerIndex, true);
                }
            }, 1000);
        }
    });

    document.querySelectorAll(".tab-button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(btn.textContent.toLowerCase()).classList.add("active");
        });
    });
});

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
        shipCells.push(position);
    }

    shipCells.forEach(i => playerGrid.children[i].classList.add("ship"));

    playerShips.push(shipCells);
    placedShips.push(shipIndex);
}

function computerShoot() {
    let validShots = [...playerGrid.children].filter(cell =>
        !cell.classList.contains("hit") && !cell.classList.contains("miss")
    );
    if (validShots.length === 0) return;

    let randomShot = validShots[Math.floor(Math.random() * validShots.length)];
    let index = parseInt(randomShot.dataset.index);

    let hit = false;
    for (let ship of playerShips) {
        if (ship.includes(index)) {
            randomShot.classList.add("hit");
            randomShot.style.backgroundColor = "red";
            hit = true;

            let isSunk = ship.every(i =>
                playerGrid.children[i].classList.contains("hit")
            );

            if (isSunk) {
                ship.forEach(i => {
                    let cell = playerGrid.children[i];
                    cell.classList.remove("hit");
                    cell.classList.add("sunk");
                    cell.style.backgroundColor = "black";
                });
            }

            break;
        }
    }

    if (!hit) {
        randomShot.classList.add("miss");
        randomShot.style.backgroundColor = "blue";
    }

    playerTurn = true;
}

function pcTurn(playerBoard) {
    let x = Math.floor(Math.random() * playerBoard.length);
    let y = Math.floor(Math.random() * playerBoard[0].length);

    while (playerBoard[x][y].wasShot) {
        x = Math.floor(Math.random() * playerBoard.length);
        y = Math.floor(Math.random() * playerBoard[0].length);
    }

    playerBoard[x][y].wasShot = true;

    if (playerBoard[x][y].hasShip) {
        console.log("PC trafilo loď na", x, y);
    } else {
        console.log("PC netrafilo nič na", x, y);
    }

}

function checkGameEnd(ships, grid) {
    const allSunk = ships.every(ship => {
        return ship.every(index => {
            const cell = grid.children[index];
            return cell.classList.contains("sunk");
        });
    });

    if (allSunk) {
        endGame(allSunk);
    }
}


function endGame(winner) {
    gameStarted = false;
    const message = winner ? 
        "Gratulujeme! Potopili ste všetky lode počítača!" : 
        "Bohužiaľ, počítač potopil všetky vaše lode!";
    

    const gameOverModal = document.createElement("div");
    gameOverModal.className = "game-over-modal";
    gameOverModal.innerHTML = `
        <div class="modal-content">
            <h2>${message}</h2>
            <p>Vaše skóre: ${score}</p>
            <button onclick="restartGame()">Hrať znova</button>
        </div>
    `;
    document.body.appendChild(gameOverModal);
}


function playerShoot(square) {
    if (!gameStarted || !playerTurn) return;
    
    let index = parseInt(square.dataset.index);
    if (square.classList.contains("hit") || square.classList.contains("miss")) return;
    
    if (computerShips.includes(index)) {
        square.classList.add("hit");
        square.style.backgroundColor = "red";
        score += 5;
        
        if (isShipSunk(index, computerShips, pcGrid)) {
            const shipCells = computerShips.filter(pos => {
                const cell = pcGrid.children[pos];
                return cell.classList.contains("hit");
            });
            
            shipCells.forEach(pos => {
                const sunkCell = pcGrid.children[pos];
                sunkCell.classList.add("sunk");
                sunkCell.style.backgroundColor = "black";
            });
            
            
            checkGameEnd([shipCells], pcGrid);
        }
    } else {
        square.classList.add("miss");
        square.style.backgroundColor = "blue";
        playerTurn = false;
        setTimeout(computerShoot, 1000);
    }
    
    scoreBoard.textContent = `Body: ${score}`;
}


function computerShoot() {
    let validShots = [...playerGrid.children].filter(cell =>
        !cell.classList.contains("hit") && 
        !cell.classList.contains("miss")
    );
    
    if (validShots.length === 0) {
        endGame(false);
        return;
    }
    
    const randomShot = validShots[Math.floor(Math.random() * validShots.length)];
    shootCell(randomShot);
}

function restartGame() {
    gameStarted = false;
    placedShips = [];
    score = 0;
    playerTurn = true;
    createGrid(playerGrid, true);
    createGrid(pcGrid, false);
    createShipSelection();
    scoreBoard.textContent = "Body: 0";
    startGameButton.disabled = false;
  
    const modal = document.querySelector(".game-over-modal");
    if (modal) {
        modal.remove();
    }
}