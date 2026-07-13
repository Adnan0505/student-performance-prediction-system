# PPT Content — Student Performance Prediction & Classification System

*Copy each slide's content into your presentation tool of choice (PowerPoint /
Google Slides / Canva). Suggested: 14–16 slides for a 10–12 minute viva.*

---

**Slide 1 — Title**
Student Performance Prediction & Classification System
An AI-Powered Academic Early-Warning Platform
[Your Name] · [Roll No.] · [Guide Name] · [Department, University, Year]

**Slide 2 — Problem Statement**
- Struggling students are usually identified only after results are declared
- Attendance, internal marks, and assignment data already exist but aren't used predictively
- Faculty need an early, explainable signal — not just a final score

**Slide 3 — Objectives**
1. Predict grade & pass/fail before final exams
2. Explain *why*, not just *what* (Explainable AI)
3. Auto-detect at-risk students with actionable recommendations
4. Deliver as a real, secure, multi-user web platform

**Slide 4 — Tech Stack**
- Frontend: React 18, Vite, Tailwind CSS, Recharts, Framer Motion
- Backend: Python Flask, JWT Auth, REST API
- ML: scikit-learn — Random Forest & Decision Tree
- Reports: ReportLab (PDF), SMTP (Email)
- Database: SQLite

**Slide 5 — System Architecture**
[Insert the architecture diagram from docs/ARCHITECTURE.md]
Client (React SPA) → Flask REST API → SQLite + ML Layer + Report Layer

**Slide 6 — Database Design**
[Insert ER diagram from docs/DATABASE_SCHEMA.md]
4 tables: users, students, predictions, activity_logs

**Slide 7 — Machine Learning Pipeline**
Data → Feature Engineering → Train/Test Split → Random Forest & Decision Tree
→ Evaluation (Accuracy/Precision/Recall/F1) → Saved Models (joblib)

**Slide 8 — Feature Importance**
Attendance 36% · Internal Marks 28% · Assignment Score 15% ·
Study Hours 10% · Previous Marks 8% · Age 3%
[Insert bar chart screenshot from the Model Comparison page]

**Slide 9 — Explainable AI**
- Every prediction shows a ranked, per-student contribution breakdown
- Answers "why did the model predict this?" — not just the result
- [Insert screenshot of the Explainable AI progress-bar panel]

**Slide 10 — Early Warning System**
- Automatic at-risk detection (low attendance / low marks / low study hours)
- Reasons + suggested faculty actions shown instantly
- [Insert screenshot of the At-Risk warning card]

**Slide 11 — Recommendation Engine**
- Rule-based, personalized study recommendations per weak area
- [Insert screenshot of the Recommendations panel]

**Slide 12 — Admin Dashboard**
[Insert dashboard screenshot]
- Stat cards, 7 chart types, real-time-feeling analytics

**Slide 13 — Reporting**
- One-click professional PDF report generation
- Email delivery of the PDF report
- CSV export (students, prediction history)

**Slide 14 — Security**
- JWT authentication, role-based authorization (Admin/Student)
- Password hashing (PBKDF2-SHA256)
- Parameterized SQL (no injection risk), server-side validation

**Slide 15 — Model Comparison**
[Insert Model Comparison page screenshot]
Accuracy / Precision / Recall / F1 + confusion matrix, Random Forest vs
Decision Tree, radar chart

**Slide 16 — Conclusion & Future Scope**
- Fully working, explainable, early-warning academic analytics platform
- Future: real institutional dataset, exact SHAP values, real-time updates,
  subject-wise prediction granularity

---

*Tip: pull actual screenshots from your running `npm run dev` instance —
every page referenced above (Dashboard, Predict, Model Comparison, Students)
exists and is wired to live data in this codebase.*
