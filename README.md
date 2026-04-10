# Shahid J — Portfolio

> A production-grade developer portfolio built with **FastAPI** (Python) + **GSAP** + **Web Audio API** sound effects.
> Designed to impress Silicon Valley engineers — dark terminal aesthetic, scroll-driven animations, and synthesized sound.

---

## Architecture

```
shahid-portfolio/
├── backend/
│   └── main.py              # FastAPI server (routes, API, templates)
├── static/
│   ├── css/
│   │   ├── tokens.css        # Design tokens (single source of truth)
│   │   ├── reset.css         # CSS reset & base styles
│   │   ├── layout.css        # Grid, containers, responsive breakpoints
│   │   └── components.css    # All UI components (BEM naming)
│   └── js/
│       ├── sound.js          # Web Audio API sound manager (Singleton)
│       ├── cursor.js         # Custom cursor with GSAP smoothing (Observer)
│       ├── terminal.js       # Terminal typewriter effect (Command pattern)
│       ├── animations.js     # GSAP ScrollTrigger animations (Observer)
│       ├── navigation.js     # Scroll-responsive nav + progress (Mediator)
│       └── app.js            # Main orchestrator entry point (Facade)
├── templates/
│   └── index.html            # Semantic HTML template (no inline styles/scripts)
├── Dockerfile                # Multi-stage, non-root, health-checked
├── docker-compose.yml        # One-command local dev
├── requirements.txt          # Python dependencies
├── .dockerignore
├── .gitignore
└── README.md
```

## Design Principles Applied

| Principle | Where |
|---|---|
| **Separation of Concerns** | CSS split into tokens/reset/layout/components; JS split into 6 modules |
| **Single Responsibility** | Each JS module handles one thing (sound, cursor, terminal, etc.) |
| **DRY** | All colors/fonts/spacing from `tokens.css`; no inline styles |
| **SOLID** | Modules expose minimal public API; dependencies injected via load order |
| **BEM Naming** | `.skill-card__name`, `.timeline__dot`, `.nav__link` |
| **Token-based Design** | Every visual property derives from CSS custom properties |

## Design Patterns Used

| Pattern | Module | Purpose |
|---|---|---|
| **Singleton** | `sound.js` | One AudioContext, one state, global access |
| **Facade** | `app.js` | Single `boot()` call initializes everything |
| **Observer** | `animations.js`, `cursor.js` | Event-driven (scroll, mousemove) |
| **Command** | `terminal.js` | Queues line objects, executes sequentially |
| **Mediator** | `navigation.js` | Coordinates scroll → nav + progress bar |

## Features

- **GSAP 3 + ScrollTrigger** — all animations (no Framer Motion)
- **Web Audio API Sound Effects** — hover ticks, click pops, terminal keystrokes, section swooshes, boot chime (opt-in via SFX toggle)
- **Custom cursor** — GSAP-smoothed dot + ring with hover scaling
- **Terminal typewriter** — async character-by-character typing with keystroke sounds
- **Scroll progress bar** — gradient bar at top of viewport
- **Counter animations** — GSAP-powered number counting on scroll
- **Infinite marquee** — GSAP-driven seamless tech stack ticker
- **Magnetic buttons** — elastic GSAP hover effect
- **Responsive** — 3 breakpoints (1100px, 768px, 480px)
- **Accessible** — semantic HTML, ARIA labels, focus-visible, sr-only class
- **FastAPI backend** — serves templates, has `/api/health` and `/api/resume` endpoints

---

## Quick Start (Local)

### Without Docker

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Open browser
# → http://localhost:8000
```

### With Docker

```bash
# Build & run
docker compose up --build

# → http://localhost:8000

# Stop
docker compose down
```

---

## Deployment

### Option A: Render (Free Tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3
5. Deploy — Render gives you a free `.onrender.com` URL

### Option B: Railway (Free Tier)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Railway auto-detects the Dockerfile
4. Set port to `8000` in environment variables
5. Deploy — Railway gives you a `.up.railway.app` URL

### Option C: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly auth login
fly launch          # Follow prompts, select region
fly deploy

# → https://your-app.fly.dev
```

### Option D: VPS (DigitalOcean / AWS EC2)

```bash
# SSH into your server
ssh user@your-server

# Clone & deploy
git clone https://github.com/your-username/shahid-portfolio.git
cd shahid-portfolio
docker compose up -d --build

# Set up Nginx reverse proxy (optional)
# Point your domain DNS to the server IP
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Portfolio HTML page |
| `GET` | `/api/health` | Health check (for Docker/LB) |
| `GET` | `/api/resume` | Structured resume JSON |
| `GET` | `/api/docs` | Swagger/OpenAPI docs |

---

## Customization

- **Colors/fonts/spacing:** Edit `static/css/tokens.css`
- **Content:** Edit `templates/index.html`
- **Resume API data:** Edit `backend/main.py` → `resume_data()`
- **Animation timing:** Edit `static/js/animations.js`
- **Sound effects:** Edit `static/js/sound.js` (frequencies, volumes)
- **Terminal commands:** Edit `static/js/terminal.js` → `LINES` array

---

## License

MIT — use freely, attribution appreciated.
