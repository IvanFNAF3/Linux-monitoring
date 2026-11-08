import asyncio
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings

ONLINE_WINDOW = timedelta(seconds=120)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _average(values: list[float | None]) -> float | None:
    actual = [value for value in values if value is not None]
    if not actual:
        return None
    return round(sum(actual) / len(actual), 2)


async def _get_json(client: httpx.AsyncClient, path: str):
    response = await client.get(path)
    response.raise_for_status()
    return response.json()


async def get_dashboard() -> dict:
    async with httpx.AsyncClient(
        base_url=settings.backend_url.rstrip("/"), timeout=10.0
    ) as client:
        machines = await _get_json(client, "/api/v1/machines")
        latest_metrics = await asyncio.gather(
            *[
                _get_json(client, f"/api/v1/machines/{machine['id']}/latest")
                for machine in machines
            ]
        )

    now = datetime.now(timezone.utc)
    items: list[dict] = []

    for machine, latest in zip(machines, latest_metrics):
        metric_time = _parse_datetime(latest.get("created_at")) if latest else None
        online = bool(metric_time and now - metric_time <= ONLINE_WINDOW)
        items.append(
            {
                "id": machine["id"],
                "name": machine["name"],
                "hostname": machine.get("hostname"),
                "os_info": machine.get("os_info"),
                "status": "online" if online else "offline",
                "last_seen_at": latest.get("created_at") if latest else None,
                "cpu_percent": latest.get("cpu_percent") if latest else None,
                "ram_percent": latest.get("ram_percent") if latest else None,
                "disk_percent": latest.get("disk_percent") if latest else None,
            }
        )

    return {
        "summary": {
            "machines": len(items),
            "online": sum(1 for item in items if item["status"] == "online"),
            "avg_cpu": _average([item["cpu_percent"] for item in items]),
            "avg_ram": _average([item["ram_percent"] for item in items]),
            "avg_disk": _average([item["disk_percent"] for item in items]),
        },
        "machines": items,
    }


async def get_history(machine_id: int, limit: int = 100) -> list[dict]:
    async with httpx.AsyncClient(
        base_url=settings.backend_url.rstrip("/"), timeout=10.0
    ) as client:
        metrics = await _get_json(
            client, f"/api/v1/machines/{machine_id}/metrics?limit={limit}"
        )

    # Backend отдаёт историю от новых к старым, для графика нужен прямой порядок.
    return list(reversed(metrics))
