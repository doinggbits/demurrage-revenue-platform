-- Database Schema for Demurrage & Detention Revenue Assurance Engine
-- Fully compatible with SQLite WAL and PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- Ops, Billing Approver, Finance, Auditor, Admin, OMC Representative
    organization TEXT NOT NULL DEFAULT 'Kenya Pipeline Company',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS depots (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    active_bays INTEGER NOT NULL DEFAULT 6,
    baseline_turnaround_mins INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    free_time_mins INTEGER NOT NULL DEFAULT 120,
    grace_period_mins INTEGER NOT NULL DEFAULT 15,
    grace_cliff INTEGER NOT NULL DEFAULT 0, -- 0=false, 1=true
    demurrage_rate_per_hr REAL NOT NULL DEFAULT 11000.0,
    detention_rate_per_day REAL NOT NULL DEFAULT 45000.0,
    detention_threshold_mins INTEGER NOT NULL DEFAULT 1440,
    rounding_increment_mins INTEGER NOT NULL DEFAULT 60,
    rounding_mode TEXT NOT NULL DEFAULT 'ceil',
    weekend_multiplier REAL NOT NULL DEFAULT 1.0,
    holiday_multiplier REAL NOT NULL DEFAULT 1.0,
    max_cap_amount REAL NOT NULL DEFAULT 0.0,
    tax_rate REAL NOT NULL DEFAULT 0.05,
    effective_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PENDING, EXPIRED, TERMINATED
    is_deleted INTEGER NOT NULL DEFAULT 0, -- Soft delete flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS truck_movements (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL UNIQUE,
    truck_plate TEXT NOT NULL,
    carrier TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    contract_id TEXT NOT NULL,
    depot_id TEXT NOT NULL,
    product TEXT NOT NULL,
    bay_number TEXT,
    scheduled_gate_in TIMESTAMP NOT NULL,
    gate_in TIMESTAMP NOT NULL,
    queue_start TIMESTAMP,
    loading_start TIMESTAMP,
    loading_end TIMESTAMP,
    gate_out TIMESTAMP, -- NULL if currently active in yard
    status TEXT NOT NULL, -- IN_TRANSIT, IN_QUEUE, LOADING, COMPLETED, VIOLATED
    delay_reason TEXT,
    geofence_verified INTEGER NOT NULL DEFAULT 1,
    weight_ticket_verified INTEGER NOT NULL DEFAULT 1,
    gate_pass_verified INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(contract_id) REFERENCES contracts(id),
    FOREIGN KEY(depot_id) REFERENCES depots(id)
);

CREATE TABLE IF NOT EXISTS calculations (
    id TEXT PRIMARY KEY,
    movement_id TEXT NOT NULL,
    contract_id TEXT NOT NULL,
    engine_version TEXT NOT NULL,
    total_turnaround_mins INTEGER NOT NULL,
    free_time_mins INTEGER NOT NULL,
    grace_period_mins INTEGER NOT NULL,
    net_excess_mins INTEGER NOT NULL,
    billable_hours REAL NOT NULL,
    is_in_demurrage INTEGER NOT NULL,
    base_demurrage_amount REAL NOT NULL,
    detention_days INTEGER NOT NULL DEFAULT 0,
    detention_amount REAL NOT NULL DEFAULT 0.0,
    subtotal REAL NOT NULL,
    capped_amount REAL NOT NULL,
    waiver_amount REAL NOT NULL DEFAULT 0.0,
    tax_amount REAL NOT NULL,
    total_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    step_trace_json TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    audit_signature TEXT NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(movement_id) REFERENCES truck_movements(id),
    FOREIGN KEY(contract_id) REFERENCES contracts(id)
);

CREATE TABLE IF NOT EXISTS compliance_checks (
    id TEXT PRIMARY KEY,
    movement_id TEXT NOT NULL UNIQUE,
    calculation_id TEXT,
    contract_code TEXT NOT NULL,
    compliance_score INTEGER NOT NULL,
    status TEXT NOT NULL, -- PASSED, REVIEW_REQUIRED, REJECTED
    can_auto_invoice INTEGER NOT NULL,
    summary TEXT NOT NULL,
    rules_json TEXT NOT NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(movement_id) REFERENCES truck_movements(id)
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    movement_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    calculation_id TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax_amount REAL NOT NULL,
    total_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, APPROVED, ISSUED, SYNCED_TO_ERP, PAID, DISPUTED, CANCELLED
    erp_reference TEXT,
    erp_sync_status TEXT NOT NULL DEFAULT 'NOT_SYNCED', -- NOT_SYNCED, PENDING_POSTING, SYNCED, SYNC_ERROR
    calculation_backup_json TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by TEXT,
    approved_at TIMESTAMP,
    issued_at TIMESTAMP,
    FOREIGN KEY(movement_id) REFERENCES truck_movements(id),
    FOREIGN KEY(calculation_id) REFERENCES calculations(id)
);

CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    dispute_number TEXT NOT NULL UNIQUE,
    invoice_id TEXT NOT NULL,
    movement_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    reason_code TEXT NOT NULL, -- DEPOT_CONGESTION, EQUIPMENT_BREAKDOWN, EDI_TIMESTAMP_GLITCH, WEATHER_FORCE_MAJEURE, CONTRACT_RATE_DISCREPANCY
    description TEXT NOT NULL,
    disputed_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'DETECTED', -- DETECTED, UNDER_REVIEW, EVIDENCE_COLLECTED, APPROVED, REJECTED, ADJUSTED, CLOSED
    evidence_json TEXT,
    resolution_notes TEXT,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id),
    FOREIGN KEY(movement_id) REFERENCES truck_movements(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL, -- CONTRACT, MOVEMENT, CALCULATION, INVOICE, DISPUTE, COMPLIANCE
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, CALCULATE, APPROVE, ISSUE, SYNC_ERP, OVERRIDE, DISPUTE_OPEN
    performed_by TEXT NOT NULL,
    user_role TEXT NOT NULL,
    previous_state_json TEXT,
    new_state_json TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS etl_pipeline_runs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    stage TEXT NOT NULL, -- RAW, VALIDATE, CLEAN, TRANSFORM, ENRICH, CALCULATE, ML, GOLD
    status TEXT NOT NULL, -- RUNNING, SUCCESS, WARNING, FAILED
    records_in INTEGER NOT NULL DEFAULT 0,
    records_out INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    error_log TEXT
);

CREATE TABLE IF NOT EXISTS leakage_records (
    id TEXT PRIMARY KEY,
    movement_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    depot_id TEXT NOT NULL,
    potential_amount REAL NOT NULL,
    invoiced_amount REAL NOT NULL,
    leaked_amount REAL NOT NULL,
    root_cause TEXT NOT NULL, -- MISSING_INVOICE, WRONG_RATE, UNVERIFIED_EVIDENCE, UNAUTHORIZED_WAIVER, MISSED_FREE_TIME_EXCESS
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RECOVERED, WRITTEN_OFF
    FOREIGN KEY(movement_id) REFERENCES truck_movements(id)
);

-- Indexes for high-throughput operational queries
CREATE INDEX IF NOT EXISTS idx_movements_depot_status ON truck_movements(depot_id, status);
CREATE INDEX IF NOT EXISTS idx_movements_customer ON truck_movements(customer_id);
CREATE INDEX IF NOT EXISTS idx_movements_gate_in ON truck_movements(gate_in);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_calculations_movement ON calculations(movement_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
