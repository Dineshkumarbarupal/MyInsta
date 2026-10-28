"""Password hashing and account operations."""
from __future__ import annotations
import hashlib
import hmac
import re
import secrets
import sqlite3

_ITERATIONS = 310_000

class AuthError(ValueError):
    """Safe validation or authentication error for display in the UI."""

def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERATIONS)
    return "pbkdf2_sha256$" + str(_ITERATIONS) + "$" + salt.hex() + "$" + digest.hex()

def _verify_password(password: str, encoded: str) -> bool:
    try:
        label, rounds, salt_hex, digest_hex = encoded.split("$")
        if label != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(rounds)).hex()
        return hmac.compare_digest(actual, digest_hex)
    except (ValueError, TypeError):
        return False

class AuthService:
    def __init__(self, database):
        self.db = database

    def register(self, payload: dict) -> dict:
        username = str(payload.get("username", "")).strip().lower()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        display_name = str(payload.get("display_name", username)).strip()[:60]
        if not re.fullmatch(r"[a-z0-9_.]{3,24}", username):
            raise AuthError("Username must be 3–24 characters: letters, numbers, dots or underscores.")
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 254:
            raise AuthError("Enter a valid email address.")
        if len(password) < 10 or len(password) > 128:
            raise AuthError("Use a password between 10 and 128 characters.")
        if not display_name:
            raise AuthError("Please add your name.")
        token = secrets.token_urlsafe(32)
        try:
            with self.db.connect() as conn:
                cur = conn.execute("INSERT INTO users(username,email,password_hash,display_name) VALUES(?,?,?,?)",
                                   (username, email, _hash_password(password), display_name))
                user_id = cur.lastrowid
                conn.execute("INSERT INTO sessions(token,user_id) VALUES(?,?)", (token, user_id))
                row = conn.execute("SELECT id,username,email,display_name,bio,avatar_url FROM users WHERE id=?", (user_id,)).fetchone()
                return {"token": token, "user": dict(row)}
        except sqlite3.IntegrityError as exc:
            if "username" in str(exc).lower():
                raise AuthError("That username is already taken.") from exc
            raise AuthError("That email is already registered.") from exc

    def login(self, identity: str, password: str) -> dict:
        with self.db.connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE username=? COLLATE NOCASE OR email=? COLLATE NOCASE",
                               (identity.strip(), identity.strip())).fetchone()
            if not row or not _verify_password(password, row["password_hash"]):
                raise AuthError("Those details don't match. Please try again.")
            token = secrets.token_urlsafe(32)
            conn.execute("INSERT INTO sessions(token,user_id) VALUES(?,?)", (token, row["id"]))
            return {"token": token, "user": self._public_user(row)}

    def current_user(self, token: str | None) -> dict | None:
        if not token:
            return None
        with self.db.connect() as conn:
            row = conn.execute("""SELECT u.id,u.username,u.email,u.display_name,u.bio,u.avatar_url,u.is_private
                FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?""", (token,)).fetchone()
            return dict(row) if row else None

    def logout(self, token: str | None) -> bool:
        if not token:
            return True
        with self.db.connect() as conn:
            conn.execute("DELETE FROM sessions WHERE token=?", (token,))
        return True

    @staticmethod
    def _public_user(row) -> dict:
        return {key: row[key] for key in ("id","username","email","display_name","bio","avatar_url") if key in row.keys()}
