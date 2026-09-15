"""
CSV Gate-Log Ingestion.
Accepts operational gate-log CSV uploads (the same shape as the seeded demo
data), upserts them into truck_movements, and - for any row where gate_out is
present - runs the real deterministic calculation engine and compliance
engine against it, exactly as the nightly ETL GOLD stage would.

Expected CSV columns (header row required):
trip_id, truck_plate, carrier, customer_id, contract_id, depot_id, product,
bay_number, scheduled_gate_in, gate_in, queue_start, loading_start,
loading_end, gate_out, status, delay_reason, geofence_verified,
weight_ticket_verified, gate_pass_verified

Only trip_id, truck_plate, carrier, customer_id, contract_id, depot_id,
product, scheduled_gate_in, gate_in and status are required; the rest are
optional and default sensibly.
"""
import io
import json
from datetime import datetime, timezone
from typing import Dict, Any, List

import pandas as pd

from backend.db.repository import DemurrageRepository
from backend.calculation.engine import DemurrageCalculationEngine
from backend.calculation.models import CalculationContext
from backend.compliance.engine import ComplianceEngine
from backend.audit.logger import AuditLogger

TIMESTAMP_FIELDS = ["scheduled_gate_in", "gate_in", "queue_start", "loading_start", "loading_end", "gate_out"]


def _normalize_timestamp(value: Any) -> Any:
    """SQLite's PARSE_DECLTYPES converter expects 'YYYY-MM-DD HH:MM:SS', not ISO's 'T' separator."""
    if value is None:
        return None
    try:
        return pd.to_datetime(value).strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return value



REQUIRED_COLUMNS = [
    "trip_id", "truck_plate", "carrier", "customer_id", "contract_id",
    "depot_id", "product", "scheduled_gate_in", "gate_in", "status",
]


def ingest_csv_bytes(file_bytes: bytes, filename: str, user: str, role: str) -> Dict[str, Any]:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as exc:
        return {"success": False, "error": f"Could not parse CSV: {exc}", "rows_processed": 0}

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        return {
            "success": False,
            "error": f"CSV is missing required column(s): {', '.join(missing)}",
            "rows_processed": 0,
        }

    df = df.where(pd.notnull(df), None)

    accepted, rejected, calculated = 0, 0, 0
    errors: List[Dict[str, Any]] = []

    for idx, raw in enumerate(df.to_dict(orient="records")):
        try:
            movement = {k: raw.get(k) for k in [
                "trip_id", "truck_plate", "carrier", "customer_id", "contract_id",
                "depot_id", "product", "bay_number", "scheduled_gate_in", "gate_in",
                "queue_start", "loading_start", "loading_end", "gate_out", "status",
                "delay_reason", "geofence_verified", "weight_ticket_verified", "gate_pass_verified",
            ] if k in raw and raw.get(k) is not None}
            for field in TIMESTAMP_FIELDS:
                if field in movement:
                    movement[field] = _normalize_timestamp(movement[field])
            movement_id = DemurrageRepository.save_movement(movement, user=user, role="System")
            accepted += 1

            if movement.get("gate_out"):
                contract = DemurrageRepository.get_contract_by_id(movement["contract_id"])
                if contract is None:
                    errors.append({"row": idx + 2, "trip_id": movement["trip_id"], "error": "Unknown contract_id - movement saved, calculation skipped"})
                    continue

                full_movement = DemurrageRepository.get_movement_by_id(movement_id)
                ctx = CalculationContext(
                    movement_id=movement_id,
                    truck_plate=movement["truck_plate"],
                    gate_in=movement["gate_in"],
                    gate_out=movement["gate_out"],
                    contract_id=contract["id"],
                    contract_code=contract["code"],
                    free_time_mins=contract["free_time_mins"],
                    grace_period_mins=contract["grace_period_mins"],
                    grace_cliff=bool(contract["grace_cliff"]),
                    demurrage_rate_per_hr=contract["demurrage_rate_per_hr"],
                    detention_rate_per_day=contract["detention_rate_per_day"],
                    detention_threshold_mins=contract["detention_threshold_mins"],
                    rounding_increment_mins=contract["rounding_increment_mins"],
                    rounding_mode=contract["rounding_mode"],
                    weekend_multiplier=contract["weekend_multiplier"],
                    holiday_multiplier=contract["holiday_multiplier"],
                    max_cap_amount=contract["max_cap_amount"],
                    tax_rate=contract["tax_rate"],
                    currency="KES",
                )
                calc_result = DemurrageCalculationEngine.calculate(ctx)
                calc_data = calc_result.model_dump()
                calc_data["movement_id"] = movement_id
                calc_data["contract_id"] = contract["id"]
                calc_data["step_trace_json"] = json.dumps([s.model_dump() for s in calc_result.step_trace])
                calc_id = DemurrageRepository.save_calculation(calc_data, user=user, role="System")

                comp_result = ComplianceEngine.evaluate_movement(full_movement, contract)
                DemurrageRepository.save_compliance_check({
                    "movement_id": movement_id,
                    "calculation_id": calc_id,
                    "contract_code": contract["code"],
                    "compliance_score": comp_result.compliance_score,
                    "status": comp_result.status,
                    "can_auto_invoice": comp_result.can_auto_invoice,
                    "summary": comp_result.summary,
                    "rules_json": json.dumps([r.model_dump() for r in comp_result.rules]),
                })
                calculated += 1
        except Exception as exc:
            rejected += 1
            errors.append({"row": idx + 2, "trip_id": raw.get("trip_id", "?"), "error": str(exc)})

    AuditLogger.log(
        "ETL", f"CSV-{filename}", "CSV_INGEST", user, role,
        None,
        {"accepted": accepted, "rejected": rejected, "calculated": calculated},
        f"Ingested {filename}: {accepted} movements accepted, {calculated} recalculated, {rejected} rejected",
    )

    return {
        "success": True,
        "filename": filename,
        "rows_processed": len(df),
        "movements_accepted": accepted,
        "calculations_run": calculated,
        "rows_rejected": rejected,
        "errors": errors[:20],
        "ingested_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
    }
