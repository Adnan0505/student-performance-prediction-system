import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_db, log_activity
from auth_utils import generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role") if data.get("role") in ("admin", "student") else "student"

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"success": False, "message": "Email already registered"}), 409

    conn.execute(
        "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, email, generate_password_hash(password), role, datetime.utcnow().isoformat()),
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    token = generate_token(user)
    log_activity(user["id"], user["name"], "Registered", f"Role: {role}")
    return jsonify({
        "success": True,
        "message": "Registration successful",
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    remember = bool(data.get("remember", False))

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    token = generate_token(user, remember=remember)
    log_activity(user["id"], user["name"], "Logged In")
    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    })


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    user = g.current_user
    log_activity(user["user_id"], user["name"], "Logged Out")
    return jsonify({"success": True, "message": "Logged out"})


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    return jsonify({"success": True, "user": g.current_user})


@auth_bp.route("/change-password", methods=["POST"])
@token_required
def change_password():
    data = request.get_json(force=True) or {}
    old_password = data.get("old_password") or ""
    new_password = data.get("new_password") or ""
    if len(new_password) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (g.current_user["user_id"],)).fetchone()
    if not user or not check_password_hash(user["password_hash"], old_password):
        conn.close()
        return jsonify({"success": False, "message": "Old password is incorrect"}), 401

    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                 (generate_password_hash(new_password), user["id"]))
    conn.commit()
    conn.close()
    log_activity(user["id"], user["name"], "Changed Password")
    return jsonify({"success": True, "message": "Password changed successfully"})


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Generates a reset token. Email delivery reuses the SMTP integration in
    utils/mailer.py if SMTP_* environment variables are configured; otherwise
    the token is returned directly in the response so the flow can still be
    demoed end-to-end without a real mail server."""
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        conn.close()
        # Do not reveal whether the email exists
        return jsonify({"success": True, "message": "If that account exists, a reset link was sent"})

    token = secrets.token_urlsafe(24)
    expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    conn.execute("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
                 (token, expires, user["id"]))
    conn.commit()
    conn.close()

    from utils.mailer import send_password_reset_email
    sent = send_password_reset_email(user["email"], user["name"], token)

    resp = {"success": True, "message": "If that account exists, a reset link was sent"}
    if not sent:
        resp["dev_reset_token"] = token  # convenience for local/demo use only
    return jsonify(resp)


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(force=True) or {}
    token = data.get("token") or ""
    new_password = data.get("new_password") or ""
    if len(new_password) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE reset_token = ?", (token,)).fetchone()
    if not user or not user["reset_token_expires"] or datetime.utcnow() > datetime.fromisoformat(user["reset_token_expires"]):
        conn.close()
        return jsonify({"success": False, "message": "Reset token is invalid or expired"}), 400

    conn.execute("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
                 (generate_password_hash(new_password), user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Password reset successful"})
