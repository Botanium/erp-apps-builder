# Shop workspace

A single-owner, conversation-led shop operations app for toys, art and stationery. Contextual app-owned forms propose exact actions; deterministic commands validate and persist confirmed changes. The guide cannot authorize or execute business actions on its own.

**Local release verification passed; hosted verification and owner acceptance are pending.** Source publication, local tests, hosted verification and owner acceptance are separate gates. This is not a public customer storefront, payment processor or accounting system.

## Run locally

Use Node **24.x** and npm. No API credential or database service is needed for local preview.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4320` and choose **Explore the local preview**. All preview records and `DEMO` amounts are fictional. Preview persists in its own local SQLite file and is unavailable in hosted production mode.

For a separate empty owner workspace, run `npm run owner:configure` in a private interactive terminal. The helper asks for your password twice without echoing it, requires at least 12 characters, and writes only a new mode-0600 local configuration. It refuses overwrite and does not edit API credentials. Never send passwords to chat or reuse public test passwords. Sign in through **Own-business access**, then explicitly enter your business name, currency and decimal precision. Currency units lock once business records exist.

## Supported operations

- Create and update products; existing order prices remain unchanged when the catalog price changes.
- Record physical saleable-stock counts with evidence. Counts cannot erase reserved units.
- Record suppliers and purchases, then receive all or some ordered quantities. Remaining quantities stay visible; over-receipt and duplicate effects are rejected.
- Enter manual orders labelled Instagram, WhatsApp or Website. These labels are **not live channel connections**.
- Reserve, pack, dispatch and deliver with evidence; reject insufficient stock and unconfirmed online-payment dispatch.
- Record COD collection separately from courier remittance; record online confirmation separately from settlement. These are human records, **not bank/provider verification**.
- Cancel unpaid orders before dispatch and release reserved units.
- Record a failed delivery of a dispatched **unpaid COD** order without restoring stock. Only after all goods physically return in saleable condition may a separate full return receipt restore stock and mark payment not due.
- Retain server-side conversation and command confirmations, protected by authenticated workspace identity, revision checks and replay-safe writes.

Unsupported: paid refunds, paid-order returns, partial/damaged/missing returns, redelivery, partial payments, courier fees, tax/invoices/accounting, supplier payments, automatic messaging, actual payment collection and live courier integrations. Do not represent these as completed through a note or status change.

## Guide, AI and voice

The default guide is deterministic and makes no provider request. Optional live text can select validated cards and explain limited non-sensitive context; it never generates executable code or mutates records. Paid features default off with a zero budget, require owner/shop access and explicit per-request consent, and retain conservative reservations even after cancellation or failure. No automatic retries or purchases occur.

One bounded synthetic text request was observed to complete at the provider and return a validated card. The run then stopped because the response was tool-only; its subsequent app-status fallback correction has mocked coverage but **has not been live retested**. Further provider requests, live audio, real microphone behavior and owner acceptance remain **MISSING**. No remaining allowance from that run grants continuing spending authority.

Voice is bounded turn-based transcription and optional read-aloud, not unrestricted Realtime. Local tests mock devices/provider responses; they do not prove hardware or service entitlement. Keep `OPENAI_API_KEY` server-only and never use a `NEXT_PUBLIC_` secret.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run verify:bundle
npx playwright install chromium
npm run test:e2e
node tests/voice-consent.browser.mjs
```

Tests use isolated fictional data with paid calls disabled. E2E uses a dedicated loopback server on port 4330 and refuses an existing listener. Its public test password must never become an owner credential. Browser output and synthetic databases are ignored, never release source.

`npm run test:postgres` additionally requires Docker and a cached `postgres:17-alpine` image. It creates one new loopback-only temporary container with a restricted app role and removes only that container afterward. It does not target existing databases. See [VERIFICATION.md](VERIFICATION.md) for frozen-candidate evidence and limits.

## Hosted prerequisites

Next.js targets the Node24 runtime and a dedicated PostgreSQL database. Apply reviewed SQL migrations only to an explicitly approved new database, then configure server-side `DATABASE_URL`, `SHOP_APP_ORIGIN` (exact HTTPS origin), `SHOP_OWNER_PASSWORD_HASH` and `SHOP_SESSION_SECRET`. Runtime credentials should use a restricted app role; schema administration is separate. Production refuses local SQLite fallback and preview login. Blank names and disabled flags are listed in `.env.example`; actual values are private deployment configuration.

Hosted authentication, persistence, backup/restore, deployment and owner acceptance remain unverified. Commercial hosting must use a commercially eligible plan; Vercel Hobby is not suitable for a business deployment. No deployment, plan purchase, remote database creation or secret upload runs from the verification workflow.

Schema-two reads adapt known legacy records without inventing history or rewriting on read/replay. New commands may persist new statuses; rollback must retain schema-two compatibility rather than deploying an older reader after those writes.

The app is additive to the repository's original reference application. It does not replace that Business Kernel or establish its acceptance.
