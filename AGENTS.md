# Skills

This repository (`KennyKeni/skills`) is the maintained skill source. The sibling
`../dotfiles` repository owns the global `npx skills` lock and restore workflow.
Make skill-source changes here, commit and push them, then refresh installed
skills from `../dotfiles` with `npx skills update`.

Install skills for Codex, Claude Code, and Zed by default. Use a narrower agent
set only when a skill is specific to one or more agent harnesses.

Use `npx skills update --project -y` for project-installed skills, or
`npx skills update -g -y` for global skills when the intended scope is known.
Run `npx skills --help` if you need to confirm the available update flags.

After installing or updating skills, explicitly tell the user which skills
were installed or updated and whether the operation was project-scoped or
global.

# GitHub Comment Attachments

Use the `drogers0/gh-image` GitHub CLI extension when an agent needs to upload
an image or file to a GitHub issue or pull request comment. This creates native
`github.com/user-attachments/...` URLs like GitHub's drag-and-drop web upload.
GitHub's public REST and GraphQL APIs do not provide an attachment upload
endpoint, and inline base64 `data:` image URLs are stripped by GitHub Markdown.

Install the extension when it is missing:

```sh
gh extension install drogers0/gh-image
```

Upload a file and capture the Markdown reference, always identifying the target
repository when it is not unambiguous from the current checkout:

```sh
image_markdown="$(gh image screenshot.png --repo OWNER/REPO)"
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "Screenshot:

$image_markdown"
```

For pull requests, use the same upload command with `gh pr comment`:

```sh
gh pr comment PR_NUMBER --repo OWNER/REPO \
  --body "$(gh image screenshot.png --repo OWNER/REPO)"
```

On its first local use, `gh-image` may trigger a macOS Keychain prompt to read
the signed-in browser's cookie encryption key. Tell the user why access is
needed and wait for them to approve it. Never print, log, commit, or otherwise
expose `user_session`, `GH_SESSION_TOKEN`, or output from
`gh image extract-token`. Prefer browser-cookie authentication locally; do not
pass a session cookie with `--token`, because command arguments can appear in
process listings.

`gh-image` uses GitHub's undocumented browser upload flow and may break when
GitHub changes it. If it fails, report the failure and fall back to the GitHub
web comment editor for a native attachment, or ask before committing an image
to a repository-hosted assets branch. Do not silently upload to third-party
image hosts.

# File Deletion

Use `trash` instead of `rm` when deleting files or directories.
