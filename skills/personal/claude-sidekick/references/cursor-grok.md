# Grok 4.5 via Cursor Setup

Use the current Claude session as the main agent and one persistent Cursor chat
as the sidekick.

## Verify

Use `cursor-grok-4.5-high` for the persistent sidekick. Retain the
current main agent's model and reasoning effort.
Never substitute a `fast` variant.
Verify the installed CLI, authentication, and model once before the first
Cursor assignment in the current context:

```bash
cursor-agent status
cursor-agent models | rg -x 'cursor-grok-4\.5-high - Cursor Grok 4\.5'
```

Keep the work in the main agent and report the limitation when Cursor is
unavailable, the account is not authenticated, or the model is absent. Retain
the exact model for focused follow-ups.

## Start

Create a compact prompt file using the environment's approved file-writing
mechanism. Set `REPO` and `PROMPT_FILE` to absolute paths. Use event-stream
`stream-json` for writable or long-running work; omit partial-output mode,
which only duplicates the completed response.

Start the sidekick:

```bash
MODEL=cursor-grok-4.5-high
CHAT_ID=$(cursor-agent create-chat)
cursor-agent --print \
  --resume "$CHAT_ID" \
  --workspace "$REPO" \
  --model "$MODEL" \
  --output-format stream-json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Run it in a supervised long-running execution session. The `start` macro mints
`CHAT_ID` with `create-chat` before launching inside it, so record `CHAT_ID` up
front; the main agent uses it to resume and health-check while Cursor executes.

Use full Agent mode throughout the persistent chat. Enforce exploration-only,
writable scope, judgment boundaries, and no-delegation requirements through
each assignment packet.

## Observe And Steer

`CHAT_ID` is minted before the run by `create-chat`; the initial `system/init`
`session_id` confirms it. Treat the terminal `result` event's error state,
subtype, process exit, and useful result as completion evidence. Keep thinking
deltas out of the returned answer.

Do not open a second chat for a focused question. Let the active run return,
or interrupt it only when blocked, then resume `CHAT_ID` with the answer and
the remaining assignment.

## Continue

Resume a focused follow-up with the recorded chat ID, the same workspace,
exact model, full permissions, and a focused prompt file:

```bash
MODEL=cursor-grok-4.5-high
cursor-agent --print \
  --resume "$CHAT_ID" \
  --workspace "$REPO" \
  --model "$MODEL" \
  --output-format stream-json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

Record the chat ID before deleting the prompt file. Recover a missing ID with
`cursor-agent ls` by matching the repository and assignment context. Resume
the same chat after a capacity error or interruption while its context remains
trustworthy.

## Stop And Recover

For a permitted health check or recovery, inspect only the recorded run:

```bash
pgrep -fl -- "$CHAT_ID" || true
```

Interrupt only the process created for that run and preserve the prompt and
useful evidence until the chat is recoverable.

When the chat cannot safely resume, return the work and useful evidence to the
main agent. If replacement is worthwhile, start one new chat with the same
model and a compact handoff, record its new `CHAT_ID`, and disclose that the
cached sidekick context was lost.

Use this adapter for the full sidekick lifecycle. Keep its recorded identifier
until the task ends or the main agent explicitly replaces an unrecoverable
session with the same requested setup.
