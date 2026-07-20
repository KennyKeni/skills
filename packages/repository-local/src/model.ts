export const concernIds = ["github", "architecture", "development"] as const;

export type ConcernId = (typeof concernIds)[number];

export type ConcernValues = {
  readonly github: GithubPreferences;
  readonly architecture: ArchitecturePreferences;
  readonly development: DevelopmentPreferences;
};

export type FileDefinition<Id extends ConcernId> = {
  readonly name: "README.md";
  readonly template: string;
  readonly requiredValues: readonly (keyof ConcernValues[Id] & string)[];
};

export type FolderDefinition<Id extends ConcernId> = {
  readonly id: Id;
  readonly label: string;
  readonly purpose: string;
  readonly defaultPath: string;
  readonly files: readonly FileDefinition<Id>[];
};

export type AnyFolderDefinition = {
  readonly [Id in ConcernId]: FolderDefinition<Id>;
}[ConcernId];

export const folderDefinitions = [
  {
    id: "github",
    label: "GitHub workflow",
    purpose: "Issue, specification, ticket, pull-request, and readiness policy.",
    defaultPath: ".local/github",
    files: [
      {
        name: "README.md",
        template: "github.md",
        requiredValues: [
          "issueConvention",
          "specificationConvention",
          "ticketConvention",
          "labelPolicy",
          "relationshipPolicy",
          "branchConvention",
          "pullRequestConvention",
          "mergePolicy",
          "publicationPolicy",
          "readinessPolicy",
          "wayfinderState",
        ],
      },
    ],
  },
  {
    id: "architecture",
    label: "Architecture",
    purpose: "Stable architecture constraints and links to authoritative design material.",
    defaultPath: ".local/architecture",
    files: [
      {
        name: "README.md",
        template: "architecture.md",
        requiredValues: ["architectureConstraints", "architectureSources"],
      },
    ],
  },
  {
    id: "development",
    label: "Development and review",
    purpose: "Verification, testing, environment, generated-code, and review policy.",
    defaultPath: ".local/development",
    files: [
      {
        name: "README.md",
        template: "development.md",
        requiredValues: [
          "verificationCommands",
          "testingConstraints",
          "reviewChecks",
          "repositoryRules",
          "environmentRequirements",
        ],
      },
    ],
  },
] as const satisfies readonly AnyFolderDefinition[];

export type DiscoveryEvidence = {
  readonly source: string;
  readonly value: string;
};

export type DocumentCandidate = {
  readonly path: string;
  readonly excerpt: string;
  readonly truncated: boolean;
  readonly kinds: readonly ("guidance" | "architecture")[];
};

export type GitRemote = {
  readonly name: string;
  readonly fetchUrl: string;
};

export type GitHubLabel = {
  readonly name: string;
  readonly description: string;
};

export type GitHubLabelDiscovery =
  | { readonly status: "available"; readonly values: readonly GitHubLabel[] }
  | { readonly status: "unavailable"; readonly reason: string };

export type GitHubDiscovery = {
  readonly nameWithOwner: string;
  readonly url: string;
  readonly defaultBranch?: string;
  readonly hasIssuesEnabled: boolean;
  readonly allowedMergeStrategies: readonly string[];
  readonly labels: GitHubLabelDiscovery;
  readonly relationshipFields: readonly string[];
};

export type RepositoryDiscovery = {
  readonly requestedCwd: string;
  readonly repositoryRoot: string;
  readonly isGitRepository: boolean;
  readonly remotes: readonly GitRemote[];
  readonly currentBranch?: string;
  readonly defaultBranchCandidate?: string;
  readonly github?: GitHubDiscovery;
  readonly packageFiles: readonly string[];
  readonly workspaceFiles: readonly string[];
  readonly guidanceFiles: readonly string[];
  readonly architectureFiles: readonly string[];
  readonly documentCandidates: readonly DocumentCandidate[];
  readonly existingLocalPaths: readonly string[];
  readonly verificationCandidates: readonly string[];
  readonly evidence: readonly DiscoveryEvidence[];
};

export type GithubPreferences = {
  readonly issueConvention: string;
  readonly specificationConvention: string;
  readonly ticketConvention: string;
  readonly labelPolicy: string;
  readonly relationshipPolicy: string;
  readonly branchConvention: string;
  readonly pullRequestConvention: string;
  readonly mergePolicy: string;
  readonly publicationPolicy: string;
  readonly readinessPolicy: string;
  readonly wayfinderState: "GitHub" | "local Markdown";
};

export type ArchitecturePreferences = {
  readonly architectureConstraints: string;
  readonly architectureSources: string;
};

export type DevelopmentPreferences = {
  readonly verificationCommands: string;
  readonly testingConstraints: string;
  readonly reviewChecks: string;
  readonly repositoryRules: string;
  readonly environmentRequirements: string;
};

export type ConcernPreference<Id extends ConcernId> = {
  readonly id: Id;
  readonly destination: string;
  readonly values: ConcernValues[Id];
};

export type AnyConcernPreference = {
  readonly [Id in ConcernId]: ConcernPreference<Id>;
}[ConcernId];

export type SetupPreferences = {
  readonly concerns: readonly AnyConcernPreference[];
};

export type PlannedFile<Id extends ConcernId> = {
  readonly name: "README.md";
  readonly template: string;
  readonly requiredValues: readonly (keyof ConcernValues[Id] & string)[];
};

export type PlannedConcern<Id extends ConcernId> = {
  readonly id: Id;
  readonly label: string;
  readonly destination: string;
  readonly files: readonly PlannedFile<Id>[];
  readonly values: ConcernValues[Id];
};

export type AnyPlannedConcern = {
  readonly [Id in ConcernId]: PlannedConcern<Id>;
}[ConcernId];

export type SetupPlan = {
  readonly schemaVersion: 1;
  readonly repositoryRoot: string;
  readonly indexPath: string;
  readonly concerns: readonly AnyPlannedConcern[];
};

export type RenderedConcern<Id extends ConcernId> = PlannedConcern<Id> & {
  readonly renderedFiles: readonly {
    readonly name: "README.md";
    readonly contents: string;
  }[];
};

export type AnyRenderedConcern = {
  readonly [Id in ConcernId]: RenderedConcern<Id>;
}[ConcernId];

export type RenderedPlan = Omit<SetupPlan, "concerns"> & {
  readonly concerns: readonly AnyRenderedConcern[];
};
