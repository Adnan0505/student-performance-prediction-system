"""
Populates the database with realistic demo students and runs predictions on
each of them, so charts/leaderboard/history are populated immediately after
setup instead of showing empty states.

Run:  python seed_demo_data.py
"""
import random
from datetime import datetime, timedelta
from database import init_db, get_db, log_activity
from ml import predict as ml_predict
import json

FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Rohan", "Ananya", "Diya", "Saanvi",
               "Myra", "Kiara", "Arjun", "Kabir", "Meera", "Priya", "Riya", "Sara",
               "Aryan", "Dev", "Neha", "Pooja", "Karan", "Simran", "Yash", "Tanvi"]
LAST_NAMES = ["Sharma", "Verma", "Patel", "Gupta", "Iyer", "Reddy", "Nair", "Singh",
              "Rao", "Mehta", "Kapoor", "Bose", "Chatterjee", "Das", "Malhotra"]


def seed():
    init_db()
    conn = get_db()
    existing = conn.execute("SELECT COUNT(*) c FROM students").fetchone()["c"]
    if existing > 0:
        print(f"Database already has {existing} students — skipping seed.")
        conn.close()
        return

    rng = random.Random(7)
    now = datetime.utcnow()

    for i in range(1, 61):
        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        roll_no = f"CS2024-{100 + i}"
        gender = rng.choice(["Male", "Female"])
        age = rng.randint(18, 23)
        attendance = round(max(30, min(100, rng.gauss(78, 15))), 1)
        internal_marks = round(max(0, min(100, rng.gauss(60, 18))), 1)
        assignment_score = round(max(0, min(100, rng.gauss(65, 20))), 1)
        study_hours = round(max(0, min(10, rng.gauss(3.2, 1.8))), 1)
        previous_marks = round(max(0, min(100, rng.gauss(62, 16))), 1)

        created = (now - timedelta(days=rng.randint(0, 150))).isoformat()
        cur = conn.execute(
            """INSERT INTO students (name, roll_no, gender, age, attendance, internal_marks,
               assignment_score, study_hours, previous_marks, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, roll_no, gender, age, attendance, internal_marks, assignment_score,
             study_hours, previous_marks, created, created),
        )
        student_id = cur.lastrowid
        conn.commit()

        student_row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        algorithm = rng.choice(["random_forest", "decision_tree"])
        features = {
            "attendance": student_row["attendance"], "internal_marks": student_row["internal_marks"],
            "assignment_score": student_row["assignment_score"], "study_hours": student_row["study_hours"],
            "previous_marks": student_row["previous_marks"], "age": student_row["age"],
        }
        result = ml_predict.predict(features, algorithm)
        pred_created = (now - timedelta(days=rng.randint(0, 120))).isoformat()

        conn.execute(
            """INSERT INTO predictions (student_id, algorithm, predicted_grade, result, category,
               final_marks, confidence, is_at_risk, risk_reasons, recommendations, feature_importance,
               explanation, prediction_time_ms, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (student_id, result["algorithm"], result["predicted_grade"], result["result"], result["category"],
             result["final_marks"], result["confidence"], int(result["is_at_risk"]),
             json.dumps(result["risk_reasons"]), json.dumps(result["recommendations"]),
             json.dumps(result["feature_importance"]), json.dumps(result["explanation"]),
             result["prediction_time_ms"], pred_created),
        )
        conn.commit()

    conn.close()
    log_activity(None, "System", "Demo Data Seeded", "60 students with predictions")
    print("Seeded 60 demo students with predictions.")


if __name__ == "__main__":
    seed()
