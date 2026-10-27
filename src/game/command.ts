import type { ChatInputCommandInteraction } from "discord.js";
import { InteractionContextType, MessageFlags, SlashCommandBuilder, channelMention } from "discord.js";

import { UserError } from "#core/errors";
import type { Command } from "#core/types";
import { MAX_SIZE, MIN_SIZE } from "#minesweeper/constants";

import { createOptionsSchema } from "./schemas.ts";
import { resignGames, startGame } from "./service.ts";

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
        .addStringOption((o) => o.setName("seed").setDescription("Seed planszy").setMaxLength(32))
        .addBooleanOption((o) => o.setName("ranked").setDescription("Gra rankingowa")),
    )
    .addSubcommand((sub) => sub.setName("cancel").setDescription("Poddaj swoje aktywne plansze")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    const isCreate = interaction.options.getSubcommand() === "create";
    const handler = isCreate ? create : cancel;
    await handler(interaction);
  },
};

async function create(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  const { options } = interaction;
  const parsed = createOptionsSchema.safeParse({
    rows: options.getInteger("rows") ?? undefined,
    cols: options.getInteger("cols") ?? undefined,
    bombs: options.getInteger("bombs") ?? undefined,
    seed: options.getString("seed") ?? undefined,
    ranked: options.getBoolean("ranked") ?? undefined,
  });

  if (!parsed.success) {
    throw new UserError(parsed.error.issues.map((issue) => issue.message).join("\n"));
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const thread = await startGame({
    guild: interaction.guild,
    creator: interaction.user,
    challenged: options.getUser("challenge"),
    spec: parsed.data,
  });

  await interaction.editReply(`Plansza gotowa: ${channelMention(thread.id)}`);
}

async function cancel(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const resigned = await resignGames(interaction.guild, interaction.user);
  await interaction.editReply(resigned ? `Poddane plansze: ${resigned}` : "Nie masz aktywnych plansz");
}
