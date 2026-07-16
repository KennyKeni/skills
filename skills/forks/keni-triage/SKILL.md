---
name: keni-triage
description: Triage issues through a state machine driven by triage roles. Use when user wants to create an issue, triage issues, review incoming bugs or feature requests, prepare issues for an AFK agent, or manage issue workflow.
disable-model-invocation: true
---

# Triage

Move issues on the project issue tracker through a small state machine of triage roles.

## Reference docs

- [AGENT-BRIEF.md](AGENT-BRIEF.md) — guidance for applying the canonical issue contract to reporter-created issues

## Roles

Two **category** roles:

- `bug` — something is broken
- `enhancement` — new feature or improvement

Six **state** roles:

- `needs-triage` — maintainer needs to evaluate
- `needs-info` — waiting on reporter for more information
- `tracking` — non-dispatchable umbrella or aggregate
- `ready-for-agent` — fully specified, ready for an AFK agent
- `ready-for-human` — needs human implementation
- `wontfix` — will not be actioned

One orthogonal **control** role:

- `implementation-locked` — implementation is owned and in progress

Every triaged issue should carry exactly one category role and one state role.
The control role may coexist with any category or state and does not count
toward that invariant. If state roles conflict, flag it and ask the maintainer
before doing anything else. A `tracking` issue is never dispatchable.

These are canonical role names — the actual issue-tracker label strings may differ. Read `.local/agents/issue-tracker.md`, `.local/agents/triage-labels.md`, and `.local/agents/issue-contract.md`, then follow the tracker file's command conventions for every operation. Run `/keni-setup-matt-pocock-skills` if any file is missing. Do not create local issue files as a fallback.

`ready-for-agent` means contract-complete and eligible for agent
implementation. It grants no permission to edit, commit, push, open a pull or
merge request, merge, deploy, close issues, or mutate issue relationships.

`implementation-locked` means the current owner may continue implementation
but another human or agent must not begin. The lock does not change category,
state, readiness, relationships, or authorization. Removing it changes none of
those things. Adding it does not cancel or interrupt already-active work. Treat
it as issue-local; do not infer or propagate it through hierarchy or
dependencies.

State transitions: an unlabeled issue normally goes to `needs-triage` first; from there it moves to `needs-info`, `tracking`, `ready-for-agent`, `ready-for-human`, or `wontfix`. `needs-info` returns to `needs-triage` once the reporter replies. The maintainer can override at any time — flag transitions that look unusual and ask before proceeding.

## Invocation

The maintainer invokes `/keni-triage` and describes what they want in natural language. Interpret the request and act. Examples:

- "Show me anything that needs my attention"
- "Let's look at #42"
- "Move #42 to ready-for-agent"
- "Lock #42 while it is being implemented"
- "Unlock #42"
- "What's ready for agents to pick up?"

## Show what needs attention

Query the issue tracker and present three buckets, oldest first:

1. **Unlabeled** — never triaged.
2. **`needs-triage`** — evaluation in progress.
3. **`needs-info` with reporter activity since the last triage notes** — needs re-evaluation.

Show counts and a one-line summary per issue. Let the maintainer pick.

When listing issues available for new agent pickup, exclude
`implementation-locked` issues. A direct request may still inspect or triage a
locked issue.

## Triage a specific issue

1. **Gather context.** Read the full issue from the configured tracker (body, comments, labels, reporter, dates). Parse any prior triage notes so you don't re-ask resolved questions. Check `.local/agents/domain.md`; when it exists, explore the codebase using the configured local domain glossary and respecting ADRs in the area. Use the configured tracker's closed-decision search recipe to find conceptually similar rejected requests, then read every plausible match and surface its rationale.

2. **Recommend.** Tell the maintainer your category and state recommendation with reasoning, plus a brief codebase summary relevant to the issue. Wait for direction.

3. **Reproduce (bugs only).** Before any grilling, attempt reproduction: read the reporter's steps, trace the relevant code, run tests or commands. Report what happened — successful repro with code path, failed repro, or insufficient detail (a strong `needs-info` signal). A confirmed repro makes a much stronger agent brief.

4. **Grill (if needed).** If the issue needs fleshing out, run a `/keni-grill-with-docs` session.

5. **Apply the outcome:**
   - `ready-for-agent` — render the complete canonical contract in a maintainer-approved Agent Brief comment ([AGENT-BRIEF.md](AGENT-BRIEF.md)), verify it, then apply the label.
   - `ready-for-human` — render and verify the canonical contract with human execution selected and a concrete reason it cannot be delegated, then apply the label.
   - `tracking` — verify that the issue is an aggregate whose shared goal, scope, and completion denominator are complete, then apply the non-dispatchable role; no leaf contract is required.
   - `needs-info` — post triage notes (template below).
   - `wontfix` — post a durable tracker comment explaining the decision and rationale, apply the role, close the issue, and perform the configured rejection read-back. If this repeats a prior rejection, link the new issue to the historical issue and summarize whether the rationale still applies. Preserve the historical issue's closed state unless the maintainer explicitly asks to reopen it.
   - `needs-triage` — apply the role. Optional comment if there's partial progress.

## Quick state override

If the maintainer says "move #42 to ready-for-agent", trust the requested destination and skip grilling, but still require the canonical contract. Draft the Agent Brief from established evidence, confirm it and the role changes, publish and verify the brief, then apply the label. If required fields remain unresolved, recommend `needs-info` instead.

## Implementation lock

Add or remove `implementation-locked` through the configured issue-mutation
workflow and read back the result. Preserve the issue's category and state; do
not require an Agent Brief rewrite or state transition solely to change the
lock. When a locked issue changes state, report that it remains unavailable to
new implementers. Do not remove a lock held by another active owner.

## Needs-info template

```markdown
## Triage Notes

**What we've established so far:**

- point 1
- point 2

**What we still need from you (@reporter):**

- question 1
- question 2
```

Capture everything resolved during grilling under "established so far" so the work isn't lost. Questions must be specific and actionable, not "please provide more info".

## Resuming a previous session

If prior triage notes exist on the issue, read them, check whether the reporter has answered any outstanding questions, and present an updated picture before continuing. Don't re-ask resolved questions.
