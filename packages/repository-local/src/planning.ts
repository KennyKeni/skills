import { isAbsolute, relative, resolve, sep } from "node:path";

import {
  folderDefinitions,
  type AnyConcernPreference,
  type AnyPlannedConcern,
  type RepositoryDiscovery,
  type SetupPlan,
  type SetupPreferences,
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

function assertNoDestinationCollisions(concerns: readonly AnyPlannedConcern[]): void {
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

function plannedConcern(
  preference: AnyConcernPreference,
  discovery: RepositoryDiscovery,
): AnyPlannedConcern {
  const definition = folderDefinitions.find((candidate) => candidate.id === preference.id);
  if (definition === undefined) throw new Error(`Unknown concern: ${preference.id}`);
  const destination = resolveDestination(discovery.repositoryRoot, preference.destination);

  switch (preference.id) {
    case "github":
      return { ...definition, id: "github", destination, files: folderDefinitions[0].files, values: preference.values };
    case "architecture":
      return { ...definition, id: "architecture", destination, files: folderDefinitions[1].files, values: preference.values };
    case "development":
      return { ...definition, id: "development", destination, files: folderDefinitions[2].files, values: preference.values };
  }
}

export function buildSetupPlan(
  discovery: RepositoryDiscovery,
  preferences: SetupPreferences,
): SetupPlan {
  const seenIds = new Set<string>();

  const concerns = preferences.concerns.map((preference): AnyPlannedConcern => {
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
    schemaVersion: 1,
    repositoryRoot: discovery.repositoryRoot,
    indexPath,
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
