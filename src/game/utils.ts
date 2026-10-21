import type { ForumChannel, GuildForumTag } from "discord.js";

import type { Status } from "#minesweeper/constants";
import { STATUSES } from "#minesweeper/constants";

import { STATUS_TAGS } from "./constants.ts";

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
