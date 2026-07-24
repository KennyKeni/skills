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
    load_lead_profiles,
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
TEMPLATE_NAME = "lane.md.j2"
SKILL_TEMPLATE_NAME = "skill.md.j2"
GLOBAL_INSTRUCTIONS_TEMPLATE_NAME = "instructions/global.md.j2"
LEAD_FIELDS = {"name", "skill_slug", "title", "native", "validation_context"}
COMMON_FIELDS = {
    "slug",
    "harness",
    "title",
    "description_name",
    "selection_label",
    "policy",
    "default",
    "external",
    "routes",
}
ROUTE_KEYS = {
    "routine_scout",
    "consequential_scout",
    "routine_worker",
    "consequential_worker",
    "validator",
}
ROUTE_COMMON_FIELDS = {"executor", "fresh"}
LANE_ROUTE_FIELDS = ROUTE_COMMON_FIELDS | {"model_ref", "lane", "effort"}
NATIVE_ROUTE_FIELDS = ROUTE_COMMON_FIELDS | {"model", "effort"}
VALID_EFFORTS = {"none", "low", "medium", "high", "xhigh", "max", "ultra"}
# Effort is optional on any lane route, but these families must always set it.
EFFORT_REQUIRED_FAMILIES = {"codex-exec"}


class SpecError(ValueError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate subagent routing skills, lane references, and global "
            "instruction variants."
        )
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report stale generated references without writing them.",
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
    if not isinstance(document, dict):
        raise SpecError(f"{path.name} must contain a mapping")
    if document.get("schema_version") != 1:
        raise SpecError(f"{path.name} must declare schema_version: 1")

    lead = document.get("lead")
    if not isinstance(lead, dict) or set(lead) != LEAD_FIELDS:
        raise SpecError(
            f"{path.name} lead must define exactly: {', '.join(sorted(LEAD_FIELDS))}"
        )
    for field in ("name", "skill_slug", "title", "validation_context"):
        if not isinstance(lead[field], str) or not lead[field]:
            raise SpecError(f"{path.name} lead {field} must be a non-empty string")
    if not isinstance(lead["native"], bool):
        raise SpecError(f"{path.name} lead native must be a boolean")

    raw_lanes = document.get("lanes")
    if not isinstance(raw_lanes, list) or not raw_lanes:
        raise SpecError(f"{path.name} must contain a non-empty lanes list")

    required = COMMON_FIELDS - {"routes"}
    lanes: list[dict[str, Any]] = []
    lanes_by_slug: dict[str, dict[str, Any]] = {}
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
        if slug in lanes_by_slug:
            raise SpecError(f"duplicate lane slug: {slug}")
        lane = resolve_harness(raw, harnesses, record_name=f"lane {slug}")
        native_to = lane.get("native_to")
        if native_to is not None and native_to != lead["name"].lower():
            raise SpecError(
                f"lane {slug} selects harness {lane['harness']}, which is "
                f"native to {native_to} and unavailable to a {lead['name']} lead"
            )
        lane["lead_name"] = lead["name"]
        lanes.append(lane)
        lanes_by_slug[slug] = lane

    for lane in lanes:
        prepare_routes(lane, lanes_by_slug, lead)

    defaults = [lane for lane in lanes if lane["default"] is True]
    if len(defaults) != 1:
        raise SpecError(f"{path.name} must define exactly one default lane")
    if any(not isinstance(lane["external"], bool) for lane in lanes):
        raise SpecError("every lane external field must be true or false")
    return {"lead": lead, "lanes": lanes}


def prepare_routes(
    lane: dict[str, Any],
    lanes_by_slug: dict[str, dict[str, Any]],
    lead: dict[str, Any],
) -> None:
    policy = lane["policy"]
    routes = lane.get("routes")
    if policy == "direct":
        if routes is not None:
            raise SpecError(f"direct lane {lane['slug']} must not define routes")
        return
    if policy != "classified":
        raise SpecError(f"lane {lane['slug']} has unsupported policy: {policy!r}")
    if not isinstance(routes, dict) or set(routes) != ROUTE_KEYS:
        raise SpecError(
            f"classified lane {lane['slug']} routes must define exactly: "
            f"{', '.join(sorted(ROUTE_KEYS))}"
        )

    prepared: dict[str, dict[str, Any]] = {}
    for route_name, raw_route in routes.items():
        route_id = f"route {lane['slug']}.{route_name}"
        if not isinstance(raw_route, dict):
            raise SpecError(f"{route_id} must be a mapping")
        executor = raw_route.get("executor")
        if executor not in {"lane", "native"}:
            raise SpecError(f"{route_id} executor must be lane or native")
        allowed = LANE_ROUTE_FIELDS if executor == "lane" else NATIVE_ROUTE_FIELDS
        unknown = raw_route.keys() - allowed
        if unknown:
            raise SpecError(
                f"{route_id} has unknown fields: {', '.join(sorted(unknown))}"
            )
        fresh = raw_route.get("fresh", False)
        if not isinstance(fresh, bool):
            raise SpecError(f"{route_id} fresh must be boolean")

        route = dict(raw_route)
        route["fresh"] = fresh
        if executor == "lane":
            prepare_lane_route(route, route_id, lane, lanes_by_slug)
        else:
            prepare_native_route(route, route_id, lead)
        prepared[route_name] = route
    lane["routes"] = prepared


def prepare_lane_route(
    route: dict[str, Any],
    route_id: str,
    lane: dict[str, Any],
    lanes_by_slug: dict[str, dict[str, Any]],
) -> None:
    target_slug = route.get("lane", lane["slug"])
    target = lanes_by_slug.get(target_slug)
    if target is None:
        raise SpecError(f"{route_id} references unknown lane: {target_slug!r}")

    model_ref = route.get("model_ref")
    if model_ref not in {"scout", "worker", "validator", "selected"}:
        raise SpecError(
            f"{route_id} model_ref must be scout, worker, validator, or selected"
        )
    if model_ref == "selected":
        if target.get("model_mode") != "capability":
            raise SpecError(
                f"{route_id} uses selected without a capability model harness"
            )
        route["resolved_model"] = None
        model_phrase = "the selected exact capability model"
    else:
        resolved = target.get(f"{model_ref}_model")
        if resolved is None:
            raise SpecError(
                f"{route_id} target lane {target_slug} has no {model_ref} model"
            )
        route["resolved_model"] = resolved
        model_phrase = f"`{resolved}`"

    effort = route.get("effort")
    if effort is None:
        if target["family"] in EFFORT_REQUIRED_FAMILIES:
            raise SpecError(f"{route_id} requires a valid effort")
        effort_phrase = ""
    elif effort not in VALID_EFFORTS:
        raise SpecError(f"{route_id} has invalid effort: {effort!r}")
    else:
        effort_phrase = f" at {effort} effort"

    if target is lane:
        place = "this lane"
    else:
        place = (
            f"the {target['description_name']} lane "
            f"([{target_slug}.md]({target_slug}.md))"
        )
    fresh_prefix = "a fresh session of " if route["fresh"] else ""
    route["description"] = f"{fresh_prefix}{place} with {model_phrase}{effort_phrase}"


def prepare_native_route(
    route: dict[str, Any], route_id: str, lead: dict[str, Any]
) -> None:
    if not lead["native"]:
        raise SpecError(
            f"{route_id} uses the native executor, but lead {lead['name']} "
            "declares no native subagent control"
        )
    model = route.get("model")
    effort = route.get("effort")
    if not isinstance(model, str) or not model:
        raise SpecError(f"{route_id} model must be non-empty")
    if effort not in VALID_EFFORTS:
        raise SpecError(f"{route_id} has invalid effort: {effort!r}")
    route["resolved_model"] = model
    route["description"] = (
        f"{'fresh ' if route['fresh'] else ''}native {lead['name']} with `{model}` "
        f"at {effort} effort"
    )


def human_join(values: list[str]) -> str:
    if len(values) == 1:
        return values[0]
    if len(values) == 2:
        return f"{values[0]} and {values[1]}"
    return f"{', '.join(values[:-1])}, or {values[-1]}"


def render(
    leads: list[dict[str, Any]], lead_profiles: dict[str, dict[str, Any]]
) -> dict[Path, str]:
    environment = create_environment(SOURCE_DIR, TEMPLATE_DIR)
    template = environment.get_template(TEMPLATE_NAME)
    skill_template = environment.get_template(SKILL_TEMPLATE_NAME)
    global_instructions_template = environment.get_template(
        GLOBAL_INSTRUCTIONS_TEMPLATE_NAME
    )
    outputs: dict[Path, str] = {}
    for spec in leads:
        lead = spec["lead"]
        lanes = spec["lanes"]
        skill_dir = SKILLS_DIR / lead["skill_slug"]
        for lane in lanes:
            rendered = template.render(lane=lane, lead=lead)
            outputs[skill_dir / "references" / f"{lane['slug']}.md"] = (
                rendered.rstrip() + "\n"
            )
        default_lane = next(lane for lane in lanes if lane["default"])
        skill_rendered = skill_template.render(
            lead=lead,
            lanes=lanes,
            default_lane=default_lane,
            classified_lanes=[lane for lane in lanes if lane["policy"] == "classified"],
            lane_description=human_join([lane["description_name"] for lane in lanes]),
        )
        outputs[skill_dir / "SKILL.md"] = skill_rendered.rstrip() + "\n"
    for profile in lead_profiles.values():
        output_path = REPOSITORY_DIR / profile["output"]
        outputs[output_path] = (
            global_instructions_template.render(profile=profile).rstrip() + "\n"
        )
    return outputs


def unexpected_outputs(
    leads: list[dict[str, Any]], outputs: dict[Path, str]
) -> list[Path]:
    unexpected: list[Path] = []
    for spec in leads:
        references_dir = SKILLS_DIR / spec["lead"]["skill_slug"] / "references"
        unexpected.extend(unexpected_markdown_outputs(references_dir, outputs))
    global_outputs_dir = REPOSITORY_DIR / "global" / "generated"
    unexpected.extend(
        path for path in global_outputs_dir.rglob("*.md") if path not in outputs
    )
    return unexpected


def check(leads: list[dict[str, Any]], outputs: dict[Path, str]) -> int:
    stale = stale_outputs(outputs)
    unexpected = unexpected_outputs(leads, outputs)

    if not stale and not unexpected:
        print(f"All {len(outputs)} generated routing files are current.")
        return 0

    for path in stale:
        print(f"stale: {path.relative_to(REPOSITORY_DIR)}", file=sys.stderr)
    for path in unexpected:
        print(
            f"unexpected generated output: {path.relative_to(REPOSITORY_DIR)}",
            file=sys.stderr,
        )
    print("Run `task skills:routing:generate`.", file=sys.stderr)
    return 1


def main() -> int:
    args = parse_args()
    try:
        leads = load_leads()
        lead_profiles = load_lead_profiles()
        outputs = render(leads, lead_profiles)
    except (OSError, SpecError, CatalogError, yaml.YAMLError) as error:
        print(f"routing skill generation failed: {error}", file=sys.stderr)
        return 2

    if args.check:
        return check(leads, outputs)

    removed = unexpected_outputs(leads, outputs)
    trash_outputs(removed, relative_to=REPOSITORY_DIR)
    changed = write_outputs(outputs)
    for path in changed:
        print(f"generated: {path.relative_to(REPOSITORY_DIR)}")
    if not changed and not removed:
        print(f"All {len(outputs)} generated routing files were already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
