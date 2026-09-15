# KPC Revenue Assurance & Demurrage Platform

A production-shaped system for Kenya Pipeline Company that turns gate
telemetry into verified demurrage invoices automatically: a deterministic
12-step calculation engine, a 6-rule compliance matrix, role-based billing
and dispute workflows, an immutable audit trail, and a SAP S/4HANA posting
simulation - fronted by a Next.js portal styled to KPC's real brand.

```
Next.js 16 (App Router, Tailwind v4)   FastAPI (Python)        SQLite (WAL mode)
        portal + public site   <--->   auth, calculation,  <--->  persisted volume,
        real KPC design tokens         compliance, billing        append-only audit log
```

## Prerequisites

- **Docker + Docker Compose** (recommended), or
- **Manual**: Python 3.12+, Node.js 20+

## Run it - Docker Compose (one command)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API + docs: http://localhost:8000/docs
- The database lives in a named Docker volume (`kpc-db-data`) and survives
  restarts and rebuilds. Seed data is only generated the first time the
  database is empty - it is never wiped on restart.

> **Note:** the Dockerfiles and compose file were written and reviewed
> carefully against both services' real dependencies, but they have not
> been build-tested in this environment (no Docker daemon was available
> while building this). Both services *have* been fully run and verified
> directly (Python venv + `npm run dev`/`build`) - if the Docker build
> surfaces anything, it's most likely a base-image or lockfile version
> issue, not an application bug.

## Run it - manually, without Docker

**Backend:**
```bash
cd backend-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.api.app:api_app --host 0.0.0.0 --port 8000
```

**Frontend** (in a second terminal):
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev
```

Then open http://localhost:3000.

## Demo accounts

The database seeds six real accounts on first startup (real bcrypt-hashed
passwords, checked through the normal login flow - the "quick login"
buttons on the sign-in page are a convenience, not a bypass):

| Role | Username | Password |
|---|---|---|
| Ops Controller | `juma.mwangi` | `OpsControl@2026` |
| Billing Approver | `sarah.ochieng` | `BillingApprove@2026` |
| Finance Lead | `david.kiprop` | `FinanceLead@2026` |
| Senior Auditor | `grace.wambui` | `AuditTrail@2026` |
| System Admin | `admin.controller` | `SysAdmin@2026` |
| OMC Representative (Vivo Energy) | `vivo.rep` | `OmcPortal@2026` |

New OMC representatives can also self-register at `/signup`. Internal KPC
roles (Ops/Billing/Finance/Auditor/Admin) are provisioned by an Admin, not
opened to self-signup - that boundary is enforced server-side.

## What's real vs. simulated

- **Real**: authentication (JWT + bcrypt), the calculation and compliance
  engines, all database reads/writes, the audit trail, CSV ingestion
  (upserts + recalculation), RBAC enforcement, CSV/HTML exports.
- **Simulated, by design**: the SAP S/4HANA push (`/api/v1/invoices/{id}/sync-erp`)
  generates a real, correctly-shaped OData billing payload and a reference
  number, but doesn't call an actual SAP instance - there isn't one to call
  in a demo environment. The response structure matches what a real
  integration would exchange.

## Uploading gate-log CSVs

The Reports & Exports page accepts a CSV with this header:

```
trip_id,truck_plate,carrier,customer_id,contract_id,depot_id,product,scheduled_gate_in,gate_in,gate_out,status
```

`customer_id`, `contract_id`, and `depot_id` must match existing records
(check `GET /api/v1/contracts` and `GET /api/v1/depots` for valid IDs).
Re-uploading the same `trip_id` updates that movement rather than creating
a duplicate. Any row with a `gate_out` value gets a full calculation and
compliance check run against it immediately.

## Project layout

```
kpc-platform/
├── backend-service/
│   └── backend/
│       ├── api/app.py          # FastAPI routes
│       ├── auth/                # JWT, bcrypt, RBAC dependencies
│       ├── calculation/         # Pure 12-step demurrage engine
│       ├── compliance/          # 6-rule scoring engine
│       ├── db/                  # Schema, repository, seed data
│       ├── erp/                 # SAP payload generator
│       ├── etl/                 # 8-stage pipeline + CSV ingestion
│       ├── export/              # Printable invoice HTML
│       ├── ml/                  # Anomaly detection, forecasting
│       └── audit/               # Immutable audit logger
├── frontend/
│   └── app/
│       ├── page.tsx              # Public landing page
│       ├── login/, signup/       # Auth pages
│       └── portal/               # Protected app (dashboard, movements,
│                                  # billing, compliance, disputes, etc.)
└── docker-compose.yml
```

## Currency

All monetary figures are in Kenyan Shillings (KES), scaled to realistic
contract rates for a Kenyan logistics operation.
