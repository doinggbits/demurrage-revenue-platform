"""
Data access for the users table. Kept separate from the main DemurrageRepository
since it concerns identity, not operational/commercial revenue-assurance data.
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List

from backend.db.session import get_db_connection


class UserRepository:
    @classmethod
    def get_by_username(cls, username: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM users WHERE username = ? AND is_active = 1", (username,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    @classmethod
    def get_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM users WHERE id = ? AND is_active = 1", (user_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    @classmethod
    def list_active(cls) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, username, full_name, email, role, organization FROM users WHERE is_active = 1 ORDER BY role"
            )
            return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def create_user(
        cls,
        username: str,
        full_name: str,
        email: str,
        password_hash: str,
        role: str,
        organization: str = "Kenya Pipeline Company",
    ) -> str:
        user_id = f"USR-{uuid.uuid4().hex[:10].upper()}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users (id, username, full_name, email, password_hash, role, organization)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, username, full_name, email, password_hash, role, organization),
            )
        return user_id

    @classmethod
    def touch_last_login(cls, user_id: str) -> None:
        now_ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET last_login_at = ? WHERE id = ?", (now_ts, user_id)
            )

    @classmethod
    def count_users(cls) -> int:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as c FROM users")
            return cursor.fetchone()["c"]
