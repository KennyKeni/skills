# Subagent Harness Building Blocks

This package separates execution-harness mechanics from skill workflow policy.
Generators compose both dimensions into user-facing skills and references.

## Ownership

- `harnesses.yaml` owns shared harness identity, model profiles, and
  family-specific configuration, including per-harness prose fields.
- `catalog.py` validates and resolves harness configuration into workflow
  records, deriving uniform fields (`scout_model`, `worker_model`,
  `*_model_argument`) so templates never branch on how models were declared.
- `generation.py` owns shared generator mechanics: Jinja setup, stale-output
  detection, atomic writes, and trash-safe cleanup.
- `templates/harnesses/<family>/` owns family-specific execution mechanics:
  command macros plus Routing and Sidekick adapters.
- Workflow directories such as `scripts/codex-subagent-routing/` and
  `scripts/sidekick/` own role policy, persistence rules, judgment boundaries,
  setup or lane registries, and output composition.

## Three Axes, Three Mechanisms

Harness content varies along three axes, each with its own declarative
mechanism:

- The **family axis** (codex-native, claude-native, cursor, opencode,
  codex-exec) varies structurally: different CLIs, session semantics, and
  command shapes. It is handled by template-file selection — a harness's
  `family` field routes to `templates/harnesses/<family>/`, and no template
  branches on family.
- The **model axis** (which model runs inside a family) varies only in facts
  and small prose: model IDs, cautions, capability menus. It is handled by
  YAML fields interpolated into the family template.
- The **lead axis** (which agent runs the skill: Codex or Claude) varies in
  lead facts (`lead_name`, validation context, whether a native executor
  exists) supplied by each workflow spec, and in which harnesses a lead's
  registry may select.

Nativeness is not a fourth axis; it is a relation between family and lead.
`NATIVE_FAMILIES` in `catalog.py` maps each native family to its lead
(codex-native → codex, claude-native → claude), harnesses derive `native_to`
from it, and the routing generator rejects a lane whose harness is native to a
different lead. The same executor can appear on both sides of the relation:
Codex is `codex-native` for a Codex lead and the external `codex-exec` family
for a Claude lead.

A harness entry is the join row of the family and model axes; a lane or setup
entry joins all three. If model facts ever need sharing across families beyond
what YAML anchors cover (see `x-snippets`), promote them to a first-class
`models:` section and reference them from harness entries; the flat entries
already keep family and model fields separate, so that promotion is
mechanical.

## Composition Rules

Templates contain structure only: headings, command macros, and interpolation
of data fields. Prose that differs between harnesses is authored as a YAML
field (`model_caution`, `model_choices_markdown`, workflow-level
`policy_note`), not branched in Jinja.

- Allowed template logic: loops over data, presence checks
  (`{% if execution.model_caution %}`), shape checks on derived structure
  (`model_mode == "capability"`), and structural macro flags (`writable`).
- Banned: branching on harness identity — `variant`, harness id, or any field
  that names which harness is rendering.

Reuse repeated YAML prose through anchors in the `x-snippets` block rather
than duplicating strings across entries.

## Routing Configuration

Define one spec per lead in `scripts/subagent-routing/leads/<lead>.yaml`: a
`lead` block (name, skill slug, native capability, validation context) plus
that lead's lane registry. Each classified lane configures `routine_scout`,
`consequential_scout`, `routine_worker`, `consequential_worker`, and
`validator`. Use `executor: lane` with `model_ref` to select a harness's
scout, worker, or capability-selected model — add `lane: <slug>` to route the
tier through a sibling lane, and `effort` when the target family configures
effort per route (codex-exec). Use `executor: native` with an exact `model`
and `effort` only for a lead that declares `native: true`. Set `fresh: true`
when the route requires a new independent context.

## Sidekick Configuration

Define one spec per lead in `scripts/sidekick/leads/<lead>.yaml`. Each setup
selects the persistent sidekick harness and declares a separate `validator`
route. Use `executor: native` with an exact model and effort for a lead with
native subagent control. Use `executor: lane` with `lane: <setup-slug>` and
`model_ref: worker` or `validator` to select a model exposed by another setup.
Every Sidekick validator route must set `fresh: true`.

## Change Safety

Keep structural refactors byte-identical. Wording changes happen in YAML
prose fields or template text, and their review surface is the regenerated
output diff: run `task skills:subagents:generate`, read the reference diffs,
and keep `task skills:subagents:check` green.
