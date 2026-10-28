"""Simple local direct messages for signed-in users."""
from __future__ import annotations

class MessageService:
    def __init__(self, database):
        self.db = database

    def _user(self, conn, token):
        row = conn.execute("SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", (token,)).fetchone()
        if not row:
            raise ValueError("Please sign in to send a message.")
        return dict(row)

    def send(self, token, username, body):
        body = str(body).strip()
        if not body or len(body) > 1000:
            raise ValueError("A message must be between 1 and 1,000 characters.")
        with self.db.connect() as conn:
            sender = self._user(conn, token)
            recipient = conn.execute("SELECT id,username FROM users WHERE username=? COLLATE NOCASE", (str(username).strip().lstrip("@"),)).fetchone()
            if not recipient:
                raise ValueError("We couldn't find that username.")
            if recipient["id"] == sender["id"]:
                raise ValueError("Send a note to someone else, not yourself.")
            cur = conn.execute("INSERT INTO messages(sender_id,recipient_id,body) VALUES(?,?,?)", (sender["id"], recipient["id"], body))
            return {"id": cur.lastrowid, "message": "Your note has been sent.", "recipient": recipient["username"]}

    def list_for_user(self, token):
        with self.db.connect() as conn:
            user = self._user(conn, token)
            rows = conn.execute("""SELECT m.id,m.body,m.created_at,
                CASE WHEN m.sender_id=? THEN recipient.username ELSE sender.username END AS partner,
                CASE WHEN m.sender_id=? THEN 1 ELSE 0 END AS sent_by_me
                FROM messages m JOIN users sender ON sender.id=m.sender_id
                JOIN users recipient ON recipient.id=m.recipient_id
                WHERE m.sender_id=? OR m.recipient_id=? ORDER BY m.created_at DESC LIMIT 100""",
                (user["id"], user["id"], user["id"], user["id"])).fetchall()
            return [dict(row) for row in rows]
