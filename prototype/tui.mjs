import { createInterface } from "node:readline";
import {
  BLUEPRINT,
  approveBlueprint,
  compileAndProvision,
  createState,
  executeNext,
  invariantReport,
  ledgerBalances,
  resetAll,
  scenarioProgress,
  stockPosition,
} from "./model.mjs";

const bold = value => `\x1b[1m${value}\x1b[0m`;
const dim = value => `\x1b[2m${value}\x1b[0m`;
const green = value => `\x1b[32m${value}\x1b[0m`;
const amber = value => `\x1b[33m${value}\x1b[0m`;

let state = createState();
let lastInvariant = invariantReport(state);

function money(value = 0) {
  return `$${(value / 100).toFixed(2)}`;
}

function targetLine(targetKey, target) {
  const progress = scenarioProgress(targetKey, target);
  const balances = ledgerBalances(target);
  const items = [...new Set(target.movements.map(movement => movement.itemId))];
  const stock = items.map(item => {
    const position = stockPosition(target, item);
    return `${item.replace("catalog.", "").replace("ingredient.", "")}:${position.quantity}${position.unit}/${money(position.value)}`;
  }).join("  ") || "zero";
  const ticket = target.records.find(record => record.kind === "Kitchen Ticket");
  return [
    `${bold(targetKey.toUpperCase())} ${dim(target.identity)}  generation=${target.generationNumber}  applied=${target.appliedBlueprint ? "yes" : "no"}`,
    `  flow ${progress.index}/${progress.total}  next=${progress.nextAction}  kitchen=${ticket?.lifecycle ?? "n/a"}`,
    `  records=${target.records.length} events=${target.events.length} movements=${target.movements.length} postings=${target.postingSets.length}`,
    `  stock ${stock}`,
    `  cash=${money(balances.cash)}  AR=${money(balances["accounts-receivable"])}  AP=${money(-(balances["accounts-payable"] ?? 0))}  invariant=${lastInvariant.targets[targetKey].pass ? green("PASS") : amber("OPEN")}`,
  ].join("\n");
}

function render() {
  console.clear();
  console.log(bold("Adaptive Business OS — Blueprint / Kernel logic prototype"));
  console.log(dim("One immutable Blueprint · two target profiles · one generic governed-action registry\n"));
  console.log(`${bold("Blueprint")} lifecycle=${state.lifecycle}  version=1  content=${BLUEPRINT.contentIdentity.slice(0, 22)}…`);
  console.log(`${bold("Approval")} ${state.approval ? green("explicit exact-Draft decision recorded") : amber("absent")}`);
  console.log(`${bold("Capabilities")} 11 selected once; retail exposes 10, cafe exposes 9\n`);
  console.log(targetLine("retail", state.targets.retail));
  console.log();
  console.log(targetLine("cafe", state.targets.cafe));
  console.log();
  console.log(`${bold("Last result")} ${state.lastResult.disposition}: ${state.lastResult.message}`);
  console.log(`${bold("Invariant report")} overall=${lastInvariant.pass ? green("PASS") : amber("OPEN")}  reset-records=${state.resetRecords.length}`);
  console.log();
  console.log(`${bold("[a]")} approve exact Blueprint  ${bold("[c]")} compile + provision  ${bold("[r]")} next retail  ${bold("[k]")} next cafe`);
  console.log(`${bold("[i]")} recompute invariants     ${bold("[x]")} reset both clean     ${bold("[q]")} quit`);
  console.log(dim("Enter one key, then Return. Prototype actions are local fictitious stubs."));
}

const input = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });

input.on("line", line => {
  const key = line.trim().toLowerCase();
  if (key === "q") {
    input.close();
    return;
  }
  if (key === "a") state = approveBlueprint(state);
  else if (key === "c") state = compileAndProvision(state);
  else if (key === "r") state = executeNext(state, "retail");
  else if (key === "k") state = executeNext(state, "cafe");
  else if (key === "i") state.lastResult = { disposition: "Observed", message: "Invariant report recomputed from immutable effects." };
  else if (key === "x") state = resetAll(state);
  else state.lastResult = { disposition: "Ignored", message: `Unknown prototype key: ${key || "empty"}.` };
  lastInvariant = invariantReport(state);
  render();
});

input.on("close", () => {
  console.log("\nPrototype ended. No production or governed external state was changed.");
});

render();
