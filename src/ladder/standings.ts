import type { PlayerTotals } from "#game/results";

export interface Standing extends PlayerTotals {
  position: number;
  games: number;
  winrate: number;
  score: number;
}

function scoreOf(games: number, winrate: number): number {
  return (Math.sqrt(games) * winrate ** 1.33) / 10;
}

function compareStandings(a: Omit<Standing, "position">, b: Omit<Standing, "position">): number {
  if (a.score !== b.score) {
    return b.score - a.score; // higher score first
  }

  if (a.wins !== b.wins) {
    return b.wins - a.wins; // then more wins
  }

  if (a.games !== b.games) {
    return b.games - a.games; // then more games played
  }

  return a.playerId.localeCompare(b.playerId); // stable order
}

export function rankPlayers(totals: readonly PlayerTotals[]): Standing[] {
  return (
    totals
      .map((player) => {
        const games = player.wins + player.losses;
        const winrate = games === 0 ? 0 : (player.wins / games) * 100;
        return { ...player, games, winrate, score: scoreOf(games, winrate) };
      })
      .toSorted(compareStandings)
      // oxlint-disable-next-line
      .map((standing, i) => ({ ...standing, position: i + 1 }))
  );
}
