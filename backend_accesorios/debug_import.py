import requests
import json

# Base URL for the Django API
BASE_URL = "http://127.0.0.1:8000/api"

def debug_import():
    """Debug the import endpoint by first getting validated data, then sending it"""
    print("Debugging import endpoint...")

    # First, get the validated data from the validation endpoint
    try:
        with open("plantilla_productos_accesorios_test.csv", "rb") as f:
            files = {"file": f}
            print("Getting validated data...")
            validation_response = requests.post(f"{BASE_URL}/productos-carga-masiva/parsear-archivo/", files=files)

            print(f"Validation Status Code: {validation_response.status_code}")

            if validation_response.status_code == 200:
                validated_data = validation_response.json()
                print(f"Got validated data with {len(validated_data.get('productos', []))} products")

                # Now send this data to the import endpoint
                print("\nSending validated data to import endpoint...")
                headers = {'Content-Type': 'application/json'}
                import_response = requests.post(f"{BASE_URL}/productos-carga-masiva/",
                                              json=validated_data,
                                              headers=headers)

                print(f"Import Status Code: {import_response.status_code}")
                print(f"Import Response Headers: {dict(import_response.headers)}")

                # Try to get JSON response
                try:
                    data = import_response.json()
                    print(f"JSON Response: {json.dumps(data, indent=2)}")
                except:
                    print(f"Text Response: {import_response.text[:1000]}...")
            else:
                print(f"Validation failed: {validation_response.text}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_import()