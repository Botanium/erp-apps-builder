import { randomUUID } from "node:crypto";

import { AcceptanceEvaluator } from "./acceptance-evaluator.mjs";
import { BusinessKernel } from "./business-kernel.mjs";
import {
  EMPTY_REFERENCE_SCOPE,
  KERNEL_ACTION,
  KERNEL_QUERY,
  REFERENCE_ACTION,
} from "./contracts.mjs";
import { createKernelCommand } from "./kernel-command.mjs";
import { AtomicJsonStore, MemoryStore } from "./store.mjs";

/**
 * @typedef {{type: string}} OwnerOrControlAction
 */

/**
 * @typedef {object} ReferenceSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {object} run
 * @property {object} scope
 * @property {object} authority
 * @property {object} business
 * @property {object} initialization
 */

export class ReferenceSlice {
  /**
   * @param {{businessKernel: BusinessKernel, clock: {now: () => string}, identitySource: {next: () => string}}} dependencies
   */
  constructor({ businessKernel, clock, identitySource }) {
    this.businessKernel = businessKernel;
    this.clock = clock;
    this.identitySource = identitySource;
    this.orchestrationRunIdentity = identitySource.next();
  }

  /**
   * Execute the one owner-visible Ticket 01 journey through the Kernel seams.
   * @param {OwnerOrControlAction} action
   * @returns {Promise<ReferenceSliceView>}
   */
  async dispatch(action) {
    if (action.type !== REFERENCE_ACTION.startEmptyAuthorityShell) {
      throw new Error("Unsupported owner or control action.");
    }

    const recordedTime = this.clock.now();
    const initialization = await this.businessKernel.submit(
      createKernelCommand({
        kernelCommandIdentity: this.identitySource.next(),
        governedActionIdentity: KERNEL_ACTION.initializeEmptyAuthorityShell,
        tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
        recordedTime,
        expectedBaseline: { stateRevision: 0, tenantIdentity: null },
        input: { scope: EMPTY_REFERENCE_SCOPE },
        responsibleSourceIdentity: "source.local-operator",
        orchestrationRunIdentity: this.orchestrationRunIdentity,
      })
    );
    const observation = await this.businessKernel.observe({
      type: KERNEL_QUERY.emptyAuthorityState,
      tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
    });

    return {
      kind: "ReferenceSliceView",
      run: {
        orchestrationRunIdentity: this.orchestrationRunIdentity,
        recordedTime,
        boundary: "local-sandbox-only",
      },
      scope: observation.scope,
      authority: observation.authority,
      business: observation.business,
      initialization: {
        disposition: initialization.disposition,
        governedActionIdentity: initialization.governedActionIdentity,
      },
    };
  }
}

/**
 * Compose the four public seams over one selected internal Store Adapter.
 * @param {object} options
 * @param {{kind: "memory"}|{kind: "atomic-json", stateFile: string}} options.persistence
 * @param {{now: () => string}} options.clock
 * @param {{next: () => string}} [options.identitySource]
 */
export const createLocalReferenceSlice = async ({
  persistence,
  clock,
  identitySource = { next: () => randomUUID() },
}) => {
  let store;
  if (persistence.kind === "memory") {
    store = new MemoryStore();
  } else if (persistence.kind === "atomic-json") {
    store = await AtomicJsonStore.create({
      stateFile: persistence.stateFile,
    });
  } else {
    throw new TypeError("Unsupported local persistence Adapter.");
  }
  const businessKernel = new BusinessKernel({ store });
  const acceptanceEvaluator = new AcceptanceEvaluator();
  const referenceSlice = new ReferenceSlice({
    businessKernel,
    clock,
    identitySource,
  });

  return { referenceSlice, businessKernel, acceptanceEvaluator };
};
