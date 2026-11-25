export type Cell = {
  row: number;
  col: number;
};

export type Direction = 'N' | 'E' | 'S' | 'W';

export type OneWay = {
  cell: Cell;
  direction: Direction;
};

export type LevelMechanic = 'classic' | 'boulders' | 'checkpoints' | 'oneWay' | 'mixed';

export type Level = {
  id: number;
  size: number;
  cells: Cell[];
  rowClues: number[];
  colClues: number[];
  par: number;
  difficulty: number;
  turns: number;
  seed: number;
  layer: number;
  stage: number;
  mechanic: LevelMechanic;
  blockedCells: Cell[];
  checkpoints: Cell[];
  oneWays: OneWay[];
};

export type PieceKind = 'start' | 'finish' | 'straight' | 'corner';

export type Piece = {
  kind: PieceKind;
  solutionRotation: number;
};

export type RotationMap = Record<string, number>;

