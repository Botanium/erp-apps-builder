# Blueprint compiler and business-state prototype

Question: can one exact Approved Blueprint configure tailored retail and cafe
Sandbox Experiences while one shared Business Kernel executes both flows and
their stock and ledger invariants without target-specific runtime code?

Run the interactive terminal prototype with one command:

```sh
npm run prototype
```

Suggested sequence:

1. `a` — explicitly approve the one immutable Blueprint.
2. `c` — compile and provision both target profiles.
3. `r` — advance retail one governed action at a time.
4. `k` — advance cafe one governed action at a time.
5. `i` — recompute the invariant report.
6. `x` — replace both fictitious runtime generations with clean generations.

The prototype is in-memory, local, and deliberately disposable. Its fixture
data is fictitious. It performs no production operation and provides no
production security or persistence claim.
