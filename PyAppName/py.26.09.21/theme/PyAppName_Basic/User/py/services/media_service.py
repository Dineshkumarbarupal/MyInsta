"""Safe, size-limited local media uploads for the desktop prototype."""
from __future__ import annotations
import base64
import binascii
import re
import shutil
import uuid
from pathlib import Path

ALLOWED = {
    "image/jpeg": (".jpg", lambda b: b.startswith(b"\xff\xd8\xff")),
    "image/png": (".png", lambda b: b.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/gif": (".gif", lambda b: b.startswith((b"GIF87a", b"GIF89a"))),
    "image/webp": (".webp", lambda b: b.startswith(b"RIFF") and b[8:12] == b"WEBP"),
    "video/mp4": (".mp4", lambda b: len(b) > 12 and b[4:8] == b"ftyp"),
    "video/webm": (".webm", lambda b: b.startswith(b"\x1aE\xdf\xa3")),
}
MAX_BYTES = 8 * 1024 * 1024

class MediaService:
    def __init__(self, user_dir: Path):
        self.user_dir = Path(user_dir)

    def upload(self, data_url: str) -> dict:
        match = re.fullmatch(r"data:([a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)", str(data_url or ""))
        if not match:
            raise ValueError("Choose a valid image or MP4/WebM video file.")
        mime, encoded = match.group(1).lower(), match.group(2)
        if mime not in ALLOWED:
            raise ValueError("Supported files: JPG, PNG, GIF, WebP, MP4 and WebM.")
        if len(encoded) > (MAX_BYTES * 4 // 3 + 16):
            raise ValueError("Files must be 8 MB or smaller.")
        try:
            content = base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("The selected media file could not be read.") from exc
        if not content or len(content) > MAX_BYTES:
            raise ValueError("Files must be between 1 byte and 8 MB.")
        extension, checker = ALLOWED[mime]
        if not checker(content):
            raise ValueError("This file's contents do not match its media type.")
        filename = uuid.uuid4().hex + extension
        source = self.user_dir / "data" / "uploads" / filename
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_bytes(content)
        web_uploads = self.user_dir / "Runtime" / "generated_web" / "uploads"
        web_uploads.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, web_uploads / filename)
        return {"url": "/uploads/" + filename, "media_type": "video" if mime.startswith("video/") else "image", "filename": filename}
