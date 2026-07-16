---
name: claude-subagent-routing
description: Route bounded scout, worker, and validator assignments from a Claude Code lead through Codex Sol, Codex Efficient, OpenCode/Grok, Cursor/Grok, or OpenCode/Ollama execution lanes. Use when the user invokes $claude-subagent-routing, asks Claude to use Codex subagents, requests one of these Claude-led delegation policies, or combines lane selection with a goal or mission prompt.
---

# Claude Subagent Routing

Use this skill only from the user-facing, goal-owning Claude Code session. Keep
the current Claude session as the lead and final judge. Treat each `codex exec`
session as a bounded execution lane, not as another lead.

## Select The Policy

Treat an explicit provider or model request as policy selection, subject to
that policy's role and risk eligibility. Treat an explicit OpenCode or Cursor
request as execution-harness selection within a compatible Grok policy.
Without a provider or policy request, use Codex Sol. Use an external lane only
when the user requests it or the active mission has a recorded preference for
it.

Select a lane independently for each assignment. Before the first assignment
to a lane in the current context, read its reference completely:

- Codex Sol invoked from Claude: read
  [codex-quality.md](references/codex-quality.md);
- mixed cost-aware routing: read
  [codex-grok-hybrid.md](references/codex-grok-hybrid.md), then read the Codex
  or selected Grok harness reference only when that policy selects it;
- xAI through OpenCode: read
  [opencode-grok.md](references/opencode-grok.md);
- Grok 4.5 through Cursor: read
  [cursor-grok.md](references/cursor-grok.md);
- Ollama Cloud through OpenCode: read
  [opencode-ollama.md](references/opencode-ollama.md).

Retain loaded references for later assignments; do not reread them for every
run. After compaction, reload only the reference required for the recorded next
assignment.

If a selected lane is unavailable, use another lane only when the user or
active mission authorizes fallback. Otherwise keep the work in the Claude lead
or report the limitation. When an assignment is ineligible for an explicitly
requested external policy, stop and report the mismatch; do not silently
override the provider request.

## Preserve The Role Model

Use only `lead`, `scout`, `worker`, and `validator` as software-work roles.
Treat implementation, testing, review, and integration as activities owned by
these roles.

Keep requirements, contracts, decomposition, architecture, assignment, cost
control, integration, durable state, and final completion judgment with the
Claude lead. Keep delegation one layer deep and return every Codex result to
the lead.

Include an explicit no-delegation boundary in every assignment: remain within
the assigned role and do not create agents or delegate work.

When a goal or mission workflow is active, let it decide whether delegation is
justified and let it own available concurrency, validation cadence, and
completion criteria. Pass compact assignments rather than the full goal
template, mission history, adapter, or lane reference.

## Route Deliberately

Use a scout for substantial, objectively checkable retrieval that would
pollute the lead context or produce reusable evidence. Explore directly when
the relevant files are known, the task is small, or interpretation cannot be
separated from architectural judgment.

Use a worker for one bounded implementation lane after the lead resolves the
contract and material design decisions. Default to one active writable worker
in a workspace. Run parallel assignments only when their repositories or
write scopes are independent and the active goal workflow permits it. Use one
implementation owner per feature or PR rather than competing solutions.

Use a fresh Codex validator after a coherent non-trivial PR or milestone passes
focused gates, unless the active goal workflow requires another cadence. Treat
worker self-checks as evidence, not independent review.

## Assign The Scout

State the questions blocking the next contract or implementation decision.
Give the scout the exact scope, primary sources, read-only and no-delegation
boundaries, required evidence, and stop condition.

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
acceptance assertions, verified evidence, constraints and non-goals,
applicable repository instructions, required proof, delivery boundary, stop
conditions, and return shape.

Let the worker own implementation and tightly coupled tests. Require it to
stop before changing the contract, architecture, public API, schema, migration
behavior, or authorized scope. Require files changed, assertions addressed,
commands actually run, observed results, unrun checks, deviations, and risks.
Require it to remain in its assigned role and create no agents.

Keep test intent and independent verification with the lead. Use a separate
test-scoped worker only for high-risk behavior, a difficult regression
reproducer, or an explicit requirement of the active goal workflow; keep its
work within the same feature or PR scope.

## Validate At Coherent Boundaries

Start every formal validator in a fresh `codex exec` session. Pass only a
compact validation packet containing the contract, coherent change, relevant
primary sources, validation evidence, findings-only return shape, and
no-delegation boundary. Do not resume a worker session for validation.

Have the lead inspect every handoff, complete diff, repository state, focused
tests, and exact proof output. Have validators return findings without
implementing fixes. Have the lead verify and disposition findings, assign
accepted fixes to a worker, and reuse the same validator session only for delta
revalidation in the current review cycle.

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
that it is an admissible, in-scope blocker introduced or exposed by the
original change or its fix delta.

Close the review cycle when no unresolved admissible blockers remain.
Non-blocking findings require only a recorded disposition. Permit at most two
worker-to-validator delta rounds by default. A further round requires an
explicit lead decision naming the unresolved blocker and why another
independent review is necessary. Otherwise have the lead resolve, re-scope,
waive through the authorized owner, or escalate the remaining issue.

## Invoke And Continue Codex

Follow the selected reference for model pinning, prompt construction,
invocation, continuation, output collection, and cleanup. Include the canonical
role and selected policy in every assignment. Give each independent run a
unique output file and record enough context to resume the correct session.

Resume the most recent Codex scout or worker only for bounded corrections while
its scope, contract, approach, evidence, and tier remain current. Run the
resume command from the assignment's repository. Start every formal validator
as a fresh session.

For Codex Efficient, apply its evidence-based promotion before this default
round bound. Treat the handoff from a routine Grok assignment to Codex
Sol-high as a lane escalation rather than a follow-up round, then apply the
bound to the active Sol-high assignment.

## Clean Up Interrupted Runs

Do not kill a quiet Codex run before 30 minutes merely because it has produced
no visible output. For a genuinely hung or interrupted run, identify and stop
only the process created for that assignment. Preserve its result file and
last useful evidence before replacing or closing it.
