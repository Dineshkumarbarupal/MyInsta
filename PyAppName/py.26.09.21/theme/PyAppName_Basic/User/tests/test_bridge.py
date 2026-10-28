"""Regression test for compatible Eel named function registration."""
import sys
import tempfile
import unittest
from pathlib import Path

USER_DIR = Path(__file__).resolve().parents[1]
if str(USER_DIR) not in sys.path:
    sys.path.insert(0, str(USER_DIR))

from db.database import Database
from py.bridge import register_api


class FakeEel:
    """Minimal fake of Eel's documented expose(name)(function) interface."""
    def __init__(self):
        self.functions = {}

    def expose(self, name_or_function=None):
        if isinstance(name_or_function, str):
            name = name_or_function

            def decorator(function):
                self.functions[name] = function
                return function

            return decorator
        function = name_or_function

        def decorator(function_to_register):
            self.functions[function_to_register.__name__] = function_to_register
            return function_to_register

        if function is not None:
            self.functions[function.__name__] = function
            return function
        return decorator


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Database(Path(self.temp.name))
        self.db.initialize()
        self.eel = FakeEel()

    def tearDown(self):
        self.temp.cleanup()

    def test_register_api_uses_named_eel_decorator(self):
        register_api(self.eel, self.db)
        self.assertIn("api_bootstrap", self.eel.functions)
        self.assertIn("api_register", self.eel.functions)
        self.assertIn("api_send_message", self.eel.functions)

    def test_bootstrap_response_is_wrapped(self):
        register_api(self.eel, self.db)
        result = self.eel.functions["api_bootstrap"](None)
        self.assertTrue(result["ok"])
        self.assertIn("feed", result["data"])
        self.assertIn("stories", result["data"])


if __name__ == "__main__":
    unittest.main()
