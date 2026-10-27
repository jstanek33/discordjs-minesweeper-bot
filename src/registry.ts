import type { ButtonHandler, Command } from "#core/types";
import { gameButtons } from "#game/buttons";
import { gameCommand } from "#game/command";
import { ladderCommand } from "#ladder/command";

export const commands: Command[] = [gameCommand, ladderCommand];
export const buttons: ButtonHandler[] = [gameButtons];
