import { buildApplication, buildCommand, buildRouteMap } from "@stricli/core";
import { readFileSync } from "node:fs";

import { runSetup, type SetupFlags } from "./setup.js";

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { readonly version: string };

export const version = manifest.version;

export const setupCommand = buildCommand<SetupFlags>({
  docs: {
    brief: "Create repository-local policy through an interactive, evidence-backed plan.",
    fullDescription:
      "Discovers repository facts, asks only for policy choices, previews a typed plan, and safely creates missing user-owned policy folders without overwriting existing destinations.",
  },
  parameters: {
    flags: {
      cwd: {
        kind: "parsed",
        parse: String,
        brief: "Repository or subdirectory to inspect; defaults to the current working directory.",
        placeholder: "path",
        optional: true,
      },
    },
  },
  func: async (flags) => {
    await runSetup(flags);
  },
});

export const routeMap = buildRouteMap({
  routes: {
    setup: setupCommand,
  },
  docs: {
    brief: "Bootstrap user-owned repository-local policy for coding agents.",
    fullDescription:
      "Policy generation is separate from runtime harness bootstrap and from explicitly invoked reusable skills.",
  },
});

export const application = buildApplication(routeMap, {
  name: "groundwork",
  versionInfo: { currentVersion: version },
  scanner: {
    caseStyle: "allow-kebab-for-camel",
    allowArgumentEscapeSequence: true,
  },
  documentation: {
    caseStyle: "convert-camel-to-kebab",
  },
});
