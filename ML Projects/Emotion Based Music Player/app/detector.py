from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import os
import cv2
import numpy as np
try:
    from fer import FER
except Exception:  # pragma: no cover (environment-dependent import)
    FER = None  # type: ignore[assignment]

from app.local_model import LocalEmotionModel, LocalModelConfig

LOGGER = logging.getLogger(__name__)


@dataclass
class EmotionResult:
    emotion: Optional[str]  # "happy", "sad", or None
    score: float


class EmotionDetector:
    """
    Emotion detector that returns ONLY:
    - "happy"
    - "sad"
    - None (ignore all other emotions)

    Internally uses the FER library.
    """

    def __init__(
        self,
        min_score: float = 0.45,
        use_mtcnn: bool = False,
        training_dir: Optional[os.PathLike[str] | str] = None,
    ) -> None:
        """
        Args:
            min_score: Confidence threshold. If both happy/sad scores are below this,
                       we return None to avoid noisy switching.
            use_mtcnn: If True, FER may use MTCNN for face detection (can be slower/heavier).
            training_dir: Optional folder path (training_images/) used to train a simple local model.
        """
        self._local: Optional[LocalEmotionModel] = None

        # Optional: local image-folder-based model (matching approach)
        if training_dir is not None:
            try:
                from pathlib import Path

                local = LocalEmotionModel(LocalModelConfig(training_dir=Path(training_dir)))
                if local.train_from_folders():
                    self._local = local
                    LOGGER.info("Using local trained model from: %s", training_dir)
                else:
                    LOGGER.info("Local model not enabled (not enough valid training images).")
            except Exception:
                LOGGER.exception("Local model setup failed; falling back to FER.")

        if FER is None:
            # If FER is missing but local model trained, we can still run.
            if self._local is None:
                raise RuntimeError(
                    "FER is not installed or failed to import. "
                    "Please run: pip install -r requirements.txt"
                )
            self._fer = None
            return

        self._min_score = float(min_score)
        self._fer = FER(mtcnn=use_mtcnn)

    def predict(self, frame_bgr: np.ndarray) -> EmotionResult:
        """
        Predict emotion from a webcam frame (BGR image from OpenCV).
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return EmotionResult(emotion=None, score=0.0)

        # 1) Prefer local model if available (your training images)
        if self._local is not None:
            emotion, score = self._local.predict(frame_bgr)
            if emotion in ("happy", "sad"):
                return EmotionResult(emotion=emotion, score=float(score))

        # 2) Otherwise use FER
        if getattr(self, "_fer", None) is None:
            return EmotionResult(emotion=None, score=0.0)

        # FER expects RGB images
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        try:
            detections = self._fer.detect_emotions(frame_rgb)
        except Exception:
            LOGGER.exception("FER failed while detecting emotions.")
            return EmotionResult(emotion=None, score=0.0)

        if not detections:
            return EmotionResult(emotion=None, score=0.0)

        # Choose the most confident face detection
        best = max(detections, key=lambda d: float(d.get("score", 0.0)))
        emotions = best.get("emotions", {}) or {}

        happy_score = float(emotions.get("happy", 0.0))
        sad_score = float(emotions.get("sad", 0.0))

        if happy_score < self._min_score and sad_score < self._min_score:
            return EmotionResult(emotion=None, score=max(happy_score, sad_score))

        if happy_score >= sad_score:
            return EmotionResult(emotion="happy", score=happy_score)
        return EmotionResult(emotion="sad", score=sad_score)

