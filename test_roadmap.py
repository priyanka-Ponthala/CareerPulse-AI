import requests
import json

def test_roadmap():
    url = "http://127.0.0.1:5000/generate-roadmap"
    
    # Simulate the data that will come from the React Frontend
    payload = {
        "targetRole": "Frontend Developer",
        "missingSkills": ["React", "TypeScript", "Tailwind CSS"],
        "duration": "30"
    }
    
    print("--- Sending Request to AI Roadmap Generator ---")
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            print("✅ Success!")
            # Pretty print the JSON result
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            print("Error Details:", response.text)
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_roadmap()