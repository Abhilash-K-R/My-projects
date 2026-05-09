from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np
import tkinter as tk
from PIL import Image, ImageTk
from tkinter import ttk

from app.detector import EmotionDetector
from app.music_player import MusicPlayer, TrackConfig
from app.utils import ProjectPaths

LOGGER = logging.getLogger(__name__)


@dataclass
class UIConfig:
    camera_index: int = 0
    update_interval_ms: int = 30


class EmotionMusicApp(tk.Tk):
    """
    Tkinter desktop UI for:
    - webcam preview
    - emotion detection
    - music playback

    Designed to be beginner-friendly, with a clean structure.
    """

    def __init__(self, paths: ProjectPaths, ui_config: UIConfig | None = None) -> None:
        super().__init__()
        self.title("Emotion Based Music Player (Happy / Sad)")
        self.minsize(900, 520)

        self._paths = paths
        self._ui_config = ui_config or UIConfig()

        self._cap: Optional[cv2.VideoCapture] = None
        self._running = False

        self._detector: Optional[EmotionDetector]
        try:
            self._detector = EmotionDetector(
                min_score=0.45,
                use_mtcnn=False,
                training_dir=self._paths.root_dir / "training_images",
            )
        except Exception as e:
            # Keep the UI usable even if ML deps are missing; show a clear message.
            self._detector = None
            LOGGER.exception("Emotion detector failed to initialize.")
            self._last_error = (
                "Emotion detector could not start. Install dependencies with "
                "`pip install -r requirements.txt`. Details: "
                f"{e}"
            )
        self._music = MusicPlayer(
            TrackConfig(
                happy_dir=self._paths.music_dir / "happy",
                sad_dir=self._paths.music_dir / "sad",
                volume=0.85,
                fade_ms=650,
            )
        )

        self._last_emotion: Optional[str] = None
        self._last_error: str = getattr(self, "_last_error", "")
        self._photo_ref: Optional[ImageTk.PhotoImage] = None

        self._build_theme()
        self._build_layout()
        self._bind_events()

    def _build_theme(self) -> None:
        # Simple "modern-ish" ttk look (still native to Windows)
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure("Title.TLabel", font=("Segoe UI", 16, "bold"))
        style.configure("Status.TLabel", font=("Segoe UI", 11))
        style.configure("Value.TLabel", font=("Segoe UI", 12, "bold"))

    def _build_layout(self) -> None:
        root = ttk.Frame(self, padding=16)
        root.grid(row=0, column=0, sticky="nsew")
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)

        root.columnconfigure(0, weight=3)
        root.columnconfigure(1, weight=2)
        root.rowconfigure(0, weight=1)

        # Left: webcam preview
        left = ttk.Frame(root)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 12))
        left.rowconfigure(1, weight=1)
        left.columnconfigure(0, weight=1)

        title = ttk.Label(left, text="Emotion Based Music Player", style="Title.TLabel")
        title.grid(row=0, column=0, sticky="w", pady=(0, 10))

        self.video_label = ttk.Label(left, text="Webcam preview will appear here.", anchor="center")
        self.video_label.grid(row=1, column=0, sticky="nsew")

        # Right: status + controls
        right = ttk.Frame(root)
        right.grid(row=0, column=1, sticky="nsew")
        right.columnconfigure(0, weight=1)

        status_box = ttk.LabelFrame(right, text="Status", padding=12)
        status_box.grid(row=0, column=0, sticky="ew")
        status_box.columnconfigure(1, weight=1)

        ttk.Label(status_box, text="Detected emotion:", style="Status.TLabel").grid(row=0, column=0, sticky="w")
        self.emotion_value = ttk.Label(status_box, text="—", style="Value.TLabel")
        self.emotion_value.grid(row=0, column=1, sticky="w")

        ttk.Label(status_box, text="Playing:", style="Status.TLabel").grid(row=1, column=0, sticky="w", pady=(6, 0))
        self.track_value = ttk.Label(status_box, text="None", style="Value.TLabel")
        self.track_value.grid(row=1, column=1, sticky="w", pady=(6, 0))

        self.status_message = ttk.Label(right, text="Ready. Click Start.", wraplength=320, foreground="#444")
        self.status_message.grid(row=1, column=0, sticky="ew", pady=(10, 0))

        controls = ttk.LabelFrame(right, text="Controls", padding=12)
        controls.grid(row=2, column=0, sticky="ew", pady=(14, 0))
        controls.columnconfigure(0, weight=1)

        self.start_btn = ttk.Button(controls, text="Start", command=self.start)
        self.stop_btn = ttk.Button(controls, text="Stop", command=self.stop, state="disabled")
        self.exit_btn = ttk.Button(controls, text="Exit", command=self.exit_app)

        self.start_btn.grid(row=0, column=0, sticky="ew", pady=(0, 8))
        self.stop_btn.grid(row=1, column=0, sticky="ew", pady=(0, 8))
        self.exit_btn.grid(row=2, column=0, sticky="ew")

        hint = ttk.Label(
            right,
            text="Tip: Put songs into:\n- music/happy/\n- music/sad/",
            foreground="#666",
        )
        hint.grid(row=3, column=0, sticky="ew", pady=(14, 0))

    def _bind_events(self) -> None:
        self.protocol("WM_DELETE_WINDOW", self.exit_app)

    def start(self) -> None:
        if self._running:
            return

        self._cap = cv2.VideoCapture(self._ui_config.camera_index)
        if not self._cap.isOpened():
            self._cap.release()
            self._cap = None
            self._set_error("Could not open webcam. Close other camera apps and try again.")
            return

        self._running = True
        self._last_emotion = None
        if self._detector is None:
            self._set_error(self._last_error or "Detector not available.")
        else:
            self._last_error = ""

        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self._set_status("Webcam started. Detecting emotion...")

        self._tick()

    def stop(self) -> None:
        if not self._running:
            return

        self._running = False
        self._release_camera()

        try:
            self._music.stop()
        except Exception as e:
            LOGGER.exception("Music stop failed.")
            self._set_error(f"Music stop failed: {e}")

        self.emotion_value.configure(text="—")
        self.track_value.configure(text="None")
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self._set_status("Stopped.")

    def exit_app(self) -> None:
        try:
            self.stop()
            self._music.shutdown()
        finally:
            self.destroy()

    def _release_camera(self) -> None:
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception:
                LOGGER.exception("Failed to release webcam.")
            finally:
                self._cap = None

    def _tick(self) -> None:
        """
        Main UI loop step:
        - read a webcam frame
        - show preview
        - run emotion prediction
        - update labels
        - update music (only when emotion changes)
        """
        if not self._running or self._cap is None:
            return

        ok, frame = self._cap.read()
        if not ok or frame is None:
            self._set_error("Failed to read from webcam.")
            self.after(self._ui_config.update_interval_ms, self._tick)
            return

        self._update_preview(frame)

        emotion: Optional[str] = None
        if self._detector is not None:
            # Predict emotion (happy/sad only)
            result = self._detector.predict(frame)
            emotion = result.emotion

        if emotion is None:
            self.emotion_value.configure(text="—")
        else:
            # Display with nice capitalization
            self.emotion_value.configure(text=emotion.capitalize())

        # Music changes only if emotion is happy/sad and different than last
        if emotion in ("happy", "sad") and emotion != self._last_emotion:
            try:
                self._music.play_for_emotion(emotion)
                self.track_value.configure(text=self._music.current_track_name)
                self._set_status(f"Detected {emotion}. Playing: {self._music.current_track_name}")
                self._last_emotion = emotion
            except FileNotFoundError as e:
                # Friendly message for missing mp3 files
                self.track_value.configure(text="None")
                self._set_error(str(e))
            except Exception as e:
                self._set_error(f"Music error: {e}")

        self.after(self._ui_config.update_interval_ms, self._tick)

    def _update_preview(self, frame_bgr: np.ndarray) -> None:
        # Convert BGR (OpenCV) -> RGB (PIL/Tkinter)
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(frame_rgb)

        # Resize preview to fit nicely without complex scaling logic
        image = image.resize((620, 380))

        photo = ImageTk.PhotoImage(image=image)
        self._photo_ref = photo  # keep reference to prevent garbage collection
        self.video_label.configure(image=photo, text="")

    def _set_status(self, msg: str) -> None:
        if msg != self._last_error:
            self.status_message.configure(text=msg, foreground="#444")

    def _set_error(self, msg: str) -> None:
        self._last_error = msg
        self.status_message.configure(text=msg, foreground="#B00020")
        LOGGER.warning(msg)

