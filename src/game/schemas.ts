import * as z from "zod";

import { DEFAULT_SIZE, MAX_SIZE, MIN_SIZE, SEED_PATTERN } from "#minesweeper/constants";
import { randomSeed } from "#minesweeper/random";
import { defaultBombs, maxBombs } from "#minesweeper/rules";

const boardSizeSchema = z.int().min(MIN_SIZE).max(MAX_SIZE);
const bombsSchema = z.int().min(1);
const seedSchema = z.string().regex(SEED_PATTERN, "Seed: litery, cyfry, _ lub -, maks. 32 znaki");

export type GameSpec = z.infer<typeof gameSpecSchema>;
export const gameSpecSchema = z
  .object({
    rows: boardSizeSchema,
    cols: boardSizeSchema,
    bombs: bombsSchema,
    seed: seedSchema,
    ranked: z.boolean(),
  })
  .superRefine(({ rows, cols, bombs }, ctx) => {
    const max = maxBombs(rows, cols);

    if (bombs > max) {
      ctx.addIssue({
        code: "custom",
        path: ["bombs"],
        message: `Plansza ${cols}x${rows} mieści maks. ${max} bomb`,
      });
    }
  });

export const createOptionsSchema = z
  .object({
    rows: boardSizeSchema.default(DEFAULT_SIZE),
    cols: boardSizeSchema.default(DEFAULT_SIZE),
    bombs: bombsSchema.optional(),
    seed: seedSchema.optional(),
    ranked: z.boolean().default(false),
  })
  .refine(({ ranked, seed }) => !(ranked && seed), {
    path: ["seed"],
    message: "Gra rankingowa nie może mieć własnego seeda",
  })
  .refine(({ ranked, rows, cols, bombs }) => !(ranked && (rows ?? cols ?? bombs) !== undefined), {
    path: ["ranked"],
    message: `Gra rankingowa ma stałą planszę ${DEFAULT_SIZE}x${DEFAULT_SIZE}`,
  })
  .transform((options) => {
    const rows = options.rows ?? DEFAULT_SIZE;
    const cols = options.cols ?? DEFAULT_SIZE;

    return {
      ...options,
      rows,
      cols,
      bombs: options.bombs ?? defaultBombs(rows, cols),
      seed: options.seed ?? randomSeed(),
    };
  })
  .pipe(gameSpecSchema);
