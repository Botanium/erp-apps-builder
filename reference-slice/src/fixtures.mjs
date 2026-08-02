import { contentIdentity } from "./canonical.mjs";

export const TENANT_ID = "tenant.cedar-steam";
export const SENTINEL_TENANT_ID = "tenant.isolation-sentinel";
export const BLUEPRINT_ID = "blueprint.cedar-steam";

export const VERSION_SET = Object.freeze({
  kernel: "business-kernel@1.0.0",
  schema: "blueprint-configuration-schema@1.0.0",
  validator: "configuration-validator@1.0.0",
  compiler: "blueprint-compiler@1.0.0",
  policy: "financial-stock-audit@1.0.0",
  adapter: "local-state-adapter@1.0.0",
  acceptanceSuite: "reference-slice.acceptance-suite@1.0.0",
  fixture: "reference-slice.fixture.cedar-steam@1.0.0",
});

export const CAPABILITIES = Object.freeze([
  "party-registry", "catalog", "purchasing", "receiving", "inventory",
  "ordering", "sales", "payment", "cash", "ledger", "kitchen-operations",
].map(identity => ({ identity: `capability.${identity}`, version: "1.0.0", configurationSchemaVersion: "1.0.0", enabled: true })));

export const RETAIL_FIXTURE = Object.freeze({
  targetId: "retail",
  locationId: "location.retail",
  itemId: "catalog.widget",
  purchaseOrderId: "purchase-order.retail.01",
  receiptId: "supplier-receipt.retail.01",
  orderId: "order.retail.01",
  saleId: "sale.retail.01",
  paymentId: "payment.retail.01",
  receiptReference: "receipt.retail.01",
  purchaseQuantity: 10,
  unit: "each",
  unitCostMinor: 500,
  saleQuantity: 4,
  unitPriceMinor: 1200,
  paymentMinor: 4800,
  currency: "USD",
});

export const CAFE_FIXTURE = Object.freeze({
  targetId: "cafe",
  locationId: "location.cafe",
  purchaseOrderId: "purchase-order.cafe.01",
  receiptId: "supplier-receipt.cafe.01",
  orderId: "order.cafe.01",
  saleId: "sale.cafe.01",
  kitchenTicketId: "kitchen-ticket.cafe.01",
  paymentId: "payment.cafe.01",
  receiptReference: "receipt.cafe.01",
  menuItemId: "menu.cortado",
  modifierId: "modifier.extra-shot",
  priceMinor: 900,
  paymentMinor: 900,
  currency: "USD",
  purchaseLines: [
    { itemId: "ingredient.beans", unit: "g", quantity: 1000, unitCostMinor: 2 },
    { itemId: "ingredient.milk", unit: "ml", quantity: 2000, unitCostMinor: 1 },
  ],
  ingredientRequirements: [
    { itemId: "ingredient.beans", unit: "g", quantity: 27 },
    { itemId: "ingredient.milk", unit: "ml", quantity: 120 },
  ],
});

const roles = [
  ["role.owner", ["blueprint.approve", "sandbox.provision", "sandbox.reset"]],
  ["role.buyer", ["purchase.confirm"]],
  ["role.receiver", ["receipt.accept"]],
  ["role.retail-cashier", ["order.accept", "sale.fulfill", "payment.accept"]],
  ["role.cafe-cashier", ["order.accept", "payment.accept"]],
  ["role.kitchen-operator", ["kitchen.accept", "kitchen.prepare", "kitchen.ready", "kitchen.fulfill"]],
];

export function createIntentBrief(version, counterServiceState) {
  const source = version === 1 ? "source.owner-standing-direction" : "source.owner-confirmation.counter-service";
  return {
    identity: `intent-brief.cedar-steam.v${version}`,
    version,
    tenantId: TENANT_ID,
    factFamilies: [
      "purpose-and-scope", "safety-and-jurisdiction", "business-shape",
      "customer-and-fulfillment", "supply-stock-capacity", "people-and-governance",
      "money-and-accounting", "experience-and-integrations",
    ].map((family, index) => ({ identity: `intent.${version}.${index + 1}`, family, statement: family === "customer-and-fulfillment" ? "Counter service only; tables, reservations, and delivery excluded." : `Confirmed fictitious ${family} fixture.`, intentState: family === "customer-and-fulfillment" ? counterServiceState : "Confirmed", source: family === "customer-and-fulfillment" ? source : "source.owner-standing-direction" })),
    sensitiveData: [
      { category: "fictitious-operational", class: "Internal", rationale: "No real person or production data.", source: "source.owner-standing-direction" },
      { category: "fictitious-financial", class: "Confidential", rationale: "Invented detailed financial fixture values.", source: "source.owner-standing-direction" },
    ],
    acceptanceConditions: [{
      identity: "acceptance.required.reuse-proof",
      criticality: "Required",
      intentState: "Confirmed",
      source: "source.owner-standing-direction",
      outcome: "One Kernel demonstrates retail and cafe reuse.",
      whyItMatters: "Avoid rebuilding the common business platform for every client.",
      scope: { roles: ["role.owner", "role.buyer", "role.receiver", "role.retail-cashier", "role.cafe-cashier", "role.kitchen-operator"], locations: ["location.retail", "location.cafe"], records: ["Purchase Order", "Supplier Receipt", "Order", "Sale", "Payment", "Kitchen Ticket"], workflows: ["workflow.retail-golden", "workflow.cafe-kitchen"] },
      startingContext: "A clean fictitious Tenant with an owner-reviewed Intent Brief.",
      governedAction: "Approve one exact Blueprint, provision both targets, and execute their declared scenarios.",
      observableResult: "Both target-specific experiences reach their fixed business outcomes through one shared Kernel and reset cleanly.",
      passCondition: "Every Required Reference Slice condition is Satisfied and both targets finish clean and unapplied.",
      failureCondition: "Any unresolved authority, state, invariant, isolation, replay, or reset result fails closed.",
      evidenceRequired: "reference-slice.acceptance-report.cedar-steam.01",
      responsibleReviewer: "participant.owner.fixture",
      dependencies: { assumptions: counterServiceState === "Assumed" ? ["assumption.counter-service"] : [], sensitiveDataClasses: ["Internal", "Confidential"], constraints: ["sandbox-only", "fictitious-data-only"] },
    }],
    assumptions: counterServiceState === "Assumed" ? [{
      identity: "assumption.counter-service",
      intentState: "Assumed",
      proposition: "Cafe uses counter service only.",
      proposer: "system.reference-slice.fixture",
      source: "source.system-proposal",
      recordedTime: "2026-01-15T09:00:00.000Z",
      rationale: "Continue Draft review within v1 scope.",
      affectedFactFamilies: ["customer-and-fulfillment", "experience-and-integrations"],
      affectedDraftProposals: ["workflow.cafe-kitchen", "profile.cafe"],
      impact: "Cafe Workflow and exclusions remain provisional.",
      consequence: "The proposed cafe experience would be misleading if table service were required.",
      risk: "Wrong fulfillment experience.",
      resolutionCondition: "Explicit owner confirmation of counter service and exclusions.",
      expectedEvidence: "An attributable owner Intent Brief update.",
      responsibleReviewer: "participant.owner.fixture",
      reviewTrigger: "Before Approval Eligibility is recomputed.",
    }] : [],
  };
}

function blueprintCanonicalContent(blueprint) {
  const { envelope, ...sections } = blueprint.content;
  return {
    tenantId: envelope.tenantId,
    blueprintId: envelope.blueprintId,
    configurationSchema: envelope.configurationSchema,
    sourceIntentBriefs: envelope.sourceIntentBriefs,
    ...sections,
  };
}

export function recomputeBlueprintContentIdentity(blueprint) {
  return contentIdentity(blueprintCanonicalContent(blueprint));
}

export function createBlueprint(versionNumber, intentBrief, counterServiceState) {
  const versionId = `blueprint-version.cedar-steam.v${versionNumber}`;
  const parentVersionId = versionNumber === 1 ? null : `blueprint-version.cedar-steam.v${versionNumber - 1}`;
  const content = {
    envelope: {
      tenantId: TENANT_ID,
      blueprintId: BLUEPRINT_ID,
      versionId,
      versionNumber,
      parentVersionId,
      configurationSchema: VERSION_SET.schema,
      sourceIntentBriefs: [intentBrief.identity],
      provenance: "fictitious-reference-slice",
    },
    businessScope: {
      businessKinds: ["retail", "cafe"],
      countries: ["US-FICTITIOUS"],
      locations: ["location.retail", "location.cafe"],
      language: "en",
      timeZone: "UTC",
      currency: "USD",
      units: ["each", "g", "ml"],
      tier: "medium",
      exclusions: ["tables", "reservations", "delivery", "tips", "loyalty", "advanced-recipe-costing"],
    },
    capabilitySelections: CAPABILITIES.map(capability => capability.identity === "capability.catalog" ? {
      ...capability,
      settings: {
        items: [
          { identity: "catalog.widget", normalizedUnit: "each" },
          { identity: "ingredient.beans", normalizedUnit: "g" },
          { identity: "ingredient.milk", normalizedUnit: "ml" },
        ],
        menuItems: [{
          identity: "menu.cortado",
          basePriceMinor: 800,
          currency: "USD",
          ingredientRequirements: [
            { itemId: "ingredient.beans", quantity: 18, unit: "g" },
            { itemId: "ingredient.milk", quantity: 120, unit: "ml" },
          ],
        }],
        modifiers: [{
          identity: "modifier.extra-shot",
          priceMinor: 100,
          currency: "USD",
          ingredientRequirements: [{ itemId: "ingredient.beans", quantity: 9, unit: "g" }],
        }],
      },
    } : { ...capability }),
    recordDefinitions: ["Purchase Order", "Supplier Receipt", "Order", "Sale", "Payment", "Kitchen Ticket"].map(identity => ({ identity, version: "1.0.0" })),
    workflowDefinitions: [
      { identity: "workflow.retail-golden", version: "1.0.0", states: ["accepted", "fulfilled", "cancelled"] },
      { identity: "workflow.cafe-kitchen", version: "1.0.0", states: ["accepted", "preparing", "ready", "fulfilled"] },
    ],
    roleDefinitions: roles.map(([identity, actions]) => ({ identity, responsibilities: [identity], actions, locations: identity.includes("retail") ? ["location.retail"] : identity.includes("cafe") || identity.includes("kitchen") ? ["location.cafe"] : ["location.retail", "location.cafe"] })),
    evidenceRules: [{ identity: "evidence.attribution", kind: "responsible-source", reviewerRole: "role.owner" }],
    policyProfiles: { currency: "USD", moneyPrecision: "integer-minor-unit", inventoryCosting: "moving-weighted-average", ledger: "balanced-posting-sets", externalAi: "none" },
    experienceConfiguration: {
      profiles: [
        { identity: "profile.retail", targetId: "retail", locationId: "location.retail", visibleCapabilities: CAPABILITIES.filter(capability => capability.identity !== "capability.kitchen-operations").map(capability => capability.identity) },
        { identity: "profile.cafe", targetId: "cafe", locationId: "location.cafe", visibleCapabilities: CAPABILITIES.filter(capability => !["capability.purchasing", "capability.receiving"].includes(capability.identity)).map(capability => capability.identity) },
      ],
      ownerReviewModel: "guided-cockpit-with-evidence-workbook",
    },
    integrationConfiguration: [],
    intentTraceability: {
      sources: intentBrief.factFamilies.map(statement => ({ statementId: statement.identity, intentState: statement.intentState, source: statement.source })),
      assumptions: counterServiceState === "Assumed" ? ["assumption.counter-service"] : [],
      acceptanceConditions: ["acceptance.required.reuse-proof"],
    },
  };
  const blueprint = {
    reference: { tenantId: TENANT_ID, blueprintId: BLUEPRINT_ID, versionId },
    versionNumber,
    parentVersionId,
    content,
  };
  return { ...blueprint, contentIdentity: recomputeBlueprintContentIdentity(blueprint) };
}

export function makeCommand({ identity, action, input = {}, targetId = null, locationId = null, generationId = null, role = "role.owner", gateDecision = null, responsibleSource = "participant.owner.fixture" }) {
  const body = {
    identity,
    tenantId: TENANT_ID,
    targetId,
    locationId,
    generationId,
    action,
    version: "1.0.0",
    input,
    role,
    gateDecision,
    responsibleSource,
    effectiveTime: "2026-01-15T09:00:00.000Z",
    versionSet: VERSION_SET,
  };
  return { ...body, contentIdentity: contentIdentity(body) };
}
