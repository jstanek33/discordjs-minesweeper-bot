import { DEFAULT_DENSITY, SAFE_CELLS } from "./constants.ts";

export function maxBombs(rows: number, cols: number): number {
  return rows * cols - SAFE_CELLS.length;
}

export function defaultBombs(rows: number, cols: number): number {
  return Math.min(maxBombs(rows, cols), Math.max(1, Math.round(rows * cols * DEFAULT_DENSITY)));
}
