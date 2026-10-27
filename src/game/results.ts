import type { StatementSync } from "node:sqlite";

import * as z from "zod";

import { database } from "#core/database";
import type { BoardSpec, Status } from "#minesweeper/types";

export interface GameResult extends BoardSpec {
  gameId: string;
  guildId: string;
  playerId: string;
  challengerId: string | undefined;
  outcome: Exclude<Status, "playing">;
  ranked: boolean;
  startedAt: Date;
  finishedAt: Date;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS results (
    game_id       TEXT PRIMARY KEY,
    guild_id      TEXT NOT NULL,
    player_id     TEXT NOT NULL,
    challenger_id TEXT,
    outcome       TEXT NOT NULL CHECK (outcome IN ('won', 'lost')),
    ranked        INTEGER NOT NULL,
    rows          INTEGER NOT NULL,
    cols          INTEGER NOT NULL,
    bombs         INTEGER NOT NULL,
    seed          TEXT NOT NULL,
    started_at    INTEGER NOT NULL,
    finished_at   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS results_by_player ON results (guild_id, player_id, outcome);
`;

export interface PlayerTotals {
  playerId: string;
  wins: number;
  losses: number;
}

const countRowSchema = z.object({ total: z.number() });
const totalsRowsSchema = z.array(z.object({ playerId: z.string(), wins: z.number(), losses: z.number() }));

interface Statements {
  insert: StatementSync;
  count: StatementSync;
  rankedTotals: StatementSync;
}

let statements: Statements | undefined;

function prepared(): Statements {
  if (!statements) {
    const db = database();
    db.exec(SCHEMA);

    statements = {
      insert: db.prepare(`
        INSERT OR IGNORE INTO
          results (
            game_id, guild_id, player_id, challenger_id, outcome, ranked,
            rows, cols, bombs, seed, started_at, finished_at
          )
          VALUES (
            :gameId, :guildId, :playerId, :challengerId, :outcome, :ranked,
            :rows, :cols, :bombs, :seed, :startedAt, :finishedAt
          )
      `),
      count: db.prepare(`
        SELECT
          COUNT(*) AS total
        FROM
          results
        WHERE
          guild_id = ? AND player_id = ? AND outcome = ?
      `),
      rankedTotals: db.prepare(`
        SELECT
          player_id AS playerId, SUM(outcome = 'won') AS wins, SUM(outcome = 'lost') AS losses
        FROM
          results
        WHERE
          guild_id = ? AND ranked = 1
        GROUP BY player_id
      `),
    };
  }

  return statements;
}

export function recordResult(result: GameResult): number {
  const { insert, count } = prepared();

  insert.run({
    gameId: result.gameId,
    guildId: result.guildId,
    playerId: result.playerId,
    challengerId: result.challengerId ?? null,
    outcome: result.outcome,
    ranked: result.ranked ? 1 : 0,
    rows: result.rows,
    cols: result.cols,
    bombs: result.bombs,
    seed: result.seed,
    startedAt: result.startedAt.getTime(),
    finishedAt: result.finishedAt.getTime(),
  });

  return countRowSchema.parse(count.get(result.guildId, result.playerId, result.outcome)).total;
}

export function rankedTotals(guildId: string): PlayerTotals[] {
  return totalsRowsSchema.parse(prepared().rankedTotals.all(guildId));
}
