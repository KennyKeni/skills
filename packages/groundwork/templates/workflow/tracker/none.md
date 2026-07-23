## Tracker verb contract

No remote tracker is configured. When a skill or instruction says:

- **publish to the tracker** — create or update the local ticket at
  `work/<slug>/TICKET.md`; it is the authoritative work item.
- **fetch the ticket** — read `work/<slug>/TICKET.md`.
- **query the frontier** — list `work/*/TICKET.md` files whose status is open
  and whose `Blocked by:` entries are all resolved.
- **claim / release** — append a claim or release line under the ticket's
  `## Comments` heading (see Claims).
- **resolve** — mark the ticket done, then tear down its branch, worktree,
  and the rest of its `work/<slug>/` folder together.

## Issues

Work items are local tickets only, created when a piece of work is explicitly
requested or agreed. Discussion about published changes happens in change
review comments, not in a tracker.

## Specifications

A specification is a local ticket marked `Type: specification`. It is never
executable; implementation happens only through leaf tickets that reference
it. Publication does not authorize implementation.

## Executable tickets

Each executable ticket is a `work/<slug>/TICKET.md` with sections: What to
build, Acceptance criteria, Autonomy (`autonomous` or `needs-human` naming
the gating decision), and `Blocked by:` lines referencing other ticket slugs.

## Labels

No label system exists. Category and readiness are recorded as `Type:` and
`Status:` lines in the ticket file.

## Relationships

Hierarchy is recorded with a `Part of: <slug>` line and dependencies with
`Blocked by: <slug>` lines in the ticket file — the one authoritative record;
do not duplicate relationships elsewhere. Reject dependency cycles.

## Claims

Claim a ticket by appending a line under its `## Comments` heading naming the
session and intent; release the same way. The earliest unreleased claim wins.
Reread the ticket immediately before starting work.

## Readiness

A ticket is eligible when its outcome, acceptance criteria, and dependencies
are complete and unblocked. Readiness is eligibility only; it never grants
implementation or external-mutation authority.

## Local work context

`work/<slug>/` holds the authoritative `TICKET.md`, a `HANDOFF.md` recording
branch, worktree path, and resume state, and `scratch/` for everything else
in-flight. Delete the folder when the ticket resolves, promoting anything
durable into policy first. Drafts not yet tied to any ticket go in `scrap/`,
which is disposable and never citable. Nothing in `scratch/` or `scrap/` may
be the only record of a decision.
