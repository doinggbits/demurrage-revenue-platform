"""
Unit tests for the Database Repository layer.
Using standard library unittest.
"""
import unittest
from backend.db.repository import DemurrageRepository


class TestRepository(unittest.TestCase):
    def test_get_depots(self):
        depots = DemurrageRepository.get_depots()
        self.assertGreaterEqual(len(depots), 5)
        codes = [d["code"] for d in depots]
        self.assertIn("KOSF-PS01", codes)
        self.assertIn("NBI-PS10", codes)

    def test_get_contracts(self):
        contracts, total = DemurrageRepository.get_contracts(limit=10)
        self.assertGreaterEqual(total, 8)
        self.assertLessEqual(len(contracts), 10)

    def test_get_movements_pagination(self):
        page1, total1 = DemurrageRepository.get_movements(limit=5, offset=0)
        page2, total2 = DemurrageRepository.get_movements(limit=5, offset=5)

        self.assertEqual(total1, total2)
        self.assertEqual(len(page1), 5)
        self.assertEqual(len(page2), 5)
        self.assertNotEqual(page1[0]["id"], page2[0]["id"])

    def test_dashboard_kpis(self):
        kpis = DemurrageRepository.get_dashboard_kpis()
        self.assertIn("revenue_protected", kpis)
        self.assertIn("unbilled_exposure", kpis)
        self.assertIn("total_movements", kpis)
        self.assertGreaterEqual(kpis["total_movements"], 50)


if __name__ == "__main__":
    unittest.main()
