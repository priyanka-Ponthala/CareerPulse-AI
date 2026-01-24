import requests

url = "http://127.0.0.1:5000/analyze-skills"
data = {
    "targetRole": "Frontend Developer",
    "userSkills": "HTML, CSS, JS"
}

response = requests.post(url, json=data)
print("AI Response:", response.json())