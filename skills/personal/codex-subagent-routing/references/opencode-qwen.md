# OpenCode Qwen Lane

## Select And Verify The Model

Use `alibaba-token-plan/qwen3.8-max-preview` for every scout and worker session in this
lane.
This preview model may be present through a local OpenCode cache entry before
the upstream catalog includes it. Do not refresh the model catalog. Verify the
configured model once before the first Qwen assignment in the current context:

```bash
opencode models | rg -x 'alibaba-token-plan/qwen3\.8-max-preview'
```

Keep the work in Codex or report the limitation when the model is unavailable
or lacks a required capability. Retain the exact model for focused follow-ups.

## Keep Implementation On Qwen

Use this Qwen model for every worker assignment, including consequential
implementation and corrections discovered during review. Native Codex may own
lead decisions and formal validation, but it must not implement, edit, repair,
or receive an implementation handoff in this lane. If Qwen is unavailable or
cannot safely complete the worker scope, stop and report the limitation rather
than substituting a GPT model for implementation.

## Invoke OpenCode

Verify `opencode agent list` includes `build (primary)`. Use `--agent build` for
every scout and worker invocation. Enforce read-only scout behavior through the
assignment prompt and scope, not through a separate OpenCode agent.

Create a compact prompt file using the environment's approved file-writing
mechanism. Set `REPO` and `PROMPT_FILE` to absolute paths.

Worker invocation:

```bash
opencode run --dir "$REPO" \
  --model alibaba-token-plan/qwen3.8-max-preview \
  --agent build \
  --file "$PROMPT_FILE" \
  --format json \
  --dangerously-skip-permissions \
  --title "qwen worker: <bounded-task>" \
  "Read the attached assignment and complete only that worker scope."
```

Scout invocation:

```bash
opencode run --dir "$REPO" \
  --model alibaba-token-plan/qwen3.8-max-preview \
  --agent build \
  --file "$PROMPT_FILE" \
  --format json \
  --title "qwen scout: <bounded-question>" \
  "Read the attached assignment and return evidence only. Do not edit files."
```

Give every run a unique title. Read the completed run output and record its
exact `sessionID` from the first JSON event before deleting the prompt file. In
OpenCode 1.17, `--format json` is a newline-delimited event stream rather than a
single final object. A successful run emits `step_start`, completed `tool_use`,
`text`, and `step_finish` events. Treat `step_finish` with `reason: "stop"` plus
a zero process exit as normal completion. Treat a top-level `error` event and a
nonzero exit as failure; use its status and retryability to distinguish a
terminal provider/account error from a resumable interruption. If no event
exposes a session ID, recover it by matching the unique title and repository as
described below; do not rely on the most recent session implicitly.

Apply the main skill's event loop. Observe the newline-delimited event stream
through `step_start`, completed `tool_use`, `text`, `step_finish`, and error
events. After several minutes without an expected event, the main event loop
permits one process-liveness inspection for the current quiet episode. Leave
the repository untouched during supervision.

## Continue And Clean Up

Resume with the recorded session ID and a focused follow-up file. Set `AGENT`
to `build`. Use the same model
and agent, and omit `--fork` so the existing session continues:

```bash
MODEL=alibaba-token-plan/qwen3.8-max-preview
AGENT=build
opencode run --dir "$REPO" \
  --session "$SESSION_ID" \
  --model "$MODEL" \
  --agent "$AGENT" \
  --file "$PROMPT_FILE" \
  --format json \
  "Read the attached follow-up and remain within the original assignment."
```

For a worker follow-up, retain `--dangerously-skip-permissions`. Avoid bare
`--continue` when several sessions may exist. Delete each prompt file after
the invocation completes and its session ID and useful result are preserved.

If the session ID was not recorded before interruption, recover it by matching
the run's unique title and repository in:

```bash
opencode session list --format json --max-count 20
```

When the main event loop permits a lane-health check or recovery, inspect the
recorded run's process:

```bash
ps -axo pid,ppid,command | rg '[o]pencode|[b]un.*opencode' || true
```

Interrupt only the leftover process created by the delegated run. Preserve the
prompt file until the interrupted run's session ID and useful evidence are
recovered. Then resume that exact session with the full follow-up invocation
above. Delete or replace the session only when it cannot resume or its context
is no longer trustworthy.
