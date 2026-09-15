"""
Unit tests for the Compliance & Validation Rule Engine.
Using standard library unittest.
"""
import unittest
from backend.compliance.engine import ComplianceEngine


class TestComplianceEngine(unittest.TestCase):
    def test_full_compliance_passes(self):
        movement = {
            "id": "MOV-001",
            "trip_id": "TRIP-001",
            "geofence_verified": 1,
            "weight_ticket_verified": 1,
            "gate_pass_verified": 1,
            "delay_reason": None,
        }
        contract = {
            "id": "CTR-001",
            "code": "KPC-TSA-VIVO",
            "status": "ACTIVE",
            "is_deleted": 0,
        }

        result = ComplianceEngine.evaluate_movement(movement, contract, has_active_dispute=False)
        self.assertEqual(result.status, "PASSED")
        self.assertEqual(result.compliance_score, 100)
        self.assertTrue(result.can_auto_invoice)
        self.assertEqual(len(result.rules), 6)

    def test_unverified_gate_pass_triggers_fail(self):
        movement = {
            "id": "MOV-002",
            "trip_id": "TRIP-002",
            "geofence_verified": 1,
            "weight_ticket_verified": 1,
            "gate_pass_verified": 0,
            "delay_reason": None,
        }
        contract = {
            "id": "CTR-001",
            "code": "KPC-TSA-VIVO",
            "status": "ACTIVE",
            "is_deleted": 0,
        }

        result = ComplianceEngine.evaluate_movement(movement, contract, has_active_dispute=False)
        self.assertFalse(result.can_auto_invoice)
        self.assertEqual(result.compliance_score, 85)
        gate_rule = next(r for r in result.rules if r.rule_id == "RULE_04_GATE_PASS")
        self.assertEqual(gate_rule.status, "FAIL")

    def test_active_dispute_blocks_invoicing(self):
        movement = {
            "id": "MOV-003",
            "trip_id": "TRIP-003",
            "geofence_verified": 1,
            "weight_ticket_verified": 1,
            "gate_pass_verified": 1,
            "delay_reason": None,
        }
        contract = {
            "id": "CTR-001",
            "code": "KPC-TSA-VIVO",
            "status": "ACTIVE",
            "is_deleted": 0,
        }

        result = ComplianceEngine.evaluate_movement(movement, contract, has_active_dispute=True)
        self.assertFalse(result.can_auto_invoice)
        dispute_rule = next(r for r in result.rules if r.rule_id == "RULE_05_DISPUTE")
        self.assertEqual(dispute_rule.status, "FAIL")


if __name__ == "__main__":
    unittest.main()
