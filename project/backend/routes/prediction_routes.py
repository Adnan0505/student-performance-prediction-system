import json
from datetime import datetime
from flask import Blueprint, request, jsonify, g

from database import get_db, log_activity
from auth_utils import token_required, admin_required
from ml import predict as ml_predict

prediction_bp = Blueprint("predictions", __name__, url_prefix="/api/predictions")


def _student_features(row):
    return {
        "attendance": row["attendance"], "internal_marks": row["internal_marks"],
        "assignment_score": row["assignment_score"], "study_hours": row["study_hours"],
        "previous_marks": row["previous_marks"], "age": row["age"],
    }


def _persist_prediction(student_row, result):
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO predictions (student_id, algorithm, predicted_grade, result, category,
           final_marks, confidence, is_at_risk, risk_reasons, recommendations, feature_importance,
           explanation, prediction_time_ms, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (student_row["id"], result["algorithm"], result["predicted_grade"], result["result"],
         result["category"], result["final_marks"], result["confidence"], int(result["is_at_risk"]),
         json.dumps(result["risk_reasons"]), json.dumps(result["recommendations"]),
         json.dumps(result["feature_importance"]), json.dumps(result["explanation"]),
         result["prediction_time_ms"], datetime.utcnow().isoformat()),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


@prediction_bp.route("/run/<int:student_id>", methods=["POST"])
@token_required
def run_prediction(student_id):
    data = request.get_json(silent=True) or {}
    algorithm = data.get("algorithm", "random_forest")
    if algorithm not in ("random_forest", "decision_tree"):
        return jsonify({"success": False, "message": "algorithm must be random_forest or decision_tree"}), 400

    conn = get_db()
    student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    if not student:
        return jsonify({"success": False, "message": "Student not found"}), 404

    result = ml_predict.predict(_student_features(student), algorithm)
    new_id = _persist_prediction(student, result)
    result["prediction_id"] = new_id

    log_activity(g.current_user["user_id"], g.current_user["name"], "Prediction Generated",
                 f"{student['name']} -> {result['predicted_grade']} ({algorithm})")

    return jsonify({"success": True, "student": dict(student), "prediction": result})


@prediction_bp.route("/bulk", methods=["POST"])
@token_required
@admin_required
def bulk_predict():
    data = request.get_json(force=True) or {}
    student_ids = data.get("student_ids", [])
    algorithm = data.get("algorithm", "random_forest")
    if not student_ids:
        return jsonify({"success": False, "message": "student_ids list is required"}), 400

    conn = get_db()
    results = []
    for sid in student_ids:
        student = conn.execute("SELECT * FROM students WHERE id = ?", (sid,)).fetchone()
        if not student:
            continue
        result = ml_predict.predict(_student_features(student), algorithm)
        result["prediction_id"] = _persist_prediction(student, result)
        results.append({"student_id": sid, "student_name": student["name"], "prediction": result})
    conn.close()

    log_activity(g.current_user["user_id"], g.current_user["name"], "Bulk Prediction",
                 f"{len(results)} students, {algorithm}")
    return jsonify({"success": True, "results": results, "count": len(results)})


@prediction_bp.route("/history", methods=["GET"])
@token_required
def history():
    search = request.args.get("search", "").strip()
    result_filter = request.args.get("result", "")
    category_filter = request.args.get("category", "")
    algorithm_filter = request.args.get("algorithm", "")
    page = max(int(request.args.get("page", 1)), 1)
    page_size = min(max(int(request.args.get("page_size", 10)), 1), 100)

    conn = get_db()
    where = []
    params = []
    if search:
        where.append("s.name LIKE ?")
        params.append(f"%{search}%")
    if result_filter:
        where.append("p.result = ?")
        params.append(result_filter)
    if category_filter:
        where.append("p.category = ?")
        params.append(category_filter)
    if algorithm_filter:
        where.append("p.algorithm = ?")
        params.append(algorithm_filter)
    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    total = conn.execute(
        f"SELECT COUNT(*) c FROM predictions p JOIN students s ON s.id = p.student_id {where_sql}", params
    ).fetchone()["c"]

    rows = conn.execute(
        f"""SELECT p.*, s.name as student_name, s.roll_no as roll_no
            FROM predictions p JOIN students s ON s.id = p.student_id
            {where_sql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?""",
        params + [page_size, (page - 1) * page_size],
    ).fetchall()
    conn.close()

    items = []
    for r in rows:
        d = dict(r)
        for key in ("risk_reasons", "recommendations", "feature_importance", "explanation"):
            try:
                d[key] = json.loads(d[key]) if d[key] else None
            except (TypeError, json.JSONDecodeError):
                pass
        items.append(d)

    return jsonify({
        "success": True, "history": items,
        "pagination": {"page": page, "page_size": page_size, "total": total,
                       "total_pages": max((total + page_size - 1) // page_size, 1)},
    })


@prediction_bp.route("/history/<int:prediction_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_history(prediction_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM predictions WHERE id = ?", (prediction_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "Prediction not found"}), 404
    conn.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
    conn.commit()
    conn.close()
    log_activity(g.current_user["user_id"], g.current_user["name"], "Prediction History Deleted", str(prediction_id))
    return jsonify({"success": True, "message": "Prediction deleted"})


@prediction_bp.route("/history/export/csv", methods=["GET"])
@token_required
def export_history_csv():
    import csv, io
    from flask import Response
    conn = get_db()
    rows = conn.execute(
        """SELECT p.created_at, s.name, s.roll_no, p.algorithm, p.predicted_grade, p.result,
                  p.category, p.confidence, p.final_marks
           FROM predictions p JOIN students s ON s.id = p.student_id ORDER BY p.created_at DESC"""
    ).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Student", "Roll No", "Algorithm", "Grade", "Result",
                      "Category", "Confidence %", "Final Marks"])
    for r in rows:
        writer.writerow(list(r))
    return Response(output.getvalue(), mimetype="text/csv",
                     headers={"Content-Disposition": "attachment; filename=prediction_history.csv"})


@prediction_bp.route("/model-comparison", methods=["GET"])
@token_required
def model_comparison():
    return jsonify({"success": True, "metrics": ml_predict.get_metrics()})
