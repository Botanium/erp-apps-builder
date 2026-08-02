import { z } from "zod";

export const machineIdentity = z.string().regex(/^[a-z0-9][a-z0-9.-]+$/);

const statement = z
  .object({
    statementIdentity: z.string(),
    intentState: z.string(),
    value: z.string(),
  })
  .strict();

const externalAiSafeguards = z
  .object({
    providerPolicyIdentity: z.string(),
    dataMinimization: z.boolean(),
    ownerApproval: z.boolean(),
    jurisdictionHandlingProfileIdentity: z.string(),
    redaction: z.boolean(),
  })
  .strict();

const dataCategory = z
  .object({
    identity: z.string(),
    name: z.string(),
    intentState: z.string(),
    classificationIntentState: z.string(),
    sensitiveDataClass: z.string(),
    componentSensitiveDataClasses: z.array(z.string()),
    rationale: z.string(),
    externalAiHandling: z.string(),
    externalAiSafeguards,
  })
  .strict();

const assumption = z
  .object({
    identity: z.string(),
    intentState: z.string(),
    proposition: z.string(),
    proposerIdentity: z.string(),
    rationale: z.string(),
    affectedFactFamilies: z.array(z.string()),
    affectedDraftBlueprintProposals: z.array(z.string()),
    consequenceIfFalse: z.string(),
    riskIfFalse: z.string(),
    resolutionCondition: z.string(),
    expectedEvidence: z.string(),
    responsibleReviewerIdentity: z.string(),
    timeSensitive: z.boolean(),
    reviewTrigger: z.string(),
    expiresAt: z.string().nullable(),
  })
  .strict();

const acceptanceCondition = z
  .object({
    identity: z.string(),
    intentState: z.string(),
    outcome: z.string(),
    whyItMatters: z.string(),
    scope: z
      .object({
        roleIdentities: z.array(z.string()),
        locationIdentities: z.array(z.string()),
        recordIdentities: z.array(z.string()),
        workflowIdentities: z.array(z.string()),
      })
      .strict(),
    startingContext: z.string(),
    governedBusinessAction: z.string(),
    observableResult: z.string(),
    passCondition: z.string(),
    failureCondition: z.string(),
    exclusions: z.array(z.string()),
    evidenceRequired: z.array(z.string()),
    reviewerIdentity: z.string(),
    criticality: z.string(),
    dependencies: z
      .object({
        assumptionIdentities: z.array(z.string()),
        constraintIdentities: z.array(z.string()),
        sensitiveDataCategoryIdentities: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export const ownerInterviewAnswer = z
  .object({
    statementIdentity: z.string().optional(),
    revisesStatementIdentity: z.string().optional(),
    intentState: z.string().optional(),
    value: z.string().optional(),
    additionalStatements: z.array(statement).optional(),
    dataCategories: z.array(dataCategory).optional(),
    assumptions: z.array(assumption).optional(),
    acceptanceConditions: z.array(acceptanceCondition).optional(),
  })
  .strict();
