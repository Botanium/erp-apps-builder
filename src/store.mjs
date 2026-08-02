import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const clone = (value) => structuredClone(value);

const commitTransaction = async ({
  current,
  expectedRevision,
  operation,
  replace,
}) => {
  if (current.revision !== expectedRevision) {
    throw new Error("State revision changed before the transaction committed.");
  }

  const { state, result } = await operation(clone(current));
  state.revision = expectedRevision + 1;
  await replace(clone(state));
  return { result: clone(result), revision: state.revision };
};

/**
 * @typedef {object} KernelState
 * @property {number} revision
 * @property {object|null} scope
 * @property {Array<object>} blueprintVersions
 * @property {Array<object>} blueprintApprovals
 * @property {Array<object>} appliedBlueprints
 * @property {Array<object>} records
 * @property {Array<object>} businessEvents
 * @property {Array<object>} evidence
 * @property {Array<object>} stockMovements
 * @property {Array<object>} postingSets
 * @property {Array<object>} ledgerEntries
 * @property {Array<object>} payments
 * @property {Array<object>} kernelCommandResults
 * @property {Array<object>} interviews
 * @property {Array<object>} intentBriefVersions
 */

/**
 * Internal StateStore Port implemented by MemoryStore and AtomicJsonStore.
 * @typedef {object} StateStore
 * @property {() => Promise<KernelState>} read
 * @property {(expectedRevision: number, operation: Function) => Promise<{result: unknown, revision: number}>} transact
 */

/** @returns {KernelState} */
export const createEmptyKernelState = () => ({
  revision: 0,
  scope: null,
  blueprintVersions: [],
  blueprintApprovals: [],
  appliedBlueprints: [],
  records: [],
  businessEvents: [],
  evidence: [],
  stockMovements: [],
  postingSets: [],
  ledgerEntries: [],
  payments: [],
  kernelCommandResults: [],
  interviews: [],
  intentBriefVersions: [],
});

export class MemoryStore {
  #state;

  /** @param {KernelState} [initialState] */
  constructor(initialState = createEmptyKernelState()) {
    this.#state = clone(initialState);
  }

  /** @returns {Promise<KernelState>} */
  async read() {
    return clone(this.#state);
  }

  /**
   * @param {number} expectedRevision
   * @param {(state: KernelState) => Promise<{state: KernelState, result: unknown}>|{state: KernelState, result: unknown}} operation
   */
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

/**
 * Constrained namespace over one complete StateStore envelope. OwnerWorkbench
 * operations can observe and replace only their non-authoritative interview
 * projection while the root Store retains one shared revision boundary.
 */
export class OwnerWorkbenchStatePort {
  #store;

  /** @param {{store: StateStore}} options */
  constructor({ store }) {
    this.#store = store;
  }

  async read() {
    const state = await this.#store.read();
    return this.#project(state);
  }

  async transact(expectedRevision, operation) {
    return this.#store.transact(expectedRevision, async (rootState) => {
      const outcome = await operation(this.#project(rootState));
      if (
        !Array.isArray(outcome.state?.interviews) ||
        !Array.isArray(outcome.state?.intentBriefVersions)
      ) {
        throw new TypeError(
          "OwnerWorkbench transaction must return its complete constrained state."
        );
      }
      rootState.interviews = clone(outcome.state.interviews);
      rootState.intentBriefVersions = clone(outcome.state.intentBriefVersions);
      return { state: rootState, result: outcome.result };
    });
  }

  #project(rootState) {
    return {
      revision: rootState.revision,
      interviews: clone(rootState.interviews),
      intentBriefVersions: clone(rootState.intentBriefVersions),
    };
  }
}

export class AtomicJsonStore {
  #stateFile;

  /** @param {{stateFile: string}} options */
  constructor({ stateFile }) {
    this.#stateFile = stateFile;
  }

  /**
   * Open existing local state or atomically create the initial envelope.
   * @param {{stateFile: string, initialState?: KernelState}} options
   */
  static async create({ stateFile, initialState = createEmptyKernelState() }) {
    const store = new AtomicJsonStore({ stateFile });
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

  /** @returns {Promise<KernelState>} */
  async read() {
    return JSON.parse(await readFile(this.#stateFile, "utf8"));
  }

  /**
   * @param {number} expectedRevision
   * @param {(state: KernelState) => Promise<{state: KernelState, result: unknown}>|{state: KernelState, result: unknown}} operation
   */
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
