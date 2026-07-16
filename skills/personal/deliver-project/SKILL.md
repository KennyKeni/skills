---
name: deliver-project
description: Deliver explicitly invoked software projects through a validation-first, compaction-resilient workflow with durable state, bounded scout, worker, and validator delegation, issue and PR boundaries, and evidence-based completion. Use only when the user explicitly invokes $deliver-project or asks to deliver a project with this workflow.
---

# Deliver Project

Apply this workflow only when explicitly invoked. Treat invocation text as the
project goal, scope, constraints, and initial context.

Own delivery of the outcome. Optimize for accepted code quality per unit of
coordination, not agent activity, branch count, issue count, or apparent
progress.

Follow repository instructions, project decisions, ownership boundaries, and
the authorized issue and Git workflow.

## Choose the Execution Mode

Use direct execution for one bounded change with a known implementation
surface. Keep the lead responsible for implementation and validation, and do
not create agents whose handoff cost exceeds their value.

For direct execution, inspect the authoritative artifacts needed for the
change, define a compact acceptance contract, implement, run focused
validation, and read [validation.md](references/validation.md) before declaring
the change complete. If direct work escalates to mission execution, read
[mission-setup.md](references/mission-setup.md) before decomposition or
delegation.

Use mission execution for work spanning multiple substantial features, PRs,
completion stages, or broad discovery surfaces.

Start directly when uncertain. Escalate only after concrete independent work
emerges.

Default the validation profile to `quality-first`. Use `balanced` only when the
invocation explicitly selects it, and retain that selection through the run.

## Mission Loop

For mission execution:

1. Establish authoritative state and durable continuity.
2. Define correctness before decomposing implementation.
3. Shape bounded vertical features and dependencies.
4. Delegate broad exploration when it has concrete value.
5. Execute sequentially or in bounded parallel.
6. Validate coherent PR and milestone boundaries.
7. Update durable state and report evidence-backed progress.

Do not start a blocked, deferred, gated, or unapproved work item. Continue
independent authorized work when safe.

Treat the current agent as the lead and never delegate the lead role. Keep
delegation centralized through the lead. Prohibit nested delegation and
peer-to-peer agent coordination. Use the active-agent capacity exposed by the
runtime; do not add per-milestone or per-mission session budgets. Reuse a scout
or worker while its context remains relevant.

## Load Phase Instructions

Use progressive disclosure. Do not load every reference at session start.

- When mission execution is selected, read
  [mission-setup.md](references/mission-setup.md) before defining the
  validation contract or decomposing work.
- When direct execution needs a continuation checkpoint, read the `Maintain
  Durable State` section of
  [mission-setup.md](references/mission-setup.md) before creating or updating
  that checkpoint.
- When an authorized mission uses a GitHub umbrella issue and native issue
  relationships, read
  [github-mission-graph.md](references/github-mission-graph.md) before shaping
  or mutating that topology or dispatching dependent work.
- When completion requires exhaustive repository coverage, read
  [exhaustive-sweeps.md](references/exhaustive-sweeps.md) before defining the
  discovery plan or assigning scouts.
- When first considering whether to use a scout, worker, or validator in the
  current context, read [delegation.md](references/delegation.md) before
  deciding or assigning. Retain and reuse those rules for later assignments;
  do not reread the file for every spawn.
- Before the first decision about whether a coherent change needs independent
  validation, read exactly one profile reference: read
  [validation-quality-first.md](references/validation-quality-first.md) for
  `quality-first`, or read
  [validation-balanced.md](references/validation-balanced.md) for `balanced`.
  Do not read the inactive profile unless the user changes the selection.
- When a PR or milestone becomes ready for validation, or before declaring
  completion, read [validation.md](references/validation.md). Retain and reuse
  it through the current validation cycle.
- Also read [validation.md](references/validation.md) before a hard-to-reverse
  architecture, API, schema, security, or migration decision; before repeating
  a first vertical slice broadly; when implementation uncertainty is material;
  or when integration assumptions materially change.

After compaction, reload only the reference required for the recorded next
action. Do not reload a reference merely because another agent is spawned.

## Preserve Continuity Across Compaction

After compaction or resumption:

1. Read the sole canonical durable state artifact when one exists. For direct
   execution without a continuation checkpoint, rederive the compact
   acceptance contract from the user request and authoritative project
   artifacts, then inspect the current diff and latest validation evidence.
2. Verify the active Git reference and, when applicable, issue, PR, and CI state.
3. When tracker relationships define mission topology, refresh authoritative
   membership and dependency edges and rederive readiness before dispatch.
4. Inspect only the primary artifacts required for the next action.
5. Reuse still-valid scout evidence and feature contracts.
6. Refresh stale facts before acting.

If direct execution is likely to cross another continuation boundary, create a
lightweight checkpoint using the same artifact-selection, identity, required
field, lifecycle, and cleanup rules as mission state in
[mission-setup.md](references/mission-setup.md). If direct work later escalates
to mission execution, upgrade that same checkpoint in place; do not create a
second durable state artifact.

Do not re-explore the entire repository merely because compaction occurred.
Do not delegate solely to avoid compaction.

If repeated continuation cycles reconstruct context without producing a
verified artifact, checkpoint state and split the run at the next semantic
stage or PR boundary.

## Manage Git and External State Safely

Follow the repository's branch, worktree, commit, PR, merge, and issue
workflow. Keep authorized issues, PR descriptions, validation evidence, and
handoff notes current.

Record the authorized delivery boundary in the contract. Treat commit, push,
PR creation, merge, and issue mutations as separate actions requiring explicit
user authorization or an already-authorized project workflow. Do not infer
them from a general instruction to deliver.

Do not delete or clean pre-existing branches, worktrees, files, or artifacts
without confirmation. Clean only temporary resources created by this
execution after verifying they are no longer needed.

Do not merge until required CI, review, deployment, ownership, and human gates
have passed.
