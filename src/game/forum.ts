import type {
  ForumChannel,
  Guild,
  GuildForumTag,
  GuildForumThreadMessageCreateOptions,
  ThreadChannel,
} from "discord.js";
import { ChannelType, ThreadAutoArchiveDuration } from "discord.js";

import { env } from "#env";
import type { Status } from "#minesweeper/types";
import { STATUSES } from "#minesweeper/types";
import { UserError } from "#utils/errors";

import { STATUS_TAGS } from "./constants.ts";
import { GameMessage } from "./message.ts";
import { threadName } from "./utils.ts";

export class GameForum {
  readonly #channel: ForumChannel;
  readonly #tags: Record<Status, string>;

  private constructor(channel: ForumChannel, tags: Record<Status, string>) {
    this.#channel = channel;
    this.#tags = tags;
  }

  async *#threads(): AsyncGenerator<ThreadChannel> {
    const active = await this.#channel.threads.fetchActive();
    yield* active.threads.filter((thread) => thread.parentId === this.#channel.id).values();

    for (let before: ThreadChannel | undefined; ;) {
      // oxlint-disable-next-line no-await-in-loop
      const page = await this.#channel.threads.fetchArchived({
        type: "public",
        before,
        limit: 100,
      });

      yield* page.threads.values();
      before = page.threads.last();

      if (!page.hasMore || !before) {
        return;
      }
    }
  }

  public static async of(guild: Guild): Promise<GameForum> {
    const channel = guild.channels.cache.find(
      (c): c is ForumChannel => c.type === ChannelType.GuildForum && c.name === env.GAME_FORUM_NAME,
    );

    if (!channel) {
      throw new UserError(`Na tym serwerze nie ma forum #${env.GAME_FORUM_NAME}`);
    }

    return new GameForum(channel, await ensureTags(channel));
  }

  // oxlint-disable-next-line typescript/explicit-function-return-type -- infer
  public async activeGames(username: string) {
    const threads: ThreadChannel[] = [];

    for await (const thread of this.#threads()) {
      if (thread.name === threadName(username) && this.hasStatus(thread, "playing")) {
        threads.push(thread);
      }
    }

    const messages = await Promise.all(threads.map((thread) => thread.fetchStarterMessage()));
    return messages
      .filter((message) => message !== null)
      .map((message) => ({ message, game: GameMessage.fromMessage(message) }));
  }

  public async close(thread: ThreadChannel, status: Exclude<Status, "playing">): Promise<void> {
    const ours = Object.values(this.#tags);

    await thread.edit({
      appliedTags: [...thread.appliedTags.filter((id) => !ours.includes(id)), this.#tags[status]],
      archived: true,
      locked: true,
    });
  }

  public async count(name: string, status: Status): Promise<number> {
    let total = 0;

    for await (const thread of this.#threads()) {
      if (thread.name === name && this.hasStatus(thread, status)) {
        total++;
      }
    }

    return total;
  }

  public hasStatus(thread: ThreadChannel, status: Status): boolean {
    return thread.appliedTags.includes(this.#tags[status]);
  }

  public post(username: string, message: GuildForumThreadMessageCreateOptions): Promise<ThreadChannel> {
    return this.#channel.threads.create({
      appliedTags: [this.#tags.playing],
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      message,
      name: threadName(username),
    });
  }
}

function findTag(channel: ForumChannel, status: Status): GuildForumTag | undefined {
  const wanted = STATUS_TAGS[status].name.trim().toLocaleLowerCase();
  return channel.availableTags.find((tag) => tag.name.trim().toLocaleLowerCase() === wanted);
}

const pendingTags = new Map<string, Promise<Record<Status, string>>>();

function ensureTags(channel: ForumChannel): Promise<Record<Status, string>> {
  let pending = pendingTags.get(channel.id);

  if (!pending) {
    pending = resolveTags(channel).finally(() => pendingTags.delete(channel.id));
    pendingTags.set(channel.id, pending);
  }

  return pending;
}

async function resolveTags(cached: ForumChannel): Promise<Record<Status, string>> {
  let channel = cached;

  if (STATUSES.some((status) => !findTag(channel, status))) {
    channel = await cached.fetch(true);
    const missing = STATUSES.filter((status) => !findTag(channel, status));

    if (missing.length > 0) {
      channel = await channel.setAvailableTags([
        ...channel.availableTags,
        ...missing.map((status) => ({
          name: STATUS_TAGS[status].name,
          emoji: { id: null, name: STATUS_TAGS[status].emoji },
          moderated: true, // only the bot/moderators can apply
        })),
      ]);
    }
  }

  function idOf(status: Status): string {
    const tag = findTag(channel, status);

    if (!tag) {
      throw new Error(`Forum tag "${STATUS_TAGS[status].name}" is missing`);
    }

    return tag.id;
  }

  return {
    playing: idOf("playing"),
    won: idOf("won"),
    lost: idOf("lost"),
  };
}
