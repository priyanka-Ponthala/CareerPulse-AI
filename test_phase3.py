import requests

# 1. Test Question Generation
print("--- Testing Question Generation ---")
res1 = requests.post("http://127.0.0.1:5000/generate-questions", 
                     json={"targetRole": "Data Scientist"})
questions = res1.json()
print("Questions from AI:", questions)

# 2. Test Evaluation (Simulate a spoken answer)
print("\n--- Testing Evaluation ---")
test_data = {
    "question": questions[0],
    "answer": "Basically, um, linear regression is like a way to predict numbers using a straight line, uh, you know?"
}
res2 = requests.post("http://127.0.0.1:5000/evaluate-interview", json=test_data)
print("AI Evaluation:", res2.json())