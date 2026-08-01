import { contentIdentity, deepClone } from "./canonical.mjs";
import { BLUEPRINT_ID, TENANT_ID, VERSION_SET } from "./fixtures.mjs";

export function createKernelState() {
  return {
    revision: 0,
    tenantId: TENANT_ID,
    sentinel: { tenantId: "tenant.isolation-sentinel", effects: [] },
    blueprints: {},
    lifecycle: {},
    currentApprovedBlueprint: null,
    approvals: [],
    validationReports: [],
    effectiveBlueprint: null,
    commandResults: [],
    commandBindings: {},
    targets: {
      retail: emptyTarget("retail", "location.retail"),
      cafe: emptyTarget("cafe", "location.cafe"),
    },
    resetRecords: [],
  };
}

function emptyTarget(targetId, locationId, generationNumber = 1) {
  return {
    targetId,
    tenantId: TENANT_ID,
    locationId,
    generationNumber,
    generationId: `generation.${targetId}.${generationNumber}`,
    appliedBlueprint: null,
    activeConfiguration: null,
    records: [],
    events: [],
    movements: [],
    postingSets: [],
    payments: [],
  };
}

function validateBlueprint(blueprint) {
  const requiredSections = ["envelope", "businessScope", "capabilitySelections", "recordDefinitions", "workflowDefinitions", "roleDefinitions", "evidenceRules", "policyProfiles", "experienceConfiguration", "integrationConfiguration", "intentTraceability"];
  const properties = Object.keys(blueprint.content);
  const unknown = properties.filter(property => !requiredSections.includes(property));
  const missing = requiredSections.filter(property => !properties.includes(property));
  const diagnostics = [];
  unknown.forEach(property => diagnostics.push({ code: "CFG.SCHEMA.UNKNOWN_PROPERTY", path: `/${property}`, severity: "Blocking" }));
  missing.forEach(property => diagnostics.push({ code: "CFG.SCHEMA.REQUIRED_MISSING", path: `/${property}`, severity: "Blocking" }));
  if (blueprint.content.capabilitySelections.some(capability => capability.version !== "1.0.0")) diagnostics.push({ code: "CFG.CAPABILITY.VERSION_UNSUPPORTED", path: "/capabilitySelections", severity: "Blocking" });
  const assumptions = blueprint.content.intentTraceability.assumptions ?? [];
  if (assumptions.length) diagnostics.push({ code: "CFG.TRACEABILITY.ASSUMPTION_ACTIVE", path: "/intentTraceability/assumptions", severity: "Blocking" });
  return {
    identity: `validation.${blueprint.reference.versionId}`,
    blueprintReference: blueprint.reference,
    contentIdentity: blueprint.contentIdentity,
    verdict: diagnostics.some(diagnostic => diagnostic.code === "CFG.SCHEMA.UNKNOWN_PROPERTY" || diagnostic.code === "CFG.SCHEMA.REQUIRED_MISSING" || diagnostic.code === "CFG.CAPABILITY.VERSION_UNSUPPORTED") ? "Invalid" : assumptions.length ? "Valid" : "Valid",
    approvalEligible: diagnostics.length === 0,
    diagnostics,
    versionSet: VERSION_SET,
  };
}

export class BusinessKernel {
  constructor(store) {
    this.store = store;
  }

  submit(command) {
    const current = this.store.read();
    const binding = current.commandBindings[command.identity];
    if (binding) {
      if (binding.contentIdentity !== command.contentIdentity) return { commandIdentity: command.identity, action: command.action, disposition: "Rejected", code: "IDEMPOTENCY_CONFLICT", diagnostics: [{ code: "ORC.KERNEL.IDEMPOTENCY_CONFLICT" }] };
      return deepClone(binding.result);
    }
    const { contentIdentity: suppliedIdentity, ...canonicalCommand } = command;
    if (contentIdentity(canonicalCommand) !== suppliedIdentity) {
      return {
        commandIdentity: command.identity,
        action: command.action,
        disposition: "Rejected",
        code: "ORC.KERNEL.SCHEMA_REJECTED",
        diagnostics: [{ code: "CFG.ARTIFACT.CONTENT_IDENTITY_MISMATCH" }],
      };
    }
    const transaction = this.store.transact(current.revision, candidate => {
      const beforeEffects = effectCount(candidate);
      let result;
      try {
        result = dispatch(candidate, command);
      } catch (error) {
        result = { commandIdentity: command.identity, action: command.action, disposition: "Rejected", code: error.code ?? "KERNEL_REJECTED", diagnostics: [{ code: error.code ?? "KERNEL_REJECTED", message: error.message }] };
      }
      if (result.disposition === "Rejected" && effectCount(candidate) !== beforeEffects) throw new Error("Rejected command changed governed effects.");
      candidate.commandResults.push(result);
      candidate.commandBindings[command.identity] = { contentIdentity: command.contentIdentity, result };
      return result;
    });
    if (!transaction.committed) return { commandIdentity: command.identity, action: command.action, disposition: "Rejected", code: "BASELINE_CONFLICT", diagnostics: [{ code: "ORC.BASELINE.KERNEL_BASELINE_CHANGED" }] };
    return deepClone(transaction.value);
  }

  observe(query = { type: "snapshot" }) {
    const state = this.store.read();
    if (query.type === "snapshot") return state;
    if (query.type === "target") return deepClone(state.targets[query.targetId] ?? null);
    throw new Error(`Unsupported Kernel query ${query.type}.`);
  }
}

function dispatch(state, command) {
  if (command.tenantId !== state.tenantId) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Tenant scope mismatch.");
  if (command.action === "blueprint.create-draft") return createDraft(state, command);
  if (command.action === "blueprint.approve") return approve(state, command);
  if (command.action === "sandbox.provision") return provision(state, command);
  reject("ORC.KERNEL.SCHEMA_REJECTED", `Unsupported governed action ${command.action}.`);
}

function createDraft(state, command) {
  const blueprint = command.input.blueprint;
  if (blueprint.reference.tenantId !== TENANT_ID || blueprint.reference.blueprintId !== BLUEPRINT_ID) reject("CFG.IDENTITY.TENANT_MISMATCH", "Blueprint identity scope mismatch.");
  const report = validateBlueprint(blueprint);
  state.validationReports.push(report);
  if (report.verdict === "Invalid") reject(report.diagnostics[0].code, "Blueprint validation failed.");
  state.blueprints[blueprint.reference.versionId] = blueprint;
  state.lifecycle[blueprint.reference.versionId] = "Draft";
  return accepted(command, { blueprintReference: blueprint.reference, validationReport: report });
}

function approve(state, command) {
  const { reference, contentIdentity: blueprintContentIdentity } = command.input;
  const blueprint = state.blueprints[reference.versionId];
  if (!blueprint || state.lifecycle[reference.versionId] !== "Draft") reject("ORC.KERNEL.BASELINE_REJECTED", "Exact Draft does not exist.");
  if (blueprint.contentIdentity !== blueprintContentIdentity) reject("ORC.KERNEL.BASELINE_REJECTED", "Blueprint Content Identity mismatch.");
  const validation = state.validationReports.find(report => report.blueprintReference.versionId === reference.versionId);
  if (!validation?.approvalEligible) reject("ORC.KERNEL.POLICY_REJECTED", "Draft is not Approval Eligible.");
  const decision = command.gateDecision;
  if (!decision || decision.response !== "Authorize Submission" || decision.subjectContentIdentity !== blueprintContentIdentity || decision.subjectVersionId !== reference.versionId) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Exact Human Gate Decision is required.");
  state.lifecycle[reference.versionId] = "Approved";
  const approval = { identity: "blueprint-approval.cedar-steam.v2", reference, contentIdentity: blueprintContentIdentity, humanGateDecisionId: decision.identity, effectiveTime: command.effectiveTime };
  state.currentApprovedBlueprint = approval;
  state.approvals.push(approval);
  return accepted(command, { approval });
}

function provision(state, command) {
  if (!state.currentApprovedBlueprint) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "No current Approved Blueprint.");
  const target = state.targets[command.targetId];
  if (!target) reject("ORC.KERNEL.BASELINE_REJECTED", "Target does not exist.");
  if (target.appliedBlueprint) reject("ORC.KERNEL.BASELINE_REJECTED", "Initial target is not clean.");
  return accepted(command, { targetId: command.targetId, prepared: false });
}

function accepted(command, output) {
  return { commandIdentity: command.identity, action: command.action, disposition: "Accepted", output, versionSet: VERSION_SET };
}

function reject(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function effectCount(state) {
  return Object.values(state.targets).reduce((sum, target) => sum + target.records.length + target.events.length + target.movements.length + target.postingSets.length + target.payments.length, 0);
}
