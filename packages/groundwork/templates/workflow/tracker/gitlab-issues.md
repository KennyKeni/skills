## Tracker verb contract

When a skill or instruction says:

- **publish to the tracker** — create or update the GitLab issue with `glab`.
- **fetch the ticket** — read the issue with `glab issue view --comments`
  (title, body, notes). Linked and blocking relationships are not rendered
  by the CLI; read them from the API when they gate the work.
- **query the frontier** — list open leaf issues with no open blocking
  relationships and no active claim.
- **claim / release** — post a claim or release note (see Claims).
- **resolve** — close the issue, then tear down its branch, worktree, and
  `work/<slug>/` folder together.

Every work item has exactly one authoritative home: this tracker. A local
ticket alongside a remote issue is supplementary and must link upward.

## Issues

{{issueConvention}}

## Specifications

{{specificationConvention}}

Specifications are never executable; implementation happens only through leaf
tickets linked from the specification. Publication does not authorize
implementation.

## Executable tickets

{{ticketConvention}}

Publish blockers before dependents so edges reference real issue numbers.

## Labels

{{labelPolicy}}

Labels carry only category and readiness meaning. Blocked-ness lives in
blocking relationships and claims live in notes, never in labels. The triage
queue is derived, not labeled: open issues with no readiness label.

## Relationships

{{relationshipPolicy}}

Hierarchy and dependency are distinct axes — a child issue is not implicitly
blocked by its siblings. When native blocking is unavailable on the
instance tier, record `Blocked by: #n` in the affected issue body as the one
authoritative fallback; do not duplicate it in shadow local state. Reject
dependency cycles. Read every relationship mutation back before reporting it.

## Claims

{{claimPolicy}}

Post the claim, then list notes: the earliest active claim wins; if it is not
yours, back off. Reread the issue and its notes immediately before dispatch;
never rely on a cached frontier.

## Readiness

{{readinessPolicy}}

Readiness is eligibility only. It never grants implementation or
external-mutation authority.

## Local work context

{{workContextPolicy}}

If it justifies or verifies the outcome it goes in the ticket; if it is only
needed to resume, it goes in the work folder; if it constrains future work, it
goes in policy. Nothing in a work folder may be the only record of a decision.
