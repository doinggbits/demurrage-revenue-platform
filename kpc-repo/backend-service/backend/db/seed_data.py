"""
Realistic Operational Data Seeder for KPC (Kenya Pipeline Company)
Automated Demurrage & Detention Billing and Revenue Assurance Engine.

Models real KPC infrastructure:
- Terminals: KOSF/Mombasa (PS01), Nairobi Terminal (PS10), Nakuru (PS25), Eldoret (PS27), Kisumu (PS28)
- Oil Marketing Companies (OMCs): Vivo Energy, TotalEnergies, Rubis Energy, Ola Energy, Galana Oil, Hass Petroleum, Dalbit Petroleum, NOCK
- Products: Motor Gasoline (MOGAS / PMS), Automotive Gas Oil (AGO / Diesel), Jet A-1, Dual Purpose Kerosene (DPK)
- Compliance: KRA ECTS seal verification, EPRA tanker certification, KPC quality lab testing, weighbridge tare/gross.
"""
import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from backend.db.session import DatabaseSessionManager
from backend.calculation.engine import DemurrageCalculationEngine
from backend.calculation.models import CalculationContext
from backend.compliance.engine import ComplianceEngine
from backend.audit.logger import AuditLogger
from backend.auth.security import hash_password


# The 6 demo accounts from the platform specification. Passwords are real
# (bcrypt-hashed, checked through the normal login endpoint) so the "quick
# login" buttons on the frontend are a convenience, not an auth bypass.
# Format: (username, full_name, email, password, role, organization)
DEMO_USERS = [
    ("carson.sila", "Carson Sila", "carson.sila@kpc.co.ke", "OpsControl@2026", "Ops", "Kenya Pipeline Company"),
    ("charlene.kamunyu", "Charlene Kamunyu", "charlene.kamunyu@kpc.co.ke", "BillingApprove@2026", "Billing Approver", "Kenya Pipeline Company"),
    ("emanuel.brian", "Emanuel Brian", "emanuel.brian@kpc.co.ke", "FinanceLead@2026", "Finance", "Kenya Pipeline Company"),
    ("brian.sigei", "Brian Sigei", "brian.sigei@kpc.co.ke", "AuditTrail@2026", "Auditor", "Kenya Pipeline Company"),
    ("brian.mugambi", "Brian Mugambi", "brian.mugambi@kpc.co.ke", "SysAdmin@2026", "Admin", "Kenya Pipeline Company"),
    ("river.leah", "River Leah", "river.leah@vivoenergy.co.ke", "OmcPortal@2026", "OMC Representative", "Vivo Energy Kenya"),
    # Compatibility aliases
    ("juma.mwangi", "Carson Sila", "juma.mwangi@kpc.co.ke", "OpsControl@2026", "Ops", "Kenya Pipeline Company"),
    ("sarah.ochieng", "Charlene Kamunyu", "sarah.ochieng@kpc.co.ke", "BillingApprove@2026", "Billing Approver", "Kenya Pipeline Company"),
    ("david.kiprop", "Emanuel Brian", "david.kiprop@kpc.co.ke", "FinanceLead@2026", "Finance", "Kenya Pipeline Company"),
    ("grace.wambui", "Brian Sigei", "grace.wambui@kpc.co.ke", "AuditTrail@2026", "Auditor", "Kenya Pipeline Company"),
    ("admin.controller", "Brian Mugambi", "admin@kpc.co.ke", "SysAdmin@2026", "Admin", "Kenya Pipeline Company"),
    ("vivo.rep", "River Leah", "omc.rep@vivoenergy.co.ke", "OmcPortal@2026", "OMC Representative", "Vivo Energy Kenya"),
]


def seed_users():
    """Seeds the 6 demo role accounts. Safe to call repeatedly - skips usernames that already exist."""
    from backend.auth.repository import UserRepository

    print("Seeding demo user accounts...")
    for username, full_name, email, password, role, org in DEMO_USERS:
        existing = UserRepository.get_by_username(username)
        if existing is None:
            UserRepository.create_user(
                username=username,
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                role=role,
                organization=org,
            )
        else:
            with DatabaseSessionManager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE users SET full_name = ?, email = ?, password_hash = ?, role = ?, organization = ? WHERE username = ?",
                    (full_name, email, hash_password(password), role, org, username),
                )
    print(f"User accounts ready ({len(DEMO_USERS)} demo roles).")


def seed_database():
    print("Initializing database schema for KPC Kenya Pipeline...")
    DatabaseSessionManager.init_db()
    seed_users()

    conn = DatabaseSessionManager.get_connection()
    cursor = conn.cursor()

    # Clear existing tables
    for tbl in [
        "disputes", "leakage_records", "invoices", "compliance_checks",
        "calculations", "truck_movements", "contracts", "depots", "audit_logs", "etl_pipeline_runs"
    ]:
        cursor.execute(f"DELETE FROM {tbl}")
    conn.commit()

    print("Seeding KPC Depot & Terminal Network...")
    depots = [
        {
            "id": "DEP-KPC-MBO",
            "code": "KOSF-PS01",
            "name": "KPC Kipevu Oil Storage Facility (Mombasa Port Terminal)",
            "latitude": -4.0383,
            "longitude": 39.6358,
            "capacity": 120,
            "active_bays": 12,
            "baseline_turnaround_mins": 90,
        },
        {
            "id": "DEP-KPC-NBI",
            "code": "NBI-PS10",
            "name": "KPC Nairobi Terminal (Industrial Area & Embakasi Depot)",
            "latitude": -1.3167,
            "longitude": 36.8625,
            "capacity": 150,
            "active_bays": 16,
            "baseline_turnaround_mins": 85,
        },
        {
            "id": "DEP-KPC-NAK",
            "code": "NAK-PS25",
            "name": "KPC Nakuru Depot (Rift Valley Loading Hub)",
            "latitude": -0.2833,
            "longitude": 36.0667,
            "capacity": 80,
            "active_bays": 8,
            "baseline_turnaround_mins": 75,
        },
        {
            "id": "DEP-KPC-ELD",
            "code": "ELD-PS27",
            "name": "KPC Eldoret Depot (Western & Uganda Transit Gateway)",
            "latitude": 0.5143,
            "longitude": 35.2698,
            "capacity": 95,
            "active_bays": 10,
            "baseline_turnaround_mins": 80,
        },
        {
            "id": "DEP-KPC-KIS",
            "code": "KIS-PS28",
            "name": "KPC Kisumu Depot & Lake Jetty (Great Lakes Corridor)",
            "latitude": -0.0917,
            "longitude": 34.7680,
            "capacity": 110,
            "active_bays": 12,
            "baseline_turnaround_mins": 80,
        },
    ]

    for d in depots:
        cursor.execute(
            """
            INSERT INTO depots (id, code, name, latitude, longitude, capacity, active_bays, baseline_turnaround_mins)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (d["id"], d["code"], d["name"], d["latitude"], d["longitude"], d["capacity"], d["active_bays"], d["baseline_turnaround_mins"]),
        )

    print("Seeding KPC Transport & Storage Agreements (TSA Commercial Contracts)...")
    contracts = [
        {
            "id": "CTR-VIVO-01",
            "code": "KPC-TSA-VIVO-2026",
            "customer_id": "OMC-VIVO",
            "customer_name": "Vivo Energy Kenya (Shell Licensee)",
            "version": "2.1",
            "free_time_mins": 120,
            "grace_period_mins": 15,
            "grace_cliff": 0,
            "demurrage_rate_per_hr": 11700.0,
            "detention_rate_per_day": 49400.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 60,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.25,
            "holiday_multiplier": 1.5,
            "max_cap_amount": 325000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-TOT-02",
            "code": "KPC-TSA-TOT-2026",
            "customer_id": "OMC-TOT",
            "customer_name": "TotalEnergies Marketing Kenya",
            "version": "1.3",
            "free_time_mins": 120,
            "grace_period_mins": 15,
            "grace_cliff": 0,
            "demurrage_rate_per_hr": 12350.0,
            "detention_rate_per_day": 52000.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 60,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.2,
            "holiday_multiplier": 1.5,
            "max_cap_amount": 390000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-RUB-03",
            "code": "KPC-TSA-RUB-2026",
            "customer_id": "OMC-RUB",
            "customer_name": "Rubis Energy Kenya",
            "version": "1.0",
            "free_time_mins": 100,
            "grace_period_mins": 10,
            "grace_cliff": 1,
            "demurrage_rate_per_hr": 13650.0,
            "detention_rate_per_day": 54600.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 30,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.5,
            "holiday_multiplier": 2.0,
            "max_cap_amount": 455000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-OLA-04",
            "code": "KPC-TSA-OLA-2026",
            "customer_id": "OMC-OLA",
            "customer_name": "Ola Energy Kenya",
            "version": "1.1",
            "free_time_mins": 120,
            "grace_period_mins": 20,
            "grace_cliff": 0,
            "demurrage_rate_per_hr": 11050.0,
            "detention_rate_per_day": 45500.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 60,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.0,
            "holiday_multiplier": 1.25,
            "max_cap_amount": 260000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-GAL-05",
            "code": "KPC-TSA-GAL-2026",
            "customer_id": "OMC-GAL",
            "customer_name": "Galana Oil Kenya Ltd",
            "version": "1.0",
            "free_time_mins": 110,
            "grace_period_mins": 15,
            "grace_cliff": 0,
            "demurrage_rate_per_hr": 11700.0,
            "detention_rate_per_day": 49400.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 60,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.25,
            "holiday_multiplier": 1.5,
            "max_cap_amount": 286000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-HASS-06",
            "code": "KPC-TSA-HASS-2026",
            "customer_id": "OMC-HASS",
            "customer_name": "Hass Petroleum Kenya (Great Lakes Corridor)",
            "version": "1.2",
            "free_time_mins": 150,
            "grace_period_mins": 20,
            "grace_cliff": 0,
            "demurrage_rate_per_hr": 11050.0,
            "detention_rate_per_day": 46800.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 60,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.3,
            "holiday_multiplier": 1.6,
            "max_cap_amount": 364000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-DAL-07",
            "code": "KPC-TSA-DAL-2026",
            "customer_id": "OMC-DAL",
            "customer_name": "Dalbit Petroleum (Transit Export)",
            "version": "2.0",
            "free_time_mins": 120,
            "grace_period_mins": 15,
            "grace_cliff": 1,
            "demurrage_rate_per_hr": 13000.0,
            "detention_rate_per_day": 58500.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 30,
            "rounding_mode": "ceil",
            "weekend_multiplier": 1.5,
            "holiday_multiplier": 2.0,
            "max_cap_amount": 416000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
        {
            "id": "CTR-NOCK-08",
            "code": "KPC-TSA-NOCK-2026",
            "customer_id": "OMC-NOCK",
            "customer_name": "National Oil Corporation of Kenya (NOCK)",
            "version": "1.0",
            "free_time_mins": 180,
            "grace_period_mins": 30,
            "grace_cliff": 0,
            "demurrage_rate_per_hr": 10400.0,
            "detention_rate_per_day": 41600.0,
            "detention_threshold_mins": 1440,
            "rounding_increment_mins": 60,
            "rounding_mode": "floor",
            "weekend_multiplier": 1.0,
            "holiday_multiplier": 1.2,
            "max_cap_amount": 260000.0,
            "tax_rate": 0.05,
            "effective_date": "2026-01-01",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
        },
    ]

    for c in contracts:
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
                c["id"], c["code"], c["customer_id"], c["customer_name"], c["version"],
                c["free_time_mins"], c["grace_period_mins"], c["grace_cliff"],
                c["demurrage_rate_per_hr"], c["detention_rate_per_day"], c["detention_threshold_mins"],
                c["rounding_increment_mins"], c["rounding_mode"], c["weekend_multiplier"], c["holiday_multiplier"],
                c["max_cap_amount"], c["tax_rate"], c["effective_date"], c["expiry_date"], c["status"],
            ),
        )

    products = [
        "Motor Gasoline Premium (MOGAS / Super)",
        "Automotive Gas Oil (AGO / Diesel 50ppm)",
        "Jet A-1 (Aviation Turbine Fuel)",
        "Dual Purpose Kerosene (DPK / Illuminating)",
    ]

    carriers = [
        "Multiple Hauliers (EA) Ltd",
        "Siginon Global Logistics",
        "Africa Global Logistics (AGL Kenya)",
        "Translink Transporters Ltd",
        "Bolloré Africa Logistics",
        "Great Lakes Petroleum Tankers Ltd",
        "Bakersfield Bulk Hauliers",
        "Roadtrain Transporters Kenya",
    ]

    kenya_plates = [
        "KDA 482B", "KCX 193M", "KDE 884X", "KDF 320Z", "KCB 771Q",
        "KCP 912K", "KDD 655W", "KDB 110F", "KCY 404P", "KDC 287T",
        "KCD 909S", "KDG 518H", "KDH 102A", "KDJ 734Y", "KDK 629C"
    ]

    kpc_delay_reasons = [
        "KPC Gantry Pumping Pressure Fluctuations during Line 5 Batching",
        "KRA Customs ECTS (Electronic Cargo Tracking) Seal Malfunction",
        "KEBS / KPC Quality Lab Flashpoint & Density Testing Delay",
        "Weighbridge Tare Recalibration & Adulteration Dip Test",
        "Driver Missing Valid EPRA Tanker Certificate / Fire Pass",
        "EAC Single Customs Transit Territory Manifest Unmatched",
        "Depot Tank Ullage High-Level Automated Cut-Off Triggered",
        "Terminal Shift Change & Gantry Meter Proving Interruption",
    ]

    print("Generating KPC operational truck loading trips and calculations...")
    random.seed(42)  # Fully deterministic
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    movements_data = []

    # 1. 8 Active Trucks currently on KPC gantries / yard
    for i in range(8):
        m_id = f"KPC-TRIP-ACT-{i+1:03d}"
        depot = depots[i % len(depots)]
        contract = contracts[i % len(contracts)]
        carrier = carriers[i % len(carriers)]
        product = products[i % len(products)]
        bay = f"Gantry-Bay-{random.randint(1, 14)}"
        truck_plate = kenya_plates[i % len(kenya_plates)]

        if i < 3:
            mins_in = random.randint(35, 75)
            status = "LOADING"
            delay_reason = None
        elif i < 5:
            mins_in = random.randint(105, 125)
            status = "IN_QUEUE"
            delay_reason = "Gantry queue congestion at peak loading window"
        else:
            mins_in = random.randint(170, 310)
            status = "VIOLATED"
            delay_reason = random.choice(kpc_delay_reasons)

        gate_in = now - timedelta(minutes=mins_in)
        sched_in = gate_in - timedelta(minutes=20)
        q_start = gate_in + timedelta(minutes=5)
        l_start = q_start + timedelta(minutes=random.randint(15, 40))
        l_end = None
        gate_out = None

        movements_data.append({
            "id": f"MOV-KPC-ACT-{i+1:03d}",
            "trip_id": m_id,
            "truck_plate": truck_plate,
            "carrier": carrier,
            "customer_id": contract["customer_id"],
            "contract_id": contract["id"],
            "depot_id": depot["id"],
            "product": product,
            "bay_number": bay,
            "scheduled_gate_in": sched_in,
            "gate_in": gate_in,
            "queue_start": q_start,
            "loading_start": l_start,
            "loading_end": l_end,
            "gate_out": gate_out,
            "status": status,
            "delay_reason": delay_reason,
            "geofence_verified": 1,
            "weight_ticket_verified": 1 if i != 4 else 0,
            "gate_pass_verified": 1,
        })

    # 2. 48 Completed KPC loading dispatches over the past 14 days
    for i in range(48):
        m_id = f"KPC-TRIP-HIST-{i+1:03d}"
        depot = depots[i % len(depots)]
        contract = contracts[i % len(contracts)]
        carrier = carriers[i % len(carriers)]
        product = products[i % len(products)]
        bay = f"Gantry-Bay-{random.randint(1, 14)}"
        plate_prefix = random.choice(["KDA", "KDB", "KDC", "KDD", "KDE", "KDF", "KDG", "KDH"])
        plate_num = random.randint(101, 999)
        plate_suf = random.choice(["A", "B", "K", "L", "M", "P", "R", "W", "X", "Z"])
        truck_plate = f"{plate_prefix} {plate_num}{plate_suf}"

        days_ago = random.randint(1, 14)
        hour_of_day = random.randint(6, 21)
        gate_in = now - timedelta(days=days_ago, hours=hour_of_day, minutes=random.randint(5, 50))
        sched_in = gate_in - timedelta(minutes=random.randint(10, 30))

        if i % 2 == 0:
            turnaround_mins = random.randint(55, 115)
            delay_reason = None
            status = "COMPLETED"
        else:
            turnaround_mins = random.randint(135, 390)
            delay_reason = random.choice(kpc_delay_reasons)
            status = "COMPLETED"

        q_start = gate_in + timedelta(minutes=random.randint(5, 15))
        l_start = q_start + timedelta(minutes=random.randint(15, 35))
        l_end = gate_in + timedelta(minutes=max(40, turnaround_mins - 15))
        gate_out = gate_in + timedelta(minutes=turnaround_mins)

        movements_data.append({
            "id": f"MOV-KPC-HIST-{i+1:03d}",
            "trip_id": m_id,
            "truck_plate": truck_plate,
            "carrier": carrier,
            "customer_id": contract["customer_id"],
            "contract_id": contract["id"],
            "depot_id": depot["id"],
            "product": product,
            "bay_number": bay,
            "scheduled_gate_in": sched_in,
            "gate_in": gate_in,
            "queue_start": q_start,
            "loading_start": l_start,
            "loading_end": l_end,
            "gate_out": gate_out,
            "status": status,
            "delay_reason": delay_reason,
            "geofence_verified": 1 if i % 12 != 0 else 0,
            "weight_ticket_verified": 1 if i % 9 != 0 else 0,
            "gate_pass_verified": 1 if i % 14 != 0 else 0,
        })

    contract_map = {c["id"]: c for c in contracts}

    for m in movements_data:
        cursor.execute(
            """
            INSERT INTO truck_movements (
                id, trip_id, truck_plate, carrier, customer_id, contract_id, depot_id,
                product, bay_number, scheduled_gate_in, gate_in, queue_start, loading_start,
                loading_end, gate_out, status, delay_reason, geofence_verified,
                weight_ticket_verified, gate_pass_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                m["id"], m["trip_id"], m["truck_plate"], m["carrier"], m["customer_id"],
                m["contract_id"], m["depot_id"], m["product"], m["bay_number"],
                m["scheduled_gate_in"].strftime("%Y-%m-%d %H:%M:%S"),
                m["gate_in"].strftime("%Y-%m-%d %H:%M:%S"),
                m["queue_start"].strftime("%Y-%m-%d %H:%M:%S") if m["queue_start"] else None,
                m["loading_start"].strftime("%Y-%m-%d %H:%M:%S") if m["loading_start"] else None,
                m["loading_end"].strftime("%Y-%m-%d %H:%M:%S") if m["loading_end"] else None,
                m["gate_out"].strftime("%Y-%m-%d %H:%M:%S") if m["gate_out"] else None,
                m["status"], m["delay_reason"], m["geofence_verified"],
                m["weight_ticket_verified"], m["gate_pass_verified"],
            ),
        )

        c = contract_map[m["contract_id"]]
        ctx = CalculationContext(
            movement_id=m["id"],
            truck_plate=m["truck_plate"],
            gate_in=m["gate_in"],
            gate_out=m["gate_out"],
            as_of_time=now if m["gate_out"] is None else None,
            contract_id=c["id"],
            contract_code=c["code"],
            free_time_mins=c["free_time_mins"],
            grace_period_mins=c["grace_period_mins"],
            grace_cliff=bool(c["grace_cliff"]),
            demurrage_rate_per_hr=c["demurrage_rate_per_hr"],
            detention_rate_per_day=c["detention_rate_per_day"],
            detention_threshold_mins=c["detention_threshold_mins"],
            rounding_increment_mins=c["rounding_increment_mins"],
            rounding_mode=c["rounding_mode"],
            weekend_multiplier=c["weekend_multiplier"],
            holiday_multiplier=c["holiday_multiplier"],
            max_cap_amount=c["max_cap_amount"],
            tax_rate=c["tax_rate"],
        )

        calc_result = DemurrageCalculationEngine.calculate(ctx)

        calc_id = f"CLC-{uuid.uuid4().hex[:10].upper()}"
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
                calc_id, m["id"], c["id"], calc_result.engine_version,
                calc_result.total_turnaround_mins, calc_result.free_time_mins, calc_result.grace_period_mins,
                calc_result.net_excess_mins, calc_result.billable_demurrage_hours,
                1 if calc_result.is_in_demurrage else 0,
                calc_result.demurrage_base_charge, calc_result.detention_days, calc_result.detention_charge,
                calc_result.subtotal, calc_result.capped_amount, calc_result.waiver_amount,
                calc_result.tax_amount, calc_result.total_charge, calc_result.currency,
                json.dumps([s.model_dump() for s in calc_result.step_trace]),
                calc_result.input_hash, calc_result.audit_signature,
            ),
        )

        comp_result = ComplianceEngine.evaluate_movement(m, c)
        cursor.execute(
            """
            INSERT INTO compliance_checks (
                id, movement_id, calculation_id, contract_code,
                compliance_score, status, can_auto_invoice, summary, rules_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"CMP-{uuid.uuid4().hex[:10].upper()}",
                m["id"], calc_id, c["code"], comp_result.compliance_score,
                comp_result.status, 1 if comp_result.can_auto_invoice else 0,
                comp_result.summary, json.dumps([r.model_dump() for r in comp_result.rules]),
            ),
        )

        if calc_result.total_charge > 0 and m["gate_out"] is not None:
            r_val = random.random()
            if r_val < 0.20:
                inv_status = "PENDING_APPROVAL"
                erp_status = "NOT_SYNCED"
                erp_ref = None
            elif r_val < 0.45:
                inv_status = "APPROVED"
                erp_status = "PENDING_POSTING"
                erp_ref = None
            elif r_val < 0.75:
                inv_status = "SYNCED_TO_ERP"
                erp_status = "SYNCED"
                erp_ref = f"KPC-SAP-{random.randint(100000, 999999)}"
            elif r_val < 0.90:
                inv_status = "PAID"
                erp_status = "SYNCED"
                erp_ref = f"KPC-SAP-{random.randint(100000, 999999)}"
            else:
                inv_status = "DISPUTED"
                erp_status = "HOLD"
                erp_ref = f"KPC-DISP-{random.randint(100000, 999999)}"

            inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
            inv_num = f"KPC-DMR-2026-{random.randint(10000, 99999)}"

            cursor.execute(
                """
                INSERT INTO invoices (
                    id, invoice_number, movement_id, customer_id, customer_name,
                    calculation_id, subtotal, tax_amount, total_amount, currency,
                    status, erp_reference, erp_sync_status, calculation_backup_json, notes,
                    approved_by, approved_at, issued_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    inv_id, inv_num, m["id"], c["customer_id"], c["customer_name"],
                    calc_id, calc_result.capped_amount, calc_result.tax_amount, calc_result.total_charge, "KES",
                    inv_status, erp_ref, erp_status,
                    json.dumps(calc_result.model_dump()),
                    "KPC Revenue Assurance Verified Demurrage Assessment",
                    "Billing Approver (KPC Finance)" if inv_status in ["APPROVED", "SYNCED_TO_ERP", "PAID"] else None,
                    now.strftime("%Y-%m-%d %H:%M:%S") if inv_status in ["APPROVED", "SYNCED_TO_ERP", "PAID"] else None,
                    now.strftime("%Y-%m-%d %H:%M:%S") if inv_status in ["SYNCED_TO_ERP", "PAID"] else None,
                ),
            )

            if inv_status == "DISPUTED":
                d_id = f"DSP-{uuid.uuid4().hex[:8].upper()}"
                d_num = f"KPC-DISP-2026-{random.randint(1000, 9999)}"
                cursor.execute(
                    """
                    INSERT INTO disputes (
                        id, dispute_number, invoice_id, movement_id, customer_name,
                        reason_code, description, disputed_amount, status, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', 'OMC Carrier Portal')
                    """,
                    (
                        d_id, d_num, inv_id, m["id"], c["customer_name"],
                        "EQUIPMENT_BREAKDOWN",
                        f"OMC claims KPC Gantry Line 5 pump valve pressure dropped below 4.5 bar, causing 90-minute filling delay on trip {m['trip_id']}.",
                        calc_result.total_charge,
                    ),
                )

        if m["gate_out"] is not None and calc_result.net_excess_mins > 0:
            if not m["geofence_verified"] or not m["weight_ticket_verified"]:
                cursor.execute(
                    """
                    INSERT INTO leakage_records (
                        id, movement_id, customer_name, depot_id,
                        potential_amount, invoiced_amount, leaked_amount, root_cause, status
                    ) VALUES (?, ?, ?, ?, ?, 0.0, ?, ?, 'OPEN')
                    """,
                    (
                        f"LKG-{uuid.uuid4().hex[:8].upper()}",
                        m["id"], c["customer_name"], m["depot_id"],
                        calc_result.total_charge, calc_result.total_charge,
                        "UNVERIFIED_EVIDENCE" if not m["geofence_verified"] else "MISSING_WEIGHT_TICKET",
                    ),
                )

    print("Seeding KPC 8-Stage Telemetry & Revenue ETL Pipeline...")
    etl_stages = [
        ("RAW", "Ingest KPC Gate RFID & SCADA Telemetry Stream", 280, 280, 0),
        ("VALIDATE", "OMC Transport & Storage Agreement Schema Check", 280, 276, 4),
        ("CLEAN", "Deduplicate KRA ECTS & Weighbridge Jitter", 276, 276, 0),
        ("TRANSFORM", "Normalize Gantry Turnaround Timestamps (EAT/UTC)", 276, 276, 0),
        ("ENRICH", "Match Active OMC Tariffs & Product Classifications", 276, 273, 3),
        ("CALCULATE", "Deterministic Demurrage & Detention Engine v2.4", 273, 273, 0),
        ("ML", "Predictive Demurrage Risk & Turnaround Anomaly Scoring", 273, 273, 0),
        ("GOLD", "KPC Revenue Assurance Datamart & ERP Invoice Push", 273, 273, 0),
    ]

    base_etl_time = now - timedelta(minutes=50)
    for idx, (stage, desc, rec_in, rec_out, rej) in enumerate(etl_stages):
        st_time = base_etl_time + timedelta(minutes=idx * 6)
        end_time = st_time + timedelta(seconds=random.randint(50, 110))
        dur_ms = int((end_time - st_time).total_seconds() * 1000)
        cursor.execute(
            """
            INSERT INTO etl_pipeline_runs (
                id, run_id, stage, status, records_in, records_out, records_rejected,
                started_at, completed_at, duration_ms, error_log
            ) VALUES (?, ?, ?, 'SUCCESS', ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"ETL-KPC-{idx+1:02d}",
                "ETL-RUN-KPC-20260913-01",
                stage,
                rec_in,
                rec_out,
                rej,
                st_time.strftime("%Y-%m-%d %H:%M:%S"),
                end_time.strftime("%Y-%m-%d %H:%M:%S"),
                dur_ms,
                f"Completed: {desc}" if rej == 0 else f"{rej} invalid ECTS geofence records routed to manual review exception queue",
            ),
        )

    # Commit all base data and close connection BEFORE calling AuditLogger
    conn.commit()
    conn.close()

    print("Seeding immutable audit logs for KPC...")
    AuditLogger.log("CONTRACT", "CTR-VIVO-01", "UPDATE", "KPC Commercial Director", "Admin", None, {"rate": 90.0}, "Annual OMC tariff indexation review")
    AuditLogger.log("CALCULATION", "CLC-KPC-01", "CALCULATE", "KPC Batch Daemon", "System", None, {"engine": "2.4.0"}, "Batch recalculation executed for Western Corridor depots")
    AuditLogger.log("INVOICE", "INV-KPC-01", "APPROVE", "George Omondi (Revenue Lead)", "Billing Approver", None, {"status": "APPROVED"}, "Validated arithmetic and certified weighbridge telemetry")

    print("KPC Database seeding completed successfully with 56+ loading movements and verified revenue records!")


if __name__ == "__main__":
    seed_database()
