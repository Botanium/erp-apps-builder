import { contentIdentity, deepClone } from "./canonical.mjs";
import { BLUEPRINT_ID, recomputeBlueprintContentIdentity, TENANT_ID, VERSION_SET } from "./fixtures.mjs";

export function createKernelState() {
  return {
    revision: 0,
    tenantId: TENANT_ID,
    blueprints: {},
    lifecycle: {},
    currentApprovedBlueprint: null,
    approvals: [],
    validationReports: [],
    effectiveBlueprint: null,
    compilationRecords: [],
    compatibilityVerdicts: [],
    provisioningAttempts: [],
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
  if (recomputeBlueprintContentIdentity(blueprint) !== blueprint.contentIdentity) diagnostics.push({ code: "CFG.ARTIFACT.CONTENT_IDENTITY_MISMATCH", path: "/contentIdentity", severity: "Blocking" });
  unknown.forEach(property => diagnostics.push({ code: "CFG.SCHEMA.UNKNOWN_PROPERTY", path: `/${property}`, severity: "Blocking" }));
  missing.forEach(property => diagnostics.push({ code: "CFG.SCHEMA.REQUIRED_MISSING", path: `/${property}`, severity: "Blocking" }));
  if (blueprint.content.capabilitySelections.some(capability => capability.version !== "1.0.0")) diagnostics.push({ code: "CFG.CAPABILITY.VERSION_UNSUPPORTED", path: "/capabilitySelections", severity: "Blocking" });
  const assumptions = blueprint.content.intentTraceability.assumptions ?? [];
  if (assumptions.length) diagnostics.push({ code: "CFG.TRACEABILITY.ASSUMPTION_ACTIVE", path: "/intentTraceability/assumptions", severity: "Blocking" });
  return {
    identity: `validation.${blueprint.reference.versionId}`,
    blueprintReference: blueprint.reference,
    contentIdentity: blueprint.contentIdentity,
    verdict: diagnostics.length > 0 ? "Invalid" : "Valid",
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
      const working = deepClone(candidate);
      let result;
      try {
        result = dispatch(working, command);
      } catch (error) {
        result = { commandIdentity: command.identity, action: command.action, disposition: "Rejected", code: error.code ?? "KERNEL_REJECTED", diagnostics: [{ code: error.code ?? "KERNEL_REJECTED", message: error.message }] };
      }
      if (result.disposition === "Accepted") Object.assign(candidate, working);
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
    if (query.type === "target-summary") return deriveTargetSummary(state.targets[query.targetId] ?? null);
    throw new Error(`Unsupported Kernel query ${query.type}.`);
  }
}

function dispatch(state, command) {
  if (command.tenantId !== state.tenantId) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Tenant scope mismatch.");
  if (command.action === "blueprint.create-draft") return createDraft(state, command);
  if (command.action === "blueprint.approve") return approve(state, command);
  if (command.action === "sandbox.provision") return provision(state, command);
  if (command.action === "sandbox.reset") return resetSandbox(state, command);
  if (command.action === "purchase.confirm") return confirmPurchase(state, command);
  if (command.action === "receipt.accept") return acceptReceipt(state, command);
  if (command.action === "order.accept") return acceptOrder(state, command);
  if (command.action === "sale.fulfill") return fulfillSale(state, command);
  if (command.action === "payment.accept") return acceptPayment(state, command);
  if (command.action === "kitchen.accept") return acceptKitchenTicket(state, command);
  if (command.action === "kitchen.prepare") return transitionKitchenTicket(state, command, "accepted", "preparing");
  if (command.action === "kitchen.ready") return transitionKitchenTicket(state, command, "preparing", "ready");
  if (command.action === "kitchen.fulfill") return fulfillKitchenTicket(state, command);
  reject("ORC.KERNEL.SCHEMA_REJECTED", `Unsupported governed action ${command.action}.`);
}

function resetSandbox(state, command) {
  const target = state.targets[command.targetId];
  if (!target || command.locationId !== target.locationId || command.generationId !== target.generationId) reject("ORC.KERNEL.BASELINE_REJECTED", "Reset target, Location, or generation baseline mismatch.");
  if (command.role !== "role.owner") reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Only the declared Owner Role may submit this sandbox Reset.");
  const expected = command.input.expectedAppliedBlueprint;
  if (!target.appliedBlueprint || !expected || expected.reference.versionId !== target.appliedBlueprint.reference.versionId || expected.contentIdentity !== target.appliedBlueprint.contentIdentity) reject("ORC.KERNEL.BASELINE_REJECTED", "Reset Applied Blueprint baseline mismatch.");
  const authorization = command.input.authorization;
  const requiredScope = ["records", "business-events", "stock-movements", "posting-sets", "payments", "balances", "fixtures"];
  if (!authorization || authorization.tenantId !== state.tenantId || authorization.targetId !== target.targetId || authorization.generationId !== target.generationId || authorization.appliedBlueprintContentIdentity !== target.appliedBlueprint.contentIdentity || authorization.finalState !== "clean-unapplied" || JSON.stringify(authorization.deletionScope) !== JSON.stringify(requiredScope) || authorization.expiresAt < command.effectiveTime) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Exact fresh Reset Authorization is required.");
  const decision = command.gateDecision;
  if (!decision || decision.response !== "Authorize Submission" || decision.subjectIdentity !== authorization.identity || decision.subjectContentIdentity !== authorization.contentIdentity) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Exact Reset Human Gate Decision is required.");

  const replacement = emptyTarget(target.targetId, target.locationId, target.generationNumber + 1);
  const resetRecord = {
    identity: `reset-record.${target.targetId}.${target.generationId}`,
    tenantId: state.tenantId,
    targetId: target.targetId,
    beforeGenerationId: target.generationId,
    afterGenerationId: replacement.generationId,
    beforeAppliedBlueprint: deepClone(target.appliedBlueprint),
    afterAppliedBlueprint: null,
    authorization: deepClone(authorization),
    humanGateDecision: deepClone(decision),
    commandIdentity: command.identity,
    deletionScope: requiredScope,
    state: "Reset",
    invariantResults: { cleanUnapplied: true, governancePreserved: true },
    effectiveTime: command.effectiveTime,
    recordedTime: command.effectiveTime,
  };
  state.targets[target.targetId] = replacement;
  state.resetRecords.push(resetRecord);
  return accepted(command, { resetRecord });
}

function acceptKitchenTicket(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, orderId } = command.input;
  validateNewRecord(target, recordId);
  requireRecord(target, orderId, "Order", "accepted");
  const record = recordFrom(command, "Kitchen Ticket", recordId, "accepted", { orderId, stateHistory: ["accepted"] });
  const event = eventFrom(command, "kitchen-ticket-accepted", [recordId]);
  target.records.push(record);
  target.events.push(event);
  return accepted(command, { record, businessEvent: event });
}

function transitionKitchenTicket(state, command, expectedState, resultingState) {
  const target = validateBusinessCommand(state, command);
  const ticket = requireRecord(target, command.input.recordId, "Kitchen Ticket", expectedState);
  ticket.state = resultingState;
  ticket.stateHistory.push(resultingState);
  const event = eventFrom(command, `kitchen-ticket-${resultingState}`, [ticket.identity]);
  target.events.push(event);
  return accepted(command, { record: deepClone(ticket), businessEvent: event });
}

function fulfillKitchenTicket(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, saleId } = command.input;
  validateNewRecord(target, saleId);
  const ticket = requireRecord(target, recordId, "Kitchen Ticket", "ready");
  const order = requireRecord(target, ticket.orderId, "Order", "accepted");
  const requirements = order.lines.flatMap(line => line.ingredientRequirements ?? []);
  if (requirements.length === 0) reject("ORC.KERNEL.INVARIANT_REJECTED", "Kitchen fulfillment requires frozen ingredient requirements.");
  const costs = requirements.map(requirement => {
    const position = deriveStock(target)[requirement.itemId];
    if (!position || position.unit !== requirement.unit) reject("ORC.KERNEL.INVARIANT_REJECTED", "Ingredient normalized unit mismatch.");
    if (position.quantity < requirement.quantity) reject("ORC.KERNEL.INVARIANT_REJECTED", "Kitchen fulfillment would over-consume stock.");
    const unitCostMinor = position.valueMinor / position.quantity;
    if (!Number.isInteger(unitCostMinor)) reject("ORC.KERNEL.INVARIANT_REJECTED", "Ingredient cost cannot be represented exactly.");
    return { ...requirement, costMinor: unitCostMinor * requirement.quantity };
  });
  const costMinor = costs.reduce((sum, line) => sum + line.costMinor, 0);
  const eventId = `business-event.${command.identity}`;
  const movements = costs.map((line, index) => movementFrom(command, eventId, `${saleId}.${index + 1}`, line.itemId, line.unit, -line.quantity, -line.costMinor, target.locationId, "boundary.consumption"));
  const commercial = postingSetFrom(command, eventId, `posting-set.${saleId}.commercial`, order.currency, [
    debit("Accounts Receivable", order.totalMinor),
    credit("Sales Revenue", order.totalMinor),
  ]);
  const inventory = postingSetFrom(command, eventId, `posting-set.${saleId}.inventory`, order.currency, [
    debit("Cost of Goods Sold", costMinor),
    credit("Inventory", costMinor),
  ]);
  ticket.state = "fulfilled";
  ticket.stateHistory.push("fulfilled");
  order.state = "fulfilled";
  const sale = recordFrom(command, "Sale", saleId, "fulfilled", { orderId: order.identity, kitchenTicketId: ticket.identity, currency: order.currency, totalMinor: order.totalMinor, costMinor });
  const event = eventFrom(command, "kitchen-ticket-fulfilled", [ticket.identity, order.identity, sale.identity, ...movements.map(item => item.identity), commercial.identity, inventory.identity]);
  target.records.push(sale);
  target.events.push(event);
  target.movements.push(...movements);
  target.postingSets.push(commercial, inventory);
  return accepted(command, { record: deepClone(ticket), sale, businessEvent: event, movements, postingSets: [commercial, inventory] });
}

function confirmPurchase(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, supplierId, lines, currency } = command.input;
  validateNewRecord(target, recordId);
  validateMoney(currency, lines);
  const record = recordFrom(command, "Purchase Order", recordId, "confirmed", { supplierId, lines, currency });
  const event = eventFrom(command, "purchase-confirmed", [recordId]);
  target.records.push(record);
  target.events.push(event);
  return accepted(command, { record, businessEvent: event });
}

function acceptReceipt(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, purchaseOrderId, lines, currency } = command.input;
  validateNewRecord(target, recordId);
  const purchaseOrder = requireRecord(target, purchaseOrderId, "Purchase Order", "confirmed");
  validateMoney(currency, lines);
  if (canonicalLines(lines) !== canonicalLines(purchaseOrder.lines)) reject("ORC.KERNEL.BASELINE_REJECTED", "Receipt lines do not match the confirmed Purchase Order.");
  const totalMinor = lines.reduce((sum, line) => sum + line.quantity * line.unitCostMinor, 0);
  const eventId = `business-event.${command.identity}`;
  const movements = lines.map((line, index) => movementFrom(command, eventId, `${recordId}.${index + 1}`, line.itemId, line.unit, line.quantity, line.quantity * line.unitCostMinor, "boundary.supplier", target.locationId));
  const postingSet = postingSetFrom(command, eventId, `posting-set.${recordId}`, currency, [
    debit("Inventory", totalMinor),
    credit("Accounts Payable", totalMinor),
  ]);
  const record = recordFrom(command, "Supplier Receipt", recordId, "accepted", { purchaseOrderId, lines, currency });
  const event = eventFrom(command, "supplier-receipt-accepted", [recordId, ...movements.map(item => item.identity), postingSet.identity]);
  target.records.push(record);
  target.events.push(event);
  target.movements.push(...movements);
  target.postingSets.push(postingSet);
  return accepted(command, { record, businessEvent: event, movements, postingSets: [postingSet] });
}

function acceptOrder(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, customerId, lines, currency } = command.input;
  validateNewRecord(target, recordId);
  validateMoney(currency, lines, "unitPriceMinor");
  const totalMinor = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceMinor, 0);
  const record = recordFrom(command, "Order", recordId, "accepted", { customerId, lines, currency, totalMinor });
  const event = eventFrom(command, "order-accepted", [recordId]);
  target.records.push(record);
  target.events.push(event);
  return accepted(command, { record, businessEvent: event });
}

function fulfillSale(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, orderId } = command.input;
  validateNewRecord(target, recordId);
  const order = requireRecord(target, orderId, "Order", "accepted");
  const costs = order.lines.map(line => {
    const position = deriveStock(target)[line.itemId];
    if (!position || position.unit !== line.unit) reject("ORC.KERNEL.INVARIANT_REJECTED", "Normalized stock unit mismatch.");
    if (position.quantity < line.quantity) reject("ORC.KERNEL.INVARIANT_REJECTED", "Sale would create negative stock.");
    const unitCostMinor = position.valueMinor / position.quantity;
    if (!Number.isInteger(unitCostMinor)) reject("ORC.KERNEL.INVARIANT_REJECTED", "Stock cost cannot be represented exactly.");
    return { ...line, costMinor: unitCostMinor * line.quantity };
  });
  const costMinor = costs.reduce((sum, line) => sum + line.costMinor, 0);
  const eventId = `business-event.${command.identity}`;
  const movements = costs.map((line, index) => movementFrom(command, eventId, `${recordId}.${index + 1}`, line.itemId, line.unit, -line.quantity, -line.costMinor, target.locationId, "boundary.customer"));
  const commercial = postingSetFrom(command, eventId, `posting-set.${recordId}.commercial`, order.currency, [
    debit("Accounts Receivable", order.totalMinor),
    credit("Sales Revenue", order.totalMinor),
  ]);
  const inventory = postingSetFrom(command, eventId, `posting-set.${recordId}.inventory`, order.currency, [
    debit("Cost of Goods Sold", costMinor),
    credit("Inventory", costMinor),
  ]);
  order.state = "fulfilled";
  const record = recordFrom(command, "Sale", recordId, "fulfilled", { orderId, currency: order.currency, totalMinor: order.totalMinor, costMinor });
  const event = eventFrom(command, "sale-fulfilled", [recordId, orderId, ...movements.map(item => item.identity), commercial.identity, inventory.identity]);
  target.records.push(record);
  target.events.push(event);
  target.movements.push(...movements);
  target.postingSets.push(commercial, inventory);
  return accepted(command, { record, businessEvent: event, movements, postingSets: [commercial, inventory] });
}

function acceptPayment(state, command) {
  const target = validateBusinessCommand(state, command);
  const { recordId, saleId, amountMinor, currency, method, receiptReference } = command.input;
  validateNewRecord(target, recordId);
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) reject("ORC.KERNEL.SCHEMA_REJECTED", "Payment amount must be a positive integer minor-unit value.");
  const sale = requireRecord(target, saleId, "Sale", "fulfilled");
  if (currency !== sale.currency) reject("ORC.KERNEL.INVARIANT_REJECTED", "Payment currency does not match the Sale.");
  const alreadyAllocated = target.payments.filter(payment => payment.saleId === saleId).reduce((sum, payment) => sum + payment.allocatedMinor, 0);
  const obligationBefore = sale.totalMinor - alreadyAllocated;
  const allocatedMinor = Math.min(amountMinor, Math.max(obligationBefore, 0));
  const residualMinor = obligationBefore - allocatedMinor;
  const unallocatedMinor = amountMinor - allocatedMinor;
  const entries = [debit("Cash", amountMinor), credit("Accounts Receivable", allocatedMinor)];
  if (unallocatedMinor > 0) entries.push(credit("Customer Credit", unallocatedMinor));
  const eventId = `business-event.${command.identity}`;
  const postingSet = postingSetFrom(command, eventId, `posting-set.${recordId}`, currency, entries);
  const payment = {
    ...effectMeta(command),
    identity: recordId,
    type: "Payment",
    state: "accepted",
    saleId,
    amountMinor,
    allocatedMinor,
    residualMinor,
    unallocatedMinor,
    currency,
    method,
    receiptReference,
    businessEventId: eventId,
  };
  const event = eventFrom(command, "payment-accepted", [payment.identity, postingSet.identity]);
  target.records.push(payment);
  target.payments.push(payment);
  target.events.push(event);
  target.postingSets.push(postingSet);
  return accepted(command, { payment, businessEvent: event, postingSets: [postingSet] });
}

function validateBusinessCommand(state, command) {
  const target = state.targets[command.targetId];
  if (!target || command.locationId !== target.locationId || command.generationId !== target.generationId) reject("ORC.KERNEL.BASELINE_REJECTED", "Target, Location, or generation baseline mismatch.");
  if (!target.appliedBlueprint) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Target has no Applied Blueprint.");
  const expected = command.input.expectedAppliedBlueprint;
  if (!expected || expected.reference.versionId !== target.appliedBlueprint.reference.versionId || expected.contentIdentity !== target.appliedBlueprint.contentIdentity) reject("ORC.KERNEL.BASELINE_REJECTED", "Applied Blueprint baseline mismatch.");
  const role = state.effectiveBlueprint.roleDefinitions.find(candidate => candidate.identity === command.role);
  if (!role || !role.actions.includes(command.action) || !role.locations.includes(target.locationId)) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Role is not authorized for this governed action and scope.");
  return target;
}

function validateNewRecord(target, identity) {
  if (!identity || target.records.some(record => record.identity === identity)) reject("ORC.KERNEL.BASELINE_REJECTED", "Record identity already exists or is absent.");
}

function requireRecord(target, identity, type, state) {
  const record = target.records.find(candidate => candidate.identity === identity);
  if (!record || record.type !== type || record.state !== state) reject("ORC.KERNEL.BASELINE_REJECTED", `Required ${type} in ${state} was not found.`);
  return record;
}

function validateMoney(currency, lines, priceField = "unitCostMinor") {
  if (currency !== "USD" || !Array.isArray(lines) || lines.length === 0) reject("ORC.KERNEL.SCHEMA_REJECTED", "A supported currency and at least one line are required.");
  for (const line of lines) {
    if (!line.itemId || !["each", "g", "ml"].includes(line.unit) || !Number.isInteger(line.quantity) || line.quantity <= 0 || !Number.isInteger(line[priceField]) || line[priceField] <= 0) reject("ORC.KERNEL.SCHEMA_REJECTED", "Line quantity, normalized unit, and minor-unit price must be valid.");
  }
}

function canonicalLines(lines) {
  return JSON.stringify(lines.map(({ itemId, quantity, unit, unitCostMinor }) => ({ itemId, quantity, unit, unitCostMinor })));
}

function effectMeta(command) {
  return {
    tenantId: command.tenantId,
    targetId: command.targetId,
    locationId: command.locationId,
    generationId: command.generationId,
    appliedBlueprintContentIdentity: command.input.expectedAppliedBlueprint.contentIdentity,
    responsibleSource: command.responsibleSource,
    effectiveTime: command.effectiveTime,
    recordedTime: command.effectiveTime,
    commandIdentity: command.identity,
  };
}

function recordFrom(command, type, identity, state, fields) {
  return { ...effectMeta(command), identity, type, state, ...deepClone(fields) };
}

function eventFrom(command, eventType, effectReferences) {
  return { ...effectMeta(command), identity: `business-event.${command.identity}`, type: "Business Event", eventType, causation: command.identity, effectReferences };
}

function movementFrom(command, eventId, suffix, itemId, unit, signedQuantity, signedValueMinor, source, destination) {
  return { ...effectMeta(command), identity: `stock-movement.${suffix}`, type: "Stock Movement", itemId, unit, signedQuantity, signedValueMinor, source, destination, businessEventId: eventId };
}

function debit(account, amountMinor) {
  return { account, side: "debit", amountMinor };
}

function credit(account, amountMinor) {
  return { account, side: "credit", amountMinor };
}

function postingSetFrom(command, eventId, identity, currency, entries) {
  const debits = entries.filter(entry => entry.side === "debit").reduce((sum, entry) => sum + entry.amountMinor, 0);
  const credits = entries.filter(entry => entry.side === "credit").reduce((sum, entry) => sum + entry.amountMinor, 0);
  if (currency !== "USD" || entries.some(entry => !Number.isInteger(entry.amountMinor) || entry.amountMinor <= 0) || debits !== credits) reject("ORC.KERNEL.INVARIANT_REJECTED", "Posting Set must contain positive balanced entries in one supported currency.");
  return { ...effectMeta(command), identity, type: "Posting Set", currency, businessEventId: eventId, entries };
}

function deriveStock(target) {
  const stock = {};
  for (const movement of target?.movements ?? []) {
    const current = stock[movement.itemId] ?? { quantity: 0, unit: movement.unit, valueMinor: 0 };
    if (current.unit !== movement.unit) return { ...stock, [movement.itemId]: { ...current, unitMismatch: true } };
    current.quantity += movement.signedQuantity;
    current.valueMinor += movement.signedValueMinor;
    stock[movement.itemId] = current;
  }
  return stock;
}

function deriveTargetSummary(target) {
  if (!target) return null;
  const stock = deriveStock(target);
  const accounts = {};
  let balancedPostingSets = true;
  for (const postingSet of target.postingSets) {
    const setDebits = postingSet.entries.filter(entry => entry.side === "debit").reduce((sum, entry) => sum + entry.amountMinor, 0);
    const setCredits = postingSet.entries.filter(entry => entry.side === "credit").reduce((sum, entry) => sum + entry.amountMinor, 0);
    if (setDebits !== setCredits || setDebits <= 0) balancedPostingSets = false;
    for (const entry of postingSet.entries) accounts[entry.account] = (accounts[entry.account] ?? 0) + (entry.side === "debit" ? entry.amountMinor : -entry.amountMinor);
  }
  for (const account of ["Inventory", "Cash", "Accounts Receivable", "Cost of Goods Sold", "Accounts Payable", "Sales Revenue", "Customer Credit"]) accounts[account] ??= 0;
  const stockValueMinor = Object.values(stock).reduce((sum, position) => sum + position.valueMinor, 0);
  const cashPaymentsMinor = target.payments.filter(payment => payment.method === "cash").reduce((sum, payment) => sum + payment.amountMinor, 0);
  const debitsMinor = Object.values(accounts).filter(balance => balance > 0).reduce((sum, balance) => sum + balance, 0);
  const creditsMinor = -Object.values(accounts).filter(balance => balance < 0).reduce((sum, balance) => sum + balance, 0);
  return {
    targetId: target.targetId,
    generationId: target.generationId,
    appliedBlueprint: deepClone(target.appliedBlueprint),
    records: deepClone(target.records),
    events: deepClone(target.events),
    movements: deepClone(target.movements),
    postingSets: deepClone(target.postingSets),
    payments: deepClone(target.payments),
    stock,
    accounts,
    trialBalance: { debitsMinor, creditsMinor, differenceMinor: debitsMinor - creditsMinor },
    invariants: {
      balancedPostingSets,
      stockMatchesMovements: Object.values(stock).every(position => !position.unitMismatch && position.quantity >= 0 && position.valueMinor >= 0),
      inventoryControlMatchesStock: accounts.Inventory === stockValueMinor,
      cashMatchesPayments: accounts.Cash === cashPaymentsMinor,
    },
  };
}

function createDraft(state, command) {
  const blueprint = command.input.blueprint;
  if (blueprint.reference.tenantId !== TENANT_ID || blueprint.reference.blueprintId !== BLUEPRINT_ID) reject("CFG.IDENTITY.TENANT_MISMATCH", "Blueprint identity scope mismatch.");
  const report = validateBlueprint(blueprint);
  state.validationReports.push(report);
  const nonReviewable = report.diagnostics.find(diagnostic => diagnostic.code !== "CFG.TRACEABILITY.ASSUMPTION_ACTIVE");
  if (nonReviewable) reject(nonReviewable.code, "Blueprint validation failed.");
  state.blueprints[blueprint.reference.versionId] = blueprint;
  state.lifecycle[blueprint.reference.versionId] = "Draft";
  return accepted(command, { blueprintReference: blueprint.reference, validationReport: report });
}

function approve(state, command) {
  const { reference, contentIdentity: blueprintContentIdentity, approvalBaseline } = command.input;
  const blueprint = state.blueprints[reference.versionId];
  if (!blueprint || state.lifecycle[reference.versionId] !== "Draft") reject("ORC.KERNEL.BASELINE_REJECTED", "Exact Draft does not exist.");
  if (blueprint.contentIdentity !== blueprintContentIdentity) reject("ORC.KERNEL.BASELINE_REJECTED", "Blueprint Content Identity mismatch.");
  const validation = state.validationReports.find(report => report.blueprintReference.versionId === reference.versionId);
  if (!validation?.approvalEligible) reject("ORC.KERNEL.POLICY_REJECTED", "Draft is not Approval Eligible.");
  const actualBaseline = state.currentApprovedBlueprint ? {
    reference: state.currentApprovedBlueprint.reference,
    contentIdentity: state.currentApprovedBlueprint.contentIdentity,
  } : null;
  if (JSON.stringify(approvalBaseline) !== JSON.stringify(actualBaseline)) reject("ORC.BASELINE.KERNEL_BASELINE_CHANGED", "Approval Baseline is stale.");
  const decision = command.gateDecision;
  if (!decision || decision.response !== "Authorize Submission" || decision.subjectContentIdentity !== blueprintContentIdentity || decision.subjectVersionId !== reference.versionId) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "Exact Human Gate Decision is required.");
  if (state.currentApprovedBlueprint) state.lifecycle[state.currentApprovedBlueprint.reference.versionId] = "Superseded";
  state.lifecycle[reference.versionId] = "Approved";
  const approval = { identity: "blueprint-approval.cedar-steam.v2", reference, contentIdentity: blueprintContentIdentity, humanGateDecisionId: decision.identity, effectiveTime: command.effectiveTime };
  state.currentApprovedBlueprint = approval;
  state.approvals.push(approval);
  return accepted(command, { approval });
}

function provision(state, command) {
  const currentApproved = state.currentApprovedBlueprint;
  if (!currentApproved) reject("ORC.KERNEL.AUTHORIZATION_REJECTED", "No current Approved Blueprint.");
  const target = state.targets[command.targetId];
  if (!target) reject("ORC.KERNEL.BASELINE_REJECTED", "Target does not exist.");
  if (command.locationId !== target.locationId || command.generationId !== target.generationId) reject("ORC.KERNEL.BASELINE_REJECTED", "Target baseline mismatch.");
  if (target.appliedBlueprint) reject("ORC.KERNEL.BASELINE_REJECTED", "Initial target is not clean.");
  const requested = command.input.blueprint;
  if (!requested || requested.reference.versionId !== currentApproved.reference.versionId || requested.contentIdentity !== currentApproved.contentIdentity) {
    reject("ORC.KERNEL.BASELINE_REJECTED", "Provisioning request does not bind the current Approved Blueprint.");
  }

  const effectiveBlueprint = compileEffectiveBlueprint(state, currentApproved);
  const profile = effectiveBlueprint.experienceProfiles.find(candidate => candidate.targetId === target.targetId);
  if (!profile) reject("CFG.EXPERIENCE.REFERENCE_UNRESOLVED", "No declared target experience profile.");

  const verdict = {
    identity: `compatibility.${target.targetId}.${target.generationId}`,
    targetId: target.targetId,
    generationId: target.generationId,
    blueprintReference: currentApproved.reference,
    blueprintContentIdentity: currentApproved.contentIdentity,
    verdict: "Initial Provision Compatible",
    versionSet: VERSION_SET,
  };
  state.compatibilityVerdicts.push(verdict);

  const attempt = {
    identity: `provisioning-attempt.${target.targetId}.${target.generationId}`,
    targetId: target.targetId,
    generationId: target.generationId,
    state: "Applied",
    blueprintReference: currentApproved.reference,
    blueprintContentIdentity: currentApproved.contentIdentity,
    effectiveBlueprintContentIdentity: effectiveBlueprint.contentIdentity,
    compatibilityVerdictId: verdict.identity,
    commandIdentity: command.identity,
    activationTime: command.effectiveTime,
  };
  target.activeConfiguration = {
    targetId: target.targetId,
    locationId: target.locationId,
    effectiveBlueprintContentIdentity: effectiveBlueprint.contentIdentity,
    capabilities: effectiveBlueprint.capabilities,
    visibleCapabilities: profile.visibleCapabilities,
  };
  target.appliedBlueprint = deepClone(currentApproved);
  state.provisioningAttempts.push(attempt);
  return accepted(command, { targetId: command.targetId, attempt, appliedBlueprint: target.appliedBlueprint });
}

function compileEffectiveBlueprint(state, approval) {
  if (state.effectiveBlueprint) {
    if (state.effectiveBlueprint.sourceBlueprintContentIdentity !== approval.contentIdentity) {
      reject("ORC.KERNEL.VERSION_REJECTED", "A different Effective Blueprint is already bound to this slice.");
    }
    return state.effectiveBlueprint;
  }

  const source = state.blueprints[approval.reference.versionId];
  const body = {
    identity: `effective-blueprint.${approval.reference.versionId}`,
    sourceBlueprintReference: approval.reference,
    sourceBlueprintContentIdentity: approval.contentIdentity,
    versionSet: VERSION_SET,
    capabilities: source.content.capabilitySelections,
    recordDefinitions: source.content.recordDefinitions,
    workflowDefinitions: source.content.workflowDefinitions,
    roleDefinitions: source.content.roleDefinitions,
    evidenceRules: source.content.evidenceRules,
    policyProfiles: source.content.policyProfiles,
    experienceProfiles: source.content.experienceConfiguration.profiles,
    intentTraceability: source.content.intentTraceability,
  };
  const effectiveBlueprint = { ...body, contentIdentity: contentIdentity(body) };
  state.effectiveBlueprint = effectiveBlueprint;
  state.compilationRecords.push({
    identity: `compilation.${approval.reference.versionId}`,
    sourceBlueprintReference: approval.reference,
    sourceBlueprintContentIdentity: approval.contentIdentity,
    effectiveBlueprintContentIdentity: effectiveBlueprint.contentIdentity,
    versionSet: VERSION_SET,
  });
  return effectiveBlueprint;
}

function accepted(command, output) {
  return { commandIdentity: command.identity, action: command.action, disposition: "Accepted", output, versionSet: VERSION_SET };
}

function reject(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
