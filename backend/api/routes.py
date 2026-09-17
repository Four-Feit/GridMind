"""
API Routes for GridMind (Owned by P4)
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.api.service import service

router = APIRouter()


class MissionStartRequest(BaseModel):
    goal: str = Field(default="Maintain power to critical facilities", description="The mission objective for the agent")
    pace_seconds: float = Field(default=1.0, ge=0.1, le=10.0, description="Execution delay between agent steps (seconds)")
    auto_run: bool = Field(default=True, description="Whether to automatically run the agent loop or wait for manual steps")


class ChaosEventRequest(BaseModel):
    event_type: str = Field(..., description="Type of chaos: SUBSTATION_FAILURE, WEATHER_DETERIORATION, DEMAND_SPIKE, etc.")
    target: str = Field(..., description="Target identifier (e.g., S2, G1, RESIDENTIAL_1, TL4)")
    params: Dict[str, Any] = Field(default_factory=dict, description="Additional parameters for the failure")


@router.post("/mission/start")
def start_mission(req: MissionStartRequest):
    """Starts a new agent mission towards the specified goal."""
    try:
        result = service.start_mission(goal=req.goal, pace_seconds=req.pace_seconds, auto_run=req.auto_run)
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start mission: {str(e)}")


@router.post("/mission/step")
def step_mission():
    """Executes a single step in the agent cycle."""
    try:
        result = service.step_mission()
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute step: {str(e)}")


@router.post("/mission/stop")
def stop_mission():
    """Pauses or stops the active mission loop."""
    try:
        result = service.stop_mission()
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop mission: {str(e)}")


@router.post("/mission/reset")
def reset_mission():
    """Resets simulator, agent, and event stream to clean baseline."""
    try:
        result = service.reset_all()
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset mission: {str(e)}")


@router.post("/chaos/event")
def inject_chaos(req: ChaosEventRequest):
    """Injects a physical or weather chaos event into the simulator."""
    try:
        result = service.inject_chaos(event_type=req.event_type, target=req.target, params=req.params)
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inject chaos event: {str(e)}")


@router.get("/grid/state")
def get_grid_state():
    """Returns the current physical power-grid state."""
    try:
        state = service.get_grid_state()
        return {"status": "ok", "state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve grid state: {str(e)}")


@router.get("/agent/state")
def get_agent_state():
    """Returns the agent's internal state (MissionState, memory, cycle count)."""
    try:
        state = service.get_agent_state()
        return {"status": "ok", "agent": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve agent state: {str(e)}")


@router.get("/events")
def get_events(limit: Optional[int] = Query(default=None, description="Max number of recent events to return")):
    """Returns the chronological execution trace of agent events."""
    try:
        events = service.get_events()
        if limit is not None and limit > 0:
            events = events[-limit:]
        return {"status": "ok", "count": len(events), "events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve events: {str(e)}")


@router.get("/capabilities")
def get_capabilities():
    """Returns all registered agent capabilities and their input schemas."""
    try:
        caps = service.get_capabilities()
        return {"status": "ok", "capabilities": caps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve capabilities: {str(e)}")
