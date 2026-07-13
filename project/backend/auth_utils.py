import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask import request, jsonify, g
from config import Config


def generate_token(user, remember=False):
    minutes = Config.JWT_REMEMBER_EXPIRES_MINUTES if remember else Config.JWT_ACCESS_EXPIRES_MINUTES
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(minutes=minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])


def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired, please login again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401
        g.current_user = payload
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = getattr(g, "current_user", None)
        if not user or user.get("role") != "admin":
            return jsonify({"success": False, "message": "Admin privileges required"}), 403
        return fn(*args, **kwargs)
    return wrapper
