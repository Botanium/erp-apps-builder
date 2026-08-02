#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { AcceptanceEvaluator } from "./acceptance-evaluator.mjs";
import { executeAcceptanceScenario } from "./acceptance-scenario.mjs";
import { canonicalJson, contentIdentity } from "./canonical.mjs";
import { createKernelState } from "./kernel.mjs";
import { renderAcceptanceHtml } from "./presenters.mjs";
import { AtomicJsonStore } from "./store.mjs";

const startedAt = process.hrtime.bigint();

try {
  const root = process.cwd();
  const outputDirectory = resolveOutputDirectory(root, process.argv.slice(2));
  mkdirSync(outputDirectory, { recursive: true });
  const source = inspectSource(root);
  const store = new AtomicJsonStore(join(outputDirectory, "state.json"), createKernelState(), { fresh: true });
  const evidence = executeAcceptanceScenario(store, source);
  const elapsedMilliseconds = Number((process.hrtime.bigint() - startedAt) / 1000000n);
  evidence.orchestration.runBudget.consumed.activeExecutionMilliseconds = elapsedMilliseconds;
  evidence.orchestration.runBudget.consumed.totalElapsedMilliseconds = elapsedMilliseconds;
  evidence.orchestration.runBudget.reconciled = reconcileBudget(evidence.orchestration.runBudget);

  const report = new AcceptanceEvaluator().evaluate(evidence);
  const reportBody = { ...report };
  delete reportBody.contentIdentity;
  if (contentIdentity(reportBody) !== report.contentIdentity) throw new Error("Acceptance Report Content Identity failed independent recomputation.");

  writeAtomic(join(outputDirectory, "acceptance.json"), canonicalJson(report));
  writeAtomic(join(outputDirectory, "report.html"), renderAcceptanceHtml(report));
  const persisted = JSON.parse(readFileSync(join(outputDirectory, "state.json"), "utf8"));
  const clean = [persisted.targets.retail, persisted.targets.cafe].every(target => target.generationNumber === 3 && target.appliedBlueprint === null && [target.records, target.events, target.movements, target.postingSets, target.payments].every(collection => collection.length === 0));
  if (report.verdict !== "Passed" || !clean) {
    process.stderr.write(`Reference slice ${report.verdict}; evidence preserved at ${outputDirectory}.\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Reference slice Passed.\nJSON: ${join(outputDirectory, "acceptance.json")}\nHTML: ${join(outputDirectory, "report.html")}\n`);
  }
} catch (error) {
  process.stderr.write(`Reference slice failed safely: ${error.message}\n`);
  process.exitCode = 1;
}

function resolveOutputDirectory(root, arguments_) {
  const index = arguments_.indexOf("--output");
  if (index === -1) return join(root, ".scratch", "adaptive-business-os-v1", "evidence", "reference-slice");
  if (!arguments_[index + 1]) throw new Error("--output requires an explicit directory.");
  return resolve(arguments_[index + 1]);
}

function inspectSource(root) {
  const paths = [join(root, "package.json"), ...walk(join(root, "reference-slice", "src")), ...walk(join(root, "reference-slice", "test")), join(root, "reference-slice", "README.md"), join(root, "reference-slice", "TDD_LOG.md")]
    .filter(path => statSafe(path)?.isFile())
    .sort();
  const files = paths.map(path => ({ path: relative(root, path), content: readFileSync(path, "utf8") }));
  let revision = "unavailable";
  let dirty = true;
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: root, encoding: "utf8" }).trim().length > 0;
  } catch {
    // The source-file identity remains authoritative when Git metadata is unavailable.
  }
  return {
    revision,
    dirty,
    fileContentIdentity: contentIdentity(files),
    includedFiles: files.map(file => file.path),
    runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  };
}

function walk(path) {
  if (!statSafe(path)?.isDirectory()) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function statSafe(path) {
  try { return statSync(path); } catch { return null; }
}

function reconcileBudget(budget) {
  return Object.entries(budget.consumed).every(([dimension, consumed]) => Number.isFinite(consumed) && consumed >= 0 && consumed <= budget.limits[dimension]);
}

function writeAtomic(path, text) {
  const temporaryPath = join(resolve(path, ".."), `.${basename(path)}.tmp-${process.pid}`);
  writeFileSync(temporaryPath, text, { encoding: "utf8", mode: 0o600 });
  renameSync(temporaryPath, path);
}
