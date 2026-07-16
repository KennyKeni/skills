---
name: keni-design-an-interface
description: Generate multiple radically different interface designs for a module using parallel sub-agents. Use when the user wants to design an API, explore interface options, compare module shapes, or mentions "design it twice".
---

# Design an Interface

Generate multiple radically different designs before selecting a module or API
interface. Use `keni-prototype`'s UI branch for visual layouts.

## Gather Requirements

Establish:

- the problem the module solves;
- its callers;
- its key operations;
- performance, compatibility, and existing-pattern constraints;
- what the interface should hide.

Ask the user only for decisions or context that cannot be discovered from the
codebase.

## Generate Designs

Use the runtime-native subagent mechanism to generate at least three designs in
parallel. Give every designer a bounded, read-only assignment with fresh
context, `fork_turns: "none"` when supported, and an explicit no-delegation
boundary.

Assign a different constraint to each design, such as:

- minimize method count;
- maximize flexibility;
- optimize the common case;
- follow a relevant paradigm or library.

Require each designer to return:

1. Interface signatures.
2. Caller usage examples.
3. Complexity hidden behind the interface.
4. Trade-offs.

## Compare And Select

Present each design before comparing them. Evaluate interface simplicity,
specialization versus generality, implementation efficiency, depth, ease of
correct use, and ease of misuse.

Ask the user which design best fits the primary use case and whether elements
from other designs should be incorporated. Do not implement the design.

## Return The Decision

Return the selected interface, rejected alternatives and reasons, and unresolved
risks in the conversation. Write them elsewhere only when that destination is
already authorized.
