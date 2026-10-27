import type { ButtonHandler, Command } from "#core/types";
import { gameButtons } from "#game/buttons";
import { gameCommand } from "#game/command";
import { helpCommand } from "#help/command";
import { ladderCommand } from "#ladder/command";

export const commands: Command[] = [gameCommand, helpCommand, ladderCommand];
export const buttons: ButtonHandler[] = [gameButtons];
