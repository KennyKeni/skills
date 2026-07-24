---
name: klin-grill-me
description: Stress-test a plan, design, decision, proposal, or idea through dependency-aware rounds of questions. Use when the user asks to be grilled, pressure-tested, walked through every decision or assumption, or interviewed or challenged about a plan or decision, including requests to "grill me," "batch grill this," or "stress-test this plan."
---

# Klin Grill Me

Drive an explicit decision interview to shared understanding. Map the subject as
a decision tree, resolve discoverable facts independently, and ask every
currently unblocked decision through coherent rounds.

Do not implement the plan or take consequential follow-on action during the
interview.

## Load Local Context

Before forming questions:

- Inspect the environment for facts the user should not need to supply.
- When the repository contains `.local/INDEX.md`, read it first and follow only
  the links relevant to the subject being grilled.
- Treat recorded constraints and accepted decisions as settled unless current
  evidence contradicts them. Surface contradictions instead of silently
  reopening or overriding them.
- Follow repository instructions and the active harness's routing policy.
  Investigate directly by default. Use bounded parallel exploration only when
  authorized, available, and useful; never require subagents merely because a
  fact must be found.

Do not create `.local/`, invent its schema, or assume that its contents are
shared across machines. When `.local/INDEX.md` is absent, use the repository's
normal instructions and artifacts.

## Build the Decision Tree

Separate the subject into:

- facts that can be discovered;
- decisions the user must make;
- dependencies between those decisions; and
- consequences, risks, edge cases, and failure modes hanging from each branch.

A decision belongs on the frontier only when its prerequisites are settled.
Do not ask a question whose answer depends on another open question in the same
round.

Keep the tree as working state in the conversation. Do not turn it into a
durable artifact unless the user requests persistence or an established
repository workflow explicitly requires it.

## Run Rounds

For each round:

1. Recompute the frontier from the user's latest answers and newly discovered
   facts.
2. Resolve discoverable facts before asking the user. If an investigation is
   still running, block only its downstream decisions and continue with the
   independent frontier.
3. Select a coherent batch from the current frontier and ask it as a numbered
   list. Retain any unasked frontier decisions as ready, not dependency-blocked.
4. For every question, include:
   - the decision in concrete terms;
   - a recommended answer when evidence and settled criteria support one;
     otherwise, name the missing criterion or uncertainty;
   - the most important tradeoff or consequence.
5. Wait for the user's answers before computing the next round.

Keep each question independently answerable. Prefer a small coherent round over
an exhaustive dump when many nominally independent questions would overwhelm
the user; explain the grouping and preserve the remaining frontier.

When an answer is ambiguous, inconsistent, or changes an upstream premise,
state the conflict and ask the smallest clarifying question needed. Then
recompute every affected branch rather than continuing from a stale tree.

Challenge omissions and convenient assumptions. Cover relevant scope,
ownership, users, interfaces, data, failure handling, security, migrations,
operations, testing, rollout, reversibility, and success criteria without
forcing irrelevant categories onto the subject.

## Finish Deliberately

The interview is complete only when:

- the frontier is empty;
- material branches, risks, and edge cases have been visited;
- settled decisions and remaining uncertainty can be summarized clearly; and
- the user confirms that shared understanding has been reached.

Present a concise final synthesis before requesting confirmation. Distinguish:

- settled decisions;
- assumptions and verified facts;
- explicitly deferred or unresolved questions; and
- recommended next action after the interview.

Do not write documentation or begin implementation without authorization.
When the user asks to persist the result, follow `.local/INDEX.md` and its
linked repository policy only when it is explicitly identified as established.
Treat proposals, plans, and reference snapshots as evidence rather than
authority. If no persistence route is established, use an existing repository
workflow or ask where to persist. Never substitute hard-coded context, ADR, or
tracker paths for the repository's configured locations.
