import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { contentIdentity } from "../src/canonical.mjs";
import { AcceptanceEvaluator } from "../src/acceptance-evaluator.mjs";

test("AcceptanceEvaluator fails closed when required evidence is absent", () => {
  const report = new AcceptanceEvaluator().evaluate({});
  assert.equal(report.verdict, "Indeterminate");
  assert.ok(report.conditions.some(condition => condition.criticality === "Required" && condition.verdict === "Indeterminate"));
});

test("one command writes complete Passed JSON and owner-readable HTML after final clean reset", () => {
  const outputDirectory = mkdtempSync(join(tmpdir(), "adaptive-business-os-reference-slice-"));
  const result = spawnSync(process.execPath, ["reference-slice/src/cli.mjs", "--output", outputDirectory], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const report = JSON.parse(readFileSync(join(outputDirectory, "acceptance.json"), "utf8"));
  const html = readFileSync(join(outputDirectory, "report.html"), "utf8");
  const persistedState = JSON.parse(readFileSync(join(outputDirectory, "state.json"), "utf8"));

  assert.equal(report.verdict, "Passed");
  assert.equal(report.suite.identity, "reference-slice.acceptance-suite");
  assert.equal(report.suite.version, "1.0.0");
  assert.equal(report.fixture.identity, "reference-slice.fixture.cedar-steam");
  assert.equal(report.fixture.version, "1.0.0");
  assert.ok(report.conditions.every(condition => condition.criticality !== "Required" || condition.verdict === "Satisfied"));
  assert.equal(report.orchestration.runCompletionRecord.state, "Completed");
  assert.equal(report.orchestration.runBudget.reconciled, true);
  assert.equal(report.orchestration.runBudget.consumed.kernelCommandDeliveries <= report.orchestration.runBudget.limits.kernelCommandDeliveries, true);
  assert.equal(report.evidence.final.targets.retail.appliedBlueprint, null);
  assert.equal(report.evidence.final.targets.cafe.appliedBlueprint, null);
  assert.equal(report.evidence.final.targets.retail.generationNumber, 3);
  assert.equal(report.evidence.final.targets.cafe.generationNumber, 3);
  assert.equal(report.evidence.final.commands.length, report.evidence.final.commandResults.length);
  for (const phase of [report.evidence.firstRun, report.evidence.replay, report.evidence.final]) {
    for (const targetId of ["retail", "cafe"]) {
      const exported = phase.sandboxExports[targetId];
      const { contentIdentity: exportIdentity, ...exportBody } = exported;
      assert.equal(exportIdentity, contentIdentity(exportBody));
      assert.equal(exported.targetId, targetId);
    }
  }
  assert.equal(persistedState.targets.retail.records.length, 0);
  assert.equal(persistedState.targets.cafe.records.length, 0);

  const { contentIdentity: recordedIdentity, ...reportBody } = report;
  assert.equal(recordedIdentity, contentIdentity(reportBody));
  for (const text of [
    "tenant.cedar-steam",
    "blueprint-version.cedar-steam.v2",
    "Retail Golden Transaction",
    "Cafe order-to-kitchen",
    "USD 98.00",
    "USD 49.00",
    "Sandbox-only exclusions",
  ]) assert.match(html, new RegExp(text));
});
