import { describe, expect, it } from "vitest";

import { renderIndex, renderIndexEntries, renderPlan } from "../src/rendering.js";
import type { SetupPlan } from "../src/model.js";
import { setupPlanFor } from "./helpers.js";

describe("template rendering", () => {
  it("substitutes declared values from the plan", async () => {
    const plan = setupPlanFor("/repo");
    const rendered = await renderPlan(plan, async () => "Policy: {{issueConvention}}\n");
    expect(rendered.concerns[0]?.renderedFiles[0]?.contents).toBe("Policy: Issue convention.\n");
  });

  it("concatenates template fragments in declared order", async () => {
    const plan = setupPlanFor("/repo");
    const concern = plan.concerns[0];
    if (concern === undefined) throw new Error("Missing test concern.");
    const fragmentPlan: SetupPlan = {
      ...plan,
      concerns: [{
        ...concern,
        files: [{
          name: "README.md",
          templates: ["one.md", "two.md"],
          requiredValues: ["issueConvention"],
        }],
      }],
    };
    const rendered = await renderPlan(fragmentPlan, async (name) =>
      name === "one.md" ? "# Header\n" : "{{issueConvention}}\n",
    );
    expect(rendered.concerns[0]?.renderedFiles[0]?.contents).toBe("# Header\n\nIssue convention.\n");
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
    if (concern?.id !== "workflow") throw new Error("Missing workflow test concern.");
    const literalPlan = {
      ...plan,
      concerns: [{ ...concern, values: { ...concern.values, issueConvention: "Use {{literal}} syntax." } }],
    };
    const rendered = await renderPlan(literalPlan, async () => "{{issueConvention}}");
    expect(rendered.concerns[0]?.renderedFiles[0]?.contents).toBe("Use {{literal}} syntax.\n");
  });

  it("indexes only concerns that were actually created", () => {
    const plan = setupPlanFor("/repo");
    expect(renderIndex(plan, new Set(["workflow"]))).toContain("[Workflow](workflow/README.md)");
    expect(renderIndex(plan, new Set())).toContain("No concerns were configured");
  });

  it("renders the repository index with the work-context note and fleet link", () => {
    const rendered = renderIndexEntries(
      "/repo/.local/INDEX.md",
      [{ label: "Workflow", destination: "/repo/.local/workflow" }],
      { mode: "repository", fleetLink: "../../.local/INDEX.md" },
    );
    expect(rendered).toContain("# Local policy index");
    expect(rendered).toContain("[fleet index](../../.local/INDEX.md)");
    expect(rendered).toContain("work/<slug>/");
  });

  it("renders the fleet index with members and umbrella home but no work note", () => {
    const rendered = renderIndexEntries(
      "/fleet/.local/INDEX.md",
      [{ label: "Domain language", destination: "/fleet/.local/domain" }],
      { mode: "fleet", members: ["billing-svc", "gateway"], umbrellaHome: "gateway" },
    );
    expect(rendered).toContain("# Fleet policy index");
    expect(rendered).toContain("- billing-svc");
    expect(rendered).toContain("Cross-repository umbrella home: gateway");
    expect(rendered).not.toContain("work/<slug>/");
  });
});
