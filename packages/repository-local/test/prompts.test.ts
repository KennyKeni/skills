import { describe, expect, it } from "vitest";

import type { RepositoryDiscovery, SetupPlan } from "../src/model.js";
import { collectPreferences, type PromptDriver, type TextRequest } from "../src/prompts.js";
import { discoveryFor } from "./helpers.js";

class RecordingDriver implements PromptDriver {
  public readonly requests: TextRequest[] = [];

  public start(_discovery: RepositoryDiscovery): void {}
  public async chooseConcern(): Promise<boolean> { return true; }
  public async destination(_label: string, initialValue: string): Promise<string> { return initialValue; }
  public async policyText(request: TextRequest): Promise<string> {
    this.requests.push(request);
    return request.initialValue;
  }
  public async wayfinderState(): Promise<"GitHub"> { return "GitHub"; }
  public showPlan(_plan: SetupPlan): void {}
  public async confirmWrite(): Promise<boolean> { return true; }
  public finish(_message: string): void {}
}

describe("interactive policy preferences", () => {
  it("asks for specification and ticket conventions and exposes bounded document evidence as candidates", async () => {
    const discovery: RepositoryDiscovery = {
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
      documentCandidates: [
        { path: "CONTRIBUTING.md", excerpt: "Run pnpm verify.", truncated: false, kinds: ["guidance"] },
        { path: "docs/architecture.md", excerpt: "Dependencies point inward.", truncated: false, kinds: ["architecture"] },
      ],
    };
    const driver = new RecordingDriver();

    const preferences = await collectPreferences(discovery, driver);
    const github = preferences.concerns.find((concern) => concern.id === "github");
    expect(github).toMatchObject({ values: {
      specificationConvention: expect.any(String),
      ticketConvention: expect.any(String),
      labelPolicy: expect.stringContaining("ready: Executable work"),
      mergePolicy: expect.stringContaining("squash"),
    } });
    expect(driver.requests.map((request) => request.message)).toEqual(expect.arrayContaining([
      expect.stringContaining("Specification structure"),
      expect.stringContaining("Executable ticket slicing"),
    ]));
    expect(driver.requests).toEqual(expect.arrayContaining([
      expect.objectContaining({ initialValue: expect.stringContaining("CANDIDATE — confirm, edit, or reject") }),
      expect.objectContaining({ initialValue: expect.stringContaining("Dependencies point inward") }),
    ]));
  });

  it.each([
    [{ status: "available", values: [] } as const, "lookup succeeded and confirmed"],
    [{ status: "unavailable", reason: "permission denied" } as const, "Do not infer that the repository has no labels"],
  ])("keeps empty and unavailable label discovery distinct", async (labels, wording) => {
    const driver = new RecordingDriver();
    await collectPreferences({
      ...discoveryFor("/repo"),
      github: {
        nameWithOwner: "owner/repo",
        url: "https://github.com/owner/repo",
        hasIssuesEnabled: true,
        allowedMergeStrategies: [],
        labels,
        relationshipFields: [],
      },
    }, driver);
    const request = driver.requests.find((candidate) => candidate.message.includes("label roles"));
    expect(request?.initialValue).toContain(wording);
  });
});
