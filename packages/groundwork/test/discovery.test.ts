import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { discoverRepository, type CommandRunner } from "../src/discovery.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("repository discovery", () => {
  it("collects evidence without turning candidates into policy", async () => {
    const root = await mkdtemp(join(tmpdir(), "groundwork-discovery-"));
    temporaryRoots.push(root);
    await mkdir(join(root, "docs"));
    await mkdir(join(root, ".local"));
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ scripts: { test: "vitest", lint: "eslint .", start: "node app.js" } }),
    );
    await writeFile(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await writeFile(join(root, "mise.toml"), "[tools]\nnode = '24'\n");
    await writeFile(join(root, "CONTRIBUTING.md"), "# Contributing\nRun the focused test first.\n");
    await writeFile(join(root, "docs", "architecture.md"), "# Architecture\nKeep dependencies inward.\n");
    await writeFile(join(root, ".local", "legacy.md"), "legacy\n");

    const runner: CommandRunner = async (command, args) => {
      const invocation = `${command} ${args.join(" ")}`;
      if (invocation === "git rev-parse --show-toplevel") return { stdout: `${root}\n`, stderr: "" };
      if (invocation === "git remote -v") {
        return { stdout: "origin\tgit@github.com:KennyKeni/skills.git (fetch)\n", stderr: "" };
      }
      if (invocation === "git branch --show-current") return { stdout: "feature\n", stderr: "" };
      if (invocation.includes("git symbolic-ref")) return { stdout: "origin/main\n", stderr: "" };
      if (invocation.startsWith("gh repo view")) {
        return {
          stdout: JSON.stringify({
            nameWithOwner: "KennyKeni/skills",
            url: "https://github.com/KennyKeni/skills",
            defaultBranchRef: { name: "main" },
            hasIssuesEnabled: true,
            mergeCommitAllowed: false,
            rebaseMergeAllowed: false,
            squashMergeAllowed: true,
          }),
          stderr: "",
        };
      }
      if (invocation.startsWith("gh label list")) {
        return { stdout: JSON.stringify([{ name: "enhancement", description: "Feature" }]), stderr: "" };
      }
      if (invocation.startsWith("gh api graphql")) {
        return { stdout: "parent\nsubIssues\nblockedBy\n", stderr: "" };
      }
      return undefined;
    };

    const discovery = await discoverRepository(root, runner);

    expect(discovery.github).toMatchObject({
      nameWithOwner: "KennyKeni/skills",
      defaultBranch: "main",
      labels: { status: "available", values: [{ name: "enhancement" }] },
      relationshipFields: ["blockedBy", "parent", "subIssues"],
      allowedMergeStrategies: ["squash"],
    });
    expect(discovery.verificationCandidates).toEqual(["pnpm lint", "pnpm test"]);
    expect(discovery.architectureFiles).toContain("docs/architecture.md");
    expect(discovery.documentCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "CONTRIBUTING.md", excerpt: expect.stringContaining("focused test") }),
      expect.objectContaining({ path: "docs/architecture.md", excerpt: expect.stringContaining("dependencies inward") }),
    ]));
    expect(discovery.existingLocalPaths).toEqual([".local/legacy.md"]);
    expect(discovery.evidence.map((entry) => entry.source)).toContain(
      "existing .local paths (read-only)",
    );
    expect(discovery.evidence).toContainEqual(expect.objectContaining({
      source: "architecture candidate docs/architecture.md",
      value: expect.stringContaining("dependencies inward"),
    }));
  });

  it("bounds document discovery by file count and bytes", async () => {
    const root = await mkdtemp(join(tmpdir(), "groundwork-doc-bounds-"));
    temporaryRoots.push(root);
    for (let index = 0; index < 14; index += 1) {
      await writeFile(join(root, `architecture-${String(index).padStart(2, "0")}.md`), "x".repeat(5_000));
    }

    const discovery = await discoverRepository(root, async () => undefined);
    expect(discovery.documentCandidates).toHaveLength(12);
    expect(discovery.documentCandidates.every((candidate) => candidate.excerpt.length <= 4_096)).toBe(true);
    expect(discovery.documentCandidates.every((candidate) => candidate.truncated)).toBe(true);
  });

  it("distinguishes a failed label lookup from a confirmed empty result", async () => {
    const root = await mkdtemp(join(tmpdir(), "groundwork-label-state-"));
    temporaryRoots.push(root);
    const baseRunner: CommandRunner = async (command, args) => {
      const invocation = `${command} ${args.join(" ")}`;
      if (invocation === "git rev-parse --show-toplevel") return { stdout: `${root}\n`, stderr: "" };
      if (invocation.startsWith("gh repo view")) return {
        stdout: JSON.stringify({
          nameWithOwner: "owner/repo", url: "https://github.com/owner/repo",
          defaultBranchRef: null, hasIssuesEnabled: true,
          mergeCommitAllowed: false, rebaseMergeAllowed: false, squashMergeAllowed: false,
        }),
        stderr: "",
      };
      return undefined;
    };

    expect((await discoverRepository(root, baseRunner)).github?.labels).toMatchObject({ status: "unavailable" });
    const empty = await discoverRepository(root, async (command, args, cwd) => {
      if (`${command} ${args.join(" ")}`.startsWith("gh label list")) return { stdout: "[]", stderr: "" };
      return baseRunner(command, args, cwd);
    });
    expect(empty.github?.labels).toEqual({ status: "available", values: [] });
  });
});
