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
AI_MODEL = 'gemini-flash-latest' # Stable version with high quota

# --- LOAD ML MODEL ---
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ ML Model Loaded")
except Exception as e:
    print(f"❌ ML Model Error: {e}")

# --- THE MOST ROBUST JSON CLEANER ---
def extract_json(text):
    try:
        # Find the first { and the last }
        start = text.find('{')
        end = text.rfind('}') + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except Exception:
        # Fallback if no JSON structure is found at all
        raise ValueError("AI failed to provide a structured response.")

# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        feature_names = ['cgpa', 'internships', 'projects', 'workshops', 'aptitudeScore', 'softSkills', 'extracurricular', 'placementTraining', 'ssc_marks', 'hsc_marks']
        
        # Ensure data is converted to float/int correctly
        features_list = [
            float(data.get('cgpa', 0)), int(data.get('internships', 0)), 
            int(data.get('projects', 0)), int(data.get('workshops', 0)), 
            float(data.get('aptitudeScore', 0)), float(data.get('softSkills', 0)), 
            1, 1, # Placeholders for trained categorical fields
            float(data.get('ssc_marks', 0)), float(data.get('hsc_marks', 0))
        ]
        
        df = pd.DataFrame([features_list], columns=feature_names)
        prob = model.predict_proba(df)[0][1]
        return jsonify({'probability': round(prob * 100, 2)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-profile', methods=['POST'])
def analyze_profile():
    try:
        data = request.json
        role = data.get('targetRole', 'Developer')
        skills = data.get('userSkills', '')
        project = data.get('projectDesc', '')

        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"""
        Analyze this student profile for a recruiter.
        Target Role: {role}
        Current Skills: {skills}
        Project Description: {project}

        Step 1: Check spelling of the Target Role.
        Step 2: Identify 5 missing technical skills for 2025.
        Step 3: Evaluate the project technical depth.
        Step 4: Suggest 3 specific improvements for this project.

        Return ONLY a JSON object:
        {{
          "corrected_role": "string",
          "missing_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
          "project_evaluation": "2 sentence technical critique",
          "project_suggestions": ["tip1", "tip2", "tip3"],
          "advice": "10-word motivational advice"
        }}
        """
        response = model_ai.generate_content(prompt)
        # Use our robust extractor
        result = extract_json(response.text)
        return jsonify(result)
    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"error": "AI is temporarily busy or blocked. Try shorter descriptions."}), 500

@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        role = data.get('targetRole', 'Developer')
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"As a recruiter for {role}, give 3 technical interview questions (15-20 words each). Return ONLY a JSON list of strings: [\"q1\", \"q2\", \"q3\"]"
        response = model_ai.generate_content(prompt)
        
        # Extracting list from AI text
        text = response.text
        start = text.find('[')
        end = text.rfind(']') + 1
        return jsonify(json.loads(text[start:end]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    try:
        data = request.json
        ans = data.get('answer', '')
        q = data.get('question', '')
        
        # Filler counting
        fillers = ["um", "uh", "like", "basically", "actually"]
        f_count = sum(1 for w in ans.lower().split() if w in fillers)
        
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Question: {q}. Answer: {ans}. Evaluate technical accuracy (score 1-10) and feedback (15 words). Return ONLY JSON: {{\"score\": 8, \"feedback\": \"...\"}}"
        response = model_ai.generate_content(prompt)
        eval_data = extract_json(response.text)
        
        # Syncing key names for React
        if "rating" in eval_data: eval_data["score"] = eval_data["rating"]
        eval_data['filler_count'] = f_count
        return jsonify(eval_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    try:
        data = request.json
        role = data.get('targetRole')
        missing = data.get('missingSkills')
        duration = data.get('duration', '30')
        weeks = 8 if duration == "60" else 4

        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Generate a {duration}-day roadmap for {role} role to learn {missing}. Create exactly {weeks} weeks. Return ONLY JSON: {{'title': '', 'weeks': [{{'week': 1, 'goal': '', 'tasks': []}}]}}"
        response = model_ai.generate_content(prompt)
        return jsonify(extract_json(response.text))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)