## Doctrine

Do the simplest thing that works: one procedure per use case, written top to
bottom, calling the database directly. No layer folders, no domain model, no
ceremony. Structure is added only when duplication or complexity actually
hurts, and then only as much as the pressure demands — extract a helper, not
a layer. This is a deliberate architecture, not the absence of one: the rule
an agent must follow is to resist scaffolding, not to add it.

## Layout and naming

```text
main.* / app.*        # wiring and route registration
routes/  (or handlers/)
  create_order.*      # one procedure per use case
  get_user.*
db.*                  # single connection + query helper
models.* (optional)   # plain data shapes, no behavior
```

Files and functions are named for the use case (`create_order`,
`stripe_webhook`), never for a layer role — there are no `*Service` or
`*Repository` names here. A handful of larger files beats a deep tree;
splitting a file is justified by size, not by category.

## Seams

None by default. The database and external services are called inline from
the procedure. Introduce a seam surgically when a concrete need appears — a
real second implementation, or a test that cannot run without isolating one
effect — and keep it local to that one spot. An abstraction used once, added
for symmetry or habit, is a defect in this style.

## Fit and failure modes

Right for prototypes, internal tools, thin single-purpose services, CLIs,
and early products where the domain is thin and speed matters most. Failure
modes: copy-paste duplication as similar use cases multiply; invariants
enforced nowhere; a hard wall when genuine domain complexity arrives.
Graduation is an explicit decision, not drift: when it hurts, choose the
next style in [decisions/](decisions/) and migrate one behavior at a time
rather than restructuring everything at once.
