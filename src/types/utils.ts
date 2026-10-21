export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Players {
  player: string;
  challenger?: string | undefined;
}
