export const commands = {
    FORWARD: "FORWARD",
    TURN_LEFT: "TURN_LEFT",
    TURN_RIGHT: "TURN_RIGHT",
}
const directions = [ 'up', 'right', 'down', 'left' ];

const directionsShift = {
    up: { name: 'up', x: 0, y: -1 },
    down: { name: 'down', x: 0, y: 1 },
    left: { name: 'left', x: -1, y: 0 },
    right: { name: 'right', x: 1, y: 0 },
}

export function* runGame(snake, meals, fieldSize = 10, maxTickCount = 500) {
    const game = new Game(snake, meals, fieldSize, maxTickCount);
    
    do {
        const command = yield { ...game };
        game.applyCommand(command);
        game.runNextTick();
    } while (true);
}

class Game {
    static lengthCoefficient = 10;
    static timeCoefficient = 1;

    constructor(snake, meals, fieldSize, maxTickCount) {
        this.snake = [ ...snake ];
        this.meals = [ ...meals ];
        this.fieldSize = fieldSize;
        this.currentMeal = meals[0];
        this.snakeDirection = this.getSnakeDirection();
        this.tick = 0;
        this.gameOver = false;
        this.maxTickCount = maxTickCount;
        this.maxScore = 0;
    }

    getSnakeDirection() {
        const [ headX, headY ] = this.snake[0].split(';');
        const [ neckX, neckY ] = this.snake[1].split(';');
        const xShift = headX - neckX;
        const yShift = headY - neckY;

        if (yShift === 1) return directionsShift.down;
        if (yShift === -1) return directionsShift.up;
        if (xShift === 1) return directionsShift.right;
        if (xShift === -1) return directionsShift.left;
    }

    applyCommand(command) {
        const currentDirectionIndex = directions.findIndex((i) => i === this.snakeDirection.name);
        let newDirection;
        switch (command) {
            case commands.FORWARD:
                return;
            case commands.TURN_LEFT:
                newDirection = currentDirectionIndex - 1 === -1 ? 3 : currentDirectionIndex - 1;
                this.snakeDirection = directionsShift[directions[newDirection]];
                return;
            case commands.TURN_RIGHT:
                newDirection = (currentDirectionIndex + 1) % directions.length;
                this.snakeDirection = directionsShift[directions[newDirection]];
                return;
            default:
                this.gameOver = true;
                console.error(`Invalid command: ${ command }`);
        }
    }

    runNextTick() {
        if (this.gameOver) return;
        this.tick++;

        if (this.tick > this.maxTickCount) {
            this.gameOver = true;
            console.log('Time is over');
            return;
        }

        this.moveSnake();
        this.updateScore();
    }

    moveSnake() {
        const [ headX, headY ] = this.snake[0].split(';');
        const newHeadX = parseInt(headX) + this.snakeDirection.x;
        const newHeadY = parseInt(headY) + this.snakeDirection.y;

        if (newHeadX < 0 || newHeadY < 0 || newHeadX >= this.fieldSize || newHeadY >= this.fieldSize) {
            this.gameOver = true;
            console.error('Snake is in the wall!');
            return;
        }
        const coord = `${ newHeadX };${ newHeadY }`;
        if (this.snake.includes(coord) && coord !== this.snake[this.snake.length - 1]) {
            this.gameOver = true;
            console.error('Snake ate itself!');
            return;
        }

        this.snake.unshift(coord);
        if (coord === this.currentMeal) {
            this.eatMeal();
        } else {
            this.snake.pop();
        }
    }

    eatMeal() {
        this.meals.shift();
        this.currentMeal = this.meals[0];
        this.cutTheTail();

        if (this.meals.length === 0) {
            this.gameOver = true;
            console.log('Food is over');
        }
    }

    cutTheTail() {
        const indexOfFood = this.snake.indexOf(this.currentMeal);
        if (indexOfFood !== -1) {
            this.snake.length = indexOfFood;
        }
        if (this.snake.length === 0) {
            this.gameOver = true;
            console.log('Snake is dead!');
        }
    }

    updateScore() {
        const newScore = this.snake.length * Game.lengthCoefficient + this.tick * Game.timeCoefficient;

        if (newScore > this.maxScore) {
            this.maxScore = newScore;
        }
    }
}
