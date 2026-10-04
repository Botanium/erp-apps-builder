/** Exercises the real generated adapter Web handler. No cloud context or provider network. */
import assert from "node:assert/strict";
import { randomUUID, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Pool } from "pg";
import "../scripts/qualification-network-guard.mjs";

const appRoot = process.cwd();
const passed = [];
let mockCalls = 0;
let releaseStream;
let providerMode = "stream";
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  if (String(input) !== "https://api.openai.com/v1/responses") return originalFetch(input, options);
  mockCalls++;
  assert.equal(process.env.OPENAI_API_KEY, "synthetic-no-provider-credential");
  if (providerMode === "timeout") return new Promise((_,reject) => {
    options.signal.addEventListener("abort", () => reject(options.signal.reason), {once:true});
  });
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({start(controller) {
    const send = event => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    send({type:"response.output_text.delta",delta:"Synthetic streamed guidance."});
    releaseStream = () => {
      send({type:"response.output_item.done",item:{type:"function_call",name:"show_cards",arguments:JSON.stringify({cards:[{type:"products",title:null,entityId:null}]})}});
      send({type:"response.completed"});
      controller.close();
    };
  }}),{headers:{"content-type":"text/event-stream"}});
};

async function main() {
  assert.match(process.env.SHOP_RECOVERY_FIXTURE || "", /^shop-app-pg-qa-[0-9a-f]{12}$/);
  const appUrl = new URL(process.env.DATABASE_URL || "");
  const adminUrl = new URL(process.env.SHOP_RECOVERY_ADMIN_URL || "");
  for (const url of [appUrl,adminUrl]) {
    assert.equal(url.hostname,"127.0.0.1"); assert.equal(url.pathname,"/shop_synthetic_qa");
  }
  assert.equal(appUrl.port,adminUrl.port);
  const applicationName = `adapter-${process.env.SHOP_RECOVERY_FIXTURE}`;
  appUrl.searchParams.set("application_name",applicationName);
  Object.assign(process.env,{NODE_ENV:"production",NEXT_TELEMETRY_DISABLED:"1",OTEL_SDK_DISABLED:"true",SHOP_AI_ENABLED:"false",SHOP_VOICE_ENABLED:"false",SHOP_AI_BUDGET_MICRO_USD:"0"});
  delete process.env.DATABASE_URL;
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({deployID:"000000000000000000000000",siteID:"local",token:"synthetic",edgeURL:"http://127.0.0.1:4335",uncachedEdgeURL:"http://127.0.0.1:4335",primaryRegion:"us-test-1"})).toString("base64");
  process.chdir(resolve(".netlify/functions-internal/___netlify-server-handler"));
  const {default: handler} = await import(pathToFileURL(resolve("___netlify-server-handler.mjs")));
  const pending = [];
  const invoke = (path,{body,cookie,headers={},url=`https://synthetic.example/api/${path}`}={}) => handler(new Request(url,{
    method:body ? "POST":"GET",headers:{host:"synthetic.example","x-forwarded-proto":"https",...(body ? {origin:"https://synthetic.example","content-type":"application/json"}:{}),...(cookie ? {cookie}:{}),...headers},...(body ? {body:JSON.stringify(body)}:{})
  }),{account:{id:"local"},deploy:{id:"000000000000000000000000"},site:{id:"local"},requestId:randomUUID(),waitUntil:promise=>pending.push(promise)});
  let response = await invoke("state");
  assert.equal(response.status,503); assert.equal((await response.json()).code,"AUTH_NOT_CONFIGURED");
  const password = "Synthetic-adapter-owner-password";
  const salt = "c".repeat(32);
  Object.assign(process.env,{SHOP_APP_ORIGIN:"https://synthetic.example",SHOP_SESSION_SECRET:"d".repeat(64),SHOP_OWNER_PASSWORD_HASH:`scrypt$${salt}$${scryptSync(password,Buffer.from(salt,"hex"),64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString("hex")}`});
  response = await invoke("state");
  assert.equal(response.status,503); assert.equal((await response.json()).code,"HOSTED_NOT_READY");
  assert.equal(existsSync(resolve(".local")),false);
  passed.push("generated handler fails closed without owner/database configuration; no SQLite fallback");
  process.env.DATABASE_URL = appUrl.href;
  const admin = new Pool({connectionString:adminUrl.href});
  try {
    await admin.query("DELETE FROM auth_attempts");
    response = await invoke("session",{body:{mode:"preview"}});
    assert.equal(response.status,403); await response.text();
    response = await invoke("session",{body:{mode:"shop",password}});
    assert.equal(response.status,200, `owner login: ${await response.clone().text()}`);
    const setCookie = response.headers.get("set-cookie");
    assert.match(setCookie,/HttpOnly/); assert.match(setCookie,/SameSite=Strict/); assert.match(setCookie,/; Secure/);
    const cookie = setCookie.split(";")[0]; await response.text();
    response = await invoke("state",{cookie});
    assert.equal(response.status,200, `owner state: ${await response.clone().text()}`);
    const before = (await response.json()).state;
    for (const options of [
      {headers:{host:"evil.example"}}, {headers:{"x-forwarded-host":"evil.example"}},
      {headers:{"x-forwarded-proto":"http"}},
      {url:"https://evil.example/api/state",headers:{host:"evil.example"}},
    ]) { const rejected=await invoke("state",{cookie,...options}); assert.equal(rejected.status,403); await rejected.text(); }
    const crossOrigin=await invoke("session",{cookie,body:{mode:"shop",password},headers:{origin:"https://evil.example"}});
    assert.equal(crossOrigin.status,403); await crossOrigin.text();
    const unauth=await invoke("state"); assert.equal(unauth.status,401); await unauth.text();
    const stale=await invoke("agent",{cookie,headers:{"x-shop-workspace":"preview"},body:{requestId:"adapter-stale-001",message:"Show products"}});
    assert.equal(stale.status,409); await stale.text();
    passed.push("production owner sign-in, Secure HttpOnly Strict cookie, five spoof rejections, unauthenticated and stale-workspace rejection");
    const targets=await admin.query("SELECT pid FROM pg_stat_activity WHERE datname='shop_synthetic_qa' AND usename='shop_app_test' AND application_name=$1 AND state='idle' AND pid<>pg_backend_pid()",[applicationName]);
    assert.equal(targets.rows.length,2);
    for(const {pid} of targets.rows) await admin.query("SELECT pg_terminate_backend($1)",[pid]);
    await new Promise(resolve=>setTimeout(resolve,100));
    response=await invoke("state",{cookie}); assert.equal(response.status,200); assert.deepEqual((await response.json()).state,before);
    const mutation={type:"product.create",idempotencyKey:"adapter-product-001",expectedRevision:before.revision,payload:{id:"adapter-product",sku:"ADAPTER-PRODUCT",name:"Synthetic adapter product",category:"Art",priceMinor:200,lowStockAt:1}};
    const [first,replay]=await Promise.all([invoke("commands",{cookie,headers:{"x-shop-workspace":"shop"},body:mutation}),invoke("commands",{cookie,headers:{"x-shop-workspace":"shop"},body:mutation})]);
    assert.equal(first.status,200); assert.equal(replay.status,200); assert.deepEqual(await first.json(),await replay.json());
    response=await invoke("state",{cookie}); const after=(await response.json()).state;
    assert.equal(after.revision,before.revision+1); assert.equal(after.audit.length,before.audit.length+1);
    passed.push("generated-handler warm process survives idle auth/business disconnect; concurrent replay commits exactly once");
    response=await invoke("agent",{cookie,headers:{"x-shop-workspace":"shop"},body:{requestId:"adapter-local-001",message:"Show products"}});
    assert.equal(response.status,200); assert.match(response.headers.get("content-type"),/text\/event-stream/);
    const localText=await response.text(); assert.match(localText,/event: cards/); assert.match(localText,/event: done/); assert.equal(mockCalls,0);
    // Explicit mock-only configuration: no network credentials or real provider calls exist.
    Object.assign(process.env,{SHOP_AI_ENABLED:"true",SHOP_AI_BUDGET_MICRO_USD:"100000",OPENAI_API_KEY:"synthetic-no-provider-credential"});
    response=await invoke("agent",{cookie,headers:{"x-shop-workspace":"shop"},body:{requestId:"adapter-stream-001",message:"Show products",live:true,approvePaidCall:true}});
    const reader=response.body.getReader(); const decoder=new TextDecoder(); let streamText="";
    while(!streamText.includes("Synthetic streamed guidance.")) {const item=await reader.read(); assert.equal(item.done,false); streamText+=decoder.decode(item.value);}
    assert.ok(!streamText.includes("event: done"),"response delivers text before provider completion");
    releaseStream();
    for(;;) {const item=await reader.read(); if(item.done) break; streamText+=decoder.decode(item.value);}
    assert.match(streamText,/event: cards/); assert.match(streamText,/event: done/); assert.equal(mockCalls,1);
    const again=await invoke("agent",{cookie,headers:{"x-shop-workspace":"shop"},body:{requestId:"adapter-stream-001",message:"Show products",live:true,approvePaidCall:true}});
    assert.match(await again.text(),/"replayed":true/); assert.equal(mockCalls,1);
    passed.push("generated SSE delivers incremental synthetic provider text before completion; durable replay makes no second provider call");
    providerMode="timeout"; const started=Date.now(); const keepAlive=setInterval(()=>{},1000);
    try {
      response=await invoke("agent",{cookie,headers:{"x-shop-workspace":"shop"},body:{requestId:"adapter-timeout-001",message:"Show products",live:true,approvePaidCall:true}});
      const timeoutText=await response.text(); assert.match(timeoutText,/event: error/); assert.ok(!timeoutText.includes("event: done"));
      assert.ok(Date.now()-started>=29_000 && Date.now()-started<40_000,"real 30-second provider deadline is bounded");
      assert.equal(mockCalls,2);
    } finally {clearInterval(keepAlive); Object.assign(process.env,{SHOP_AI_ENABLED:"false",SHOP_AI_BUDGET_MICRO_USD:"0",OPENAI_API_KEY:""});}
    response=await invoke("state",{cookie}); assert.deepEqual((await response.json()).state,after);
    await Promise.allSettled(pending);
    assert.equal(existsSync(resolve(".local")),false); assert.equal(existsSync(resolve(appRoot,".local")),false);
    passed.push("30-second simulated-provider timeout emits error not success, preserves business state and makes no retry");
    console.log(JSON.stringify({generatedAdapter:"5.16.1",node:process.versions.node,checksPassed:passed,mockProviderCalls:mockCalls,realProviderCalls:0,cloudCalls:0,limits:"Local Web handler only; platform Lambda/CDN and static Blob cache delivery not established"},null,2));
  } finally {await admin.end();}
}
process.on("uncaughtException",()=>{console.error("FAIL: uncaught generated-handler runtime error");process.exit(1);});
main().then(()=>process.exit(0),error=>{console.error("FAIL: generated Netlify handler qualification",error instanceof assert.AssertionError ? error.message : "runtime failure");process.exit(1);});
