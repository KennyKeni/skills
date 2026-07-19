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


SKILL_DIR = REPOSITORY_DIR / "skills" / "personal" / "codex-subagent-routing"
REFERENCES_DIR = SKILL_DIR / "references"
SPEC_PATH = SOURCE_DIR / "lanes.yaml"
TEMPLATE_NAME = "lane.md.j2"
SKILL_TEMPLATE_NAME = "skill.md.j2"
COMMON_FIELDS = {
    "slug",
    "harness",
    "title",
    "description_name",
    "selection_label",
    "policy",
    "default",
    "external",
}


class SpecError(ValueError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the routing skill and lane references."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report stale generated references without writing them.",
    )
    return parser.parse_args()


def load_lanes() -> list[dict[str, Any]]:
    document = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise SpecError("lanes.yaml must contain a mapping")
    if document.get("schema_version") != 1:
        raise SpecError("lanes.yaml must declare schema_version: 1")

    raw_lanes = document.get("lanes")
    if not isinstance(raw_lanes, list) or not raw_lanes:
        raise SpecError("lanes.yaml must contain a non-empty lanes list")

    harnesses = load_harnesses()
    required = COMMON_FIELDS
    seen: set[str] = set()
    lanes: list[dict[str, Any]] = []
    for index, raw in enumerate(raw_lanes):
        if not isinstance(raw, dict):
            raise SpecError(f"lane {index} must be a mapping")
        missing = required - raw.keys()
        if missing:
            raise SpecError(f"lane {index} is missing: {', '.join(sorted(missing))}")
        unknown = raw.keys() - COMMON_FIELDS
        if unknown:
            raise SpecError(
                f"unknown fields for lane {index}: {', '.join(sorted(unknown))}"
            )

        slug = raw["slug"]
        if not isinstance(slug, str) or not slug.replace("-", "").isalnum():
            raise SpecError(f"invalid lane slug: {slug!r}")
        if slug in seen:
            raise SpecError(f"duplicate lane slug: {slug}")
        seen.add(slug)
        lanes.append(resolve_harness(raw, harnesses, record_name=f"lane {slug}"))

    defaults = [lane for lane in lanes if lane["default"] is True]
    if len(defaults) != 1:
        raise SpecError("lanes.yaml must define exactly one default lane")
    if any(not isinstance(lane["external"], bool) for lane in lanes):
        raise SpecError("every lane external field must be true or false")
    return lanes


def human_join(values: list[str]) -> str:
    if len(values) == 1:
        return values[0]
    if len(values) == 2:
        return f"{values[0]} and {values[1]}"
    return f"{', '.join(values[:-1])}, or {values[-1]}"


def render(lanes: list[dict[str, Any]]) -> dict[Path, str]:
    environment = create_environment(SOURCE_DIR, TEMPLATE_DIR)
    template = environment.get_template(TEMPLATE_NAME)
    skill_template = environment.get_template(SKILL_TEMPLATE_NAME)
    outputs: dict[Path, str] = {}
    for lane in lanes:
        rendered = template.render(lane=lane)
        outputs[REFERENCES_DIR / f"{lane['slug']}.md"] = rendered.rstrip() + "\n"
    default_lane = next(lane for lane in lanes if lane["default"])
    skill_rendered = skill_template.render(
        lanes=lanes,
        default_lane=default_lane,
        grok_lanes=[lane for lane in lanes if lane["policy"] == "grok"],
        lane_description=human_join([lane["description_name"] for lane in lanes]),
    )
    outputs[SKILL_DIR / "SKILL.md"] = skill_rendered.rstrip() + "\n"
    return outputs


def check(outputs: dict[Path, str]) -> int:
    stale = stale_outputs(outputs)
    unexpected = unexpected_references(outputs)

    if not stale and not unexpected:
        print(f"All {len(outputs)} generated routing files are current.")
        return 0

    for path in stale:
        print(f"stale: {path.relative_to(SKILL_DIR)}", file=sys.stderr)
    for path in unexpected:
        print(f"unexpected reference: {path.relative_to(SKILL_DIR)}", file=sys.stderr)
    print("Run `task skills:routing:generate`.", file=sys.stderr)
    return 1


def unexpected_references(outputs: dict[Path, str]) -> list[Path]:
    return unexpected_markdown_outputs(REFERENCES_DIR, outputs)


def main() -> int:
    args = parse_args()
    try:
        outputs = render(load_lanes())
    except (OSError, SpecError, CatalogError, yaml.YAMLError) as error:
        print(f"routing skill generation failed: {error}", file=sys.stderr)
        return 2

    if args.check:
        return check(outputs)

    removed = unexpected_references(outputs)
    trash_outputs(removed, relative_to=SKILL_DIR)
    changed = write_outputs(outputs)
    for path in changed:
        print(f"generated: {path.relative_to(SKILL_DIR)}")
    if not changed and not removed:
        print(f"All {len(outputs)} generated routing files were already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
