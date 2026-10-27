import * as crypto from "node:crypto";

import { env } from "#env";
import { SEED_BYTES } from "#minesweeper/random";

// users can't edit the embed, so neither an IV nor an auth tag is needed.
const KEY = crypto.createHash("sha256").update(env.GAME_SECRET).digest();
const BLOCK = 16;

export function seal(seed: string): string {
  const bytes = Buffer.from(seed, "base64url");

  if (bytes.length !== SEED_BYTES || bytes.toString("base64url") !== seed) {
    throw new Error("Only seeds from randomSeed() can be sealed");
  }

  const cipher = crypto.createCipheriv("aes-256-ecb", KEY, null).setAutoPadding(false);
  const block = Buffer.concat([bytes, Buffer.alloc(BLOCK - SEED_BYTES)]);

  return Buffer.concat([cipher.update(block), cipher.final()]).toString("base64url");
}

export function unseal(token: string): string {
  const decipher = crypto.createDecipheriv("aes-256-ecb", KEY, null).setAutoPadding(false);
  const block = Buffer.concat([decipher.update(Buffer.from(token, "base64url")), decipher.final()]);

  return block.subarray(0, SEED_BYTES).toString("base64url");
}
