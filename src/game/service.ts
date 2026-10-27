import type { ButtonInteraction, Message } from "discord.js";

import { SerialStore } from "#core/serial-store";

import { GameForum } from "./forum.ts";
import { GameMessage } from "./message.ts";

interface Output {
  show(payload: ReturnType<GameMessage["toPayload"]>): Promise<void>;
  hold(): Promise<void>;
}

export function interactionOutput(interaction: ButtonInteraction): Output {
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

export function updateGame(
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

  const forum = await GameForum.of(message.guild);
  const count = (await forum.count(thread.name, status)) + 1;

  await output.show(game.toPayload(count));
  await forum.close(thread, status);
}
