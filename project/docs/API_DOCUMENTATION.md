# API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require header: `Authorization: Bearer <jwt_token>`

Every response is JSON with a top-level `success: boolean` and, on error, a
`message` string (validation errors also include an `errors: string[]` array).

---

## Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | – | `{ name, email, password, role? }` → creates user, returns token |
| POST | `/login` | – | `{ email, password, remember? }` → returns token + user |
| POST | `/logout` | JWT | Logs the activity, client discards token |
| GET | `/me` | JWT | Returns decoded token payload |
| POST | `/change-password` | JWT | `{ old_password, new_password }` |
| POST | `/forgot-password` | – | `{ email }` → sends reset email (or returns `dev_reset_token` if SMTP unset) |
| POST | `/reset-password` | – | `{ token, new_password }` |

## Students — `/api/students`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Query: `search, gender, page, page_size, sort_by, sort_dir` |
| GET | `/<id>` | JWT | Student + their full prediction history |
| POST | `/` | Admin | Create student |
| PUT | `/<id>` | Admin | Update student |
| DELETE | `/<id>` | Admin | Delete student (cascades predictions) |
| POST | `/bulk-upload` | Admin | multipart `file` (CSV) → bulk insert, skips duplicates, reports row errors |
| GET | `/export/csv` | JWT | Download all students as CSV |
| GET | `/template/csv` | JWT | Download the CSV upload template |

Student payload:
```json
{
  "name": "Jane Doe", "roll_no": "CS2024-101", "gender": "Female", "age": 20,
  "attendance": 88, "internal_marks": 76, "assignment_score": 82,
  "study_hours": 4.5, "previous_marks": 79
}
```

## Predictions — `/api/predictions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/run/<student_id>` | JWT | `{ algorithm: "random_forest" \| "decision_tree" }` → full prediction bundle |
| POST | `/bulk` | Admin | `{ student_ids: [...], algorithm }` → predicts for many students at once |
| GET | `/history` | JWT | Query: `search, result, category, algorithm, page, page_size` |
| DELETE | `/history/<id>` | Admin | Deletes a prediction record |
| GET | `/history/export/csv` | JWT | Download full prediction history as CSV |
| GET | `/model-comparison` | JWT | Accuracy/Precision/Recall/F1/confusion matrix for both models |

Prediction response shape:
```json
{
  "success": true,
  "student": { "...": "..." },
  "prediction": {
    "prediction_id": 42,
    "algorithm": "random_forest",
    "predicted_grade": "B",
    "result": "Pass",
    "category": "Good",
    "final_marks": 71.4,
    "confidence": 82.3,
    "is_at_risk": false,
    "risk_reasons": [],
    "suggested_actions": [],
    "recommendations": [{ "issue": "...", "recommendation": "..." }],
    "feature_importance": { "attendance": 0.36, "...": "..." },
    "explanation": {
      "contribution_pct": { "attendance": 41.2, "...": "..." },
      "direction": { "attendance": "positive", "...": "..." },
      "ranked_factors": [{ "feature": "Attendance", "key": "attendance", "percent": 41.2 }],
      "most_important_factor": "Attendance"
    },
    "prediction_time_ms": 3.42,
    "probabilities": { "A": 5.1, "B": 82.3, "C": 10.1, "D": 1.9, "F": 0.6 }
  }
}
```

## Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/summary` | JWT | Stat cards + all 7 chart datasets in one call |

## Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/overview` | JWT | Feature averages, top performers, weak students, monthly growth |
| GET | `/leaderboard` | JWT | Top 10 students by latest predicted marks |
| GET | `/progress/<student_id>` | JWT | Student + chronological prediction progress |

## Reports — `/api/reports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/pdf/<prediction_id>` | JWT | Streams a generated PDF report |
| POST | `/email/<prediction_id>` | JWT | `{ email }` → emails the PDF (or reports SMTP not configured) |

## Logs — `/api/logs`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | Paginated activity log, `search` query supported |
| GET | `/recent` | JWT | Last 10 activity entries |

## Misc

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | Liveness check |
| POST | `/api/backup` | – | Copies the SQLite DB into `backend/database/backups/` |

---

## Error Codes

| Code | Meaning |
|---|---|
| 400 | Validation error (see `errors` array) |
| 401 | Missing/invalid/expired token, or wrong credentials |
| 403 | Valid token but insufficient role (non-admin hitting an admin route) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email / roll number) |
| 500 | Unhandled server error |
