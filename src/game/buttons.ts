import type { ButtonHandler } from "#core/types";

import { BUTTON_PREFIX, decodeButtonId } from "./controls.ts";
import { playMove } from "./service.ts";

export const gameButtons: ButtonHandler = {
  prefix: BUTTON_PREFIX,

  async handle(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    const { action, target } = decodeButtonId(interaction.customId);
    await playMove(interaction, action, target);
  },
};
