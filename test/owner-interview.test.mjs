import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createLocalReferenceSlice } from "../src/reference-slice.mjs";

const createInterviewSystem = async () => {
  const identities = [
    "orchestration-run.owner-interview.test-001",
    "kernel-command.initialize.owner-interview.test-001",
    "owner-interview.test-001",
    "intent-brief.test-001",
    "intent-brief-version.test-001",
    "intent-brief-version.test-002",
    "intent-brief-version.test-003",
    "intent-brief-version.test-004",
    "intent-brief-version.test-005",
    "intent-brief-version.test-006",
    "intent-brief-version.test-007",
    "intent-brief-version.test-008",
    "intent-brief-version.test-009",
  ];
  const system = await createLocalReferenceSlice({
    persistence: { kind: "memory" },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await system.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  return system;
};

const requiredAcceptanceCondition = () => ({
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
  governedBusinessAction: "Review a later Draft Blueprint proposal.",
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
});

const completeMinimalInterview = async (
  system,
  {
    purposeIntentState = "Confirmed",
    purposeValue = "Prove shared retail and cafe behavior with fictitious data.",
    acceptanceConditions = [requiredAcceptanceCondition()],
    safetyAnswer = {},
    omitSafetyIntentState = false,
    businessShapeAnswer = {},
  } = {}
) => {
  let view = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const answers = [
    {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: purposeIntentState,
      value: purposeValue,
      acceptanceConditions,
    },
    {
      statementIdentity: "intent-statement.safety-and-jurisdiction",
      ...(omitSafetyIntentState ? {} : { intentState: "Confirmed" }),
      value: "The local proof uses no real or externally processed data.",
      ...safetyAnswer,
    },
    {
      statementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value: "One Tenant has retail and cafe Locations using IQD.",
      ...businessShapeAnswer,
    },
    {
      statementIdentity: "intent-statement.customer-and-fulfillment-journey",
      intentState: "Confirmed",
      value: "Retail sale and cafe kitchen fulfillment are required.",
    },
    {
      statementIdentity: "intent-statement.supply-stock-and-capacity",
      intentState: "Confirmed",
      value: "Receiving, stock, and ingredient consumption are required.",
    },
    {
      statementIdentity: "intent-statement.people-and-governance",
      intentState: "Confirmed",
      value: "Owner and operational Roles have governed duties.",
    },
    {
      statementIdentity: "intent-statement.money-and-accounting",
      intentState: "Confirmed",
      value: "Fictitious IQD cash and balanced Ledger effects are required.",
    },
    {
      statementIdentity: "intent-statement.experience-and-integrations",
      intentState: "Confirmed",
      value: "Local review needs no external integration.",
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
  return view;
};

test("owner starts with one material question and all eight fact families in view", async () => {
  const system = await createInterviewSystem();

  const view = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });

  assert.deepEqual(view, {
    kind: "ReferenceSliceView",
    mode: "OwnerInterview",
    ownerInterview: {
      identity: "owner-interview.test-001",
      tenantIdentity: "tenant.cedar-steam",
      ownerSourceIdentity: "source.owner.cedar-steam",
      factFamilyProgress: [
        { identity: "purpose-and-scope", disposition: "Unanswered" },
        { identity: "safety-and-jurisdiction", disposition: "Unanswered" },
        { identity: "business-shape", disposition: "Unanswered" },
        {
          identity: "customer-and-fulfillment-journey",
          disposition: "Unanswered",
        },
        {
          identity: "supply-stock-and-capacity",
          disposition: "Unanswered",
        },
        { identity: "people-and-governance", disposition: "Unanswered" },
        { identity: "money-and-accounting", disposition: "Unanswered" },
        {
          identity: "experience-and-integrations",
          disposition: "Unanswered",
        },
      ],
      currentQuestion: {
        identity: "owner-interview.question.purpose-and-scope",
        factFamily: "purpose-and-scope",
        prompt:
          "What outcome should this business system make demonstrable, and what is explicitly excluded?",
        recommendedAnswer: {
          value:
            "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
          authority: "ProposalOnly",
        },
        alternatives: [
          "Start with one retail workflow and defer cafe.",
          "Start with one cafe workflow and defer retail.",
        ],
      },
      intentBrief: null,
    },
    authority: {
      blueprintApproval: false,
      appliedBlueprint: false,
      businessTruth: false,
      recommendationConfirmsIntent: false,
      optionSelectionConfirmsIntent: false,
    },
  });
});

test("owner answer creates an attributable Intent Brief version and advances one question", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });

  const view = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
    },
  });

  assert.deepEqual(view.ownerInterview.intentBrief, {
    identity: "intent-brief.test-001",
    versionIdentity: "intent-brief-version.test-001",
    versionNumber: 1,
    parentVersionIdentity: null,
    tenantIdentity: "tenant.cedar-steam",
    ownerInterviewIdentity: "owner-interview.test-001",
    recordedTime: "2026-01-15T09:00:00.000Z",
    statements: [
      {
        identity: "intent-statement.purpose-and-scope",
        factFamily: "purpose-and-scope",
        intentState: "Confirmed",
        value:
          "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
        source: {
          kind: "Owner",
          identity: "source.owner.cedar-steam",
          recordedTime: "2026-01-15T09:00:00.000Z",
        },
      },
    ],
  });
  assert.deepEqual(view.ownerInterview.factFamilyProgress.slice(0, 2), [
    { identity: "purpose-and-scope", disposition: "Answered" },
    { identity: "safety-and-jurisdiction", disposition: "Unanswered" },
  ]);
  assert.equal(
    view.ownerInterview.currentQuestion.identity,
    "owner-interview.question.safety-and-jurisdiction"
  );
});

test("owner reviews one exact Intent Brief Version through the Guided Cockpit", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const answered = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
    },
  });

  const reviewed = await system.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: started.ownerInterview.identity,
    versionIdentity: answered.ownerInterview.intentBrief.versionIdentity,
  });

  assert.equal(reviewed.kind, "ReferenceSliceView");
  assert.equal(reviewed.mode, "IntentBriefReview");
  assert.deepEqual(
    reviewed.ownerInterview.intentBrief,
    answered.ownerInterview.intentBrief
  );
  assert.deepEqual(reviewed.authority, {
    blueprintApproval: false,
    appliedBlueprint: false,
    businessTruth: false,
    previewConfirmsIntent: false,
  });
});

test("corrected intent creates a new version without rewriting the prior Intent Brief", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const first = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value: "Prove reuse for retail and cafe.",
    },
  });

  const corrected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: "owner-interview.question.purpose-and-scope",
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      revisesStatementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
    },
  });
  const historical = await system.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: started.ownerInterview.identity,
    versionIdentity: first.ownerInterview.intentBrief.versionIdentity,
  });

  assert.deepEqual(
    {
      identity: corrected.ownerInterview.intentBrief.identity,
      versionIdentity: corrected.ownerInterview.intentBrief.versionIdentity,
      versionNumber: corrected.ownerInterview.intentBrief.versionNumber,
      parentVersionIdentity:
        corrected.ownerInterview.intentBrief.parentVersionIdentity,
      value: corrected.ownerInterview.intentBrief.statements[0].value,
    },
    {
      identity: "intent-brief.test-001",
      versionIdentity: "intent-brief-version.test-002",
      versionNumber: 2,
      parentVersionIdentity: "intent-brief-version.test-001",
      value:
        "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
    }
  );
  assert.deepEqual(
    historical.ownerInterview.intentBrief,
    first.ownerInterview.intentBrief
  );
});

test("completed interview correction creates a new version and recomputes Draft Blockers", async () => {
  const system = await createInterviewSystem();
  const completed = await completeMinimalInterview(system);

  const corrected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: completed.ownerInterview.identity,
    questionIdentity: "owner-interview.question.purpose-and-scope",
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      revisesStatementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Ambiguous",
      value: "Retail and cafe reuse may require different boundaries.",
    },
  });

  assert.deepEqual(
    {
      versionIdentity: corrected.ownerInterview.intentBrief.versionIdentity,
      versionNumber: corrected.ownerInterview.intentBrief.versionNumber,
      parentVersionIdentity:
        corrected.ownerInterview.intentBrief.parentVersionIdentity,
      purposeIntentState: corrected.ownerInterview.intentBrief.statements.find(
        (statement) => statement.factFamily === "purpose-and-scope"
      ).intentState,
    },
    {
      versionIdentity: "intent-brief-version.test-009",
      versionNumber: 9,
      parentVersionIdentity: "intent-brief-version.test-008",
      purposeIntentState: "Ambiguous",
    }
  );
  assert.deepEqual(corrected.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.CONFIRMED_PURPOSE_REQUIRED",
        summary:
          "A Confirmed owner purpose is required to anchor a meaningful Draft Blueprint proposal.",
      },
    ],
    draftBlueprint: null,
  });

  const historical = await system.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: completed.ownerInterview.identity,
    versionIdentity: completed.ownerInterview.intentBrief.versionIdentity,
  });
  assert.equal(historical.ownerInterview.currentQuestion, null);
  assert.deepEqual(historical.ownerInterview.draftReview, {
    disposition: "ReadyForDraftProposal",
    draftBlockers: [],
    draftBlueprint: null,
  });
});

test("complete supported interview produces all eight fact families and review contracts", async () => {
  const system = await createInterviewSystem();
  let view = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const answers = [
    {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
      acceptanceConditions: [
        {
          identity: "acceptance-condition.retail-cafe-reuse",
          intentState: "Confirmed",
          outcome:
            "One owner interview makes shared retail and cafe configuration reviewable.",
          whyItMatters:
            "Common platform behavior must not be rebuilt for each client.",
          scope: {
            roleIdentities: ["role.owner"],
            locationIdentities: ["location.retail", "location.cafe"],
            recordIdentities: ["record.purchase-order", "record.order"],
            workflowIdentities: [
              "workflow.retail-golden-transaction",
              "workflow.cafe-order-to-kitchen",
            ],
          },
          startingContext: "A fresh fictitious Tenant and two empty sandboxes.",
          governedBusinessAction:
            "Review the later generated Draft Blueprint proposal.",
          observableResult:
            "Retail and cafe proposals trace to one shared capability composition.",
          passCondition:
            "Both proposals reuse shared Kernel contracts without tenant runtime code.",
          failureCondition:
            "Either proposal requires tenant-specific executable behavior.",
          exclusions: ["Production deployment"],
          evidenceRequired: [
            "Owner-reviewable Intent Brief and later Blueprint traceability",
          ],
          reviewerIdentity: "source.owner.cedar-steam",
          criticality: "Required",
          dependencies: {
            assumptionIdentities: [],
            constraintIdentities: ["constraint.sandbox-only"],
            sensitiveDataCategoryIdentities: [
              "data-category.fictitious-business-data",
            ],
          },
        },
      ],
    },
    {
      statementIdentity: "intent-statement.safety-and-jurisdiction",
      intentState: "Confirmed",
      value:
        "The local proof uses fictitious Iraq-based business context and no external AI.",
      dataCategories: [
        {
          identity: "data-category.fictitious-business-data",
          name: "Fictitious business setup data",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Internal",
          rationale:
            "The setup is non-public operating context and contains no real personal, financial, credential, identity, or clinical data.",
          externalAiHandling: "Prohibited",
        },
      ],
    },
    {
      statementIdentity: "intent-statement.business-shape",
      intentState: "Confirmed",
      value:
        "One Tenant has retail and cafe Locations, IQD currency, Arabic and English, and declared normalized units.",
      additionalStatements: [
        {
          statementIdentity: "intent-statement.current-tools",
          intentState: "Not Applicable",
          value: "No existing business system or data import applies.",
        },
      ],
      assumptions: [
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
          reviewTrigger: "Before Blueprint Approval",
          expiresAt: null,
        },
      ],
    },
    {
      statementIdentity: "intent-statement.customer-and-fulfillment-journey",
      intentState: "Confirmed",
      value:
        "Retail fulfills an accepted Order at sale; cafe fulfills through an accepted-to-ready Kitchen Ticket.",
    },
    {
      statementIdentity: "intent-statement.supply-stock-and-capacity",
      intentState: "Confirmed",
      value:
        "Purchasing, receiving, stock, and ingredient consumption use normalized units and fictitious suppliers.",
    },
    {
      statementIdentity: "intent-statement.people-and-governance",
      intentState: "Confirmed",
      value:
        "Owner, receiver, cashier, and kitchen Roles have separate governed responsibilities and Evidence duties.",
    },
    {
      statementIdentity: "intent-statement.money-and-accounting",
      intentState: "Confirmed",
      value:
        "IQD cash Payment and a simple balanced Ledger are required with no production opening balances.",
    },
    {
      statementIdentity: "intent-statement.experience-and-integrations",
      intentState: "Confirmed",
      value:
        "The local Guided Cockpit and evidence views need no external integration, authentication, or offline support.",
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

  assert.equal(view.ownerInterview.currentQuestion, null);
  assert.deepEqual(
    view.ownerInterview.factFamilyProgress,
    [
      "purpose-and-scope",
      "safety-and-jurisdiction",
      "business-shape",
      "customer-and-fulfillment-journey",
      "supply-stock-and-capacity",
      "people-and-governance",
      "money-and-accounting",
      "experience-and-integrations",
    ].map((identity) => ({ identity, disposition: "Answered" }))
  );
  assert.deepEqual(
    {
      identity: view.ownerInterview.intentBrief.identity,
      versionIdentity: view.ownerInterview.intentBrief.versionIdentity,
      versionNumber: view.ownerInterview.intentBrief.versionNumber,
      parentVersionIdentity:
        view.ownerInterview.intentBrief.parentVersionIdentity,
    },
    {
      identity: "intent-brief.test-001",
      versionIdentity: "intent-brief-version.test-008",
      versionNumber: 8,
      parentVersionIdentity: "intent-brief-version.test-007",
    }
  );
  assert.deepEqual(
    view.ownerInterview.intentBrief.statements.map((statement) => ({
      identity: statement.identity,
      factFamily: statement.factFamily,
      intentState: statement.intentState,
      sourceIdentity: statement.source.identity,
    })),
    [
      ["intent-statement.purpose-and-scope", "purpose-and-scope", "Confirmed"],
      [
        "intent-statement.safety-and-jurisdiction",
        "safety-and-jurisdiction",
        "Confirmed",
      ],
      ["intent-statement.business-shape", "business-shape", "Confirmed"],
      ["intent-statement.current-tools", "business-shape", "Not Applicable"],
      [
        "intent-statement.customer-and-fulfillment-journey",
        "customer-and-fulfillment-journey",
        "Confirmed",
      ],
      [
        "intent-statement.supply-stock-and-capacity",
        "supply-stock-and-capacity",
        "Confirmed",
      ],
      [
        "intent-statement.people-and-governance",
        "people-and-governance",
        "Confirmed",
      ],
      [
        "intent-statement.money-and-accounting",
        "money-and-accounting",
        "Confirmed",
      ],
      [
        "intent-statement.experience-and-integrations",
        "experience-and-integrations",
        "Confirmed",
      ],
    ].map(([identity, factFamily, intentState]) => ({
      identity,
      factFamily,
      intentState,
      sourceIdentity: "source.owner.cedar-steam",
    }))
  );
  assert.deepEqual(view.ownerInterview.intentBrief.dataCategories, [
    {
      identity: "data-category.fictitious-business-data",
      name: "Fictitious business setup data",
      intentState: "Confirmed",
      classificationIntentState: "Confirmed",
      sensitiveDataClass: "Internal",
      rationale:
        "The setup is non-public operating context and contains no real personal, financial, credential, identity, or clinical data.",
      externalAiHandling: "Prohibited",
      source: {
        kind: "Owner",
        identity: "source.owner.cedar-steam",
        recordedTime: "2026-01-15T09:00:00.000Z",
      },
    },
  ]);
  assert.deepEqual(view.ownerInterview.intentBrief.assumptions[0], {
    identity: "assumption.local-operating-hours",
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
  });
  assert.deepEqual(view.ownerInterview.intentBrief.acceptanceConditions[0], {
    ...answers[0].acceptanceConditions[0],
    source: {
      kind: "Owner",
      identity: "source.owner.cedar-steam",
      recordedTime: "2026-01-15T09:00:00.000Z",
    },
  });
  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "ReadyForDraftProposal",
    draftBlockers: [],
    draftBlueprint: null,
  });
  const kernelObservation = await system.businessKernel.observe({
    type: "kernel.observe.empty-authority-state",
    tenantIdentity: "tenant.cedar-steam",
  });
  assert.deepEqual(kernelObservation.authority, {
    blueprintVersions: 0,
    blueprintApprovals: 0,
    appliedBlueprints: 0,
  });
  assert.deepEqual(kernelObservation.business, {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  });
  assert.deepEqual(view.authority, {
    blueprintApproval: false,
    appliedBlueprint: false,
    businessTruth: false,
    recommendationConfirmsIntent: false,
    optionSelectionConfirmsIntent: false,
  });
});

test("incomplete interview exposes the missing fact families as a Draft Blocker", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });

  const view = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value:
        "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
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
  });
});

test("Ambiguous owner purpose remains visible and blocks Draft Blueprint generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    purposeIntentState: "Ambiguous",
  });

  assert.equal(
    view.ownerInterview.intentBrief.statements[0].intentState,
    "Ambiguous"
  );
  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.CONFIRMED_PURPOSE_REQUIRED",
        summary:
          "A Confirmed owner purpose is required to anchor a meaningful Draft Blueprint proposal.",
      },
    ],
    draftBlueprint: null,
  });
});

test("empty Confirmed owner purpose cannot anchor Draft Blueprint generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    purposeValue: "",
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.CONFIRMED_PURPOSE_REQUIRED",
        summary:
          "A Confirmed owner purpose is required to anchor a meaningful Draft Blueprint proposal.",
      },
    ],
    draftBlueprint: null,
  });
});

test("empty Confirmed non-purpose fact cannot satisfy required coverage", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: { value: "" },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.STATEMENT_TRACEABILITY_INCOMPLETE",
        statementIdentities: ["intent-statement.safety-and-jurisdiction"],
        summary:
          "Every material statement requires exactly one supported Intent State and an attributable source.",
      },
    ],
    draftBlueprint: null,
  });
});

test("absence of a Confirmed Required Acceptance Condition blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    acceptanceConditions: [],
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.CONFIRMED_REQUIRED_ACCEPTANCE_CONDITION_REQUIRED",
        summary:
          "A Confirmed Required Acceptance Condition is required to anchor a meaningful Draft Blueprint proposal.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Ambiguous data classification is handled as Restricted without losing attribution", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.customer-contact",
          name: "Customer contact category",
          intentState: "Confirmed",
          classificationIntentState: "Ambiguous",
          sensitiveDataClass: "Internal",
          rationale:
            "The owner has not yet separated personal contact details from operational notes.",
          externalAiHandling: "Prohibited",
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.intentBrief.dataCategories, [
    {
      identity: "data-category.customer-contact",
      name: "Customer contact category",
      intentState: "Confirmed",
      classificationIntentState: "Ambiguous",
      sensitiveDataClass: "Restricted",
      classificationProposal: "Internal",
      rationale:
        "The owner has not yet separated personal contact details from operational notes.",
      externalAiHandling: "Prohibited",
      source: {
        kind: "Owner",
        identity: "source.owner.cedar-steam",
        recordedTime: "2026-01-15T09:00:00.000Z",
      },
    },
  ]);
  assert.equal(
    view.ownerInterview.draftReview.disposition,
    "ReadyForDraftProposal"
  );
});

test("invalid primary Sensitive Data Class is not repaired from a valid component class", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.invalid-primary-class",
          name: "Invalid primary class sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "NotAClass",
          componentSensitiveDataClasses: ["Confidential"],
          rationale:
            "The invalid class must remain visible and fail closed rather than being repaired.",
          externalAiHandling: "Prohibited",
        },
      ],
    },
  });

  assert.equal(
    view.ownerInterview.intentBrief.dataCategories[0].sensitiveDataClass,
    "NotAClass"
  );
  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.SENSITIVE_DATA_CLASSIFICATION_INCOMPLETE",
        dataCategoryIdentities: ["data-category.invalid-primary-class"],
        summary:
          "Every named data category requires one supported Sensitive Data Class, rationale, and attributable source.",
      },
    ],
    draftBlueprint: null,
  });
});

test("mixed data inherits the most restrictive Sensitive Data Class", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.mixed-operations-and-customer",
          name: "Mixed operational and customer data",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Internal",
          componentSensitiveDataClasses: ["Internal", "Confidential"],
          rationale:
            "Operational context is combined with fictitious customer-level detail.",
          externalAiHandling: "Prohibited",
        },
      ],
    },
  });

  assert.deepEqual(
    {
      sensitiveDataClass:
        view.ownerInterview.intentBrief.dataCategories[0].sensitiveDataClass,
      classificationProposal:
        view.ownerInterview.intentBrief.dataCategories[0]
          .classificationProposal,
    },
    {
      sensitiveDataClass: "Confidential",
      classificationProposal: "Internal",
    }
  );
});

test("Restricted external-AI intent creates a safety Draft Blocker", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.restricted-sentinel",
          name: "Restricted category sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Restricted",
          rationale:
            "This fictitious category represents data that the declared policy forbids from external processing.",
          externalAiHandling: "ExternalProviderRequested",
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.RESTRICTED_EXTERNAL_AI_FORBIDDEN",
        dataCategoryIdentities: ["data-category.restricted-sentinel"],
        summary:
          "Restricted data must never be sent to an external AI provider in v1.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Internal external-AI intent without its required safeguards creates a Draft Blocker", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.internal-external-ai",
          name: "Internal external AI sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Internal",
          rationale:
            "The category represents non-public low-harm operational data.",
          externalAiHandling: "ExternalProviderRequested",
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.EXTERNAL_AI_HANDLING_UNSUPPORTED",
        dataCategoryIdentities: ["data-category.internal-external-ai"],
        summary:
          "External AI handling for Internal or Confidential data requires every declared class-specific safeguard.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Confidential external-AI intent without jurisdiction handling creates a Draft Blocker", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.confidential-external-ai",
          name: "Confidential external AI sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Confidential",
          rationale: "The category represents detailed commercial information.",
          externalAiHandling: "ExternalProviderRequested",
          externalAiSafeguards: {
            providerPolicyIdentity: "provider-policy.local-review",
            dataMinimization: true,
            ownerApproval: true,
          },
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.EXTERNAL_AI_HANDLING_UNSUPPORTED",
        dataCategoryIdentities: ["data-category.confidential-external-ai"],
        summary:
          "External AI handling for Internal or Confidential data requires every declared class-specific safeguard.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Confidential external-AI intent with every class-specific safeguard remains reviewable", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.confidential-external-ai-supported",
          name: "Supported Confidential external AI sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Confidential",
          rationale:
            "The category represents minimized fictitious commercial information.",
          externalAiHandling: "ExternalProviderRequested",
          externalAiSafeguards: {
            providerPolicyIdentity: "provider-policy.local-review",
            dataMinimization: true,
            ownerApproval: true,
            jurisdictionHandlingProfileIdentity:
              "jurisdiction-handling.local-fictitious",
          },
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "ReadyForDraftProposal",
    draftBlockers: [],
    draftBlueprint: null,
  });
});

test("unknown external-AI provider policy creates an unsupported safety Draft Blocker", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.unknown-provider-policy",
          name: "Unknown provider policy sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Internal",
          rationale:
            "An undeclared provider policy cannot establish supported handling.",
          externalAiHandling: "ExternalProviderRequested",
          externalAiSafeguards: {
            providerPolicyIdentity: "provider-policy.unknown",
            dataMinimization: true,
            ownerApproval: true,
          },
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.UNSUPPORTED_SAFETY_PROFILE",
        dataCategoryIdentities: ["data-category.unknown-provider-policy"],
        summary:
          "An unsupported safety, jurisdiction, or data-handling profile prevents Draft Blueprint generation.",
      },
    ],
    draftBlueprint: null,
  });
});

test("data category without complete classification traceability blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.incomplete-sentinel",
          name: "Incomplete classification sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Internal",
          externalAiHandling: "Prohibited",
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.SENSITIVE_DATA_CLASSIFICATION_INCOMPLETE",
        dataCategoryIdentities: ["data-category.incomplete-sentinel"],
        summary:
          "Every named data category requires one supported Sensitive Data Class, rationale, and attributable source.",
      },
    ],
    draftBlueprint: null,
  });
});

test("data category without its own classification Intent State blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.missing-classification-state",
          name: "Missing classification state sentinel",
          intentState: "Confirmed",
          sensitiveDataClass: "Internal",
          rationale:
            "The category meaning is confirmed but its classification decision is not attributable.",
          externalAiHandling: "Prohibited",
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.SENSITIVE_DATA_CLASSIFICATION_INCOMPLETE",
        dataCategoryIdentities: ["data-category.missing-classification-state"],
        summary:
          "Every named data category requires one supported Sensitive Data Class, rationale, and attributable source.",
      },
    ],
    draftBlueprint: null,
  });
});

test("incomplete Assumption envelope blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    businessShapeAnswer: {
      assumptions: [
        {
          identity: "assumption.incomplete-sentinel",
          intentState: "Assumed",
          proposition: "An illustrative schedule is sufficient.",
          proposerIdentity: "source.agent.local",
          rationale: "The exact schedule is unknown.",
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.ASSUMPTION_INCOMPLETE",
        assumptionIdentities: ["assumption.incomplete-sentinel"],
        summary:
          "Every Assumption requires attributable provisional scope, risk, and a complete resolution path.",
      },
    ],
    draftBlueprint: null,
  });
});

test("non-time-sensitive Assumption does not require a review trigger or expiry", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    businessShapeAnswer: {
      assumptions: [
        {
          identity: "assumption.non-time-sensitive",
          intentState: "Assumed",
          proposition:
            "One illustrative operating-hours profile is sufficient for review.",
          proposerIdentity: "source.agent.local",
          rationale:
            "The exact fictitious hours do not affect governed execution truth.",
          affectedFactFamilies: ["business-shape"],
          affectedDraftBlueprintProposals: [
            "experience.operating-hours-display",
          ],
          consequenceIfFalse:
            "The later Draft may need a different presentation-only schedule.",
          riskIfFalse: "No governed action or invariant changes.",
          resolutionCondition:
            "The owner confirms or rejects the illustrative schedule.",
          expectedEvidence: "An attributable owner schedule decision.",
          responsibleReviewerIdentity: "source.owner.cedar-steam",
          timeSensitive: false,
        },
      ],
    },
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "ReadyForDraftProposal",
    draftBlockers: [],
    draftBlueprint: null,
  });
});

test("incomplete Acceptance Condition envelope blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    acceptanceConditions: [
      {
        identity: "acceptance-condition.incomplete-sentinel",
        intentState: "Confirmed",
        outcome: "Shared reuse remains reviewable.",
        criticality: "Required",
      },
    ],
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.ACCEPTANCE_CONDITION_INCOMPLETE",
        acceptanceConditionIdentities: [
          "acceptance-condition.incomplete-sentinel",
        ],
        summary:
          "Every Acceptance Condition requires an attributable outcome, scope, observable boundary, Evidence path, reviewer, criticality, and dependencies.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Acceptance Condition with an unsupported Intent State blocks Draft generation", async () => {
  const system = await createInterviewSystem();
  const condition = requiredAcceptanceCondition();
  condition.intentState = "Definitely";

  const view = await completeMinimalInterview(system, {
    acceptanceConditions: [condition],
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.ACCEPTANCE_CONDITION_INCOMPLETE",
        acceptanceConditionIdentities: ["acceptance-condition.shared-reuse"],
        summary:
          "Every Acceptance Condition requires an attributable outcome, scope, observable boundary, Evidence path, reviewer, criticality, and dependencies.",
      },
    ],
    draftBlueprint: null,
  });
});

test("material statement without exactly one Intent State blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    omitSafetyIntentState: true,
  });

  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.STATEMENT_TRACEABILITY_INCOMPLETE",
        statementIdentities: ["intent-statement.safety-and-jurisdiction"],
        summary:
          "Every material statement requires exactly one supported Intent State and an attributable source.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Owner Interview rejects prohibited live or real-data fields without creating a new version", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const first = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value: "Use only fictitious sandbox data.",
    },
  });
  const prohibitedFields = [
    "liveCredential",
    "paymentCardNumber",
    "identityDocumentContent",
    "medicalRecord",
    "restrictedExternalAiPayload",
    "realCustomerData",
  ];

  for (const field of prohibitedFields) {
    const rejected = await system.referenceSlice.dispatch({
      type: "reference-slice.answer-owner-interview",
      ownerInterviewIdentity: started.ownerInterview.identity,
      questionIdentity: first.ownerInterview.currentQuestion.identity,
      answer: {
        statementIdentity: "intent-statement.safety-and-jurisdiction",
        intentState: "Confirmed",
        value: "The named data category is prohibited from capture.",
        [field]: "fictitious-prohibited-value-sentinel",
      },
    });

    assert.equal(rejected.mode, "OwnerInterviewInputRejected");
    assert.equal(
      rejected.ownerInterview.intentBrief.versionIdentity,
      first.ownerInterview.intentBrief.versionIdentity
    );
    assert.equal(
      rejected.ownerInterview.currentQuestion.identity,
      first.ownerInterview.currentQuestion.identity
    );
    assert.deepEqual(rejected.diagnostics, [
      {
        code: "INTENT.INPUT.PROHIBITED_DATA",
        field,
        summary:
          "Owner Interview captures data categories and constraints, never live sensitive or real business data.",
      },
    ]);
  }
});

test("Owner Interview rejects prohibited fields nested in structured review data", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const first = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value: "Use only fictitious sandbox data.",
    },
  });

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: first.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.safety-and-jurisdiction",
      intentState: "Confirmed",
      value: "Capture category names and constraints only.",
      dataCategories: [
        {
          identity: "data-category.nested-prohibited-sentinel",
          name: "Nested prohibited sentinel",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Restricted",
          rationale: "The category is prohibited from capture.",
          externalAiHandling: "Prohibited",
          medicalRecord: "fictitious-prohibited-value-sentinel",
        },
      ],
    },
  });

  assert.equal(rejected.mode, "OwnerInterviewInputRejected");
  assert.equal(
    rejected.ownerInterview.intentBrief.versionIdentity,
    first.ownerInterview.intentBrief.versionIdentity
  );
  assert.deepEqual(rejected.diagnostics, [
    {
      code: "INTENT.INPUT.PROHIBITED_DATA",
      field: "medicalRecord",
      summary:
        "Owner Interview captures data categories and constraints, never live sensitive or real business data.",
    },
  ]);
});

test("Owner Interview rejects undeclared sensitive-data aliases without persisting them", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const first = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value: "Use only fictitious sandbox data.",
    },
  });

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: first.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.safety-and-jurisdiction",
      intentState: "Confirmed",
      value: "Capture declared category metadata only.",
      dataCategories: [
        {
          identity: "data-category.undeclared-alias-sentinel",
          name: "Undeclared alias sentinel",
          classificationIntentState: "Confirmed",
          sensitiveDataClass: "Restricted",
          rationale: "The undeclared payload must be rejected.",
          externalAiHandling: "Prohibited",
          credential: "fictitious-undeclared-secret-sentinel",
        },
      ],
    },
  });

  assert.equal(rejected.mode, "OwnerInterviewInputRejected");
  assert.equal(
    rejected.ownerInterview.intentBrief.versionIdentity,
    first.ownerInterview.intentBrief.versionIdentity
  );
  assert.deepEqual(rejected.diagnostics, [
    {
      code: "INTENT.INPUT.UNKNOWN_FIELD",
      field: "credential",
      summary:
        "Owner Interview accepts only declared structured fields and never persists unknown payload properties.",
    },
  ]);
});

test("Owner Interview rejects an explicitly undefined answer through its public seam", async () => {
  const system = await createInterviewSystem();
  const started = await system.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });

  const rejected = await system.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: undefined,
  });

  assert.equal(rejected.mode, "OwnerInterviewInputRejected");
  assert.equal(rejected.ownerInterview.intentBrief, null);
  assert.deepEqual(rejected.diagnostics, [
    {
      code: "INTENT.INPUT.TYPE_MISMATCH",
      field: "answer",
      summary:
        "Owner Interview requires every declared structured field to use its declared value kind.",
    },
  ]);
});

test("Unsupported safety profile remains visible and blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      intentState: "Unsupported",
      value:
        "The requested jurisdiction and external-processing profile is outside the declared v1 safety boundary.",
    },
  });

  const safetyStatement = view.ownerInterview.intentBrief.statements.find(
    (statement) => statement.factFamily === "safety-and-jurisdiction"
  );
  assert.equal(safetyStatement.intentState, "Unsupported");
  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.UNSUPPORTED_SAFETY_PROFILE",
        statementIdentities: ["intent-statement.safety-and-jurisdiction"],
        summary:
          "An unsupported safety, jurisdiction, or data-handling profile prevents Draft Blueprint generation.",
      },
    ],
    draftBlueprint: null,
  });
});

test("Unsupported data classification remains visible and blocks Draft generation", async () => {
  const system = await createInterviewSystem();

  const view = await completeMinimalInterview(system, {
    safetyAnswer: {
      dataCategories: [
        {
          identity: "data-category.unsupported-classification",
          name: "Unsupported classification sentinel",
          intentState: "Confirmed",
          classificationIntentState: "Unsupported",
          sensitiveDataClass: "Internal",
          rationale:
            "The requested classification profile is outside the supported safety boundary.",
          externalAiHandling: "Prohibited",
        },
      ],
    },
  });

  assert.equal(
    view.ownerInterview.intentBrief.dataCategories[0].sensitiveDataClass,
    "Restricted"
  );
  assert.deepEqual(view.ownerInterview.draftReview, {
    disposition: "Blocked",
    draftBlockers: [
      {
        code: "INTENT.DRAFT_BLOCKER.UNSUPPORTED_SAFETY_PROFILE",
        dataCategoryIdentities: ["data-category.unsupported-classification"],
        summary:
          "An unsupported safety, jurisdiction, or data-handling profile prevents Draft Blueprint generation.",
      },
    ],
    draftBlueprint: null,
  });
});

test("atomic local slice reopens one exact immutable Intent Brief Version through dispatch", async (t) => {
  const runDirectory = await mkdtemp(join(tmpdir(), "abos-ticket-02-reopen-"));
  t.after(() => rm(runDirectory, { recursive: true, force: true }));
  const stateFile = join(runDirectory, "state.json");
  const identities = [
    "orchestration-run.owner-interview.persisted",
    "kernel-command.initialize.owner-interview.persisted",
    "owner-interview.persisted",
    "intent-brief.persisted",
    "intent-brief-version.persisted-001",
  ];
  const first = await createLocalReferenceSlice({
    persistence: { kind: "atomic-json", stateFile },
    clock: { now: () => "2026-01-15T09:00:00.000Z" },
    identitySource: { next: () => identities.shift() },
  });
  await first.referenceSlice.dispatch({
    type: "reference-slice.start-empty-authority-shell",
  });
  const started = await first.referenceSlice.dispatch({
    type: "reference-slice.start-owner-interview",
    ownerSourceIdentity: "source.owner.cedar-steam",
  });
  const answered = await first.referenceSlice.dispatch({
    type: "reference-slice.answer-owner-interview",
    ownerInterviewIdentity: started.ownerInterview.identity,
    questionIdentity: started.ownerInterview.currentQuestion.identity,
    answer: {
      statementIdentity: "intent-statement.purpose-and-scope",
      intentState: "Confirmed",
      value: "Use only fictitious sandbox data.",
    },
  });

  const reopened = await createLocalReferenceSlice({
    persistence: { kind: "atomic-json", stateFile },
    clock: { now: () => "2026-01-15T09:00:01.000Z" },
    identitySource: {
      next: () => "orchestration-run.owner-interview.reopened",
    },
  });
  const reviewed = await reopened.referenceSlice.dispatch({
    type: "reference-slice.review-intent-brief",
    ownerInterviewIdentity: started.ownerInterview.identity,
    versionIdentity: answered.ownerInterview.intentBrief.versionIdentity,
  });

  assert.deepEqual(
    reviewed.ownerInterview.intentBrief,
    answered.ownerInterview.intentBrief
  );
});
