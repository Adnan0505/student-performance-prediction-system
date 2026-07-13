import os
import json
import time
import joblib
import numpy as np
from config import Config

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

_cache = {}


def _load():
    if _cache:
        return _cache
    _cache["rf_clf"] = joblib.load(os.path.join(MODELS_DIR, "rf_classifier.joblib"))
    _cache["dt_clf"] = joblib.load(os.path.join(MODELS_DIR, "dt_classifier.joblib"))
    _cache["rf_reg"] = joblib.load(os.path.join(MODELS_DIR, "rf_regressor.joblib"))
    _cache["scaler"] = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
    with open(os.path.join(MODELS_DIR, "features.json")) as f:
        _cache["features"] = json.load(f)
    with open(os.path.join(MODELS_DIR, "feature_importance.json")) as f:
        _cache["feature_importance"] = json.load(f)
    with open(os.path.join(MODELS_DIR, "metrics.json")) as f:
        _cache["metrics"] = json.load(f)
    return _cache


def get_metrics():
    return _load()["metrics"]


def get_global_feature_importance(algorithm):
    key = "random_forest" if algorithm == "random_forest" else "decision_tree"
    return _load()["feature_importance"][key]


# Naye fields ke friendly names yahan add kar diye gaye hain
FRIENDLY_NAMES = {
    "attendance": "Attendance",
    "internal_marks": "Internal Marks",
    "assignment_score": "Assignment Score",
    "study_hours": "Study Hours",
    "previous_marks": "Previous Semester Marks",
    "age": "Age",
    "ca1": "CA 1 Marks",
    "ca2": "CA 2 Marks",
    "ca3": "CA 3 Marks",
    "ca4": "CA 4 Marks",
    "pca1": "PCA 1 (Practical)",
    "pca2": "PCA 2 (Practical)",
}


def _per_student_explanation(student, algorithm):
    """
    Lightweight, model-agnostic per-instance explanation, computed without the
    `shap` package (unavailable in this offline environment). It approximates
    SHAP's intuition — "how far this student's value is from the training
    population average, weighted by how important the model considers that
    feature" — normalised to sum to 100%. This is documented in the README as
    a SHAP-style approximation, not a literal SHAP value.
    """
    c = _load()
    features = c["features"]
    global_importance = get_global_feature_importance(algorithm)

    # Naye CA/PCA ki population means add ki gayi hain
    baseline = {
        "attendance": 78, "internal_marks": 60, "assignment_score": 65,
        "study_hours": 3.2, "previous_marks": 62, "age": 20,
        "ca1": 18, "ca2": 18, "ca3": 18, "ca4": 18,
        "pca1": 30, "pca2": 30,
    }
    
    # Naye CA/PCA ka spread (standard deviation) add kiya gaya hai
    spread = {
        "attendance": 15, "internal_marks": 18, "assignment_score": 20,
        "study_hours": 1.8, "previous_marks": 16, "age": 3,
        "ca1": 4, "ca2": 4, "ca3": 4, "ca4": 4,
        "pca1": 6, "pca2": 6,
    }

    raw_scores = {}
    for f in features:
        deviation = (student[f] - baseline[f]) / spread[f]
        raw_scores[f] = abs(deviation) * global_importance.get(f, 0.01) + 0.001

    total = sum(raw_scores.values())
    contribution_pct = {f: round(v / total * 100, 1) for f, v in raw_scores.items()}

    direction = {}
    for f in features:
        if f == "age":
            direction[f] = "neutral"
        else:
            direction[f] = "positive" if student[f] >= baseline[f] else "negative"

    ranked = sorted(contribution_pct.items(), key=lambda kv: kv[1], reverse=True)
    return {
        "contribution_pct": contribution_pct,
        "direction": direction,
        "ranked_factors": [{"feature": FRIENDLY_NAMES.get(f, f), "key": f, "percent": p} for f, p in ranked],
        "most_important_factor": FRIENDLY_NAMES.get(ranked[0][0], ranked[0][0]),
    }


def _generate_recommendations(student):
    recs = []
    if student.get("attendance", 100) < Config.AT_RISK_ATTENDANCE:
        recs.append({
            "issue": f"Attendance is below {Config.AT_RISK_ATTENDANCE}% ({student.get('attendance', 0):.0f}%).",
            "recommendation": "Increase attendance to improve final performance. Aim for at least 85%.",
        })
    if student.get("internal_marks", 100) < Config.AT_RISK_INTERNAL_MARKS:
        recs.append({
            "issue": f"Internal marks are low ({student.get('internal_marks', 0):.0f}/100).",
            "recommendation": "Attend doubt-clearing sessions and revise core topics weekly.",
        })
    if student.get("study_hours", 10) < Config.AT_RISK_STUDY_HOURS + 1:
        recs.append({
            "issue": f"Study hours are low ({student.get('study_hours', 0):.1f} hrs/day).",
            "recommendation": "Study at least 5 hours daily with a structured timetable.",
        })
    if student.get("assignment_score", 100) < 50:
        recs.append({
            "issue": f"Assignment score is low ({student.get('assignment_score', 0):.0f}/100).",
            "recommendation": "Complete all pending assignments before the next exam cycle.",
        })
    if student.get("previous_marks", 100) < 50:
        recs.append({
            "issue": f"Previous semester marks were weak ({student.get('previous_marks', 0):.0f}/100).",
            "recommendation": "Revisit foundational concepts from the previous semester.",
        })
        
    # Nayi recommendation: Agar average CA marks 12 se kam hain (out of 25)
    avg_ca = (student.get("ca1", 20) + student.get("ca2", 20) + student.get("ca3", 20) + student.get("ca4", 20)) / 4
    if avg_ca < 12:
        recs.append({
            "issue": f"Average Continuous Assessment (CA) scores are low ({avg_ca:.1f}/25).",
            "recommendation": "Focus heavily on upcoming CA tests. Review regular syllabus systematically.",
        })

    # Nayi recommendation: Agar average PCA marks 20 se kam hain (out of 40)
    avg_pca = (student.get("pca1", 30) + student.get("pca2", 30)) / 2
    if avg_pca < 20:
        recs.append({
            "issue": f"Practical (PCA) scores are at risk ({avg_pca:.1f}/40).",
            "recommendation": "Spend extra time in lab sessions. Ensure all practical files are complete.",
        })

    if not recs:
        recs.append({
            "issue": "No significant weak areas detected.",
            "recommendation": "Maintain current study routine and continue consistent performance.",
        })
    return recs


def _risk_assessment(student, result):
    reasons = []
    if student.get("attendance", 100) < Config.AT_RISK_ATTENDANCE:
        reasons.append("Low Attendance")
    if student.get("internal_marks", 100) < Config.AT_RISK_INTERNAL_MARKS:
        reasons.append("Low Internal Marks")
    if student.get("study_hours", 10) < Config.AT_RISK_STUDY_HOURS + 1:
        reasons.append("Low Study Hours")
        
    # Naye risk parameters
    avg_ca = (student.get("ca1", 20) + student.get("ca2", 20) + student.get("ca3", 20) + student.get("ca4", 20)) / 4
    if avg_ca < 10:
        reasons.append("Poor CA Performance")
    
    avg_pca = (student.get("pca1", 30) + student.get("pca2", 30)) / 2
    if avg_pca < 18:
        reasons.append("Poor Practical Performance")

    if result == "Fail":
        reasons.append("Predicted to Fail")

    is_at_risk = len(reasons) >= 2 or result == "Fail"
    actions = []
    if is_at_risk:
        actions = ["Extra Classes", "Faculty Counselling", "Parent Notification"]
    return is_at_risk, reasons, actions


def _category(grade, is_at_risk):
    if is_at_risk:
        return "At Risk"
    return {"A": "Excellent", "B": "Good", "C": "Average", "D": "Average", "F": "At Risk"}.get(grade, "Average")


def predict(student, algorithm="random_forest"):
    """
    student: dict with keys attendance, internal_marks, assignment_score,
             study_hours, previous_marks, age, ca1-4, pca1-2
    algorithm: "random_forest" | "decision_tree"
    """
    start = time.perf_counter()
    c = _load()
    features = c["features"]
    model = c["rf_clf"] if algorithm == "random_forest" else c["dt_clf"]

    X = np.array([[student[f] for f in features]])
    X_scaled = c["scaler"].transform(X)

    grade = model.predict(X_scaled)[0]
    proba = model.predict_proba(X_scaled)[0]
    confidence = round(float(np.max(proba)) * 100, 2)

    final_marks = round(float(c["rf_reg"].predict(X_scaled)[0]), 2)
    result = "Fail" if grade == "F" else "Pass"

    is_at_risk, risk_reasons, suggested_actions = _risk_assessment(student, result)
    category = _category(grade, is_at_risk)
    recommendations = _generate_recommendations(student)
    explanation = _per_student_explanation(student, algorithm)
    global_importance = get_global_feature_importance(algorithm)

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    return {
        "algorithm": algorithm,
        "predicted_grade": grade,
        "result": result,
        "category": category,
        "final_marks": final_marks,
        "confidence": confidence,
        "is_at_risk": is_at_risk,
        "risk_reasons": risk_reasons,
        "suggested_actions": suggested_actions,
        "recommendations": recommendations,
        "feature_importance": global_importance,
        "explanation": explanation,
        "prediction_time_ms": elapsed_ms,
        "probabilities": {cls: round(float(p) * 100, 2) for cls, p in zip(model.classes_, proba)},
    }