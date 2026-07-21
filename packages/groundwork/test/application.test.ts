import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";

import { afterEach, describe, expect, it } from "vitest";

import { applyPlan, SetupLockedError } from "../src/application.js";
import { buildSetupPlan } from "../src/planning.js";
import { renderPlan } from "../src/rendering.js";
import { discoveryFor, renderedPlanFor, workflowPreferences } from "./helpers.js";

const temporaryRoots: string[] = [];
const itWithDirectorySymlinks = process.platform === "win32" ? it.skip : it;

async function temporaryRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("filesystem application", () => {
  it("creates only the index and selected concern READMEs", async () => {
    const root = await temporaryRoot("groundwork-tree-");
    const plan = buildSetupPlan(discoveryFor(root), {
      mode: "repository",
      concerns: [
        { id: "workflow", destination: ".local/workflow", workflow: workflowPreferences },
        {
          id: "architecture",
          destination: ".local/architecture",
          values: {
            scope: "repository",
            style: "modular-hexagonal",
            architectureConstraints: "Preserve boundaries.",
            architectureSources: "Accepted decisions.",
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
      ],
    });

    await applyPlan(await renderPlan(plan));

    const generatedPaths = (await readdir(join(root, ".local"), { recursive: true }))
      .map((path) => path.replaceAll("\\", "/"))
      .sort();
    expect(generatedPaths).toEqual([
      "INDEX.md",
      "architecture",
      "architecture/README.md",
      "architecture/SHAPES.md",
      "architecture/decisions",
      "architecture/decisions/README.md",
      "development",
      "development/README.md",
      "workflow",
      "workflow/README.md",
    ]);
  });

  it("creates complete concern folders and navigation", async () => {
    const root = await temporaryRoot("groundwork-success-");
    const result = await applyPlan(renderedPlanFor(root));

    expect(result).toMatchObject({ created: [{ id: "workflow" }], skipped: [], index: "created" });
    expect(await readFile(join(root, ".local", "workflow", "README.md"), "utf8")).toBe(
      "# Complete policy\n",
    );
    expect(await readFile(join(root, ".local", "INDEX.md"), "utf8")).toContain(
      "[Workflow](workflow/README.md)",
    );
    expect((await readdir(root)).some((name) => name.startsWith(".groundwork-"))).toBe(false);
  });

  it("preserves an existing target folder unchanged and omits it from the index", async () => {
    const root = await temporaryRoot("groundwork-existing-");
    const destination = join(root, ".local", "workflow");
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, "user-owned.md"), "keep\n");

    const result = await applyPlan(renderedPlanFor(root));

    expect(result.skipped).toEqual([
      { id: "workflow", destination, reason: "already exists" },
    ]);
    expect(await readFile(join(destination, "user-owned.md"), "utf8")).toBe("keep\n");
    expect(await readFile(join(root, ".local", "INDEX.md"), "utf8")).not.toContain(
      "[Workflow]",
    );
  });

  it("treats an existing index as an initialized user-owned policy tree", async () => {
    const root = await temporaryRoot("groundwork-index-existing-");
    const indexPath = join(root, ".local", "INDEX.md");
    await mkdir(join(root, ".local"), { recursive: true });
    await writeFile(indexPath, "# User index\n");

    const result = await applyPlan(renderedPlanFor(root));

    expect(result).toMatchObject({
      created: [],
      skipped: [{ id: "workflow", reason: "index already exists" }],
      index: "already exists",
    });
    expect(await readFile(indexPath, "utf8")).toBe("# User index\n");
    await expect(lstat(join(root, ".local", "workflow"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves a destination that appears during setup", async () => {
    const root = await temporaryRoot("groundwork-race-");
    const destination = join(root, ".local", "workflow");

    const result = await applyPlan(renderedPlanFor(root), {
      beforeDestinationClaim: async () => {
        await mkdir(destination);
        await writeFile(join(destination, "winner.md"), "preserve\n");
      },
    });

    expect(result.skipped[0]?.reason).toBe("appeared during setup");
    expect(await readFile(join(destination, "winner.md"), "utf8")).toBe("preserve\n");
    await expect(lstat(join(destination, "README.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("stages a concern beside its destination for same-filesystem publication", async () => {
    const root = await temporaryRoot("groundwork-same-filesystem-");
    const destinationParent = join(root, ".local");
    let stagedSibling = false;
    await applyPlan(renderedPlanFor(root), {
      beforeDestinationClaim: async () => {
        stagedSibling = (await readdir(destinationParent)).some((name) => name.startsWith(".groundwork-stage-workflow-"));
      },
    });
    expect(stagedSibling).toBe(true);
  });

  it("reserves the whole setup operation against a concurrent CLI instance", async () => {
    const root = await temporaryRoot("groundwork-operation-lock-");
    let continueFirst!: () => void;
    let announceFirst!: () => void;
    const firstReachedHook = new Promise<void>((resolve) => { announceFirst = resolve; });
    const gate = new Promise<void>((resolve) => { continueFirst = resolve; });
    const first = applyPlan(renderedPlanFor(root), {
      beforeDestinationClaim: async () => {
        announceFirst();
        await gate;
      },
    });
    await firstReachedHook;

    await expect(applyPlan(renderedPlanFor(root))).rejects.toBeInstanceOf(SetupLockedError);
    continueFirst();
    await first;
  });

  it("recovers a published concern into the index after index publication fails", async () => {
    const root = await temporaryRoot("groundwork-index-recovery-");
    const plan = renderedPlanFor(root);
    await expect(applyPlan(plan, {
      beforeIndexLink: () => { throw new Error("simulated index failure"); },
    })).rejects.toThrow("simulated index failure");

    expect(await readFile(join(root, ".local", "workflow", "README.md"), "utf8")).toBe("# Complete policy\n");
    const result = await applyPlan(plan);
    expect(result.index).toBe("created");
    expect(await readFile(join(root, ".local", "INDEX.md"), "utf8")).toContain("workflow/README.md");
    expect(await readdir(join(root, ".local", "workflow"))).toEqual(["README.md"]);
    await expect(lstat(join(root, ".groundwork.setup-recovery.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves recovery evidence when an unrelated index appears after failure", async () => {
    const root = await temporaryRoot("groundwork-index-recovery-conflict-");
    const plan = renderedPlanFor(root);
    await expect(applyPlan(plan, {
      beforeIndexLink: () => { throw new Error("simulated index failure"); },
    })).rejects.toThrow("simulated index failure");
    await writeFile(join(root, ".local", "INDEX.md"), "# Unrelated index\n");

    await expect(applyPlan(plan)).rejects.toThrow(/does not represent concerns/);
    expect(await readdir(join(root, ".local", "workflow"))).toContain(".groundwork-install.json");
    await expect(lstat(join(root, ".groundwork.setup-recovery.json"))).resolves.toBeDefined();
  });

  it.each(["missing", "mismatched"] as const)(
    "stops recovery when the ownership marker is %s",
    async (markerState) => {
      const root = await temporaryRoot(`groundwork-marker-${markerState}-`);
      const plan = renderedPlanFor(root);
      await expect(applyPlan(plan, {
        beforeIndexLink: () => { throw new Error("simulated index failure"); },
      })).rejects.toThrow("simulated index failure");
      const journalPath = join(root, ".groundwork.setup-recovery.json");
      const journalBefore = await readFile(journalPath, "utf8");
      const markerPath = join(root, ".local", "workflow", ".groundwork-install.json");
      if (markerState === "missing") await unlink(markerPath);
      else await writeFile(markerPath, "different-owner\n");

      await expect(applyPlan(plan)).rejects.toThrow(/marker is missing or mismatched/);
      expect(await readFile(journalPath, "utf8")).toBe(journalBefore);
      await expect(lstat(join(root, ".local", "INDEX.md"))).rejects.toMatchObject({ code: "ENOENT" });
    },
  );

  it("reclaims a well-formed reservation left by a dead process", async () => {
    const root = await temporaryRoot("groundwork-stale-lock-");
    const exited = spawn(process.execPath, ["-e", ""]);
    const stalePid = exited.pid;
    if (stalePid === undefined) throw new Error("Test process did not receive a pid.");
    await once(exited, "exit");
    await writeFile(
      join(root, ".groundwork.setup.lock"),
      `${JSON.stringify({ pid: stalePid, token: "stale" })}\n`,
    );
    await expect(applyPlan(renderedPlanFor(root))).resolves.toMatchObject({ index: "created" });
  });

  it("does not publish a destination when claiming the complete staged folder fails", async () => {
    const root = await temporaryRoot("groundwork-failure-");
    const destination = join(root, ".local", "workflow");

    await expect(
      applyPlan(renderedPlanFor(root), {
        beforeDestinationClaim: () => {
          throw new Error("simulated write failure");
        },
      }),
    ).rejects.toThrow("simulated write failure");

    await expect(lstat(destination)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await readdir(root)).some((name) => name.startsWith(".groundwork-"))).toBe(false);
  });

  itWithDirectorySymlinks("rejects replacement of a concern parent with a symlink before the atomic publish", async () => {
    const root = await temporaryRoot("groundwork-parent-race-");
    const outside = await temporaryRoot("groundwork-parent-race-outside-");
    const local = join(root, ".local");
    const parked = join(root, ".local-parked");
    const leaked: string[] = [];
    let stagedName = "";

    await expect(applyPlan(renderedPlanFor(root), {
      beforeDestinationClaim: async () => {
        stagedName = (await readdir(local)).find((name) => name.startsWith(".groundwork-stage-workflow-")) ?? "";
        if (stagedName.length === 0) throw new Error("Missing staged concern.");
        await mkdir(join(outside, stagedName));
        await writeFile(join(outside, stagedName, "external-data.txt"), "preserve\n");
        await rename(local, parked);
        await symlink(outside, local);
      },
      onCleanupLeak: (path) => { leaked.push(path); },
    })).rejects.toThrow(/symbolic link/);

    expect(await readFile(join(outside, stagedName, "external-data.txt"), "utf8")).toBe("preserve\n");
    expect((await readdir(parked)).some((name) => name.startsWith(".groundwork-stage-workflow-"))).toBe(true);
    await expect(lstat(join(outside, "workflow"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(leaked).toContain(join(local, stagedName));
  });

  itWithDirectorySymlinks("rejects replacement of the index parent with a symlink before linking", async () => {
    const root = await temporaryRoot("groundwork-index-parent-race-");
    const outside = await temporaryRoot("groundwork-index-parent-race-outside-");
    const local = join(root, ".local");
    const parked = join(root, ".local-parked");

    await expect(applyPlan(renderedPlanFor(root), {
      beforeIndexLink: async () => {
        await rename(local, parked);
        await symlink(outside, local);
      },
    })).rejects.toThrow(/symbolic link/);

    expect(await readdir(outside)).toEqual([]);
    expect(await readFile(join(parked, "workflow", "README.md"), "utf8")).toBe("# Complete policy\n");
    await expect(lstat(join(outside, "INDEX.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  itWithDirectorySymlinks("rejects a destination reached through a symlink outside the repository", async () => {
    const root = await temporaryRoot("groundwork-symlink-root-");
    const outside = await temporaryRoot("groundwork-symlink-outside-");
    await symlink(outside, join(root, "linked"));
    const plan = renderedPlanFor(root);
    const concern = plan.concerns[0];
    if (concern === undefined) throw new Error("Missing test concern.");

    await expect(
      applyPlan({ ...plan, concerns: [{ ...concern, destination: join(root, "linked", "workflow") }] }),
    ).rejects.toThrow(/symbolic link|outside the repository root/);
    expect(await readdir(outside)).toEqual([]);
  });
});
