import type { Position } from "#types/utils";

export const MIN_SIZE = 5;
export const MAX_SIZE = 15;
export const DEFAULT_SIZE = 11;
export const DEFAULT_DENSITY = 20 / (DEFAULT_SIZE * DEFAULT_SIZE);

export const START: Position = { x: 0, y: 0 };
export const SAFE_CELLS: readonly Position[] = [START];

export const SEED_PATTERN = /^[\w-]{1,32}$/;

export const ACTIONS = ["move", "reveal", "flag"] as const;
export type Action = (typeof ACTIONS)[number];

export const STATUSES = ["playing", "won", "lost"] as const;
export type Status = (typeof STATUSES)[number];
