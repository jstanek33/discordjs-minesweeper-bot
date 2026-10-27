export interface Position {
  readonly x: number;
  readonly y: number;
}

export type Cell = (typeof Cell)[keyof typeof Cell];
export const Cell = {
  Hidden: 0,
  Flagged: 1,
  Revealed: 2,
} as const;

export const ACTIONS = ["move", "reveal", "flag"] as const;
export type Action = (typeof ACTIONS)[number];

export const STATUSES = ["playing", "won", "lost"] as const;
export type Status = (typeof STATUSES)[number];
