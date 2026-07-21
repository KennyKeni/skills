## Doctrine

Organize by technical responsibility in horizontal layers with one
dependency direction: presentation → service → data. A request enters a
controller, which delegates to a stateless service holding the business
logic, which calls a repository owning all persistence. A layer talks only
to the layer directly beneath it — no skipping layers, no upward imports.
Controllers stay thin; entities are data holders; behavior belongs to
services. Every feature follows the same path, so the shared mental model is
the point: do not restructure one feature differently from the rest.

## Layout and naming

```text
src/
  controllers/     # HTTP handlers            — OrderController
  services/        # business logic           — OrderService
  repositories/    # data access              — OrderRepository
  models/          # entities / data holders  — Order
  dtos/            # transport shapes         — CreateOrderRequest, OrderResponse
  middleware/
  config/
```

Suffixes carry the role: `*Controller`, `*Service`, `*Repository` (or `*Dao`).
One feature spans one file per layer folder — adding an `orders` feature
means `OrderController`, `OrderService`, `OrderRepository`, and its DTOs.
Language ecosystems map the same shape onto packages
(`com.app.controller` / `.service` / `.repository`) or PascalCase folders
(`Controllers/`, `Services/`, `Repositories/`).

## Seams

The repository interface is the one standard seam: define it beside the
service layer and implement it in the data layer, so business logic tests
run without a database. Service interfaces exist only under a concrete
reason (a genuine second implementation, a required proxy boundary) — a
single-implementation `FooService` + `FooServiceImpl` pair is ceremony, not
architecture. Everything else calls directly downward. Never reach upward
or sideways around a layer.

## Fit and failure modes

Right for CRUD-heavy line-of-business applications with moderate domain
complexity, where a universally understood convention matters more than
per-feature autonomy. Failure modes: shotgun surgery — one feature change
touches every layer folder; god services accumulating unrelated logic;
business rules leaking into controllers or ORM callbacks. When changes
cluster by capability rather than by layer and services keep growing,
migrate toward capability modules; record the decision in
[decisions/](decisions/) before restructuring.
