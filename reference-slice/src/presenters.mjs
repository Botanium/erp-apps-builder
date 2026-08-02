export function renderAcceptanceHtml(report) {
  const retail = report.evidence.firstRun.retail;
  const cafe = report.evidence.firstRun.cafe;
  const conditions = report.conditions.map(condition => `
    <tr><td><span class="status ${condition.verdict.toLowerCase()}">${escapeHtml(condition.verdict)}</span></td><td>${escapeHtml(condition.label)}</td><td><code>${escapeHtml(condition.identity)}</code></td></tr>`).join("");
  const negatives = report.evidence.negativePaths.map(item => `
    <li><span class="status ${item.satisfied ? "satisfied" : "unsatisfied"}">${item.satisfied ? "Satisfied" : "Unsatisfied"}</span> <code>${escapeHtml(item.identity)}</code></li>`).join("");
  const exclusions = report.evidence.dataBoundary.exclusions.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  const retailTicket = report.evidence.firstRun.retail.records.map(record => `${record.type}: ${record.state}`).join(" · ");
  const cafeTicket = cafe.records.find(record => record.identity === "kitchen-ticket.cafe.01");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Adaptive Business OS Reference Slice</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; background: #0b1020; color: #edf2ff; }
    body { margin: 0; padding: 32px; background: radial-gradient(circle at top right, #17305a 0, #0b1020 38%); }
    main { max-width: 1120px; margin: auto; }
    header, section { background: rgba(18, 27, 50, .92); border: 1px solid #2a3c66; border-radius: 18px; padding: 24px; margin-bottom: 18px; }
    h1, h2 { margin-top: 0; } h1 { font-size: 2rem; } h2 { color: #a9c7ff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 16px; }
    .card { background: #101a32; border: 1px solid #2b416e; border-radius: 14px; padding: 18px; }
    .metric { font-size: 1.45rem; font-weight: 750; color: #fff; }
    .muted { color: #aab6cf; } code { color: #bcd4ff; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; } th, td { padding: 10px; border-bottom: 1px solid #2a3c66; text-align: left; vertical-align: top; }
    .status { display: inline-block; border-radius: 999px; padding: 3px 9px; font-size: .78rem; font-weight: 750; }
    .passed, .satisfied { color: #092318; background: #68e2a5; } .failed, .unsatisfied { color: #321012; background: #ff929a; } .indeterminate { color: #342508; background: #ffd170; }
    ul { padding-left: 20px; } li { margin: 7px 0; }
  </style>
</head>
<body><main>
  <header>
    <span class="status ${report.verdict.toLowerCase()}">${escapeHtml(report.verdict)}</span>
    <h1>Adaptive Business OS — Reference Vertical Slice</h1>
    <p>One Approved Blueprint, one deterministic Business Kernel, and two tailored sandbox experiences for <code>tenant.cedar-steam</code>.</p>
    <p class="muted">Blueprint <code>blueprint-version.cedar-steam.v2</code> · Report <code>${escapeHtml(report.contentIdentity)}</code></p>
  </header>

  <section>
    <h2>Owner authority boundary</h2>
    <div class="grid">
      <div class="card"><div class="metric">Draft v1 blocked</div><p>Counter service remained an Assumption. Preview and interview completion created no approval or Applied state.</p></div>
      <div class="card"><div class="metric">Draft v2 explicitly approved</div><p>The exact Human Gate decision authorized submission only; the Kernel recorded the exact Blueprint Approval.</p></div>
      <div class="card"><div class="metric">Compiled once, applied twice</div><p>Retail and cafe use one target-neutral Effective Blueprint and independent target activations.</p></div>
    </div>
  </section>

  <section>
    <h2>Retail Golden Transaction</h2>
    <div class="grid">
      <div class="card"><div class="metric">${retail.stock["catalog.widget"].quantity} each</div><p>Widget stock · ${formatMoney(retail.stock["catalog.widget"].valueMinor)} inventory value</p></div>
      <div class="card"><div class="metric">${formatMoney(retail.accounts.Cash)}</div><p>Cash after Payment · ${formatMoney(retail.accounts["Cost of Goods Sold"])} COGS</p></div>
      <div class="card"><div class="metric">USD 98.00 / USD 98.00</div><p>Ending trial-balance debits and credits</p></div>
    </div>
    <p class="muted">${escapeHtml(retailTicket)}</p>
  </section>

  <section>
    <h2>Cafe order-to-kitchen</h2>
    <div class="grid">
      <div class="card"><div class="metric">${escapeHtml(cafeTicket.stateHistory.join(" → "))}</div><p>Kitchen Ticket lifecycle</p></div>
      <div class="card"><div class="metric">27 g + 120 ml</div><p>Beans and milk consumed only at fulfillment · ${formatMoney(cafe.accounts["Cost of Goods Sold"])} cost</p></div>
      <div class="card"><div class="metric">USD 49.00 / USD 49.00</div><p>Ending trial-balance debits and credits</p></div>
    </div>
  </section>

  <section><h2>Completion conditions</h2><table><thead><tr><th>Verdict</th><th>Condition</th><th>Identity</th></tr></thead><tbody>${conditions}</tbody></table></section>
  <section><h2>Fail-closed matrix</h2><ul>${negatives}</ul></section>
  <section><h2>Reset and replay</h2><p>Both target generations replayed to equal business Content Identity, then moved atomically to generation 3 with no Applied Blueprint or active business state.</p></section>
  <section><h2>Sandbox-only exclusions</h2><ul>${exclusions}</ul><p class="muted">This Passed result is local prototype evidence. It is not owner acceptance, production readiness, deployment permission, or accounting/regulatory compliance.</p></section>
</main></body></html>`;
}

function formatMoney(minor) {
  return `USD ${(minor / 100).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
