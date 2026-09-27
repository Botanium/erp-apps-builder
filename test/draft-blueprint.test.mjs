import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createLocalReferenceSlice } from "../src/reference-slice.mjs";

const blueprintSectionNames = [
  "envelope",
  "businessScope",
  "capabilitySelections",
  "recordDefinitions",
  "workflowDefinitions",
  "roleDefinitions",
  "evidenceRules",
  "policyProfiles",
  "experienceConfiguration",
  "integrationConfiguration",
  "intentTraceability",
].sort();

const configuredReuseStatementValues = Object.freeze({
  "purpose-and-scope":
    "Propose one owner-reviewable Blueprint for one fictitious Tenant with retail and cafe Sandbox Experiences; production remains excluded.",
  "business-shape":
    "One fictitious Tenant operates retail and cafe Locations in Iraq using Asia/Baghdad, Arabic and English, IQD, and normalized each, gram, and millilitre units at the small-to-medium tier.",
  "customer-and-fulfillment-journey":
    "Retail accepts an Order, fulfills a Sale, and takes Payment; cafe accepts a Menu Item and Modifier Order, progresses one Kitchen Ticket through accepted, preparing, ready, and fulfilled, then takes Payment.",
  "supply-stock-and-capacity":
    "Retail purchasing and receiving admit stock; retail fulfillment and cafe ingredient consumption use governed Inventory at their exact Locations.",
  "people-and-governance":
    "The fictitious Owner, Buyer, Receiver, Retail Cashier, Cafe Cashier, and Kitchen Operator Roles have governed duties and no participant assignments.",
  "money-and-accounting":
    "The sandbox uses fictitious IQD cash, Payment allocation, and balanced Ledger effects without bank, credit, deposit, refund, tax, or starting-balance authority.",
  "experience-and-integrations":
    "Retail and cafe use role-specific local review in Arabic and English with no external integration, offline promise, credential, or production endpoint.",
});

const canonicalizeIndependently = (value) => {
  if (Array.isArray(value)) {
    return value.map(canonicalizeIndependently);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalizeIndependently(value[key])])
    );
  }
  return value;
};

const independentlyRecomputedContentIdentity = (value) =>
  `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalizeIndependently(value)), "utf8")
    .digest("hex")}`;

const reverseSerializationOrder = (value) => {
  if (Array.isArray(value)) {
    return value.map(reverseSerializationOrder);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .reverse()
        .map((key) => [key, reverseSerializationOrder(value[key])])
    );
  }
  return value;
};

const createTicket03System = async () => {
  let identityNumber = 0;
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: {
      next: () =>
        `ticket-03.identity.${String(++identityNumber).padStart(3, "0")}`,
    },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  return system;
};

const completeSafeIntentBrief = async (
  system,
  { businessShapeAssumptions = [], statementValues = {} } = {}
) => {
  let view = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const answers = [
    {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        statementValues["purpose-and-scope"] ??
        "Prove shared retail and cafe behavior using fictitious data.",
      acceptanceConditions: [
        {
          identity: "acceptance-condition.shared-reuse",
          intentState: "Confirmed",
          outcome: "Retail and cafe configuration remains owner-reviewable.",
          whyItMatters: "The common platform must be reused.",
          scope: {
            roleIdentities: ["role.owner"],
            locationIdentities: ["location.retail", "location.cafe"],
            recordIdentities: ["record.order"],
            workflowIdentities: ["workflow.fulfillment"],
          },
          startingContext: "A fresh fictitious Tenant.",
          governedBusinessAction: "Review one later Draft Blueprint proposal.",
          observableResult: "Both business kinds trace to shared Capabilities.",
          passCondition: "No tenant-specific executable behavior is required.",
          failureCondition: "A business kind requires tenant runtime code.",
          exclusions: ["Production deployment"],
          evidenceRequired: ["Owner-reviewable traceability"],
          reviewerIdentity: "source.owner.cedar-steam",
          criticality: "Required",
          dependencies: {
            assumptionIdentities: [],
            constraintIdentities: ["constraint.sandbox-only"],
            sensitiveDataCategoryIdentities: [],
          },
        },
      ],
    },
    {
      statementIdentity: "intent-statement.safety-and-jurisdiction",
      intentState: "Confirmed",
      value: "The local proof is sandbox-only and external AI is excluded.",
    },
    {
      statementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value:
        statementValues["business-shape"] ??
        "One Tenant has retail and cafe Locations using IQD and normalized units.",
      assumptions: businessShapeAssumptions,
    },
    {
      statementIdentity: "intent-statement.customer-and-fulfillment-journey",
      intentState: "Confirmed",
      value:
        statementValues["customer-and-fulfillment-journey"] ??
        "Retail sale and cafe kitchen fulfillment are required.",
    },
    {
      statementIdentity: "intent-statement.supply-stock-and-capacity",
      intentState: "Confirmed",
      value:
        statementValues["supply-stock-and-capacity"] ??
        "Receiving, stock, and ingredient consumption are required.",
    },
    {
      statementIdentity: "intent-statement.people-and-governance",
      intentState: "Confirmed",
      value:
        statementValues["people-and-governance"] ??
        "Owner and operational Roles have governed duties.",
    },
    {
      statementIdentity: "intent-statement.money-and-accounting",
      intentState: "Confirmed",
      value:
        statementValues["money-and-accounting"] ??
        "Fictitious IQD cash and balanced Ledger effects are required.",
    },
    {
      statementIdentity: "intent-statement.experience-and-integrations",
      intentState: "Confirmed",
      value:
        statementValues["experience-and-integrations"] ??
        "Local review needs no external integration.",
    },
  ];

  for (const answer of answers) {
    view = await system.referenceSlice.dispatch({
      type: "reference-slice.answer-owner-interview",
      ownerInterviewIdentity: view.ownerInterview.identity,
      questionIdentity: view.ownerInterview.currentQuestion.identity,
      answer,
    });
  }
  assert.equal(
    view.ownerInterview.draftReview.disposition,
    "ReadyForDraftProposal"
  );
  return view.ownerInterview;
};

test("owner generates and reviews one exact immutable Draft Blueprint without gaining authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;

  assert.match(blueprintContentIdentity, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(
    {
      kind: generated.kind,
      mode: generated.mode,
      blueprintLifecycle: generated.blueprintLifecycle,
      sourceIntentBriefVersionReferences:
        generated.draftBlueprint.version.envelope
          .sourceIntentBriefVersionReferences,
      sectionNames: Object.keys(generated.draftBlueprint.version).sort(),
      reviewBinding: {
        blueprintReference: generated.reviewBundle.blueprintReference,
        blueprintContentIdentity:
          generated.reviewBundle.blueprintContentIdentity,
        approvalBaseline: generated.reviewBundle.approvalBaseline,
      },
      authority: generated.authority,
    },
    {
      kind: "ReferenceSliceView",
      mode: "DraftBlueprintReview",
      blueprintLifecycle: {
        state: "Draft",
        blueprintReference,
        blueprintContentIdentity,
      },
      sourceIntentBriefVersionReferences: [
        {
          intentBriefIdentity: intentBrief.identity,
          versionIdentity: intentBrief.versionIdentity,
        },
      ],
      sectionNames: blueprintSectionNames,
      reviewBinding: {
        blueprintReference,
        blueprintContentIdentity,
        approvalBaseline: null,
      },
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
    }
  );

  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  assert.deepEqual(reviewed.draftBlueprint, generated.draftBlueprint);
  assert.deepEqual(reviewed.reviewBundle, generated.reviewBundle);

  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  assert.deepEqual(observation.authority, {
    blueprintVersions: 1,
    blueprintApprovals: 0,
    appliedBlueprints: 0,
    provisioningAttempts: 0,
  });
  assert.deepEqual(observation.business, {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  });
});

test("Blueprint Content Identity is independently recomputable across serialization-only differences", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const normalizedBlueprint = reviewed.reviewBundle.normalizedBlueprint;
  assert.ok(
    normalizedBlueprint,
    "The review bundle must expose the normalized Blueprint for independent Content Identity recomputation."
  );

  const version = generated.draftBlueprint.version;
  const expectedNormalizedBlueprint = {
    tenantIdentity: version.envelope.tenantIdentity,
    blueprintIdentity: version.envelope.blueprintIdentity,
    configurationSchemaIdentity: version.envelope.configurationSchemaIdentity,
    configurationSchemaVersion: version.envelope.configurationSchemaVersion,
    sourceIntentBriefVersionReferences:
      version.envelope.sourceIntentBriefVersionReferences,
    businessScope: version.businessScope,
    capabilitySelections: version.capabilitySelections,
    recordDefinitions: version.recordDefinitions,
    workflowDefinitions: version.workflowDefinitions,
    roleDefinitions: version.roleDefinitions,
    evidenceRules: version.evidenceRules,
    policyProfiles: version.policyProfiles,
    experienceConfiguration: version.experienceConfiguration,
    integrationConfiguration: version.integrationConfiguration,
    intentTraceability: version.intentTraceability,
  };
  const recomputedIdentity =
    independentlyRecomputedContentIdentity(normalizedBlueprint);
  const reserializedIdentity = independentlyRecomputedContentIdentity(
    reverseSerializationOrder(normalizedBlueprint)
  );

  assert.deepEqual(
    {
      normalizedBlueprint,
      recordedIdentity: generated.draftBlueprint.blueprintContentIdentity,
      recomputedIdentity,
      reserializedIdentity,
      authority: observation.authority,
      business: observation.business,
    },
    {
      normalizedBlueprint: expectedNormalizedBlueprint,
      recordedIdentity: recomputedIdentity,
      recomputedIdentity,
      reserializedIdentity: recomputedIdentity,
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

const proveAssumptionReviewSemantics = async () => {
  const baselineSystem = await createTicket03System();
  const assumedSystem = await createTicket03System();
  const baselineInterview = await completeSafeIntentBrief(baselineSystem);
  const assumedInterview = await completeSafeIntentBrief(assumedSystem, {
    businessShapeAssumptions: [
      {
        identity: "assumption.local-operating-hours",
        intentState: "Assumed",
        proposition:
          "One illustrative operating-hours profile is sufficient for owner review.",
        proposerIdentity: "source.agent.local",
        rationale:
          "The exact fictitious opening hours are not needed to assess shared behavior.",
        affectedFactFamilies: ["business-shape"],
        affectedDraftBlueprintProposals: ["experience.operating-hours-display"],
        consequenceIfFalse:
          "The later Draft may need a different presentation-only schedule.",
        riskIfFalse: "No governed action or invariant changes.",
        resolutionCondition:
          "The owner confirms an illustrative schedule before Blueprint Approval.",
        expectedEvidence: "An attributable owner schedule decision.",
        responsibleReviewerIdentity: "source.owner.cedar-steam",
        timeSensitive: true,
        reviewTrigger: "Before Blueprint Approval",
        expiresAt: null,
      },
    ],
  });

  const baselineGenerated = await baselineSystem.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: baselineInterview.identity,
    intentBriefVersionIdentity: baselineInterview.intentBrief.versionIdentity,
  });
  const assumedGenerated = await assumedSystem.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: assumedInterview.intentBrief.versionIdentity,
  });
  const baselineReviewed = await baselineSystem.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: baselineGenerated.draftBlueprint.blueprintReference,
  });
  const assumedReviewed = await assumedSystem.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: assumedGenerated.draftBlueprint.blueprintReference,
  });
  const baselineObservation = await baselineSystem.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  const assumedObservation = await assumedSystem.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const baselineBlueprint = baselineReviewed.reviewBundle.normalizedBlueprint;
  const assumedBlueprint = assumedReviewed.reviewBundle.normalizedBlueprint;
  const activeGovernedConfiguration = (blueprint) => ({
    businessScope: blueprint.businessScope,
    capabilitySelections: blueprint.capabilitySelections,
    recordDefinitions: blueprint.recordDefinitions,
    workflowDefinitions: blueprint.workflowDefinitions,
    roleDefinitions: blueprint.roleDefinitions,
    evidenceRules: blueprint.evidenceRules,
    policyProfiles: blueprint.policyProfiles,
    experienceConfiguration: blueprint.experienceConfiguration,
    integrationConfiguration: blueprint.integrationConfiguration,
  });
  const expectedAssumptionTrace = {
    assumptionIdentity: "assumption.local-operating-hours",
    intentState: "Assumed",
    proposition:
      "One illustrative operating-hours profile is sufficient for owner review.",
    rationale:
      "The exact fictitious opening hours are not needed to assess shared behavior.",
    affectedFactFamilies: ["business-shape"],
    affectedDraftBlueprintProposals: ["experience.operating-hours-display"],
    consequenceIfFalse:
      "The later Draft may need a different presentation-only schedule.",
    riskIfFalse: "No governed action or invariant changes.",
    resolutionCondition:
      "The owner confirms an illustrative schedule before Blueprint Approval.",
    expectedEvidence: "An attributable owner schedule decision.",
    responsibleReviewerIdentity: "source.owner.cedar-steam",
    timeSensitive: true,
    reviewTrigger: "Before Blueprint Approval",
    expiresAt: null,
    proposer: {
      kind: "AgentProposal",
      identity: "source.agent.local",
    },
    source: {
      kind: "Owner",
      identity: "source.owner.cedar-steam",
      recordedTime: "2026-01-15T09:00:00.000Z",
    },
  };
  const assumptionTrace = assumedBlueprint.intentTraceability.find(
    (entry) => entry.assumptionIdentity === "assumption.local-operating-hours"
  );
  const traceabilityDiff =
    assumedReviewed.reviewBundle.semanticDiff.sectionGroups.find(
      (sectionGroup) => sectionGroup.sectionIdentity === "intentTraceability"
    );

  assert.notEqual(
    assumedGenerated.draftBlueprint.blueprintContentIdentity,
    baselineGenerated.draftBlueprint.blueprintContentIdentity,
    "Owner-reviewed Assumption content must change Blueprint Content Identity."
  );
  assert.deepEqual(
    activeGovernedConfiguration(assumedBlueprint),
    activeGovernedConfiguration(baselineBlueprint)
  );
  assert.deepEqual(
    assumedReviewed.reviewBundle.intentDispositionSummary.assumptions,
    ["assumption.local-operating-hours"]
  );
  assert.deepEqual(assumptionTrace, expectedAssumptionTrace);
  assert.deepEqual(traceabilityDiff, {
    sectionIdentity: "intentTraceability",
    changes: [
      {
        kind: "Added",
        path: "/intentTraceability",
        oldValue: null,
        newValue: assumedBlueprint.intentTraceability,
      },
    ],
  });
  assert.deepEqual(
    {
      baselineAuthority: baselineObservation.authority,
      assumedAuthority: assumedObservation.authority,
      baselineBusiness: baselineObservation.business,
      assumedBusiness: assumedObservation.business,
    },
    {
      baselineAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      assumedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      baselineBusiness: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
      assumedBusiness: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
};

test("Draft review exposes one deterministic Valid Configuration Validation Report without gaining authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const configurationValidationReport =
    reviewed.reviewBundle.configurationValidationReport;
  assert.ok(
    configurationValidationReport,
    "The Draft review bundle must contain one Configuration Validation Report."
  );

  assert.deepEqual(
    {
      configurationValidationReport,
      repeatedReport: reviewedAgain.reviewBundle.configurationValidationReport,
      authority: observation.authority,
      business: observation.business,
    },
    {
      configurationValidationReport: {
        kind: "ConfigurationValidationReport",
        blueprintReference,
        blueprintContentIdentity,
        verdict: "Valid",
        diagnostics: [],
      },
      repeatedReport: configurationValidationReport,
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review exposes one deterministic schema-aware initial Semantic Diff without gaining authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const { configurationSchemaIdentity, configurationSchemaVersion } =
    generated.draftBlueprint.version.envelope;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const semanticDiff = reviewed.reviewBundle.semanticDiff;
  assert.ok(
    semanticDiff,
    "The Draft review bundle must contain one schema-aware Semantic Diff."
  );

  assert.deepEqual(
    {
      binding: {
        blueprintReference: semanticDiff.blueprintReference,
        blueprintContentIdentity: semanticDiff.blueprintContentIdentity,
        configurationSchemaIdentity: semanticDiff.configurationSchemaIdentity,
        configurationSchemaVersion: semanticDiff.configurationSchemaVersion,
      },
      reviewBundleApprovalBaseline: reviewed.reviewBundle.approvalBaseline,
      semanticDiffApprovalBaseline: semanticDiff.approvalBaseline,
      sectionGroups: semanticDiff.sectionGroups.map((sectionGroup) => ({
        sectionIdentity: sectionGroup.sectionIdentity,
        changeKinds: sectionGroup.changes.map((change) => change.kind),
      })),
      repeatedSemanticDiff: reviewedAgain.reviewBundle.semanticDiff,
      authority: observation.authority,
      business: observation.business,
    },
    {
      binding: {
        blueprintReference,
        blueprintContentIdentity,
        configurationSchemaIdentity,
        configurationSchemaVersion,
      },
      reviewBundleApprovalBaseline: null,
      semanticDiffApprovalBaseline: null,
      sectionGroups: blueprintSectionNames.map((sectionIdentity) => ({
        sectionIdentity,
        changeKinds: ["Added"],
      })),
      repeatedSemanticDiff: semanticDiff,
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review exposes deterministic Required Acceptance Condition coverage without gaining authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const acceptanceConditionCoverage =
    reviewed.reviewBundle.acceptanceConditionCoverage;
  assert.ok(
    acceptanceConditionCoverage,
    "The exact Draft review bundle must expose its Required Acceptance Condition coverage."
  );

  assert.deepEqual(
    {
      reviewBundleBinding: {
        blueprintReference: reviewed.reviewBundle.blueprintReference,
        blueprintContentIdentity:
          reviewed.reviewBundle.blueprintContentIdentity,
      },
      acceptanceConditionCoverage,
      repeatedCoverage: reviewedAgain.reviewBundle.acceptanceConditionCoverage,
      authority: observation.authority,
      business: observation.business,
    },
    {
      reviewBundleBinding: {
        blueprintReference,
        blueprintContentIdentity,
      },
      acceptanceConditionCoverage: {
        kind: "AcceptanceConditionCoverage",
        blueprintReference,
        blueprintContentIdentity,
        sourceIntentBriefVersionReferences: [
          {
            intentBriefIdentity: intentBrief.identity,
            versionIdentity: intentBrief.versionIdentity,
          },
        ],
        requiredAcceptanceConditions: [
          {
            acceptanceConditionIdentity: "acceptance-condition.shared-reuse",
            sourceStatementIdentity: "intent-statement.purpose-and-scope",
            intentState: "Confirmed",
            criticality: "Required",
            evidenceRequired: ["Owner-reviewable traceability"],
          },
        ],
      },
      repeatedCoverage: acceptanceConditionCoverage,
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review exposes one deterministic data-exposure summary without gaining authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const dataExposureSummary = reviewed.reviewBundle.dataExposureSummary;
  assert.ok(
    dataExposureSummary,
    "The exact Draft review bundle must expose one data-exposure summary."
  );

  assert.deepEqual(
    {
      reviewBundleBinding: {
        blueprintReference: reviewed.reviewBundle.blueprintReference,
        blueprintContentIdentity:
          reviewed.reviewBundle.blueprintContentIdentity,
      },
      dataExposureSummary,
      repeatedSummary: reviewedAgain.reviewBundle.dataExposureSummary,
      authority: observation.authority,
      business: observation.business,
    },
    {
      reviewBundleBinding: {
        blueprintReference,
        blueprintContentIdentity,
      },
      dataExposureSummary: {
        kind: "DataExposureSummary",
        blueprintReference,
        blueprintContentIdentity,
        sourceIntentBriefVersionReferences: [
          {
            intentBriefIdentity: intentBrief.identity,
            versionIdentity: intentBrief.versionIdentity,
          },
        ],
        externalAiExposure: {
          disposition: "Excluded",
          sourceStatementIdentity: "intent-statement.safety-and-jurisdiction",
          intentState: "Confirmed",
          sourceValue:
            "The local proof is sandbox-only and external AI is excluded.",
        },
        namedDataCategories: [],
      },
      repeatedSummary: dataExposureSummary,
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review exposes one deterministic intent-disposition summary without gaining authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const intentDispositionSummary =
    reviewed.reviewBundle.intentDispositionSummary;
  assert.ok(
    intentDispositionSummary,
    "The exact Draft review bundle must expose one intent-disposition summary."
  );

  assert.deepEqual(
    {
      reviewBundleBinding: {
        blueprintReference: reviewed.reviewBundle.blueprintReference,
        blueprintContentIdentity:
          reviewed.reviewBundle.blueprintContentIdentity,
      },
      intentDispositionSummary,
      repeatedSummary: reviewedAgain.reviewBundle.intentDispositionSummary,
      authority: observation.authority,
      business: observation.business,
    },
    {
      reviewBundleBinding: {
        blueprintReference,
        blueprintContentIdentity,
      },
      intentDispositionSummary: {
        kind: "IntentDispositionSummary",
        blueprintReference,
        blueprintContentIdentity,
        sourceIntentBriefVersionReferences: [
          {
            intentBriefIdentity: intentBrief.identity,
            versionIdentity: intentBrief.versionIdentity,
          },
        ],
        assumptions: [],
        exclusions: [
          {
            value: "Production deployment",
            sourceAcceptanceConditionIdentity:
              "acceptance-condition.shared-reuse",
            intentState: "Confirmed",
          },
        ],
        unsupportedIntent: [],
      },
      repeatedSummary: intentDispositionSummary,
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("blocked Intent Brief generation returns an exact owner-reviewable Draft Blocker without gaining authority", async () => {
  const system = await createTicket03System();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const partial = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        "Prove shared retail and cafe behavior using only fictitious sandbox data.",
    },
  });
  const intentBrief = partial.ownerInterview.intentBrief;

  const blocked = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: partial.ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      kind: blocked.kind,
      mode: blocked.mode,
      sourceIntentBriefVersion: blocked.sourceIntentBriefVersion,
      draftBlockers: blocked.draftBlockers,
      draftBlueprint: blocked.draftBlueprint,
      authority: blocked.authority,
      observedAuthority: observation.authority,
      business: observation.business,
    },
    {
      kind: "ReferenceSliceView",
      mode: "DraftBlueprintGenerationBlocked",
      sourceIntentBriefVersion: {
        tenantIdentity: intentBrief.tenantIdentity,
        ownerInterviewIdentity: partial.ownerInterview.identity,
        intentBriefIdentity: intentBrief.identity,
        versionIdentity: intentBrief.versionIdentity,
      },
      draftBlockers: [
        {
          code: "INTENT.DRAFT_BLOCKER.REQUIRED_FACT_FAMILY_MISSING",
          factFamilies: [
            "safety-and-jurisdiction",
            "business-shape",
            "customer-and-fulfillment-journey",
            "supply-stock-and-capacity",
            "people-and-governance",
            "money-and-accounting",
            "experience-and-integrations",
          ],
          summary:
            "Every required fact family must be represented before a Draft Blueprint may be proposed.",
        },
      ],
      draftBlueprint: null,
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
      },
      observedAuthority: {
        blueprintVersions: 0,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test(
  "owner-reviewed Assumption changes Draft content without driving active Governed Configuration",
  proveAssumptionReviewSemantics
);

test("explicit Assumption resolution creates forward-only Intent Brief and Draft versions without authority", async () => {
  const system = await createTicket03System();
  const assumedInterview = await completeSafeIntentBrief(system, {
    businessShapeAssumptions: [
      {
        identity: "assumption.local-operating-hours",
        intentState: "Assumed",
        proposition:
          "One illustrative operating-hours profile is sufficient for owner review.",
        proposerIdentity: "source.agent.local",
        rationale:
          "The exact fictitious opening hours are not needed to assess shared behavior.",
        affectedFactFamilies: ["business-shape"],
        affectedDraftBlueprintProposals: ["experience.operating-hours-display"],
        consequenceIfFalse:
          "The later Draft may need a different presentation-only schedule.",
        riskIfFalse: "No governed action or invariant changes.",
        resolutionCondition:
          "The owner confirms an illustrative schedule before Blueprint Approval.",
        expectedEvidence: "An attributable owner schedule decision.",
        responsibleReviewerIdentity: "source.owner.cedar-steam",
        timeSensitive: true,
        reviewTrigger: "Before Blueprint Approval",
        expiresAt: null,
      },
    ],
  });
  const priorIntentBrief = structuredClone(assumedInterview.intentBrief);

  const firstGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: priorIntentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: firstGenerated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);

  const corrected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: assumedInterview.identity,
    questionIdentity: "owner-interview.question.business-shape",
    answer: {
      statementIdentity: "intent-statement.business-shape",
      revisesStatementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value:
        "One Tenant has retail and cafe Locations using IQD and normalized units; owner-confirmed illustrative operating hours are 08:00–17:00.",
      assumptionResolutions: [
        {
          assumptionIdentity: "assumption.local-operating-hours",
          disposition: "Confirmed",
          resultingStatementIdentity: "intent-statement.business-shape",
        },
      ],
    },
  });

  assert.notEqual(
    corrected.mode,
    "OwnerInterviewInputRejected",
    `Assumption resolution input was rejected: ${corrected.diagnostics?.[0]?.code ?? "unknown"} for ${corrected.diagnostics?.[0]?.field ?? "unknown"}.`
  );
  assert.equal(corrected.mode, "OwnerInterview");

  const resolvedIntentBrief = corrected.ownerInterview.intentBrief;
  assert.deepEqual(
    {
      intentBriefIdentity: resolvedIntentBrief.identity,
      versionChanged:
        resolvedIntentBrief.versionIdentity !==
        priorIntentBrief.versionIdentity,
      versionNumber: resolvedIntentBrief.versionNumber,
      parentVersionIdentity: resolvedIntentBrief.parentVersionIdentity,
      activeAssumptions: resolvedIntentBrief.assumptions ?? [],
      assumptionResolutions: resolvedIntentBrief.assumptionResolutions,
      correctedBusinessShape: resolvedIntentBrief.statements.find(
        (statement) => statement.identity === "intent-statement.business-shape"
      ),
      draftDisposition: corrected.ownerInterview.draftReview.disposition,
    },
    {
      intentBriefIdentity: priorIntentBrief.identity,
      versionChanged: true,
      versionNumber: priorIntentBrief.versionNumber + 1,
      parentVersionIdentity: priorIntentBrief.versionIdentity,
      activeAssumptions: [],
      assumptionResolutions: [
        {
          assumptionIdentity: "assumption.local-operating-hours",
          disposition: "Confirmed",
          resultingStatementIdentity: "intent-statement.business-shape",
          source: {
            kind: "Owner",
            identity: "source.owner.cedar-steam",
            recordedTime: "2026-01-15T09:00:00.000Z",
          },
        },
      ],
      correctedBusinessShape: {
        identity: "intent-statement.business-shape",
        factFamily: "business-shape",
        intentState: "Confirmed",
        value:
          "One Tenant has retail and cafe Locations using IQD and normalized units; owner-confirmed illustrative operating hours are 08:00–17:00.",
        source: {
          kind: "Owner",
          identity: "source.owner.cedar-steam",
          recordedTime: "2026-01-15T09:00:00.000Z",
        },
      },
      draftDisposition: "ReadyForDraftProposal",
    }
  );

  const historicalIntentReview = await system.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: assumedInterview.identity,
    versionIdentity: priorIntentBrief.versionIdentity,
  });
  assert.deepEqual(
    historicalIntentReview.ownerInterview.intentBrief,
    priorIntentBrief
  );

  const secondGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: resolvedIntentBrief.versionIdentity,
    sourceBlueprint: {
      blueprintReference: priorDraft.blueprintReference,
      blueprintContentIdentity: priorDraft.blueprintContentIdentity,
    },
  });
  const secondReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: secondGenerated.draftBlueprint.blueprintReference,
  });
  const historicalDraftReview = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const secondEnvelope = secondGenerated.draftBlueprint.version.envelope;

  assert.deepEqual(
    {
      tenantIdentity:
        secondGenerated.draftBlueprint.blueprintReference.tenantIdentity,
      blueprintIdentity:
        secondGenerated.draftBlueprint.blueprintReference.blueprintIdentity,
      versionChanged:
        secondGenerated.draftBlueprint.blueprintReference.versionIdentity !==
        priorDraft.blueprintReference.versionIdentity,
      versionNumber: secondEnvelope.versionNumber,
      parentVersionReference: secondEnvelope.parentVersionReference,
      sourceIntentBriefVersionReferences:
        secondEnvelope.sourceIntentBriefVersionReferences,
      contentIdentityChanged:
        secondGenerated.draftBlueprint.blueprintContentIdentity !==
        priorDraft.blueprintContentIdentity,
      repeatedSecondDraft: secondReviewed.draftBlueprint,
      historicalDraft: historicalDraftReview.draftBlueprint,
      historicalReviewBundle: historicalDraftReview.reviewBundle,
    },
    {
      tenantIdentity: priorDraft.blueprintReference.tenantIdentity,
      blueprintIdentity: priorDraft.blueprintReference.blueprintIdentity,
      versionChanged: true,
      versionNumber: 2,
      parentVersionReference: priorDraft.blueprintReference,
      sourceIntentBriefVersionReferences: [
        {
          intentBriefIdentity: resolvedIntentBrief.identity,
          versionIdentity: resolvedIntentBrief.versionIdentity,
        },
      ],
      contentIdentityChanged: true,
      repeatedSecondDraft: secondGenerated.draftBlueprint,
      historicalDraft: priorDraft,
      historicalReviewBundle: priorReviewBundle,
    }
  );

  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  assert.deepEqual(
    {
      firstAuthority: firstGenerated.authority,
      secondAuthority: secondGenerated.authority,
      observedAuthority: observation.authority,
      business: observation.business,
    },
    {
      firstAuthority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      secondAuthority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      observedAuthority: {
        blueprintVersions: 2,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("replacement Draft with mismatched source Content Identity fails closed without authority", async () => {
  const system = await createTicket03System();
  const assumedInterview = await completeSafeIntentBrief(system, {
    businessShapeAssumptions: [
      {
        identity: "assumption.local-operating-hours",
        intentState: "Assumed",
        proposition:
          "One illustrative operating-hours profile is sufficient for owner review.",
        proposerIdentity: "source.agent.local",
        rationale:
          "The exact fictitious opening hours are not needed to assess shared behavior.",
        affectedFactFamilies: ["business-shape"],
        affectedDraftBlueprintProposals: ["experience.operating-hours-display"],
        consequenceIfFalse:
          "The later Draft may need a different presentation-only schedule.",
        riskIfFalse: "No governed action or invariant changes.",
        resolutionCondition:
          "The owner confirms an illustrative schedule before Blueprint Approval.",
        expectedEvidence: "An attributable owner schedule decision.",
        responsibleReviewerIdentity: "source.owner.cedar-steam",
        timeSensitive: true,
        reviewTrigger: "Before Blueprint Approval",
        expiresAt: null,
      },
    ],
  });
  const firstGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: assumedInterview.intentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: firstGenerated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);

  const corrected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: assumedInterview.identity,
    questionIdentity: "owner-interview.question.business-shape",
    answer: {
      statementIdentity: "intent-statement.business-shape",
      revisesStatementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value:
        "One Tenant has retail and cafe Locations using IQD and normalized units; owner-confirmed illustrative operating hours are 08:00–17:00.",
      assumptionResolutions: [
        {
          assumptionIdentity: "assumption.local-operating-hours",
          disposition: "Confirmed",
          resultingStatementIdentity: "intent-statement.business-shape",
        },
      ],
    },
  });
  assert.equal(corrected.mode, "OwnerInterview");
  const resolvedIntentBrief = corrected.ownerInterview.intentBrief;
  const mismatchedBlueprintContentIdentity = `sha256:${"0".repeat(64)}`;
  assert.notEqual(
    mismatchedBlueprintContentIdentity,
    priorDraft.blueprintContentIdentity
  );

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: resolvedIntentBrief.versionIdentity,
    sourceBlueprint: {
      blueprintReference: priorDraft.blueprintReference,
      blueprintContentIdentity: mismatchedBlueprintContentIdentity,
    },
  });

  assert.deepEqual(
    {
      kind: rejected.kind,
      mode: rejected.mode,
      sourceIntentBriefVersion: rejected.sourceIntentBriefVersion,
      requestedSourceBlueprint: rejected.requestedSourceBlueprint,
      diagnostics: rejected.diagnostics?.map(({ code, severity, summary }) => ({
        code,
        severity,
        ownerSummaryPresent:
          typeof summary === "string" && summary.trim().length > 0,
      })),
      draftBlueprint: rejected.draftBlueprint,
      authority: rejected.authority,
    },
    {
      kind: "ReferenceSliceView",
      mode: "DraftBlueprintGenerationRejected",
      sourceIntentBriefVersion: {
        tenantIdentity: priorDraft.blueprintReference.tenantIdentity,
        ownerInterviewIdentity: assumedInterview.identity,
        intentBriefIdentity: resolvedIntentBrief.identity,
        versionIdentity: resolvedIntentBrief.versionIdentity,
      },
      requestedSourceBlueprint: {
        blueprintReference: priorDraft.blueprintReference,
        blueprintContentIdentity: mismatchedBlueprintContentIdentity,
      },
      diagnostics: [
        {
          code: "KERNEL.BLUEPRINT.SOURCE_NOT_READY",
          severity: "Blocking",
          ownerSummaryPresent: true,
        },
      ],
      draftBlueprint: null,
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
      },
    }
  );

  const preserved = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  assert.deepEqual(
    {
      draftBlueprint: preserved.draftBlueprint,
      reviewBundle: preserved.reviewBundle,
    },
    {
      draftBlueprint: priorDraft,
      reviewBundle: priorReviewBundle,
    }
  );

  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  assert.deepEqual(
    {
      authority: observation.authority,
      business: observation.business,
    },
    {
      authority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft generation rejects undeclared action properties without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
    configurationOverrides: {
      runtimeCode: "return fictitiousTenantState;",
    },
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      result: {
        kind: rejected.kind,
        mode: rejected.mode,
        sourceIntentBriefVersion: rejected.sourceIntentBriefVersion,
        diagnostics: rejected.diagnostics?.map(
          ({ code, severity, field, summary }) => ({
            code,
            severity,
            field,
            ownerSummaryPresent:
              typeof summary === "string" && summary.trim().length > 0,
          })
        ),
        draftBlueprint: rejected.draftBlueprint,
        authority: rejected.authority,
      },
      observedAuthority: {
        blueprintVersions: observation.authority.blueprintVersions,
        blueprintApprovals: observation.authority.blueprintApprovals,
        appliedBlueprints: observation.authority.appliedBlueprints,
        provisioningAttempts: observation.authority.provisioningAttempts ?? 0,
      },
      business: observation.business,
    },
    {
      result: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintGenerationRejected",
        sourceIntentBriefVersion: {
          tenantIdentity: intentBrief.tenantIdentity,
          ownerInterviewIdentity: ownerInterview.identity,
          intentBriefIdentity: intentBrief.identity,
          versionIdentity: intentBrief.versionIdentity,
        },
        diagnostics: [
          {
            code: "REFERENCE_SLICE.INPUT.UNKNOWN_FIELD",
            severity: "Blocking",
            field: "configurationOverrides",
            ownerSummaryPresent: true,
          },
        ],
        draftBlueprint: null,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
        },
      },
      observedAuthority: {
        blueprintVersions: 0,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("replacement Draft rejects undeclared nested source properties without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const firstGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: firstGenerated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);
  const requestedSourceBlueprint = {
    blueprintReference: priorDraft.blueprintReference,
    blueprintContentIdentity: priorDraft.blueprintContentIdentity,
  };

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
    sourceBlueprint: {
      ...requestedSourceBlueprint,
      configurationOverrides: {
        runtimeCode: "return fictitiousTenantState;",
      },
    },
  });
  const preserved = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      result: {
        kind: rejected.kind,
        mode: rejected.mode,
        sourceIntentBriefVersion: rejected.sourceIntentBriefVersion,
        requestedSourceBlueprint: rejected.requestedSourceBlueprint,
        diagnostics: rejected.diagnostics?.map(
          ({ code, severity, field, summary }) => ({
            code,
            severity,
            field,
            ownerSummaryPresent:
              typeof summary === "string" && summary.trim().length > 0,
          })
        ),
        draftBlueprint: rejected.draftBlueprint,
        authority: rejected.authority,
      },
      preserved: {
        draftBlueprint: preserved.draftBlueprint,
        reviewBundle: preserved.reviewBundle,
      },
      observedAuthority: {
        blueprintVersions: observation.authority.blueprintVersions,
        blueprintApprovals: observation.authority.blueprintApprovals,
        appliedBlueprints: observation.authority.appliedBlueprints,
        provisioningAttempts: observation.authority.provisioningAttempts ?? 0,
      },
      business: observation.business,
    },
    {
      result: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintGenerationRejected",
        sourceIntentBriefVersion: {
          tenantIdentity: intentBrief.tenantIdentity,
          ownerInterviewIdentity: ownerInterview.identity,
          intentBriefIdentity: intentBrief.identity,
          versionIdentity: intentBrief.versionIdentity,
        },
        requestedSourceBlueprint,
        diagnostics: [
          {
            code: "REFERENCE_SLICE.INPUT.UNKNOWN_FIELD",
            severity: "Blocking",
            field: "sourceBlueprint.configurationOverrides",
            ownerSummaryPresent: true,
          },
        ],
        draftBlueprint: null,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
        },
      },
      preserved: {
        draftBlueprint: priorDraft,
        reviewBundle: priorReviewBundle,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("replacement Draft rejects undeclared nested Blueprint Reference properties without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const firstGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: firstGenerated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);
  const requestedSourceBlueprint = {
    blueprintReference: {
      tenantIdentity: priorDraft.blueprintReference.tenantIdentity,
      blueprintIdentity: priorDraft.blueprintReference.blueprintIdentity,
      versionIdentity: priorDraft.blueprintReference.versionIdentity,
    },
    blueprintContentIdentity: priorDraft.blueprintContentIdentity,
  };

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
    sourceBlueprint: {
      blueprintReference: {
        ...requestedSourceBlueprint.blueprintReference,
        configurationOverrides: {
          runtimeCode: "return fictitiousTenantState;",
        },
      },
      blueprintContentIdentity:
        requestedSourceBlueprint.blueprintContentIdentity,
    },
  });
  const preserved = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      result: {
        kind: rejected.kind,
        mode: rejected.mode,
        sourceIntentBriefVersion: rejected.sourceIntentBriefVersion,
        requestedSourceBlueprint: rejected.requestedSourceBlueprint,
        diagnostics: rejected.diagnostics?.map(
          ({ code, severity, field, summary }) => ({
            code,
            severity,
            field,
            ownerSummaryPresent:
              typeof summary === "string" && summary.trim().length > 0,
          })
        ),
        draftBlueprint: rejected.draftBlueprint,
        authority: rejected.authority,
      },
      preserved: {
        draftBlueprint: preserved.draftBlueprint,
        reviewBundle: preserved.reviewBundle,
      },
      observedAuthority: {
        blueprintVersions: observation.authority.blueprintVersions,
        blueprintApprovals: observation.authority.blueprintApprovals,
        appliedBlueprints: observation.authority.appliedBlueprints,
        provisioningAttempts: observation.authority.provisioningAttempts ?? 0,
      },
      business: observation.business,
    },
    {
      result: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintGenerationRejected",
        sourceIntentBriefVersion: {
          tenantIdentity: intentBrief.tenantIdentity,
          ownerInterviewIdentity: ownerInterview.identity,
          intentBriefIdentity: intentBrief.identity,
          versionIdentity: intentBrief.versionIdentity,
        },
        requestedSourceBlueprint,
        diagnostics: [
          {
            code: "REFERENCE_SLICE.INPUT.UNKNOWN_FIELD",
            severity: "Blocking",
            field: "sourceBlueprint.blueprintReference.configurationOverrides",
            ownerSummaryPresent: true,
          },
        ],
        draftBlueprint: null,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
        },
      },
      preserved: {
        draftBlueprint: priorDraft,
        reviewBundle: priorReviewBundle,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review rejects latest selectors without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);
  const exactBlueprintReference = {
    tenantIdentity: priorDraft.blueprintReference.tenantIdentity,
    blueprintIdentity: priorDraft.blueprintReference.blueprintIdentity,
    versionIdentity: priorDraft.blueprintReference.versionIdentity,
  };

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: {
      ...exactBlueprintReference,
      latest: true,
    },
  });
  const preserved = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: exactBlueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      result: {
        kind: rejected.kind,
        mode: rejected.mode,
        blueprintReference: rejected.blueprintReference,
        diagnostics: rejected.diagnostics?.map(
          ({ code, severity, field, summary }) => ({
            code,
            severity,
            field,
            ownerSummaryPresent:
              typeof summary === "string" && summary.trim().length > 0,
          })
        ),
        draftBlueprint: rejected.draftBlueprint,
        authority: rejected.authority,
      },
      preserved: {
        draftBlueprint: preserved.draftBlueprint,
        reviewBundle: preserved.reviewBundle,
      },
      observedAuthority: {
        blueprintVersions: observation.authority.blueprintVersions,
        blueprintApprovals: observation.authority.blueprintApprovals,
        appliedBlueprints: observation.authority.appliedBlueprints,
        provisioningAttempts: observation.authority.provisioningAttempts ?? 0,
      },
      business: observation.business,
    },
    {
      result: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintReviewRejected",
        blueprintReference: exactBlueprintReference,
        diagnostics: [
          {
            code: "REFERENCE_SLICE.INPUT.UNKNOWN_FIELD",
            severity: "Blocking",
            field: "blueprintReference.latest",
            ownerSummaryPresent: true,
          },
        ],
        draftBlueprint: null,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
      },
      preserved: {
        draftBlueprint: priorDraft,
        reviewBundle: priorReviewBundle,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review returns an exact rejection for an unknown Version Identity without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);
  const unknownBlueprintReference = {
    tenantIdentity: priorDraft.blueprintReference.tenantIdentity,
    blueprintIdentity: priorDraft.blueprintReference.blueprintIdentity,
    versionIdentity: "ticket-03.identity.999",
  };
  assert.notEqual(
    unknownBlueprintReference.versionIdentity,
    priorDraft.blueprintReference.versionIdentity
  );

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: unknownBlueprintReference,
  });
  const preserved = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      result: {
        kind: rejected.kind,
        mode: rejected.mode,
        blueprintReference: rejected.blueprintReference,
        diagnostics: rejected.diagnostics?.map(
          ({ code, severity, summary }) => ({
            code,
            severity,
            ownerSummaryPresent:
              typeof summary === "string" && summary.trim().length > 0,
          })
        ),
        draftBlueprint: rejected.draftBlueprint,
        authority: rejected.authority,
      },
      preserved: {
        draftBlueprint: preserved.draftBlueprint,
        reviewBundle: preserved.reviewBundle,
      },
      observedAuthority: {
        blueprintVersions: observation.authority.blueprintVersions,
        blueprintApprovals: observation.authority.blueprintApprovals,
        appliedBlueprints: observation.authority.appliedBlueprints,
        provisioningAttempts: observation.authority.provisioningAttempts ?? 0,
      },
      business: observation.business,
    },
    {
      result: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintReviewRejected",
        blueprintReference: unknownBlueprintReference,
        diagnostics: [
          {
            code: "KERNEL.OBSERVATION.BLUEPRINT_UNKNOWN",
            severity: "Blocking",
            ownerSummaryPresent: true,
          },
        ],
        draftBlueprint: null,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
      },
      preserved: {
        draftBlueprint: priorDraft,
        reviewBundle: priorReviewBundle,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review returns an exact rejection for a different Tenant without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system);
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);
  const foreignTenantBlueprintReference = {
    tenantIdentity: "tenant.foreign-sandbox",
    blueprintIdentity: priorDraft.blueprintReference.blueprintIdentity,
    versionIdentity: priorDraft.blueprintReference.versionIdentity,
  };
  assert.notEqual(
    foreignTenantBlueprintReference.tenantIdentity,
    priorDraft.blueprintReference.tenantIdentity
  );

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: foreignTenantBlueprintReference,
  });
  const preserved = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const observation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    {
      result: {
        kind: rejected.kind,
        mode: rejected.mode,
        blueprintReference: rejected.blueprintReference,
        diagnostics: rejected.diagnostics?.map(
          ({ code, severity, summary }) => ({
            code,
            severity,
            ownerSummaryPresent:
              typeof summary === "string" && summary.trim().length > 0,
          })
        ),
        draftBlueprint: rejected.draftBlueprint,
        authority: rejected.authority,
      },
      preserved: {
        draftBlueprint: preserved.draftBlueprint,
        reviewBundle: preserved.reviewBundle,
      },
      observedAuthority: {
        blueprintVersions: observation.authority.blueprintVersions,
        blueprintApprovals: observation.authority.blueprintApprovals,
        appliedBlueprints: observation.authority.appliedBlueprints,
        provisioningAttempts: observation.authority.provisioningAttempts ?? 0,
      },
      business: observation.business,
    },
    {
      result: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintReviewRejected",
        blueprintReference: foreignTenantBlueprintReference,
        diagnostics: [
          {
            code: "KERNEL.OBSERVATION.TENANT_SCOPE_MISMATCH",
            severity: "Blocking",
            ownerSummaryPresent: true,
          },
        ],
        draftBlueprint: null,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
      },
      preserved: {
        draftBlueprint: priorDraft,
        reviewBundle: priorReviewBundle,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review exposes the exact retail and cafe Capability composition without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  const capabilitySelections =
    generated.reviewBundle.normalizedBlueprint.capabilitySelections;
  const targetCounts = {
    cafe: capabilitySelections.filter((selection) =>
      selection.enabledTargetIdentities?.includes("sandbox.cafe")
    ).length,
    retail: capabilitySelections.filter((selection) =>
      selection.enabledTargetIdentities?.includes("sandbox.retail")
    ).length,
  };

  assert.deepEqual(
    {
      capabilitySelections,
      targetCounts,
      authority: generated.authority,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed:
        Object.hasOwn(draftObservation, "effectiveBlueprint") ||
        Object.hasOwn(draftObservation, "effectiveBlueprints"),
      business: stateObservation.business,
    },
    {
      capabilitySelections: [
        {
          capabilityIdentity: "capability.cash",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.cash",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.catalog",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.catalog",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.inventory",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.inventory",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.kitchen-operations",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.kitchen-operations",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe"],
        },
        {
          capabilityIdentity: "capability.ledger",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.ledger",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.ordering",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.ordering",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.party-registry",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.party-registry",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.payment",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.payment",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.purchasing",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.purchasing",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.receiving",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.receiving",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.retail"],
        },
        {
          capabilityIdentity: "capability.sales",
          capabilityVersion: "1.0.0",
          configurationSchemaIdentity: "schema.capability.sales",
          configurationSchemaVersion: "1.0.0",
          configurationPointIdentity:
            "configuration-point.capability.selection",
          enabledTargetIdentities: ["sandbox.cafe", "sandbox.retail"],
        },
      ],
      targetCounts: { cafe: 9, retail: 10 },
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review exposes one complete closed retail and cafe configuration graph without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  const normalizedBlueprint = reviewed.reviewBundle.normalizedBlueprint;

  assert.deepEqual(
    {
      configurationGraph: {
        businessScope: normalizedBlueprint.businessScope,
        recordDefinitions: normalizedBlueprint.recordDefinitions,
        workflowDefinitions: normalizedBlueprint.workflowDefinitions,
        roleDefinitions: normalizedBlueprint.roleDefinitions,
        evidenceRules: normalizedBlueprint.evidenceRules,
        policyProfiles: normalizedBlueprint.policyProfiles,
        experienceConfiguration: normalizedBlueprint.experienceConfiguration,
        integrationConfiguration: normalizedBlueprint.integrationConfiguration,
      },
      authority: reviewed.authority,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed:
        Object.hasOwn(draftObservation, "effectiveBlueprint") ||
        Object.hasOwn(draftObservation, "effectiveBlueprints") ||
        Object.hasOwn(
          draftObservation.reviewBundle ?? {},
          "effectiveBlueprint"
        ) ||
        Object.hasOwn(
          draftObservation.reviewBundle ?? {},
          "effectiveBlueprints"
        ),
      business: stateObservation.business,
    },
    {
      configurationGraph: {
        businessScope: {
          configurationPointIdentity: "configuration-point.business-scope",
          tenantIdentity: "tenant.cedar-steam",
          businessKindIdentities: [
            "business-kind.cafe",
            "business-kind.retail",
          ],
          operatingCountryCodes: ["IQ"],
          locations: [
            {
              locationIdentity: "location.cafe",
              targetIdentity: "sandbox.cafe",
            },
            {
              locationIdentity: "location.retail",
              targetIdentity: "sandbox.retail",
            },
          ],
          languageCodes: ["ar", "en"],
          timeZoneIdentities: ["Asia/Baghdad"],
          currencyCodes: ["IQD"],
          normalizedUnits: ["each", "g", "ml"],
          tierIdentity: "business-tier.small-medium",
          fiscalProfileIdentity: "policy-profile.fiscal.not-applicable",
          explicitExclusions: [
            {
              value: "Production deployment",
              sourceAcceptanceConditionIdentity:
                "acceptance-condition.shared-reuse",
              intentState: "Confirmed",
            },
          ],
        },
        recordDefinitions: [
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
        ],
        workflowDefinitions: [
          {
            workflowIdentity: "workflow.fulfillment",
            workflowVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.workflow.selection",
            governedRecordIdentities: [
              "record.order",
              "record.payment",
              "record.sale",
            ],
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
            configurationPointIdentity:
              "configuration-point.workflow.selection",
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
                governedActionIdentity:
                  "governed-action.kitchen-ticket.fulfill",
              },
              {
                transitionIdentity: "transition.kitchen-ticket.mark-ready",
                fromStateIdentities: ["preparing"],
                toStateIdentity: "ready",
                governedActionIdentity:
                  "governed-action.kitchen-ticket.mark-ready",
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
            configurationPointIdentity:
              "configuration-point.workflow.selection",
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
                governedActionIdentity:
                  "governed-action.supplier-receipt.accept",
              },
              {
                transitionIdentity: "transition.purchase-order.confirm",
                fromStateIdentities: ["draft"],
                toStateIdentity: "confirmed",
                governedActionIdentity:
                  "governed-action.purchase-order.confirm",
              },
            ],
            roleIdentities: ["role.buyer", "role.receiver"],
            evidenceRuleIdentities: [],
          },
          {
            workflowIdentity: "workflow.supplier-receipt",
            workflowVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.workflow.selection",
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
                governedActionIdentity:
                  "governed-action.supplier-receipt.accept",
              },
            ],
            roleIdentities: ["role.receiver"],
            evidenceRuleIdentities: [
              "evidence-rule.supplier-receipt-acceptance",
            ],
          },
        ],
        roleDefinitions: [
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
            separationOfDutyConstraintIdentities: [
              "separation-of-duty.buyer-receiver",
            ],
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
            governedActionIdentities: [
              "governed-action.supplier-receipt.accept",
            ],
            workflowIdentities: [
              "workflow.purchase-order",
              "workflow.supplier-receipt",
            ],
            evidenceDutyIdentities: [
              "evidence-rule.supplier-receipt-acceptance",
            ],
            separationOfDutyConstraintIdentities: [
              "separation-of-duty.buyer-receiver",
            ],
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
        ],
        evidenceRules: [
          {
            evidenceRuleIdentity: "evidence-rule.payment-receipt",
            configurationPointIdentity:
              "configuration-point.evidence.requirement",
            recordIdentity: "record.payment",
            workflowIdentity: "workflow.fulfillment",
            governedActionIdentity: "governed-action.payment.accept",
            reviewerRoleIdentities: [
              "role.cafe-cashier",
              "role.retail-cashier",
            ],
            timing: "at-transition",
            retentionProfileIdentity: "retention-profile.sandbox-run",
          },
          {
            evidenceRuleIdentity: "evidence-rule.supplier-receipt-acceptance",
            configurationPointIdentity:
              "configuration-point.evidence.requirement",
            recordIdentity: "record.supplier-receipt",
            workflowIdentity: "workflow.supplier-receipt",
            governedActionIdentity: "governed-action.supplier-receipt.accept",
            reviewerRoleIdentities: ["role.receiver"],
            timing: "at-transition",
            retentionProfileIdentity: "retention-profile.sandbox-run",
          },
        ],
        policyProfiles: [
          {
            policyProfileIdentity: "kernel.policy.financial-stock-audit",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: {
              balancedLedgerEntriesRequired: true,
              immutableStockMovementsRequired: true,
            },
          },
          {
            policyProfileIdentity:
              "policy-profile.cash.accepted-payment-derived",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: { positionBasis: "accepted-payments" },
          },
          {
            policyProfileIdentity: "policy-profile.data-handling.sandbox-only",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: {
              dataKind: "fictitious",
              retentionProfileIdentity: "retention-profile.sandbox-run",
            },
          },
          {
            policyProfileIdentity: "policy-profile.external-ai.excluded",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: { exposure: "Excluded" },
          },
          {
            policyProfileIdentity: "policy-profile.fiscal.not-applicable",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: { disposition: "Not Applicable" },
          },
          {
            policyProfileIdentity:
              "policy-profile.inventory.moving-weighted-average",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: {
              costingMethod: "moving-weighted-average",
              normalizedQuantityPrecision: 3,
            },
          },
          {
            policyProfileIdentity: "policy-profile.payment.cash-allocation",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: { allocationMode: "explicit-obligation" },
          },
          {
            policyProfileIdentity:
              "policy-profile.purchasing.receipt-recognition",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: { recognitionPoint: "supplier-receipt-accepted" },
          },
          {
            policyProfileIdentity:
              "policy-profile.sales.fulfillment-recognition",
            policyProfileVersion: "1.0.0",
            configurationPointIdentity:
              "configuration-point.policy-profile.selection",
            parameters: { recognitionPoint: "sale-fulfilled" },
          },
        ],
        experienceConfiguration: {
          configurationPointIdentity:
            "configuration-point.experience.target-profile",
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
                  recordIdentities: [
                    "record.order",
                    "record.payment",
                    "record.sale",
                  ],
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
        },
        integrationConfiguration: {
          configurationPointIdentity:
            "configuration-point.integration.disposition",
          disposition: "Not Applicable",
          adapterBindings: [],
        },
      },
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

const r03TraceSource = Object.freeze({
  kind: "Owner",
  identity: "source.owner.cedar-steam",
  recordedTime: "2026-01-15T09:00:00.000Z",
});

const r03StatementReference = (factFamily) => ({
  statementIdentity: `intent-statement.${factFamily}`,
  intentState: "Confirmed",
  source: r03TraceSource,
});

const r03AcceptanceConditionReference = Object.freeze({
  acceptanceConditionIdentity: "acceptance-condition.shared-reuse",
  sourceStatementIdentity: "intent-statement.purpose-and-scope",
  intentState: "Confirmed",
  source: r03TraceSource,
});

const r03SandboxConstraintReference = Object.freeze({
  constraintIdentity: "constraint.sandbox-only",
  sourceAcceptanceConditionIdentity: "acceptance-condition.shared-reuse",
  sourceStatementIdentity: "intent-statement.purpose-and-scope",
  intentState: "Confirmed",
  source: r03TraceSource,
});

const r03ProductionExclusionReference = Object.freeze({
  value: "Production deployment",
  sourceAcceptanceConditionIdentity: "acceptance-condition.shared-reuse",
  sourceStatementIdentity: "intent-statement.purpose-and-scope",
  intentState: "Confirmed",
  source: r03TraceSource,
});

const r03ConfiguredTrace = ({
  sectionIdentity,
  schemaPath,
  configuredItemIdentity,
  configurationPointIdentity,
  sourceFactFamilies,
  acceptanceCondition = false,
  productionExclusion = false,
}) => ({
  kind: "ConfiguredItemIntentTrace",
  sectionIdentity,
  schemaPath,
  configuredItemIdentity,
  configurationPointIdentity,
  sourceStatementReferences: [...sourceFactFamilies]
    .sort()
    .map(r03StatementReference),
  acceptanceConditionReferences: acceptanceCondition
    ? [r03AcceptanceConditionReference]
    : [],
  assumptionReferences: [],
  constraintReferences: [r03SandboxConstraintReference],
  exclusionReferences: productionExclusion
    ? [r03ProductionExclusionReference]
    : [],
  unsupportedIntentReferences: [],
});

const r03ExpectedConfiguredItemTraces = [
  r03ConfiguredTrace({
    sectionIdentity: "businessScope",
    schemaPath: "/businessScope",
    configuredItemIdentity: "configuration-point.business-scope",
    configurationPointIdentity: "configuration-point.business-scope",
    sourceFactFamilies: [
      "business-shape",
      "experience-and-integrations",
      "money-and-accounting",
      "purpose-and-scope",
      "safety-and-jurisdiction",
    ],
    acceptanceCondition: true,
    productionExclusion: true,
  }),
  ...[
    ["capability.cash", ["money-and-accounting"]],
    [
      "capability.catalog",
      [
        "business-shape",
        "customer-and-fulfillment-journey",
        "supply-stock-and-capacity",
      ],
    ],
    ["capability.inventory", ["supply-stock-and-capacity"]],
    [
      "capability.kitchen-operations",
      ["customer-and-fulfillment-journey", "supply-stock-and-capacity"],
    ],
    ["capability.ledger", ["money-and-accounting"]],
    ["capability.ordering", ["customer-and-fulfillment-journey"]],
    [
      "capability.party-registry",
      ["customer-and-fulfillment-journey", "supply-stock-and-capacity"],
    ],
    [
      "capability.payment",
      ["customer-and-fulfillment-journey", "money-and-accounting"],
    ],
    ["capability.purchasing", ["supply-stock-and-capacity"]],
    ["capability.receiving", ["supply-stock-and-capacity"]],
    ["capability.sales", ["customer-and-fulfillment-journey"]],
  ].map(([configuredItemIdentity, sourceFactFamilies]) =>
    r03ConfiguredTrace({
      sectionIdentity: "capabilitySelections",
      schemaPath: `/capabilitySelections/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity: "configuration-point.capability.selection",
      sourceFactFamilies,
      acceptanceCondition: true,
    })
  ),
  ...[
    ["record.catalog-item", ["business-shape", "supply-stock-and-capacity"]],
    ["record.kitchen-ticket", ["customer-and-fulfillment-journey"]],
    ["record.ledger-entry", ["money-and-accounting"]],
    [
      "record.menu-item",
      ["customer-and-fulfillment-journey", "supply-stock-and-capacity"],
    ],
    ["record.modifier", ["customer-and-fulfillment-journey"]],
    ["record.order", ["customer-and-fulfillment-journey"], true],
    [
      "record.party",
      ["customer-and-fulfillment-journey", "supply-stock-and-capacity"],
    ],
    [
      "record.payment",
      ["customer-and-fulfillment-journey", "money-and-accounting"],
    ],
    ["record.posting-set", ["money-and-accounting"]],
    ["record.purchase-order", ["supply-stock-and-capacity"]],
    ["record.sale", ["customer-and-fulfillment-journey"]],
    ["record.stock-movement", ["supply-stock-and-capacity"]],
    ["record.supplier-receipt", ["supply-stock-and-capacity"]],
  ].map(([configuredItemIdentity, sourceFactFamilies, acceptanceCondition]) =>
    r03ConfiguredTrace({
      sectionIdentity: "recordDefinitions",
      schemaPath: `/recordDefinitions/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity: "configuration-point.record.selection",
      sourceFactFamilies,
      acceptanceCondition,
    })
  ),
  ...[
    ["workflow.fulfillment", ["customer-and-fulfillment-journey"], true],
    [
      "workflow.kitchen-ticket",
      ["customer-and-fulfillment-journey", "supply-stock-and-capacity"],
    ],
    ["workflow.purchase-order", ["supply-stock-and-capacity"]],
    ["workflow.supplier-receipt", ["supply-stock-and-capacity"]],
  ].map(([configuredItemIdentity, sourceFactFamilies, acceptanceCondition]) =>
    r03ConfiguredTrace({
      sectionIdentity: "workflowDefinitions",
      schemaPath: `/workflowDefinitions/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity: "configuration-point.workflow.selection",
      sourceFactFamilies,
      acceptanceCondition,
    })
  ),
  ...[
    ["role.buyer", ["people-and-governance", "supply-stock-and-capacity"]],
    [
      "role.cafe-cashier",
      [
        "customer-and-fulfillment-journey",
        "money-and-accounting",
        "people-and-governance",
      ],
    ],
    [
      "role.kitchen-operator",
      [
        "customer-and-fulfillment-journey",
        "people-and-governance",
        "supply-stock-and-capacity",
      ],
    ],
    ["role.owner", ["people-and-governance", "purpose-and-scope"], true],
    ["role.receiver", ["people-and-governance", "supply-stock-and-capacity"]],
    [
      "role.retail-cashier",
      [
        "customer-and-fulfillment-journey",
        "money-and-accounting",
        "people-and-governance",
      ],
    ],
  ].map(([configuredItemIdentity, sourceFactFamilies, acceptanceCondition]) =>
    r03ConfiguredTrace({
      sectionIdentity: "roleDefinitions",
      schemaPath: `/roleDefinitions/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity: "configuration-point.role.definition",
      sourceFactFamilies,
      acceptanceCondition,
    })
  ),
  ...[
    [
      "evidence-rule.payment-receipt",
      ["money-and-accounting", "people-and-governance"],
    ],
    [
      "evidence-rule.supplier-receipt-acceptance",
      ["people-and-governance", "supply-stock-and-capacity"],
    ],
  ].map(([configuredItemIdentity, sourceFactFamilies]) =>
    r03ConfiguredTrace({
      sectionIdentity: "evidenceRules",
      schemaPath: `/evidenceRules/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity: "configuration-point.evidence.requirement",
      sourceFactFamilies,
    })
  ),
  ...[
    [
      "kernel.policy.financial-stock-audit",
      ["money-and-accounting", "supply-stock-and-capacity"],
    ],
    ["policy-profile.cash.accepted-payment-derived", ["money-and-accounting"]],
    ["policy-profile.data-handling.sandbox-only", ["safety-and-jurisdiction"]],
    ["policy-profile.external-ai.excluded", ["safety-and-jurisdiction"]],
    [
      "policy-profile.fiscal.not-applicable",
      ["business-shape", "money-and-accounting", "safety-and-jurisdiction"],
    ],
    [
      "policy-profile.inventory.moving-weighted-average",
      ["supply-stock-and-capacity"],
    ],
    ["policy-profile.payment.cash-allocation", ["money-and-accounting"]],
    [
      "policy-profile.purchasing.receipt-recognition",
      ["supply-stock-and-capacity"],
    ],
    [
      "policy-profile.sales.fulfillment-recognition",
      ["customer-and-fulfillment-journey"],
    ],
  ].map(([configuredItemIdentity, sourceFactFamilies]) =>
    r03ConfiguredTrace({
      sectionIdentity: "policyProfiles",
      schemaPath: `/policyProfiles/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity:
        "configuration-point.policy-profile.selection",
      sourceFactFamilies,
    })
  ),
  ...["sandbox.cafe", "sandbox.retail"].map((configuredItemIdentity) =>
    r03ConfiguredTrace({
      sectionIdentity: "experienceConfiguration",
      schemaPath: `/experienceConfiguration/targetProfiles/${configuredItemIdentity}`,
      configuredItemIdentity,
      configurationPointIdentity:
        "configuration-point.experience.target-profile",
      sourceFactFamilies: [
        "customer-and-fulfillment-journey",
        "experience-and-integrations",
        "people-and-governance",
        "supply-stock-and-capacity",
      ],
      acceptanceCondition: true,
    })
  ),
  r03ConfiguredTrace({
    sectionIdentity: "integrationConfiguration",
    schemaPath: "/integrationConfiguration",
    configuredItemIdentity: "configuration-point.integration.disposition",
    configurationPointIdentity: "configuration-point.integration.disposition",
    sourceFactFamilies: [
      "experience-and-integrations",
      "safety-and-jurisdiction",
    ],
  }),
];

const r03ExpectedStatementTraces = [
  "purpose-and-scope",
  "safety-and-jurisdiction",
  "business-shape",
  "customer-and-fulfillment-journey",
  "supply-stock-and-capacity",
  "people-and-governance",
  "money-and-accounting",
  "experience-and-integrations",
].map((factFamily) => ({
  statementIdentity: `intent-statement.${factFamily}`,
  intentState: "Confirmed",
  source: r03TraceSource,
}));

const r03ConfiguredGraphCoordinates = (normalizedBlueprint) => [
  {
    sectionIdentity: "businessScope",
    schemaPath: "/businessScope",
    configuredItemIdentity:
      normalizedBlueprint.businessScope.configurationPointIdentity,
    configurationPointIdentity:
      normalizedBlueprint.businessScope.configurationPointIdentity,
  },
  ...normalizedBlueprint.capabilitySelections.map((item) => ({
    sectionIdentity: "capabilitySelections",
    schemaPath: `/capabilitySelections/${item.capabilityIdentity}`,
    configuredItemIdentity: item.capabilityIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...normalizedBlueprint.recordDefinitions.map((item) => ({
    sectionIdentity: "recordDefinitions",
    schemaPath: `/recordDefinitions/${item.recordIdentity}`,
    configuredItemIdentity: item.recordIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...normalizedBlueprint.workflowDefinitions.map((item) => ({
    sectionIdentity: "workflowDefinitions",
    schemaPath: `/workflowDefinitions/${item.workflowIdentity}`,
    configuredItemIdentity: item.workflowIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...normalizedBlueprint.roleDefinitions.map((item) => ({
    sectionIdentity: "roleDefinitions",
    schemaPath: `/roleDefinitions/${item.roleIdentity}`,
    configuredItemIdentity: item.roleIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...normalizedBlueprint.evidenceRules.map((item) => ({
    sectionIdentity: "evidenceRules",
    schemaPath: `/evidenceRules/${item.evidenceRuleIdentity}`,
    configuredItemIdentity: item.evidenceRuleIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...normalizedBlueprint.policyProfiles.map((item) => ({
    sectionIdentity: "policyProfiles",
    schemaPath: `/policyProfiles/${item.policyProfileIdentity}`,
    configuredItemIdentity: item.policyProfileIdentity,
    configurationPointIdentity: item.configurationPointIdentity,
  })),
  ...normalizedBlueprint.experienceConfiguration.targetProfiles.map((item) => ({
    sectionIdentity: "experienceConfiguration",
    schemaPath: `/experienceConfiguration/targetProfiles/${item.targetIdentity}`,
    configuredItemIdentity: item.targetIdentity,
    configurationPointIdentity:
      normalizedBlueprint.experienceConfiguration.configurationPointIdentity,
  })),
  {
    sectionIdentity: "integrationConfiguration",
    schemaPath: "/integrationConfiguration",
    configuredItemIdentity:
      normalizedBlueprint.integrationConfiguration.configurationPointIdentity,
    configurationPointIdentity:
      normalizedBlueprint.integrationConfiguration.configurationPointIdentity,
  },
];

test("Draft review traces every configured item to attributable Confirmed intent without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const normalizedBlueprint = reviewed.reviewBundle.normalizedBlueprint;
  const intentTraceability = normalizedBlueprint.intentTraceability;
  const statementTraces = intentTraceability.filter((entry) =>
    Object.hasOwn(entry, "statementIdentity")
  );
  const configuredItemTraces = intentTraceability.filter(
    (entry) => entry.kind === "ConfiguredItemIntentTrace"
  );
  const expectedCoordinates = r03ExpectedConfiguredItemTraces.map(
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
  const configuredGraphCoordinates =
    r03ConfiguredGraphCoordinates(normalizedBlueprint);
  const configuredTracePaths = configuredItemTraces.map(
    (entry) => entry.schemaPath
  );
  const expectedTracePaths = r03ExpectedConfiguredItemTraces.map(
    (entry) => entry.schemaPath
  );
  const normalizedForComparison = (value) =>
    JSON.stringify(canonicalizeIndependently(value));

  assert.deepEqual(
    {
      statementTraces,
      configuredItemTraces,
      configuredGraphCoordinates,
      configuredTracePaths,
      uniqueConfiguredTracePaths: [...new Set(configuredTracePaths)],
      configuredTraceCount: configuredItemTraces.length,
      immutableDraftMatchesNormalized:
        normalizedForComparison(
          generated.draftBlueprint.version.intentTraceability
        ) === normalizedForComparison(intentTraceability),
      repeatedReviewMatchesNormalized:
        normalizedForComparison(
          reviewedAgain.reviewBundle.normalizedBlueprint.intentTraceability
        ) === normalizedForComparison(intentTraceability),
      authority: reviewed.authority,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed:
        Object.hasOwn(draftObservation, "effectiveBlueprint") ||
        Object.hasOwn(draftObservation, "effectiveBlueprints") ||
        Object.hasOwn(
          draftObservation.reviewBundle ?? {},
          "effectiveBlueprint"
        ) ||
        Object.hasOwn(
          draftObservation.reviewBundle ?? {},
          "effectiveBlueprints"
        ),
      business: stateObservation.business,
    },
    {
      statementTraces: r03ExpectedStatementTraces,
      configuredItemTraces: r03ExpectedConfiguredItemTraces,
      configuredGraphCoordinates: expectedCoordinates,
      configuredTracePaths: expectedTracePaths,
      uniqueConfiguredTracePaths: expectedTracePaths,
      configuredTraceCount: 49,
      immutableDraftMatchesNormalized: true,
      repeatedReviewMatchesNormalized: true,
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

const r03ExpectedSharedReuseConfiguredItemReferences =
  r03ExpectedConfiguredItemTraces
    .filter((entry) =>
      entry.acceptanceConditionReferences.some(
        (reference) =>
          reference.acceptanceConditionIdentity ===
          "acceptance-condition.shared-reuse"
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

const r03ExpectedRequiredAcceptanceConditionTrace = Object.freeze({
  kind: "RequiredAcceptanceConditionIntentTrace",
  acceptanceConditionIdentity: "acceptance-condition.shared-reuse",
  sourceStatementIdentity: "intent-statement.purpose-and-scope",
  intentState: "Confirmed",
  source: r03TraceSource,
  criticality: "Required",
  reviewerIdentity: "source.owner.cedar-steam",
  evidenceRequired: ["Owner-reviewable traceability"],
  scope: {
    roleIdentities: ["role.owner"],
    locationIdentities: ["location.cafe", "location.retail"],
    recordIdentities: ["record.order"],
    workflowIdentities: ["workflow.fulfillment"],
  },
  coverageDisposition: "Supported",
  configuredItemReferences: r03ExpectedSharedReuseConfiguredItemReferences,
  unresolvedConfiguredItemReferences: [],
  unsupportedConfiguredItemReferences: [],
  futureEvidencePaths: [
    {
      futureEvidencePathIdentity:
        "future-evidence-path.shared-reuse.owner-reviewable-traceability",
      futureEvidencePathVersion: "1.0.0",
      evidenceRequirement: "Owner-reviewable traceability",
      expectedEvidenceKind: "ReferenceSliceAcceptanceReport",
      evaluatorIdentity: "reference-slice.acceptance-suite",
      evaluatorVersion: "1.0.0",
      evaluationStage: "ReferenceVerticalSliceAcceptance",
      targetIdentities: ["sandbox.cafe", "sandbox.retail"],
      startingContext: "A fresh fictitious Tenant.",
      governedBusinessAction: "Review one later Draft Blueprint proposal.",
      observableResult: "Both business kinds trace to shared Capabilities.",
      passCondition: "No tenant-specific executable behavior is required.",
      failureCondition: "A business kind requires tenant runtime code.",
      responsibleReviewerIdentity: "source.owner.cedar-steam",
      disposition: "Declared",
      evidenceReferences: [],
    },
  ],
  assumptionReferences: [],
  constraintReferences: [r03SandboxConstraintReference],
  exclusionReferences: [r03ProductionExclusionReference],
  unsupportedIntentReferences: [],
});

test("Draft review maps every Required Acceptance Condition to supported configuration and a declared future Evidence path without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const normalizedBlueprint = reviewed.reviewBundle.normalizedBlueprint;
  const normalizedIntentTraceability = normalizedBlueprint.intentTraceability;
  const immutableIntentTraceability =
    generated.draftBlueprint.version.intentTraceability;
  const repeatedIntentTraceability =
    reviewedAgain.reviewBundle.normalizedBlueprint.intentTraceability;
  const statementTraces = normalizedIntentTraceability.filter((entry) =>
    Object.hasOwn(entry, "statementIdentity")
  );
  const configuredItemTraces = normalizedIntentTraceability.filter(
    (entry) => entry.kind === "ConfiguredItemIntentTrace"
  );
  const requiredAcceptanceConditionTraces = normalizedIntentTraceability.filter(
    (entry) => entry.kind === "RequiredAcceptanceConditionIntentTrace"
  );
  const immutableRequiredAcceptanceConditionTraces =
    immutableIntentTraceability.filter(
      (entry) => entry.kind === "RequiredAcceptanceConditionIntentTrace"
    );
  const repeatedRequiredAcceptanceConditionTraces =
    repeatedIntentTraceability.filter(
      (entry) => entry.kind === "RequiredAcceptanceConditionIntentTrace"
    );
  const forwardConfiguredItemReferences = configuredItemTraces
    .filter((entry) =>
      entry.acceptanceConditionReferences.some(
        (reference) =>
          reference.acceptanceConditionIdentity ===
          "acceptance-condition.shared-reuse"
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
  const reverseConfiguredItemReferences =
    requiredAcceptanceConditionTraces[0]?.configuredItemReferences ?? [];
  const reverseConfiguredItemPaths = reverseConfiguredItemReferences.map(
    (reference) => reference.schemaPath
  );
  const expectedReverseConfiguredItemPaths =
    r03ExpectedSharedReuseConfiguredItemReferences.map(
      (reference) => reference.schemaPath
    );
  const coverageConditionIdentities =
    reviewed.reviewBundle.acceptanceConditionCoverage.requiredAcceptanceConditions.map(
      (condition) => condition.acceptanceConditionIdentity
    );
  const reverseConditionIdentities = requiredAcceptanceConditionTraces.map(
    (trace) => trace.acceptanceConditionIdentity
  );
  const normalizedForComparison = (value) =>
    JSON.stringify(canonicalizeIndependently(value));

  assert.deepEqual(
    {
      statementTraces,
      configuredItemTraces,
      requiredAcceptanceConditionTraces,
      forwardConfiguredItemReferences,
      reverseConfiguredItemReferences,
      reverseConfiguredItemPaths,
      uniqueReverseConfiguredItemPaths: [
        ...new Set(reverseConfiguredItemPaths),
      ],
      immutableDraftMatchesNormalized:
        normalizedForComparison(immutableRequiredAcceptanceConditionTraces) ===
        normalizedForComparison(requiredAcceptanceConditionTraces),
      repeatedReviewMatchesNormalized:
        normalizedForComparison(repeatedRequiredAcceptanceConditionTraces) ===
        normalizedForComparison(requiredAcceptanceConditionTraces),
      coverageConditionIdentities,
      reverseConditionIdentities,
      authority: reviewed.authority,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed:
        Object.hasOwn(draftObservation, "effectiveBlueprint") ||
        Object.hasOwn(draftObservation, "effectiveBlueprints") ||
        Object.hasOwn(
          draftObservation.reviewBundle ?? {},
          "effectiveBlueprint"
        ) ||
        Object.hasOwn(
          draftObservation.reviewBundle ?? {},
          "effectiveBlueprints"
        ),
      business: stateObservation.business,
    },
    {
      statementTraces: r03ExpectedStatementTraces,
      configuredItemTraces: r03ExpectedConfiguredItemTraces,
      requiredAcceptanceConditionTraces: [
        r03ExpectedRequiredAcceptanceConditionTrace,
      ],
      forwardConfiguredItemReferences:
        r03ExpectedSharedReuseConfiguredItemReferences,
      reverseConfiguredItemReferences:
        r03ExpectedSharedReuseConfiguredItemReferences,
      reverseConfiguredItemPaths: expectedReverseConfiguredItemPaths,
      uniqueReverseConfiguredItemPaths: expectedReverseConfiguredItemPaths,
      immutableDraftMatchesNormalized: true,
      repeatedReviewMatchesNormalized: true,
      coverageConditionIdentities: ["acceptance-condition.shared-reuse"],
      reverseConditionIdentities: ["acceptance-condition.shared-reuse"],
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review binds validation to exact schema, Capability, canonicalization, policy, and engine versions without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const configurationValidationReport = {
    kind: "ConfigurationValidationReport",
    blueprintReference,
    blueprintContentIdentity,
    verdict: "Valid",
    diagnostics: [],
  };
  const validationVersionSet = {
    blueprintConfigurationSchema: {
      machineIdentity: "schema.business-blueprint",
      version: "1.0.0",
    },
    selectedCapabilityBindings: [
      {
        capabilityIdentity: "capability.cash",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.cash",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.catalog",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.catalog",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.inventory",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.inventory",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.kitchen-operations",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.kitchen-operations",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.ledger",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.ledger",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.ordering",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.ordering",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.party-registry",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.party-registry",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.payment",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.payment",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.purchasing",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.purchasing",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.receiving",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.receiving",
        configurationSchemaVersion: "1.0.0",
      },
      {
        capabilityIdentity: "capability.sales",
        capabilityVersion: "1.0.0",
        configurationSchemaIdentity: "schema.capability.sales",
        configurationSchemaVersion: "1.0.0",
      },
    ],
    canonicalizationRules: {
      machineIdentity: "canonicalization.blueprint-content",
      version: "1.0.0",
    },
    validatorPolicy: {
      machineIdentity: "validator-policy.configuration",
      version: "1.0.0",
    },
    validationEngine: {
      machineIdentity: "validator.configuration",
      version: "1.0.0",
    },
  };
  const expectedBinding = {
    kind: "ConfigurationValidationReportBinding",
    blueprintReference,
    blueprintContentIdentity,
    configurationValidationReportContentIdentity:
      independentlyRecomputedContentIdentity(configurationValidationReport),
    validationVersionSet,
    validationVersionSetContentIdentity:
      independentlyRecomputedContentIdentity(validationVersionSet),
    validationTime: "2026-01-15T09:00:00.000Z",
    responsibleKernelSource: {
      machineIdentity: "kernel.business",
      version: "1.0.0",
      contentIdentity:
        "sha256:930c1c3c96ff0551a58b6a132fdf352a1be16d4a60b5b5f99386f31ccc47ffac",
    },
  };
  const binding =
    reviewed.reviewBundle.configurationValidationReportBinding ?? null;
  const repeatedBinding =
    reviewedAgain.reviewBundle.configurationValidationReportBinding ?? null;
  const observedBinding =
    draftObservation.reviewBundle.configurationValidationReportBinding ?? null;
  const effectiveBlueprintMaterialExposed = [
    generated,
    reviewed,
    reviewedAgain,
    draftObservation,
    generated.reviewBundle,
    reviewed.reviewBundle,
    reviewedAgain.reviewBundle,
    draftObservation.reviewBundle,
  ].some(
    (material) =>
      Object.hasOwn(material ?? {}, "effectiveBlueprint") ||
      Object.hasOwn(material ?? {}, "effectiveBlueprints")
  );

  assert.deepEqual(
    {
      configurationValidationReport:
        reviewed.reviewBundle.configurationValidationReport,
      binding,
      repeatedBinding,
      observedBinding,
      reportContentIdentityRecomputes:
        binding?.configurationValidationReportContentIdentity ===
        independentlyRecomputedContentIdentity(configurationValidationReport),
      versionSetContentIdentityRecomputes:
        binding?.validationVersionSetContentIdentity ===
        independentlyRecomputedContentIdentity(
          binding?.validationVersionSet ?? null
        ),
      bindingInsideImmutableBlueprint: Object.hasOwn(
        generated.draftBlueprint.version,
        "configurationValidationReportBinding"
      ),
      bindingInsideNormalizedBlueprint: Object.hasOwn(
        reviewed.reviewBundle.normalizedBlueprint,
        "configurationValidationReportBinding"
      ),
      authority: reviewed.authority,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed,
      business: stateObservation.business,
    },
    {
      configurationValidationReport,
      binding: expectedBinding,
      repeatedBinding: expectedBinding,
      observedBinding: expectedBinding,
      reportContentIdentityRecomputes: true,
      versionSetContentIdentityRecomputes: true,
      bindingInsideImmutableBlueprint: false,
      bindingInsideNormalizedBlueprint: false,
      authority: {
        blueprintApproval: false,
        appliedBlueprint: false,
        provisioning: false,
        businessTruth: false,
        reviewApprovesBlueprint: false,
      },
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft diagnostic review reports one content-bound unsupported Capability version with stable code and path without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const originalDraft = structuredClone(generated.draftBlueprint);
  const originalReviewBundle = structuredClone(reviewed.reviewBundle);
  const sourceBlueprint = {
    blueprintReference,
    blueprintContentIdentity,
  };
  const candidateNormalizedBlueprint = structuredClone(
    reviewed.reviewBundle.normalizedBlueprint
  );
  candidateNormalizedBlueprint.capabilitySelections =
    candidateNormalizedBlueprint.capabilitySelections.map((selection) =>
      selection.capabilityIdentity === "capability.cash"
        ? { ...selection, capabilityVersion: "2.0.0" }
        : selection
    );
  const receivedCandidateFingerprint = independentlyRecomputedContentIdentity(
    candidateNormalizedBlueprint
  );
  const validationCandidateAction = {
    type: "reference-slice.review-draft-blueprint-validation-candidate",
    sourceBlueprint,
    candidate: {
      normalizedBlueprint: candidateNormalizedBlueprint,
      receivedCandidateFingerprint,
    },
  };

  const diagnosticReview = await system.referenceSlice.dispatch(
    structuredClone(validationCandidateAction)
  );
  const repeatedDiagnosticReview = await system.referenceSlice.dispatch(
    structuredClone(validationCandidateAction)
  );
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const validationVersionSet =
    originalReviewBundle.configurationValidationReportBinding
      .validationVersionSet;
  const validationVersionSetContentIdentity =
    originalReviewBundle.configurationValidationReportBinding
      .validationVersionSetContentIdentity;
  const expectedDiagnostic = {
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
        statementIdentity: "intent-statement.money-and-accounting",
        intentState: "Confirmed",
        source: r03TraceSource,
      },
    ],
    acceptanceConditionReferences: [r03AcceptanceConditionReference],
    boundValidationVersionSet: validationVersionSet,
    boundValidationVersionSetContentIdentity:
      validationVersionSetContentIdentity,
  };
  const expectedConfigurationValidationReport = {
    kind: "ConfigurationValidationReport",
    sourceBlueprint,
    receivedCandidateFingerprint,
    approvalEligibleBlueprintContentIdentity: null,
    contentIdentityDisposition: "UnavailableBecauseInvalid",
    verdict: "Invalid",
    diagnostics: [expectedDiagnostic],
  };
  const expectedConfigurationValidationReportBinding = {
    kind: "ConfigurationValidationReportBinding",
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationValidationReportContentIdentity:
      independentlyRecomputedContentIdentity(
        expectedConfigurationValidationReport
      ),
    validationVersionSet,
    validationVersionSetContentIdentity,
    validationTime: "2026-01-15T09:00:00.000Z",
    responsibleKernelSource: {
      machineIdentity: "kernel.business",
      version: "1.0.0",
      contentIdentity:
        "sha256:930c1c3c96ff0551a58b6a132fdf352a1be16d4a60b5b5f99386f31ccc47ffac",
    },
  };
  const expectedDiagnosticReview = {
    kind: "ReferenceSliceView",
    mode: "DraftBlueprintValidationCandidateReview",
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationValidationReport: expectedConfigurationValidationReport,
    configurationValidationReportBinding:
      expectedConfigurationValidationReportBinding,
    authority: {
      blueprintApproval: false,
      appliedBlueprint: false,
      provisioning: false,
      businessTruth: false,
      reviewApprovesBlueprint: false,
    },
  };
  const restoredCandidate = structuredClone(candidateNormalizedBlueprint);
  restoredCandidate.capabilitySelections =
    restoredCandidate.capabilitySelections.map((selection) =>
      selection.capabilityIdentity === "capability.cash"
        ? { ...selection, capabilityVersion: "1.0.0" }
        : selection
    );
  const actualDiagnostic =
    diagnosticReview.configurationValidationReport?.diagnostics?.[0] ?? null;
  const actualBinding =
    diagnosticReview.configurationValidationReportBinding ?? null;
  const effectiveBlueprintMaterialExposed = [
    generated,
    reviewed,
    diagnosticReview,
    repeatedDiagnosticReview,
    draftObservation,
    generated.reviewBundle,
    reviewed.reviewBundle,
    draftObservation.reviewBundle,
  ].some(
    (material) =>
      Object.hasOwn(material ?? {}, "effectiveBlueprint") ||
      Object.hasOwn(material ?? {}, "effectiveBlueprints")
  );

  assert.deepEqual(
    {
      diagnosticReview,
      repeatedDiagnosticReview,
      receivedCandidateFingerprintRecomputes:
        diagnosticReview.receivedCandidateFingerprint ===
        independentlyRecomputedContentIdentity(candidateNormalizedBlueprint),
      reportContentIdentityRecomputes:
        actualBinding?.configurationValidationReportContentIdentity ===
        independentlyRecomputedContentIdentity(
          diagnosticReview.configurationValidationReport
        ),
      versionSetContentIdentityRecomputes:
        actualBinding?.validationVersionSetContentIdentity ===
        independentlyRecomputedContentIdentity(
          actualBinding?.validationVersionSet ?? null
        ),
      diagnosticPropertyNames: Object.keys(actualDiagnostic ?? {}).sort(),
      candidateCashVersion:
        candidateNormalizedBlueprint.capabilitySelections.find(
          (selection) => selection.capabilityIdentity === "capability.cash"
        )?.capabilityVersion,
      sourceCashVersion:
        reviewed.reviewBundle.normalizedBlueprint.capabilitySelections.find(
          (selection) => selection.capabilityIdentity === "capability.cash"
        )?.capabilityVersion,
      candidateOnlyChangesCashVersion:
        JSON.stringify(canonicalizeIndependently(restoredCandidate)) ===
        JSON.stringify(
          canonicalizeIndependently(reviewed.reviewBundle.normalizedBlueprint)
        ),
      storedDraft: draftObservation.draftBlueprint,
      storedReviewBundle: draftObservation.reviewBundle,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed,
      business: stateObservation.business,
    },
    {
      diagnosticReview: expectedDiagnosticReview,
      repeatedDiagnosticReview: expectedDiagnosticReview,
      receivedCandidateFingerprintRecomputes: true,
      reportContentIdentityRecomputes: true,
      versionSetContentIdentityRecomputes: true,
      diagnosticPropertyNames: [
        "acceptanceConditionReferences",
        "affectedObjectIdentity",
        "boundValidationVersionSet",
        "boundValidationVersionSetContentIdentity",
        "category",
        "code",
        "intentBriefStatementReferences",
        "ownerFacingSummary",
        "relatedIdentities",
        "relatedPaths",
        "remediationCategory",
        "schemaPath",
        "severity",
        "technicalExplanation",
        "validationLayer",
      ],
      candidateCashVersion: "2.0.0",
      sourceCashVersion: "1.0.0",
      candidateOnlyChangesCashVersion: true,
      storedDraft: originalDraft,
      storedReviewBundle: originalReviewBundle,
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft candidate canonicalization produces one comparable canonical tree from schema-declared representation differences without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const originalDraft = structuredClone(generated.draftBlueprint);
  const originalReviewBundle = structuredClone(reviewed.reviewBundle);
  const sourceBlueprint = {
    blueprintReference,
    blueprintContentIdentity,
  };
  const candidateNormalizedBlueprint = reverseSerializationOrder(
    structuredClone(reviewed.reviewBundle.normalizedBlueprint)
  );
  candidateNormalizedBlueprint.capabilitySelections = [
    ...candidateNormalizedBlueprint.capabilitySelections,
  ].reverse();
  const receivedCandidateFingerprint = independentlyRecomputedContentIdentity(
    candidateNormalizedBlueprint
  );
  const candidateWithStableCapabilityOrder = structuredClone(
    candidateNormalizedBlueprint
  );
  candidateWithStableCapabilityOrder.capabilitySelections = [
    ...candidateWithStableCapabilityOrder.capabilitySelections,
  ].sort((left, right) =>
    left.capabilityIdentity.localeCompare(right.capabilityIdentity)
  );
  const validationCandidateAction = {
    type: "reference-slice.review-draft-blueprint-validation-candidate",
    sourceBlueprint,
    candidate: {
      normalizedBlueprint: candidateNormalizedBlueprint,
      receivedCandidateFingerprint,
    },
  };

  const candidateReview = await system.referenceSlice.dispatch(
    structuredClone(validationCandidateAction)
  );
  const repeatedCandidateReview = await system.referenceSlice.dispatch(
    structuredClone(validationCandidateAction)
  );
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const validationVersionSet =
    originalReviewBundle.configurationValidationReportBinding
      .validationVersionSet;
  const validationVersionSetContentIdentity =
    originalReviewBundle.configurationValidationReportBinding
      .validationVersionSetContentIdentity;
  const expectedCandidateCanonicalization = {
    kind: "BlueprintCandidateCanonicalization",
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationSchemaIdentity: "schema.business-blueprint",
    configurationSchemaVersion: "1.0.0",
    canonicalizationRules: {
      machineIdentity: "canonicalization.blueprint-content",
      version: "1.0.0",
    },
    comparisonBaseline: sourceBlueprint,
    comparisonDisposition: "ComparableUnderSameSchema",
    normalizedBlueprint: originalReviewBundle.normalizedBlueprint,
    candidateBlueprintContentIdentity: blueprintContentIdentity,
    normalizationResults: [
      {
        schemaPath: "/",
        ruleIdentity: "canonicalization-rule.object-key-order",
        disposition: "Normalized",
      },
      {
        schemaPath: "/capabilitySelections",
        ruleIdentity: "canonicalization-rule.unordered-stable-identity-order",
        stableIdentityField: "capabilityIdentity",
        disposition: "Normalized",
      },
    ],
  };
  const expectedConfigurationValidationReport = {
    kind: "ConfigurationValidationReport",
    sourceBlueprint,
    receivedCandidateFingerprint,
    approvalEligibleBlueprintContentIdentity: blueprintContentIdentity,
    contentIdentityDisposition: "AvailableAfterCanonicalization",
    verdict: "Valid",
    diagnostics: [],
  };
  const expectedConfigurationValidationReportBinding = {
    kind: "ConfigurationValidationReportBinding",
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationValidationReportContentIdentity:
      independentlyRecomputedContentIdentity(
        expectedConfigurationValidationReport
      ),
    validationVersionSet,
    validationVersionSetContentIdentity,
    validationTime: "2026-01-15T09:00:00.000Z",
    responsibleKernelSource: {
      machineIdentity: "kernel.business",
      version: "1.0.0",
      contentIdentity:
        "sha256:930c1c3c96ff0551a58b6a132fdf352a1be16d4a60b5b5f99386f31ccc47ffac",
    },
  };
  const actualCanonicalization =
    candidateReview.candidateCanonicalization ?? null;
  const actualReport = candidateReview.configurationValidationReport ?? null;
  const actualBinding =
    candidateReview.configurationValidationReportBinding ?? null;
  const effectiveBlueprintMaterialExposed = [
    generated,
    reviewed,
    candidateReview,
    repeatedCandidateReview,
    draftObservation,
    generated.reviewBundle,
    reviewed.reviewBundle,
    draftObservation.reviewBundle,
  ].some(
    (material) =>
      Object.hasOwn(material ?? {}, "effectiveBlueprint") ||
      Object.hasOwn(material ?? {}, "effectiveBlueprints")
  );

  assert.deepEqual(
    {
      candidateReview: {
        kind: candidateReview.kind,
        mode: candidateReview.mode,
        sourceBlueprint: candidateReview.sourceBlueprint,
        receivedCandidateFingerprint:
          candidateReview.receivedCandidateFingerprint,
        candidateCanonicalization: actualCanonicalization,
        configurationValidationReport: actualReport,
        configurationValidationReportBinding: actualBinding,
        authority: candidateReview.authority,
      },
      repeatedCandidateReview,
      receivedCandidateFingerprintRecomputes:
        receivedCandidateFingerprint ===
        independentlyRecomputedContentIdentity(candidateNormalizedBlueprint),
      receivedFingerprintDiffersFromCanonicalContent:
        receivedCandidateFingerprint !== blueprintContentIdentity,
      representationOnlyCandidate:
        JSON.stringify(
          canonicalizeIndependently(candidateWithStableCapabilityOrder)
        ) ===
        JSON.stringify(
          canonicalizeIndependently(originalReviewBundle.normalizedBlueprint)
        ),
      canonicalContentIdentityRecomputes:
        actualCanonicalization?.candidateBlueprintContentIdentity ===
        independentlyRecomputedContentIdentity(
          actualCanonicalization?.normalizedBlueprint ?? null
        ),
      reportContentIdentityRecomputes:
        actualBinding?.configurationValidationReportContentIdentity ===
        independentlyRecomputedContentIdentity(actualReport),
      versionSetContentIdentityRecomputes:
        actualBinding?.validationVersionSetContentIdentity ===
        independentlyRecomputedContentIdentity(
          actualBinding?.validationVersionSet ?? null
        ),
      candidateExposesDraftMaterial:
        Object.hasOwn(candidateReview, "draftBlueprint") ||
        Object.hasOwn(candidateReview, "blueprintLifecycle"),
      storedDraft: draftObservation.draftBlueprint,
      storedReviewBundle: draftObservation.reviewBundle,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed,
      business: stateObservation.business,
    },
    {
      candidateReview: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintValidationCandidateReview",
        sourceBlueprint,
        receivedCandidateFingerprint,
        candidateCanonicalization: expectedCandidateCanonicalization,
        configurationValidationReport: expectedConfigurationValidationReport,
        configurationValidationReportBinding:
          expectedConfigurationValidationReportBinding,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
      },
      repeatedCandidateReview: candidateReview,
      receivedCandidateFingerprintRecomputes: true,
      receivedFingerprintDiffersFromCanonicalContent: true,
      representationOnlyCandidate: true,
      canonicalContentIdentityRecomputes: true,
      reportContentIdentityRecomputes: true,
      versionSetContentIdentityRecomputes: true,
      candidateExposesDraftMaterial: false,
      storedDraft: originalDraft,
      storedReviewBundle: originalReviewBundle,
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft candidate Semantic Diff reports no semantic change after schema-declared representation normalization without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const blueprintReference = generated.draftBlueprint.blueprintReference;
  const blueprintContentIdentity =
    generated.draftBlueprint.blueprintContentIdentity;
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference,
  });
  const originalDraft = structuredClone(generated.draftBlueprint);
  const originalReviewBundle = structuredClone(reviewed.reviewBundle);
  const sourceBlueprint = {
    blueprintReference,
    blueprintContentIdentity,
  };
  const candidateNormalizedBlueprint = reverseSerializationOrder(
    structuredClone(reviewed.reviewBundle.normalizedBlueprint)
  );
  candidateNormalizedBlueprint.capabilitySelections = [
    ...candidateNormalizedBlueprint.capabilitySelections,
  ].reverse();
  const receivedCandidateFingerprint = independentlyRecomputedContentIdentity(
    candidateNormalizedBlueprint
  );
  const candidateWithStableCapabilityOrder = structuredClone(
    candidateNormalizedBlueprint
  );
  candidateWithStableCapabilityOrder.capabilitySelections = [
    ...candidateWithStableCapabilityOrder.capabilitySelections,
  ].sort((left, right) =>
    left.capabilityIdentity.localeCompare(right.capabilityIdentity)
  );
  const validationCandidateAction = {
    type: "reference-slice.review-draft-blueprint-validation-candidate",
    sourceBlueprint,
    candidate: {
      normalizedBlueprint: candidateNormalizedBlueprint,
      receivedCandidateFingerprint,
    },
  };

  const candidateReview = await system.referenceSlice.dispatch(
    structuredClone(validationCandidateAction)
  );
  const repeatedCandidateReview = await system.referenceSlice.dispatch(
    structuredClone(validationCandidateAction)
  );
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const validationVersionSet =
    originalReviewBundle.configurationValidationReportBinding
      .validationVersionSet;
  const validationVersionSetContentIdentity =
    originalReviewBundle.configurationValidationReportBinding
      .validationVersionSetContentIdentity;
  const expectedCandidateCanonicalization = {
    kind: "BlueprintCandidateCanonicalization",
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationSchemaIdentity: "schema.business-blueprint",
    configurationSchemaVersion: "1.0.0",
    canonicalizationRules: {
      machineIdentity: "canonicalization.blueprint-content",
      version: "1.0.0",
    },
    comparisonBaseline: sourceBlueprint,
    comparisonDisposition: "ComparableUnderSameSchema",
    normalizedBlueprint: originalReviewBundle.normalizedBlueprint,
    candidateBlueprintContentIdentity: blueprintContentIdentity,
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
  const expectedConfigurationValidationReport = {
    kind: "ConfigurationValidationReport",
    sourceBlueprint,
    receivedCandidateFingerprint,
    approvalEligibleBlueprintContentIdentity: blueprintContentIdentity,
    contentIdentityDisposition: "AvailableAfterCanonicalization",
    verdict: "Valid",
    diagnostics: [],
  };
  const expectedConfigurationValidationReportBinding = {
    kind: "ConfigurationValidationReportBinding",
    sourceBlueprint,
    receivedCandidateFingerprint,
    configurationValidationReportContentIdentity:
      independentlyRecomputedContentIdentity(
        expectedConfigurationValidationReport
      ),
    validationVersionSet,
    validationVersionSetContentIdentity,
    validationTime: "2026-01-15T09:00:00.000Z",
    responsibleKernelSource: {
      machineIdentity: "kernel.business",
      version: "1.0.0",
      contentIdentity:
        "sha256:930c1c3c96ff0551a58b6a132fdf352a1be16d4a60b5b5f99386f31ccc47ffac",
    },
  };
  const semanticDiff = candidateReview.semanticDiff ?? null;

  assert.ok(
    semanticDiff,
    "The schema-canonicalized candidate review must contain one Semantic Diff."
  );

  const expectedSemanticDiff = {
    kind: "SemanticDiff",
    sourceBlueprint,
    receivedCandidateFingerprint,
    candidateBlueprintContentIdentity: blueprintContentIdentity,
    configurationSchemaIdentity: "schema.business-blueprint",
    configurationSchemaVersion: "1.0.0",
    comparisonBaseline: sourceBlueprint,
    comparisonDisposition: "ComparableUnderSameSchema",
    comparisonMapping: null,
    sectionGroups: blueprintSectionNames.map((sectionIdentity) => ({
      sectionIdentity,
      changes: [],
    })),
  };
  const effectiveBlueprintMaterialExposed = [
    generated,
    reviewed,
    candidateReview,
    repeatedCandidateReview,
    draftObservation,
    generated.reviewBundle,
    reviewed.reviewBundle,
    draftObservation.reviewBundle,
  ].some(
    (material) =>
      Object.hasOwn(material ?? {}, "effectiveBlueprint") ||
      Object.hasOwn(material ?? {}, "effectiveBlueprints")
  );

  assert.deepEqual(
    {
      candidateReview,
      repeatedCandidateReview,
      receivedCandidateFingerprintRecomputes:
        receivedCandidateFingerprint ===
        independentlyRecomputedContentIdentity(candidateNormalizedBlueprint),
      receivedFingerprintDiffersFromCanonicalContent:
        receivedCandidateFingerprint !== blueprintContentIdentity,
      representationOnlyCandidate:
        JSON.stringify(
          canonicalizeIndependently(candidateWithStableCapabilityOrder)
        ) ===
        JSON.stringify(
          canonicalizeIndependently(originalReviewBundle.normalizedBlueprint)
        ),
      canonicalContentIdentityRecomputes:
        candidateReview.candidateCanonicalization
          ?.candidateBlueprintContentIdentity ===
        independentlyRecomputedContentIdentity(
          candidateReview.candidateCanonicalization?.normalizedBlueprint ??
            null
        ),
      semanticDiffCandidateIdentityRecomputes:
        semanticDiff.candidateBlueprintContentIdentity ===
        independentlyRecomputedContentIdentity(
          candidateReview.candidateCanonicalization.normalizedBlueprint
        ),
      semanticDiffChangePropertyNames: semanticDiff.sectionGroups.flatMap(
        (sectionGroup) =>
          sectionGroup.changes.flatMap((change) => Object.keys(change).sort())
      ),
      storedInitialSemanticDiff: originalReviewBundle.semanticDiff.sectionGroups.map(
        (sectionGroup) => ({
          sectionIdentity: sectionGroup.sectionIdentity,
          changeKinds: sectionGroup.changes.map((change) => change.kind),
        })
      ),
      candidateExposesDraftMaterial:
        Object.hasOwn(candidateReview, "draftBlueprint") ||
        Object.hasOwn(candidateReview, "blueprintLifecycle"),
      storedDraft: draftObservation.draftBlueprint,
      storedReviewBundle: draftObservation.reviewBundle,
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed,
      business: stateObservation.business,
    },
    {
      candidateReview: {
        kind: "ReferenceSliceView",
        mode: "DraftBlueprintValidationCandidateReview",
        sourceBlueprint,
        receivedCandidateFingerprint,
        candidateCanonicalization: expectedCandidateCanonicalization,
        configurationValidationReport: expectedConfigurationValidationReport,
        configurationValidationReportBinding:
          expectedConfigurationValidationReportBinding,
        semanticDiff: expectedSemanticDiff,
        authority: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
      },
      repeatedCandidateReview: candidateReview,
      receivedCandidateFingerprintRecomputes: true,
      receivedFingerprintDiffersFromCanonicalContent: true,
      representationOnlyCandidate: true,
      canonicalContentIdentityRecomputes: true,
      semanticDiffCandidateIdentityRecomputes: true,
      semanticDiffChangePropertyNames: [],
      storedInitialSemanticDiff: blueprintSectionNames.map(
        (sectionIdentity) => ({
          sectionIdentity,
          changeKinds: ["Added"],
        })
      ),
      candidateExposesDraftMaterial: false,
      storedDraft: originalDraft,
      storedReviewBundle: originalReviewBundle,
      observedAuthority: {
        blueprintVersions: 1,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Replacement Draft review compares validated canonical snapshots by stable identity without authority", async () => {
  const system = await createTicket03System();
  const assumedInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
    businessShapeAssumptions: [
      {
        identity: "assumption.local-operating-hours",
        intentState: "Assumed",
        proposition:
          "One illustrative operating-hours profile is sufficient for owner review.",
        proposerIdentity: "source.agent.local",
        rationale:
          "The exact fictitious opening hours are not needed to assess shared behavior.",
        affectedFactFamilies: ["business-shape"],
        affectedDraftBlueprintProposals: ["experience.operating-hours-display"],
        consequenceIfFalse:
          "The later Draft may need a different presentation-only schedule.",
        riskIfFalse: "No governed action or invariant changes.",
        resolutionCondition:
          "The owner confirms an illustrative schedule before Blueprint Approval.",
        expectedEvidence: "An attributable owner schedule decision.",
        responsibleReviewerIdentity: "source.owner.cedar-steam",
        timeSensitive: true,
        reviewTrigger: "Before Blueprint Approval",
        expiresAt: null,
      },
    ],
  });
  const priorIntentBrief = structuredClone(assumedInterview.intentBrief);

  const firstGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: priorIntentBrief.versionIdentity,
  });
  const firstReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: firstGenerated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(firstReviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(firstReviewed.reviewBundle);
  const sourceBlueprint = {
    blueprintReference: priorDraft.blueprintReference,
    blueprintContentIdentity: priorDraft.blueprintContentIdentity,
  };

  const corrected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: assumedInterview.identity,
    questionIdentity: "owner-interview.question.business-shape",
    answer: {
      statementIdentity: "intent-statement.business-shape",
      revisesStatementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value:
        "One fictitious Tenant operates retail and cafe Locations in Iraq using Asia/Baghdad, Arabic and English, IQD, and normalized each, gram, and millilitre units at the small-to-medium tier; owner-confirmed illustrative operating hours are 08:00–17:00.",
      assumptionResolutions: [
        {
          assumptionIdentity: "assumption.local-operating-hours",
          disposition: "Confirmed",
          resultingStatementIdentity: "intent-statement.business-shape",
        },
      ],
    },
  });
  const resolvedIntentBrief = corrected.ownerInterview.intentBrief;
  const historicalIntentReview = await system.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: assumedInterview.identity,
    versionIdentity: priorIntentBrief.versionIdentity,
  });

  const replacementGenerated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: resolvedIntentBrief.versionIdentity,
    sourceBlueprint,
  });
  const replacementReviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: replacementGenerated.draftBlueprint.blueprintReference,
  });
  const replacementReviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: replacementGenerated.draftBlueprint.blueprintReference,
  });
  const historicalDraftReview = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const priorDraftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference: priorDraft.blueprintReference,
  });
  const replacementDraftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference: replacementGenerated.draftBlueprint.blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const replacementDraft = replacementReviewed.draftBlueprint;
  const replacementReviewBundle = replacementReviewed.reviewBundle;
  const replacementSemanticDiff = replacementReviewBundle.semanticDiff;

  assert.deepEqual(
    replacementSemanticDiff.comparisonBaseline,
    sourceBlueprint,
    "The replacement Draft Semantic Diff must bind the exact prior Draft as its comparison baseline."
  );

  const expectedAssumptionTrace = {
    assumptionIdentity: "assumption.local-operating-hours",
    intentState: "Assumed",
    proposition:
      "One illustrative operating-hours profile is sufficient for owner review.",
    rationale:
      "The exact fictitious opening hours are not needed to assess shared behavior.",
    affectedFactFamilies: ["business-shape"],
    affectedDraftBlueprintProposals: ["experience.operating-hours-display"],
    consequenceIfFalse:
      "The later Draft may need a different presentation-only schedule.",
    riskIfFalse: "No governed action or invariant changes.",
    resolutionCondition:
      "The owner confirms an illustrative schedule before Blueprint Approval.",
    expectedEvidence: "An attributable owner schedule decision.",
    responsibleReviewerIdentity: "source.owner.cedar-steam",
    timeSensitive: true,
    reviewTrigger: "Before Blueprint Approval",
    expiresAt: null,
    proposer: {
      kind: "AgentProposal",
      identity: "source.agent.local",
    },
    source: {
      kind: "Owner",
      identity: "source.owner.cedar-steam",
      recordedTime: "2026-01-15T09:00:00.000Z",
    },
  };
  const expectedReplacementSemanticDiff = {
    kind: "SemanticDiff",
    blueprintReference: replacementDraft.blueprintReference,
    blueprintContentIdentity: replacementDraft.blueprintContentIdentity,
    configurationSchemaIdentity: "schema.business-blueprint",
    configurationSchemaVersion: "1.0.0",
    approvalBaseline: null,
    comparisonBaseline: sourceBlueprint,
    comparisonDisposition: "ComparableUnderSameSchema",
    comparisonMapping: null,
    sectionGroups: blueprintSectionNames.map((sectionIdentity) => {
      if (sectionIdentity === "envelope") {
        return {
          sectionIdentity,
          changes: [
            {
              kind: "Changed",
              path: `/envelope/sourceIntentBriefVersionReferences/${priorIntentBrief.identity}`,
              oldValue: {
                intentBriefIdentity: priorIntentBrief.identity,
                versionIdentity: priorIntentBrief.versionIdentity,
              },
              newValue: {
                intentBriefIdentity: resolvedIntentBrief.identity,
                versionIdentity: resolvedIntentBrief.versionIdentity,
              },
            },
          ],
        };
      }
      if (sectionIdentity === "intentTraceability") {
        return {
          sectionIdentity,
          changes: [
            {
              kind: "Removed",
              path: "/intentTraceability/assumption.local-operating-hours",
              oldValue: expectedAssumptionTrace,
              newValue: null,
            },
          ],
        };
      }
      return {
        sectionIdentity,
        changes: [],
      };
    }),
  };
  const activeGovernedConfiguration = (normalizedBlueprint) => ({
    businessScope: normalizedBlueprint.businessScope,
    capabilitySelections: normalizedBlueprint.capabilitySelections,
    recordDefinitions: normalizedBlueprint.recordDefinitions,
    workflowDefinitions: normalizedBlueprint.workflowDefinitions,
    roleDefinitions: normalizedBlueprint.roleDefinitions,
    evidenceRules: normalizedBlueprint.evidenceRules,
    policyProfiles: normalizedBlueprint.policyProfiles,
    experienceConfiguration: normalizedBlueprint.experienceConfiguration,
    integrationConfiguration: normalizedBlueprint.integrationConfiguration,
  });
  const semanticChanges = replacementSemanticDiff.sectionGroups.flatMap(
    (sectionGroup) => sectionGroup.changes
  );
  const hasArrayPositionPath = semanticChanges.some((change) =>
    /\/(?:0|[1-9][0-9]*)(?:\/|$)/.test(change.path)
  );
  const effectiveBlueprintMaterialExposed = [
    firstGenerated,
    firstReviewed,
    replacementGenerated,
    replacementReviewed,
    replacementReviewedAgain,
    historicalDraftReview,
    priorDraftObservation,
    replacementDraftObservation,
    stateObservation,
    firstGenerated.reviewBundle,
    firstReviewed.reviewBundle,
    replacementGenerated.reviewBundle,
    replacementReviewed.reviewBundle,
    replacementDraftObservation.reviewBundle,
  ].some(
    (material) =>
      Object.hasOwn(material ?? {}, "effectiveBlueprint") ||
      Object.hasOwn(material ?? {}, "effectiveBlueprints")
  );

  assert.deepEqual(replacementSemanticDiff, expectedReplacementSemanticDiff);
  assert.deepEqual(
    {
      intentVersioning: {
        intentBriefIdentity: resolvedIntentBrief.identity,
        versionChanged:
          resolvedIntentBrief.versionIdentity !==
          priorIntentBrief.versionIdentity,
        versionNumber: resolvedIntentBrief.versionNumber,
        parentVersionIdentity: resolvedIntentBrief.parentVersionIdentity,
        activeAssumptions: resolvedIntentBrief.assumptions ?? [],
        assumptionResolutions: resolvedIntentBrief.assumptionResolutions,
        historicalIntentBrief:
          historicalIntentReview.ownerInterview.intentBrief,
      },
      replacementLineage: {
        tenantIdentity: replacementDraft.blueprintReference.tenantIdentity,
        blueprintIdentity:
          replacementDraft.blueprintReference.blueprintIdentity,
        versionChanged:
          replacementDraft.blueprintReference.versionIdentity !==
          priorDraft.blueprintReference.versionIdentity,
        versionNumber: replacementDraft.version.envelope.versionNumber,
        parentVersionReference:
          replacementDraft.version.envelope.parentVersionReference,
        sourceIntentBriefVersionReferences:
          replacementDraft.version.envelope.sourceIntentBriefVersionReferences,
        contentIdentityChanged:
          replacementDraft.blueprintContentIdentity !==
          priorDraft.blueprintContentIdentity,
        priorContentIdentityRecomputes:
          priorDraft.blueprintContentIdentity ===
          independentlyRecomputedContentIdentity(
            priorReviewBundle.normalizedBlueprint
          ),
        replacementContentIdentityRecomputes:
          replacementDraft.blueprintContentIdentity ===
          independentlyRecomputedContentIdentity(
            replacementReviewBundle.normalizedBlueprint
          ),
      },
      activeGovernedConfiguration: activeGovernedConfiguration(
        replacementReviewBundle.normalizedBlueprint
      ),
      semanticComparison: {
        semanticDiff: replacementSemanticDiff,
        totalChanges: semanticChanges.length,
        changeKinds: semanticChanges.map((change) => change.kind),
        hasArrayPositionPath,
      },
      priorInitialSemanticDiff:
        priorReviewBundle.semanticDiff.sectionGroups.map((sectionGroup) => ({
          sectionIdentity: sectionGroup.sectionIdentity,
          changeKinds: sectionGroup.changes.map((change) => change.kind),
        })),
      repeatedReplacementReview: replacementReviewedAgain,
      historicalDraft: historicalDraftReview.draftBlueprint,
      historicalReviewBundle: historicalDraftReview.reviewBundle,
      priorKernelDraft: priorDraftObservation.draftBlueprint,
      priorKernelReviewBundle: priorDraftObservation.reviewBundle,
      replacementKernelDraft: replacementDraftObservation.draftBlueprint,
      replacementKernelReviewBundle: replacementDraftObservation.reviewBundle,
      generatedAuthority: {
        first: firstGenerated.authority,
        replacement: replacementGenerated.authority,
      },
      observedAuthority: {
        blueprintVersions: stateObservation.authority.blueprintVersions,
        blueprintApprovals: stateObservation.authority.blueprintApprovals,
        appliedBlueprints: stateObservation.authority.appliedBlueprints,
        provisioningAttempts:
          stateObservation.authority.provisioningAttempts ?? 0,
      },
      effectiveBlueprintMaterialExposed,
      business: stateObservation.business,
    },
    {
      intentVersioning: {
        intentBriefIdentity: priorIntentBrief.identity,
        versionChanged: true,
        versionNumber: priorIntentBrief.versionNumber + 1,
        parentVersionIdentity: priorIntentBrief.versionIdentity,
        activeAssumptions: [],
        assumptionResolutions: [
          {
            assumptionIdentity: "assumption.local-operating-hours",
            disposition: "Confirmed",
            resultingStatementIdentity: "intent-statement.business-shape",
            source: {
              kind: "Owner",
              identity: "source.owner.cedar-steam",
              recordedTime: "2026-01-15T09:00:00.000Z",
            },
          },
        ],
        historicalIntentBrief: priorIntentBrief,
      },
      replacementLineage: {
        tenantIdentity: priorDraft.blueprintReference.tenantIdentity,
        blueprintIdentity: priorDraft.blueprintReference.blueprintIdentity,
        versionChanged: true,
        versionNumber: 2,
        parentVersionReference: priorDraft.blueprintReference,
        sourceIntentBriefVersionReferences: [
          {
            intentBriefIdentity: resolvedIntentBrief.identity,
            versionIdentity: resolvedIntentBrief.versionIdentity,
          },
        ],
        contentIdentityChanged: true,
        priorContentIdentityRecomputes: true,
        replacementContentIdentityRecomputes: true,
      },
      activeGovernedConfiguration: activeGovernedConfiguration(
        priorReviewBundle.normalizedBlueprint
      ),
      semanticComparison: {
        semanticDiff: expectedReplacementSemanticDiff,
        totalChanges: 2,
        changeKinds: ["Changed", "Removed"],
        hasArrayPositionPath: false,
      },
      priorInitialSemanticDiff: blueprintSectionNames.map(
        (sectionIdentity) => ({
          sectionIdentity,
          changeKinds: ["Added"],
        })
      ),
      repeatedReplacementReview: replacementReviewed,
      historicalDraft: priorDraft,
      historicalReviewBundle: priorReviewBundle,
      priorKernelDraft: priorDraft,
      priorKernelReviewBundle: priorReviewBundle,
      replacementKernelDraft: replacementDraft,
      replacementKernelReviewBundle: replacementReviewBundle,
      generatedAuthority: {
        first: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
        replacement: {
          blueprintApproval: false,
          appliedBlueprint: false,
          provisioning: false,
          businessTruth: false,
          reviewApprovesBlueprint: false,
        },
      },
      observedAuthority: {
        blueprintVersions: 2,
        blueprintApprovals: 0,
        appliedBlueprints: 0,
        provisioningAttempts: 0,
      },
      effectiveBlueprintMaterialExposed: false,
      business: {
        records: 0,
        businessEvents: 0,
        evidence: 0,
        stockMovements: 0,
        postingSets: 0,
        ledgerEntries: 0,
        payments: 0,
      },
    }
  );
});

test("Draft review publicly proves zero compiled Effective Blueprints without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  const stateObservationAgain = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    stateObservation.derivedMaterial,
    { effectiveBlueprints: 0 },
    "The read-only Kernel observation must explicitly report zero compiled Effective Blueprints."
  );

  const exposesEffectiveBlueprintArtifact = (value) => {
    if (Array.isArray(value)) {
      return value.some(exposesEffectiveBlueprintArtifact);
    }
    if (value === null || typeof value !== "object") {
      return false;
    }
    if (value.kind === "EffectiveBlueprint") {
      return true;
    }
    return Object.entries(value).some(
      ([key, nestedValue]) =>
        key === "effectiveBlueprint" ||
        key === "effectiveBlueprints" ||
        exposesEffectiveBlueprintArtifact(nestedValue)
    );
  };
  const ownerAndDraftReviewSurfaces = [
    generated,
    reviewed,
    reviewedAgain,
    generated.draftBlueprint,
    reviewed.reviewBundle.normalizedBlueprint,
    reviewed.reviewBundle,
    draftObservation,
  ];

  assert.deepEqual(reviewedAgain, reviewed);
  assert.deepEqual(stateObservationAgain, stateObservation);
  assert.deepEqual(draftObservation.draftBlueprint, reviewed.draftBlueprint);
  assert.deepEqual(draftObservation.reviewBundle, reviewed.reviewBundle);
  assert.equal(
    ownerAndDraftReviewSurfaces.some(exposesEffectiveBlueprintArtifact),
    false
  );
  assert.equal(
    Object.hasOwn(stateObservation.authority, "effectiveBlueprints"),
    false
  );
  assert.deepEqual(stateObservation.authority, {
    blueprintVersions: 1,
    blueprintApprovals: 0,
    appliedBlueprints: 0,
    provisioningAttempts: 0,
  });
  assert.deepEqual(stateObservation.business, {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  });
  assert.deepEqual(generated.authority, {
    blueprintApproval: false,
    appliedBlueprint: false,
    provisioning: false,
    businessTruth: false,
    reviewApprovesBlueprint: false,
  });
});

test("Draft journey preserves one closed read-only Kernel observation contract without authority", async () => {
  const system = await createTicket03System();
  const ownerInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
  });
  const intentBrief = ownerInterview.intentBrief;

  const beforeDraft = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  const beforeDraftAgain = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    beforeDraft.authority,
    {
      blueprintVersions: 0,
      blueprintApprovals: 0,
      appliedBlueprints: 0,
      provisioningAttempts: 0,
    },
    "The pre-Draft authority projection must explicitly report zero provisioning attempts."
  );

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: ownerInterview.identity,
    intentBriefVersionIdentity: intentBrief.versionIdentity,
  });
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const reviewedAgain = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const draftObservation = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const draftObservationAgain = await system.businessKernel.observe({
    type: "kernel.observe.draft-blueprint-review",
    tenantIdentity: "tenant.cedar-steam",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const afterDraft = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  const afterDraftAgain = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  const topLevelContract = [
    "authority",
    "business",
    "derivedMaterial",
    "kind",
    "operational",
    "scope",
  ];
  const emptyBusinessTruth = {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  };
  const exposesEffectiveBlueprintArtifact = (value) => {
    if (Array.isArray(value)) {
      return value.some(exposesEffectiveBlueprintArtifact);
    }
    if (value === null || typeof value !== "object") {
      return false;
    }
    if (value.kind === "EffectiveBlueprint") {
      return true;
    }
    return Object.entries(value).some(
      ([key, nestedValue]) =>
        key === "effectiveBlueprint" ||
        key === "effectiveBlueprints" ||
        exposesEffectiveBlueprintArtifact(nestedValue)
    );
  };

  assert.deepEqual(beforeDraftAgain, beforeDraft);
  assert.deepEqual(afterDraftAgain, afterDraft);
  assert.deepEqual(reviewedAgain, reviewed);
  assert.deepEqual(draftObservationAgain, draftObservation);
  assert.deepEqual(Object.keys(beforeDraft).sort(), topLevelContract);
  assert.deepEqual(Object.keys(afterDraft).sort(), topLevelContract);
  assert.equal(beforeDraft.kind, "KernelObservation");
  assert.equal(afterDraft.kind, "KernelObservation");
  assert.equal(beforeDraft.scope.tenantIdentity, "tenant.cedar-steam");
  assert.deepEqual(afterDraft.scope, beforeDraft.scope);
  assert.deepEqual(afterDraft.authority, {
    blueprintVersions: 1,
    blueprintApprovals: 0,
    appliedBlueprints: 0,
    provisioningAttempts: 0,
  });
  assert.deepEqual(beforeDraft.derivedMaterial, { effectiveBlueprints: 0 });
  assert.deepEqual(afterDraft.derivedMaterial, { effectiveBlueprints: 0 });
  assert.deepEqual(beforeDraft.business, emptyBusinessTruth);
  assert.deepEqual(afterDraft.business, emptyBusinessTruth);
  assert.deepEqual(beforeDraft.operational, { kernelCommandResults: 1 });
  assert.deepEqual(afterDraft.operational, { kernelCommandResults: 2 });
  assert.deepEqual(reviewed.draftBlueprint, generated.draftBlueprint);
  assert.deepEqual(draftObservation.draftBlueprint, reviewed.draftBlueprint);
  assert.deepEqual(draftObservation.reviewBundle, reviewed.reviewBundle);
  assert.equal(
    [generated, reviewed, reviewedAgain, draftObservation, draftObservationAgain].some(
      exposesEffectiveBlueprintArtifact
    ),
    false
  );
  assert.deepEqual(generated.authority, {
    blueprintApproval: false,
    appliedBlueprint: false,
    provisioning: false,
    businessTruth: false,
    reviewApprovesBlueprint: false,
  });
});

test("undeclared Assumption resolution disposition fails closed without authority", async () => {
  const system = await createTicket03System();
  const assumedInterview = await completeSafeIntentBrief(system, {
    statementValues: configuredReuseStatementValues,
    businessShapeAssumptions: [
      {
        identity: "assumption.local-operating-hours",
        intentState: "Assumed",
        proposition:
          "One illustrative operating-hours profile is sufficient for owner review.",
        proposerIdentity: "source.agent.local",
        rationale:
          "The exact fictitious opening hours are not needed to assess shared behavior.",
        affectedFactFamilies: ["business-shape"],
        affectedDraftBlueprintProposals: [
          "experience.operating-hours-display",
        ],
        consequenceIfFalse:
          "The later Draft may need a different presentation-only schedule.",
        riskIfFalse: "No governed action or invariant changes.",
        resolutionCondition:
          "The owner confirms an illustrative schedule before Blueprint Approval.",
        expectedEvidence: "An attributable owner schedule decision.",
        responsibleReviewerIdentity: "source.owner.cedar-steam",
        timeSensitive: true,
        reviewTrigger: "Before Blueprint Approval",
        expiresAt: null,
      },
    ],
  });
  const priorIntentBrief = structuredClone(assumedInterview.intentBrief);

  const generated = await system.referenceSlice.dispatch({
    type: "reference-slice.generate-draft-blueprint",
    ownerInterviewIdentity: assumedInterview.identity,
    intentBriefVersionIdentity: priorIntentBrief.versionIdentity,
  });
  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: generated.draftBlueprint.blueprintReference,
  });
  const priorDraft = structuredClone(reviewed.draftBlueprint);
  const priorReviewBundle = structuredClone(reviewed.reviewBundle);

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: assumedInterview.identity,
    questionIdentity: "owner-interview.question.business-shape",
    answer: {
      statementIdentity: "intent-statement.business-shape",
      revisesStatementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value:
        "One fictitious Tenant operates retail and cafe Locations in Iraq using Asia/Baghdad, Arabic and English, IQD, and normalized each, gram, and millilitre units at the small-to-medium tier; illustrative operating hours inferred by an Agent are 08:00–17:00.",
      assumptionResolutions: [
        {
          assumptionIdentity: "assumption.local-operating-hours",
          disposition: "AgentInferred",
          resultingStatementIdentity: "intent-statement.business-shape",
        },
      ],
    },
  });

  assert.equal(
    rejected.mode,
    "OwnerInterviewInputRejected",
    "The undeclared Assumption resolution disposition must fail closed."
  );
  assert.deepEqual(rejected.diagnostics, [
    {
      code: "INTENT.INPUT.VALUE_NOT_ALLOWED",
      field: "disposition",
      summary:
        "Owner Interview requires every declared structured field to use one of its declared allowed values.",
    },
  ]);
  assert.deepEqual(rejected.ownerInterview.intentBrief, priorIntentBrief);
  assert.deepEqual(
    rejected.ownerInterview.intentBrief.assumptions,
    priorIntentBrief.assumptions
  );
  assert.equal(
    rejected.ownerInterview.intentBrief.assumptions[0].identity,
    "assumption.local-operating-hours"
  );
  assert.deepEqual(rejected.authority, {
    blueprintApproval: false,
    appliedBlueprint: false,
    businessTruth: false,
    recommendationConfirmsIntent: false,
    optionSelectionConfirmsIntent: false,
  });

  const historicalIntentReview = await system.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: assumedInterview.identity,
    versionIdentity: priorIntentBrief.versionIdentity,
  });
  const draftReviewAfterRejection = await system.referenceSlice.dispatch({
    type: "reference-slice.review-draft-blueprint",
    blueprintReference: priorDraft.blueprintReference,
  });
  const stateObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });

  assert.deepEqual(
    historicalIntentReview.ownerInterview.intentBrief,
    priorIntentBrief
  );
  assert.deepEqual(draftReviewAfterRejection.draftBlueprint, priorDraft);
  assert.deepEqual(draftReviewAfterRejection.reviewBundle, priorReviewBundle);
  assert.deepEqual(stateObservation.authority, {
    blueprintVersions: 1,
    blueprintApprovals: 0,
    appliedBlueprints: 0,
    provisioningAttempts: 0,
  });
  assert.deepEqual(stateObservation.derivedMaterial, {
    effectiveBlueprints: 0,
  });
  assert.deepEqual(stateObservation.business, {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  });
});
