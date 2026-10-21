import * as crypto from "node:crypto";

export function sha256(input: crypto.BinaryLike): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomSeed(bytes = 12): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

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
