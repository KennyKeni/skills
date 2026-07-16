# Issue Contract

This file is the sole normative template for issue readiness. Issue bodies,
triage comments, and execution workflows must point here rather than defining
competing templates.

## Issue kinds

A **tracking umbrella** owns the shared goal, scope, and completion denominator.
Apply one category label and the `tracking` state label. An umbrella is never
dispatchable.

An **executable leaf** owns one independently verifiable slice. Apply one
category label and either `ready-for-agent` for an AFK leaf or
`ready-for-human` for a HITL leaf, but only after every field below is complete.

## Tracking umbrella template

Every tracking umbrella uses this canonical core. Workflow-specific material
such as a PRD, refactor decisions, or testing notes may follow these sections as
supplemental content, but must not redefine them.

```markdown
## Goal

Describe the shared user or developer outcome this body of work must achieve.

## Scope

- State the behavior and boundaries owned by this umbrella.

## Out of scope

- State important exclusions that keep the work bounded.

## Completion denominator

- [ ] Name every independently verifiable outcome required before the umbrella
      can close, or link each outcome to its executable leaf once the breakdown
      exists.

```

The completion denominator is authoritative even before leaves exist. Native
tracker hierarchy is authoritative for umbrella membership when configured;
do not mirror that membership into a body-maintained list.

For a planned leaf, render the contract in the issue body. For a reporter-created
issue whose body must remain intact, render it in the latest maintainer-approved
`## Agent Brief` comment. That rendered contract is authoritative.

## Leaf template

```markdown
## Parent

Reference the tracking umbrella, or state that this issue is independent.

## Agent Brief

**Category:** bug / enhancement

**Execution:** AFK agent / human. For human execution, state the judgment,
access, design decision, or manual verification that prevents delegation.

**Summary:** One-line description of the required outcome.

### Current behavior

Describe the status quo or broken behavior.

### Desired behavior

Describe observable behavior after completion, including relevant errors and
edge cases.

### Key interfaces

- Name behavioral contracts, types, function signatures, configuration shapes,
  schemas, or externally visible boundaries that matter.
- Avoid file paths and line numbers that may become stale.

### Acceptance criteria

- [ ] Independently verifiable criterion 1
- [ ] Independently verifiable criterion 2
- [ ] Independently verifiable criterion 3

### Out of scope

- Adjacent behavior that this issue must not change.

## Dependencies

- Reference every prerequisite issue, or state `None - can start immediately`.
```

## Relationship authority

Use the relationship mechanism declared in `.local/agents/issue-tracker.md`.
On GitHub, native parent/sub-issue and blocked-by/blocking relationships are
authoritative; the `Parent` and `Dependencies` fields are supplemental. When a
configured tracker lacks a supported native mechanism, those fields are
authoritative. Never infer prerequisites from hierarchy or child order.

## Readiness is not authorization

An issue contract, label, relationship, or assignment establishes dispatch
eligibility only. The active workflow must independently authorize local edits,
branches or worktrees, commits, pushes, pull or merge requests, merges,
deployments, issue mutations, and relationship mutations.

## Implementation lock

`implementation-locked` is orthogonal to readiness. It marks implementation as
owned and in progress. The current owner may continue; another human or agent
must not begin implementation until the lock is removed. Removing the label
does not establish readiness or authorization, and adding it does not cancel or
interrupt work already active. Do not infer or propagate a lock through parent,
child, or dependency relationships.
