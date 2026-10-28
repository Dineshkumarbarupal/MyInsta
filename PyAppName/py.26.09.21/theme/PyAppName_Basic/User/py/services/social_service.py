"""Database-backed social features."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone

class SocialService:
    def __init__(self, database):
        self.db = database

    @staticmethod
    def _stamp(dt):
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def _relative(value):
        try:
            stamp = datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            minutes = max(0, int((datetime.now(timezone.utc) - stamp).total_seconds() // 60))
            if minutes < 1: return "just now"
            if minutes < 60: return f"{minutes}m ago"
            if minutes < 1440: return f"{minutes // 60}h ago"
            return f"{minutes // 1440}d ago"
        except (ValueError, TypeError): return "recently"

    def feed(self, token=None, kind="all"):
        with self.db.connect() as conn:
            viewer = conn.execute("SELECT user_id FROM sessions WHERE token=?", (token,)).fetchone() if token else None
            viewer_id = viewer["user_id"] if viewer else None
            if kind in ("post", "reel"):
                where = "WHERE p.kind=?"
                params = [kind]
            elif kind == "following" and viewer_id:
                where = "WHERE (p.user_id=? OR EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=? AND f.followed_id=p.user_id))"
                params = [viewer_id, viewer_id]
            else:
                where = ""
                params = []
            rows = conn.execute(f"""SELECT p.*,u.username,u.display_name,u.avatar_url,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comment_count,
                EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.user_id=?) liked,
                EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id=p.id AND b.user_id=?) saved
                FROM posts p JOIN users u ON u.id=p.user_id {where} ORDER BY p.created_at DESC,p.id DESC LIMIT 60""",
                [viewer_id, viewer_id, *params]).fetchall()
            result = []
            for row in rows:
                item = dict(row)
                item["time_ago"] = self._relative(item["created_at"])
                item["comments_preview"] = [dict(c) for c in conn.execute("""SELECT c.body,u.username FROM comments c
                    JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY c.created_at DESC LIMIT 2""", (row["id"],))]
                result.append(item)
            return result

    @staticmethod
    def _valid_media_url(url):
        return not url or url.startswith(("https://", "http://", "data:image/", "/uploads/"))

    def create_post(self, token, caption, image_url, kind="post", location=""):
        user = self._require_user(token)
        caption, image_url = str(caption).strip()[:2200], str(image_url).strip()[:1000]
        if not caption and not image_url: raise ValueError("Add a caption or media file.")
        if not self._valid_media_url(image_url): raise ValueError("Use a valid image/video URL or upload a file.")
        if kind not in ("post", "reel"): kind = "post"
        with self.db.connect() as conn:
            cur = conn.execute("INSERT INTO posts(user_id,caption,image_url,kind,location) VALUES(?,?,?,?,?)",
                               (user["id"], caption, image_url, kind, str(location)[:120]))
            return {"id": cur.lastrowid, "message": "Your moment has been shared."}

    def toggle_like(self, token, post_id):
        user = self._require_user(token)
        with self.db.connect() as conn:
            exists = conn.execute("SELECT 1 FROM likes WHERE user_id=? AND post_id=?", (user["id"], int(post_id))).fetchone()
            if exists:
                conn.execute("DELETE FROM likes WHERE user_id=? AND post_id=?", (user["id"], int(post_id)))
                liked = False
            else:
                conn.execute("INSERT INTO likes(user_id,post_id) VALUES(?,?)", (user["id"], int(post_id)))
                liked = True
            count = conn.execute("SELECT COUNT(*) FROM likes WHERE post_id=?", (int(post_id),)).fetchone()[0]
            return {"liked": liked, "like_count": count}

    def add_comment(self, token, post_id, body):
        user = self._require_user(token)
        body = str(body).strip()
        if not body or len(body) > 1000: raise ValueError("A comment must be between 1 and 1,000 characters.")
        with self.db.connect() as conn:
            exists = conn.execute("SELECT 1 FROM posts WHERE id=?", (int(post_id),)).fetchone()
            if not exists: raise ValueError("This post is no longer available.")
            cur = conn.execute("INSERT INTO comments(post_id,user_id,body) VALUES(?,?,?)", (int(post_id), user["id"], body))
            return {"id": cur.lastrowid, "username": user["username"], "body": body}

    def toggle_bookmark(self, token, post_id):
        user = self._require_user(token)
        with self.db.connect() as conn:
            exists = conn.execute("SELECT 1 FROM bookmarks WHERE user_id=? AND post_id=?", (user["id"], int(post_id))).fetchone()
            if exists:
                conn.execute("DELETE FROM bookmarks WHERE user_id=? AND post_id=?", (user["id"], int(post_id)))
                saved = False
            else:
                conn.execute("INSERT INTO bookmarks(user_id,post_id) VALUES(?,?)", (user["id"], int(post_id)))
                saved = True
            return {"saved": saved}

    def toggle_follow(self, token, username):
        user = self._require_user(token)
        with self.db.connect() as conn:
            target = conn.execute("SELECT id FROM users WHERE username=? COLLATE NOCASE", (str(username).lstrip("@"),)).fetchone()
            if not target: raise ValueError("Profile not found.")
            if target["id"] == user["id"]: raise ValueError("You can't follow your own profile.")
            exists = conn.execute("SELECT 1 FROM follows WHERE follower_id=? AND followed_id=?", (user["id"], target["id"])).fetchone()
            if exists:
                conn.execute("DELETE FROM follows WHERE follower_id=? AND followed_id=?", (user["id"], target["id"]))
                following = False
            else:
                conn.execute("INSERT INTO follows(follower_id,followed_id) VALUES(?,?)", (user["id"], target["id"]))
                following = True
                conn.execute("INSERT INTO notifications(user_id,actor_id,kind,message) VALUES(?,?,?,?)",
                             (target["id"], user["id"], "follow", f"{user['username']} started following you"))
            return {"following": following}

    def stories(self, token=None):
        with self.db.connect() as conn:
            return [dict(row) for row in conn.execute("""SELECT s.id,s.text,s.image_url,s.expires_at,u.username,u.display_name,u.avatar_url
                FROM stories s JOIN users u ON u.id=s.user_id WHERE s.expires_at > ? ORDER BY s.created_at DESC LIMIT 40""",
                (self._stamp(datetime.now(timezone.utc)),))]

    def add_story(self, token, text, image_url):
        user = self._require_user(token)
        expires = self._stamp(datetime.now(timezone.utc) + timedelta(hours=24))
        text, image_url = str(text).strip()[:300], str(image_url).strip()[:1000]
        if not text and not image_url: raise ValueError("Add a note or image to your story.")
        if not self._valid_media_url(image_url): raise ValueError("Use a valid image URL or upload a file.")
        if image_url and image_url.endswith((".mp4", ".webm")): raise ValueError("Stories currently accept images only.")
        with self.db.connect() as conn:
            cur = conn.execute("INSERT INTO stories(user_id,text,image_url,expires_at) VALUES(?,?,?,?)", (user["id"], text, image_url, expires))
        return {"id": cur.lastrowid, "message": "Story added for the next 24 hours."}

    def search(self, query, token=None):
        query = str(query).strip()[:80]
        if not query: return []
        with self.db.connect() as conn:
            viewer = conn.execute("SELECT user_id FROM sessions WHERE token=?", (token,)).fetchone() if token else None
            viewer_id = viewer["user_id"] if viewer else 0
            return [dict(r) for r in conn.execute("""SELECT u.id,u.username,u.display_name,u.bio,u.avatar_url,
                EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=? AND f.followed_id=u.id) following
                FROM users u WHERE u.username LIKE ? OR u.display_name LIKE ? LIMIT 30""",
                (viewer_id, "%" + query + "%", "%" + query + "%"))]

    def profile(self, token, username=None):
        viewer = self._require_user(token)
        with self.db.connect() as conn:
            user = conn.execute("""SELECT u.id,u.username,u.display_name,u.bio,u.avatar_url,u.is_private,
                (SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id) post_count,
                (SELECT COUNT(*) FROM follows f WHERE f.followed_id=u.id) followers,
                (SELECT COUNT(*) FROM follows f WHERE f.follower_id=u.id) following,
                EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=? AND f.followed_id=u.id) is_following
                FROM users u WHERE u.username=? COLLATE NOCASE""", (viewer["id"], username or viewer["username"])).fetchone()
            if not user: raise ValueError("Profile not found.")
            return dict(user)

    def update_profile(self, token, payload):
        user = self._require_user(token)
        display_name = str(payload.get("display_name", user["display_name"])).strip()[:60]
        bio = str(payload.get("bio", "")).strip()[:280]
        avatar = str(payload.get("avatar_url", "")).strip()[:1000]
        if not display_name: raise ValueError("Display name cannot be empty.")
        if avatar and not avatar.startswith(("https://", "http://", "data:image/")): raise ValueError("Use a valid image URL.")
        with self.db.connect() as conn:
            conn.execute("UPDATE users SET display_name=?,bio=?,avatar_url=? WHERE id=?", (display_name,bio,avatar,user["id"]))
        return {"display_name":display_name,"bio":bio,"avatar_url":avatar}

    def notifications(self, token):
        user = self._require_user(token)
        with self.db.connect() as conn:
            return [dict(row) for row in conn.execute("""SELECT n.id,n.kind,n.message,n.is_read,n.created_at,u.username,u.avatar_url
                FROM notifications n LEFT JOIN users u ON u.id=n.actor_id WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 50""", (user["id"],))]

    def saved_posts(self, token):
        user = self._require_user(token)
        with self.db.connect() as conn:
            return [dict(row) for row in conn.execute("""SELECT p.*,u.username,u.display_name,u.avatar_url,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comment_count,
                0 liked,1 saved FROM bookmarks b JOIN posts p ON p.id=b.post_id JOIN users u ON u.id=p.user_id
                WHERE b.user_id=? ORDER BY b.created_at DESC""", (user["id"],))]

    def _user_from_token(self, token):
        if not token: return None
        with self.db.connect() as conn:
            row = conn.execute("SELECT u.id,u.username,u.display_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", (token,)).fetchone()
            return dict(row) if row else None

    def _require_user(self, token):
        user = self._user_from_token(token)
        if not user: raise ValueError("Please sign in to use this feature.")
        return user
