import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import type { Command } from "#bot/types";

export const ladderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ladder")
    .setDescription("Ranking serwera")
    .setContexts(InteractionContextType.Guild),
  async execute() {
    throw new Error("TODO: /ladder");
  },
};
