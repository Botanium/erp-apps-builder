# ERP Apps Builder

This repository contains the original Adaptive Business OS reference work and an additive [shop workspace](shop-app/README.md). They are separate applications; the shop does not replace the reference Business Kernel, rewrite its history, or establish acceptance of its architecture experiments.

## Shop workspace

The shop is a single-owner, conversation-led operations application for a small toys/art/stationery business. Its deterministic commands manage inventory, supplier receipts, manually entered multi-channel orders, fulfillment and separate human-recorded payment evidence. The guide presents app-owned contextual cards and confirmations; it cannot authorize business mutations.

```sh
cd shop-app
npm ci
npm run dev
```

Use Node 24. Open the loopback URL printed by the server. Preview is explicitly fictitious and isolated from the empty owner workspace. Paid AI and voice are disabled by default. See the shop README for private owner setup, supported workflows and hosted prerequisites. Source publication, test success, deployment and owner acceptance are distinct states.

## Existing reference work

The [Netlify qualification record](QUALIFICATION.md) documents local adapter, PostgreSQL and security-boundary verification on Node 24.16.0. CI builds the adapter and exercises its generated handler with synthetic fixtures only. This is **not a deployment**: hosted routing, Free-plan enforcement and owner acceptance remain unverified. Merge and any cloud pilot require separate approval.

The original root application, `src/`, `agent/`, `evals/`, domain glossary, ADRs and local specifications remain intact. Root tests run with `npm test`; shop tests run separately under `shop-app`. The root test path is explicit to avoid accidentally discovering the separately configured shop tests.

No credentials, local business databases or private QA artifacts belong in this repository. No deployment or provider call runs automatically from the verification workflow.
