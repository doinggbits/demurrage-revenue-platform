"""
Unit tests for the Pure Deterministic Demurrage Calculation Engine (v2.4.0).
Using standard library unittest.
"""
import unittest
from datetime import datetime, timedelta

from backend.calculation.engine import DemurrageCalculationEngine
from backend.calculation.models import CalculationContext


class TestCalculationEngine(unittest.TestCase):
    def test_turnaround_within_free_time(self):
        """Truck exits within contract free time -> zero demurrage."""
        gate_in = datetime(2026, 9, 10, 8, 0, 0)
        gate_out = gate_in + timedelta(minutes=90)  # 90m < 120m free time

        ctx = CalculationContext(
            movement_id="TEST-001",
            truck_plate="KDA 100A",
            gate_in=gate_in,
            gate_out=gate_out,
            contract_id="CTR-01",
            contract_code="KPC-TSA-VIVO",
            free_time_mins=120,
            grace_period_mins=15,
            demurrage_rate_per_hr=100.0,
        )

        result = DemurrageCalculationEngine.calculate(ctx)
        self.assertEqual(result.total_turnaround_mins, 90)
        self.assertEqual(result.net_excess_mins, 0)
        self.assertEqual(result.billable_demurrage_hours, 0.0)
        self.assertEqual(result.demurrage_base_charge, 0.0)
        self.assertEqual(result.total_charge, 0.0)
        self.assertFalse(result.is_in_demurrage)
        self.assertEqual(len(result.step_trace), 12)

    def test_grace_period_protection(self):
        """Exceeds free time by 10m, but within 15m grace -> 0 billable excess."""
        gate_in = datetime(2026, 9, 10, 8, 0, 0)
        gate_out = gate_in + timedelta(minutes=130)  # 10m gross excess <= 15m grace

        ctx = CalculationContext(
            movement_id="TEST-002",
            truck_plate="KDA 100A",
            gate_in=gate_in,
            gate_out=gate_out,
            contract_id="CTR-01",
            contract_code="KPC-TSA-VIVO",
            free_time_mins=120,
            grace_period_mins=15,
            grace_cliff=False,
            demurrage_rate_per_hr=100.0,
        )

        result = DemurrageCalculationEngine.calculate(ctx)
        self.assertEqual(result.total_turnaround_mins, 130)
        self.assertEqual(result.net_excess_mins, 0)
        self.assertEqual(result.total_charge, 0.0)

    def test_grace_period_exceeded_with_cliff(self):
        """Exceeds grace period with cliff enabled -> full gross excess is charged."""
        gate_in = datetime(2026, 9, 10, 8, 0, 0)
        gate_out = gate_in + timedelta(minutes=150)  # 30m excess > 15m grace

        ctx = CalculationContext(
            movement_id="TEST-003",
            truck_plate="KDA 100A",
            gate_in=gate_in,
            gate_out=gate_out,
            contract_id="CTR-01",
            contract_code="KPC-TSA-VIVO",
            free_time_mins=120,
            grace_period_mins=15,
            grace_cliff=True,
            rounding_increment_mins=60,
            rounding_mode="ceil",
            demurrage_rate_per_hr=100.0,
            tax_rate=0.05,
        )

        result = DemurrageCalculationEngine.calculate(ctx)
        self.assertEqual(result.net_excess_mins, 30)
        self.assertEqual(result.billable_demurrage_hours, 1.0)
        self.assertEqual(result.demurrage_base_charge, 100.0)
        self.assertEqual(result.tax_amount, 5.0)
        self.assertEqual(result.total_charge, 105.0)

    def test_contract_maximum_cap(self):
        """Charge exceeds cap -> amount capped at max_cap_amount."""
        gate_in = datetime(2026, 9, 10, 8, 0, 0)
        gate_out = gate_in + timedelta(hours=30)  # Heavy demurrage

        ctx = CalculationContext(
            movement_id="TEST-004",
            truck_plate="KDA 100A",
            gate_in=gate_in,
            gate_out=gate_out,
            contract_id="CTR-01",
            contract_code="KPC-TSA-VIVO",
            free_time_mins=120,
            demurrage_rate_per_hr=150.0,
            max_cap_amount=1000.0,
            tax_rate=0.05,
        )

        result = DemurrageCalculationEngine.calculate(ctx)
        self.assertEqual(result.capped_amount, 1000.0)
        self.assertEqual(result.tax_amount, 50.0)
        self.assertEqual(result.total_charge, 1050.0)

    def test_calculation_determinism(self):
        """Same inputs must always produce identical cryptographic signatures."""
        gate_in = datetime(2026, 9, 10, 8, 0, 0)
        gate_out = gate_in + timedelta(minutes=240)

        ctx = CalculationContext(
            movement_id="TEST-005",
            truck_plate="KDA 100A",
            gate_in=gate_in,
            gate_out=gate_out,
            contract_id="CTR-01",
            contract_code="KPC-TSA-VIVO",
            free_time_mins=120,
            demurrage_rate_per_hr=100.0,
        )

        res1 = DemurrageCalculationEngine.calculate(ctx)
        res2 = DemurrageCalculationEngine.calculate(ctx)

        self.assertEqual(res1.total_charge, res2.total_charge)
        self.assertEqual(res1.input_hash, res2.input_hash)
        self.assertEqual(res1.audit_signature, res2.audit_signature)


if __name__ == "__main__":
    unittest.main()
