# Prototype Blueprint compilation and business state

Type: prototype  
Status: resolved
Blocked by: 06, 07, 09, 10

## Question

Can one Approved Blueprint contract configure both Sandbox Experiences while
the Business Kernel executes the accepted retail and cafe state transitions and
invariants without tenant-specific runtime code?

## Answer

Yes. One immutable, explicitly Approved Blueprint may select the closed v1
Capability union once; one target-neutral compiler can resolve it into one
Effective Blueprint; and provisioning can prepare independently scoped retail
and cafe target configurations from that artifact. One shared governed-action
registry then executes both sets of business transitions. This is the
recommended option accepted under the owner's standing approval for the
remaining Wayfinder tickets.

## Prototype evidence

- **Throwaway branch:** `codex/prototype-blueprint-business-state`
- **Final prototype commit:** `396430a`
- **Initial state-model commit:** `0339ef6`
- **Run command:** `npm run prototype`
- **Scope:** local, in-memory, fictitious, non-authoritative terminal prototype

The prototype deliberately separated a pure state module from the terminal
shell. Its Blueprint content selected all eleven v1 Capabilities and declared
two target profiles. Retail exposed the ten Capabilities required by its Golden
Transaction; cafe exposed its nine required Capabilities. The target profiles,
Role and interface visibility, and fixture command sequences were data. The
Business Kernel action handlers were shared and contained no retail, cafe,
Tenant, or vertical-application branch.

The first prototype pass also caught and corrected an artifact-naming mistake:
prepared target configurations were initially labelled Effective Blueprints.
The final model conforms to the accepted Ticket 07 contract: there is exactly
one target-neutral Effective Blueprint; target-specific preparation and active
configuration are separate provisioning artifacts and state.

## Observed state-model results

1. Attempting compilation while the Blueprint remained Draft was rejected and
   changed neither target.
2. One explicit prototype action bound approval to the exact Blueprint
   Reference and Blueprint Content Identity.
3. Compilation produced one immutable target-neutral Effective Blueprint.
   Preparation derived two separately content-identified target configurations,
   and target-specific activation recorded the same exact Applied Blueprint for
   retail and cafe.
4. Retail executed Purchase Order confirmed, Supplier Receipt accepted, Order
   accepted, Sale fulfilled, and cash Payment accepted. Its final fictitious
   state contained 6 widgets valued at USD 30.00, USD 48.00 cash, zero
   receivable, USD 50.00 payable, and a USD 98.00 balanced trial balance.
5. Cafe executed ingredient Purchase Order and Supplier Receipt fixture setup,
   a Menu Item with an extra-shot Modifier, Order acceptance, Kitchen Ticket
   accepted, preparing, ready, fulfilled, ingredient consumption, and cash
   Payment. Its final fictitious state contained 973 g beans valued at USD
   19.46, 1,880 ml milk valued at USD 18.80, USD 1.74 consumed cost, USD 9.00
   cash, zero receivable, USD 40.00 payable, and a USD 49.00 balanced trial
   balance.
6. The invariant report passed after every command. It recomputed Posting Set
   balance, Business Event causation, target/Tenant/Location/generation scope,
   nonnegative stock, and the ledger trial balance from immutable effects.
7. Reset replaced retail and cafe generation 1 with new clean-unapplied
   generation 2 targets. Active Records, Business Events, Stock Movements,
   Posting Sets, stock, cash, balances, assignments, and Applied Blueprints
   returned to zero or explicit absence, while the Blueprint and approval
   history remained.

## Accepted compiler and execution shape

1. **One source:** one exact validated Blueprint Version and Content Identity
   own the complete Governed Configuration, including all target profiles.
2. **One compilation:** a pure, deterministic compiler resolves that exact
   Blueprint and Version Set into one immutable, self-contained,
   target-neutral Effective Blueprint. Compilation creates no runtime truth.
3. **Target preparation:** provisioning selects one declared target profile from
   the Effective Blueprint and prepares a complete candidate configuration in
   isolation. Retail and cafe candidates may differ in exposed Capabilities,
   Workflow arrangements, Roles, Evidence, interfaces, reports, copy, and
   fixture orchestration while retaining exact shared Capability semantics.
4. **Target activation:** each Sandbox Experience atomically activates its own
   prepared candidate and records the exact source as its Applied Blueprint.
   Partial target success remains visible and never becomes combined success.
5. **Shared execution:** typed Kernel Commands resolve declared governed-action
   identities through one Business Kernel registry. The handler for a governed
   action is selected by its Capability contract, not by Tenant, business kind,
   target label, interface, prompt, or generated code.
6. **Configuration, not code:** target differences are closed schema data.
   Fixture or orchestration command ordering may drive the proof, but it cannot
   add Kernel handlers, authorization logic, stock arithmetic, ledger posting,
   approval truth, reset authority, or arbitrary executable semantics.
7. **Isolated state:** Records, Business Events, Evidence, Stock Movements,
   Posting Sets, Payments, balances, and participant assignments remain scoped
   to one Tenant, Sandbox Experience, Location, and active Sandbox Generation.
   Sharing an Effective Blueprint never shares runtime state.
8. **Derived truth:** Stock Position, Cash Position, ledger balances, and
   invariant results are recomputed from immutable accepted effects. The
   prototype shell never directly edits them.
9. **Reset:** reset replaces target generations and Applied state, not the
   source Blueprint, Effective Blueprint, approval, or governance history.

## Prototype limits carried forward

The state prototype does not prove durable persistence, the complete closed
schema, authorization and separation of duty, Evidence enforcement, Human
Gates, retry durability, compatibility evaluation, canonical serialization,
export, or production security. Cafe ingredient acquisition used the shared
Purchasing and Receiving handlers as explicit fictitious fixture setup even
though those controls were absent from cafe's owner-facing navigation. Ticket
14 must make that fixture setup and its authority visible; Ticket 15 must
implement it within the sandbox boundary and test the accepted public seams.

The terminal prototype remains only on the throwaway branch. The validated
artifact and state boundaries, not its disposable code, feed the architecture
and acceptance decisions.
