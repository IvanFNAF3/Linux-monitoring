import asyncpg

from app.core.config import settings


async def _connect() -> asyncpg.Connection:
    return await asyncpg.connect(settings.database_dsn)


async def get_by_username(username: str) -> dict | None:
    conn = await _connect()
    try:
        row = await conn.fetchrow(
            username,
        )
    finally:
        await conn.close()

    if row is None:
        return None
    return dict(row)


async def create_default_user(username: str, password_hash: str) -> None:
    conn = await _connect()
    try:
        await conn.execute(
            username,
            password_hash,
        )
    finally:
        await conn.close()
