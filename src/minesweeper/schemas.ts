import * as z from "zod";

import { MAX_SIZE, MIN_SIZE, SEED_PATTERN } from "./constants.ts";

export const boardSizeSchema = z.int().min(MIN_SIZE).max(MAX_SIZE);
export const bombsSchema = z.int().min(1);
export const seedSchema = z.string().regex(SEED_PATTERN, "Seed: litery, cyfry, _ lub -, maks. 32 znaki");
