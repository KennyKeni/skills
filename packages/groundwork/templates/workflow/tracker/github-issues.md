## Tracker verb contract

When a skill or instruction says:

- **publish to the tracker** — create or update the GitHub issue with `gh`.
- **fetch the ticket** — read the issue with `gh issue view`, including
  comments, parent, sub-issue, and dependency fields.
- **query the frontier** — list open leaf issues with no open blocked-by
  dependencies and no active claim.
- **claim / release** — post a claim or release comment (see Claims).
- **resolve** — close the issue, then tear down its branch, worktree, and
  `work/<slug>/` folder together.

Every work item has exactly one authoritative home: this tracker. A local
ticket alongside a remote issue is supplementary and must link upward.

## Issues

{{issueConvention}}

## Specifications

{{specificationConvention}}

Specifications are never executable; implementation happens only through leaf
tickets attached as sub-issues. Publication does not authorize implementation.

## Executable tickets

{{ticketConvention}}

Publish blockers before dependents so edges reference real issue numbers.

## Labels

{{labelPolicy}}

Labels carry only category and readiness meaning. Blocked-ness lives in native
dependencies and claims live in comments, never in labels. The triage queue is
derived, not labeled: open issues with no readiness label.

## Relationships

{{relationshipPolicy}}

Hierarchy and dependency are distinct axes — a sub-issue is not implicitly
blocked by its siblings. Reject dependency cycles. Read every relationship
mutation back before reporting it.

## Claims

{{claimPolicy}}

Post the claim, then list comments: the earliest active claim wins; if it is
not yours, back off. Reread the issue and its comments immediately before
dispatch; never rely on a cached frontier.

## Readiness

{{readinessPolicy}}

Readiness is eligibility only. It never grants implementation or
external-mutation authority.

## Local work context

{{workContextPolicy}}

If it justifies or verifies the outcome it goes in the ticket; if it is only
needed to resume, it goes in the work folder; if it constrains future work, it
goes in policy; if it is none of those yet, it goes in `scrap/`, which is
disposable and never citable. Nothing in a work folder or `scrap/` may be the
only record of a decision.
