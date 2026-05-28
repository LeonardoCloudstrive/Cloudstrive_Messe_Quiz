import asyncio
import csv
import json
import os
import base64
import uuid
import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# AWS helpers
# ---------------------------------------------------------------------------


_CSV_HEADERS = ["Timestamp", "Name", "Email", "Department", "Telephone", "Hero Name", "Scores"]
_S3_CSV_KEY  = "leads.csv"


_S3_BUCKET = os.getenv("S3_BUCKET_NAME", "cloudstrive-quiz-leads")


def _save_lead_to_s3(lead: dict, hero: dict, scores: dict) -> None:
    bucket = _S3_BUCKET
    if not bucket:
        logger.warning("S3_BUCKET_NAME not set — skipping S3 save")
        return

    s3 = boto3.client("s3", region_name="eu-west-1")

    # Download existing CSV rows (or start fresh)
    existing_rows: list[list] = []
    try:
        resp = s3.get_object(Bucket=bucket, Key=_S3_CSV_KEY)
        raw = resp["Body"].read().decode("utf-8")
        existing_rows = list(csv.reader(io.StringIO(raw)))
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code == "NoSuchKey":
            pass  # first run — file doesn't exist yet
        elif code == "AccessDenied":
            # AWS returns AccessDenied (not NoSuchKey) when the key doesn't exist
            # and the caller lacks s3:ListBucket. Treat as empty file and continue;
            # the PutObject below will reveal if write access is also missing.
            logger.warning(
                "S3 GetObject access denied — assuming leads.csv doesn't exist yet. "
                "Add s3:GetObject + s3:PutObject + s3:ListBucket to the IAM user for %s.",
                bucket,
            )
        else:
            logger.error("S3 download failed: %s", exc)
            return

    # Build new row
    new_row = [
        datetime.utcnow().isoformat(),
        lead.get("name", ""),
        lead.get("email", ""),
        lead.get("department", ""),
        lead.get("telephone", ""),
        hero.get("name", ""),
        json.dumps(scores, ensure_ascii=False),
    ]

    buf = io.StringIO()
    writer = csv.writer(buf)
    if existing_rows:
        writer.writerows(existing_rows)
    else:
        writer.writerow(_CSV_HEADERS)
    writer.writerow(new_row)

    try:
        s3.put_object(
            Bucket=bucket,
            Key=_S3_CSV_KEY,
            Body=buf.getvalue().encode("utf-8"),
            ContentType="text/csv",
        )
        logger.info("Lead appended to s3://%s/%s", bucket, _S3_CSV_KEY)
    except ClientError as exc:
        logger.error("S3 upload failed: %s", exc)





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
    department: Optional[str] = ""
    telephone: Optional[str] = ""
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
    try:
        image_result = _generate_hero_image(hero_type, gender, body.photo)
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
        _save_lead_to_s3(body.lead.model_dump(), hero, body.scores)

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

def _generate_hero_image(
    hero_type: str, gender: str, photo_b64: Optional[str] = None
) -> Optional[str]:
    from hero_logic import build_image_prompt
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    prompt = build_image_prompt(hero_type, gender)
    client = genai.Client(api_key=api_key)

    # Build parts: optional selfie first so the model uses it for likeness,
    # then the text prompt describing the hero transformation.
    parts: list = []
    if photo_b64:
        raw = photo_b64.split(",", 1)[1] if "," in photo_b64 else photo_b64
        # Detect mime type from data-URI prefix (default jpeg from canvas)
        mime = "image/jpeg"
        if photo_b64.startswith("data:image/png"):
            mime = "image/png"
        parts.append(
            types.Part.from_bytes(data=base64.b64decode(raw), mime_type=mime)
        )
    parts.append(types.Part.from_text(text=prompt))

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=parts,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            img_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
            return f"data:{part.inline_data.mime_type};base64,{img_b64}"

    raise RuntimeError("Gemini returned no image in response")


