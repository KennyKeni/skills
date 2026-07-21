import { join } from "node:path";

import type {
  ConcernId,
  ForgeId,
  ForgeSectionValues,
  ProfileId,
  RenderedPlan,
  RepositoryDiscovery,
  SetupPlan,
  TrackerId,
  TrackerSectionValues,
  WorkflowPreferences,
} from "../src/model.js";
import type { PromptDriver, SectionMode, TextRequest } from "../src/prompts.js";

export const trackerValues: TrackerSectionValues = {
  issueConvention: "Issue convention.",
  specificationConvention: "Specification convention.",
  ticketConvention: "Ticket convention.",
  labelPolicy: "Label policy.",
  relationshipPolicy: "Relationship policy.",
  claimPolicy: "Claim policy.",
  readinessPolicy: "Readiness policy.",
  workContextPolicy: "Work context policy.",
};

export const forgeValues: ForgeSectionValues = {
  branchConvention: "Branch convention.",
  commitConvention: "Commit convention.",
  pullRequestConvention: "Pull request convention.",
  mergePolicy: "Merge policy.",
  ciGatePolicy: "CI gate policy.",
  publicationPolicy: "Publication policy.",
};

export const workflowPreferences: WorkflowPreferences = {
  profile: "solo",
  forge: { id: "github", values: forgeValues },
  tracker: { id: "forge-issues", values: trackerValues },
  survey: [],
};

export function discoveryFor(root: string): RepositoryDiscovery {
  return {
    requestedCwd: root,
    repositoryRoot: root,
    isGitRepository: true,
    remotes: [],
    memberRepositories: [],
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
    schemaVersion: 2,
    repositoryRoot: root,
    indexPath: join(root, ".local", "INDEX.md"),
    index: { mode: "repository" },
    concerns: [
      {
        id: "workflow",
        label: "Workflow",
        destination: join(root, ".local", "workflow"),
        files: [
          {
            name: "README.md",
            templates: ["test.md"],
            requiredValues: ["issueConvention"],
          },
        ],
        values: { issueConvention: "Issue convention." },
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

export class StubDriver implements PromptDriver {
  public readonly requests: TextRequest[] = [];
  public finished = "";

  public start(_discovery: RepositoryDiscovery): void {}
  public async confirmFleetSetup(_root: string, _members: readonly string[]): Promise<boolean> {
    return true;
  }
  public async confirmFleetLink(_fleetIndexPath: string): Promise<boolean> {
    return true;
  }
  public async chooseProfile(): Promise<ProfileId> {
    return "solo";
  }
  public async chooseForge(initial: ForgeId): Promise<ForgeId> {
    return initial;
  }
  public async chooseTracker(initial: TrackerId, _allowForgeIssues: boolean): Promise<TrackerId> {
    return initial;
  }
  public async chooseConcern(
    _id: ConcernId,
    _label: string,
    _purpose: string,
    _files: readonly string[],
    configureInitially: boolean,
  ): Promise<boolean> {
    return configureInitially;
  }
  public async destination(_label: string, initialValue: string): Promise<string> {
    return initialValue;
  }
  public async sectionMode(
    _group: string,
    _profile: ProfileId,
    _allowSurvey: boolean,
  ): Promise<SectionMode> {
    return "defaults";
  }
  public async policyText(request: TextRequest): Promise<string> {
    this.requests.push(request);
    return request.initialValue;
  }
  public async umbrellaHome(initialValue: string): Promise<string> {
    return initialValue;
  }
  public showPlan(_plan: SetupPlan): void {}
  public async confirmWrite(): Promise<boolean> {
    return true;
  }
  public async confirmMemberSetup(_members: readonly string[]): Promise<boolean> {
    return false;
  }
  public finish(message: string): void {
    this.finished = message;
  }
}
