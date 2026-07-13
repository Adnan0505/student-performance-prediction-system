import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash
from config import Config

os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)


def get_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',   -- 'admin' | 'student'
    student_id INTEGER,
    reset_token TEXT,
    reset_token_expires TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roll_no TEXT UNIQUE NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    attendance REAL NOT NULL,
    internal_marks REAL NOT NULL,
    assignment_score REAL NOT NULL,
    study_hours REAL NOT NULL,
    previous_marks REAL NOT NULL,
    ca1 REAL NOT NULL,
    ca2 REAL NOT NULL,
    ca3 REAL NOT NULL,
    ca4 REAL NOT NULL,
    pca1 REAL NOT NULL,
    pca2 REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    algorithm TEXT NOT NULL,
    predicted_grade TEXT NOT NULL,
    result TEXT NOT NULL,          -- Pass | Fail
    category TEXT NOT NULL,        -- Excellent | Good | Average | At Risk
    final_marks REAL NOT NULL,
    confidence REAL NOT NULL,
    is_at_risk INTEGER NOT NULL DEFAULT 0,
    risk_reasons TEXT,             -- JSON list
    recommendations TEXT,          -- JSON list
    feature_importance TEXT,       -- JSON dict (global model importance)
    explanation TEXT,              -- JSON dict (per-student contribution)
    prediction_time_ms REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL
);
"""


def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()

    # Seed a default admin account if none exists
    existing = conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1").fetchone()
    if not existing:
        conn.execute(
            "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                "System Admin",
                "admin@spps.local",
                generate_password_hash("Admin@123"),
                "admin",
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
    conn.close()


def log_activity(user_id, user_name, action, details=""):
    conn = get_db()
    conn.execute(
        "INSERT INTO activity_logs (user_id, user_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, user_name, action, details, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()