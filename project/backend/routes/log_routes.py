from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import token_required, admin_required

log_bp = Blueprint("logs", __name__, url_prefix="/api/logs")


@log_bp.route("", methods=["GET"])
@token_required
@admin_required
def list_logs():
    page = max(int(request.args.get("page", 1)), 1)
    page_size = min(max(int(request.args.get("page_size", 20)), 1), 100)
    search = request.args.get("search", "").strip()

    conn = get_db()
    where_sql, params = "", []
    if search:
        where_sql = "WHERE action LIKE ? OR user_name LIKE ? OR details LIKE ?"
        params = [f"%{search}%"] * 3

    total = conn.execute(f"SELECT COUNT(*) c FROM activity_logs {where_sql}", params).fetchone()["c"]
    rows = conn.execute(
        f"SELECT * FROM activity_logs {where_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [page_size, (page - 1) * page_size],
    ).fetchall()
    conn.close()

    return jsonify({
        "success": True,
        "logs": [dict(r) for r in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total,
                       "total_pages": max((total + page_size - 1) // page_size, 1)},
    })


@log_bp.route("/recent", methods=["GET"])
@token_required
def recent_activity():
    conn = get_db()
    rows = conn.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10").fetchall()
    conn.close()
    return jsonify({"success": True, "logs": [dict(r) for r in rows]})
