# Domain Docs

This repository uses a single-context domain-document layout.

## Before exploring, read these

- `CONTEXT.md` at the repository root for canonical domain language.
- Relevant ADRs under `docs/adr/` for architectural decisions affecting the area being explored.

If either location does not exist, proceed silently. Do not create empty placeholders. The `domain-modeling` skill creates `CONTEXT.md` when the first term is resolved and creates `docs/adr/` only when a decision genuinely warrants an ADR.

## Selected file structure

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-example-decision.md
│       └── 0002-another-decision.md
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept—in an issue title, refactor proposal, hypothesis, interface, or test—use the term defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If a needed concept is missing, reconsider whether new language is being invented unnecessarily. If the gap is real, resolve it through `domain-modeling` and update `CONTEXT.md` inline.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly rather than silently overriding the decision.
