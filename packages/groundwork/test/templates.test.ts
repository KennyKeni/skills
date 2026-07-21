import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  architectureStyleIds,
  forgeSectionKeys,
  trackerSectionKeys,
  type WorkflowPreferences,
} from "../src/model.js";
import { buildSetupPlan } from "../src/planning.js";
import { renderPlan } from "../src/rendering.js";
import { discoveryFor, forgeValues, trackerValues, workflowPreferences } from "./helpers.js";

async function loadTemplate(name: string): Promise<string> {
  return readFile(new URL(`../templates/${name}`, import.meta.url), "utf8");
}

function headings(source: string): string[] {
  return source.split("\n").filter((line) => line.startsWith("## "));
}

function placeholders(source: string): string[] {
  return [...new Set([...source.matchAll(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g)].map((match) => match[1]))]
    .filter((key): key is string => key !== undefined)
    .sort();
}

const workflowVariants: readonly WorkflowPreferences[] = [
  workflowPreferences,
  {
    profile: "solo",
    forge: { id: "gitlab", values: forgeValues },
    tracker: { id: "forge-issues", values: trackerValues },
    survey: [],
  },
  {
    profile: "solo",
    forge: { id: "github", values: forgeValues },
    tracker: { id: "linear", values: trackerValues },
    survey: [],
  },
  {
    profile: "team",
    forge: { id: "none" },
    tracker: { id: "none" },
    survey: [{ section: "Merges", evidence: "Inspect merge settings." }],
  },
] as const;

describe("packaged policy templates", () => {
  it.each(workflowVariants.map((variant) => [
    `${variant.forge.id}/${variant.tracker.id}`,
    variant,
  ] as const))("renders the %s workflow with no unresolved values", async (_name, variant) => {
    const plan = buildSetupPlan(discoveryFor("/repo"), {
      mode: "repository",
      concerns: [{ id: "workflow", destination: ".local/workflow", workflow: variant }],
    });
    const rendered = await renderPlan(plan);
    for (const file of rendered.concerns[0]?.renderedFiles ?? []) {
      expect(file.contents).toMatch(/^# /);
      expect(file.contents).not.toMatch(/\{\{[A-Za-z]/);
    }
  });

  it("renders every non-workflow concern as ordinary Markdown with no unresolved values", async () => {
    const plan = buildSetupPlan(discoveryFor("/repo"), {
      mode: "repository",
      concerns: [
        {
          id: "architecture",
          destination: ".local/architecture",
          values: {
            scope: "repository",
            style: "modular-hexagonal",
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
            worktreeRules: "One worktree per claimed work item.",
            reviewChecks: "Review contracts.",
            repositoryRules: "Preserve user changes.",
            environmentRequirements: "Use mise.",
          },
        },
        { id: "domain", destination: ".local/domain", values: { domainEntries: "| Term | Means | Does not mean |" } },
        { id: "papercuts", destination: ".local/papercuts" },
      ],
    });

    const rendered = await renderPlan(plan);

    expect(rendered.concerns).toHaveLength(4);
    for (const concern of rendered.concerns) {
      expect(concern.renderedFiles.length).toBeGreaterThan(0);
      for (const file of concern.renderedFiles) {
        expect(file.contents).toMatch(/^# /);
        expect(file.contents).not.toMatch(/^---/);
        expect(file.contents).not.toContain("SKILL.md");
        expect(file.contents).not.toMatch(/\{\{[A-Za-z]/);
      }
    }
  });

  it.each(architectureStyleIds.map((style) => [style] as const))(
    "renders the %s architecture style with no unresolved values",
    async (style) => {
      const plan = buildSetupPlan(discoveryFor("/repo"), {
        mode: "repository",
        concerns: [{
          id: "architecture",
          destination: ".local/architecture",
          values: {
            scope: "repository",
            style,
            architectureConstraints: "Constraints.",
            architectureSources: "Sources.",
          },
        }],
      });
      const rendered = await renderPlan(plan);
      const readme = rendered.concerns[0]?.renderedFiles.find((file) => file.name === "README.md");
      expect(readme?.contents).toContain("## Doctrine");
      expect(readme?.contents).toContain("## Stable constraints");
      for (const file of rendered.concerns[0]?.renderedFiles ?? []) {
        expect(file.contents).toMatch(/^# /);
        expect(file.contents).not.toMatch(/\{\{[A-Za-z]/);
      }
    },
  );

  it("renders the fleet architecture variant with no unresolved values", async () => {
    const plan = buildSetupPlan(discoveryFor("/repo"), {
      mode: "fleet",
      concerns: [{
        id: "architecture",
        destination: ".local/architecture",
        values: {
          scope: "fleet",
          architectureConstraints: "Constraints.",
          architectureSources: "Sources.",
        },
      }],
    });
    const rendered = await renderPlan(plan);
    const readme = rendered.concerns[0]?.renderedFiles.find((file) => file.name === "README.md");
    expect(readme?.contents).toContain("expand–migrate–contract");
    expect(readme?.contents).not.toMatch(/\{\{[A-Za-z]/);
  });

  it("keeps every architecture style on the identical section contract", async () => {
    const sources = await Promise.all(
      architectureStyleIds.map((style) => loadTemplate(`architecture/style/${style}.md`)),
    );
    const [reference, ...rest] = sources.map(headings);
    expect(reference).toEqual([
      "## Doctrine",
      "## Layout and naming",
      "## Seams",
      "## Fit and failure modes",
    ]);
    for (const variant of rest) {
      expect(variant).toEqual(reference);
    }
    for (const source of sources) {
      expect(placeholders(source)).toEqual([]);
    }
  });

  it("keeps every tracker variant on the identical section contract", async () => {
    const variants = ["github-issues.md", "gitlab-issues.md", "linear.md", "none.md"];
    const sources = await Promise.all(
      variants.map((name) => loadTemplate(`workflow/tracker/${name}`)),
    );
    const [reference, ...rest] = sources.map(headings);
    expect(reference).toEqual([
      "## Tracker verb contract",
      "## Issues",
      "## Specifications",
      "## Executable tickets",
      "## Labels",
      "## Relationships",
      "## Claims",
      "## Readiness",
      "## Local work context",
    ]);
    for (const variant of rest) {
      expect(variant).toEqual(reference);
    }

    for (const source of sources.slice(0, 3)) {
      expect(placeholders(source)).toEqual([...trackerSectionKeys].sort());
    }
    expect(placeholders(sources[3] ?? "")).toEqual([]);
  });

  it("keeps every forge variant on the same section count and placeholder set", async () => {
    const variants = ["github.md", "gitlab.md", "none.md"];
    const sources = await Promise.all(
      variants.map((name) => loadTemplate(`workflow/forge/${name}`)),
    );
    const counts = sources.map((source) => headings(source).length);
    expect(new Set(counts).size).toBe(1);

    for (const source of sources.slice(0, 2)) {
      expect(placeholders(source)).toEqual([...forgeSectionKeys].sort());
    }
    expect(placeholders(sources[2] ?? "")).toEqual([]);
  });
});
