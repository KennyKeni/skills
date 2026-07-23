import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import type {
  IndexExtras,
  PlannedConcern,
  RenderedConcern,
  RenderedPlan,
  SetupPlan,
} from "./model.js";

export type TemplateLoader = (assetName: string) => Promise<string>;

export const loadPackagedTemplate: TemplateLoader = async (assetName) => {
  const templateUrl = new URL(`../templates/${assetName}`, import.meta.url);
  return readFile(templateUrl, "utf8");
};

function renderSource(
  source: string,
  concernId: string,
  values: Readonly<Record<string, string>>,
  requiredValues: readonly string[],
): string {
  let rendered = source;

  const declared = new Set<string>(requiredValues);
  const sourcePlaceholders = [...source.matchAll(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g)]
    .map((match) => match[1])
    .filter((key): key is string => key !== undefined);
  const undeclared = sourcePlaceholders.filter((key) => !declared.has(key));
  if (undeclared.length > 0) {
    throw new Error(
      `Unresolved template values for ${concernId}: ${[...new Set(undeclared)].join(", ")}`,
    );
  }

  for (const key of requiredValues) {
    const value: unknown = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Missing required template value '${key}' for ${concernId}.`);
    }
    rendered = rendered.replaceAll(`{{${key}}}`, value.trim());
  }

  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

export async function renderConcern(
  concern: PlannedConcern,
  loadTemplate: TemplateLoader = loadPackagedTemplate,
): Promise<RenderedConcern> {
  return {
    ...concern,
    renderedFiles: await Promise.all(concern.files.map(async (file) => {
      const sources = await Promise.all(file.templates.map((template) => loadTemplate(template)));
      return {
        name: file.name,
        contents: renderSource(sources.join("\n"), concern.id, concern.values, file.requiredValues),
      };
    })),
  };
}

export async function renderPlan(
  plan: SetupPlan,
  loadTemplate: TemplateLoader = loadPackagedTemplate,
): Promise<RenderedPlan> {
  const concerns = await Promise.all(
    plan.concerns.map((concern) => renderConcern(concern, loadTemplate)),
  );

  return { ...plan, concerns };
}

export type IndexEntry = {
  readonly label: string;
  readonly destination: string;
};

const defaultIndexExtras: IndexExtras = { mode: "repository" };

export function renderIndexEntries(
  indexPath: string,
  selected: readonly IndexEntry[],
  extras: IndexExtras = defaultIndexExtras,
): string {
  const links = selected.map((concern) => {
    const readmePath = join(concern.destination, "README.md");
    const relativePath = relative(dirname(indexPath), readmePath).replaceAll("\\", "/");
    return `- [${concern.label}](${relativePath})`;
  });

  const heading = extras.mode === "fleet" ? "# Fleet policy index" : "# Local policy index";
  const preamble = extras.mode === "fleet"
    ? [
        "This file is navigation only for policy shared across the member",
        "repositories listed below. Each member owns its repository-scoped policy",
        "in its own `.local/` tree.",
      ]
    : [
        "This file is navigation only. Read the concern policy relevant to the",
        "current task. Use live repository and forge state for current facts.",
      ];

  const fleetLinkLines = extras.fleetLink === undefined
    ? []
    : ["", `Fleet policy: [fleet index](${extras.fleetLink}) — read it for fleet-scoped concerns.`];

  const memberLines = extras.members === undefined || extras.members.length === 0
    ? []
    : ["", "## Members", "", ...extras.members.map((member) => `- ${member}`)];

  const umbrellaLines = extras.umbrellaHome === undefined
    ? []
    : ["", `Cross-repository umbrella home: ${extras.umbrellaHome}`];

  const workLines = extras.mode === "fleet"
    ? []
    : [
        "",
        "Transient work context lives in `work/<slug>/` beside this file; agents",
        "create it when work is claimed and delete it when the work item resolves.",
        "Setup never creates it.",
      ];

  const scrapLines = [
    "",
    "Free-form drafts — design explorations, issue drafts, planning notes —",
    "live in `scratch/` beside this file. Nothing there is authoritative or",
    "citable: policy, decisions, and tickets never reference it, a draft is",
    "promoted to its real home when it starts to matter, and the folder may",
    "be cleared at any time without review. Setup never creates it.",
  ];

  return [
    heading,
    "",
    ...preamble,
    ...fleetLinkLines,
    "",
    ...(links.length > 0 ? links : ["No concerns were configured during setup."]),
    ...memberLines,
    ...umbrellaLines,
    ...workLines,
    ...scrapLines,
    "",
  ].join("\n");
}

export function renderIndex(plan: SetupPlan, concernIds?: ReadonlySet<string>): string {
  const selected = concernIds === undefined
    ? plan.concerns
    : plan.concerns.filter((concern) => concernIds.has(concern.id));
  return renderIndexEntries(plan.indexPath, selected, plan.index);
}
