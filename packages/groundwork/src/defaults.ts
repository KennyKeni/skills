import { basename } from "node:path";

import type {
  DevelopmentPreferences,
  DomainPreferences,
  ForgeSectionValues,
  RepositoryDiscovery,
  TrackerSectionValues,
} from "./model.js";

export const unresolvedMarker =
  "Unresolved — see SURVEY.md. An agent fills this section from repository " +
  "evidence, and a human confirms before it becomes policy.";

function defaultBranchOf(discovery: RepositoryDiscovery): string {
  return discovery.github?.defaultBranch ?? discovery.defaultBranchCandidate ?? "the default branch";
}

function listOrDefault(values: readonly string[], fallback: string): string {
  return values.length > 0 ? values.join("\n") : fallback;
}

export function githubForgeDefaults(discovery: RepositoryDiscovery): ForgeSectionValues {
  const base = defaultBranchOf(discovery);
  return {
    branchConvention:
      `Branch from ${base}. Name branches \`<type>/<issue-number>-<slug>\` ` +
      "(for example `feat/142-account-balance-api`), where `<type>` is `feat`, " +
      "`fix`, `chore`, `docs`, or `spike`; omit the issue number only when no " +
      "issue exists. One branch per executable work item; do not batch " +
      "unrelated work items onto one branch. Dependent work branches from " +
      `${base} after its blocker merges — ordering lives in tracker ` +
      "dependencies, not in branch ancestry. Only when starting early is " +
      "explicitly authorized, branch from the blocker's branch, name that " +
      "dependency in the pull request description, and after the blocker's " +
      `squash merge rebase onto ${base} and retarget the pull request.`,
    commitConvention:
      "Write commit subjects in imperative mood, at most 72 characters, " +
      "describing the outcome, with an optional Conventional Commits prefix " +
      "(`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`) when " +
      "it clarifies intent. Every commit leaves the tree building. " +
      "Branch-local history is working history: pull requests squash-merge " +
      "and the PR title becomes the permanent subject. Use the body to state " +
      "why the change was made and any non-obvious decision.",
    pullRequestConvention:
      `One pull request per executable work item, targeting ${base}. Aim ` +
      "under roughly 400 changed lines excluding lockfiles and generated " +
      "code; split the work item rather than growing the PR. Title: an " +
      "imperative outcome summary usable as the squash-commit subject. Body: " +
      "a `Closes #<n>` line (or an explicit statement that no issue exists " +
      "and why), material decisions and deviations, and a verification " +
      "section reporting exactly which checks were run and their results. " +
      "Open as a draft until acceptance criteria are met and CI is green.",
    mergePolicy:
      `Target ${base}. Squash-merge is the only merge strategy; the squash ` +
      "subject is the PR title plus `(#<pr>)` and must meet the commit " +
      "convention at merge time. Merging requires a green run of all " +
      "required checks and explicit authorization; prefer auto-merge over " +
      "polling once authorized. Revert by reverting the single squash " +
      "commit. Discovered enabled strategies (confirm before relying on " +
      `them): ${listOrDefault(discovery.github?.allowedMergeStrategies ?? [], "none discovered")}.`,
    ciGatePolicy:
      `Protect ${base} with a ruleset requiring pull requests, all required ` +
      "checks, and linear history. No required human approvals by default on " +
      "solo repositories — CI is the reviewer of record. PR-triggered " +
      "workflows set a concurrency group keyed to the head ref with " +
      "cancel-in-progress; deploy workflows never cancel in progress. Keep " +
      "the pipeline fast enough to iterate on CI feedback within a session.",
    publicationPolicy:
      "Creating or mutating remote state — issues, relationships, labels, " +
      "pull requests, merges — requires explicit authorization or an " +
      "already-authorized workflow.",
  };
}

export function gitlabForgeDefaults(discovery: RepositoryDiscovery): ForgeSectionValues {
  const base = defaultBranchOf(discovery);
  return {
    branchConvention:
      `Branch from ${base}. Name branches \`<type>/<issue-number>-<slug>\` ` +
      "(for example `feat/142-account-balance-api`), where `<type>` is `feat`, " +
      "`fix`, `chore`, `docs`, or `spike`; omit the issue number only when no " +
      "issue exists. One branch per executable work item; do not batch " +
      "unrelated work items onto one branch. Dependent work branches from " +
      `${base} after its blocker merges — ordering lives in tracker ` +
      "dependencies, not in branch ancestry. Only when starting early is " +
      "explicitly authorized, branch from the blocker's branch, name that " +
      "dependency in the merge request description, and after the blocker's " +
      `squash merge rebase onto ${base} and retarget the merge request.`,
    commitConvention:
      "Write commit subjects in imperative mood, at most 72 characters, " +
      "describing the outcome, with an optional Conventional Commits prefix " +
      "when it clarifies intent. Every commit leaves the tree building. " +
      "Branch-local history is working history: merge requests squash and " +
      "the MR title becomes the permanent subject. Use the body to state why " +
      "the change was made and any non-obvious decision.",
    pullRequestConvention:
      `One merge request per executable work item, targeting ${base}. Aim ` +
      "under roughly 400 changed lines excluding lockfiles and generated " +
      "code; split the work item rather than growing the MR. Title: an " +
      "imperative outcome summary usable as the squash-commit subject. Body: " +
      "a `Closes #<n>` line (or an explicit statement that no issue exists " +
      "and why), material decisions and deviations, and a verification " +
      "section reporting exactly which checks were run and their results. " +
      "Mark as draft until acceptance criteria are met and CI is green.",
    mergePolicy:
      `Target ${base}. Squash is enforced by setting the project's "Squash ` +
      'commits when merging" option to Require — it is a setting, not a ' +
      "merge method — paired with the fast-forward merge method for linear, " +
      "squashed history. The squash subject is the MR title and must meet " +
      "the commit convention at merge time. Merging requires a green " +
      "pipeline and explicit authorization; once authorized, prefer " +
      "auto-merge (formerly merge-when-pipeline-succeeds) over polling. Do " +
      "not use merge trains — Premium-only and unnecessary for solo work. " +
      "Revert by reverting the single squash commit.",
    ciGatePolicy:
      `Protect ${base} as a protected branch and enable "Pipelines must ` +
      'succeed" and "All threads must be resolved" in the merge-request ' +
      "settings so a red or unresolved MR cannot merge. No required human " +
      "approvals by default on solo projects — CI is the reviewer of record " +
      "(approval rules are Premium-only anyway). Mark superseded-prone jobs " +
      "`interruptible: true` so newer MR pipelines cancel stale ones; never " +
      "mark deployment jobs interruptible. Ensure `workflow:rules` actually " +
      "start a pipeline for every merge request, or the must-succeed gate " +
      "has nothing to check. Keep the pipeline fast enough to iterate on CI " +
      "feedback within a session.",
    publicationPolicy:
      "Creating or mutating remote state — issues, relationships, labels, " +
      "merge requests, merges — requires explicit authorization or an " +
      "already-authorized workflow.",
  };
}

function labelDefault(discovery: RepositoryDiscovery): string {
  const core =
    "Category: `bug`, `feature`, `chore`, `docs`. Readiness: " +
    "`ready-for-agent` (fully specified and executable autonomously — " +
    "eligibility only, never implementation authority) and `needs-human` (a " +
    "named human decision gates it).";
  const labels = discovery.github?.labels;
  if (labels?.status === "available") {
    if (labels.values.length === 0) {
      return `${core}\n\nLabel lookup succeeded and confirmed that the repository currently has no labels.`;
    }
    const discovered = labels.values
      .map((label) => `- ${label.name}: ${label.description.trim() || "(no description)"}`)
      .join("\n");
    return `${core}\n\nDiscovered existing labels (confirm meanings before merging them into the set above):\n${discovered}`;
  }
  if (labels?.status === "unavailable") {
    return `${core}\n\nExisting labels were not discovered: ${labels.reason} Do not infer that the repository has no labels; inspect live labels before merging.`;
  }
  return core;
}

export function githubIssuesTrackerDefaults(discovery: RepositoryDiscovery): TrackerSectionValues {
  return {
    issueConvention:
      "Titles are concise imperative outcomes readable without the body. " +
      "Every issue is either an umbrella (a specification — never directly " +
      "implementable) or a leaf (an executable ticket); split any issue that " +
      "mixes both. Bodies are self-contained: an agent must be able to act " +
      "on a leaf, or evaluate an umbrella, without conversation context.",
    specificationConvention:
      "Sections: Problem (user's perspective), Desired behavior, Acceptance " +
      "criteria for the feature as a whole, Settled decisions (with " +
      "reasons), and Out of scope. Status line: `Draft` or `Published`. The " +
      "leaf breakdown lives in the sub-issue list, never as a task list in " +
      "the body.",
    ticketConvention:
      "Each leaf is a tracer-bullet vertical slice: narrow but complete " +
      "through every affected layer, verifiable on its own, sized to one " +
      "fresh agent session. Sections: What to build (end-to-end behavior), " +
      "Acceptance criteria (observable and testable, naming the " +
      "verification commands that must pass), Autonomy (`autonomous`, or " +
      "`needs-human` naming the gating decision), and Dependencies. Use " +
      "expand–migrate–contract for compatibility-sensitive refactors.",
    labelPolicy: labelDefault(discovery),
    relationshipPolicy:
      "Native parent/sub-issue relationships for umbrella → leaf hierarchy; " +
      "native issue dependencies (blocked-by) for execution ordering. Manage " +
      "both with `gh` (v2.94+): `--parent`/`--set-parent`, " +
      "`--blocked-by`/`--blocking`, and JSON read-back. Limits: 100 " +
      "sub-issues per parent, 8 nesting levels, 50 dependencies per " +
      "direction.",
    claimPolicy:
      "Claim a leaf by commenting `Claiming — <session or mission id>`. A " +
      "claim with no visible activity for 24 hours may be superseded by a " +
      "new claim comment that references it. Release by comment when work " +
      "completes or is deliberately relinquished.",
    readinessPolicy:
      "A leaf is on the frontier when it is open, has no open blockers, and " +
      "has no active claim. It is eligible only when its outcome, scope, " +
      "acceptance criteria, dependencies, and required decisions are " +
      "complete.",
    workContextPolicy:
      "`work/<ticket-slug>/` accompanies each claimed ticket: `HANDOFF.md` " +
      "records branch, worktree path, and resume state; `scratch/` holds " +
      "everything else in-flight; `TICKET.md` exists only on explicit " +
      "request and links its remote issue — the remote stays authoritative. " +
      "Delete the folder when the ticket resolves.",
  };
}

export function gitlabIssuesTrackerDefaults(discovery: RepositoryDiscovery): TrackerSectionValues {
  const base = githubIssuesTrackerDefaults(discovery);
  return {
    ...base,
    specificationConvention:
      "Sections: Problem (user's perspective), Desired behavior, Acceptance " +
      "criteria for the feature as a whole, Settled decisions (with " +
      "reasons), and Out of scope. Status line: `Draft` or `Published`. The " +
      "leaf breakdown lives in linked leaf issues (`relates to` links), " +
      "never as a task list in the body.",
    labelPolicy:
      "Category: `bug`, `feature`, `chore`, `docs`. Readiness: " +
      "`ready-for-agent` (fully specified and executable autonomously — " +
      "eligibility only, never implementation authority) and `needs-human` " +
      "(a named human decision gates it). Confirm existing project labels " +
      "with `glab label list` before merging them into this set.",
    relationshipPolicy:
      "Umbrella → leaf hierarchy uses `relates to` linked issues (Free " +
      "tier); the link is non-directional, so umbrella and leaf roles come " +
      "from the issue bodies, not the link type. Native issue parent/child " +
      "hierarchy requires epics (Premium); keep leaves as full issues " +
      "unless the project is Premium — child tasks trade away `Closes #n` " +
      "and clean `glab` handling. Execution ordering uses blocking links " +
      "(`is blocked by`), Premium-only; on Free, record `Blocked by: #n` " +
      "in the affected issue body as the one authoritative fallback. " +
      "`glab` has no relationship subcommand — set links by posting " +
      "quick-action notes (`glab issue note -m \"/relate #n\"`, or " +
      "`/blocked_by #n` on Premium), then read every relationship back " +
      "from the API, since `glab issue view` does not render them.",
  };
}

export function linearTrackerDefaults(discovery: RepositoryDiscovery): TrackerSectionValues {
  const base = githubIssuesTrackerDefaults(discovery);
  return {
    ...base,
    labelPolicy:
      "Labels carry category meaning only: `bug`, `feature`, `chore`, " +
      "`docs`. Readiness lives in Linear workflow states, not labels: a " +
      "leaf in an Unstarted state (default `Todo`) with complete acceptance " +
      "criteria is eligible; Backlog holds specified-but-not-yet-ready " +
      "leaves; Triage is the native untriaged inbox, so no derived queue is " +
      "needed. A gating human decision is expressed by assigning the human " +
      "owner (never an agent, which triggers delegation) and stating the " +
      "decision in a comment, not by a label.",
    relationshipPolicy:
      "Native parent/sub-issue relationships for umbrella → leaf hierarchy; " +
      "typed Blocked-by/Blocks relations for execution ordering (a resolved " +
      "blocker auto-demotes to Related). Do not rely on issue mentions to " +
      "express dependency — mentioning an ID in text only creates a loose " +
      "Related link. Manage both through the Linear API or MCP tools and " +
      "read every relationship back after mutation. When an umbrella " +
      "outgrows a single parent, promote it to a Project rather than " +
      "nesting issues indefinitely.",
    readinessPolicy:
      "A leaf is on the frontier when it is in an Unstarted state (default " +
      "`Todo`) — not Backlog, not Triage, not a Started state — has no open " +
      "Blocked-by relations, and has no active claim. It is eligible only " +
      "when its outcome, scope, acceptance criteria, dependencies, and " +
      "required decisions are complete.",
    claimPolicy:
      "Claim a leaf by commenting `Claiming — <session or mission id>`, " +
      "then move it from `Todo` into a Started state (`In Progress`) so the " +
      "unstarted-frontier query naturally excludes it. The comment is the " +
      "arbiter: earliest active claim wins. A claim with no visible " +
      "activity for 24 hours may be superseded by a new claim comment that " +
      "references it. Release by comment, returning the leaf to `Todo`, " +
      "when work is deliberately relinquished.",
    workContextPolicy:
      "`work/<ticket-slug>/` accompanies each claimed ticket, keyed by the " +
      "Linear issue identifier: `HANDOFF.md` records branch, worktree path, " +
      "and resume state; `scratch/` holds everything else in-flight; " +
      "`TICKET.md` exists only on explicit request and links its Linear " +
      "issue URL — Linear stays authoritative. Delete the folder when the " +
      "ticket resolves.",
  };
}

// Doctrine text lives in the architecture style templates; defaults here
// cover only the placeholder sections shared by every style and scope.
export type ArchitectureSectionDefaults = {
  readonly architectureConstraints: string;
  readonly architectureSources: string;
};

export function architectureDefaults(
  discovery: RepositoryDiscovery,
): ArchitectureSectionDefaults {
  const candidates = discovery.documentCandidates.filter((candidate) =>
    candidate.kinds.includes("architecture"),
  );
  const sources = candidates.length === 0
    ? "Accepted records in decisions/ are the only authoritative source recorded."
    : candidates
        .map((candidate) =>
          [
            `CANDIDATE — confirm, edit, or reject; discovery does not make this policy: ${candidate.path}`,
            candidate.excerpt || "(empty document)",
            ...(candidate.truncated ? ["[…bounded excerpt truncated…]"] : []),
          ].join("\n"),
        )
        .join("\n\n");
  return {
    architectureConstraints:
      "No additional constraint is recorded yet. Add constraints here as " +
      "decisions land, with the decision record that motivated each.",
    architectureSources: sources,
  };
}

export function developmentDefaults(discovery: RepositoryDiscovery): DevelopmentPreferences {
  const guidance = discovery.documentCandidates.filter((candidate) =>
    candidate.kinds.includes("guidance"),
  );
  return {
    verificationCommands: listOrDefault(
      discovery.verificationCandidates.map((command, index) => `${index + 1}. \`${command}\``),
      "Use the repository's documented verification workflow; no additional command is recorded here.",
    ),
    testingConstraints:
      "Test observable behavior at the narrowest durable seam that can prove " +
      "the requirement. Do not add implementation-coupled tests without a " +
      "repository-specific reason.",
    worktreeRules:
      "One worktree per claimed work item at `.local/worktrees/<slug>` — " +
      "machine-local beside the policy tree, so it needs no ignore entry and " +
      "ignore-aware search skips it — checked out on the work item's branch, " +
      "with the path recorded in the work item's `HANDOFF.md`. Create the " +
      "branch, worktree, and work folder together on claim; remove the " +
      "worktree and prune on resolve. Never run concurrent mutating work in " +
      "the same worktree.",
    reviewChecks:
      "Check correctness, regressions, public-contract changes, error " +
      "paths, security boundaries, and whether verification matches the " +
      "changed risk.",
    repositoryRules: guidance.length === 0
      ? "No additional commit, migration, or generated-code rule is recorded."
      : guidance
          .map((candidate) =>
            [
              `CANDIDATE — confirm, edit, or reject; discovery does not make this policy: ${candidate.path}`,
              candidate.excerpt || "(empty document)",
              ...(candidate.truncated ? ["[…bounded excerpt truncated…]"] : []),
            ].join("\n"),
          )
          .join("\n\n"),
    environmentRequirements: discovery.workspaceFiles.some((file) => basename(file) === "mise.toml")
      ? "Use the runtimes and tools selected by mise.toml; run tooling through `mise exec`."
      : "No exceptional environment requirement is recorded.",
  };
}

export function domainDefaults(): DomainPreferences {
  return {
    domainEntries:
      "No terms are recorded yet. Add a row when a term's ambiguity has " +
      "caused, or would plausibly cause, a wrong implementation; state what " +
      "the term excludes, not only what it includes.\n\n" +
      "| Term | Means | Does not mean |\n| --- | --- | --- |\n" +
      "| *(example — delete)* Tenant | A billing account that owns isolated data | An individual user; a deployment environment |",
  };
}
