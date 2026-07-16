# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "jinja2>=3.1,<4",
#   "pyyaml>=6,<7",
# ]
# ///

from __future__ import annotations

import argparse
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
        allowed = COMMON_FIELDS | (
            NATIVE_FIELDS if setup["family"] == "native" else set()
        )
        unknown = raw.keys() - allowed
        if unknown:
            raise SpecError(f"unknown fields for {slug}: {', '.join(sorted(unknown))}")
        if setup["family"] == "native":
            missing_native = NATIVE_FIELDS - raw.keys()
            if missing_native:
                raise SpecError(
                    f"native setup {slug} is missing: {', '.join(sorted(missing_native))}"
                )
        elif setup.get("variant") != "grok" and setup["family"] == "opencode":
            raise SpecError(
                f"Sidekick setup {slug} must select the Grok OpenCode harness"
            )
        setups.append(setup)

    defaults = [setup for setup in setups if setup["default"] is True]
    if len(defaults) != 1:
        raise SpecError("setups.yaml must define exactly one default setup")
    return setups


def render(setups: list[dict[str, Any]]) -> dict[Path, str]:
    environment = Environment(
        loader=FileSystemLoader([SOURCE_DIR, TEMPLATE_DIR]),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
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
    expected = set(outputs)
    return [path for path in REFERENCES_DIR.glob("*.md") if path not in expected]


def check(outputs: dict[Path, str]) -> int:
    stale = [
        path
        for path, expected in outputs.items()
        if not path.exists() or path.read_text(encoding="utf-8") != expected
    ]
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


def write_atomic(path: Path, content: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=path.parent, prefix=f".{path.name}.", text=True
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
        outputs = render(load_setups())
    except (OSError, SpecError, CatalogError, yaml.YAMLError) as error:
        print(f"Sidekick generation failed: {error}", file=sys.stderr)
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
        print(f"All {len(outputs)} generated Sidekick files were already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
