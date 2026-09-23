import importlib
import os
import tempfile
import unittest

class ConnectorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["NEXVARY_STATE_DIR"] = self.tmp.name
        import connector
        self.connector = importlib.reload(connector)
        self.client = self.connector.app.test_client()

    def tearDown(self):
        self.tmp.cleanup()

    def test_authorization_requires_core_fields(self):
        response = self.client.post("/api/v1/authorizations", json={
            "authorization_id": "AUTH-2026-001",
            "asset_id": "PC-01"
        })
        self.assertEqual(response.status_code, 400)

    def test_authorization_registers(self):
        response = self.client.post("/api/v1/authorizations", json={
            "authorization_id": "AUTH-2026-001",
            "asset_id": "PC-01",
            "owner": "NEXVARY IT",
            "scope": "Internal company device assessment",
            "maintenance_window": "2026-09-24T02:00+03:00/2026-09-24T04:00+03:00"
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.get_json()["ok"])

    def test_report_id_rejects_path_characters(self):
        response = self.client.get("/api/v1/hackgpt/reports/../../etc")
        self.assertIn(response.status_code, (400, 404))

if __name__ == "__main__":
    unittest.main()
