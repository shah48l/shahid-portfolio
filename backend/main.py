"""
═══════════════════════════════════════════════════════════════
  Shahid J — Portfolio Backend
  Framework: FastAPI (async, production-grade)
  Pattern: MVC-lite (routes → templates + static assets)
═══════════════════════════════════════════════════════════════
"""

import os
import logging
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("portfolio")

# ── App ──
app = FastAPI(
    title="Shahid J — Portfolio",
    description="Backend for shahid.dev portfolio",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)

# ── Static & Templates ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)  # One level up from backend/
STATIC_DIR = os.path.join(PROJECT_ROOT, "static")
TEMPLATE_DIR = os.path.join(PROJECT_ROOT, "templates")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)


# ══════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the portfolio SPA."""
    logger.info("GET / — serving portfolio")
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/health")
async def health():
    """Health check endpoint for Docker / load-balancer probes."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": app.version,
    }


@app.get("/api/resume")
async def resume_data():
    """
    JSON API returning structured resume data.
    Useful for future integrations (e.g., a chatbot, external consumers).
    """
    return {
        "name": "Shahid J",
        "title": "Junior Software Engineer",
        "location": "Hyderabad, India",
        "email": "mjshahid48@gmail.com",
        "phone": "+91 87786 17605",
        "summary": (
            "Junior Software Engineer building a T-shaped backend profile "
            "with depth in Python, Django/DRF, REST APIs, databases, and "
            "clean architecture."
        ),
        "skills": {
            "languages": ["Python", "JavaScript", "SQL"],
            "backend": ["Django", "Django REST Framework", "FastAPI", "REST", "Microservices"],
            "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
            "devops": ["Docker", "AWS", "GitHub Actions", "CI/CD", "Linux"],
            "ml": ["PyTorch", "U-Net", "OpenCV", "Gemini API", "TorchScript"],
        },
        "experience": [
            {
                "company": "EPAM Systems",
                "role": "Junior Software Engineer Trainee",
                "period": "Nov 2025 – Present",
                "location": "Hyderabad, India",
            },
            {
                "company": "FluentX",
                "role": "Software Development Engineer I",
                "period": "Jan 2025 – Aug 2025",
                "location": "Remote",
            },
            {
                "company": "Tcare, Inc.",
                "role": "Machine Learning Engineer Intern",
                "period": "Aug 2024 – Nov 2024",
                "location": "Chennai, India",
            },
            {
                "company": "CLUBits Solution Pvt. Ltd",
                "role": "Machine Learning Engineer Intern",
                "period": "Jan 2024 – Jun 2024",
                "location": "Chennai, India",
            },
        ],
        "education": {
            "degree": "B.E. in Computer Science & Engineering",
            "institution": "St. Joseph's Institute of Technology",
            "year": 2025,
            "location": "Chennai, India",
        },
    }


# ══════════════════════════════════════
#  STARTUP / SHUTDOWN
# ══════════════════════════════════════

@app.on_event("startup")
async def on_startup():
    logger.info("🚀 Portfolio server started — http://0.0.0.0:8000")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("⏹  Portfolio server shutting down")
