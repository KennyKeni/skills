# Issue tracker

This repo uses GitLab Issues as the canonical tracker.

Use `glab` from the repo root so it resolves the current GitLab project.

## Relationship capabilities

Record the observed capability during setup:

- **Parent/child:** supported / unsupported; configured command or API mechanism.
- **Dependencies:** supported / unsupported; configured command or API mechanism.

GitLab relationship availability depends on the configured plan, work-item
features, and tooling. When a native mechanism is supported, use it and record
the exact create, remove, query, and read-back commands here. When it is not
supported, state that the `Parent` or `Dependencies` field in
`.local/agents/issue-contract.md` is authoritative. Do not create a competing
local graph.

Common operations:

- **Read an issue**: `glab issue view <number> --comments`, including labels and discussion.
- **List issues**: `glab issue list` with the appropriate `--label`, `--state`, and JSON/JQ options when available.
- **Search closed decisions**: `glab issue list --closed --per-page 100 --search "<concept terms>" --in title,description --output json`. Search both the reporter's wording and the underlying concept before concluding that no prior rejection exists.
- **Comment on an issue**: `glab issue note <number> --message "..."`
- **Create an issue**: `glab issue create --title "..." --description-file <file>` or `--description "..."`.
- **Update labels**: `glab issue update <number> --label "label"` and remove stale labels with the matching `glab` option available on this machine.
- **Close**: `glab issue close <number>` and add a final note when context is useful.

For a rejection, put the durable rationale in a final issue note, close the
issue, then use `glab issue view <number> --comments --output json` to read back
the closed state, labels, description, URL, and discussion. If that view omits
a required field on the installed version, use
`glab api projects/:id/issues/<number>` and
`glab api projects/:id/issues/<number>/notes` through the same configured
`glab` interface. A successful mutation without this read-back is incomplete.

When a new report repeats a closed rejection, link the new issue to the prior
issue in a tracker note and preserve the prior issue as history. Reopen a
historical issue only when the maintainer explicitly requests it.

Use `.local/agents/triage-labels.md` for the actual GitLab label strings to apply for category and state roles.

Relationship support and technical access do not authorize relationship
mutations. Use only the mutation boundary approved by the active workflow.

## Creating issues

Create a GitLab issue. Do not create local issue files as a substitute.

## Reading issues

Run `glab issue view <number> --comments`. Read the body, labels, and comments before deciding what to do.
