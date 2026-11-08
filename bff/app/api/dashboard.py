from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.auth_service import get_current_user
from app.services.stats_service import get_dashboard, get_history

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(_: str = Depends(get_current_user)) -> dict:
    try:
        return await get_dashboard()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Backend request failed: {exc}"
        ) from exc


@router.get("/history/{machine_id}")
async def history(
    machine_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    _: str = Depends(get_current_user),
) -> list[dict]:
    try:
        return await get_history(machine_id, limit)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Backend request failed: {exc}"
        ) from exc
