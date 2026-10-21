import type { Position } from "#types/utils";

import type { Board } from "./board.ts";
import { START } from "./constants.ts";
import type { Action, Status } from "./constants.ts";

export enum Cell {
  Hidden = 0,
  Flagged = 1,
  Revealed = 2,
}

export class Game {
  public readonly board: Board;
  public readonly cells: Uint8Array;
  public cursor: Position;

  public constructor(board: Board, cells: Uint8Array = new Uint8Array(board.size), cursor: Position = START) {
    if (cells.length !== board.size) {
      throw new Error("Cell count does not match the board");
    }

    this.board = board;
    this.cells = cells;
    this.cursor = cursor;
  }

  #total(cell: Cell): number {
    return this.cells.filter((c) => c === cell).length;
  }

  #open(stack: number[]): void {
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
    const status = this.status;

    if (status === "lost") {
      this.cells.fill(Cell.Revealed);
    }

    if (status === "won") {
      for (const i of this.cells.keys()) {
        if (this.board.isMine(i)) this.cells[i] = Cell.Flagged;
      }
    }
  }

  public get status(): Status {
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

    const i = this.board.index(target);
    switch (action) {
      case "move":
        this.cursor = target;
        break;
      case "flag":
        this.cells[i] = this.cells[i] === Cell.Flagged ? Cell.Hidden : Cell.Flagged;
        break;
      case "reveal":
        this.#open([i]);
        break;
      case "chord":
        this.#open([...this.board.neighbors(i)]);
        break;
    }

    this.#settle();
    return true;
  }

  public can(action: Action, target: Position): boolean {
    if (this.status !== "playing" || !this.board.contains(target)) {
      return false;
    }

    const i = this.board.index(target);
    const cell = this.cells[i];
    const checks: Record<Action, () => boolean> = {
      move: () => true,
      reveal: () => cell === Cell.Hidden,
      flag: () => cell !== Cell.Revealed,
      chord: () => {
        const around = [...this.board.neighbors(i)].map((n) => this.cells[n]);

        return (
          cell === Cell.Revealed &&
          around.filter((c) => c === Cell.Flagged).length === this.board.count(i) &&
          around.includes(Cell.Hidden)
        );
      },
    };

    return checks[action]();
  }

  public clone(): Game {
    return new Game(this.board, this.cells.slice(), this.cursor);
  }

  public resign(): boolean {
    if (this.status !== "playing") {
      return false;
    }

    this.cells.fill(Cell.Revealed);
    return true;
  }
}
