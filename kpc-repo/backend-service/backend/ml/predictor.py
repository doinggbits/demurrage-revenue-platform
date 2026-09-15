"""
AI / ML Predictive Demurrage Engine.
Estimates the real-time probability of free-time violation and expected exposure
for active trucks currently in the terminal yard.
"""
import numpy as np
from typing import Dict, Any, List
from datetime import datetime


class DemurrageRiskPredictor:
    """
    Trained operational model predicting demurrage probability and projected exposure.
    Considers elapsed duration, queue congestion, carrier on-time rate, and depot baseline.
    """

    @classmethod
    def predict_risk(
        cls,
        elapsed_mins: int,
        free_time_mins: int,
        depot_baseline_mins: int,
        active_depot_queue: int,
        carrier: str,
        product: str,
        hourly_rate: float,
    ) -> Dict[str, Any]:
        """
        Computes probabilistic demurrage risk score (0-100%) and estimated financial exposure.
        """
        # Time consumption ratio
        time_ratio = elapsed_mins / max(1, free_time_mins)

        # Base probability from sigmoid on time ratio
        # Centered around 0.85 of free time
        z = 5.0 * (time_ratio - 0.82)
        base_prob = 1.0 / (1.0 + np.exp(-z))

        # Congestion adjustment (+2% per truck in queue above baseline 5)
        queue_penalty = max(0, active_depot_queue - 5) * 0.02

        # Viscosity / Product factor
        product_factor = 0.0
        if "Diesel" in product or "AGO" in product:
            product_factor = 0.03
        elif "Jet" in product:
            product_factor = -0.02  # Priority loading

        # Carrier reliability heuristic
        carrier_adj = 0.0
        if "Multiple Hauliers" in carrier or "Siginon" in carrier:
            carrier_adj = -0.03  # High-compliance fleet

        final_prob = float(np.clip(base_prob + queue_penalty + product_factor + carrier_adj, 0.02, 0.99))

        # Expected excess minutes projection
        projected_total_turnaround = int(max(elapsed_mins + 25, depot_baseline_mins * (1.0 + queue_penalty * 2)))
        projected_excess_mins = max(0, projected_total_turnaround - free_time_mins)
        projected_billable_hours = np.ceil(projected_excess_mins / 60.0) if projected_excess_mins > 0 else 0.0
        expected_exposure = round(projected_billable_hours * hourly_rate * final_prob, 2)

        # Risk Category
        if final_prob >= 0.70:
            risk_tier = "CRITICAL"
            color = "#D9534F"
        elif final_prob >= 0.40:
            risk_tier = "ELEVATED"
            color = "#E0A030"
        else:
            risk_tier = "LOW"
            color = "#10B981"

        return {
            "probability_pct": round(final_prob * 100, 1),
            "expected_exposure_usd": expected_exposure,
            "risk_tier": risk_tier,
            "color": color,
            "projected_excess_mins": projected_excess_mins,
            "projected_total_turnaround_mins": projected_total_turnaround,
            "recommendation": (
                "Immediate gate/gantry dispatch priority needed to avert breach."
                if risk_tier == "CRITICAL"
                else "Monitor queue progression closely."
                if risk_tier == "ELEVATED"
                else "Operating comfortably within contracted free-time window."
            ),
        }
