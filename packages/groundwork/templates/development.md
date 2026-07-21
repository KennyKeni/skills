# Development and review policy

This README contains non-obvious repository rules. It is user-owned after
setup. Read source, tests, manifests, scripts, Git, and the originating
requirement live rather than recording changing work state here.

## Verification

Run the following commands in the recorded order, subject to the scope and risk
of the change:

{{verificationCommands}}

## Testing

{{testingConstraints}}

## Worktrees

{{worktreeRules}}

A worktree whose work item is closed or unclaimed is stale. Teardown of the
branch, worktree, and work folder together is part of resolving the work item.

## Repository-specific review checks

{{reviewChecks}}

## Commit, migration, and generated-code rules

{{repositoryRules}}

## Environment

{{environmentRequirements}}

## Review contract

When reviewing changes:

1. Identify the intended base and compare it with `HEAD`.
2. Confirm the review point is stable enough to inspect and the diff is
   non-empty and meaningful.
3. Check this README and its linked, current repository standards.
4. Check the implementation against the originating requirement when one
   exists, including the live work item and later maintainer-approved
   decisions.
5. Treat accepted architecture policy as normative, proposed or superseded
   material as context only, and user-designated specifications as requirements.
6. An artifact may inform both standards and requirements when explicitly
   applicable, but evaluate failures on each axis separately.
7. Report the worst standards findings separately from the worst requirement
   findings when that distinction helps the user.
