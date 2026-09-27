import { randomUUID } from "node:crypto";

import { AcceptanceEvaluator } from "./acceptance-evaluator.mjs";
import { BusinessKernel } from "./business-kernel.mjs";
import {
  DIAGNOSTIC_CODE,
  EMPTY_REFERENCE_SCOPE,
  KERNEL_ACTION,
  KERNEL_QUERY,
  REFERENCE_ACTION,
} from "./contracts.mjs";
import { createKernelCommand } from "./kernel-command.mjs";
import { OwnerWorkbench } from "./owner-workbench.mjs";
import {
  AtomicJsonStore,
  MemoryStore,
  OwnerWorkbenchStatePort,
} from "./store.mjs";

const GENERATE_DRAFT_BLUEPRINT_ACTION_FIELDS = Object.freeze([
  "intentBriefVersionIdentity",
  "ownerInterviewIdentity",
  "sourceBlueprint",
  "type",
]);
const SOURCE_BLUEPRINT_FIELDS = Object.freeze([
  "blueprintContentIdentity",
  "blueprintReference",
]);
const BLUEPRINT_REFERENCE_FIELDS = Object.freeze([
  "blueprintIdentity",
  "tenantIdentity",
  "versionIdentity",
]);
const REVIEW_DRAFT_BLUEPRINT_VALIDATION_CANDIDATE_ACTION_FIELDS = Object.freeze(
  ["candidate", "sourceBlueprint", "type"]
);
const VALIDATION_CANDIDATE_FIELDS = Object.freeze([
  "normalizedBlueprint",
  "receivedCandidateFingerprint",
]);

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const hasExactFields = (value, fields) =>
  isObject(value) &&
  Object.keys(value).length === fields.length &&
  Object.keys(value).every((field) => fields.includes(field));
const isIdentity = (value) =>
  typeof value === "string" && /^[a-z0-9][a-z0-9.-]+$/.test(value);
const isContentIdentity = (value) =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
const isBlueprintReference = (value) =>
  hasExactFields(value, BLUEPRINT_REFERENCE_FIELDS) &&
  isIdentity(value.tenantIdentity) &&
  isIdentity(value.blueprintIdentity) &&
  isIdentity(value.versionIdentity);
const isSourceBlueprint = (value) =>
  hasExactFields(value, SOURCE_BLUEPRINT_FIELDS) &&
  isBlueprintReference(value.blueprintReference) &&
  isContentIdentity(value.blueprintContentIdentity);

/** @typedef {{type: "reference-slice.start-empty-authority-shell"}} StartEmptyAuthorityShellAction */
/** @typedef {{type: "reference-slice.start-owner-interview", ownerSourceIdentity: string}} StartOwnerInterviewAction */
/** @typedef {{type: "reference-slice.answer-owner-interview", ownerInterviewIdentity: string, questionIdentity: string, answer: object}} AnswerOwnerInterviewAction */
/** @typedef {{type: "reference-slice.generate-draft-blueprint", ownerInterviewIdentity: string, intentBriefVersionIdentity: string, sourceBlueprint?: {blueprintReference: {tenantIdentity: string, blueprintIdentity: string, versionIdentity: string}, blueprintContentIdentity: string}}} GenerateDraftBlueprintAction */
/** @typedef {{type: "reference-slice.review-draft-blueprint", blueprintReference: {tenantIdentity: string, blueprintIdentity: string, versionIdentity: string}}} ReviewDraftBlueprintAction */
/** @typedef {{type: "reference-slice.review-draft-blueprint-validation-candidate", sourceBlueprint: {blueprintReference: {tenantIdentity: string, blueprintIdentity: string, versionIdentity: string}, blueprintContentIdentity: string}, candidate: {normalizedBlueprint: object, receivedCandidateFingerprint: string}}} ReviewDraftBlueprintValidationCandidateAction */
/** @typedef {{type: "reference-slice.review-intent-brief", ownerInterviewIdentity: string, versionIdentity: string}} ReviewIntentBriefAction */
/** @typedef {StartEmptyAuthorityShellAction | StartOwnerInterviewAction | AnswerOwnerInterviewAction | GenerateDraftBlueprintAction | ReviewDraftBlueprintAction | ReviewDraftBlueprintValidationCandidateAction | ReviewIntentBriefAction} OwnerOrControlAction */

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

/**
 * @typedef {object} DraftBlueprintGenerationBlockedSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {"DraftBlueprintGenerationBlocked"} mode
 * @property {{tenantIdentity: string, ownerInterviewIdentity: string, intentBriefIdentity: string, versionIdentity: string}} sourceIntentBriefVersion
 * @property {object[]} draftBlockers
 * @property {null} draftBlueprint
 * @property {object} authority
 */

/**
 * @typedef {object} DraftBlueprintGenerationRejectedSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {"DraftBlueprintGenerationRejected"} mode
 * @property {{tenantIdentity: string, ownerInterviewIdentity: string, intentBriefIdentity: string, versionIdentity: string}} sourceIntentBriefVersion
 * @property {{blueprintReference: {tenantIdentity: string, blueprintIdentity: string, versionIdentity: string}, blueprintContentIdentity: string}} [requestedSourceBlueprint]
 * @property {object[]} diagnostics
 * @property {null} draftBlueprint
 * @property {object} authority
 */

/**
 * @typedef {object} DraftBlueprintReviewRejectedSliceView
 * @property {"ReferenceSliceView"} kind
 * @property {"DraftBlueprintReviewRejected"} mode
 * @property {{tenantIdentity: string, blueprintIdentity: string, versionIdentity: string}} blueprintReference
 * @property {object[]} diagnostics
 * @property {null} draftBlueprint
 * @property {object} authority
 */

/** @typedef {EmptyAuthoritySliceView | OwnerInterviewSliceView | OwnerInterviewInputRejectedSliceView | IntentBriefReviewSliceView | DraftBlueprintGenerationBlockedSliceView | DraftBlueprintGenerationRejectedSliceView | DraftBlueprintReviewRejectedSliceView} ReferenceSliceView */

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
    if (
      action.type === REFERENCE_ACTION.reviewDraftBlueprintValidationCandidate
    ) {
      if (
        !hasExactFields(
          action,
          REVIEW_DRAFT_BLUEPRINT_VALIDATION_CANDIDATE_ACTION_FIELDS
        ) ||
        !isSourceBlueprint(action.sourceBlueprint) ||
        !hasExactFields(action.candidate, VALIDATION_CANDIDATE_FIELDS) ||
        !isObject(action.candidate.normalizedBlueprint) ||
        !isContentIdentity(action.candidate.receivedCandidateFingerprint)
      ) {
        throw new TypeError(
          "The Draft Blueprint validation candidate action does not conform to its closed schema."
        );
      }
      return this.#draftBlueprintValidationCandidateReview(action);
    }

    if (action.type === REFERENCE_ACTION.reviewDraftBlueprint) {
      const unknownBlueprintReferenceField = Object.keys(
        action.blueprintReference
      )
        .sort()
        .find((field) => !BLUEPRINT_REFERENCE_FIELDS.includes(field));
      if (unknownBlueprintReferenceField) {
        return {
          kind: "ReferenceSliceView",
          mode: "DraftBlueprintReviewRejected",
          blueprintReference: {
            tenantIdentity: action.blueprintReference.tenantIdentity,
            blueprintIdentity: action.blueprintReference.blueprintIdentity,
            versionIdentity: action.blueprintReference.versionIdentity,
          },
          diagnostics: [
            {
              code: DIAGNOSTIC_CODE.referenceSliceInputUnknownField,
              severity: "Blocking",
              field: `blueprintReference.${unknownBlueprintReferenceField}`,
              summary: `The Draft Blueprint review action contains the undeclared blueprintReference.${unknownBlueprintReferenceField} property.`,
            },
          ],
          draftBlueprint: null,
          authority: {
            blueprintApproval: false,
            appliedBlueprint: false,
            provisioning: false,
            businessTruth: false,
            reviewApprovesBlueprint: false,
          },
        };
      }
      return this.#draftBlueprintReview(action.blueprintReference);
    }

    if (action.type === REFERENCE_ACTION.generateDraftBlueprint) {
      const unknownActionField = Object.keys(action)
        .sort()
        .find(
          (field) => !GENERATE_DRAFT_BLUEPRINT_ACTION_FIELDS.includes(field)
        );
      const unknownSourceBlueprintField =
        action.sourceBlueprint !== null &&
        typeof action.sourceBlueprint === "object" &&
        !Array.isArray(action.sourceBlueprint)
          ? Object.keys(action.sourceBlueprint)
              .sort()
              .find((field) => !SOURCE_BLUEPRINT_FIELDS.includes(field))
          : undefined;
      const unknownBlueprintReferenceField =
        action.sourceBlueprint?.blueprintReference !== null &&
        typeof action.sourceBlueprint?.blueprintReference === "object" &&
        !Array.isArray(action.sourceBlueprint?.blueprintReference)
          ? Object.keys(action.sourceBlueprint.blueprintReference)
              .sort()
              .find((field) => !BLUEPRINT_REFERENCE_FIELDS.includes(field))
          : undefined;
      const unknownInputField =
        unknownActionField ??
        (unknownSourceBlueprintField
          ? `sourceBlueprint.${unknownSourceBlueprintField}`
          : unknownBlueprintReferenceField
            ? `sourceBlueprint.blueprintReference.${unknownBlueprintReferenceField}`
            : undefined);
      const sourceReview = await this.ownerWorkbench.review({
        ownerInterviewIdentity: action.ownerInterviewIdentity,
        versionIdentity: action.intentBriefVersionIdentity,
      });
      if (unknownInputField) {
        return {
          kind: "ReferenceSliceView",
          mode: "DraftBlueprintGenerationRejected",
          sourceIntentBriefVersion: {
            tenantIdentity: sourceReview.tenantIdentity,
            ownerInterviewIdentity: sourceReview.identity,
            intentBriefIdentity: sourceReview.intentBrief.identity,
            versionIdentity: sourceReview.intentBrief.versionIdentity,
          },
          ...(unknownSourceBlueprintField || unknownBlueprintReferenceField
            ? {
                requestedSourceBlueprint: {
                  blueprintReference: {
                    tenantIdentity:
                      action.sourceBlueprint.blueprintReference.tenantIdentity,
                    blueprintIdentity:
                      action.sourceBlueprint.blueprintReference
                        .blueprintIdentity,
                    versionIdentity:
                      action.sourceBlueprint.blueprintReference.versionIdentity,
                  },
                  blueprintContentIdentity:
                    action.sourceBlueprint.blueprintContentIdentity,
                },
              }
            : {}),
          diagnostics: [
            {
              code: DIAGNOSTIC_CODE.referenceSliceInputUnknownField,
              severity: "Blocking",
              field: unknownInputField,
              summary: `The Draft Blueprint generation action contains the undeclared ${unknownInputField} property.`,
            },
          ],
          draftBlueprint: null,
          authority: {
            blueprintApproval: false,
            appliedBlueprint: false,
            provisioning: false,
            businessTruth: false,
          },
        };
      }
      if (sourceReview.draftReview?.disposition !== "ReadyForDraftProposal") {
        return {
          kind: "ReferenceSliceView",
          mode: "DraftBlueprintGenerationBlocked",
          sourceIntentBriefVersion: {
            tenantIdentity: sourceReview.tenantIdentity,
            ownerInterviewIdentity: sourceReview.identity,
            intentBriefIdentity: sourceReview.intentBrief.identity,
            versionIdentity: sourceReview.intentBrief.versionIdentity,
          },
          draftBlockers: structuredClone(
            sourceReview.draftReview?.draftBlockers ?? []
          ),
          draftBlueprint: null,
          authority: {
            blueprintApproval: false,
            appliedBlueprint: false,
            provisioning: false,
            businessTruth: false,
          },
        };
      }
      const controlState = await this.businessKernel.observe({
        type: KERNEL_QUERY.draftBlueprintControlState,
        tenantIdentity: sourceReview.tenantIdentity,
      });
      const blueprintReference = {
        tenantIdentity: sourceReview.tenantIdentity,
        blueprintIdentity:
          action.sourceBlueprint?.blueprintReference.blueprintIdentity ??
          this.identitySource.next(),
        versionIdentity: this.identitySource.next(),
      };
      const result = await this.businessKernel.submit(
        createKernelCommand({
          kernelCommandIdentity: this.identitySource.next(),
          governedActionIdentity: KERNEL_ACTION.createDraftBlueprint,
          tenantIdentity: sourceReview.tenantIdentity,
          recordedTime: this.clock.now(),
          expectedBaseline: {
            stateRevision: controlState.stateRevision,
            tenantIdentity: sourceReview.tenantIdentity,
          },
          input: {
            blueprintIdentity: blueprintReference.blueprintIdentity,
            intentBriefVersionIdentity: action.intentBriefVersionIdentity,
            ownerInterviewIdentity: action.ownerInterviewIdentity,
            sourceBlueprint: structuredClone(action.sourceBlueprint ?? null),
            versionIdentity: blueprintReference.versionIdentity,
          },
          responsibleSourceIdentity: "source.local-operator",
          orchestrationRunIdentity: this.orchestrationRunIdentity,
        })
      );
      if (result.disposition !== "Accepted") {
        const sourceDiagnostic = result.diagnostics.find(
          (candidate) =>
            candidate.code === DIAGNOSTIC_CODE.blueprintSourceNotReady
        );
        if (action.sourceBlueprint && sourceDiagnostic) {
          return {
            kind: "ReferenceSliceView",
            mode: "DraftBlueprintGenerationRejected",
            sourceIntentBriefVersion: {
              tenantIdentity: sourceReview.tenantIdentity,
              ownerInterviewIdentity: sourceReview.identity,
              intentBriefIdentity: sourceReview.intentBrief.identity,
              versionIdentity: sourceReview.intentBrief.versionIdentity,
            },
            requestedSourceBlueprint: structuredClone(action.sourceBlueprint),
            diagnostics: structuredClone(result.diagnostics),
            draftBlueprint: null,
            authority: {
              blueprintApproval: false,
              appliedBlueprint: false,
              provisioning: false,
              businessTruth: false,
            },
          };
        }
        throw new Error(
          result.diagnostics[0]?.summary ?? "Draft Blueprint generation failed."
        );
      }
      return this.#draftBlueprintReview(blueprintReference);
    }

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

  async #draftBlueprintReview(blueprintReference) {
    const observation = await this.businessKernel.observe({
      type: KERNEL_QUERY.draftBlueprintReview,
      tenantIdentity: blueprintReference.tenantIdentity,
      blueprintReference,
    });
    if (observation.disposition !== "Accepted") {
      if (
        observation.diagnostics.some(
          (candidate) =>
            candidate.code === DIAGNOSTIC_CODE.observationBlueprintUnknown ||
            candidate.code === DIAGNOSTIC_CODE.observationTenantScopeMismatch
        )
      ) {
        return {
          kind: "ReferenceSliceView",
          mode: "DraftBlueprintReviewRejected",
          blueprintReference: structuredClone(blueprintReference),
          diagnostics: structuredClone(observation.diagnostics),
          draftBlueprint: null,
          authority: {
            blueprintApproval: false,
            appliedBlueprint: false,
            provisioning: false,
            businessTruth: false,
            reviewApprovesBlueprint: false,
          },
        };
      }
      throw new Error(
        observation.diagnostics[0]?.summary ?? "Draft Blueprint review failed."
      );
    }
    return {
      kind: "ReferenceSliceView",
      mode: "DraftBlueprintReview",
      draftBlueprint: observation.draftBlueprint,
      blueprintLifecycle: observation.blueprintLifecycle,
      reviewBundle: observation.reviewBundle,
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
    };
  }

  async #draftBlueprintValidationCandidateReview(action) {
    const observation = await this.businessKernel.observe({
      type: KERNEL_QUERY.draftBlueprintValidationCandidateReview,
      tenantIdentity: action.sourceBlueprint.blueprintReference.tenantIdentity,
      sourceBlueprint: structuredClone(action.sourceBlueprint),
      candidate: structuredClone(action.candidate),
    });
    if (observation.disposition !== "Accepted") {
      throw new Error(
        observation.diagnostics?.[0]?.summary ??
          "Draft Blueprint validation candidate review failed."
      );
    }
    return {
      kind: "ReferenceSliceView",
      mode: "DraftBlueprintValidationCandidateReview",
      sourceBlueprint: observation.sourceBlueprint,
      receivedCandidateFingerprint: observation.receivedCandidateFingerprint,
      ...(observation.candidateCanonicalization
        ? {
            candidateCanonicalization:
              observation.candidateCanonicalization,
          }
        : {}),
      configurationValidationReport: observation.configurationValidationReport,
      configurationValidationReportBinding:
        observation.configurationValidationReportBinding,
      ...(observation.semanticDiff
        ? { semanticDiff: observation.semanticDiff }
        : {}),
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
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
    store: new OwnerWorkbenchStatePort({ store }),
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
