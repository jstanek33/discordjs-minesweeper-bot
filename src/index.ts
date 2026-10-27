import { Client, Events, GatewayIntentBits } from "discord.js";

import { registerInteractions } from "#core/dispatcher";
import { env } from "#env";
import { buttons, commands } from "#registry";

async function main(): Promise<void> {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    console.log(`Bot is up! Logged in as ${c.user.tag}`);
  });

  registerInteractions(client, { commands, buttons });
  await client.login(env.CLIENT_SECRET);
}

void main();
