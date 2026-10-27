import type { ChatInputCommandInteraction } from "discord.js";
import { InteractionContextType, MessageFlags, SlashCommandBuilder, channelMention } from "discord.js";

import { UserError } from "#core/errors";
import type { Command } from "#core/types";
import { GameForum } from "#game/forum";
import { MAX_SIZE, MIN_SIZE } from "#minesweeper/constants";

import { GameMessage } from "./message.ts";
import { createOptionsSchema } from "./schemas.ts";
import { updateGame } from "./service.ts";

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
  const { options, user } = interaction;
  const challenged = options.getUser("challenge");

  if (challenged?.id === user.id) {
    throw new UserError("Nie możesz wyzwać samego siebie");
  }

  if (challenged?.bot) {
    throw new UserError("Nie możesz wyzwać bota");
  }

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
  const forum = await GameForum.of(interaction.guild);
  const player = challenged ?? user;

  if (!challenged) {
    const active = await forum.activeGames(player.username);

    // one own game at a time
    if (active.some(({ game }) => game.players.player === player.id && !game.players.challenger)) {
      throw new UserError("Masz już aktywną planszę. Dokończ ją albo użyj /game cancel");
    }
  }

  const game = GameMessage.create(parsed.data, {
    player: player.id,
    challenger: challenged ? user.id : undefined,
  });

  const thread = await forum.post(player.username, game.toPayload());
  await interaction.editReply(`Plansza gotowa: ${channelMention(thread.id)}`);
}

async function cancel(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  const { user } = interaction;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const forum = await GameForum.of(interaction.guild);
  const games = (await forum.activeGames(user.username)).filter(({ game }) => game.players.player === user.id);

  for (const { message } of games) {
    // oxlint-disable-next-line no-await-in-loop
    await updateGame(message, (game) => game.state.resign());
  }

  await interaction.editReply(games.length ? `Poddane plansze: ${games.length}` : "Nie masz aktywnych plansz");
}
