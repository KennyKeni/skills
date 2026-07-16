# Cursor Grok Lane

Use this subscription-backed lane only for eligible `scout` and `worker`
assignments. Use native Codex Sol for every formal validator. When the main
skill classifies requested work as architecturally consequential or high-risk,
return the ineligible assignment to the lead; use Sol only when the user or
active mission authorizes that fallback.

## Select And Verify The Model

Use `cursor-grok-4.5-high` for every session in this lane. Never substitute
`cursor-grok-4.5-high-fast` or another `fast` variant. Verify the installed CLI,
authentication, and model once before the first Cursor assignment in the
current context:

```bash
cursor-agent status
cursor-agent models | rg -x 'cursor-grok-4\.5-high - Cursor Grok 4\.5'
```

Keep the work in Codex or report the limitation when Cursor is unavailable,
the account is not authenticated, or the model is absent. Retain the exact
model for focused follow-ups.

## Invoke Cursor

Create a compact prompt file using the environment's approved file-writing
mechanism. Set `REPO` and `PROMPT_FILE` to absolute paths. Use single-result
structured output. Read the completed JSON object and record its `session_id`
as the Cursor chat ID before deleting the prompt file. Treat a missing or
malformed `session_id` as an incomplete handoff; recover the chat ID with
`cursor-agent ls` before attempting a follow-up.

Worker invocation:

```bash
cursor-agent --print \
  --workspace "$REPO" \
  --model cursor-grok-4.5-high \
  --output-format json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Scout invocation:

```bash
cursor-agent --print \
  --workspace "$REPO" \
  --model cursor-grok-4.5-high \
  --output-format json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Run scouts in full Agent mode with `--force` so repository, shell, web, and
other available tools are not permission-constrained. Enforce the scout's
evidence-only and no-edit boundaries in its assignment rather than through
Cursor mode permissions. Give workers the main skill's bounded change surface
and no-delegation boundary.

## Continue And Clean Up

Resume a focused follow-up with the recorded chat ID, the same workspace and
model, full permissions, and a focused prompt file:

```bash
cursor-agent --print \
  --resume "$CHAT_ID" \
  --workspace "$REPO" \
  --model cursor-grok-4.5-high \
  --output-format json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Use `--force` for both scouts and workers. Avoid bare `--continue` when several
chats may exist. Delete each prompt file after the invocation completes and its
chat ID and useful result are preserved. If the chat ID was not recorded before
an interruption, use `cursor-agent ls` interactively and match the repository
and assignment context; Cursor does not provide a reliable headless chat-list
interface.

Check for a live process only when a run hangs or is interrupted:

```bash
ps -axo pid,ppid,command | rg '[c]ursor-agent' || true
```

Interrupt only the leftover process created by the delegated run. Preserve the
prompt file until the interrupted run's chat ID and useful evidence are
recovered. Then resume that exact chat with the full follow-up invocation above.
Replace the chat only when it cannot resume or its context is no longer
trustworthy.
