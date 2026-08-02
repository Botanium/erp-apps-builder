# Adaptive Business OS Reference Vertical Slice

This is the executable, local, fictitious proof defined by Wayfinder Tickets
13–15. It is a dependency-light Node.js modular monolith, not a production
application.

## Run

Use Node.js `>=22.18 <27`, then run from the repository root:

```sh
npm test
npm run reference-slice
```

The second command starts a fresh single-writer local state generation, runs
the Owner Interview and explicit Blueprint Approval, provisions retail and
cafe independently from one Effective Blueprint, executes both business
scenarios and the fail-closed matrix, resets and deterministically replays the
fixtures, performs a final reset, and writes:

- `.scratch/adaptive-business-os-v1/evidence/reference-slice/acceptance.json`
- `.scratch/adaptive-business-os-v1/evidence/reference-slice/report.html`
- `.scratch/adaptive-business-os-v1/evidence/reference-slice/state.json`

Exit code `0` means only that the local Reference Slice Acceptance Report is
`Passed` and both active sandbox targets are clean and unapplied. It is not
owner acceptance, deployment permission, production readiness, or accounting
or regulatory compliance.

## Authority boundary

The four accepted public Interfaces are:

```text
ReferenceSlice.dispatch(action)       -> view
BusinessKernel.submit(command)        -> result
BusinessKernel.observe(query)         -> observation
AcceptanceEvaluator.evaluate(evidence)-> report
```

AI and owner-workbench behavior may propose Governed Configuration. Only the
Business Kernel validates and creates Blueprint Approval, Applied state,
business Records and Events, Stock Movements, Posting Sets, Payments, and
Sandbox Reset truth.

## Deliberate exclusions

All data is fictitious. Authentication, multi-process scaling, backups,
billing, external integrations or AI providers, production deployment,
migrations, and production hardening are absent. Cafe tables, reservations,
delivery, tips, loyalty, and advanced recipe costing also remain outside v1.
