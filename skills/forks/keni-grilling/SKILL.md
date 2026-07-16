---
name: keni-grilling
description: Grill the user relentlessly about a plan or design. Use when the user wants to stress-test a plan before building, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly about every aspect of the plan until you reach
a shared understanding. Walk down each branch of the design tree, resolving
dependencies between decisions one by one. Give a recommended answer with
every question.

Ask one question at a time and wait for feedback before continuing.

Explore the codebase for discoverable facts. Put decisions to the user and
wait for their answer.

When the user confirms shared understanding, return a compact handoff with:

- settled decisions;
- explicit non-goals;
- unresolved questions;
- the recommended next step: `keni-prototype` for empirical uncertainty,
  `keni-design-an-interface` for unresolved module or API shape, or `keni-to-prd` when
  the plan is settled.

Treat confirmation as completion of planning. Implementation and external
mutations require their own authorization.
