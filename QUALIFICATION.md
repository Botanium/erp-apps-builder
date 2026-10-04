# Netlify Free qualification — local only

## Approved scope and baseline

Scope: isolated local Netlify Free + Neon Free qualification, necessary framework security patches, adapter/configuration and narrow proven hosting fixes, public package downloads and synthetic local PostgreSQL tests. A subsequent approval permits publication on a dedicated branch and pull request with CI and independent review only. Merge, cloud account/resource writes, paid calls, purchases and deployment remain excluded. Existing applications and private data are untouched.

Public-only baseline: `ec288d8a414849fdc3279c651aeec828020b7e33`; root tree `5b712a75458e45e322fb994adc5c22fc6617d514`, original shop subtree `d8c27094aba5775d5743df68eb7a763155895038`. No private history, environment files, SQLite databases, `.eve` or `.output` was copied. Publication branch: `codex/netlify-local-qualification`.

## Qualification contract

Existing browser and public HTTP/API seams are approved. Test adapter-generated Request/Response delivery, exact URL/Host/Origin checks, secure cookies, missing-config failure, production no-SQLite, synthetic streaming/timeout, and PostgreSQL session/transaction/idempotency/recovery. Do not add business capabilities or weaken origin/authentication checks to fit a host. Pool lifecycle fixes require a failing public-route reproduction first. Native `pg` and reviewed SQL migrations are retained; no ORM or cloud branch is introduced.

Independent QA and separate Standards/security and Specification reviews checked the frozen local candidate. Test ports 4335 (adapter) and 4330/4331 (QA) are isolated from the ordinary development port 4320.

## Versions and safety

Verified live npm metadata and official [Next16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8) / [Netlify security guidance](https://www.netlify.com/changelog/2026-09-30-nextjs-react-security-vulnerabilities/) on4October2026. Pins: Next16.3.8, `@netlify/plugin-nextjs`5.16.1; Node24.16.0. App package/lock stays separate from root dependencies.

Adapter qualification calls local build hooks only, with `IS_LOCAL:true`, and never calls `onSuccess` (which can prewarm deployment URLs). No Netlify login/link/deploy, account discovery, telemetry or resource API is permitted. Harness child environments must be allowlisted; no local OpenAI or database configuration is inherited. AI/voice remain off with zero budget; any provider test uses explicit synthetic mocks only. The adapter can copy `.env*` independently of Next trace exclusions, so the isolate must remain physically free of environment files and the full generated artifact must be scanned.

## Verified local results — 4 October 2026

Node24.16.0 was used throughout. Private logs and browser artifacts are intentionally excluded from publication. These are local qualification results, not cloud or human acceptance. Publication CI reruns the suites and generated-handler qualification; the pull request checks provide its result separately.

| Gate                                                       | Observed result                                                                                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original root reference tests                              | 48/48 pass                                                                                                                                                             |
| App unit/API tests                                         | 78/78 pass                                                                                                                                                             |
| Browser E2E                                                | 26/26 pass, zero retries, 2.8minutes                                                                                                                                   |
| Offline rendered voice tests                               | 6/6 pass; no microphone or provider                                                                                                                                    |
| Native PostgreSQL tests                                    | 8groups pass; 9 with generated adapter qualification                                                                                                                   |
| Clean production Next build and type generation/TypeScript | Pass                                                                                                                                                                   |
| Netlify5.16.1 direct-hook artifact                         | Generated from Next16.3.8; 1314regular files +1contained symlink                                                                                                       |
| Next bundle guard                                          | 24traces after adapter build, 13 after independent plain Next build; zero private-path/client-identifier violations                                                    |
| Full generated Netlify artifact guard                      | 1314regular files,1contained symlink,10client files; zero violations                                                                                                   |
| App dependency advisory query                              | Zero advisories on4October2026                                                                                                                                         |
| Independent browser recovery journey                       | Login, empty owner shop, purchase receipt10units, sale2units, delivered/remitted COD25USD, reload stock8/reserved0; five screenshots, no page errors/external requests |

### Minimal changes and red/green evidence

1. Security versions: exact Next16.3.8 and adapter5.16.1, verified in official sources and npm metadata. No root dependency update.
2. App tracing/Turbopack roots are explicitly the independent shop directory. The initial adapter build inferred the root reference package from its separate lockfile and generated a `/var/task/shop-app` wrapper that could not be imported on the local host (`ERR_MODULE_NOT_FOUND`). The bounded app-root configuration rebuilds a real non-monorepo adapter wrapper (`relativeAppDir` empty); no generated code was patched to make tests pass.
3. Idle PostgreSQL connection failure: a new public-route test first reproduced an uncaught `error` event that terminated the signed-in server process after isolated admin termination of its two idle app connections. Each pool now has a four-line error listener with fixed, credential-free diagnostic text. `pg` removes the failed idle client; the next explicit request reconnects. No query or business action is automatically retried. Green proof retains the owner session, state and one-effect command replay through both source public routes and the generated adapter.

### Actual generated-handler proof

`tests/netlify-handler.mjs` imports the real generated `___netlify-server-handler.mjs`, not application route modules. It uses synthetic WHATWG Request/Response plus local Netlify context and a fresh restricted-role PostgreSQL database. It verifies:

- Missing owner/database configuration yields503 and never creates `.local` or SQLite; hosted preview is refused.
- Owner login sets Secure, HttpOnly, SameSite=Strict cookie; unauthenticated/stale-workspace requests reject. Wrong Host, forwarded Host, HTTP forwarded protocol, alternate URL and cross-origin POST reject.
- Both idle pools reconnect without process restart, preserving the session. Concurrent identical commands commit one revision/audit/product.
- Local-guide SSE works with provider capability off. A deliberately intercepted synthetic provider stream delivers text before completion; completed request replay never invokes the mock again.
- A simulated hanging provider is aborted by the actual30-second deadline, emits an error instead of done, makes no automatic retry and does not change business state.

Two fake provider invocations, **zero real provider calls**, zero cloud calls. The fake-provider child temporarily sets synthetic-only flags/key/budget in its own process, then disables them; production/source configuration remains off/zero. Test setup uses only a new `shop-app-pg-qa-*` loopback/tmpfs container and terminates only connections matching its database, test role and unique application name. The harness removes only its own newly created container/tmpfs after success or failure. No existing database/container is modified.

The adapter converts HTTPS to Next request protocol using `x-forwarded-proto`; the positive local fixture supplies `https` and the negative fixture proves `http` rejection. Actual Netlify edge header normalization and trusted routing are still **MISSING**, not presumed proven. The local Blob context points only to loopback, but these dynamic API paths do not establish static Blob cache delivery, Lambda packaging/runtime, CDN caching or Netlify execution-time enforcement.

### Reproducible commands

From `shop-app`, using Node24.16.0 first on PATH:

```sh
SHOP_LOCAL_QUALIFICATION=true node scripts/qualify-netlify-build.mjs
node scripts/verify-netlify-artifact.mjs
node scripts/verify-bundle.mjs
SHOP_QUALIFY_NETLIFY=true node --import tsx scripts/test-postgres.ts
npm test
npm run test:e2e
node tests/voice-consent.browser.mjs
npm run typecheck
```

The independent root suite is `node --test test/*.test.mjs` from repository root. QA runs with sanitized environments and isolated fixture stores/ports; do not substitute a private app working directory or credentials. CI pins Node24.16.0, explicitly opts into local qualification, builds the generated handler and runs the nine-group PostgreSQL suite. No workflow step logs into, links or deploys a cloud account.

`qualify-netlify-build.mjs` reexecutes with an environment allowlist, disabled telemetry/provider flags and a Node JavaScript socket/fetch guard. It calls onPreBuild, Next build and onBuild, never onSuccess or the account-aware Netlify CLI. **This JavaScript guard is not an OS/network sandbox** and does not prove that arbitrary native software cannot use the network. Public npm dependency downloads were explicitly authorized and occurred before guarded qualification.

`verify-netlify-artifact.mjs` directly scans the complete generated `.netlify` tree, checks private paths, escaping symlinks, credential-shaped values and known synthetic fixture values, and checks client JS/JSON/maps for server-secret identifiers. It reports paths/categories only, never matched values. These patterns are defense in depth, not exhaustive detection of all possible secrets. The stronger prerequisite is the fresh public-only checkout plus an allowlisted build environment with no real credentials. The scanner is invoked automatically by the local build harness. Final local artifact content-manifest SHA256: `80f10da088604622cada51c1f119238cd70b70cbe2579c4cfd6356fe086ca952` (specific generated artifact, not a reproducible build promise); the nine-group generated-handler/PostgreSQL suite was rerun against that artifact. CI rebuilds and scans its own artifact rather than assuming byte reproducibility.

## Remaining limits and future approval gate

This qualification does **not** create or prove a hosted Free-plan shop. Actual Netlify/Neon account eligibility, Free-plan credit enforcement, auto-recharge absence, real edge headers/routing, static Blob cache delivery, hosted pg/TLS/suspend/reconnect, production cookie behavior and owner acceptance remain **MISSING**. Live voice/audio/microphone and further paid text validation remain excluded.

A **future**, separately submitted owner approval would be required for a Netlify Free + Neon Free pilot: explicitly identified isolated account/team scope with no existing-project changes; Free plans with no charges, paid add-ons or automatic recharge; an exact independently reviewed merged SHA and green CI; private owner-selected password and server-only runtime secrets; AI/voice off with zero budget/no provider key; scoped synthetic cloud smoke tests followed by separate owner acceptance. No part of this document executes or grants that future gate. Commit/push/PR/review, merge, cloud account/resource creation, deployment and owner acceptance remain separate decisions.

No qualification result grants permission for a later purchase, account creation or deployment. README/publication gates remain separate.
