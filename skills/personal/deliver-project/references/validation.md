# Validation and Completion

Read this file when a PR or milestone is coherent and before declaring
completion.

## Contents

- Review coherent boundaries
- Determine completion
- Report progress

## Review Coherent Boundaries

Use the PR as the normal code-review unit.

Before independent validation, require the implementation owner to inspect the
complete diff, compare it with the feature contract, run focused checks,
resolve known failures, and report uncertainty.

Have the lead inspect the diff, repository state, acceptance evidence, and
unrun checks before deciding whether the change is ready for independent
validation or completion.

Apply the active validation profile after a change is coherent and its focused
gates pass. When the profile requires independent validation, run one fresh
validator. Do not run a full review after every WIP commit.

Use a lead-owned intermediate decision checkpoint, not a completed-change code
validator, only before:

- a hard-to-reverse architecture, API, schema, security, or migration decision;
- repeating the first vertical slice across a broad surface;
- continuing through concrete implementation uncertainty;
- integrating work whose assumptions materially changed.

Record the proposed decision, alternatives, contract and ownership constraints,
supporting evidence, reversibility or rollback, affected assertions, and any
required approver. Pass the checkpoint when the lead confirms consistency with
the contract and project doctrine and every required owner approves it. Use a
scout only to gather missing evidence; keep the decision with the lead.

Treat authentication and authorization, security boundaries, data migrations,
public API or schema compatibility, concurrency, irreversible operations, and
large cross-cutting diffs as high-risk.

For every high-risk change, including direct execution, run a fresh validator
after implementation and focused gates pass. When the risk surface warrants
distinct proof, separate implementation scrutiny from black-box or integration
validation.

Require validators to distinguish contract failures, probable defects, risks
requiring investigation, optional improvements, and unsupported preferences.

Before a finding can block delivery, require it to satisfy all of these
conditions:

- state an observable impact on the validation contract, correctness,
  security, data integrity, or required proof;
- cite the specifically affected code path or behavior and supporting
  evidence;
- concern behavior introduced or exposed by the current change, unless the
  contract explicitly includes pre-existing remediation;
- rely on verified project facts rather than unstated assumptions or
  speculative reachability;
- account for documented intent, ownership rules, and accepted project
  doctrine;
- be discrete, actionable, and proportionate to the repository's existing
  rigor.

Have the lead, not the validator, classify each finding:

- **Block delivery:** an admissible contract failure, observable correctness
  or security defect, data loss risk, weakened required hard-fail, missing
  acceptance criterion, or test that does not prove required behavior.
- **Fix if cheap, otherwise follow up:** a verified ownership or
  maintainability problem without an observable contract failure.
- **Do not block:** style, minor optimization, monolith size, generalized
  architecture preference, speculative call reachability without observable
  effect, documented intentional behavior that does not violate the active
  contract or correctness and security requirements, duplicate findings, or
  unrelated pre-existing scope.

Allow the lead to dismiss unsupported, duplicate, or non-actionable findings.
A non-blocking actionable finding still requires a follow-up disposition.
Require the user or designated project owner to waive a validated blocker or
material accepted risk. Findings do not amend the contract, create scope, or
automatically trigger implementation or review.

A linked tracker follow-up resolves a verified non-blocking actionable finding.
When publication or a required relationship mutation is unauthorized or
unavailable, `pending-publication` or `pending-relationship` may resolve the
selected work item's local completion only when the finding is outside its
acceptance contract and the constraint is reported. Neither state resolves a
stage or mission denominator containing the discovered work.

Assign material fixes to an implementation owner while keeping validators
independent from their requested fixes.

After fixes, revalidate only the changed delta and affected assertions. Scope
the delta validator to the requested fixes and their observable fallout. Do
not launch another full review merely because a correction was made. Repeat a
full review only when scope, architecture, security boundaries, schema, or
integration behavior materially changed.

Do not let a validator request another validator or reopen the complete review
cycle. A new finding during delta revalidation may block when it satisfies the
criteria above and concerns behavior introduced or exposed by the original
reviewed change or its fix delta. Reopen only affected assertions; disposition
unrelated findings separately. Once targeted revalidation passes, admissible
blockers are resolved or accepted, and any already-required full gate passes,
close the review cycle.

Do not continue review loops for unsupported findings, stylistic disagreement,
or accepted behavior.

By default, bound one review cycle to one full review and at most two delta
revalidation rounds; any additional round requires an explicit lead decision
for a named unresolved admissible blocker rather than automatic continuation.

At stage completion, run integration and regression validation across the
stage's PRs. Do not line-by-line re-review every accepted PR.

## Determine Completion

Mark a direct change locally complete when its local acceptance assertions pass,
focused validation passes, and material findings are resolved or accepted by
the user or designated project owner.

Mark a feature locally complete only when its local acceptance assertions pass,
required evidence exists, and material findings are resolved or accepted by the
user or designated project owner.

Mark a stage locally complete only when all local assertions in its denominator
pass, integration and regression evidence exists, every evidenced gap has a
disposition, and no required work is silently omitted.

Mark a mission locally complete only when every required local stage or feature
assertion passes, cross-feature integration and regression evidence exists, and
every evidenced gap has a disposition. When no stages exist, use the mission
contract itself as the denominator.

Revalidate only assertions materially affected by later changes. Do not
re-prove unrelated completed work.

Do not report completion from isolated tests, implementation claims, or
assumptions. Do not expand accepted work after its contract is satisfied
unless new evidence or user direction changes scope.

Distinguish locally complete, ready for an external gate, and delivered. Do not
block local completion merely because an unauthorized or unavailable external
gate remains. Mark work delivered only when its authorized delivery boundary
is reached.

## Report Progress

At meaningful checkpoints, report the active stage, issue, feature, and PR;
completed work with evidence; remaining assertions; active ownership;
blockers, risks, decisions, and the next action.

Report whether the current result is locally complete, ready for an external
gate, or delivered.

Prefer assertion counts and explicit states such as not started, in progress,
proven, blocked, or unproven.

Report a percentage only when a stable numerator and denominator exist and the
user or project requires it. Name both and identify the evidence that changed
them. Do not carry an old percentage forward without re-deriving it.
