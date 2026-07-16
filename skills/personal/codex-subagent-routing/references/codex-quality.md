# Native Codex Lane

Use this lane for default Codex delegation and for every architecturally
consequential scout, difficult or high-risk worker, and formal validator.

## Select Model And Effort

Use GPT-5.6 Luna and GPT-5.6 Sol with these defaults:

- routine `scout`: `gpt-5.6-luna` at high effort for bounded read-only
  repository exploration;
- consequential `scout`: `gpt-5.6-sol` at medium effort for consequential
  synthesis, unfamiliar cross-subsystem diagnosis, or evidence affecting
  architecture, security, schemas, migrations, concurrency, or public
  interfaces;
- routine `worker`: `gpt-5.6-luna` at high effort for normal bounded
  implementation;
- consequential `worker`: `gpt-5.6-sol` at medium effort for difficult
  cross-cutting or high-risk implementation;
- `validator`: `gpt-5.6-sol` at high effort for fresh independent validation.

Retain the current lead model and effort. Prefer GPT-5.6 Sol at xhigh effort
for a long-horizon mission lead, while leaving parent-session selection to the
user.

Choose model and effort before spawning and state both in the assignment.
Keep medium and high as execution settings rather than role names. If the
requested setting is unavailable, keep the work in the lead or report the
limitation.

## Invoke Native Codex

Use the current native subagent controls. Keep model and effort selection in
the spawn assignment rather than persistent custom-agent configuration.

Pass a compact assignment and the minimum useful context. Follow the global
subagent context-forking policy. Record the task name or identifier used to
steer, wait for, or stop the subagent immediately after spawning it.

Apply the main skill's event loop. Observe through mailbox waits, which return
early when the task sends a message or completes and otherwise produce a quiet
tick. Prefer waits of roughly one minute over repeated short waits. After
several minutes without a mailbox event, the main event loop permits one
active-agent liveness inspection for the current quiet episode. Leave the
subagent's worktree untouched during supervision.

For each initial formal validation pass, set `fork_turns: "none"` or use the
native equivalent that excludes implementation history. Supply the contract,
coherent change, relevant primary sources, validation evidence, and
findings-only return shape directly in the fresh assignment. Retain its task
identifier only for bounded delta revalidation in the same review cycle.

## Continue And Clean Up

Send the event loop's focused scout or worker follow-ups to the recorded task,
then return to mailbox waiting.

When the event loop permits recovery, inspect the active agent list and
interrupt only the affected session without closing it. Resume a scout or
worker with the native follow-up control only while its context remains
trustworthy. Preserve an interrupted initial validator's useful evidence and
replace it with a fresh pass; resume a validator only for bounded delta
revalidation. Replace or close any task whose context is no longer reliable.
