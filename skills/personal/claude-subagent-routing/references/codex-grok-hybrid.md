# Codex-Grok 4.5 Hybrid Policy

Use this mixed policy to spend Grok 4.5 on routine work while reserving native
Codex Sol at high effort for consequential work. This policy selects an
execution lane; it does not introduce new roles.

Before the first assignment through each selected execution lane, read the
main skill's directly linked `opencode-grok.md`, `cursor-grok.md`, or
`codex-quality.md` reference. Reuse loaded references for later assignments in
the current context.

## Select The Grok Harness

Treat the Grok execution harness as a routing attribute separate from role and
routing class. Honor an explicit `OpenCode` or `Cursor` request for each routine
assignment. Otherwise use the active mission's recorded Grok harness preference;
when neither supplies one, default to OpenCode for backward compatibility.

Record the selected harness in the assignment packet. Keep focused follow-ups
in the same OpenCode session or Cursor chat. Do not switch harnesses mid-session;
start a new session only when the user or active mission selects another harness
or the current harness is unavailable and fallback is authorized.

## Classify The Scout

Record a routine scout when it has one explicit, bounded question, a clear stop
condition, and an answer that direct file, line, command, log, or
authoritative-source evidence can settle. The search may span a large
repository or source set when the question and stop condition remain bounded.

Record a consequential scout when it must reconcile contradictory evidence,
diagnose an unknown cause across coupled subsystems, trace cross-repository
dependencies or security and data flows, or gather evidence that determines
architecture or another high-impact implementation approach.

A scout may remain routine when its purpose is to discover the applicable
pattern; an existing pattern is not a prerequisite for bounded retrieval.

## Classify The Worker

Record a routine worker when all four gates pass and no consequential trigger
below applies:

- the behavior, contract, and acceptance assertions are explicit;
- the change has bounded ownership and scope, with no unresolved material
  design decision;
- failure has contained impact and the change is reasonably recoverable; and
- correctness has reliable, task-local proof through automated tests,
  deterministic commands, or clear visual or manual verification.

Treat an established pattern, mechanical repetition, backward compatibility,
and direct automated tests as strong confidence signals, not prerequisites.

Record a consequential worker when any condition is true:

- requirements involve ambiguity, product judgment, architecture, or a choice
  among materially different approaches;
- work requires coordinated changes across behaviorally coupled subsystems,
  contracts, or consumers;
- failure has broad blast radius or rollback is difficult;
- concrete coupling requires coordinated state, ordering, cross-service calls,
  shared contract consumers, or concurrency-sensitive behavior;
- implementation changes a trust boundary or security-relevant behavior,
  including authentication, authorization, session or token lifecycle,
  credential or secret handling, permissions, tenant isolation, cryptography,
  or validation at an exposed boundary;
- the assignment materially affects externally consumed contracts,
  production-data semantics, destructive or irreversible migrations, or
  rollout-sensitive infrastructure;
- correctness depends on production-only state, consequential concurrency or
  performance behavior, or evidence that cannot be reproduced reliably within
  the assignment; or
- the acceptance assertions do not have clear, checkable proof.

Small net-new features, routine integration work, visual changes, and changes
across multiple independent files may remain routine. Documentation, copy,
fixtures, and mechanical refactors around security surfaces may remain routine
when they leave security behavior unchanged. Test fixtures, local seed data,
additive patterned APIs, backward-compatible migrations, and routine
automation are not consequential by category; classify their ambiguity,
coupling, impact, recoverability, and proof.

Default uncertainty to `consequential`. Size alone does not determine the
routing class.

## Route The Tier

Use these mappings:

- routine `scout`: selected Grok harness with Grok 4.5;
- consequential `scout`: native Codex Sol at high effort;
- routine `worker`: selected Grok harness with Grok 4.5;
- consequential `worker`: native Codex Sol at high effort;
- every `validator`: fresh native Codex Sol at high effort.

Skip the scout when the main skill's delegation criteria do not justify one.
Keep `scout`, `worker`, and `validator` as the canonical roles and include the
routing class, selected execution lane, and Grok harness in the assignment
packet.

## Escalate On Evidence

Promote a routine assignment to consequential before spawning when any
consequential trigger is known. Promote a routine scout when it cannot settle
the explicit question within its bounded search budget or encounters material
contradictions. Promote a routine worker after two materially different
unsuccessful approaches, concrete coupling evidence, failure to produce
acceptance-aligned proof, or discovery of a high-consequence implication.

Treat lead or validator findings as new routing evidence. Return bounded
corrections to the same routine session only while every correction remains
routine; when a correction triggers consequential classification, apply the
escalation boundary below.

Stop the routine assignment at that boundary and return its verified evidence.
Give a fresh Sol-high scout or worker a compact handoff containing the
contract, observations, attempted proof, changed files when applicable, and
unresolved questions. Treat Grok self-checks as worker evidence; retain
independent Sol-high validation.
