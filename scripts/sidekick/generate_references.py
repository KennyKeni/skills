# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "jinja2>=3.1,<4",
#   "pyyaml>=6,<7",
# ]
# ///

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml


SOURCE_DIR = Path(__file__).resolve().parent
REPOSITORY_DIR = SOURCE_DIR.parent.parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(REPOSITORY_DIR / "scripts"))

from subagent_harnesses.catalog import (  # noqa: E402
    CatalogError,
    TEMPLATE_DIR,
    load_harnesses,
    resolve_harness,
)
from subagent_harnesses.generation import (  # noqa: E402
    create_environment,
    stale_outputs,
    trash_outputs,
    unexpected_markdown_outputs,
    write_outputs,
)


SKILLS_DIR = REPOSITORY_DIR / "skills" / "personal"
LEADS_DIR = SOURCE_DIR / "leads"
SETUP_TEMPLATE = "setup.md.j2"
REGISTRY_TEMPLATE = "setups.md.j2"
SKILL_TEMPLATE = "skill.md.j2"
OPENAI_TEMPLATE = "openai.yaml.j2"
LEAD_FIELDS = {"name", "skill_slug", "title", "openai_manifest"}
COMMON_FIELDS = {"slug", "harness", "title", "selection_label", "default"}
NATIVE_FIELDS = {
    "sidekick_model",
    "reasoning_effort",
    "agent_type",
    "task_name",
    "context_fork",
}
VALID_EFFORTS = {"none", "low", "medium", "high", "xhigh", "max", "ultra"}
EFFORT_FAMILIES = {"codex-exec"}


class SpecError(ValueError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Sidekick setup skills.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report stale generated files without writing them.",
    )
    return parser.parse_args()


def load_leads() -> list[dict[str, Any]]:
    harnesses = load_harnesses()
    spec_paths = sorted(LEADS_DIR.glob("*.yaml"))
    if not spec_paths:
        raise SpecError("leads/ must contain at least one lead spec")
    leads = [load_spec(path, harnesses) for path in spec_paths]
    slugs = [spec["lead"]["skill_slug"] for spec in leads]
    if len(slugs) != len(set(slugs)):
        raise SpecError("lead specs must use distinct skill_slug values")
    return leads


def load_spec(path: Path, harnesses: dict[str, dict[str, Any]]) -> dict[str, Any]:
    document = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise SpecError(f"{path.name} must be a schema_version 1 mapping")

    lead = document.get("lead")
    if not isinstance(lead, dict) or set(lead) != LEAD_FIELDS:
        raise SpecError(
            f"{path.name} lead must define exactly: {', '.join(sorted(LEAD_FIELDS))}"
        )
    for field in ("name", "skill_slug", "title"):
        if not isinstance(lead[field], str) or not lead[field]:
            raise SpecError(f"{path.name} lead {field} must be a non-empty string")
    if not isinstance(lead["openai_manifest"], bool):
        raise SpecError(f"{path.name} lead openai_manifest must be a boolean")

    raw_setups = document.get("setups")
    if not isinstance(raw_setups, list) or not raw_setups:
        raise SpecError(f"{path.name} must contain a non-empty setups list")

    setups: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, raw in enumerate(raw_setups):
        if not isinstance(raw, dict):
            raise SpecError(f"setup {index} must be a mapping")
        missing = COMMON_FIELDS - raw.keys()
        if missing:
            raise SpecError(f"setup {index} is missing: {', '.join(sorted(missing))}")
        slug = raw["slug"]
        if not isinstance(slug, str) or not slug.replace("-", "").isalnum():
            raise SpecError(f"invalid setup slug: {slug!r}")
        if slug in seen:
            raise SpecError(f"duplicate setup slug: {slug}")
        seen.add(slug)

        setup = resolve_harness(raw, harnesses, record_name=f"setup {slug}")
        native_to = setup.get("native_to")
        if native_to is not None and native_to != lead["name"].lower():
            raise SpecError(
                f"setup {slug} selects harness {setup['harness']}, which is "
                f"native to {native_to} and unavailable to a {lead['name']} lead"
            )
        setup["lead_name"] = lead["name"]
        prepare_setup(setup, raw, slug)
        setups.append(setup)

    defaults = [setup for setup in setups if setup["default"] is True]
    if len(defaults) != 1:
        raise SpecError(f"{path.name} must define exactly one default setup")
    return {"lead": lead, "setups": setups}


def prepare_setup(setup: dict[str, Any], raw: dict[str, Any], slug: str) -> None:
    family = setup["family"]
    extra: set[str] = set()
    if family == "codex-native":
        extra = NATIVE_FIELDS
    elif family in EFFORT_FAMILIES:
        extra = {"effort"}
    unknown = raw.keys() - COMMON_FIELDS - extra
    if unknown:
        raise SpecError(f"unknown fields for {slug}: {', '.join(sorted(unknown))}")

    if family == "codex-native":
        missing_native = NATIVE_FIELDS - raw.keys()
        if missing_native:
            raise SpecError(
                f"native setup {slug} is missing: {', '.join(sorted(missing_native))}"
            )
        setup["worker_model"] = setup["sidekick_model"]
        return

    if setup.get("model_mode") not in {"shared", "tiered"}:
        raise SpecError(
            f"Sidekick setup {slug} requires a harness with a concrete worker model"
        )
    if family in EFFORT_FAMILIES and raw.get("effort") not in VALID_EFFORTS:
        raise SpecError(f"setup {slug} requires a valid effort: {raw.get('effort')!r}")


def render(leads: list[dict[str, Any]]) -> dict[Path, str]:
    environment = create_environment(SOURCE_DIR, TEMPLATE_DIR)
    setup_template = environment.get_template(SETUP_TEMPLATE)
    registry_template = environment.get_template(REGISTRY_TEMPLATE)
    skill_template = environment.get_template(SKILL_TEMPLATE)
    openai_template = environment.get_template(OPENAI_TEMPLATE)
    outputs: dict[Path, str] = {}
    for spec in leads:
        lead = spec["lead"]
        setups = spec["setups"]
        skill_dir = SKILLS_DIR / lead["skill_slug"]
        references_dir = skill_dir / "references"
        for setup in setups:
            outputs[references_dir / f"{setup['slug']}.md"] = (
                setup_template.render(setup=setup, lead=lead).rstrip() + "\n"
            )
        default_setup = next(setup for setup in setups if setup["default"])
        outputs[references_dir / "setups.md"] = (
            registry_template.render(
                setups=setups, default_setup=default_setup, lead=lead
            ).rstrip()
            + "\n"
        )
        outputs[skill_dir / "SKILL.md"] = (
            skill_template.render(
                lead=lead, setups=setups, default_setup=default_setup
            ).rstrip()
            + "\n"
        )
        if lead["openai_manifest"]:
            outputs[skill_dir / "agents" / "openai.yaml"] = (
                openai_template.render(lead=lead, default_setup=default_setup).rstrip()
                + "\n"
            )
    return outputs


def unexpected_references(
    leads: list[dict[str, Any]], outputs: dict[Path, str]
) -> list[Path]:
    unexpected: list[Path] = []
    for spec in leads:
        references_dir = SKILLS_DIR / spec["lead"]["skill_slug"] / "references"
        unexpected.extend(unexpected_markdown_outputs(references_dir, outputs))
    return unexpected


def check(leads: list[dict[str, Any]], outputs: dict[Path, str]) -> int:
    stale = stale_outputs(outputs)
    unexpected = unexpected_references(leads, outputs)
    if not stale and not unexpected:
        print(f"All {len(outputs)} generated Sidekick files are current.")
        return 0
    for path in stale:
        print(f"stale: {path.relative_to(SKILLS_DIR)}", file=sys.stderr)
    for path in unexpected:
        print(f"unexpected reference: {path.relative_to(SKILLS_DIR)}", file=sys.stderr)
    print("Run `task skills:sidekick:generate`.", file=sys.stderr)
    return 1


def main() -> int:
    args = parse_args()
    try:
        leads = load_leads()
        outputs = render(leads)
    except (OSError, SpecError, CatalogError, yaml.YAMLError) as error:
        print(f"Sidekick generation failed: {error}", file=sys.stderr)
        return 2
    if args.check:
        return check(leads, outputs)

    removed = unexpected_references(leads, outputs)
    trash_outputs(removed, relative_to=SKILLS_DIR)
    changed = write_outputs(outputs)
    for path in changed:
        print(f"generated: {path.relative_to(SKILLS_DIR)}")
    if not changed and not removed:
        print(f"All {len(outputs)} generated Sidekick files were already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
