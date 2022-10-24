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

let cellSize;
let cellsCount;
let numbers;
let interval;
let moves;
let time;

function createBtns() {
  const btns = document.createElement('div');
  btns.className = 'btns';

  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn';
  restartBtn.innerHTML = 'Start';
  restartBtn.addEventListener('click', handleStart);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.innerHTML = 'Save';
  saveBtn.addEventListener('click', handleSave);

  const resultsBtn = document.createElement('button');
  resultsBtn.className = 'btn';
  resultsBtn.innerHTML = 'Results';
  resultsBtn.addEventListener('click', handleResultsShow);

  const toggleAudio = document.createElement('button');
  toggleAudio.className = isAudio ? 'btn active' : 'btn';
  toggleAudio.innerHTML = 'Sound';
  toggleAudio.addEventListener('click', handleAudioToggle);

  btns.append(restartBtn, saveBtn, resultsBtn, toggleAudio);

  return btns;
}

function handleStart(e) {
  moves = 0;
  time = 0;
  localStorage.removeItem('game');
  startGame();
}

function handleSave(e) {
  const game = {};

  game.field = document.querySelector('.field').innerHTML;
  game.moves = document.querySelector('.stats__moves span').innerHTML;
  const time = document.querySelector('.stats__time span').innerHTML.split(':');
  game.time = time[0] * 60 + time[1];
  game.cellsCount = document.querySelector('.difficulty__current span').innerHTML.split('x')[0] ** 2;
  game.cells = cells;

  const emptyIndex = game.cells.findIndex(cell => cell.value === 0);
  game.cells.splice(emptyIndex, 1, emptyCell);

  localStorage.setItem('game', JSON.stringify(game));
}

function handleResultsShow(e) {

}

function handleAudioToggle(e) {
  e.target.classList.toggle('active');
  isAudio = !isAudio;
  localStorage.setItem('isAudio', isAudio);
}

function createStatsBar() {
  const statsBar = document.createElement('div');
  statsBar.className = 'stats';

  statsBar.innerHTML = `
    <div class="stats__moves">
      Moves: <span>${moves ? moves : 0}</span>
    </div>

    <div class="stats__time">
      Time: <span>${time ? Math.floor(time / 60) + ':' + (time % 60 > 10 ? time % 60 : '0' + time % 60) : '0:0'}</span>
    </div>
  `;

  startInterval(time);

  return statsBar;
}

function startInterval(start) {
  let seconds = start ?? 0;
  interval = setInterval(() => {
    const time = document.querySelector('.stats__time span');
    seconds++;
    time.innerHTML = `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' + seconds % 60 : seconds % 60}`;
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
      if (prevCells[i].value === 0) continue;
      const cell = createCell(i, prevCells[i].value, cellSize, prevCells[i], cellsCount);
      field.append(cell);
    } else {
      const position = {
        left: i % Math.sqrt(cellsCount),
        top: (i - (i % Math.sqrt(cellsCount))) / Math.sqrt(cellsCount),
      };
      const value = numbers[i];
      if (value === 0) continue;

      const cell = createCell(i, value, cellSize, position, cellsCount);
      field.append(cell);
    }
  }

  return field;
}

function createCell(index, value, cellSize, position) {
  const cell = document.createElement('div');
  cell.className = 'cell';

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

  cell.addEventListener('click', (e) => moveCell(index));

  return cell;
};

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
  time = 0;
  localStorage.removeItem('game');
  startGame();
}

function moveCell(index) {
  const cell = cells[index];
  const leftDiff = Math.abs(emptyCell.left - cell.left),
    topDiff = Math.abs(emptyCell.top - cell.top);
  if (leftDiff + topDiff > 1) return;

  document.querySelector('.stats__moves span').innerHTML++;

  if (isAudio) CLICK_AUDIO.play();

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
    const moves = document.querySelector('.stats__moves span').innerHTML,
      time = document.querySelector('.stats__time span').innerHTML;
    document.querySelector('.field').innerHTML = `Hooray! You solved the puzzle in ${time} and ${moves} moves!`;
    saveResults(moves, time);
  }


}

function saveResults(moves, time) {
  const prevResults = localStorage.getItem('results');
  const results = prevResults ? JSON.parse(prevResults) : [];
  results.push({ moves, time });
  localStorage.setItem('results', JSON.stringify(results.sort((a, b) => b.moves - a.moves)));
}

function startGame() {
  const game = JSON.parse(localStorage.getItem('game'));
  let prevCells;
  if (game) {
    cellsCount = game?.cellsCount ?? 16;
    moves = game?.moves ?? 0;
    time = game?.time ?? 0;
    emptyCell = game.cells.find(cell => cell.value === 0);
    prevCells = game.cells;
  } else {
    emptyCell = {
      top: 0,
      left: 0,
      value: 0
    };
    cells = [];
    cells.push(emptyCell);
  }

  if (!cellsCount) cellsCount = 16;

  numbers = [...new Array(cellsCount - 1).keys()]
    .map(x => x + 1)
    .sort((a, b) => Math.random() - 0.5);
  numbers.unshift(0);

  document.body.innerHTML = '';
  stopInterval();

  const btns = createBtns();
  document.body.append(btns);

  const statsBar = createStatsBar();
  document.body.append(statsBar);

  const field = createField(prevCells);
  document.body.append(field);

  const diffuclty = createDifficultyPanel(cellsCount);
  document.body.append(diffuclty);
}

function init() {
  startGame();
}

document.addEventListener('DOMContentLoaded', init);