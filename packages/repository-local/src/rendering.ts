import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import type {
  ConcernId,
  ConcernValues,
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

function renderTemplate<Id extends ConcernId>(
  source: string,
  concern: PlannedConcern<Id>,
  requiredValues: readonly (keyof ConcernValues[Id] & string)[],
): string {
  let rendered = source;

  const declared = new Set<string>(requiredValues);
  const sourcePlaceholders = [...source.matchAll(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g)]
    .map((match) => match[1])
    .filter((key): key is string => key !== undefined);
  const undeclared = sourcePlaceholders.filter((key) => !declared.has(key));
  if (undeclared.length > 0) {
    throw new Error(
      `Unresolved template values for ${concern.id}: ${[...new Set(undeclared)].join(", ")}`,
    );
  }

  for (const key of requiredValues) {
    const value: unknown = concern.values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Missing required template value '${key}' for ${concern.id}.`);
    }
    rendered = rendered.replaceAll(`{{${key}}}`, value.trim());
  }

  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

export async function renderConcern<Id extends ConcernId>(
  concern: PlannedConcern<Id>,
  loadTemplate: TemplateLoader = loadPackagedTemplate,
): Promise<RenderedConcern<Id>> {
  return {
    ...concern,
    renderedFiles: await Promise.all(concern.files.map(async (file) => ({
      name: file.name,
      contents: renderTemplate(await loadTemplate(file.template), concern, file.requiredValues),
    }))),
  };
}

export async function renderPlan(
  plan: SetupPlan,
  loadTemplate: TemplateLoader = loadPackagedTemplate,
): Promise<RenderedPlan> {
  const concerns = await Promise.all(
    plan.concerns.map((concern) => {
      switch (concern.id) {
        case "github": return renderConcern(concern, loadTemplate);
        case "architecture": return renderConcern(concern, loadTemplate);
        case "development": return renderConcern(concern, loadTemplate);
      }
    }),
  );

  return { ...plan, concerns };
}

export function renderIndex(plan: SetupPlan, concernIds?: ReadonlySet<string>): string {
  const selected = concernIds === undefined
    ? plan.concerns
    : plan.concerns.filter((concern) => concernIds.has(concern.id));
  return renderIndexEntries(plan.indexPath, selected);
}

export type IndexEntry = {
  readonly label: string;
  readonly destination: string;
};

export function renderIndexEntries(indexPath: string, selected: readonly IndexEntry[]): string {
  const links = selected.map((concern) => {
    const readmePath = join(concern.destination, "README.md");
    const relativePath = relative(dirname(indexPath), readmePath).replaceAll("\\", "/");
    return `- [${concern.label}](${relativePath})`;
  });

  return [
    "# Repository-local policy",
    "",
    "This file is navigation only. Read the concern policy relevant to the current task.",
    "Use live repository and GitHub state for current facts.",
    "",
    ...(links.length > 0 ? links : ["No concerns were configured during setup."]),
    "",
  ].join("\n");
}
