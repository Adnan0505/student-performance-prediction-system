import os
from dotenv import load_dotenv

# Ye line add karni zaroori thi, yahi tumhari .env file ko read karegi!
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "spps-super-secret-key-change-in-prod")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "spps-jwt-secret-change-in-prod")
    JWT_ACCESS_EXPIRES_MINUTES = 60 * 6          # 6 hours
    JWT_REMEMBER_EXPIRES_MINUTES = 60 * 24 * 30  # 30 days ("remember me")

    DATABASE_PATH = os.path.join(BASE_DIR, "database", "spps.db")
    MODELS_DIR = os.path.join(BASE_DIR, "ml", "saved_models")
    REPORTS_DIR = os.path.join(BASE_DIR, "generated", "reports")
    UPLOADS_DIR = os.path.join(BASE_DIR, "generated", "uploads")

    # SMTP (fill in with real credentials to enable outgoing email; the app
    # degrades gracefully — prediction reports are always available as PDF
    # download even if SMTP is not configured)
    SMTP_HOST = os.environ.get("SMTP_HOST", "")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER", "")
    SMTP_PASS = os.environ.get("SMTP_PASS", "")
    SMTP_FROM = os.environ.get("SMTP_FROM", "no-reply@spps.local")

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

    AT_RISK_ATTENDANCE = 75
    AT_RISK_INTERNAL_MARKS = 40
    AT_RISK_STUDY_HOURS = 2