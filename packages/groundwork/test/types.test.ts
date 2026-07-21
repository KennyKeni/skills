import { expectTypeOf, it } from "vitest";

import type { RenderedConcern, WorkflowPreferences } from "../src/model.js";
import { buildSetupPlan } from "../src/planning.js";
import { renderConcern } from "../src/rendering.js";
import { discoveryFor, setupPlanFor, trackerValues } from "./helpers.js";

it("preserves concern values through rendering and excludes invalid axis combinations", async () => {
  const plan = setupPlanFor("/repo");
  const concern = plan.concerns[0];
  if (concern === undefined) throw new Error("Missing test concern.");
  const rendered = await renderConcern(concern, async () => "{{issueConvention}}");
  expectTypeOf(rendered).toEqualTypeOf<RenderedConcern>();

  // @ts-expect-error forge "none" cannot host forge issues.
  const invalid: WorkflowPreferences = {
    profile: "solo",
    forge: { id: "none" },
    tracker: { id: "forge-issues", values: trackerValues },
    survey: [],
  };
  void invalid;

  const typeOnly = () => buildSetupPlan(discoveryFor("/repo"), {
    mode: "repository",
    concerns: [{
      id: "workflow",
      destination: ".local/workflow",
      // @ts-expect-error Workflow concerns carry workflow preferences, not concern values.
      values: { architectureDoctrine: "Doctrine.", architectureConstraints: "Constraints.", architectureSources: "Sources." },
    }],
  });
  void typeOnly;
});
