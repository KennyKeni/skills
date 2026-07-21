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

A mission is a claimed umbrella work item. Its durable state has exactly two
homes, split by the repository's placement rule — content that justifies or
verifies the outcome goes on the ticket; content needed only to resume goes in
the work folder:

- **The mission umbrella ticket** records repository and mission identity,
  goal and non-goals, the validation contract and profile with current
  assertion and gate state, tracker and topology authority, the authorization
  boundary for local edits, branches or worktrees, commits, pushes, pull or
  merge requests, merges, deployments, ticket updates, and relationship
  mutations, constraining decisions, blockers, risks, unresolved questions,
  accepted evidence, and dispositions. When ongoing updates to the mission or
  umbrella issue are already authorized, that issue is the umbrella ticket;
  technical write access alone is insufficient. Otherwise create a local
  umbrella ticket through the repository's local-ticket convention, or as
  `TICKET.md` inside the work folder below when no convention exists. Never
  maintain two parallel records of the same content; external PRs, plans, and
  handoffs remain evidence or read-only references.
- **The umbrella's work folder** holds resume-only context: the active stage,
  feature, work item, PR, Git reference, agent and workspace ownership, owned
  claims, and the exact next action. Use the repository's local work-context
  convention — `work/<mission-slug>/` beside `.local/INDEX.md` by default —
  creating the folder when the mission starts and deleting it when the mission
  resolves. Nothing in the work folder may be the only record of a decision.

Derive `<mission-slug>` from a stable, concise mission identity using
lowercase ASCII letters, digits, and hyphens. Before creating a local ticket
or work folder, inspect what already exists. Reuse an artifact only when its
recorded repository and mission identity match. If a matching direct-execution
checkpoint exists, upgrade it in place when work becomes a mission. If the
candidate name belongs to unrelated work, use the first available numeric
suffix, such as `<mission-slug>-2`; never overwrite the unrelated artifact.

Keep a current-state snapshot rather than an activity diary. Update state
after contract approval, a material decision, feature or PR completion,
validation, stage transition, handoff, or proof supersession — not after every
turn. When the umbrella ticket is local, record its status and ISO 8601 UTC
timestamps in the ticket.

When the mission finishes, resolve the umbrella: complete its ticket through
the tracker's normal resolution, then tear down the work folder. When another
artifact takes over mid-mission, record the successor's canonical reference on
the superseded ticket before switching. Delete a preserved ticket only when
the user or an already-authorized cleanup workflow explicitly requests that
cleanup.

When tracker-native relationships define mission membership or dependencies,
treat that topology as authoritative. Query it fresh and never copy its nodes
or edges into local durable state. The umbrella ticket may record only the
topology authority, relevant tracker references, derived current observations,
and the exact next action. When no tracker topology has been designated
authoritative, the umbrella ticket may own the mission DAG; record that
authority explicitly and store the graph only there. Never merge a cached
tracker graph with a separate local canonical graph. For a locally owned
graph, keep membership hierarchy distinct from prerequisite edges, detect
dependency cycles, and derive readiness from current evidence rather than
persisting it as durable truth.

Immediately before dispatching a work item, fetch its ticket, active claims,
and blockers fresh; never dispatch from a cached frontier. Dispatch only when
the item is open, in authorized scope, executable rather than an aggregate
parent, contract-shaped, unclaimed, and free of open prerequisites, and when
every closed prerequisite completed compatibly with the dependent contract.
Follow a duplicate to its canonical work item and verify that outcome; an
unresolved disposition is not satisfied. Require every approval, integration,
workspace, PR, review, CI, deployment, and human gate that applies before work
may start.

Claim the selected work item per the repository's claim policy and confirm
the claim before dispatch; release it when implementation completes or is
deliberately relinquished. Never supersede another owner's active claim except
through the staleness rules the claim policy defines, and never treat
assignment, labels, or relationships as a claim.

## Adopt Approved Issue Decomposition

Use the repository workflow policy's tracker verb contract, relationship
authority, claim policy, and canonical ticket contract when interpreting or
mutating tracker state. After each authorized relationship mutation, read it
back, recheck affected dependency cycles, and rederive affected readiness.

When an approved tracking umbrella and executable leaves already exist, adopt
that graph as the baseline decomposition. Treat the umbrella as
non-dispatchable. Map complete leaf contracts and acceptance criteria to the
mission validation assertions instead of independently reslicing the work.
Reshape the graph only for evidenced gaps and only within the authorized
ticket and relationship mutation boundary.

Ticket labels, contracts, relationships, and assignment establish no execution
or delivery authority. Record the independently approved boundary for local
edits, branches or worktrees, commits, pushes, pull or merge requests, merges,
deployments, ticket updates, and relationship mutations.

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
  exists, record a prerequisite relationship per the tracker policy showing
  that the selected issue is blocked by it, and continue independent unblocked
  work. Create children beneath the
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
