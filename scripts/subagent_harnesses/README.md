# Subagent Harness Building Blocks

This package separates execution-harness mechanics from skill workflow policy.
Generators compose both dimensions into user-facing skills and references.

## Ownership

- `harnesses.yaml` owns shared harness identity, model profiles, and
  family-specific configuration.
- `catalog.py` validates and resolves harness configuration into workflow
  records.
- `generation.py` owns shared generator mechanics: Jinja setup, stale-output
  detection, atomic writes, and trash-safe cleanup.
- `templates/harnesses/<family>/` owns family-specific execution mechanics.
  Each family may provide command macros plus workflow adapters when Routing
  and Sidekick require different lifecycle semantics.
- Workflow directories such as `scripts/codex-subagent-routing/` and
  `scripts/sidekick/` own role policy, persistence rules, judgment boundaries,
  setup or lane registries, and output composition.

## Composition Rules

Share mechanics only when their operational meaning is the same. Preserve
these distinctions explicitly:

- bounded Routing assignments versus one persistent Sidekick context;
- native Codex controls versus external `codex exec` invocations;
- Cursor output modes selected by role or workflow;
- OpenCode event-stream, session, permission, and model-variant behavior; and
- workflow-specific model and validation policy.

Do not create a single template dominated by family and workflow conditionals.
Prefer small family components with explicit workflow façades.

## Change Safety

Make structural refactors byte-identical first. Run
`task skills:subagents:check` after every component move. Routing compatibility
hashes and generated-output checks must remain stable unless wording or
behavior is intentionally changed and reviewed separately.
