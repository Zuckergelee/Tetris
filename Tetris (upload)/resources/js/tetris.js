import {
  GAMEFIELD_ROWS,
  GAMEFIELD_COLUMNS,
  TETROMINO_NAMES,
  TETROMINOES,
  getRandomEl,
  rotateMatrix,
  score,
} from "./utilities.js";
export class Tetris {
  constructor() {
    // Пустое игровое поле gameField
    this.gameField;
    // Пустая фигура
    this.tetromino;
    this.isGameOver = false;
    // Вызываем метод init
    this.init();
  }
  init() {
    // Вызываем сперва метод генерации игрового поля
    this.createGameField();
    // Метод для генерации фигуры
    this.createTetromino();
  }

  createGameField() {
    // Описываем двухмерный массив 20*10, который изначально заполнен нулями; вместо 20 будет константа GAMEFIELD_ROWS после заполняем с помощью fill() пустотами
    this.gameField = new Array(GAMEFIELD_ROWS)
      .fill()
      // Пробегаемся по всем пустым элементам и заменяем каждый на массив из 10 элементов; вместо 10 будет константа GAMEFIELD_COLUMNS, потом заполняем их нулями с помощью fill(0)
      .map(() => new Array(GAMEFIELD_COLUMNS).fill(0));
  }

  createTetromino() {
    // Сначала достаем случайную фигуру при помощи getRandomEl() из массива TETROMINO_NAMES
    const tetrominoName = getRandomEl(TETROMINO_NAMES);
    // Далее сохраняем в matrixName матрицу фигуры из TETROMINOES
    const matrixName = TETROMINOES[tetrominoName];
    // Рассчитываем номер колонки, с которой должна рисоваться фигура; мы хотим расположить фигуру по центру поля, поэтому общее количество колонок делим на 2, а затем вычитаем половину размера фигуры, чтобы немного сместить
    // ее влево
    const columnNumber =
      GAMEFIELD_COLUMNS / 2 - Math.floor(matrixName.length / 2); // Так как размер фигуры может не делиться на 2, берем только целую часть
    // Берем номер строки, с которой должна рисоваться фигура
    const rowNumber = -2; // Сначала каждая фигура будет появляться на две строки выше над полем и опускаться вниз
    // Нужно в tetromino сохранить название фигуры, ее матрицу, начальные строку и столбец
    this.tetromino = {
      tetrominoName,
      matrixName,
      rowNumber,
      columnNumber,
      // Переменные для проекционной фигуры
      projectionColumn: columnNumber,
      projectionRow: rowNumber,
    };
    // Вычисление корректного положения проекционной фигуры
    this.calculateProjectionPosition();
  }
  // Методы для перемещения фигуры вниз, вправо, влево
  moveTetrominoDownward() {
    this.tetromino.rowNumber += 1;
    // Сейчас можно сдвинуть фигуру за пределы экрана, что плохо. Нужно проверять, корректно ли расположена фигура, и если нет, возвращать ее к корректному положению
    if (!this.isValid()) {
      this.tetromino.rowNumber -= 1;
      // В момент, когда мы пытаемся поместить фигуру за пределы нижней части экрана, вызываем метод setTetromino(), чтобы зафиксировать фигуру внизу экрана
      this.setTetromino();
    }
  }
  moveTetrominoRight() {
    this.tetromino.columnNumber += 1;
    if (!this.isValid()) {
      this.tetromino.columnNumber -= 1;
    } else {
      // Пересчет позиции для проекционной фигуры
      this.calculateProjectionPosition();
    }
  }
  moveTetrominoLeft() {
    this.tetromino.columnNumber -= 1;
    if (!this.isValid()) {
      this.tetromino.columnNumber += 1;
    } else {
      // Пересчет позиции для проекционной фигуры
      this.calculateProjectionPosition();
    }
  }
  rotateTetromino() {
    // Сохраняем первоначальную матрицу фигуры в oldMatrix
    const oldMatrix = this.tetromino.matrixName;
    // С помощью функции rotateMatrix() вращаем матрицу фигуры на 90 градусов
    const rotatedMatrix = rotateMatrix(this.tetromino.matrixName);
    // Перезаписываем матрицу фигуры на новую
    this.tetromino.matrixName = rotatedMatrix;
    // Если фигура расположена неккоректно, возвращаем ей первоначальное положение
    if (!this.isValid()) {
      this.tetromino.matrixName = oldMatrix;
    } else {
      // Пересчет позиции для проекционной фигуры
      this.calculateProjectionPosition();
    }
  }
  // Метод для мгновенного спускания фигуры
  dropImmediately() {
    // Перемещаем фигуру на место ее проекции внизу поля
    this.tetromino.rowNumber = this.tetromino.projectionRow;
    this.setTetromino();
  }
  // Метод возвращает true или false в зависимости от расположения фигуры
  isValid() {
    // Сохраним размер матрицы фигуры
    const matrixSize = this.tetromino.matrixName.length;
    // Пробегаем по всем плиткам фигуры двойным циклом
    for (let row = 0; row < matrixSize; row++) {
      for (let column = 0; column < matrixSize; column++) {
        // Если элемент матрицы нулевой, то переходим к следующей итерации
        if (!this.tetromino.matrixName[row][column]) continue;
        // В остальных случаях проверяем, вышла ли плитка фигуры за пределы поля с помощью isOutOfGameField()
        if (this.isOutOfGameField(row, column)) return false;
        // Необходимо проверять, при падении не налезает ли фигура на уже лежащую под ней фигуру, с помощью areCollided()
        if (this.areCollided(row, column)) return false;
      }
    }
    // Если все плитки остаются в пределах поля, то возвращаем true
    return true;
  }
  // Принимает расположение элемента внутри матрицы фигуры и возвращает true (если плитка за пределами поля) или false (если нет)
  isOutOfGameField(row, column) {
    // Может быть три условия true: если плитка вышла за пределы левого края поля (то есть столбец, где плитка, стал меньше нуля), правого края поля или же нижнего края поля
    return (
      this.tetromino.columnNumber + column < 0 ||
      this.tetromino.columnNumber + column >= GAMEFIELD_COLUMNS ||
      this.tetromino.rowNumber + row >= this.gameField.length
    );
  }
  // Метод принимает положение плиток фигуры по строке и столбцу и возвращает элемент поля, который там же, где и оказавшаяся плитка
  areCollided(row, column) {
    // Если на поле что-то будет, то возвращаем строку, которая преобразуется в true; если на поле ничего, то возвращаем 0
    return this.gameField[this.tetromino.rowNumber + row]?.[
      this.tetromino.columnNumber + column
    ]; // Важно перед взятием элемента столбца поставить ?., так как плитка фигуры может быть за пределами верхней части экрана, а в поле нет строки, соответствующей отрицательному числу
  }
  setTetromino() {
    // Сперва сохраняем размер матрицы фигуры
    const matrixSize = this.tetromino.matrixName.length;
    // Перебираем все плитки фигуры двойным циклом
    for (let row = 0; row < matrixSize; row++) {
      for (let column = 0; column < matrixSize; column++) {
        // Если элемент матрицы нулевой, то переходим к следующей итерации
        if (!this.tetromino.matrixName[row][column]) continue;
        // Проверяем, вышла ли плитка какой-нибудь фигуры за верхнюю границу поля
        if (this.isOverTop(row)) {
          this.isGameOver = true;
          return;
        }
        // Нужно в ячейку поля, где находится плитка фигуры, сохранить название фигуры
        this.gameField[this.tetromino.rowNumber + row][
          this.tetromino.columnNumber + column
        ] = this.tetromino.tetrominoName;
      }
    }
    this.playSet();
    // Перед созданием фигуры будем удалять заполненные строки, если они есть
    this.removeFilledRows();
    // После перебора плиток создаем новую фигуру при помощи createTetromino()
    this.createTetromino();
  }

  playSet() {
    let audio = new Audio("./resources/audio/Coin.wav");
    audio.play();
  }

  // Метод принимает номер строки плитки из матрицы фигуры
  isOverTop(row) {
    // Высчитываем номер строки плитки фигуры на поле, если номер строки < 0, то возвращаем true и говорим, что плитка выше верхней границы
    return this.tetromino.rowNumber + row < 0;
  }
  // Метод окончания игры принимает номер строки плитки из матрицы фигуры
  isGameOver(row) {
    // Высчитываем номер строки плитки фигуры на поле, если номер строки < 0, то возвращаем true (плитка вышла за пределы поля)
    return this.tetromino.rowNumber + row < 0;
  }
  removeFilledRows() {
    // Сперва находим все заполненные строки в виде массива строк, где элементы отличны от 0
    const filledLines = this.searchFilledRows();
    // Методом removeFilledRows() удаляем все эти строки
    this.deleteFilledRows(filledLines);
  }

  // Метод, которые пробегает по строкам поля, находит заполненные и в конце возвращает массив заполненных строк
  searchFilledRows() {
    // Изначально массив пустой
    const filledRows = [];
    for (let row = 0; row < GAMEFIELD_ROWS; row++) {
      // С помощью every() перебираем все элементы в строке; если в строке все элементы отличны от 0, то номер строки добавляется в массив filledRows
      if (this.gameField[row].every((cell) => Boolean(cell)))
        filledRows.push(row);
    }
    return filledRows;
  }
  // Метод принимает массив строк, которые заполнены и ожидают удаления
  deleteFilledRows(filledRows) {
    // Перебираем все элементы массива и для каждого вызываем метод moveRowsDown(), который смещает все строки выше вниз на одну клетку
    filledRows.forEach((row) => this.moveRowsDown(row));
  }

  // Метод принимает номер строки, которую нужно удалить
  moveRowsDown(rowToDelete) {
    // Пробегаем по всем строкам, начиная от той, которую надо удалить, до предпоследней строки сверху
    for (let row = rowToDelete; row > 0; row--) {
      // Внутри цикла каждую проверяемую строку меняем на ту, что выше нее
      this.gameField[row] = this.gameField[row - 1];
    }
    this.playDelRow();
    this.upScore();
    // После цикла самую верхнюю строку заменяем пустой строкой, то есть новым массивом из 10 элементов, каждый из которых равен 0
    this.gameField[0] = new Array(GAMEFIELD_COLUMNS).fill(0);
    // Затираем строку, которую надо удалить, и смещаем строки выше на одну строку ниже
  }
  // Проигрывание звука при смещении строки
  playDelRow() {
    let audio = new Audio("./resources/audio/Jump.wav");
    audio.play();
  }
  // Увеличение количества очков на 1
  upScore() {
    score.textContent = parseInt(score.textContent) + 1;
  }
  // Вычисление корректного положения проекционной фигуры
  calculateProjectionPosition() {
    // Смысл: опускаем фигуру максимально вниз; дойдя до границы, сохраням координаты для проекционной фигуры; основную фигуру при этом возвращаем на прежние координаты
    const tetrominoRow = this.tetromino.rowNumber;
    this.tetromino.rowNumber++;
    // По мере спускания фигуры проверяем, валидно ли ее положение на поле; спускаем до невалидного значения
    while (this.isValid()) {
      this.tetromino.rowNumber++;
    }
    // После получения невалидного значения значение строки для проекционной фигуры = последнему валидному, т. е. на 1 меньше.
    this.tetromino.projectionRow = this.tetromino.rowNumber - 1;
    // Значение колонки будет совпадать со значением колонки фигуры
    this.tetromino.projectionColumn = this.tetromino.columnNumber;
    // Возвращаем основной фигуре прежнее значение строки
    this.tetromino.rowNumber = tetrominoRow;
  }
}
