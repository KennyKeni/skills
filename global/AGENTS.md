# Local Tooling

This machine uses `mise` for runtime/tool version management. Prefer `mise`-managed tools over Homebrew or language-specific version managers when a project depends on a specific runtime or CLI version.

- Global defaults live in `~/.config/mise/config.toml`.
- Project-specific versions should live in the project's `mise.toml`.
- Inspect `mise.toml`, `mise ls`, and `mise current` before assuming which runtime or CLI version is active.
- Use `mise install` after entering a project with a `mise.toml` if required tools are missing.
- Developer CLIs such as `gh` may be installed through `mise`; if a CLI is missing from the standard PATH or expected install location, check `mise` before falling back to Homebrew or other installers.
- Prefer purpose-built CLI commands over manual config edits when the CLI exists and preserves related state. For example, use the package manager's uninstall command instead of hand-editing `package.json` and lockfiles.
- Use `pnpm` as the default JavaScript package manager unless the project is explicitly using `bun`.
- Use `uv` as the default Python package and environment manager.

# Skills

All skills must be installed and tracked through `npx skills`. Never install
skills manually.

# Git-Excluded Instruction Files

`AGENTS.md` and `CLAUDE.md` are globally git-excluded on this machine. If a repository should track one of these files, unexclude it on a per-repository basis.

When a repository contains `.local/INDEX.md`, start there and use its gitignored `.local/` tree for repository-specific agent policy, tracker conventions, domain and architecture context, secrets, state, and disposable artifacts; never unexclude or force-track it.

# Attribution and Provenance

Do not mention LLM or AI usage in comments, commit messages, PR descriptions, issue text, release notes, or other generated artifacts unless the user explicitly asks for it. Avoid attribution trailers, tool signatures, or provenance notes such as generated-by/co-authored-by lines.

# Cloudflare

The `cf` command can be used to manage Cloudflare.
Do not proactively check whether its credentials or session are expired. Do not
inspect or decode tokens, compare token timestamps, or run a separate
authentication check before using it. Run the requested `cf` operation
directly and treat its result as authoritative; only troubleshoot
authentication if that operation itself returns an authentication error.

# Computer Use App Testing

When using Computer Use to test an app, an app window that was already open
may remain in its current AeroSpace workspace.

If Computer Use opens a new window, move that specific window to an unoccupied
AeroSpace workspace from this ordered set: `v`, `w`, `x`, `y`, `z`. Treat a
workspace as occupied when AeroSpace reports one or more windows in it. This
applies even when another window from the same app was already open; identify
the newly opened window rather than assuming that every window from a running
app may remain in place.

Before opening a new window, record the relevant AeroSpace window IDs and the
occupancy of `v`, `w`, `x`, `y`, and `z`. After opening it, identify the new
window by comparing window IDs, then move it with
`aerospace move-node-to-workspace --window-id <window-id> <workspace>`. Do not
move unrelated existing windows. If all five workspaces are occupied, ask the
user before moving the new window or disturbing another window.

# GitHub Comment Attachments

Use the `drogers0/gh-image` GitHub CLI extension when an agent needs to upload
an image or file to a GitHub issue or pull request comment. It creates native
`github.com/user-attachments/...` URLs using the same upload flow as GitHub's
web editor. Inline base64 `data:` image URLs do not work in GitHub Markdown.

Install the extension when it is missing:

```sh
gh extension install drogers0/gh-image
```

Upload the attachment first, then include its returned Markdown in the comment:

```sh
image_markdown="$(gh image screenshot.png --repo OWNER/REPO)"
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "Screenshot:

$image_markdown"
```

For pull requests:

```sh
gh pr comment PR_NUMBER --repo OWNER/REPO \
  --body "$(gh image screenshot.png --repo OWNER/REPO)"
```

On first use, `gh-image` may trigger a macOS Keychain prompt to read the
signed-in browser's cookie encryption key. Explain the prompt and wait for the
user to approve it. Never print, log, commit, or expose `user_session`,
`GH_SESSION_TOKEN`, or output from `gh image extract-token`. Prefer local
browser-cookie authentication and never pass a session cookie with `--token`,
because command arguments can appear in process listings.

This extension uses GitHub's undocumented browser upload flow and may break.
If it fails, report the failure and use GitHub's web comment editor, or ask
before committing the image to a repository-hosted assets branch. Never
silently upload files to a third-party host.
