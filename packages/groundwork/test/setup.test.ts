import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApplyResult } from "../src/application.js";
import type { SetupPlan } from "../src/model.js";
import { runSetup } from "../src/setup.js";
import { StubDriver } from "./helpers.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

class CancelAtConfirmationDriver extends StubDriver {
  public override async chooseConcern(): Promise<boolean> {
    return false;
  }
  public override async confirmWrite(): Promise<boolean> {
    return false;
  }
}

const appliedIndex: ApplyResult = { created: [], skipped: [], index: "created" };

describe("setup orchestration", () => {
  it("cancels after planning without applying filesystem changes", async () => {
    const root = await mkdtemp(join(tmpdir(), "groundwork-cancel-"));
    temporaryRoots.push(root);
    const apply = vi.fn();
    const driver = new CancelAtConfirmationDriver();

    const result = await runSetup(
      { cwd: root },
      {
        promptDriver: driver,
        commandRunner: async () => undefined,
        templateLoader: async () => "unused",
        apply,
      },
    );

    expect(result).toBeUndefined();
    expect(apply).not.toHaveBeenCalled();
    expect(driver.finished).toMatch(/No files were written/);
  });

  it("runs fleet setup for a non-repository parent and offers member setup", async () => {
    const root = await mkdtemp(join(tmpdir(), "groundwork-fleet-"));
    temporaryRoots.push(root);
    await mkdir(join(root, "billing-svc", ".git"), { recursive: true });
    await mkdir(join(root, "gateway", ".git"), { recursive: true });

    const plans: SetupPlan[] = [];
    class FleetDriver extends StubDriver {
      public override async chooseConcern(): Promise<boolean> {
        return false;
      }
      public override showPlan(plan: SetupPlan): void {
        plans.push(plan);
      }
      public override async confirmMemberSetup(): Promise<boolean> {
        return true;
      }
    }
    const apply = vi.fn(async () => appliedIndex);

    const result = await runSetup(
      { cwd: root },
      {
        promptDriver: new FleetDriver(),
        commandRunner: async () => undefined,
        templateLoader: async () => "unused",
        apply,
      },
    );

    expect(result?.index).toBe("created");
    expect(plans[0]?.index.mode).toBe("fleet");
    expect(plans[0]?.index.members).toEqual(["billing-svc", "gateway"]);
    expect(plans).toHaveLength(3);
    expect(plans[1]?.index.mode).toBe("repository");
    expect(apply).toHaveBeenCalledTimes(3);
  });
});
