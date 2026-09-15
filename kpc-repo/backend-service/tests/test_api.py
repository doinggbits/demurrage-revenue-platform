"""
Integration tests for FastAPI REST API endpoints.
Using standard library unittest and FastAPI TestClient.
"""
import unittest
from fastapi.testclient import TestClient
from backend.api.app import api_app


class TestAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(api_app)
        # Authenticate as Admin
        login_res = cls.client.post("/api/v1/auth/login", json={"username": "brian.mugambi", "password": "SysAdmin@2026"})
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            cls.headers = {"Authorization": f"Bearer {token}"}
        else:
            cls.headers = {}

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["version"], "2.4.0")

    def test_kpis_endpoint(self):
        response = self.client.get("/api/v1/kpis", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("revenue_protected", data)
        self.assertIn("unbilled_exposure", data)

    def test_calculate_endpoint(self):
        payload = {
            "movement_id": "MOV-API-TEST",
            "truck_plate": "KDA 888A",
            "gate_in": "2026-09-12T08:00:00",
            "gate_out": "2026-09-12T12:00:00",
            "contract_id": "CTR-01",
            "contract_code": "KPC-TSA-VIVO",
            "free_time_mins": 120,
            "grace_period_mins": 15,
            "demurrage_rate_per_hr": 100.0,
        }
        response = self.client.post("/api/v1/calculate", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(res["total_turnaround_mins"], 240)
        self.assertTrue(res["is_in_demurrage"])
        self.assertEqual(res["billable_demurrage_hours"], 2.0)
        self.assertGreater(res["total_charge"], 0)
        self.assertIn("step_trace", res)
        self.assertEqual(len(res["step_trace"]), 12)

    def test_movements_endpoint(self):
        response = self.client.get("/api/v1/movements?limit=10", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total", data)
        self.assertIn("data", data)
        self.assertLessEqual(len(data["data"]), 10)

    def test_scenarios_endpoint(self):
        response = self.client.get("/api/v1/scenarios")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertGreaterEqual(len(data), 4)

    def test_outliers_z_score(self):
        response = self.client.get("/api/v1/anomalies", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("outlier_trucks", data)
        outliers = data["outlier_trucks"]
        if len(outliers) > 0:
            first = outliers[0]
            self.assertIn("z_score", first)
            self.assertIsInstance(first["z_score"], (int, float))


if __name__ == "__main__":
    unittest.main()
