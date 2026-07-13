# Database Schema

SQLite database at `backend/database/spps.db`. Four tables, defined in
`backend/database.py`.

## ER Diagram

```
┌────────────────────┐        ┌──────────────────────────┐
│       users         │        │        students           │
├────────────────────┤        ├──────────────────────────┤
│ id            PK    │        │ id                  PK    │
│ name                 │        │ name                       │
│ email          UNIQUE│        │ roll_no             UNIQUE │
│ password_hash       │        │ gender                     │
│ role                 │        │ age                         │
│ student_id     FK ───┼───────▶│ attendance                  │
│ reset_token          │        │ internal_marks               │
│ reset_token_expires  │        │ assignment_score              │
│ created_at           │        │ study_hours                    │
└────────────────────┘        │ previous_marks                  │
                                │ created_at                        │
                                │ updated_at                         │
                                └──────────────┬───────────────────┘
                                               │ 1
                                               │
                                               │ N
                                ┌──────────────▼───────────────────┐
                                │           predictions              │
                                ├───────────────────────────────────┤
                                │ id                          PK      │
                                │ student_id            FK ───┘       │
                                │ algorithm                            │
                                │ predicted_grade                       │
                                │ result                                 │
                                │ category                               │
                                │ final_marks                             │
                                │ confidence                               │
                                │ is_at_risk                                │
                                │ risk_reasons          (JSON)               │
                                │ recommendations       (JSON)               │
                                │ feature_importance    (JSON)               │
                                │ explanation           (JSON)               │
                                │ prediction_time_ms                          │
                                │ created_at                                   │
                                └─────────────────────────────────────────────┘

┌───────────────────────────────┐
│         activity_logs           │
├───────────────────────────────┤
│ id                       PK      │
│ user_id                          │
│ user_name                         │
│ action                             │
│ details                             │
│ created_at                           │
└───────────────────────────────────┘
```

## Table Details

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | |
| email | TEXT UNIQUE | login identifier |
| password_hash | TEXT | Werkzeug PBKDF2-SHA256 |
| role | TEXT | `admin` \| `student` |
| student_id | INTEGER FK → students.id | optional link for student-role accounts |
| reset_token / reset_token_expires | TEXT | password-reset flow |
| created_at | TEXT (ISO 8601) | |

### `students`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | |
| roll_no | TEXT UNIQUE | |
| gender | TEXT | Male / Female / Other |
| age | INTEGER | |
| attendance | REAL | 0–100 |
| internal_marks | REAL | 0–100 |
| assignment_score | REAL | 0–100 |
| study_hours | REAL | hours/day, 0–24 |
| previous_marks | REAL | 0–100 |
| created_at / updated_at | TEXT | |

### `predictions`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| student_id | INTEGER FK → students.id, ON DELETE CASCADE | |
| algorithm | TEXT | `random_forest` \| `decision_tree` |
| predicted_grade | TEXT | A / B / C / D / F |
| result | TEXT | Pass / Fail |
| category | TEXT | Excellent / Good / Average / At Risk |
| final_marks | REAL | regression estimate |
| confidence | REAL | max class probability, % |
| is_at_risk | INTEGER (bool) | |
| risk_reasons | TEXT (JSON array) | |
| recommendations | TEXT (JSON array) | |
| feature_importance | TEXT (JSON object) | global model importances |
| explanation | TEXT (JSON object) | per-student SHAP-style breakdown |
| prediction_time_ms | REAL | |
| created_at | TEXT | |

### `activity_logs`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER, nullable | |
| user_name | TEXT | |
| action | TEXT | e.g. "Logged In", "Student Added" |
| details | TEXT | free text |
| created_at | TEXT | |

## Notes

- All foreign keys enforced with `PRAGMA foreign_keys = ON`.
- JSON columns are stored as TEXT and (de)serialized in the Flask layer —
  SQLite has no native JSON type, this is the standard, portable pattern.
- Indexed uniqueness on `users.email` and `students.roll_no` prevents
  duplicates at the database layer, in addition to the application-level
  checks in the route handlers.
