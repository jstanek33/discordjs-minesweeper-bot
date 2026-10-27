import * as crypto from "node:crypto";

export const SEED_BYTES = 12;

// mulberry32 prng, seeded with the SHA-256 of `seed`; yields <0, 1)
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
