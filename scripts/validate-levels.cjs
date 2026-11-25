const levels = require('../src/game/levels.json');

function key(cell) {
  return `${cell.row},${cell.col}`;
}

if (levels.length !== 500) throw new Error(`Expected 500 levels, got ${levels.length}`);

let previousBandSize = 0;
const pathSignatures = new Set();
const mechanicTotals = new Map();
let previousEndpointSignature = null;
let previousLevel = null;
for (const level of levels) {
  if (level.id < 1 || level.id > 500) throw new Error('Invalid level id');
  if (level.layer !== Math.floor((level.id - 1) / 50) + 1) throw new Error(`Bad layer in level ${level.id}`);
  if (level.stage !== Math.floor(((level.id - 1) % 50) / 10) + 1) throw new Error(`Bad stage in level ${level.id}`);
  if (level.size < previousBandSize) throw new Error(`Grid size regressed at level ${level.id}`);
  previousBandSize = level.size;
  const seen = new Set();
  level.cells.forEach((cell, index) => {
    if (cell.row < 0 || cell.col < 0 || cell.row >= level.size || cell.col >= level.size) {
      throw new Error(`Out-of-bounds cell in level ${level.id}`);
    }
    if (seen.has(key(cell))) throw new Error(`Duplicate cell in level ${level.id}`);
    seen.add(key(cell));
    if (index > 0) {
      const previous = level.cells[index - 1];
      const distance = Math.abs(previous.row - cell.row) + Math.abs(previous.col - cell.col);
      if (distance !== 1) throw new Error(`Disconnected path in level ${level.id}`);
    }
  });
  const start = level.cells[0];
  const end = level.cells[level.cells.length - 1];
  const pathSignature = `${level.size}|${level.cells.map((cell) => key(cell)).join(';')}`;
  if (pathSignatures.has(pathSignature)) throw new Error(`Repeated route in level ${level.id}`);
  pathSignatures.add(pathSignature);
  const endpointSignature = `${key(start)}>${key(end)}`;
  if (endpointSignature === previousEndpointSignature) throw new Error(`Repeated consecutive endpoints in level ${level.id}`);
  previousEndpointSignature = endpointSignature;
  mechanicTotals.set(level.mechanic, (mechanicTotals.get(level.mechanic) ?? 0) + 1);
  if (previousLevel?.size === level.size) {
    const previousClues = `${previousLevel.rowClues.join(',')}|${previousLevel.colClues.join(',')}`;
    const currentClues = `${level.rowClues.join(',')}|${level.colClues.join(',')}`;
    if (previousClues === currentClues) throw new Error(`Repeated consecutive clue pattern in level ${level.id}`);
    const previousCells = new Set(previousLevel.cells.map(key));
    const currentCells = new Set(level.cells.map(key));
    const intersection = [...previousCells].filter((cell) => currentCells.has(cell)).length;
    const union = new Set([...previousCells, ...currentCells]).size;
    if (intersection / union > 0.9) throw new Error(`Consecutive routes are too similar in level ${level.id}`);
  }
  previousLevel = level;
  const onBorder = (cell) => cell.row === 0 || cell.col === 0 || cell.row === level.size - 1 || cell.col === level.size - 1;
  if (!onBorder(start) || !onBorder(end) || key(start) === key(end)) throw new Error(`Bad endpoints in level ${level.id}`);
  const rowTotal = level.rowClues.reduce((sum, value) => sum + value, 0);
  const colTotal = level.colClues.reduce((sum, value) => sum + value, 0);
  if (rowTotal !== level.cells.length || colTotal !== level.cells.length) {
    throw new Error(`Clue mismatch in level ${level.id}`);
  }
  for (const blocked of level.blockedCells) {
    if (seen.has(key(blocked))) throw new Error(`Blocked cell intersects solution in level ${level.id}`);
  }
  for (const checkpoint of level.checkpoints) {
    if (!seen.has(key(checkpoint))) throw new Error(`Checkpoint is off solution in level ${level.id}`);
  }
  for (const rule of level.oneWays) {
    const index = level.cells.findIndex((cell) => key(cell) === key(rule.cell));
    if (index < 0 || index >= level.cells.length - 1) throw new Error(`Bad one-way cell in level ${level.id}`);
    const next = level.cells[index + 1];
    const expected = next.row < rule.cell.row ? 'N' : next.row > rule.cell.row ? 'S' : next.col > rule.cell.col ? 'E' : 'W';
    if (rule.direction !== expected) throw new Error(`Wrong one-way direction in level ${level.id}`);
  }
}

for (const mechanic of ['classic', 'boulders', 'checkpoints', 'oneWay', 'mixed']) {
  if ((mechanicTotals.get(mechanic) ?? 0) < 25) throw new Error(`Not enough ${mechanic} variety`);
}

console.log(`Validated ${levels.length} unique levels in 10 layers (4x4 through 10x10).`);
