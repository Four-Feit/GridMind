"""
API Routes for GridMind (P4 Integration Layer)
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


class GridUpdateRequest(BaseModel):
    """Manual grid state update — used by the Manual Mode UI controls and Power Balance card."""
    generation_mw: Optional[float] = Field(default=None, ge=0, description="Override total generation (MW)")
    demand_mw: Optional[float] = Field(default=None, ge=0, description="Override total demand (MW)")

    generator_id: Optional[str] = Field(default=None, description="Generator ID to update (e.g. G1)")
    generator_available_mw: Optional[float] = Field(default=None, ge=0, description="New available MW for the generator")
    generator_online: Optional[bool] = Field(default=None, description="Set generator online/offline")

    load_id: Optional[str] = Field(default=None, description="Load ID to update (e.g. HOSPITAL)")
    load_demand_mw: Optional[float] = Field(default=None, ge=0, description="New demand MW for the load")
    load_connected: Optional[bool] = Field(default=None, description="Connect or disconnect the load")

    battery_remaining_mwh: Optional[float] = Field(default=None, ge=0, description="Override battery remaining energy")
    battery_online: Optional[bool] = Field(default=None, description="Set battery online/offline")

    line_id: Optional[str] = Field(default=None, description="Transmission line ID to update (e.g. TL4)")
    line_online: Optional[bool] = Field(default=None, description="Trip or restore a transmission line")


@router.post("/grid/update")
def update_grid(req: GridUpdateRequest):
    """Applies manual changes to the simulator state from the Manual Mode UI or Power Balance card."""
    try:
        result = service.update_grid(
            generation_mw=req.generation_mw,
            demand_mw=req.demand_mw,
            generator_id=req.generator_id,
            generator_available_mw=req.generator_available_mw,
            generator_online=req.generator_online,
            load_id=req.load_id,
            load_demand_mw=req.load_demand_mw,
            load_connected=req.load_connected,
            battery_remaining_mwh=req.battery_remaining_mwh,
            battery_online=req.battery_online,
            line_id=req.line_id,
            line_online=req.line_online,
        )
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update grid: {str(e)}")
