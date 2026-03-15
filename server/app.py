from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re
import pandas as pd
app = Flask(__name__)
CORS(app)
load_dotenv()
# --- CONFIGURATION ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# USE THIS MODEL ONLY - It has the highest free quota for dynamic results
AI_MODEL = 'gemini-flash-latest' 
# --- LOAD ML MODEL ---
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ ML Model Loaded")
except Exception as e:
    print(f"❌ ML Model Error: {e}")

# --- DYNAMIC JSON EXTRACTOR ---
# This finds the JSON part even if the AI adds extra text
def extract_json(text):
    try:
        start = text.find('{')
        end = text.rfind('}') + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except:
        return None
# --- ROUTES ---
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        feature_names = ['cgpa', 'internships', 'projects', 'workshops', 'aptitudeScore', 'softSkills', 'extracurricular', 'placementTraining', 'ssc_marks', 'hsc_marks']
        features_list = [float(data.get('cgpa', 0)), int(data.get('internships', 0)), int(data.get('projects', 0)), int(data.get('workshops', 0)), float(data.get('aptitudeScore', 0)), float(data.get('softSkills', 0)), 1, 1, float(data.get('ssc_marks', 0)), float(data.get('hsc_marks', 0))]
        df = pd.DataFrame([features_list], columns=feature_names)
        prob = model.predict_proba(df)[0][1]
        return jsonify({'probability': round(prob * 100, 2)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/analyze-profile', methods=['POST'])
def analyze_profile():
    data = request.json
    role = data.get('targetRole')
    skills = data.get('userSkills')
    project = data.get('projectDesc')
    try:
        model_ai = genai.GenerativeModel(AI_MODEL)
        # PROMPT is 100% dynamic based on user input
        prompt = f"""
        Act as a Technical Recruiter. 
        User is applying for: {role}. 
        User current skills: {skills}. 
        User best project: {project}.
        1. Correct the spelling of the role '{role}'.
        2. Identify 5 specific missing skills for this role in 2025.
        3. Evaluate the project: is it relevant for a {role}? 
        4. Give 3 technical improvements for the project.

        Return ONLY a JSON object:
        {{
          "corrected_role": "string",
          "missing_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
          "project_evaluation": "2 sentence specific technical critique",
          "project_suggestions": ["tip1", "tip2", "tip3"],
          "advice": "10-word career tip"
        }}
        """
        response = model_ai.generate_content(prompt)
        res_json = extract_json(response.text)
        return jsonify(res_json)
    except Exception as e:
        return jsonify({"error": "AI Quota exceeded. Please wait 60 seconds."}), 429
@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    role = request.json.get('targetRole')
    try:
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Give 3 technical interview questions for a {role} role. Return ONLY a JSON list of strings: [\"q1\", \"q2\", \"q3\"]"
        response = model_ai.generate_content(prompt)
        # Extract the list [...] from the response
        text = response.text
        start, end = text.find('['), text.rfind(']') + 1
        return jsonify(json.loads(text[start:end]))
    except:
        return jsonify({"error": "AI busy"}), 429
@app.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    data = request.json
    try:
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Question: {data.get('question')}. Answer: {data.get('answer')}. Rate technical accuracy (1-10) and give feedback. Return ONLY JSON: {{'score': 8, 'feedback': '...'}}"
        response = model_ai.generate_content(prompt)
        eval_data = extract_json(response.text)
        eval_data['filler_count'] = sum(1 for w in data.get('answer','').lower().split() if w in ["um", "uh", "like"])
        return jsonify(eval_data)
    except:
        return jsonify({"error": "AI busy"}), 429
@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    data = request.json
    role = data.get('targetRole')
    duration = data.get('duration')
    weeks = 8 if duration == "60" else 4
    try:
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Create a {duration}-day roadmap for {role}. Generate {weeks} weeks. Return ONLY JSON: {{'title': '...', 'weeks': [{{'week': 1, 'goal': '...', 'tasks': []}}]}}"
        response = model_ai.generate_content(prompt)
        return jsonify(extract_json(response.text))
    except:
        return jsonify({"error": "AI busy"}), 429
if __name__ == '__main__':
    app.run(debug=True, port=5000)