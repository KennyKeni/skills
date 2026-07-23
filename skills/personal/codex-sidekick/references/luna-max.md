# Luna Max Setup

Use the current Codex session as the main agent and one persistent native
Codex subagent as the sidekick.

## Verify

- Main model: inherit the current session's model.
- Main reasoning effort: inherit the current session's reasoning effort.
- Sidekick model: `gpt-5.6-luna`.
- Sidekick reasoning effort: `max`.
- Sidekick agent type: `worker`.
- Sidekick task name: `sidekick`.
- Context fork: `none`.

Choose these values explicitly when spawning. If the model or effort is
unavailable, keep the work in the main agent and report that the requested
setup could not be established.

## Start

Invoke `spawn_agent` with this configuration:

```yaml
task_name: sidekick
agent_type: worker
model: gpt-5.6-luna
reasoning_effort: max
fork_turns: none
message: <sidekick assignment packet>
```

Record the returned canonical task name as `SIDEKICK_TARGET`. The assignment
must tell the sidekick it owns the named write scope, shares the worktree with
other work, must preserve changes outside its ownership, and must not create
agents.

## Observe And Steer

Use `wait_agent` for mailbox events and completion with a timeout of at least
60 seconds; use a longer timeout when the expected duration warrants it. A
runner event may wake the wait earlier. Use `send_message` with `target:
SIDEKICK_TARGET` only to answer a sidekick question or communicate new
information that materially invalidates the active assignment. Do not use it
for progress inquiries or incremental review, and do not issue a second
assignment while the sidekick is still running.

Treat a wait that returns without an event as a quiet observation tick, not as
a timeout, failure, or completed work boundary. A max-reasoning sidekick may
remain silent while it reads files, runs commands, or reasons. Continue waiting
when it is still running. Silence alone must never create a deadline, justify a
stop-and-return message, make the context untrustworthy, or trigger interruption
or replacement.

Use `list_agents` at most once during the same uninterrupted quiet episode, and
only after an observation-channel error, an explicit configured deadline, or
independent evidence that execution may be frozen. If it reports the sidekick
as running, return to `wait_agent`; liveness is positive evidence and does not
start a new quiet episode. A later liveness check requires a sidekick event, a
new observation error, or a deadline established before that quiet episode.

Keep the user informed during a long quiet episode without steering or
contacting the sidekick. A user-facing status update is not a sidekick event and
does not justify another health check.

After a final return, use `followup_task` with the same target for the next
execution unit. This reactivates the retained context; do not spawn a fresh
agent for each phase. Use this normal return-and-continue path for planned phase
transitions; do not interrupt an assignment merely to move to its next phase.

Retain the same task, model, and effort for exploration, implementation,
testing, and correction phases. Route responsibility back to the main agent at
the judgment boundaries in the main skill, then return executable work to this
same sidekick when appropriate.

## Stop And Recover

Use `interrupt_agent` with `target: SIDEKICK_TARGET` only when active work must
stop before it can return normally or concrete evidence makes the context no
longer trustworthy. Valid triggers include an explicit user or configured
deadline, a harness error or lost agent, evidence of frozen execution, or work
continuing beyond an explicit contract boundary. Elapsed silence and repeated
empty waits are not valid triggers. Preserve useful evidence before reassigning
work.

If the task cannot resume and a replacement is worthwhile, call `spawn_agent`
once with the same configuration and a compact handoff of accepted facts,
current repository state, remaining execution scope, and proof still needed.
Record the new target and disclose that the cached sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
