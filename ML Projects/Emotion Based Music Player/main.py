from __future__ import annotations

import logging

from app.ui import EmotionMusicApp
from app.utils import get_project_paths, setup_logging


def main() -> None:
    setup_logging("INFO")
    logger = logging.getLogger(__name__)

    paths = get_project_paths()
    logger.info("Starting Emotion Based Music Player")
    logger.info("Project root: %s", paths.root_dir)
    logger.info("Music folder: %s", paths.music_dir)

    app = EmotionMusicApp(paths=paths)
    app.mainloop()


if __name__ == "__main__":
    main()

