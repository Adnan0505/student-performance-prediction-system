"""
Trains the classification models (grade prediction) and a regression model
(final marks estimate) used by the Student Performance Prediction System.

A synthetic dataset is generated using a weighted, noisy formula that mirrors
real academic outcomes (attendance and internal marks matter most, age matters
least). This keeps the project fully self-contained and reproducible without
requiring an external dataset download.

Run:  python ml/train_model.py
Outputs (in ml/saved_models/):
    rf_classifier.joblib, dt_classifier.joblib   -> grade classifiers
    rf_regressor.joblib                          -> final marks estimator
    scaler.joblib                                -> StandardScaler
    metrics.json                                 -> accuracy/precision/recall/f1/confusion matrix
    feature_importance.json                      -> global importances per model
"""
import os
import json
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)

# Naye fields ko FEATURES list me add kar diya gaya hai
FEATURES = [
    "attendance", "internal_marks", "assignment_score",
    "study_hours", "previous_marks", "age",
    "ca1", "ca2", "ca3", "ca4", "pca1", "pca2"
]
GRADES = ["F", "D", "C", "B", "A"]

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)


def generate_dataset(n=3000, seed=42):
    rng = np.random.default_rng(seed)

    attendance = np.clip(rng.normal(78, 15, n), 30, 100)
    internal_marks = np.clip(rng.normal(60, 18, n), 0, 100)
    assignment_score = np.clip(rng.normal(65, 20, n), 0, 100)
    study_hours = np.clip(rng.normal(3.2, 1.8, n), 0, 10)
    previous_marks = np.clip(rng.normal(62, 16, n), 0, 100)
    age = rng.integers(17, 24, n)

    # Naye CA marks (Max 25 ke scale par generate kiye hain)
    ca1 = np.clip(rng.normal(18, 4, n), 0, 25)
    ca2 = np.clip(rng.normal(18, 4, n), 0, 25)
    ca3 = np.clip(rng.normal(18, 4, n), 0, 25)
    ca4 = np.clip(rng.normal(18, 4, n), 0, 25)
    
    # Naye PCA marks (Max 40 ke scale par generate kiye hain)
    pca1 = np.clip(rng.normal(30, 6, n), 0, 40)
    pca2 = np.clip(rng.normal(30, 6, n), 0, 40)

    # Weighted composite score updated to include new CA and PCA marks.
    # Total weights sum up to exactly 1.0 (or 100%)
    composite = (
        0.20 * attendance +
        0.10 * internal_marks +
        0.10 * assignment_score +
        0.10 * (study_hours / 10 * 100) +
        0.05 * previous_marks +
        0.05 * (100 - np.abs(age - 20) * 8) +
        0.05 * (ca1 * 4) +  # ca1 is out of 25, multiplied by 4 to scale to 100
        0.05 * (ca2 * 4) +
        0.05 * (ca3 * 4) +
        0.05 * (ca4 * 4) +
        0.10 * (pca1 * 2.5) + # pca is out of 40, multiplied by 2.5 to scale to 100
        0.10 * (pca2 * 2.5)
    )
    composite += rng.normal(0, 5, n)  # noise
    composite = np.clip(composite, 0, 100)

    final_marks = composite

    grade = np.select(
        [composite >= 85, composite >= 70, composite >= 55, composite >= 40],
        ["A", "B", "C", "D"],
        default="F",
    )

    data = {
        "attendance": attendance,
        "internal_marks": internal_marks,
        "assignment_score": assignment_score,
        "study_hours": study_hours,
        "previous_marks": previous_marks,
        "age": age.astype(float),
        "ca1": ca1,
        "ca2": ca2,
        "ca3": ca3,
        "ca4": ca4,
        "pca1": pca1,
        "pca2": pca2,
        "final_marks": final_marks,
        "grade": grade,
    }
    return data


def compute_metrics(y_true, y_pred, labels):
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "recall": round(recall_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "f1_score": round(f1_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        "labels": labels,
    }


def main():
    data = generate_dataset()
    X = np.column_stack([data[f] for f in FEATURES])
    y_grade = data["grade"]
    y_marks = data["final_marks"]

    X_train, X_test, yg_train, yg_test, ym_train, ym_test = train_test_split(
        X, y_grade, y_marks, test_size=0.2, random_state=42, stratify=y_grade
    )

    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)

    rf_clf = RandomForestClassifier(
        n_estimators=250, max_depth=10, random_state=42, class_weight="balanced"
    )
    rf_clf.fit(X_train_s, yg_train)

    dt_clf = DecisionTreeClassifier(
        max_depth=8, random_state=42, class_weight="balanced"
    )
    dt_clf.fit(X_train_s, yg_train)

    rf_reg = RandomForestRegressor(n_estimators=250, max_depth=10, random_state=42)
    rf_reg.fit(X_train_s, ym_train)

    labels = sorted(set(y_grade), key=lambda g: GRADES.index(g))
    metrics = {
        "random_forest": compute_metrics(yg_test, rf_clf.predict(X_test_s), labels),
        "decision_tree": compute_metrics(yg_test, dt_clf.predict(X_test_s), labels),
        "trained_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
    }

    feature_importance = {
        "random_forest": {f: round(float(w), 4) for f, w in zip(FEATURES, rf_clf.feature_importances_)},
        "decision_tree": {f: round(float(w), 4) for f, w in zip(FEATURES, dt_clf.feature_importances_)},
    }

    joblib.dump(rf_clf, os.path.join(MODELS_DIR, "rf_classifier.joblib"))
    joblib.dump(dt_clf, os.path.join(MODELS_DIR, "dt_classifier.joblib"))
    joblib.dump(rf_reg, os.path.join(MODELS_DIR, "rf_regressor.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))

    with open(os.path.join(MODELS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    with open(os.path.join(MODELS_DIR, "feature_importance.json"), "w") as f:
        json.dump(feature_importance, f, indent=2)
    with open(os.path.join(MODELS_DIR, "features.json"), "w") as f:
        json.dump(FEATURES, f)

    print("Training complete. The AI model is now aware of CA and PCA marks!")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()