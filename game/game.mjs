import { commands } from './coreMechanic.mjs';

const directionsShift = {
    up: { name: 'up', x: 0, y: -1, order: 0 },
    down: { name: 'down', x: 0, y: 1, order: 2 },
    left: { name: 'left', x: -1, y: 0, order: 3 },
    right: { name: 'right', x: 1, y: 0, order: 1 },
};

const directions = [
    directionsShift.up,
    directionsShift.right,
    directionsShift.down,
    directionsShift.left,
];

let ai;

export function startGame(snake, meals, fieldSize, maxTicks) {
    ai = new AI(snake, meals, fieldSize, maxTicks);
}

export function getNextCommand(snake, meal) {
    return ai.getNextCommand(snake, meal);
}

class Point {
    constructor(x, y, string) {
        this.x = x;
        this.y = y;
        this.string = string ? string : `${x};${y}`;
    }

    static fromString(string) {
        const [x, y] = string.split(';');
        return new Point(parseInt(x), parseInt(y), string);
    }

    pointTo(direction) {
        return new Point(this.x + direction.x, this.y + direction.y);
    }

    pointOppositeTo(direction) {
        return new Point(this.x - direction.x, this.y - direction.y);
    }

    distanceTo(other) {
        return Math.sqrt(
            Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
        );
    }

    getNeighbors(fieldSize) {
        return directions
            .map(d => this.pointTo(d))
            .filter(p => p.fitsInto(fieldSize));
    }

    fitsInto(fieldSize) {
        return (
            this.x >= 0 &&
            this.y >= 0 &&
            this.x < fieldSize &&
            this.y < fieldSize
        );
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

class AI {
    constructor(snake, meals, fieldSize, maxTicks) {
        this.snake = snake.map(Point.fromString);
        this.meals = meals.map(Point.fromString);

        const head = Point.fromString(snake[0]);
        const neck = Point.fromString(snake[1]);
        this.direction = this.getDirection(neck, head);

        this.fieldSize = fieldSize;
        this.tick = 0;
        this.maxTicks = maxTicks ? maxTicks : 500;

        this.shouldRest = true;
        this.corners = [
            new Point(1, 1),
            new Point(fieldSize - 2, 1),
            new Point(fieldSize - 2, fieldSize - 2),
            new Point(1, fieldSize - 2),
        ];
        this.currentMeal = 0;
    }

    getNextCommand(snake, meal) {
        this.tick++;
        if (this.tick === Math.max(1, this.maxTicks - 200))
            this.shouldRest = false;

        this.snake = snake.map(Point.fromString);
        meal = Point.fromString(meal);

        if (!meal.equals(this.meals[this.currentMeal])) {
            this.currentMeal++;
            if (
                this.meals[this.currentMeal + 1] &&
                this.meals[this.currentMeal].equals(
                    this.meals[this.currentMeal + 1]
                )
            )
                this.shouldRest = true;
        }

        if (this.shouldRest) {
            this.snake.push(this.meals[this.currentMeal]);
            // no thanks, I'm not hungry
            return this.rest();
        }

        return this.getDirectionTo(meal);
    }

    rest() {
        if (this.corner) {
            if (this.snake[0].equals(this.corner)) this.corner = null;
            else return this.getDirectionTo(this.corner);
        }

        let maxDist = -1;
        let farthestCorner;

        for (const corner of this.corners) {
            const dist = this.snake[0].distanceTo(corner);
            if (dist > maxDist) {
                maxDist = dist;
                farthestCorner = corner;
            }
        }

        this.corner = farthestCorner;

        return this.getDirectionTo(this.corner);
    }

    getDirectionTo(target) {
        const head = this.snake[0];

        let path = this.findPath(head, target);
        let next;

        if (
            (!path.has(head.string) || !this.tailReachableAfter(path)) &&
            this.snake.length > 1
        ) {
            const tail = this.snake[this.snake.length - 1];
            path = this.findLongestPath(head, tail);

            let max = -1;
            for (const d of directions) {
                if (this.canMoveTo(d)) {
                    const attempt = head.pointTo(d);
                    if (
                        path.has(attempt.string) &&
                        path.get(attempt.string) > max
                    ) {
                        max = path.get(attempt.string);
                        next = attempt;
                    }
                }
            }
        } else next = path.get(head.string);

        const updateDirection = turnDirection => {
            this.direction = this.getDirectionAfterTurn(
                this.direction,
                turnDirection
            );
            return turnDirection;
        };

        if (!next) {
            if (
                this.canMoveTo(
                    this.getDirectionAfterTurn(
                        this.direction,
                        commands.TURN_RIGHT
                    )
                )
            )
                return updateDirection(commands.TURN_RIGHT);
            if (
                this.canMoveTo(
                    this.getDirectionAfterTurn(
                        this.direction,
                        commands.TURN_LEFT
                    )
                )
            )
                return updateDirection(commands.TURN_LEFT);
            return updateDirection(commands.FORWARD);
        }

        const nextDirection = this.getDirection(head, next);
        const turnDirection = this.getTurnDirection(
            this.direction,
            nextDirection
        );
        return updateDirection(turnDirection);
    }

    getTurnDirection(snakeDirection, nextDirection) {
        let angle = (nextDirection.order - snakeDirection.order) % 4;
        while (angle <= -2) angle += 4;
        while (angle > 2) angle -= 4;

        switch (angle) {
            case -1:
                return commands.TURN_LEFT;
            case 0:
                return commands.FORWARD;
            case 1:
                return commands.TURN_RIGHT;
            case 2:
                if (
                    this.canMoveTo(
                        this.getDirectionAfterTurn(
                            this.direction,
                            commands.TURN_RIGHT
                        )
                    )
                )
                    return commands.TURN_RIGHT;
                if (
                    this.canMoveTo(
                        this.getDirectionAfterTurn(
                            this.direction,
                            commands.TURN_LEFT
                        )
                    )
                )
                    return commands.TURN_LEFT;
                return commands.FORWARD;
        }
    }

    getDirectionAfterTurn(direction, turn) {
        let d = direction.order;

        switch (turn) {
            case 'FORWARD':
                break;
            case 'TURN_RIGHT':
                d++;
                break;
            case 'TURN_LEFT':
                d--;
                break;
        }

        while (d < 0) d += 4;
        while (d > 3) d -= 4;

        return directions[d];
    }

    getDirection(from, to) {
        const xShift = to.x - from.x;
        const yShift = to.y - from.y;

        if (yShift === 1) return directionsShift.down;
        if (yShift === -1) return directionsShift.up;
        if (xShift === 1) return directionsShift.right;
        if (xShift === -1) return directionsShift.left;
    }

    canMoveTo(direction) {
        const head = this.snake[0];
        const nextPoint = head.pointTo(direction);

        return (
            nextPoint.fitsInto(this.fieldSize) &&
            !this.snake.some(p => p.equals(nextPoint))
        );
    }

    findPath(start, target) {
        const queue = [target];
        const explored = new Set();
        const prev = new Map();
        const blocked = new Set(this.snake.slice(1).map(p => p.string));

        if (blocked.has(target)) return prev;

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.equals(start)) break;
            if (explored.has(current.string)) continue;
            explored.add(current.string);

            current
                .getNeighbors(this.fieldSize)
                .filter(p => !blocked.has(p.string) && !explored.has(p.string))
                .forEach(p => {
                    queue.push(p);
                    prev.set(p.string, current);
                });
        }

        return prev;
    }

    findLongestPath(start, target) {
        const queue = [target];
        const explored = new Set();
        const distances = new Map();
        distances.set(target.string, 0);
        const blocked = new Set(this.snake.slice(1).map(p => p.string));

        if (blocked.has(target)) return prev;

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.equals(start)) break;
            if (explored.has(current.string)) continue;
            explored.add(current.string);

            current
                .getNeighbors(this.fieldSize)
                .filter(p => !blocked.has(p.string) && !explored.has(p.string))
                .forEach(p => {
                    if (!distances.has(p.string))
                        distances.set(
                            p.string,
                            distances.get(current.string) + 1
                        );
                    queue.push(p);
                });
        }

        return distances;
    }

    tailReachableAfter(prev) {
        let snake = [...this.snake];

        let path = [];
        let current = snake[0];

        while (prev.has(current.string)) {
            const next = prev.get(current.string);
            path.push(next);
            current = next;
        }

        const end = path[path.length - 1];

        for (const step of path) {
            snake.unshift(step);
            if (!step.equals(end)) snake.pop();
        }

        const head = snake[0];
        const tail = snake[snake.length - 1];

        const tailPath = this.findPath(head, tail);

        return tailPath.has(head.string);
    }
}
