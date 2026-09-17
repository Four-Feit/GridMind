"""
Grid Simulator Chaos Events (Owned by P2)
"""
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ChaosEventType(str, Enum):
    SUBSTATION_FAILURE = "SUBSTATION_FAILURE"
    TRANSMISSION_FAILURE = "TRANSMISSION_FAILURE"
    GENERATOR_FAILURE = "GENERATOR_FAILURE"
    WEATHER_DETERIORATION = "WEATHER_DETERIORATION"
    DEMAND_SPIKE = "DEMAND_SPIKE"
    BATTERY_DEPLETION = "BATTERY_DEPLETION"


class ChaosEvent(BaseModel):
    event_type: str = Field(description="Type of chaos event (e.g. SUBSTATION_FAILURE, WEATHER_DETERIORATION)")
    target: str = Field(default="", description="Target component ID")
    params: Dict[str, Any] = Field(default_factory=dict, description="Additional parameters (e.g. drop_mw, spike_mw)")


class ChaosEventResult(BaseModel):
    status: str
    event_type: str
    target: str
    message: str
    timestamp: float
    details: Optional[Dict[str, Any]] = None
