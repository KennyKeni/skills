# Architecture policy

This README records stable guarantees, not a snapshot of the current tree.
Read the live codebase for module inventories, dependencies, hot spots, and
file locations. Edit this user-owned policy directly when architecture rules
change.

## Stable constraints

{{architectureConstraints}}

Architecture policy may cover module ownership and bounded contexts, allowed
dependency directions, invariants, public contracts and sanctioned seams,
approved adapters, external-system boundaries, generated-code ownership, and
constraints requiring explicit review.

## Authoritative shared sources

{{architectureSources}}

Only accepted, current sources are normative. Proposed material is context,
and superseded material cannot silently become an active requirement. Create a
decision record lazily only for a consequential trade-off that is difficult to
reverse or easy to accidentally undo.
