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


SKILL_DIR = REPOSITORY_DIR / "skills" / "personal" / "sidekick"
REFERENCES_DIR = SKILL_DIR / "references"
SPEC_PATH = SOURCE_DIR / "setups.yaml"
SETUP_TEMPLATE = "setup.md.j2"
REGISTRY_TEMPLATE = "setups.md.j2"
OPENAI_TEMPLATE = "openai.yaml.j2"
COMMON_FIELDS = {"slug", "harness", "title", "selection_label", "default"}
NATIVE_FIELDS = {
    "sidekick_model",
    "reasoning_effort",
    "agent_type",
    "task_name",
    "context_fork",
}


class SpecError(ValueError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Sidekick setup references.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report stale generated files without writing them.",
    )
    return parser.parse_args()


def load_setups() -> list[dict[str, Any]]:
    document = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise SpecError("setups.yaml must be a schema_version 1 mapping")
    lead = document.get("lead")
    if (
        not isinstance(lead, dict)
        or set(lead) != {"name"}
        or not isinstance(lead["name"], str)
        or not lead["name"]
    ):
        raise SpecError("setups.yaml lead must define a non-empty name")
    raw_setups = document.get("setups")
    if not isinstance(raw_setups, list) or not raw_setups:
        raise SpecError("setups.yaml must contain a non-empty setups list")

    harnesses = load_harnesses()
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
        setup["lead_name"] = lead["name"]
        allowed = COMMON_FIELDS | (
            NATIVE_FIELDS if setup["family"] == "codex-native" else set()
        )
        unknown = raw.keys() - allowed
        if unknown:
            raise SpecError(f"unknown fields for {slug}: {', '.join(sorted(unknown))}")
        if setup["family"] == "codex-native":
            missing_native = NATIVE_FIELDS - raw.keys()
            if missing_native:
                raise SpecError(
                    f"native setup {slug} is missing: {', '.join(sorted(missing_native))}"
                )
            setup["worker_model"] = setup["sidekick_model"]
        elif setup.get("model_mode") not in {"shared", "tiered"}:
            raise SpecError(
                f"Sidekick setup {slug} requires a harness with a concrete "
                "worker model"
            )
        setups.append(setup)

    defaults = [setup for setup in setups if setup["default"] is True]
    if len(defaults) != 1:
        raise SpecError("setups.yaml must define exactly one default setup")
    return setups


def render(setups: list[dict[str, Any]]) -> dict[Path, str]:
    environment = create_environment(SOURCE_DIR, TEMPLATE_DIR)
    setup_template = environment.get_template(SETUP_TEMPLATE)
    registry_template = environment.get_template(REGISTRY_TEMPLATE)
    openai_template = environment.get_template(OPENAI_TEMPLATE)
    outputs = {
        REFERENCES_DIR / f"{setup['slug']}.md": setup_template.render(
            setup=setup
        ).rstrip()
        + "\n"
        for setup in setups
    }
    default_setup = next(setup for setup in setups if setup["default"])
    outputs[REFERENCES_DIR / "setups.md"] = (
        registry_template.render(setups=setups, default_setup=default_setup).rstrip()
        + "\n"
    )
    outputs[SKILL_DIR / "agents" / "openai.yaml"] = (
        openai_template.render(default_setup=default_setup).rstrip() + "\n"
    )
    return outputs


def unexpected_references(outputs: dict[Path, str]) -> list[Path]:
    return unexpected_markdown_outputs(REFERENCES_DIR, outputs)


def check(outputs: dict[Path, str]) -> int:
    stale = stale_outputs(outputs)
    unexpected = unexpected_references(outputs)
    if not stale and not unexpected:
        print(f"All {len(outputs)} generated Sidekick files are current.")
        return 0
    for path in stale:
        print(f"stale: {path.relative_to(SKILL_DIR)}", file=sys.stderr)
    for path in unexpected:
        print(f"unexpected reference: {path.relative_to(SKILL_DIR)}", file=sys.stderr)
    print("Run `task skills:sidekick:generate`.", file=sys.stderr)
    return 1


def main() -> int:
    args = parse_args()
    try:
        outputs = render(load_setups())
    except (OSError, SpecError, CatalogError, yaml.YAMLError) as error:
        print(f"Sidekick generation failed: {error}", file=sys.stderr)
        return 2
    if args.check:
        return check(outputs)

    removed = unexpected_references(outputs)
    trash_outputs(removed, relative_to=SKILL_DIR)
    changed = write_outputs(outputs)
    for path in changed:
        print(f"generated: {path.relative_to(SKILL_DIR)}")
    if not changed and not removed:
        print(f"All {len(outputs)} generated Sidekick files were already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
