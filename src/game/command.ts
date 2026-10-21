import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import type { Command } from "#bot/types";
import { MAX_SIZE, MIN_SIZE } from "#minesweeper/constants";

export const gameCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("game")
    .setDescription("Gra w sapera")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Nowa plansza")
        .addIntegerOption((o) =>
          o.setName("rows").setDescription("Liczba wierszy").setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE),
        )
        .addIntegerOption((o) =>
          o.setName("cols").setDescription("Liczba kolumn").setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE),
        )
        .addIntegerOption((o) => o.setName("bombs").setDescription("Liczba bomb").setMinValue(1))
        .addUserOption((o) => o.setName("challenge").setDescription("Wyzwij innego gracza"))
        .addStringOption((o) => o.setName("seed").setDescription("Seed planszy").setMaxLength(32)),
    )
    .addSubcommand((sub) => sub.setName("cancel").setDescription("Poddaj swoje aktywne plansze")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    throw new Error("TODO: /game");
  },
};
