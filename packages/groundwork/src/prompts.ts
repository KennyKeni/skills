import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiline,
  note,
  outro,
  select,
  text,
} from "@clack/prompts";
import { join, relative } from "node:path";

import {
  architectureDefaults,
  developmentDefaults,
  domainDefaults,
  githubForgeDefaults,
  githubIssuesTrackerDefaults,
  gitlabForgeDefaults,
  gitlabIssuesTrackerDefaults,
  linearTrackerDefaults,
  unresolvedMarker,
} from "./defaults.js";
import {
  folderDefinitions,
  forgeSectionKeys,
  trackerSectionKeys,
  type AnyConcernPreference,
  type ArchitectureStyleId,
  type ConcernId,
  type ForgeId,
  type ForgeSectionValues,
  type ForgeSelection,
  type ProfileId,
  type RepositoryDiscovery,
  type SetupPlan,
  type SetupPreferences,
  type SurveyItem,
  type TrackerId,
  type TrackerSectionValues,
  type TrackerSelection,
  type WorkflowPreferences,
} from "./model.js";
import { formatPlan, resolveDestination } from "./planning.js";

export class SetupCancelledError extends Error {
  public constructor() {
    super("Setup cancelled.");
    this.name = "SetupCancelledError";
  }
}

export type TextRequest = {
  readonly message: string;
  readonly initialValue: string;
  readonly optional?: boolean;
};

export type SectionMode = "defaults" | "review" | "survey";

export interface PromptDriver {
  start(discovery: RepositoryDiscovery): void;
  confirmFleetSetup(root: string, members: readonly string[]): Promise<boolean>;
  confirmFleetLink(fleetIndexPath: string): Promise<boolean>;
  chooseProfile(): Promise<ProfileId>;
  chooseForge(initial: ForgeId): Promise<ForgeId>;
  chooseTracker(initial: TrackerId, allowForgeIssues: boolean): Promise<TrackerId>;
  chooseArchitectureStyle(initial: ArchitectureStyleId): Promise<ArchitectureStyleId>;
  chooseConcern(
    id: ConcernId,
    label: string,
    purpose: string,
    files: readonly string[],
    configureInitially: boolean,
  ): Promise<boolean>;
  destination(label: string, initialValue: string, repositoryRoot: string): Promise<string>;
  sectionMode(group: string, profile: ProfileId, allowSurvey: boolean): Promise<SectionMode>;
  policyText(request: TextRequest): Promise<string>;
  umbrellaHome(initialValue: string): Promise<string>;
  showPlan(plan: SetupPlan): void;
  confirmWrite(): Promise<boolean>;
  confirmMemberSetup(members: readonly string[]): Promise<boolean>;
  finish(message: string): void;
}

function unwrap<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Setup cancelled. No files were written.");
    throw new SetupCancelledError();
  }
  return value;
}

export class ClackPromptDriver implements PromptDriver {
  public start(discovery: RepositoryDiscovery): void {
    intro("groundwork setup");
    note(
      [
        `Working directory: ${discovery.requestedCwd}`,
        `Repository root: ${discovery.repositoryRoot}`,
        `Git repository: ${discovery.isGitRepository ? "yes" : "no"}`,
        `GitHub: ${discovery.github?.nameWithOwner ?? "not discovered"}`,
        `Fleet policy: ${discovery.fleet?.indexPath ?? "none found"}`,
        `Existing .local paths: ${discovery.existingLocalPaths.length}`,
      ].join("\n"),
      "Deterministic discovery",
    );
    if (discovery.evidence.length > 0) {
      note(
        discovery.evidence.map((item) => `${item.source}: ${item.value}`).join("\n"),
        "Evidence",
      );
    }
  }

  public async confirmFleetSetup(root: string, members: readonly string[]): Promise<boolean> {
    note(
      [
        `No git repository at ${root}.`,
        `Member repositories found: ${members.join(", ")}`,
      ].join("\n"),
      "Fleet setup",
    );
    return unwrap(
      await confirm({
        message: "Set up fleet policy here for the member repositories?",
        initialValue: true,
      }),
    );
  }

  public async confirmFleetLink(fleetIndexPath: string): Promise<boolean> {
    return unwrap(
      await confirm({
        message: `Fleet policy found at ${fleetIndexPath}. Link it from this repository's index?`,
        initialValue: true,
      }),
    );
  }

  public async chooseProfile(): Promise<ProfileId> {
    return unwrap(
      await select({
        message: "Profile?",
        initialValue: "solo" as ProfileId,
        options: [
          { value: "solo" as ProfileId, label: "solo — opinionated agent-first defaults" },
          {
            value: "team" as ProfileId,
            label: "team — conform to this project; a survey directs an agent to fill sections from evidence",
          },
        ],
      }),
    );
  }

  public async chooseForge(initial: ForgeId): Promise<ForgeId> {
    return unwrap(
      await select({
        message: "Forge (where code is hosted)?",
        initialValue: initial,
        options: [
          { value: "github" as ForgeId, label: "GitHub" },
          { value: "gitlab" as ForgeId, label: "GitLab" },
          { value: "none" as ForgeId, label: "None — bare git" },
        ],
      }),
    );
  }

  public async chooseTracker(initial: TrackerId, allowForgeIssues: boolean): Promise<TrackerId> {
    return unwrap(
      await select({
        message: "Tracker (where work items live)?",
        initialValue: initial,
        options: [
          ...(allowForgeIssues
            ? [{ value: "forge-issues" as TrackerId, label: "Forge issues (GitHub/GitLab issues)" }]
            : []),
          { value: "linear" as TrackerId, label: "Linear" },
          { value: "none" as TrackerId, label: "None — local tickets and review comments only" },
        ],
      }),
    );
  }

  public async chooseArchitectureStyle(initial: ArchitectureStyleId): Promise<ArchitectureStyleId> {
    return unwrap(
      await select({
        message: "Architecture style (writes the doctrine, layout, and seam rules)?",
        initialValue: initial,
        options: [
          {
            value: "modular-hexagonal" as ArchitectureStyleId,
            label: "Modular hexagonal",
            hint: "capability modules owning their state; ports only under concrete pressure",
          },
          {
            value: "layered" as ArchitectureStyleId,
            label: "Layered",
            hint: "controllers/services/repositories by technical role; repository interface is the seam",
          },
          {
            value: "framework-idiomatic" as ArchitectureStyleId,
            label: "Framework idiomatic",
            hint: "Rails/Django/Laravel/Nest conventions are the architecture; no repository over the ORM",
          },
          {
            value: "flat-minimal" as ArchitectureStyleId,
            label: "Flat minimal",
            hint: "one procedure per use case, database inline; add structure only when it hurts",
          },
          {
            value: "serverless" as ArchitectureStyleId,
            label: "Serverless",
            hint: "one handler per endpoint/event with a shared logic layer; infra config maps the tree",
          },
        ],
      }),
    );
  }

  public async chooseConcern(
    _id: ConcernId,
    label: string,
    purpose: string,
    files: readonly string[],
    configureInitially: boolean,
  ): Promise<boolean> {
    note(`${purpose}\n\nFiles:\n${files.map((file) => `  ${file}`).join("\n")}`, label);
    return unwrap(
      await select({
        message: `What should setup do with ${label}?`,
        initialValue: configureInitially ? "configure" : "skip",
        options: [
          { value: "configure", label: "Configure folder" },
          { value: "skip", label: "Skip folder" },
        ],
      }),
    ) === "configure";
  }

  public async destination(
    label: string,
    initialValue: string,
    repositoryRoot: string,
  ): Promise<string> {
    return unwrap(
      await text({
        message: `Folder path for ${label}`,
        initialValue,
        validate: (value) => {
          try {
            resolveDestination(repositoryRoot, value ?? "");
            return undefined;
          } catch (error) {
            return error instanceof Error ? error.message : "Invalid destination path.";
          }
        },
      }),
    );
  }

  public async sectionMode(
    group: string,
    profile: ProfileId,
    allowSurvey: boolean,
  ): Promise<SectionMode> {
    const initialValue: SectionMode = allowSurvey && profile === "team" ? "survey" : "defaults";
    return unwrap(
      await select({
        message: `${group}?`,
        initialValue,
        options: [
          { value: "defaults" as SectionMode, label: "Accept the prepared defaults" },
          { value: "review" as SectionMode, label: "Review and edit each section" },
          ...(allowSurvey
            ? [{
                value: "survey" as SectionMode,
                label: "Leave unresolved — SURVEY.md directs an agent to fill them from evidence",
              }]
            : []),
        ],
      }),
    );
  }

  public async policyText(request: TextRequest): Promise<string> {
    return unwrap(
      await multiline({
        message: request.message,
        initialValue: request.initialValue,
        validate: (value) => {
          if (request.optional === true || (value?.trim().length ?? 0) > 0) return undefined;
          return "Enter a policy value, or state that no additional rule is recorded.";
        },
      }),
    ).trim() || "No additional repository-specific rule is recorded.";
  }

  public async umbrellaHome(initialValue: string): Promise<string> {
    return unwrap(
      await text({
        message: "Umbrella home for cross-repository specifications?",
        initialValue,
      }),
    ).trim() || initialValue;
  }

  public showPlan(plan: SetupPlan): void {
    note(formatPlan(plan), "Write plan");
  }

  public async confirmWrite(): Promise<boolean> {
    return unwrap(
      await confirm({
        message: "Create the missing policy folders and navigation index?",
        initialValue: true,
      }),
    );
  }

  public async confirmMemberSetup(members: readonly string[]): Promise<boolean> {
    return unwrap(
      await confirm({
        message: `Set up member repositories now? (${members.join(", ")})`,
        initialValue: true,
      }),
    );
  }

  public finish(message: string): void {
    outro(message);
  }
}

type SectionInfo = { readonly section: string; readonly evidence: string; readonly message: string };

const trackerSectionInfo: Readonly<Record<(typeof trackerSectionKeys)[number], SectionInfo>> = {
  issueConvention: {
    section: "Issues",
    evidence:
      "Run `gh issue list --state all --limit 20 --json number,title,body,labels` " +
      "(glab: `glab issue list --output json`; Linear: list recent issues via MCP). " +
      "Adopt the dominant title mood and recurring body skeleton; with fewer than " +
      "~5 issues, keep the shipped default and mark the evidence thin.",
    message: "Issue conventions",
  },
  specificationConvention: {
    section: "Specifications",
    evidence:
      "Find issues that own children — `gh issue list --state all --json " +
      "number,title,body,subIssuesSummary --jq '.[] | select(.subIssuesSummary.total > 0)'` " +
      "— and mirror their actual section layout. Keep the default if no umbrella issues exist.",
    message: "Specification (umbrella issue) structure",
  },
  ticketConvention: {
    section: "Executable tickets",
    evidence:
      "Read recently closed leaves — `gh issue list --state closed --limit 20 --json " +
      "number,title,body,subIssuesSummary --jq '.[] | select(.subIssuesSummary.total == 0)'` " +
      "— for slice size and acceptance-criteria style; record the observed format.",
    message: "Executable ticket (leaf issue) structure",
  },
  labelPolicy: {
    section: "Labels",
    evidence:
      "List labels with `gh label list --json name,description,color`, then rank real " +
      "usage: `gh issue list --state all --limit 100 --json labels --jq " +
      "'[.[].labels[].name] | group_by(.) | map({name:.[0],count:length}) | sort_by(-.count)'`. " +
      "Keep actively used labels, treat zero-usage labels as drop candidates, and map " +
      "existing category/readiness labels onto the default set.",
    message: "Label policy",
  },
  relationshipPolicy: {
    section: "Relationships",
    evidence:
      "Inspect native structure with `gh issue list --state all --json " +
      "number,parent,subIssuesSummary,blockedBy,blocking` (gh 2.94+). Note whether " +
      "hierarchy uses native sub-issues or body text, and whether ordering uses native " +
      "dependencies or `Blocked by:` lines, and adopt the mechanism actually in use.",
    message: "Hierarchy and dependency policy",
  },
  claimPolicy: {
    section: "Claims",
    evidence:
      "Read open-issue comments and assignees via `gh issue list --state open --json " +
      "number,assignees,comments` for existing claim phrasing or assignee-based " +
      "claiming. Record the convention found; otherwise keep the comment-claim default.",
    message: "Claim and release protocol",
  },
  readinessPolicy: {
    section: "Readiness",
    evidence:
      "Check what gates readiness today: a ready/triaged label in the usage ranking, " +
      "milestones (`gh issue list --json number,milestone,labels`), or tracker " +
      "workflow states. Map the signal in real use onto the frontier definition; if " +
      "none exists, keep the default.",
    message: "Readiness and frontier policy",
  },
  workContextPolicy: {
    section: "Local work context",
    evidence:
      "Look for an existing in-flight-notes convention: " +
      "`git ls-files | grep -Ei '(^|/)(\\.scratch|work|scratch|handoff)'` plus " +
      "`.gitignore`. Adopt an established scratch/handoff location; otherwise keep " +
      "the `work/<slug>/` default.",
    message: "Local work-context lifecycle",
  },
};

const forgeSectionInfo: Readonly<Record<(typeof forgeSectionKeys)[number], SectionInfo>> = {
  branchConvention: {
    section: "Branches",
    evidence:
      "Sample recent branch names with `git for-each-ref --sort=-committerdate " +
      "--format='%(refname:short)' refs/remotes` and `gh pr list --state merged " +
      "--limit 30 --json headRefName`. Adopt the dominant prefix scheme, issue-number " +
      "placement, and slug delimiter.",
    message: "Branch convention",
  },
  commitConvention: {
    section: "Commits",
    evidence:
      "Read merged-subject style with `git log --first-parent --pretty='%s' -50`. " +
      "Record prefix vocabulary, subject mood and length, and whether first-parent " +
      "subjects mirror PR titles (a squash signal).",
    message: "Commit convention",
  },
  pullRequestConvention: {
    section: "Pull requests",
    evidence:
      "Read `gh pr list --state merged --limit 20 --json title,body,additions,deletions,files` " +
      "(glab: `glab mr list -M -F json`). Adopt the recurring body skeleton and " +
      "closing-keyword use, and set size guidance from the observed median of " +
      "additions plus deletions.",
    message: "Pull/merge request convention",
  },
  mergePolicy: {
    section: "Merges",
    evidence:
      "Query enabled strategies with `gh api repos/{owner}/{repo} --jq " +
      "'{squash:.allow_squash_merge,merge:.allow_merge_commit,rebase:.allow_rebase_merge," +
      "delete:.delete_branch_on_merge}'` and run `git log --merges -20 --oneline` (an " +
      "empty result confirms squash or rebase). Set the policy to the enabled or " +
      "observed dominant strategy.",
    message: "Merge policy",
  },
  ciGatePolicy: {
    section: "CI gates",
    evidence:
      "List `gh api repos/{owner}/{repo}/rulesets`, drill into `.../rulesets/{id}` for " +
      "required checks and approval counts, and fall back to " +
      "`.../branches/{branch}/protection`. Record the actual gates; note explicitly " +
      "when nothing gates merges.",
    message: "CI gating policy",
  },
  publicationPolicy: {
    section: "Publication and mutation",
    evidence:
      "Enumerate automated mutators: `ls .github/workflows/`, `gh run list --limit 20 " +
      "--json workflowName,event,conclusion`, and bot authors in recent PRs. List " +
      "those as the only pre-authorized writers of remote state.",
    message: "Publication and mutation policy",
  },
};

async function sectionValues<Key extends string>(
  keys: readonly Key[],
  info: Readonly<Record<Key, SectionInfo>>,
  defaults: Readonly<Record<Key, string>>,
  mode: SectionMode,
  driver: PromptDriver,
  survey: SurveyItem[],
): Promise<Record<Key, string>> {
  const values = {} as Record<Key, string>;
  for (const key of keys) {
    if (mode === "defaults") {
      values[key] = defaults[key];
    } else if (mode === "survey") {
      values[key] = unresolvedMarker;
      survey.push({ section: info[key].section, evidence: info[key].evidence });
    } else {
      values[key] = await driver.policyText({
        message: info[key].message,
        initialValue: defaults[key],
      });
    }
  }
  return values;
}

function forgeInitial(discovery: RepositoryDiscovery): ForgeId {
  if (discovery.github !== undefined) return "github";
  const urls = discovery.remotes.map((remote) => remote.fetchUrl.toLowerCase());
  if (urls.some((url) => url.includes("gitlab"))) return "gitlab";
  if (urls.some((url) => url.includes("github"))) return "github";
  return urls.length > 0 ? "github" : "none";
}

async function collectWorkflow(
  discovery: RepositoryDiscovery,
  driver: PromptDriver,
  profile: ProfileId,
): Promise<WorkflowPreferences> {
  const forgeId = await driver.chooseForge(forgeInitial(discovery));
  const allowForgeIssues = forgeId !== "none";
  const trackerInitial: TrackerId = allowForgeIssues && (discovery.github?.hasIssuesEnabled ?? true)
    ? "forge-issues"
    : "none";
  const trackerId = await driver.chooseTracker(trackerInitial, allowForgeIssues);
  if (trackerId === "forge-issues" && !allowForgeIssues) {
    throw new Error("Forge issues require a forge; choose Linear or none instead.");
  }

  const survey: SurveyItem[] = [];

  let tracker: TrackerSelection;
  if (trackerId === "none") {
    tracker = { id: "none" };
  } else {
    const defaults: TrackerSectionValues = trackerId === "linear"
      ? linearTrackerDefaults(discovery)
      : forgeId === "gitlab"
        ? gitlabIssuesTrackerDefaults(discovery)
        : githubIssuesTrackerDefaults(discovery);
    const mode = await driver.sectionMode(
      "Tracker sections (issues, specifications, tickets, labels, relationships, claims)",
      profile,
      true,
    );
    tracker = {
      id: trackerId,
      values: await sectionValues(trackerSectionKeys, trackerSectionInfo, defaults, mode, driver, survey),
    };
  }

  if (forgeId === "none") {
    if (tracker.id === "forge-issues") {
      throw new Error("Forge issues require a forge; choose Linear or none instead.");
    }
    return { profile, forge: { id: "none" }, tracker, survey };
  }

  const forgeDefaults: ForgeSectionValues = forgeId === "gitlab"
    ? gitlabForgeDefaults(discovery)
    : githubForgeDefaults(discovery);
  const forgeMode = await driver.sectionMode(
    "Forge sections (branches, commits, pull requests, merges, CI gates)",
    profile,
    true,
  );
  const forge: Extract<ForgeSelection, { readonly id: "github" | "gitlab" }> = {
    id: forgeId,
    values: await sectionValues(forgeSectionKeys, forgeSectionInfo, forgeDefaults, forgeMode, driver, survey),
  };
  return { profile, forge, tracker, survey };
}

export async function collectPreferences(
  discovery: RepositoryDiscovery,
  driver: PromptDriver,
): Promise<SetupPreferences> {
  driver.start(discovery);

  if (!discovery.isGitRepository && discovery.memberRepositories.length > 0) {
    if (!(await driver.confirmFleetSetup(discovery.repositoryRoot, discovery.memberRepositories))) {
      throw new SetupCancelledError();
    }
    return collectFleetPreferences(discovery, driver);
  }

  let fleetLink: string | undefined;
  if (discovery.fleet !== undefined) {
    if (await driver.confirmFleetLink(discovery.fleet.indexPath)) {
      fleetLink = relative(join(discovery.repositoryRoot, ".local"), discovery.fleet.indexPath)
        .replaceAll("\\", "/");
    }
  }

  const profile = await driver.chooseProfile();
  const concerns: AnyConcernPreference[] = [];

  for (const definition of folderDefinitions) {
    const linkedFromFleet = fleetLink !== undefined && definition.fleetScoped;
    const purpose = linkedFromFleet
      ? `${definition.purpose}\n\nA linked fleet already owns this concern; the default is to skip it here.`
      : definition.purpose;
    const shouldConfigure = await driver.chooseConcern(
      definition.id,
      definition.label,
      purpose,
      definition.fileNames,
      !linkedFromFleet,
    );
    if (!shouldConfigure) continue;

    const destination = await driver.destination(
      definition.label,
      definition.defaultPath,
      discovery.repositoryRoot,
    );

    switch (definition.id) {
      case "workflow":
        concerns.push({
          id: "workflow",
          destination,
          workflow: await collectWorkflow(discovery, driver, profile),
        });
        break;
      case "architecture": {
        const defaults = architectureDefaults(discovery);
        const style = await driver.chooseArchitectureStyle("modular-hexagonal");
        const mode = await driver.sectionMode(
          "Architecture sections (constraints, sources)",
          profile,
          false,
        );
        concerns.push({
          id: "architecture",
          destination,
          values: mode === "defaults"
            ? { scope: "repository", style, ...defaults }
            : {
                scope: "repository",
                style,
                architectureConstraints: await driver.policyText({
                  message: "Stable architecture constraints and invariants",
                  initialValue: defaults.architectureConstraints,
                }),
                architectureSources: await driver.policyText({
                  message: "Authoritative shared architecture documents (review discovered candidates before accepting)",
                  initialValue: defaults.architectureSources,
                }),
              },
        });
        break;
      }
      case "development": {
        const defaults = developmentDefaults(discovery);
        const mode = await driver.sectionMode(
          "Development sections (verification, testing, worktrees, review, environment)",
          profile,
          false,
        );
        concerns.push({
          id: "development",
          destination,
          values: mode === "defaults" ? defaults : {
            verificationCommands: await driver.policyText({
              message: "Required verification commands and ordering (review discovered candidates before accepting)",
              initialValue: defaults.verificationCommands,
            }),
            testingConstraints: await driver.policyText({
              message: "Testing constraints and important test seams",
              initialValue: defaults.testingConstraints,
            }),
            worktreeRules: await driver.policyText({
              message: "Worktree lifecycle rules",
              initialValue: defaults.worktreeRules,
            }),
            reviewChecks: await driver.policyText({
              message: "Repository-specific code-review checks",
              initialValue: defaults.reviewChecks,
            }),
            repositoryRules: await driver.policyText({
              message: "Commit, migration, or generated-code rules",
              initialValue: defaults.repositoryRules,
            }),
            environmentRequirements: await driver.policyText({
              message: "Exceptional environment requirements",
              initialValue: defaults.environmentRequirements,
            }),
          },
        });
        break;
      }
      case "domain": {
        const defaults = domainDefaults();
        const mode = await driver.sectionMode("Domain glossary", profile, false);
        concerns.push({
          id: "domain",
          destination,
          values: mode === "defaults" ? defaults : {
            domainEntries: await driver.policyText({
              message: "Initial glossary entries",
              initialValue: defaults.domainEntries,
            }),
          },
        });
        break;
      }
      case "papercuts":
        // The papercuts README is fixed protocol prose; the only choice is
        // whether to include the folder and where it lives.
        concerns.push({ id: "papercuts", destination });
        break;
    }
  }

  if (concerns.length === 0) log.warn("All concerns were skipped; setup will create navigation only.");
  return {
    mode: "repository",
    ...(fleetLink === undefined ? {} : { fleetLink }),
    concerns,
  };
}

async function collectFleetPreferences(
  discovery: RepositoryDiscovery,
  driver: PromptDriver,
): Promise<SetupPreferences> {
  const umbrellaHome = await driver.umbrellaHome("Per-repository umbrellas only");
  const concerns: AnyConcernPreference[] = [];

  for (const definition of folderDefinitions.filter((candidate) => candidate.fleetScoped)) {
    const shouldConfigure = await driver.chooseConcern(
      definition.id,
      definition.label,
      definition.purpose,
      definition.fileNames,
      true,
    );
    if (!shouldConfigure) continue;

    const destination = await driver.destination(
      definition.label,
      definition.defaultPath,
      discovery.repositoryRoot,
    );

    if (definition.id === "architecture") {
      const defaults = architectureDefaults(discovery);
      const mode = await driver.sectionMode(
        "Fleet architecture sections (constraints, sources)",
        "solo",
        false,
      );
      concerns.push({
        id: "architecture",
        destination,
        values: mode === "defaults"
          ? { scope: "fleet", ...defaults }
          : {
              scope: "fleet",
              architectureConstraints: await driver.policyText({
                message: "Cross-service constraints (boundaries, communication rules)",
                initialValue: defaults.architectureConstraints,
              }),
              architectureSources: await driver.policyText({
                message: "Authoritative shared architecture documents",
                initialValue: defaults.architectureSources,
              }),
            },
      });
      continue;
    }

    if (definition.id === "domain") {
      const defaults = domainDefaults();
      const mode = await driver.sectionMode("Fleet domain glossary", "solo", false);
      concerns.push({
        id: "domain",
        destination,
        values: mode === "defaults" ? defaults : {
          domainEntries: await driver.policyText({
            message: "Initial shared glossary entries",
            initialValue: defaults.domainEntries,
          }),
        },
      });
    }
  }

  if (concerns.length === 0) log.warn("All concerns were skipped; setup will create navigation only.");
  return { mode: "fleet", umbrellaHome, concerns };
}
