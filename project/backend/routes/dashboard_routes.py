from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from database import get_db
from auth_utils import token_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/summary", methods=["GET"])
@token_required
def summary():
    conn = get_db()
    total_students = conn.execute("SELECT COUNT(*) c FROM students").fetchone()["c"]
    total_predictions = conn.execute("SELECT COUNT(*) c FROM predictions").fetchone()["c"]

    pass_count = conn.execute("SELECT COUNT(*) c FROM predictions WHERE result='Pass'").fetchone()["c"]
    fail_count = conn.execute("SELECT COUNT(*) c FROM predictions WHERE result='Fail'").fetchone()["c"]
    excellent = conn.execute("SELECT COUNT(*) c FROM predictions WHERE category='Excellent'").fetchone()["c"]
    average = conn.execute("SELECT COUNT(*) c FROM predictions WHERE category IN ('Average','Good')").fetchone()["c"]
    at_risk = conn.execute("SELECT COUNT(*) c FROM predictions WHERE is_at_risk=1").fetchone()["c"]

    pass_rate = round((pass_count / total_predictions) * 100, 1) if total_predictions else 0
    fail_rate = round((fail_count / total_predictions) * 100, 1) if total_predictions else 0

    # Grade distribution (latest prediction per student)
    grade_rows = conn.execute(
        """SELECT predicted_grade, COUNT(*) c FROM predictions
           GROUP BY predicted_grade ORDER BY predicted_grade"""
    ).fetchall()
    grade_distribution = [{"grade": r["predicted_grade"], "count": r["c"]} for r in grade_rows]

    category_rows = conn.execute(
        "SELECT category, COUNT(*) c FROM predictions GROUP BY category"
    ).fetchall()
    category_distribution = [{"category": r["category"], "count": r["c"]} for r in category_rows]

    # Monthly predictions for last 6 months
    monthly = []
    for i in range(5, -1, -1):
        month_start = (datetime.utcnow().replace(day=1) - timedelta(days=30 * i))
        label = month_start.strftime("%Y-%m")
        count = conn.execute(
            "SELECT COUNT(*) c FROM predictions WHERE substr(created_at,1,7) = ?", (label,)
        ).fetchone()["c"]
        monthly.append({"month": month_start.strftime("%b %Y"), "count": count})

    attendance_buckets = conn.execute(
        """SELECT
            SUM(CASE WHEN attendance < 60 THEN 1 ELSE 0 END) as low,
            SUM(CASE WHEN attendance >= 60 AND attendance < 75 THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN attendance >= 75 AND attendance < 90 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN attendance >= 90 THEN 1 ELSE 0 END) as excellent
           FROM students"""
    ).fetchone()
    attendance_analysis = [
        {"range": "< 60%", "count": attendance_buckets["low"] or 0},
        {"range": "60-75%", "count": attendance_buckets["medium"] or 0},
        {"range": "75-90%", "count": attendance_buckets["good"] or 0},
        {"range": "90-100%", "count": attendance_buckets["excellent"] or 0},
    ]

    study_buckets = conn.execute(
        """SELECT
            SUM(CASE WHEN study_hours < 2 THEN 1 ELSE 0 END) as low,
            SUM(CASE WHEN study_hours >= 2 AND study_hours < 4 THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN study_hours >= 4 AND study_hours < 6 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN study_hours >= 6 THEN 1 ELSE 0 END) as excellent
           FROM students"""
    ).fetchone()
    study_hours_analysis = [
        {"range": "< 2 hrs", "count": study_buckets["low"] or 0},
        {"range": "2-4 hrs", "count": study_buckets["medium"] or 0},
        {"range": "4-6 hrs", "count": study_buckets["good"] or 0},
        {"range": "6+ hrs", "count": study_buckets["excellent"] or 0},
    ]

    gender_rows = conn.execute("SELECT gender, COUNT(*) c FROM students GROUP BY gender").fetchall()
    gender_distribution = [{"gender": r["gender"], "count": r["c"]} for r in gender_rows]

    conn.close()

    return jsonify({
        "success": True,
        "cards": {
            "total_students": total_students,
            "total_predictions": total_predictions,
            "pass_rate": pass_rate,
            "fail_rate": fail_rate,
            "excellent_students": excellent,
            "average_students": average,
            "at_risk_students": at_risk,
        },
        "charts": {
            "grade_distribution": grade_distribution,
            "category_distribution": category_distribution,
            "pass_vs_fail": [{"name": "Pass", "value": pass_count}, {"name": "Fail", "value": fail_count}],
            "monthly_predictions": monthly,
            "attendance_analysis": attendance_analysis,
            "study_hours_analysis": study_hours_analysis,
            "gender_distribution": gender_distribution,
        },
    })
