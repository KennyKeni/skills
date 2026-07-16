---
name: design-modular-backend
description: Design or reshape backend architecture with module-first vertical slices and selective hexagonal seams. Use when creating a backend, defining module boundaries, reorganizing handler/service/repository code, applying ports and adapters without abstraction sprawl, or adapting the pattern to queues, jobs, workflows, actors, serverless functions, streams, CLIs, and other non-HTTP execution models.
---

# Design Modular Backend

Build a **module-first, selectively hexagonal** backend: cohesive business capabilities at the top level, narrow public contracts between them, and ports only where an inside/outside seam earns its cost.

## Process

### 1. Inventory conversations

Inspect the repository and trace representative behavior end to end. Read `.local/agents/domain.md` when it exists, then follow its routing to relevant context, ADRs, and architecture documents. Treat accepted architecture as normative, proposed architecture as advisory, and superseded architecture as historical. Record:

- business capabilities and the language used for them;
- driving conversations: HTTP/RPC calls, commands, events, schedules, streams, actor messages, workflow signals, or direct library calls;
- driven conversations: persistence, remote services, clocks, identity, files, queues, caches, runtimes, and other effects;
- state ownership, transaction boundaries, and cross-capability calls;
- likely change axes and tests that need isolation.

Treat framework labels as implementation details. A repository is one kind of driven adapter; a handler is one kind of driving adapter.

Complete this step when every representative behavior has a known trigger, policy owner, state owner, and external effect.

### 2. Draw module boundaries

Slice first by cohesive business capability or bounded context. Put a capability's use cases, model, state access, and adapters in the same top-level module. Use technical layers only inside that module when they improve local navigation.

Give each module:

- one reason to change in business language;
- ownership of its model and persistent state;
- a small public contract of commands, queries, and/or published events;
- private implementation behind language or tooling visibility controls.

Prefer merging capabilities that require constant synchronous chatter, shared invariants, or one atomic transaction. Prefer separate modules when language, lifecycle, data ownership, or change cadence diverges.

Complete this step when every behavior and state concept has one module owner and every cross-module interaction targets a public contract.

### 3. Spend ports selectively

Model a port as a purposeful conversation owned by the inside that needs it, not as a synonym for every function or class boundary.

Introduce a port when at least one concrete pressure exists:

- multiple real adapters serve the same conversation;
- volatile technology or an external data model must stay outside the core;
- deterministic core tests need control over an effect such as time, randomness, I/O, or scheduling;
- a module-to-module dependency needs a narrow consumer-shaped contract;
- independent deployment is plausible enough to preserve a replaceable transport seam.

Use a direct call for pure, stable local details with one implementation and no isolation pressure. Native capability-owned state may stay in a runtime shell without a repository interface when the shell loads state, gives it to pure policy, and commits the returned transition. When policy must initiate an effect while remaining isolated from it, use a port. Keep ports narrow and expressed in module-owned concepts. Map transport, vendor, and persistence DTOs at adapters.

Complete this step when every proposed port names its conversation and justification, and unearned abstractions have been collapsed.

### 4. Map the runtime shape

Choose the closest layout from [references/shapes.md](references/shapes.md), then adapt it to the language and framework rather than reproducing directory names mechanically.

Keep driving adapters thin: decode, authenticate/authorize at the appropriate edge, validate transport shape, invoke a use case, and encode the result. Put business decisions and orchestration in the module core. Put protocol and vendor translation in driven adapters. Wire modules and adapters in composition roots at executable boundaries.

Complete this step when each entry point reaches the same use-case contract independent of transport and every effect is handled by a justified port or an explicitly chosen runtime shell.

### 5. Make boundaries executable

Use package visibility, import rules, build targets, architecture tests, or lint rules to enforce:

- dependencies point from adapters toward module-owned contracts and core policy;
- modules reach another module through its public contract or published events;
- each module alone accesses its owned state;
- composition roots hold concrete wiring;
- the module dependency graph is acyclic, or an explicit orchestration module breaks the cycle.

Complete this step when forbidden imports and state access fail mechanically where the ecosystem permits it, with remaining conventions documented next to the architecture.

### 6. Prove one vertical slice

For a design request, present one representative flow from trigger through module contract, core policy, ports, adapters, and state. Include the module graph, proposed layout, port-justification table, enforcement mechanism, test strategy, and incremental migration order.

For an implementation request, build one end-to-end tracer slice before replicating the shape. Test core behavior through its public use case, adapters against port contracts, module collaborations at public contracts, and a small number of assembled paths end to end.

Complete this step when the representative slice works without bypassing a module contract and the proposed pattern handles every inventoried execution model.

## Persist a design

Present the design inline by default. Create a file only when the user explicitly asks to save or write the architecture.

For a local save without another requested path, write or update `.local/architecture/modular-backend.md`. For a committed or shared save, require the user to supply the target path; that output is outside this local convention.

Use this structure:

```markdown
# Modular Backend Architecture

Status: proposed | accepted | superseded
Updated: YYYY-MM-DD
Scope: <capabilities and systems covered>
Tracker: <issue URL or none>
Supersedes: <document or none>
Superseded by: <document or none>

## Current state
## Target state
## Module and dependency model
## Runtime and adapter model
## Migration strategy
## Linked decisions
```

Default a new document to `proposed`. Change status to `accepted` only after explicit user acceptance or an authoritative linked decision. Change status to `superseded` only when naming its successor. Keep atomic decisions in `.local/adr/` and link them from the architecture document.

## Design checks

Apply all of these before finishing:

- A new transport adapter can invoke existing policy without moving that policy.
- A vendor or persistence schema change is absorbed by its adapter.
- A module can explain its public surface without exposing handlers, repositories, tables, or vendor DTOs.
- Cross-module reads and writes respect state ownership.
- Ports correspond to real conversations and pressures, not architectural symmetry.
- Directory names communicate business ownership before technical role.

For layout examples, unconventional runtimes, migration guidance, and source material, read [references/shapes.md](references/shapes.md).
