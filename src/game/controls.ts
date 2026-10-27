import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as z from "zod";

import { decodeCustomId, encodeCustomId } from "#core/custom-id";
import { MAX_SIZE } from "#minesweeper/constants";
import type { Game } from "#minesweeper/game";
import { ACTIONS } from "#minesweeper/types";
import type { Action, Position } from "#minesweeper/types";

export const BUTTON_PREFIX = "game";
const PLACEHOLDER_ID = encodeCustomId(BUTTON_PREFIX, "none");

interface Control {
  /** `null` is a placeholder */
  action: Action | null;
  emoji: string;
  /** Offset from cursor to target cell */
  dx?: number;
  dy?: number;
}

const coordinateSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(MAX_SIZE - 1);
const buttonIdSchema = z.tuple([z.literal(BUTTON_PREFIX), z.enum(ACTIONS), coordinateSchema, coordinateSchema]);

const LAYOUT: Control[][] = [
  [move("↖️", -1, -1), move("⬆️", 0, -1), move("↗️", 1, -1), { action: "flag", emoji: "🚩" }],
  [move("⬅️", -1, 0), { action: null, emoji: "⬛" }, move("➡️", 1, 0), { action: "reveal", emoji: "✅" }],
  [move("↙️", -1, 1), move("⬇️", 0, 1), move("↘️", 1, 1)],
];

export const CONTROLS_LEGEND: readonly (readonly [emoji: string, meaning: string])[] = [
  [emojisOf("move"), "przesuń kursor"],
  [emojisOf("flag"), "postaw lub zdejmij flagę"],
  [emojisOf("reveal"), "odkryj pole; puste odkrywa całą okolicę"],
];

function emojisOf(action: Action): string {
  return LAYOUT.flat()
    .filter((control) => control.action === action)
    .map((control) => control.emoji)
    .join("");
}

function move(emoji: string, dx: number, dy: number): Control {
  return {
    action: "move",
    emoji,
    dx,
    dy,
  };
}

export function encodeButtonId(action: Action, { x, y }: Position): string {
  return encodeCustomId(BUTTON_PREFIX, action, x, y);
}

export function decodeButtonId(customId: string): { action: Action; target: Position } {
  const [, action, x, y] = buttonIdSchema.parse(decodeCustomId(customId));

  return {
    action,
    target: {
      x,
      y,
    },
  };
}

export function renderControls(game: Game): ActionRowBuilder<ButtonBuilder>[] {
  return LAYOUT.map((row) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      row.map(({ action, emoji, dx = 0, dy = 0 }) => {
        const button = new ButtonBuilder().setEmoji(emoji);

        if (action === null) {
          return button.setCustomId(PLACEHOLDER_ID).setStyle(ButtonStyle.Secondary).setDisabled(true);
        }

        const target = {
          x: game.cursor.x + dx,
          y: game.cursor.y + dy,
        };

        return button
          .setCustomId(encodeButtonId(action, target))
          .setStyle(action === "move" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(!game.can(action, target));
      }),
    ),
  );
}
