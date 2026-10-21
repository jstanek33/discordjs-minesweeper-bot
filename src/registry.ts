import type { Command } from "#bot/types";
import { gameCommand } from "#game/command";
import { ladderCommand } from "#ladder/command";
import type { ButtonHandler } from "#types/discord";

export const commands: Command[] = [gameCommand, ladderCommand];
export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));

export const buttons: ButtonHandler[] = [];
export const buttonsByPrefix = new Map(buttons.map((button) => [button.prefix, button]));
