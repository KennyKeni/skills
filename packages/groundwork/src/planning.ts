import { isAbsolute, relative, resolve, sep } from "node:path";

import {
  architectureStyleLabels,
  folderDefinitions,
  forgeLabels,
  forgeSectionKeys,
  trackerLabels,
  trackerSectionKeys,
  type AnyConcernPreference,
  type PlannedConcern,
  type PlannedFile,
  type RepositoryDiscovery,
  type SetupPlan,
  type SetupPreferences,
  type WorkflowPreferences,
} from "./model.js";

function isInside(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== "..");
}

export function resolveDestination(repositoryRoot: string, configuredPath: string): string {
  const trimmed = configuredPath.trim();
  if (trimmed.length === 0) {
    throw new Error("Destination paths cannot be empty.");
  }

  const destination = resolve(repositoryRoot, trimmed);
  if (!isInside(repositoryRoot, destination)) {
    throw new Error(`Destination escapes the repository root: ${configuredPath}`);
  }
  if (destination === repositoryRoot) {
    throw new Error("A concern destination cannot be the repository root.");
  }

  return destination;
}

function assertNoDestinationCollisions(concerns: readonly PlannedConcern[]): void {
  for (const [index, concern] of concerns.entries()) {
    for (const other of concerns.slice(index + 1)) {
      const relationship = relative(concern.destination, other.destination);
      const reverseRelationship = relative(other.destination, concern.destination);
      if (
        relationship === "" ||
        (!isAbsolute(relationship) && !relationship.startsWith(`..${sep}`) && relationship !== "..") ||
        (!isAbsolute(reverseRelationship) &&
          !reverseRelationship.startsWith(`..${sep}`) &&
          reverseRelationship !== "..")
      ) {
        throw new Error(
          `Concern destinations must be distinct and non-nested: ${concern.destination} and ${other.destination}`,
        );
      }
    }
  }
}

function definitionFor(id: AnyConcernPreference["id"]) {
  const definition = folderDefinitions.find((candidate) => candidate.id === id);
  if (definition === undefined) throw new Error(`Unknown concern: ${id}`);
  return definition;
}

function trackerTemplate(workflow: WorkflowPreferences): string {
  switch (workflow.tracker.id) {
    case "forge-issues":
      return workflow.forge.id === "gitlab"
        ? "workflow/tracker/gitlab-issues.md"
        : "workflow/tracker/github-issues.md";
    case "linear":
      return "workflow/tracker/linear.md";
    case "none":
      return "workflow/tracker/none.md";
  }
}

function plannedWorkflow(workflow: WorkflowPreferences): Pick<PlannedConcern, "files" | "values"> {
  const values: Record<string, string> = {
    forgeLabel: forgeLabels[workflow.forge.id],
    trackerLabel: trackerLabels[workflow.tracker.id],
    profileLabel: workflow.profile,
  };
  const requiredValues: string[] = ["forgeLabel", "trackerLabel", "profileLabel"];

  if (workflow.tracker.id !== "none") {
    for (const key of trackerSectionKeys) {
      values[key] = workflow.tracker.values[key];
      requiredValues.push(key);
    }
  }
  if (workflow.forge.id !== "none") {
    for (const key of forgeSectionKeys) {
      values[key] = workflow.forge.values[key];
      requiredValues.push(key);
    }
  }

  const files: PlannedFile[] = [
    {
      name: "README.md",
      templates: ["workflow/header.md", trackerTemplate(workflow), `workflow/forge/${workflow.forge.id}.md`],
      requiredValues,
    },
  ];

  if (workflow.survey.length > 0) {
    values["surveyItems"] = workflow.survey
      .map((item) => `- **${item.section}** — ${item.evidence}`)
      .join("\n");
    files.push({
      name: "SURVEY.md",
      templates: ["workflow/survey.md"],
      requiredValues: ["surveyItems"],
    });
  }

  return { files, values };
}

function plannedConcern(
  preference: AnyConcernPreference,
  discovery: RepositoryDiscovery,
): PlannedConcern {
  const definition = definitionFor(preference.id);
  const destination = resolveDestination(discovery.repositoryRoot, preference.destination);
  const base = { id: definition.id, label: definition.label, destination };

  switch (preference.id) {
    case "workflow":
      return { ...base, ...plannedWorkflow(preference.workflow) };
    case "architecture": {
      const decisionsFile: PlannedFile = {
        name: "decisions/README.md",
        templates: ["architecture-decisions.md"],
        requiredValues: [],
      };
      const sectionValues = {
        architectureConstraints: preference.values.architectureConstraints,
        architectureSources: preference.values.architectureSources,
      };

      if (preference.values.scope === "fleet") {
        return {
          ...base,
          files: [
            {
              name: "README.md",
              templates: ["architecture/fleet.md"],
              requiredValues: ["architectureConstraints", "architectureSources"],
            },
            decisionsFile,
          ],
          values: sectionValues,
        };
      }

      const files: PlannedFile[] = [
        {
          name: "README.md",
          templates: [
            "architecture/header.md",
            `architecture/style/${preference.values.style}.md`,
            "architecture/footer.md",
          ],
          requiredValues: ["styleLabel", "architectureConstraints", "architectureSources"],
        },
        decisionsFile,
      ];
      if (preference.values.style === "modular-hexagonal") {
        files.push({
          name: "SHAPES.md",
          templates: ["architecture/shapes.md"],
          requiredValues: [],
        });
      }
      return {
        ...base,
        files,
        values: {
          styleLabel: architectureStyleLabels[preference.values.style],
          ...sectionValues,
        },
      };
    }
    case "development":
      return {
        ...base,
        files: [
          {
            name: "README.md",
            templates: ["development.md"],
            requiredValues: [
              "verificationCommands",
              "testingConstraints",
              "worktreeRules",
              "reviewChecks",
              "repositoryRules",
              "environmentRequirements",
            ],
          },
        ],
        values: preference.values,
      };
    case "domain":
      return {
        ...base,
        files: [
          {
            name: "README.md",
            templates: ["domain.md"],
            requiredValues: ["domainEntries"],
          },
        ],
        values: preference.values,
      };
    case "papercuts":
      return {
        ...base,
        files: [
          {
            name: "README.md",
            templates: ["papercuts.md"],
            requiredValues: [],
          },
        ],
        values: {},
      };
  }
}

export function buildSetupPlan(
  discovery: RepositoryDiscovery,
  preferences: SetupPreferences,
): SetupPlan {
  const seenIds = new Set<string>();

  const concerns = preferences.concerns.map((preference): PlannedConcern => {
    if (seenIds.has(preference.id)) {
      throw new Error(`Concern selected more than once: ${preference.id}`);
    }
    seenIds.add(preference.id);

    return plannedConcern(preference, discovery);
  });

  assertNoDestinationCollisions(concerns);

  const indexPath = resolve(discovery.repositoryRoot, ".local/INDEX.md");
  for (const concern of concerns) {
    const fromIndex = relative(indexPath, concern.destination);
    if (
      fromIndex === "" ||
      (!isAbsolute(fromIndex) && !fromIndex.startsWith(`..${sep}`) && fromIndex !== "..")
    ) {
      throw new Error("A concern destination cannot be .local/INDEX.md or nested beneath it.");
    }
  }
  if (concerns.some((concern) => concern.destination === resolve(discovery.repositoryRoot, ".local"))) {
    throw new Error("A concern destination cannot be .local because it owns INDEX.md.");
  }

  return {
    schemaVersion: 2,
    repositoryRoot: discovery.repositoryRoot,
    indexPath,
    index: {
      mode: preferences.mode,
      ...(preferences.fleetLink === undefined ? {} : { fleetLink: preferences.fleetLink }),
      ...(preferences.mode === "fleet" && discovery.memberRepositories.length > 0
        ? { members: discovery.memberRepositories }
        : {}),
      ...(preferences.umbrellaHome === undefined ? {} : { umbrellaHome: preferences.umbrellaHome }),
    },
    concerns,
  };
}

export function formatPlan(plan: SetupPlan): string {
  const lines = [`.local/INDEX.md`, ...plan.concerns.map((concern) => {
    const files = concern.files.map((file) => file.name).join(", ");
    return `${relative(plan.repositoryRoot, concern.destination)} (${files})`;
  })];
  return lines.map((line) => `- ${line}`).join("\n");
}
