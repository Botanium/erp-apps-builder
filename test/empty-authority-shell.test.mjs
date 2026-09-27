import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createLocalReferenceSlice } from "../src/reference-slice.mjs";

const VERSION_SET_FIXTURE = [
  {
    machineIdentity: "kernel.business",
    version: "1.0.0",
    contentIdentity:
      "sha256:930c1c3c96ff0551a58b6a132fdf352a1be16d4a60b5b5f99386f31ccc47ffac",
  },
  {
    machineIdentity: "kernel.foundation",
    version: "1.0.0",
    contentIdentity:
      "sha256:ca4ca3895c7aa25944a28d4dd01915d342168535c5f336f4035de6418ef5abb9",
  },
];

const unsupportedKernelCommand = (overrides = {}) => ({
  kind: "KernelCommand",
  kernelCommandIdentity: "kernel-command.unsupported.test-fixture",
  tenantIdentity: "tenant.cedar-steam",
  locationIdentity: null,
  governedActionIdentity: "kernel.action.unsupported",
  governedActionVersion: "1.0.0",
  subject: {
    kind: "KernelFoundation",
    identity: "kernel.foundation",
  },
  expectedBaseline: {
    stateRevision: 1,
    tenantIdentity: "tenant.cedar-steam",
  },
  input: {},
  responsibleSource: {
    kind: "LocalOperator",
    identity: "source.local-operator",
  },
  creationTime: "2026-01-15T09:00:01.000Z",
  requestedEffectiveTime: "2026-01-15T09:00:01.000Z",
  versionSet: structuredClone(VERSION_SET_FIXTURE),
  roleReferences: [],
  evidenceReferences: [],
  policyReferences: [],
  separationOfDutyReferences: [],
  humanGateDecision: null,
  orchestrationRunIdentity: "orchestration-run.test-command-fixture",
  agentRunIdentity: null,
  causationReferences: [],
  predecessorReference: null,
  freshnessBoundary: null,
  kernelCommandContentIdentity:
    "sha256:76adda1264e3252230d2682c77abe171cec344ea4e90cccb9c215dc91f871318",
  ...structuredClone(overrides),
});

test("local operator can start an empty authority shell", async () => {
  const identities = [
    "orchestration-run.test-001",
    "kernel-command.initialize.test-001",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });

  const view = await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });

  assert.equal(view.kind, "ReferenceSliceView");
  assert.deepEqual(view.run, {
    orchestrationRunIdentity: "orchestration-run.test-001",
    recordedTime: "2026-01-15T09:00:00.000Z",
    boundary: "local-sandbox-only",
  });
  assert.deepEqual(view.scope, {
    tenantIdentity: "tenant.cedar-steam",
    sandboxes: [
      {
        sandboxIdentity: "sandbox.retail",
        locationIdentity: "location.retail",
        generationIdentity: "sandbox-generation.retail.1",
        appliedBlueprint: null,
      },
      {
        sandboxIdentity: "sandbox.cafe",
        locationIdentity: "location.cafe",
        generationIdentity: "sandbox-generation.cafe.1",
        appliedBlueprint: null,
      },
    ],
  });
  assert.deepEqual(view.authority, {
    blueprintVersions: 0,
    blueprintApprovals: 0,
    appliedBlueprints: 0,
    provisioningAttempts: 0,
  });
  assert.deepEqual(view.business, {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  });
  assert.deepEqual(view.initialization, {
    disposition: "Accepted",
    governedActionIdentity:
      "kernel.foundation.initialize-empty-authority-shell",
  });
});

test("unsupported Kernel Command is rejected without governed effect", async () => {
  const identities = [
    "orchestration-run.test-002",
    "kernel-command.initialize.test-002",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const query = {
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  };
  const before = await system.businessKernel.observe(query);

  const result = await system.businessKernel.submit(unsupportedKernelCommand());
  const after = await system.businessKernel.observe(query);

  assert.deepEqual(result, {
    kind: "KernelCommandResult",
    kernelCommandIdentity: "kernel-command.unsupported.test-fixture",
    kernelCommandContentIdentity:
      "sha256:76adda1264e3252230d2682c77abe171cec344ea4e90cccb9c215dc91f871318",
    receivedCommandFingerprint:
      "sha256:76adda1264e3252230d2682c77abe171cec344ea4e90cccb9c215dc91f871318",
    disposition: "Rejected",
    governedActionIdentity: "kernel.action.unsupported",
    recordedTime: "2026-01-15T09:00:01.000Z",
    versionSet: VERSION_SET_FIXTURE,
    responsibleKernelSource: {
      machineIdentity: "kernel.business",
      version: "1.0.0",
    },
    invariantResults: [],
    diagnostics: [
      {
        code: "KERNEL.COMMAND.UNSUPPORTED_ACTION",
        severity: "Blocking",
        summary:
          "The governed action is not supported by this Business Kernel version.",
      },
    ],
  });
  assert.deepEqual(after.authority, before.authority);
  assert.deepEqual(after.business, before.business);
  assert.deepEqual(
    { before: before.operational, after: after.operational },
    {
      before: { kernelCommandResults: 1 },
      after: { kernelCommandResults: 2 },
    }
  );
});

test("exact Kernel Command replay returns one durable result", async () => {
  const identities = [
    "orchestration-run.test-replay",
    "kernel-command.initialize.test-replay",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const command = unsupportedKernelCommand();

  const first = await system.businessKernel.submit(command);
  const replay = await system.businessKernel.submit(command);
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(replay, first);
  assert.deepEqual(observation.operational, { kernelCommandResults: 2 });
});

test("Kernel Command with a mismatched Content Identity fails closed", async () => {
  const identities = [
    "orchestration-run.test-command-content",
    "kernel-command.initialize.test-command-content",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });

  const result = await system.businessKernel.submit(
    unsupportedKernelCommand({
      kernelCommandContentIdentity: `sha256:${"0".repeat(64)}`,
    })
  );
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.equal(result.disposition, "Rejected");
  assert.equal(
    result.diagnostics[0].code,
    "KERNEL.COMMAND.CONTENT_IDENTITY_MISMATCH"
  );
  assert.deepEqual(observation.operational, { kernelCommandResults: 2 });
});

test("Kernel Command Result binds the validated Content Identity", async () => {
  const identities = [
    "orchestration-run.test-command-binding",
    "kernel-command.initialize.test-command-binding",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const contentIdentity =
    "sha256:76adda1264e3252230d2682c77abe171cec344ea4e90cccb9c215dc91f871318";

  const result = await system.businessKernel.submit(unsupportedKernelCommand());

  assert.equal(result.disposition, "Rejected");
  assert.equal(result.kernelCommandContentIdentity, contentIdentity);
  assert.equal(result.diagnostics[0].code, "KERNEL.COMMAND.UNSUPPORTED_ACTION");
});

test("incomplete Kernel Command envelope is rejected before action dispatch", async () => {
  const identities = [
    "orchestration-run.test-command-schema",
    "kernel-command.initialize.test-command-schema",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });

  const result = await system.businessKernel.submit({
    kernelCommandIdentity: "kernel-command.incomplete.test-001",
    governedActionIdentity: "kernel.action.unsupported",
    tenantIdentity: "tenant.cedar-steam",
    recordedTime: "2026-01-15T09:00:01.000Z",
    input: {},
  });

  assert.equal(result.disposition, "Rejected");
  assert.equal(result.diagnostics[0].code, "KERNEL.COMMAND.SCHEMA_INVALID");
});

test("reusing a Kernel Command Identity with changed content fails closed", async () => {
  const identities = [
    "orchestration-run.test-idempotency-conflict",
    "kernel-command.initialize.test-idempotency-conflict",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const firstCommand = unsupportedKernelCommand({
    kernelCommandContentIdentity: `sha256:${"0".repeat(64)}`,
  });
  await system.businessKernel.submit(firstCommand);

  const conflict = await system.businessKernel.submit({
    ...firstCommand,
    kernelCommandContentIdentity: `sha256:${"1".repeat(64)}`,
    input: { changed: true },
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.equal(conflict.disposition, "Rejected");
  assert.equal(
    conflict.diagnostics[0].code,
    "KERNEL.COMMAND.IDEMPOTENCY_CONFLICT"
  );
  assert.deepEqual(observation.operational, { kernelCommandResults: 2 });
});

test("replay cannot hide changed content behind the recorded digest", async () => {
  const identities = [
    "orchestration-run.test-idempotency-forgery",
    "kernel-command.initialize.test-idempotency-forgery",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const command = unsupportedKernelCommand();
  await system.businessKernel.submit(command);

  const conflict = await system.businessKernel.submit({
    ...command,
    input: { changed: true },
  });

  assert.equal(conflict.disposition, "Rejected");
  assert.equal(
    conflict.diagnostics[0].code,
    "KERNEL.COMMAND.IDEMPOTENCY_CONFLICT"
  );
});

test("initialization cannot replace an existing Tenant scope", async () => {
  const identities = [
    "orchestration-run.test-scope-replacement",
    "kernel-command.initialize.test-scope-replacement",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const query = {
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  };
  const before = await system.businessKernel.observe(query);

  const result = await system.businessKernel.submit(
    unsupportedKernelCommand({
      kernelCommandIdentity: "kernel-command.initialize.replacement.test-001",
      governedActionIdentity:
        "kernel.foundation.initialize-empty-authority-shell",
      expectedBaseline: {
        stateRevision: 1,
        tenantIdentity: "tenant.cedar-steam",
      },
      input: {
        scope: {
          tenantIdentity: "tenant.cedar-steam",
          sandboxes: [
            {
              sandboxIdentity: "sandbox.replacement",
              locationIdentity: "location.replacement",
              generationIdentity: "sandbox-generation.replacement.1",
              appliedBlueprint: null,
            },
          ],
        },
      },
      orchestrationRunIdentity: "orchestration-run.test-replacement",
      kernelCommandContentIdentity:
        "sha256:6ba891a0aa496fcc1ab9560a0788c47db3e37cd309e326f663c457329cf98a10",
    })
  );
  const after = await system.businessKernel.observe(query);

  assert.equal(result.disposition, "Rejected");
  assert.equal(result.diagnostics[0].code, "KERNEL.COMMAND.BASELINE_MISMATCH");
  assert.deepEqual(after.scope, before.scope);
  assert.deepEqual(after.business, before.business);
});

test("Kernel observation rejects a different Tenant without exposing state", async () => {
  const identities = [
    "orchestration-run.test-isolation",
    "kernel-command.initialize.test-isolation",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });

  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.isolation-sentinel",
  });

  assert.deepEqual(observation, {
    kind: "KernelObservation",
    disposition: "Rejected",
    tenantIdentity: "tenant.isolation-sentinel",
    diagnostics: [
      {
        code: "KERNEL.OBSERVATION.TENANT_SCOPE_MISMATCH",
        severity: "Blocking",
        summary: "The requested Tenant is outside this Kernel state scope.",
      },
    ],
  });
  assert.equal("scope" in observation, false);
  assert.equal("business" in observation, false);
});

test("empty authority shell cannot report the v1 objective as Passed", async () => {
  const identities = [
    "orchestration-run.test-003",
    "kernel-command.initialize.test-003",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  const view = await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const rejection = await system.businessKernel.submit(
    unsupportedKernelCommand()
  );
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const report = await system.acceptanceEvaluator.evaluate({
    completionConditions: [
      {
        identity: "reference-slice.condition.v1-complete",
        version: "1.0.0",
        criticality: "Required",
      },
    ],
    sources: { view, rejection, observation },
  });

  assert.deepEqual(report, {
    kind: "AcceptanceReport",
    verdict: "Indeterminate",
    completionConditions: [
      {
        identity: "reference-slice.condition.v1-complete",
        version: "1.0.0",
        criticality: "Required",
        verdict: "Indeterminate",
        diagnostic: {
          code: "REFERENCE_SLICE.COMPLETION.NOT_ESTABLISHED",
          summary:
            "The empty authority shell does not yet prove the v1 Reference Vertical Slice.",
        },
      },
    ],
    authority: {
      createsGovernedTruth: false,
      ownerAcceptance: false,
    },
  });
});

test("memory and atomic JSON persistence expose the same empty shell", async (t) => {
  const runDirectory = await mkdtemp(join(tmpdir(), "abos-ticket-01-"));
  t.after(() => rm(runDirectory, { recursive: true, force: true }));
  const createBoundaries = () => {
    const identities = [
      "orchestration-run.test-parity",
      "kernel-command.initialize.test-parity",
    ];
    return {
      clock: { now: () => "2026-01-15T09:00:00.000Z" },
      identitySource: { next: () => identities.shift() },
    };
  };
  const memory = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    ...createBoundaries(),
  });
  const atomic = await createLocalReferenceSlice({
    persistence: {
      kind: "atomic-json",
      stateFile: join(runDirectory, "state.json"),
    },
    ...createBoundaries(),
  });

  const memoryView = await memory.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const atomicView = await atomic.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });

  assert.deepEqual(atomicView, memoryView);
});

test("atomic JSON persistence reopens through the public observation seam", async (t) => {
  const runDirectory = await mkdtemp(join(tmpdir(), "abos-ticket-01-reopen-"));
  t.after(() => rm(runDirectory, { recursive: true, force: true }));
  const stateFile = join(runDirectory, "state.json");
  const firstIdentities = [
    "orchestration-run.test-reopen-first",
    "kernel-command.initialize.test-reopen",
  ];
  const first = await createLocalReferenceSlice({
    persistence: { kind: "atomic-json", stateFile },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: {
      next: () => firstIdentities.shift(),
    },
  });
  await first.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const expected = await first.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const reopened = await createLocalReferenceSlice({
    persistence: { kind: "atomic-json", stateFile },
    clock: { now: () => "2026-01-15T09:00:01.000Z" },
    identitySource: {
      next: () => "orchestration-run.test-reopen-second",
    },
  });
  const observed = await reopened.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(observed, expected);
});

test("repeated empty runs keep business meaning and allocate fresh provenance", async () => {
  const createSystem = () =>
    createLocalReferenceSlice({
      persistence: { kind: "memory" },
      clock: { now: () => "2026-01-15T09:00:00.000Z" },
    });
  const first = await createSystem();
  const second = await createSystem();
  const firstView = await first.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const secondView = await second.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const businessMeaning = (view) => ({
    boundary: view.run.boundary,
    scope: view.scope,
    authority: view.authority,
    business: view.business,
    initialization: view.initialization,
  });

  assert.notEqual(
    firstView.run.orchestrationRunIdentity,
    secondView.run.orchestrationRunIdentity
  );
  assert.match(
    firstView.run.orchestrationRunIdentity,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
  assert.deepEqual(businessMeaning(secondView), businessMeaning(firstView));
});
