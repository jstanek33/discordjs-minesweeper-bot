import * as crypto from "node:crypto";

export function sha256(input: crypto.BinaryLike): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomSeed(bytes = 12): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
