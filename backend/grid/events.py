"""
Grid Simulator Chaos Events (Owned by P2)
"""
from typing import Any, Dict
from pydantic import BaseModel


class ChaosEvent(BaseModel):
    event_type: str  # SUBSTATION_FAILURE, GENERATOR_FAILURE, WEATHER_DETERIORATION, DEMAND_SPIKE
    target: str
    params: Dict[str, Any] = {}
