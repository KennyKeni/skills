import { expectTypeOf, it } from "vitest";

import type { PlannedConcern, RenderedConcern } from "../src/model.js";
import { buildSetupPlan } from "../src/planning.js";
import { renderConcern } from "../src/rendering.js";
import { discoveryFor, githubValues } from "./helpers.js";

it("preserves concern-specific values through planning and rendering APIs", async () => {
  const github: PlannedConcern<"github"> = {
    id: "github",
    label: "GitHub workflow",
    destination: "/repo/.local/github",
    files: [{ name: "README.md", template: "github.md", requiredValues: ["ticketConvention"] }],
    values: githubValues,
  };
  const rendered = await renderConcern(github, async () => "{{ticketConvention}}");
  expectTypeOf(rendered).toEqualTypeOf<RenderedConcern<"github">>();
  expectTypeOf(rendered.values.ticketConvention).toEqualTypeOf<string>();

  buildSetupPlan(discoveryFor("/repo"), {
    concerns: [{
      id: "github",
      destination: ".local/github",
      // @ts-expect-error Architecture values cannot be paired with the GitHub discriminator.
      values: { architectureConstraints: "Keep boundaries.", architectureSources: "docs/architecture.md" },
    }],
  });
});
