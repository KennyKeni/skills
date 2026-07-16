# Quality-First Validation

Read this file only when the active validation profile is `quality-first`. Use
this profile to select validation cadence; do not weaken the validation
contract, deterministic checks, completion rules, or finding standards.

Run a fresh validator after every substantive coherent change and every
meaningful integration milestone passes its focused gates.

Treat a change as substantive when it affects runtime behavior, non-mechanical
application logic, externally consumed interfaces, schemas, data semantics,
security boundaries, concurrency, migrations, or required acceptance proof.
Documentation, copy, formatting, generated output, and deterministic mechanical
transformations do not require a validator solely by category when focused
checks directly prove the intended result. Escalate any such change when its
actual risk or uncertainty is substantive.
