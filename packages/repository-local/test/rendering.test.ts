import { describe, expect, it } from "vitest";

import { renderIndex, renderPlan } from "../src/rendering.js";
import type { SetupPlan } from "../src/model.js";
import { setupPlanFor } from "./helpers.js";

describe("template rendering", () => {
  it("substitutes declared values from the plan", async () => {
    const plan = setupPlanFor("/repo");
    const rendered = await renderPlan(plan, async () => "Policy: {{issueConvention}}\n");
    expect(rendered.concerns[0]?.renderedFiles[0]?.contents).toBe("Policy: Issue convention.\n");
  });

  it("rejects missing required values", async () => {
    const plan = setupPlanFor("/repo");
    const concern = plan.concerns[0];
    if (concern === undefined) throw new Error("Missing test concern.");
    const invalidPlan = {
      ...plan,
      concerns: [{ ...concern, values: {} }],
    } as unknown as SetupPlan;
    await expect(renderPlan(invalidPlan, async () => "{{issueConvention}}")).rejects.toThrow(
      /Missing required/,
    );
  });

  it("rejects undeclared unresolved placeholders", async () => {
    await expect(
      renderPlan(setupPlanFor("/repo"), async () => "{{issueConvention}} {{unknownValue}}"),
    ).rejects.toThrow(/Unresolved template values.*unknownValue/);
  });

  it("treats placeholder-shaped text in confirmed user values as literal policy", async () => {
    const plan = setupPlanFor("/repo");
    const concern = plan.concerns[0];
    if (concern?.id !== "github") throw new Error("Missing GitHub test concern.");
    const literalPlan = {
      ...plan,
      concerns: [{ ...concern, values: { ...concern.values, issueConvention: "Use {{literal}} syntax." } }],
    };
    const rendered = await renderPlan(literalPlan, async () => "{{issueConvention}}");
    expect(rendered.concerns[0]?.renderedFiles[0]?.contents).toBe("Use {{literal}} syntax.\n");
  });

  it("indexes only concerns that were actually created", () => {
    const plan = setupPlanFor("/repo");
    expect(renderIndex(plan, new Set(["github"]))).toContain("[GitHub workflow](github/README.md)");
    expect(renderIndex(plan, new Set())).toContain("No concerns were configured");
  });
});
