# Project Report

## Student Performance Prediction & Classification System

*A Machine Learning-based Web Application for Academic Performance Analytics*

---

### Submitted in partial fulfilment of the requirements for the degree of
**Bachelor of Technology in Computer Science and Engineering**

*(Replace this page with your institution's official title page format —
name, roll number, guide name, department, university, and year.)*

---

## Abstract

Educational institutions generate large volumes of student data — attendance,
internal assessments, assignments, and historical marks — that is rarely
used proactively. This project, the **Student Performance Prediction &
Classification System (SPPS)**, applies supervised machine learning
(Random Forest and Decision Tree classifiers) to this data to predict a
student's likely grade and pass/fail outcome *before* final exams, so that
at-risk students can be identified and supported early. Beyond prediction,
the system implements **Explainable AI** so that every prediction is
accompanied by a transparent, ranked breakdown of the contributing factors —
addressing the "black box" criticism commonly leveled at ML-in-education
systems. The platform is delivered as a production-style full-stack web
application: a Flask REST API backend with JWT authentication and SQLite
persistence, and a React 18 single-page frontend with a modern,
glassmorphism-styled admin dashboard, interactive charts, PDF/email
reporting, and CSV import/export.

---

## 1. Introduction

### 1.1 Problem Statement
Faculty typically discover a struggling student only after mid-semester or
final results are published — too late for meaningful intervention. There
is a need for a system that can flag risk early, using signals that are
already being collected (attendance, internal marks, assignments, study
habits) but not being analyzed predictively.

### 1.2 Objectives
1. Predict a student's final grade and pass/fail outcome from mid-semester
   indicators using supervised ML.
2. Make every prediction explainable, not just accurate.
3. Automatically flag at-risk students and suggest concrete interventions.
4. Provide administrators a real dashboard: search, filter, bulk operate,
   visualize, export, and audit — not just a model demo.
5. Package the whole thing as a secure, role-based, multi-user web app.

### 1.3 Scope
Covers the full pipeline: data entry (manual + CSV bulk upload) → model
training → prediction → explanation → recommendation → reporting (PDF/email)
→ analytics/dashboard → audit logging.

---

## 2. Literature Review *(expand with your own citations)*

- Educational Data Mining (EDM) and Learning Analytics are established
  fields applying data mining to student data for outcome prediction.
- Tree-ensemble methods (Random Forest) are widely used for tabular
  educational data due to their robustness to noisy, mixed-scale features
  and their built-in feature-importance signal.
- Explainable AI (XAI) techniques such as SHAP (SHapley Additive
  exPlanations) address the interpretability gap in black-box models,
  which is particularly important in education where decisions affect
  real students and must be justifiable to faculty and parents.

---

## 3. System Analysis

### 3.1 Existing System
Manual review of mark sheets and attendance registers by faculty, typically
reactive (after result declaration) rather than predictive.

### 3.2 Proposed System
An automated, always-available prediction and early-warning system that
continuously scores students the moment new attendance/marks data is
entered, with a transparent explanation and a concrete action plan attached
to every flagged case.

### 3.3 Feasibility
- **Technical:** Uses mature, open-source technology (Flask, scikit-learn,
  React) — no proprietary dependencies.
- **Economic:** Zero licensing cost; SQLite requires no dedicated DB server
  for a college deployment.
- **Operational:** Familiar spreadsheet-like data entry (CSV bulk upload)
  minimizes training overhead for faculty.

---

## 4. System Design

See `docs/ARCHITECTURE.md` for the full architecture diagram, sequence
diagram, use-case diagram and application flowchart, and
`docs/DATABASE_SCHEMA.md` for the ER diagram and table definitions.

### 4.1 Modules
1. Authentication & Authorization Module
2. Student Management Module
3. Machine Learning Prediction Module
4. Explainable AI Module
5. Recommendation Engine
6. Early Warning System
7. Dashboard & Analytics Module
8. Reporting Module (PDF/Email/CSV)
9. Activity Logging Module

---

## 5. Machine Learning Methodology

### 5.1 Dataset
A synthetically generated dataset of 3,000 student records was used,
constructed from a realistic weighted formula over six features
(Attendance, Internal Marks, Assignment Score, Study Hours, Previous
Semester Marks, Age) with Gaussian noise added, so relationships mirror
real academic outcomes without requiring an external, potentially
non-redistributable dataset. See `backend/ml/train_model.py`.

### 5.2 Feature Set
| Feature | Approx. Weight in Ground Truth |
|---|---|
| Attendance | 36% |
| Internal Marks | 28% |
| Assignment Score | 15% |
| Study Hours | 10% |
| Previous Semester Marks | 8% |
| Age | 3% |

### 5.3 Models
- **Random Forest Classifier** (250 trees, max depth 10, balanced class
  weights) — primary model, generally higher accuracy and more stable
  feature importances due to ensembling.
- **Decision Tree Classifier** (max depth 8, balanced class weights) —
  offered as an interpretable, lower-variance-of-training-time alternative;
  a single tree is easier to visualize/reason about directly, at some cost
  to accuracy.
- **Random Forest Regressor** — separately estimates the numeric final
  marks (not just the letter grade).

### 5.4 Evaluation
80/20 stratified train/test split. Metrics captured: Accuracy, macro
Precision, macro Recall, macro F1-score, and the full confusion matrix —
all exposed live via `GET /api/predictions/model-comparison` and rendered
on the Model Comparison page. *(Insert your actual run's numbers here —
they are printed to console by `train_model.py` and saved to
`ml/saved_models/metrics.json`.)*

### 5.5 Explainability
Global importances come directly from scikit-learn's
`feature_importances_`. Per-student explanations use a documented,
SHAP-style approximation (see `README.md` §5–6) that weights each
feature's deviation from the population mean by its global importance,
normalized to 100%.

---

## 6. Implementation

Backend: Flask, organized into one blueprint per resource (`auth`,
`students`, `predictions`, `dashboard`, `analytics`, `reports`, `logs`).
JWT-based stateless authentication; passwords hashed with PBKDF2-SHA256.
Frontend: React 18 + Vite SPA, Tailwind CSS for styling, Recharts for
charts, Framer Motion for animation, React Hook Form for form state/
validation, Axios for HTTP with a global auth interceptor.

*(Insert code screenshots / key snippets here for your written submission.)*

---

## 7. Testing

- **Manual/API testing:** every endpoint was exercised via `curl` during
  development (auth, CRUD, prediction, model comparison, leaderboard, PDF
  generation) — see the smoke-test transcript retained in project history.
- **Validation testing:** server-side field validation rejects out-of-range
  attendance/marks, missing required fields, and duplicate roll numbers /
  emails, independent of client-side checks.
- **Suggested additions for your submission:** unit tests for
  `ml/predict.py` (e.g., assert `result == "Fail"` implies `is_at_risk`),
  and Postman/pytest collections for the REST API.

---

## 8. Results & Discussion

*(Fill in after running `python ml/train_model.py` in your own environment
and taking dashboard/screenshot evidence — this template intentionally
leaves numeric results for your actual training run rather than fabricating
figures.)*

---

## 9. Conclusion & Future Scope

SPPS demonstrates that a genuinely useful, explainable, early-warning
academic analytics tool can be built end-to-end with an open-source stack
and a modest, well-understood dataset. Future work: swap the synthetic
dataset for a real (anonymized) institutional dataset; add a
`shap.TreeExplainer` for exact Shapley values; add WebSocket-based
real-time dashboard updates; extend prediction to subject-wise granularity
rather than a single composite grade.

---

## 10. References

*(Add your citations — EDM/Learning Analytics literature, scikit-learn
documentation, Flask documentation, React documentation, SHAP paper
(Lundberg & Lee, 2017), etc.)*
