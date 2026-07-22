# Codex Sol Lane

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

- routine `scout`: this lane with `gpt-5.6-sol` at medium effort;
- consequential `scout`: this lane with `gpt-5.6-sol` at high effort;
- routine `worker`: this lane with `gpt-5.6-sol` at medium effort;
- consequential `worker`: this lane with `gpt-5.6-sol` at high effort;
- every `validator`: a fresh session of this lane with `gpt-5.6-sol` at high effort.

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
scout through this lane with `gpt-5.6-sol` at high effort or the worker
through this lane with `gpt-5.6-sol` at high effort, passing a compact
handoff containing the contract, observations, attempted proof, changed files
when applicable, and unresolved questions. When it returns `not_ready`, stop
the worker, preserve its evidence, and return the candidate to the lead for
shaping. Treat executor self-checks as worker evidence; retain independent
validation through a fresh session of this lane with `gpt-5.6-sol` at high effort.

## Select Model And Effort

Use `gpt-5.6-sol` with the effort configured for each role
and consequence tier above. Set `EFFORT` from that mapping before every
invocation, and pin model and effort explicitly rather than relying on user
config.
Verify the CLI once before the first assignment in the current context:

```bash
command codex --version
```

Keep the work in Claude or report the limitation when Codex is
unavailable.

## Invoke Codex

Claude has no native Codex spawn control. Write the compact assignment
to a prompt file using the environment's approved file-writing
mechanism — never inline shell quoting. Set `REPO` and `PROMPT_FILE` to
absolute paths, `EFFORT` from the tier mapping, `OUT` to a unique result file
path per assignment, and `EVENTS` to a unique event-log path per assignment.
Use `command codex` to bypass any interactive shell wrapper. The run streams
`--json` events to `EVENTS`; its first `thread.started` event records the
`thread_id` that resume targets, so keep that file with the assignment.

Worker invocation:

```bash
command codex exec -C "$REPO" \
  --model gpt-5.6-sol \
  -c model_reasoning_effort="$EFFORT" \
  --json \
  --dangerously-bypass-approvals-and-sandbox \
  -o "$OUT" \
  - < "$PROMPT_FILE" > "$EVENTS" 2>/dev/null
```

Scout invocation:

```bash
command codex exec -C "$REPO" \
  --model gpt-5.6-sol \
  -c model_reasoning_effort="$EFFORT" \
  --json \
  --sandbox read-only \
  -o "$OUT" \
  - < "$PROMPT_FILE" > "$EVENTS" 2>/dev/null
```

Suppress stderr because thinking noise bloats context; remove `2>/dev/null`
only to debug a failing run. Read the `-o` result file for the outcome rather
than parsing streamed output. Run long assignments in a supervised background
execution session and read the result file on exit.

Apply the main skill's event loop. A `codex exec` run is quiet by design:
treat silence as normal, use process liveness and the result file as the
observation surface, and do not interrupt a quiet run before a configured
deadline. Leave the repository untouched during supervision.

For every validator, start a fresh `codex exec` process with only its compact
validation packet.

## Continue And Clean Up

Send a focused follow-up to an existing scout or worker only while its context
remains relevant. Resume targets that assignment's exact session: the macro
reads `thread_id` from its `EVENTS` file, never `--last`, so a sibling Codex
session — including the lead's own — cannot be selected by accident. `codex
exec resume` has no `-C`; run it from the repository:

```bash
(cd "$REPO" \
  && SESSION_ID=$(rg -m1 -o '"thread_id":"([0-9a-fA-F-]+)"' -r '$1' "$EVENTS") \
  && command codex exec resume "$SESSION_ID" \
  --model gpt-5.6-sol \
  -c model_reasoning_effort="$EFFORT" \
  --dangerously-bypass-approvals-and-sandbox \
  -o "$OUT" \
  - < "$PROMPT_FILE" 2>/dev/null)
```

`codex exec resume` does not accept `--sandbox`, so a follow-up cannot re-apply
`--sandbox read-only`; it runs write-enabled like the worker form above. Delete
each prompt file after its invocation completes, and preserve the `-o` result
file and the `EVENTS` file until their evidence is recorded.

When the main skill's event loop permits a health check or recovery, match the
assignment's own process by its unique `OUT` path:

```bash
pgrep -fl -- "$OUT" || true
```

Interrupt only the process created for that assignment and preserve its result
file and useful evidence. Resume it while its context remains trustworthy;
replace it with a fresh run and a compact handoff when it cannot resume.
