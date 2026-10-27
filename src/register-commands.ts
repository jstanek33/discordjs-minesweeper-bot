import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { REST, Routes } from "discord.js";
import * as z from "zod";

import { cwd, env } from "#env";
import { commands } from "#registry";

const CACHE_FILE = path.resolve(cwd, ".cache/commands.json");
const cacheSchema = z.record(z.string(), z.string());
const force = process.argv.includes("--force");

// oxlint-disable-next-line typescript/explicit-function-return-type -- infer
function getScope() {
  if (env.DEV_GUILD_ID) {
    return {
      key: `guild:${env.DEV_GUILD_ID}`,
      route: Routes.applicationGuildCommands(env.CLIENT_ID, env.DEV_GUILD_ID),
    };
  }

  return {
    key: "global",
    route: Routes.applicationCommands(env.CLIENT_ID),
  };
}

async function getCache(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    return cacheSchema.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function setCache(data: Record<string, string>): Promise<void> {
  await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
}

const scope = getScope();
const body = commands.map((c) => c.data.toJSON());

if (body.length === 0) {
  throw new Error("No commands found");
}

const names = body.map((c) => c.name);
const duplicates = names.filter((n, i) => names.indexOf(n) !== i);

if (duplicates.length > 0) {
  throw new Error(`Duplicate command names: ${[...new Set(duplicates)].join(", ")}`);
}

const hash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
const cache = await getCache();

if (!force && cache[scope.key] === hash) {
  console.log(`Commands unchanged for ${scope.key}. Use --force to re-push`);
  process.exit();
}

const rest = new REST().setToken(env.CLIENT_SECRET);
await rest.put(scope.route, { body });

await setCache({ ...cache, [scope.key]: hash });
console.log(`Registered ${body.length} commands for ${scope.key}`);
