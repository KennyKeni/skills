---
name: claude-sidekick
description: Run a Fusion-style coding session with the current Claude session as the high-judgment main agent and a persistent lower-cost sidekick as a parallel executor. Use when the user invokes $claude-sidekick or explicitly requests a Sidekick pairing for coding, refactoring, testing, or repository work and wants frontier judgment retained while execution-heavy work is delegated.
---

# Claude Sidekick

Run two fully capable agents with separate, persistent contexts. Keep the
current user-facing session as the main agent. Use its intelligence sparingly
for planning, ambiguity, consequential decisions, and final review. Delegate
and monitor by default so the sidekick absorbs execution cost without replacing
main-agent judgment.

## Load One Setup Adapter

Read [setups.md](references/setups.md), select an explicitly requested setup or
its declared default, then read that adapter completely. Treat the adapter as
the source of truth for model, start, observe, continue, stop, and recovery
operations. Report an unavailable requested setup instead of silently changing
models or harnesses.

## Defer To Active Orchestration

When a goal, mission, or other orchestration workflow is active, let it decide
whether and when delegation is justified. Let that workflow own contracts,
decomposition, concurrency, validation cadence, durable state, and completion
criteria. Apply Sidekick only as the execution policy for bounded assignments
the workflow authorizes; do not start the pair when it selects direct execution
without delegation.

Pass a compact assignment rather than the full orchestration template or
mission history. Reuse the persistent sidekick only while the workflow permits
and its context remains relevant. Never use the retained sidekick as a required
fresh validator; create an independent validator when the active workflow
requires one.

## Start Both Contexts Early

When delegation is authorized, start the sidekick near the beginning of the
task with the largest immediately useful assignment. Do not use it as a
one-shot question tool. Keep its task, chat, or session identifier and continue
the same context across exploration, implementation, testing, and repair.

Give the sidekick a compact packet containing the user outcome, repository
scope, resolved contract, constraints, writable ownership, required proof, and
the decisions it must return to the main agent. Reconstruct only the context it
needs; let it inspect the repository and build its own cached context.

## Route At The Judgment Boundary

Route by what the work delivers, not by apparent difficulty.

| Work unit | Owner |
| --- | --- |
| Bounded exploration with an evidence-shaped answer | Sidekick |
| Mechanical or patterned implementation with resolved intent | Sidekick |
| Slow tests, lint repair, broad cleanup, or repetitive edits | Sidekick |
| Hard implementation that mostly reuses an established or upstream design | Sidekick |
| Planning, ambiguous requirements, architecture, product or UX intent | Main |
| Security, migration, public-contract, or irreversible decisions | Main |
| Final interpretation of failures and acceptance of the result | Main |

For calibration: write a small judgment-bearing diff in the main agent and
hand the expensive test suite to the sidekick; hand a broad mechanical removal
to the sidekick; keep a subtle cross-team UI decision in the main agent; hand a
hard integration to the sidekick when the design is already settled upstream.

## Work In Parallel

While the sidekick executes, keep main-agent actions minimal. Read only what is
necessary to decide intent, resolve ambiguity, or review risk. Perform
independent planning or judgment work when useful; otherwise observe through
the adapter. Do not duplicate the sidekick's exploration or edit its active
write scope.

Supervise patiently. Silence alone is not failure, a deadline, lost context, or
permission to interrupt or replace the sidekick. Configure deadlines
prospectively through the user, workflow, assignment contract, or runner. Let
the selected adapter own observation, liveness checks, and recovery mechanics;
keep the user informed during quiet periods without contacting the sidekick.

Use a normal return and the adapter's continuation operation for planned phase
transitions. Reserve interruption for active work that must stop before it can
return normally.

At each question, evidence update, or return, choose one move:

- continue the same assignment when the contract still holds;
- answer a bounded question and let the sidekick proceed;
- reclaim the work when judgment, ambiguity, or consequential risk becomes the
  deliverable;
- resolve that decision in the main agent, then return the resulting mechanical
  work to the same sidekick context; or
- stop and recover the session through the adapter when its context or process
  is no longer trustworthy.

If the persistent session cannot recover, keep the work in the main agent or
start one replacement with the same requested setup and a compact handoff when
the remaining execution savings justify rebuilding context. Never hide the
loss of context or silently substitute another model.

## Review With The Main Agent

Keep the retained sidekick available through acceptance review. Treat each
review finding as a new work unit and route it through the same judgment
boundary as the original work. The agent that discovers or specifies a
correction does not automatically own its execution.

Require the sidekick to return changed files, proof run, observed results,
unrun checks, deviations, and risks. Inspect the complete diff and repository
state in the main agent. Make judgment-heavy corrections directly; send
bounded execution corrections back to the retained sidekick context.

Finish only after the sidekick has returned or stopped, the main agent accepts
the result against the user's intent, and the final response reports the actual
verification performed.
