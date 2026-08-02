import { contentIdentity, deepClone } from "./canonical.mjs";
import { CAFE_FIXTURE, createBlueprint, createIntentBrief, makeCommand, RETAIL_FIXTURE } from "./fixtures.mjs";
import { BusinessKernel, createKernelState } from "./kernel.mjs";
import { MemoryStore } from "./store.mjs";

export function createReferenceSlice({ store = new MemoryStore(createKernelState()) } = {}) {
  const kernel = new BusinessKernel(store);
  const session = {
    intentBrief: null,
    blueprint: null,
    lastResult: { disposition: "Ready" },
    previews: 0,
    humanGates: [],
    humanGateDecisions: [],
    provisionRequestNumber: 0,
  };

  function dispatch(action) {
    if (action.type === "interview.start") {
      session.intentBrief = createIntentBrief(1, "Assumed");
      session.blueprint = createBlueprint(1, session.intentBrief, "Assumed");
      session.lastResult = kernel.submit(makeCommand({ identity: "command.blueprint.create.v1", action: "blueprint.create-draft", input: { blueprint: session.blueprint } }));
    } else if (action.type === "interview.preview") {
      session.previews += 1;
      session.lastResult = { disposition: "Observed", message: "Preview has no approval or provisioning authority." };
    } else if (action.type === "interview.confirm-counter-service") {
      session.intentBrief = createIntentBrief(2, "Confirmed");
      session.blueprint = createBlueprint(2, session.intentBrief, "Confirmed");
      session.lastResult = kernel.submit(makeCommand({ identity: "command.blueprint.create.v2", action: "blueprint.create-draft", input: { blueprint: session.blueprint } }));
    } else if (action.type === "approval.authorize") {
      const commandInput = { reference: session.blueprint.reference, contentIdentity: session.blueprint.contentIdentity, approvalBaseline: null };
      const proposedCommand = makeCommand({ identity: "command.blueprint.approve.v2", action: "blueprint.approve", input: commandInput, gateDecision: null });
      const gate = {
        identity: "human-gate.blueprint-approval.v2",
        type: "Kernel Submission Gate",
        subjectVersionId: session.blueprint.reference.versionId,
        subjectContentIdentity: session.blueprint.contentIdentity,
        subjectCommandIdentity: proposedCommand.identity,
        subjectCommandContentIdentity: proposedCommand.contentIdentity,
        nonEffect: "Authorize Submission does not create Blueprint Approval, provisioning, or governed business truth; the Business Kernel may still reject the command.",
      };
      const decision = {
        identity: "human-gate-decision.blueprint-approval.v2",
        gateId: gate.identity,
        response: "Authorize Submission",
        subjectVersionId: gate.subjectVersionId,
        subjectContentIdentity: gate.subjectContentIdentity,
        subjectCommandIdentity: gate.subjectCommandIdentity,
        subjectCommandContentIdentity: gate.subjectCommandContentIdentity,
        responder: "participant.owner.fixture",
      };
      session.humanGates.push(gate);
      session.humanGateDecisions.push(decision);
      session.lastResult = kernel.submit(makeCommand({ identity: proposedCommand.identity, action: "blueprint.approve", input: commandInput, gateDecision: decision }));
    } else if (action.type === "provision.all") {
      session.provisionRequestNumber += 1;
      const approved = kernel.observe().currentApprovedBlueprint;
      const results = ["retail", "cafe"].map(targetId => {
        const target = kernel.observe({ type: "target", targetId });
        return kernel.submit(makeCommand({
          identity: `command.provision.${targetId}.${target.generationId}.r${session.provisionRequestNumber}`,
          action: "sandbox.provision",
          targetId,
          locationId: target.locationId,
          generationId: target.generationId,
          input: { blueprint: approved },
        }));
      });
      session.lastResult = {
        disposition: results.every(result => result.disposition === "Accepted") ? "Applied" : "Rejected",
        results,
      };
    } else if (action.type === "scenario.retail") {
      session.lastResult = runRetailScenario(kernel);
    } else if (action.type === "scenario.cafe") {
      session.lastResult = runCafeScenario(kernel);
    } else if (action.type === "reset.all") {
      session.lastResult = resetAll(kernel, session);
    } else {
      throw new Error(`Unsupported ReferenceSlice action ${action.type}.`);
    }
    return view();
  }

  function view() {
    const snapshot = kernel.observe();
    const lifecycle = session.blueprint ? snapshot.lifecycle[session.blueprint.reference.versionId] : null;
    const validation = session.blueprint ? snapshot.validationReports.find(report => report.blueprintReference.versionId === session.blueprint.reference.versionId) : null;
    return {
      intentBrief: deepClone(session.intentBrief),
      blueprint: session.blueprint ? { ...deepClone(session.blueprint), lifecycle, approvalEligible: validation?.approvalEligible ?? false, blockers: deepClone(validation?.diagnostics ?? []) } : null,
      lastResult: deepClone(session.lastResult),
      previews: session.previews,
      humanGates: deepClone(session.humanGates),
      humanGateDecisions: deepClone(session.humanGateDecisions),
      business: {
        retail: kernel.observe({ type: "target-summary", targetId: "retail" }),
        cafe: kernel.observe({ type: "target-summary", targetId: "cafe" }),
      },
      kernel: snapshot,
    };
  }

  return { dispatch, view, kernel };
}

function runRetailScenario(kernel) {
  const fixture = RETAIL_FIXTURE;
  const target = kernel.observe({ type: "target", targetId: fixture.targetId });
  const baseline = target.appliedBlueprint;
  const common = {
    targetId: fixture.targetId,
    locationId: fixture.locationId,
    generationId: target.generationId,
  };
  const occurrence = `g${target.generationNumber}`;
  const commands = [
    makeCommand({ ...common, identity: `command.retail.purchase.confirm.01.${occurrence}`, action: "purchase.confirm", role: "role.buyer", input: { expectedAppliedBlueprint: baseline, recordId: fixture.purchaseOrderId, supplierId: "party.supplier.retail", currency: fixture.currency, lines: [{ itemId: fixture.itemId, unit: fixture.unit, quantity: fixture.purchaseQuantity, unitCostMinor: fixture.unitCostMinor }] } }),
    makeCommand({ ...common, identity: `command.retail.receipt.accept.01.${occurrence}`, action: "receipt.accept", role: "role.receiver", input: { expectedAppliedBlueprint: baseline, recordId: fixture.receiptId, purchaseOrderId: fixture.purchaseOrderId, currency: fixture.currency, lines: [{ itemId: fixture.itemId, unit: fixture.unit, quantity: fixture.purchaseQuantity, unitCostMinor: fixture.unitCostMinor }] } }),
    makeCommand({ ...common, identity: `command.retail.order.accept.01.${occurrence}`, action: "order.accept", role: "role.retail-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.orderId, customerId: "party.customer.retail", currency: fixture.currency, lines: [{ itemId: fixture.itemId, unit: fixture.unit, quantity: fixture.saleQuantity, unitPriceMinor: fixture.unitPriceMinor }] } }),
    makeCommand({ ...common, identity: `command.retail.sale.fulfill.01.${occurrence}`, action: "sale.fulfill", role: "role.retail-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.saleId, orderId: fixture.orderId } }),
    makeCommand({ ...common, identity: `command.retail.payment.accept.01.${occurrence}`, action: "payment.accept", role: "role.retail-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.paymentId, saleId: fixture.saleId, amountMinor: fixture.paymentMinor, currency: fixture.currency, method: "cash", receiptReference: fixture.receiptReference } }),
  ];
  const results = [];
  const checkpoints = {};
  for (const [index, command] of commands.entries()) {
    results.push(kernel.submit(command));
    checkpoints[["purchase", "receipt", "order", "fulfilled", "payment"][index]] = kernel.observe({ type: "target-summary", targetId: fixture.targetId });
  }
  return { disposition: results.every(result => result.disposition === "Accepted") ? "Completed" : "Rejected", results, checkpoints };
}

function runCafeScenario(kernel) {
  const fixture = CAFE_FIXTURE;
  const target = kernel.observe({ type: "target", targetId: fixture.targetId });
  const baseline = target.appliedBlueprint;
  const common = {
    targetId: fixture.targetId,
    locationId: fixture.locationId,
    generationId: target.generationId,
  };
  const occurrence = `g${target.generationNumber}`;
  const commands = {
    purchase: makeCommand({ ...common, identity: `command.cafe.purchase.confirm.01.${occurrence}`, action: "purchase.confirm", role: "role.buyer", input: { expectedAppliedBlueprint: baseline, recordId: fixture.purchaseOrderId, supplierId: "party.supplier.cafe", currency: fixture.currency, lines: fixture.purchaseLines } }),
    receipt: makeCommand({ ...common, identity: `command.cafe.receipt.accept.01.${occurrence}`, action: "receipt.accept", role: "role.receiver", input: { expectedAppliedBlueprint: baseline, recordId: fixture.receiptId, purchaseOrderId: fixture.purchaseOrderId, currency: fixture.currency, lines: fixture.purchaseLines } }),
    order: makeCommand({ ...common, identity: `command.cafe.order.accept.01.${occurrence}`, action: "order.accept", role: "role.cafe-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.orderId, customerId: "party.customer.cafe", currency: fixture.currency, lines: [{ itemId: fixture.menuItemId, modifierIds: [fixture.modifierId], unit: "each", quantity: 1, unitPriceMinor: fixture.priceMinor, ingredientRequirements: fixture.ingredientRequirements }] } }),
    accepted: makeCommand({ ...common, identity: `command.cafe.kitchen.accept.01.${occurrence}`, action: "kitchen.accept", role: "role.kitchen-operator", input: { expectedAppliedBlueprint: baseline, recordId: fixture.kitchenTicketId, orderId: fixture.orderId } }),
    preparing: makeCommand({ ...common, identity: `command.cafe.kitchen.prepare.01.${occurrence}`, action: "kitchen.prepare", role: "role.kitchen-operator", input: { expectedAppliedBlueprint: baseline, recordId: fixture.kitchenTicketId } }),
    ready: makeCommand({ ...common, identity: `command.cafe.kitchen.ready.01.${occurrence}`, action: "kitchen.ready", role: "role.kitchen-operator", input: { expectedAppliedBlueprint: baseline, recordId: fixture.kitchenTicketId } }),
    fulfilled: makeCommand({ ...common, identity: `command.cafe.kitchen.fulfill.01.${occurrence}`, action: "kitchen.fulfill", role: "role.kitchen-operator", input: { expectedAppliedBlueprint: baseline, recordId: fixture.kitchenTicketId, saleId: fixture.saleId } }),
    payment: makeCommand({ ...common, identity: `command.cafe.payment.accept.01.${occurrence}`, action: "payment.accept", role: "role.cafe-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.paymentId, saleId: fixture.saleId, amountMinor: fixture.paymentMinor, currency: fixture.currency, method: "cash", receiptReference: fixture.receiptReference } }),
  };
  const results = [];
  const checkpoints = {};
  for (const step of ["purchase", "receipt", "order", "accepted", "preparing", "ready", "fulfilled", "payment"]) {
    results.push(kernel.submit(commands[step]));
    if (["accepted", "preparing", "ready", "fulfilled"].includes(step)) checkpoints[step] = kernel.observe({ type: "target-summary", targetId: fixture.targetId });
  }
  return {
    disposition: results.every(result => result.disposition === "Accepted") ? "Completed" : "Rejected",
    results,
    checkpoints,
  };
}

function resetAll(kernel, session) {
  const results = [];
  const commands = [];
  for (const targetId of ["retail", "cafe"]) {
    const target = kernel.observe({ type: "target", targetId });
    const authorizationBody = {
      identity: `reset-authorization.${targetId}.${target.generationId}`,
      tenantId: target.tenantId,
      targetId,
      generationId: target.generationId,
      appliedBlueprintContentIdentity: target.appliedBlueprint?.contentIdentity ?? null,
      deletionScope: ["records", "business-events", "stock-movements", "posting-sets", "payments", "balances", "fixtures"],
      finalState: "clean-unapplied",
      reason: "Reset the fictitious Reference Vertical Slice generation.",
      expiresAt: "2026-01-16T09:00:00.000Z",
    };
    const authorization = { ...authorizationBody, contentIdentity: contentIdentity(authorizationBody) };
    const commandArguments = {
      identity: `command.reset.${targetId}.${target.generationId}`,
      action: "sandbox.reset",
      targetId,
      locationId: target.locationId,
      generationId: target.generationId,
      role: "role.owner",
      input: { expectedAppliedBlueprint: target.appliedBlueprint, authorization },
    };
    const proposedCommand = makeCommand({ ...commandArguments, gateDecision: null });
    const gate = {
      identity: `human-gate.reset.${targetId}.${target.generationId}`,
      type: "Kernel Submission Gate",
      subjectIdentity: authorization.identity,
      subjectContentIdentity: authorization.contentIdentity,
      subjectCommandIdentity: proposedCommand.identity,
      subjectCommandContentIdentity: proposedCommand.contentIdentity,
      nonEffect: "Authorize Submission does not reset the Sandbox; the Business Kernel must independently accept the unchanged command.",
    };
    const decision = {
      identity: `human-gate-decision.reset.${targetId}.${target.generationId}`,
      gateId: gate.identity,
      response: "Authorize Submission",
      subjectIdentity: authorization.identity,
      subjectContentIdentity: authorization.contentIdentity,
      subjectCommandIdentity: gate.subjectCommandIdentity,
      subjectCommandContentIdentity: gate.subjectCommandContentIdentity,
      responder: "participant.owner.fixture",
    };
    session.humanGates.push(gate);
    session.humanGateDecisions.push(decision);
    const command = makeCommand({ ...commandArguments, gateDecision: decision });
    commands.push(command);
    results.push(kernel.submit(command));
  }
  return {
    disposition: results.every(result => result.disposition === "Accepted") ? "Reset" : "Rejected",
    results,
    commands,
  };
}
