import * as crypto from "node:crypto";

import { env } from "#env";

const KEY = crypto.createHash("sha256").update(env.GAME_SECRET).digest();
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

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

export function seal(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

export function unseal(token: string): string {
  const raw = Buffer.from(token, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, raw.subarray(0, IV_LENGTH));
  decipher.setAuthTag(raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
  return Buffer.concat([decipher.update(raw.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]).toString("utf8");
}
