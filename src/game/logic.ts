import type { Cell, Direction, Level, Piece } from './types';

export function cellKey(cell: Cell): string {
  return `${cell.row}-${cell.col}`;
}

export function direction(from: Cell, to: Cell): Direction {
  if (to.row < from.row) return 'N';
  if (to.row > from.row) return 'S';
  if (to.col > from.col) return 'E';
  return 'W';
}

function cornerRotation(a: Direction, b: Direction): number {
  const pair = new Set([a, b]);
  if (pair.has('S') && pair.has('E')) return 0;
  if (pair.has('S') && pair.has('W')) return 90;
  if (pair.has('N') && pair.has('W')) return 180;
  return 270;
}

function straightRotation(a: Direction): number {
  return a === 'N' || a === 'S' ? 0 : 90;
}

function startRotation(outgoing: Direction): number {
  if (outgoing === 'E') return 0;
  if (outgoing === 'S') return 90;
  if (outgoing === 'W') return 180;
  return 270;
}

function finishRotation(incoming: Direction): number {
  if (incoming === 'W') return 0;
  if (incoming === 'N') return 90;
  if (incoming === 'E') return 180;
  return 270;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function areAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function isBlocked(level: Level, cell: Cell): boolean {
  return level.blockedCells.some((blocked) => sameCell(blocked, cell));
}

export function canTravel(level: Level, from: Cell, to: Cell): boolean {
  if (!areAdjacent(from, to) || isBlocked(level, to)) return false;
  const oneWay = level.oneWays.find((rule) => sameCell(rule.cell, from));
  return !oneWay || direction(from, to) === oneWay.direction;
}

export function connectFinishIfAdjacent(path: Cell[], finish: Cell, level?: Level): Cell[] {
  const end = path[path.length - 1];
  const canConnect = level ? canTravel(level, end, finish) : areAdjacent(end, finish);
  if (sameCell(end, finish) || !canConnect || path.some((cell) => sameCell(cell, finish))) return path;
  return [...path, finish];
}

export function pieceForPath(path: Cell[], index: number, finish: Cell): Piece {
  const current = path[index];
  if (index === 0) {
    const next = path[1];
    return { kind: 'start', solutionRotation: next ? startRotation(direction(current, next)) : 0 };
  }
  if (sameCell(current, finish)) {
    const previous = path[index - 1];
    return { kind: 'finish', solutionRotation: previous ? finishRotation(direction(current, previous)) : 0 };
  }

  const incoming = direction(current, path[index - 1]);
  const next = path[index + 1];
  if (!next) return { kind: 'straight', solutionRotation: straightRotation(incoming) };

  const outgoing = direction(current, next);
  const isStraight =
    (incoming === 'N' && outgoing === 'S') ||
    (incoming === 'S' && outgoing === 'N') ||
    (incoming === 'E' && outgoing === 'W') ||
    (incoming === 'W' && outgoing === 'E');

  return {
    kind: isStraight ? 'straight' : 'corner',
    solutionRotation: isStraight ? straightRotation(incoming) : cornerRotation(incoming, outgoing),
  };
}

export function pathCounts(level: Level, path: Cell[]) {
  const rows = Array(level.size).fill(0) as number[];
  const cols = Array(level.size).fill(0) as number[];

  path.forEach((cell) => {
    rows[cell.row] += 1;
    cols[cell.col] += 1;
  });
  return { rows, cols };
}

export function isPathSolved(level: Level, path: Cell[]): boolean {
  const finish = level.cells[level.cells.length - 1];
  if (!sameCell(path[path.length - 1], finish)) return false;
  if (new Set(path.map(cellKey)).size !== path.length) return false;
  if (path.some((cell, index) => index > 0 && !canTravel(level, path[index - 1], cell))) return false;
  if (level.checkpoints.some((checkpoint) => !path.some((cell) => sameCell(cell, checkpoint)))) return false;

  const counts = pathCounts(level, path);
  return level.rowClues.every((clue, index) => counts.rows[index] === clue)
    && level.colClues.every((clue, index) => counts.cols[index] === clue);
}

export function hintPath(level: Level, path: Cell[]): Cell[] | null {
  let common = 0;
  while (common < path.length && common < level.cells.length && sameCell(path[common], level.cells[common])) {
    common += 1;
  }
  if (common === level.cells.length) return null;
  return level.cells.slice(0, common + 1);
}

export function starsForMoves(level: Level, moves: number): number {
  if (moves <= level.par + 2) return 3;
  if (moves <= level.par + 7) return 2;
  return 1;
}
