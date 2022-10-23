const FIELD_WIDTH = 320;

let cellSize;

const emptyCell = {
  top: 0,
  left: 0,
  value: 0
};

const cells = [];
cells.push(emptyCell);

const numbers = [...new Array(15).keys()]
  .map(x => x + 1)
  .sort((a, b) => Math.random() - 0.5);
numbers.unshift(0);

function createBtns() {
  const btns = document.createElement('div');
  btns.className = 'btns';

  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn';
  restartBtn.innerHTML = 'Restart';
  restartBtn.addEventListener('click', (e) => { console.log(e.target.innerHTML) });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.innerHTML = 'Save';
  saveBtn.addEventListener('click', (e) => { console.log(e.target.innerHTML) });

  const resultsBtn = document.createElement('button');
  resultsBtn.className = 'btn';
  resultsBtn.innerHTML = 'Results';
  resultsBtn.addEventListener('click', (e) => { console.log(e.target.innerHTML) });

  btns.append(restartBtn, saveBtn, resultsBtn);

  return btns;
}

function createField(cellsCount) {
  cellSize = FIELD_WIDTH / Math.sqrt(cellsCount);
  const field = document.createElement('div');
  field.className = 'field';
  field.style.width = FIELD_WIDTH + 'px';
  field.style.height = FIELD_WIDTH + 'px';

  for (let i = 1; i < cellsCount; i++) {
    const position = {
      left: i % 4,
      top: (i - (i % 4)) / 4,
    };
    const value = numbers[i];
    const cell = createCell(i, value, cellSize, position);
    field.append(cell);
  }

  return field;
}

function createCell(index, value, cellWSize, position) {
  const cell = document.createElement('div');
  cell.className = 'cell';

  cell.style.width = cellWSize + 'px';
  cell.style.height = cellWSize + 'px';
  cell.style.left = position.left * cellWSize + 'px';
  cell.style.top = position.top * cellWSize + 'px';

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

function moveCell(index) {
  const cell = cells[index];
  const leftDiff = Math.abs(emptyCell.left - cell.left),
    topDiff = Math.abs(emptyCell.top - cell.top);

  if (leftDiff + topDiff > 1) return;

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
      ? cell.value === cell.top * 4 + cell.left
      : cell.value === (cell.top * 4 + cell.left) + 1
  });

  if (isFinished) document.querySelector('.field').innerHTML = 'You win'
}

document.addEventListener('DOMContentLoaded', () => {
  const btns = createBtns();
  document.body.append(btns);

  const field = createField(16);
  document.body.append(field);
});