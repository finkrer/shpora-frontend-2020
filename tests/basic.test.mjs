import chai from 'chai';
import { commands } from '../game/coreMechanic.mjs';
import { startGame, getNextCommand } from '../game/game.mjs';
const expect = chai.expect;

const snake = ['5;4', '5;5', '5;6', '5;7'];
const meals = ['5;1'];
const fieldSize = 10;
const maxTicks = 4;

describe('basic', () => {
    it('getNextCommand возвращает строку', () => {
        startGame(snake, meals, fieldSize, maxTicks);
        expect(typeof getNextCommand([...snake], meals[0])).to.equal('string');
    });
    it('getNextCommand возвращает валидную команду', () => {
        startGame(snake, meals, fieldSize, maxTicks);
        const commandsStrings = Object.values(commands);
        const nextCommand = getNextCommand([...snake], meals[0]);
        expect(commandsStrings).to.include(nextCommand);
    });
});
