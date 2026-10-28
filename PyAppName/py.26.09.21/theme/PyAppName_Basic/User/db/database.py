"""SQLite connection and schema management for MyInsta."""
from __future__ import annotations
import sqlite3
from pathlib import Path

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
 display_name TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '', avatar_url TEXT NOT NULL DEFAULT '',
 is_private INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 caption TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'post',
 location TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS likes (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, post_id)
);
CREATE TABLE IF NOT EXISTS comments (
 id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS follows (
 follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(follower_id, followed_id),
 CHECK(follower_id != followed_id)
);
CREATE TABLE IF NOT EXISTS stories (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 text TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '',
 expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bookmarks (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, post_id)
);
CREATE TABLE IF NOT EXISTS notifications (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL, kind TEXT NOT NULL,
 reference_id INTEGER, message TEXT NOT NULL DEFAULT '', is_read INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
"""

class Database:
    def __init__(self, user_dir: Path):
        self.user_dir = Path(user_dir)
        self.path = self.user_dir / "data" / "myinsta.sqlite3"

    def connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.path, timeout=8.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 8000")
        conn.execute("PRAGMA journal_mode = WAL")
        return conn

    def initialize(self) -> None:
        with self.connect() as conn:
            conn.executescript(SCHEMA)
            self._seed_demo(conn)

    @staticmethod
    def _seed_demo(conn: sqlite3.Connection) -> None:
        if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
            return
        sample_users = [
            ("maya.j", "maya@example.test", "Maya Jones", "Finding poetry in ordinary days.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces"),
            ("leo.frames", "leo@example.test", "Leo Martin", "A camera, a coffee, and a little bit of sunlight.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces"),
            ("ava.sun", "ava@example.test", "Ava Sun", "Collecting coastlines and quiet mornings.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces"),
            ("nina.jpg", "nina@example.test", "Nina Patel", "Small city stories, big feelings.", "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=faces"),
        ]
        for username, email, name, bio, avatar in sample_users:
            conn.execute("INSERT INTO users(username,email,password_hash,display_name,bio,avatar_url) VALUES(?,?,?,?,?,?)",
                         (username, email, "demo-account-not-loginable", name, bio, avatar))
        authors = [row[0] for row in conn.execute("SELECT id FROM users ORDER BY id")]
        sample_posts = [
            (authors[0], "A reminder to take the scenic route. The best bits are rarely on the checklist. 🌿", "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&h=1200&fit=crop", "post", "Somewhere slow"),
            (authors[1], "Golden hour has a way of making everything feel possible.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=1200&fit=crop", "post", "The countryside"),
            (authors[2], "Salt in my hair, nowhere to be. That kind of day. ☀️", "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=1200&fit=crop", "reel", "The coast"),
            (authors[3], "A tiny collection of places I want to remember forever.", "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&h=1200&fit=crop", "post", "After hours"),
        ]
        for row in sample_posts:
            conn.execute("INSERT INTO posts(user_id,caption,image_url,kind,location) VALUES(?,?,?,?,?)", row)
        post_ids = [r[0] for r in conn.execute("SELECT id FROM posts ORDER BY id")]
        conn.execute("INSERT INTO likes(user_id,post_id) VALUES(?,?)", (authors[1], post_ids[0]))
        conn.execute("INSERT INTO likes(user_id,post_id) VALUES(?,?)", (authors[2], post_ids[0]))
        conn.execute("INSERT INTO comments(post_id,user_id,body) VALUES(?,?,?)", (post_ids[0], authors[1], "This light is everything ✨"))
        conn.execute("INSERT INTO comments(post_id,user_id,body) VALUES(?,?,?)", (post_ids[1], authors[3], "Saving this feeling for later."))
