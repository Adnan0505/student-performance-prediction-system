import smtplib
from email.message import EmailMessage
from config import Config


def _smtp_configured():
    return bool(
        Config.SMTP_HOST and
        Config.SMTP_USER and
        Config.SMTP_PASS
    )


def _send(msg):
    if not _smtp_configured():
        print("[mailer] SMTP not configured")
        return False

    try:
        with smtplib.SMTP(
            Config.SMTP_HOST,
            Config.SMTP_PORT,
            timeout=15
        ) as server:
            server.starttls()
            server.login(
                Config.SMTP_USER,
                Config.SMTP_PASS
            )
            server.send_message(msg)

        print("[mailer] Email sent successfully")
        return True

    except Exception as e:
        import traceback

        print(f"[mailer] Failed to send email: {e}")
        traceback.print_exc()
        return False


def send_password_reset_email(to_email, name, token):
    msg = EmailMessage()

    msg["Subject"] = "Password Reset — Student Performance Prediction System"
    msg["From"] = Config.SMTP_FROM
    msg["To"] = to_email

    msg.set_content(
        f"Hi {name},\n\n"
        f"Use this token to reset your password: {token}\n"
        "This token expires in 1 hour.\n\n"
        "If you did not request this, ignore this email."
    )

    return _send(msg)


def send_prediction_report_email(
    to_email,
    student_name,
    prediction,
    pdf_path
):
    msg = EmailMessage()

    msg["Subject"] = f"Performance Prediction Report — {student_name}"
    msg["From"] = Config.SMTP_FROM
    msg["To"] = to_email

    body = (
        f"Prediction Report for {student_name}\n\n"
        f"Predicted Grade: {prediction['predicted_grade']}\n"
        f"Result: {prediction['result']}\n"
        f"Category: {prediction['category']}\n"
        f"Confidence: {prediction['confidence']}%\n\n"
        "The full explainable-AI breakdown and recommendations "
        "are attached as a PDF.\n"
    )

    msg.set_content(body)

    try:
        with open(pdf_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="pdf",
                filename="prediction_report.pdf"
            )
    except FileNotFoundError:
        print("[mailer] PDF file not found")

    return _send(msg)