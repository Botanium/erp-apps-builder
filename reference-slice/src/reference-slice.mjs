import { deepClone } from "./canonical.mjs";
import { createBlueprint, createIntentBrief, makeCommand, RETAIL_FIXTURE } from "./fixtures.mjs";
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
      const gate = { identity: "human-gate.blueprint-approval.v2", type: "Kernel Submission Gate", subjectVersionId: session.blueprint.reference.versionId, subjectContentIdentity: session.blueprint.contentIdentity };
      const decision = { identity: "human-gate-decision.blueprint-approval.v2", gateId: gate.identity, response: "Authorize Submission", subjectVersionId: gate.subjectVersionId, subjectContentIdentity: gate.subjectContentIdentity, responder: "participant.owner.fixture" };
      session.humanGates.push(gate);
      session.humanGateDecisions.push(decision);
      session.lastResult = kernel.submit(makeCommand({ identity: "command.blueprint.approve.v2", action: "blueprint.approve", input: { reference: session.blueprint.reference, contentIdentity: session.blueprint.contentIdentity }, gateDecision: decision }));
    } else if (action.type === "provision.all") {
      const approved = kernel.observe().currentApprovedBlueprint;
      const results = ["retail", "cafe"].map(targetId => {
        const target = kernel.observe({ type: "target", targetId });
        return kernel.submit(makeCommand({
          identity: `command.provision.${targetId}.${target.generationId}`,
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
  const commands = [
    makeCommand({ ...common, identity: "command.retail.purchase.confirm.01", action: "purchase.confirm", role: "role.buyer", input: { expectedAppliedBlueprint: baseline, recordId: fixture.purchaseOrderId, supplierId: "party.supplier.retail", currency: fixture.currency, lines: [{ itemId: fixture.itemId, unit: fixture.unit, quantity: fixture.purchaseQuantity, unitCostMinor: fixture.unitCostMinor }] } }),
    makeCommand({ ...common, identity: "command.retail.receipt.accept.01", action: "receipt.accept", role: "role.receiver", input: { expectedAppliedBlueprint: baseline, recordId: fixture.receiptId, purchaseOrderId: fixture.purchaseOrderId, currency: fixture.currency, lines: [{ itemId: fixture.itemId, unit: fixture.unit, quantity: fixture.purchaseQuantity, unitCostMinor: fixture.unitCostMinor }] } }),
    makeCommand({ ...common, identity: "command.retail.order.accept.01", action: "order.accept", role: "role.retail-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.orderId, customerId: "party.customer.retail", currency: fixture.currency, lines: [{ itemId: fixture.itemId, unit: fixture.unit, quantity: fixture.saleQuantity, unitPriceMinor: fixture.unitPriceMinor }] } }),
    makeCommand({ ...common, identity: "command.retail.sale.fulfill.01", action: "sale.fulfill", role: "role.retail-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.saleId, orderId: fixture.orderId } }),
    makeCommand({ ...common, identity: "command.retail.payment.accept.01", action: "payment.accept", role: "role.retail-cashier", input: { expectedAppliedBlueprint: baseline, recordId: fixture.paymentId, saleId: fixture.saleId, amountMinor: fixture.paymentMinor, currency: fixture.currency, method: "cash", receiptReference: fixture.receiptReference } }),
  ];
  const results = commands.map(command => kernel.submit(command));
  return { disposition: results.every(result => result.disposition === "Accepted") ? "Completed" : "Rejected", results };
}
