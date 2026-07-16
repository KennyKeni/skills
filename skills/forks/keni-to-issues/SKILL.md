---
name: keni-to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertical slices. Use when the user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
disable-model-invocation: true
---

# To Issues

Break a plan into independently verifiable tracer-bullet issues.

Read `.local/agents/issue-tracker.md`, `.local/agents/triage-labels.md`, and
`.local/agents/issue-contract.md` before drafting or mutating issues. Run
`keni-setup-matt-pocock-skills` if any are missing. Follow the configured tracker
interface for every operation. Publish only to that tracker.

## Gather Context

Work from the current conversation. When the user supplies an issue reference,
fetch its body, comments, labels, and native relationships. Treat a PRD or
tracking issue as the umbrella, never as an executable leaf.

Explore the codebase when needed. Use `.local/agents/domain.md` and its
configured local domain vocabulary and ADRs when present.

## Draft Vertical Slices

Each slice must deliver a narrow, complete path through every affected layer
and be independently demoable or verifiable. Prefer many thin slices over a
few horizontal or cross-cutting tickets.

Classify each slice:

- **AFK:** the contract is complete enough for implementation without another
  product or design decision.
- **HITL:** a human decision, access gate, design review, or manual step remains.

AFK and HITL classify readiness; neither grants permission to edit, commit,
push, open a pull or merge request, merge, deploy, or mutate issues.

## Approve The Breakdown

Use the automatic path only when the skill was model-triggered from settled
conversation context, a pre-existing tracking umbrella in the configured
tracker is identified, every contract field and dependency is already
resolved, every slice is AFK, and the configured tracker declares working
native hierarchy and dependency mechanisms with exact write and read-back
commands. Verify those capabilities before mutation. Treat that settled
context as approval and show the published breakdown in the completion summary.

Otherwise present a numbered list with title, AFK/HITL type, prerequisites,
and covered user stories. Ask whether granularity, dependencies, and
classifications are correct. Iterate until the user approves the breakdown.

## Configured Native Relationships

When the configured tracker declares native hierarchy and dependencies:

- Attach every generated slice to its umbrella with the configured native
  relationship.
- Represent every real prerequisite with the configured native dependency
  relationship.
- Treat `Parent` and `Dependencies` text as supplemental; it never substitutes
  for native relationships.
- Keep hierarchy and dependencies distinct. Child order never implies a
  prerequisite.
- Read back the complete sub-issue list and every dependency edge after
  mutation.
- Do not report publication complete while an intended relationship is absent
  or a dependency cycle exists.

Use the exact commands, version requirements, and read-back recipes in
`.local/agents/issue-tracker.md`. If either native relationship capability is
unsupported or cannot be verified, leave the automatic path and request
breakdown approval. After approval, use every supported native mechanism; for
an unsupported mechanism, the canonical contract's `Parent` or `Dependencies`
field is authoritative. Do not invent a competing graph.

## Publish Executable Leaves

Publish blockers before their dependents so real identifiers are available.
Render every planned leaf from the sole normative template in
`.local/agents/issue-contract.md`; do not define another issue template here.

For each leaf:

1. Create the issue with the complete rendered contract.
2. Create the authorized native hierarchy and dependency relationships required
   by the configured tracker.
3. Read back the issue body, relationships, and labels.
4. Apply the configured category label.
5. Apply `ready-for-agent` only to a complete AFK leaf, or `ready-for-human` to
   a complete HITL leaf.
6. Read back the final state and confirm the contract and graph match the
   approved breakdown.

When the source is an existing parent issue, preserve its title, body, labels,
and state. Relationship mutations do not authorize other parent mutations.
