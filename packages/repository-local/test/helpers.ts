import { join } from "node:path";

import type {
  GithubPreferences,
  RenderedPlan,
  RepositoryDiscovery,
  SetupPlan,
} from "../src/model.js";

export const githubValues: GithubPreferences = {
  issueConvention: "Issue convention.",
  specificationConvention: "Specification convention.",
  ticketConvention: "Ticket convention.",
  labelPolicy: "Label policy.",
  relationshipPolicy: "Relationship policy.",
  branchConvention: "Branch convention.",
  pullRequestConvention: "Pull request convention.",
  mergePolicy: "Merge policy.",
  publicationPolicy: "Publication policy.",
  readinessPolicy: "Readiness policy.",
  wayfinderState: "GitHub",
};

export function discoveryFor(root: string): RepositoryDiscovery {
  return {
    requestedCwd: root,
    repositoryRoot: root,
    isGitRepository: true,
    remotes: [],
    packageFiles: [],
    workspaceFiles: [],
    guidanceFiles: [],
    architectureFiles: [],
    documentCandidates: [],
    existingLocalPaths: [],
    verificationCandidates: [],
    evidence: [],
  };
}

export function setupPlanFor(root: string): SetupPlan {
  return {
    schemaVersion: 1,
    repositoryRoot: root,
    indexPath: join(root, ".local", "INDEX.md"),
    concerns: [
      {
        id: "github",
        label: "GitHub workflow",
        destination: join(root, ".local", "github"),
        files: [
          {
            name: "README.md",
            template: "github.md",
            requiredValues: ["issueConvention"],
          },
        ],
        values: githubValues,
      },
    ],
  };
}

export function renderedPlanFor(root: string): RenderedPlan {
  const plan = setupPlanFor(root);
  return {
    ...plan,
    concerns: plan.concerns.map((concern) => ({
      ...concern,
      renderedFiles: [{ name: "README.md", contents: "# Complete policy\n" }],
    })),
  };
}
