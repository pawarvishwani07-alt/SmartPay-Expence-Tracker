from datetime import datetime, timezone
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
import json
import os
import secrets
import sqlite3
import urllib.parse


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "smartpay.db"
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "5000"))
SESSIONS = {}


def get_db():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    with get_db() as connection:
        connection.executescript((BASE_DIR / "database.sql").read_text(encoding="utf-8"))


def hash_password(password):
    salt = secrets.token_bytes(16)
    password_hash = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"{salt.hex()}:{password_hash.hex()}"


def check_password(password, stored_hash):
    salt_hex, password_hash_hex = stored_hash.split(":", 1)
    password_hash = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt_hex), n=16384, r=8, p=1
    )
    return secrets.compare_digest(password_hash.hex(), password_hash_hex)


def transaction_json(row):
    paid_at = datetime.fromisoformat(row["paid_at"].replace("Z", "+00:00"))
    local_time = paid_at.astimezone()
    return {
        "id": row["id"],
        "purpose": row["purpose"],
        "amount": row["amount"],
        "date": local_time.strftime("%d/%m/%Y"),
        "time": local_time.strftime("%I:%M %p"),
        "paidAt": row["paid_at"],
    }


class SmartPayHandler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}

    def session_id(self):
        header = cookies.SimpleCookie(self.headers.get("Cookie", ""))
        session_cookie = header.get("smartpay_session")
        return session_cookie.value if session_cookie else None

    def current_user_id(self):
        return SESSIONS.get(self.session_id())

    def require_user(self):
        user_id = self.current_user_id()
        if user_id is None:
            self.send_json(401, {"error": "Authentication required."})
        return user_id

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/me":
            user_id = self.require_user()
            if user_id is None:
                return
            with get_db() as connection:
                user = connection.execute(
                    "SELECT id, name, email, income FROM users WHERE id = ?", (user_id,)
                ).fetchone()
            if user is None:
                self.send_json(401, {"error": "User not found."})
                return
            self.send_json(200, {"user": dict(user)})
            return

        if path == "/api/transactions":
            user_id = self.require_user()
            if user_id is None:
                return
            with get_db() as connection:
                rows = connection.execute(
                    "SELECT id, purpose, amount, paid_at FROM transactions "
                    "WHERE user_id = ? ORDER BY paid_at DESC, id DESC",
                    (user_id,),
                ).fetchall()
            self.send_json(200, {"transactions": [transaction_json(row) for row in rows]})
            return

        self.serve_file(path)

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        data = self.read_json()
        if path == "/api/register":
            self.register(data)
        elif path == "/api/login":
            self.login(data)
        elif path == "/api/logout":
            session_id = self.session_id()
            if session_id:
                SESSIONS.pop(session_id, None)
            self.send_json(200, {"message": "Logged out."})
        elif path == "/api/transactions":
            self.create_transaction(data)
        else:
            self.send_json(404, {"error": "Not found."})

    def register(self, data):
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        try:
            income = float(data.get("income", 0))
        except (TypeError, ValueError):
            self.send_json(400, {"error": "Income must be a valid number."})
            return
        if len(name) < 2 or "@" not in email or len(password) < 6 or income < 0:
            self.send_json(400, {"error": "Please provide valid registration details."})
            return
        try:
            with get_db() as connection:
                cursor = connection.execute(
                    "INSERT INTO users (name, email, password_hash, income) VALUES (?, ?, ?, ?)",
                    (name, email, hash_password(password), income),
                )
                user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            self.send_json(409, {"error": "An account with that email already exists."})
            return
        self.start_session(user_id)
        self.send_json(201, {
            "message": "Account created successfully.",
            "user": {"name": name, "email": email, "income": income},
        })

    def login(self, data):
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        with get_db() as connection:
            user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if user is None:
            self.send_json(401, {"error": "Invalid email or password."})
            return
        try:
            valid_password = check_password(password, user["password_hash"])
        except (ValueError, IndexError):
            valid_password = False
        if not valid_password:
            self.send_json(401, {"error": "Invalid email or password."})
            return
        self.start_session(user["id"])
        self.send_json(200, {
            "message": "Login successful.",
            "user": {"name": user["name"], "email": user["email"], "income": user["income"]},
        })

    def create_transaction(self, data):
        user_id = self.require_user()
        if user_id is None:
            return
        purpose = str(data.get("purpose", "")).strip()
        try:
            amount = float(data.get("amount"))
        except (TypeError, ValueError):
            amount = 0
        if not purpose or amount <= 0:
            self.send_json(400, {"error": "Purpose and a positive amount are required."})
            return
        paid_at = datetime.now(timezone.utc).isoformat()
        with get_db() as connection:
            cursor = connection.execute(
                "INSERT INTO transactions (user_id, purpose, amount, paid_at) VALUES (?, ?, ?, ?)",
                (user_id, purpose, amount, paid_at),
            )
            row = connection.execute(
                "SELECT id, purpose, amount, paid_at FROM transactions WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()
        self.send_json(201, {"transaction": transaction_json(row)})

    def start_session(self, user_id):
        session_id = secrets.token_urlsafe(32)
        SESSIONS[session_id] = user_id
        self.session_cookie = f"smartpay_session={session_id}; Path=/; HttpOnly; SameSite=Lax"

    def serve_file(self, path):
        relative_path = "index.html" if path == "/" else path.lstrip("/")
        file_path = (BASE_DIR / relative_path).resolve()
        if BASE_DIR not in file_path.parents or not file_path.is_file():
            self.send_json(404, {"error": "Not found."})
            return
        body = file_path.read_bytes()
        content_types = {".html": "text/html", ".css": "text/css", ".js": "application/javascript"}
        self.send_response(200)
        self.send_header("Content-Type", content_types.get(file_path.suffix, "text/plain") + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        if hasattr(self, "session_cookie"):
            self.send_header("Set-Cookie", self.session_cookie)
            del self.session_cookie
        super().end_headers()


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), SmartPayHandler)
    print(f"SmartPay is running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
