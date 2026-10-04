import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createGuard } from "../scripts/live-validation-guard.mjs";
const body = JSON.stringify({
  model: "gpt-4.1-mini-2025-04-14",
  service_tier: "default",
  store: false,
  stream: true,
  max_output_tokens: 1200,
  tools: [{ name: "show_cards" }],
});
const input = ["https://api.openai.com/v1/responses", { method: "POST", body }];
function complete() {
  return new Response(
    "data: " +
      JSON.stringify({
        type: "response.completed",
        response: {
          id: "synthetic-mock",
          model: "gpt-4.1-mini-2025-04-14",
          service_tier: "default",
          status: "completed",
          usage: { input_tokens: 100, output_tokens: 20 },
        },
      }) +
      "\n\n"
  );
}
test("offline validation guard retains before-fetch attempts, caps text at three and blocks redirects", async () => {
  const db = new DatabaseSync(":memory:");
  let calls = 0;
  let guard;
  guard = createGuard(
    db,
    async (_, options) => {
      calls++;
      assert.equal(guard.rows().at(-1).outcome, "attempted");
      assert.equal(options.redirect, "error");
      return complete();
    },
    () => 1
  );
  guard.arm();
  for (let index = 0; index < 3; index++) await guard.fetch(...input);
  await assert.rejects(() => guard.fetch(...input), /Per-type/);
  assert.equal(calls, 3);
  assert.equal(guard.rows().length, 3);
  await assert.rejects(() => guard.fetch(...input), /Run not armed/);
  assert.equal(calls, 3);
  db.close();
});
test("offline validation guard never retries uncertain outcome or rearms a used journal", async () => {
  const db = new DatabaseSync(":memory:");
  let calls = 0;
  const guard = createGuard(
    db,
    async () => {
      calls++;
      throw new Error("Synthetic network interruption");
    },
    () => 1
  );
  guard.arm();
  await assert.rejects(() => guard.fetch(...input));
  assert.equal(guard.rows()[0].outcome, "failed-or-uncertain");
  await assert.rejects(() => guard.fetch(...input));
  assert.throws(() => guard.arm());
  assert.equal(calls, 1);
  db.close();
});
test("offline unarmed guard cannot call provider", async () => {
  const db = new DatabaseSync(":memory:");
  let calls = 0;
  const guard = createGuard(
    db,
    async () => {
      calls++;
      return complete();
    },
    () => 1
  );
  await assert.rejects(() => guard.fetch(...input));
  assert.equal(calls, 0);
  db.close();
});
