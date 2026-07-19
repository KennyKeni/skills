# Cursor Grok Lane

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

- routine `scout`: this lane with `cursor-grok-4.5-high`;
- consequential `scout`: native Codex with `gpt-5.6-sol` at medium effort;
- routine `worker`: this lane with `cursor-grok-4.5-high`;
- consequential `worker`: native Codex with `gpt-5.6-sol` at high effort;
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
through native Codex with `gpt-5.6-sol` at high effort, passing a compact
handoff containing the contract, observations, attempted proof, changed files
when applicable, and unresolved questions. When it returns `not_ready`, stop
the worker, preserve its evidence, and return the candidate to the lead for
shaping. Treat executor self-checks as worker evidence; retain independent
validation through fresh native Codex with `gpt-5.6-sol` at high effort.

## Select And Verify The Model

Use `cursor-grok-4.5-high` for every routine scout and worker session in this
lane.
Do not substitute `cursor-grok-4.5-high-fast` or another `fast` variant. Verify the
installed CLI, authentication, and model once before the first Cursor
assignment in the current context:

```bash
cursor-agent status
cursor-agent models | rg -x 'cursor-grok-4\.5-high - Cursor Grok 4\.5'
```

Keep the work in Codex or report the limitation when Cursor is unavailable,
the account is not authenticated, or the model is absent. Retain the exact
model for focused follow-ups.

## Invoke Cursor

Create a compact prompt file using the environment's approved file-writing
mechanism. Set `REPO` and `PROMPT_FILE` to absolute paths. Use single-result
JSON for short probes and scouts. Use event-stream JSON for long workers so the
lead can supervise meaningful progress without polling the process. Never add
`--stream-partial-output`; regular `stream-json` already emits thinking
progress, completed assistant messages, tool activity, errors, and a final
result, while partial output adds token-sized assistant fragments and duplicates
the completed response.

Worker invocation:

```bash
cursor-agent --print \
  --workspace "$REPO" \
  --model cursor-grok-4.5-high \
  --output-format stream-json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Scout invocation:

```bash
cursor-agent --print \
  --workspace "$REPO" \
  --model cursor-grok-4.5-high \
  --output-format json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Run scouts in full Agent mode with `--force` so repository, shell, web, and
other available tools are not permission-constrained. Enforce the scout's
evidence-only and no-edit boundaries in its assignment rather than through
Cursor mode permissions. Give workers the main skill's bounded change surface
and no-delegation boundary.

For `stream-json`, capture `session_id` from the initial `system/init` event
immediately; do not wait for the final result. Observe completed assistant
messages, `tool_call` start/completion, errors, and the terminal `result` event.
Treat the terminal event's `is_error`, subtype, process exit, and useful result
as the completion evidence. Do not reconstruct the answer from thinking deltas.

Apply the main skill's event loop. Observe `stream-json` through its completed
assistant messages, `tool_call` start and completion events, errors, and
terminal `result` event. Single-result `json` may remain quiet until its
terminal result. After several minutes without an expected stream event, the
main event loop permits one process-liveness inspection for the current quiet
episode. Leave the workspace untouched during supervision.

## Continue And Clean Up

Resume a focused follow-up with the recorded chat ID, the same workspace,
full permissions, and a focused prompt file. Set `MODEL` to the exact model
used by the original scout or worker:

```bash
cursor-agent --print \
  --resume "$CHAT_ID" \
  --workspace "$REPO" \
  --model "$MODEL" \
  --output-format stream-json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Use `--force` for both scouts and workers. Avoid bare `--continue` when several
chats may exist. Delete each prompt file after the invocation completes and its
chat ID and useful result are preserved. If the chat ID was not recorded before
an interruption, use `cursor-agent ls` interactively and match the repository
and assignment context; Cursor does not provide a reliable headless chat-list
interface.

Keep `stream-json` for a follow-up to a long worker; `json` remains suitable for
a short follow-up. Resume the same chat after a capacity error or interruption
when its context remains trustworthy.

When the main event loop permits a lane-health check or recovery, inspect the
recorded run's process:

```bash
ps -axo pid,ppid,command | rg '[c]ursor-agent' || true
```

Interrupt only the leftover process created by the delegated run. Preserve the
prompt file until the interrupted run's chat ID and useful evidence are
recovered. Then resume that exact chat with the full follow-up invocation above.
Replace the chat only when it cannot resume or its context is no longer
trustworthy.
