---
name: grok-first
description: "Route implementation work to Grok 4.5 through Cursor or OpenCode; Claude specs, reviews, verifies."
---

# Grok First

Claude Code sessions only. Codex/other harnesses: skip; never self-delegate.

Rationale: Claude (Fable/Opus) tokens are metered and expensive; Grok through
Cursor or OpenCode provides a separate implementation lane. Claude wins at
ergonomics — judgment, design, spec-writing, review, and orchestration. So Grok
types, Claude thinks and verifies.

## Route

Delegate to Grok through Cursor or OpenCode (default for hands-on work):

- implementation from a frozen spec; refactors; mechanical migrations
- bug fixes with known repro; test writing; coverage fills
- CI fixes, dependency bumps, scripts/tooling
- bulk codebase exploration where raw reading ≫ the answer

Keep in Claude:

- design, API design, architecture, naming, UX judgment
- tasks where writing the spec IS the work (ambiguity = design)
- tiny edits (~<20 lines, single obvious change) — delegation overhead loses
- anything needing session tools: MCP (browser/computer-use/chronicle),
  1Password, secrets
- destructive/irreversible ops, releases, pushes, GitHub mutations —
  Claude-side per git rules
- review of Grok output — never delegated, never skipped

Mixed task: Claude designs first, freezes spec, delegates build-out.
Heuristic: prompt reads as a work order → delegate; writing it forces decisions
→ design, Claude.
Portfolio/multi-repo work: `$maintainer-orchestrator` instead.

## Select Cursor Or OpenCode

Use Cursor by default. Honor an explicit Cursor or OpenCode request. Keep
focused follow-ups in the same harness and session; do not switch harnesses
mid-task.

Choose Cursor when its subscription-backed `cursor-grok-4.5-high` model is available,
especially for implementation that benefits from a resumable chat ID and
workspace-aware agent execution. Choose OpenCode when Cursor is unavailable or
the user explicitly wants a terminal-native OpenCode session using
`xai/grok-4.5`.

Before the first assignment in the current context, verify only the selected
harness. If it is unavailable, use the other harness only when the user or
active mission permits fallback. Never silently substitute another Grok model.

## Invoke Through Cursor

Verify the installed CLI, authentication, and exact model:

```bash
cursor-agent status
cursor-agent models | rg -x 'cursor-grok-4\.5-high - Cursor Grok 4\.5'
```

Prompt via temp file, never inline quoting. Set `REPO` and `PROMPT_FILE` to
absolute paths:

```bash
PROMPT_FILE=$(mktemp); cat >"$PROMPT_FILE" <<'EOF'
<goal, repo + key paths, constraints ("don't touch X"), non-goals, proof expected, output shape>
EOF
cursor-agent --print \
  --workspace "$REPO" \
  --model cursor-grok-4.5-high \
  --output-format json \
  --trust \
  --force \
  < "$PROMPT_FILE"
```

- Pin `cursor-grok-4.5-high`; never substitute a `fast` variant.
- Use full Agent mode with `--force` for implementation and exploration.
  Enforce read-only exploration through the prompt, not reduced permissions.
- Read the completed JSON object and record its `session_id` before deleting
  the prompt file. Treat a missing session ID as an incomplete handoff; recover
  it with `cursor-agent ls` before following up.
- Long runs: Bash run_in_background; don't kill quiet runs <30 min.
- Parallel independent tasks require separate repositories or write scopes,
  prompt files, and chat IDs.

Resume with the recorded chat ID, same workspace, model, and permissions:

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

Avoid bare `--continue` when several chats may exist.

## Invoke Through OpenCode

Refresh model names before relying on them:

```bash
opencode models --refresh >/dev/null
opencode models | rg -i '^xai/grok-4\.5$'
```

Use exactly `xai/grok-4.5`. If unavailable, stop and report the model
availability issue instead of substituting another model.

Prompt via temp file, never inline quoting:

```bash
P=$(mktemp); cat >"$P" <<'EOF'
<goal, repo + key paths, constraints ("don't touch X"), non-goals, proof expected, output shape>
EOF
opencode run --dir <repo> \
  --model xai/grok-4.5 \
  --agent build \
  --file "$P" \
  --dangerously-skip-permissions \
  --title "grok delegated task" \
  "Read the attached prompt and complete it exactly." \
  | tee /tmp/opencode-last.md
```

- Pin `xai/grok-4.5` explicitly; do not rely on user config.
- Use `--agent build` for every OpenCode invocation, including read-only
  discovery and implementation reconnaissance. For read-only work, explicitly
  prohibit edits in the prompt.
- `--dangerously-skip-permissions` is the house default; Grok may run commands
  and tests freely. Keep prompts scoped to the target repository.
- Use a unique `--title` for each independent run.
- Read the captured output file for the result.
- Long runs: Bash run_in_background, read the output file on exit; don't kill
  quiet runs <30 min.
- Parallel independent tasks are allowed with separate repositories or write
  scopes, titles, prompt files, and output files.

Follow-up fixes are cheaper than fresh runs and keep context:

```bash
opencode run --dir <repo> --continue \
  --file "$P2" \
  --dangerously-skip-permissions \
  "Read the attached follow-up and revise the existing session output." \
  | tee /tmp/opencode-last.md
```

Use `--continue` only when the target assignment is unambiguously the most
recent OpenCode session. Otherwise resume by explicit session ID if supported,
or start a fresh run with a compact handoff.

## Prompt Contract

Grok starts with zero Claude session context. Every prompt: goal, exact
repo/paths, constraints, non-goals, proof expected (exact test command), output
shape ("report files changed + test output"). Spec quality decides success.

For UI prompts include target viewport sizes, references/screenshots, states,
and what done looks like.

## Verify (Claude, Always)

- `git status -sb` + read the full diff; judge like a contributor PR
- run focused tests yourself or demand proof output; Grok claims are advisory
- for UI, run the app and inspect desktop and mobile screenshots for text fit,
  overlap, responsive behavior, and generic output
- iterate in the recorded Cursor chat or OpenCode session; after 2 failed
  rounds, take over and do it directly
- normal closeout still applies: `$autoreview` before ship
- after a hung or interrupted run, confirm no live `cursor-agent` or OpenCode
  process from the assignment remains before reporting completion

## Economics

Win = generation + exploration tokens moved to Grok; Claude spends only on spec
+ diff review. Don't ping-pong trivia through delegation; don't re-read what
Grok already summarized.
