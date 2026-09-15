"""
FastAPI Application exposing authentication, calculation, compliance,
operational movements, billing, disputes, revenue leakage, ETL, and
AI/ML endpoints for the KPC Revenue Assurance & Demurrage Platform.
"""
import json
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Query, HTTPException, Body, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

from backend.config import ENGINE_VERSION, ENGINE_NAME
from backend.calculation.engine import DemurrageCalculationEngine
from backend.calculation.models import CalculationContext, CalculationResult
from backend.compliance.engine import ComplianceEngine
from backend.db.repository import DemurrageRepository
from backend.db.session import DatabaseSessionManager
from backend.ml.anomaly import AnomalyDetector
from backend.ml.forecasting import DemurrageForecaster
from backend.erp.connector import ERPConnector
from backend.etl.pipeline import ETLPipelineManager
from backend.etl.csv_ingest import ingest_csv_bytes
from backend.etl.scenarios import SCENARIOS, generate_scenario_csv, ingest_scenario_by_id
from backend.export.invoice_generator import InvoiceGenerator
from backend.audit.logger import AuditLogger

from backend.auth.security import verify_password, create_access_token, hash_password
from backend.auth.repository import UserRepository
from backend.auth.dependencies import (
    get_current_user,
    require_billing_approval,
    require_erp_push,
    require_dispute_adjudication,
    require_etl_trigger,
    require_tariff_edit,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Idempotent startup: create tables if absent, seed demo data only on a
    # genuinely empty database so restarts never wipe real work.
    from backend.db.seed_data import seed_database, seed_users

    DatabaseSessionManager.init_db()
    depot_count_row = DemurrageRepository.get_depots()
    if len(depot_count_row) == 0:
        seed_database()
    else:
        seed_users()  # always ensure the 6 demo accounts exist, without touching operational data
    yield


api_app = FastAPI(
    title="KPC Automated Demurrage & Revenue Assurance API",
    description="Deterministic calculation engine, compliance validation, and billing lifecycle service.",
    version=ENGINE_VERSION,
    lifespan=lifespan,
)

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_user(u: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": u["id"], "username": u["username"], "full_name": u["full_name"],
        "email": u["email"], "role": u["role"], "organization": u["organization"],
    }


@api_app.get("/health")
def health_check():
    return {"status": "healthy", "engine": ENGINE_NAME, "version": ENGINE_VERSION, "database": "CONNECTED"}


# -------------------------------------------------------------
# Authentication
# -------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


@api_app.post("/api/v1/auth/login")
def login(payload: LoginRequest):
    user = UserRepository.get_by_username(payload.username)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    UserRepository.touch_last_login(user["id"])
    AuditLogger.log("USER", user["id"], "LOGIN", user["full_name"], user["role"], details="Successful login")
    token = create_access_token(user["id"], user["username"], user["role"], user["full_name"])
    return {"access_token": token, "token_type": "bearer", "user": _safe_user(user)}


@api_app.get("/api/v1/auth/me")
def read_current_user(user: Dict[str, Any] = Depends(get_current_user)):
    return _safe_user(user)


@api_app.get("/api/v1/auth/demo-accounts")
def demo_accounts():
    """Public directory of demo role accounts for the login page - usernames and roles only, never passwords."""
    return {"data": UserRepository.list_active()}


class RegisterRequest(BaseModel):
    username: str
    full_name: str
    email: str
    password: str
    organization: str


@api_app.post("/api/v1/auth/register")
def register(payload: RegisterRequest):
    """
    Self-service registration. Scoped to the OMC Representative role only -
    internal KPC roles (Ops, Billing Approver, Finance, Auditor, Admin) carry
    real financial and compliance authority and are provisioned by an Admin,
    not opened to self-signup.
    """
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if UserRepository.get_by_username(payload.username) is not None:
        raise HTTPException(status_code=409, detail="That username is already taken")

    user_id = UserRepository.create_user(
        username=payload.username,
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="OMC Representative",
        organization=payload.organization,
    )
    AuditLogger.log("USER", user_id, "CREATE", payload.full_name, "OMC Representative", details=f"Self-registered OMC representative account for {payload.organization}")
    token = create_access_token(user_id, payload.username, "OMC Representative", payload.full_name)
    user = UserRepository.get_by_id(user_id)
    return {"access_token": token, "token_type": "bearer", "user": _safe_user(user)}


# -------------------------------------------------------------
# Calculation (pure, deterministic - no persistence, no auth required -
# this powers the public "what-if" calculator on the landing page)
# -------------------------------------------------------------
@api_app.post("/api/v1/calculate", response_model=CalculationResult)
def calculate_demurrage(ctx: CalculationContext):
    return DemurrageCalculationEngine.calculate(ctx)


# -------------------------------------------------------------
# Dashboard
# -------------------------------------------------------------
@api_app.get("/api/v1/kpis")
def get_kpis(user: Dict[str, Any] = Depends(get_current_user)):
    return DemurrageRepository.get_dashboard_kpis()


@api_app.get("/api/v1/funnel")
def get_funnel(user: Dict[str, Any] = Depends(get_current_user)):
    return DemurrageRepository.get_funnel_metrics()


# -------------------------------------------------------------
# Depots
# -------------------------------------------------------------
@api_app.get("/api/v1/depots")
def list_depots(user: Dict[str, Any] = Depends(get_current_user)):
    return {"data": DemurrageRepository.get_depots()}


# -------------------------------------------------------------
# Truck Movements
# -------------------------------------------------------------
@api_app.get("/api/v1/movements")
def list_movements(
    depot_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Dict[str, Any] = Depends(get_current_user),
):
    rows, total = DemurrageRepository.get_movements(
        depot_id=depot_id, customer_id=customer_id, product=product,
        status=status, search=search, limit=limit, offset=offset,
    )
    return {"total": total, "limit": limit, "offset": offset, "data": rows}


@api_app.get("/api/v1/movements/{movement_id}")
def get_movement(movement_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    m = DemurrageRepository.get_movement_by_id(movement_id)
    if not m:
        raise HTTPException(status_code=404, detail="Movement trip not found")
    return m


@api_app.get("/api/v1/movements/{movement_id}/audit-trail")
def get_movement_audit_trail(movement_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    m = DemurrageRepository.get_movement_by_id(movement_id)
    if not m:
        raise HTTPException(status_code=404, detail="Movement trip not found")
    return {"data": AuditLogger.get_logs_for_entity("MOVEMENT", m["id"])}


# -------------------------------------------------------------
# Contracts (TSAs) - tariff edits require Admin
# -------------------------------------------------------------
@api_app.get("/api/v1/contracts")
def list_contracts(status: Optional[str] = Query(None), user: Dict[str, Any] = Depends(get_current_user)):
    rows, total = DemurrageRepository.get_contracts(status=status)
    return {"total": total, "data": rows}


@api_app.get("/api/v1/contracts/{contract_id}")
def get_contract(contract_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    c = DemurrageRepository.get_contract_by_id(contract_id)
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    return c


@api_app.post("/api/v1/contracts")
def upsert_contract(contract: Dict[str, Any] = Body(...), user: Dict[str, Any] = Depends(require_tariff_edit)):
    contract_id = DemurrageRepository.save_contract(contract, user=user["full_name"], role=user["role"])
    return {"success": True, "contract_id": contract_id}


@api_app.delete("/api/v1/contracts/{contract_id}")
def delete_contract(contract_id: str, user: Dict[str, Any] = Depends(require_tariff_edit)):
    ok = DemurrageRepository.soft_delete_contract(contract_id, user=user["full_name"], role=user["role"])
    if not ok:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"success": True}


# -------------------------------------------------------------
# Compliance
# -------------------------------------------------------------
@api_app.get("/api/v1/movements/{movement_id}/compliance")
def get_movement_compliance(movement_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    m = DemurrageRepository.get_movement_by_id(movement_id)
    if not m:
        raise HTTPException(status_code=404, detail="Movement trip not found")
    contract = DemurrageRepository.get_contract_by_id(m["contract_id"])
    result = ComplianceEngine.evaluate_movement(m, contract)
    return result


# -------------------------------------------------------------
# Billing & Invoices
# -------------------------------------------------------------
@api_app.get("/api/v1/invoices")
def list_invoices(status: Optional[str] = Query(None), limit: int = 20, offset: int = 0, user: Dict[str, Any] = Depends(get_current_user)):
    rows, total = DemurrageRepository.get_invoices(status=status, limit=limit, offset=offset)
    return {"total": total, "data": rows}


@api_app.get("/api/v1/invoices/{invoice_id}")
def get_invoice(invoice_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    inv = DemurrageRepository.get_invoice_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@api_app.post("/api/v1/invoices")
def create_invoice(invoice: Dict[str, Any] = Body(...), user: Dict[str, Any] = Depends(get_current_user)):
    invoice_id = DemurrageRepository.create_invoice(invoice, user=user["full_name"], role=user["role"])
    return {"success": True, "invoice_id": invoice_id}


@api_app.post("/api/v1/invoices/{invoice_id}/approve")
def approve_invoice(invoice_id: str, user: Dict[str, Any] = Depends(require_billing_approval)):
    success = DemurrageRepository.update_invoice_status(invoice_id, "APPROVED", user["full_name"], user["role"])
    if not success:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"success": True, "invoice_id": invoice_id, "new_status": "APPROVED"}


@api_app.post("/api/v1/invoices/{invoice_id}/sync-erp")
def sync_invoice_to_erp(invoice_id: str, user: Dict[str, Any] = Depends(require_erp_push)):
    inv = DemurrageRepository.get_invoice_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    erp_res = ERPConnector.push_invoice_to_erp(inv)
    DemurrageRepository.sync_invoice_erp(invoice_id, erp_res["erp_reference"], user["full_name"], user["role"])
    return erp_res


@api_app.get("/api/v1/invoices/{invoice_id}/print", response_class=HTMLResponse)
def print_invoice(invoice_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    inv = DemurrageRepository.get_invoice_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return InvoiceGenerator.generate_html_invoice(inv)


# -------------------------------------------------------------
# Revenue Leakage
# -------------------------------------------------------------
@api_app.get("/api/v1/revenue-leakage")
def get_revenue_leakage(user: Dict[str, Any] = Depends(get_current_user)):
    return {"data": DemurrageRepository.get_leakage_records()}


# -------------------------------------------------------------
# AI / ML
# -------------------------------------------------------------
@api_app.get("/api/v1/anomalies")
def get_anomalies(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "depots": AnomalyDetector.detect_depot_anomalies(),
        "outlier_trucks": AnomalyDetector.detect_truck_turnaround_outliers(),
    }


@api_app.get("/api/v1/forecast")
def get_forecast(user: Dict[str, Any] = Depends(get_current_user)):
    return {"data": DemurrageForecaster.generate_14_day_forecast()}


# -------------------------------------------------------------
# Disputes - adjudication requires Billing Approver / Finance / Admin
# -------------------------------------------------------------
@api_app.get("/api/v1/disputes")
def list_disputes(status: Optional[str] = Query(None), limit: int = 50, offset: int = 0, user: Dict[str, Any] = Depends(get_current_user)):
    return {"data": DemurrageRepository.get_disputes(status=status, limit=limit, offset=offset)}


@api_app.post("/api/v1/disputes")
def open_dispute(dispute: Dict[str, Any] = Body(...), user: Dict[str, Any] = Depends(get_current_user)):
    dispute_id = DemurrageRepository.create_dispute(dispute, user=user["full_name"], role=user["role"])
    return {"success": True, "dispute_id": dispute_id}


@api_app.post("/api/v1/disputes/{dispute_id}/resolve")
def resolve_dispute(
    dispute_id: str,
    new_status: str = Body(..., embed=True),
    resolution_notes: str = Body("", embed=True),
    user: Dict[str, Any] = Depends(require_dispute_adjudication),
):
    ok = DemurrageRepository.update_dispute_status(dispute_id, new_status, resolution_notes, user["full_name"], user["role"])
    if not ok:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return {"success": True, "dispute_id": dispute_id, "new_status": new_status}


# -------------------------------------------------------------
# ETL Pipeline - triggering a sync requires Ops / Admin
# -------------------------------------------------------------
@api_app.get("/api/v1/etl/runs")
def get_etl_runs(user: Dict[str, Any] = Depends(get_current_user)):
    return {"data": ETLPipelineManager.get_latest_runs()}


@api_app.post("/api/v1/etl/trigger")
def trigger_etl(user: Dict[str, Any] = Depends(require_etl_trigger)):
    run_id = ETLPipelineManager.trigger_pipeline_sync(user=user["full_name"], role=user["role"])
    return {"success": True, "run_id": run_id}


# -------------------------------------------------------------
# CSV Gate-Log Ingestion (Reports & Exports page)
# -------------------------------------------------------------
@api_app.post("/api/v1/ingest/csv")
async def ingest_csv(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")
    content = await file.read()
    result = ingest_csv_bytes(content, file.filename, user=user["full_name"], role=user["role"])
    if not result["success"]:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@api_app.get("/api/v1/scenarios")
def list_scenarios():
    return {"data": SCENARIOS}


@api_app.post("/api/v1/scenarios/{scenario_id}/load")
def load_scenario(scenario_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    scenario_meta = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario_meta:
        raise HTTPException(status_code=404, detail="Scenario not found")
    res = ingest_scenario_by_id(scenario_id, user=user["full_name"], role=user["role"])
    return res


@api_app.get("/api/v1/scenarios/{scenario_id}/csv")
def download_scenario_csv(scenario_id: str):
    scenario_meta = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario_meta:
        raise HTTPException(status_code=404, detail="Scenario not found")
    csv_text = generate_scenario_csv(scenario_id)
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=kpc_{scenario_id}.csv"},
    )


# -------------------------------------------------------------
# Exports
# -------------------------------------------------------------
@api_app.get("/api/v1/exports/movements.csv")
def export_movements_csv(status: Optional[str] = Query(None), user: Dict[str, Any] = Depends(get_current_user)):
    rows, _ = DemurrageRepository.get_movements(status=status, limit=1000, offset=0)
    if not rows:
        raise HTTPException(status_code=404, detail="No movements match this filter")

    import csv
    import io
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=kpc_truck_movements_export.csv"},
    )


@api_app.get("/api/v1/exports/invoices.csv")
def export_invoices_csv(status: Optional[str] = Query(None), user: Dict[str, Any] = Depends(get_current_user)):
    rows, _ = DemurrageRepository.get_invoices(status=status, limit=1000, offset=0)
    if not rows:
        raise HTTPException(status_code=404, detail="No invoices match this filter")

    import csv
    import io
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=kpc_invoices_export.csv"},
    )


# -------------------------------------------------------------
# Audit Trail (Auditor / Admin view)
# -------------------------------------------------------------
@api_app.get("/api/v1/audit-logs")
def get_audit_logs(limit: int = Query(50, ge=1, le=500), user: Dict[str, Any] = Depends(get_current_user)):
    return {"data": AuditLogger.get_recent_logs(limit=limit)}
