export const CONTRACT_VERSION = "1.0.0";

export const MACHINE_IDENTITY = Object.freeze({
  businessKernel: "kernel.business",
  kernelFoundation: "kernel.foundation",
});

export const VERSION_SET = Object.freeze([
  Object.freeze({
    machineIdentity: MACHINE_IDENTITY.businessKernel,
    version: CONTRACT_VERSION,
    contentIdentity:
      "sha256:930c1c3c96ff0551a58b6a132fdf352a1be16d4a60b5b5f99386f31ccc47ffac",
  }),
  Object.freeze({
    machineIdentity: MACHINE_IDENTITY.kernelFoundation,
    version: CONTRACT_VERSION,
    contentIdentity:
      "sha256:ca4ca3895c7aa25944a28d4dd01915d342168535c5f336f4035de6418ef5abb9",
  }),
]);

export const REFERENCE_ACTION = Object.freeze({
  answerOwnerInterview: "reference-slice.answer-owner-interview",
  reviewIntentBrief: "reference-slice.review-intent-brief",
  startEmptyAuthorityShell: "reference-slice.start-empty-authority-shell",
  startOwnerInterview: "reference-slice.start-owner-interview",
});

export const KERNEL_ACTION = Object.freeze({
  initializeEmptyAuthorityShell:
    "kernel.foundation.initialize-empty-authority-shell",
  unsupportedFixture: "kernel.action.unsupported",
});

export const KERNEL_QUERY = Object.freeze({
  emptyAuthorityState: "kernel.observe.empty-authority-state",
});

export const DIAGNOSTIC_CODE = Object.freeze({
  commandSchemaInvalid: "KERNEL.COMMAND.SCHEMA_INVALID",
  commandContentIdentityMismatch: "KERNEL.COMMAND.CONTENT_IDENTITY_MISMATCH",
  commandIdempotencyConflict: "KERNEL.COMMAND.IDEMPOTENCY_CONFLICT",
  commandBaselineMismatch: "KERNEL.COMMAND.BASELINE_MISMATCH",
  commandTenantScopeMismatch: "KERNEL.COMMAND.TENANT_SCOPE_MISMATCH",
  commandUnsupportedAction: "KERNEL.COMMAND.UNSUPPORTED_ACTION",
  observationTenantScopeMismatch: "KERNEL.OBSERVATION.TENANT_SCOPE_MISMATCH",
  completionNotEstablished: "REFERENCE_SLICE.COMPLETION.NOT_ESTABLISHED",
});

export const EMPTY_REFERENCE_SCOPE = Object.freeze({
  tenantIdentity: "tenant.cedar-steam",
  sandboxes: Object.freeze([
    Object.freeze({
      sandboxIdentity: "sandbox.retail",
      locationIdentity: "location.retail",
      generationIdentity: "sandbox-generation.retail.1",
      appliedBlueprint: null,
    }),
    Object.freeze({
      sandboxIdentity: "sandbox.cafe",
      locationIdentity: "location.cafe",
      generationIdentity: "sandbox-generation.cafe.1",
      appliedBlueprint: null,
    }),
  ]),
});
