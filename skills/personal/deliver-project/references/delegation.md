# Delegation

Read this file before the first agent assignment in the current context. Reuse
it for later assignments instead of rereading it for every spawn.

## Contents

- Separate roles
- Build assignment packets
- Delegate exploration deliberately
- Control cost
- Execute features

## Separate Roles

Use `lead`, `scout`, `worker`, and `validator` as the only canonical delegation
roles. Treat them as hard boundaries for an assignment, not required
participants in every run. Do not introduce role aliases such as
implementation agent, reviewer, test author, integration agent, orchestrator,
or coordinator. Treat implementation, review, and testing as activities. Treat
implementation owner as a responsibility that belongs to the lead in direct
execution or normally to a worker in mission execution.

Have the lead own requirements, contracts, decomposition, architecture,
assignment, cost control, integration, durable state, and final completion
judgment. Allow direct implementation when delegation costs more than it adds.

Have a scout perform bounded, read-only retrieval. Do not let a scout modify
files, create external state, choose architecture, approve scope, or create
agents.

Give each worker one bounded feature or PR. Have it implement, test,
self-review, and return evidence. Do not let it declare mission or stage
completion or create agents.

Give each validator fresh context and a completed, coherent change. Have it
report findings without implementing fixes or creating agents.

Keep all delegation centralized through the lead.

## Build Assignment Packets

Before every new scout, worker, or validator, build a concise assignment packet
and include it directly in the spawn request. Do not rely on the subagent to
infer mission state from conversation history or discover its assignment from
the durable state artifact.

Include:

- role and one-sentence objective;
- bounded deliverable, scope, and non-scope;
- active stage, feature, issue, PR, and Git reference when relevant;
- authoritative project sources and repository instructions to inspect;
- relevant contract assertions, decisions, and ownership constraints;
- allowed mutations, tools, external actions, and workspace boundary;
- required checks and evidence;
- output format;
- stop condition and escalation triggers.

Add role-specific material:

- **Scout:** blocking questions, read-only boundary, and the required
  observation-versus-inference evidence format.
- **Worker:** feature contract, implementation ownership, validation
  assertions, primary-source pointers, and required tests.
- **Validator:** full-review or delta scope, coherent change, contract,
  relevant doctrine sources, existing validation evidence, and the finding
  admissibility and disposition rubric. Exclude intended findings and the
  implementation trajectory.

Pass applicable rules in the packet rather than entire orchestration template
references, raw scout transcripts, or durable-state history. Point to primary
project artifacts instead. For a focused follow-up, send only changed packet
fields, new evidence, and the unresolved deliverable.

## Delegate Exploration Deliberately

State the questions blocking implementation before exploring.

Use a scout when exploration spans unfamiliar subsystems, requires substantial
retrieval, would pollute the lead context, produces checkable evidence, or will
be reused.

Explore directly when relevant files are known, the task is small, or
interpretation cannot be separated from architectural judgment.

When model routing is available, use the least expensive model that can
reliably follow the evidence format. Do not use a cheap model as the sole
source of architectural, security, migration, concurrency, or public-interface
decisions.

Use one scout for the active milestone and send focused follow-ups. Replace it
only when its context is stale or its surface materially changes.

Require the scout to return:

- observed facts with file, symbol, line, command, log, or source references;
- relevant patterns, validation commands, and integration paths;
- inferences separated from observations;
- contradictions and unresolved questions;
- a recommended change surface labeled as a recommendation.

Treat scout output as an evidence index. Verify claims that materially
determine scope, architecture, ownership, security, migrations, or public
behavior.

Convert verified findings into a feature contract. Pass the contract and
primary-source pointers to the worker, not the raw scout transcript.

## Control Cost

Use the active-agent capacity exposed by the runtime. Do not maintain
per-milestone or per-mission session counters, and do not require approval
solely because a cumulative number of agents has been created.

Assign one implementation owner per feature or PR. Apply the active validation
profile to decide which coherent boundaries require a validator. Use one
validator for each required boundary and add a second only for high-risk work
that needs materially distinct proof. Prohibit nesting and peer-to-peer
coordination.

Never run concurrent mutating workers in the same workspace. Require isolated
worktrees or workspaces for them; otherwise serialize their assignments.

Do not spawn an agent to decide whether to spawn agents. Do not run competing
implementations or pass-at-k sampling unless the decision is unusually
consequential and the cost is authorized.

Before assignment, build and pass the assignment packet above. Reuse an
existing scout or worker when its context remains relevant.

Use a new validator for each boundary that the active profile requires. Reuse
that validator only for delta revalidation in the same review cycle. Define
fresh validator context as independent of implementation and limited to the
coherent change, contract, relevant primary sources, and validation evidence
rather than the implementation trajectory.

## Execute Features

Give a worker the feature contract, validation assertions, verified evidence,
primary-source pointers, relevant repository instructions, workspace boundary,
and return format.

Require it to inspect primary artifacts before editing.

Use a branch or worktree only when the workflow supports it and independence
justifies isolation. Follow the repository's target branch and conventions.

Require focused validation. Use test-first development when behavior can be
specified independently and repository practices support it. Do not impose it
mechanically on every edit.

Require the worker to return changes or a commit reference, commands run,
results, contract deviations, unresolved risks, and integration notes.

Have the lead integrate worker output. Do not create a separate integration
agent by default.
