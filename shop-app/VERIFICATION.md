# Release verification

Status: **local clean-checkout verification passed on 4 October 2026**. Runtime: Node 24.16.0, Next 16.3.7, Playwright 1.63.0 with headless Chromium. Independent final-commit review and remote CI are subsequent gates; hosted verification and owner acceptance are MISSING.

| Check                           | Verified result                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Locked app install              | `npm ci` passed; app audit reported zero advisories                                                                                |
| Existing reference regression   | 48/48 passed across the original three test files                                                                                  |
| App unit/public API/store tests | 78/78 passed, including 3 live-validation guard tests and 2 public-export guard tests                                              |
| Type generation / TypeScript    | `npm run typecheck` passed from the clean checkout                                                                                 |
| Optimized build                 | `npm run build` passed                                                                                                             |
| Deployment bundle guard         | 13 trace manifests checked; zero forbidden local paths or client secret identifiers                                                |
| Browser workflows               | 26/26 tests in 11 specs passed in 2.7 minutes, zero retries                                                                        |
| Offline voice component         | 6/6 consent, interruption and workspace-isolation cases passed                                                                     |
| Real PostgreSQL adapter         | Seven groups passed in one new disposable PostgreSQL 17 container, restricted app role, zero existing containers modified          |
| Public export                   | Original 76-file export and subsequent review-fix delta passed the index guard; no forbidden artifacts or private metadata matches |

The browser matrix covers explicit 0/2/3-decimal owner setup; product correction and historical prices; reasoned physical counts; supplier purchase/full and partial receiving; all three manual channels; reserve/pack/dispatch/deliver; COD collection/remittance and online confirmation/settlement; pre-dispatch cancellation; failed unpaid-COD delivery followed by separate full-saleable return; durable history and cross-tab isolation; duplicate/conflicting/invalid commands; keyboard and 1280/390/320px layouts; and mocked voice boundaries. Tests use public UI/API seams and fresh fictional data, not real owner records.

PostgreSQL checks cover restricted-role access, atomic state/confirmation writes, concurrent stale-revision denial, legacy-schema read/replay preservation, shared budget concurrency, conversation durability and auth revocation/throttling. No provider calls occur. The temporary container and its tmpfs data were removed; the application database was not migrated.

The PR review added two regression fixes: a rejected store initialization is evicted so a later request can recover without restarting or automatically retrying business actions; voice configuration requires at least the existing transcription-plus-speech reservation total (26,000 micro-USD). Real PostgreSQL reproduced the initialization failure before the fix and then proved same-process recovery with one business/audit/confirmation effect under concurrent command replay. Public voice routes reject undersized configuration before any provider call. Remaining shared budget is still enforced per request, not promised by the configuration check. The earlier CI run passed; the revised commit still requires its own CI and delta review.

The original root dependency lockfile is unchanged. Its separate audit reports existing Eve/Undici advisories; the app has its own lockfile and does not depend on Eve. Do not interpret the app's audit as a clean audit of every historical repository dependency.

Public source excludes private build/QA/voice notes, actual configuration, local databases, generated output, screenshots and provider/account identifiers. The release scanner reads index bytes for staged checks and pinned Git commit bytes for base/head checks, with regressions for divergent unstaged content. CI uploads only synthetic browser artifacts/reports on failure, never fixture databases or configuration.

No test result implies a connected social channel, processed payment, real microphone acceptance, production backup/availability, hosted authentication or owner signoff. One historical bounded text request returned a validated card; subsequent tool-only fallback correction is mock-tested only. Paid test retries and live audio remain excluded.

Other browser engines, full screen-reader certification, hosted HTTPS/auth/PostgreSQL, production backup/restore, real channel/courier/payment connections, live voice and owner acceptance remain MISSING. Partial payments, fees/refunds, paid/partial/damaged/missing returns and redelivery are intentionally unsupported.
