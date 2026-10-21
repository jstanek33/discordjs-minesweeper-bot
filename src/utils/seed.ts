import * as crypto from "node:crypto";

import { env } from "#env";

const KEY = crypto.createHash("sha256").update(env.GAME_SECRET).digest();
const BLOCK = 16;
const SEED_BYTES = 12;

// mulberry32 prng
export function seededRandom(seed: string): () => number {
  let state = crypto.createHash("sha256").update(seed).digest().readUInt32LE(0);

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

export function randomSeed(): string {
  return crypto.randomBytes(SEED_BYTES).toString("base64url");
}

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
