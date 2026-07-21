## Doctrine

Module-first, selectively hexagonal. Top-level modules are cohesive business
capabilities owning their model and persistent state, exposing a small public
contract of commands, queries, and events. Technical layers exist only inside
a module, and only when they improve local navigation. Dependencies point
from adapters toward module contracts and core policy; the module graph stays
acyclic; boundaries are enforced mechanically wherever the ecosystem allows.
A module may internally slice by request (one folder per command or query)
when its use cases are many and independent — that is a within-module tactic,
not a different style.

Give each module one reason to change in business language, ownership of its
model and persistent state, a small public contract, and private
implementation behind visibility controls. Merge capabilities that need
constant synchronous chatter, shared invariants, or one atomic transaction;
separate them when language, lifecycle, data ownership, or change cadence
diverges.

## Layout and naming

```text
src/
  modules/
    orders/
      public/                 # commands, queries, results, events — the contract
      core/                   # use cases and business policy
      adapters/
        http/                 # driving adapter (handler/controller)
        persistence/          # driven adapter (repository implementation)
        payments/             # driven adapter (remote client)
      module.*                # module construction and export
  app/
    http-main.*               # composition root
```

| Familiar name | Role here |
|---|---|
| handler / controller | driving adapter in `adapters/http/` |
| service / use case | core orchestration and policy in `core/` |
| repository interface | driven port, only when justified (see Seams) |
| repository implementation / ORM model | driven adapter in `adapters/persistence/` |
| router / bootstrap / main | composition root in `app/` |

Name modules after business capabilities, not technology. Name ports after
the conversation they carry (`OrderPaymentGateway`, not `IPaymentService`).
Adapt directory names to the host language's idioms rather than reproducing
this tree mechanically. Runtime-specific shapes (event consumers, jobs,
serverless functions, actors, workflows) and the incremental migration order
are in [SHAPES.md](SHAPES.md).

## Seams

A port exists only under concrete pressure: multiple real adapters serve the
same conversation; volatile technology or an external data model must stay
outside the core; deterministic core tests need control over an effect such
as time, randomness, I/O, or scheduling; a module-to-module dependency needs
a narrow consumer-shaped contract; or independent deployment is plausible
enough to preserve a replaceable transport seam. Otherwise call directly.

Keep ports narrow and expressed in module-owned concepts; map transport,
vendor, and persistence DTOs at adapters. Native capability-owned state may
stay in a runtime shell without a repository interface when the shell loads
state, gives it to pure policy, and commits the returned transition. Modules
reach each other only through public contracts or published events; only the
owning module touches its state.

## Fit and failure modes

Right for capability-partitioned services and monoliths whose domain is real
and growing — the modular monolith is this style at single-deployable scale.
Failure modes: ports added for symmetry rather than pressure (collapse them);
modules sliced by technology instead of capability (re-slice); chatty
synchronous cross-module calls or shared writes (merge the modules or add an
explicit orchestration module). When the whole system is a thin CRUD surface
or a prototype, this style is overhead — prefer a simpler style and record
the choice in [decisions/](decisions/).
