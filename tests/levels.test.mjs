import chai from 'chai';
import { runGame } from '../game/coreMechanic.mjs';
import { startGame, getNextCommand } from '../game/game.mjs';
import easyLevels from './easyLevels/index.mjs';
import fullLevels from './fullLevels/index.mjs';
const expect = chai.expect;

let scoresSum = 0;

describe('levels', () => {
    easyLevels.forEach(level => {
        it(`level ${level.title}`, () => {
            const levelScore = run(level);
            scoresSum += levelScore;
            expect(levelScore).to.above(0);
        });
    });
    fullLevels.forEach(level => {
        it(`FullLevel: ${level.title}`, () => {
            const levelScore = run(level);
            scoresSum += levelScore;
            expect(levelScore).to.above(0);
        });
    });
    after(() => {
        console.log(`---------------------------------------`);
        console.log(`   Сумма очков за все уровни ${scoresSum}`);
        console.log(`---------------------------------------`);
    });
});

function run({ snake, meals, fieldSize, maxTicks }) {
    const iterGame = runGame(snake, meals, fieldSize, maxTicks);
    let gameState = iterGame.next().value;
    startGame([...snake], [...meals], fieldSize, maxTicks);

    while (!gameState.gameOver) {
        const command = getNextCommand(
            [...gameState.snake],
            gameState.currentMeal
        );
        gameState = iterGame.next(command).value;
    }

    return gameState.maxScore;
}
