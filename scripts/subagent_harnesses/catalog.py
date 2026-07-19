from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from typing import Any

import yaml


CATALOG_PATH = Path(__file__).resolve().with_name("harnesses.yaml")
TEMPLATE_DIR = Path(__file__).resolve().with_name("templates")
ALLOWED_FAMILIES = {"codex-native", "claude-native", "cursor", "opencode", "codex-exec"}
NATIVE_FAMILIES = {"codex-native": "codex", "claude-native": "claude"}
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


def load_harnesses(path: Path = CATALOG_PATH) -> dict[str, dict[str, Any]]:
    document = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise CatalogError("harnesses.yaml must contain a mapping")
    if document.get("schema_version") != 1:
        raise CatalogError("harnesses.yaml must declare schema_version: 1")

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
    if model_keys == {"shared"}:
        harness["model_mode"] = "shared"
        harness["scout_model"] = models["shared"]
        harness["worker_model"] = models["shared"]
    elif model_keys == {"scout", "worker"}:
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
            f"{harness_id} models must use shared, scout+worker, "
            "or OpenCode capability mode"
        )

    if harness["model_mode"] in {"shared", "tiered"}:
        model_ids = [harness["scout_model"], harness["worker_model"]]
        if not all(isinstance(model_id, str) and model_id for model_id in model_ids):
            raise CatalogError(f"{harness_id} model IDs must be non-empty strings")
        harness["models_to_verify"] = list(dict.fromkeys(model_ids))
        harness["scout_model_argument"] = harness["scout_model"]
        harness["worker_model_argument"] = harness["worker_model"]

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
