# Luna Max Setup

Use the current Codex session as the main agent and one persistent native Codex
subagent as the sidekick.

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

Use `wait_agent` for mailbox events and completion. Use `send_message` with
`target: SIDEKICK_TARGET` only to answer or clarify the active assignment. Do
not issue a second assignment while it is still running.

After a final return, use `followup_task` with the same target for the next
execution unit. This reactivates the retained context; do not spawn a fresh
agent for each phase. Use this normal return-and-continue path for planned phase
transitions; do not interrupt an assignment merely to move to its next phase.

Retain the same task, model, and effort for exploration, implementation,
testing, and correction phases. Route responsibility back to the main agent at
the judgment boundaries in the main skill, then return executable work to this
same sidekick when appropriate.

## Stop And Recover

Use `list_agents` only for a justified liveness check. Use `interrupt_agent`
with `target: SIDEKICK_TARGET` only when active work must stop before it can
return normally or the context is no longer trustworthy. Preserve its useful
evidence before reassigning work.

If the task cannot resume and a replacement is worthwhile, call `spawn_agent`
once with the same configuration and a compact handoff of accepted facts,
current repository state, remaining execution scope, and proof still needed.
Record the new target and disclose that the cached sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
