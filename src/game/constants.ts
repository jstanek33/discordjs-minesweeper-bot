import { Colors } from "discord.js";

import type { Status } from "#minesweeper/types";

export const Emoji = {
  frame: "🟦",
  hidden: "⬛",
  flag: "🚩",
  empty: "⬜",
  mine: "💥",
  digits: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"],
  // Arrows on the frame point at the cursor
  cursor: {
    top: "⬇️",
    bottom: "⬆️",
    left: "➡️",
    right: "⬅️",
  },
  focus: {
    hidden: "🟨",
    flag: "🏁",
    revealed: "🔳",
  },
} as const;

export const BOARD_LEGEND: readonly (readonly [emoji: string, meaning: string])[] = [
  [Emoji.frame, "obramowanie planszy"],
  [Object.values(Emoji.cursor).join(""), "strzałki na obramowaniu wskazują wiersz i kolumnę kursora"],
  [Emoji.hidden, "nieodkryte pole"],
  [Emoji.empty, "odkryte pole bez bomb dookoła"],
  [`${Emoji.digits[0]}–${Emoji.digits[7]}`, "liczba bomb na sąsiednich polach"],
  [Emoji.flag, "pole oflagowane jako bomba (po wygranej: wszystkie bomby)"],
  [Emoji.mine, "bomba (widoczna po przegranej)"],
  [Emoji.focus.hidden, "kursor na nieodkrytym polu"],
  [Emoji.focus.flag, "kursor na oflagowanym polu"],
  [Emoji.focus.revealed, "kursor na odkrytym polu"],
];

export const STATUS_TAGS: Record<Status, { name: string; emoji: string }> = {
  playing: {
    name: "W trakcie",
    emoji: "⏳",
  },
  won: {
    name: "Wygrana",
    emoji: "🏆",
  },
  lost: {
    name: "Przegrana",
    emoji: "💥",
  },
};

export const STATUS_COLORS: Record<Status, number> = {
  playing: Colors.Blurple,
  won: Colors.Green,
  lost: Colors.Red,
};

export function threadName(username: string): string {
  return `Plansza użytkownika ${username}`;
}
