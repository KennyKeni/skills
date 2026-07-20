import { log } from "@clack/prompts";

import { applyPlan, type ApplyResult } from "./application.js";
import { discoverRepository, type CommandRunner } from "./discovery.js";
import { buildSetupPlan } from "./planning.js";
import {
  ClackPromptDriver,
  collectPreferences,
  SetupCancelledError,
  type PromptDriver,
} from "./prompts.js";
import { renderPlan, type TemplateLoader } from "./rendering.js";

export type SetupFlags = {
  readonly cwd?: string;
};

export type SetupDependencies = {
  readonly promptDriver?: PromptDriver;
  readonly commandRunner?: CommandRunner;
  readonly templateLoader?: TemplateLoader;
  readonly apply?: typeof applyPlan;
};

export class NonInteractiveSetupError extends Error {
  public constructor() {
    super("Interactive setup requires a TTY. Run repository-local setup from an interactive terminal.");
    this.name = "NonInteractiveSetupError";
  }
}

export async function runSetup(
  flags: SetupFlags,
  dependencies: SetupDependencies = {},
): Promise<ApplyResult | undefined> {
  if (dependencies.promptDriver === undefined && (!process.stdin.isTTY || !process.stdout.isTTY)) {
    throw new NonInteractiveSetupError();
  }
  const driver = dependencies.promptDriver ?? new ClackPromptDriver();
  try {
    const discovery = await discoverRepository(
      flags.cwd ?? process.cwd(),
      dependencies.commandRunner,
    );
    const preferences = await collectPreferences(discovery, driver);
    const plan = buildSetupPlan(discovery, preferences);
    const renderedPlan = await renderPlan(plan, dependencies.templateLoader);
    driver.showPlan(plan);

    if (!(await driver.confirmWrite())) {
      driver.finish("Setup cancelled. No files were written.");
      return undefined;
    }

    const result = await (dependencies.apply ?? applyPlan)(renderedPlan);
    for (const skipped of result.skipped) {
      log.warn(`Preserved ${skipped.destination}: ${skipped.reason}.`);
    }
    if (result.index !== "created") {
      log.warn(`Preserved ${plan.indexPath}: ${result.index}.`);
    }
    driver.finish(
      `Created ${result.created.length} concern folder${result.created.length === 1 ? "" : "s"}; index ${result.index}.`,
    );
    return result;
  } catch (error) {
    if (error instanceof SetupCancelledError) return undefined;
    throw error;
  }
}
