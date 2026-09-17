import requests
import json

# Base URL for the Django API
BASE_URL = "http://127.0.0.1:8000/api"

def debug_validation():
    """Debug the validation endpoint by sending a simple request and seeing what we get"""
    print("Debugging validation endpoint...")

    try:
        with open("plantilla_productos_accesorios_test.csv", "rb") as f:
            files = {"file": f}
            print("Sending file...")
            response = requests.post(f"{BASE_URL}/productos-carga-masiva/parsear-archivo/", files=files)

            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")

            # Try to get JSON response
            try:
                data = response.json()
                print(f"JSON Response: {json.dumps(data, indent=2)[:500]}...")
            except:
                print(f"Text Response: {response.text[:500]}...")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_validation()