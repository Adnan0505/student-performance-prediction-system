from flask import Blueprint, jsonify, request
from database import get_db
from auth_utils import token_required

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.route("/overview", methods=["GET"])
@token_required
def overview():
    conn = get_db()
    avgs = conn.execute(
        """SELECT AVG(attendance) a, AVG(internal_marks) im, AVG(assignment_score) asg,
                  AVG(study_hours) sh, AVG(previous_marks) pm FROM students"""
    ).fetchone()

    top_performers = conn.execute(
        """SELECT s.name, s.roll_no, p.predicted_grade, p.final_marks, p.confidence
           FROM predictions p JOIN students s ON s.id = p.student_id
           ORDER BY p.final_marks DESC LIMIT 10"""
    ).fetchall()

    weak_students = conn.execute(
        """SELECT s.name, s.roll_no, p.predicted_grade, p.final_marks, p.is_at_risk
           FROM predictions p JOIN students s ON s.id = p.student_id
           WHERE p.is_at_risk = 1 ORDER BY p.final_marks ASC LIMIT 10"""
    ).fetchall()

    monthly_growth = conn.execute(
        """SELECT substr(created_at,1,7) as month, AVG(final_marks) avg_marks, COUNT(*) c
           FROM predictions GROUP BY month ORDER BY month DESC LIMIT 6"""
    ).fetchall()

    conn.close()

    return jsonify({
        "success": True,
        "averages": {
            "attendance": round(avgs["a"] or 0, 2),
            "internal_marks": round(avgs["im"] or 0, 2),
            "assignment_score": round(avgs["asg"] or 0, 2),
            "study_hours": round(avgs["sh"] or 0, 2),
            "previous_marks": round(avgs["pm"] or 0, 2),
        },
        "top_performers": [dict(r) for r in top_performers],
        "weak_students": [dict(r) for r in weak_students],
        "monthly_growth": [dict(r) for r in monthly_growth],
    })


@analytics_bp.route("/leaderboard", methods=["GET"])
@token_required
def leaderboard():
    conn = get_db()
    rows = conn.execute(
        """SELECT s.id, s.name, s.roll_no, s.attendance, p.predicted_grade, p.final_marks
           FROM students s
           JOIN (
               SELECT student_id, MAX(created_at) latest FROM predictions GROUP BY student_id
           ) lp ON lp.student_id = s.id
           JOIN predictions p ON p.student_id = lp.student_id AND p.created_at = lp.latest
           ORDER BY p.final_marks DESC LIMIT 10"""
    ).fetchall()
    conn.close()
    leaderboard_list = [
        {"rank": i + 1, "student_id": r["id"], "name": r["name"], "roll_no": r["roll_no"],
         "grade": r["predicted_grade"], "marks": r["final_marks"], "attendance": r["attendance"]}
        for i, r in enumerate(rows)
    ]
    return jsonify({"success": True, "leaderboard": leaderboard_list})


@analytics_bp.route("/progress/<int:student_id>", methods=["GET"])
@token_required
def student_progress(student_id):
    conn = get_db()
    student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        return jsonify({"success": False, "message": "Student not found"}), 404
    predictions = conn.execute(
        "SELECT * FROM predictions WHERE student_id = ? ORDER BY created_at ASC", (student_id,)
    ).fetchall()
    conn.close()

    progress = [
        {"date": p["created_at"], "final_marks": p["final_marks"], "grade": p["predicted_grade"],
         "confidence": p["confidence"], "algorithm": p["algorithm"]}
        for p in predictions
    ]
    return jsonify({"success": True, "student": dict(student), "progress": progress})
