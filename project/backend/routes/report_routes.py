import json
from flask import Blueprint, request, jsonify, g, send_file

from database import get_db, log_activity
from auth_utils import token_required
from utils.pdf_generator import generate_prediction_pdf
from utils.mailer import send_prediction_report_email

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _load_prediction_bundle(prediction_id):
    conn = get_db()
    row = conn.execute(
        """SELECT p.*, s.name as s_name, s.roll_no as s_roll, s.gender as s_gender, s.age as s_age,
                  s.attendance as s_attendance, s.internal_marks as s_internal_marks,
                  s.assignment_score as s_assignment_score, s.study_hours as s_study_hours,
                  s.previous_marks as s_previous_marks
           FROM predictions p JOIN students s ON s.id = p.student_id WHERE p.id = ?""",
        (prediction_id,),
    ).fetchone()
    conn.close()
    if not row:
        return None, None

    student = {
        "name": row["s_name"], "roll_no": row["s_roll"], "gender": row["s_gender"], "age": row["s_age"],
        "attendance": row["s_attendance"], "internal_marks": row["s_internal_marks"],
        "assignment_score": row["s_assignment_score"], "study_hours": row["s_study_hours"],
        "previous_marks": row["s_previous_marks"],
    }
    prediction = {
        "algorithm": row["algorithm"], "predicted_grade": row["predicted_grade"], "result": row["result"],
        "category": row["category"], "final_marks": row["final_marks"], "confidence": row["confidence"],
        "is_at_risk": bool(row["is_at_risk"]),
        "risk_reasons": json.loads(row["risk_reasons"]) if row["risk_reasons"] else [],
        "suggested_actions": [],
        "recommendations": json.loads(row["recommendations"]) if row["recommendations"] else [],
        "explanation": json.loads(row["explanation"]) if row["explanation"] else {},
        "prediction_time_ms": row["prediction_time_ms"],
    }
    return student, prediction


@report_bp.route("/pdf/<int:prediction_id>", methods=["GET"])
@token_required
def download_pdf(prediction_id):
    student, prediction = _load_prediction_bundle(prediction_id)
    if not student:
        return jsonify({"success": False, "message": "Prediction not found"}), 404

    path = generate_prediction_pdf(student, prediction)
    log_activity(g.current_user["user_id"], g.current_user["name"], "PDF Exported", student["name"])
    return send_file(path, as_attachment=True, download_name=f"{student['roll_no']}_report.pdf")


@report_bp.route("/email/<int:prediction_id>", methods=["POST"])
@token_required
def email_report(prediction_id):
    data = request.get_json(silent=True) or {}
    to_email = data.get("email")
    student, prediction = _load_prediction_bundle(prediction_id)
    if not student:
        return jsonify({"success": False, "message": "Prediction not found"}), 404
    if not to_email:
        return jsonify({"success": False, "message": "Recipient email is required"}), 400

    path = generate_prediction_pdf(student, prediction)
    sent = send_prediction_report_email(to_email, student["name"], prediction, path)

    log_activity(g.current_user["user_id"], g.current_user["name"], "Email Sent",
                 f"Report for {student['name']} to {to_email}")

    if sent:
        return jsonify({"success": True, "message": "Email sent successfully"})
    return jsonify({
        "success": False,
        "message": "SMTP is not configured on the server (set SMTP_HOST/SMTP_USER/SMTP_PASS in .env). "
                    "The PDF was generated and can still be downloaded.",
    }), 200
