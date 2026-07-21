import { execFile } from "node:child_process";
import { access, lstat, open, readFile, readdir, realpath } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { promisify } from "node:util";

import type {
  DiscoveryEvidence,
  DocumentCandidate,
  FleetDiscovery,
  GitHubDiscovery,
  GitHubLabel,
  GitRemote,
  RepositoryDiscovery,
} from "./model.js";

const execFileAsync = promisify(execFile);

export type CommandResult = {
  readonly stdout: string;
  readonly stderr: string;
};

export type CommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => Promise<CommandResult | undefined>;

export const runCommand: CommandRunner = async (command, args, cwd) => {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return { stdout: result.stdout, stderr: result.stderr };
  } catch {
    return undefined;
  }
};

const ignoredDirectoryNames = new Set([
  ".git",
  ".local",
  "node_modules",
  "dist",
  "build",
  "target",
  ".venv",
  "vendor",
]);

const packageManifestNames = new Set([
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "composer.json",
]);

const workspaceFileNames = new Set([
  "pnpm-workspace.yaml",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "mise.toml",
  ".tool-versions",
  "Taskfile.yml",
  "Taskfile.yaml",
  "Makefile",
]);

const guidanceFileNames = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "CODING_STANDARDS.md",
  "DEVELOPMENT.md",
]);

const guidanceFilePattern = /^(agents|claude|contributing|coding[-_.]?standards|development|style[-_.]?guide|security)\.(md|markdown|txt)$/i;
const maximumDocumentCandidates = 12;
const maximumDocumentBytes = 4 * 1024;

type DiscoveredFiles = {
  readonly packages: string[];
  readonly workspaces: string[];
  readonly guidance: string[];
  readonly architecture: string[];
};

async function walkRepository(root: string): Promise<DiscoveredFiles> {
  const files: DiscoveredFiles = { packages: [], workspaces: [], guidance: [], architecture: [] };

  async function visit(directory: string, depth: number): Promise<void> {
    if (depth > 6) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry.name)) {
          await visit(absolutePath, depth + 1);
        }
        continue;
      }
      if (!entry.isFile()) continue;

      const repositoryPath = relative(root, absolutePath);
      if (packageManifestNames.has(entry.name)) files.packages.push(repositoryPath);
      if (workspaceFileNames.has(entry.name)) files.workspaces.push(repositoryPath);
      if (guidanceFileNames.has(entry.name) || guidanceFilePattern.test(entry.name)) {
        files.guidance.push(repositoryPath);
      }
      if (
        /(^|[-_.])(architecture|architectural|adr)([-_.]|$)/i.test(entry.name) ||
        repositoryPath.split(/[\\/]/).some((segment) => /^(architecture|adr|decisions)$/i.test(segment))
      ) {
        files.architecture.push(repositoryPath);
      }
    }
  }

  await visit(root, 0);
  for (const list of Object.values(files)) list.sort();
  return files;
}

async function readDocumentCandidates(root: string, files: DiscoveredFiles): Promise<DocumentCandidate[]> {
  const paths = [...new Set([...files.guidance, ...files.architecture])]
    .sort()
    .slice(0, maximumDocumentCandidates);
  return Promise.all(paths.map(async (repositoryPath) => {
    const handle = await open(join(root, repositoryPath), "r");
    try {
      const buffer = Buffer.alloc(maximumDocumentBytes + 1);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      const truncated = bytesRead > maximumDocumentBytes;
      const excerpt = buffer
        .subarray(0, Math.min(bytesRead, maximumDocumentBytes))
        .toString("utf8")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "�")
        .trim();
      return {
        path: repositoryPath,
        excerpt,
        truncated,
        kinds: [
          ...(files.guidance.includes(repositoryPath) ? ["guidance" as const] : []),
          ...(files.architecture.includes(repositoryPath) ? ["architecture" as const] : []),
        ],
      };
    } finally {
      await handle.close();
    }
  }));
}

async function listExistingLocalPaths(root: string): Promise<string[]> {
  const localRoot = join(root, ".local");
  try {
    await access(localRoot);
  } catch {
    return [];
  }

  const paths: string[] = [];
  async function visit(directory: string, depth: number): Promise<void> {
    if (depth > 4) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      paths.push(relative(root, absolutePath));
      if (entry.isDirectory() && !entry.isSymbolicLink()) await visit(absolutePath, depth + 1);
    }
  }

  await visit(localRoot, 0);
  return paths.sort();
}

const maximumFleetSearchDepth = 3;

async function discoverFleet(repositoryRoot: string): Promise<FleetDiscovery | undefined> {
  let candidate = dirname(repositoryRoot);
  for (let depth = 0; depth < maximumFleetSearchDepth; depth += 1) {
    const indexPath = join(candidate, ".local", "INDEX.md");
    try {
      const stat = await lstat(indexPath);
      if (stat.isFile()) return { indexPath, root: candidate };
    } catch {
      // Keep walking upward; a missing index at this level is not an error.
    }
    const parent = dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  return undefined;
}

async function listMemberRepositories(root: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const members: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    if (ignoredDirectoryNames.has(entry.name)) continue;
    try {
      await lstat(join(root, entry.name, ".git"));
      members.push(entry.name);
    } catch {
      // Not a git repository; not a fleet member.
    }
  }
  return members.sort();
}

function parseRemotes(output: string): GitRemote[] {
  const remotes = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = /^(\S+)\s+(\S+)\s+\(fetch\)$/.exec(line.trim());
    if (match?.[1] !== undefined && match[2] !== undefined) remotes.set(match[1], match[2]);
  }
  return [...remotes].map(([name, fetchUrl]) => ({ name, fetchUrl }));
}

type GitHubJson = {
  readonly nameWithOwner: string;
  readonly url: string;
  readonly defaultBranchRef: { readonly name: string } | null;
  readonly hasIssuesEnabled: boolean;
  readonly mergeCommitAllowed: boolean;
  readonly rebaseMergeAllowed: boolean;
  readonly squashMergeAllowed: boolean;
};

async function discoverGitHub(root: string, runner: CommandRunner): Promise<GitHubDiscovery | undefined> {
  const repositoryResult = await runner(
    "gh",
    [
      "repo",
      "view",
      "--json",
      "nameWithOwner,url,defaultBranchRef,hasIssuesEnabled,mergeCommitAllowed,rebaseMergeAllowed,squashMergeAllowed",
    ],
    root,
  );
  if (repositoryResult === undefined) return undefined;

  let repository: GitHubJson;
  try {
    repository = JSON.parse(repositoryResult.stdout) as GitHubJson;
  } catch {
    return undefined;
  }

  const labelsResult = await runner(
    "gh",
    ["label", "list", "--limit", "200", "--json", "name,description"],
    root,
  );
  let labels: GitHubDiscovery["labels"] = {
    status: "unavailable",
    reason: "GitHub label lookup failed or was unavailable.",
  };
  if (labelsResult !== undefined) {
    try {
      labels = {
        status: "available",
        values: JSON.parse(labelsResult.stdout) as readonly GitHubLabel[],
      };
    } catch {
      labels = { status: "unavailable", reason: "GitHub returned invalid label data." };
    }
  }

  const schemaResult = await runner(
    "gh",
    [
      "api",
      "graphql",
      "-f",
      "query={__type(name:\"Issue\"){fields{name}}}",
      "--jq",
      ".data.__type.fields[].name",
    ],
    root,
  );
  const relationshipFieldNames = new Set([
    "parent",
    "subIssues",
    "subIssuesSummary",
    "blockedBy",
    "blocking",
  ]);
  const relationshipFields = (schemaResult?.stdout ?? "")
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => relationshipFieldNames.has(value))
    .sort();

  const allowedMergeStrategies = [
    repository.mergeCommitAllowed ? "merge commit" : undefined,
    repository.rebaseMergeAllowed ? "rebase" : undefined,
    repository.squashMergeAllowed ? "squash" : undefined,
  ].filter((value): value is string => value !== undefined);

  return {
    nameWithOwner: repository.nameWithOwner,
    url: repository.url,
    ...(repository.defaultBranchRef === null
      ? {}
      : { defaultBranch: repository.defaultBranchRef.name }),
    hasIssuesEnabled: repository.hasIssuesEnabled,
    allowedMergeStrategies,
    labels: labels.status === "unavailable"
      ? labels
      : { status: "available", values: [...labels.values].sort((left, right) => left.name.localeCompare(right.name)) },
    relationshipFields,
  };
}

async function packageManager(root: string): Promise<string> {
  for (const [lockfile, command] of [
    ["pnpm-lock.yaml", "pnpm"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
  ] as const) {
    try {
      await lstat(join(root, lockfile));
      return command;
    } catch {
      // Continue looking for another package manager marker.
    }
  }
  return "npm";
}

async function discoverVerificationCommands(
  root: string,
  packageFiles: readonly string[],
  workspaceFiles: readonly string[],
): Promise<string[]> {
  const manager = await packageManager(root);
  const commands = new Set<string>();
  const scriptPattern = /^(build|check|ci|format:check|lint|test|typecheck|verify)(:.*)?$/i;

  function scriptCommand(scriptName: string, packageDirectory: string | undefined): string {
    if (manager === "pnpm") {
      return packageDirectory === undefined
        ? `pnpm ${scriptName}`
        : `pnpm --dir ${packageDirectory} ${scriptName}`;
    }
    if (manager === "npm") {
      return packageDirectory === undefined
        ? `npm run ${scriptName}`
        : `npm --prefix ${packageDirectory} run ${scriptName}`;
    }
    if (manager === "yarn") {
      return packageDirectory === undefined
        ? `yarn ${scriptName}`
        : `yarn --cwd ${packageDirectory} ${scriptName}`;
    }
    return packageDirectory === undefined
      ? `bun run ${scriptName}`
      : `bun --cwd ${packageDirectory} run ${scriptName}`;
  }

  for (const packageFile of packageFiles.filter((file) => basename(file) === "package.json")) {
    try {
      const manifest = JSON.parse(await readFile(join(root, packageFile), "utf8")) as {
        readonly scripts?: Readonly<Record<string, string>>;
      };
      for (const scriptName of Object.keys(manifest.scripts ?? {})) {
        if (!scriptPattern.test(scriptName)) continue;
        const packageDirectory = packageFile === "package.json"
          ? undefined
          : packageFile.slice(0, -"/package.json".length);
        commands.add(scriptCommand(scriptName, packageDirectory));
      }
    } catch {
      // A malformed manifest is evidence to show elsewhere, not policy to infer here.
    }
  }

  for (const taskfile of workspaceFiles.filter((file) => /^Taskfile\.ya?ml$/.test(basename(file)))) {
    try {
      const contents = await readFile(join(root, taskfile), "utf8");
      for (const match of contents.matchAll(/^  ([A-Za-z0-9:_-]*(?:check|test|verify|lint)[A-Za-z0-9:_-]*):\s*$/gim)) {
        if (match[1] !== undefined) commands.add(`task ${match[1]}`);
      }
    } catch {
      // Ignore unreadable candidates.
    }
  }

  return [...commands].sort();
}

export async function discoverRepository(
  requestedCwd: string,
  runner: CommandRunner = runCommand,
): Promise<RepositoryDiscovery> {
  const requestedAbsolute = resolve(requestedCwd);
  let requestedReal: string;
  try {
    requestedReal = await realpath(requestedAbsolute);
  } catch {
    throw new Error(`The selected cwd does not exist: ${requestedCwd}`);
  }
  const selectedStat = await lstat(requestedReal);
  if (!selectedStat.isDirectory()) throw new Error(`The selected cwd is not a directory: ${requestedCwd}`);

  const gitRootResult = await runner("git", ["rev-parse", "--show-toplevel"], requestedReal);
  const repositoryRoot = gitRootResult === undefined
    ? requestedReal
    : await realpath(gitRootResult.stdout.trim());
  const isGitRepository = gitRootResult !== undefined;
  const evidence: DiscoveryEvidence[] = [
    { source: "working directory", value: requestedReal },
    { source: "repository root", value: repositoryRoot },
  ];

  const [remoteResult, branchResult, originHeadResult, files, existingLocalPaths] = await Promise.all([
    isGitRepository ? runner("git", ["remote", "-v"], repositoryRoot) : undefined,
    isGitRepository ? runner("git", ["branch", "--show-current"], repositoryRoot) : undefined,
    isGitRepository
      ? runner("git", ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], repositoryRoot)
      : undefined,
    walkRepository(repositoryRoot),
    listExistingLocalPaths(repositoryRoot),
  ]);
  const documentCandidates = await readDocumentCandidates(repositoryRoot, files);

  const remotes = parseRemotes(remoteResult?.stdout ?? "");
  const currentBranch = branchResult?.stdout.trim() || undefined;
  const originHead = originHeadResult?.stdout.trim().replace(/^origin\//, "") || undefined;
  const github = isGitRepository ? await discoverGitHub(repositoryRoot, runner) : undefined;
  const fleet = isGitRepository ? await discoverFleet(repositoryRoot) : undefined;
  const memberRepositories = isGitRepository ? [] : await listMemberRepositories(repositoryRoot);
  const defaultBranchCandidate = github?.defaultBranch ?? originHead;
  const verificationCandidates = await discoverVerificationCommands(
    repositoryRoot,
    files.packages,
    files.workspaces,
  );

  if (remotes.length > 0) {
    evidence.push({
      source: "git remotes",
      value: remotes.map((remote) => `${remote.name}=${remote.fetchUrl}`).join(", "),
    });
  }
  if (github !== undefined) {
    evidence.push({ source: "GitHub repository", value: `${github.nameWithOwner} (${github.url})` });
    if (github.defaultBranch !== undefined) {
      evidence.push({ source: "GitHub default branch", value: github.defaultBranch });
    }
    if (github.relationshipFields.length > 0) {
      evidence.push({
        source: "GitHub GraphQL Issue schema",
        value: github.relationshipFields.join(", "),
      });
    }
  } else if (originHead !== undefined) {
    evidence.push({ source: "origin/HEAD", value: originHead });
  }
  if (fleet !== undefined) {
    evidence.push({ source: "fleet policy index (read-only)", value: fleet.indexPath });
  }
  if (memberRepositories.length > 0) {
    evidence.push({ source: "member repositories", value: memberRepositories.join(", ") });
  }
  if (existingLocalPaths.length > 0) {
    evidence.push({ source: "existing .local paths (read-only)", value: existingLocalPaths.join(", ") });
  }
  for (const document of documentCandidates) {
    evidence.push({
      source: `${document.kinds.join("/")} candidate ${document.path}`,
      value: `${document.excerpt}${document.truncated ? "\n[…bounded excerpt truncated…]" : ""}`,
    });
  }

  return {
    requestedCwd: requestedReal,
    repositoryRoot,
    isGitRepository,
    remotes,
    ...(currentBranch === undefined ? {} : { currentBranch }),
    ...(defaultBranchCandidate === undefined ? {} : { defaultBranchCandidate }),
    ...(github === undefined ? {} : { github }),
    ...(fleet === undefined ? {} : { fleet }),
    memberRepositories,
    packageFiles: files.packages,
    workspaceFiles: files.workspaces,
    guidanceFiles: files.guidance,
    architectureFiles: files.architecture,
    documentCandidates,
    existingLocalPaths,
    verificationCandidates,
    evidence,
  };
}
