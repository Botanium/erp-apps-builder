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
import { OwnerWorkbench } from "./owner-workbench.mjs";
import { AtomicJsonStore, MemoryStore } from "./store.mjs";

/** @typedef {{type: "reference-slice.start-empty-authority-shell"}} StartEmptyAuthorityShellAction */
/** @typedef {{type: "reference-slice.start-owner-interview", ownerSourceIdentity: string}} StartOwnerInterviewAction */
/** @typedef {{type: "reference-slice.answer-owner-interview", ownerInterviewIdentity: string, questionIdentity: string, answer: object}} AnswerOwnerInterviewAction */
/** @typedef {{type: "reference-slice.review-intent-brief", ownerInterviewIdentity: string, versionIdentity: string}} ReviewIntentBriefAction */
/** @typedef {StartEmptyAuthorityShellAction | StartOwnerInterviewAction | AnswerOwnerInterviewAction | ReviewIntentBriefAction} OwnerOrControlAction */

/**
 * @typedef {object} EmptyAuthoritySliceView
 * @property {"ReferenceSliceView"} kind
 * @property {object} run
 * @property {object} scope
 * @property {object} authority
 * @property {object} business
 * @property {object} initialization
 */

/**
 * @typedef {object} OwnerInterviewSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {"OwnerInterview"} mode
 * @property {object} ownerInterview
 * @property {object} authority
 */

/**
 * @typedef {object} OwnerInterviewInputRejectedSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {"OwnerInterviewInputRejected"} mode
 * @property {object} ownerInterview
 * @property {object[]} diagnostics
 * @property {object} authority
 */

/**
 * @typedef {object} IntentBriefReviewSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {"IntentBriefReview"} mode
 * @property {object} ownerInterview
 * @property {object} authority
 */

/** @typedef {EmptyAuthoritySliceView | OwnerInterviewSliceView | OwnerInterviewInputRejectedSliceView | IntentBriefReviewSliceView} ReferenceSliceView */

export class ReferenceSlice {
  /**
   * @param {{businessKernel: BusinessKernel, ownerWorkbench: OwnerWorkbench, clock: {now: () => string}, identitySource: {next: () => string}}} dependencies
   */
  constructor({ businessKernel, ownerWorkbench, clock, identitySource }) {
    this.businessKernel = businessKernel;
    this.ownerWorkbench = ownerWorkbench;
    this.clock = clock;
    this.identitySource = identitySource;
    this.orchestrationRunIdentity = identitySource.next();
  }

  /**
   * Dispatch a supported owner or local control action through its public seam.
   * @param {OwnerOrControlAction} action
   * @returns {Promise<ReferenceSliceView>}
   */
  async dispatch(action) {
    if (action.type === REFERENCE_ACTION.reviewIntentBrief) {
      return {
        kind: "ReferenceSliceView",
        mode: "IntentBriefReview",
        ownerInterview: await this.ownerWorkbench.review({
          ownerInterviewIdentity: action.ownerInterviewIdentity,
          versionIdentity: action.versionIdentity,
        }),
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          businessTruth: false,
          previewConfirmsIntent: false,
        },
      };
    }

    if (action.type === REFERENCE_ACTION.answerOwnerInterview) {
      const outcome = await this.ownerWorkbench.answer({
        ownerInterviewIdentity: action.ownerInterviewIdentity,
        questionIdentity: action.questionIdentity,
        answer: action.answer,
        recordedTime: this.clock.now(),
      });
      if (outcome.kind === "OwnerInterviewInputRejection") {
        return {
          kind: "ReferenceSliceView",
          mode: "OwnerInterviewInputRejected",
          ownerInterview: outcome.ownerInterview,
          diagnostics: outcome.diagnostics,
          authority: {
            blueprintApproval: false,
            appliedBlueprint: false,
            businessTruth: false,
            recommendationConfirmsIntent: false,
            optionSelectionConfirmsIntent: false,
          },
        };
      }
      return {
        kind: "ReferenceSliceView",
        mode: "OwnerInterview",
        ownerInterview: outcome,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          businessTruth: false,
          recommendationConfirmsIntent: false,
          optionSelectionConfirmsIntent: false,
        },
      };
    }

    if (action.type === REFERENCE_ACTION.startOwnerInterview) {
      return {
        kind: "ReferenceSliceView",
        mode: "OwnerInterview",
        ownerInterview: await this.ownerWorkbench.start({
          tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
          ownerSourceIdentity: action.ownerSourceIdentity,
        }),
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          businessTruth: false,
          recommendationConfirmsIntent: false,
          optionSelectionConfirmsIntent: false,
        },
      };
    }

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
 * Compose the public reference slice over the selected local Store Adapters.
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
  const ownerWorkbench = new OwnerWorkbench({
    identitySource,
    store,
  });
  const acceptanceEvaluator = new AcceptanceEvaluator();
  const referenceSlice = new ReferenceSlice({
    businessKernel,
    ownerWorkbench,
    clock,
    identitySource,
  });

  return { referenceSlice, businessKernel, acceptanceEvaluator };
};
