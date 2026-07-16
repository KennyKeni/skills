# Codex Sol Lane From Claude

Use this lane for default Claude delegation and for every architecturally
consequential scout, difficult or high-risk worker, and formal validator.

## Select Model And Effort

Use GPT-5.6 Sol with these defaults:

- `scout`, medium effort: bounded read-only repository exploration;
- `scout`, high effort: consequential synthesis, unfamiliar cross-subsystem
  diagnosis, or evidence affecting architecture, security, schemas,
  migrations, concurrency, or public interfaces;
- `worker`, medium effort: normal bounded implementation;
- `worker`, high effort: difficult cross-cutting or high-risk implementation;
- `validator`, high effort: fresh independent validation.

Retain the current lead model and effort. Prefer Claude's strongest available
reasoning setting for a long-horizon mission lead, while leaving parent-session
selection to the user.

Choose model and effort before invocation and state both in the assignment.
Keep medium and high as execution settings rather than role names. If the
requested setting is unavailable, keep the work in the lead or report the
limitation.

## Invoke Codex From Claude

Claude has no native Codex spawn control. Write the compact assignment to a
temporary file, never inline shell quoting, and invoke Codex through Bash:

```bash
P=$(mktemp); cat >"$P" <<'EOF'
<goal, repo + key paths, constraints, non-goals, proof expected, output shape,
canonical role, selected lane, and explicit no-delegation boundary>
EOF
command codex exec --yolo -C <repo> \
  -m gpt-5.6-sol \
  -c model_reasoning_effort="high" \
  --enable fast_mode \
  -o /tmp/codex-<unique-task>.md - <"$P" 2>/dev/null
```

Pin model, effort, and fast mode explicitly; do not rely on user config. Use
medium effort for the medium assignments above by changing only
`model_reasoning_effort`.

Use `command codex` to bypass the interactive zsh wrapper. If it is not on
`PATH`, use `fnm exec --using default -- codex` with the same arguments. Keep
`--yolo` as the house default so Codex may run commands and tests freely inside
the target repository. Add `--skip-git-repo-check` outside a Git repository.

Suppress stderr because thinking noise bloats context; remove `2>/dev/null`
only to debug a failing run. Read the `-o` file for the result rather than
parsing the JSONL stream. For long runs use Claude Code Bash background
execution and read the output file on exit. Do not kill a quiet run before 30
minutes. Independent tasks may run in parallel only with separate repositories
or write scopes and separate output files.

For every validator, start a fresh `codex exec` process. Supply the contract,
coherent change, relevant primary sources, validation evidence, findings-only
return shape, and no-delegation boundary directly in the fresh assignment.

## Continue And Clean Up

Send focused follow-ups to an existing scout or worker when its context remains
relevant. Write the follow-up to another temporary file. Run `resume` from the
repository because it has no `-C` or `--yolo`, and spell the bypass flag in
full:

```bash
(cd <repo> && command codex exec resume --last \
  --dangerously-bypass-approvals-and-sandbox \
  -o /tmp/codex-<same-task>.md - <"$P2" 2>/dev/null)
```

Use `resume --last` only when that assignment is unambiguously the repository's
most recent Codex session. Otherwise start a fresh run with a compact handoff.
Start every validator with fresh context; resume one only for delta
revalidation in its current review cycle.

When a Codex process hangs or is interrupted, inspect running processes and
stop only the process created for that assignment. Preserve its result file and
last useful evidence. Resume it when its context remains trustworthy; replace
it only when it cannot resume or its context is no longer reliable.
