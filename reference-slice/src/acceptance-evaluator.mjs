import { canonicalJson, contentIdentity, deepClone } from "./canonical.mjs";

const DEFINITIONS = [
  ["condition.owner-interview-authority", "Owner Interview preserves Draft and explicit approval authority", observeOwnerAuthority],
  ["condition.shared-blueprint-two-targets", "One Effective Blueprint applies independently to retail and cafe", observeSharedBlueprint],
  ["condition.retail-golden-transaction", "Retail Golden Transaction reaches every fixed literal", observeRetail],
  ["condition.cafe-order-to-kitchen", "Cafe order-to-kitchen reaches every state and fixed literal", observeCafe],
  ["condition.fail-closed-matrix", "The complete negative-path matrix preserves governed effects", observeNegativeMatrix],
  ["condition.audit-and-invariants", "Stock, ledger, cash, causation, and isolation invariants hold", observeInvariants],
  ["condition.deterministic-replay", "Retail and cafe replay with equal business meaning", observeReplay],
  ["condition.final-clean-reset", "Both targets finish clean and unapplied after the second reset", observeFinalReset],
  ["condition.run-budget", "The versioned Run Budget reconciles within its authorized ceiling", observeBudget],
  ["condition.data-boundary", "The fixture remains fictitious, sandbox-only, and externally disconnected", observeDataBoundary],
  ["condition.control-completion", "Gates, command results, observations, and effect status are reconciled", observeControlCompletion],
  ["condition.version-binding", "Suite, fixture, source, Kernel, schema, compiler, and policies are exactly bound", observeVersionBinding],
];

export class AcceptanceEvaluator {
  evaluate(input) {
    const evidence = deepClone(input);
    const conditions = DEFINITIONS.map(([identity, label, observer]) => evaluateCondition(identity, label, observer, evidence));
    const required = conditions.filter(condition => condition.criticality === "Required");
    const verdict = required.some(condition => condition.verdict === "Indeterminate")
      ? "Indeterminate"
      : required.some(condition => condition.verdict === "Unsatisfied")
        ? "Failed"
        : "Passed";
    const observations = conditions.map((condition, index) => ({
      identity: `observation.reference-slice.${index + 1}`,
      completionConditionId: condition.identity,
      verdict: condition.verdict,
      durableSourceReferences: condition.sourceReferences,
      responsibleObserver: "acceptance-evaluator@1.0.0",
      effectiveTime: "2026-01-15T09:30:00.000Z",
      recordedTime: "2026-01-15T09:30:00.000Z",
      diagnostics: condition.diagnostics,
    }));
    const orchestration = deepClone(evidence.orchestration ?? {});
    orchestration.observations = observations;
    orchestration.runCompletionRecord = verdict === "Passed" ? {
      identity: "run-completion.reference-slice.01",
      orchestrationRunIdentity: orchestration.runIdentity,
      state: "Completed",
      finalControlPhase: "Observing",
      completionConditionIds: conditions.map(condition => condition.identity),
      observationIds: observations.map(observation => observation.identity),
      kernelCommandResultCount: evidence.final?.commandResults?.length ?? 0,
      unresolvedRequiredFailures: 0,
      responsibleSource: "acceptance-evaluator@1.0.0",
      effectiveTime: "2026-01-15T09:30:00.000Z",
      recordedTime: "2026-01-15T09:30:00.000Z",
    } : null;

    const body = {
      reportIdentity: "reference-slice.acceptance-report.cedar-steam.01",
      verdict,
      suite: evidence.suite ?? null,
      fixture: evidence.fixture ?? null,
      source: evidence.source ?? null,
      versionSet: evidence.versionSet ?? null,
      conditions,
      orchestration,
      evidence,
      limitations: [
        "Local sandbox proof with fictitious data only.",
        "No production authentication, scaling, backups, billing, external integrations, deployment, or production hardening.",
        "Passed is machine-verifiable prototype evidence, not owner acceptance or production readiness.",
      ],
    };
    return { ...body, contentIdentity: contentIdentity(body) };
  }
}

function evaluateCondition(identity, label, observer, evidence) {
  try {
    const result = observer(evidence);
    if (result === undefined) return condition(identity, label, "Indeterminate", ["Required evidence is absent, stale, or non-comparable."], []);
    return condition(identity, label, result.satisfied ? "Satisfied" : "Unsatisfied", result.diagnostics ?? [], result.sourceReferences ?? []);
  } catch (error) {
    return condition(identity, label, "Indeterminate", [`Observation could not be established: ${error.message}`], []);
  }
}

function condition(identity, label, verdict, diagnostics, sourceReferences) {
  return { identity, version: "1.0.0", label, criticality: "Required", verdict, diagnostics, sourceReferences };
}

function observeOwnerAuthority(evidence) {
  const v1 = evidence.ownerInterview?.versionOne;
  const v2 = evidence.ownerInterview?.versionTwo;
  const approval = evidence.governance?.approval;
  const premature = evidence.governance?.prematureProvisionResults;
  if (!v1 || !v2 || !approval || !premature) return undefined;
  return result(
    v1.intentBrief.version === 1
      && v1.blueprint.lifecycle === "Draft"
      && v1.blueprint.approvalEligible === false
      && v1.blueprint.blockers.some(diagnostic => diagnostic.code === "CFG.TRACEABILITY.ASSUMPTION_ACTIVE")
      && premature.every(item => item.disposition === "Rejected")
      && v2.intentBrief.version === 2
      && v2.blueprint.reference.versionId !== v1.blueprint.reference.versionId
      && approval.reference.versionId === v2.blueprint.reference.versionId,
    ["ownerInterview.versionOne", "ownerInterview.versionTwo", "governance.approval"],
  );
}

function observeSharedBlueprint(evidence) {
  const first = evidence.firstProvisioning;
  if (!first) return undefined;
  return result(
    first.compilationRecords?.length === 1
      && first.provisioningAttempts?.length === 2
      && first.targets?.retail?.appliedBlueprint?.contentIdentity === first.targets?.cafe?.appliedBlueprint?.contentIdentity
      && first.targets?.retail?.activeConfiguration?.effectiveBlueprintContentIdentity === first.effectiveBlueprint?.contentIdentity
      && first.targets?.cafe?.activeConfiguration?.effectiveBlueprintContentIdentity === first.effectiveBlueprint?.contentIdentity,
    ["firstProvisioning.effectiveBlueprint", "firstProvisioning.provisioningAttempts"],
  );
}

function observeRetail(evidence) {
  const retail = evidence.firstRun?.retail;
  if (!retail) return undefined;
  const widget = retail.stock?.["catalog.widget"];
  return result(
    widget?.quantity === 6 && widget.unit === "each" && widget.valueMinor === 3000
      && retail.accounts?.Inventory === 3000 && retail.accounts?.Cash === 4800
      && retail.accounts?.["Accounts Receivable"] === 0
      && retail.accounts?.["Cost of Goods Sold"] === 2000
      && retail.accounts?.["Accounts Payable"] === -5000
      && retail.accounts?.["Sales Revenue"] === -4800
      && retail.trialBalance?.debitsMinor === 9800 && retail.trialBalance?.creditsMinor === 9800
      && retail.payments?.[0]?.residualMinor === 0,
    ["firstRun.retail"],
  );
}

function observeCafe(evidence) {
  const cafe = evidence.firstRun?.cafe;
  const checkpoints = evidence.firstRun?.cafeCheckpoints;
  if (!cafe || !checkpoints) return undefined;
  const ticket = cafe.records?.find(record => record.identity === "kitchen-ticket.cafe.01");
  const inert = ["accepted", "preparing", "ready"].every(state => checkpoints[state]?.movements?.length === 2 && checkpoints[state]?.accounts?.["Sales Revenue"] === 0 && checkpoints[state]?.accounts?.["Cost of Goods Sold"] === 0);
  return result(
    inert
      && ticket?.state === "fulfilled"
      && canonicalJson(ticket.stateHistory) === canonicalJson(["accepted", "preparing", "ready", "fulfilled"])
      && cafe.stock?.["ingredient.beans"]?.quantity === 973 && cafe.stock?.["ingredient.beans"]?.valueMinor === 1946
      && cafe.stock?.["ingredient.milk"]?.quantity === 1880 && cafe.stock?.["ingredient.milk"]?.valueMinor === 1880
      && cafe.accounts?.Inventory === 3826 && cafe.accounts?.Cash === 900
      && cafe.accounts?.["Accounts Receivable"] === 0 && cafe.accounts?.["Cost of Goods Sold"] === 174
      && cafe.accounts?.["Accounts Payable"] === -4000 && cafe.accounts?.["Sales Revenue"] === -900
      && cafe.trialBalance?.debitsMinor === 4900 && cafe.trialBalance?.creditsMinor === 4900,
    ["firstRun.cafe", "firstRun.cafeCheckpoints"],
  );
}

function observeNegativeMatrix(evidence) {
  const paths = evidence.negativePaths;
  if (!Array.isArray(paths)) return undefined;
  const required = ["draft-authority", "configuration-rejection", "assumption", "stale-approval", "idempotency", "scope-isolation", "financial-stock", "kitchen-inertness", "payment-residual", "immutable-effects", "stale-reset", "sentinel-isolation"];
  return result(required.every(identity => paths.some(path => path.identity === identity && path.satisfied === true)), ["negativePaths"]);
}

function observeInvariants(evidence) {
  const reports = [evidence.firstRun?.retail, evidence.firstRun?.cafe, evidence.replay?.retail, evidence.replay?.cafe];
  const exports = [evidence.firstRun?.sandboxExports?.retail, evidence.firstRun?.sandboxExports?.cafe, evidence.replay?.sandboxExports?.retail, evidence.replay?.sandboxExports?.cafe];
  if (reports.some(report => !report) || exports.some(item => !item)) return undefined;
  const exportsValid = exports.every(item => {
    const { contentIdentity: recorded, ...body } = item;
    return recorded === contentIdentity(body) && Object.values(item.derived.invariants).every(Boolean);
  });
  return result(reports.every(report => Object.values(report.invariants ?? {}).every(Boolean) && report.trialBalance?.differenceMinor === 0) && exportsValid, ["firstRun", "replay"]);
}

function observeReplay(evidence) {
  if (!evidence.firstRun || !evidence.replay) return undefined;
  return result(evidence.replay.businessContentIdentity === evidence.firstRun.businessContentIdentity, ["firstRun.businessContentIdentity", "replay.businessContentIdentity"]);
}

function observeFinalReset(evidence) {
  const targets = evidence.final?.targets;
  if (!targets) return undefined;
  return result([targets.retail, targets.cafe].every(target => target?.generationNumber === 3 && target.appliedBlueprint === null && [target.records, target.events, target.movements, target.postingSets, target.payments].every(collection => collection?.length === 0)), ["final.targets", "resetRounds"]);
}

function observeBudget(evidence) {
  const budget = evidence.orchestration?.runBudget;
  if (!budget) return undefined;
  const within = Object.entries(budget.consumed).every(([dimension, consumed]) => consumed <= budget.limits[dimension]);
  return result(budget.reconciled === true && within, ["orchestration.runBudget"]);
}

function observeDataBoundary(evidence) {
  const boundary = evidence.dataBoundary;
  const exports = evidence.firstRun?.sandboxExports;
  if (!boundary || !exports) return undefined;
  const retailText = canonicalJson(exports.retail);
  const cafeText = canonicalJson(exports.cafe);
  const isolated = exports.retail.targetId === "retail" && exports.cafe.targetId === "cafe"
    && !retailText.includes("tenant.isolation-sentinel") && !cafeText.includes("tenant.isolation-sentinel")
    && !retailText.includes("generation.cafe") && !cafeText.includes("generation.retail");
  return result(boundary.fictitiousOnly === true && boundary.externalAi === "absent" && boundary.networkIntegrations === "absent" && boundary.productionAuthority === "absent" && boundary.restrictedDataCategories === 0 && boundary.exclusions?.includes("production-deployment") && isolated, ["dataBoundary", "firstRun.sandboxExports"]);
}

function observeControlCompletion(evidence) {
  const control = evidence.orchestration;
  const final = evidence.final;
  if (!control || !final) return undefined;
  return result(control.pendingHumanGates === 0 && control.unresolvedFailures === 0 && control.unknownEffectStatuses === 0 && final.commandResults.every(command => ["Accepted", "Rejected"].includes(command.disposition)), ["orchestration", "final.commandResults"]);
}

function observeVersionBinding(evidence) {
  if (!evidence.suite || !evidence.fixture || !evidence.source || !evidence.versionSet) return undefined;
  return result(
    evidence.suite.identity === "reference-slice.acceptance-suite" && evidence.suite.version === "1.0.0" && evidence.suite.contentIdentity?.startsWith("sha256:")
      && evidence.fixture.identity === "reference-slice.fixture.cedar-steam" && evidence.fixture.version === "1.0.0" && evidence.fixture.contentIdentity?.startsWith("sha256:")
      && evidence.source.revision && evidence.source.fileContentIdentity?.startsWith("sha256:")
      && Object.values(evidence.versionSet).every(value => typeof value === "string" && value.endsWith("@1.0.0")),
    ["suite", "fixture", "source", "versionSet"],
  );
}

function result(satisfied, sourceReferences, diagnostics = []) {
  return { satisfied, sourceReferences, diagnostics: satisfied ? diagnostics : ["Observed durable values did not match the predeclared acceptance contract.", ...diagnostics] };
}
