import type { Action } from "#minesweeper/constants";

export interface Control {
  action: Action | null;
  emoji: string;
  /** Offset from cursor to target cell */
  dx?: number;
  dy?: number;
}
