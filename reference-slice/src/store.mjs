import { deepClone } from "./canonical.mjs";

export class MemoryStore {
  #state;

  constructor(initialState) {
    this.#state = deepClone(initialState);
  }

  read() {
    return deepClone(this.#state);
  }

  transact(expectedRevision, operation) {
    if (this.#state.revision !== expectedRevision) return { committed: false, conflict: true, state: this.read() };
    const candidate = this.read();
    const value = operation(candidate);
    candidate.revision += 1;
    this.#state = candidate;
    return { committed: true, conflict: false, state: this.read(), value };
  }
}
