# Isolated shop browser regression suite

Run `npm run test:e2e` from the app directory after installing Chromium with `npx playwright install chromium` (CI also installs OS dependencies). Supported release runtime is Node 24. The suite contains 26 tests in 11 spec files; see [the release verification record](../../VERIFICATION.md) for verified candidate results and limitations.

Safety and ownership:

- Every test gets a fresh synthetic owner, preview and auth store, random session secret and synthetic-only password hash. No existing account or app database is reused.
- The fixture refuses an existing listener on `127.0.0.1:4330`. One worker and no retries are intentional. `.next-e2e` is separate from normal and manual-QA builds.
- Provider key and database URL are cleared; AI/voice flags are false and budget is zero. Server fetch and browser network guards reject external destinations.
- Voice specs explicitly replace browser media APIs with synthetic objects and intercept voice HTTP responses. They do not grant microphone permissions or call a real provider. Their claims are client-boundary behavior only.
- Business workflows use accessible visible UI. Supplementary negative/replay tests use authenticated public HTTP commands and `/api/state`; no test reads database contents or calls the private domain/store implementation.
- Artifacts and HTML reports are under ignored `output/playwright/e2e/`. Fixture logs and databases stay local; CI uploads only the screenshot/trace artifacts and report, not fixtures. Do not run against real customer records.

Tests establish scoped shop behavior, not hosted authentication, production PostgreSQL, payment/courier/channel integration, real AI or voice quality, full screen-reader certification, or owner acceptance. Unsupported partial payments, paid refunds, partial/damaged/missing returns and redelivery remain exclusions, not missing implementation promises.
