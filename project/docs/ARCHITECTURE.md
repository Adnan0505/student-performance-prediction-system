# Architecture, Use Case & Flowcharts

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                          │
│   React 18 + Vite SPA — Tailwind CSS, Recharts, Framer Motion          │
│   ├─ AuthContext (JWT in localStorage)                                  │
│   ├─ ThemeContext (dark mode, localStorage)                              │
│   └─ Axios instance → attaches Authorization: Bearer <token>              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                  │ HTTPS / REST (JSON)
┌───────────────────────────────▼─────────────────────────────────────────┐
│                          FLASK REST API (app.py)                           │
│   Blueprints: auth · students · predictions · dashboard · analytics ·      │
│               reports · logs                                                │
│   Cross-cutting: JWT decorators (auth_utils.py), manual CORS headers        │
└───────┬───────────────────────────┬───────────────────────┬───────────────┘
        │                            │                        │
┌───────▼────────┐        ┌──────────▼──────────┐   ┌─────────▼─────────┐
│   SQLite DB      │        │   ML Layer (ml/)      │   │  Reports (utils/)   │
│  users            │        │  train_model.py        │   │  pdf_generator.py    │
│  students          │        │  predict.py              │   │  mailer.py (SMTP)      │
│  predictions        │        │  saved_models/*.joblib     │   └─────────────────────┘
│  activity_logs        │        └───────────────────────────┘
└─────────────────────────┘
```

## 2. Prediction Request — Sequence Flow

```
Admin/Student        React SPA            Flask API            ML Layer          SQLite
     │                    │                     │                    │               │
     │  Select student,   │                     │                    │               │
     │  choose algorithm  │                     │                    │               │
     │───────────────────▶│                     │                    │               │
     │                    │ POST /predictions/  │                    │               │
     │                    │ run/<id>            │                    │               │
     │                    │────────────────────▶│                    │               │
     │                    │                     │ fetch student row  │               │
     │                    │                     │───────────────────────────────────▶│
     │                    │                     │◀───────────────────────────────────│
     │                    │                     │ predict(features,  │               │
     │                    │                     │ algorithm)          │               │
     │                    │                     │───────────────────▶│               │
     │                    │                     │  scale → classify   │               │
     │                    │                     │  → regress marks    │               │
     │                    │                     │  → explain (SHAP-   │               │
     │                    │                     │    style) → risk    │               │
     │                    │                     │    → recommend       │               │
     │                    │                     │◀───────────────────│               │
     │                    │                     │ INSERT prediction    │               │
     │                    │                     │───────────────────────────────────▶│
     │                    │                     │ log_activity()        │               │
     │                    │                     │───────────────────────────────────▶│
     │                    │◀────────────────────│ JSON prediction bundle│               │
     │◀───────────────────│  render grade,      │                        │               │
     │  Explainable AI,    │  recommendations,   │                        │               │
     │  risk card          │  risk card           │                        │               │
```

## 3. Use Case Diagram (textual)

```
                        ┌─────────────────────────────┐
                        │   Student Performance         │
    ┌───────┐           │   Prediction System            │
    │ Admin │──────────▶│                                  │
    └───┬───┘           │  • Manage Students (CRUD,          │
        │                │    bulk upload, export)             │
        │                │  • Run / Bulk-run Predictions         │
        │                │  • View Dashboard & Analytics           │
        │                │  • View Leaderboard                      │
        │                │  • Compare ML Models                      │
        │                │  • View Activity Logs                      │
        │                │  • Export / Email PDF Reports                │
        │                │  • Backup Database                            │
        │                └──────────────┬─────────────────────────────────┘
        │                                │
    ┌───▼─────┐                          │
    │ Student │──────────────────────────┘
    └─────────┘  • View own Dashboard / Profile
                 • Run Prediction on own record
                 • View own Prediction History & Progress
                 • Download / Email own PDF Report
                 • Change Password / Toggle Dark Mode
```

## 4. Application Flowchart

```
        ┌────────────┐
        │   Start     │
        └──────┬─────┘
               ▼
        ┌─────────────────┐      No      ┌──────────────────┐
        │ Logged in with   │──────────────▶│ Login / Register  │
        │ valid JWT?        │              └────────┬──────────┘
        └────────┬─────────┘                        │
                  │ Yes                              ▼
                  ▼                          ┌──────────────────┐
        ┌──────────────────┐                 │ Issue JWT, store   │
        │  Role check         │                │ in localStorage      │
        └────────┬───────────┘                └──────────┬───────────┘
                  │                                        │
     ┌────────────┼─────────────────────────────────────────┘
     ▼                                       ▼
┌─────────┐                          ┌────────────┐
│  Admin    │                          │  Student     │
│  Dashboard │                          │  Dashboard    │
└────┬──────┘                          └──────┬────────┘
     │                                          │
     ▼                                          ▼
┌────────────────────┐              ┌────────────────────┐
│ Manage Students /     │              │ Select own record /  │
│ Select student          │              │ Run Prediction          │
└──────────┬─────────────┘              └──────────┬─────────────┘
            └─────────────────┬───────────────────────┘
                                ▼
                    ┌────────────────────────┐
                    │ Choose algorithm          │
                    │ (Random Forest /            │
                    │  Decision Tree)               │
                    └────────────┬───────────────┘
                                  ▼
                    ┌────────────────────────┐
                    │ ML predicts grade,        │
                    │ result, category,           │
                    │ marks, confidence              │
                    └────────────┬───────────────┘
                                  ▼
                    ┌────────────────────────┐
                    │ Explainable AI +            │
                    │ Recommendations +             │
                    │ At-Risk check                   │
                    └────────────┬───────────────┘
                                  ▼
                    ┌────────────────────────┐
                    │ Store in DB,               │
                    │ log activity                 │
                    └────────────┬───────────────┘
                                  ▼
                    ┌────────────────────────┐
                    │ Display result / export      │
                    │ PDF / email report              │
                    └────────────┬───────────────┘
                                  ▼
                             ┌──────┐
                             │ End    │
                             └──────┘
```

## 5. Design Principles Applied

- **Separation of concerns:** routes never touch the ML models directly —
  they call into `ml/predict.py`, which is the single source of truth for
  inference logic.
- **Stateless auth:** JWT means the API can scale horizontally with no
  server-side session store.
- **Fail-soft integrations:** email sending and DB backup never throw an
  unhandled 500 — they return a clear, actionable message instead.
- **Single-responsibility blueprints:** each Flask blueprint owns exactly
  one resource, mirroring the REST resource model on the frontend routes.
