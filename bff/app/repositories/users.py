from psycopg import AsyncConnection
from psycopg.rows import dict_row

from app.core.config import settings


async def get_by_username(username: str) -> dict | None:
    conn = await AsyncConnection.connect(
        settings.database_dsn,
        row_factory=dict_row,
    )
    try:
        cursor = await conn.execute(
            """
            SELECT id, username, password_hash, is_active
            FROM users
            WHERE username = %s
            """,
            (username,),
        )
        return await cursor.fetchone()
    finally:
        await conn.close()


async def create_default_user(username: str, password_hash: str) -> None:
    conn = await AsyncConnection.connect(settings.database_dsn)
    try:
        await conn.execute(
            """
            INSERT INTO users (username, password_hash)
            VALUES (%s, %s)
            ON CONFLICT (username) DO NOTHING
            """,
            (username, password_hash),
        )
        await conn.commit()
    finally:
        await conn.close()
