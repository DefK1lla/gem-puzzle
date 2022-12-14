const FIELD_WIDTH = 320;
const CLICK_AUDIO = new Audio('./audio/click.mp3');

let isAudio = JSON.parse(localStorage.getItem('isAudio')) ?? true;

let emptyCell = {
  top: 0,
  left: 0,
  value: 0
};

let cells = [];
cells.push(emptyCell);

let fieldOffset;
let cellSize;
let cellsCount;
let numbers;
let interval;
let moves;
let seconds;
let isWin;
let draggableIndex;

function isTouch() { return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch; }

function arrToMatrix(arr, elementsPerSubArray) {
  let matrix = [], i, k;
  for (i = 0, k = -1; i < arr.length; i++) {
    if (i % elementsPerSubArray === 0) {
      k++;
      matrix[k] = [];
    }
    matrix[k].push(arr[i]);
  }
  return matrix;
}

function findCoordsByNumber(number, matrix) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === number) return { y, x };
    }
  }
  return null;
}

function isValidForSwap(coords, emptyCoords, matrix) {
  const diffX = Math.abs(coords.x - emptyCoords.x);
  const diffY = Math.abs(coords.y - emptyCoords.y);
  return (diffX === 1 || diffY === 1) && (coords.x === emptyCoords.x || coords.y === emptyCoords.y);
}

function findValidCoords(emptyCoords, matrix) {
  const validCoords = [];
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const coords = { y, x };
      const isValid = isValidForSwap(coords, emptyCoords, matrix);
      if (isValid) validCoords.push(coords);
    }
  }
  return validCoords;
}

function swap(swapCoords, emptyCoords, matrix) {
  const swapNumber = matrix[swapCoords.x][swapCoords.y];
  matrix[swapCoords.x][swapCoords.y] = matrix[emptyCoords.y][emptyCoords.x];
  matrix[emptyCoords.y][emptyCoords.x] = swapNumber;
}

function randomSwap(matrix) {
  const emptyCoords = findCoordsByNumber(0, matrix);
  const validCoords = findValidCoords(emptyCoords, matrix);
  const swapCoords = validCoords[Math.floor(Math.random() * validCoords.length)];
  swap(swapCoords, emptyCoords, matrix);
  return matrix;
}

function getNumbers(cellsCount) {
  let numbers = [...new Array(cellsCount - 1).keys()]
    .map(x => x + 1);
  if (Math.random() > 0.5) numbers.push(0);
  else numbers.unshift(0);
  numbers = arrToMatrix(numbers, Math.sqrt(cellsCount));
  for (let i = 0; i < cellsCount * 10; i++) numbers = randomSwap(numbers);
  return numbers.flat();
}

function createResultsTable() {
  const table = document.createElement('table');
  const results = JSON.parse(localStorage.getItem('results'));

  table.innerHTML = `
    <tr>
      <th>Position</th>
      <th>Moves</th>
      <th>Time</th>
    </tr>

    ${!results
      ? `
        <tr>
          <td colspan="3">
            <p class="results-placeholder">You have never won</p>
          </td>
        </tr>
      `
      : results.map((res, index) => (`
        <tr>
          <td>${index + 1}</td>
          <td>${res.moves}</td>
          <td>${res.time}</td>
        </tr>
      `)).join(' ')
    }
  `;

  return table;
}

function createBtns(isStarted = true) {
  const btns = document.createElement('div');
  btns.className = 'btns';

  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn';
  restartBtn.innerHTML = 'Start';
  restartBtn.addEventListener('click', handleStart);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.innerHTML = 'Save';
  saveBtn.disabled = !isStarted;
  saveBtn.addEventListener('click', handleSave);

  const loadBtn = document.createElement('button');
  loadBtn.className = 'btn';
  loadBtn.innerHTML = 'Load';
  loadBtn.addEventListener('click', handleLoad);

  const resultsBtn = document.createElement('button');
  resultsBtn.className = 'btn';
  resultsBtn.innerHTML = 'Results';
  resultsBtn.addEventListener('click', handleResultsShow);

  const audioLabel = document.createElement('label');
  const toggleAudio = document.createElement('input');
  const audioText = document.createElement('span');

  audioText.innerHTML = 'Sound';
  toggleAudio.type = 'checkbox';
  toggleAudio.checked = isAudio;
  audioLabel.append(toggleAudio, audioText);
  toggleAudio.addEventListener('change', handleAudioToggle);

  btns.append(restartBtn, saveBtn, loadBtn, resultsBtn, audioLabel);

  return btns;
}

function handleStart(e) {
  moves = 0;
  seconds = 0;
  startGame();
}

function handleLoad(e) {
  const game = JSON.parse(localStorage.getItem('game'));
  if (!game) return;
  isWin = false;
  cellsCount = game?.cellsCount ?? 16;
  moves = game?.moves ?? 0;
  seconds = game?.seconds ?? 0;
  emptyCell = game.cells.find(cell => cell.value === 0);
  const prevCells = game.cells;
  cells = [];
  startGame(prevCells);
}

function handleSave(e) {
  if (isWin) return;
  const game = {};
  game.moves = document.querySelector('.stats__moves span').innerHTML;
  game.seconds = seconds;
  game.cellsCount = document.querySelector('.difficulty__current span').innerHTML.split('x')[0] ** 2;
  game.cells = cells;

  const emptyIndex = game.cells.findIndex(cell => cell.value === 0);
  game.cells.splice(emptyIndex, 1, emptyCell);

  localStorage.setItem('game', JSON.stringify(game));
}

function handleResultsShow(e) {
  if (!isWin) {
    const isSave = confirm('Save the game?');
    if (isSave) handleSave(e);
  }

  stopInterval();
  document.body.innerHTML = '';

  const btns = createBtns(false);
  document.body.append(btns);

  const table = createResultsTable();
  document.body.append(table);
}

function handleAudioToggle(e) {
  isAudio = e.target.checked;
  localStorage.setItem('isAudio', isAudio);
}

function createStatsBar() {
  const statsBar = document.createElement('div');
  statsBar.className = 'stats';

  let timeString;

  if (seconds) {
    const hours = Math.floor((seconds / 60 / 60) % 24),
      minutes = Math.floor((seconds / 60) % 60);

    timeString = (hours ? hours + ':' : '') + (minutes ? minutes + ':' : '0:') + seconds % 60;
  }

  statsBar.innerHTML = `
    <div class="stats__moves">
      Moves: <span>${moves ? moves : 0}</span>
    </div>

    <div class="stats__time">
      Time: <span>${seconds ? timeString : '0:0'}</span>
    </div>
  `;

  startInterval(seconds);

  return statsBar;
}

function startInterval(start) {
  seconds = start ?? 0;
  interval = setInterval(() => {
    const time = document.querySelector('.stats__time span');
    seconds++;
    const hours = Math.floor((seconds / 60 / 60) % 24),
      minutes = Math.floor((seconds / 60) % 60);
    time.innerHTML = (hours ? hours + ':' : '') + (minutes ? minutes + ':' : '0:') + seconds % 60;
  }, 1000);
}

function stopInterval() {
  clearInterval(interval);
  interval = null;
}

function createField(prevCells) {
  cellSize = FIELD_WIDTH / Math.sqrt(cellsCount);
  const field = document.createElement('div');
  field.className = 'field';
  field.style.width = FIELD_WIDTH + 'px';
  field.style.height = FIELD_WIDTH + 'px';

  for (let i = 0; i < cellsCount; i++) {
    if (prevCells && prevCells[i]) {
      if (prevCells[i].value === 0) {
        emptyCell = {
          left: prevCells[i].left,
          top: prevCells[i].top,
          value: prevCells[i].value
        }
        cells.push(emptyCell);
        continue;
      }
      const cell = createCell(i, prevCells[i].value, cellSize, prevCells[i], cellsCount);
      field.append(cell);
    } else {
      const position = {
        left: i % Math.sqrt(cellsCount),
        top: (i - (i % Math.sqrt(cellsCount))) / Math.sqrt(cellsCount),
      };
      const value = numbers[i];
      if (value === 0) {
        emptyCell = {
          left: position.left,
          top: position.top,
          value
        }
        cells.push(emptyCell);
        continue;
      }
      const cell = createCell(i, value, cellSize, position, cellsCount);
      field.append(cell);
    }
  }
  field.addEventListener('dragover', handleDragOver);
  return field;
}

function handleDragOver(e) {
  const cell = cells[draggableIndex];
  const cellPos = {
    left: cell.left * cellSize,
    top: cell.top * cellSize
  };
  const dragPos = {
    left: e.pageX - fieldOffset.left,
    top: e.pageY - fieldOffset.top
  }
  const cellConditions = (dragPos.left >= cellPos.left && dragPos.left <= cellPos.left + cellSize) &&
    (dragPos.top >= cellPos.top && dragPos.top <= cellPos.top + cellSize);
  const { xCondition, yCondition } = getConditions(e);
  if ((xCondition && yCondition) || cellConditions) e.preventDefault();
}

function createCell(index, value, cellSize, position) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.draggable = true;

  cell.style.width = cellSize + 'px';
  cell.style.height = cellSize + 'px';
  cell.style.left = position.left * cellSize + 'px';
  cell.style.top = position.top * cellSize + 'px';

  cells.push({
    left: position.left,
    top: position.top,
    value,
    elem: cell
  });

  cell.innerHTML = value;

  cell.addEventListener('click', (e) => handleCellClick(e, index));
  cell.addEventListener('touchmove', (e) => handleTouchEnd(e, index));
  cell.addEventListener('dragstart', (e) => handleDragStart(e, index));
  cell.addEventListener('dragend', (e) => handleDragEnd(e, index));


  return cell;
};

function getConditions(e) {
  const emptyPos = {
    left: emptyCell.left * cellSize,
    top: emptyCell.top * cellSize
  };
  const dragPos = {
    left: e.pageX - fieldOffset.left,
    top: e.pageY - fieldOffset.top
  }
  const xCondition = dragPos.left >= emptyPos.left && dragPos.left <= emptyPos.left + cellSize,
    yCondition = dragPos.top >= emptyPos.top && dragPos.top <= emptyPos.top + cellSize;

  return { xCondition, yCondition };
}

function handleTouchEnd(e, index) {
  e.preventDefault();
  const cell = cells[index];
  if (isCellNonInteractive(cell)) return e.preventDefault();
  const touch = e.targetTouches[0];
  const { xCondition, yCondition } = getConditions(touch);
  if (xCondition && yCondition) moveCell(index);
}

function handleDragStart(e, index) {
  draggableIndex = index;
  const cell = cells[index];
  if (isCellNonInteractive(cell)) return e.preventDefault();
  if (!isTouch()) requestAnimationFrame(() => cell.elem.style.visibility = 'hidden', 0);
}

function handleDragEnd(e, index) {
  const cell = cells[index];
  const { xCondition, yCondition } = getConditions(e);

  if (xCondition && yCondition) moveCell(index, true);
  requestAnimationFrame(() => cell.elem.style.visibility = 'visible', 0);
}

function isCellNonInteractive(cell) {
  const leftDiff = Math.abs(emptyCell.left - cell.left),
    topDiff = Math.abs(emptyCell.top - cell.top);
  return leftDiff + topDiff > 1;
}

function handleCellClick(e, index) {
  const cell = cells[index];
  if (isCellNonInteractive(cell)) return;
  moveCell(index);
}

function createDifficultyPanel(size) {
  size = size ? Math.sqrt(size) + 'x' + Math.sqrt(size) : '4x4';

  const difficulty = document.createElement('div');
  difficulty.className = 'difficulty';

  const difficultyCurrent = document.createElement('div');
  difficultyCurrent.className = 'difficulty__current';
  difficultyCurrent.innerHTML = `Frame size: <span>${size}</span>`;

  difficulty.append(difficultyCurrent);

  const difficultyList = document.createElement('ul');
  difficultyList.className = 'difficulty__list';

  for (let i = 3; i < 9; i++) {
    const difficultyItem = document.createElement('li');
    difficultyItem.className = 'difficulty__item';

    const difficultyLink = document.createElement('a');
    difficultyLink.href = '#';
    difficultyLink.className = 'difficulty__link';
    difficultyLink.innerHTML = i + 'x' + i;

    difficultyLink.addEventListener('click', handleSizeChange);

    difficultyItem.append(difficultyLink);
    difficultyList.append(difficultyItem);
  }

  const difficultyOther = document.createElement('div');
  difficultyOther.className = 'difficulty__other';
  difficultyOther.innerHTML = 'Other sizes: ';
  difficultyOther.append(difficultyList);

  difficulty.append(difficultyOther);

  return difficulty;
};

function handleSizeChange(e) {
  e.preventDefault();
  cellsCount = e.target.innerHTML.split('x')[0] ** 2;
  moves = 0;
  seconds = 0;
  cellSize = FIELD_WIDTH / Math.sqrt(cellsCount);
  startGame();
}

function moveCell(index, isDrag = false) {
  const cell = cells[index];

  document.querySelector('.stats__moves span').innerHTML++;

  CLICK_AUDIO.currentTime = 0;
  if (isAudio) CLICK_AUDIO.play();

  if (isDrag) cell.elem.style.transition = 'all 0s';
  else cell.elem.style.transition = 'all 0.3s linear';

  cell.elem.style.left = emptyCell.left * cellSize + 'px';
  cell.elem.style.top = emptyCell.top * cellSize + 'px';

  const currentLeft = cell.left,
    currentTop = cell.top;

  cell.left = emptyCell.left;
  cell.top = emptyCell.top;

  emptyCell.left = currentLeft;
  emptyCell.top = currentTop;

  const isFinished = cells.every(cell => {
    if (cell === emptyCell) return true;

    return emptyCell.top === 0 && emptyCell.left === 0
      ? cell.value === cell.top * Math.sqrt(cellsCount) + cell.left
      : cell.value === (cell.top * Math.sqrt(cellsCount) + cell.left) + 1;
  });

  if (isFinished) {
    isWin = true;
    stopInterval();
    const moves = document.querySelector('.stats__moves span').innerHTML,
      time = document.querySelector('.stats__time span').innerHTML;
    document.querySelector('.field').innerHTML = `Hooray! You solved the puzzle in ${time} and ${moves} moves!`;
    saveResults(moves, time);
  }
}

function saveResults(moves, time) {
  const results = JSON.parse(localStorage.getItem('results')) ?? [];
  results.push({ moves, time });
  localStorage.setItem('results', JSON.stringify(results.sort((a, b) => a.moves - b.moves)));
}

function startGame(prevCells) {
  isWin = false;
  if (!prevCells) emptyCell = { top: 0, left: 0, value: 0 };

  cells = [];

  if (!cellsCount) cellsCount = 16;

  numbers = getNumbers(cellsCount);

  document.body.innerHTML = '';
  stopInterval();

  const btns = createBtns();
  document.body.append(btns);

  const statsBar = createStatsBar();
  document.body.append(statsBar);

  const field = createField(prevCells);
  document.body.append(field);
  fieldOffset = {
    left: field.getBoundingClientRect().left,
    top: field.getBoundingClientRect().top
  };

  const diffuclty = createDifficultyPanel(cellsCount);
  document.body.append(diffuclty);
}

function init() {
  startGame();
}

document.addEventListener('DOMContentLoaded', init);