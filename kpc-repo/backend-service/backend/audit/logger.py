"""
Immutable Audit Trail Service.
Guarantees full regulatory auditability for all commercial terms, calculation traces,
operational overrides, and invoice approvals.
"""
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from backend.db.session import get_db_connection


class AuditLogger:
    @classmethod
    def log(
        cls,
        entity_type: str,
        entity_id: str,
        action: str,
        performed_by: str,
        user_role: str,
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        details: Optional[str] = None,
        ip_address: str = "127.0.0.1",
        conn=None,
    ) -> str:
        """
        Appends an immutable audit log record to the database.
        Returns the generated audit log record ID.

        Pass an existing `conn` when calling this from inside a repository
        method that already holds an open write transaction on the same
        SQLite file - opening a second connection there would deadlock
        against SQLite's single-writer lock.
        """
        log_id = f"AUD-{uuid.uuid4().hex[:10].upper()}"
        prev_json = json.dumps(previous_state) if previous_state else None
        new_json = json.dumps(new_state) if new_state else None
        now_ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        insert_sql = """
            INSERT INTO audit_logs (
                id, entity_type, entity_id, action, performed_by,
                user_role, previous_state_json, new_state_json, ip_address, details, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            log_id, entity_type.upper(), str(entity_id), action.upper(), performed_by,
            user_role, prev_json, new_json, ip_address, details or "", now_ts,
        )

        if conn is not None:
            conn.cursor().execute(insert_sql, params)
        else:
            with get_db_connection() as new_conn:
                new_conn.cursor().execute(insert_sql, params)
        return log_id

    @classmethod
    def get_logs_for_entity(cls, entity_type: str, entity_id: str) -> List[Dict[str, Any]]:
        """Retrieves chronological audit trail for a specific entity."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, entity_type, entity_id, action, performed_by,
                       user_role, previous_state_json, new_state_json, ip_address, details, timestamp
                FROM audit_logs
                WHERE entity_type = ? AND entity_id = ?
                ORDER BY timestamp DESC
                """,
                (entity_type.upper(), str(entity_id)),
            )
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @classmethod
    def get_recent_logs(cls, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves recent audit logs across all system activities."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, entity_type, entity_id, action, performed_by,
                       user_role, previous_state_json, new_state_json, ip_address, details, timestamp
                FROM audit_logs
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
