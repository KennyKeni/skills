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

import { folderDefinitions, type ConcernId, type RepositoryDiscovery, type SetupPreferences } from "./model.js";
import { formatPlan, resolveDestination } from "./planning.js";
import type { SetupPlan } from "./model.js";

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

export interface PromptDriver {
  start(discovery: RepositoryDiscovery): void;
  chooseConcern(
    id: ConcernId,
    label: string,
    purpose: string,
    files: readonly string[],
    configureInitially: boolean,
  ): Promise<boolean>;
  destination(label: string, initialValue: string, repositoryRoot: string): Promise<string>;
  policyText(request: TextRequest): Promise<string>;
  wayfinderState(): Promise<"GitHub" | "local Markdown">;
  showPlan(plan: SetupPlan): void;
  confirmWrite(): Promise<boolean>;
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
    intro("Repository-local policy setup");
    note(
      [
        `Working directory: ${discovery.requestedCwd}`,
        `Repository: ${discovery.repositoryRoot}`,
        `GitHub: ${discovery.github?.nameWithOwner ?? "not discovered"}`,
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
    if (discovery.github?.labels.status === "available") {
      note(
        discovery.github.labels.values.length === 0
          ? "Label lookup succeeded; the repository currently has no labels."
          : discovery.github.labels.values
          .map((label) => `${label.name}: ${label.description.trim() || "(no description)"}`)
          .join("\n"),
        "Current labels (evidence only)",
      );
    } else if (discovery.github?.labels.status === "unavailable") {
      note(discovery.github.labels.reason, "Current labels unavailable");
    }
    if (discovery.github?.allowedMergeStrategies.length) {
      note(discovery.github.allowedMergeStrategies.join(", "), "Allowed merge strategies (evidence only)");
    }
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

  public async wayfinderState(): Promise<"GitHub" | "local Markdown"> {
    return unwrap(
      await select({
        message: "Where should Wayfinder keep durable multi-session state?",
        options: [
          { value: "GitHub", label: "GitHub" },
          { value: "local Markdown", label: "Local Markdown" },
        ],
      }),
    );
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

  public finish(message: string): void {
    outro(message);
  }
}

function listOrDefault(values: readonly string[], fallback: string): string {
  return values.length > 0 ? values.join("\n") : fallback;
}

function documentCandidateDefaults(
  discovery: RepositoryDiscovery,
  kind: "guidance" | "architecture",
  fallback: string,
): string {
  const candidates = discovery.documentCandidates.filter((candidate) => candidate.kinds.includes(kind));
  if (candidates.length === 0) return fallback;
  return candidates.map((candidate) => [
    `CANDIDATE — confirm, edit, or reject; discovery does not make this policy: ${candidate.path}`,
    candidate.excerpt || "(empty document)",
    ...(candidate.truncated ? ["[…bounded excerpt truncated…]"] : []),
  ].join("\n")).join("\n\n");
}

export async function collectPreferences(
  discovery: RepositoryDiscovery,
  driver: PromptDriver,
): Promise<SetupPreferences> {
  driver.start(discovery);
  const concerns: SetupPreferences["concerns"][number][] = [];

  for (const definition of folderDefinitions) {
    const configureInitially = definition.id === "github"
      ? discovery.github !== undefined
      : definition.id === "architecture"
        ? discovery.architectureFiles.length > 0
        : discovery.verificationCandidates.length > 0 || discovery.guidanceFiles.length > 0;
    const shouldConfigure = await driver.chooseConcern(
      definition.id,
      definition.label,
      definition.purpose,
      definition.files.map((file) => file.name),
      configureInitially,
    );
    if (!shouldConfigure) continue;

    const destination = await driver.destination(
      definition.label,
      definition.defaultPath,
      discovery.repositoryRoot,
    );

    if (definition.id === "github") {
      const defaultBranch = discovery.github?.defaultBranch ?? discovery.defaultBranchCandidate ?? "the default branch";
      concerns.push({
        id: "github",
        destination,
        values: {
          issueConvention: await driver.policyText({
            message: "Issue title, body, type, and acceptance-criteria conventions",
            initialValue:
              "Use concise outcome-oriented titles. Bodies state context, desired behavior, acceptance criteria, decisions, and out-of-scope work. Executable issues must be independently verifiable.",
          }),
          specificationConvention: await driver.policyText({
            message: "Specification structure, status, and acceptance convention",
            initialValue:
              "Specifications state the problem, desired behavior, acceptance criteria, settled decisions, and out-of-scope work. Record whether a specification is a draft or published umbrella and whether it is executable.",
          }),
          ticketConvention: await driver.policyText({
            message: "Executable ticket slicing, content, and verification convention",
            initialValue:
              "Each ticket is a complete, independently verifiable vertical slice with explicit acceptance criteria, dependencies, and any required human decisions. Use expand–migrate–contract for compatibility-sensitive refactors.",
          }),
          labelPolicy: await driver.policyText({
            message: "Meanings of repository label roles",
            initialValue: discovery.github?.labels.status === "available"
              ? discovery.github.labels.values.length > 0
                ? `Discovered label candidates (confirm meanings before accepting):\n${discovery.github.labels.values.map((label) => `- ${label.name}: ${label.description.trim() || "(no description)"}`).join("\n")}`
                : "GitHub label lookup succeeded and confirmed that the repository currently has no labels. Define desired label roles here or record that none are used."
              : `GitHub labels were not discovered${discovery.github?.labels.status === "unavailable" ? `: ${discovery.github.labels.reason}` : "."} Do not infer that the repository has no labels; inspect live labels before assigning roles.`,
          }),
          relationshipPolicy: await driver.policyText({
            message: "Parent/sub-issue and dependency relationship policy",
            initialValue:
              "Use native GitHub parent/sub-issue relationships for hierarchy and native blocking relationships for genuine dependencies when available. Keep hierarchy and blocking distinct, reject dependency cycles, and read relationships back after mutation.",
          }),
          branchConvention: await driver.policyText({
            message: "Branch naming convention",
            initialValue: "Use an issue-linked, short kebab-case branch name unless the repository documents a stricter convention.",
          }),
          pullRequestConvention: await driver.policyText({
            message: "Pull-request title and body convention",
            initialValue:
              "Summarize the outcome in the title. In the body, link the originating issue, describe material changes, and report verification performed.",
          }),
          mergePolicy: await driver.policyText({
            message: "Base branch and merge policy",
            initialValue: `Target ${defaultBranch}. Do not merge without explicit authorization. Discovered enabled strategies (confirm before recording policy): ${listOrDefault(discovery.github?.allowedMergeStrategies ?? [], "none discovered")}.`,
          }),
          publicationPolicy: await driver.policyText({
            message: "Issue/specification/ticket publication and mutation policy",
            initialValue:
              "Draft locally or in conversation until publication is requested or otherwise authorized. Read back every created or changed body, label, state, and relationship before reporting completion.",
          }),
          readinessPolicy: await driver.policyText({
            message: "Executable-issue readiness and authorization policy",
            initialValue:
              "An issue is eligible only when its outcome, scope, acceptance criteria, dependencies, and required decisions are complete. Readiness is eligibility, not implementation or external-mutation authorization.",
          }),
          wayfinderState: await driver.wayfinderState(),
        },
      });
      continue;
    }

    if (definition.id === "architecture") {
      concerns.push({
        id: "architecture",
        destination,
        values: {
          architectureConstraints: await driver.policyText({
            message: "Stable architecture constraints and invariants",
            initialValue:
              "No additional repository-specific architecture constraint is recorded. Preserve boundaries and public contracts documented by authoritative project sources.",
          }),
          architectureSources: await driver.policyText({
            message: "Authoritative shared architecture documents (review discovered candidates before accepting)",
            initialValue: documentCandidateDefaults(
              discovery,
              "architecture",
              "No additional authoritative shared architecture document is recorded.",
            ),
          }),
        },
      });
      continue;
    }

    concerns.push({
      id: "development",
      destination,
      values: {
        verificationCommands: await driver.policyText({
          message: "Required verification commands and ordering (review discovered candidates before accepting)",
          initialValue: listOrDefault(
            discovery.verificationCandidates,
            "Use the repository's documented verification workflow; no additional command is recorded here.",
          ),
        }),
        testingConstraints: await driver.policyText({
          message: "Testing constraints and important test seams",
          initialValue:
            "Test observable behavior at the narrowest durable seam that can prove the requirement. Do not add implementation-coupled tests without a repository-specific reason.",
        }),
        reviewChecks: await driver.policyText({
          message: "Repository-specific code-review checks",
          initialValue:
            "Check correctness, regressions, public-contract changes, error paths, security boundaries, and whether verification matches the changed risk.",
        }),
        repositoryRules: await driver.policyText({
          message: "Worktree, commit, migration, or generated-code rules",
          initialValue: documentCandidateDefaults(
            discovery,
            "guidance",
            "No additional worktree, commit, migration, or generated-code rule is recorded.",
          ),
        }),
        environmentRequirements: await driver.policyText({
          message: "Exceptional environment requirements",
          initialValue: discovery.workspaceFiles.includes("mise.toml")
            ? "Use the runtimes and tools selected by mise.toml."
            : "No exceptional environment requirement is recorded.",
        }),
      },
    });
  }

  if (concerns.length === 0) log.warn("All concerns were skipped; setup will create navigation only.");
  return { concerns };
}
