import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type CommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export interface Command {
  data: CommandData;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface ButtonHandler {
  /** see custom-id.ts. */
  prefix: string;
  handle(interaction: ButtonInteraction): Promise<void>;
}
