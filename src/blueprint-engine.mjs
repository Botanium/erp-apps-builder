import { canonicalJson, sha256ContentIdentity } from "./canonical-json.mjs";
import { MACHINE_IDENTITY, VERSION_SET } from "./contracts.mjs";

const clone = (value) => structuredClone(value);
const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (value, keys) =>
  isObject(value) &&
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));
const isContentIdentity = (value) =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
const CONFIGURATION_SCHEMA_IDENTITY = "schema.business-blueprint";
const CONFIGURATION_SCHEMA_VERSION = "1.0.0";
const CANONICALIZATION_RULES_IDENTITY = "canonicalization.blueprint-content";
const CANONICALIZATION_RULES_VERSION = "1.0.0";
const VALIDATOR_POLICY_IDENTITY = "validator-policy.configuration";
const VALIDATOR_POLICY_VERSION = "1.0.0";
const VALIDATION_ENGINE_IDENTITY = "validator.configuration";
const VALIDATION_ENGINE_VERSION = "1.0.0";
const BUSINESS_KERNEL_SOURCE = VERSION_SET.find(
  ({ machineIdentity }) => machineIdentity === MACHINE_IDENTITY.businessKernel
);
const V1_CAPABILITY_SELECTIONS = Object.freeze(
  [
    {
      capabilityIdentity: "capability.cash",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.cash",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.catalog",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.catalog",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.inventory",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.inventory",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.kitchen-operations",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.kitchen-operations",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe"],
    },
    {
      capabilityIdentity: "capability.ledger",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.ledger",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.ordering",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.ordering",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.party-registry",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.party-registry",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.payment",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.payment",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.purchasing",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.purchasing",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.receiving",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.receiving",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.retail"],
    },
    {
      capabilityIdentity: "capability.sales",
      capabilityVersion: "1.0.0",
      configurationSchemaIdentity: "schema.capability.sales",
      configurationSchemaVersion: "1.0.0",
      configurationPointIdentity: "configuration-point.capability.selection",
      enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    },
  ]
    .sort((left, right) => {
      if (left.capabilityIdentity < right.capabilityIdentity) return -1;
      if (left.capabilityIdentity > right.capabilityIdentity) return 1;
      return 0;
    })
    .map((selection) =>
      Object.freeze({
        ...selection,
        enabledTargetIdentities: Object.freeze([
          ...selection.enabledTargetIdentities,
        ]),
      })
    )
);
const REFERENCE_SLICE_EXTERNAL_AI_EXCLUSION =
  "The local proof is sandbox-only and external AI is excluded.";
const NORMALIZED_BLUEPRINT_PROPERTIES = [
  "blueprintIdentity",
  "businessScope",
  "capabilitySelections",
  "configurationSchemaIdentity",
  "configurationSchemaVersion",
  "evidenceRules",
  "experienceConfiguration",
  "integrationConfiguration",
  "intentTraceability",
  "policyProfiles",
  "recordDefinitions",
  "roleDefinitions",
  "sourceIntentBriefVersionReferences",
  "tenantIdentity",
  "workflowDefinitions",
];
const BLUEPRINT_SECTION_IDENTITIES = [
  "businessScope",
  "capabilitySelections",
  "envelope",
  "evidenceRules",
  "experienceConfiguration",
  "integrationConfiguration",
  "intentTraceability",
  "policyProfiles",
  "recordDefinitions",
  "roleDefinitions",
  "workflowDefinitions",
];

const sourceIntentBriefVersion = (state, command) =>
  state.intentBriefVersions.find(
    (candidate) =>
      candidate.ownerInterviewIdentity ===
        command.input.ownerInterviewIdentity &&
      candidate.reviewProjection.intentBrief.versionIdentity ===
        command.input.intentBriefVersionIdentity
  )?.reviewProjection;

const sourceBlueprintVersion = (state, command) => {
  const sourceBlueprint = command.input.sourceBlueprint;
  if (sourceBlueprint === null) return null;
  return state.blueprintVersions.find(
    (candidate) =>
      canonicalJson(candidate.draftBlueprint.blueprintReference) ===
        canonicalJson(sourceBlueprint.blueprintReference) &&
      candidate.draftBlueprint.blueprintContentIdentity ===
        sourceBlueprint.blueprintContentIdentity
  );
};

const acceptedExclusions = (intentBrief) =>
  (intentBrief.acceptanceConditions ?? [])
    .flatMap((condition) =>
      (condition.exclusions ?? []).map((value) => ({
        value,
        sourceAcceptanceConditionIdentity: condition.identity,
        intentState: condition.intentState,
      }))
    )
    .sort((left, right) =>
      `${left.value}\u0000${left.sourceAcceptanceConditionIdentity}`.localeCompare(
        `${right.value}\u0000${right.sourceAcceptanceConditionIdentity}`
      )
    );

const createV1BusinessScope = ({ state, intentBrief, tenantIdentity }) => ({
  configurationPointIdentity: "configuration-point.business-scope",
  tenantIdentity,
  businessKindIdentities: ["business-kind.cafe", "business-kind.retail"],
  operatingCountryCodes: ["IQ"],
  locations: state.scope.sandboxes
    .map((sandbox) => ({
      locationIdentity: sandbox.locationIdentity,
      targetIdentity: sandbox.sandboxIdentity,
    }))
    .sort((left, right) =>
      left.locationIdentity.localeCompare(right.locationIdentity)
    ),
  languageCodes: ["ar", "en"],
  timeZoneIdentities: ["Asia/Baghdad"],
  currencyCodes: ["IQD"],
  normalizedUnits: ["each", "g", "ml"],
  tierIdentity: "business-tier.small-medium",
  fiscalProfileIdentity: "policy-profile.fiscal.not-applicable",
  explicitExclusions: acceptedExclusions(intentBrief),
});

const V1_RECORD_DEFINITIONS = [
  {
    recordIdentity: "record.catalog-item",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.catalog",
    recordSchemaIdentity: "schema.record.catalog-item",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: null,
    sensitiveDataClass: "Internal",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.kitchen-ticket",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.kitchen-operations",
    recordSchemaIdentity: "schema.record.kitchen-ticket",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe"],
    workflowIdentity: "workflow.kitchen-ticket",
    sensitiveDataClass: "Internal",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.ledger-entry",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.ledger",
    recordSchemaIdentity: "schema.record.ledger-entry",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: null,
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.menu-item",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.catalog",
    recordSchemaIdentity: "schema.record.menu-item",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe"],
    workflowIdentity: null,
    sensitiveDataClass: "Internal",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.modifier",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.catalog",
    recordSchemaIdentity: "schema.record.modifier",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe"],
    workflowIdentity: null,
    sensitiveDataClass: "Internal",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.order",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.ordering",
    recordSchemaIdentity: "schema.record.order",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: "workflow.fulfillment",
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.party",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.party-registry",
    recordSchemaIdentity: "schema.record.party",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: null,
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.payment",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.payment",
    recordSchemaIdentity: "schema.record.payment",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: "workflow.fulfillment",
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.posting-set",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.ledger",
    recordSchemaIdentity: "schema.record.posting-set",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: null,
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.purchase-order",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.purchasing",
    recordSchemaIdentity: "schema.record.purchase-order",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.retail"],
    workflowIdentity: "workflow.purchase-order",
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.sale",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.sales",
    recordSchemaIdentity: "schema.record.sale",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: "workflow.fulfillment",
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.stock-movement",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.inventory",
    recordSchemaIdentity: "schema.record.stock-movement",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    workflowIdentity: null,
    sensitiveDataClass: "Internal",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    recordIdentity: "record.supplier-receipt",
    configurationPointIdentity: "configuration-point.record.selection",
    declaringCapabilityIdentity: "capability.receiving",
    recordSchemaIdentity: "schema.record.supplier-receipt",
    recordSchemaVersion: "1.0.0",
    enabledTargetIdentities: ["sandbox.retail"],
    workflowIdentity: "workflow.supplier-receipt",
    sensitiveDataClass: "Confidential",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
];

const V1_WORKFLOW_DEFINITIONS = [
  {
    workflowIdentity: "workflow.fulfillment",
    workflowVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.workflow.selection",
    governedRecordIdentities: ["record.order", "record.payment", "record.sale"],
    enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
    stateIdentities: ["accepted", "cancelled", "fulfilled"],
    initialStateIdentity: "accepted",
    terminalStateIdentities: ["cancelled", "fulfilled"],
    initialGovernedActionIdentity: "governed-action.order.accept",
    transitions: [
      {
        transitionIdentity: "transition.fulfillment.cancel",
        fromStateIdentities: ["accepted"],
        toStateIdentity: "cancelled",
        governedActionIdentity: "governed-action.order.cancel",
      },
      {
        transitionIdentity: "transition.fulfillment.fulfill",
        fromStateIdentities: ["accepted"],
        toStateIdentity: "fulfilled",
        governedActionIdentity: "governed-action.sale.fulfill",
      },
    ],
    roleIdentities: ["role.cafe-cashier", "role.retail-cashier"],
    evidenceRuleIdentities: ["evidence-rule.payment-receipt"],
  },
  {
    workflowIdentity: "workflow.kitchen-ticket",
    workflowVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.workflow.selection",
    governedRecordIdentities: ["record.kitchen-ticket"],
    enabledTargetIdentities: ["sandbox.cafe"],
    stateIdentities: [
      "accepted",
      "cancelled",
      "fulfilled",
      "preparing",
      "ready",
    ],
    initialStateIdentity: "accepted",
    terminalStateIdentities: ["cancelled", "fulfilled"],
    initialGovernedActionIdentity: null,
    transitions: [
      {
        transitionIdentity: "transition.kitchen-ticket.cancel",
        fromStateIdentities: ["accepted", "preparing", "ready"],
        toStateIdentity: "cancelled",
        governedActionIdentity: "governed-action.kitchen-ticket.cancel",
      },
      {
        transitionIdentity: "transition.kitchen-ticket.fulfill",
        fromStateIdentities: ["ready"],
        toStateIdentity: "fulfilled",
        governedActionIdentity: "governed-action.kitchen-ticket.fulfill",
      },
      {
        transitionIdentity: "transition.kitchen-ticket.mark-ready",
        fromStateIdentities: ["preparing"],
        toStateIdentity: "ready",
        governedActionIdentity: "governed-action.kitchen-ticket.mark-ready",
      },
      {
        transitionIdentity: "transition.kitchen-ticket.start-preparing",
        fromStateIdentities: ["accepted"],
        toStateIdentity: "preparing",
        governedActionIdentity:
          "governed-action.kitchen-ticket.start-preparing",
      },
    ],
    roleIdentities: ["role.kitchen-operator"],
    evidenceRuleIdentities: [],
  },
  {
    workflowIdentity: "workflow.purchase-order",
    workflowVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.workflow.selection",
    governedRecordIdentities: ["record.purchase-order"],
    enabledTargetIdentities: ["sandbox.retail"],
    stateIdentities: ["cancelled", "completed", "confirmed", "draft"],
    initialStateIdentity: "draft",
    terminalStateIdentities: ["cancelled", "completed"],
    initialGovernedActionIdentity: null,
    transitions: [
      {
        transitionIdentity: "transition.purchase-order.cancel",
        fromStateIdentities: ["confirmed", "draft"],
        toStateIdentity: "cancelled",
        governedActionIdentity: "governed-action.purchase-order.cancel",
      },
      {
        transitionIdentity: "transition.purchase-order.complete",
        fromStateIdentities: ["confirmed"],
        toStateIdentity: "completed",
        governedActionIdentity: "governed-action.supplier-receipt.accept",
      },
      {
        transitionIdentity: "transition.purchase-order.confirm",
        fromStateIdentities: ["draft"],
        toStateIdentity: "confirmed",
        governedActionIdentity: "governed-action.purchase-order.confirm",
      },
    ],
    roleIdentities: ["role.buyer", "role.receiver"],
    evidenceRuleIdentities: [],
  },
  {
    workflowIdentity: "workflow.supplier-receipt",
    workflowVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.workflow.selection",
    governedRecordIdentities: ["record.supplier-receipt"],
    enabledTargetIdentities: ["sandbox.retail"],
    stateIdentities: ["accepted", "pending"],
    initialStateIdentity: "pending",
    terminalStateIdentities: ["accepted"],
    initialGovernedActionIdentity: null,
    transitions: [
      {
        transitionIdentity: "transition.supplier-receipt.accept",
        fromStateIdentities: ["pending"],
        toStateIdentity: "accepted",
        governedActionIdentity: "governed-action.supplier-receipt.accept",
      },
    ],
    roleIdentities: ["role.receiver"],
    evidenceRuleIdentities: ["evidence-rule.supplier-receipt-acceptance"],
  },
];

const V1_ROLE_DEFINITIONS = [
  {
    roleIdentity: "role.buyer",
    configurationPointIdentity: "configuration-point.role.definition",
    locationIdentities: ["location.retail"],
    governedActionIdentities: [
      "governed-action.purchase-order.cancel",
      "governed-action.purchase-order.confirm",
    ],
    workflowIdentities: ["workflow.purchase-order"],
    evidenceDutyIdentities: [],
    separationOfDutyConstraintIdentities: ["separation-of-duty.buyer-receiver"],
  },
  {
    roleIdentity: "role.cafe-cashier",
    configurationPointIdentity: "configuration-point.role.definition",
    locationIdentities: ["location.cafe"],
    governedActionIdentities: [
      "governed-action.order.accept",
      "governed-action.order.cancel",
      "governed-action.payment.accept",
    ],
    workflowIdentities: ["workflow.fulfillment"],
    evidenceDutyIdentities: ["evidence-rule.payment-receipt"],
    separationOfDutyConstraintIdentities: [],
  },
  {
    roleIdentity: "role.kitchen-operator",
    configurationPointIdentity: "configuration-point.role.definition",
    locationIdentities: ["location.cafe"],
    governedActionIdentities: [
      "governed-action.kitchen-ticket.cancel",
      "governed-action.kitchen-ticket.fulfill",
      "governed-action.kitchen-ticket.mark-ready",
      "governed-action.kitchen-ticket.start-preparing",
    ],
    workflowIdentities: ["workflow.kitchen-ticket"],
    evidenceDutyIdentities: [],
    separationOfDutyConstraintIdentities: [],
  },
  {
    roleIdentity: "role.owner",
    configurationPointIdentity: "configuration-point.role.definition",
    locationIdentities: ["location.cafe", "location.retail"],
    governedActionIdentities: [],
    workflowIdentities: [],
    evidenceDutyIdentities: [],
    separationOfDutyConstraintIdentities: [],
  },
  {
    roleIdentity: "role.receiver",
    configurationPointIdentity: "configuration-point.role.definition",
    locationIdentities: ["location.retail"],
    governedActionIdentities: ["governed-action.supplier-receipt.accept"],
    workflowIdentities: [
      "workflow.purchase-order",
      "workflow.supplier-receipt",
    ],
    evidenceDutyIdentities: ["evidence-rule.supplier-receipt-acceptance"],
    separationOfDutyConstraintIdentities: ["separation-of-duty.buyer-receiver"],
  },
  {
    roleIdentity: "role.retail-cashier",
    configurationPointIdentity: "configuration-point.role.definition",
    locationIdentities: ["location.retail"],
    governedActionIdentities: [
      "governed-action.order.accept",
      "governed-action.order.cancel",
      "governed-action.payment.accept",
      "governed-action.sale.fulfill",
    ],
    workflowIdentities: ["workflow.fulfillment"],
    evidenceDutyIdentities: ["evidence-rule.payment-receipt"],
    separationOfDutyConstraintIdentities: [],
  },
];

const V1_EVIDENCE_RULES = [
  {
    evidenceRuleIdentity: "evidence-rule.payment-receipt",
    configurationPointIdentity: "configuration-point.evidence.requirement",
    recordIdentity: "record.payment",
    workflowIdentity: "workflow.fulfillment",
    governedActionIdentity: "governed-action.payment.accept",
    reviewerRoleIdentities: ["role.cafe-cashier", "role.retail-cashier"],
    timing: "at-transition",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
  {
    evidenceRuleIdentity: "evidence-rule.supplier-receipt-acceptance",
    configurationPointIdentity: "configuration-point.evidence.requirement",
    recordIdentity: "record.supplier-receipt",
    workflowIdentity: "workflow.supplier-receipt",
    governedActionIdentity: "governed-action.supplier-receipt.accept",
    reviewerRoleIdentities: ["role.receiver"],
    timing: "at-transition",
    retentionProfileIdentity: "retention-profile.sandbox-run",
  },
];

const V1_POLICY_PROFILES = [
  {
    policyProfileIdentity: "kernel.policy.financial-stock-audit",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: {
      balancedLedgerEntriesRequired: true,
      immutableStockMovementsRequired: true,
    },
  },
  {
    policyProfileIdentity: "policy-profile.cash.accepted-payment-derived",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: { positionBasis: "accepted-payments" },
  },
  {
    policyProfileIdentity: "policy-profile.data-handling.sandbox-only",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: {
      dataKind: "fictitious",
      retentionProfileIdentity: "retention-profile.sandbox-run",
    },
  },
  {
    policyProfileIdentity: "policy-profile.external-ai.excluded",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: { exposure: "Excluded" },
  },
  {
    policyProfileIdentity: "policy-profile.fiscal.not-applicable",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: { disposition: "Not Applicable" },
  },
  {
    policyProfileIdentity: "policy-profile.inventory.moving-weighted-average",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: {
      costingMethod: "moving-weighted-average",
      normalizedQuantityPrecision: 3,
    },
  },
  {
    policyProfileIdentity: "policy-profile.payment.cash-allocation",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: { allocationMode: "explicit-obligation" },
  },
  {
    policyProfileIdentity: "policy-profile.purchasing.receipt-recognition",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: { recognitionPoint: "supplier-receipt-accepted" },
  },
  {
    policyProfileIdentity: "policy-profile.sales.fulfillment-recognition",
    policyProfileVersion: "1.0.0",
    configurationPointIdentity: "configuration-point.policy-profile.selection",
    parameters: { recognitionPoint: "sale-fulfilled" },
  },
];

const V1_EXPERIENCE_CONFIGURATION = {
  configurationPointIdentity: "configuration-point.experience.target-profile",
  targetProfiles: [
    {
      targetIdentity: "sandbox.cafe",
      enabledCapabilityIdentities: [
        "capability.cash",
        "capability.catalog",
        "capability.inventory",
        "capability.kitchen-operations",
        "capability.ledger",
        "capability.ordering",
        "capability.party-registry",
        "capability.payment",
        "capability.sales",
      ],
      roleNavigation: [
        {
          roleIdentity: "role.cafe-cashier",
          recordIdentities: ["record.order", "record.payment"],
          workflowIdentities: ["workflow.fulfillment"],
        },
        {
          roleIdentity: "role.kitchen-operator",
          recordIdentities: [
            "record.kitchen-ticket",
            "record.menu-item",
            "record.modifier",
            "record.stock-movement",
          ],
          workflowIdentities: ["workflow.kitchen-ticket"],
        },
        {
          roleIdentity: "role.owner",
          recordIdentities: [
            "record.catalog-item",
            "record.kitchen-ticket",
            "record.ledger-entry",
            "record.menu-item",
            "record.modifier",
            "record.order",
            "record.party",
            "record.payment",
            "record.posting-set",
            "record.sale",
            "record.stock-movement",
          ],
          workflowIdentities: [
            "workflow.fulfillment",
            "workflow.kitchen-ticket",
          ],
        },
      ],
      languageCodes: ["ar", "en"],
      deviceUse: "local-browser",
      offlineBehavior: "Unsupported",
      reportIdentities: [
        "report.cash-position",
        "report.stock-position",
        "report.trial-balance",
      ],
    },
    {
      targetIdentity: "sandbox.retail",
      enabledCapabilityIdentities: [
        "capability.cash",
        "capability.catalog",
        "capability.inventory",
        "capability.ledger",
        "capability.ordering",
        "capability.party-registry",
        "capability.payment",
        "capability.purchasing",
        "capability.receiving",
        "capability.sales",
      ],
      roleNavigation: [
        {
          roleIdentity: "role.buyer",
          recordIdentities: ["record.purchase-order"],
          workflowIdentities: ["workflow.purchase-order"],
        },
        {
          roleIdentity: "role.owner",
          recordIdentities: [
            "record.catalog-item",
            "record.ledger-entry",
            "record.order",
            "record.party",
            "record.payment",
            "record.posting-set",
            "record.purchase-order",
            "record.sale",
            "record.stock-movement",
            "record.supplier-receipt",
          ],
          workflowIdentities: [
            "workflow.fulfillment",
            "workflow.purchase-order",
            "workflow.supplier-receipt",
          ],
        },
        {
          roleIdentity: "role.receiver",
          recordIdentities: [
            "record.stock-movement",
            "record.supplier-receipt",
          ],
          workflowIdentities: ["workflow.supplier-receipt"],
        },
        {
          roleIdentity: "role.retail-cashier",
          recordIdentities: ["record.order", "record.payment", "record.sale"],
          workflowIdentities: ["workflow.fulfillment"],
        },
      ],
      languageCodes: ["ar", "en"],
      deviceUse: "local-browser",
      offlineBehavior: "Unsupported",
      reportIdentities: [
        "report.cash-position",
        "report.stock-position",
        "report.trial-balance",
      ],
    },
  ],
};

const V1_INTEGRATION_CONFIGURATION = {
  configurationPointIdentity: "configuration-point.integration.disposition",
  disposition: "Not Applicable",
  adapterBindings: [],
};

const V1_CONFIGURED_ITEM_TRACE_SOURCE_FACT_FAMILIES = Object.freeze({
  "configuration-point.business-scope": [
    "business-shape",
    "experience-and-integrations",
    "money-and-accounting",
    "purpose-and-scope",
    "safety-and-jurisdiction",
  ],
  "capability.cash": ["money-and-accounting"],
  "capability.catalog": [
    "business-shape",
    "customer-and-fulfillment-journey",
    "supply-stock-and-capacity",
  ],
  "capability.inventory": ["supply-stock-and-capacity"],
  "capability.kitchen-operations": [
    "customer-and-fulfillment-journey",
    "supply-stock-and-capacity",
  ],
  "capability.ledger": ["money-and-accounting"],
  "capability.ordering": ["customer-and-fulfillment-journey"],
  "capability.party-registry": [
    "customer-and-fulfillment-journey",
    "supply-stock-and-capacity",
  ],
  "capability.payment": [
    "customer-and-fulfillment-journey",
    "money-and-accounting",
  ],
  "capability.purchasing": ["supply-stock-and-capacity"],
  "capability.receiving": ["supply-stock-and-capacity"],
  "capability.sales": ["customer-and-fulfillment-journey"],
  "record.catalog-item": ["business-shape", "supply-stock-and-capacity"],
  "record.kitchen-ticket": ["customer-and-fulfillment-journey"],
  "record.ledger-entry": ["money-and-accounting"],
  "record.menu-item": [
    "customer-and-fulfillment-journey",
    "supply-stock-and-capacity",
  ],
  "record.modifier": ["customer-and-fulfillment-journey"],
  "record.order": ["customer-and-fulfillment-journey"],
  "record.party": [
    "customer-and-fulfillment-journey",
    "supply-stock-and-capacity",
  ],
  "record.payment": [
    "customer-and-fulfillment-journey",
    "money-and-accounting",
  ],
  "record.posting-set": ["money-and-accounting"],
  "record.purchase-order": ["supply-stock-and-capacity"],
  "record.sale": ["customer-and-fulfillment-journey"],
  "record.stock-movement": ["supply-stock-and-capacity"],
  "record.supplier-receipt": ["supply-stock-and-capacity"],
  "workflow.fulfillment": ["customer-and-fulfillment-journey"],
  "workflow.kitchen-ticket": [
    "customer-and-fulfillment-journey",
    "supply-stock-and-capacity",
  ],
  "workflow.purchase-order": ["supply-stock-and-capacity"],
  "workflow.supplier-receipt": ["supply-stock-and-capacity"],
  "role.buyer": ["people-and-governance", "supply-stock-and-capacity"],
  "role.cafe-cashier": [
    "customer-and-fulfillment-journey",
    "money-and-accounting",
    "people-and-governance",
  ],
  "role.kitchen-operator": [
    "customer-and-fulfillment-journey",
    "people-and-governance",
    "supply-stock-and-capacity",
  ],
  "role.owner": ["people-and-governance", "purpose-and-scope"],
  "role.receiver": ["people-and-governance", "supply-stock-and-capacity"],
  "role.retail-cashier": [
    "customer-and-fulfillment-journey",
    "money-and-accounting",
    "people-and-governance",
  ],
  "evidence-rule.payment-receipt": [
    "money-and-accounting",
    "people-and-governance",
  ],
  "evidence-rule.supplier-receipt-acceptance": [
    "people-and-governance",
    "supply-stock-and-capacity",
  ],
  "kernel.policy.financial-stock-audit": [
    "money-and-accounting",
    "supply-stock-and-capacity",
  ],
  "policy-profile.cash.accepted-payment-derived": ["money-and-accounting"],
  "policy-profile.data-handling.sandbox-only": ["safety-and-jurisdiction"],
  "policy-profile.external-ai.excluded": ["safety-and-jurisdiction"],
  "policy-profile.fiscal.not-applicable": [
    "business-shape",
    "money-and-accounting",
    "safety-and-jurisdiction",
  ],
  "policy-profile.inventory.moving-weighted-average": [
    "supply-stock-and-capacity",
  ],
  "policy-profile.payment.cash-allocation": ["money-and-accounting"],
  "policy-profile.purchasing.receipt-recognition": [
    "supply-stock-and-capacity",
  ],
  "policy-profile.sales.fulfillment-recognition": [
    "customer-and-fulfillment-journey",
  ],
  "sandbox.cafe": [
    "customer-and-fulfillment-journey",
    "experience-and-integrations",
    "people-and-governance",
    "supply-stock-and-capacity",
  ],
  "sandbox.retail": [
    "customer-and-fulfillment-journey",
    "experience-and-integrations",
    "people-and-governance",
    "supply-stock-and-capacity",
  ],
  "configuration-point.integration.disposition": [
    "experience-and-integrations",
    "safety-and-jurisdiction",
  ],
});

const V1_SHARED_REUSE_ACCEPTANCE_ITEM_IDENTITIES = new Set([
  "configuration-point.business-scope",
  ...V1_CAPABILITY_SELECTIONS.map((item) => item.capabilityIdentity),
  "record.order",
  "workflow.fulfillment",
  "role.owner",
  "sandbox.cafe",
  "sandbox.retail",
]);

const v1ConfiguredItemCoordinates = (businessScope) => [
  {
    sectionIdentity: "businessScope",
    schemaPath: "/businessScope",
    configuredItemIdentity: businessScope.configurationPointIdentity,
    configurationPointIdentity: businessScope.configurationPointIdentity,
  },
  ...V1_CAPABILITY_SELECTIONS.map((item) => ({
    sectionIdentity: "capabilitySelections",
    schemaPath: `/capabilitySelections/${item.capabilityIdentity}`,
    configuredItemIdentity: item.capabilityIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...V1_RECORD_DEFINITIONS.map((item) => ({
    sectionIdentity: "recordDefinitions",
    schemaPath: `/recordDefinitions/${item.recordIdentity}`,
    configuredItemIdentity: item.recordIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...V1_WORKFLOW_DEFINITIONS.map((item) => ({
    sectionIdentity: "workflowDefinitions",
    schemaPath: `/workflowDefinitions/${item.workflowIdentity}`,
    configuredItemIdentity: item.workflowIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...V1_ROLE_DEFINITIONS.map((item) => ({
    sectionIdentity: "roleDefinitions",
    schemaPath: `/roleDefinitions/${item.roleIdentity}`,
    configuredItemIdentity: item.roleIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...V1_EVIDENCE_RULES.map((item) => ({
    sectionIdentity: "evidenceRules",
    schemaPath: `/evidenceRules/${item.evidenceRuleIdentity}`,
    configuredItemIdentity: item.evidenceRuleIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...V1_POLICY_PROFILES.map((item) => ({
    sectionIdentity: "policyProfiles",
    schemaPath: `/policyProfiles/${item.policyProfileIdentity}`,
    configuredItemIdentity: item.policyProfileIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...V1_EXPERIENCE_CONFIGURATION.targetProfiles.map((item) => ({
    sectionIdentity: "experienceConfiguration",
    schemaPath: `/experienceConfiguration/targetProfiles/${item.targetIdentity}`,
    configuredItemIdentity: item.targetIdentity,
    configurationPointIdentity:
      V1_EXPERIENCE_CONFIGURATION.configurationPointIdentity,
  })),
  {
    sectionIdentity: "integrationConfiguration",
    schemaPath: "/integrationConfiguration",
    configuredItemIdentity:
      V1_INTEGRATION_CONFIGURATION.configurationPointIdentity,
    configurationPointIdentity:
      V1_INTEGRATION_CONFIGURATION.configurationPointIdentity,
  },
];

const sourceStatementIdentityFor = (intentBrief, acceptanceCondition) =>
  intentBrief.statements
    .filter(
      (statement) =>
        statement.factFamily === "purpose-and-scope" &&
        statement.intentState === "Confirmed" &&
        statement.source?.identity === acceptanceCondition.source?.identity
    )
    .map((statement) => statement.identity)
    .sort()[0] ?? null;

const createConfiguredItemIntentTraces = ({ intentBrief, businessScope }) => {
  const statementsByIdentity = new Map(
    intentBrief.statements.map((statement) => [statement.identity, statement])
  );
  const sharedReuseCondition = (intentBrief.acceptanceConditions ?? []).find(
    (condition) => condition.identity === "acceptance-condition.shared-reuse"
  );
  const sourceStatementIdentity = sharedReuseCondition
    ? sourceStatementIdentityFor(intentBrief, sharedReuseCondition)
    : null;
  const acceptanceConditionReference = sharedReuseCondition
    ? {
        acceptanceConditionIdentity: sharedReuseCondition.identity,
        sourceStatementIdentity,
        intentState: sharedReuseCondition.intentState,
        source: clone(sharedReuseCondition.source),
      }
    : null;
  const sandboxConstraintReference =
    sharedReuseCondition?.dependencies?.constraintIdentities?.includes(
      "constraint.sandbox-only"
    )
      ? {
          constraintIdentity: "constraint.sandbox-only",
          sourceAcceptanceConditionIdentity: sharedReuseCondition.identity,
          sourceStatementIdentity,
          intentState: sharedReuseCondition.intentState,
          source: clone(sharedReuseCondition.source),
        }
      : null;
  const productionExclusionReference =
    sharedReuseCondition?.exclusions?.includes("Production deployment")
      ? {
          value: "Production deployment",
          sourceAcceptanceConditionIdentity: sharedReuseCondition.identity,
          sourceStatementIdentity,
          intentState: sharedReuseCondition.intentState,
          source: clone(sharedReuseCondition.source),
        }
      : null;

  return v1ConfiguredItemCoordinates(businessScope).map((configuredItem) => ({
    kind: "ConfiguredItemIntentTrace",
    ...configuredItem,
    sourceStatementReferences: [
      ...V1_CONFIGURED_ITEM_TRACE_SOURCE_FACT_FAMILIES[
        configuredItem.configuredItemIdentity
      ],
    ]
      .map((factFamily) =>
        statementsByIdentity.get(`intent-statement.${factFamily}`)
      )
      .sort((left, right) => left.identity.localeCompare(right.identity))
      .map((statement) => ({
        statementIdentity: statement.identity,
        intentState: statement.intentState,
        source: clone(statement.source),
      })),
    acceptanceConditionReferences:
      acceptanceConditionReference &&
      V1_SHARED_REUSE_ACCEPTANCE_ITEM_IDENTITIES.has(
        configuredItem.configuredItemIdentity
      )
        ? [clone(acceptanceConditionReference)]
        : [],
    assumptionReferences: [],
    constraintReferences: sandboxConstraintReference
      ? [clone(sandboxConstraintReference)]
      : [],
    exclusionReferences:
      productionExclusionReference &&
      configuredItem.sectionIdentity === "businessScope"
        ? [clone(productionExclusionReference)]
        : [],
    unsupportedIntentReferences: [],
  }));
};

const createRequiredAcceptanceConditionIntentTraces = ({
  intentBrief,
  configuredItemIntentTraces,
}) => {
  const acceptanceCondition = (intentBrief.acceptanceConditions ?? []).find(
    (condition) =>
      condition.identity === "acceptance-condition.shared-reuse" &&
      condition.intentState === "Confirmed" &&
      condition.criticality === "Required"
  );
  if (!acceptanceCondition) {
    return [];
  }

  const sourceStatementIdentity = sourceStatementIdentityFor(
    intentBrief,
    acceptanceCondition
  );
  if (!sourceStatementIdentity) {
    return [];
  }

  const configuredItemReferences = configuredItemIntentTraces
    .filter((trace) =>
      trace.acceptanceConditionReferences.some(
        (reference) =>
          reference.acceptanceConditionIdentity === acceptanceCondition.identity
      )
    )
    .map(
      ({
        sectionIdentity,
        schemaPath,
        configuredItemIdentity,
        configurationPointIdentity,
      }) => ({
        sectionIdentity,
        schemaPath,
        configuredItemIdentity,
        configurationPointIdentity,
      })
    );

  const sourceReference = {
    sourceAcceptanceConditionIdentity: acceptanceCondition.identity,
    sourceStatementIdentity,
    intentState: acceptanceCondition.intentState,
    source: clone(acceptanceCondition.source),
  };
  const targetIdentities = configuredItemReferences
    .filter(
      (reference) => reference.sectionIdentity === "experienceConfiguration"
    )
    .map((reference) => reference.configuredItemIdentity)
    .sort();

  return [
    {
      kind: "RequiredAcceptanceConditionIntentTrace",
      acceptanceConditionIdentity: acceptanceCondition.identity,
      sourceStatementIdentity,
      intentState: acceptanceCondition.intentState,
      source: clone(acceptanceCondition.source),
      criticality: acceptanceCondition.criticality,
      reviewerIdentity: acceptanceCondition.reviewerIdentity,
      evidenceRequired: clone(acceptanceCondition.evidenceRequired),
      scope: {
        roleIdentities: [...acceptanceCondition.scope.roleIdentities].sort(),
        locationIdentities: [
          ...acceptanceCondition.scope.locationIdentities,
        ].sort(),
        recordIdentities: [
          ...acceptanceCondition.scope.recordIdentities,
        ].sort(),
        workflowIdentities: [
          ...acceptanceCondition.scope.workflowIdentities,
        ].sort(),
      },
      coverageDisposition: "Supported",
      configuredItemReferences,
      unresolvedConfiguredItemReferences: [],
      unsupportedConfiguredItemReferences: [],
      futureEvidencePaths: [
        {
          futureEvidencePathIdentity:
            "future-evidence-path.shared-reuse.owner-reviewable-traceability",
          futureEvidencePathVersion: "1.0.0",
          evidenceRequirement: acceptanceCondition.evidenceRequired[0],
          expectedEvidenceKind: "ReferenceSliceAcceptanceReport",
          evaluatorIdentity: "reference-slice.acceptance-suite",
          evaluatorVersion: "1.0.0",
          evaluationStage: "ReferenceVerticalSliceAcceptance",
          targetIdentities,
          startingContext: acceptanceCondition.startingContext,
          governedBusinessAction: acceptanceCondition.governedBusinessAction,
          observableResult: acceptanceCondition.observableResult,
          passCondition: acceptanceCondition.passCondition,
          failureCondition: acceptanceCondition.failureCondition,
          responsibleReviewerIdentity: acceptanceCondition.reviewerIdentity,
          disposition: "Declared",
          evidenceReferences: [],
        },
      ],
      assumptionReferences: [],
      constraintReferences: [
        ...(acceptanceCondition.dependencies?.constraintIdentities ?? []),
      ]
        .sort()
        .map((constraintIdentity) => ({
          constraintIdentity,
          ...clone(sourceReference),
        })),
      exclusionReferences: [...(acceptanceCondition.exclusions ?? [])]
        .sort()
        .map((value) => ({
          value,
          ...clone(sourceReference),
        })),
      unsupportedIntentReferences: [],
    },
  ];
};

const createRequiredAcceptanceConditionCoverage = ({
  intentBrief,
  blueprintReference,
  blueprintContentIdentity,
  sourceIntentBriefVersionReferences,
}) => {
  const requiredAcceptanceConditions = (intentBrief.acceptanceConditions ?? [])
    .filter((condition) => condition.criticality === "Required")
    .map((condition) => ({
      acceptanceConditionIdentity: condition.identity,
      sourceStatementIdentity: sourceStatementIdentityFor(
        intentBrief,
        condition
      ),
      intentState: condition.intentState,
      criticality: condition.criticality,
      evidenceRequired: clone(condition.evidenceRequired),
    }))
    .sort((left, right) =>
      left.acceptanceConditionIdentity.localeCompare(
        right.acceptanceConditionIdentity
      )
    );

  if (
    requiredAcceptanceConditions.length === 0 ||
    requiredAcceptanceConditions.some(
      (condition) => condition.sourceStatementIdentity === null
    )
  ) {
    return null;
  }

  return {
    kind: "AcceptanceConditionCoverage",
    blueprintReference: clone(blueprintReference),
    blueprintContentIdentity,
    sourceIntentBriefVersionReferences: clone(
      sourceIntentBriefVersionReferences
    ),
    requiredAcceptanceConditions,
  };
};

const createDataExposureSummary = ({
  intentBrief,
  blueprintReference,
  blueprintContentIdentity,
  sourceIntentBriefVersionReferences,
}) => {
  const externalAiExclusion = intentBrief.statements.find(
    (statement) =>
      statement.factFamily === "safety-and-jurisdiction" &&
      statement.intentState === "Confirmed" &&
      statement.value === REFERENCE_SLICE_EXTERNAL_AI_EXCLUSION
  );
  if (!externalAiExclusion) {
    return null;
  }

  return {
    kind: "DataExposureSummary",
    blueprintReference: clone(blueprintReference),
    blueprintContentIdentity,
    sourceIntentBriefVersionReferences: clone(
      sourceIntentBriefVersionReferences
    ),
    externalAiExposure: {
      disposition: "Excluded",
      sourceStatementIdentity: externalAiExclusion.identity,
      intentState: externalAiExclusion.intentState,
      sourceValue: externalAiExclusion.value,
    },
    namedDataCategories: (intentBrief.dataCategories ?? [])
      .map((category) => category.identity)
      .sort(),
  };
};

const createIntentDispositionSummary = ({
  intentBrief,
  blueprintReference,
  blueprintContentIdentity,
  sourceIntentBriefVersionReferences,
}) => ({
  kind: "IntentDispositionSummary",
  blueprintReference: clone(blueprintReference),
  blueprintContentIdentity,
  sourceIntentBriefVersionReferences: clone(sourceIntentBriefVersionReferences),
  assumptions: (intentBrief.assumptions ?? [])
    .map((assumption) => assumption.identity)
    .sort(),
  exclusions: (intentBrief.acceptanceConditions ?? [])
    .flatMap((condition) =>
      (condition.exclusions ?? []).map((value) => ({
        value,
        sourceAcceptanceConditionIdentity: condition.identity,
        intentState: condition.intentState,
      }))
    )
    .sort((left, right) =>
      `${left.sourceAcceptanceConditionIdentity}\u0000${left.value}`.localeCompare(
        `${right.sourceAcceptanceConditionIdentity}\u0000${right.value}`
      )
    ),
  unsupportedIntent: intentBrief.statements
    .filter((statement) => statement.intentState === "Unsupported")
    .map((statement) => statement.identity)
    .sort(),
});

const validateNormalizedBlueprint = ({
  normalizedBlueprint,
  blueprintReference,
  blueprintContentIdentity,
}) => {
  const propertyNames = Object.keys(normalizedBlueprint).sort();
  const hasClosedTopLevelSchema =
    propertyNames.length === NORMALIZED_BLUEPRINT_PROPERTIES.length &&
    propertyNames.every(
      (propertyName, index) =>
        propertyName === NORMALIZED_BLUEPRINT_PROPERTIES[index]
    );
  const hasExactBinding =
    normalizedBlueprint.tenantIdentity === blueprintReference.tenantIdentity &&
    normalizedBlueprint.blueprintIdentity ===
      blueprintReference.blueprintIdentity &&
    normalizedBlueprint.configurationSchemaIdentity ===
      CONFIGURATION_SCHEMA_IDENTITY &&
    normalizedBlueprint.configurationSchemaVersion ===
      CONFIGURATION_SCHEMA_VERSION &&
    sha256ContentIdentity(normalizedBlueprint) === blueprintContentIdentity;

  if (!hasClosedTopLevelSchema || !hasExactBinding) {
    return null;
  }

  return {
    kind: "ConfigurationValidationReport",
    blueprintReference: clone(blueprintReference),
    blueprintContentIdentity,
    verdict: "Valid",
    diagnostics: [],
  };
};

const createConfigurationValidationReportBinding = ({
  normalizedBlueprint,
  blueprintReference,
  blueprintContentIdentity,
  configurationValidationReport,
  validationTime,
}) => {
  const validationVersionSet = {
    blueprintConfigurationSchema: {
      machineIdentity: normalizedBlueprint.configurationSchemaIdentity,
      version: normalizedBlueprint.configurationSchemaVersion,
    },
    selectedCapabilityBindings: normalizedBlueprint.capabilitySelections
      .map(
        ({
          capabilityIdentity,
          capabilityVersion,
          configurationSchemaIdentity,
          configurationSchemaVersion,
        }) => ({
          capabilityIdentity,
          capabilityVersion,
          configurationSchemaIdentity,
          configurationSchemaVersion,
        })
      )
      .sort((left, right) =>
        left.capabilityIdentity.localeCompare(right.capabilityIdentity)
      ),
    canonicalizationRules: {
      machineIdentity: CANONICALIZATION_RULES_IDENTITY,
      version: CANONICALIZATION_RULES_VERSION,
    },
    validatorPolicy: {
      machineIdentity: VALIDATOR_POLICY_IDENTITY,
      version: VALIDATOR_POLICY_VERSION,
    },
    validationEngine: {
      machineIdentity: VALIDATION_ENGINE_IDENTITY,
      version: VALIDATION_ENGINE_VERSION,
    },
  };

  return {
    kind: "ConfigurationValidationReportBinding",
    blueprintReference: clone(blueprintReference),
    blueprintContentIdentity,
    configurationValidationReportContentIdentity: sha256ContentIdentity(
      configurationValidationReport
    ),
    validationVersionSet,
    validationVersionSetContentIdentity:
      sha256ContentIdentity(validationVersionSet),
    validationTime,
    responsibleKernelSource: clone(BUSINESS_KERNEL_SOURCE),
  };
};

const createUnsupportedCashCapabilityVersionDiagnostic = ({
  normalizedBlueprint,
  validationVersionSet,
  validationVersionSetContentIdentity,
}) => {
  const statementReference = normalizedBlueprint.intentTraceability.find(
    (trace) =>
      trace.statementIdentity === "intent-statement.money-and-accounting"
  );
  const acceptanceConditionTrace = normalizedBlueprint.intentTraceability.find(
    (trace) =>
      trace.kind === "RequiredAcceptanceConditionIntentTrace" &&
      trace.acceptanceConditionIdentity === "acceptance-condition.shared-reuse"
  );
  if (!statementReference || !acceptanceConditionTrace) {
    return null;
  }

  return {
    code: "CFG.CAPABILITY.VERSION_UNSUPPORTED",
    category: "Capability",
    severity: "Blocking",
    validationLayer:
      "validation-layer.capability-composition-and-configuration-point",
    schemaPath: "/capabilitySelections/capability.cash/capabilityVersion",
    affectedObjectIdentity: "capability.cash",
    ownerFacingSummary:
      "Capability capability.cash version 2.0.0 is not supported.",
    technicalExplanation:
      "The bound Capability registry supports capability.cash at exact version 1.0.0; the candidate requested 2.0.0.",
    remediationCategory:
      "remediation-category.select-supported-capability-version",
    relatedPaths: [
      "/capabilitySelections/capability.cash/configurationSchemaIdentity",
      "/capabilitySelections/capability.cash/configurationSchemaVersion",
    ],
    relatedIdentities: ["capability.cash", "schema.capability.cash"],
    intentBriefStatementReferences: [
      {
        statementIdentity: statementReference.statementIdentity,
        intentState: statementReference.intentState,
        source: clone(statementReference.source),
      },
    ],
    acceptanceConditionReferences: [
      {
        acceptanceConditionIdentity:
          acceptanceConditionTrace.acceptanceConditionIdentity,
        sourceStatementIdentity:
          acceptanceConditionTrace.sourceStatementIdentity,
        intentState: acceptanceConditionTrace.intentState,
        source: clone(acceptanceConditionTrace.source),
      },
    ],
    boundValidationVersionSet: clone(validationVersionSet),
    boundValidationVersionSetContentIdentity:
      validationVersionSetContentIdentity,
  };
};

/**
 * Derive one non-authoritative validation review behind BusinessKernel. This
 * read-only path never stores the received candidate or compiles it.
 */
export const createDraftBlueprintValidationCandidateReview = ({
  state,
  query,
}) => {
  if (
    !hasExactKeys(query, [
      "candidate",
      "sourceBlueprint",
      "tenantIdentity",
      "type",
    ]) ||
    !hasExactKeys(query.sourceBlueprint, [
      "blueprintContentIdentity",
      "blueprintReference",
    ]) ||
    !hasExactKeys(query.sourceBlueprint.blueprintReference, [
      "blueprintIdentity",
      "tenantIdentity",
      "versionIdentity",
    ]) ||
    query.sourceBlueprint.blueprintReference.tenantIdentity !==
      query.tenantIdentity ||
    !isContentIdentity(query.sourceBlueprint.blueprintContentIdentity) ||
    !hasExactKeys(query.candidate, [
      "normalizedBlueprint",
      "receivedCandidateFingerprint",
    ]) ||
    !hasExactKeys(
      query.candidate.normalizedBlueprint,
      NORMALIZED_BLUEPRINT_PROPERTIES
    ) ||
    !isContentIdentity(query.candidate.receivedCandidateFingerprint) ||
    sha256ContentIdentity(query.candidate.normalizedBlueprint) !==
      query.candidate.receivedCandidateFingerprint
  ) {
    return null;
  }

  const sourceBlueprintVersion = state.blueprintVersions.find(
    (candidate) =>
      canonicalJson(candidate.draftBlueprint.blueprintReference) ===
        canonicalJson(query.sourceBlueprint.blueprintReference) &&
      candidate.draftBlueprint.blueprintContentIdentity ===
        query.sourceBlueprint.blueprintContentIdentity
  );
  if (!sourceBlueprintVersion) {
    return null;
  }

  const sourceBinding =
    sourceBlueprintVersion.reviewBundle.configurationValidationReportBinding;
  if (
    !sourceBinding ||
    sha256ContentIdentity(sourceBinding.validationVersionSet) !==
      sourceBinding.validationVersionSetContentIdentity
  ) {
    return null;
  }

  const canonicalCandidate = clone(query.candidate.normalizedBlueprint);
  if (!Array.isArray(canonicalCandidate.capabilitySelections)) {
    return null;
  }
  canonicalCandidate.capabilitySelections = [
    ...canonicalCandidate.capabilitySelections,
  ].sort((left, right) =>
    left.capabilityIdentity.localeCompare(right.capabilityIdentity)
  );
  const sourceNormalizedBlueprint =
    sourceBlueprintVersion.reviewBundle.normalizedBlueprint;
  if (
    canonicalJson(canonicalCandidate) === canonicalJson(sourceNormalizedBlueprint)
  ) {
    const sourceBlueprint = clone(query.sourceBlueprint);
    const receivedCandidateFingerprint =
      query.candidate.receivedCandidateFingerprint;
    const candidateBlueprintContentIdentity =
      sha256ContentIdentity(canonicalCandidate);
    const candidateCanonicalization = {
      kind: "BlueprintCandidateCanonicalization",
      sourceBlueprint: clone(sourceBlueprint),
      receivedCandidateFingerprint,
      configurationSchemaIdentity:
        canonicalCandidate.configurationSchemaIdentity,
      configurationSchemaVersion:
        canonicalCandidate.configurationSchemaVersion,
      canonicalizationRules: {
        machineIdentity: CANONICALIZATION_RULES_IDENTITY,
        version: CANONICALIZATION_RULES_VERSION,
      },
      comparisonBaseline: clone(sourceBlueprint),
      comparisonDisposition: "ComparableUnderSameSchema",
      normalizedBlueprint: clone(canonicalCandidate),
      candidateBlueprintContentIdentity,
      normalizationResults: [
        {
          schemaPath: "/",
          ruleIdentity: "canonicalization-rule.object-key-order",
          disposition: "Normalized",
        },
        {
          schemaPath: "/capabilitySelections",
          ruleIdentity:
            "canonicalization-rule.unordered-stable-identity-order",
          stableIdentityField: "capabilityIdentity",
          disposition: "Normalized",
        },
      ],
    };
    const configurationValidationReport = {
      kind: "ConfigurationValidationReport",
      sourceBlueprint: clone(sourceBlueprint),
      receivedCandidateFingerprint,
      approvalEligibleBlueprintContentIdentity:
        candidateBlueprintContentIdentity,
      contentIdentityDisposition: "AvailableAfterCanonicalization",
      verdict: "Valid",
      diagnostics: [],
    };
    const configurationValidationReportBinding = {
      kind: "ConfigurationValidationReportBinding",
      sourceBlueprint: clone(sourceBlueprint),
      receivedCandidateFingerprint,
      configurationValidationReportContentIdentity: sha256ContentIdentity(
        configurationValidationReport
      ),
      validationVersionSet: clone(sourceBinding.validationVersionSet),
      validationVersionSetContentIdentity:
        sourceBinding.validationVersionSetContentIdentity,
      validationTime: sourceBinding.validationTime,
      responsibleKernelSource: clone(sourceBinding.responsibleKernelSource),
    };
    const semanticDiff = {
      kind: "SemanticDiff",
      sourceBlueprint: clone(sourceBlueprint),
      receivedCandidateFingerprint,
      candidateBlueprintContentIdentity,
      configurationSchemaIdentity:
        canonicalCandidate.configurationSchemaIdentity,
      configurationSchemaVersion:
        canonicalCandidate.configurationSchemaVersion,
      comparisonBaseline: clone(sourceBlueprint),
      comparisonDisposition: "ComparableUnderSameSchema",
      comparisonMapping: null,
      sectionGroups: BLUEPRINT_SECTION_IDENTITIES.map((sectionIdentity) => ({
        sectionIdentity,
        changes: [],
      })),
    };

    return {
      sourceBlueprint,
      receivedCandidateFingerprint,
      candidateCanonicalization,
      configurationValidationReport,
      configurationValidationReportBinding,
      semanticDiff,
    };
  }

  const expectedCandidate = clone(
    sourceNormalizedBlueprint
  );
  const cashCapability = expectedCandidate.capabilitySelections.find(
    (selection) => selection.capabilityIdentity === "capability.cash"
  );
  if (!cashCapability || cashCapability.capabilityVersion !== "1.0.0") {
    return null;
  }
  cashCapability.capabilityVersion = "2.0.0";
  if (
    canonicalJson(expectedCandidate) !==
    canonicalJson(query.candidate.normalizedBlueprint)
  ) {
    return null;
  }

  const diagnostic = createUnsupportedCashCapabilityVersionDiagnostic({
    normalizedBlueprint: query.candidate.normalizedBlueprint,
    validationVersionSet: sourceBinding.validationVersionSet,
    validationVersionSetContentIdentity:
      sourceBinding.validationVersionSetContentIdentity,
  });
  if (!diagnostic) {
    return null;
  }

  const sourceBlueprint = clone(query.sourceBlueprint);
  const receivedCandidateFingerprint =
    query.candidate.receivedCandidateFingerprint;
  const configurationValidationReport = {
    kind: "ConfigurationValidationReport",
    sourceBlueprint,
    receivedCandidateFingerprint,
    approvalEligibleBlueprintContentIdentity: null,
    contentIdentityDisposition: "UnavailableBecauseInvalid",
    verdict: "Invalid",
    diagnostics: [diagnostic],
  };
  const configurationValidationReportBinding = {
    kind: "ConfigurationValidationReportBinding",
    sourceBlueprint: clone(sourceBlueprint),
    receivedCandidateFingerprint,
    configurationValidationReportContentIdentity: sha256ContentIdentity(
      configurationValidationReport
    ),
    validationVersionSet: clone(sourceBinding.validationVersionSet),
    validationVersionSetContentIdentity:
      sourceBinding.validationVersionSetContentIdentity,
    validationTime: sourceBinding.validationTime,
    responsibleKernelSource: clone(sourceBinding.responsibleKernelSource),
  };

  return {
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationValidationReport,
    configurationValidationReportBinding,
  };
};

const initialSectionValue = (normalizedBlueprint, sectionIdentity) => {
  if (sectionIdentity !== "envelope") {
    return normalizedBlueprint[sectionIdentity];
  }

  return {
    tenantIdentity: normalizedBlueprint.tenantIdentity,
    blueprintIdentity: normalizedBlueprint.blueprintIdentity,
    configurationSchemaIdentity:
      normalizedBlueprint.configurationSchemaIdentity,
    configurationSchemaVersion: normalizedBlueprint.configurationSchemaVersion,
    sourceIntentBriefVersionReferences:
      normalizedBlueprint.sourceIntentBriefVersionReferences,
  };
};

const createInitialSemanticDiff = ({
  normalizedBlueprint,
  blueprintReference,
  blueprintContentIdentity,
  configurationValidationReport,
}) => {
  if (
    configurationValidationReport.verdict !== "Valid" ||
    configurationValidationReport.blueprintContentIdentity !==
      blueprintContentIdentity
  ) {
    return null;
  }

  return {
    kind: "SemanticDiff",
    blueprintReference: clone(blueprintReference),
    blueprintContentIdentity,
    configurationSchemaIdentity:
      normalizedBlueprint.configurationSchemaIdentity,
    configurationSchemaVersion: normalizedBlueprint.configurationSchemaVersion,
    approvalBaseline: null,
    sectionGroups: BLUEPRINT_SECTION_IDENTITIES.map((sectionIdentity) => ({
      sectionIdentity,
      changes: [
        {
          kind: "Added",
          path: `/${sectionIdentity}`,
          oldValue: null,
          newValue: clone(
            initialSectionValue(normalizedBlueprint, sectionIdentity)
          ),
        },
      ],
    })),
  };
};

const indexByStableIdentity = (values, identityFor) => {
  if (!Array.isArray(values)) return null;

  const indexed = new Map();
  for (const value of values) {
    const identity = identityFor(value);
    if (typeof identity !== "string" || indexed.has(identity)) return null;
    indexed.set(identity, value);
  }
  return indexed;
};

const compareStableIdentityCollection = ({
  previousValues,
  candidateValues,
  identityFor,
  pathPrefix,
}) => {
  const previousByIdentity = indexByStableIdentity(previousValues, identityFor);
  const candidateByIdentity = indexByStableIdentity(
    candidateValues,
    identityFor
  );
  if (!previousByIdentity || !candidateByIdentity) return null;

  return [
    ...new Set([...previousByIdentity.keys(), ...candidateByIdentity.keys()]),
  ]
    .sort()
    .flatMap((identity) => {
      const previousValue = previousByIdentity.get(identity);
      const candidateValue = candidateByIdentity.get(identity);
      if (previousValue === undefined) {
        return [
          {
            kind: "Added",
            path: `${pathPrefix}/${identity}`,
            oldValue: null,
            newValue: clone(candidateValue),
          },
        ];
      }
      if (candidateValue === undefined) {
        return [
          {
            kind: "Removed",
            path: `${pathPrefix}/${identity}`,
            oldValue: clone(previousValue),
            newValue: null,
          },
        ];
      }
      if (canonicalJson(previousValue) === canonicalJson(candidateValue)) {
        return [];
      }
      return [
        {
          kind: "Changed",
          path: `${pathPrefix}/${identity}`,
          oldValue: clone(previousValue),
          newValue: clone(candidateValue),
        },
      ];
    });
};

const intentTraceIdentity = (trace) => {
  if (typeof trace?.assumptionIdentity === "string") {
    return trace.assumptionIdentity;
  }
  if (typeof trace?.configuredItemIdentity === "string") {
    return trace.configuredItemIdentity;
  }
  if (typeof trace?.acceptanceConditionIdentity === "string") {
    return trace.acceptanceConditionIdentity;
  }
  if (typeof trace?.statementIdentity === "string") {
    return trace.statementIdentity;
  }
  return null;
};

const createReplacementSemanticDiff = ({
  normalizedBlueprint,
  blueprintReference,
  blueprintContentIdentity,
  configurationValidationReport,
  parentBlueprintVersion,
}) => {
  const previousDraft = parentBlueprintVersion?.draftBlueprint;
  const previousReviewBundle = parentBlueprintVersion?.reviewBundle;
  const previousNormalizedBlueprint = previousReviewBundle?.normalizedBlueprint;
  const previousValidationReport =
    previousReviewBundle?.configurationValidationReport;
  if (
    configurationValidationReport.verdict !== "Valid" ||
    configurationValidationReport.blueprintContentIdentity !==
      blueprintContentIdentity ||
    !previousDraft ||
    !previousNormalizedBlueprint ||
    previousValidationReport?.verdict !== "Valid" ||
    previousValidationReport.blueprintContentIdentity !==
      previousDraft.blueprintContentIdentity ||
    sha256ContentIdentity(previousNormalizedBlueprint) !==
      previousDraft.blueprintContentIdentity ||
    previousNormalizedBlueprint.configurationSchemaIdentity !==
      normalizedBlueprint.configurationSchemaIdentity ||
    previousNormalizedBlueprint.configurationSchemaVersion !==
      normalizedBlueprint.configurationSchemaVersion
  ) {
    return null;
  }

  const envelopeChanges = compareStableIdentityCollection({
    previousValues:
      previousNormalizedBlueprint.sourceIntentBriefVersionReferences,
    candidateValues: normalizedBlueprint.sourceIntentBriefVersionReferences,
    identityFor: (reference) => reference?.intentBriefIdentity,
    pathPrefix: "/envelope/sourceIntentBriefVersionReferences",
  });
  const intentTraceabilityChanges = compareStableIdentityCollection({
    previousValues: previousNormalizedBlueprint.intentTraceability,
    candidateValues: normalizedBlueprint.intentTraceability,
    identityFor: intentTraceIdentity,
    pathPrefix: "/intentTraceability",
  });
  if (!envelopeChanges || !intentTraceabilityChanges) return null;

  const unchangedSectionIdentities = BLUEPRINT_SECTION_IDENTITIES.filter(
    (sectionIdentity) =>
      sectionIdentity !== "envelope" && sectionIdentity !== "intentTraceability"
  );
  if (
    unchangedSectionIdentities.some(
      (sectionIdentity) =>
        canonicalJson(previousNormalizedBlueprint[sectionIdentity]) !==
        canonicalJson(normalizedBlueprint[sectionIdentity])
    )
  ) {
    return null;
  }

  const comparisonBaseline = {
    blueprintReference: clone(previousDraft.blueprintReference),
    blueprintContentIdentity: previousDraft.blueprintContentIdentity,
  };

  return {
    kind: "SemanticDiff",
    blueprintReference: clone(blueprintReference),
    blueprintContentIdentity,
    configurationSchemaIdentity:
      normalizedBlueprint.configurationSchemaIdentity,
    configurationSchemaVersion: normalizedBlueprint.configurationSchemaVersion,
    approvalBaseline: null,
    comparisonBaseline,
    comparisonDisposition: "ComparableUnderSameSchema",
    comparisonMapping: null,
    sectionGroups: BLUEPRINT_SECTION_IDENTITIES.map((sectionIdentity) => ({
      sectionIdentity,
      changes:
        sectionIdentity === "envelope"
          ? envelopeChanges
          : sectionIdentity === "intentTraceability"
            ? intentTraceabilityChanges
            : [],
    })),
  };
};

/**
 * Build one non-authoritative Draft record behind BusinessKernel. This Module
 * is deliberately not exposed as a public Interface or test seam.
 */
export const createDraftBlueprintRecord = ({ state, command }) => {
  const sourceReview = sourceIntentBriefVersion(state, command);
  const requestedSourceBlueprint = command.input.sourceBlueprint;
  const parentBlueprintVersion = sourceBlueprintVersion(state, command);
  if (
    !sourceReview ||
    sourceReview.tenantIdentity !== command.tenantIdentity ||
    sourceReview.draftReview?.disposition !== "ReadyForDraftProposal" ||
    (requestedSourceBlueprint !== null && !parentBlueprintVersion)
  ) {
    return null;
  }

  const lineageVersions = state.blueprintVersions.filter(
    (candidate) =>
      candidate.draftBlueprint.blueprintReference.tenantIdentity ===
        command.tenantIdentity &&
      candidate.draftBlueprint.blueprintReference.blueprintIdentity ===
        command.input.blueprintIdentity
  );
  if (
    (requestedSourceBlueprint === null && lineageVersions.length > 0) ||
    (parentBlueprintVersion &&
      parentBlueprintVersion.draftBlueprint.blueprintReference
        .blueprintIdentity !== command.input.blueprintIdentity)
  ) {
    return null;
  }

  const versionNumber =
    lineageVersions.reduce(
      (highest, candidate) =>
        Math.max(
          highest,
          candidate.draftBlueprint.version.envelope.versionNumber
        ),
      0
    ) + 1;

  const intentBrief = sourceReview.intentBrief;
  const blueprintReference = {
    tenantIdentity: command.tenantIdentity,
    blueprintIdentity: command.input.blueprintIdentity,
    versionIdentity: command.input.versionIdentity,
  };
  const sourceIntentBriefVersionReferences = [
    {
      intentBriefIdentity: intentBrief.identity,
      versionIdentity: intentBrief.versionIdentity,
    },
  ];
  const businessScope = createV1BusinessScope({
    state,
    intentBrief,
    tenantIdentity: command.tenantIdentity,
  });
  const configuredItemIntentTraces = createConfiguredItemIntentTraces({
    intentBrief,
    businessScope,
  });
  const requiredAcceptanceConditionIntentTraces =
    createRequiredAcceptanceConditionIntentTraces({
      intentBrief,
      configuredItemIntentTraces,
    });
  const version = {
    envelope: {
      tenantIdentity: command.tenantIdentity,
      blueprintIdentity: command.input.blueprintIdentity,
      versionIdentity: command.input.versionIdentity,
      versionNumber,
      parentVersionReference: parentBlueprintVersion
        ? clone(parentBlueprintVersion.draftBlueprint.blueprintReference)
        : null,
      configurationSchemaIdentity: CONFIGURATION_SCHEMA_IDENTITY,
      configurationSchemaVersion: CONFIGURATION_SCHEMA_VERSION,
      sourceIntentBriefVersionReferences,
      creationProvenance: {
        responsibleSource: clone(command.responsibleSource),
        recordedTime: command.creationTime,
      },
    },
    businessScope,
    capabilitySelections: clone(V1_CAPABILITY_SELECTIONS),
    recordDefinitions: clone(V1_RECORD_DEFINITIONS),
    workflowDefinitions: clone(V1_WORKFLOW_DEFINITIONS),
    roleDefinitions: clone(V1_ROLE_DEFINITIONS),
    evidenceRules: clone(V1_EVIDENCE_RULES),
    policyProfiles: clone(V1_POLICY_PROFILES),
    experienceConfiguration: clone(V1_EXPERIENCE_CONFIGURATION),
    integrationConfiguration: clone(V1_INTEGRATION_CONFIGURATION),
    intentTraceability: [
      ...intentBrief.statements.map((statement) => ({
        statementIdentity: statement.identity,
        intentState: statement.intentState,
        source: clone(statement.source),
      })),
      ...(intentBrief.assumptions ?? []).map(({ identity, ...assumption }) => ({
        assumptionIdentity: identity,
        ...clone(assumption),
      })),
      ...configuredItemIntentTraces,
      ...requiredAcceptanceConditionIntentTraces,
    ],
  };
  const {
    envelope: {
      tenantIdentity,
      blueprintIdentity,
      configurationSchemaIdentity,
      configurationSchemaVersion,
    },
    ...configurationSections
  } = version;
  const normalizedBlueprint = {
    tenantIdentity,
    blueprintIdentity,
    configurationSchemaIdentity,
    configurationSchemaVersion,
    sourceIntentBriefVersionReferences,
    ...configurationSections,
  };
  const blueprintContentIdentity = sha256ContentIdentity(normalizedBlueprint);
  const configurationValidationReport = validateNormalizedBlueprint({
    normalizedBlueprint,
    blueprintReference,
    blueprintContentIdentity,
  });
  if (!configurationValidationReport) {
    return null;
  }
  const configurationValidationReportBinding =
    createConfigurationValidationReportBinding({
      normalizedBlueprint,
      blueprintReference,
      blueprintContentIdentity,
      configurationValidationReport,
      validationTime: command.creationTime,
    });
  const semanticDiff = parentBlueprintVersion
    ? createReplacementSemanticDiff({
        normalizedBlueprint,
        blueprintReference,
        blueprintContentIdentity,
        configurationValidationReport,
        parentBlueprintVersion,
      })
    : createInitialSemanticDiff({
        normalizedBlueprint,
        blueprintReference,
        blueprintContentIdentity,
        configurationValidationReport,
      });
  if (!semanticDiff) {
    return null;
  }
  const acceptanceConditionCoverage = createRequiredAcceptanceConditionCoverage(
    {
      intentBrief,
      blueprintReference,
      blueprintContentIdentity,
      sourceIntentBriefVersionReferences,
    }
  );
  if (!acceptanceConditionCoverage) {
    return null;
  }
  const dataExposureSummary = createDataExposureSummary({
    intentBrief,
    blueprintReference,
    blueprintContentIdentity,
    sourceIntentBriefVersionReferences,
  });
  if (!dataExposureSummary) {
    return null;
  }
  const intentDispositionSummary = createIntentDispositionSummary({
    intentBrief,
    blueprintReference,
    blueprintContentIdentity,
    sourceIntentBriefVersionReferences,
  });
  const draftBlueprint = {
    blueprintReference,
    blueprintContentIdentity,
    version,
  };
  const blueprintLifecycle = {
    state: "Draft",
    blueprintReference,
    blueprintContentIdentity,
  };
  const reviewBundle = {
    blueprintReference,
    blueprintContentIdentity,
    normalizedBlueprint: clone(normalizedBlueprint),
    configurationValidationReport,
    configurationValidationReportBinding,
    approvalBaseline: null,
    semanticDiff,
    acceptanceConditionCoverage,
    dataExposureSummary,
    intentDispositionSummary,
  };

  return { draftBlueprint, blueprintLifecycle, reviewBundle };
};
