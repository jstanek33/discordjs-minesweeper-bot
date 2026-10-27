import type { ChatInputCommandInteraction } from "discord.js";
import {
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  TimestampStyles,
  time,
  userMention,
} from "discord.js";

import { UserError } from "#core/errors";
import type { Command } from "#core/types";
import { rankedTotals } from "#game/results";

import { rankPlayers } from "./standings.ts";
import type { Standing } from "./standings.ts";

const TOP_SIZE = 10;

export const ladderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ladder")
    .setDescription("Ranking serwera (gry rankingowe)")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) => sub.setName("top").setDescription(`Top ${TOP_SIZE} graczy serwera`))
    .addSubcommand((sub) =>
      sub
        .setName("player")
        .setDescription("Statystyki gracza")
        .addUserOption((o) => o.setName("user").setDescription("Gracz")),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    const standings = rankPlayers(rankedTotals(interaction.guildId));

    if (standings.length === 0) {
      throw new UserError("Brak danych dla tego serwera");
    }

    const isTop = interaction.options.getSubcommand() === "top";
    const embed = isTop ? topEmbed(standings) : playerEmbed(interaction, standings);

    await interaction.reply({
      content: `Dane z ${time(new Date(), TimestampStyles.LongTime)}`,
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};

function topEmbed(standings: readonly Standing[]): EmbedBuilder {
  const top = standings.slice(0, TOP_SIZE);

  return new EmbedBuilder()
    .setColor(Colors.Gold)
    .setTitle(`Top ${top.length} graczy`)
    .setDescription(
      top
        .map(
          (s) =>
            `**#${s.position}** ${userMention(s.playerId)} · ${Math.round(s.score)} pkt · ${s.winrate.toFixed(2)}% · ${s.wins}W / ${s.losses}P`,
        )
        .join("\n"),
    );
}

function playerEmbed(interaction: ChatInputCommandInteraction<"cached">, standings: readonly Standing[]): EmbedBuilder {
  const userId = interaction.options.getUser("user")?.id ?? interaction.user.id;
  const standing = standings.find((s) => s.playerId === userId);

  if (!standing) {
    throw new UserError("Ten gracz nie rozegrał żadnej gry rankingowej");
  }

  return new EmbedBuilder()
    .setColor(Colors.Gold)
    .setTitle(`Pozycja w rankingu #${standing.position}`)
    .setDescription(userMention(userId))
    .setFields(
      { name: "Rozegrane gry", value: String(standing.games) },
      { name: "Punkty", value: String(Math.round(standing.score)) },
      { name: "Winrate", value: `${standing.winrate.toFixed(2)}%` },
      { name: "Wygrane", value: String(standing.wins), inline: true },
      { name: "Przegrane", value: String(standing.losses), inline: true },
    );
}
