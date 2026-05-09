from __future__ import annotations

import logging
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import pygame

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class TrackConfig:
    happy_dir: Path
    sad_dir: Path
    volume: float = 0.85
    fade_ms: int = 600
    allowed_extensions: tuple[str, ...] = (".mp3", ".wav", ".ogg")


def _list_audio_files(folder: Path, allowed_extensions: tuple[str, ...]) -> list[Path]:
    if not folder.exists():
        return []
    files: list[Path] = []
    for p in folder.iterdir():
        if p.is_file() and p.suffix.lower() in allowed_extensions:
            files.append(p)
    return sorted(files)


def _pick_next_track(candidates: Iterable[Path], avoid: Optional[Path]) -> Optional[Path]:
    items = list(candidates)
    if not items:
        return None
    if avoid is None or len(items) == 1:
        return random.choice(items)
    filtered = [p for p in items if p != avoid]
    return random.choice(filtered) if filtered else random.choice(items)


class MusicPlayer:
    """
    A small wrapper around pygame.mixer to:
    - play only one track at a time
    - avoid restarting the same track repeatedly
    - smoothly switch between happy and sad tracks
    """

    def __init__(self, config: TrackConfig) -> None:
        self._config = config
        self._initialized = False
        self._current_emotion: Optional[str] = None  # "happy" | "sad" | None
        self._current_track_name: str = "None"
        self._current_track_path: Optional[Path] = None

    @property
    def current_track_name(self) -> str:
        return self._current_track_name

    def initialize(self) -> None:
        if self._initialized:
            return
        try:
            pygame.mixer.init()
            pygame.mixer.music.set_volume(self._config.volume)
            self._initialized = True
            LOGGER.info("Music system initialized.")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize audio system: {e}") from e

    def stop(self) -> None:
        if not self._initialized:
            self._current_emotion = None
            self._current_track_name = "None"
            return
        try:
            pygame.mixer.music.stop()
        except Exception:
            LOGGER.exception("Failed to stop music.")
        finally:
            self._current_emotion = None
            self._current_track_name = "None"
            self._current_track_path = None

    def shutdown(self) -> None:
        if not self._initialized:
            return
        try:
            self.stop()
            pygame.mixer.quit()
            LOGGER.info("Music system shutdown complete.")
        except Exception:
            LOGGER.exception("Failed to shutdown music system.")
        finally:
            self._initialized = False

    def play_for_emotion(self, emotion: Optional[str]) -> None:
        """
        emotion must be: "happy", "sad", or None
        - None means "do not change music"
        """
        if emotion not in ("happy", "sad", None):
            return

        # Ignore "no emotion" updates (keeps last track playing)
        if emotion is None:
            return

        # Prevent restarting the same song repeatedly
        if self._current_emotion == emotion and pygame.mixer.music.get_busy():
            return

        self.initialize()

        folder = self._config.happy_dir if emotion == "happy" else self._config.sad_dir
        candidates = _list_audio_files(folder, self._config.allowed_extensions)
        track_path = _pick_next_track(candidates, avoid=self._current_track_path)
        if track_path is None:
            raise FileNotFoundError(
                f"No audio files found in: {folder}. "
                "Add songs (mp3/wav/ogg) into the folder."
            )

        # Smooth switch: fade out current, then fade in new
        try:
            if pygame.mixer.music.get_busy():
                pygame.mixer.music.fadeout(self._config.fade_ms)

            pygame.mixer.music.load(str(track_path))
            pygame.mixer.music.play(loops=-1, fade_ms=self._config.fade_ms)

            self._current_emotion = emotion
            self._current_track_name = track_path.name
            self._current_track_path = track_path
            LOGGER.info("Now playing '%s' for emotion=%s", track_path.name, emotion)
        except Exception:
            LOGGER.exception("Failed to play music for emotion=%s", emotion)
            raise

