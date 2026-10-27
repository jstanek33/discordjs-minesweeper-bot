import type { Position } from "#types/utils";
import { seededRandom } from "#utils/seed";

import { SAFE_CELLS } from "./constants.ts";

export class Board {
  readonly #mines: Uint8Array;
  readonly #counts: Uint8Array;
  public readonly size: number;

  public constructor(
    public readonly rows: number,
    public readonly cols: number,
    public readonly bombs: number,
    public readonly seed: string,
  ) {
    this.size = rows * cols;
    this.#mines = new Uint8Array(this.size);
    this.#counts = new Uint8Array(this.size);

    const safe = new Set(SAFE_CELLS.map((position) => this.index(position)));
    const pool = [...this.#mines.keys()].filter((i) => !safe.has(i));
    const random = seededRandom(seed);

    for (let i = 0; i < bombs; i++) {
      const j = i + Math.floor(random() * (pool.length - i));

      const mine = pool[j]!;
      pool[j] = pool[i]!;
      pool[i] = mine;
      this.#mines[mine] = 1;

      for (const n of this.neighbors(pool[i]!)) {
        this.#counts[n]!++;
      }
    }
  }

  public contains({ x, y }: Position): boolean {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  public count(i: number): number {
    return this.#counts[i]!; // mines around cell
  }

  public index({ x, y }: Position): number {
    return y * this.cols + x;
  }

  public isMine(i: number): boolean {
    return this.#mines[i] === 1;
  }

  public *neighbors(i: number): Generator<number> {
    const x = i % this.cols;
    const y = (i - x) / this.cols;

    for (let ny = Math.max(0, y - 1); ny <= Math.min(this.rows - 1, y + 1); ny++) {
      for (let nx = Math.max(0, x - 1); nx <= Math.min(this.cols - 1, x + 1); nx++) {
        if (nx !== x || ny !== y) {
          yield ny * this.cols + nx;
        }
      }
    }
  }
}
