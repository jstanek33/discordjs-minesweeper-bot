import * as z from "zod";

export interface Env {
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  readonly GAME_SECRET: string;
  readonly DEV_GUILD_ID?: string;
  readonly GAME_FORUM_NAME: string;
}

const envSchema: z.ZodType<Env> = z.object({
  CLIENT_ID: z.string().nonempty(),
  CLIENT_SECRET: z.string().nonempty(),
  GAME_SECRET: z.string().nonempty(),
  DEV_GUILD_ID: z.string().nonempty().optional(),
  GAME_FORUM_NAME: z.string().nonempty(),
});

export const env: Env = envSchema.parse(process.env);
