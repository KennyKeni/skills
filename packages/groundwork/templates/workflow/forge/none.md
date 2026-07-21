## Branches

No forge hosts this repository. Branch from the default branch with a short
kebab-case name linked to the work item's slug; one branch per work item.
Never commit directly to the default branch while a work item is in flight.

## Commits

Write imperative subjects of at most 72 characters describing the outcome.
Every commit leaves the tree building. Never include tool attributions,
co-author trailers, or work-state narration.

## Pull requests

There is no hosted review surface. Changes land by merging the work-item
branch locally after verification passes. Record material decisions and the
verification performed in the work item before merging.

## Merges

Merge the work-item branch into the default branch only after the recorded
verification commands pass and the merge is explicitly authorized. Delete the
branch after merging.

## CI gates

No hosted CI gates merges. The recorded verification commands are the merge
gate; a failing verification run blocks the merge exactly as required CI
would.

## Publication and mutation

There is no remote state to mutate. Local merges into the default branch
still require explicit authorization or an already-authorized workflow.
