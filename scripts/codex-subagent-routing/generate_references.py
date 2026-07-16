# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "jinja2>=3.1,<4",
#   "pyyaml>=6,<7",
# ]
# ///

from __future__ import annotations

import argparse
import hashlib
import os
import stat
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined


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


SKILL_DIR = (
    REPOSITORY_DIR / "packages" / "agent-skills" / "personal" / "codex-subagent-routing"
)
REFERENCES_DIR = SKILL_DIR / "references"
SPEC_PATH = SOURCE_DIR / "lanes.yaml"
COMPATIBILITY_PATH = SOURCE_DIR / "compatibility.yaml"
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
    environment = Environment(
        loader=FileSystemLoader([SOURCE_DIR, TEMPLATE_DIR]),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
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
    stale: list[Path] = []
    for path, expected in outputs.items():
        if not path.exists() or path.read_text(encoding="utf-8") != expected:
            stale.append(path)

    unexpected = unexpected_references(outputs)
    compatibility_errors = check_compatibility(outputs)

    if not stale and not unexpected and not compatibility_errors:
        print(
            f"All {len(outputs)} generated routing files are current and "
            "compatibility-stable."
        )
        return 0

    for path in stale:
        print(f"stale: {path.relative_to(SKILL_DIR)}", file=sys.stderr)
    for path in unexpected:
        print(f"unexpected reference: {path.relative_to(SKILL_DIR)}", file=sys.stderr)
    for error in compatibility_errors:
        print(f"compatibility drift: {error}", file=sys.stderr)
    print("Run `task skills:routing:generate`.", file=sys.stderr)
    return 1


def check_compatibility(outputs: dict[Path, str]) -> list[str]:
    document = yaml.safe_load(COMPATIBILITY_PATH.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        return ["compatibility.yaml must be a schema_version 1 mapping"]
    expected = document.get("sha256")
    if not isinstance(expected, dict):
        return ["compatibility.yaml must define a sha256 mapping"]

    actual = {
        str(path.relative_to(SKILL_DIR)): hashlib.sha256(content.encode()).hexdigest()
        for path, content in outputs.items()
    }
    errors = [
        f"manifest is missing {path}"
        for path in sorted(actual.keys() - expected.keys())
    ]
    errors.extend(
        f"manifest has unexpected {path}"
        for path in sorted(expected.keys() - actual.keys())
    )
    errors.extend(
        f"{path} expected {expected[path]}, got {actual[path]}"
        for path in sorted(actual.keys() & expected.keys())
        if actual[path] != expected[path]
    )
    return errors


def unexpected_references(outputs: dict[Path, str]) -> list[Path]:
    expected_paths = set(outputs)
    return [path for path in REFERENCES_DIR.glob("*.md") if path not in expected_paths]


def write_atomic(path: Path, content: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False

    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=path.parent,
        prefix=f".{path.name}.",
        text=True,
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o644
        os.chmod(temporary_path, mode)
        os.replace(temporary_path, path)
    finally:
        temporary_path.unlink(missing_ok=True)
    return True


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
    for path in removed:
        subprocess.run(["/usr/bin/trash", str(path)], check=True)
        print(f"removed: {path.relative_to(SKILL_DIR)}")
    changed = [path for path, content in outputs.items() if write_atomic(path, content)]
    for path in changed:
        print(f"generated: {path.relative_to(SKILL_DIR)}")
    if not changed and not removed:
        print(f"All {len(outputs)} generated routing files were already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
