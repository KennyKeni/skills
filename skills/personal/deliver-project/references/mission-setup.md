# Mission Setup

Read this file after selecting mission execution and before decomposition.

## Contents

- Establish current state
- Maintain durable state
- Adopt approved issue decomposition
- Define correctness before decomposition
- Shape features and PRs
- Handle gaps and scope changes

## Establish Current State

Derive state from user-approved scope, repository instructions, active issues
and PRs, project plans, current Git state, tests, CI, deployments, logs, runtime
behavior, and existing progress or decision artifacts.

Use project-defined stages when they exist. Do not invent stages solely to fit
the template.

When a mission has no project-defined stages or milestones, use its validation
contract as the completion denominator and define stable milestones from
coherent feature or PR integration boundaries. Record those boundaries during
setup and change them only when approved scope or evidence changes.

Treat governing instructions and approved decisions as normative intent,
current Git, test, CI, and runtime evidence as observed state, and progress or
handoff documents as refreshable snapshots. Never let a stale snapshot override
current evidence. Resolve normative conflicts by instruction priority and then
the latest specific approved decision. Ask the user or designated owner when a
coequal conflict would change scope, acceptance, ownership, or material risk.

## Maintain Durable State

Choose exactly one canonical writable state artifact:

- When ongoing updates to the mission or umbrella issue are already authorized,
  use that issue as the sole canonical state. Technical write access alone is
  insufficient. Do not create a local state file alongside it.
- Otherwise, use `.local/state/<mission-slug>.md` as the sole writable state.
  Keep it uncommitted and do not create permanent project documentation for
  execution state. External issues, PRs, plans, and handoffs remain evidence or
  read-only references; do not maintain a second state snapshot in them.

Derive `<mission-slug>` from a stable, concise mission identity using lowercase
ASCII letters, digits, and hyphens. Before creating a file, inspect existing
state files. Reuse a file only when its recorded repository and mission
identity match. If a matching direct-execution checkpoint exists, upgrade that
same file in place when work becomes a mission. If the candidate filename
belongs to unrelated work, use the first available numeric suffix, such as
`<mission-slug>-2.md`; never overwrite the unrelated file.

Use ISO 8601 UTC timestamps in `YYYY-MM-DDTHH:mm:ssZ` form. The canonical
artifact must always identify:

- status: `active`, `blocked`, `complete`, or `superseded`, plus `created_at`
  and `updated_at`;
- repository identity and mission identity, including the mission slug;
- authority kind: `mission-issue` or `local-state-file`, with the canonical
  issue URL or repository-relative file path;
- tracker authority and topology authority, including the tracker, umbrella
  issue when one exists, and whether tracker-native relationships or the local
  artifact own mission membership and prerequisite edges;
- the authorization boundary for local edits, branches or worktrees, commits,
  pushes, pull or merge requests, merges, deployments, issue updates, and
  relationship mutations;
- validation state: profile, contract or stable links, current assertion and
  gate state, and accepted evidence;
- active work: stage, feature, issue, PR, Git reference, ownership, integration
  boundary, and owned implementation locks as applicable;
- blockers, risks, and unresolved questions; and
- the exact next action.

When tracker-native relationships define mission membership or dependencies,
treat that topology as authoritative. Query it fresh and never copy its nodes
or edges into local durable state. The canonical artifact may record only the
topology authority, relevant tracker references, derived current observations,
and the exact next action. When no tracker topology has been designated
authoritative, a local state file may own the mission DAG; record that authority
explicitly and store the graph only there. Never merge a cached tracker graph
with a separate local canonical graph.

For a local graph, keep membership hierarchy distinct from prerequisite edges,
record the nodes and edges in the canonical local artifact, detect dependency
cycles, and derive readiness from current node and blocker evidence rather than
persisting it as durable truth. Refresh a selected node and its blockers
immediately before dispatch.

Immediately before starting implementation of a tracker issue, refresh its
labels. An unlocked issue may be selected normally. If
`implementation-locked` is present, continue only when the active mission
already owns that implementation; otherwise do not start it. When issue-label
mutations are already authorized, claim an unlocked issue by applying
`implementation-locked` and reading it back before dispatch. Remove and read
back an owned lock when implementation is complete or deliberately relinquished.
Never remove another owner's active lock. The label is issue-local; do not
propagate it through tracker relationships.

Keep a current-state snapshot rather than an activity diary. In addition to the
required fields above, retain goal and non-goals, constraining decisions, and
completed work with accepted evidence when they are material to continuation.

Update it after contract approval, a material decision, feature or PR
completion, validation, stage transition, handoff, or proof supersession. Do
not update it after every turn.

When the mission finishes, set `status: complete`, update `updated_at`, and add
`completed_at`. When another state artifact takes over, set
`status: superseded`, update `updated_at`, and add `superseded_at` plus the
successor's canonical reference. Preserve complete and superseded artifacts.
Delete one only when the user or an already-authorized cleanup workflow
explicitly requests that cleanup.

## Adopt Approved Issue Decomposition

When `.local/agents/issue-tracker.md` and `.local/agents/issue-contract.md`
exist, read them before interpreting tracker state. Use their configured
relationship authority and canonical issue contract.

When an approved tracking umbrella and executable leaves already exist, adopt
that graph as the baseline decomposition. Treat the umbrella as
non-dispatchable. Map complete leaf contracts and acceptance criteria to the
mission validation assertions instead of independently reslicing the work.
Reshape the graph only for evidenced gaps and only within the authorized issue
and relationship mutation boundary.

Issue labels, contracts, relationships, and assignment establish no execution
or delivery authority. Record the independently approved boundary for local
edits, branches or worktrees, commits, pushes, pull or merge requests, merges,
deployments, issue updates, and relationship mutations.

## Define Correctness Before Decomposition

Define a finite validation contract for the active mission or stage. Include:

- intended observable outcome;
- scope and non-scope;
- compatibility and ownership constraints;
- required interface, schema, data model, or behavioral properties;
- testable assertions defining completion;
- required evidence for each assertion;
- local acceptance assertions and evidence required for local completion;
- external delivery gates such as CI, review, deployment, or human approval;
- the authorized delivery boundary, such as local edits, commits, push, PR,
  merge, or issue updates.

Record `quality-first` as the validation profile unless the invocation
explicitly selects `balanced`. Do not downgrade the profile automatically to
save time, cost, or agent capacity.

Give assertions stable identifiers when several features or validators must
refer to them.

Define correctness independently of implementation. Do not weaken the contract
to match code that has already been written.

## Shape Features and PRs

When no approved decomposition exists, decompose work into coherent vertical
features that produce independently verifiable progress. When one exists,
shape only the evidenced gaps permitted above.

For each feature, state:

- owning stage, issue, and validation assertions;
- intended outcome and non-scope;
- verified source context;
- expected files, interfaces, schemas, or behavior;
- dependency and integration boundaries;
- required tests, evidence, PR, and review gates;
- known risks and escalation conditions.

Prefer one implementation owner per feature or PR.

Serialize work with evolving shared architecture, overlapping files, mutable
external state, or sequential reasoning. Parallelize only disjoint ownership
and integration boundaries.

Confirm that cross-cutting work belongs at the shared or platform layer and
domain-specific work remains with the appropriate owner.

## Handle Gaps and Scope Changes

At mission setup, record the authorized tracker, umbrella, whether relationships
define mission topology, and permitted issue and relationship mutations. For
tracker-backed missions likely to surface work, establish issue-creation and
relationship-mutation authority up front.

For each evidenced gap, have the lead check duplicates and choose a disposition
against the selected issue's acceptance contract. Subagents may identify and
shape gaps; only the lead publishes tracker issues and applies authorized
required relationships.

- Absorb a gap into the selected issue only when it is already within that
  issue's contract and does not warrant an independent ownership or validation
  boundary.
- When material separate work is required for the selected issue's acceptance,
  publish it within the mission topology. Make it a sibling when an umbrella
  exists, add a native dependency showing that the selected issue is blocked by
  it, and continue independent unblocked work. Create children beneath the
  selected issue only after approval reshapes that issue into a non-executable
  aggregate and amends its contract, topology, and denominator.
- When separate work contributes to the mission but is not required for the
  selected issue's acceptance, publish it as a non-blocking mission follow-up.
  Add it beneath an existing umbrella, link it from the selected issue, and
  complete that issue against its unchanged contract without a dependency.
- Publish actionable work outside the mission as an independent related issue
  outside the umbrella and mission completion denominator. Cross-cutting scope,
  reuse, or a different owner or lifecycle may support this disposition but
  cannot remove work required by the acceptance contract.
- For a duplicate or non-actionable observation, link the existing issue or
  record the non-actionable disposition; do not create another issue.

If publication is unauthorized or unavailable, record the discovery in durable
state as `pending-publication`. If only a required relationship mutation is
unauthorized or unavailable, record it as `pending-relationship`. Keep the
selected issue blocked whenever the pending work is required for its acceptance.
Report the constraint and preserve evidence, scope and non-scope, acceptance
criteria, ownership, dependencies, and blocker-or-follow-up status.

When implementation fails an assertion, mark the implementation and affected
stage failed. When evidence shows that an assertion itself is invalid or
outdated, propose a contract amendment with rationale; require approval from
the user or designated project owner before changing the assertion or
denominator.

When a discovery is new scope outside the original contract, record it
separately without silently changing the original denominator.
