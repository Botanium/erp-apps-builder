import { canonicalJson, sha256ContentIdentity } from "./canonical-json.mjs";
import {
  createDraftBlueprintRecord,
  createDraftBlueprintValidationCandidateReview,
} from "./blueprint-engine.mjs";
import {
  CONTRACT_VERSION,
  DIAGNOSTIC_CODE,
  KERNEL_ACTION,
  KERNEL_QUERY,
  MACHINE_IDENTITY,
  VERSION_SET,
} from "./contracts.mjs";

const COMMAND_KEYS = [
  "agentRunIdentity",
  "causationReferences",
  "creationTime",
  "evidenceReferences",
  "expectedBaseline",
  "freshnessBoundary",
  "governedActionIdentity",
  "governedActionVersion",
  "humanGateDecision",
  "input",
  "kernelCommandContentIdentity",
  "kernelCommandIdentity",
  "kind",
  "locationIdentity",
  "orchestrationRunIdentity",
  "policyReferences",
  "predecessorReference",
  "requestedEffectiveTime",
  "responsibleSource",
  "roleReferences",
  "separationOfDutyReferences",
  "subject",
  "tenantIdentity",
  "versionSet",
];

const clone = (value) => structuredClone(value);
const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (value, keys) =>
  isObject(value) &&
  canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());
const isIdentity = (value) =>
  typeof value === "string" && /^[a-z0-9][a-z0-9.-]+$/.test(value);
const isTimestamp = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));
const isEmptyArray = (value) => Array.isArray(value) && value.length === 0;

const isBlueprintSource = (value, command) => {
  if (value === null) return true;
  if (
    !hasExactKeys(value, ["blueprintContentIdentity", "blueprintReference"]) ||
    !/^sha256:[0-9a-f]{64}$/.test(value.blueprintContentIdentity) ||
    !hasExactKeys(value.blueprintReference, [
      "blueprintIdentity",
      "tenantIdentity",
      "versionIdentity",
    ])
  ) {
    return false;
  }
  return (
    value.blueprintReference.tenantIdentity === command.tenantIdentity &&
    value.blueprintReference.blueprintIdentity ===
      command.input.blueprintIdentity &&
    isIdentity(value.blueprintReference.blueprintIdentity) &&
    isIdentity(value.blueprintReference.versionIdentity)
  );
};

const isScope = (value, tenantIdentity) => {
  if (
    !hasExactKeys(value, ["tenantIdentity", "sandboxes"]) ||
    value.tenantIdentity !== tenantIdentity ||
    !Array.isArray(value.sandboxes) ||
    value.sandboxes.length === 0
  ) {
    return false;
  }

  const identities = new Set();
  for (const sandbox of value.sandboxes) {
    if (
      !hasExactKeys(sandbox, [
        "appliedBlueprint",
        "generationIdentity",
        "locationIdentity",
        "sandboxIdentity",
      ]) ||
      sandbox.appliedBlueprint !== null ||
      !isIdentity(sandbox.generationIdentity) ||
      !isIdentity(sandbox.locationIdentity) ||
      !isIdentity(sandbox.sandboxIdentity)
    ) {
      return false;
    }
    for (const identity of [
      sandbox.generationIdentity,
      sandbox.locationIdentity,
      sandbox.sandboxIdentity,
    ]) {
      if (identities.has(identity)) {
        return false;
      }
      identities.add(identity);
    }
  }
  return true;
};

const isCommandEnvelope = (command) =>
  hasExactKeys(command, COMMAND_KEYS) &&
  command.kind === "KernelCommand" &&
  isIdentity(command.kernelCommandIdentity) &&
  /^sha256:[0-9a-f]{64}$/.test(command.kernelCommandContentIdentity) &&
  isIdentity(command.tenantIdentity) &&
  command.locationIdentity === null &&
  isIdentity(command.governedActionIdentity) &&
  command.governedActionVersion === CONTRACT_VERSION &&
  hasExactKeys(command.subject, ["identity", "kind"]) &&
  command.subject.kind === "KernelFoundation" &&
  command.subject.identity === MACHINE_IDENTITY.kernelFoundation &&
  hasExactKeys(command.expectedBaseline, ["stateRevision", "tenantIdentity"]) &&
  Number.isSafeInteger(command.expectedBaseline.stateRevision) &&
  command.expectedBaseline.stateRevision >= 0 &&
  (command.expectedBaseline.tenantIdentity === null ||
    isIdentity(command.expectedBaseline.tenantIdentity)) &&
  isObject(command.input) &&
  hasExactKeys(command.responsibleSource, ["identity", "kind"]) &&
  command.responsibleSource.kind === "LocalOperator" &&
  isIdentity(command.responsibleSource.identity) &&
  isTimestamp(command.creationTime) &&
  isTimestamp(command.requestedEffectiveTime) &&
  canonicalJson(command.versionSet) === canonicalJson(VERSION_SET) &&
  isEmptyArray(command.roleReferences) &&
  isEmptyArray(command.evidenceReferences) &&
  isEmptyArray(command.policyReferences) &&
  isEmptyArray(command.separationOfDutyReferences) &&
  command.humanGateDecision === null &&
  isIdentity(command.orchestrationRunIdentity) &&
  command.agentRunIdentity === null &&
  isEmptyArray(command.causationReferences) &&
  command.predecessorReference === null &&
  command.freshnessBoundary === null;

const commandHasValidInput = (command) => {
  if (
    command.governedActionIdentity ===
    KERNEL_ACTION.initializeEmptyAuthorityShell
  ) {
    return (
      hasExactKeys(command.input, ["scope"]) &&
      isScope(command.input.scope, command.tenantIdentity)
    );
  }
  if (command.governedActionIdentity === KERNEL_ACTION.createDraftBlueprint) {
    return (
      hasExactKeys(command.input, [
        "blueprintIdentity",
        "intentBriefVersionIdentity",
        "ownerInterviewIdentity",
        "sourceBlueprint",
        "versionIdentity",
      ]) &&
      isIdentity(command.input.blueprintIdentity) &&
      isIdentity(command.input.intentBriefVersionIdentity) &&
      isIdentity(command.input.ownerInterviewIdentity) &&
      isIdentity(command.input.versionIdentity) &&
      isBlueprintSource(command.input.sourceBlueprint, command)
    );
  }
  return hasExactKeys(command.input, []);
};

const diagnostic = (code, summary) => ({
  code,
  severity: "Blocking",
  summary,
});

const receivedCommandFingerprint = (command) => {
  try {
    const { kernelCommandContentIdentity: _ignored, ...authorityContent } =
      command;
    return sha256ContentIdentity(authorityContent);
  } catch {
    return null;
  }
};

const resultFor = (command, disposition, diagnostics) => ({
  kind: "KernelCommandResult",
  kernelCommandIdentity: command.kernelCommandIdentity ?? null,
  kernelCommandContentIdentity: command.kernelCommandContentIdentity ?? null,
  receivedCommandFingerprint: receivedCommandFingerprint(command),
  disposition,
  governedActionIdentity: command.governedActionIdentity ?? null,
  recordedTime: command.creationTime ?? command.recordedTime ?? null,
  versionSet: clone(VERSION_SET),
  responsibleKernelSource: {
    machineIdentity: MACHINE_IDENTITY.businessKernel,
    version: CONTRACT_VERSION,
  },
  invariantResults: [],
  diagnostics,
});

const countGovernedTruth = (state) => ({
  records: state.records.length,
  businessEvents: state.businessEvents.length,
  evidence: state.evidence.length,
  stockMovements: state.stockMovements.length,
  postingSets: state.postingSets.length,
  ledgerEntries: state.ledgerEntries.length,
  payments: state.payments.length,
});

/**
 * @typedef {object} KernelCommand
 * @property {string} kind
 * @property {string} kernelCommandIdentity
 * @property {string} kernelCommandContentIdentity
 * @property {string} tenantIdentity
 * @property {null} locationIdentity
 * @property {string} governedActionIdentity
 * @property {string} governedActionVersion
 * @property {{kind: string, identity: string}} subject
 * @property {{stateRevision: number, tenantIdentity: string|null}} expectedBaseline
 * @property {Record<string, unknown>} input
 * @property {{kind: string, identity: string}} responsibleSource
 * @property {string} creationTime
 * @property {string} requestedEffectiveTime
 * @property {Array<object>} versionSet
 * @property {Array<string>} roleReferences
 * @property {Array<string>} evidenceReferences
 * @property {Array<string>} policyReferences
 * @property {Array<string>} separationOfDutyReferences
 * @property {null} humanGateDecision
 * @property {string} orchestrationRunIdentity
 * @property {null} agentRunIdentity
 * @property {Array<string>} causationReferences
 * @property {null} predecessorReference
 * @property {null} freshnessBoundary
 */

/**
 * @typedef {object} KernelCommandResult
 * @property {"KernelCommandResult"} kind
 * @property {string|null} kernelCommandIdentity
 * @property {string|null} kernelCommandContentIdentity
 * @property {string|null} receivedCommandFingerprint
 * @property {"Accepted"|"Rejected"} disposition
 * @property {string|null} governedActionIdentity
 * @property {string|null} recordedTime
 * @property {Array<object>} versionSet
 * @property {{machineIdentity: string, version: string}} responsibleKernelSource
 * @property {Array<object>} invariantResults
 * @property {Array<object>} diagnostics
 */

export class BusinessKernel {
  /** @param {{store: {read: Function, transact: Function}}} dependencies */
  constructor({ store }) {
    this.store = store;
  }

  /**
   * Sole mutation authority for a typed, content-bound Kernel Command.
   * @param {KernelCommand} command
   * @returns {Promise<KernelCommandResult>}
   */
  async submit(command) {
    const current = await this.store.read();
    const recorded = current.kernelCommandResults.find(
      (result) => result.kernelCommandIdentity === command.kernelCommandIdentity
    );
    if (recorded) {
      if (
        recorded.kernelCommandContentIdentity ===
          command.kernelCommandContentIdentity &&
        recorded.receivedCommandFingerprint ===
          receivedCommandFingerprint(command)
      ) {
        return recorded;
      }
      return resultFor(command, "Rejected", [
        diagnostic(
          DIAGNOSTIC_CODE.commandIdempotencyConflict,
          "The Kernel Command Identity is already bound to different content."
        ),
      ]);
    }

    let result;
    let acceptedScope = null;
    let acceptedDraftBlueprint = null;
    if (!isCommandEnvelope(command) || !commandHasValidInput(command)) {
      result = resultFor(command, "Rejected", [
        diagnostic(
          DIAGNOSTIC_CODE.commandSchemaInvalid,
          "The Kernel Command does not conform to the closed command schema."
        ),
      ]);
    } else {
      const {
        kernelCommandContentIdentity: suppliedContentIdentity,
        ...authorityContent
      } = command;
      const recomputedContentIdentity = sha256ContentIdentity(authorityContent);
      const expectedTenantIdentity = current.scope?.tenantIdentity ?? null;

      if (suppliedContentIdentity !== recomputedContentIdentity) {
        result = resultFor(command, "Rejected", [
          diagnostic(
            DIAGNOSTIC_CODE.commandContentIdentityMismatch,
            "The Kernel Command Content Identity does not match its canonical content."
          ),
        ]);
      } else if (
        current.scope &&
        current.scope.tenantIdentity !== command.tenantIdentity
      ) {
        result = resultFor(command, "Rejected", [
          diagnostic(
            DIAGNOSTIC_CODE.commandTenantScopeMismatch,
            "The Kernel Command Tenant is outside this Kernel state scope."
          ),
        ]);
      } else if (
        command.governedActionIdentity ===
          KERNEL_ACTION.initializeEmptyAuthorityShell &&
        current.scope !== null
      ) {
        result = resultFor(command, "Rejected", [
          diagnostic(
            DIAGNOSTIC_CODE.commandBaselineMismatch,
            "The empty authority shell can initialize only an absent Tenant scope."
          ),
        ]);
      } else if (
        command.expectedBaseline.stateRevision !== current.revision ||
        command.expectedBaseline.tenantIdentity !== expectedTenantIdentity
      ) {
        result = resultFor(command, "Rejected", [
          diagnostic(
            DIAGNOSTIC_CODE.commandBaselineMismatch,
            "The Kernel Command expected baseline is stale or different."
          ),
        ]);
      } else if (
        command.governedActionIdentity ===
        KERNEL_ACTION.initializeEmptyAuthorityShell
      ) {
        acceptedScope = command.input.scope;
        result = resultFor(command, "Accepted", []);
      } else if (
        command.governedActionIdentity === KERNEL_ACTION.createDraftBlueprint
      ) {
        acceptedDraftBlueprint = createDraftBlueprintRecord({
          state: current,
          command,
        });
        if (acceptedDraftBlueprint) {
          result = resultFor(command, "Accepted", []);
        } else {
          result = resultFor(command, "Rejected", [
            diagnostic(
              DIAGNOSTIC_CODE.blueprintSourceNotReady,
              "The exact Intent Brief Version is unavailable, unsafe, or not ready for a Draft proposal."
            ),
          ]);
        }
      } else {
        result = resultFor(command, "Rejected", [
          diagnostic(
            DIAGNOSTIC_CODE.commandUnsupportedAction,
            "The governed action is not supported by this Business Kernel version."
          ),
        ]);
      }
    }

    const committed = await this.store.transact(current.revision, (state) => {
      if (acceptedScope) {
        state.scope = clone(acceptedScope);
      }
      if (acceptedDraftBlueprint) {
        state.blueprintVersions.push(clone(acceptedDraftBlueprint));
      }
      state.kernelCommandResults.push(result);
      return { state, result };
    });
    return committed.result;
  }

  /**
   * Read-only scoped observation of the empty authority shell.
   * @param {{type: string, tenantIdentity: string}} query
   * @returns {Promise<object>}
   */
  async observe(query) {
    if (
      ![
        KERNEL_QUERY.draftBlueprintControlState,
        KERNEL_QUERY.draftBlueprintReview,
        KERNEL_QUERY.draftBlueprintValidationCandidateReview,
        KERNEL_QUERY.emptyAuthorityState,
      ].includes(query.type)
    ) {
      throw new Error("Unsupported Kernel query.");
    }

    const state = await this.store.read();
    if (state.scope?.tenantIdentity !== query.tenantIdentity) {
      return {
        kind: "KernelObservation",
        disposition: "Rejected",
        tenantIdentity: query.tenantIdentity,
        diagnostics: [
          diagnostic(
            DIAGNOSTIC_CODE.observationTenantScopeMismatch,
            "The requested Tenant is outside this Kernel state scope."
          ),
        ],
      };
    }

    if (query.type === KERNEL_QUERY.draftBlueprintControlState) {
      return {
        kind: "KernelObservation",
        disposition: "Accepted",
        tenantIdentity: query.tenantIdentity,
        stateRevision: state.revision,
      };
    }

    if (query.type === KERNEL_QUERY.draftBlueprintReview) {
      const blueprintVersion = state.blueprintVersions.find(
        (candidate) =>
          canonicalJson(candidate.draftBlueprint.blueprintReference) ===
          canonicalJson(query.blueprintReference)
      );
      if (!blueprintVersion) {
        return {
          kind: "KernelObservation",
          disposition: "Rejected",
          tenantIdentity: query.tenantIdentity,
          diagnostics: [
            diagnostic(
              DIAGNOSTIC_CODE.observationBlueprintUnknown,
              "The exact Blueprint Reference is unknown in this Tenant scope."
            ),
          ],
        };
      }
      return {
        kind: "KernelObservation",
        disposition: "Accepted",
        tenantIdentity: query.tenantIdentity,
        draftBlueprint: clone(blueprintVersion.draftBlueprint),
        blueprintLifecycle: clone(blueprintVersion.blueprintLifecycle),
        reviewBundle: clone(blueprintVersion.reviewBundle),
      };
    }

    if (query.type === KERNEL_QUERY.draftBlueprintValidationCandidateReview) {
      const validationCandidateReview =
        createDraftBlueprintValidationCandidateReview({ state, query });
      if (!validationCandidateReview) {
        throw new TypeError(
          "The Draft Blueprint validation candidate observation does not conform to its closed schema or exact source baseline."
        );
      }
      return {
        kind: "KernelObservation",
        disposition: "Accepted",
        tenantIdentity: query.tenantIdentity,
        ...clone(validationCandidateReview),
      };
    }

    const authority = {
      blueprintVersions: state.blueprintVersions.length,
      blueprintApprovals: state.blueprintApprovals.length,
      appliedBlueprints: state.appliedBlueprints.length,
      provisioningAttempts: state.provisioningAttempts.length,
    };
    return {
      kind: "KernelObservation",
      scope: state.scope,
      authority,
      derivedMaterial: {
        effectiveBlueprints: state.effectiveBlueprints.length,
      },
      business: countGovernedTruth(state),
      operational: {
        kernelCommandResults: state.kernelCommandResults.length,
      },
    };
  }
}
