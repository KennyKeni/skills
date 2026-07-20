import { describe, expect, it } from "vitest";

import { buildSetupPlan } from "../src/planning.js";
import { renderPlan } from "../src/rendering.js";
import { discoveryFor, githubValues } from "./helpers.js";

describe("packaged policy templates", () => {
  it("renders every concern as ordinary Markdown with no unresolved values", async () => {
    const plan = buildSetupPlan(discoveryFor("/repo"), {
      concerns: [
        { id: "github", destination: ".local/github", values: githubValues },
        {
          id: "architecture",
          destination: ".local/architecture",
          values: {
            architectureConstraints: "Preserve module boundaries.",
            architectureSources: "Architecture decisions.",
          },
        },
        {
          id: "development",
          destination: ".local/development",
          values: {
            verificationCommands: "pnpm verify",
            testingConstraints: "Test behavior.",
            reviewChecks: "Review contracts.",
            repositoryRules: "Preserve user changes.",
            environmentRequirements: "Use mise.",
          },
        },
      ],
    });

    const rendered = await renderPlan(plan);

    expect(rendered.concerns).toHaveLength(3);
    for (const concern of rendered.concerns) {
      const contents = concern.renderedFiles[0]?.contents ?? "";
      expect(contents).toMatch(/^# /);
      expect(contents).not.toMatch(/^---/);
      expect(contents).not.toContain("SKILL.md");
      expect(contents).not.toMatch(/\{\{[A-Za-z]/);
    }
  });
});
