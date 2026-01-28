
import requests
import json
import sys

def test_chat():
    url = "http://localhost:8080/chat"
    
    payload = {
        "message": "Bu iki ilaç neden tehlikeli?",
        "context": {
            "risk_score": 8, 
            "clinical_summary": "Aspirin ve Warfarin birlikte kullanımı kanama riskini artırır.",
            "results_found": True
        },
        "patient_info": {
            "age": 65,
            "gender": "Erkek",
            "conditions": ["Hipertansiyon"]
        },
        "history": []
    }
    
    try:
        print(f"Testing Chat Endpoint: {url}")
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            print("✅ Status Code: 200 OK")
            print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            print("Response:", response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if test_chat():
        sys.exit(0)
    else:
        sys.exit(1)
