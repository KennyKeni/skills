# Architecture policy

This README records the stable cross-service guarantees shared by the member
repositories listed in the fleet index. Read the live repositories for
current facts. Edit this user-owned policy when a decision changes the
rules, and record the decision in [decisions/](decisions/) first. Each
member repository chooses its own internal architecture style in its own
`.local/architecture/` tree.

## Doctrine

Services are sliced by business capability. Each service owns its model and
persistent state behind a narrow public contract of commands, queries, and
events; no service reads or writes another's datastore, and there is no
shared mutable database. Cross-service communication uses only the
mechanisms recorded under stable constraints, and every synchronous API and
asynchronous event is a versioned, owner-published contract that stays
backward-compatible — evolving through expand–migrate–contract rather than
breaking consumers. Prefer eventual consistency across services and avoid
distributed transactions that span a boundary; each service degrades
predictably when a dependency is unavailable. Record each boundary,
contract, or communication-mechanism decision in [decisions/](decisions/)
before changing it.

## Stable constraints

{{architectureConstraints}}

Architecture policy may cover service ownership and bounded contexts,
allowed communication mechanisms, contract versioning rules, invariants,
external-system boundaries, and constraints requiring explicit review.

## Authoritative shared sources

{{architectureSources}}

Accepted decision records in [decisions/](decisions/) are normative. Proposed
material is context, and superseded material cannot silently become an active
requirement.

Proposed material does not live in this folder: drafts belong in `scrap/`
beside the index; only accepted records and this README are normative.
