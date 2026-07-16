# Exhaustive Repository Sweeps

Read this file when completion requires finding every relevant instance across
a repository or another finite source set. Use this workflow for migrations,
deprecations, compatibility audits, security sweeps, and similar coverage-bound
work. Use ordinary direct exploration when representative evidence or local
problem discovery is sufficient.

## Define The Coverage Boundary

State what qualifies as relevant, what sources are in scope, which exclusions
are intentional, and what evidence will prove coverage. Tie the sweep to a
specific Git reference or source snapshot.

Have the lead define deterministic selectors before assigning scouts. Use the
most reliable available mechanism, such as text search, syntax-aware search,
compiler or linter output, dependency graphs, manifests, schemas, or generated
inventories. Combine selectors when one mechanism could miss a material class
of candidates.

Run the selectors to produce a finite candidate queue. Record the selector,
scope, exclusions, source reference, and candidate count. Use a machine-readable
queue when the candidate set is too large for reliable manual reconciliation.
Do not let an agent decide subjectively that it has searched enough.

## Inspect The Finite Queue

Partition the queue into deterministic, non-overlapping shards with every
candidate assigned exactly once. Prefer boundaries that preserve useful local
context, such as package, subsystem, symbol family, or contiguous candidate
ranges.

Assign shards to read-only scouts in waves within the runtime's active-agent
capacity. Give every scout the shared classification rules and require a
disposition and evidence for every assigned candidate. Require scouts to return
confirmed findings, rejected candidates with reasons, unresolved candidates,
contradictions, and relevant validation commands. Prohibit edits and further
delegation.

Have the lead reduce the shard results. Deduplicate findings without losing
distinct affected locations, reconcile contradictions, and verify that every
candidate in the original queue has exactly one final disposition. Reinspect
material unresolved cases directly or through a focused scout follow-up.

## Verify And Remediate

Use static, runtime, build, or test evidence to verify findings when available.
Keep coverage evidence separate from remediation claims.

Group confirmed findings into coherent remediation features or PRs based on
behavior and integration boundaries, not merely the original shard layout.
Give each change one implementation owner. Isolate concurrent writable workers
in separate worktrees or workspaces; otherwise serialize them. Apply the normal
worker and validation rules to each change.

After remediation, rerun the original selectors against the resulting source
state. Reconcile any new candidates, preserve intentional exclusions, and do
not claim exhaustive completion until the queue is fully dispositioned and the
required verification passes.
