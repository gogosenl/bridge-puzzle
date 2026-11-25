import rawLevels from './levels.json';
import type { Level } from './types';

export const levels = rawLevels as Level[];

export function getLevel(id: number): Level {
  return levels[Math.max(0, Math.min(levels.length - 1, id - 1))];
}

