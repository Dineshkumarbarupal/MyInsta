# MyInsta — premium social desktop

A modular Instagram-inspired desktop application built with Python, Eel, HTML, CSS, JavaScript and SQLite.

## Phase 1
Initial foundation includes sign-up/sign-in, feed, stories, post creation, likes, comments, bookmarks, follows, explore/search, reels view, profile editing, notifications and theme settings. It is a local-first desktop prototype; production cloud sync, media processing, and large-scale server traffic remain future backend work.

## Architecture
Source lives under `PyAppName/py.26.09.21/theme/PyAppName_Basic/User/`: asset (visuals), component (reusable HTML fragments), template (page composition), core (shared frontend code), css (tokens/layout and one stylesheet per fragment), data (local data), db (SQLite), js (feature behaviour), py (Python services/Eel bridge), Runtime (generated Eel web root), tests (automated tests), web/index.html (single source entry point), and main.py (launcher).

## Run
Python 3.10+ recommended.
```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python PyAppName/py.26.09.21/theme/PyAppName_Basic/User/main.py
```
Eel uses Chrome/Chromium by default. To open in the system browser, set `MYINSTA_BROWSER=default`.

## Tests
```bash
python -m unittest discover -s PyAppName/py.26.09.21/theme/PyAppName_Basic/User/tests -v
```

Passwords use PBKDF2-HMAC-SHA256 hashes, never plaintext. SQLite uses foreign keys, WAL and a busy timeout. This prototype should not be exposed as a public multi-user server without a separate authenticated API, rate limits, media storage, backups and threat modelling.

The 10,000/hour, 1 lakh/hour, 10 lakh/hour and 100 crore/hour targets are roadmap goals, not measured capacity claims. A desktop UI plus SQLite cannot alone support internet-wide concurrent social traffic; future phases need workload definitions, load testing, server APIs, object storage, caching, queues, observability and distributed data architecture.
