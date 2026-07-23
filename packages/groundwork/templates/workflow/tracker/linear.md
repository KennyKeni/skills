## Tracker verb contract

When a skill or instruction says:

- **publish to the tracker** — create or update the Linear issue through the
  Linear API or MCP tools.
- **fetch the ticket** — read the Linear issue, including comments, parent,
  sub-issues, blocking relations, and workflow state.
- **query the frontier** — list unstarted leaf issues with no open blocking
  relations and no active claim.
- **claim / release** — post a claim or release comment (see Claims).
- **resolve** — move the issue to its completed state (a merged PR with a
  closing magic word may already have done this through team automation —
  verify the resulting state rather than assuming), then tear down its
  branch, worktree, and `work/<slug>/` folder together.

Every work item has exactly one authoritative home: this tracker. Forge issue
tabs are not a work surface — anything filed there is triaged into Linear or
closed. A local ticket alongside a Linear issue is supplementary and must link
upward.

## Issues

{{issueConvention}}

## Specifications

{{specificationConvention}}

Specifications are never executable; implementation happens only through leaf
tickets attached as sub-issues. Publication does not authorize implementation.

## Executable tickets

{{ticketConvention}}

Publish blockers before dependents so relations reference real issues.

Any factual observation about the codebase in an issue — sizes,
structure, paths, measured behavior — is stamped with the commit it was
made at (`as of <sha>`). An unstamped measurement reads as a current
fact and goes stale invisibly.

## Labels

{{labelPolicy}}

Readiness meaning lives in Linear workflow states rather than labels; labels
carry only category meaning. Blocked-ness lives in blocking relations and
claims live in comments, never in labels or states invented for the purpose.
Untriaged intake lives in Linear's native Triage state, not in a derived
no-readiness-label queue; promote a leaf out of Triage or Backlog into an
Unstarted state to put it on the frontier.

## Relationships

{{relationshipPolicy}}

Hierarchy (parent/sub-issue) and dependency (blocking relations) are distinct
axes — a sub-issue is not implicitly blocked by its siblings. Express
dependency only through typed Blocked-by relations; an issue mention in text
auto-creates a loose Related link and never a real blocker. Reject
dependency cycles. Read every relationship mutation back before reporting it.

## Claims

{{claimPolicy}}

Post the claim, then list comments: the earliest active claim wins; if it is
not yours, back off. Assignee changes are a human surface, not the claim
mechanism — assigning an issue to a registered Linear agent triggers native
delegation (the human stays owner, the agent becomes a contributor), which
is never this claim mechanism. Reread the issue and its comments immediately
before dispatch; never rely on a cached frontier.

## Readiness

{{readinessPolicy}}

Readiness is eligibility only. It never grants implementation or
external-mutation authority.

Before claiming, check the ticket's stamped observations against the
current default branch: when the facts have drifted, update or close
the ticket first — never implement an outdated plan as written.

## Local work context

{{workContextPolicy}}

If it justifies or verifies the outcome it goes in the ticket; if it is only
needed to resume, it goes in the work folder; if it constrains future work, it
goes in policy; if it is none of those yet, it goes in the top-level
`scratch/`, which is disposable and never citable. Nothing in a work folder
or the top-level `scratch/` may be the only record of a decision.
