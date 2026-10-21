import type { Game } from "#minesweeper/game";
import { Cell } from "#minesweeper/game";
import type { Position } from "#types/utils";
import { fail } from "#utils/errors";

import { Emoji } from "./constants.ts";

const CELL_BY_EMOJI = new Map<string, Cell>(
  (
    [
      [Emoji.hidden, Cell.Hidden],
      [Emoji.focus.hidden, Cell.Hidden],
      [Emoji.flag, Cell.Flagged],
      [Emoji.focus.flag, Cell.Flagged],
      ...[Emoji.empty, Emoji.focus.empty, Emoji.mine, ...Emoji.digits].map((emoji): [string, Cell] => [
        emoji,
        Cell.Revealed,
      ]),
    ] as const
  ).map(([emoji, cell]) => [bare(emoji), cell]),
);

function bare(emoji: string): string {
  return emoji.replaceAll("️", ""); // U+FE0F -> ""
}

function graphemes(line: string): string[] {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(line), ({ segment }) => bare(segment));
}

function cellEmoji(game: Game, i: number): string {
  const focused = i === game.board.index(game.cursor) && game.status === "playing";

  switch (game.cells[i]) {
    case Cell.Hidden:
      return focused ? Emoji.focus.hidden : Emoji.hidden;
    case Cell.Flagged:
      return focused ? Emoji.focus.flag : Emoji.flag;
    default: {
      if (game.board.isMine(i)) {
        return Emoji.mine;
      }

      const count = game.board.count(i);

      if (count > 0) {
        return Emoji.digits[count - 1]!;
      }

      return focused ? Emoji.focus.empty : Emoji.empty;
    }
  }
}

export function parseGrid(text: string, rows: number, cols: number): { cells: Uint8Array; cursor: Position } {
  const lines = text.split("\n").map(graphemes);

  if (lines.length !== rows + 2 || lines.some((line) => line.length !== cols + 2)) {
    throw new Error("Grid does not match the board size");
  }

  const cursor = {
    x: lines[0]!.indexOf(bare(Emoji.cursor.top)) - 1,
    y: lines.findIndex((line) => line[0] === bare(Emoji.cursor.left)) - 1,
  };

  if (cursor.x < 0 || cursor.y < 0) {
    throw new Error("Grid has no cursor");
  }

  const cells = Uint8Array.from(
    lines.slice(1, -1).flatMap((line) => line.slice(1, -1)),
    (emoji) => CELL_BY_EMOJI.get(emoji) ?? fail(`Unknown cell emoji: ${emoji}`),
  );

  return {
    cells,
    cursor,
  };
}

export function renderGrid(game: Game): string {
  const { board, cursor } = game;

  // oxlint-disable-next-line unicorn/consistent-function-scoping -- helper
  function span<T>(length: number, map: (i: number) => T): T[] {
    return Array.from({ length }, (_, i) => map(i));
  }

  function edge(arrow: string): string[] {
    return [Emoji.frame, ...span(board.cols, (x) => (x === cursor.x ? arrow : Emoji.frame)), Emoji.frame];
  }

  function row(y: number): string[] {
    function side(arrow: string): string {
      return y === cursor.y ? arrow : Emoji.frame;
    }

    return [
      side(Emoji.cursor.left),
      ...span(board.cols, (x) => cellEmoji(game, board.index({ x, y }))),
      side(Emoji.cursor.right),
    ];
  }

  return [edge(Emoji.cursor.top), ...span(board.rows, row), edge(Emoji.cursor.bottom)]
    .map((line) => line.join(""))
    .join("\n");
}
