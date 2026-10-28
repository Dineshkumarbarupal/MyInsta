"""MyInsta desktop entry point."""
from __future__ import annotations
import os
import sys
from pathlib import Path

USER_DIR = Path(__file__).resolve().parent
if str(USER_DIR) not in sys.path:
    sys.path.insert(0, str(USER_DIR))

from db.database import Database  # noqa: E402
from py.frontend_builder import build_frontend  # noqa: E402
from py.bridge import register_api  # noqa: E402

def main() -> None:
    try:
        import eel
    except ImportError as exc:
        raise SystemExit("Eel is missing. Install dependencies with: pip install -r requirements.txt") from exc
    database = Database(USER_DIR)
    database.initialize()
    web_root = build_frontend(USER_DIR)
    eel.init(str(web_root))
    register_api(eel, database)
    mode = os.environ.get("MYINSTA_BROWSER", "chrome")
    if mode == "default":
        mode = None
    eel.start("index.html", mode=mode, size=(1480, 940), position=(80, 48),
              port=0, block=True)

if __name__ == "__main__":
    main()
