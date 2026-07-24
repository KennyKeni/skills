from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from typing import Any

import yaml


CATALOG_PATH = Path(__file__).resolve().with_name("harnesses.yaml")
TEMPLATE_DIR = Path(__file__).resolve().with_name("templates")
ALLOWED_FAMILIES = {"codex-native", "claude-native", "cursor", "opencode", "codex-exec"}
NATIVE_FAMILIES = {"codex-native": "codex", "claude-native": "claude"}
LEAD_PROFILE_FIELDS = {
    "id",
    "lead_label",
    "output",
    "quiet_wait_seconds",
    "cache_window_seconds",
    "cache_rationale",
    "minimum_poll_seconds",
    "computer_use",
}
COMMON_FIELDS = {"id", "family", "models"}
FAMILY_FIELDS = {
    "codex-native": set(),
    "claude-native": set(),
    "cursor": {"model_label_patterns", "model_caution"},
    "opencode": {"title_prefix", "refresh_models", "model_caution"},
    "codex-exec": {"model_caution"},
}
RESERVED_FIELDS = set().union(COMMON_FIELDS, *FAMILY_FIELDS.values()) - {"id"}


class CatalogError(ValueError):
    pass


def _load_catalog(path: Path) -> dict[str, Any]:
    document = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise CatalogError("harnesses.yaml must contain a mapping")
    if document.get("schema_version") != 1:
        raise CatalogError("harnesses.yaml must declare schema_version: 1")
    return document


def load_lead_profiles(path: Path = CATALOG_PATH) -> dict[str, dict[str, Any]]:
    document = _load_catalog(path)
    entries = document.get("lead_profiles")
    if not isinstance(entries, list) or not entries:
        raise CatalogError("harnesses.yaml must contain a non-empty lead_profiles list")

    profiles: dict[str, dict[str, Any]] = {}
    output_paths: set[str] = set()
    for index, raw in enumerate(entries):
        if not isinstance(raw, dict) or set(raw) != LEAD_PROFILE_FIELDS:
            raise CatalogError(
                f"lead profile {index} must define exactly: "
                f"{', '.join(sorted(LEAD_PROFILE_FIELDS))}"
            )
        profile = deepcopy(raw)
        profile_id = profile["id"]
        if not isinstance(profile_id, str) or not profile_id.replace("-", "").isalnum():
            raise CatalogError(f"invalid lead profile id: {profile_id!r}")
        if profile_id in profiles:
            raise CatalogError(f"duplicate lead profile id: {profile_id}")
        if not isinstance(profile["lead_label"], str) or not profile["lead_label"]:
            raise CatalogError(f"{profile_id} lead_label must be a non-empty string")
        output = profile["output"]
        if (
            not isinstance(output, str)
            or not output
            or Path(output).is_absolute()
            or ".." in Path(output).parts
        ):
            raise CatalogError(f"{profile_id} output must be a safe relative path")
        if output in output_paths:
            raise CatalogError(f"duplicate lead profile output: {output}")
        output_paths.add(output)
        if not isinstance(profile["computer_use"], bool):
            raise CatalogError(f"{profile_id} computer_use must be boolean")

        quiet_wait = profile["quiet_wait_seconds"]
        cache_window = profile["cache_window_seconds"]
        minimum_poll = profile["minimum_poll_seconds"]
        cache_rationale = profile["cache_rationale"]
        if quiet_wait is None:
            if cache_window is not None or cache_rationale is not None:
                raise CatalogError(
                    f"{profile_id} without a quiet wait cannot define cache fields"
                )
            if not isinstance(minimum_poll, int) or minimum_poll < 60:
                raise CatalogError(
                    f"{profile_id} must define minimum_poll_seconds of at least 60"
                )
            profile["minimum_poll_duration"] = f"{minimum_poll} seconds"
        else:
            if not isinstance(quiet_wait, int) or quiet_wait < 60:
                raise CatalogError(
                    f"{profile_id} quiet_wait_seconds must be at least 60"
                )
            if not isinstance(cache_window, int) or cache_window <= quiet_wait:
                raise CatalogError(
                    f"{profile_id} cache_window_seconds must exceed quiet_wait_seconds"
                )
            if not isinstance(cache_rationale, str) or not cache_rationale:
                raise CatalogError(
                    f"{profile_id} cache_rationale must be a non-empty string"
                )
            if minimum_poll is not None:
                raise CatalogError(
                    f"{profile_id} with a quiet wait cannot define minimum_poll_seconds"
                )
            profile["quiet_wait_duration"] = _duration_adjective(quiet_wait)
            profile["cache_window_duration"] = _duration_phrase(cache_window)
        profiles[profile_id] = profile
    return profiles


def load_harnesses(path: Path = CATALOG_PATH) -> dict[str, dict[str, Any]]:
    document = _load_catalog(path)

    entries = document.get("harnesses")
    if not isinstance(entries, list) or not entries:
        raise CatalogError("harnesses.yaml must contain a non-empty harnesses list")

    harnesses: dict[str, dict[str, Any]] = {}
    for index, raw in enumerate(entries):
        if not isinstance(raw, dict):
            raise CatalogError(f"harness {index} must be a mapping")
        harness = deepcopy(raw)
        harness_id = harness.get("id")
        family = harness.get("family")
        if not isinstance(harness_id, str) or not harness_id.replace("-", "").isalnum():
            raise CatalogError(f"invalid harness id: {harness_id!r}")
        if harness_id in harnesses:
            raise CatalogError(f"duplicate harness id: {harness_id}")
        if family not in ALLOWED_FAMILIES:
            raise CatalogError(f"unsupported family for {harness_id}: {family!r}")

        unknown = harness.keys() - COMMON_FIELDS - FAMILY_FIELDS[family]
        if unknown:
            raise CatalogError(
                f"unknown fields for {harness_id}: {', '.join(sorted(unknown))}"
            )
        _prepare_models(harness)
        harnesses[harness_id] = harness
    return harnesses


def _duration_phrase(seconds: int) -> str:
    if seconds % 60 == 0:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    return f"{seconds} seconds"


def _duration_adjective(seconds: int) -> str:
    if seconds % 60 == 0:
        return f"{seconds // 60}-minute"
    return f"{seconds}-second"


def resolve_harness(
    record: dict[str, Any],
    harnesses: dict[str, dict[str, Any]],
    *,
    record_name: str,
) -> dict[str, Any]:
    harness_id = record.get("harness")
    if harness_id not in harnesses:
        raise CatalogError(f"{record_name} selects unknown harness: {harness_id!r}")
    conflicts = RESERVED_FIELDS & record.keys()
    if conflicts:
        raise CatalogError(
            f"{record_name} overrides shared harness fields: {', '.join(sorted(conflicts))}"
        )
    return {**deepcopy(harnesses[harness_id]), **deepcopy(record)}


def _prepare_models(harness: dict[str, Any]) -> None:
    harness_id = harness["id"]
    family = harness["family"]
    harness["native_to"] = NATIVE_FAMILIES.get(family)
    if family == "codex-native":
        if "models" in harness:
            raise CatalogError(f"{harness_id} must configure models per route, not here")
        return

    models = harness.get("models")
    if not isinstance(models, dict):
        raise CatalogError(f"{harness_id} models must be a mapping")
    harness.setdefault("model_caution", "")
    if not isinstance(harness["model_caution"], str):
        raise CatalogError(f"{harness_id} model_caution must be a string")
    model_keys = set(models)
    base_keys = model_keys - {"validator"}
    if base_keys == {"shared"}:
        harness["model_mode"] = "shared"
        harness["scout_model"] = models["shared"]
        harness["worker_model"] = models["shared"]
    elif base_keys == {"scout", "worker"}:
        harness["model_mode"] = "tiered"
        harness["scout_model"] = models["scout"]
        harness["worker_model"] = models["worker"]
    elif model_keys == {"capability"} and family == "opencode":
        capability = models["capability"]
        fields = {"default", "variable", "choices_markdown"}
        if not isinstance(capability, dict) or set(capability) != fields:
            raise CatalogError(
                f"{harness_id} capability models must define exactly: "
                f"{', '.join(sorted(fields))}"
            )
        harness["model_mode"] = "capability"
        harness["model_default"] = capability["default"]
        harness["model_variable"] = capability["variable"]
        harness["model_choices_markdown"] = capability["choices_markdown"]
        harness["scout_model_argument"] = f'"${capability["variable"]}"'
        harness["worker_model_argument"] = harness["scout_model_argument"]
    else:
        raise CatalogError(
            f"{harness_id} models must use shared, scout+worker, or OpenCode "
            "capability mode, each optionally with a validator override"
        )

    if harness["model_mode"] in {"shared", "tiered"}:
        harness["validator_model"] = models.get("validator", harness["worker_model"])
        model_ids = [
            harness["scout_model"],
            harness["worker_model"],
            harness["validator_model"],
        ]
        if not all(isinstance(model_id, str) and model_id for model_id in model_ids):
            raise CatalogError(f"{harness_id} model IDs must be non-empty strings")
        harness["models_to_verify"] = list(dict.fromkeys(model_ids))
        harness["scout_model_argument"] = harness["scout_model"]
        harness["worker_model_argument"] = harness["worker_model"]
        harness["validator_model_argument"] = harness["validator_model"]

    if family == "cursor":
        patterns = harness.get("model_label_patterns")
        if not isinstance(patterns, dict):
            raise CatalogError(f"{harness_id} must define model_label_patterns")
        missing = set(harness["models_to_verify"]) - patterns.keys()
        if missing:
            raise CatalogError(
                f"{harness_id} is missing Cursor label patterns for: "
                f"{', '.join(sorted(missing))}"
            )
        harness["model_verifications"] = [
            {"id": model_id, "label_pattern": patterns[model_id]}
            for model_id in harness["models_to_verify"]
        ]

    if family == "opencode":
        if not isinstance(harness.get("title_prefix"), str):
            raise CatalogError(f"{harness_id} must define title_prefix")
        if not isinstance(harness.get("refresh_models", True), bool):
            raise CatalogError(f"{harness_id} refresh_models must be a boolean")
        harness.setdefault("refresh_models", True)
