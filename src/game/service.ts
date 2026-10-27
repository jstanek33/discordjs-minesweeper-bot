import type { ButtonInteraction, Guild, Message, ThreadChannel, User } from "discord.js";

import { UserError } from "#core/errors";
import { SerialStore } from "#core/serial-store";
import type { Action, Position } from "#minesweeper/types";

import { GameForum } from "./forum.ts";
import { GameMessage, parsePlayers } from "./message.ts";
import { recordResult } from "./results.ts";
import type { GameSpec } from "./schemas.ts";

interface StartGameInput {
  guild: Guild;
  creator: User;
  /** The user challenged to play the board, if any. */
  challenged: User | null;
  spec: GameSpec;
}

export async function startGame({ guild, creator, challenged, spec }: StartGameInput): Promise<ThreadChannel> {
  if (challenged?.id === creator.id) {
    throw new UserError("Nie możesz wyzwać samego siebie");
  }

  if (challenged?.bot) {
    throw new UserError("Nie możesz wyzwać bota");
  }

  const forum = await GameForum.of(guild);
  const player = challenged ?? creator;

  if (!challenged) {
    const active = await forum.activeGames(player.username);

    if (active.some(({ game }) => game.players.player === player.id && !game.players.challenger)) {
      throw new UserError("Masz już aktywną planszę. Dokończ ją albo użyj /game cancel");
    }
  }

  const game = GameMessage.create(spec, {
    player: player.id,
    challenger: challenged ? creator.id : undefined,
  });

  return forum.post(player.username, game.toPayload());
}

export async function playMove(
  interaction: ButtonInteraction<"cached">,
  action: Action,
  target: Position,
): Promise<void> {
  if (parsePlayers(interaction.message.content).player !== interaction.user.id) {
    throw new UserError("To nie twoja plansza");
  }

  await updateGame(interaction.message, (game) => game.state.apply(action, target), interactionOutput(interaction));
}

export async function resignGames(guild: Guild, user: User): Promise<number> {
  const forum = await GameForum.of(guild);
  const games = (await forum.activeGames(user.username)).filter(({ game }) => game.players.player === user.id);

  for (const { message } of games) {
    // oxlint-disable-next-line no-await-in-loop
    await updateGame(message, (game) => game.state.resign());
  }

  return games.length;
}

interface Output {
  show(payload: ReturnType<GameMessage["toPayload"]>): Promise<void>;
  hold(): Promise<void>;
}

function interactionOutput(interaction: ButtonInteraction): Output {
  function answered(): boolean {
    return interaction.deferred || interaction.replied;
  }

  return {
    async show(payload) {
      if (answered()) {
        await interaction.editReply(payload);
      } else {
        await interaction.update(payload);
      }
    },
    async hold() {
      if (!answered()) {
        await interaction.deferUpdate();
      }
    },
  };
}

function messageOutput(message: Message<true>): Output {
  return {
    async show(payload) {
      await message.edit(payload);
    },
    async hold() {},
  };
}

const STORE_CAPACITY = 512;
const store = new SerialStore<GameMessage>(STORE_CAPACITY);

function updateGame(
  message: Message<true>,
  updater: (game: GameMessage) => boolean,
  output: Output = messageOutput(message),
): Promise<GameMessage> {
  return store.update(message.id, async (latest) => {
    const current = latest ?? GameMessage.fromMessage(message);
    const next = current.clone();

    if (!updater(next)) {
      await output.hold();
      return current;
    }

    await saveGame(message, next, output);
    return next;
  });
}

async function saveGame(message: Message<true>, game: GameMessage, output: Output): Promise<void> {
  const { status } = game;

  if (status === "playing") {
    await output.show(game.toPayload());
    return;
  }

  await output.hold();

  const thread = message.channel;
  if (!thread.isThread()) {
    throw new Error("Game message is not in a forum post");
  }

  const { rows, cols, bombs, seed } = game.state.board;
  const count = recordResult({
    gameId: message.id,
    guildId: message.guildId,
    playerId: game.players.player,
    challengerId: game.players.challenger,
    outcome: status,
    ranked: game.ranked,
    rows,
    cols,
    bombs,
    seed,
    startedAt: game.startedAt,
    finishedAt: new Date(),
  });

  await output.show(game.toPayload(count));

  const forum = await GameForum.of(message.guild);
  await forum.close(thread, status);
}
