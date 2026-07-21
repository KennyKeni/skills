# Agent Skills

Personal skill source for `npx skills`. Skills are maintained here and
installed from GitHub (`KennyKeni/skills`), never from a local path.

## Layout

- `personal/`: personal skills authored for this setup.

## Install and restore

The native global lock lives at `~/.agents/.skill-lock.json` and is not
tracked in any repository. On an existing machine, restore every recorded
global skill with:

```sh
task skills:restore-global
```

The restore task installs shared skills for Codex, Claude Code, and Zed by
default. Before restoring, it removes stale copies of harness-specific skills,
then installs Claude-only skills (`claude-subagent-routing`, `claude-sidekick`,
`codex-first`, and `grok-first`) only for Claude Code and Codex-only skills
(`codex-subagent-routing` and `codex-sidekick`) only for Codex.

For a fresh install of a single skill:

```sh
npx -y skills@latest add KennyKeni/skills \
  -g --copy --full-depth \
  -a codex claude-code zed \
  -s deliver-project \
  -y
```

After pushing source changes here, refresh the installed copies:

```sh
npx skills update -g -y
```
