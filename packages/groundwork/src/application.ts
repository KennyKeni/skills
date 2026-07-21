import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join, relative, sep } from "node:path";

import type { RenderedConcern, RenderedPlan } from "./model.js";
import { renderIndexEntries, type IndexEntry } from "./rendering.js";

const lockName = ".groundwork.setup.lock";
const recoveryName = ".groundwork.setup-recovery.json";
const markerName = ".groundwork-install.json";

export type CreatedConcern = {
  readonly id: string;
  readonly destination: string;
};

export type SkippedTarget = {
  readonly id: string;
  readonly destination: string;
  readonly reason: "already exists" | "appeared during setup" | "index already exists";
};

export type ApplyResult = {
  readonly created: readonly CreatedConcern[];
  readonly skipped: readonly SkippedTarget[];
  readonly index: "created" | "already exists" | "appeared during setup";
};

export type ApplyHooks = {
  readonly beforeDestinationClaim?: (concern: RenderedConcern) => void | Promise<void>;
  readonly beforeIndexLink?: (indexPath: string) => void | Promise<void>;
  readonly onCleanupLeak?: (path: string, reason: string) => void;
};

export class SetupLockedError extends Error {
  public constructor() {
    super("Another groundwork setup process holds the repository reservation.");
    this.name = "SetupLockedError";
  }
}

type LockRecord = { readonly pid: number; readonly token: string };
type RecoveryConcern = IndexEntry & {
  readonly id: string;
  readonly marker: string;
};
type RecoveryRecord = {
  readonly version: 1;
  readonly concerns: readonly RecoveryConcern[];
};

type FileSystemError = NodeJS.ErrnoException;
type PhysicalIdentity = {
  readonly path: string;
  readonly realPath: string;
  readonly dev: number;
  readonly ino: number;
};
type OwnedStaging = {
  readonly path: string;
  readonly parent: PhysicalIdentity;
  readonly dev: number;
  readonly ino: number;
};

function hasCode(error: unknown, code: string): error is FileSystemError {
  return error instanceof Error && (error as FileSystemError).code === code;
}

async function captureDirectoryIdentity(path: string): Promise<PhysicalIdentity> {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Not a physical directory: ${path}`);
  return { path, realPath: await realpath(path), dev: stat.dev, ino: stat.ino };
}

async function identityStillMatches(identity: PhysicalIdentity): Promise<boolean> {
  try {
    const current = await captureDirectoryIdentity(identity.path);
    return current.dev === identity.dev && current.ino === identity.ino && current.realPath === identity.realPath;
  } catch {
    return false;
  }
}

function reportCleanupLeak(hooks: ApplyHooks, path: string, reason: string): void {
  hooks.onCleanupLeak?.(path, reason);
  if (hooks.onCleanupLeak === undefined) {
    process.emitWarning(`Preserved temporary path ${path}: ${reason}`, { code: "GROUNDWORK_CLEANUP_LEAK" });
  }
}

async function removeOwnedStaging(staging: OwnedStaging, hooks: ApplyHooks): Promise<void> {
  if (!(await identityStillMatches(staging.parent))) {
    reportCleanupLeak(hooks, staging.path, "staging parent identity changed or could not be proven");
    return;
  }
  try {
    const stat = await lstat(staging.path);
    if (stat.isSymbolicLink() || !stat.isDirectory() || stat.dev !== staging.dev || stat.ino !== staging.ino) {
      reportCleanupLeak(hooks, staging.path, "staging directory ownership changed or could not be proven");
      return;
    }
  } catch (error) {
    if (hasCode(error, "ENOENT")) return;
    reportCleanupLeak(hooks, staging.path, "staging directory identity could not be read");
    return;
  }
  await rm(staging.path, { recursive: true, force: true });
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !hasCode(error, "ESRCH");
  }
}

async function acquireSetupLock(repositoryRoot: string): Promise<LockRecord & { readonly path: string }> {
  const path = join(repositoryRoot, lockName);
  for (;;) {
    const token = randomUUID();
    try {
      const handle = await open(path, "wx", 0o600);
      try {
        const record = { pid: process.pid, token } satisfies LockRecord;
        await handle.writeFile(`${JSON.stringify(record)}\n`, "utf8");
        return { ...record, path };
      } finally {
        await handle.close();
      }
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
    }

    let existing: LockRecord;
    try {
      existing = JSON.parse(await readFile(path, "utf8")) as LockRecord;
    } catch {
      // A just-created lock may not have its record yet. Never steal an
      // indeterminate reservation from a potentially live process.
      throw new SetupLockedError();
    }
    if (!Number.isSafeInteger(existing.pid) || typeof existing.token !== "string" || processIsAlive(existing.pid)) {
      throw new SetupLockedError();
    }

    const stalePath = `${path}.stale-${randomUUID()}`;
    try {
      await rename(path, stalePath);
      await rm(stalePath, { force: true });
    } catch (error) {
      if (!hasCode(error, "ENOENT")) throw error;
    }
  }
}

async function releaseSetupLock(lock: LockRecord & { readonly path: string }): Promise<void> {
  try {
    const existing = JSON.parse(await readFile(lock.path, "utf8")) as LockRecord;
    if (existing.token === lock.token) await unlink(lock.path);
  } catch (error) {
    if (!hasCode(error, "ENOENT")) throw error;
  }
}

async function readRecovery(repositoryRoot: string): Promise<RecoveryRecord | undefined> {
  try {
    const value = JSON.parse(await readFile(join(repositoryRoot, recoveryName), "utf8")) as RecoveryRecord;
    return value.version === 1 && Array.isArray(value.concerns) ? value : undefined;
  } catch (error) {
    if (hasCode(error, "ENOENT")) return undefined;
    throw new Error("The groundwork recovery journal is invalid or unreadable.", { cause: error });
  }
}

async function writeRecovery(repositoryRoot: string, record: RecoveryRecord): Promise<void> {
  const path = join(repositoryRoot, recoveryName);
  const staged = `${path}.stage-${randomUUID()}`;
  await writeFile(staged, `${JSON.stringify(record)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  await rename(staged, path);
}

async function removeRecoverySafely(
  repositoryRoot: string,
  expected: RecoveryRecord,
  rootIdentity: PhysicalIdentity,
  hooks: ApplyHooks,
): Promise<void> {
  const path = join(repositoryRoot, recoveryName);
  if (!(await identityStillMatches(rootIdentity))) {
    reportCleanupLeak(hooks, path, "repository root identity changed or could not be proven");
    return;
  }
  let actual: RecoveryRecord | undefined;
  try {
    actual = await readRecovery(repositoryRoot);
  } catch {
    reportCleanupLeak(hooks, path, "recovery journal ownership could not be authenticated");
    return;
  }
  if (actual === undefined) return;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    reportCleanupLeak(hooks, path, "recovery journal contents changed");
    return;
  }
  await unlink(path);
}

async function markerMatches(concern: RecoveryConcern): Promise<boolean> {
  try {
    return (await readFile(join(concern.destination, markerName), "utf8")).trim() === concern.marker;
  } catch (error) {
    if (hasCode(error, "ENOENT")) return false;
    throw error;
  }
}

async function removeMarker(concern: RecoveryConcern): Promise<void> {
  if (await markerMatches(concern)) await unlink(join(concern.destination, markerName));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (hasCode(error, "ENOENT")) return false;
    throw error;
  }
}

function isInside(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== "..");
}

async function nearestExistingDirectory(path: string): Promise<string> {
  let candidate = path;
  while (!(await pathExists(candidate))) {
    const parent = dirname(candidate);
    if (parent === candidate) throw new Error(`No existing ancestor found for ${path}`);
    candidate = parent;
  }
  return candidate;
}

async function assertPhysicalDestinationInsideRoot(root: string, destination: string): Promise<void> {
  const physicalRoot = await realpath(root);
  const existingAncestor = await nearestExistingDirectory(dirname(destination));
  const physicalAncestor = await realpath(existingAncestor);
  if (!isInside(physicalRoot, physicalAncestor)) {
    throw new Error(`Destination resolves outside the repository root: ${destination}`);
  }
}

async function assertParentHasNoSymlinks(root: string, destination: string): Promise<void> {
  const parent = dirname(destination);
  const segments = relative(root, parent).split(sep).filter(Boolean);
  let current = root;
  for (const segment of segments) {
    current = join(current, segment);
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if (hasCode(error, "ENOENT")) break;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`Destination parent contains a symbolic link: ${current}`);
    }
    if (!stat.isDirectory()) throw new Error(`Destination parent is not a directory: ${current}`);
  }
  await assertPhysicalDestinationInsideRoot(root, destination);
}

async function stageConcern(
  repositoryRoot: string,
  concern: RenderedConcern,
  marker: string,
  hooks: ApplyHooks,
): Promise<OwnedStaging> {
  const destinationParent = dirname(concern.destination);
  await assertParentHasNoSymlinks(repositoryRoot, concern.destination);
  await mkdir(destinationParent, { recursive: true });
  await assertParentHasNoSymlinks(repositoryRoot, concern.destination);
  const parent = await captureDirectoryIdentity(destinationParent);
  const stagingFolder = await mkdtemp(join(destinationParent, `.groundwork-stage-${concern.id}-`));
  const stagingStat = await lstat(stagingFolder);
  const owned = { path: stagingFolder, parent, dev: stagingStat.dev, ino: stagingStat.ino } satisfies OwnedStaging;
  try {
    await Promise.all(
      [...concern.renderedFiles.map(async (file) => {
        const filePath = join(stagingFolder, file.name);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, file.contents, { encoding: "utf8", flag: "wx" });
      }), writeFile(join(stagingFolder, markerName), `${marker}\n`, { encoding: "utf8", flag: "wx" })],
    );
    return owned;
  } catch (error) {
    await removeOwnedStaging(owned, hooks);
    throw error;
  }
}

async function installStagedConcern(
  repositoryRoot: string,
  concern: RenderedConcern,
  stagingFolder: string,
  hooks: ApplyHooks,
): Promise<"created" | "appeared during setup"> {
  await assertParentHasNoSymlinks(repositoryRoot, concern.destination);
  await hooks.beforeDestinationClaim?.(concern);
  await assertParentHasNoSymlinks(repositoryRoot, concern.destination);

  if (await pathExists(concern.destination)) return "appeared during setup";

  try {
    // Node does not expose macOS renamex_np(RENAME_EXCL). Directory rename is
    // nevertheless the only Node primitive that publishes the complete folder
    // atomically; see README.md for the narrow competing-empty-directory limit.
    await rename(stagingFolder, concern.destination);
    return "created";
  } catch (error) {
    if (hasCode(error, "EEXIST") || hasCode(error, "ENOTEMPTY")) {
      return "appeared during setup";
    }
    throw error;
  }
}

async function writeIndex(
  plan: RenderedPlan,
  concerns: readonly IndexEntry[],
  hooks: ApplyHooks,
): Promise<ApplyResult["index"]> {
  if (await pathExists(plan.indexPath)) return "already exists";

  await assertParentHasNoSymlinks(plan.repositoryRoot, plan.indexPath);
  await mkdir(dirname(plan.indexPath), { recursive: true });
  await assertParentHasNoSymlinks(plan.repositoryRoot, plan.indexPath);
  const indexParent = dirname(plan.indexPath);
  const parent = await captureDirectoryIdentity(indexParent);
  const stagingRoot = await mkdtemp(join(indexParent, ".groundwork-index-"));
  const stagingStat = await lstat(stagingRoot);
  const owned = { path: stagingRoot, parent, dev: stagingStat.dev, ino: stagingStat.ino } satisfies OwnedStaging;
  const stagedIndex = join(owned.path, "INDEX.md");
  try {
    await writeFile(stagedIndex, renderIndexEntries(plan.indexPath, concerns, plan.index), {
      encoding: "utf8",
      flag: "wx",
    });
    try {
      await hooks.beforeIndexLink?.(plan.indexPath);
      await assertParentHasNoSymlinks(plan.repositoryRoot, plan.indexPath);
      await link(stagedIndex, plan.indexPath);
      return "created";
    } catch (error) {
      if (hasCode(error, "EEXIST")) return "appeared during setup";
      throw error;
    }
  } finally {
    await removeOwnedStaging(owned, hooks);
  }
}

export async function applyPlan(plan: RenderedPlan, hooks: ApplyHooks = {}): Promise<ApplyResult> {
  const repositoryIdentity = await captureDirectoryIdentity(plan.repositoryRoot);
  const lock = await acquireSetupLock(plan.repositoryRoot);
  try {
    const priorRecovery = await readRecovery(plan.repositoryRoot);
    const recovered: RecoveryConcern[] = [];
    for (const concern of priorRecovery?.concerns ?? []) {
      if (!isInside(plan.repositoryRoot, concern.destination)) {
        throw new Error("Recovery journal destination is outside the repository; preserved for manual resolution.");
      }
      await assertParentHasNoSymlinks(plan.repositoryRoot, concern.destination);
      let stat;
      try {
        stat = await lstat(concern.destination);
      } catch (error) {
        if (hasCode(error, "ENOENT")) continue;
        throw error;
      }
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error("Recovery journal destination ownership cannot be authenticated; preserved for manual resolution.");
      }
      if (!(await markerMatches(concern))) {
        throw new Error("Recovery marker is missing or mismatched; preserved the journal for manual resolution.");
      }
      recovered.push(concern);
    }

    if (await pathExists(plan.indexPath)) {
      if (recovered.length > 0) {
        const indexContents = await readFile(plan.indexPath, "utf8");
        const representsRecovery = recovered.every((concern) => {
          const readmePath = join(concern.destination, "README.md");
          const linkPath = relative(dirname(plan.indexPath), readmePath).replaceAll("\\", "/");
          return indexContents.includes(`(${linkPath})`);
        });
        if (!representsRecovery) {
          throw new Error(
            "Existing INDEX.md does not represent concerns from the recovery journal; preserved both for manual resolution.",
          );
        }
      }
      for (const concern of recovered) await removeMarker(concern);
      if (priorRecovery !== undefined) {
        await removeRecoverySafely(plan.repositoryRoot, priorRecovery, repositoryIdentity, hooks);
      }
      return {
        created: [],
        skipped: plan.concerns.map((concern) => ({
          id: concern.id,
          destination: concern.destination,
          reason: "index already exists",
        })),
        index: "already exists",
      };
    }

    const entries = new Map(recovered.map((concern) => [concern.destination, concern]));
    for (const concern of plan.concerns) {
      if (!entries.has(concern.destination)) {
        entries.set(concern.destination, {
          id: concern.id,
          label: concern.label,
          destination: concern.destination,
          marker: randomUUID(),
        });
      }
    }
    const recovery = { version: 1, concerns: [...entries.values()] } satisfies RecoveryRecord;
    await writeRecovery(plan.repositoryRoot, recovery);

    const created: CreatedConcern[] = [];
    const skipped: SkippedTarget[] = [];
    const selected = new Map(recovered.map((concern) => [concern.destination, concern]));

    for (const concern of plan.concerns) {
      await assertParentHasNoSymlinks(plan.repositoryRoot, concern.destination);
      if (await pathExists(concern.destination)) {
        skipped.push({ id: concern.id, destination: concern.destination, reason: "already exists" });
        continue;
      }

      const recoveryConcern = entries.get(concern.destination);
      if (recoveryConcern === undefined) throw new Error("Missing concern recovery reservation.");
      const stagingFolder = await stageConcern(plan.repositoryRoot, concern, recoveryConcern.marker, hooks);
      let published = false;
      try {
        const result = await installStagedConcern(plan.repositoryRoot, concern, stagingFolder.path, hooks);
        if (result === "created") {
          published = true;
          selected.set(concern.destination, recoveryConcern);
          created.push({ id: concern.id, destination: concern.destination });
        } else {
          skipped.push({ id: concern.id, destination: concern.destination, reason: result });
        }
      } finally {
        if (!published) await removeOwnedStaging(stagingFolder, hooks);
      }
    }

    const index = await writeIndex(plan, [...selected.values()], hooks);
    if (index !== "created") {
      throw new Error("INDEX.md appeared during setup; recovery markers were preserved for inspection.");
    }
    for (const concern of recovery.concerns) await removeMarker(concern);
    await removeRecoverySafely(plan.repositoryRoot, recovery, repositoryIdentity, hooks);
    return { created, skipped, index };
  } finally {
    await releaseSetupLock(lock);
  }
}
