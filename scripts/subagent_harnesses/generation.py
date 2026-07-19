from __future__ import annotations

import os
import stat
import subprocess
import tempfile
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined


def create_environment(source_dir: Path, template_dir: Path) -> Environment:
    return Environment(
        loader=FileSystemLoader([source_dir, template_dir]),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def stale_outputs(outputs: dict[Path, str]) -> list[Path]:
    return [
        path
        for path, expected in outputs.items()
        if not path.exists() or path.read_text(encoding="utf-8") != expected
    ]


def unexpected_markdown_outputs(
    references_dir: Path, outputs: dict[Path, str]
) -> list[Path]:
    expected = set(outputs)
    return [path for path in references_dir.glob("*.md") if path not in expected]


def write_outputs(outputs: dict[Path, str]) -> list[Path]:
    return [path for path, content in outputs.items() if _write_atomic(path, content)]


def trash_outputs(paths: list[Path], *, relative_to: Path) -> None:
    for path in paths:
        subprocess.run(["/usr/bin/trash", str(path)], check=True)
        print(f"removed: {path.relative_to(relative_to)}")


def _write_atomic(path: Path, content: str) -> bool:
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
