from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Machine, Metric
from app.schemas.metric import MachineOut, MetricIn, MetricOut

router = APIRouter(prefix="/api/v1")


@router.post(
    "/metrics",
    response_model=MetricOut,
    status_code=status.HTTP_201_CREATED,
    tags=["metrics"],
)
def ingest_metric(payload: MetricIn, db: Session = Depends(get_db)) -> Metric:
    machine = db.scalar(select(Machine).where(Machine.name == payload.machine_name))
    if machine is None:
        machine = Machine(
            name=payload.machine_name,
            hostname=payload.hostname,
            os_info=payload.os_info,
        )
        db.add(machine)

    if payload.hostname:
        machine.hostname = payload.hostname
    if payload.os_info:
        machine.os_info = payload.os_info
    machine.last_seen_at = datetime.now(timezone.utc)

    db.flush()

    metric = Metric(
        machine_id=machine.id,
        cpu_percent=payload.cpu_percent,
        ram_percent=payload.ram_percent,
        disk_percent=payload.disk_percent,
        created_at=payload.created_at or datetime.now(timezone.utc),
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


@router.get("/machines", response_model=list[MachineOut], tags=["machines"])
def list_machines(db: Session = Depends(get_db)) -> list[Machine]:
    return list(db.scalars(select(Machine).order_by(Machine.name)))


@router.get(
    "/machines/{machine_id}",
    response_model=MachineOut,
    tags=["machines"],
)
def get_machine(machine_id: int, db: Session = Depends(get_db)) -> Machine:
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine


@router.get(
    "/machines/{machine_id}/latest",
    response_model=MetricOut | None,
    tags=["metrics"],
)
def get_latest_metric(
    machine_id: int, db: Session = Depends(get_db)
) -> Metric | None:
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")

    return db.scalar(
        select(Metric)
        .where(Metric.machine_id == machine_id)
        .order_by(Metric.created_at.desc())
        .limit(1)
    )


@router.get(
    "/machines/{machine_id}/metrics",
    response_model=list[MetricOut],
    tags=["metrics"],
)
def get_metric_history(
    machine_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[Metric]:
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")

    return list(
        db.scalars(
            select(Metric)
            .where(Metric.machine_id == machine_id)
            .order_by(Metric.created_at.desc())
            .limit(limit)
        )
    )
