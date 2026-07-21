import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "groundwork-pack-"));
const sourceManifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));

function run(command, args, cwd) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", stdio: "pipe", shell: false });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function runExpectFailure(command, args, cwd) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", stdio: "pipe", shell: false });
  if (result.status === 0) throw new Error(`${command} ${args.join(" ")} unexpectedly succeeded.`);
  return `${result.stdout}\n${result.stderr}`;
}

try {
  const packOutput = run("npm", ["pack", "--ignore-scripts", "--pack-destination", temporaryRoot], packageRoot);
  const archiveName = packOutput.trim().split("\n").at(-1);
  if (!archiveName) throw new Error("npm pack did not report an archive.");
  const archivePath = resolve(temporaryRoot, archiveName);

  const consumer = join(temporaryRoot, "consumer");
  await writeFile(
    join(temporaryRoot, "package.json"),
    JSON.stringify({ name: "pack-root", private: true }),
  );
  await mkdir(consumer);
  await writeFile(join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true }));
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", archivePath], consumer);
  const help = run("npx", ["--no-install", "groundwork", "--help"], consumer);
  if (!help.includes("groundwork setup")) {
    throw new Error("Installed packed executable did not produce the routed help output.");
  }
  const nonInteractiveRoot = join(temporaryRoot, "non-interactive-repository");
  await mkdir(nonInteractiveRoot);
  const nonInteractive = runExpectFailure(
    "npx",
    ["--no-install", "groundwork", "setup", "--cwd", nonInteractiveRoot],
    consumer,
  );
  if (!nonInteractive.includes("Interactive setup requires a TTY")) {
    throw new Error(`Non-TTY setup did not fail with the expected validation:\n${nonInteractive}`);
  }
  if ((await readdir(nonInteractiveRoot)).length !== 0) {
    throw new Error("Non-TTY setup mutated the selected repository.");
  }

  const installedManifest = JSON.parse(
    await readFile(join(consumer, "node_modules", "@kennykeni", "groundwork", "package.json"), "utf8"),
  );
  if (installedManifest.version !== sourceManifest.version) {
    throw new Error("Installed version did not match.");
  }
  const installedRoot = join(consumer, "node_modules", "@kennykeni", "groundwork");
  const installedFiles = (await readdir(join(installedRoot, "templates"), { recursive: true }))
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const sourceFiles = (await readdir(join(packageRoot, "templates"), { recursive: true }))
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  if (sourceFiles.length === 0 || JSON.stringify(installedFiles) !== JSON.stringify(sourceFiles)) {
    throw new Error("Installed template assets did not match.");
  }
  await readFile(join(installedRoot, "dist", "bin.js"));
  await readFile(join(installedRoot, "RUNTIME-BOOTSTRAP.md"));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
