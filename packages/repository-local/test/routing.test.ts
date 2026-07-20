import { run, type StricliProcess } from "@stricli/core";
import { describe, expect, it } from "vitest";

import { application } from "../src/app.js";

async function invoke(inputs: readonly string[]): Promise<{ stdout: string; stderr: string; exitCode: unknown }> {
  let stdout = "";
  let stderr = "";
  let exitCode: string | number | null = null;
  const process: StricliProcess = {
    stdout: { write: (value) => { stdout += value; } },
    stderr: { write: (value) => { stderr += value; } },
    get exitCode() { return exitCode; },
    set exitCode(value) { exitCode = value; },
  };
  await run(application, inputs, { process });
  return { stdout, stderr, exitCode };
}

describe("Stricli routing", () => {
  it("generates application help with the routed setup command", async () => {
    const result = await invoke(["--help"]);
    expect(result.stdout).toContain("repository-local setup");
    expect(result.stdout).toContain("COMMANDS");
    expect(result.exitCode).toBe(0);
  });

  it("generates setup help with cwd documentation", async () => {
    const result = await invoke(["setup", "--help"]);
    expect(result.stdout).toContain("[--cwd]");
    expect(result.stdout).toContain("defaults to the current working directory");
  });

  it("reports the package version through Stricli", async () => {
    const result = await invoke(["--version"]);
    expect(result.stdout.trim()).toBe("0.1.0");
  });
});
