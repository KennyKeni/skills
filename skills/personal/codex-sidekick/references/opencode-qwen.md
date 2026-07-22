# Qwen3.8 Max Preview via OpenCode Setup

Use the current Codex session as the main agent and one persistent OpenCode
session as the sidekick.

## Verify

Use `alibaba-token-plan/qwen3.8-max-preview` for the persistent sidekick. Retain the
current main agent's model and reasoning effort.
Verify the configured model once before the first assignment in the current
context:

```bash
opencode models | rg -x 'alibaba-token-plan/qwen3\.8-max-preview'
```

Keep the work in the main agent and report the limitation when the model or a
required capability is unavailable. Retain the exact model for follow-ups.

## Start

Verify `opencode agent list` includes `build (primary)`. Create a compact
prompt file using the environment's approved file-writing mechanism, and set
`REPO` and `PROMPT_FILE` to absolute paths.

Start the sidekick in the build agent so the same session can explore, edit,
test, and repair:

```bash
opencode run --dir "$REPO" \
  --model alibaba-token-plan/qwen3.8-max-preview \
  --agent build \
  --file "$PROMPT_FILE" \
  --format json \
  --auto \
  --title "sidekick: <bounded-task>" \
  "Read the attached assignment and remain the persistent sidekick for this task."
```

Run it in a supervised long-running execution session. Record that execution
session and capture OpenCode's `sessionID` as `SESSION_ID` so the main agent
can continue independent judgment work while OpenCode executes.

## Observe And Steer

Give every run a unique title. `--format json` emits a newline-delimited event
stream; record the exact `sessionID` from its first event before deleting the
prompt file. Treat `step_finish` with `reason: "stop"` plus a zero process
exit as completion, and a top-level `error` event or nonzero exit as failure,
preserving any useful result and retryability evidence.

Do not create a second session for a focused question. Let the active run
return, or interrupt it only when blocked, then resume `SESSION_ID` with the
answer and the remaining assignment.

## Continue

Resume the recorded session with `MODEL` set to its exact model, omitting
`--fork` and retaining `--auto` for every writable follow-up:

```bash
opencode run --dir "$REPO" \
  --session "$SESSION_ID" \
  --model "$MODEL" \
  --agent build \
  --file "$PROMPT_FILE" \
  --format json \
  --auto \
  "Read the attached follow-up and remain within the original assignment."
```

Avoid bare `--continue` when several sessions may exist. Delete prompt files
only after the session ID and useful result are preserved. Recover an
unrecorded ID by matching the run's unique title and repository in:

```bash
opencode session list --format json --max-count 20
```

## Stop And Recover

For a permitted health check or recovery, inspect only the recorded run:

```bash
pgrep -fl -- "$PROMPT_FILE" || true
```

Interrupt only the process created for that run and preserve its prompt and
useful evidence until the session is recoverable.

When the session cannot safely resume, return the work and useful evidence to
the main agent. If replacement is worthwhile, start one new session with the
same model and a compact handoff, record its new `SESSION_ID`, and disclose
that the cached sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
