---
name: claude-subagent-routing
description: Route bounded scout, worker, and validator assignments from a Claude lead through native Claude, Codex Sol, Codex Efficient, Cursor/Grok, OpenCode/Grok, OpenCode/Qwen3.8 Max Preview, or OpenCode/Ollama execution lanes. Use when the user invokes $claude-subagent-routing, requests one of these Claude-led delegation policies, or combines lane selection with the goal prompt template.
---

# Claude Subagent Routing

Use this skill only from the user-facing, goal-owning Claude session. Treat each
delegated session as a bounded execution lane. Keep the current session as the
lead and final judge.

## Select The Execution Lane

Treat an explicit provider, harness, or model request as lane-policy selection,
subject to that policy's role and risk eligibility. Without one, use the default
lane, native Claude. Use an external lane only when the
user requests it or the active mission has a recorded preference for it.

Select a lane independently for each assignment. Before the first assignment
to a lane in the current context, read its reference completely:

- native Claude subagents: read [claude-native.md](references/claude-native.md);
- Codex Sol: read [codex-sol.md](references/codex-sol.md);
- Codex Efficient: read [codex-efficient.md](references/codex-efficient.md);
- Grok through Cursor: read [cursor-grok.md](references/cursor-grok.md);
- xAI through OpenCode: read [opencode-grok.md](references/opencode-grok.md);
- Qwen3.8 Max Preview through OpenCode: read [opencode-qwen.md](references/opencode-qwen.md);
- Ollama Cloud through OpenCode: read [opencode-ollama.md](references/opencode-ollama.md).

Retain a loaded lane reference for later assignments; do not reread it for
every spawn. Load another reference only when a later assignment selects that
lane. After compaction, reload only the reference required for the recorded
next assignment.

If a selected lane is unavailable, use another lane only when the user or
active mission authorizes fallback. Otherwise keep the work in the lead or
report the limitation.

When an assignment is ineligible for an explicitly requested external policy,
stop and report the mismatch. Use a different configured executor only after
the user or active mission authorizes that route; do not silently override the
provider request.

## Preserve The Role Model

Use only `lead`, `scout`, `worker`, and `validator` as software-work roles.
Treat implementation, testing, review, and integration as activities owned by
these roles.

Keep requirements, contracts, decomposition, architecture, assignment, cost
control, integration, durable state, and final completion judgment with the
lead. Keep delegation one layer deep and return every subagent result to the
lead.

Include an explicit no-delegation boundary in every assignment: remain within
the assigned role and do not create agents or delegate work.

When a goal or mission workflow is active, let it decide whether delegation is
justified and let it own available concurrency, validation cadence, and
completion criteria. Pass compact assignments rather than the full goal
template, mission history, adapter, or lane reference.

Follow the global subagent context-forking policy.

## Route Deliberately

Shape before classifying. Use the smallest coherent assignment whose
operational envelope preserves affected consumers, deployment dependencies,
integration obligations, cumulative behavior, rollback constraints, and proof
obligations.

Every handoff charges the lead a packet write and a return review, so do not
split work below that overhead. Batch related bounded assignments with shared
ownership and scope into one round rather than one spawn each.

Gate worker readiness before routing. Mark a candidate `ready` only when its
behavior, contract, bounded scope, material design, acceptance assertions, and
credible proof plan are resolved. Otherwise mark it `not_ready` and keep it
with the lead for shaping or issue a bounded scout. Only a `ready` candidate
receives a lane, model, and `routine` or `consequential` routing class.

Use a scout for substantial, objectively checkable retrieval that would
pollute the lead context or produce reusable evidence. Explore directly when
the relevant files are known, the task is small, or interpretation cannot be
separated from architectural judgment.

Route ordinary repository mapping and implementation reconnaissance through
the selected lane, including bounded evidence gathering that the lead will use
for an important architecture, security, migration, schema, concurrency, or
public-interface decision. Route a scout consequentially only when the
investigation itself requires material contradiction reconciliation, nonlocal
causal synthesis across behaviorally coupled boundaries, or irreducible
cross-repository trust, production-data, or distributed-state analysis.

Use a worker for one bounded implementation lane after the lead resolves the
contract and material design decisions. Do not classify by proximity to
security, migrations, concurrency, data integrity, schemas, or public
interfaces. Classify the semantic change, operational coupling, reversibility,
blast radius, and available proof through the selected lane.

When a classified lane is selected, classify each scout and each `ready` worker as
`routine` or `consequential` using that complete lane reference. Treat the
classification as a routing attribute, not another role. Keep other lane
mappings unchanged when those policies are selected directly.

Default to one active writable worker in a workspace. Use parallel workers
only for independent write scopes permitted by the active goal workflow. Use
one implementation owner per feature or PR rather than competing solutions.

## Assign The Scout

State the questions blocking the next contract or implementation decision.
Give the scout the exact scope, primary sources, read-only and no-delegation
boundaries, required evidence, and stop condition.

When retrieval needs a budget, enumerate the maximum sources, files, queries,
or evidence branches to inspect. Lane eligibility and escalation triggers are
hard stops. A routine scout that exhausts its budget or finds a material
contradiction returns its evidence to the lead, whose reassessment selects the
next routing class.

Require observed facts with file, symbol, line, command, log, or source
references; relevant patterns and validation commands; inferences separated
from observations; contradictions and missing evidence; and a recommended
change surface labeled as a recommendation.

Treat the result as an evidence index. Have the lead verify claims that
materially determine scope, architecture, ownership, security, migrations, or
public behavior. Pass workers curated contracts and primary-source pointers,
not raw scout transcripts.

## Assign The Worker

Give the worker the bounded goal and repository scope, allowed change surface,
acceptance assertions, verified evidence, constraints and non-goals, applicable
repository instructions, required proof, delivery boundary, stop conditions,
and return shape.

When implementation needs a budget, enumerate the maximum materially different
approaches and required acceptance checks. Use a classified lane's unsuccessful-
approach and failed-proof boundaries as stops for lead reassessment.

Let the worker own implementation and tightly coupled tests. Require it to
stop before changing the contract, architecture, public API, schema, migration
behavior, or authorized scope. Require files changed, assertions addressed,
commands actually run, observed results, unrun checks, deviations, and risks.
Require it to keep the work in its own session and create no agents.

Keep test intent and independent verification with the lead. Use a separate
test-scoped worker only for high-risk behavior, a difficult regression
reproducer, or an explicit requirement of the active goal workflow; keep its
work within the same feature or PR scope.

## Validate At Coherent Boundaries

Use the selected lane's validator procedure and its configured validator route
when it declares classified routing. Treat implementation-executor self-checks
as worker evidence, not independent review.

Start each initial formal validation pass in a fresh delegated session that
excludes implementation history, following the validator route's fresh
requirement. Pass only its compact validation packet, including the
no-delegation boundary. If fresh context cannot be established, report that
independent validation is unavailable rather than claiming it.

Have the lead inspect every handoff, complete diff, repository state, focused
tests, and exact proof output. Follow the active goal workflow's validator
requirements and review checkpoints. Without one, use one fresh validator
after a coherent non-trivial PR or milestone passes focused gates.

Have validators return findings without implementing fixes. Have the lead
verify and disposition findings, assign accepted fixes to a worker, and reuse
the same validator session only for delta revalidation in the current review
cycle.

### Converge The Review Cycle

Require the validator to return all material blocker candidates within the
assigned scope in one pass rather than stopping after the first finding.

Have the lead disposition every finding before assigning fixes. Batch accepted
blockers into one worker round when their ownership and scope permit it. A
validator finding does not automatically trigger implementation.

Treat one worker fix handoff followed by delta revalidation as one focused
follow-up round. Revalidate only the fix delta, affected acceptance assertions,
and observable fallout directly caused by the fix. A finding discovered during
delta revalidation may trigger another worker round only when the lead verifies
that it is an admissible, in-scope blocker introduced or exposed by the original
change or its fix delta.

Close the review cycle when no unresolved admissible blockers remain. Completion
does not require zero findings or zero optional improvements; non-blocking
findings require only a recorded disposition.

Permit at most two worker-to-validator delta rounds by default. A further round
requires an explicit lead decision naming the unresolved blocker, explaining
why it cannot be resolved or dispositioned in the lead, and explaining why
another independent review is necessary. Otherwise stop alternating agents and
have the lead resolve, re-scope, waive through the authorized owner, or escalate
the remaining issue.

## Supervise Running Assignments

Supervise each assignment as an event loop. Observe through the selected lane's
mailbox or event stream, classify each event, take the corresponding action,
then return to observation. Passive waits and stream reads are observation and
leave the assignment untouched.

| Event | Lead action |
| --- | --- |
| A wait or stream read returns without a runner event | Treat it as a quiet tick and observe again. |
| A scout or worker requests input or reports a blocker | Send one focused response within the existing contract. |
| New evidence invalidates the contract, authorized scope, or lane eligibility | Steer or stop the affected scout or worker at that boundary. |
| A validator emits an intermediate message | Continue observing so it can return one complete findings or blocker report. |
| The assignment returns | Apply the role-specific continuation rule below. |
| The harness reports an error or configured deadline, loses the recorded session or process, or supplies lane-specific evidence of frozen execution | Recover a scout or worker under the selected lane; replace an interrupted initial validator with a corrected fresh pass; recover a validator session only when it is already performing bounded delta revalidation. |
| The assignment continues beyond an explicit contract, scope, search, attempt, or proof boundary | Stop that assignment and preserve its useful evidence. |
| A user update is due | Update the user without contacting the assignment. |

A quiet episode begins when invocation succeeds or after the latest runner
event, and ends at the next runner event or final return. When the selected lane
says that silence is abnormal, perform its non-invasive health check once for
that quiet episode. A result showing only liveness is not a runner event and
does not begin a new quiet episode. A live runner returns the lead to
observation. Another health check requires a new quiet episode, a runner or
observation-channel error, or a configured deadline. Silence alone is not
evidence of frozen execution.

After a final return:

- resume a scout only for a bounded clarification or evidence gap while its
  question, scope, and evidence remain current;
- resume a worker only for a bounded correction while its contract, scope,
  approach, evidence, and lane eligibility remain current;
- let an initial validator return without steering, disposition every finding,
  then reuse that session only for bounded delta revalidation in the same
  review cycle. When an invalid validation packet prevents review, correct the
  packet and start a fresh validation pass.

Schedule lead work by dependency. When the next lead decision depends on the
assignment, wait for its return. Continue work whose result is independent of
that assignment.

Report meaningful milestones and blockers. During ongoing work, send a brief
status after roughly one minute of user-visible silence; while work remains
active, repeat only at the host-required update interval rather than on every
quiet tick. A user update neither contacts the assignment nor ends its quiet
episode.

Configure any wall-clock deadline prospectively through the user, workflow,
lead, or runner. Deadline expiry is a timeout condition; elapsed silence cannot
create a deadline.

## Invoke And Continue The Lane

Follow the selected reference for model verification, invocation, continuation,
and cleanup. Include the canonical role and selected lane in every assignment.
Record the selected lane's task or session identifier needed to steer, resume,
wait for, or stop the assignment.

For a classified lane, apply its evidence-based promotion before the review-
cycle round bound. Treat the handoff from a routine assignment to its
configured consequential route as a lane escalation rather than a follow-up
round, then apply the bound to the active consequential assignment.

## Enforce And Recover Assignments

When the event loop reaches an assignment-boundary event, stop only the
affected assignment through the selected lane's control and preserve its last
useful evidence.

When the event loop reaches a recovery event, apply its role-aware decision and
follow the selected lane's recovery procedure. Recover or replace only the
session or process created for that assignment and preserve its last useful
evidence before resuming, replacing, or closing it.

If repeated attempts to resume the affected assignment fail, stop retrying it
and start a fresh assignment through the same selected lane with the same role
and model plus a compact handoff of the original assignment and useful
evidence. Record the fresh assignment's identifier.
