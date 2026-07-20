import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ConcernId, RepositoryDiscovery, SetupPlan } from "../src/model.js";
import type { PromptDriver, TextRequest } from "../src/prompts.js";
import { runSetup } from "../src/setup.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

class CancelAtConfirmationDriver implements PromptDriver {
  public finished = "";

  public start(_discovery: RepositoryDiscovery): void {}
  public async chooseConcern(
    _id: ConcernId,
    _label: string,
    _purpose: string,
    _files: readonly string[],
    _configureInitially: boolean,
  ): Promise<boolean> {
    return false;
  }
  public async destination(_label: string, initialValue: string): Promise<string> {
    return initialValue;
  }
  public async policyText(request: TextRequest): Promise<string> {
    return request.initialValue;
  }
  public async wayfinderState(): Promise<"GitHub"> {
    return "GitHub";
  }
  public showPlan(_plan: SetupPlan): void {}
  public async confirmWrite(): Promise<boolean> {
    return false;
  }
  public finish(message: string): void {
    this.finished = message;
  }
}

describe("setup orchestration", () => {
  it("cancels after planning without applying filesystem changes", async () => {
    const root = await mkdtemp(join(tmpdir(), "repository-local-cancel-"));
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
});
