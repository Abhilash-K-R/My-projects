from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class LocalModelConfig:
    """
    Configuration for the optional local (image-folder-based) classifier.

    This keeps the project beginner-friendly and offline:
    - You provide labeled images in training_images/happy and training_images/sad
    - We train an LBPH classifier (OpenCV) on face crops
    """

    training_dir: Path
    face_size: tuple[int, int] = (200, 200)
    max_confidence: float = 85.0  # LBPH: lower is better; above this is considered "unknown"


class LocalEmotionModel:
    """
    A very simple local model:
    - detects a face using Haar cascade
    - predicts class using LBPHFaceRecognizer (happy vs sad)

    Important:
    - This is NOT a deep learning model. It's a simple "matching" approach.
    - It works best when your training images look similar to your webcam environment.
    """

    def __init__(self, config: LocalModelConfig) -> None:
        self._config = config

        # cv2.face is available in opencv-contrib-python
        if not hasattr(cv2, "face"):
            raise RuntimeError(
                "OpenCV 'face' module not found. Install opencv-contrib-python."
            )

        self._recognizer = cv2.face.LBPHFaceRecognizer_create()
        cascade_path = str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
        self._face_detector = cv2.CascadeClassifier(cascade_path)
        if self._face_detector.empty():
            raise RuntimeError("Failed to load Haar cascade for face detection.")

        self._trained = False

    @property
    def trained(self) -> bool:
        return self._trained

    def train_from_folders(self) -> bool:
        happy_dir = self._config.training_dir / "happy"
        sad_dir = self._config.training_dir / "sad"

        X: list[np.ndarray] = []
        y: list[int] = []

        def add_images(folder: Path, label: int) -> None:
            if not folder.exists():
                return
            for p in folder.rglob("*"):
                if not p.is_file() or p.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                    continue
                img = cv2.imread(str(p))
                if img is None:
                    continue
                face = self._extract_face(img)
                if face is None:
                    continue
                X.append(face)
                y.append(label)

        add_images(happy_dir, 0)
        add_images(sad_dir, 1)

        if len(X) < 4:
            LOGGER.info(
                "Not enough training images for local model (need at least ~4 face crops)."
            )
            self._trained = False
            return False

        self._recognizer.train(X, np.array(y, dtype=np.int32))
        self._trained = True
        LOGGER.info("Local emotion model trained with %s samples.", len(X))
        return True

    def predict(self, frame_bgr: np.ndarray) -> tuple[Optional[str], float]:
        """
        Returns: (emotion, score)
        - emotion: "happy" | "sad" | None
        - score: a 0..1-ish value (higher is better)
        """
        if not self._trained:
            return None, 0.0
        face = self._extract_face(frame_bgr)
        if face is None:
            return None, 0.0

        label, confidence = self._recognizer.predict(face)
        # LBPH confidence: lower is better. Convert to a simple score.
        if float(confidence) > float(self._config.max_confidence):
            return None, 0.0

        emotion = "happy" if int(label) == 0 else "sad"
        score = 1.0 / (1.0 + float(confidence))
        return emotion, score

    def _extract_face(self, image_bgr: np.ndarray) -> Optional[np.ndarray]:
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        faces = self._face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            return None

        # Pick the largest face (most likely the main subject)
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        crop = gray[y : y + h, x : x + w]
        crop = cv2.resize(crop, self._config.face_size)
        return crop

