const FACT_FAMILIES = Object.freeze([
  "purpose-and-scope",
  "safety-and-jurisdiction",
  "business-shape",
  "customer-and-fulfillment-journey",
  "supply-stock-and-capacity",
  "people-and-governance",
  "money-and-accounting",
  "experience-and-integrations",
]);

const RESTRICTIVE_CLASSIFICATION_STATES = new Set([
  "Unknown",
  "Ambiguous",
  "Conflicting",
  "Assumed",
  "Unsupported",
]);

const INTENT_STATES = new Set([
  "Confirmed",
  "Unknown",
  "Ambiguous",
  "Conflicting",
  "Assumed",
  "Not Applicable",
  "Unsupported",
]);

const SENSITIVE_DATA_CLASS_RANK = Object.freeze({
  Public: 0,
  Internal: 1,
  Confidential: 2,
  Restricted: 3,
});

const EXTERNAL_AI_HANDLING_VOCABULARY = new Set([
  "Prohibited",
  "ExternalProviderRequested",
]);
const SUPPORTED_EXTERNAL_AI_PROVIDER_POLICIES = new Set([
  "provider-policy.local-review",
]);
const SUPPORTED_JURISDICTION_HANDLING_PROFILES = new Set([
  "jurisdiction-handling.local-fictitious",
]);

const PROHIBITED_ANSWER_FIELDS = new Set([
  "liveCredential",
  "paymentCardNumber",
  "identityDocumentContent",
  "medicalRecord",
  "restrictedExternalAiPayload",
  "realCustomerData",
]);

const stringField = () => ({ kind: "string" });
const booleanField = () => ({ kind: "boolean" });
const nullableStringField = () => ({ kind: "nullable-string" });
const arrayField = (element) => ({ kind: "array", element });
const objectField = (fields) => ({ kind: "object", fields });

const STATEMENT_INPUT_SCHEMA = objectField({
  statementIdentity: stringField(),
  intentState: stringField(),
  value: stringField(),
});

const EXTERNAL_AI_SAFEGUARDS_INPUT_SCHEMA = objectField({
  providerPolicyIdentity: stringField(),
  dataMinimization: booleanField(),
  ownerApproval: booleanField(),
  jurisdictionHandlingProfileIdentity: stringField(),
  redaction: booleanField(),
});

const DATA_CATEGORY_INPUT_SCHEMA = objectField({
  identity: stringField(),
  name: stringField(),
  intentState: stringField(),
  classificationIntentState: stringField(),
  sensitiveDataClass: stringField(),
  componentSensitiveDataClasses: arrayField(stringField()),
  rationale: stringField(),
  externalAiHandling: stringField(),
  externalAiSafeguards: EXTERNAL_AI_SAFEGUARDS_INPUT_SCHEMA,
});

const ASSUMPTION_INPUT_SCHEMA = objectField({
  identity: stringField(),
  intentState: stringField(),
  proposition: stringField(),
  proposerIdentity: stringField(),
  rationale: stringField(),
  affectedFactFamilies: arrayField(stringField()),
  affectedDraftBlueprintProposals: arrayField(stringField()),
  consequenceIfFalse: stringField(),
  riskIfFalse: stringField(),
  resolutionCondition: stringField(),
  expectedEvidence: stringField(),
  responsibleReviewerIdentity: stringField(),
  timeSensitive: booleanField(),
  reviewTrigger: stringField(),
  expiresAt: nullableStringField(),
});

const ASSUMPTION_RESOLUTION_INPUT_SCHEMA = objectField({
  assumptionIdentity: stringField(),
  disposition: stringField(),
  resultingStatementIdentity: stringField(),
});

const ACCEPTANCE_SCOPE_INPUT_SCHEMA = objectField({
  roleIdentities: arrayField(stringField()),
  locationIdentities: arrayField(stringField()),
  recordIdentities: arrayField(stringField()),
  workflowIdentities: arrayField(stringField()),
});

const ACCEPTANCE_DEPENDENCIES_INPUT_SCHEMA = objectField({
  assumptionIdentities: arrayField(stringField()),
  constraintIdentities: arrayField(stringField()),
  sensitiveDataCategoryIdentities: arrayField(stringField()),
});

const ACCEPTANCE_CONDITION_INPUT_SCHEMA = objectField({
  identity: stringField(),
  intentState: stringField(),
  outcome: stringField(),
  whyItMatters: stringField(),
  scope: ACCEPTANCE_SCOPE_INPUT_SCHEMA,
  startingContext: stringField(),
  governedBusinessAction: stringField(),
  observableResult: stringField(),
  passCondition: stringField(),
  failureCondition: stringField(),
  exclusions: arrayField(stringField()),
  evidenceRequired: arrayField(stringField()),
  reviewerIdentity: stringField(),
  criticality: stringField(),
  dependencies: ACCEPTANCE_DEPENDENCIES_INPUT_SCHEMA,
});

const ANSWER_INPUT_SCHEMA = objectField({
  statementIdentity: stringField(),
  revisesStatementIdentity: stringField(),
  intentState: stringField(),
  value: stringField(),
  additionalStatements: arrayField(STATEMENT_INPUT_SCHEMA),
  dataCategories: arrayField(DATA_CATEGORY_INPUT_SCHEMA),
  assumptions: arrayField(ASSUMPTION_INPUT_SCHEMA),
  assumptionResolutions: arrayField(ASSUMPTION_RESOLUTION_INPUT_SCHEMA),
  acceptanceConditions: arrayField(ACCEPTANCE_CONDITION_INPUT_SCHEMA),
});

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const findAnswerSchemaViolation = (value, schema, field = "answer") => {
  if (value === undefined) return { kind: "type", field };
  if (schema.kind === "string") {
    return typeof value === "string" ? null : { kind: "type", field };
  }
  if (schema.kind === "nullable-string") {
    return value === null || typeof value === "string"
      ? null
      : { kind: "type", field };
  }
  if (schema.kind === "boolean") {
    return typeof value === "boolean" ? null : { kind: "type", field };
  }
  if (schema.kind === "array") {
    if (!Array.isArray(value)) return { kind: "type", field };
    for (const item of value) {
      const violation = findAnswerSchemaViolation(item, schema.element, field);
      if (violation) return violation;
    }
    return null;
  }
  if (
    schema.kind !== "object" ||
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return { kind: "type", field };
  }
  for (const [nestedField, nestedValue] of Object.entries(value)) {
    if (!Object.hasOwn(schema.fields, nestedField)) {
      return { kind: "unknown", field: nestedField };
    }
    const violation = findAnswerSchemaViolation(
      nestedValue,
      schema.fields[nestedField],
      nestedField
    );
    if (violation) return violation;
  }
  return null;
};

const FIRST_QUESTION = Object.freeze({
  identity: "owner-interview.question.purpose-and-scope",
  factFamily: "purpose-and-scope",
  prompt:
    "What outcome should this business system make demonstrable, and what is explicitly excluded?",
  recommendedAnswer: Object.freeze({
    value:
      "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
    authority: "ProposalOnly",
  }),
  alternatives: Object.freeze([
    "Start with one retail workflow and defer cafe.",
    "Start with one cafe workflow and defer retail.",
  ]),
});

const SECOND_QUESTION = Object.freeze({
  identity: "owner-interview.question.safety-and-jurisdiction",
  factFamily: "safety-and-jurisdiction",
  prompt:
    "Which countries, data categories, retention rules, and external-AI restrictions govern this business?",
  recommendedAnswer: Object.freeze({
    value:
      "Keep the local proof fictitious, classify every named data category, and prohibit Restricted data from external AI.",
    authority: "ProposalOnly",
  }),
  alternatives: Object.freeze([
    "Prohibit all external AI for the local proof.",
    "Defer external integrations while retaining explicit data classifications.",
  ]),
});

const QUESTIONS = Object.freeze([
  FIRST_QUESTION,
  SECOND_QUESTION,
  Object.freeze({
    identity: "owner-interview.question.business-shape",
    factFamily: "business-shape",
    prompt:
      "What goods or services, Locations, hours, languages, currencies, units, taxes, and existing tools shape the business?",
    recommendedAnswer: Object.freeze({
      value:
        "Describe the shared retail and cafe Tenant, its two Locations, IQD, Arabic and English, normalized units, and no import source.",
      authority: "ProposalOnly",
    }),
    alternatives: Object.freeze([
      "Describe the retail Location first.",
      "Describe the cafe Location first.",
    ]),
  }),
  Object.freeze({
    identity: "owner-interview.question.customer-and-fulfillment-journey",
    factFamily: "customer-and-fulfillment-journey",
    prompt:
      "How does a customer request move through Order, Payment, collection or fulfillment, cancellation, and exceptions?",
    recommendedAnswer: Object.freeze({
      value:
        "Retail fulfills at sale while cafe fulfills through the declared Kitchen Ticket states.",
      authority: "ProposalOnly",
    }),
    alternatives: Object.freeze([
      "Describe retail fulfillment first.",
      "Describe cafe preparation first.",
    ]),
  }),
  Object.freeze({
    identity: "owner-interview.question.supply-stock-and-capacity",
    factFamily: "supply-stock-and-capacity",
    prompt:
      "How should suppliers, purchasing, receiving, stock, ingredients, units, capacity, and costing be represented?",
    recommendedAnswer: Object.freeze({
      value:
        "Use fictitious suppliers, normalized units, governed receiving, stock, and ingredient consumption.",
      authority: "ProposalOnly",
    }),
    alternatives: Object.freeze([
      "Defer purchasing and prove stock only.",
      "Defer ingredient consumption and prove receiving only.",
    ]),
  }),
  Object.freeze({
    identity: "owner-interview.question.people-and-governance",
    factFamily: "people-and-governance",
    prompt:
      "Which participants, Roles, responsibilities, governed actions, approvals, separation duties, and Evidence duties are required?",
    recommendedAnswer: Object.freeze({
      value:
        "Separate owner, receiver, cashier, and kitchen responsibilities through declared Roles and Evidence duties.",
      authority: "ProposalOnly",
    }),
    alternatives: Object.freeze([
      "Use one owner Role for the first review.",
      "Defer separation of duty while keeping authority explicit.",
    ]),
  }),
  Object.freeze({
    identity: "owner-interview.question.money-and-accounting",
    factFamily: "money-and-accounting",
    prompt:
      "Which cash, bank, credit, refund, accounting, fiscal, tax, balance, and export needs apply?",
    recommendedAnswer: Object.freeze({
      value:
        "Use fictitious IQD cash Payments and the simple balanced-ledger proof without production balances.",
      authority: "ProposalOnly",
    }),
    alternatives: Object.freeze([
      "Prove balanced Ledger effects without Cash.",
      "Defer refunds while preserving the correction boundary.",
    ]),
  }),
  Object.freeze({
    identity: "owner-interview.question.experience-and-integrations",
    factFamily: "experience-and-integrations",
    prompt:
      "Which devices, offline behavior, Role-specific interfaces, reports, languages, branding, and external systems apply?",
    recommendedAnswer: Object.freeze({
      value:
        "Use the local Guided Cockpit and evidence views with no external integration or production authority.",
      authority: "ProposalOnly",
    }),
    alternatives: Object.freeze([
      "Use terminal and canonical JSON only.",
      "Add a local static review surface while keeping execution offline.",
    ]),
  }),
]);

const ownerSource = (interview, recordedTime) => ({
  kind: "Owner",
  identity: interview.ownerSourceIdentity,
  recordedTime,
});

const attributableStatement = ({
  statementIdentity,
  intentState,
  value,
  factFamily,
  interview,
  recordedTime,
}) => ({
  identity: statementIdentity,
  factFamily,
  intentState,
  value,
  source: ownerSource(interview, recordedTime),
});

const attributableAssumption = (assumption, interview, recordedTime) => {
  const { proposerIdentity, ...content } = assumption;
  return {
    ...structuredClone(content),
    proposer: {
      kind: "AgentProposal",
      identity: proposerIdentity,
    },
    source: ownerSource(interview, recordedTime),
  };
};

const attributableAssumptionResolution = (
  resolution,
  interview,
  recordedTime
) => ({
  ...structuredClone(resolution),
  source: ownerSource(interview, recordedTime),
});

const attributableDataCategory = (category, interview, recordedTime) => {
  const content = structuredClone(category);
  const componentClasses = content.componentSensitiveDataClasses ?? [];
  const primaryClassIsValid =
    content.sensitiveDataClass in SENSITIVE_DATA_CLASS_RANK;
  const componentClassesAreValid =
    Array.isArray(componentClasses) &&
    componentClasses.every(
      (candidate) => candidate in SENSITIVE_DATA_CLASS_RANK
    );
  if (primaryClassIsValid && componentClassesAreValid) {
    const inheritedClass = [
      content.sensitiveDataClass,
      ...componentClasses,
    ].sort(
      (left, right) =>
        SENSITIVE_DATA_CLASS_RANK[right] - SENSITIVE_DATA_CLASS_RANK[left]
    )[0];
    const effectiveClass = RESTRICTIVE_CLASSIFICATION_STATES.has(
      content.classificationIntentState
    )
      ? "Restricted"
      : inheritedClass;
    if (effectiveClass !== content.sensitiveDataClass) {
      content.classificationProposal = content.sensitiveDataClass;
      content.sensitiveDataClass = effectiveClass;
    }
  }
  return {
    ...content,
    source: ownerSource(interview, recordedTime),
  };
};

const blockedDraftReview = (draftBlocker) => ({
  disposition: "Blocked",
  draftBlockers: [draftBlocker],
  draftBlueprint: null,
});

const draftReviewFor = (interview, intentBrief) => {
  const missingFactFamilies = interview.factFamilyProgress
    .filter((family) => family.disposition === "Unanswered")
    .map((family) => family.identity);
  if (missingFactFamilies.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.REQUIRED_FACT_FAMILY_MISSING",
      factFamilies: missingFactFamilies,
      summary:
        "Every required fact family must be represented before a Draft Blueprint may be proposed.",
    });
  }

  const hasConfirmedPurpose = intentBrief.statements.some(
    (candidate) =>
      candidate.factFamily === "purpose-and-scope" &&
      candidate.intentState === "Confirmed" &&
      typeof candidate.value === "string" &&
      candidate.value.trim().length > 0
  );
  const hasConfirmedRequiredAcceptance = (
    intentBrief.acceptanceConditions ?? []
  ).some(
    (condition) =>
      condition.intentState === "Confirmed" &&
      condition.criticality === "Required"
  );
  const incompleteStatements = intentBrief.statements
    .filter(
      (statement) =>
        !isNonEmptyString(statement.identity) ||
        !FACT_FAMILIES.includes(statement.factFamily) ||
        !INTENT_STATES.has(statement.intentState) ||
        (statement.factFamily !== "purpose-and-scope" &&
          !isNonEmptyString(statement.value)) ||
        statement.source?.kind !== "Owner" ||
        !isNonEmptyString(statement.source?.identity) ||
        !isNonEmptyString(statement.source?.recordedTime)
    )
    .map((statement) => statement.identity ?? null);
  const restrictedExternalAiCategories = (intentBrief.dataCategories ?? [])
    .filter(
      (category) =>
        category.sensitiveDataClass === "Restricted" &&
        category.externalAiHandling !== "Prohibited"
    )
    .map((category) => category.identity);
  const unsupportedExternalAiCategories = (intentBrief.dataCategories ?? [])
    .filter((category) => {
      if (
        !["Internal", "Confidential"].includes(category.sensitiveDataClass) ||
        category.externalAiHandling === "Prohibited"
      ) {
        return false;
      }
      const lacksSharedSafeguard =
        !isNonEmptyString(
          category.externalAiSafeguards?.providerPolicyIdentity
        ) ||
        category.externalAiSafeguards?.dataMinimization !== true ||
        category.externalAiSafeguards?.ownerApproval !== true;
      const lacksConfidentialSafeguard =
        category.sensitiveDataClass === "Confidential" &&
        !isNonEmptyString(
          category.externalAiSafeguards?.jurisdictionHandlingProfileIdentity
        );
      return lacksSharedSafeguard || lacksConfidentialSafeguard;
    })
    .map((category) => category.identity);
  const unsupportedSafetyStatements = intentBrief.statements
    .filter(
      (statement) =>
        statement.factFamily === "safety-and-jurisdiction" &&
        statement.intentState === "Unsupported"
    )
    .map((statement) => statement.identity);
  const unsupportedSafetyCategories = (intentBrief.dataCategories ?? [])
    .filter((category) => {
      if (
        category.intentState === "Unsupported" ||
        category.classificationIntentState === "Unsupported"
      ) {
        return true;
      }
      if (!EXTERNAL_AI_HANDLING_VOCABULARY.has(category.externalAiHandling)) {
        return true;
      }
      if (category.externalAiHandling === "Prohibited") return false;
      const providerPolicyIdentity =
        category.externalAiSafeguards?.providerPolicyIdentity;
      if (
        isNonEmptyString(providerPolicyIdentity) &&
        !SUPPORTED_EXTERNAL_AI_PROVIDER_POLICIES.has(providerPolicyIdentity)
      ) {
        return true;
      }
      const jurisdictionHandlingProfileIdentity =
        category.externalAiSafeguards?.jurisdictionHandlingProfileIdentity;
      return (
        category.sensitiveDataClass === "Confidential" &&
        isNonEmptyString(jurisdictionHandlingProfileIdentity) &&
        !SUPPORTED_JURISDICTION_HANDLING_PROFILES.has(
          jurisdictionHandlingProfileIdentity
        )
      );
    })
    .map((category) => category.identity);
  const incompleteDataCategories = (intentBrief.dataCategories ?? [])
    .filter(
      (category) =>
        !isNonEmptyString(category.identity) ||
        !isNonEmptyString(category.name) ||
        !INTENT_STATES.has(category.intentState) ||
        !INTENT_STATES.has(category.classificationIntentState) ||
        !(category.sensitiveDataClass in SENSITIVE_DATA_CLASS_RANK) ||
        (category.componentSensitiveDataClasses !== undefined &&
          (!Array.isArray(category.componentSensitiveDataClasses) ||
            category.componentSensitiveDataClasses.some(
              (candidate) => !(candidate in SENSITIVE_DATA_CLASS_RANK)
            ))) ||
        !isNonEmptyString(category.rationale) ||
        !isNonEmptyString(category.source?.identity)
    )
    .map((category) => category.identity ?? null);
  const incompleteAssumptions = (intentBrief.assumptions ?? [])
    .filter(
      (assumption) =>
        !isNonEmptyString(assumption.identity) ||
        assumption.intentState !== "Assumed" ||
        !isNonEmptyString(assumption.proposition) ||
        !isNonEmptyString(assumption.proposer?.identity) ||
        !isNonEmptyString(assumption.source?.identity) ||
        !isNonEmptyString(assumption.rationale) ||
        !Array.isArray(assumption.affectedFactFamilies) ||
        !Array.isArray(assumption.affectedDraftBlueprintProposals) ||
        assumption.affectedFactFamilies.length +
          assumption.affectedDraftBlueprintProposals.length ===
          0 ||
        !isNonEmptyString(assumption.consequenceIfFalse) ||
        !isNonEmptyString(assumption.riskIfFalse) ||
        !isNonEmptyString(assumption.resolutionCondition) ||
        !isNonEmptyString(assumption.expectedEvidence) ||
        !isNonEmptyString(assumption.responsibleReviewerIdentity) ||
        (assumption.timeSensitive === true &&
          !isNonEmptyString(assumption.reviewTrigger) &&
          !isNonEmptyString(assumption.expiresAt))
    )
    .map((assumption) => assumption.identity ?? null);
  const incompleteAcceptanceConditions = (
    intentBrief.acceptanceConditions ?? []
  )
    .filter(
      (condition) =>
        !isNonEmptyString(condition.identity) ||
        !INTENT_STATES.has(condition.intentState) ||
        !isNonEmptyString(condition.outcome) ||
        !isNonEmptyString(condition.whyItMatters) ||
        !condition.scope ||
        !Array.isArray(condition.scope.roleIdentities) ||
        !Array.isArray(condition.scope.locationIdentities) ||
        !Array.isArray(condition.scope.recordIdentities) ||
        !Array.isArray(condition.scope.workflowIdentities) ||
        !isNonEmptyString(condition.startingContext) ||
        !isNonEmptyString(condition.governedBusinessAction) ||
        !isNonEmptyString(condition.observableResult) ||
        !isNonEmptyString(condition.passCondition) ||
        !isNonEmptyString(condition.failureCondition) ||
        !Array.isArray(condition.exclusions) ||
        !Array.isArray(condition.evidenceRequired) ||
        condition.evidenceRequired.length === 0 ||
        !isNonEmptyString(condition.reviewerIdentity) ||
        !["Required", "Desired"].includes(condition.criticality) ||
        !condition.dependencies ||
        !Array.isArray(condition.dependencies.assumptionIdentities) ||
        !Array.isArray(condition.dependencies.constraintIdentities) ||
        !Array.isArray(
          condition.dependencies.sensitiveDataCategoryIdentities
        ) ||
        !isNonEmptyString(condition.source?.identity)
    )
    .map((condition) => condition.identity ?? null);

  if (incompleteStatements.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.STATEMENT_TRACEABILITY_INCOMPLETE",
      statementIdentities: incompleteStatements,
      summary:
        "Every material statement requires exactly one supported Intent State and an attributable source.",
    });
  }
  if (!hasConfirmedPurpose) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.CONFIRMED_PURPOSE_REQUIRED",
      summary:
        "A Confirmed owner purpose is required to anchor a meaningful Draft Blueprint proposal.",
    });
  }
  if (incompleteAcceptanceConditions.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.ACCEPTANCE_CONDITION_INCOMPLETE",
      acceptanceConditionIdentities: incompleteAcceptanceConditions,
      summary:
        "Every Acceptance Condition requires an attributable outcome, scope, observable boundary, Evidence path, reviewer, criticality, and dependencies.",
    });
  }
  if (!hasConfirmedRequiredAcceptance) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.CONFIRMED_REQUIRED_ACCEPTANCE_CONDITION_REQUIRED",
      summary:
        "A Confirmed Required Acceptance Condition is required to anchor a meaningful Draft Blueprint proposal.",
    });
  }
  if (unsupportedSafetyStatements.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.UNSUPPORTED_SAFETY_PROFILE",
      statementIdentities: unsupportedSafetyStatements,
      summary:
        "An unsupported safety, jurisdiction, or data-handling profile prevents Draft Blueprint generation.",
    });
  }
  if (unsupportedSafetyCategories.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.UNSUPPORTED_SAFETY_PROFILE",
      dataCategoryIdentities: unsupportedSafetyCategories,
      summary:
        "An unsupported safety, jurisdiction, or data-handling profile prevents Draft Blueprint generation.",
    });
  }
  if (incompleteDataCategories.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.SENSITIVE_DATA_CLASSIFICATION_INCOMPLETE",
      dataCategoryIdentities: incompleteDataCategories,
      summary:
        "Every named data category requires one supported Sensitive Data Class, rationale, and attributable source.",
    });
  }
  if (unsupportedExternalAiCategories.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.EXTERNAL_AI_HANDLING_UNSUPPORTED",
      dataCategoryIdentities: unsupportedExternalAiCategories,
      summary:
        "External AI handling for Internal or Confidential data requires every declared class-specific safeguard.",
    });
  }
  if (incompleteAssumptions.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.ASSUMPTION_INCOMPLETE",
      assumptionIdentities: incompleteAssumptions,
      summary:
        "Every Assumption requires attributable provisional scope, risk, and a complete resolution path.",
    });
  }
  if (restrictedExternalAiCategories.length > 0) {
    return blockedDraftReview({
      code: "INTENT.DRAFT_BLOCKER.RESTRICTED_EXTERNAL_AI_FORBIDDEN",
      dataCategoryIdentities: restrictedExternalAiCategories,
      summary:
        "Restricted data must never be sent to an external AI provider in v1.",
    });
  }
  return {
    disposition: "ReadyForDraftProposal",
    draftBlockers: [],
    draftBlueprint: null,
  };
};

export class OwnerWorkbench {
  constructor({ identitySource, store }) {
    this.identitySource = identitySource;
    this.store = store;
  }

  async start({ tenantIdentity, ownerSourceIdentity }) {
    const current = await this.store.read();
    const interview = {
      identity: this.identitySource.next(),
      tenantIdentity,
      ownerSourceIdentity,
      factFamilyProgress: FACT_FAMILIES.map((identity) => ({
        identity,
        disposition: "Unanswered",
      })),
      currentQuestion: structuredClone(FIRST_QUESTION),
      intentBrief: null,
    };
    const committed = await this.store.transact(current.revision, (state) => {
      state.interviews.push(structuredClone(interview));
      return { state, result: interview };
    });
    return committed.result;
  }

  async answer({
    ownerInterviewIdentity,
    questionIdentity,
    answer,
    recordedTime,
  }) {
    const current = await this.store.read();
    const interview = current.interviews.find(
      (candidate) => candidate.identity === ownerInterviewIdentity
    );
    const inputViolation = findAnswerSchemaViolation(
      answer,
      ANSWER_INPUT_SCHEMA
    );
    if (interview && inputViolation) {
      const containsProhibitedData =
        inputViolation.kind === "unknown" &&
        PROHIBITED_ANSWER_FIELDS.has(inputViolation.field);
      return {
        kind: "OwnerInterviewInputRejection",
        ownerInterview: structuredClone(interview),
        diagnostics: [
          {
            code: containsProhibitedData
              ? "INTENT.INPUT.PROHIBITED_DATA"
              : inputViolation.kind === "unknown"
                ? "INTENT.INPUT.UNKNOWN_FIELD"
                : "INTENT.INPUT.TYPE_MISMATCH",
            field: inputViolation.field,
            summary: containsProhibitedData
              ? "Owner Interview captures data categories and constraints, never live sensitive or real business data."
              : inputViolation.kind === "unknown"
                ? "Owner Interview accepts only declared structured fields and never persists unknown payload properties."
                : "Owner Interview requires every declared structured field to use its declared value kind.",
          },
        ],
      };
    }
    const revisedStatement = interview?.intentBrief?.statements.find(
      (statement) => statement.identity === answer.revisesStatementIdentity
    );
    const question = QUESTIONS.find(
      (candidate) => candidate.identity === questionIdentity
    );
    const isCurrentQuestion =
      interview?.currentQuestion?.identity === questionIdentity;
    const isKnownCorrection =
      revisedStatement?.factFamily === question?.factFamily;
    const revisionWasRequested = isNonEmptyString(
      answer.revisesStatementIdentity
    );
    if (
      !interview ||
      !question ||
      (revisionWasRequested && !revisedStatement) ||
      (!isCurrentQuestion && !isKnownCorrection)
    ) {
      throw new Error("The Owner Interview question is stale or unknown.");
    }

    const previousIntentBrief = interview.intentBrief;
    const statement = attributableStatement({
      ...answer,
      factFamily:
        revisedStatement?.factFamily ?? interview.currentQuestion?.factFamily,
      interview,
      recordedTime,
    });
    const additionalStatements = (answer.additionalStatements ?? []).map(
      (additional) =>
        attributableStatement({
          ...additional,
          factFamily: question.factFamily,
          interview,
          recordedTime,
        })
    );
    const statements = revisedStatement
      ? previousIntentBrief.statements.map((existing) =>
          existing.identity === answer.revisesStatementIdentity
            ? statement
            : existing
        )
      : [
          ...(previousIntentBrief?.statements ?? []),
          statement,
          ...additionalStatements,
        ];
    const dataCategories = [
      ...(previousIntentBrief?.dataCategories ?? []),
      ...(answer.dataCategories ?? []).map((category) =>
        attributableDataCategory(category, interview, recordedTime)
      ),
    ];
    const assumptionResolutions = [
      ...(previousIntentBrief?.assumptionResolutions ?? []),
      ...(answer.assumptionResolutions ?? []).map((resolution) =>
        attributableAssumptionResolution(resolution, interview, recordedTime)
      ),
    ];
    const resolvedAssumptionIdentities = new Set(
      (answer.assumptionResolutions ?? []).map(
        (resolution) => resolution.assumptionIdentity
      )
    );
    const assumptions = [
      ...(previousIntentBrief?.assumptions ?? []),
      ...(answer.assumptions ?? []).map((assumption) =>
        attributableAssumption(assumption, interview, recordedTime)
      ),
    ].filter(
      (assumption) => !resolvedAssumptionIdentities.has(assumption.identity)
    );
    const acceptanceConditions = [
      ...(previousIntentBrief?.acceptanceConditions ?? []),
      ...(answer.acceptanceConditions ?? []).map((condition) => ({
        ...structuredClone(condition),
        source: ownerSource(interview, recordedTime),
      })),
    ];
    const intentBrief = {
      identity: previousIntentBrief?.identity ?? this.identitySource.next(),
      versionIdentity: this.identitySource.next(),
      versionNumber: (previousIntentBrief?.versionNumber ?? 0) + 1,
      parentVersionIdentity: previousIntentBrief?.versionIdentity ?? null,
      tenantIdentity: interview.tenantIdentity,
      ownerInterviewIdentity: interview.identity,
      recordedTime,
      statements,
      ...(dataCategories.length > 0 ? { dataCategories } : {}),
      ...(assumptions.length > 0 ? { assumptions } : {}),
      ...(assumptionResolutions.length > 0 ? { assumptionResolutions } : {}),
      ...(acceptanceConditions.length > 0 ? { acceptanceConditions } : {}),
    };
    interview.intentBrief = intentBrief;
    if (!revisedStatement) {
      const answeredQuestionIndex = QUESTIONS.findIndex(
        (question) => question.identity === questionIdentity
      );
      interview.factFamilyProgress[answeredQuestionIndex].disposition =
        answer.intentState === "Not Applicable" ? "NotApplicable" : "Answered";
      interview.currentQuestion = QUESTIONS[answeredQuestionIndex + 1]
        ? structuredClone(QUESTIONS[answeredQuestionIndex + 1])
        : null;
    }
    interview.draftReview = draftReviewFor(interview, intentBrief);
    const committed = await this.store.transact(current.revision, (state) => {
      const interviewIndex = state.interviews.findIndex(
        (candidate) => candidate.identity === interview.identity
      );
      state.interviews[interviewIndex] = structuredClone(interview);
      state.intentBriefVersions.push({
        ownerInterviewIdentity: interview.identity,
        reviewProjection: structuredClone(interview),
      });
      return { state, result: interview };
    });
    return committed.result;
  }

  async review({ ownerInterviewIdentity, versionIdentity }) {
    const state = await this.store.read();
    const interview = state.interviews.find(
      (candidate) => candidate.identity === ownerInterviewIdentity
    );
    const reviewProjection = state.intentBriefVersions.find(
      (version) =>
        version.ownerInterviewIdentity === ownerInterviewIdentity &&
        version.reviewProjection.intentBrief.versionIdentity === versionIdentity
    )?.reviewProjection;
    if (!interview || !reviewProjection) {
      throw new Error("The Intent Brief Version is unknown.");
    }
    return structuredClone(reviewProjection);
  }
}
