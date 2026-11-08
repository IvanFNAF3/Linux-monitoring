import hmac
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.agent_manager import (
    AgentInfo,
    AgentRegistration,
    agent_manager,
)

router = APIRouter(prefix="/api/v1")


class HeartbeatRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class MetricPayload(BaseModel):
    machine_name: str = Field(min_length=1, max_length=255)
    hostname: str | None = None
    os_info: str | None = None
    cpu_percent: float = Field(ge=0, le=100)
    ram_percent: float = Field(ge=0, le=100)
    disk_percent: float = Field(ge=0, le=100)
    created_at: datetime | None = None


def require_agent_key(x_agent_key: str = Header(default="")) -> None:
    expected = settings.agent_api_key
    if not expected or not hmac.compare_digest(x_agent_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent API key",
        )


@router.post(
    "/agents/register",
    response_model=AgentInfo,
    status_code=status.HTTP_201_CREATED,
    tags=["agents"],
)
def register_agent(
    payload: AgentRegistration,
    _: None = Depends(require_agent_key),
) -> AgentInfo:
    return agent_manager.register(payload)


@router.post(
    "/agents/heartbeat",
    response_model=AgentInfo,
    tags=["agents"],
)
def heartbeat(
    payload: HeartbeatRequest,
    _: None = Depends(require_agent_key),
) -> AgentInfo:
    agent = agent_manager.heartbeat(payload.name)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not registered")
    return agent


@router.get(
    "/agents",
    response_model=list[AgentInfo],
    tags=["agents"],
)
def list_agents() -> list[AgentInfo]:
    return agent_manager.list()


@router.post(
    "/metrics",
    status_code=status.HTTP_201_CREATED,
    tags=["metrics"],
)
async def receive_metrics(
    payload: MetricPayload,
    _: None = Depends(require_agent_key),
) -> dict:
    agent = agent_manager.heartbeat(payload.machine_name)
    if agent is None:
        agent_manager.register(
            AgentRegistration(
                name=payload.machine_name,
                hostname=payload.hostname,
                os_info=payload.os_info,
            )
        )

    url = f"{settings.backend_url.rstrip('/')}/api/v1/metrics"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload.model_dump(mode="json"))
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Backend is unavailable: {exc}",
        ) from exc

    return response.json()
