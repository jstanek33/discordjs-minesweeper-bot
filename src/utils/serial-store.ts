export class SerialStore<T> {
  readonly #capacity: number;
  readonly #queues = new Map<string, Promise<void>>();
  readonly #latest = new Map<string, T>();

  public constructor(capacity: number) {
    this.#capacity = capacity;
  }

  #remember(key: string, value: T): void {
    this.#latest.delete(key);
    this.#latest.set(key, value);

    if (this.#latest.size > this.#capacity) {
      const [oldest] = this.#latest.keys();
      if (oldest !== undefined) {
        this.#latest.delete(oldest);
      }
    }
  }

  public update(key: string, task: (latest: T | undefined) => Promise<T>): Promise<T> {
    const previous = this.#queues.get(key) ?? Promise.resolve();
    const result = previous.then(() => task(this.#latest.get(key)));
    const queue = result.then(
      (value) => this.#remember(key, value),
      () => {},
    );

    this.#queues.set(key, queue);

    void queue.then(() => {
      if (this.#queues.get(key) === queue) {
        this.#queues.delete(key);
      }
    });

    return result;
  }
}
