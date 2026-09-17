"""
API Routes (Owned by P4)
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class MissionStartRequest(BaseModel):
    goal: str = "Maintain power to critical facilities"


class ChaosEventRequest(BaseModel):
    event_type: str
    target: str


@router.post("/mission/start")
def start_mission(req: MissionStartRequest):
    return {"status": "started", "goal": req.goal}


@router.post("/chaos/event")
def inject_chaos(req: ChaosEventRequest):
    return {"status": "injected", "event": req.model_dump()}


@router.get("/grid/state")
def get_grid_state():
    return {"status": "ok", "state": {}}


@router.get("/agent/state")
def get_agent_state():
    return {"status": "ok", "agent": {}}


@router.get("/events")
def get_events():
    return {"events": []}
