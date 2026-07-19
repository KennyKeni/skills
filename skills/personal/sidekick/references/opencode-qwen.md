# Qwen3.8 Max Preview via OpenCode Setup

Use the current Codex session as the main agent and one persistent OpenCode
session as the sidekick.

## Verify

Use `alibaba-token-plan/qwen3.8-max-preview` for the persistent sidekick. Retain the
current main agent's model and reasoning effort.
This preview model may be present through a local OpenCode cache entry before
the upstream catalog includes it. Do not refresh the model catalog. Verify the
configured model once before the first assignment in the current context:

```bash
opencode models | rg -x 'alibaba-token-plan/qwen3\.8-max-preview'
```

Keep the work in the main agent and report the limitation when the model or a
required capability is unavailable. Retain the exact model for follow-ups.

## Keep Implementation On Qwen

Send every implementation, edit, repair, test-fix, and review-correction work
unit to the persistent Qwen sidekick. Keep the main agent on planning,
ambiguity resolution, consequential decisions, supervision, and final review;
the main agent must not implement changes in this setup. If Qwen is unavailable
or cannot safely complete the work, stop and report the limitation rather than
substituting a GPT model for implementation.

## Start

Verify `opencode agent list` includes `build (primary)`.
Create a compact prompt file using the environment's approved file-writing
mechanism. Set `REPO`, `MODEL`, `AGENT`, and `PROMPT_FILE` before invocation.

Start the sidekick in the build agent so the same session can explore, edit,
test, and repair:

```bash
MODEL=alibaba-token-plan/qwen3.8-max-preview
AGENT=build
opencode run --dir "$REPO" \
  --model "$MODEL" \
  --agent "$AGENT" \
  --file "$PROMPT_FILE" \
  --format json \
  --dangerously-skip-permissions \
  --title "sidekick: <bounded-task>" \
  "Read the attached assignment and remain the persistent sidekick for this task."
```

Run it in a supervised long-running execution session. Record that execution
session and capture OpenCode's `sessionID` as `SESSION_ID` so the main agent can
continue independent judgment work while OpenCode executes.

## Observe And Steer

Give every run a unique title. Record the exact `sessionID` from the first JSON
event before deleting the prompt file. Treat `step_finish` with `reason: "stop"`
and a zero process exit as completion. Treat a top-level `error` event or
nonzero exit as failure, preserving any useful result and retryability evidence.
Recover a missing session ID by matching the unique title and repository.

Do not create a second session for a focused question. Let the active run
return, or interrupt it only when blocked, then resume `SESSION_ID` with the
answer and the remaining assignment.

## Continue

Resume the recorded session with its exact model and agent, omitting `--fork`.

```bash
MODEL=alibaba-token-plan/qwen3.8-max-preview
AGENT=build
opencode run --dir "$REPO" \
  --session "$SESSION_ID" \
  --model "$MODEL" \
  --agent "$AGENT" \
  --file "$PROMPT_FILE" \
  --format json \
  --dangerously-skip-permissions \
  "Read the attached follow-up and remain within the original assignment."
```

Retain `--dangerously-skip-permissions` for every writable follow-up. Avoid bare
`--continue` when several sessions may exist. Delete prompt files only after
the session ID and useful result are preserved. Recover an unrecorded ID with:

```bash
opencode session list --format json --max-count 20
```

## Stop And Recover

For a permitted health check or recovery, inspect only the recorded run:

```bash
ps -axo pid,ppid,command | rg '[o]pencode|[b]un.*opencode' || true
```

Interrupt only the process created for that run and preserve its prompt and
useful evidence until the session is recoverable.

When the session cannot safely resume, return the work and useful evidence to
the main agent. If replacement is worthwhile, start one new session with the
same model and a compact handoff, record its new `SESSION_ID`, and disclose that
the cached sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
