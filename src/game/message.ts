import { EmbedBuilder, userMention } from "discord.js";
import type { Message } from "discord.js";

import { Board } from "#minesweeper/board";
import { Game } from "#minesweeper/game";
import type { Status } from "#minesweeper/types";

import { FOOTER_PATTERN, MENTION_PATTERN, SEALED_PREFIX, STATUS_COLORS, TITLE_PATTERN } from "./constants.ts";
import { renderControls } from "./controls.ts";
import { parseGrid, renderGrid } from "./grid.ts";
import { gameSpecSchema } from "./schemas.ts";
import type { GameSpec } from "./schemas.ts";
import { seal, unseal } from "./seal.ts";

export interface Players {
  player: string;
  challenger?: string | undefined;
}

export class GameMessage {
  public constructor(
    public readonly state: Game,
    public readonly ranked: boolean,
    public readonly startedAt: Date,
    public readonly players: Players,
  ) {}

  public static create(spec: GameSpec, players: Players): GameMessage {
    const { rows, cols, bombs, seed } = spec;
    return new GameMessage(new Game(new Board(rows, cols, bombs, seed)), spec.ranked, new Date(), players);
  }

  public static fromMessage({ content, embeds }: Pick<Message, "content" | "embeds">): GameMessage {
    const embed = embeds[0];
    const title = TITLE_PATTERN.exec(embed?.title ?? "")?.groups;
    const footer = FOOTER_PATTERN.exec(embed?.footer?.text ?? "")?.groups;

    if (!embed?.description || !embed.timestamp || !title || !footer) {
      throw new Error("Message is not a game board");
    }

    const seed = footer.seed?.startsWith(SEALED_PREFIX) ? unseal(footer.seed.slice(SEALED_PREFIX.length)) : footer.seed;
    const spec = gameSpecSchema.parse({
      rows: Number(title.rows),
      cols: Number(title.cols),
      bombs: Number(footer.bombs),
      ranked: title.ranked !== undefined,
      seed,
    });

    const { cells, cursor } = parseGrid(embed.description, spec.rows, spec.cols);
    const { rows, cols, bombs, seed: specSeed } = spec;

    return new GameMessage(
      new Game(new Board(rows, cols, bombs, specSeed), cells, cursor),
      spec.ranked,
      new Date(embed.timestamp),
      parsePlayers(content),
    );
  }

  public get status(): Status {
    return this.state.status;
  }

  public clone(): GameMessage {
    return new GameMessage(this.state.clone(), this.ranked, this.startedAt, this.players);
  }

  // oxlint-disable-next-line typescript/explicit-function-return-type -- infer
  public toPayload(count = 0) {
    const { state, status } = this;
    const { board } = state;
    const seed = this.ranked && status === "playing" ? SEALED_PREFIX + seal(board.seed) : board.seed;

    const embed = new EmbedBuilder()
      .setTitle(`Saper ${board.cols}x${board.rows}${this.ranked ? " RANKED" : ""}`)
      .setColor(STATUS_COLORS[status])
      .setDescription(renderGrid(state))
      .addFields(
        { name: "🚩 Flagi", value: `${state.flags} / ${board.bombs}`, inline: true },
        { name: "⬛ Nieodkryte", value: String(state.hidden), inline: true },
        { name: "Pozostałe pola", value: String(state.remaining) },
      )
      .setFooter({ text: `Bomby: ${board.bombs} • Seed: ${seed}` })
      .setTimestamp(this.startedAt);

    return {
      content: describe(status, this.players, count),
      embeds: [embed],
      components: renderControls(state),
      allowedMentions: {
        users: [this.players.player],
      },
    };
  }
}

export function parsePlayers(content: string): Players {
  const [player, challenger] = Array.from(content.matchAll(MENTION_PATTERN), (match) => match.groups?.id);

  if (!player) {
    throw new Error("Message has no player mention");
  }

  return { player, challenger };
}

function describe(status: Status, { player, challenger }: Players, count: number): string {
  const you = userMention(player);
  const challenge = challenger ? ` (wyzwanie od gracza ${userMention(challenger)})` : "";
  const text: Record<Status, string> = {
    playing: `Plansza gracza ${you}`,
    won: `Wygrałeś ${you}! Jest to twoja ${count} wygrana`,
    lost: `Przegrałeś ${you}! Jest to twoja ${count} przegrana`,
  };

  return text[status] + challenge;
}
