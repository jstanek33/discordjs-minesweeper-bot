import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import type { Game } from "#minesweeper/game";
import type { Action, Position } from "#minesweeper/types";

import { BUTTON_PLACEHOLDER_ID, BUTTON_PREFIX } from "./constants.ts";
import { buttonIdSchema } from "./schemas.ts";
import type { Control } from "./types.ts";

const LAYOUT: Control[][] = [
  [move("↖️", -1, -1), move("⬆️", 0, -1), move("↗️", 1, -1), { action: "flag", emoji: "🚩" }],
  [move("⬅️", -1, 0), { action: null, emoji: "⬛" }, move("➡️", 1, 0), { action: "reveal", emoji: "✅" }],
  [move("↙️", -1, 1), move("⬇️", 0, 1), move("↘️", 1, 1)],
];

function move(emoji: string, dx: number, dy: number): Control {
  return {
    action: "move",
    emoji,
    dx,
    dy,
  };
}

export function encodeButtonId(action: Action, { x, y }: Position): string {
  return [BUTTON_PREFIX, action, x, y].join(":");
}

export function decodeButtonId(customId: string): { action: Action; target: Position } {
  const [, action, x, y] = buttonIdSchema.parse(customId.split(":"));

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
          return button.setCustomId(BUTTON_PLACEHOLDER_ID).setStyle(ButtonStyle.Secondary).setDisabled(true);
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
