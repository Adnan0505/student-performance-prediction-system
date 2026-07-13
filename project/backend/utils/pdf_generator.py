import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from config import Config

os.makedirs(Config.REPORTS_DIR, exist_ok=True)

PRIMARY = colors.HexColor("#4F46E5")
DARK = colors.HexColor("#1E1B4B")
GREY = colors.HexColor("#6B7280")
LIGHT_BG = colors.HexColor("#EEF2FF")
RISK_RED = colors.HexColor("#DC2626")
GOOD_GREEN = colors.HexColor("#16A34A")


def generate_prediction_pdf(student, prediction, output_path=None):
    if output_path is None:
        fname = f"prediction_{student['roll_no']}_{int(datetime.utcnow().timestamp())}.pdf"
        output_path = os.path.join(Config.REPORTS_DIR, fname)

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                             topMargin=18 * mm, bottomMargin=18 * mm,
                             leftMargin=18 * mm, rightMargin=18 * mm)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("TitleBrand", fontSize=20, textColor=DARK, spaceAfter=2, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("Subtitle", fontSize=10, textColor=GREY, spaceAfter=10))
    styles.add(ParagraphStyle("Section", fontSize=13, textColor=PRIMARY, spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("Body", fontSize=10, textColor=colors.black, leading=14))
    styles.add(ParagraphStyle("Small", fontSize=8.5, textColor=GREY))

    story = []
    story.append(Paragraph("Student Performance Prediction &amp; Classification System", styles["TitleBrand"]))
    story.append(Paragraph("AI-Powered Academic Performance Report", styles["Subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Student Information", styles["Section"]))
    info_table_data = [
        ["Name", student["name"], "Roll No", student["roll_no"]],
        ["Gender", student["gender"], "Age", str(student["age"])],
        ["Attendance", f"{student['attendance']}%", "Internal Marks", f"{student['internal_marks']}/100"],
        ["Assignment Score", f"{student['assignment_score']}/100", "Study Hours/day", str(student["study_hours"])],
        ["Previous Sem Marks", f"{student['previous_marks']}/100", "", ""],
    ]
    t = Table(info_table_data, colWidths=[38 * mm, 52 * mm, 38 * mm, 42 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), GREY),
        ("TEXTCOLOR", (2, 0), (2, -1), GREY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    story.append(t)

    story.append(Paragraph("Prediction Result", styles["Section"]))
    result_color = GOOD_GREEN if prediction["result"] == "Pass" else RISK_RED
    result_data = [
        ["Predicted Grade", prediction["predicted_grade"], "Result", prediction["result"]],
        ["Category", prediction["category"], "Confidence Score", f"{prediction['confidence']}%"],
        ["Estimated Final Marks", f"{prediction['final_marks']}/100", "Algorithm Used",
         "Random Forest" if prediction["algorithm"] == "random_forest" else "Decision Tree"],
        ["Prediction Time", f"{prediction['prediction_time_ms']} ms", "Generated On",
         datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")],
    ]
    rt = Table(result_data, colWidths=[38 * mm, 52 * mm, 38 * mm, 42 * mm])
    rt.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("TEXTCOLOR", (1, 0), (1, 0), result_color),
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
        ("TEXTCOLOR", (3, 0), (3, 0), result_color),
        ("FONTNAME", (3, 0), (3, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7D2FE")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.white),
    ]))
    story.append(rt)

    story.append(Paragraph("Explainable AI &mdash; Why This Prediction?", styles["Section"]))
    ranked = prediction.get("explanation", {}).get("ranked_factors", [])
    exp_data = [["Factor", "Contribution", ""]]
    for f in ranked:
        exp_data.append([f["feature"], f"{f['percent']}%", "\u2588" * max(int(f["percent"] / 5), 1)])
    et = Table(exp_data, colWidths=[50 * mm, 30 * mm, 90 * mm])
    et.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (2, 1), (2, -1), PRIMARY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
    ]))
    story.append(et)

    if prediction.get("is_at_risk"):
        story.append(Paragraph("Early Warning &mdash; Student At Risk", styles["Section"]))
        reasons = ", ".join(prediction.get("risk_reasons", []))
        actions = ", ".join(prediction.get("suggested_actions", []))
        story.append(Paragraph(f"<b>Reasons:</b> {reasons}", styles["Body"]))
        story.append(Paragraph(f"<b>Suggested Action:</b> {actions}", styles["Body"]))

    story.append(Paragraph("Personalized Recommendations", styles["Section"]))
    for rec in prediction.get("recommendations", []):
        story.append(Paragraph(f"&bull; <b>{rec['issue']}</b> &mdash; {rec['recommendation']}", styles["Body"]))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB")))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Generated automatically by the Student Performance Prediction &amp; Classification System. "
        "This report is AI-generated for academic guidance purposes and should be reviewed by faculty.",
        styles["Small"]))

    doc.build(story)
    return output_path
