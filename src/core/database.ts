import * as fs from "node:fs";
import * as path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATABASE_FILE = path.resolve("data/minesweeper.db");

let connection: DatabaseSync | undefined;

export function database(): DatabaseSync {
  if (!connection) {
    fs.mkdirSync(path.dirname(DATABASE_FILE), { recursive: true });
    connection = new DatabaseSync(DATABASE_FILE);
    connection.exec("PRAGMA journal_mode = WAL");
  }

  return connection;
}
