# Delegation

Read this file before the first agent assignment in the current context. Reuse
it for later assignments instead of rereading it for every spawn.

## Separate Workflow Policy From Agent Control

Keep Deliver Project responsible for whether delegation is justified, the
project contract, validation cadence, review boundaries, finding disposition,
completion criteria, and delivery state. Do not use this workflow as an agent
transport or supervision protocol.

Before the first assignment, read the routing skill matching the user-facing
lead:

- Codex: [Codex Subagent Routing](../../codex-subagent-routing/SKILL.md)
- Claude: [Claude Subagent Routing](../../claude-subagent-routing/SKILL.md)

Use that routing skill as the exclusive source for lane eligibility and route
resolution, invocation, wait and stream handling, steering, formal-return
classification, review-cycle serialization, session reuse, and recovery. When
an active Sidekick setup supplies a persistent worker or default validator
route, pass that configuration into routing without replacing its lifecycle
protocol.

If the matching routing skill or a required lane is unavailable, keep the work
in the lead or report the limitation. Do not improvise a second delegation
protocol inside Deliver Project.

## Contents

- Apply mission role semantics
- Add project context to assignment packets
- Choose valuable assignments
- Execute features

## Apply Mission Role Semantics

Use the routing protocol's `lead`, `scout`, `worker`, and `validator` roles.
Treat them as hard boundaries for an assignment, not required participants in
every run. Treat implementation, review, and testing as activities rather than
additional roles.

Have the lead own requirements, contracts, decomposition, architecture,
validation policy, integration, durable state, and final completion judgment.
Allow direct implementation when delegation costs more than it adds.

Have a scout perform bounded, read-only retrieval. Do not let a scout modify
files, create external state, choose architecture, approve scope, or create
agents.

Give each worker one bounded feature or PR. Have it implement, test,
self-review, and return evidence. Do not let it declare mission or stage
completion or create agents.

Give each validator fresh context and a completed, coherent change. Have it
report findings without implementing fixes or creating agents.

Keep all assignment decisions and result disposition centralized through the
lead. Let the routing protocol control the selected lane.

## Add Project Context To Assignment Packets

Build the routing protocol's assignment packet before every new scout, worker,
or validator. Add the project-specific context below instead of duplicating the
mission history or asking the subagent to discover its assignment from durable
state.

Include:

- active stage, feature, issue, PR, and Git reference when relevant;
- authoritative project sources and repository instructions to inspect;
- relevant contract assertions, decisions, and ownership constraints;
- allowed mutations, tools, external actions, and workspace boundary;
- required checks and evidence;
- authorized delivery boundary; and
- durable-state facts needed to resume the bounded assignment.

Pass applicable rules in the packet rather than entire orchestration template
references, raw scout transcripts, or durable-state history. Point to primary
project artifacts instead. For a focused follow-up, send only changed packet
fields, new evidence, and the unresolved deliverable.

## Choose Valuable Assignments

Use the routing skill's readiness, role, cost, and concurrency rules. Within
those bounds, choose assignments only when their evidence or execution value
exceeds handoff and review cost. Keep interpretation inseparable from project
judgment in the lead.

Apply the active validation profile to decide which coherent boundaries require
independent validation. Pass that decision and its project-specific contract to
routing; do not select validator sessions or supervise their lifecycle here.

## Execute Features

Give routing the feature contract, validation assertions, verified evidence,
primary-source pointers, relevant repository instructions, and workspace
boundary for each ready worker assignment.

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
