from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path


def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure a simple, production-style logger.

    Beginner note:
    - Logging helps you understand what your app is doing (without using print everywhere).
    """
    level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


@dataclass(frozen=True)
class ProjectPaths:
    """Central place for important project paths."""

    root_dir: Path

    @property
    def music_dir(self) -> Path:
        return self.root_dir / "music"

    @property
    def assets_dir(self) -> Path:
        return self.root_dir / "assets"


def get_project_paths() -> ProjectPaths:
    """
    Resolve paths based on the location of this file.
    This makes running the project from different working directories easier.
    """
    root_dir = Path(__file__).resolve().parents[1]
    return ProjectPaths(root_dir=root_dir)


def ensure_file_exists(path: os.PathLike | str, friendly_name: str) -> Path:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Missing {friendly_name}: {p}")
    return p

