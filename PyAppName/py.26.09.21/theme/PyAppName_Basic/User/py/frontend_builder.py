"""Build Eel's static web root from modular source folders."""
from __future__ import annotations
import shutil
from pathlib import Path

STATIC_FOLDERS = ("component", "template", "css", "js", "asset")

def build_frontend(user_dir: Path) -> Path:
    user_dir = Path(user_dir)
    web_root = user_dir / "Runtime" / "generated_web"
    if web_root.exists():
        shutil.rmtree(web_root)
    web_root.mkdir(parents=True, exist_ok=True)
    entry = user_dir / "web" / "index.html"
    if not entry.is_file():
        raise FileNotFoundError(f"Frontend entry point not found: {entry}")
    shutil.copy2(entry, web_root / "index.html")
    for folder in STATIC_FOLDERS:
        source = user_dir / folder
        if source.is_dir():
            shutil.copytree(source, web_root / folder, dirs_exist_ok=True)
    uploads = user_dir / "data" / "uploads"
    if uploads.is_dir():
        shutil.copytree(uploads, web_root / "uploads", dirs_exist_ok=True)
    return web_root
