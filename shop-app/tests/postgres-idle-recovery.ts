/** Public-route recovery proof; invoked only by the disposable PostgreSQL fixture. */
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { Pool } from "pg";

process.on("uncaughtException", () => {
  console.error("FAIL: uncaught idle connection error terminated public-route fixture");
  process.exit(1);
});

async function main() {
  assert.match(process.env.SHOP_RECOVERY_FIXTURE || "", /^shop-app-pg-qa-[0-9a-f]{12}$/);
  const adminUrl = new URL(process.env.SHOP_RECOVERY_ADMIN_URL || "");
  const appUrl = new URL(process.env.DATABASE_URL || "");
  for (const url of [adminUrl, appUrl]) {
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.pathname, "/shop_synthetic_qa");
  }
  assert.equal(adminUrl.port, appUrl.port);
  assert.equal(adminUrl.username, "shop_fixture_admin");
  assert.equal(appUrl.username, "shop_app_test");
  const applicationName = `idle-${process.env.SHOP_RECOVERY_FIXTURE}`;
  appUrl.searchParams.set("application_name", applicationName);
  process.env.DATABASE_URL = appUrl.href;
  Object.assign(process.env, {
    NODE_ENV: "production", SHOP_APP_ORIGIN: "https://synthetic.example",
    SHOP_SESSION_SECRET: "a".repeat(64), SHOP_AI_ENABLED: "false",
    SHOP_VOICE_ENABLED: "false", SHOP_AI_BUDGET_MICRO_USD: "0", OPENAI_API_KEY: "",
  });
  const password = "Synthetic-only-owner-password";
  const salt = "b".repeat(32);
  process.env.SHOP_OWNER_PASSWORD_HASH = `scrypt$${salt}$${scryptSync(password, Buffer.from(salt,"hex"), 64, {N:32768,r:8,p:1,maxmem:64*1024*1024}).toString("hex")}`;
  const { POST: login } = await import("../src/app/api/session/route");
  const { GET: state } = await import("../src/app/api/state/route");
  const { POST: command } = await import("../src/app/api/commands/route");
  const admin = new Pool({ connectionString: adminUrl.href });
  const request = (path: string, body?: unknown, cookie?: string) => new Request(`https://synthetic.example/api/${path}`, {
    method: body ? "POST" : "GET",
    headers: { host: "synthetic.example", origin: "https://synthetic.example", "content-type": "application/json", "x-shop-workspace": "shop", ...(cookie ? {cookie}: {}) },
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  try {
    // Isolated fixture setup only. Existing suite deliberately exhausted the global throttle.
    await admin.query("DELETE FROM auth_attempts");
    const signedIn = await login(request("session", {mode:"shop", password}));
    assert.equal(signedIn.status, 200);
    assert.match(signedIn.headers.get("set-cookie") || "", /; Secure/);
    const cookie = signedIn.headers.get("set-cookie")!.split(";")[0];
    const beforeResponse = await state(request("state", undefined, cookie));
    assert.equal(beforeResponse.status, 200);
    const before = (await beforeResponse.json()).state;
    // Terminate only this child fixture's idle app connections, never another backend/container.
    const targets = await admin.query("SELECT pid FROM pg_stat_activity WHERE datname='shop_synthetic_qa' AND usename='shop_app_test' AND application_name=$1 AND state='idle' AND pid<>pg_backend_pid()", [applicationName]);
    assert.equal(targets.rows.length, 2, "auth and business pools both have idle clients");
    for (const {pid} of targets.rows) await admin.query("SELECT pg_terminate_backend($1)", [pid]);
    await new Promise(resolve => setTimeout(resolve, 100));
    const recoveredResponse = await state(request("state", undefined, cookie));
    assert.equal(recoveredResponse.status, 200, "same signed-in process reconnects after idle disconnection");
    assert.deepEqual((await recoveredResponse.json()).state, before);
    const mutation = {type:"product.create", idempotencyKey:"idle-recovery-product-001", expectedRevision:before.revision, payload:{id:"idle-recovery-product",sku:"IDLE-RECOVERY",name:"Synthetic idle recovery",category:"Art",priceMinor:125,lowStockAt:1}};
    const first = await command(request("commands", mutation, cookie));
    const replay = await command(request("commands", mutation, cookie));
    assert.equal(first.status, 200);
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), await first.json());
    const after = (await (await state(request("state", undefined, cookie))).json()).state;
    assert.equal(after.revision, before.revision + 1);
    assert.equal(after.audit.length, before.audit.length + 1);
    assert.equal(after.products.filter((product: {id:string}) => product.id === "idle-recovery-product").length, 1);
    console.log("PASS: public owner routes survive two idle PostgreSQL disconnects with retained session and one replay-safe business effect.");
  } finally { await admin.end(); }
}
main().then(() => process.exit(0), error => {
  console.error("FAIL: public-route isolated idle PostgreSQL recovery", error instanceof assert.AssertionError ? error.message : "unexpected runtime failure");
  process.exit(1);
});
