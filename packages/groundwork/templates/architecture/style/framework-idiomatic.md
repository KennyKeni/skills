## Doctrine

The framework's conventions are the architecture. Do not invent structure;
place and name things where the framework expects them so its routing,
autoloading, generators, and tooling keep working. Business logic hangs off
the framework's own units — models, views, providers — and structure is
added reactively (a service object, a form object) only when one of those
units demonstrably outgrows itself. Never impose an external architectural
pattern over the framework's grain; conforming is the discipline.

## Layout and naming

Dictated by the framework — follow its documentation and generator output.
Reference shapes:

- **Rails**: `app/models/` (`User < ApplicationRecord`), `app/controllers/`
  (`UsersController`, RESTful actions), `app/jobs/`, `config/routes.rb`,
  `db/migrate/`; community-conventional `app/services/` for service objects.
- **Django**: per-app `models.py`, `views.py`, `urls.py`, `admin.py`,
  `migrations/`; DRF adds `serializers.py`; a hand-added `services.py` when
  views or models bloat.
- **Laravel**: `app/Models/`, `app/Http/Controllers/`, `app/Http/Requests/`,
  `routes/web.php` / `routes/api.php`, `database/migrations/`.
- **NestJS**: feature modules — `users.module.ts`, `users.controller.ts`,
  `users.service.ts`, `dto/`, entities — wired by decorators and DI.

The handler is the framework controller or view; the business-logic unit is
the model method, manager, or provider; the data-access unit is the ORM
model itself.

## Seams

The ORM model is the data-access unit — do not wrap active-record style
models in repository interfaces; it fights the framework and breaks its
tooling. Direct model queries from controllers or views are idiomatic until
they visibly bloat. Introduce a seam only at a genuine external boundary —
payment gateway, mail, third-party API — as a service object or through the
framework's own adapter mechanism. Testing uses the framework's test
harness and fixtures rather than mock-heavy isolation.

## Fit and failure modes

Right for standard web and CRUD products on a convention-strong framework,
especially solo and small teams shipping fast — the conventions are widely
known, so agents and newcomers need no map. Failure modes: fat models and
fat controllers as the domain grows; business rules smeared across
callbacks, views, and helpers; tests coupled to the ORM and framework
runtime. When real domain complexity arrives, extract a framework-free core
for those capabilities selectively; record the extraction in
[decisions/](decisions/) rather than drifting into a half-migrated hybrid.
