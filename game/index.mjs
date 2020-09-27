import { runGame } from './coreMechanic.mjs';
import { startGame, getNextCommand } from './game.mjs';
import { renderField } from './visualizer.mjs';
import easyLevels from '../tests/easyLevels/index.mjs';
import fullLevels from '../tests/fullLevels/index.mjs';

async function run({ snake, meals, fieldSize, maxTicks }) {
    const iterGame = runGame(snake, meals, fieldSize, maxTicks);
    let gameState = iterGame.next().value;
    startGame([...snake], [...meals], fieldSize, maxTicks);

    do {
        await renderField(
            [...gameState.snake],
            gameState.currentMeal,
            fieldSize
        );
        const command = getNextCommand(
            [...gameState.snake],
            gameState.currentMeal
        );
        gameState = iterGame.next(command).value;
    } while (!gameState.gameOver);

    console.log(`Your Score is ${gameState.maxScore}`);
}

run(fullLevels[22]);
