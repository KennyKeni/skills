# Backend shapes

Runtime-specific mappings for the modular-hexagonal style. Use these as
mappings, not templates: preserve the host language's idioms and the
repository's established conventions. The conventional request backend is in
[README.md](README.md); the shapes below cover other execution models.

## Core vocabulary

- **Module**: a cohesive business capability with owned policy, model, state,
  and public contract.
- **Core**: module-owned use cases and domain policy, independent of
  transport and vendor formats.
- **Driving adapter**: translates an incoming conversation into a use-case
  call.
- **Driven adapter**: translates a core-requested conversation into an
  external effect.
- **Port**: a purposeful, module-owned conversation justified by variation,
  volatility, isolation, or module separation.
- **Composition root**: executable-edge code that selects concrete adapters
  and wires the application.

The meaningful asymmetry is inside versus outside. "Left/right,"
"primary/secondary," and directory names are optional visual aids.

## Event consumer or stream processor

```text
event/stream -> consumer adapter -> use case -> core policy
                                      |-> checkpoint port -> runtime adapter
                                      |-> output port ----> topic/sink adapter
```

The event envelope, broker acknowledgment, partition metadata, and
serialization stay in the adapter. Idempotency policy belongs in the core
when it is a business rule; broker-specific deduplication belongs in the
adapter. Treat replay and ordering guarantees as part of the driving
conversation contract.

## Scheduled job or CLI

```text
scheduler/shell -> command adapter -> use case -> ports -> adapters
```

The job and an HTTP endpoint may drive the same use case. Flags such as
dry-run or batch size become use-case inputs only when they express
application behavior; process signals and console formatting remain outside.

## Serverless function

Treat the platform function as a driving adapter plus composition root. Keep
platform event types, bindings, retry metadata, and response objects at that
edge. Reuse a module core across HTTP, queue, and scheduled functions when
they implement the same conversation. Split deployables only where scaling,
security, ownership, or failure isolation requires it; deployment units do
not define business modules by themselves.

## Actor, durable object, or entity process

```text
message/RPC/alarm -> actor adapter -> entity use cases + invariants
                                      |-> owned durable state
                                      |-> external-effect ports
```

An actor runtime may combine entry point, lifecycle, and persistence. Keep
its owned state close rather than manufacturing a repository seam: let the
runtime shell load state, pass it to pure entity policy, then commit the
returned transition and interpret its effects. Extract ports for clocks,
remote calls, event publication, or alternate persistence only when a
concrete pressure exists. This keeps invariants deterministic without
pretending the native state mechanism is replaceable.

## Workflow or saga engine

```text
signal/event -> workflow adapter -> orchestration policy
                                      |-> activity ports -> activity adapters
                                      |-> timer port ----> runtime timer
```

Workflow determinism and runtime APIs are adapter constraints. Business
sequencing, compensation decisions, and long-running state transitions
belong to the orchestration core. When the runtime requires orchestration
code in its SDK, isolate SDK-shaped glue from policy where the separation
remains honest and useful.

## Data pipeline, plugin, or embedded library

- For a data pipeline, stages that encode business transformations form the
  core; source/sink formats and runners are adapters.
- For a plugin host, host callbacks are driving adapters; host services are
  driven adapters; the plugin capability is the module.
- For an embedded library, the exported API is both the module contract and
  driving port. Callbacks supplied by the host are driven ports when the
  library owns the required conversation.

## Cross-module collaboration

Use one of three forms:

1. **Direct in-process contract** for immediate queries or commands. The
   provider exposes a narrow public API; the consumer may define an even
   narrower consumer-owned interface when the language supports structural
   typing.
2. **Published event** when the producer need not control or know downstream
   work. Define event ownership, delivery semantics, idempotency, and
   consistency expectations.
3. **Orchestration module** when a use case intentionally coordinates
   several modules. It depends on their public contracts and owns the
   cross-module process, while each module retains its invariants and state.

Repeated calls across a boundary, shared writes, or distributed transaction
machinery are evidence to revisit the boundary before adding more
infrastructure.

## Incremental migration

Move one behavior at a time:

1. Choose a behavior with a clear trigger and outcome.
2. Name its capability owner and public use-case contract.
3. Move policy behind that contract while keeping existing handlers and
   persistence working as adapters.
4. Move owned data access into the module and replace cross-module
   table/repository access with public collaboration.
5. Add mechanical import/state-ownership checks.
6. Repeat only after the tracer slice proves the shape.

Preserve behavior throughout. A temporary compatibility adapter is
preferable to a repository-wide structural rewrite.
