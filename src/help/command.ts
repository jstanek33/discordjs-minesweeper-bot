import { Colors, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";

import type { Command } from "#core/types";
import { BOARD_LEGEND } from "#game/constants";
import { CONTROLS_LEGEND } from "#game/controls";

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Wyjaśnia pola planszy i przyciski")
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("Znaczenie pól na planszy")
      .setDescription(formatLegend(BOARD_LEGEND))
      .addFields({ name: "Przyciski", value: formatLegend(CONTROLS_LEGEND) });

    await interaction.reply({ content: "Wyjaśnienie gry", embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

function formatLegend(legend: readonly (readonly [emoji: string, meaning: string])[]): string {
  return legend.map(([emoji, meaning]) => `${emoji} - ${meaning}`).join("\n");
}
