## Branches

{{branchConvention}}

Never commit directly to the default branch. Delete the branch on merge.

## Commits

{{commitConvention}}

Never include tool attributions, co-author trailers, or work-state narration.

## Merge requests

{{pullRequestConvention}}

Never claim verification that was not performed. Respond to review comments
with code changes or explicit reasoned pushback; do not silently resolve
threads. Do not merge, approve, or dismiss reviews without explicit
authorization.

## Merges

{{mergePolicy}}

Confirm the project's enabled merge methods from settings rather than
assuming.

## CI gates

{{ciGatePolicy}}

A red merge request is never merged. What the pipeline runs is defined by the
development policy; this section owns only what gates a merge.

## Publication and mutation

{{publicationPolicy}}

Technical permission never substitutes for workflow authorization. Read back
every remote mutation before reporting it.
