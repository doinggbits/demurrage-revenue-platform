"""
Operational Scenario Datasets Catalog & Ingestion for KPC Revenue Assurance Platform.
Provides pre-packaged multi-scenario gate logs for testing upload, ETL, calculation, and reporting.
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import io
import pandas as pd

from backend.etl.csv_ingest import ingest_csv_bytes

SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "nairobi_weekend_surge",
        "title": "Nairobi Terminal (NBI-PS10) - Weekend Peak Congestion",
        "terminal": "Nairobi (Embakasi)",
        "depot_code": "NBI-PS10",
        "depot_id": "DEP-KPC-NBI",
        "description": "Severe weekend tanker queuing combined with Line 5 batch interface congestion. Results in significant demurrage violations and high Z-score turnaround spikes.",
        "badge": "High Demurrage & Bottlenecks",
        "truck_count": 12,
        "sample_plate": "KDF 412X / KBZ 981P",
    },
    {
        "id": "mombasa_maritime_inflow",
        "title": "Mombasa Kipevu (KOSF-PS01) - Maritime Bulk Tanker Discharge",
        "terminal": "Kipevu, Mombasa",
        "depot_code": "KOSF-PS01",
        "depot_id": "DEP-KPC-MBO",
        "description": "Super-tanker crude/product discharge into marine manifold. Fast automated gantry turnaround with high throughput and low demurrage penalties.",
        "badge": "High Throughput / Low Demurrage",
        "truck_count": 14,
        "sample_plate": "KDA 102M / KDG 554B",
    },
    {
        "id": "kisumu_crossborder_delay",
        "title": "Kisumu Lake Jetty (KIS-PS28) - Cross-Border Adulteration Dip Delays",
        "terminal": "Kisumu Lake Jetty",
        "depot_code": "KIS-PS28",
        "depot_id": "DEP-KPC-KIS",
        "description": "Transit fuel destined for Uganda and DRC undergoing rigorous KRA ECTS seal verification and anti-adulteration chemical testing.",
        "badge": "Compliance Audits & Spikes",
        "truck_count": 10,
        "sample_plate": "UBC 782K / KDC 903R",
    },
    {
        "id": "eldoret_optimized_flow",
        "title": "Eldoret Gateway (ELD-PS27) - Fast-Track Automated Corridor",
        "terminal": "Eldoret Terminal",
        "depot_code": "ELD-PS27",
        "depot_id": "DEP-KPC-ELD",
        "description": "Optimal operational conditions with sub-90 minute turnaround, 100% geofence compliance, and zero demurrage exposure.",
        "badge": "Optimal SLA / Zero Demurrage",
        "truck_count": 12,
        "sample_plate": "KDD 331T / KDH 820Q",
    },
]


def generate_scenario_csv(scenario_id: str) -> str:
    now = datetime.now(timezone.utc)
    rows = []

    if scenario_id == "nairobi_weekend_surge":
        carriers = [
            ("KDF 412X", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "MOGAS (PMS)", 340, "Gantry pumping pressure drop"),
            ("KBZ 981P", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "AGO (Diesel)", 310, "Line 5 batch interface switch"),
            ("KDA 771Q", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "Jet A-1", 280, "Weighbridge tare re-verification"),
            ("KDG 622B", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "AGO (Diesel)", 360, "Severe yard queue backup"),
            ("KDC 551L", "Hass Petroleum Kenya (Great Lakes Corridor)", "OMC-HASS", "CTR-HASS-06", "MOGAS (PMS)", 295, "Terminal bay meter recalibration"),
            ("KDB 119V", "National Oil Corporation of Kenya (NOCK)", "OMC-NOCK", "CTR-NOCK-08", "DPK (Kerosene)", 330, "Gantry safety interlock trip"),
            ("KDE 883Z", "Galana Oil Kenya Ltd", "OMC-GAL", "CTR-GAL-05", "AGO (Diesel)", 270, "Queue stall at gantry 4"),
            ("KDF 310P", "Dalbit Petroleum (Transit Export)", "OMC-DAL", "CTR-DAL-07", "Jet A-1", 315, "Loading arm valve seal test"),
            ("KDH 204C", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "MOGAS (PMS)", 250, "Driver paperwork verification"),
            ("KDG 991K", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "AGO (Diesel)", 380, "Severe yard queue backup"),
            ("KDB 440S", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "MOGAS (PMS)", 290, "Gantry pumping pressure drop"),
            ("KDA 650F", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "AGO (Diesel)", 320, "Batch interface switch"),
        ]
        depot_id = "DEP-KPC-NBI"
    elif scenario_id == "mombasa_maritime_inflow":
        carriers = [
            ("KDA 102M", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "AGO (Diesel)", 85, ""),
            ("KDG 554B", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "MOGAS (PMS)", 90, ""),
            ("KDE 311X", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "Jet A-1", 95, ""),
            ("KDH 442Y", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "AGO (Diesel)", 80, ""),
            ("KDC 718T", "Galana Oil Kenya Ltd", "OMC-GAL", "CTR-GAL-05", "MOGAS (PMS)", 88, ""),
            ("KDF 820R", "Hass Petroleum Kenya (Great Lakes Corridor)", "OMC-HASS", "CTR-HASS-06", "AGO (Diesel)", 100, ""),
            ("KDB 933W", "National Oil Corporation of Kenya (NOCK)", "OMC-NOCK", "CTR-NOCK-08", "DPK (Kerosene)", 92, ""),
            ("KDA 415L", "Dalbit Petroleum (Transit Export)", "OMC-DAL", "CTR-DAL-07", "Jet A-1", 105, ""),
            ("KDG 229K", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "AGO (Diesel)", 82, ""),
            ("KDE 110J", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "MOGAS (PMS)", 86, ""),
            ("KDF 990Z", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "AGO (Diesel)", 94, ""),
            ("KDH 108A", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "MOGAS (PMS)", 89, ""),
            ("KDB 765C", "Hass Petroleum Kenya (Great Lakes Corridor)", "OMC-HASS", "CTR-HASS-06", "Jet A-1", 110, ""),
            ("KDC 322V", "Galana Oil Kenya Ltd", "OMC-GAL", "CTR-GAL-05", "AGO (Diesel)", 84, ""),
        ]
        depot_id = "DEP-KPC-MBO"
    elif scenario_id == "kisumu_crossborder_delay":
        carriers = [
            ("UBC 782K", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "AGO (Diesel)", 390, "Adulteration chemical marker dip"),
            ("KDC 903R", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "MOGAS (PMS)", 410, "KRA ECTS electronic cargo seal error"),
            ("UBA 445H", "Hass Petroleum Kenya (Great Lakes Corridor)", "OMC-HASS", "CTR-HASS-06", "AGO (Diesel)", 360, "Cross-border transit permit validation"),
            ("KDG 881V", "Dalbit Petroleum (Transit Export)", "OMC-DAL", "CTR-DAL-07", "Jet A-1", 345, "Lake barge transfer interface"),
            ("UBC 129F", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "AGO (Diesel)", 380, "Adulteration dip re-sampling"),
            ("KDE 504L", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "MOGAS (PMS)", 325, "KRA customs escort queue"),
            ("KDA 610Z", "National Oil Corporation of Kenya (NOCK)", "OMC-NOCK", "CTR-NOCK-08", "DPK (Kerosene)", 350, "Weighbridge tare re-inspection"),
            ("UBA 992P", "Galana Oil Kenya Ltd", "OMC-GAL", "CTR-GAL-05", "AGO (Diesel)", 430, "Chemical marker test confirmation"),
            ("KDF 712M", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "MOGAS (PMS)", 370, "KRA seal scanner failure"),
            ("KDH 501S", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "AGO (Diesel)", 395, "Adulteration chemical marker dip"),
        ]
        depot_id = "DEP-KPC-KIS"
    else:  # eldoret_optimized_flow
        carriers = [
            ("KDD 331T", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "AGO (Diesel)", 78, ""),
            ("KDH 820Q", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "MOGAS (PMS)", 82, ""),
            ("KDA 492C", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "Jet A-1", 85, ""),
            ("KDF 610N", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "AGO (Diesel)", 75, ""),
            ("KDG 119P", "Galana Oil Kenya Ltd", "OMC-GAL", "CTR-GAL-05", "MOGAS (PMS)", 80, ""),
            ("KDB 802X", "Hass Petroleum Kenya (Great Lakes Corridor)", "OMC-HASS", "CTR-HASS-06", "AGO (Diesel)", 84, ""),
            ("KDE 744Y", "National Oil Corporation of Kenya (NOCK)", "OMC-NOCK", "CTR-NOCK-08", "DPK (Kerosene)", 79, ""),
            ("KDC 291B", "Dalbit Petroleum (Transit Export)", "OMC-DAL", "CTR-DAL-07", "Jet A-1", 88, ""),
            ("KDA 930L", "Vivo Energy Kenya (Shell Licensee)", "OMC-VIVO", "CTR-VIVO-01", "AGO (Diesel)", 76, ""),
            ("KDF 518K", "TotalEnergies Marketing Kenya", "OMC-TOT", "CTR-TOT-02", "MOGAS (PMS)", 81, ""),
            ("KDH 302J", "Rubis Energy Kenya", "OMC-RUB", "CTR-RUB-03", "AGO (Diesel)", 83, ""),
            ("KDG 441E", "Ola Energy Kenya", "OMC-OLA", "CTR-OLA-04", "MOGAS (PMS)", 77, ""),
        ]
        depot_id = "DEP-KPC-ELD"

    for idx, (plate, carrier, cust_id, ctr_id, product, turnaround, delay) in enumerate(carriers):
        sched_time = now - timedelta(hours=6, minutes=idx * 25)
        gate_in = sched_time + timedelta(minutes=10)
        q_start = gate_in + timedelta(minutes=5)
        load_start = q_start + timedelta(minutes=turnaround // 3)
        load_end = load_start + timedelta(minutes=turnaround // 2)
        gate_out = gate_in + timedelta(minutes=turnaround)

        rows.append({
            "trip_id": f"TRIP-{scenario_id[:4].upper()}-{1000 + idx}",
            "truck_plate": plate,
            "carrier": carrier,
            "customer_id": cust_id,
            "contract_id": ctr_id,
            "depot_id": depot_id,
            "product": product,
            "bay_number": (idx % 6) + 1,
            "scheduled_gate_in": sched_time.strftime("%Y-%m-%d %H:%M:%S"),
            "gate_in": gate_in.strftime("%Y-%m-%d %H:%M:%S"),
            "queue_start": q_start.strftime("%Y-%m-%d %H:%M:%S"),
            "loading_start": load_start.strftime("%Y-%m-%d %H:%M:%S"),
            "loading_end": load_end.strftime("%Y-%m-%d %H:%M:%S"),
            "gate_out": gate_out.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "COMPLETED",
            "delay_reason": delay,
            "geofence_verified": 1,
            "weight_ticket_verified": 1,
            "gate_pass_verified": 1,
        })

    df = pd.DataFrame(rows)
    return df.to_csv(index=False)


def ingest_scenario_by_id(scenario_id: str, user: str, role: str) -> Dict[str, Any]:
    csv_text = generate_scenario_csv(scenario_id)
    filename = f"kpc_scenario_{scenario_id}.csv"
    result = ingest_csv_bytes(csv_text.encode("utf-8"), filename=filename, user=user, role=role)
    scenario_meta = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    result["scenario"] = scenario_meta
    return result
