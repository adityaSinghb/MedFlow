from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="MedFlow Simulation API")
api_router = APIRouter(prefix="/api")

STATE_DOC_ID = "medflow_state"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_COOKIE = "session_token"
SESSION_TTL_DAYS = 7


# ---------- Auth helpers ----------

def _extract_token(cookie_token: Optional[str], authorization: Optional[str]) -> Optional[str]:
    if cookie_token:
        return cookie_token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


async def _get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not expires_at or expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


async def require_user(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    token = _extract_token(session_token, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await _get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session invalid or expired")
    return user


# ---------- Models ----------

class StateEnvelope(BaseModel):
    state: Dict[str, Any]


class SessionExchange(BaseModel):
    session_id: str


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"message": "MedFlow Simulation API", "status": "online"}


@api_router.post("/auth/session")
async def exchange_session(payload: SessionExchange, response: Response):
    if not payload.session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": payload.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = data.get("email")
    name = data.get("name") or email
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=502, detail="Malformed auth response")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        user = {**existing, "name": name, "picture": picture}
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)

    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return {"user": {"user_id": user_id, "email": email, "name": name, "picture": picture}}


@api_router.get("/auth/me")
async def me(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    token = _extract_token(session_token, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await _get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session invalid or expired")
    return {"user": user}


@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    token = _extract_token(session_token, authorization)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


# ---------- Simulation state ----------

@api_router.get("/state")
async def get_state(user: Dict[str, Any] = None,  # kept unprotected for backward-compat with anonymous demo
                    session_token: Optional[str] = Cookie(default=None),
                    authorization: Optional[str] = Header(default=None)):
    # Optional auth: if authenticated, load per-user state. Otherwise fall back to shared demo doc.
    token = _extract_token(session_token, authorization)
    doc_id = STATE_DOC_ID
    if token:
        u = await _get_user_by_token(token)
        if u:
            doc_id = f"medflow_state::{u['user_id']}"
    doc = await db.simulation_state.find_one({"_id": doc_id}, {"_id": 0})
    if not doc:
        return {"state": None}
    return {"state": doc.get("state")}


@api_router.put("/state")
async def save_state(envelope: StateEnvelope,
                     session_token: Optional[str] = Cookie(default=None),
                     authorization: Optional[str] = Header(default=None)):
    if not isinstance(envelope.state, dict):
        raise HTTPException(status_code=400, detail="state must be an object")
    token = _extract_token(session_token, authorization)
    doc_id = STATE_DOC_ID
    if token:
        u = await _get_user_by_token(token)
        if u:
            doc_id = f"medflow_state::{u['user_id']}"
    await db.simulation_state.update_one(
        {"_id": doc_id},
        {"$set": {"state": envelope.state}},
        upsert=True,
    )
    return {"ok": True}


@api_router.delete("/state")
async def delete_state(session_token: Optional[str] = Cookie(default=None),
                       authorization: Optional[str] = Header(default=None)):
    token = _extract_token(session_token, authorization)
    doc_id = STATE_DOC_ID
    if token:
        u = await _get_user_by_token(token)
        if u:
            doc_id = f"medflow_state::{u['user_id']}"
    await db.simulation_state.delete_one({"_id": doc_id})
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
