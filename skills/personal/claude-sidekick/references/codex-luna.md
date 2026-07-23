# Luna via Codex CLI Setup

Use the current Claude session as the main agent and one persistent Codex
CLI session as the sidekick.

## Verify

Use `gpt-5.6-luna` at xhigh effort for the persistent
sidekick. Retain the current main agent's model and reasoning effort, and pin
the sidekick's model and effort explicitly rather than relying on user config.
Verify the CLI once before the first assignment in the current context:

```bash
command codex --version
```

Keep the work in the main agent and report the limitation when Codex is
unavailable.

## Start

Write the compact assignment to a prompt file using the environment's approved
file-writing mechanism — never inline shell quoting. Set `REPO` and
`PROMPT_FILE` to absolute paths, `EFFORT` to the configured effort, `OUT`
to a unique result file path, and `EVENTS` to a unique event-log path. Use
`command codex` to bypass any interactive shell wrapper. The run streams
`--json` events to `EVENTS`; its first `thread.started` event records the
`thread_id` that resume targets, so keep that file for the session.

Start the sidekick with full write access so the same session can explore,
edit, test, and repair:

```bash
EFFORT=xhigh
command codex exec -C "$REPO" \
  --model gpt-5.6-luna \
  -c model_reasoning_effort="$EFFORT" \
  --json \
  --dangerously-bypass-approvals-and-sandbox \
  -o "$OUT" \
  - < "$PROMPT_FILE" > "$EVENTS" 2>/dev/null
```

Run it in a supervised long-running execution session so the main agent can
continue independent judgment work while Codex executes. Resume later targets
this session by the `thread_id` recorded in its `EVENTS` file, so a sibling
Codex session in the same repository never collides with it.

## Observe And Steer

Suppress stderr because thinking noise bloats context; remove `2>/dev/null`
only to debug a failing run. Wait on the existing supervised execution session
until it exits, then read the `-o` result file rather than parsing streamed
output. A `codex exec` run is quiet by design, so treat silence as normal. Do
not poll process liveness or the result file during routine supervision; use
them only for a health check or recovery permitted below. Do not interrupt a
quiet run before a configured deadline.

Do not start a second session for a focused question. Let the active run
return, or interrupt it only when blocked, then resume the session with the
answer and the remaining assignment.

## Continue

Write each follow-up to a new prompt file and a new `OUT` path. `codex exec
resume` has no `-C`; run it from the repository:

```bash
EFFORT=xhigh
(cd "$REPO" \
  && SESSION_ID=$(rg -m1 -o '"thread_id":"([0-9a-fA-F-]+)"' -r '$1' "$EVENTS") \
  && command codex exec resume "$SESSION_ID" \
  --model gpt-5.6-luna \
  -c model_reasoning_effort="$EFFORT" \
  --dangerously-bypass-approvals-and-sandbox \
  -o "$OUT" \
  - < "$PROMPT_FILE" 2>/dev/null)
```

Delete each prompt file after its invocation completes, and preserve the `-o`
result file and the `EVENTS` file until their evidence is recorded. Resume
follows the recorded `thread_id`, so an unrelated Codex session running in the
repository since the sidekick's last return no longer forces a replacement.

## Stop And Recover

For a permitted health check or recovery, match the sidekick's own process by
its unique `OUT` path:

```bash
pgrep -fl -- "$OUT" || true
```

Interrupt only the process created for the sidekick and preserve its result
file and useful evidence until the session is recoverable.

When the session cannot safely resume, return the work and useful evidence to
the main agent. If replacement is worthwhile, start one new session with the
same model and effort and a compact handoff, and disclose that the cached
sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
