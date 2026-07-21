import { describe, expect, it } from "vitest";

import type { ProfileId, RepositoryDiscovery } from "../src/model.js";
import { collectPreferences, type SectionMode } from "../src/prompts.js";
import { discoveryFor, StubDriver } from "./helpers.js";

class ReviewingDriver extends StubDriver {
  public override async sectionMode(): Promise<SectionMode> {
    return "review";
  }
}

class SurveyDriver extends StubDriver {
  public override async chooseProfile(): Promise<ProfileId> {
    return "team";
  }
  public override async sectionMode(
    _group: string,
    _profile: ProfileId,
    allowSurvey: boolean,
  ): Promise<SectionMode> {
    return allowSurvey ? "survey" : "defaults";
  }
}

function githubDiscovery(overrides: Partial<RepositoryDiscovery> = {}): RepositoryDiscovery {
  return {
    ...discoveryFor("/repo"),
    github: {
      nameWithOwner: "owner/repo",
      url: "https://github.com/owner/repo",
      defaultBranch: "main",
      hasIssuesEnabled: true,
      allowedMergeStrategies: ["squash"],
      labels: { status: "available", values: [{ name: "ready", description: "Executable work" }] },
      relationshipFields: [],
    },
    ...overrides,
  };
}

describe("interactive policy preferences", () => {
  it("includes papercuts as fixed protocol prose with no policy-text prompts", async () => {
    const driver = new ReviewingDriver();

    const preferences = await collectPreferences(githubDiscovery(), driver);
    const papercuts = preferences.concerns.find((concern) => concern.id === "papercuts");
    expect(papercuts).toEqual({ id: "papercuts", destination: ".local/papercuts" });
    expect(driver.requests.some((request) => request.message.toLowerCase().includes("papercut"))).toBe(
      false,
    );
  });


  it("collects axis-driven workflow values and exposes bounded document evidence as candidates", async () => {
    const discovery = githubDiscovery({
      documentCandidates: [
        { path: "CONTRIBUTING.md", excerpt: "Run pnpm verify.", truncated: false, kinds: ["guidance"] },
        { path: "docs/architecture.md", excerpt: "Dependencies point inward.", truncated: false, kinds: ["architecture"] },
      ],
    });
    const driver = new ReviewingDriver();

    const preferences = await collectPreferences(discovery, driver);
    expect(preferences.mode).toBe("repository");
    const workflow = preferences.concerns.find((concern) => concern.id === "workflow");
    if (workflow?.id !== "workflow") throw new Error("Missing workflow concern.");
    expect(workflow.workflow.forge.id).toBe("github");
    expect(workflow.workflow.tracker.id).toBe("forge-issues");
    if (workflow.workflow.tracker.id === "none") throw new Error("Expected tracker values.");
    expect(workflow.workflow.tracker.values.labelPolicy).toContain("ready: Executable work");
    if (workflow.workflow.forge.id === "none") throw new Error("Expected forge values.");
    expect(workflow.workflow.forge.values.mergePolicy).toContain("squash");
    expect(driver.requests.map((request) => request.message)).toEqual(expect.arrayContaining([
      expect.stringContaining("Specification (umbrella issue) structure"),
      expect.stringContaining("Executable ticket (leaf issue) structure"),
      expect.stringContaining("Claim and release protocol"),
    ]));
    expect(driver.requests).toEqual(expect.arrayContaining([
      expect.objectContaining({ initialValue: expect.stringContaining("CANDIDATE — confirm, edit, or reject") }),
      expect.objectContaining({ initialValue: expect.stringContaining("Dependencies point inward") }),
    ]));
  });

  it.each([
    [{ status: "available", values: [] } as const, "lookup succeeded and confirmed"],
    [{ status: "unavailable", reason: "permission denied." } as const, "Do not infer that the repository has no labels"],
  ])("keeps empty and unavailable label discovery distinct", async (labels, wording) => {
    const driver = new ReviewingDriver();
    const preferences = await collectPreferences(
      githubDiscovery({
        github: {
          nameWithOwner: "owner/repo",
          url: "https://github.com/owner/repo",
          hasIssuesEnabled: true,
          allowedMergeStrategies: [],
          labels,
          relationshipFields: [],
        },
      }),
      driver,
    );
    const workflow = preferences.concerns.find((concern) => concern.id === "workflow");
    if (workflow?.id !== "workflow" || workflow.workflow.tracker.id === "none") {
      throw new Error("Missing workflow tracker values.");
    }
    expect(workflow.workflow.tracker.values.labelPolicy).toContain(wording);
  });

  it("fills surveyed sections with the unresolved marker and records survey items", async () => {
    const preferences = await collectPreferences(githubDiscovery(), new SurveyDriver());
    const workflow = preferences.concerns.find((concern) => concern.id === "workflow");
    if (workflow?.id !== "workflow" || workflow.workflow.tracker.id === "none") {
      throw new Error("Missing workflow tracker values.");
    }
    expect(workflow.workflow.tracker.values.issueConvention).toContain("Unresolved — see SURVEY.md");
    expect(workflow.workflow.survey.length).toBeGreaterThan(0);
    expect(workflow.workflow.survey).toEqual(expect.arrayContaining([
      expect.objectContaining({ section: "Merges" }),
      expect.objectContaining({ section: "Labels" }),
    ]));
  });

  it("collects fleet preferences with only fleet-scoped concerns", async () => {
    const preferences = await collectPreferences(
      {
        ...discoveryFor("/fleet"),
        isGitRepository: false,
        memberRepositories: ["billing-svc", "gateway"],
      },
      new StubDriver(),
    );
    expect(preferences.mode).toBe("fleet");
    expect(preferences.umbrellaHome).toBe("Per-repository umbrellas only");
    expect(preferences.concerns.map((concern) => concern.id).sort()).toEqual([
      "architecture",
      "domain",
    ]);
  });

  it("links a discovered parent fleet and defaults fleet-scoped concerns to skip", async () => {
    const preferences = await collectPreferences(
      {
        ...discoveryFor("/fleet/billing-svc"),
        fleet: { indexPath: "/fleet/.local/INDEX.md", root: "/fleet" },
      },
      new StubDriver(),
    );
    expect(preferences.mode).toBe("repository");
    expect(preferences.fleetLink).toBe("../../.local/INDEX.md");
    const ids = preferences.concerns.map((concern) => concern.id);
    expect(ids).toContain("workflow");
    expect(ids).toContain("development");
    expect(ids).not.toContain("domain");
    expect(ids).not.toContain("architecture");
  });
});
