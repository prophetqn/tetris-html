class Game {
    constructor() {
        this.canvas = document.getElementById("tetris-canvas");
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.boardWidth = 10;
        this.boardHeight = 24;
        this.currentBoard = new Array(this.boardHeight).fill(0).map(
            () => new Array(this.boardWidth).fill(0)
        );
        this.landedBoard = new Array(this.boardHeight).fill(0).map(
            () => new Array(this.boardWidth).fill(0)
        );
        this.randomBag = [0, 1, 2, 3, 4, 5, 6];
        this.currentTetromino = this.randomTetromino();
        this.nextTetromino = this.randomTetromino();
        this.gameInterval = null;
        this.gameOver = false;
        this.updateCurrentBoard();
        this.draw();
        this.play();
        window.onkeydown = this.keyDown.bind(this);
    }

    draw(blockSize = 24, padding = 4) {
        /*Draw border*/
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = 2;
        this.ctx.rect(
            padding, 
            blockSize*4 + padding * 5, 
            blockSize*this.boardWidth + padding*(this.boardWidth + 1),
            blockSize*(this.boardHeight - 4) + padding*(this.boardHeight - 4 + 1));
        this.ctx.stroke();
        
        /*Draw block*/
        for(let x = 4; x < this.boardHeight; x++) {
            for(let y = 0; y < this.boardWidth; y++) {
                if (this.currentBoard[x][y] > 0) {
                    this.ctx.fillStyle = this.getColor(this.currentBoard[x][y]);
                } else {
                    this.ctx.fillStyle = 'rgb(248, 248, 248)';
                }
                this.ctx.fillRect(
                    y*blockSize + (y + 2)*padding,
                    x*blockSize + (x + 2)*padding,
                    blockSize,
                    blockSize
                );
            }
        }

        /*Draw next block*/
        for(let x = 0; x < this.nextTetromino.height; x++) {
            for(let y = 0; y < this.nextTetromino.width; y++) {
                if (this.nextTetromino.shape[x][y] > 0) {
                    this.ctx.fillStyle = this.getColor(this.nextTetromino.shape[x][y]);
                } else {
                    this.ctx.fillStyle = 'rgb(255, 255, 255)';
                }
                this.ctx.fillRect(
                    (this.boardWidth + 1)*blockSize + (this.boardWidth + 3)*padding + y*3/4*(blockSize + padding),
                    6*blockSize + x*3/4*(blockSize + padding),
                    blockSize*3/4,
                    blockSize*3/4
                );
            }
        }

        /*Draw text*/
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.font = '20px Verdana';
        this.ctx.fillText(
            'Next piece:',
            blockSize*this.boardWidth + padding*(this.boardWidth + 3),
            blockSize*4 + padding * 4 + 20);
        this.ctx.fillText(
            'Score:',
            blockSize*this.boardWidth + padding*(this.boardWidth + 3),
            blockSize*6 + padding * 4 + 100);
        this.ctx.fillText(
            this.score.toString(),
            blockSize*this.boardWidth + padding*(this.boardWidth + 3),
            blockSize*6 + padding * 4 + 130);
    }

    randomTetromino() {
        if (this.randomBag.length === 0) {
            this.randomBag = [0, 1, 2, 3, 4, 5, 6];
        }
        const randPos = Math.floor(Math.random() * this.randomBag.length);
        const randNum = this.randomBag[randPos];
        this.randomBag.splice(randPos, 1);
        switch (randNum) {
            case 0:
                return new LShape(1, 4)
            case 1:
                return new JShape(1, 4)
            case 2:
                return new OShape(2, 4)
            case 3:
                return new TShape(2, 4)
            case 4:
                return new SShape(2, 4)
            case 5:
                return new ZShape(2, 4)
            case 6:
                return new IShape(0, 4)
        }
    }

    play() {
        this.gameInterval = setInterval(() => {
            this.progress();
            this.isGameOver();
            if (this.gameOver) {
                clearInterval(this.gameInterval);
                let text = "Score is " + this.score + ". Play again?";
                if (confirm(text) == true) {
                    const game = new Game();
                }
            } else {
                this.updateCurrentBoard();
                this.draw();
            }
        }, 800);
    }
    
    progress() {
        let tempTetromino = new this.currentTetromino.constructor(
            this.currentTetromino.row + 1,
            this.currentTetromino.col,
            this.currentTetromino.angle
        )
        if (!this.bottomOverlapped(tempTetromino) && !this.landedOverlapped(tempTetromino)) {
            this.currentTetromino.fall();
        } else {
            this.mergeCurrentTetromino();
            const clearableRowIndexes = this.findClearableRows();
            this.clearRows(clearableRowIndexes);
            this.score += this.calculateScore(clearableRowIndexes);
            this.currentTetromino = this.nextTetromino;
            this.nextTetromino = this.randomTetromino();
        }
    }

    bottomOverlapped(tetromino) {
        if (tetromino.row + tetromino.height > this.boardHeight) {
            return true;
        }
        return false;
    }

    leftOverlapped(tetromino) {
        if (tetromino.col < 0) {
            return true;
        }
        return false;
    }

    rightOverlapped(tetromino) {
        if (tetromino.col + tetromino.width > this.boardWidth) {
            return true;
        }
        return false;
    }

    landedOverlapped(tetromino) {
        for (let x = 0; x < tetromino.height; x++) {
            for (let y = 0; y < tetromino.width; y++) {
                if (tetromino.shape[x][y] > 0 && this.landedBoard[x + tetromino.row][y + tetromino.col] > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    mergeCurrentTetromino() {
        for (let x = 0; x < this.currentTetromino.height; x++) {
            for (let y = 0; y < this.currentTetromino.width; y++) {
                if (this.currentTetromino.shape[x][y] > 0) {
                    this.landedBoard[x + this.currentTetromino.row]
                                    [y + this.currentTetromino.col] = 
                    this.currentTetromino.shape[x][y];
                }
            }
        }
    }

    updateCurrentBoard() {
        for (let x = 0; x < this.boardHeight; x++) {
            for (let y = 0; y < this.boardWidth; y++) {
                this.currentBoard[x][y] = this.landedBoard[x][y];
            }
        }

        for (let x = 0; x < this.currentTetromino.height; x++) {
            for (let y = 0; y < this.currentTetromino.width; y++) {
                if (this.currentTetromino.shape[x][y] > 0) {
                    this.currentBoard[x + this.currentTetromino.row][y + this.currentTetromino.col] = this.currentTetromino.shape[x][y];
                }
            }
        }
    }

    tryMoveDown() {
        if (!this.gameOver) {
            this.progress();
            this.updateCurrentBoard();
            this.draw();
        }
    }

    tryMoveLeft() {
        if (!this.gameOver) {
            let tempTetromino = new this.currentTetromino.constructor(
                this.currentTetromino.row,
                this.currentTetromino.col - 1,
                this.currentTetromino.angle
            )
            if (!this.leftOverlapped(tempTetromino) && !this.landedOverlapped(tempTetromino)) {
                this.currentTetromino.col -= 1;
                this.updateCurrentBoard();
                this.draw();
            }
        }
    }

    tryMoveRight() {
        if (!this.gameOver) {
            let tempTetromino = new this.currentTetromino.constructor(
                this.currentTetromino.row,
                this.currentTetromino.col + 1,
                this.currentTetromino.angle
            )
            if (!this.rightOverlapped(tempTetromino) && !this.landedOverlapped(tempTetromino)) {
                this.currentTetromino.col += 1;
                this.updateCurrentBoard();
                this.draw();
            }
        }
    }

    tryRotate() {
        if (!this.gameOver) {
            let tempTetromino = new this.currentTetromino.constructor(
                this.currentTetromino.row + 1,
                this.currentTetromino.col,
                this.currentTetromino.angle
            )
            tempTetromino.rotate();
            if (!this.rightOverlapped(tempTetromino) &&
                !this.bottomOverlapped(tempTetromino) &&
                !this.landedOverlapped(tempTetromino)
            ) {
                this.currentTetromino.rotate();
                this.updateCurrentBoard();
                this.draw();
            }
        }
    }

    findClearableRows() {
        const clearableIndexes = [];
        for (let x = 0; x < this.boardHeight; x++){
            if (this.landedBoard[x].every((element) => (element > 0))) {
                clearableIndexes.push(x);
            }
        }
        return clearableIndexes;
    }
    
    clearRows(rowIndexes) {
        rowIndexes.forEach((element) => {
            this.landedBoard.splice(element, 1);
            this.landedBoard.unshift(new Array(this.boardWidth).fill(0));
        })
    }


    calculateScore(rowIndexes) {
        const totalclearableRows = rowIndexes.length;
        return 0.5*totalclearableRows*(totalclearableRows + 1);
    }

    isGameOver() {
        for (let y = 0; y < this.boardWidth; y++) {
            if (this.landedBoard[3][y] > 0) {
                this.gameOver = true;
            }
        }
    }

    getColor(cellNumber) {
        switch (cellNumber) {
          case 1:
            return LShape.color
          case 2:
            return JShape.color
          case 3:
            return OShape.color
          case 4:
            return TShape.color
          case 5:
            return SShape.color
          case 6:
            return ZShape.color
          case 7:
            return IShape.color
        }
    }

    keyDown(event) {
        switch(event.keyCode) {
            case 32:
                this.tryRotate();
                break;
            case 37:
                this.tryMoveLeft();
                break;
            case 39:
                this.tryMoveRight();
                break;
            case 40:
                this.tryMoveDown();
                break;
        }
    }

    
}

class Tetromino {
    constructor(row, col, angle = 0) {
        if (this.constructor === Tetromino) {
            throw new Error('This is an abstract class.')
        }
        this.row = row;
        this.col = col;
        this.angle = angle;
    }
    get shape() {
        return this.constructor.shapes[this.angle];
    }
    get width() {
        return this.shape[0].length;
    }
    get height() {
        return this.shape.length;
    }
    fall() {
        this.row += 1;
    }
    rotate() {
        if (this.angle < 3) {
            this.angle += 1;
        } else {
            this.angle = 0;
        }
    }
    move(direction) {
        if (direction === 'left') {
            this.col -= 1;
        } else if (direction === 'right') {
            this.col += 1;
        }
    }
}

class LShape extends Tetromino {}
LShape.shapes = [
    [[1, 0],
    [1, 0],
    [1, 1]],

    [[1, 1, 1],
    [1, 0, 0]],

    [[1, 1],
    [0, 1],
    [0, 1]],

    [[0, 0, 1],
    [1, 1, 1]]
];
LShape.color = 'rgb(255, 87, 34)';

class JShape extends Tetromino {}
JShape.shapes = [
    [[0, 2],
    [0, 2],
    [2, 2]],

   [[2, 0, 0],
    [2, 2, 2]],

   [[2, 2],
    [2, 0],
    [2, 0]],

   [[2, 2, 2],
    [0, 0, 2]]
];
JShape.color = 'rgb(63, 81, 181)';

class OShape extends Tetromino {}
OShape.shapes = [
  [[3, 3],
    [3, 3]],

   [[3, 3],
    [3, 3]],

   [[3, 3],
    [3, 3]],

   [[3, 3],
    [3, 3]]
];
OShape.color = 'rgb(255, 235, 59)';

class TShape extends Tetromino {}
TShape.shapes = [
    [[0, 4, 0],
    [4, 4, 4]],

   [[4, 0],
    [4, 4],
    [4, 0]],

   [[4, 4, 4],
    [0, 4, 0]],

   [[0, 4],
    [4, 4],
    [0, 4]]
];
TShape.color = 'rgb(156, 39, 176)';

class SShape extends Tetromino {}
SShape.shapes = [
    [[0, 5, 5],
    [5, 5, 0]],

   [[5, 0],
    [5, 5],
    [0, 5]],

   [[0, 5, 5],
    [5, 5, 0]],

   [[5, 0],
    [5, 5],
    [0, 5]]
];
SShape.color = 'rgb(76, 175, 80)';

class ZShape extends Tetromino {}
ZShape.shapes = [
    [[6, 6, 0],
    [0, 6, 6]],

   [[0, 6],
    [6, 6],
    [6, 0]],

   [[6, 6, 0],
    [0, 6, 6]],

   [[0, 6],
    [6, 6],
    [6, 0]]
];
ZShape.color = 'rgb(183, 28, 28)';

class IShape extends Tetromino {}
IShape.shapes = [
    [[7],
    [7],
    [7],
    [7]],

   [[7, 7, 7, 7]],

   [[7],
    [7],
    [7],
    [7]],

   [[7, 7, 7, 7]]
];
IShape.color = 'rgb(0, 188, 212)';

document.getElementById("start-game").addEventListener('click', () => {
    document.getElementById("start-game").style.display = 'none';
    const game = new Game();

    // window.onkeydown = function(event){
    //     switch(event.keyCode) {
    //         case 32:
    //             game.tryRotate();
    //             break;
    //         case 37:
    //             game.tryMoveLeft();
    //             break;
    //         case 39:
    //             game.tryMoveRight();
    //             break;
    //         case 40:
    //             game.tryMoveDown();
    //             break;
    //     }
    // }
})


