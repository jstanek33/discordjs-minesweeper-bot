import type { ForumChannel, GuildForumTag, Message } from "discord.js";

import type { Status } from "#minesweeper/constants";
import { STATUSES } from "#minesweeper/constants";
import { SerialStore } from "#utils/serial-store";

import { STATUS_TAGS, STORE_CAPACITY } from "./constants.ts";
import { GameForum } from "./forum.ts";
import { GameMessage } from "./message.ts";

const store = new SerialStore<GameMessage>(STORE_CAPACITY);

export async function ensureTags(channel: ForumChannel): Promise<Record<Status, string>> {
  function findTag(status: Status): GuildForumTag | undefined {
    return channel.availableTags.find((t) => t.name === STATUS_TAGS[status].name);
  }

  // oxlint-disable-next-line typescript/explicit-function-return-type  unicorn/consistent-function-scoping-- infer
  function toNewTag(status: Status) {
    const { name, emoji } = STATUS_TAGS[status];

    return {
      name,
      emoji: { id: null, name: emoji },
      moderated: true, // only the bot/moderators may apply them
    };
  }

  function idOf(status: Status): string {
    const tag = findTag(status);

    if (!tag) {
      throw new Error(`Forum tag "${STATUS_TAGS[status].name}" is missing`);
    }

    return tag.id;
  }

  const missing = STATUSES.filter((s) => !findTag(s));

  if (missing.length) {
    await channel.setAvailableTags([...channel.availableTags, ...missing.map(toNewTag)]);
  }

  return {
    playing: idOf("playing"),
    won: idOf("won"),
    lost: idOf("lost"),
  };
}

export function threadName(username: string): string {
  return `Plansza użytkownika ${username}`;
}

export function updateGame(message: Message<true>, updater: (game: GameMessage) => boolean): Promise<GameMessage> {
  return store.update(message.id, async (latest) => {
    const current = latest ?? GameMessage.fromMessage(message);
    const next = current.clone();

    if (!updater(next)) {
      return current;
    }

    await saveGame(message, next);
    return next;
  });
}

async function saveGame(message: Message<true>, game: GameMessage): Promise<void> {
  const { status } = game;

  if (status === "playing") {
    await message.edit(game.toPayload());
    return;
  }

  const thread = message.channel;
  if (!thread.isThread()) {
    throw new Error("Game message is not in a forum post");
  }

  const forum = await GameForum.of(message.guild);
  const count = (await forum.count(thread.name, status)) + 1;

  await message.edit(game.toPayload(count));
  await forum.close(thread, status);
}
