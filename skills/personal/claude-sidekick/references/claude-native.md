# Native Opus Setup

Use the current Claude session as the main agent and one persistent native
Claude subagent as the sidekick.

## Verify

Use `claude-opus-4-8` for the persistent sidekick. Retain the
current main agent's model and reasoning effort. If the model or the native
subagent control is unavailable, keep the work in the main agent and report
the limitation.

## Start

Spawn one background subagent with the native subagent control, passing the
sidekick model explicitly and a compact assignment packet. The subagent does
not inherit the lead conversation, so supply the contract, repository scope,
constraints, required proof, and return shape in the assignment. The
assignment must state that the sidekick owns the named write scope, shares the
worktree with other work, preserves changes outside its ownership, and creates
no agents.

Record the returned task or agent identifier as `SIDEKICK_TARGET` immediately
after spawning so the main agent can continue independent judgment work while
the sidekick executes.

## Observe And Steer

Observe through the harness's completion and message notifications. Treat a
wait that returns without an event as a quiet observation tick, not as a
timeout, failure, or completed work boundary. A sidekick on a strong reasoning
model may remain silent while it reads files, runs commands, or reasons.
Silence alone must never create a deadline, justify a stop-and-return message,
make the context untrustworthy, or trigger interruption or replacement.

Do not probe a running sidekick to check on it. The task list does not surface
a background subagent, and reading its output or task record injects the
subagent's full transcript into the main agent, flooding context for no signal.
A running subagent has no cheap liveness probe, so keep waiting for its
completion notification. Reserve quiet-episode action for interruption, and only
after an observation-channel error, an explicit configured deadline, or
independent evidence that execution is frozen — never routine inspection.

Send a follow-up message to the recorded target only to answer a sidekick
question or communicate new information that materially invalidates the active
assignment. Do not use it for progress inquiries or incremental review. Do not
issue a second assignment while the sidekick is still running, and do not spawn
a second subagent for a focused question.

## Continue

After a final return, send the next execution unit to the same recorded target
so its cached context continues; do not spawn a fresh subagent for each phase.
Retain the same sidekick through exploration, implementation, testing, and
correction, routing responsibility back to the main agent at the judgment
boundaries in the main skill.

## Stop And Recover

Interrupt the recorded target only when active work must stop before it can
return normally or concrete evidence makes the context no longer trustworthy.
Elapsed silence and repeated empty waits are not valid triggers. Preserve
useful evidence before reassigning work.

If the sidekick cannot resume and a replacement is worthwhile, spawn one new
subagent with the same model and a compact handoff of accepted facts, current
repository state, remaining execution scope, and proof still needed. Record
the new target and disclose that the cached sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
