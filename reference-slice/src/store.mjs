import { deepClone } from "./canonical.mjs";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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

export class AtomicJsonStore {
  #state;
  #path;

  constructor(path, initialState, { fresh = false } = {}) {
    this.#path = path;
    mkdirSync(dirname(path), { recursive: true });
    if (!fresh && existsSync(path)) {
      this.#state = JSON.parse(readFileSync(path, "utf8"));
    } else {
      this.#state = deepClone(initialState);
      this.#persist();
    }
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
    this.#persist();
    return { committed: true, conflict: false, state: this.read(), value };
  }

  #persist() {
    const temporaryPath = `${this.#path}.tmp-${process.pid}`;
    writeFileSync(temporaryPath, JSON.stringify(this.#state), { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, this.#path);
  }
}
