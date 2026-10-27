import * as z from "zod";

import { DEFAULT_SIZE, MAX_SIZE, MIN_SIZE, SEED_PATTERN } from "#minesweeper/constants";
import { randomSeed } from "#minesweeper/random";
import { defaultBombs, maxBombs } from "#minesweeper/rules";
import { ACTIONS } from "#minesweeper/types";

import { BUTTON_PREFIX } from "./constants.ts";

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
  .transform((options) => ({
    ...options,
    bombs: options.bombs ?? defaultBombs(options.rows, options.cols),
    seed: options.seed ?? randomSeed(),
  }))
  .pipe(gameSpecSchema);

export const coordinateSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(MAX_SIZE - 1);

export const buttonIdSchema = z.tuple([z.literal(BUTTON_PREFIX), z.enum(ACTIONS), coordinateSchema, coordinateSchema]);
