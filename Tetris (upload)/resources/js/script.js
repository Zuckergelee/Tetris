import { Tetris } from "./tetris.js";
import {
  GAMEFIELD_COLUMNS,
  GAMEFIELD_ROWS,
  convertIndexToIndex,
} from "./utilities.js";

let timeOutId;
let requesAnimFrtId;

const tetris = new Tetris();
// Сохраняем в cells все div-элементы, в которых будут рисоваться фигуры, с помощью querySelectorAll()
const cells = document.querySelectorAll(".grid div");
// Событие нажатия клавиш
eventKeyDown();

moveDownward();

function eventKeyDown() {
  // Читаем событие нажатия клавишы с помощью addEventListener() и на каждое нажатие вызываем функцию onKeyDown
  document.addEventListener("keydown", onKeyDown);
}
// Смотрим, какая клавиша была нажата, вызываем соответствующий метод
function onKeyDown(event) {
  switch (event.key) {
    case "ArrowUp":
      rotate();
      break;
    case "ArrowDown":
      moveDownward();
      break;
    case "ArrowRight":
      moveRight();
      break;
    case "ArrowLeft":
      moveLeft();
      break;
    case " ":
      dropDown();
      break;
    default:
      break;
  }
}
// Функции перемещения
function moveDownward() {
  tetris.moveTetrominoDownward();
  // После вызываем draw(), чтобы фигурка также нарисовалась в браузере
  draw();
// На каждое нажатие Вниз останавливаем текущий цикл отрисовки и запускаем новый; таки образом, отчет начнется заново и фигура опустится вниз через нужный промежуток времени.
  stopCycle();
  startCycle();
  // Проверка на конец игры
  if (tetris.isGameOver) {
    gameOver();
  }
}

function moveRight() {
  tetris.moveTetrominoRight();
  // После вызываем draw(), чтобы фигурка также нарисовалась в браузере
  draw();
}

function moveLeft() {
  tetris.moveTetrominoLeft();
  // После вызываем draw(), чтобы фигурка также нарисовалась в браузере
  draw();
}

function rotate() {
  tetris.rotateTetromino();
  draw();
}

// Роняем фигуру сразу вниз, на место ее проекции (клавиша Space)
function dropDown() {
  tetris.dropImmediately();
  draw();
  stopCycle();
  startCycle();
  if (tetris.isGameOver) {
    gameOver();
  }
}

function startCycle() {
  // Вызываем moveDownward через 700мс с помощью setTimeout() (но вызывать ее будем через requestAnimationFrame(), чтобы браузер мог запланировать перерисовку на следующем кадре; результат вызовов этих функций сохраняем в
  // timeOutId и requesAnimFrtId, чтобы в будущем останавливать setTimeout и requestAnimationFrame)
  timeOutId = setTimeout(
    () => (requesAnimFrtId = requestAnimationFrame(moveDownward)),
    700
  );
}
// Данная функция и будет останавливать setTimeout и requestAnimationFrame()
function stopCycle() {
  cancelAnimationFrame(requesAnimFrtId);
  clearTimeout(timeOutId);
}
// В функции отрисовки рисуем поле с фигурами на каждом кадре с помощью добавления классов в блоки div
function draw() {
  // Перед этим удаляем все типы class из блоков div
  cells.forEach((cell) => cell.removeAttribute("class"));
  // Перед отрисовкой фигуры вызываем отрисовку поля
  drawGameField();
  drawTetromino();
  // Отрисовка проекционной фигуры
  drawProjectionTetromino();
}

function drawGameField() {
  // Перебираем все ячейки игрового поля
  for (let row = 0; row < GAMEFIELD_ROWS; row++) {
    for (let column = 0; column < GAMEFIELD_COLUMNS; column++) {
      // Пропускаем все пустые элементы поля
      if (!tetris.gameField[row][column]) continue;
      // Сохраняем в константу tetrName название фигуры, чью плитку мы нашли в поле
      const tetrName = tetris.gameField[row][column];
      // Синхронизируем позицию ячейки поля из матрицы в индекс ячейки в списке
      const cellInd = convertIndexToIndex(row, column);
      // Добавляем этой ячейке класс названия плитки фигуры
      cells[cellInd].classList.add(tetrName);
    }
  }
}

function drawTetromino() {
  // Сохраняем константу названия фигуры
  const tetrName = tetris.tetromino.tetrominoName;
  // Сохраняем размер матрицы
  const tetrMatrixSize = tetris.tetromino.matrixName.length;
  // Перебираем элементы по строкам и столбцам
  for (let row = 0; row < tetrMatrixSize; row++) {
    for (let column = 0; column < tetrMatrixSize; column++) {
      // Если проверяемый элемент матрицы не равен 1, то переходим на следующую итерацию
      if (!tetris.tetromino.matrixName[row][column]) continue;
      // Рассчитываем строку, на которой надо нарисовать плитку фигуры (к номеру строки, с которого должна начниаться фигура, добавляем смещение row; если строка < 0, то есть плитка фигуры за пределами поля, значит, ее не
      // рисуем и переходим к следующей итерации)
      if (tetris.tetromino.rowNumber + row < 0) continue;
      // Во всех остальных случаях отрисовываем элемент фигуры (нужно индекс плитки фигуры из матрицы пересчитать в индекс ячейки в списке div-элементов; для этого функции convertIndexToIndex() передаем положение фигуры в
      // двухмерном массиве поля; для этого к номеру строки, с которой начинается фигура, добавляем смещение row для плитки фигуры; также для column)
      const cellInd = convertIndexToIndex(
        tetris.tetromino.rowNumber + row,
        tetris.tetromino.columnNumber + column
      );
      // После получения индекса ячейки добавляем ячейке класс, такой же, как и название фигуры
      cells[cellInd].classList.add(tetrName);
    }
  }
}

function drawProjectionTetromino() {
  const tetrMatrixSize = tetris.tetromino.matrixName.length;
  // Перебираем элементы матрицы фигуры
  for (let row = 0; row < tetrMatrixSize; row++) {
    for (let column = 0; column < tetrMatrixSize; column++) {
      // Пропускаем элементы проекционной фигуры, которые уходят за верхний предел игрового поля
      if (!tetris.tetromino.matrixName[row][column]) continue;
      if (tetris.tetromino.projectionRow + row < 0) continue;
      // Высчитываем индекс ячейки для плитки призрачной фигуры
      const cellInd = convertIndexToIndex(
        tetris.tetromino.projectionRow + row,
        tetris.tetromino.projectionColumn + column
      );
      // Добавим этой ячейке класс projection
      cells[cellInd].classList.add("projection");
    }
  }
}

function gameOver() {
  // Остановка цикла падения фигур
  stopCycle();
  // Удаление подписок на нажатие клавиш
  document.removeEventListener("keydown", onKeyDown);
  gameOverAnim();
}

function gameOverAnim() {
  // Сначала заставим все плитки поочередно крутиться и пропадать; находим заполненные плитками клетки, для этого фильтруем псевдомассив cells и оставляем только те клетки, где есть какой-то класс
  const filledCells = [...cells].filter((cell) => cell.classList.length > 0);
  playDeath();
  filledCells.forEach((cell, i) => {
    // Перебираем найденные клетки и с задержской в 10мс с помощью setTimeOut() добавим клеткам class="hide"
    setTimeout(() => cell.classList.add("hide"), i * 10);
    // После подобным образом удаляем стили у клеток, но с доп. задержкой в 500мс (чтобы успела сработать анимация, подключаемая при добавлении класса hide)
    setTimeout(() => cell.removeAttribute("class"), i * 10 + 500);
  });
  setTimeout(reload, filledCells.length * 10 + 1000);
}

function reload() {
  alert("You lose! Try again!");
  window.location.reload();
  return;
}

function playDeath() {
  let audio = new Audio("./resources/audio/Death.wav");
  audio.play();
}
