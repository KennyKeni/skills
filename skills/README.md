# Agent Skills

These skills are intentionally maintained in this dotfiles repo because the
installed copies have local edits, no reliable current upstream install path,
or are personal skills that only live here.

## Layout

- `forks/`: externally-originated skills with local edits or restore concerns,
  namespaced with the `keni-` prefix.
- `personal/`: personal skills authored for this setup.

Install them from GitHub, not from a local path. For an existing machine with
the native global lock, prefer:

```sh
task skills:restore-global
```

The restore task installs shared skills for Codex, Claude Code, and Zed by
default. Before restoring, it removes stale copies of harness-specific skills,
then installs Claude-only skills (`claude-subagent-routing`, `codex-first`, and
`grok-first`) only for Claude Code and Codex-only skills
(`codex-subagent-routing` and `sidekick`) only for Codex.

For a fresh install of Deliver Project:

```sh
npx -y skills@latest add https://github.com/KennyKeni/dotfiles/tree/main/packages/agent-skills \
  -g --copy --full-depth \
  -a codex claude-code zed \
  -s deliver-project \
  -y

task skills:restore-global
```

The broad install command is only for skills intended for all three default
agent harnesses:

```sh
npx -y skills@latest add https://github.com/KennyKeni/dotfiles/tree/main/packages/agent-skills \
  -g --copy --full-depth \
  -a codex claude-code zed \
  -y
```

After installing, commit the updated native global lock at
`~/.agents/.skill-lock.json`.
