import { UserError } from "#core/errors";
import type { ButtonHandler } from "#core/types";

import { BUTTON_PREFIX, decodeButtonId } from "./controls.ts";
import { parsePlayers } from "./message.ts";
import { interactionOutput, updateGame } from "./service.ts";

export const gameButtons: ButtonHandler = {
  prefix: BUTTON_PREFIX,

  async handle(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    const { action, target } = decodeButtonId(interaction.customId);

    if (parsePlayers(interaction.message.content).player !== interaction.user.id) {
      throw new UserError("To nie twoja plansza");
    }

    await updateGame(interaction.message, (game) => game.state.apply(action, target), interactionOutput(interaction));
  },
};
