from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MetricIn(BaseModel):
    machine_name: str = Field(min_length=1, max_length=255)
    hostname: str | None = Field(default=None, max_length=255)
    os_info: str | None = Field(default=None, max_length=255)
    cpu_percent: float = Field(ge=0, le=100)
    ram_percent: float = Field(ge=0, le=100)
    disk_percent: float = Field(ge=0, le=100)
    created_at: datetime | None = None


class MetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    machine_id: int
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    created_at: datetime


class MachineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    hostname: str | None
    os_info: str | None
    last_seen_at: datetime | None
    created_at: datetime
