"""Generate MedFlow presentation PDF."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether,
)

OUT = "/app/MedFlow_Presentation.pdf"

# Color palette
NAVY = HexColor("#05070E")
CARD = HexColor("#0B1220")
BORDER = HexColor("#1E293B")
MUTED = HexColor("#94A3B8")
TEXT = HexColor("#1a1a1a")
CRITICAL = HexColor("#EF4444")
INFO = HexColor("#3B82F6")
AVAILABLE = HexColor("#22C55E")
MODERATE = HexColor("#F59E0B")
LOCKED = HexColor("#A855F7")

styles = getSampleStyleSheet()

title = ParagraphStyle(
    "title", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=28, leading=32, textColor=NAVY, spaceAfter=6, alignment=TA_LEFT,
)
subtitle = ParagraphStyle(
    "subtitle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=11, leading=14, textColor=MUTED, spaceAfter=16, alignment=TA_LEFT,
)
h1 = ParagraphStyle(
    "h1", parent=styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=18, leading=22, textColor=NAVY, spaceBefore=14, spaceAfter=8,
)
h2 = ParagraphStyle(
    "h2", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=13, leading=16, textColor=CRITICAL, spaceBefore=12, spaceAfter=4,
)
h3 = ParagraphStyle(
    "h3", parent=styles["Heading3"], fontName="Helvetica-Bold",
    fontSize=11, leading=14, textColor=INFO, spaceBefore=8, spaceAfter=2,
)
body = ParagraphStyle(
    "body", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=10, leading=14, textColor=TEXT, spaceAfter=6, alignment=TA_LEFT,
)
quote = ParagraphStyle(
    "quote", parent=body, fontName="Helvetica-Oblique",
    leftIndent=14, rightIndent=6, textColor=HexColor("#334155"),
    borderPadding=(6,10,6,10), backColor=HexColor("#F1F5F9"),
    spaceAfter=8,
)
stage = ParagraphStyle(
    "stage", parent=body, fontName="Helvetica-Bold",
    textColor=LOCKED, fontSize=9, leading=12, spaceBefore=4, spaceAfter=2,
)
mono = ParagraphStyle(
    "mono", parent=body, fontName="Courier",
    fontSize=9, leading=12, textColor=HexColor("#0F172A"),
    backColor=HexColor("#F1F5F9"), borderPadding=(4,6,4,6),
    spaceAfter=6,
)
bullet = ParagraphStyle(
    "bullet", parent=body, leftIndent=14, bulletIndent=2, spaceAfter=3,
)

def hr(width=6.5*inch):
    t = Table([[""]], colWidths=[width], rowHeights=[0.5])
    t.setStyle(TableStyle([("LINEBELOW", (0,0), (-1,-1), 0.5, BORDER)]))
    return t

def timing_row(time_label, section):
    tbl = Table(
        [[Paragraph(f"<b>{time_label}</b>", body), Paragraph(section, body)]],
        colWidths=[0.9*inch, 5.6*inch],
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,0), HexColor("#0B1220")),
        ("TEXTCOLOR", (0,0), (0,0), white),
        ("BACKGROUND", (1,0), (1,0), HexColor("#F8FAFC")),
        ("BOX", (0,0), (-1,-1), 0.4, BORDER),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return tbl

def stack_table(rows, col_widths, header=False):
    tbl = Table(rows, colWidths=col_widths, repeatRows=1 if header else 0)
    styles_ = [
        ("BOX", (0,0), (-1,-1), 0.4, BORDER),
        ("INNERGRID", (0,0), (-1,-1), 0.3, HexColor("#CBD5E1")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
    ]
    if header:
        styles_ += [
            ("BACKGROUND", (0,0), (-1,0), HexColor("#0B1220")),
            ("TEXTCOLOR", (0,0), (-1,0), white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ]
    tbl.setStyle(TableStyle(styles_))
    return tbl


def draw_header_footer(canvas, doc):
    canvas.saveState()
    # Header band
    canvas.setFillColor(NAVY)
    canvas.rect(0, LETTER[1]-0.55*inch, LETTER[0], 0.55*inch, stroke=0, fill=1)
    canvas.setFillColor(CRITICAL)
    canvas.circle(0.55*inch, LETTER[1]-0.28*inch, 0.09*inch, stroke=0, fill=1)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(0.75*inch, LETTER[1]-0.31*inch, "MedFlow")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75*inch, LETTER[1]-0.45*inch, "TRAUMA RESOURCE NETWORK  ·  Demo Script & Resource Manifest")
    # Live indicator (right)
    canvas.setFillColor(AVAILABLE)
    canvas.circle(LETTER[0]-0.9*inch, LETTER[1]-0.28*inch, 0.06*inch, stroke=0, fill=1)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(AVAILABLE)
    canvas.drawString(LETTER[0]-0.8*inch, LETTER[1]-0.30*inch, "NETWORK LIVE")
    # Footer
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.6*inch, 0.4*inch, "MedFlow is a fictional simulation. Not for clinical use.")
    canvas.drawRightString(LETTER[0]-0.6*inch, 0.4*inch, f"Page {doc.page}")
    canvas.setStrokeColor(BORDER)
    canvas.line(0.6*inch, 0.55*inch, LETTER[0]-0.6*inch, 0.55*inch)
    canvas.restoreState()


story = []

# === COVER-LIKE INTRO ===
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("MedFlow", title))
story.append(Paragraph("Live Demo Script &amp; Resource Manifest", subtitle))
story.append(hr())
story.append(Spacer(1, 0.15*inch))
story.append(Paragraph(
    "This document contains a complete <b>~8-minute presentation script</b> for demonstrating MedFlow — "
    "a trauma-first hospital resource management and dynamic capacity allocation simulation — "
    "plus every library, integration, and formula used to build it. "
    "Every number in MedFlow is deterministic and explainable; every screen is labelled as a simulation.",
    body))

story.append(Spacer(1, 0.1*inch))
story.append(stack_table([
    ["Runtime", "~8 minutes"],
    ["Audience", "Product, clinical operations, engineering leadership"],
    ["Format", "Live browser walkthrough with narration"],
    ["Prep", "Reset simulation before starting; have Simulate Surge ready"],
], col_widths=[1.4*inch, 5.1*inch]))

# === PRESENTATION SCRIPT ===
story.append(PageBreak())
story.append(Paragraph("Presentation Script", h1))
story.append(Paragraph("Read verbatim or paraphrase. Bracketed stage cues indicate what to click.", body))

sections = [
    ("0:00 – 0:30", "Opening Hook",
     "(Open the app on the login screen)",
     "Every minute lost between a trauma call and the right specialist can change a patient's outcome. But hospital dispatch today still runs on phone trees and static rosters. "
     "MedFlow is a simulation of what modern trauma dispatch could look like — a command center that thinks in real time. What you're about to see is entirely synthetic — no real hospitals, no real patients — but every calculation is deterministic and explainable."),
    ("0:30 – 1:00", "Sign In",
     "(Click Sign in with Google. Land on Dashboard)",
     "MedFlow ships with Emergent-managed Google authentication — one click, seven-day session, server-verified. No passwords, no user table to hack. And we're in — the Dispatcher Console."),
    ("1:00 – 2:30", "The Dispatcher Console (The Wow Moment)",
     "(Point to the three panels; type description; click map; click Dispatch)",
     "Three panels: Intake on the left, the live dispatch terminal in the middle, and the queue plus recent dispatches on the right. This is a full Emergency Operations Center in the browser.<br/><br/>"
     "Let me create a trauma case. I'll type 'Gunshot wound to the abdomen with major bleeding.' Notice — before I've even selected severity, the classifier has already tagged this as Trauma Surgeon. That's a deterministic keyword classifier with a strict priority order: OB-GYN → Neurosurgeon → Trauma → Burn → Ortho → General.<br/><br/>"
     "I'll mark it Critical, click on the map — that's a live Leaflet map with real OpenStreetMap tiles — and hit Dispatch. Watch the terminal. Every step is logged with a timestamp — evaluating five hospitals, checking beds, checking specialists, atomically locking resources. In under a second, the case is routed to Metro Central — the hospital with the best composite score of distance, bed availability, and specialist availability. For critical cases, the algorithm weighs specialist availability at 40%, bed availability at 25%, and distance at 35%."),
    ("2:30 – 3:30", "Medical Footprint at Intake",
     "(Switch dropdown to 'Create new patient footprint'; add condition + medication; dispatch)",
     "But trauma cases rarely arrive without context. Let me create a new patient footprint as I dispatch. I'll enter their name, add a known condition — Atrial Fibrillation — and their current medication — Warfarin, 5 mg, once daily.<br/><br/>"
     "When I dispatch, that patient is written to the ledger with the correct alert badges: Blood Thinners and Anticoagulant — automatically flagged from the medication name. The dispatched hospital now sees not just a trauma case, but a full medication footprint."),
    ("3:30 – 4:30", "The Hospital Network",
     "(Switch to Hospital Network tab; open a Capacity Logic panel)",
     "Five hospitals, each with a different demographic profile. Look at Metro Central — high crime zone, so its bed count and CT/MRI/X-Ray counts are algorithmically elevated. That's not decoration — it's a deterministic formula: totalBeds = round(baseBeds × (1 + 0.30 × crimeFactor) × (1 + 0.20 × pregnancyFactor)).<br/><br/>"
     "Every card exposes its Capacity Logic — click and you can see exactly why the numbers are what they are. Auditability by design.<br/><br/>"
     "St. Jude's is our high-pregnancy zone — notice the elevated Ultrasound and Fetal Doppler counts and the OB-GYN roster of six. Suburban North has the largest waiting area because its senior population ratio scales the accessibility multiplier. Each card also has Discharge 1 Patient — this is where the network gets alive."),
    ("4:30 – 5:30", "Auto-Redispatch (The Magic Moment)",
     "(Click Simulate Network Surge; watch queue populate; click Discharge)",
     "Let me overload the network. Simulate Surge fires seven randomized trauma cases in sequence. Some are Critical, some Severe. Watch the terminal — cases are dispatched until specialists run out. When there's no eligible hospital, cases fall into the Holding Queue, sorted by severity and wait time.<br/><br/>"
     "Now the magic — I'll discharge one patient at Metro Central. Notice the toast — 'Holding case MF-1046 automatically dispatched to Metro Central.' The moment a bed and a specialist free up, the queue re-evaluates itself with the same weighted scoring algorithm. This is dynamic capacity allocation."),
    ("5:30 – 6:30", "Patient Portal &amp; Interaction Engine",
     "(Switch to Patient Footprint tab; point to Demo Interaction Alerts)",
     "Full medication ledger — add, edit, discontinue, reactivate, and every change is timestamped in a history log.<br/><br/>"
     "And this — is our clearly-labeled Demo Interaction Alert Engine. If a patient is on Warfarin and someone adds Ibuprofen, the system flags it. To be transparent: this is a small mock rule set, not a real pharmacology database. The panel says so explicitly. In production, this would connect to a licensed clinical reference."),
    ("6:30 – 7:30", "Analytics — The 30,000-Foot View",
     "(Switch to Analytics tab)",
     "Five charts, all live-reactive. Crime rate versus trauma imaging equipment shows the resource-allocation curve. Pregnancy rate versus OB equipment shows the demographic scaling. Senior ratio versus waiting area size proves the accessibility multiplier is working. Bed utilization gives us the network health at a glance. And dispatch distance shows we're routing efficiently — average under ten kilometers.<br/><br/>"
     "Everything you see updates the instant a new case is dispatched or a patient is discharged."),
    ("7:30 – 8:00", "Close",
     "",
     "MedFlow is a simulation — but every number is deterministic, every decision is explainable, and every piece of state is persisted. Reset the simulation at any time and start clean.<br/><br/>"
     "Imagine this pattern applied to real regional trauma networks — with real HL7 feeds, real specialist rosters, real triage data. That's the vision. What you saw today is the working prototype. Questions?"),
]

for tm, title_, cue, text in sections:
    story.append(Spacer(1, 0.08*inch))
    story.append(timing_row(tm, f"<b>{title_}</b>"))
    story.append(Spacer(1, 0.03*inch))
    if cue:
        story.append(Paragraph(f"[ {cue} ]", stage))
    story.append(Paragraph(text, quote))

# === DEMO TIPS ===
story.append(PageBreak())
story.append(Paragraph("Demo Tips", h1))
tips = [
    "Reset the simulation before the demo so numbers start clean.",
    "Have Simulate Network Surge ready — it's your most visual moment.",
    "Slow down at the terminal feed — the staggered log is the &lsquo;wow&rsquo; moment.",
    "Explain the formulas out loud when hovering the Capacity Logic panel — it separates you from generic dashboards.",
    "End on the auto-redispatch — it's the most impressive behavior and hardest to build.",
]
for i, t in enumerate(tips, 1):
    story.append(Paragraph(f"<b>{i}.</b> {t}", bullet))

# === TECH MANIFEST ===
story.append(PageBreak())
story.append(Paragraph("Resources &amp; Tech Manifest", h1))

story.append(Paragraph("Design Philosophy", h2))
story.append(Paragraph(
    "<b>Aesthetic:</b> Emergency Operations Center + Hospital Command Center + Modern SaaS "
    "(dark-first, tactical, high information density).", body))
story.append(Paragraph("<b>Fonts:</b> IBM Plex Sans (UI), JetBrains Mono (terminal &amp; data).", body))
story.append(Paragraph(
    "<b>Semantic status colours:</b> Critical (red), Severe (orange), Moderate (yellow), "
    "Available (green), Info (blue), Locked (purple).", body))

story.append(Paragraph("Frontend Stack", h2))
frontend_rows = [
    ["Library", "Purpose"],
    ["React 19", "UI framework"],
    ["Tailwind CSS 3.4", "Utility styling"],
    ["shadcn/ui (Radix primitives)", "Card, Tabs, Dialog, AlertDialog, DropdownMenu, Select, Progress, Avatar, ScrollArea, Collapsible"],
    ["Zustand 5", "Centralized simulation store (hospitals, patients, queue, dispatches, logs)"],
    ["Recharts 3", "5 live analytics charts (ComposedChart, ScatterChart, BarChart, LineChart)"],
    ["Leaflet 1.9 + react-leaflet 5", "Interactive incident map"],
    ["OpenStreetMap tiles", "Free, no-API-key map basemap"],
    ["Lucide React", "Icon set (Radar, Activity, Building2, Stethoscope, ...)"],
    ["Sonner", "Toast notification system"],
    ["date-fns", "Relative time in the holding queue"],
    ["React Router 7", "/login, /dashboard, auth-callback hash routing"],
    ["axios", "API client with withCredentials"],
]
story.append(stack_table(
    [[Paragraph(c, body if r > 0 else ParagraphStyle('h', parent=body, textColor=white, fontName='Helvetica-Bold')) for c in row]
     for r, row in enumerate(frontend_rows)],
    col_widths=[2.1*inch, 4.4*inch], header=True))

story.append(Paragraph("Backend Stack", h2))
backend_rows = [
    ["Component", "Purpose"],
    ["FastAPI + Uvicorn", "REST API under /api prefix"],
    ["Motor (async MongoDB)", "Persistence"],
    ["httpx", "Server-to-server call to Emergent Auth /session-data"],
    ["Pydantic v2", "Request/response schemas"],
]
story.append(stack_table(
    [[Paragraph(c, body if r > 0 else ParagraphStyle('h', parent=body, textColor=white, fontName='Helvetica-Bold')) for c in row]
     for r, row in enumerate(backend_rows)],
    col_widths=[2.1*inch, 4.4*inch], header=True))

story.append(Paragraph("Integrations", h2))
integrations = [
    "<b>Emergent-managed Google Auth</b> — OAuth via auth.emergentagent.com, session token exchanged server-side, httpOnly session_token cookie, 7-day expiry.",
    "<b>OpenStreetMap</b> — via Leaflet CDN, no API key required.",
]
for it in integrations:
    story.append(Paragraph("• " + it, bullet))

story.append(Paragraph("API Endpoints", h2))
story.append(Paragraph(
    "POST&nbsp;/api/auth/session&nbsp;&nbsp;&nbsp;→&nbsp;exchange session_id, set cookie<br/>"
    "GET&nbsp;&nbsp;/api/auth/me&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→&nbsp;return current user (cookie or Bearer)<br/>"
    "POST&nbsp;/api/auth/logout&nbsp;&nbsp;&nbsp;&nbsp;→&nbsp;clear session<br/>"
    "GET&nbsp;&nbsp;/api/state&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→&nbsp;load per-user simulation state<br/>"
    "PUT&nbsp;&nbsp;/api/state&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→&nbsp;persist per-user simulation state<br/>"
    "DEL&nbsp;&nbsp;/api/state&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→&nbsp;clear per-user state", mono))

# === FORMULAS ===
story.append(PageBreak())
story.append(Paragraph("Deterministic Formulas", h1))
story.append(Paragraph(
    "All simulation numbers are deterministic and documented in "
    "<font face='Courier'>/app/frontend/src/lib/formulas.js</font>.", body))

formulas = [
    ("Bed capacity",
     "totalBeds = round(baseBeds × (1 + 0.30 × crimeFactor) × (1 + 0.20 × pregnancyFactor))"),
    ("ICU capacity",
     "totalICUBeds = round(baseICUBeds × (1 + 0.40 × crimeFactor))"),
    ("Trauma imaging equipment (MRI, CT, X-Ray)",
     "crimeMultiplier = 1 + 0.50 × crimeFactor"),
    ("Obstetric equipment (Ultrasound, Fetal Doppler)",
     "pregnancyMultiplier = 1 + 0.60 × pregnancyFactor"),
    ("Waiting area",
     "waitingAreaSqFt = round((500 + population/80) × (1 + seniorRatio × 0.40))"),
    ("Match score (non-critical case)",
     "finalScore = 0.45 × distanceScore + 0.30 × bedScore + 0.25 × specialistScore"),
    ("Match score (critical case, ICU preferred)",
     "finalScore = 0.35 × distanceScore + 0.25 × bedScore + 0.40 × specialistScore"),
]
for label, expr in formulas:
    story.append(Paragraph(f"<b>{label}</b>", h3))
    story.append(Paragraph(expr, mono))

story.append(Paragraph("Simulation Data (Synthetic)", h2))
data_rows = [
    ["Category", "Contents"],
    ["Hospitals (5)", "Metro Central · St. Jude's Medical Center · Suburban North Hospital · Riverside General · Eastside Trauma Institute"],
    ["Seed patients (3)", "Alex Rivera · Jordan Lee · Priya Singh (all labelled Simulated)"],
    ["Surge trauma templates", "10 randomised descriptions with Critical / Severe / Moderate severity"],
]
story.append(stack_table(
    [[Paragraph(c, body if r > 0 else ParagraphStyle('h', parent=body, textColor=white, fontName='Helvetica-Bold')) for c in row]
     for r, row in enumerate(data_rows)],
    col_widths=[1.6*inch, 4.9*inch], header=True))

story.append(Paragraph("Compliance &amp; Safety Framing", h2))
story.append(Paragraph(
    "Every screen visibly labels the app as a <b>simulation only</b>. The classifier displays "
    "<i>&ldquo;Simulated classification — verify by qualified medical personnel.&rdquo;</i> "
    "The interaction engine is labelled <i>&ldquo;Demo Interaction Alert Engine — Verify with an appropriate clinical reference.&rdquo;</i> "
    "No real medical claims are made anywhere.", body))

# Build the PDF
doc = SimpleDocTemplate(
    OUT, pagesize=LETTER,
    leftMargin=0.6*inch, rightMargin=0.6*inch,
    topMargin=0.85*inch, bottomMargin=0.7*inch,
    title="MedFlow — Presentation Script & Resources",
    author="MedFlow",
)
doc.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
print("Written:", OUT)
