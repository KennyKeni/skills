# Native Codex Lane

Use this policy to classify work and route each role and consequence tier
through its configured executor. This policy selects execution mappings; it
does not introduce new roles.

## Classify The Scout

Record a routine scout when it has one explicit, bounded question, a clear stop
condition, a bounded search surface or budget, and an evidence-only return that
direct file, line, command, log, or authoritative-source evidence can settle.
The search may span a large repository or source set when the question and stop
condition remain bounded.

A scout may remain routine when the lead will use its findings to decide
architecture, security, migrations, schemas, concurrency, production-data, or
public behavior. The lead owns those decisions and verifies material evidence.

Record a consequential scout only when the evidence task itself requires:

- reconciling material contradictions that remain after a bounded routine
  search;
- nonlocal causal diagnosis across multiple behaviorally coupled boundaries;
  or
- synthesizing cross-repository trust, production-data, or distributed-state
  flows that cannot be decomposed into bounded evidence questions.

Classify bounded pattern discovery and bounded evidence gathering for a
consequential worker decision as routine scouting.

## Gate Worker Readiness

Apply the main skill's worker-readiness gate before selecting a tier. Confirm
that the operational envelope covers affected consumers, deployment
dependencies, integration obligations, cumulative behavior, rollback, and
proof. Expand the packet boundary when implementation, containment, recovery,
or acceptance proof depends on adjacent work; otherwise preserve that
dependency as routing evidence.

## Classify The Ready Worker

Record a ready worker as routine when:

- ownership, scope, integration obligations, and affected consumers are
  bounded;
- failure has contained impact and ordinary revert or rollback is credible;
- deployment does not require a coordinated high-risk transition; and
- correctness has reliable, task-local proof through automated tests,
  deterministic commands, or clear visual or manual verification.

Treat an established pattern, mechanical repetition, backward compatibility,
and direct automated tests as strong confidence signals, not prerequisites.

Record a ready worker as consequential when implementation:

- changes a trust boundary or security-relevant behavior,
  including authentication, authorization, session or token lifecycle,
  credential or secret handling, permissions, tenant isolation, cryptography,
  or validation at an exposed boundary;
- changes material production-data semantics or integrity invariants whose
  blast radius, recovery, or correctness cannot be contained and proved
  task-locally;
- performs destructive or irreversible production-data work;
- makes a backward-incompatible externally consumed contract change;
- requires coordinated rollout across independently deployed consumers;
- changes a distributed-state, ordering, or concurrency invariant whose
  correctness cannot be established with task-local proof;
- has broad blast radius that cannot be contained by ordinary revert or
  rollback; or
- depends materially on production-only or otherwise non-reproducible evidence.

A specifically named inability to establish containment may also justify
consequential routing when it identifies the unknown operational boundary and
explains why another bounded scout cannot settle it. Generic uncertainty is
insufficient.

Treat the following as routine-compatible rather than as hard triggers:

- a new feature, multiple files or modules, routine integration, or unfamiliar
  code;
- an additive patterned API or schema change;
- a backward-compatible migration;
- implementing an architecture or approach already resolved by the lead;
- documentation, copy, fixtures, local seed data, visual changes, mechanical
  refactors, routine automation, or adding and updating tests; or
- downstream importance of the result.

For every consequential classification, record:

- `trigger`: the exact hard trigger above or `inability_to_bound`;
- `evidence`: concrete repository, contract, or operational facts showing it
  applies; and
- `containment_failure`: why ordinary rollback and task-local proof are
  insufficient.

## Calibrate The Classification

| Assignment | Result |
| --- | --- |
| Find every reader of one configuration key with file and line evidence. | Routine scout |
| Locate the established handler pattern within a bounded search budget. | Routine scout |
| Reconcile conflicting authorization behavior across independently deployed services. | Consequential scout |
| Add an optional CLI flag following the existing parser, configuration, and test pattern. | Routine worker |
| Add a backward-compatible response field with contract tests and no coordinated rollout. | Routine worker |
| Change authorization semantics for tenant-scoped resources. | Consequential worker |
| Rewrite an irreversible production dataset. | Consequential worker |
| Improve onboarding without defined behavior or acceptance assertions. | `not_ready` worker candidate |
| Redesign cache invalidation without a selected contract or credible proof plan. | `not_ready` worker candidate |

## Route The Tier

Use these mappings:

- routine `scout`: native Codex with `gpt-5.6-luna` at high effort;
- consequential `scout`: native Codex with `gpt-5.6-sol` at medium effort;
- routine `worker`: native Codex with `gpt-5.6-luna` at high effort;
- consequential `worker`: native Codex with `gpt-5.6-sol` at medium effort;
- every `validator`: fresh native Codex with `gpt-5.6-sol` at high effort.

Skip the scout when the main skill's delegation criteria do not justify one.
Keep `scout`, `worker`, and `validator` as the canonical roles and include the
routing class, selected execution lane, and exact model in the assignment
packet.

When an explicit provider or harness request does not authorize a configured
route's executor, return that assignment to the lead and report the mismatch
instead of silently changing executors.

## Escalate On Evidence

Classify an assignment as consequential before spawning when a supported hard
trigger or `inability_to_bound` and its required record are already known.
During execution, stop and return to the lead when a scout exhausts its budget
or encounters material contradictions, or when a worker reaches two materially
different unsuccessful approaches, discovers concrete coupling, cannot
produce acceptance-aligned proof, or discovers a high-consequence implication.

Treat each stop as a lead reassessment boundary. Promote a scout only when its
evidence now meets the consequential-scout definition. Reassess worker
readiness after a failed approach or failed proof; keep the candidate
`not_ready` when its design or proof plan is unresolved, and promote it only
when `trigger`, `evidence`, and `containment_failure` are present. A worker
remains `not_ready` when even a consequential scout cannot establish the
required contract or operational envelope.

Treat lead or validator findings as new routing evidence. When reassessment
returns `routine`, send only bounded routine corrections to the same session.
When it returns `consequential`, stop the routine assignment and route the
scout through native Codex with `gpt-5.6-sol` at medium effort or the worker
through native Codex with `gpt-5.6-sol` at medium effort, passing a compact
handoff containing the contract, observations, attempted proof, changed files
when applicable, and unresolved questions. When it returns `not_ready`, stop
the worker, preserve its evidence, and return the candidate to the lead for
shaping. Treat executor self-checks as worker evidence; retain independent
validation through fresh native Codex with `gpt-5.6-sol` at high effort.

## Select Model And Effort

Use the role and consequence-tier mappings configured above. Treat their exact
model IDs, efforts, and freshness requirements as authoritative. Retain the
current lead model and effort, and state the selected model and effort in each
assignment. Keep medium and high as execution settings rather than role names.
If the requested setting is unavailable, keep the work in the lead or report
the limitation.

## Invoke Native Codex

Spawn with the current native subagent controls, keeping model and effort
selection in the spawn assignment rather than persistent custom-agent
configuration. Pass a compact assignment with the minimum useful context,
follow the global subagent context-forking policy, and record the task name or
identifier immediately after spawning.

Apply the main skill's event loop. Observe through mailbox waits using the
active lead runtime's configured event-wait cadence; when the loop permits a
health check, inspect the active-agent list once. Leave the subagent's worktree
untouched during supervision.

For each initial formal validation pass, set `fork_turns: "none"` or the
native equivalent that excludes implementation history. Supply the contract,
coherent change, relevant primary sources, validation evidence, and
findings-only return shape directly in the fresh assignment.

## Continue And Clean Up

Send focused scout or worker follow-ups to the recorded task, then return to
mailbox waiting. Resume a scout or worker only while its context remains
trustworthy; interrupt only the affected session without closing it. Preserve
an interrupted initial validator's useful evidence and replace it with a fresh
pass, resuming a validator only for bounded delta revalidation in the same
review cycle. Replace or close any task whose context is no longer reliable.
