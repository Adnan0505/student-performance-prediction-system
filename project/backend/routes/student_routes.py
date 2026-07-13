import csv
import io
from datetime import datetime
from flask import Blueprint, request, jsonify, g, Response

from database import get_db, log_activity
from auth_utils import token_required, admin_required

student_bp = Blueprint("students", __name__, url_prefix="/api/students")

# Yahan naye fields ko required list me add kiya hai
REQUIRED_FIELDS = ["name", "roll_no", "gender", "age", "attendance",
                   "internal_marks", "assignment_score", "study_hours", "previous_marks",
                   "ca1", "ca2", "ca3", "ca4", "pca1", "pca2"]


def _validate_payload(data):
    errors = []
    for field in REQUIRED_FIELDS:
        if data.get(field) in (None, ""):
            errors.append(f"'{field}' is required")
    try:
        age = int(data.get("age", 0))
        if not (10 <= age <= 100):
            errors.append("age must be between 10 and 100")
    except (ValueError, TypeError):
        errors.append("age must be a number")
        
    for f in ["attendance", "internal_marks", "assignment_score", "previous_marks"]:
        try:
            v = float(data.get(f, 0))
            if not (0 <= v <= 100):
                errors.append(f"{f} must be between 0 and 100")
        except (ValueError, TypeError):
            errors.append(f"{f} must be a number")
            
    # CA fields strict validation (0 to 25)
    for f in ["ca1", "ca2", "ca3", "ca4"]:
        try:
            v = float(data.get(f, 0))
            if not (0 <= v <= 25):
                errors.append(f"{f} must be between 0 and 25")
        except (ValueError, TypeError):
            errors.append(f"{f} must be a number")
            
    # PCA fields strict validation (0 to 40)
    for f in ["pca1", "pca2"]:
        try:
            v = float(data.get(f, 0))
            if not (0 <= v <= 40):
                errors.append(f"{f} must be between 0 and 40")
        except (ValueError, TypeError):
            errors.append(f"{f} must be a number")
            
    try:
        sh = float(data.get("study_hours", 0))
        if not (0 <= sh <= 24):
            errors.append("study_hours must be between 0 and 24")
    except (ValueError, TypeError):
        errors.append("study_hours must be a number")
        
    if data.get("gender") not in ("Male", "Female", "Other"):
        errors.append("gender must be Male, Female or Other")
    return errors


def _row_to_dict(row):
    return dict(row)


@student_bp.route("", methods=["GET"])
@token_required
def list_students():
    search = request.args.get("search", "").strip()
    gender = request.args.get("gender", "")
    page = max(int(request.args.get("page", 1)), 1)
    page_size = min(max(int(request.args.get("page_size", 10)), 1), 100)
    sort_by = request.args.get("sort_by", "created_at")
    sort_dir = request.args.get("sort_dir", "desc").upper()
    sort_dir = "DESC" if sort_dir not in ("ASC", "DESC") else sort_dir

    allowed_sort = {"name", "roll_no", "attendance", "internal_marks",
                    "previous_marks", "created_at", "age"}
    if sort_by not in allowed_sort:
        sort_by = "created_at"

    conn = get_db()
    where = []
    params = []
    if search:
        where.append("(name LIKE ? OR roll_no LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    if gender:
        where.append("gender = ?")
        params.append(gender)
    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    total = conn.execute(f"SELECT COUNT(*) c FROM students {where_sql}", params).fetchone()["c"]
    rows = conn.execute(
        f"SELECT * FROM students {where_sql} ORDER BY {sort_by} {sort_dir} LIMIT ? OFFSET ?",
        params + [page_size, (page - 1) * page_size],
    ).fetchall()
    conn.close()

    return jsonify({
        "success": True,
        "students": [_row_to_dict(r) for r in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total,
                       "total_pages": max((total + page_size - 1) // page_size, 1)},
    })


@student_bp.route("/<int:student_id>", methods=["GET"])
@token_required
def get_student(student_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    predictions = conn.execute(
        "SELECT * FROM predictions WHERE student_id = ? ORDER BY created_at DESC", (student_id,)
    ).fetchall()
    conn.close()
    if not row:
        return jsonify({"success": False, "message": "Student not found"}), 404
    return jsonify({
        "success": True,
        "student": _row_to_dict(row),
        "predictions": [_row_to_dict(p) for p in predictions],
    })


@student_bp.route("", methods=["POST"])
@token_required
@admin_required
def create_student():
    data = request.get_json(force=True) or {}
    errors = _validate_payload(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed", "errors": errors}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM students WHERE roll_no = ?", (data["roll_no"],)).fetchone()
    if existing:
        conn.close()
        return jsonify({"success": False, "message": "Roll number already exists"}), 409

    now = datetime.utcnow().isoformat()
    # Naye fields INSERT statement me add kiye
    cur = conn.execute(
        """INSERT INTO students (name, roll_no, gender, age, attendance, internal_marks,
           assignment_score, study_hours, previous_marks, ca1, ca2, ca3, ca4, pca1, pca2, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["name"], data["roll_no"], data["gender"], int(data["age"]),
         float(data["attendance"]), float(data["internal_marks"]), float(data["assignment_score"]),
         float(data["study_hours"]), float(data["previous_marks"]),
         float(data["ca1"]), float(data["ca2"]), float(data["ca3"]), float(data["ca4"]),
         float(data["pca1"]), float(data["pca2"]), now, now),
    )
    conn.commit()
    new_id = cur.lastrowid
    row = conn.execute("SELECT * FROM students WHERE id = ?", (new_id,)).fetchone()
    conn.close()

    log_activity(g.current_user["user_id"], g.current_user["name"], "Student Added", data["name"])
    return jsonify({"success": True, "message": "Student added", "student": _row_to_dict(row)}), 201


@student_bp.route("/<int:student_id>", methods=["PUT"])
@token_required
@admin_required
def update_student(student_id):
    data = request.get_json(force=True) or {}
    errors = _validate_payload(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed", "errors": errors}), 400

    conn = get_db()
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "Student not found"}), 404

    dup = conn.execute("SELECT id FROM students WHERE roll_no = ? AND id != ?",
                        (data["roll_no"], student_id)).fetchone()
    if dup:
        conn.close()
        return jsonify({"success": False, "message": "Roll number already used by another student"}), 409

    # Naye fields UPDATE statement me add kiye
    conn.execute(
        """UPDATE students SET name=?, roll_no=?, gender=?, age=?, attendance=?, internal_marks=?,
           assignment_score=?, study_hours=?, previous_marks=?, ca1=?, ca2=?, ca3=?, ca4=?, pca1=?, pca2=?, updated_at=? WHERE id=?""",
        (data["name"], data["roll_no"], data["gender"], int(data["age"]),
         float(data["attendance"]), float(data["internal_marks"]), float(data["assignment_score"]),
         float(data["study_hours"]), float(data["previous_marks"]),
         float(data["ca1"]), float(data["ca2"]), float(data["ca3"]), float(data["ca4"]),
         float(data["pca1"]), float(data["pca2"]), datetime.utcnow().isoformat(), student_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()

    log_activity(g.current_user["user_id"], g.current_user["name"], "Student Updated", data["name"])
    return jsonify({"success": True, "message": "Student updated", "student": _row_to_dict(updated)})


@student_bp.route("/<int:student_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_student(student_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "Student not found"}), 404
    conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    log_activity(g.current_user["user_id"], g.current_user["name"], "Student Deleted", row["name"])
    return jsonify({"success": True, "message": "Student deleted"})


@student_bp.route("/bulk-upload", methods=["POST"])
@token_required
@admin_required
def bulk_upload():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400
    file = request.files["file"]
    try:
        content = file.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        return jsonify({"success": False, "message": "File must be UTF-8 encoded CSV"}), 400

    reader = csv.DictReader(io.StringIO(content))
    conn = get_db()
    created, skipped, row_errors = 0, 0, []
    now = datetime.utcnow().isoformat()

    for i, row in enumerate(reader, start=2):
        errs = _validate_payload(row)
        if errs:
            row_errors.append({"row": i, "errors": errs})
            continue
        exists = conn.execute("SELECT id FROM students WHERE roll_no = ?", (row["roll_no"],)).fetchone()
        if exists:
            skipped += 1
            continue
        # Naye fields BULK INSERT me add kiye
        conn.execute(
            """INSERT INTO students (name, roll_no, gender, age, attendance, internal_marks,
               assignment_score, study_hours, previous_marks, ca1, ca2, ca3, ca4, pca1, pca2, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (row["name"], row["roll_no"], row["gender"], int(float(row["age"])),
             float(row["attendance"]), float(row["internal_marks"]), float(row["assignment_score"]),
             float(row["study_hours"]), float(row["previous_marks"]),
             float(row["ca1"]), float(row["ca2"]), float(row["ca3"]), float(row["ca4"]),
             float(row["pca1"]), float(row["pca2"]), now, now),
        )
        created += 1
    conn.commit()
    conn.close()

    log_activity(g.current_user["user_id"], g.current_user["name"], "Bulk Student Upload",
                 f"{created} created, {skipped} skipped, {len(row_errors)} errors")
    return jsonify({
        "success": True,
        "message": f"{created} students added, {skipped} skipped (duplicate roll no), {len(row_errors)} rows had errors",
        "created": created, "skipped": skipped, "row_errors": row_errors,
    })


@student_bp.route("/export/csv", methods=["GET"])
@token_required
def export_csv():
    conn = get_db()
    rows = conn.execute("SELECT * FROM students ORDER BY name").fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    # Export CSV me naye columns add kiye
    columns = ["id", "name", "roll_no", "gender", "age", "attendance", "internal_marks",
               "assignment_score", "study_hours", "previous_marks",
               "ca1", "ca2", "ca3", "ca4", "pca1", "pca2", "created_at", "updated_at"]
    writer.writerow(columns)
    for r in rows:
        writer.writerow([r[c] for c in columns])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_export.csv"},
    )


@student_bp.route("/template/csv", methods=["GET"])
@token_required
def csv_template():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(REQUIRED_FIELDS)
    # Template me dummy numbers daal diye naye fields ke liye
    writer.writerow(["Jane Doe", "CS2024-101", "Female", 20, 88, 76, 82, 4.5, 79, 21, 23, 19, 24, 35, 38])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_upload_template.csv"},
    )