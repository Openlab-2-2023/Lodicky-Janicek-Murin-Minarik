(() => {
  const SHIP_SIZES = [5, 4, 3, 3, 2];
  const ABILITIES = {
    "3x3": { cost: 5, id: "ability-3x3", name: "Streľba 3x3" },
    "row": { cost: 3, id: "ability-row", name: "Streľba Riadok" },
    "col": { cost: 3, id: "ability-col", name: "Streľba Stĺpec" }
  };

  let BOARD_SIZE = 10;
  let activeShipSizes = SHIP_SIZES.slice();

  let playerBoard = [];
  let pcBoard = [];

  let playerShips = [];
  let pcShips = [];

  let gamePhase = "setup";
  let selectedAbility = null;
  let playerPoints = 0;
  let currentTurn = "player";

  let abilityUsageCounts = { "3x3": 0, "row": 0, "col": 0 };

  const playerBoardEl = document.getElementById("player-board");
  const pcBoardEl = document.getElementById("pc-board");
  const boardSizeSelect = document.getElementById("board-size");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const abilitiesButtons = {
    "3x3": document.getElementById("ability-3x3"),
    "row": document.getElementById("ability-row"),
    "col": document.getElementById("ability-col"),
  };
  const pointsEl = document.getElementById("points");
  const messageEl = document.getElementById("message");
  const fleetContainer = document.getElementById("fleet-container");
  const endgameOverlay = document.getElementById("endgame-overlay");
  const endgameMessage = document.getElementById("endgame-message");
  const abilityUsageList = document.getElementById("ability-usage-list");
  const closeEndgameBtn = document.getElementById("close-endgame-btn");

  function createEmptyBoard() {
    let board = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      let row = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push({ hasShip: false, hit: false, shipId: null });
      }
      board.push(row);
    }
    return board;
  }

  function updateBoardGridStyles() {
    playerBoardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 30px)`;
    playerBoardEl.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 30px)`;
    pcBoardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 30px)`;
    pcBoardEl.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 30px)`;
  }

  function updateStartBtnState() {
    startBtn.disabled = fleetContainer.children.length > 0 ? false : true;
  }

  function createFleetShips() {
    fleetContainer.innerHTML = "";
    if (BOARD_SIZE >= 15) {
      activeShipSizes = SHIP_SIZES.concat(SHIP_SIZES);
    } else {
      activeShipSizes = SHIP_SIZES.slice();
    }
    for (let i = 0; i < activeShipSizes.length; i++) {
      let size = activeShipSizes[i];
      let shipEl = document.createElement("div");
      shipEl.classList.add("fleet-ship", "horizontal");
      shipEl.draggable = true;
      shipEl.dataset.size = size;
      shipEl.dataset.index = i;
      shipEl.dataset.orientation = "horizontal";
      for (let s = 0; s < size; s++) {
        const part = document.createElement("span");
        part.textContent = "";
        shipEl.appendChild(part);
      }
      shipEl.title = `Loď veľkosti ${size}, potiahnite na vašu dosku. Pravým klikom alebo šípkami otočte.`;
      fleetContainer.appendChild(shipEl);
    }
    updateStartBtnState();
  }

  function renderBoards() {
    updateBoardGridStyles();

    playerBoardEl.innerHTML = "";
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let pCell = document.createElement("div");
        pCell.classList.add("cell");
        pCell.dataset.row = r;
        pCell.dataset.col = c;
        if (playerBoard[r][c].hasShip) {
          pCell.classList.add("ship");
          let ship = playerShips[playerBoard[r][c].shipId];
          if (ship && ship.hits >= ship.size) {
            if (ship.size === 2) {
              pCell.classList.add("sunk-small");
            } else {
              pCell.classList.add("sunk");
            }
          }
        }
        if (playerBoard[r][c].hit) {
          pCell.classList.toggle("hit", playerBoard[r][c].hasShip);
          pCell.classList.toggle("miss", !playerBoard[r][c].hasShip);
        }
        pCell.title = `(${r + 1},${c + 1})`;
        playerBoardEl.appendChild(pCell);
      }
    }

    pcBoardEl.innerHTML = "";
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let pcCell = document.createElement("div");
        pcCell.classList.add("cell");
        pcCell.dataset.row = r;
        pcCell.dataset.col = c;
        if (pcBoard[r][c].hit && pcBoard[r][c].hasShip) {
          let ship = pcShips[pcBoard[r][c].shipId];
          if (ship && ship.hits >= ship.size) {
            if (ship.size === 2) {
              pcCell.classList.add("sunk-small");
            } else {
              pcCell.classList.add("sunk");
            }
          } else {
            pcCell.classList.add("hit");
          }
        } else if (pcBoard[r][c].hit && !pcBoard[r][c].hasShip) {
          pcCell.classList.add("miss");
        }
        pcCell.title = `(${r + 1},${c + 1})`;
        pcBoardEl.appendChild(pcCell);
      }
    }
  }

  function canPlaceShip(board, row, col, size, horizontal, ignoreShipId = null) {
    if (horizontal) {
      if (col + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row][col + i].hasShip &&
           (ignoreShipId === null || board[row][col + i].shipId !== ignoreShipId)) return false;
      }
    } else {
      if (row + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row + i][col].hasShip &&
           (ignoreShipId === null || board[row + i][col].shipId !== ignoreShipId)) return false;
      }
    }
    return true;
  }

  function placeShip(board, ships, row, col, size, horizontal, shipIndex = null) {
    if (shipIndex !== null) {
      const oldShip = ships[shipIndex];
      if (oldShip) {
        oldShip.cells.forEach(([r, c]) => {
          board[r][c].hasShip = false;
          board[r][c].shipId = null;
        });
      }
    } else {
      shipIndex = ships.length;
    }
    let shipCells = [];
    for (let i = 0; i < size; i++) {
      let r = horizontal ? row : row + i;
      let c = horizontal ? col + i : col;
      board[r][c].hasShip = true;
      board[r][c].shipId = shipIndex;
      shipCells.push([r, c]);
    }
    ships[shipIndex] = { size, cells: shipCells, hits: 0, horizontal };
  }

  function removeShip(board, ships, shipIndex) {
    if (shipIndex == null) return;
    const ship = ships[shipIndex];
    if (!ship) return;
    ship.cells.forEach(([r, c]) => {
      board[r][c].hasShip = false;
      board[r][c].shipId = null;
    });
    ships.splice(shipIndex, 1);
  }

  function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function placePCShips() {
    pcBoard = createEmptyBoard();
    pcShips = [];
    let attempts = 0;
    while (pcShips.length < activeShipSizes.length && attempts < 5000) {
      let size = activeShipSizes[pcShips.length];
      let horizontal = Math.random() < 0.5;
      let r = randint(0, BOARD_SIZE - (horizontal ? 1 : size));
      let c = randint(0, BOARD_SIZE - (horizontal ? size : 1));
      if (canPlaceShip(pcBoard, r, c, size, horizontal)) {
        placeShip(pcBoard, pcShips, r, c, size, horizontal);
      }
      attempts++;
    }
    if (pcShips.length < activeShipSizes.length) {
      pcBoard = createEmptyBoard();
      pcShips = [];
    }
  }

  function resetGame() {
    playerBoard = createEmptyBoard();
    pcBoard = createEmptyBoard();
    playerShips = [];
    pcShips = [];
    selectedAbility = null;
    playerPoints = 0;
    pointsEl.textContent = "Body: 0";
    currentTurn = "player";
    gamePhase = "setup";
    messageEl.textContent = "Potiahnite svoje lode na dosku. Pravým klikom alebo šípkami otáčajte lode. Potiahnutím presúvajte.";
    startBtn.disabled = true;
    restartBtn.disabled = true;
    boardSizeSelect.disabled = false;
    for (let ab in abilitiesButtons) {
      abilitiesButtons[ab].disabled = true;
      abilitiesButtons[ab].classList.remove("selected");
    }
    abilityUsageCounts = { "3x3": 0, "row": 0, "col": 0 };
    createFleetShips();
    renderBoards();

    pcHitsStack = [];

    hideEndgameOverlay();

    updateBoardGridStyles();
  }

  document.body.addEventListener("contextmenu", e => {
    if (e.target.closest(".fleet-ship")) {
      e.preventDefault();
      let ship = e.target.closest(".fleet-ship");
      let orientation = ship.dataset.orientation;
      orientation = orientation === "horizontal" ? "vertical" : "horizontal";
      ship.dataset.orientation = orientation;
      ship.classList.toggle("horizontal", orientation === "horizontal");
      ship.classList.toggle("vertical", orientation === "vertical");
    }
    else if (e.target.classList.contains("cell") && gamePhase === "setup") {
      let row = parseInt(e.target.dataset.row);
      let col = parseInt(e.target.dataset.col);
      if (playerBoard[row][col].hasShip) {
        e.preventDefault();
        const shipId = playerBoard[row][col].shipId;
        const ship = playerShips[shipId];
        if (!ship) return;
        const newOrientation = ship.horizontal ? false : true;
        let startRow = Math.min(...ship.cells.map(c => c[0]));
        let startCol = Math.min(...ship.cells.map(c => c[1]));
        if (canPlaceShip(playerBoard, startRow, startCol, ship.size, newOrientation, shipId)) {
          placeShip(playerBoard, playerShips, startRow, startCol, ship.size, newOrientation, shipId);
          renderBoards();
          messageEl.textContent = "Loď otočená.";
        } else {
          messageEl.textContent = "Loď tu nemožno otočiť.";
        }
      }
    }
  });

  let draggedShip = null;
  let draggedShipIndex = null;
  let draggedShipSize = 0;
  let draggedOrientation = "horizontal";

  fleetContainer.addEventListener("dragstart", e => {
    if (gamePhase !== "setup") {
      e.preventDefault();
      return;
    }
    if (!e.target.classList.contains("fleet-ship")) return;
    draggedShip = e.target;
    draggedShipSize = parseInt(draggedShip.dataset.size);
    draggedOrientation = draggedShip.dataset.orientation;
    draggedShipIndex = parseInt(draggedShip.dataset.index);
    draggedShip.classList.add("dragging");
  });

  fleetContainer.addEventListener("dragend", e => {
    if (draggedShip) draggedShip.classList.remove("dragging");
    draggedShip = null;
    draggedShipIndex = null;
  });

  document.addEventListener("keydown", e => {
    if (!draggedShip || gamePhase !== "setup") return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      let orientation = draggedShip.dataset.orientation;
      orientation = orientation === "horizontal" ? "vertical" : "horizontal";
      draggedShip.dataset.orientation = orientation;
      draggedShip.classList.toggle("horizontal", orientation === "horizontal");
      draggedShip.classList.toggle("vertical", orientation === "vertical");
      draggedOrientation = orientation;
    }
  });

  playerBoardEl.addEventListener("dragover", e => {
    if (gamePhase !== "setup") return;
    if (!draggedShip) return;
    e.preventDefault();
    let cell = e.target.closest(".cell");
    if (!cell) return;
    highlightDragOver(cell);
  });

  playerBoardEl.addEventListener("dragleave", e => {
    if (gamePhase !== "setup") return;
    clearDragOverHighlight();
  });

  playerBoardEl.addEventListener("drop", e => {
    if (gamePhase !== "setup") return;
    if (!draggedShip) return;
    e.preventDefault();
    let cell = e.target.closest(".cell");
    if (!cell) return;
    clearDragOverHighlight();
    let row = parseInt(cell.dataset.row);
    let col = parseInt(cell.dataset.col);

    if (canPlaceShip(playerBoard, row, col, draggedShipSize, draggedOrientation === "horizontal")) {
      placeShip(playerBoard, playerShips, row, col, draggedShipSize, draggedOrientation === "horizontal");
      fleetContainer.removeChild(draggedShip);
      draggedShip = null;
      draggedShipIndex = null;
      renderBoards();
      messageEl.textContent = `Loď veľkosti ${draggedShipSize} umiestnená.`;
      if (fleetContainer.children.length === 0) {
        messageEl.textContent = "Všetky lode umiestnené. Zvoľte veľkosť hracej plochy a kliknite Začať.";
        startBtn.disabled = false;
      }
    } else {
      messageEl.textContent = "Loď tu nemožno umiestniť.";
    }
  });

  function highlightDragOver(cell) {
    clearDragOverHighlight();
    let row = parseInt(cell.dataset.row);
    let col = parseInt(cell.dataset.col);
    let size = draggedShipSize;
    let horizontal = draggedOrientation === "horizontal";
    let fits = canPlaceShip(playerBoard, row, col, size, horizontal, null);
    if (!fits) return;

    if (horizontal) {
      for (let i = 0; i < size; i++) {
        let c = col + i;
        if(c < BOARD_SIZE) {
          let idx = row * BOARD_SIZE + c;
          let el = playerBoardEl.children[idx];
          if (el) el.classList.add("drag-over");
        }
      }
    } else {
      for (let i = 0; i < size; i++) {
        let r = row + i;
        if(r < BOARD_SIZE) {
          let idx = r * BOARD_SIZE + col;
          let el = playerBoardEl.children[idx];
          if (el) el.classList.add("drag-over");
        }
      }
    }
  }

  function clearDragOverHighlight() {
    playerBoardEl.querySelectorAll(".cell.drag-over").forEach(el => el.classList.remove("drag-over"));
  }


  let draggingPlacedShip = null;
  let draggedPlacedShipId = null;

  playerBoardEl.addEventListener("mousedown", e => {
    if (gamePhase !== "setup") return;
    if (!e.target.classList.contains("cell")) return;
    let row = parseInt(e.target.dataset.row);
    let col = parseInt(e.target.dataset.col);
    if (!playerBoard[row][col].hasShip) return;

    draggedPlacedShipId = playerBoard[row][col].shipId;
    draggingPlacedShip = true;
    e.preventDefault();
  });

  document.addEventListener("mouseup", e => {
    if (!draggingPlacedShip) return;
    let target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && target.classList.contains("cell") && target.parentElement === playerBoardEl) {
      let row = parseInt(target.dataset.row);
      let col = parseInt(target.dataset.col);
      let ship = playerShips[draggedPlacedShipId];
      if (!ship) {
        draggingPlacedShip = null;
        draggedPlacedShipId = null;
        return;
      }
      if (canPlaceShip(playerBoard, row, col, ship.size, ship.horizontal, draggedPlacedShipId)) {
        placeShip(playerBoard, playerShips, row, col, ship.size, ship.horizontal, draggedPlacedShipId);
        renderBoards();
        messageEl.textContent = "Loď presunutá.";
      } else {
        messageEl.textContent = "Loď nemožno presunúť sem.";
      }
    }
    draggingPlacedShip = null;
    draggedPlacedShipId = null;
  });

  startBtn.addEventListener("click", () => {
    if (gamePhase !== "setup") return;
    if (fleetContainer.children.length > 0) {
      messageEl.textContent = "Umiestnite všetky lode pred začatím.";
      return;
    }
    BOARD_SIZE = parseInt(boardSizeSelect.value);
    if (BOARD_SIZE >= 15) {
      activeShipSizes = SHIP_SIZES.concat(SHIP_SIZES);
    } else {
      activeShipSizes = SHIP_SIZES.slice();
    }
    placePCShips();
    gamePhase = "playing";
    startBtn.disabled = true;
    restartBtn.disabled = false;
    boardSizeSelect.disabled = true;
    for (let ab in abilitiesButtons) {
      abilitiesButtons[ab].disabled = false;
    }
    playerPoints = 0;
    pointsEl.textContent = "Body: 0";
    messageEl.textContent = "Hra začala! Vaša rada na streľbu.";
    renderBoards();

    pcHitsStack = [];
  });

  restartBtn.addEventListener("click", () => {
    resetGame();
  });

  for (let ab in abilitiesButtons) {
    abilitiesButtons[ab].addEventListener("click", () => {
      if (gamePhase !== "playing") return;
      if (selectedAbility === ab) {
        selectedAbility = null;
        abilitiesButtons[ab].classList.remove("selected");
        messageEl.textContent = "Zvolená obyčajná streľba. Kliknite na dosku počítača pre streľbu.";
      } else {
        if (playerPoints < ABILITIES[ab].cost) {
          messageEl.textContent = `Nedostatok bodov pre ${ab} streľbu.`;
          return;
        }
        selectedAbility = ab;
        for (let other in abilitiesButtons) {
          if (other === ab) abilitiesButtons[other].classList.add("selected");
          else abilitiesButtons[other].classList.remove("selected");
        }
        messageEl.textContent = `Zvolená špeciálna streľba: ${ab}. Najeďte na dosku počítača pre náhľad, kliknite pre výstrel.`;
      }
    });
  }

  let previewCells = [];

  pcBoardEl.addEventListener("mousemove", e => {
    if (gamePhase !== "playing") return;
    if (!selectedAbility) return clearPreview();

    if (!e.target.classList.contains("cell")) return clearPreview();
    let row = parseInt(e.target.dataset.row);
    let col = parseInt(e.target.dataset.col);

    clearPreview();

    if (selectedAbility === "3x3") {
      for(let r = row-1; r <= row+1; r++) {
        for(let c = col-1; c <= col+1; c++) {
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            highlightCell(r,c);
          }
        }
      }
    } else if (selectedAbility === "row") {
      for(let c = 0; c < BOARD_SIZE; c++) highlightCell(row,c);
    } else if (selectedAbility === "col") {
      for(let r = 0; r < BOARD_SIZE; r++) highlightCell(r,col);
    }
  });

  pcBoardEl.addEventListener("mouseleave", clearPreview);

  function clearPreview() {
    previewCells.forEach(cell => {
      cell.classList.remove("highlight");
    });
    previewCells = [];
  }

  function highlightCell(row, col) {
    let idx = row*BOARD_SIZE + col;
    let cell = pcBoardEl.children[idx];
    if (cell) {
      cell.classList.add("highlight");
      previewCells.push(cell);
    }
  }

  pcBoardEl.addEventListener("click", e => {
    if (gamePhase !== "playing") return;
    if (currentTurn !== "player") return;
    if (!e.target.classList.contains("cell")) return;
    if (selectedAbility === null) {
      let row = parseInt(e.target.dataset.row);
      let col = parseInt(e.target.dataset.col);
      if (pcBoard[row][col].hit) {
        messageEl.textContent = "Už ste tu strieľali. Skúste inú bunku.";
        return;
      }
      let hit = applyShot(row,col);
      if(hit) {
        playerPoints++;
        pointsEl.textContent = `Body: ${playerPoints}`;
      }
      endTurn();
    } else {
      let row = parseInt(e.target.dataset.row);
      let col = parseInt(e.target.dataset.col);
      let cost = ABILITIES[selectedAbility].cost;
      if (playerPoints < cost) {
        messageEl.textContent = "Nedostatok bodov na túto špeciálnu streľbu.";
        return;
      }
      let hitsCount = 0;
      if (selectedAbility === "3x3") {
        for(let r = row-1; r <= row+1; r++) {
          for(let c = col-1; c <= col+1; c++) {
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
              if(!pcBoard[r][c].hit) {
                if(applyShot(r,c)) {
                  hitsCount++;
                }
              }
            }
          }
        }
      } else if (selectedAbility === "row") {
        for(let c = 0; c < BOARD_SIZE; c++) {
          if(!pcBoard[row][c].hit) {
            if(applyShot(row,c)) {
              hitsCount++;
            }
          }
        }
      } else if (selectedAbility === "col") {
        for(let r = 0; r < BOARD_SIZE; r++) {
          if(!pcBoard[r][col].hit) {
            if(applyShot(r,col)) {
              hitsCount++;
            }
          }
        }
      }
      playerPoints -= cost;
      playerPoints += hitsCount;
      pointsEl.textContent = `Body: ${playerPoints}`;
      if(abilityUsageCounts.hasOwnProperty(selectedAbility)) {
        abilityUsageCounts[selectedAbility]++;
      }
      selectedAbility = null;
      for (let ab in abilitiesButtons) {
        abilitiesButtons[ab].classList.remove("selected");
      }
      clearPreview();
      endTurn();
    }
    renderBoards();
  });

  function applyShot(row,col) {
    if (pcBoard[row][col].hit) return false;

    pcBoard[row][col].hit = true;

    if (pcBoard[row][col].hasShip) {
      let shipId = pcBoard[row][col].shipId;
      if (shipId !== null) {
        pcShips[shipId].hits++;
        messageEl.textContent = "Zásah!";
        if (pcShips[shipId].hits >= pcShips[shipId].size) {
          messageEl.textContent = `Potopili ste nepriateľskú loď veľkosti ${pcShips[shipId].size}!`;
        }
      }
      checkWin();
      return true;
    } else {
      messageEl.textContent = "Mimo!";
      checkWin();
      return false;
    }
  }

  function applyPlayerShot(row, col) {
    if (playerBoard[row][col].hit) return false;

    playerBoard[row][col].hit = true;

    if (playerBoard[row][col].hasShip) {
      let shipId = playerBoard[row][col].shipId;
      if (shipId !== null) {
        playerShips[shipId].hits++;
        messageEl.textContent = "Vaša loď bola zasiahnutá!";
        if (playerShips[shipId].hits >= playerShips[shipId].size) {
          messageEl.textContent = `Vaša loď veľkosti ${playerShips[shipId].size} bola potopená!`;
        }
      }
      checkWin();
      return true;
    } else {
      messageEl.textContent = "Počítač minul!";
      checkWin();
      return false;
    }
  }

  function checkWin() {
    let pcSunkAll = pcShips.every(s => s.hits >= s.size);
    let playerSunkAll = playerShips.every(s => s.hits >= s.size);
    if (pcSunkAll) {
      messageEl.textContent = "Gratulujeme! Vyhrali ste!";
      gamePhase = "gameover";
      endGame(true);
      return true;
    }
    if (playerSunkAll) {
      messageEl.textContent = "Prehrali ste! Počítač vyhral.";
      gamePhase = "gameover";
      endGame(false);
      return true;
    }
    return false;
  }

  function endGame(playerWon) {
    for (let ab in abilitiesButtons) {
      abilitiesButtons[ab].disabled = true;
      abilitiesButtons[ab].classList.remove("selected");
    }
    currentTurn = null;
    showEndgameOverlay(playerWon);
  }

  function showEndgameOverlay(playerWon) {
    if (playerWon) {
      endgameMessage.textContent = "GRATULUJEME!\nVYHRALI STE!";
    } else {
      endgameMessage.textContent = "PREHRALI STE!\nPOČÍTAČ VYHRAL.";
    }

    let usedAbilities = Object.entries(abilityUsageCounts)
      .filter(([key, count]) => count > 0);
    
    if (usedAbilities.length) {
      let ul = document.createElement("ul");
      usedAbilities.forEach(([key, count]) => {
        let li = document.createElement("li");
        let nameSpan = document.createElement("span");
        let countSpan = document.createElement("span");
        nameSpan.className = "ability-name";
        countSpan.className = "ability-count";
        nameSpan.textContent = ABILITIES[key]?.name || key;
        countSpan.textContent = count;
        li.appendChild(nameSpan);
        li.appendChild(countSpan);
        ul.appendChild(li);
      });
      abilityUsageList.innerHTML = "<strong>Použité schopnosti:</strong>";
      abilityUsageList.appendChild(ul);
    } else {
      abilityUsageList.innerHTML = "";
    }

    endgameOverlay.classList.add("show");
  }

  function hideEndgameOverlay() {
    endgameOverlay.classList.remove("show");
  }

  closeEndgameBtn.addEventListener("click", () => {
    hideEndgameOverlay();
    resetGame();
  });

  let pcHitsStack = [];
  function addNeighborTargets(row, col) {
    const neighbors = [
      [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]
    ];
    neighbors.forEach(([r, c]) => {
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !playerBoard[r][c].hit) {
        if (!pcHitsStack.some(p => p[0] === r && p[1] === c)) {
          pcHitsStack.push([r, c]);
        }
      }
    });
  }

  function pcMakeMove() {
  if (gamePhase !== "playing") return;

  let row, col;
  let shotMade = false;

  if (pcHitsStack.length > 0) {
    [row, col] = pcHitsStack.shift();
    shotMade = true;
  } else {
    do {
      row = randint(0, BOARD_SIZE - 1);
      col = randint(0, BOARD_SIZE - 1);
    } while (playerBoard[row][col].hit);
    shotMade = true;
  }

  if (!shotMade) return;

  let hit = applyPlayerShot(row, col);

  if (hit) {
    addNeighborTargets(row, col);
  }

  renderBoards();

  if (!checkWin()) {
    currentTurn = "player";
    messageEl.textContent = "Vaša rada na streľbu.";
  }
}


  function endTurn() {
    if (gamePhase !== "playing") return;
    if (checkWin()) return;
    currentTurn = "pc";
    messageEl.textContent = "Rada počítača...";
    setTimeout(() => {
      pcMakeMove();
    }, 100);
  }

  boardSizeSelect.addEventListener("change", () => {
    if (gamePhase !== "setup") return;
    BOARD_SIZE = parseInt(boardSizeSelect.value);
    resetGame();
  });

  resetGame();

})();
