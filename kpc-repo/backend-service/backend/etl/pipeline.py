"""
Operational Telemetry & Revenue Assurance ETL Pipeline.
Orchestrates and monitors 8 sequential data processing stages:
RAW -> VALIDATE -> CLEAN -> TRANSFORM -> ENRICH -> CALCULATE -> ML -> GOLD
"""
import uuid
import time
from datetime import datetime, timezone
from typing import List, Dict, Any
from backend.db.session import get_db_connection
from backend.audit.logger import AuditLogger


class ETLPipelineManager:
    STAGES = [
        ("RAW", "Ingest KPC Gate RFID & SCADA Telemetry Stream", 310),
        ("VALIDATE", "OMC Transport & Storage Agreement Schema Check", 305),
        ("CLEAN", "Deduplicate KRA ECTS & Weighbridge Jitter", 305),
        ("TRANSFORM", "Normalize Gantry Turnaround Timestamps (EAT/UTC)", 305),
        ("ENRICH", "Match Active OMC Tariffs & Product Classifications", 302),
        ("CALCULATE", "Deterministic Demurrage & Detention Engine v2.4", 302),
        ("ML", "Predictive Demurrage Risk & Turnaround Anomaly Scoring", 302),
        ("GOLD", "KPC Revenue Assurance Datamart & ERP Invoice Push", 302),
    ]

    @classmethod
    def get_latest_runs(cls) -> List[Dict[str, Any]]:
        """Retrieves the latest execution records for all 8 pipeline stages."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM etl_pipeline_runs
                ORDER BY started_at DESC
                LIMIT 8
                """
            )
            return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def trigger_pipeline_sync(cls, user: str = "Admin", role: str = "Admin") -> str:
        """
        Executes a real-time simulated sync across all 8 pipeline stages,
        recording metrics and audit events.
        """
        run_id = f"ETL-RUN-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
        now_dt = datetime.now(timezone.utc).replace(tzinfo=None)

        with get_db_connection() as conn:
            cursor = conn.cursor()
            for idx, (stage, desc, base_count) in enumerate(cls.STAGES):
                stage_id = f"ETL-{uuid.uuid4().hex[:8].upper()}"
                rejected = 3 if stage in ["VALIDATE", "ENRICH"] else 0
                rec_out = base_count - rejected
                duration_ms = 120 + idx * 35

                cursor.execute(
                    """
                    INSERT INTO etl_pipeline_runs (
                        id, run_id, stage, status, records_in, records_out, records_rejected,
                        started_at, completed_at, duration_ms, error_log
                    ) VALUES (?, ?, ?, 'SUCCESS', ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        stage_id,
                        run_id,
                        stage,
                        base_count,
                        rec_out,
                        rejected,
                        now_dt.strftime("%Y-%m-%d %H:%M:%S"),
                        now_dt.strftime("%Y-%m-%d %H:%M:%S"),
                        duration_ms,
                        f"Processed successfully: {desc}" if rejected == 0 else f"{rejected} non-compliant telemetry frames filtered",
                    ),
                )

        AuditLogger.log("ETL", run_id, "TRIGGER_SYNC", user, role, None, {"stages": len(cls.STAGES)}, f"Triggered full ETL pipeline sync {run_id}")
        return run_id
