import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildSetupPlan, resolveDestination } from "../src/planning.js";
import { discoveryFor, forgeValues, trackerValues, workflowPreferences } from "./helpers.js";

describe("planning", () => {
  it("resolves configured folders inside the selected repository", () => {
    const root = resolve("repository-root");
    expect(resolveDestination(root, ".local/workflow")).toBe(join(root, ".local", "workflow"));
  });

  it("rejects paths outside the repository", () => {
    const root = resolve("repository-root");
    expect(() => resolveDestination(root, "../elsewhere")).toThrow(/escapes/);
    expect(() => resolveDestination(root, resolve(root, "..", "absolute-elsewhere"))).toThrow(/escapes/);
    expect(() => resolveDestination(root, ".")).toThrow(/repository root/);
  });

  it("selects workflow templates from the forge and tracker axes", () => {
    const root = resolve("repository-root");
    const plan = buildSetupPlan(discoveryFor(root), {
      mode: "repository",
      concerns: [{ id: "workflow", destination: ".local/workflow", workflow: workflowPreferences }],
    });

    expect(plan.indexPath).toBe(join(root, ".local", "INDEX.md"));
    expect(plan.concerns[0]?.files).toEqual([
      expect.objectContaining({
        name: "README.md",
        templates: ["workflow/header.md", "workflow/tracker/github-issues.md", "workflow/forge/github.md"],
      }),
    ]);
    expect(plan.concerns[0]?.values).toMatchObject({
      forgeLabel: "GitHub",
      trackerLabel: "forge issues",
      profileLabel: "solo",
      issueConvention: "Issue convention.",
      mergePolicy: "Merge policy.",
    });
  });

  it("selects the gitlab issues template when forge issues run on GitLab", () => {
    const root = resolve("repository-root");
    const plan = buildSetupPlan(discoveryFor(root), {
      mode: "repository",
      concerns: [{
        id: "workflow",
        destination: ".local/workflow",
        workflow: {
          profile: "solo",
          forge: { id: "gitlab", values: forgeValues },
          tracker: { id: "forge-issues", values: trackerValues },
          survey: [],
        },
      }],
    });
    expect(plan.concerns[0]?.files[0]?.templates).toContain("workflow/tracker/gitlab-issues.md");
  });

  it("adds a survey file when sections were left unresolved", () => {
    const root = resolve("repository-root");
    const plan = buildSetupPlan(discoveryFor(root), {
      mode: "repository",
      concerns: [{
        id: "workflow",
        destination: ".local/workflow",
        workflow: {
          ...workflowPreferences,
          survey: [{ section: "Merges", evidence: "Inspect merge settings." }],
        },
      }],
    });
    expect(plan.concerns[0]?.files.map((file) => file.name)).toEqual(["README.md", "SURVEY.md"]);
    expect(plan.concerns[0]?.values["surveyItems"]).toContain("**Merges** — Inspect merge settings.");
  });

  it("plans the architecture decision-records file alongside the README", () => {
    const root = resolve("repository-root");
    const plan = buildSetupPlan(discoveryFor(root), {
      mode: "repository",
      concerns: [{
        id: "architecture",
        destination: ".local/architecture",
        values: {
          scope: "repository",
          style: "layered",
          architectureConstraints: "Constraints.",
          architectureSources: "Sources.",
        },
      }],
    });
    expect(plan.concerns[0]?.files.map((file) => file.name)).toEqual([
      "README.md",
      "decisions/README.md",
    ]);
    expect(plan.concerns[0]?.files[0]?.templates).toContain("architecture/style/layered.md");
  });

  it("adds SHAPES.md only for the modular-hexagonal architecture style", () => {
    const root = resolve("repository-root");
    const plan = buildSetupPlan(discoveryFor(root), {
      mode: "repository",
      concerns: [{
        id: "architecture",
        destination: ".local/architecture",
        values: {
          scope: "repository",
          style: "modular-hexagonal",
          architectureConstraints: "Constraints.",
          architectureSources: "Sources.",
        },
      }],
    });
    expect(plan.concerns[0]?.files.map((file) => file.name)).toEqual([
      "README.md",
      "decisions/README.md",
      "SHAPES.md",
    ]);
  });

  it("records fleet index extras from preferences and discovery", () => {
    const root = resolve("fleet-root");
    const plan = buildSetupPlan(
      { ...discoveryFor(root), isGitRepository: false, memberRepositories: ["billing-svc"] },
      { mode: "fleet", umbrellaHome: "gateway", concerns: [] },
    );
    expect(plan.index).toEqual({ mode: "fleet", members: ["billing-svc"], umbrellaHome: "gateway" });
  });

  it("rejects duplicate or nested concern destinations", () => {
    const root = resolve("repository-root");
    expect(() =>
      buildSetupPlan(discoveryFor(root), {
        mode: "repository",
        concerns: [
          { id: "workflow", destination: ".policy", workflow: workflowPreferences },
          {
            id: "architecture",
            destination: ".policy/architecture",
            values: {
              scope: "repository",
              style: "layered",
              architectureConstraints: "Constraints.",
              architectureSources: "Sources.",
            },
          },
        ],
      }),
    ).toThrow(/non-nested/);
  });

  it("rejects concern destinations at or beneath the index pathname", () => {
    const root = resolve("repository-root");
    for (const destination of [".local/INDEX.md", ".local/INDEX.md/workflow"]) {
      expect(() => buildSetupPlan(discoveryFor(root), {
        mode: "repository",
        concerns: [{ id: "workflow", destination, workflow: workflowPreferences }],
      })).toThrow(/INDEX\.md or nested beneath/);
    }
  });
});
