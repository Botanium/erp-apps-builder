# Issue tracker: Local Markdown

Issues and specifications (including PRDs) for this repository live as Markdown files under `.scratch/`.

## Conventions

- One feature or effort per directory: `.scratch/<feature-slug>/`
- The specification is `.scratch/<feature-slug>/spec.md`.
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`; never use one combined tickets file.
- Implementation-ticket triage state is recorded as a `Status:` line near the top of each issue file. Use the role strings in `docs/agents/triage-labels.md`.
- Comments and conversation history append under a `## Comments` heading.

## When a skill says “publish to the issue tracker”

Create a new file under `.scratch/<feature-slug>/`, creating the directory if needed.

## When a skill says “fetch the relevant ticket”

Read the file at the referenced path. The user will normally provide the path or issue number directly.

## Wayfinding operations

Used by `wayfinder`. A Wayfinder effort has one map file and one child file per decision ticket.

- **Map:** `.scratch/<effort>/map.md` — the Destination, Notes, Decisions-so-far, Not-yet-specified, and Out-of-scope index.
- **Child ticket:** `.scratch/<effort>/issues/<NN>-<slug>.md`, numbered from `01`, with one decision question in the body.
- **Type:** a `Type:` line records `research`, `prototype`, `grilling`, or `task`.
- **Status:** a new child begins with `Status: open`. Claiming changes it to `claimed`; resolving changes it to `resolved`. Explicit `open` is this repository's local convention.
- **Blocking:** use `Blocked by: None` or `Blocked by: NN, NN`. A ticket is unblocked when every listed ticket is `resolved`.
- **Frontier:** scan the effort's `issues/` directory for the lowest-numbered child whose status is `open` and whose blockers are all resolved.
- **Claim:** change `Status: open` to `Status: claimed` and save before any work.
- **Resolve:** append the answer under `## Answer`, change the status to `resolved`, then append one linked gist to the map's Decisions-so-far section.
- **Human references:** refer to a ticket by its title and link, never by a bare number alone.

## Keep decision and implementation states separate

Wayfinder decision tickets use `open`, `claimed`, and `resolved`. Later implementation tickets created from an approved specification use the triage-role strings in `docs/agents/triage-labels.md`. Do not put implementation triage labels on Wayfinder decision tickets.
