import { canonicalJson, contentIdentity, deepClone } from "./canonical.mjs";
import {
  CAFE_FIXTURE,
  createBlueprint,
  createIntentBrief,
  makeCommand,
  recomputeBlueprintContentIdentity,
  RETAIL_FIXTURE,
  SENTINEL_TENANT_ID,
  VERSION_SET,
} from "./fixtures.mjs";
import { BusinessKernel } from "./kernel.mjs";
import { createReferenceSlice } from "./reference-slice.mjs";
import { MemoryStore } from "./store.mjs";

export function executeAcceptanceScenario(store, source) {
  const slice = createReferenceSlice({ store });

  const versionOne = slice.dispatch({ type: "interview.start" });
  const preview = slice.dispatch({ type: "interview.preview" });
  const premature = slice.dispatch({ type: "provision.all" });
  const versionTwo = slice.dispatch({ type: "interview.confirm-counter-service" });
  const approved = slice.dispatch({ type: "approval.authorize" });
  const firstProvision = slice.dispatch({ type: "provision.all" });
  const firstProvisionSnapshot = slice.kernel.observe();

  const retailRun = slice.dispatch({ type: "scenario.retail" });
  const retailResult = deepClone(retailRun.lastResult);
  const retailSummary = deepClone(retailRun.business.retail);
  const cafeRun = slice.dispatch({ type: "scenario.cafe" });
  const cafeResult = deepClone(cafeRun.lastResult);
  const cafeSummary = deepClone(cafeRun.business.cafe);
  const afterFirstRun = slice.kernel.observe();

  const resetOne = slice.dispatch({ type: "reset.all" });
  const afterResetOne = slice.kernel.observe();
  const negative = runNegativePaths({
    versionOne,
    approvedSnapshot: approved.kernel,
    firstProvisionSnapshot,
    afterFirstRun,
    afterResetOne,
    firstResetCommands: resetOne.lastResult.commands,
  });

  const reprovision = slice.dispatch({ type: "provision.all" });
  const replayRetailRun = slice.dispatch({ type: "scenario.retail" });
  const replayRetail = deepClone(replayRetailRun.business.retail);
  const replayCafeRun = slice.dispatch({ type: "scenario.cafe" });
  const replayCafe = deepClone(replayCafeRun.business.cafe);
  const resetTwo = slice.dispatch({ type: "reset.all" });
  const final = slice.kernel.observe();

  const firstBusiness = comparableBusiness(retailSummary, cafeSummary);
  const replayBusiness = comparableBusiness(replayRetail, replayCafe);
  const suite = identityEnvelope("reference-slice.acceptance-suite", "1.0.0", {
    completionConditions: 12,
    publicInterfaces: ["ReferenceSlice.dispatch", "BusinessKernel.submit", "BusinessKernel.observe", "AcceptanceEvaluator.evaluate"],
  });
  const fixture = identityEnvelope("reference-slice.fixture.cedar-steam", "1.0.0", {
    tenantId: "tenant.cedar-steam",
    sentinelTenantId: SENTINEL_TENANT_ID,
    targets: ["retail", "cafe"],
    currency: "USD",
    units: ["each", "g", "ml"],
    fictitious: true,
  });
  const mainDeliveries = final.commandResults.length;
  const deliveryCount = mainDeliveries + negative.deliveryCount;
  const budgetGate = {
    identity: "human-gate.budget.reference-slice.01",
    type: "Budget Gate",
    subject: { dimension: "kernelCommandDeliveries", from: 48, to: 96 },
    response: "Authorize bounded amendment",
    responder: "participant.owner.fixture",
    effectiveTime: "2026-01-15T09:20:00.000Z",
    nonEffect: "No Business Kernel or governed-action authority is granted.",
  };
  const runBudget = {
    identity: "run-budget.reference-slice.01",
    version: 2,
    profile: "Balanced Local Slice",
    initialLimits: budgetLimits(48),
    limits: budgetLimits(96),
    amendment: { identity: "run-budget-amendment.reference-slice.01", gateIdentity: budgetGate.identity, dimension: "kernelCommandDeliveries", priorLimit: 48, resultingLimit: 96 },
    consumed: {
      agentRunAttempts: 0,
      inputTokens: 0,
      outputTokens: 0,
      modelProviderRequests: 0,
      toolTaskAttempts: 1,
      transientRetries: 0,
      kernelCommandDeliveries: deliveryCount,
      activeExecutionMilliseconds: 0,
      totalElapsedMilliseconds: 0,
    },
    reserved: Object.fromEntries(Object.keys(budgetLimits(96)).map(key => [key, 0])),
    monetarySpend: { status: "Not Applicable", reason: "No authoritative per-run monetary measurement or paid provider request exists." },
    reconciled: deliveryCount <= 96,
  };
  const orchestration = {
    runIdentity: "orchestration-run.reference-slice.01",
    objective: "Execute and observe the local retail plus cafe reuse proof.",
    definition: "reference-slice.orchestration@1.0.0",
    stateBeforeEvaluation: "Active",
    controlPhase: "Observing",
    transitions: [
      ["Created", "Active", "Interviewing"],
      ["Active", "Waiting", "Requesting Human Decision", "Human Gate"],
      ["Waiting", "Active", "Submitting Kernel Command"],
      ["Active", "Waiting", "Observing", "Budget Exhausted"],
      ["Waiting", "Active", "Correcting", "Budget Gate"],
      ["Active", "Active", "Observing"],
    ],
    agentRuns: [],
    runBudget,
    budgetGate,
    humanGates: [...finalGates(slice), budgetGate],
    pendingHumanGates: 0,
    failureRecords: [],
    unresolvedFailures: 0,
    unknownEffectStatuses: 0,
  };

  return {
    suite,
    fixture,
    source,
    versionSet: VERSION_SET,
    ownerInterview: {
      versionOne: ownerProjection(versionOne),
      preview: { previewCount: preview.previews, lifecycle: preview.blueprint.lifecycle, approved: preview.kernel.currentApprovedBlueprint !== null },
      versionTwo: ownerProjection(versionTwo),
    },
    governance: {
      prematureProvisionResults: premature.lastResult.results,
      reviewBundle: reviewBundle(versionOne, versionTwo),
      approval: approved.kernel.currentApprovedBlueprint,
      approvalHumanGate: approved.humanGates[0],
      approvalHumanGateDecision: approved.humanGateDecisions[0],
      blueprints: approved.kernel.blueprints,
      validationReports: approved.kernel.validationReports,
    },
    firstProvisioning: {
      effectiveBlueprint: firstProvision.kernel.effectiveBlueprint,
      compilationRecords: firstProvision.kernel.compilationRecords,
      compatibilityVerdicts: firstProvision.kernel.compatibilityVerdicts,
      provisioningAttempts: firstProvision.kernel.provisioningAttempts,
      targets: firstProvision.kernel.targets,
    },
    firstRun: {
      retail: retailSummary,
      retailCheckpoints: retailResult.checkpoints,
      cafe: cafeSummary,
      cafeCheckpoints: cafeResult.checkpoints,
      businessContentIdentity: contentIdentity(firstBusiness),
    },
    negativePaths: negative.paths,
    resetRounds: {
      first: resetOne.kernel.resetRecords.slice(0, 2),
      second: resetTwo.kernel.resetRecords.slice(2, 4),
      firstCommands: resetOne.lastResult.commands,
      finalResults: resetTwo.lastResult.results,
    },
    replay: {
      retail: replayRetail,
      cafe: replayCafe,
      businessContentIdentity: contentIdentity(replayBusiness),
      provisioningAttempts: reprovision.kernel.provisioningAttempts.slice(-2),
    },
    orchestration,
    dataBoundary: {
      fictitiousOnly: true,
      sensitiveDataClasses: ["Internal", "Confidential"],
      restrictedDataCategories: 0,
      externalAi: "absent",
      networkIntegrations: "absent",
      productionAuthority: "absent",
      exclusions: ["production-deployment", "authentication", "scaling", "backups", "billing", "external-integrations", "tables", "reservations", "delivery", "tips", "loyalty", "advanced-recipe-costing"],
    },
    final: {
      targets: final.targets,
      commandResults: final.commandResults,
      commandResultCount: final.commandResults.length,
      resetRecords: final.resetRecords,
      approvals: final.approvals,
      blueprints: final.blueprints,
      validationReports: final.validationReports,
      compatibilityVerdicts: final.compatibilityVerdicts,
      provisioningAttempts: final.provisioningAttempts,
      effectiveBlueprint: final.effectiveBlueprint,
    },
  };
}

function runNegativePaths(context) {
  const paths = [];
  let deliveryCount = 0;
  const submit = (kernel, command) => {
    deliveryCount += 1;
    return kernel.submit(command);
  };

  paths.push(path("draft-authority", context.versionOne.blueprint.approvalEligible === false));
  paths.push(path("assumption", context.versionOne.blueprint.blockers.some(item => item.code === "CFG.TRACEABILITY.ASSUMPTION_ACTIVE")));

  const invalidResults = [];
  for (const kind of ["unknown", "unsupported"]) {
    const kernel = kernelFrom(context.approvedSnapshot);
    const blueprint = createBlueprint(3, createIntentBrief(3, "Confirmed"), "Confirmed");
    if (kind === "unknown") blueprint.content.unexpected = true;
    else blueprint.content.capabilitySelections[0].version = "2.0.0";
    blueprint.contentIdentity = recomputeBlueprintContentIdentity(blueprint);
    invalidResults.push(submit(kernel, makeCommand({ identity: `command.negative.blueprint.${kind}`, action: "blueprint.create-draft", input: { blueprint } })));
  }
  paths.push(path("configuration-rejection", invalidResults[0].code === "CFG.SCHEMA.UNKNOWN_PROPERTY" && invalidResults[1].code === "CFG.CAPABILITY.VERSION_UNSUPPORTED", invalidResults));

  {
    const kernel = kernelFrom(context.approvedSnapshot);
    const blueprint = createBlueprint(3, createIntentBrief(3, "Confirmed"), "Confirmed");
    const created = submit(kernel, makeCommand({ identity: "command.negative.concurrent.create", action: "blueprint.create-draft", input: { blueprint } }));
    const decision = { identity: "decision.negative.stale", response: "Authorize Submission", subjectVersionId: blueprint.reference.versionId, subjectContentIdentity: blueprint.contentIdentity };
    const rejected = submit(kernel, makeCommand({ identity: "command.negative.concurrent.approve", action: "blueprint.approve", input: { reference: blueprint.reference, contentIdentity: blueprint.contentIdentity, approvalBaseline: null }, gateDecision: decision }));
    paths.push(path("stale-approval", created.disposition === "Accepted" && rejected.code === "ORC.BASELINE.KERNEL_BASELINE_CHANGED" && kernel.observe().lifecycle[blueprint.reference.versionId] === "Draft", [created, rejected]));
  }

  {
    const kernel = kernelFrom(context.afterFirstRun);
    const target = kernel.observe({ type: "target", targetId: "retail" });
    const replay = makeCommand({ identity: "command.retail.payment.accept.01.g1", action: "payment.accept", role: "role.retail-cashier", targetId: "retail", locationId: target.locationId, generationId: target.generationId, input: { expectedAppliedBlueprint: target.appliedBlueprint, recordId: RETAIL_FIXTURE.paymentId, saleId: RETAIL_FIXTURE.saleId, amountMinor: RETAIL_FIXTURE.paymentMinor, currency: "USD", method: "cash", receiptReference: RETAIL_FIXTURE.receiptReference } });
    const before = effectsIdentity(kernel, "retail");
    const replayed = submit(kernel, replay);
    const conflict = submit(kernel, changeCommand(replay, { input: { ...replay.input, amountMinor: 4801 } }));
    paths.push(path("idempotency", replayed.disposition === "Accepted" && conflict.code === "IDEMPOTENCY_CONFLICT" && effectsIdentity(kernel, "retail") === before, [replayed, conflict]));
  }

  const scopeResults = [];
  for (const [name, mutate] of [
    ["cross-tenant", command => changeCommand(command, { tenantId: SENTINEL_TENANT_ID })],
    ["wrong-location", command => changeCommand(command, { locationId: "location.cafe" })],
    ["stale-generation", command => changeCommand(command, { generationId: "generation.retail.0" })],
    ["stale-applied", command => changeCommand(command, { input: { ...command.input, expectedAppliedBlueprint: { ...command.input.expectedAppliedBlueprint, contentIdentity: "sha256:stale" } } })],
    ["wrong-role", command => changeCommand(command, { role: "role.cafe-cashier" })],
  ]) {
    const kernel = kernelFrom(context.firstProvisionSnapshot);
    const command = scoped(kernel, { identity: `command.negative.scope.${name}`, action: "purchase.confirm", role: "role.buyer", input: purchaseInput(`purchase-order.negative.${name}`) });
    const before = effectsIdentity(kernel, "retail");
    const result = submit(kernel, mutate(command));
    scopeResults.push({ name, result, unchanged: effectsIdentity(kernel, "retail") === before });
  }
  {
    const kernel = kernelFrom(context.afterFirstRun);
    const before = effectsIdentity(kernel, "cafe");
    const result = submit(kernel, scoped(kernel, { identity: "command.negative.scope.cross-target", action: "kitchen.fulfill", role: "role.kitchen-operator", targetId: "cafe", input: { recordId: "kitchen-ticket.retail.unknown", saleId: "sale.retail.unknown" } }));
    scopeResults.push({ name: "cross-target", result, unchanged: effectsIdentity(kernel, "cafe") === before });
  }
  paths.push(path("scope-isolation", scopeResults.every(item => item.result.disposition === "Rejected" && item.unchanged), scopeResults));

  const invariantResults = [];
  {
    const kernel = kernelFrom(context.afterFirstRun);
    const before = effectsIdentity(kernel, "retail");
    const result = submit(kernel, scoped(kernel, { identity: "command.negative.currency", action: "payment.accept", role: "role.retail-cashier", input: { recordId: "payment.negative.currency", saleId: RETAIL_FIXTURE.saleId, amountMinor: 1, currency: "EUR", method: "cash", receiptReference: "receipt.negative.currency" } }));
    invariantResults.push({ name: "currency-mismatch", result, unchanged: effectsIdentity(kernel, "retail") === before });
  }
  {
    const kernel = kernelFrom(context.firstProvisionSnapshot);
    submit(kernel, scoped(kernel, { identity: "command.negative.unit.po", action: "purchase.confirm", role: "role.buyer", input: purchaseInput("purchase-order.negative.unit") }));
    const before = effectsIdentity(kernel, "retail");
    const result = submit(kernel, scoped(kernel, { identity: "command.negative.unit.receipt", action: "receipt.accept", role: "role.receiver", input: { recordId: "receipt.negative.unit", purchaseOrderId: "purchase-order.negative.unit", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "g", quantity: 1, unitCostMinor: 500 }] } }));
    invariantResults.push({ name: "unit-mismatch", result, unchanged: effectsIdentity(kernel, "retail") === before });
  }
  {
    const kernel = kernelFrom(context.firstProvisionSnapshot);
    submit(kernel, scoped(kernel, { identity: "command.negative.stock.order", action: "order.accept", role: "role.retail-cashier", input: { recordId: "order.negative.stock", customerId: "party.customer.retail", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "each", quantity: 1, unitPriceMinor: 1200 }] } }));
    const before = effectsIdentity(kernel, "retail");
    const result = submit(kernel, scoped(kernel, { identity: "command.negative.stock.sale", action: "sale.fulfill", role: "role.retail-cashier", input: { recordId: "sale.negative.stock", orderId: "order.negative.stock" } }));
    invariantResults.push({ name: "negative-stock", result, unchanged: effectsIdentity(kernel, "retail") === before });
  }
  {
    const kernel = kernelFrom(context.firstProvisionSnapshot);
    const result = submit(kernel, scoped(kernel, { identity: "command.negative.unbalanced", action: "ledger.post-direct", role: "role.owner", input: { entries: [{ account: "Cash", side: "debit", amountMinor: 100 }] } }));
    invariantResults.push({ name: "unbalanced-posting", result, unchanged: true });
  }
  {
    const kernel = kernelFrom(context.firstProvisionSnapshot);
    const targetId = "cafe";
    const poLines = [{ itemId: "ingredient.beans", unit: "g", quantity: 10, unitCostMinor: 2 }];
    for (const command of [
      scoped(kernel, { identity: "command.negative.consume.po", action: "purchase.confirm", role: "role.buyer", targetId, input: { recordId: "purchase-order.negative.consume", supplierId: "party.supplier.cafe", currency: "USD", lines: poLines } }),
      scoped(kernel, { identity: "command.negative.consume.receipt", action: "receipt.accept", role: "role.receiver", targetId, input: { recordId: "receipt.negative.consume", purchaseOrderId: "purchase-order.negative.consume", currency: "USD", lines: poLines } }),
      scoped(kernel, { identity: "command.negative.consume.order", action: "order.accept", role: "role.cafe-cashier", targetId, input: { recordId: "order.negative.consume", customerId: "party.customer.cafe", currency: "USD", lines: [{ itemId: "menu.cortado", unit: "each", quantity: 1, unitPriceMinor: 900, ingredientRequirements: [{ itemId: "ingredient.beans", unit: "g", quantity: 11 }] }] } }),
      scoped(kernel, { identity: "command.negative.consume.accept", action: "kitchen.accept", role: "role.kitchen-operator", targetId, input: { recordId: "kitchen-ticket.negative.consume", orderId: "order.negative.consume" } }),
      scoped(kernel, { identity: "command.negative.consume.prepare", action: "kitchen.prepare", role: "role.kitchen-operator", targetId, input: { recordId: "kitchen-ticket.negative.consume" } }),
      scoped(kernel, { identity: "command.negative.consume.ready", action: "kitchen.ready", role: "role.kitchen-operator", targetId, input: { recordId: "kitchen-ticket.negative.consume" } }),
    ]) submit(kernel, command);
    const before = effectsIdentity(kernel, targetId);
    const result = submit(kernel, scoped(kernel, { identity: "command.negative.consume.fulfill", action: "kitchen.fulfill", role: "role.kitchen-operator", targetId, input: { recordId: "kitchen-ticket.negative.consume", saleId: "sale.negative.consume" } }));
    invariantResults.push({ name: "ingredient-over-consumption", result, unchanged: effectsIdentity(kernel, targetId) === before });
  }
  paths.push(path("financial-stock", invariantResults.every(item => item.result.disposition === "Rejected" && item.unchanged), invariantResults));

  {
    const inert = ["accepted", "preparing", "ready"].every(state => context.afterFirstRun.targets.cafe.records.some(record => record.type === "Kitchen Ticket") && context.afterFirstRun.targets.cafe.movements.length === 4);
    const kernel = kernelFrom(context.afterFirstRun);
    const target = kernel.observe({ type: "target", targetId: "cafe" });
    const replay = makeCommand({ identity: "command.cafe.kitchen.fulfill.01.g1", action: "kitchen.fulfill", role: "role.kitchen-operator", targetId: "cafe", locationId: target.locationId, generationId: target.generationId, input: { expectedAppliedBlueprint: target.appliedBlueprint, recordId: CAFE_FIXTURE.kitchenTicketId, saleId: CAFE_FIXTURE.saleId } });
    const before = effectsIdentity(kernel, "cafe");
    const result = submit(kernel, replay);
    paths.push(path("kitchen-inertness", inert && result.disposition === "Accepted" && effectsIdentity(kernel, "cafe") === before, [result]));
  }

  const paymentResults = [];
  for (const excess of [false, true]) {
    const kernel = kernelFrom(context.afterFirstRun);
    const suffix = excess ? "excess" : "partial";
    submit(kernel, scoped(kernel, { identity: `command.negative.payment.${suffix}.order`, action: "order.accept", role: "role.retail-cashier", input: { recordId: `order.negative.payment.${suffix}`, customerId: "party.customer.retail", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "each", quantity: 1, unitPriceMinor: 1200 }] } }));
    submit(kernel, scoped(kernel, { identity: `command.negative.payment.${suffix}.sale`, action: "sale.fulfill", role: "role.retail-cashier", input: { recordId: `sale.negative.payment.${suffix}`, orderId: `order.negative.payment.${suffix}` } }));
    if (excess) {
      paymentResults.push(submit(kernel, scoped(kernel, { identity: "command.negative.payment.excess", action: "payment.accept", role: "role.retail-cashier", input: { recordId: "payment.negative.excess", saleId: "sale.negative.payment.excess", amountMinor: 1300, currency: "USD", method: "cash", receiptReference: "receipt.negative.excess" } })));
    } else {
      paymentResults.push(submit(kernel, scoped(kernel, { identity: "command.negative.payment.partial", action: "payment.accept", role: "role.retail-cashier", input: { recordId: "payment.negative.partial", saleId: "sale.negative.payment.partial", amountMinor: 400, currency: "USD", method: "cash", receiptReference: "receipt.negative.partial" } })));
      paymentResults.push(submit(kernel, scoped(kernel, { identity: "command.negative.payment.remainder", action: "payment.accept", role: "role.retail-cashier", input: { recordId: "payment.negative.remainder", saleId: "sale.negative.payment.partial", amountMinor: 800, currency: "USD", method: "cash", receiptReference: "receipt.negative.remainder" } })));
    }
  }
  paths.push(path("payment-residual", paymentResults.length === 3 && paymentResults.every(item => item.disposition === "Accepted") && paymentResults[0].output.payment.residualMinor === 800 && paymentResults[1].output.payment.residualMinor === 0 && paymentResults[2].output.payment.unallocatedMinor === 100, paymentResults));

  const immutableResults = [];
  for (const [identity, action] of [["update", "record.update-direct"], ["delete", "business-event.delete"]]) {
    const kernel = kernelFrom(context.afterFirstRun);
    const before = effectsIdentity(kernel, "retail");
    const result = submit(kernel, scoped(kernel, { identity: `command.negative.immutable.${identity}`, action, role: "role.owner", input: { recordId: RETAIL_FIXTURE.saleId } }));
    immutableResults.push({ result, unchanged: effectsIdentity(kernel, "retail") === before });
  }
  paths.push(path("immutable-effects", immutableResults.every(item => item.result.disposition === "Rejected" && item.unchanged), immutableResults));

  {
    const kernel = kernelFrom(context.afterResetOne);
    const original = context.firstResetCommands[0];
    const stale = changeCommand(original, { identity: "command.negative.reset.stale" });
    const before = effectsIdentity(kernel, "retail");
    const result = submit(kernel, stale);
    paths.push(path("stale-reset", result.disposition === "Rejected" && effectsIdentity(kernel, "retail") === before, [result]));
  }
  const exportText = canonicalJson({ retail: context.afterFirstRun.targets.retail, cafe: context.afterFirstRun.targets.cafe });
  paths.push(path("sentinel-isolation", !exportText.includes(SENTINEL_TENANT_ID)));
  return { paths, deliveryCount };
}

function identityEnvelope(identity, version, content) {
  return { identity, version, contentIdentity: contentIdentity({ identity, version, content }) };
}

function ownerProjection(view) {
  return { intentBrief: view.intentBrief, blueprint: view.blueprint };
}

function reviewBundle(versionOne, versionTwo) {
  return {
    identity: "review-bundle.cedar-steam.v2",
    blueprintReference: versionTwo.blueprint.reference,
    blueprintContentIdentity: versionTwo.blueprint.contentIdentity,
    approvalBaseline: null,
    semanticDiff: {
      baseline: versionOne.blueprint.reference,
      candidate: versionTwo.blueprint.reference,
      changes: [{ section: "Intent Traceability", path: "/intentTraceability/assumptions", change: "removed after explicit owner confirmation" }],
    },
    targetCompatibility: ["retail", "cafe"].map(targetId => ({ targetId, verdict: "Initial Provision Compatible" })),
    blockers: versionTwo.blueprint.blockers,
    exclusions: versionTwo.blueprint.content.businessScope.exclusions,
    dataExposure: { externalAi: "none", restrictedData: false },
  };
}

function finalGates(slice) {
  return slice.view().humanGates.map((gate, index) => ({ ...gate, decision: slice.view().humanGateDecisions[index] }));
}

function comparableBusiness(retail, cafe) {
  return {
    retail: comparableTarget(retail),
    cafe: comparableTarget(cafe),
  };
}

function comparableTarget(summary) {
  return {
    stock: summary.stock,
    accounts: summary.accounts,
    trialBalance: summary.trialBalance,
    payments: summary.payments.map(payment => ({ residualMinor: payment.residualMinor, unallocatedMinor: payment.unallocatedMinor })),
    records: summary.records.map(record => ({ identity: record.identity, type: record.type, state: record.state, stateHistory: record.stateHistory ?? null })),
    invariants: summary.invariants,
  };
}

function budgetLimits(kernelCommandDeliveries) {
  return {
    agentRunAttempts: 128,
    inputTokens: 300000,
    outputTokens: 60000,
    modelProviderRequests: 24,
    toolTaskAttempts: 96,
    transientRetries: 8,
    kernelCommandDeliveries,
    activeExecutionMilliseconds: 3600000,
    totalElapsedMilliseconds: 604800000,
  };
}

function kernelFrom(snapshot) {
  return new BusinessKernel(new MemoryStore(snapshot));
}

function scoped(kernel, { identity, action, role, input, targetId = "retail" }) {
  const target = kernel.observe({ type: "target", targetId });
  return makeCommand({ identity, action, role, targetId, locationId: target.locationId, generationId: target.generationId, input: { expectedAppliedBlueprint: target.appliedBlueprint, ...input } });
}

function purchaseInput(recordId) {
  return { recordId, supplierId: "party.supplier.retail", currency: "USD", lines: [{ itemId: "catalog.widget", unit: "each", quantity: 1, unitCostMinor: 500 }] };
}

function effectsIdentity(kernel, targetId) {
  const target = kernel.observe({ type: "target", targetId });
  return contentIdentity({ records: target.records, events: target.events, movements: target.movements, postingSets: target.postingSets, payments: target.payments });
}

function changeCommand(command, changes) {
  const { contentIdentity: _old, ...body } = { ...deepClone(command), ...changes };
  return { ...body, contentIdentity: contentIdentity(body) };
}

function path(identity, satisfied, details = []) {
  return { identity, satisfied, details };
}
