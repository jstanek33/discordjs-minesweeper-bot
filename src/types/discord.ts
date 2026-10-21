import type {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export type CommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export interface Command {
  data: CommandData;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  // Only for options declared with `.setAutocomplete(true)`.
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

export interface ButtonHandler {
  prefix: string;
  handle(interaction: ButtonInteraction): Promise<void>;
}
