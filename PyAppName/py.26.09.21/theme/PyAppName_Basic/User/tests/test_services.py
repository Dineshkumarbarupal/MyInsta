"""Fast service tests; all data lives in a temporary SQLite file."""
import sys
import tempfile
import unittest
from pathlib import Path

USER_DIR = Path(__file__).resolve().parents[1]
if str(USER_DIR) not in sys.path:
    sys.path.insert(0, str(USER_DIR))

from db.database import Database
from py.services.auth_service import AuthService, AuthError, _hash_password, _verify_password
from py.services.social_service import SocialService

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Database(Path(self.temp.name))
        self.db.initialize()
        self.auth = AuthService(self.db)
        self.social = SocialService(self.db)

    def tearDown(self):
        self.temp.cleanup()

    def test_password_hash_is_salted_and_verifiable(self):
        first = _hash_password("a-long-test-password")
        second = _hash_password("a-long-test-password")
        self.assertNotEqual(first, second)
        self.assertTrue(_verify_password("a-long-test-password", first))
        self.assertFalse(_verify_password("wrong-password", first))

    def test_register_login_and_session(self):
        created = self.auth.register({"username":"tester_one","email":"tester@example.test",
            "password":"a-long-test-password","display_name":"Test Person"})
        self.assertEqual(self.auth.current_user(created["token"])["username"], "tester_one")
        signed_in = self.auth.login("tester@example.test", "a-long-test-password")
        self.assertEqual(signed_in["user"]["username"], "tester_one")
        self.auth.logout(created["token"])
        self.assertIsNone(self.auth.current_user(created["token"]))

    def test_register_rejects_weak_password(self):
        with self.assertRaises(AuthError):
            self.auth.register({"username":"tester_two","email":"two@example.test","password":"short","display_name":"Two"})

    def test_demo_feed_has_content(self):
        feed = self.social.feed()
        self.assertGreaterEqual(len(feed), 3)
        self.assertIn("like_count", feed[0])
        self.assertIn("comments_preview", feed[0])

    def test_social_actions_require_a_session(self):
        with self.assertRaises(ValueError):
            self.social.create_post(None, "hello", "", "post")

if __name__ == "__main__":
    unittest.main()
