import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildSetupPlan, resolveDestination } from "../src/planning.js";
import { discoveryFor, githubValues } from "./helpers.js";

describe("planning", () => {
  it("resolves configured folders inside the selected repository", () => {
    const root = resolve("repository-root");
    expect(resolveDestination(root, ".local/github")).toBe(join(root, ".local", "github"));
  });

  it("rejects paths outside the repository", () => {
    const root = resolve("repository-root");
    expect(() => resolveDestination(root, "../elsewhere")).toThrow(/escapes/);
    expect(() => resolveDestination(root, resolve(root, "..", "absolute-elsewhere"))).toThrow(/escapes/);
    expect(() => resolveDestination(root, ".")).toThrow(/repository root/);
  });

  it("builds a typed plan with fixed filenames", () => {
    const root = resolve("repository-root");
    const plan = buildSetupPlan(discoveryFor(root), {
      concerns: [{ id: "github", destination: ".policy/github", values: githubValues }],
    });

    expect(plan.indexPath).toBe(join(root, ".local", "INDEX.md"));
    expect(plan.concerns[0]?.files).toEqual([
      expect.objectContaining({ name: "README.md", template: "github.md" }),
    ]);
  });

  it("rejects duplicate or nested concern destinations", () => {
    const root = resolve("repository-root");
    expect(() =>
      buildSetupPlan(discoveryFor(root), {
        concerns: [
          { id: "github", destination: ".policy", values: githubValues },
          {
            id: "architecture",
            destination: ".policy/architecture",
            values: { architectureConstraints: "Constraints.", architectureSources: "Sources." },
          },
        ],
      }),
    ).toThrow(/non-nested/);
  });

  it("rejects concern destinations at or beneath the index pathname", () => {
    const root = resolve("repository-root");
    for (const destination of [".local/INDEX.md", ".local/INDEX.md/github"]) {
      expect(() => buildSetupPlan(discoveryFor(root), {
        concerns: [{ id: "github", destination, values: githubValues }],
      })).toThrow(/INDEX\.md or nested beneath/);
    }
  });
});
