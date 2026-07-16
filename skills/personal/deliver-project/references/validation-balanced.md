# Balanced Validation

Read this file only when the active validation profile is `balanced`. Use this
profile to select validation cadence; do not weaken the validation contract,
deterministic checks, completion rules, or finding standards.

Run a fresh validator after every meaningful integration milestone and for
every high-risk change. For other direct changes or PRs, also run a fresh
validator when any of these signals apply:

- requirements or observable behavior remain ambiguous;
- the change crosses behavioral ownership or coupled subsystem boundaries;
- tests are missing, flaky, indirect, or do not exercise the behavior that
  matters;
- implementation changed direction materially or required several distinct
  approaches;
- the diff is broad, difficult to reverse, or depends on production-only state;
- passing checks leave material uncertainty about the contract; or
- the lead cannot explain why the available proof is sufficient.

Skip a fresh validator only when the change has bounded ownership, explicit
acceptance assertions, contained and recoverable failure, direct deterministic
proof for every affected assertion, and no material lead uncertainty. A skipped
mission change remains subject to fresh milestone validation. A skipped direct
change may complete without independent agent review when all common completion
requirements pass.
