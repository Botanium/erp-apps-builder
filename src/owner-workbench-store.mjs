import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const clone = (value) => structuredClone(value);

const createEmptyOwnerWorkbenchState = () => ({
  revision: 0,
  interviews: [],
  intentBriefVersions: [],
});

const commitTransaction = async ({
  current,
  expectedRevision,
  operation,
  replace,
}) => {
  if (current.revision !== expectedRevision) {
    throw new Error(
      "OwnerWorkbench state revision changed before the transaction committed."
    );
  }
  const { state, result } = await operation(clone(current));
  state.revision = expectedRevision + 1;
  await replace(clone(state));
  return { result: clone(result), revision: state.revision };
};

export class MemoryOwnerWorkbenchStore {
  #state;

  constructor(initialState = createEmptyOwnerWorkbenchState()) {
    this.#state = clone(initialState);
  }

  async read() {
    return clone(this.#state);
  }

  async transact(expectedRevision, operation) {
    return commitTransaction({
      current: this.#state,
      expectedRevision,
      operation,
      replace: (state) => {
        this.#state = state;
      },
    });
  }
}

export class AtomicJsonOwnerWorkbenchStore {
  #stateFile;

  constructor({ stateFile }) {
    this.#stateFile = stateFile;
  }

  static async create({
    stateFile,
    initialState = createEmptyOwnerWorkbenchState(),
  }) {
    const store = new AtomicJsonOwnerWorkbenchStore({ stateFile });
    await mkdir(dirname(stateFile), { recursive: true });
    try {
      await store.read();
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
      await store.#replace(initialState);
    }
    return store;
  }

  async read() {
    return JSON.parse(await readFile(this.#stateFile, "utf8"));
  }

  async transact(expectedRevision, operation) {
    return commitTransaction({
      current: await this.read(),
      expectedRevision,
      operation,
      replace: (state) => this.#replace(state),
    });
  }

  async #replace(state) {
    const temporaryFile = `${this.#stateFile}.${process.pid}.tmp`;
    try {
      await writeFile(temporaryFile, `${JSON.stringify(state, null, 2)}\n`, {
        encoding: "utf8",
        flag: "w",
      });
      await rename(temporaryFile, this.#stateFile);
    } finally {
      await rm(temporaryFile, { force: true });
    }
  }
}
