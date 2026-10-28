"""Eel entry points: small validated wrappers around application services."""
from __future__ import annotations
from py.services.auth_service import AuthService, AuthError
from py.services.social_service import SocialService
from py.services.media_service import MediaService

def register_api(eel, database):
    auth = AuthService(database)
    social = SocialService(database)
    media = MediaService(database.user_dir)

    def safe(fn):
        def wrapped(*args):
            try:
                return {"ok": True, "data": fn(*args)}
            except (AuthError, ValueError) as exc:
                return {"ok": False, "error": str(exc)}
            except Exception:
                return {"ok": False, "error": "Something went wrong. Please try again."}
        return wrapped

    def expose(name, fn):
        eel.expose(name)(safe(fn))

    expose("api_bootstrap", lambda token=None: {"user": auth.current_user(token), "feed": social.feed(token), "stories": social.stories(token)})
    expose("api_register", lambda payload: auth.register(payload or {}))
    expose("api_login", lambda identity, password: auth.login(str(identity), str(password)))
    expose("api_logout", auth.logout)
    expose("api_feed", social.feed)
    expose("api_create_post", lambda token, payload: social.create_post(token, (payload or {}).get("caption", ""), (payload or {}).get("image_url", ""), (payload or {}).get("kind", "post"), (payload or {}).get("location", "")))
    expose("api_toggle_like", social.toggle_like)
    expose("api_add_comment", social.add_comment)
    expose("api_toggle_bookmark", social.toggle_bookmark)
    expose("api_toggle_follow", social.toggle_follow)
    expose("api_stories", social.stories)
    expose("api_add_story", lambda token, payload: social.add_story(token, (payload or {}).get("text", ""), (payload or {}).get("image_url", "")))
    expose("api_search", social.search)
    expose("api_profile", social.profile)
    expose("api_update_profile", social.update_profile)
    expose("api_notifications", social.notifications)
    expose("api_saved_posts", social.saved_posts)
    expose("api_upload_media", media.upload)
    from py.services.message_service import MessageService
    messages = MessageService(database)
    expose("api_send_message", messages.send)
    expose("api_messages", messages.list_for_user)
