# GitHub Mission Graph

Read this file when an authorized mission uses a GitHub umbrella issue and
native issue relationships. Keep GitHub-specific topology out of missions that
use another tracker or local-only state.

## Separate Hierarchy From Dependencies

Within the mission dependency model, treat native GitHub relationships as
authoritative for issue topology. Use parent and sub-issue relationships for
mission membership and decomposition. Use `blocked by` and `blocking`
relationships only for real prerequisite edges. Never infer a dependency from
hierarchy, sub-issue order, labels, milestones, or proximity. Allow a related
external blocker to remain outside the umbrella hierarchy.

When `.local/agents/issue-contract.md` exists, use it as the canonical leaf
contract and treat tracking umbrellas as non-dispatchable. Labels, contracts,
relationships, and assignment establish no execution or delivery authority.

Do not interpret this topology boundary as a restriction on issue content.
When issue updates are authorized, continue recording shared goals, scope,
validation contracts and profiles, decisions, progress, blockers, evidence,
dispositions, and collaborator-facing next steps on the relevant umbrella and
feature issues.

Keep validation contracts, completion evidence, runtime agent and workspace
ownership, authorization, PR and CI state, deployment gates, and the exact next
action in the sole canonical state artifact selected by `mission-setup.md`.
GitHub issues and PRs may still own their native workflow facts and evidence,
which the canonical artifact can reference. Do not persist or mirror GitHub
relationship nodes or edges in local durable state. Treat transient query
results and derived readiness as disposable observations, not dispatch
authority.

## Refresh And Derive Readiness

At setup and resumption, recursively refresh the umbrella descendants,
candidate issue states and state reasons, and reachable dependency edges.
Traverse every page and reconcile relationship totals when the source exposes
them. Detect cycles among open dependency edges without treating hierarchy as
a dependency edge. Derive the ready frontier from current evidence; do not
store `ready` as durable truth.

Immediately before dispatch, reread the selected issue and its blockers. Treat
it as dispatchable only when it is open, in authorized scope, executable rather
than an aggregate parent, contract-shaped, not already owned or active, and has
no open native blocker. Confirm that every closed blocker was completed in a
way compatible with the dependent contract. For a duplicate, follow its
canonical issue and verify that outcome; do not treat `not planned` or another
unresolved disposition as satisfied without an approved contract change. Also
require every approval, integration, workspace, PR, review, CI, deployment,
and human gate that applies before work may start.

Treat `implementation-locked` as an ownership lock, not a readiness state. An
unlocked issue may be claimed normally. If the label is present, dispatch only
when the active mission already owns that implementation. When issue-label
mutations are already authorized, claim the issue by adding the label and
reading it back before dispatch; remove and read it back when the owner
completes or relinquishes implementation. Never remove another owner's active
lock, and do not infer or propagate locks through GitHub relationships.

## Mutate Relationships Safely

Record the authorized GitHub host and repository scope and separate
authorization for creating issues; adding, removing, or reparenting sub-issues;
adding or removing dependency edges; closing or reopening issues; and making
other issue updates. Technical permission never substitutes for workflow
authorization. After each authorized relationship mutation, read it back,
recheck affected dependency cycles, and rederive affected readiness.

Follow the interface and capability requirements in
`.local/agents/issue-tracker.md`. When it configures the CLI, verify the active
`mise`-managed version and the required hierarchy and dependency flags and JSON
fields before mutation. Do not silently switch interfaces or replace native
relationships with body references.

Do not add a custom graph CLI or mandate a JSON schema until repeated traversal,
pagination, cycle, or reconciliation failures demonstrate the need. When an
existing GitHub topology is authoritative but relationship writes are
unauthorized, keep it read-only and propose changes instead of creating a
competing local graph. Use a local graph authority only when no tracker topology
has been designated authoritative.
