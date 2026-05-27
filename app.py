import asyncio
import json
import os
import base64
import uuid
import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import requests as http_requests

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cloudstrive Messe Quiz")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# In-memory session store — intentionally ephemeral for single-day kiosk use.
_sessions: dict = {}

# SSE queues — one per connected /display tab.
_display_queues: list[asyncio.Queue] = []


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class LeadData(BaseModel):
    name: str
    email: str
    institut: Optional[str] = ""
    gender: Optional[str] = "neutral"
    gdpr_consent: bool = False


class GenerateRequest(BaseModel):
    scores: dict[str, float]
    photo: Optional[str] = None   # base64 data-URI or raw base64
    lead: Optional[LeadData] = None


class HeroResponse(BaseModel):
    session_id: str
    hero: dict
    image: Optional[str] = None   # data-URI or None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "logo_svg": _load_logo_svg()})


@app.post("/api/generate", response_model=HeroResponse)
async def generate_hero(body: GenerateRequest):
    from hero_logic import assign_hero, get_hero_data

    hero_type = assign_hero(body.scores)
    gender = body.lead.gender if body.lead else "neutral"
    hero = get_hero_data(hero_type, gender)

    image_result: Optional[str] = None
    if body.photo and os.getenv("OPENAI_API_KEY"):
        try:
            image_result = _generate_hero_image(body.photo, hero_type, gender)
        except Exception as exc:
            logger.error("Image generation failed: %s", exc)

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "hero": hero,
        "image": image_result,
        "scores": body.scores,
        "lead": body.lead.model_dump(exclude={"photo"}) if body.lead else {},
        "created_at": datetime.utcnow().isoformat(),
    }

    if body.lead and body.lead.gdpr_consent and body.lead.email:
        _save_lead(body.lead.model_dump(), hero)

    # Push result to any connected TV display tabs
    _broadcast_to_displays({
        "type": "hero_result",
        "hero": hero,
        "image": image_result,
        "session_id": session_id,
    })

    return HeroResponse(session_id=session_id, hero=hero, image=image_result)


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"hero": session["hero"], "scores": session["scores"], "created_at": session["created_at"]}


@app.get("/display", response_class=HTMLResponse)
async def display(request: Request):
    """TV / big-screen display page."""
    logo_svg = _load_logo_svg()
    return templates.TemplateResponse("display.html", {"request": request, "logo_svg": logo_svg})


@app.get("/api/display-stream")
async def display_stream(request: Request):
    """SSE endpoint — TV tabs subscribe here and receive hero_result events."""
    queue: asyncio.Queue = asyncio.Queue()
    _display_queues.append(queue)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"  # prevents proxy timeouts
        finally:
            if queue in _display_queues:
                _display_queues.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _broadcast_to_displays(data: dict) -> None:
    for queue in list(_display_queues):
        try:
            queue.put_nowait(data)
        except asyncio.QueueFull:
            pass


def _load_logo_svg() -> str:
    logo_path = Path("templates/logo.svg")
    if not logo_path.exists():
        return ""
    raw = logo_path.read_text(encoding="utf-8")
    svg = raw.replace('<?xml version="1.0" encoding="UTF-8"?>', "").strip()
    return svg.replace('width="2268" height="464"', 'viewBox="0 0 2268 464"')

def _generate_hero_image(photo_b64: str, hero_type: str, gender: str) -> Optional[str]:
    from openai import OpenAI
    from hero_logic import build_image_prompt

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    raw = photo_b64.split(",", 1)[1] if "," in photo_b64 else photo_b64
    photo_bytes = base64.b64decode(raw)

    prompt = build_image_prompt(hero_type, gender)

    response = client.images.edit(
        model="gpt-image-1",
        image=("photo.png", io.BytesIO(photo_bytes), "image/png"),
        prompt=prompt,
        n=1,
        size="1024x1024",
    )

    item = response.data[0]
    if getattr(item, "b64_json", None):
        return f"data:image/png;base64,{item.b64_json}"
    return getattr(item, "url", None)


def _save_lead(lead: dict, hero: dict) -> None:
    webhook_url = os.getenv("CRM_WEBHOOK_URL")
    if not webhook_url:
        logger.info("CRM_WEBHOOK_URL not set — skipping lead push")
        return

    name_parts = (lead.get("name") or "").split(" ", 1)
    try:
        http_requests.post(
            webhook_url,
            json={
                "properties": {
                    "firstname": name_parts[0],
                    "lastname": name_parts[1] if len(name_parts) > 1 else "",
                    "email": lead.get("email", ""),
                    "company": lead.get("institut", ""),
                    "lead_source": "Cloudstrive Messe Quiz 2026",
                    "hero_type": hero.get("type", ""),
                    "hero_name": hero.get("name", ""),
                },
                "timestamp": datetime.utcnow().isoformat(),
                "source": "cloudstrive-messe-quiz",
            },
            timeout=10,
        )
    except Exception as exc:
        logger.error("CRM webhook failed: %s", exc)
