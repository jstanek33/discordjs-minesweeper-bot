import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import type { Command } from "#types/discord";

export const ladderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ladder")
    .setDescription("Ranking serwera")
    .setContexts(InteractionContextType.Guild),
  async execute() {
    throw new Error("TODO: /ladder");
  },
};
