// Component customIds are "<prefix>:<part>:<part>…". The prefix routes the interaction to its
// handler; the parts are the handler's own data. Discord caps a customId at 100 characters.
const SEPARATOR = ":";

export function encodeCustomId(prefix: string, ...parts: readonly (number | string)[]): string {
  return [prefix, ...parts].join(SEPARATOR);
}

export function decodeCustomId(customId: string): string[] {
  return customId.split(SEPARATOR);
}

export function customIdPrefix(customId: string): string {
  return customId.split(SEPARATOR, 1)[0] ?? "";
}
