# Issue tracker

This repo uses GitHub Issues as the canonical tracker. Run every GitHub issue operation through the `gh` CLI from the target repository. Prefer `gh issue` and `gh label`; use `gh api` only for GitHub issue features that those high-level commands do not expose.

Keep the interface consistent. Do not switch to a connector, browser automation, `curl`, or handwritten GraphQL. If `gh` is missing, unauthenticated, or lacks permission, stop and report that blocker instead of choosing another interface.

## Relationship capabilities

- **Parent/sub-issue:** native and authoritative through `gh issue edit --add-sub-issue` / `--parent` and `gh issue view --json parent,subIssues`.
- **Dependencies:** native and authoritative through `gh issue edit --add-blocked-by` / `--add-blocking` and `gh issue view --json blockedBy,blocking`.

Require a `gh` version that exposes those flags and JSON fields. If the
configured CLI lacks them, stop and report the blocker. Body references are
supplemental on GitHub and never replace native relationships.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body-file -`. Supply multi-line bodies with a heredoc on standard input.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Search closed decisions**: `gh issue list --state closed --limit 100 --search "<concept terms>" --json number,title,url,body,labels,closedAt --jq '.'`. Search both the reporter's wording and the underlying concept before concluding that no prior rejection exists.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

After any create or mutation, inspect the result with `gh issue view` or the matching `gh api` read and report the issue URL. A successful command without read-back is not completion.

For a rejection, store the durable rationale in the closing comment on the
issue, then read back `state`, `stateReason`, labels, URL, body, and comments:

```bash
gh issue view "$issue_number" \
  --json state,stateReason,labels,url,body,comments \
  --jq '{state, stateReason, labels: [.labels[].name], url, body, comments: [.comments[].body]}'
```

When a new report repeats a closed rejection, link the new issue to the prior
issue in a tracker comment and preserve the prior issue as history. Reopen a
historical issue only when the maintainer explicitly requests it.

## Native sub-issues

An umbrella, tracking, or parent issue and its children must use GitHub's native sub-issue relationship. A `#123` link in an issue body is useful context but is not a substitute for that relationship.

Create each child with `gh issue create`, capture its number or URL, then attach it:

```bash
gh issue edit "$parent_number" --add-sub-issue "$child_number"
```

After attaching all children, verify the complete set:

```bash
gh issue view "$parent_number" --json subIssues --jq '.subIssues[].number'
```

Do not report a breakdown as published until every intended child appears in this read-back.

## Native dependencies

Hierarchy expresses membership, not execution order. Represent every real
prerequisite with a native blocked-by relationship:

```bash
gh issue edit "$child_number" --add-blocked-by "$blocker_number"
```

Read back both directions and confirm the approved graph:

```bash
gh issue view "$child_number" \
  --json blockedBy,blocking \
  --jq '{blockedBy: [.blockedBy[].number], blocking: [.blocking[].number]}'
```

Detect dependency cycles before mutation. After every authorized relationship
mutation, read it back and recheck the affected graph. The `Parent` and
`Dependencies` fields in `.local/agents/issue-contract.md` remain useful for
humans but are supplemental on GitHub.

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

Use `.local/agents/triage-labels.md` for the actual GitHub label strings to apply for category and state roles.

Relationship support and technical access do not authorize relationship
mutations. Use only the mutation boundary approved by the active workflow.

## When a skill says "publish to the issue tracker"

Create a GitHub issue. Do not create local issue files as a substitute.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
