# Runtime bootstrap

Generated Markdown policy is passive. Agent harnesses need this separate
bootstrap rule in their persistent repository-work instructions:

> Before repository work, check for `.local/INDEX.md`. When it exists, read it
> first, then follow only the concern links relevant to the current task. Treat
> linked READMEs as repository policy. Use live Git, GitHub, issue, and code
> state for current facts. Explicitly invoked skills must consume the same
> policy instead of copying it.

Install the rule once for each supported harness—Codex, Claude Code, and Zed—in
that harness's global or managed instruction location. Do not have
`repository-local setup` edit a repository's `AGENTS.md` or `CLAUDE.md`; those
files may be committed project guidance and are discovery inputs only.

The responsibilities stay separate:

- `repository-local setup` creates user-owned repository policy.
- The harness bootstrap makes that policy discoverable at runtime.
- Explicit skills provide selective reusable workflows and read the same
  policy when relevant.

The bootstrap must not eagerly read every concern, treat generated files as
remotely managed, or replace live-state inspection with cached Markdown.
