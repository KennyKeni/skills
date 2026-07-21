export const concernIds = ["workflow", "architecture", "development", "domain", "papercuts"] as const;

export type ConcernId = (typeof concernIds)[number];

export type ForgeId = "github" | "gitlab" | "none";
export type TrackerId = "forge-issues" | "linear" | "none";
export type ProfileId = "solo" | "team";

export const forgeLabels: Readonly<Record<ForgeId, string>> = {
  github: "GitHub",
  gitlab: "GitLab",
  none: "none",
};

export const trackerLabels: Readonly<Record<TrackerId, string>> = {
  "forge-issues": "forge issues",
  linear: "Linear",
  none: "none",
};

export type FolderDefinition = {
  readonly id: ConcernId;
  readonly label: string;
  readonly purpose: string;
  readonly defaultPath: string;
  readonly fileNames: readonly string[];
  readonly fleetScoped: boolean;
};

export const folderDefinitions = [
  {
    id: "workflow",
    label: "Workflow",
    purpose: "Tracker verb contract, issues, claims, branches, PRs, merges, and CI gates.",
    defaultPath: ".local/workflow",
    fileNames: ["README.md"],
    fleetScoped: false,
  },
  {
    id: "architecture",
    label: "Architecture",
    purpose: "Doctrine, stable constraints, authoritative sources, and decision records.",
    defaultPath: ".local/architecture",
    fileNames: ["README.md", "decisions/README.md"],
    fleetScoped: true,
  },
  {
    id: "development",
    label: "Development and review",
    purpose: "Verification, testing, worktrees, review contract, and environment policy.",
    defaultPath: ".local/development",
    fileNames: ["README.md"],
    fleetScoped: false,
  },
  {
    id: "domain",
    label: "Domain language",
    purpose: "Shared glossary of terms with repository-specific meaning.",
    defaultPath: ".local/domain",
    fileNames: ["README.md"],
    fleetScoped: true,
  },
  {
    id: "papercuts",
    label: "Papercuts",
    purpose:
      "Agent-filed friction reports about instructions, environment, and access; human-triaged, then deleted.",
    defaultPath: ".local/papercuts",
    fileNames: ["README.md"],
    fleetScoped: false,
  },
] as const satisfies readonly FolderDefinition[];

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

export type FleetDiscovery = {
  readonly indexPath: string;
  readonly root: string;
};

export type RepositoryDiscovery = {
  readonly requestedCwd: string;
  readonly repositoryRoot: string;
  readonly isGitRepository: boolean;
  readonly remotes: readonly GitRemote[];
  readonly currentBranch?: string;
  readonly defaultBranchCandidate?: string;
  readonly github?: GitHubDiscovery;
  readonly fleet?: FleetDiscovery;
  readonly memberRepositories: readonly string[];
  readonly packageFiles: readonly string[];
  readonly workspaceFiles: readonly string[];
  readonly guidanceFiles: readonly string[];
  readonly architectureFiles: readonly string[];
  readonly documentCandidates: readonly DocumentCandidate[];
  readonly existingLocalPaths: readonly string[];
  readonly verificationCandidates: readonly string[];
  readonly evidence: readonly DiscoveryEvidence[];
};

export type ForgeSectionValues = {
  readonly branchConvention: string;
  readonly commitConvention: string;
  readonly pullRequestConvention: string;
  readonly mergePolicy: string;
  readonly ciGatePolicy: string;
  readonly publicationPolicy: string;
};

export type TrackerSectionValues = {
  readonly issueConvention: string;
  readonly specificationConvention: string;
  readonly ticketConvention: string;
  readonly labelPolicy: string;
  readonly relationshipPolicy: string;
  readonly claimPolicy: string;
  readonly readinessPolicy: string;
  readonly workContextPolicy: string;
};

export const forgeSectionKeys = [
  "branchConvention",
  "commitConvention",
  "pullRequestConvention",
  "mergePolicy",
  "ciGatePolicy",
  "publicationPolicy",
] as const satisfies readonly (keyof ForgeSectionValues)[];

export const trackerSectionKeys = [
  "issueConvention",
  "specificationConvention",
  "ticketConvention",
  "labelPolicy",
  "relationshipPolicy",
  "claimPolicy",
  "readinessPolicy",
  "workContextPolicy",
] as const satisfies readonly (keyof TrackerSectionValues)[];

export type ForgeSelection =
  | { readonly id: "github"; readonly values: ForgeSectionValues }
  | { readonly id: "gitlab"; readonly values: ForgeSectionValues }
  | { readonly id: "none" };

export type TrackerSelection =
  | { readonly id: "forge-issues"; readonly values: TrackerSectionValues }
  | { readonly id: "linear"; readonly values: TrackerSectionValues }
  | { readonly id: "none" };

export type SurveyItem = {
  readonly section: string;
  readonly evidence: string;
};

// forge "none" cannot host forge issues; the union makes that combination
// unrepresentable rather than validated at runtime.
export type WorkflowPreferences =
  | {
      readonly profile: ProfileId;
      readonly forge: Extract<ForgeSelection, { readonly id: "github" | "gitlab" }>;
      readonly tracker: TrackerSelection;
      readonly survey: readonly SurveyItem[];
    }
  | {
      readonly profile: ProfileId;
      readonly forge: Extract<ForgeSelection, { readonly id: "none" }>;
      readonly tracker: Exclude<TrackerSelection, { readonly id: "forge-issues" }>;
      readonly survey: readonly SurveyItem[];
    };

export const architectureStyleIds = [
  "modular-hexagonal",
  "layered",
  "framework-idiomatic",
  "flat-minimal",
  "serverless",
] as const;

export type ArchitectureStyleId = (typeof architectureStyleIds)[number];

export const architectureStyleLabels: Readonly<Record<ArchitectureStyleId, string>> = {
  "modular-hexagonal": "modular hexagonal",
  layered: "layered",
  "framework-idiomatic": "framework idiomatic",
  "flat-minimal": "flat minimal",
  serverless: "serverless",
};

// Fleet-scoped architecture carries fixed cross-service doctrine; only
// repository-scoped architecture chooses an internal style.
export type ArchitecturePreferences =
  | {
      readonly scope: "repository";
      readonly style: ArchitectureStyleId;
      readonly architectureConstraints: string;
      readonly architectureSources: string;
    }
  | {
      readonly scope: "fleet";
      readonly architectureConstraints: string;
      readonly architectureSources: string;
    };

export type DevelopmentPreferences = {
  readonly verificationCommands: string;
  readonly testingConstraints: string;
  readonly worktreeRules: string;
  readonly reviewChecks: string;
  readonly repositoryRules: string;
  readonly environmentRequirements: string;
};

export type DomainPreferences = {
  readonly domainEntries: string;
};

export type AnyConcernPreference =
  | { readonly id: "workflow"; readonly destination: string; readonly workflow: WorkflowPreferences }
  | { readonly id: "architecture"; readonly destination: string; readonly values: ArchitecturePreferences }
  | { readonly id: "development"; readonly destination: string; readonly values: DevelopmentPreferences }
  | { readonly id: "domain"; readonly destination: string; readonly values: DomainPreferences }
  | { readonly id: "papercuts"; readonly destination: string };

export type SetupMode = "repository" | "fleet";

export type SetupPreferences = {
  readonly mode: SetupMode;
  readonly fleetLink?: string;
  readonly umbrellaHome?: string;
  readonly concerns: readonly AnyConcernPreference[];
};

export type PlannedFile = {
  readonly name: string;
  readonly templates: readonly string[];
  readonly requiredValues: readonly string[];
};

export type PlannedConcern = {
  readonly id: ConcernId;
  readonly label: string;
  readonly destination: string;
  readonly files: readonly PlannedFile[];
  readonly values: Readonly<Record<string, string>>;
};

export type IndexExtras = {
  readonly mode: SetupMode;
  readonly fleetLink?: string;
  readonly members?: readonly string[];
  readonly umbrellaHome?: string;
};

export type SetupPlan = {
  readonly schemaVersion: 2;
  readonly repositoryRoot: string;
  readonly indexPath: string;
  readonly index: IndexExtras;
  readonly concerns: readonly PlannedConcern[];
};

export type RenderedFile = {
  readonly name: string;
  readonly contents: string;
};

export type RenderedConcern = PlannedConcern & {
  readonly renderedFiles: readonly RenderedFile[];
};

export type RenderedPlan = Omit<SetupPlan, "concerns"> & {
  readonly concerns: readonly RenderedConcern[];
};
