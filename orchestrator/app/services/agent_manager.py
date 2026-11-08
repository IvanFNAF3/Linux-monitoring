from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class AgentRegistration(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    hostname: str | None = None
    os_info: str | None = None


class AgentInfo(BaseModel):
    id: str
    name: str
    hostname: str | None = None
    os_info: str | None = None
    status: str = "online"
    last_seen_at: datetime


class AgentManager:
    """In-memory реестр агентов.

    Для production стоит заменить на Redis или таблицу в PostgreSQL.
    """

    def __init__(self) -> None:
        self._agents: dict[str, AgentInfo] = {}

    def register(self, payload: AgentRegistration) -> AgentInfo:
        now = datetime.now(timezone.utc)
        existing = self._agents.get(payload.name)
        agent = AgentInfo(
            id=existing.id if existing else str(uuid4()),
            name=payload.name,
            hostname=payload.hostname,
            os_info=payload.os_info,
            status="online",
            last_seen_at=now,
        )
        self._agents[payload.name] = agent
        return agent

    def heartbeat(self, name: str) -> AgentInfo | None:
        agent = self._agents.get(name)
        if agent is None:
            return None
        agent.last_seen_at = datetime.now(timezone.utc)
        agent.status = "online"
        return agent

    def list(self) -> list[AgentInfo]:
        return sorted(self._agents.values(), key=lambda item: item.name)


agent_manager = AgentManager()
