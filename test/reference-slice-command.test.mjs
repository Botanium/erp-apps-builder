import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("one local command reports the empty slice as Indeterminate", async (t) => {
  const runParent = await mkdtemp(join(tmpdir(), "abos-command-smoke-"));
  t.after(() => rm(runParent, { recursive: true, force: true }));

  const result = spawnSync("npm", ["run", "--silent", "reference-slice"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ABOS_RUN_PARENT: runParent },
  });
  const output = JSON.parse(result.stdout);

  assert.equal(result.signal, null);
  assert.equal(result.status, 1);
  assert.equal(output.kind, "ReferenceSliceCommandResult");
  assert.equal(output.view.kind, "ReferenceSliceView");
  assert.equal(output.rejection.disposition, "Rejected");
  assert.equal(
    output.rejection.diagnostics[0].code,
    "KERNEL.COMMAND.UNSUPPORTED_ACTION"
  );
  assert.deepEqual(output.observation.business, {
    records: 0,
    businessEvents: 0,
    evidence: 0,
    stockMovements: 0,
    postingSets: 0,
    ledgerEntries: 0,
    payments: 0,
  });
  assert.equal(output.acceptance.verdict, "Indeterminate");
});
