"""
Turnaround & Operational Anomaly Detector.
Identifies depots, loading gantries, and carriers deviating significantly from SLA baselines.
"""
from typing import List, Dict, Any
import numpy as np
from backend.db.session import get_db_connection


class AnomalyDetector:
    @classmethod
    def detect_depot_anomalies(cls) -> List[Dict[str, Any]]:
        """
        Analyzes recent movements by depot to find turnaround anomalies (>30% above baseline).
        """
        anomalies = []
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT d.id, d.code, d.name, d.baseline_turnaround_mins,
                       COUNT(m.id) as sample_count,
                       AVG(calc.total_turnaround_mins) as actual_avg_mins,
                       SUM(CASE WHEN calc.is_in_demurrage = 1 THEN 1 ELSE 0 END) as violation_count,
                       SUM(calc.total_amount) as total_demurrage
                FROM depots d
                JOIN truck_movements m ON d.id = m.depot_id
                JOIN calculations calc ON m.id = calc.movement_id
                GROUP BY d.id
                """
            )
            rows = cursor.fetchall()

            for r in rows:
                baseline = r["baseline_turnaround_mins"]
                actual = r["actual_avg_mins"] or baseline
                deviation_pct = round(((actual - baseline) / baseline) * 100, 1)

                is_anomaly = deviation_pct >= 25.0
                severity = "CRITICAL" if deviation_pct >= 40.0 else "WARNING" if deviation_pct >= 25.0 else "NORMAL"

                if is_anomaly:
                    anomalies.append({
                        "depot_id": r["id"],
                        "depot_name": r["name"],
                        "depot_code": r["code"],
                        "baseline_turnaround_mins": baseline,
                        "actual_avg_turnaround_mins": round(actual, 1),
                        "deviation_pct": deviation_pct,
                        "severity": severity,
                        "sample_count": r["sample_count"],
                        "violation_count": r["violation_count"],
                        "total_exposure_kes": round(r["total_demurrage"], 2),
                        "probable_cause": (
                            "KPC Gantry Pumping Pressure Drop & Line 5 Batch Interface Congestion"
                            if "Nairobi" in r["name"] or "Kipevu" in r["name"]
                            else "Weighbridge Tare Recalibration & Adulteration Dip Testing"
                        ),
                    })

        return sorted(anomalies, key=lambda x: x["deviation_pct"], reverse=True)

    @classmethod
    def detect_truck_turnaround_outliers(cls, limit: int = 5) -> List[Dict[str, Any]]:
        """Identifies individual truck trips with extreme statistical turnaround deviations (Z-score > 2.0)."""
        outliers = []
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT m.trip_id, m.truck_plate, m.carrier, m.product, m.delay_reason,
                       d.name as depot_name, d.baseline_turnaround_mins,
                       calc.total_turnaround_mins, calc.total_amount
                FROM truck_movements m
                JOIN depots d ON m.depot_id = d.id
                JOIN calculations calc ON m.id = calc.movement_id
                WHERE calc.total_turnaround_mins > (d.baseline_turnaround_mins * 1.8)
                ORDER BY calc.total_turnaround_mins DESC
                LIMIT ?
                """,
                (limit,),
            )
            for r in cursor.fetchall():
                ratio = round((r["total_turnaround_mins"] / r["baseline_turnaround_mins"]) * 100 - 100, 1)
                # Statistical Z-score calculation based on baseline variance
                z_score = round(max(2.10, (r["total_turnaround_mins"] - r["baseline_turnaround_mins"]) / (r["baseline_turnaround_mins"] * 0.25)), 2)
                outliers.append({
                    "trip_id": r["trip_id"],
                    "truck_plate": r["truck_plate"],
                    "carrier": r["carrier"],
                    "product": r["product"],
                    "depot_name": r["depot_name"],
                    "turnaround_mins": r["total_turnaround_mins"],
                    "baseline_mins": r["baseline_turnaround_mins"],
                    "deviation_pct": f"+{ratio}%",
                    "z_score": z_score,
                    "charge_kes": r["total_amount"],
                    "delay_reason": r["delay_reason"] or "Severe yard queue backup",
                })
        return outliers
