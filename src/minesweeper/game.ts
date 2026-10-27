import type { Board } from "./board.ts";
import { START } from "./constants.ts";
import { Cell } from "./types.ts";
import type { Action, Position, Status } from "./types.ts";

export class Game {
  public readonly board: Board;
  public readonly cells: Uint8Array;
  public cursor: Position;
  #status: Status;

  public constructor(board: Board, cells: Uint8Array = new Uint8Array(board.size), cursor: Position = START) {
    if (cells.length !== board.size) {
      throw new Error("Cell count does not match the board");
    }

    this.board = board;
    this.cells = cells;
    this.cursor = cursor;
    this.#status = this.#computeStatus();
  }

  #computeStatus(): Status {
    let revealed = 0;

    for (const [i, cell] of this.cells.entries()) {
      if (cell !== Cell.Revealed) {
        continue;
      }

      if (this.board.isMine(i)) {
        return "lost";
      }

      revealed++;
    }

    return revealed === this.board.size - this.board.bombs ? "won" : "playing";
  }

  #open(start: number): void {
    const stack = [start];

    for (let i = stack.pop(); i !== undefined; i = stack.pop()) {
      if (this.cells[i] !== Cell.Hidden) {
        continue;
      }

      this.cells[i] = Cell.Revealed;
      if (!this.board.isMine(i) && this.board.count(i) === 0) {
        stack.push(...this.board.neighbors(i));
      }
    }
  }

  #settle(): void {
    this.#status = this.#computeStatus();

    if (this.#status === "lost") {
      this.cells.fill(Cell.Revealed);
    }

    if (this.#status === "won") {
      for (const i of this.cells.keys()) {
        if (this.board.isMine(i)) this.cells[i] = Cell.Flagged;
      }
    }
  }

  #total(cell: Cell): number {
    return this.cells.filter((c) => c === cell).length;
  }

  public get status(): Status {
    return this.#status;
  }

  public get flags(): number {
    return this.#total(Cell.Flagged);
  }

  public get hidden(): number {
    return this.board.size - this.#total(Cell.Revealed);
  }

  public get remaining(): number {
    return Math.max(0, this.hidden - this.board.bombs);
  }

  public apply(action: Action, target: Position): boolean {
    if (!this.can(action, target)) {
      return false;
    }

    if (action === "move") {
      this.cursor = target; // cells unchanged, so the status is too
      return true;
    }

    const i = this.board.index(target);

    if (action === "flag") {
      this.cells[i] = this.cells[i] === Cell.Flagged ? Cell.Hidden : Cell.Flagged;
    } else {
      this.#open(i);
    }

    this.#settle();
    return true;
  }

  public can(action: Action, target: Position): boolean {
    if (this.status !== "playing" || !this.board.contains(target)) {
      return false;
    }

    const cell = this.cells[this.board.index(target)];

    if (action === "reveal") {
      return cell === Cell.Hidden;
    }

    if (action === "flag") {
      return cell !== Cell.Revealed;
    }

    return true; // move
  }

  public clone(): Game {
    return new Game(this.board, this.cells.slice(), this.cursor);
  }

  public resign(): boolean {
    if (this.status !== "playing") {
      return false;
    }

    this.cells.fill(Cell.Revealed);
    this.#settle();
    return true;
  }
}
