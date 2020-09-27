export async function renderField(snakeCells, meal, fieldSize) {
    await delay(30);
    console.clear();
    for (let y = 0; y < fieldSize; y++) {
        let row = '';
        for (let x = 0; x < fieldSize; x++) {
            let coord = `${x};${y}`;
            if (meal === coord) {
                row += '*';
                continue;
            }
            if (snakeCells[0] === coord) {
                row += '0';
                continue;
            }
            if (snakeCells.includes(coord)) {
                row += '#';
                continue;
            }
            row += '.';
        }
        console.log(row);
    }
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
