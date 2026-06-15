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

def test_post_upload():
    print("Testing POST /upload ... ", end="")
    # Locate sample_sales.csv
    csv_path = os.path.join(os.path.dirname(__file__), "data", "sample_sales.csv")
    if not os.path.exists(csv_path):
        print("FAILED: sample_sales.csv not found")
        return 500
        
    try:
        # Construct multipart/form-data request
        with open(csv_path, 'rb') as f:
            file_content = f.read()
            
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        parts = [
            f'--{boundary}',
            'Content-Disposition: form-data; name="file"; filename="sample_sales.csv"',
            'Content-Type: text/csv',
            '',
            file_content.decode('utf-8'),
            f'--{boundary}--',
            ''
        ]
        body = '\r\n'.join(parts).encode('utf-8')
        
        req = urllib.request.Request(
            f"{BASE_URL}/upload",
            data=body,
            headers={
                'Content-Type': f'multipart/form-data; boundary={boundary}',
                'Content-Length': len(body)
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            status = response.status
            resp_body = response.read().decode('utf-8')
            data = json.loads(resp_body)
            print(f"STATUS {status} - SUCCESS")
            print(f"  Upload Report: {data}")
            return status
    except Exception as e:
        print(f"FAILED: {e}")
        return 500

def test_post_run_pipeline():
    print("Testing POST /run-pipeline (Base scenario) ... ", end="")
    try:
        data = json.dumps({"scenario": "Base"}).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/run-pipeline",
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            resp_data = json.loads(body)
            print(f"STATUS {status} - SUCCESS")
            print(f"  Keys returned: {list(resp_data.keys())}")
            return status
    except Exception as e:
        print(f"FAILED: {e}")
        return 500

def run_tests():
    print("=== STARTING ENDPOINT TESTS ===")
    test_get_endpoint("/health")
    test_get_endpoint("/dashboard-summary")
    test_get_endpoint("/forecast")
    test_get_endpoint("/inventory")
    test_get_endpoint("/mrp")
    test_get_endpoint("/profitability")
    
    # Test upload and check updated data
    test_post_upload()
    test_post_run_pipeline()
    print("=== TESTS COMPLETED ===")

if __name__ == "__main__":
    run_tests()
