import type { Client, Interaction } from "discord.js";
import { Events, MessageFlags } from "discord.js";

import { customIdPrefix } from "./custom-id.ts";
import { UserError } from "./errors.ts";
import type { ButtonHandler, Command } from "./types.ts";

interface Handlers {
  commands: readonly Command[];
  buttons: readonly ButtonHandler[];
}

export function registerInteractions(client: Client, { commands, buttons }: Handlers): void {
  const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
  const buttonsByPrefix = new Map(buttons.map((button) => [button.prefix, button]));

  async function dispatchInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isChatInputCommand()) {
      await commandsByName.get(interaction.commandName)?.execute(interaction);
    } else if (interaction.isButton()) {
      await buttonsByPrefix.get(customIdPrefix(interaction.customId))?.handle(interaction);
    }
  }

  client.on(Events.InteractionCreate, (interaction) => {
    void dispatchInteraction(interaction).catch((err: unknown) => handleInteractionError(interaction, err));
  });
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
