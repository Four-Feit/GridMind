"""
Grid Entity Models (Owned by P2)
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class Generator(BaseModel):
    id: str
    type: str = "generator"
    capacity_mw: float
    available_mw: float
    online: bool = True


class Substation(BaseModel):
    id: str
    type: str = "substation"
    online: bool = True


class TransmissionLine(BaseModel):
    id: str
    from_sub: str = Field(alias="from")
    to_sub: str = Field(alias="to")
    capacity_mw: float
    load_mw: float = 0.0
    online: bool = True


class Load(BaseModel):
    id: str
    type: str = "facility"
    demand_mw: float
    supplied_mw: float = 0.0
    priority: str = "normal"  # "critical" or "normal"
    connected: bool = True


class Battery(BaseModel):
    id: str
    capacity_mwh: float
    remaining_mwh: float
    max_output_mw: float
    online: bool = True


class GridState(BaseModel):
    timestamp: float
    generation_mw: float
    demand_mw: float
    generators: List[Generator] = Field(default_factory=list)
    substations: List[Substation] = Field(default_factory=list)
    transmission_lines: List[TransmissionLine] = Field(default_factory=list)
    loads: List[Load] = Field(default_factory=list)
    battery: Optional[Battery] = None
    failures: List[str] = Field(default_factory=list)
