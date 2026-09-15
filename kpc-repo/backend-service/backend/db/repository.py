"""
Data Access Repository for Demurrage Revenue Assurance.
Implements server-side filtering, pagination, sorting, aggregation, and atomic transactions.
"""
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from backend.db.session import get_db_connection
from backend.audit.logger import AuditLogger


class DemurrageRepository:
    # -------------------------------------------------------------
    # Depots
    # -------------------------------------------------------------
    @classmethod
    def get_depots(cls) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM depots ORDER BY name ASC")
            return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def get_depot_by_id(cls, depot_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM depots WHERE id = ? OR code = ?", (depot_id, depot_id))
            row = cursor.fetchone()
            return dict(row) if row else None

    # -------------------------------------------------------------
    # Contracts
    # -------------------------------------------------------------
    @classmethod
    def get_contracts(
        cls,
        status: Optional[str] = None,
        search: Optional[str] = None,
        include_deleted: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        conditions = []
        params = []

        if not include_deleted:
            conditions.append("is_deleted = 0")
        if status and status != "ALL":
            conditions.append("status = ?")
            params.append(status)
        if search:
            conditions.append("(code LIKE ? OR customer_name LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%"])

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with get_db_connection() as conn:
            cursor = conn.cursor()
            count_sql = f"SELECT COUNT(*) as total FROM contracts {where_clause}"
            cursor.execute(count_sql, params)
            total = cursor.fetchone()["total"]

            sql = f"""
                SELECT * FROM contracts
                {where_clause}
                ORDER BY customer_name ASC, version DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(sql, params + [limit, offset])
            rows = [dict(r) for r in cursor.fetchall()]
            return rows, total

    @classmethod
    def get_contract_by_id(cls, contract_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM contracts WHERE id = ? OR code = ?", (contract_id, contract_id))
            row = cursor.fetchone()
            return dict(row) if row else None

    @classmethod
    def save_contract(cls, contract_data: Dict[str, Any], user: str = "Admin", role: str = "Admin") -> str:
        cid = contract_data.get("id") or f"CTR-{uuid.uuid4().hex[:8].upper()}"
        is_new = not bool(contract_data.get("id"))
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if is_new:
                cursor.execute(
                    """
                    INSERT INTO contracts (
                        id, code, customer_id, customer_name, version,
                        free_time_mins, grace_period_mins, grace_cliff,
                        demurrage_rate_per_hr, detention_rate_per_day, detention_threshold_mins,
                        rounding_increment_mins, rounding_mode, weekend_multiplier, holiday_multiplier,
                        max_cap_amount, tax_rate, effective_date, expiry_date, status, is_deleted
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                    """,
                    (
                        cid,
                        contract_data["code"],
                        contract_data["customer_id"],
                        contract_data["customer_name"],
                        contract_data.get("version", "1.0"),
                        int(contract_data.get("free_time_mins", 120)),
                        int(contract_data.get("grace_period_mins", 15)),
                        1 if contract_data.get("grace_cliff") else 0,
                        float(contract_data.get("demurrage_rate_per_hr", 85.0)),
                        float(contract_data.get("detention_rate_per_day", 350.0)),
                        int(contract_data.get("detention_threshold_mins", 1440)),
                        int(contract_data.get("rounding_increment_mins", 60)),
                        contract_data.get("rounding_mode", "ceil"),
                        float(contract_data.get("weekend_multiplier", 1.0)),
                        float(contract_data.get("holiday_multiplier", 1.0)),
                        float(contract_data.get("max_cap_amount", 0.0)),
                        float(contract_data.get("tax_rate", 0.05)),
                        contract_data.get("effective_date", "2026-01-01"),
                        contract_data.get("expiry_date", "2027-12-31"),
                        contract_data.get("status", "ACTIVE"),
                    ),
                )
                AuditLogger.log("CONTRACT", cid, "CREATE", user, role, None, contract_data, f"Created contract {contract_data['code']}", conn=conn)
            else:
                cursor.execute(
                    """
                    UPDATE contracts SET
                        free_time_mins = ?, grace_period_mins = ?, grace_cliff = ?,
                        demurrage_rate_per_hr = ?, detention_rate_per_day = ?, detention_threshold_mins = ?,
                        rounding_increment_mins = ?, rounding_mode = ?, weekend_multiplier = ?, holiday_multiplier = ?,
                        max_cap_amount = ?, tax_rate = ?, effective_date = ?, expiry_date = ?, status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        int(contract_data.get("free_time_mins", 120)),
                        int(contract_data.get("grace_period_mins", 15)),
                        1 if contract_data.get("grace_cliff") else 0,
                        float(contract_data.get("demurrage_rate_per_hr", 85.0)),
                        float(contract_data.get("detention_rate_per_day", 350.0)),
                        int(contract_data.get("detention_threshold_mins", 1440)),
                        int(contract_data.get("rounding_increment_mins", 60)),
                        contract_data.get("rounding_mode", "ceil"),
                        float(contract_data.get("weekend_multiplier", 1.0)),
                        float(contract_data.get("holiday_multiplier", 1.0)),
                        float(contract_data.get("max_cap_amount", 0.0)),
                        float(contract_data.get("tax_rate", 0.05)),
                        contract_data.get("effective_date", "2026-01-01"),
                        contract_data.get("expiry_date", "2027-12-31"),
                        contract_data.get("status", "ACTIVE"),
                        cid,
                    ),
                )
                AuditLogger.log("CONTRACT", cid, "UPDATE", user, role, None, contract_data, f"Updated contract terms for {cid}", conn=conn)
        return cid

    @classmethod
    def soft_delete_contract(cls, contract_id: str, user: str, role: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE contracts SET is_deleted = 1, status = 'TERMINATED' WHERE id = ?", (contract_id,))
            AuditLogger.log("CONTRACT", contract_id, "DELETE", user, role, None, {"is_deleted": 1}, "Soft deleted contract", conn=conn)
            return cursor.rowcount > 0

    # -------------------------------------------------------------
    # Truck Movements (Dense Operational Table)
    # -------------------------------------------------------------
    @classmethod
    def get_movements(
        cls,
        depot_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        product: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: str = "gate_in",
        sort_dir: str = "DESC",
    ) -> Tuple[List[Dict[str, Any]], int]:
        conditions = []
        params = []

        if depot_id and depot_id != "ALL":
            conditions.append("m.depot_id = ?")
            params.append(depot_id)
        if customer_id and customer_id != "ALL":
            conditions.append("m.customer_id = ?")
            params.append(customer_id)
        if product and product != "ALL":
            conditions.append("m.product = ?")
            params.append(product)
        if status and status != "ALL":
            conditions.append("m.status = ?")
            params.append(status)
        if search:
            conditions.append("(m.trip_id LIKE ? OR m.truck_plate LIKE ? OR m.carrier LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        if start_date:
            conditions.append("m.gate_in >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("m.gate_in <= ?")
            params.append(end_date)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Validate sorting column to prevent injection
        allowed_sorts = {"gate_in", "trip_id", "truck_plate", "status", "product"}
        order_col = sort_by if sort_by in allowed_sorts else "gate_in"
        direction = "ASC" if sort_dir.upper() == "ASC" else "DESC"

        with get_db_connection() as conn:
            cursor = conn.cursor()
            count_sql = f"SELECT COUNT(*) as total FROM truck_movements m {where_clause}"
            cursor.execute(count_sql, params)
            total = cursor.fetchone()["total"]

            sql = f"""
                SELECT m.*, d.name as depot_name, d.code as depot_code,
                       c.code as contract_code, c.customer_name, c.free_time_mins, c.demurrage_rate_per_hr,
                       calc.total_turnaround_mins, calc.net_excess_mins, calc.total_amount as demurrage_charged,
                       comp.compliance_score, comp.status as compliance_status,
                       inv.invoice_number, inv.status as invoice_status
                FROM truck_movements m
                LEFT JOIN depots d ON m.depot_id = d.id
                LEFT JOIN contracts c ON m.contract_id = c.id
                LEFT JOIN calculations calc ON m.id = calc.movement_id
                LEFT JOIN compliance_checks comp ON m.id = comp.movement_id
                LEFT JOIN invoices inv ON m.id = inv.movement_id
                {where_clause}
                ORDER BY m.{order_col} {direction}
                LIMIT ? OFFSET ?
            """
            cursor.execute(sql, params + [limit, offset])
            rows = [dict(r) for r in cursor.fetchall()]
            return rows, total

    @classmethod
    def get_movement_by_id(cls, movement_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            sql = """
                SELECT m.*, d.name as depot_name, d.code as depot_code, d.baseline_turnaround_mins,
                       c.code as contract_code, c.customer_name, c.free_time_mins, c.grace_period_mins,
                       c.grace_cliff, c.demurrage_rate_per_hr, c.detention_rate_per_day, c.detention_threshold_mins,
                       c.rounding_increment_mins, c.rounding_mode, c.weekend_multiplier, c.holiday_multiplier,
                       c.max_cap_amount, c.tax_rate, c.status as contract_status,
                       calc.step_trace_json, calc.total_amount as demurrage_charged, calc.net_excess_mins,
                       calc.billable_hours, calc.input_hash, calc.audit_signature,
                       comp.compliance_score, comp.status as compliance_status, comp.rules_json,
                       inv.id as invoice_id, inv.invoice_number, inv.status as invoice_status, inv.erp_reference
                FROM truck_movements m
                LEFT JOIN depots d ON m.depot_id = d.id
                LEFT JOIN contracts c ON m.contract_id = c.id
                LEFT JOIN calculations calc ON m.id = calc.movement_id
                LEFT JOIN compliance_checks comp ON m.id = comp.movement_id
                LEFT JOIN invoices inv ON m.id = inv.movement_id
                WHERE m.id = ? OR m.trip_id = ?
            """
            cursor.execute(sql, (movement_id, movement_id))
            row = cursor.fetchone()
            return dict(row) if row else None

    @classmethod
    def save_movement(cls, m: Dict[str, Any], user: str = "ETL Ingest", role: str = "System") -> str:
        """
        Idempotent upsert of a truck movement keyed on trip_id. Re-ingesting the
        same trip_id (e.g. a re-uploaded or corrected CSV row) updates the
        existing record rather than duplicating it.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM truck_movements WHERE trip_id = ?", (m["trip_id"],))
            existing = cursor.fetchone()
            movement_id = existing["id"] if existing else f"MOV-{uuid.uuid4().hex[:10].upper()}"

            cursor.execute(
                """
                INSERT INTO truck_movements (
                    id, trip_id, truck_plate, carrier, customer_id, contract_id, depot_id, product,
                    bay_number, scheduled_gate_in, gate_in, queue_start, loading_start, loading_end,
                    gate_out, status, delay_reason, geofence_verified, weight_ticket_verified, gate_pass_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    truck_plate=excluded.truck_plate, carrier=excluded.carrier, customer_id=excluded.customer_id,
                    contract_id=excluded.contract_id, depot_id=excluded.depot_id, product=excluded.product,
                    bay_number=excluded.bay_number, scheduled_gate_in=excluded.scheduled_gate_in,
                    gate_in=excluded.gate_in, queue_start=excluded.queue_start, loading_start=excluded.loading_start,
                    loading_end=excluded.loading_end, gate_out=excluded.gate_out, status=excluded.status,
                    delay_reason=excluded.delay_reason, geofence_verified=excluded.geofence_verified,
                    weight_ticket_verified=excluded.weight_ticket_verified, gate_pass_verified=excluded.gate_pass_verified,
                    updated_at=CURRENT_TIMESTAMP
                """,
                (
                    movement_id, m["trip_id"], m["truck_plate"], m["carrier"], m["customer_id"],
                    m["contract_id"], m["depot_id"], m["product"], m.get("bay_number"),
                    m["scheduled_gate_in"], m["gate_in"], m.get("queue_start"), m.get("loading_start"),
                    m.get("loading_end"), m.get("gate_out"), m["status"], m.get("delay_reason"),
                    int(m.get("geofence_verified", 1)), int(m.get("weight_ticket_verified", 1)),
                    int(m.get("gate_pass_verified", 1)),
                ),
            )

        AuditLogger.log(
            "MOVEMENT", movement_id, "UPDATE" if existing else "CREATE", user, role,
            None, {"trip_id": m["trip_id"], "status": m["status"]},
            "Ingested via CSV gate-log upload" if role == "System" else "Movement record saved",
        )
        return movement_id

    # -------------------------------------------------------------
    # Calculations
    # -------------------------------------------------------------
    @classmethod
    def save_calculation(cls, calc_data: Dict[str, Any], user: str = "System", role: str = "System") -> str:
        cid = f"CLC-{uuid.uuid4().hex[:10].upper()}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Delete existing calculation for movement if re-running
            cursor.execute("DELETE FROM calculations WHERE movement_id = ?", (calc_data["movement_id"],))
            
            cursor.execute(
                """
                INSERT INTO calculations (
                    id, movement_id, contract_id, engine_version,
                    total_turnaround_mins, free_time_mins, grace_period_mins,
                    net_excess_mins, billable_hours, is_in_demurrage,
                    base_demurrage_amount, detention_days, detention_amount,
                    subtotal, capped_amount, waiver_amount, tax_amount, total_amount,
                    currency, step_trace_json, input_hash, audit_signature
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid,
                    calc_data["movement_id"],
                    calc_data["contract_id"],
                    calc_data.get("engine_version", "2.4.0"),
                    calc_data["total_turnaround_mins"],
                    calc_data["free_time_mins"],
                    calc_data["grace_period_mins"],
                    calc_data["net_excess_mins"],
                    calc_data["billable_demurrage_hours"],
                    1 if calc_data["is_in_demurrage"] else 0,
                    calc_data["demurrage_base_charge"],
                    calc_data.get("detention_days", 0),
                    calc_data.get("detention_charge", 0.0),
                    calc_data["subtotal"],
                    calc_data["capped_amount"],
                    calc_data.get("waiver_amount", 0.0),
                    calc_data["tax_amount"],
                    calc_data["total_charge"],
                    calc_data.get("currency", "KES"),
                    calc_data["step_trace_json"],
                    calc_data["input_hash"],
                    calc_data["audit_signature"],
                ),
            )
            AuditLogger.log("CALCULATION", cid, "CALCULATE", user, role, None, {"total_charge": calc_data["total_charge"]}, "Executed demurrage calculation", conn=conn)
        return cid

    # -------------------------------------------------------------
    # Compliance
    # -------------------------------------------------------------
    @classmethod
    def save_compliance_check(cls, comp_data: Dict[str, Any]) -> str:
        cid = f"CMP-{uuid.uuid4().hex[:10].upper()}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM compliance_checks WHERE movement_id = ?", (comp_data["movement_id"],))
            cursor.execute(
                """
                INSERT INTO compliance_checks (
                    id, movement_id, calculation_id, contract_code,
                    compliance_score, status, can_auto_invoice, summary, rules_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid,
                    comp_data["movement_id"],
                    comp_data.get("calculation_id"),
                    comp_data["contract_code"],
                    comp_data["compliance_score"],
                    comp_data["status"],
                    1 if comp_data["can_auto_invoice"] else 0,
                    comp_data["summary"],
                    comp_data["rules_json"],
                ),
            )
        return cid

    # -------------------------------------------------------------
    # Invoices & Billing
    # -------------------------------------------------------------
    @classmethod
    def get_invoices(
        cls,
        status: Optional[str] = None,
        customer_id: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        conditions = []
        params = []

        if status and status != "ALL":
            conditions.append("inv.status = ?")
            params.append(status)
        if customer_id and customer_id != "ALL":
            conditions.append("inv.customer_id = ?")
            params.append(customer_id)
        if search:
            conditions.append("(inv.invoice_number LIKE ? OR inv.customer_name LIKE ? OR m.trip_id LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with get_db_connection() as conn:
            cursor = conn.cursor()
            count_sql = f"SELECT COUNT(*) as total FROM invoices inv LEFT JOIN truck_movements m ON inv.movement_id = m.id {where_clause}"
            cursor.execute(count_sql, params)
            total = cursor.fetchone()["total"]

            sql = f"""
                SELECT inv.*, m.trip_id, m.truck_plate, m.gate_in, m.gate_out,
                       c.code as contract_code, calc.total_turnaround_mins, calc.billable_hours
                FROM invoices inv
                LEFT JOIN truck_movements m ON inv.movement_id = m.id
                LEFT JOIN calculations calc ON inv.calculation_id = calc.id
                LEFT JOIN contracts c ON m.contract_id = c.id
                {where_clause}
                ORDER BY inv.created_at DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(sql, params + [limit, offset])
            rows = [dict(r) for r in cursor.fetchall()]
            return rows, total

    @classmethod
    def get_invoice_by_id(cls, invoice_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            sql = """
                SELECT inv.*, m.trip_id, m.truck_plate, m.carrier, m.product, m.gate_in, m.gate_out,
                       d.name as depot_name, d.code as depot_code,
                       c.code as contract_code, c.customer_name, c.demurrage_rate_per_hr,
                       calc.total_turnaround_mins, calc.free_time_mins, calc.net_excess_mins,
                       calc.billable_hours, calc.base_demurrage_amount, calc.detention_amount,
                       calc.step_trace_json, calc.audit_signature
                FROM invoices inv
                LEFT JOIN truck_movements m ON inv.movement_id = m.id
                LEFT JOIN depots d ON m.depot_id = d.id
                LEFT JOIN contracts c ON m.contract_id = c.id
                LEFT JOIN calculations calc ON inv.calculation_id = calc.id
                WHERE inv.id = ? OR inv.invoice_number = ?
            """
            cursor.execute(sql, (invoice_id, invoice_id))
            row = cursor.fetchone()
            return dict(row) if row else None

    @classmethod
    def create_invoice(cls, invoice_data: Dict[str, Any], user: str, role: str) -> str:
        inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        inv_number = f"DMR-2026-{uuid.uuid4().hex[:6].upper()}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO invoices (
                    id, invoice_number, movement_id, customer_id, customer_name,
                    calculation_id, subtotal, tax_amount, total_amount, currency,
                    status, erp_sync_status, calculation_backup_json, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'NOT_SYNCED', ?, ?)
                """,
                (
                    inv_id,
                    inv_number,
                    invoice_data["movement_id"],
                    invoice_data["customer_id"],
                    invoice_data["customer_name"],
                    invoice_data["calculation_id"],
                    invoice_data["subtotal"],
                    invoice_data["tax_amount"],
                    invoice_data["total_amount"],
                    invoice_data.get("currency", "KES"),
                    invoice_data.get("calculation_backup_json", "{}"),
                    invoice_data.get("notes", "Auto-generated demurrage billing draft"),
                ),
            )
            AuditLogger.log("INVOICE", inv_id, "CREATE", user, role, None, {"invoice_number": inv_number, "total": invoice_data["total_amount"]}, "Created invoice draft", conn=conn)
        return inv_id

    @classmethod
    def update_invoice_status(cls, invoice_id: str, new_status: str, user: str, role: str, notes: Optional[str] = None) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM invoices WHERE id = ?", (invoice_id,))
            row = cursor.fetchone()
            if not row:
                return False
            prev_status = row["status"]

            now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            if new_status == "APPROVED":
                cursor.execute(
                    "UPDATE invoices SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?",
                    (new_status, user, now_str, invoice_id),
                )
            elif new_status == "ISSUED":
                cursor.execute(
                    "UPDATE invoices SET status = ?, issued_at = ? WHERE id = ?",
                    (new_status, now_str, invoice_id),
                )
            else:
                cursor.execute("UPDATE invoices SET status = ? WHERE id = ?", (new_status, invoice_id))

            AuditLogger.log("INVOICE", invoice_id, f"TRANSITION_{new_status}", user, role, {"status": prev_status}, {"status": new_status, "notes": notes}, f"Status transition to {new_status}", conn=conn)
            return True

    @classmethod
    def sync_invoice_erp(cls, invoice_id: str, erp_reference: str, user: str, role: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE invoices SET
                    status = 'SYNCED_TO_ERP',
                    erp_reference = ?,
                    erp_sync_status = 'SYNCED'
                WHERE id = ?
                """,
                (erp_reference, invoice_id),
            )
            AuditLogger.log("INVOICE", invoice_id, "SYNC_ERP", user, role, None, {"erp_ref": erp_reference}, f"Synchronized invoice to external ERP ({erp_reference})", conn=conn)
            return cursor.rowcount > 0

    # -------------------------------------------------------------
    # Disputes
    # -------------------------------------------------------------
    @classmethod
    def get_disputes(cls, status: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if status and status != "ALL":
            conditions.append("d.status = ?")
            params.append(status)
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with get_db_connection() as conn:
            cursor = conn.cursor()
            sql = f"""
                SELECT d.*, inv.invoice_number, inv.total_amount as invoice_total, m.trip_id, m.truck_plate
                FROM disputes d
                LEFT JOIN invoices inv ON d.invoice_id = inv.id
                LEFT JOIN truck_movements m ON d.movement_id = m.id
                {where_clause}
                ORDER BY d.created_at DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(sql, params + [limit, offset])
            return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def create_dispute(cls, dispute_data: Dict[str, Any], user: str, role: str) -> str:
        did = f"DSP-{uuid.uuid4().hex[:8].upper()}"
        d_num = f"DISP-2026-{uuid.uuid4().hex[:6].upper()}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO disputes (
                    id, dispute_number, invoice_id, movement_id, customer_name,
                    reason_code, description, disputed_amount, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DETECTED', ?)
                """,
                (
                    did,
                    d_num,
                    dispute_data["invoice_id"],
                    dispute_data["movement_id"],
                    dispute_data["customer_name"],
                    dispute_data["reason_code"],
                    dispute_data["description"],
                    dispute_data["disputed_amount"],
                    user,
                ),
            )
            # Mark invoice as DISPUTED
            cursor.execute("UPDATE invoices SET status = 'DISPUTED' WHERE id = ?", (dispute_data["invoice_id"],))
            AuditLogger.log("DISPUTE", did, "DISPUTE_OPEN", user, role, None, dispute_data, f"Opened dispute {d_num}", conn=conn)
        return did

    @classmethod
    def update_dispute_status(cls, dispute_id: str, new_status: str, resolution_notes: str, user: str, role: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE disputes SET
                    status = ?,
                    resolution_notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (new_status, resolution_notes, dispute_id),
            )
            AuditLogger.log("DISPUTE", dispute_id, f"DISPUTE_{new_status}", user, role, None, {"status": new_status, "notes": resolution_notes}, f"Dispute resolved to {new_status}", conn=conn)
            return True

    # -------------------------------------------------------------
    # Executive Dashboard & KPIs
    # -------------------------------------------------------------
    @classmethod
    def get_dashboard_kpis(cls) -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Total Revenue Protected (Invoiced + Synced + Paid)
            cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status IN ('APPROVED', 'ISSUED', 'SYNCED_TO_ERP', 'PAID')")
            revenue_protected = cursor.fetchone()["total"]

            # Unbilled Exposure (Calculations with demurrage > 0 not yet invoiced)
            cursor.execute("""
                SELECT COALESCE(SUM(calc.total_amount), 0) as total
                FROM calculations calc
                LEFT JOIN invoices inv ON calc.movement_id = inv.movement_id
                WHERE calc.total_amount > 0 AND (inv.id IS NULL OR inv.status = 'DRAFT')
            """)
            unbilled_exposure = cursor.fetchone()["total"]

            # Active Yard Risk (Trucks currently in yard exceeding free time)
            cursor.execute("""
                SELECT COUNT(*) as active_violations, COALESCE(SUM(calc.total_amount), 0) as active_risk
                FROM truck_movements m
                JOIN calculations calc ON m.id = calc.movement_id
                WHERE m.gate_out IS NULL AND calc.is_in_demurrage = 1
            """)
            active_risk_row = cursor.fetchone()
            active_violations = active_risk_row["active_violations"]
            active_risk_exposure = active_risk_row["active_risk"]

            # Total Movements & Average Turnaround
            cursor.execute("SELECT COUNT(*) as total, COALESCE(AVG(calc.total_turnaround_mins), 0) as avg_turnaround FROM truck_movements m JOIN calculations calc ON m.id = calc.movement_id")
            movements_row = cursor.fetchone()
            total_movements = movements_row["total"]
            avg_turnaround_mins = int(movements_row["avg_turnaround"])

            # Total Leakage Detected
            cursor.execute("SELECT COALESCE(SUM(leaked_amount), 0) as total FROM leakage_records WHERE status = 'OPEN'")
            leakage_exposure = cursor.fetchone()["total"]

            return {
                "revenue_protected": revenue_protected,
                "unbilled_exposure": unbilled_exposure,
                "active_risk_exposure": active_risk_exposure,
                "active_violations": active_violations,
                "total_movements": total_movements,
                "avg_turnaround_mins": avg_turnaround_mins,
                "leakage_exposure": leakage_exposure,
            }

    @classmethod
    def get_funnel_metrics(cls) -> Dict[str, int]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM truck_movements")
            total_movements = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM calculations WHERE total_turnaround_mins > free_time_mins")
            time_violations = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM calculations WHERE net_excess_mins > 0")
            contractually_billable = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM compliance_checks WHERE status = 'PASSED'")
            validated_charges = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM invoices WHERE status IN ('ISSUED', 'SYNCED_TO_ERP', 'PAID')")
            invoices_issued = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM invoices WHERE status = 'PAID'")
            collected = cursor.fetchone()[0]

            return {
                "total_movements": total_movements,
                "time_violations": time_violations,
                "contractually_billable": contractually_billable,
                "validated_charges": validated_charges,
                "invoices_issued": invoices_issued,
                "collected": collected,
            }

    @classmethod
    def get_leakage_records(cls) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT l.*, d.name as depot_name, m.trip_id, m.truck_plate
                FROM leakage_records l
                LEFT JOIN depots d ON l.depot_id = d.id
                LEFT JOIN truck_movements m ON l.movement_id = m.id
                ORDER BY l.leaked_amount DESC
            """)
            return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def get_etl_pipeline_runs(cls) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM etl_pipeline_runs ORDER BY started_at DESC LIMIT 20")
            return [dict(r) for r in cursor.fetchall()]
