# Emotion Based Music Player (Happy vs Sad)

A beginner-friendly, professionally structured Machine Learning mini-project that:

- Uses your **webcam** to detect **ONLY 2 emotions**: **Happy** and **Sad**
- Automatically plays emotion-based music using **pygame mixer**
- Provides a clean desktop UI using **Tkinter** (webcam preview + status labels)

> This project is designed for college submissions, resumes, and GitHub portfolios.

---

## Features

- **Emotion detection**: OpenCV webcam feed + FER (Facial Expression Recognition)
- **Optional local training images**: If you add images to `training_images/`, the app can train a simple offline model (LBPH) to match your webcam face to your examples.
- **Two-emotion logic only**:
  - **Happy** → play happy track
  - **Sad** → play sad track
  - Any other emotion → ignored (no change)
- **Music system (pygame mixer)**:
  - Only **one song plays at a time**
  - Prevents restarting the **same song repeatedly**
  - Smooth switching with fade-out / fade-in
- **Desktop UI (Tkinter)**:
  - Webcam preview
  - Detected emotion label
  - Currently playing track label
  - Start / Stop / Exit buttons
  - Status + error handling messages

---

## Folder Structure

```
emotion_music_player/
│
├── app/
│   ├── detector.py
│   ├── local_model.py
│   ├── music_player.py
│   ├── ui.py
│   └── utils.py
│
├── music/
│   ├── happy/      (put 10+ happy songs here)
│   └── sad/        (put 10+ sad songs here)
│
├── training_images/
│   ├── happy/      (optional: happy face images)
│   └── sad/        (optional: sad face images)
│
├── assets/
│   └── (optional screenshots, icons, etc.)
│
├── README.md
├── requirements.txt
├── main.py
└── .gitignore
```

---

## Tech Stack

- **Python 3**
- **OpenCV**: webcam capture + frame processing
- **FER**: emotion recognition from face images
- **pygame**: music playback (mixer)
- **Tkinter**: desktop UI
- **Pillow**: convert OpenCV frames to Tkinter images

---

## Setup (Step-by-step)

### 1) Create a virtual environment (recommended)

Windows PowerShell:

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

> Note: `fer` may install additional ML dependencies (like TensorFlow) depending on your environment.

### 3) Add your music files

Put your music files here:

- `emotion_music_player/music/happy/` (add 10+ songs)
- `emotion_music_player/music/sad/` (add 10+ songs)

Supported formats: `.mp3`, `.wav`, `.ogg`

### 3b) (Optional) Add training images

If you want the app to “match” your webcam face using your own labeled images, add:

- `emotion_music_player/training_images/happy/`
- `emotion_music_player/training_images/sad/`

Use clear front-facing face images (`.jpg`, `.png`). The app will train automatically on startup.

### 4) Run the app

From inside the `emotion_music_player/` folder:

```bash
python main.py
```

---

## Usage

- Click **Start**
  - The webcam opens
  - The app starts detecting emotion (Happy/Sad only)
  - Music switches automatically based on detected emotion
- Click **Stop**
  - Webcam stops
  - Music stops
- Click **Exit**
  - Clean shutdown

---

## Screenshots (placeholder)

Add screenshots to `assets/` and reference them here.

- UI Screenshot: `assets/ui.png`
- Demo Screenshot: `assets/demo.png`

---

## Project Architecture (How it works)

- **`app/detector.py`**
  - Reads frames (numpy arrays)
  - Uses FER to detect emotions
  - Returns **only**: `"happy"`, `"sad"`, or `None`

- **`app/music_player.py`**
  - Owns pygame mixer lifecycle
  - Plays one track at a time
  - Avoids restarting if the same emotion repeats
  - Smooth switching using fade timings

- **`app/ui.py`**
  - Tkinter app window
  - Webcam preview loop (`after(...)`)
  - Calls `EmotionDetector` + `MusicPlayer`
  - Updates status labels safely

- **`main.py`**
  - Small entry point: sets up logging and launches the UI

---

## Common Issues

- **Webcam not opening**
  - Close other apps using the camera (Zoom/Teams/etc.)
  - Try a different camera index in `app/ui.py` (search for `camera_index`)

- **Music not playing**
  - Ensure you put songs inside `music/happy/` and `music/sad/`
  - Try `.wav` files if your system has trouble with mp3

- **FER / TensorFlow installation is slow**
  - This is normal on first install; it may download large wheels.

- **pip install fails with a gzip/decompression error**
  - Try upgrading pip:

```bash
python -m pip install --upgrade pip
```

  - Then retry with no cache:

```bash
pip install --no-cache-dir -r requirements.txt
```

---

## Future Improvements

- Add a confidence meter and a “neutral” state
- Add a “calibration mode” to reduce false switching
- Add more emotions (angry, surprise, neutral)
- Let users choose playlists from the UI
- Package as an `.exe` using PyInstaller

---

## License

Educational use. You can add an MIT license if you plan to open-source.

