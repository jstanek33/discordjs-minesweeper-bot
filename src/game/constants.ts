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
