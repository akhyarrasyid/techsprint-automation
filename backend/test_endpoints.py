import urllib.request
import urllib.parse
import json
import os

BASE_URL = "http://127.0.0.1:7860"

def test_get_endpoint(path: str, params: dict = None):
    url = f"{BASE_URL}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    print(f"Testing GET {path} ... ", end="")
    try:
        with urllib.request.urlopen(url) as response:
            status = response.status
            body = response.read().decode('utf-8')
            data = json.loads(body)
            print(f"STATUS {status} - SUCCESS")
            # print first few elements or keys
            if isinstance(data, dict):
                print(f"  Keys returned: {list(data.keys())}")
            elif isinstance(data, list) and len(data) > 0:
                print(f"  List of {len(data)} items, first item keys: {list(data[0].keys())}")
            return status, data
    except Exception as e:
        print(f"FAILED: {e}")
        return 500, str(e)

def run_tests():
    print("=== STARTING ENDPOINT TESTS ===")
    test_get_endpoint("/health")
    test_get_endpoint("/dashboard-summary")
    test_get_endpoint("/forecast")
    test_get_endpoint("/inventory")
    test_get_endpoint("/mrp")
    test_get_endpoint("/profitability")
    test_get_endpoint("/insights")
    test_get_endpoint("/explainability")
    test_get_endpoint("/kpi")
    test_get_endpoint("/anomalies")
    test_get_endpoint("/command-center")
    print("=== TESTS COMPLETED ===")

if __name__ == "__main__":
    run_tests()
