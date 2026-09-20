from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Any, Dict


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="MedFlow Simulation API")
api_router = APIRouter(prefix="/api")

STATE_DOC_ID = "medflow_state"


class StateEnvelope(BaseModel):
    state: Dict[str, Any]


@api_router.get("/")
async def root():
    return {"message": "MedFlow Simulation API", "status": "online"}


@api_router.get("/state")
async def get_state():
    doc = await db.simulation_state.find_one({"_id": STATE_DOC_ID}, {"_id": 0})
    if not doc:
        return {"state": None}
    return {"state": doc.get("state")}


@api_router.put("/state")
async def save_state(envelope: StateEnvelope):
    if not isinstance(envelope.state, dict):
        raise HTTPException(status_code=400, detail="state must be an object")
    await db.simulation_state.update_one(
        {"_id": STATE_DOC_ID},
        {"$set": {"state": envelope.state}},
        upsert=True,
    )
    return {"ok": True}


@api_router.delete("/state")
async def delete_state():
    await db.simulation_state.delete_one({"_id": STATE_DOC_ID})
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
