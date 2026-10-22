import type { Client, Interaction } from "discord.js";
import { Events, MessageFlags } from "discord.js";

import { buttonsByPrefix, commandsByName } from "#registry";
import { UserError } from "#utils/errors";

export function registerInteractions(client: Client): void {
  client.on(Events.InteractionCreate, (interaction) => {
    void dispatchInteraction(interaction).catch((err: unknown) => handleInteractionError(interaction, err));
  });
}

async function dispatchInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isChatInputCommand()) {
    await commandsByName.get(interaction.commandName)?.execute(interaction);
  } else if (interaction.isButton()) {
    await buttonsByPrefix.get(interaction.customId.split(":", 1)[0]!)?.handle(interaction);
  }
}

async function handleInteractionError(interaction: Interaction, error: unknown): Promise<void> {
  const expected = error instanceof UserError;

  if (!expected) {
    console.error(`Interaction ${interaction.id} failed:`, error);
  }

  if (!interaction.isRepliable()) {
    return;
  }

  const content = expected ? error.message : "Coś poszło nie tak. Spróbuj ponownie";

  try {
    if (interaction.isChatInputCommand() && interaction.deferred) {
      await interaction.editReply(content);
    } else {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
  } catch (err) {
    console.error("Could not report the failure:", err);
  }
}
