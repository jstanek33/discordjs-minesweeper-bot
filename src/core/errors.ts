export class UserError extends Error {
  public override readonly name = "UserError";
}

export function fail(message: string): never {
  throw new Error(message);
}
