const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function key(row, col) {
  return `${row},${col}`;
}

function turnCount(cells) {
  let turns = 0;
  for (let i = 1; i < cells.length - 1; i += 1) {
    const before = [cells[i].row - cells[i - 1].row, cells[i].col - cells[i - 1].col];
    const after = [cells[i + 1].row - cells[i].row, cells[i + 1].col - cells[i].col];
    if (before[0] !== after[0] || before[1] !== after[1]) turns += 1;
  }
  return turns;
}

function travelDirection(from, to) {
  if (to.row < from.row) return 'N';
  if (to.row > from.row) return 'S';
  if (to.col > from.col) return 'E';
  return 'W';
}

function borderEntrances(size) {
  const entrances = [];
  for (let position = 0; position < size; position += 1) {
    entrances.push({ end: { row: 0, col: position }, inner: { row: 1, col: position }, side: 'N' });
    entrances.push({ end: { row: size - 1, col: position }, inner: { row: size - 2, col: position }, side: 'S' });
    entrances.push({ end: { row: position, col: 0 }, inner: { row: position, col: 1 }, side: 'W' });
    entrances.push({ end: { row: position, col: size - 1 }, inner: { row: position, col: size - 2 }, side: 'E' });
  }
  return entrances;
}

function chooseEndpoints(size, seed, recentEndpointPairs) {
  const random = mulberry32(seed ^ 0x51f15e);
  const entrances = shuffle(borderEntrances(size), random);
  const candidates = [];
  for (const startEntry of entrances) {
    for (const endEntry of entrances) {
      if (startEntry.side === endEntry.side) continue;
      if (key(startEntry.end.row, startEntry.end.col) === key(endEntry.end.row, endEntry.end.col)) continue;
      if (key(startEntry.inner.row, startEntry.inner.col) === key(endEntry.inner.row, endEntry.inner.col)) continue;
      const distance = Math.abs(startEntry.end.row - endEntry.end.row) + Math.abs(startEntry.end.col - endEntry.end.col);
      if (distance < size - 1) continue;
      const signature = `${key(startEntry.end.row, startEntry.end.col)}>${key(endEntry.end.row, endEntry.end.col)}`;
      const recentPenalty = recentEndpointPairs.includes(signature) ? 20 : 0;
      const oppositeBonus = startEntry.side !== endEntry.side ? 2 : 0;
      candidates.push({
        start: startEntry.end,
        first: startEntry.inner,
        preEnd: endEntry.inner,
        end: endEntry.end,
        signature,
        score: distance + oppositeBonus - recentPenalty + random() * 3,
      });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function findPath(size, minLength, minTurns, seed, endpoints) {
  const { start, first, preEnd, end } = endpoints;
  const random = mulberry32(seed);
  const visited = new Set([key(start.row, start.col), key(first.row, first.col)]);
  const currentPath = [start, first];
  let searched = 0;
  const maxSearched = 350000;

  function dfs(cell) {
    searched += 1;
    if (searched > maxSearched) return null;
    if (cell.row === preEnd.row && cell.col === preEnd.col) {
      const completed = [...currentPath, end];
      if (completed.length >= minLength && turnCount(completed) >= minTurns) return completed;
      return null;
    }

    const distance = Math.abs(cell.row - preEnd.row) + Math.abs(cell.col - preEnd.col);
    if (currentPath.length + distance + 1 > size * size) return null;

    let neighbors = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row, col: cell.col + 1 },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
    ].filter((next) => {
      if (next.row < 0 || next.col < 0 || next.row >= size || next.col >= size) return false;
      if (visited.has(key(next.row, next.col))) return false;
      if (next.row === end.row && next.col === end.col) return false;
      return true;
    });

    const needMore = currentPath.length < minLength - 2;
    neighbors = shuffle(neighbors, random)
      .map((next) => {
        const distanceToEnd = Math.abs(next.row - preEnd.row) + Math.abs(next.col - preEnd.col);
        const onwardOptions = [
          [next.row - 1, next.col], [next.row, next.col + 1],
          [next.row + 1, next.col], [next.row, next.col - 1],
        ].filter(([row, col]) => row >= 0 && col >= 0 && row < size && col < size && !visited.has(key(row, col))).length;
        const distanceScore = needMore ? -distanceToEnd : distanceToEnd;
        return { next, priority: distanceScore + onwardOptions * 0.28 + random() * (needMore ? 2.8 : 1.7) };
      })
      .sort((a, b) => a.priority - b.priority)
      .map(({ next }) => next);

    for (const next of neighbors) {
      visited.add(key(next.row, next.col));
      currentPath.push(next);
      const result = dfs(next);
      if (result) return result;
      currentPath.pop();
      visited.delete(key(next.row, next.col));
    }
    return null;
  }

  return dfs(first);
}

function pathSignature(size, cells) {
  return `${size}|${cells.map((cell) => key(cell.row, cell.col)).join(';')}`;
}

function directionSignature(size, cells) {
  return `${size}|${cells.slice(1).map((cell, index) => travelDirection(cells[index], cell)).join('')}`;
}

function clueSignature(size, cells) {
  const rows = Array(size).fill(0);
  const cols = Array(size).fill(0);
  cells.forEach((cell) => { rows[cell.row] += 1; cols[cell.col] += 1; });
  return `${size}|${rows.join('')}/${cols.join('')}`;
}

function mechanicProfile(layer, withinBand) {
  if (layer === 1 && withinBand < 8) return 'C';
  const profiles = layer === 1
    ? ['C', 'B', 'C', 'P', 'B', 'C', 'P', 'BP']
    : layer === 2
      ? ['C', 'B', 'P', 'C', 'W', 'BP', 'BW', 'P', 'PW']
      : ['C', 'B', 'P', 'W', 'BP', 'C', 'BW', 'P', 'PW', 'B', 'BPW', 'W'];
  return profiles[(withinBand * 3 + layer * 5 + Math.floor(withinBand / 7)) % profiles.length];
}

function makeLevel(id, state) {
  const layer = Math.floor((id - 1) / 50) + 1;
  const sizes = [4, 5, 6, 6, 7, 7, 8, 8, 9, 10];
  const size = sizes[layer - 1];
  const withinBand = (id - 1) % 50;
  const stage = Math.floor(withinBand / 10);
  const maxUseful = size * size - (size % 2 === 0 ? 1 : 0);
  const base = 2 * size - 1;
  const lengthWave = [0, 3, 1, 5, 2, 7, 4, 6, 2, 5][withinBand % 10];
  const stageGrowth = stage * Math.max(1, Math.floor(size / 3));
  const maxTarget = Math.max(base, Math.floor(size * size * (0.62 + stage * 0.025)));
  const minLength = Math.min(maxUseful, maxTarget, base + stageGrowth + lengthWave);
  const turnWave = [0, 2, 1, 3, 1, 4, 2, 0, 3, 2][(withinBand + layer) % 10];
  const minTurns = Math.min(Math.max(2, size - 3 + stage + turnWave), minLength - 2);
  let cells = null;
  let usedSeed = 0;
  let endpoints = null;
  for (let attempt = 0; attempt < 1200 && !cells; attempt += 1) {
    usedSeed = id * 1009 + attempt * 7919;
    const candidateEndpoints = chooseEndpoints(size, usedSeed, state.recentEndpointPairs);
    const candidate = findPath(size, minLength, minTurns, usedSeed, candidateEndpoints);
    if (!candidate) continue;
    const exactSignature = pathSignature(size, candidate);
    const directions = directionSignature(size, candidate);
    const clues = clueSignature(size, candidate);
    if (state.usedPaths.has(exactSignature)) continue;
    if (attempt < 800 && state.recentDirections.includes(directions)) continue;
    if (attempt < 600 && state.recentClues.includes(clues)) continue;
    cells = candidate;
    endpoints = candidateEndpoints;
  }
  if (!cells) throw new Error(`Could not generate level ${id}`);

  const rows = Array(size).fill(0);
  const cols = Array(size).fill(0);
  cells.forEach((cell) => {
    rows[cell.row] += 1;
    cols[cell.col] += 1;
  });

  const random = mulberry32(usedSeed + 4049);
  const pathKeys = new Set(cells.map((cell) => key(cell.row, cell.col)));
  const freeCells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!pathKeys.has(key(row, col))) freeCells.push({ row, col });
    }
  }

  const profile = mechanicProfile(layer, withinBand);
  const usesBoulders = profile.includes('B');
  const usesCheckpoints = profile.includes('P');
  const usesOneWay = profile.includes('W');
  const blockedCount = usesBoulders ? Math.min(freeCells.length, 1 + ((withinBand + layer + stage) % Math.max(2, Math.min(5, layer + 1)))) : 0;
  const blockedCells = shuffle(freeCells, random).slice(0, blockedCount);

  const checkpointCount = usesCheckpoints ? Math.min(1 + ((withinBand + stage) % Math.min(3, Math.max(1, layer))), Math.max(1, cells.length - 2)) : 0;
  const checkpoints = [];
  for (let index = 1; index <= checkpointCount; index += 1) {
    const pathIndex = Math.max(1, Math.min(cells.length - 2, Math.round((cells.length - 1) * index / (checkpointCount + 1))));
    if (!checkpoints.some((cell) => key(cell.row, cell.col) === key(cells[pathIndex].row, cells[pathIndex].col))) checkpoints.push(cells[pathIndex]);
  }

  const oneWayCount = usesOneWay ? Math.min(1 + ((withinBand * 2 + layer) % Math.min(4, Math.max(2, layer))), Math.max(1, cells.length - 3)) : 0;
  const oneWayCandidates = shuffle(cells.slice(2, -2).map((cell, offset) => ({ cell, index: offset + 2 })), random)
    .filter(({ cell }) => !checkpoints.some((checkpoint) => key(checkpoint.row, checkpoint.col) === key(cell.row, cell.col)));
  const oneWays = oneWayCandidates.slice(0, oneWayCount).map(({ cell, index }) => ({
    cell,
    direction: travelDirection(cell, cells[index + 1]),
  }));

  const mechanicCount = Number(blockedCells.length > 0) + Number(checkpoints.length > 0) + Number(oneWays.length > 0);
  const mechanic = mechanicCount > 1 ? 'mixed'
    : blockedCells.length ? 'boulders'
      : checkpoints.length ? 'checkpoints'
        : oneWays.length ? 'oneWay' : 'classic';

  const level = {
    id,
    size,
    cells,
    rowClues: rows,
    colClues: cols,
    par: Math.max(1, cells.length - 1),
    difficulty: layer,
    turns: turnCount(cells),
    seed: usedSeed,
    layer,
    stage: stage + 1,
    mechanic,
    blockedCells,
    checkpoints,
    oneWays,
  };

  state.usedPaths.add(pathSignature(size, cells));
  state.recentDirections.push(directionSignature(size, cells));
  state.recentClues.push(clueSignature(size, cells));
  state.recentEndpointPairs.push(endpoints.signature);
  if (state.recentDirections.length > 14) state.recentDirections.shift();
  if (state.recentClues.length > 10) state.recentClues.shift();
  if (state.recentEndpointPairs.length > 7) state.recentEndpointPairs.shift();
  return level;
}

const generationState = { usedPaths: new Set(), recentDirections: [], recentClues: [], recentEndpointPairs: [] };
const levels = Array.from({ length: 500 }, (_, index) => makeLevel(index + 1, generationState));
const target = path.join(__dirname, '..', 'src', 'game', 'levels.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(levels, null, 2)}\n`);
console.log(`Generated ${levels.length} validated levels at ${target}`);

