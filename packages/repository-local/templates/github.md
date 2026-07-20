# GitHub policy

This README is user-owned repository policy. Edit it directly when the policy
changes. Read current issues, labels, relationships, branches, pull requests,
and repository settings from GitHub and Git rather than treating this file as
cached state.

## Issue contract

{{issueConvention}}

## Label policy

{{labelPolicy}}

Labels express static category or readiness meaning only. This policy does not
create a triage queue, workflow state machine, generated agent brief,
implementation lock, or rejection database. Tracker history is the record of
prior issue decisions.

## Relationships

{{relationshipPolicy}}

## Specifications

{{specificationConvention}}

When asked to create or publish a specification:

1. Synthesize the context already agreed with the user.
2. Reopen discovery only when a material gap blocks a correct artifact.
3. Include the problem, desired behavior, acceptance criteria, settled
   decisions, and out-of-scope items.
4. Resolve an important test seam only when it remains material and unclear.
5. Publish only when requested or otherwise authorized.
6. Treat the result as a non-executable umbrella and do not automatically mark
   it ready for implementation.
7. Read back the published body, labels, state, URL, and relationships before
   reporting completion.

Publication does not authorize implementation.

## Executable tickets

{{ticketConvention}}

When asked to split work into issues:

1. Make each issue a complete, verifiable vertical slice.
2. Include explicit acceptance criteria and classify whether the issue can be
   completed autonomously or needs human input.
3. Add blockers only when another issue genuinely gates progress.
4. Keep parent/sub-issue hierarchy separate from dependency edges and reject
   dependency cycles.
5. Preserve the parent except for explicitly requested relationships.
6. Publish blockers before dependants when order matters.
7. Use expand–migrate–contract for broad compatibility-sensitive refactors.
8. Read back every body, label, hierarchy edge, and dependency edge after
   publication.

Unsupported native relationship mechanisms use one authoritative fallback:
record the relationship in the affected issue body and do not duplicate it in
shadow local state.

## Readiness

{{readinessPolicy}}

Readiness never grants implementation or external-mutation authority.

## Branches and pull requests

### Branches

{{branchConvention}}

### Pull requests

{{pullRequestConvention}}

### Merge policy

{{mergePolicy}}

## Publication and mutation

{{publicationPolicy}}

