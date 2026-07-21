## Doctrine

The deployment unit is the function, and the tree mirrors the deploy
topology. Each endpoint or event gets one handler, kept thin: decode the
event, call shared business logic, encode the result. Reusable logic and
clients live in a shared layer — never duplicated across handlers. The
infrastructure config beside the code is part of the architecture: it is
the routing table mapping events to handlers, and it carries each
function's permissions. Group functions by domain once they multiply.

## Layout and naming

```text
src/
  functions/
    create-order/
      handler.*        # exported handler for one endpoint/event
    stripe-webhook/
      handler.*
  shared/              # business logic, db client, external clients
serverless.yml | template.yaml | wrangler.toml | vercel.json
                       # route/event → handler map, per-function permissions
```

Function folders are named for the event or route (`create-order`,
`on-upload`, `nightly-report`), and each exports the platform's entry symbol
(`handler`, `fetch`, `main`). The business-logic unit is a function in
`shared/` that the handler calls; the data-access unit is the shared client
module every handler imports.

## Seams

The handler signature is the imposed seam — the platform owns it. Beyond
that, seams are pragmatic: one shared database client, one wrapper per
external service, all living in `shared/`. Do not add ports or interfaces
inside a single small function; the reuse boundary is the shared layer, not
per-call abstractions. Keep platform types (event envelopes, bindings,
retry metadata) in the handler; `shared/` code takes plain domain values.

## Fit and failure modes

Right for event-driven workloads, webhook processors, spiky or low-baseline
traffic, and solo builders who want zero server operations. Failure modes:
function pinball — a distributed monolith of tiny functions calling each
other in chains; logic drift and duplication when `shared/` is neglected;
config sprawl as the infra file grows unreviewed. When functions form
synchronous call chains, collapse the chain into one function or promote
the capability to a service; record it in [decisions/](decisions/).
