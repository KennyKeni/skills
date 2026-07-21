import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// deliver-project consumes the policy that groundwork generates. The skill may
// speak only the stable contract surface (verb vocabulary, .local/INDEX.md);
// every tracker- or forge-specific mechanism lives in the generated policy.
const skillRoot = fileURLToPath(
  new URL("../../../skills/personal/deliver-project/", import.meta.url),
);

async function loadSkillSources(): Promise<readonly { path: string; contents: string }[]> {
  const names = [
    "SKILL.md",
    ...(await readdir(join(skillRoot, "references"))).map((name) => join("references", name)),
  ].filter((name) => name.endsWith(".md"));
  return Promise.all(
    names.map(async (name) => ({
      path: name,
      contents: await readFile(join(skillRoot, name), "utf8"),
    })),
  );
}

const forbidden: readonly { label: string; pattern: RegExp }[] = [
  { label: "label-based claim lock", pattern: /implementation-locked/i },
  { label: "pre-groundwork policy path", pattern: /\.local\/agents/ },
  { label: "retired state-file path", pattern: /\.local\/state/ },
  { label: "GitHub CLI", pattern: /\bgh\b/ },
  { label: "GitLab CLI", pattern: /\bglab\b/ },
  { label: "forge name GitHub", pattern: /github/i },
  { label: "forge name GitLab", pattern: /gitlab/i },
  { label: "tracker name Linear", pattern: /\blinear\b/i },
  { label: "native sub-issue mechanics", pattern: /sub-issue/i },
];

describe("deliver-project seam with generated policy", () => {
  it("keeps tracker and forge mechanics out of the skill", async () => {
    for (const source of await loadSkillSources()) {
      for (const rule of forbidden) {
        expect(source.contents, `${rule.label} in ${source.path}`).not.toMatch(rule.pattern);
      }
    }
  });

  it("routes backend behavior through the policy index and verb contract", async () => {
    const skill = (await readFile(join(skillRoot, "SKILL.md"), "utf8")).replaceAll(/\s+/g, " ");
    expect(skill).toContain(".local/INDEX.md");
    for (const verb of ["publish", "fetch", "query the frontier", "claim", "release", "resolve"]) {
      expect(skill).toContain(verb);
    }

    const missionSetup = (
      await readFile(join(skillRoot, "references", "mission-setup.md"), "utf8")
    ).replaceAll(/\s+/g, " ");
    expect(missionSetup).toContain("claim policy");
    expect(missionSetup).toContain("work/<mission-slug>/");
  });
});
