let INIT_FPS = 200;
const WIDTH = 20;
const HEIGHT = 20;
let CANVAS_WIDTH = 500;
let CANVAS_HEIGHT = 500;
let FIELD_AREA = HEIGHT * WIDTH;
let W_SCALE = CANVAS_WIDTH / WIDTH;
let H_SCALE = CANVAS_HEIGHT / HEIGHT;
let [UP, DOWN, LEFT, RIGHT] = Array.from(['u', 'd', 'l', 'r']);

let rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;
// [start, end)
let randInt = (start, end) => Math.floor(Math.random() * (end - start) + start);
let isOpposite = function (d1, d2) {
    switch (d1) {
        case UP:
            if (d2 === DOWN) {
                return true;
            } else {
                return false;
            }
        case DOWN:
            if (d2 === UP) {
                return true;
            } else {
                return false;
            }
        case LEFT:
            if (d2 === RIGHT) {
                return true;
            } else {
                return false;
            }
        case RIGHT:
            if (d2 === LEFT) {
                return true;
            } else {
                return false;
            }
        default:
            throw new Error(`Invalid direction ${d1}`);
    }
};

class Point {
    constructor(public x, public y) {}
    add(x, y) {
        return new Point(this.x + x, this.y + y);
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    toString() {
        return `(${this.x}, ${this.y})`;
    }
}

class Snake {
    body;
    direction;

    constructor(head) {
        this.body = [head];
        this.direction = RIGHT;
    }
    head() {
        return this.body[0];
    }
    tail() {
        return this.body[this.body.length - 1];
    }
    fork() {
        let snake = new Snake(new Point(0, 0));
        // copy array
        snake.body = this.body.slice(0);
        snake.direction = this.direction;
        return snake;
    }
    advance(command) {
        // do nothing if opposite
        if (isOpposite(command, this.direction)) {
            command = this.direction;
        }
        let nextHead = Game.adjacentCell(command, this.head());
        this.body.unshift(nextHead);
        return (this.direction = command);
    }
    move(command) {
        if (isOpposite(command, this.direction)) {
            command = this.direction;
        }
        this.advance(command);
        return this.moveTail();
    }
    moveTail() {
        return this.body.pop();
    }
    bodyHit() {
        // skip head
        for (let seg of Array.from(this.body.slice(1, this.body.length))) {
            if (this.head().equals(seg)) {
                return true;
            }
        }
        return false;
    }
    wallHit() {
        let middle, middle1;
        return !(
            0 <= (middle = this.head().x) &&
            middle < WIDTH &&
            0 <= (middle1 = this.head().y) &&
            middle1 < HEIGHT
        );
    }
}

let PathNotFoundError = {};

class Game {
    fps;
    ticker;
    lastFood;
    marks;
    map;
    commands;
    snake;
    score;
    food;

    static adjacentCell(direction, cell) {
        switch (direction.toLowerCase()) {
            case 'u':
                return cell.add(0, -1);
            case 'd':
                return cell.add(0, 1);
            case 'l':
                return cell.add(-1, 0);
            case 'r':
                return cell.add(1, 0);
            default:
                throw new Error(`Invalid direction ${direction}`);
        }
    }

    constructor(public ctx) {
        let j;

        this.fps = INIT_FPS;
        this.food = new Point(3, 3);
        this.score = 0;
        this.snake = new Snake(new Point(1, 1));
        this.commands = [];
        this.map = (() => {
            let asc, end;
            let result = [];
            for (
                j = 0, end = WIDTH, asc = 0 <= end;
                asc ? j < end : j > end;
                asc ? j++ : j--
            ) {
                result.push(
                    (() => {
                        let result1 = [];
                        for (
                            let i = 0, end1 = HEIGHT, asc1 = 0 <= end1;
                            asc1 ? i < end1 : i > end1;
                            asc1 ? i++ : i--
                        ) {
                            result1.push(null);
                        }
                        return result1;
                    })()
                );
            }
            return result;
        })();
        this.marks = (() => {
            let asc2, end2;
            let result2 = [];
            for (
                j = 0, end2 = WIDTH, asc2 = 0 <= end2;
                asc2 ? j < end2 : j > end2;
                asc2 ? j++ : j--
            ) {
                result2.push(
                    (() => {
                        let result3 = [];
                        for (
                            let i = 0, end3 = HEIGHT, asc3 = 0 <= end3;
                            asc3 ? i < end3 : i > end3;
                            asc3 ? i++ : i--
                        ) {
                            result3.push(false);
                        }
                        return result3;
                    })()
                );
            }
            return result2;
        })();
    }
    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // draw snake
        for (
            let i = 0, end = this.snake.body.length, asc = 0 <= end;
            asc ? i < end : i > end;
            asc ? i++ : i--
        ) {
            let seg = this.snake.body[i];
            this.ctx.fillStyle = rgba(
                133,
                22,
                88,
                1 - 0.7 * (i / this.snake.body.length)
            );
            this.ctx.fillRect(
                seg.x * W_SCALE,
                seg.y * H_SCALE,
                W_SCALE,
                H_SCALE
            );
        }
        // draw food
        this.ctx.fillStyle = 'yellow';
        return this.ctx.fillRect(
            this.food.x * W_SCALE,
            this.food.y * H_SCALE,
            W_SCALE,
            H_SCALE
        );
    }
    placeFood() {
        return (() => {
            let result = [];
            while (true) {
                var food = new Point(randInt(0, WIDTH), randInt(0, HEIGHT));
                if (this.snake.body.every((s) => !s.equals(food))) {
                    // FIXME: this is for debug
                    this.lastFood = this.food;
                    this.food = food;
                    break;
                } else {
                    result.push(undefined);
                }
            }
            return result;
        })();
    }
    onTick() {
        if (this.commands.length === 0) {
            this.commands = Array.prototype.slice.apply(this.makeMoves());
        }
        this.snake.advance(this.commands.shift());
        // always update score
        // check food
        if (this.snake.head().equals(this.food)) {
            this.placeFood();
            this.score++;
        } else {
            // move tail too
            this.snake.moveTail();
        }
        // game over?
        if (this.snake.wallHit() || this.snake.bodyHit()) {
            this.stop();
            return;
        }
        // Unbeliveable!
        if (this.snake.body.length >= WIDTH * HEIGHT - 1) {
            this.stop();
            return;
        }
        // redraw
        this.draw();
        //@ticker = setTimeout @onTick.bind this, 1000 / @fps i
        return (this.ticker = setTimeout(() => this.onTick(), 1000 / this.fps));
    }
    play() {
        return this.onTick();
    }
    stop() {
        return clearTimeout(this.ticker);
    }

    isCellFree(cell, snake) {
        return (
            0 <= cell.x &&
            cell.x < WIDTH &&
            0 <= cell.y &&
            cell.y < HEIGHT &&
            snake.body.every((s) => !s.equals(cell))
        );
    }

    // path to food
    findPathToCell(snake, dest) {
        let head = snake.head();
        for (
            let j = 0, end = WIDTH, asc = 0 <= end;
            asc ? j < end : j > end;
            asc ? j++ : j--
        ) {
            for (
                let i = 0, end1 = HEIGHT, asc1 = 0 <= end1;
                asc1 ? i < end1 : i > end1;
                asc1 ? i++ : i--
            ) {
                this.marks[j][i] = false;
            }
        }
        // BFS queue
        let queue = [new SearchState(head, null)];
        while (queue.length !== 0) {
            let node = queue.shift();
            if (this.marks[node.head.x][node.head.y] === true) {
                continue;
            }
            this.marks[node.head.x][node.head.y] = true;
            // expand node
            for (let dir of [UP, DOWN, LEFT, RIGHT]) {
                let cell = Game.adjacentCell(dir, node.head);
                if (cell.equals(dest)) {
                    return node.traceCmd() + dir;
                }
                if (this.isCellFree(cell, snake)) {
                    queue.push(new SearchState(cell, dir, node));
                }
            }
        }
        throw PathNotFoundError;
    }

    followTail(snake) {
        // from tail to head
        let dir, i, j;
        let asc, end;
        let asc2, end2;
        let head = snake.head();
        let tail = snake.tail();
        for (
            j = 0, end = WIDTH, asc = 0 <= end;
            asc ? j < end : j > end;
            asc ? j++ : j--
        ) {
            var asc1, end1;
            for (
                i = 0, end1 = HEIGHT, asc1 = 0 <= end1;
                asc1 ? i < end1 : i > end1;
                asc1 ? i++ : i--
            ) {
                this.map[j][i] = null;
            }
        }
        this.map[tail.x][tail.y] = 0;
        for (
            j = 0, end2 = WIDTH, asc2 = 0 <= end2;
            asc2 ? j < end2 : j > end2;
            asc2 ? j++ : j--
        ) {
            var asc3, end3;
            for (
                i = 0, end3 = HEIGHT, asc3 = 0 <= end3;
                asc3 ? i < end3 : i > end3;
                asc3 ? i++ : i--
            ) {
                this.marks[j][i] = false;
            }
        }
        let queue = [tail];
        let found = false;
        while (queue.length !== 0) {
            let node = queue.shift();
            if (this.marks[node.x][node.y] === true) {
                continue;
            }
            this.marks[node.x][node.y] = true;
            // expand node
            for (dir of [UP, DOWN, LEFT, RIGHT]) {
                let cell = Game.adjacentCell(dir, node);
                if (cell.equals(head)) {
                    found = true;
                }
                if (this.isCellFree(cell, snake)) {
                    if (this.map[cell.x][cell.y] === null) {
                        this.map[cell.x][cell.y] = this.map[node.x][node.y] + 1;
                    }
                    queue.push(cell);
                }
            }
        }
        if (found) {
            // follow the longest path
            let max = -1;
            let move = null;
            for (dir of [UP, DOWN, LEFT, RIGHT]) {
                let next = Game.adjacentCell(dir, head);
                if (this.isCellFree(next, snake) || next.equals(tail)) {
                    if (
                        this.map[next.x][next.y] > max &&
                        this.map[next.x][next.y] !== null
                    ) {
                        max = this.map[next.x][next.y];
                        move = dir;
                    }
                }
            }
            return move;
        } else {
            throw PathNotFoundError;
        }
    }

    // AI entry
    makeMoves() {
        // manual mode
        try {
            let path = this.findPathToCell(this.snake, this.food);
            let fork = this.snake.fork();
            for (let cmd of Array.from(path)) {
                fork.advance(cmd);
                if (!fork.head().equals(this.food)) {
                    fork.moveTail();
                }
            }
            // can reach tail?
            this.findPathToCell(fork, fork.tail());
            return path;
        } catch (e) {
            if (e === PathNotFoundError) {
                // follow tail
                try {
                    return this.followTail(this.snake);
                } catch (error) {
                    e = error;
                    if (e === PathNotFoundError) {
                        // cannot even reach tail, thus we make random possible move
                        for (let direction of [UP, DOWN, LEFT, RIGHT]) {
                            let next = Game.adjacentCell(
                                direction,
                                this.snake.head()
                            );
                            if (this.isCellFree(next, this.snake)) {
                                return direction;
                            }
                        }
                        // move forward and die hard
                        return this.snake.direction;
                    } else {
                        throw e;
                    }
                }
            } else {
                throw e;
            }
        }
    }
}

class SearchState {
    parent;

    constructor(public head, public cmd, parent = null) {
        if (cmd == null) {
            cmd = '';
        }
    }
    traceCmd() {
        if (this.parent === null) {
            return this.cmd;
        } else {
            return this.parent.traceCmd() + this.cmd;
        }
    }
    toString() {
        return `${this.head}, '${this.traceCmd()}'`;
    }
}
