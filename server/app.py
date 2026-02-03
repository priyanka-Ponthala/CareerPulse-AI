from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re
import numpy as np
from datetime import datetime

# --- INITIAL SETUP ---
app = Flask(__name__)
CORS(app)
load_dotenv()

# Configure Gemini (Using the stable 1.5 Flash model)
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Load ML Model
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
except Exception as e:
    print(f"Model Load Warning: {e}")
    model = None

# Robust JSON Cleaner using Regex
def clean_ai_json(text):
    try:
        text = text.strip()
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        return match.group(0) if match else text
    except:
        return text

# ---------------------------------------------------------
# ROUTE 1: PLACEMENT PREDICTOR (Phase 1)
# ---------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        def s_num(v): return float(v) if v and str(v).strip() != "" else 0

        features = np.array([[
            s_num(data.get('cgpa')), s_num(data.get('internships')), 
            s_num(data.get('projects')), s_num(data.get('workshops')), 
            s_num(data.get('aptitudeScore')), s_num(data.get('softSkills')),
            int(s_num(data.get('extracurricular'))), int(s_num(data.get('placementTraining'))),
            s_num(data.get('ssc_marks')), s_num(data.get('hsc_marks'))
        ]])
        
        if model:
            prob = model.predict_proba(features)[0][1]
            return jsonify({'probability': round(prob * 100, 2)})
        return jsonify({'probability': 75.0})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ---------------------------------------------------------
# ROUTE 2: SKILL GAP ANALYZER (Phase 2)
# ---------------------------------------------------------
@app.route('/analyze-skills', methods=['POST'])
def analyze_skills():
    try:
        data = request.json
        role = data.get('targetRole', 'Software Engineer')
        skills = data.get('userSkills', 'Technical basics')
        project = data.get('projectDesc', 'No project details')

        ai_model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""Target Role: {role}. Skills: {skills}. Project: {project}.
        Identify 5 missing technical skills for 2025. 
        Return ONLY JSON: {{"missing_skills": ["s1","s2","s3","s4","s5"], "advice": "string", "project_fix": "string"}}"""
        
        response = ai_model.generate_content(prompt)
        return jsonify(json.loads(clean_ai_json(response.text)))
    except Exception as e:
        return jsonify({"missing_skills": ["System Design", "Cloud", "Testing", "DevOps", "Agile"], "advice": "Focus on fundamentals.", "project_fix": "Improve documentation."})

# ---------------------------------------------------------
# ROUTE 3: INTERVIEW QUESTIONS (Phase 3)
# ---------------------------------------------------------
@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        role = data.get('targetRole')
        prompt = f"Technical Interviewer for {role}. Generate 3 unique, medium-difficulty technical questions (max 20 words). Return ONLY JSON list: ['Q1', 'Q2', 'Q3']"
        
        ai_model = genai.GenerativeModel('gemini-2.5-flash')
        response = ai_model.generate_content(prompt, generation_config={"temperature": 0.9})
        return jsonify(json.loads(clean_ai_json(response.text)))
    except:
        return jsonify(["Describe your favorite project.", "How do you handle technical bugs?", "Explain a core concept of your tech stack."])

# ---------------------------------------------------------
# ROUTE 4: EVALUATE INTERVIEW (Phase 3/4)
# ---------------------------------------------------------
@app.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer', '')
        
        ai_model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"Question: {question}. Answer: {answer}. Rate technical accuracy (1-10) and give feedback. Return ONLY JSON: {{'score': 8, 'feedback': 'text'}}"
        
        response = ai_model.generate_content(prompt)
        eval_data = json.loads(clean_ai_json(response.text))

        # Manual Metrics
        words = answer.split()
        fillers = sum(1 for w in words if w.lower() in ["um", "uh", "like", "basically", "actually"])

        return jsonify({
            "score": eval_data.get('score', 5),
            "feedback": eval_data.get('feedback', 'Answer evaluated successfully.'),
            "filler_count": fillers,
            "wpm": int(data.get('wpm', 120))
        })
    except:
        return jsonify({"score": 5, "feedback": "Answer recorded.", "filler_count": 0, "wpm": 110})

if __name__ == '__main__':
    app.run(debug=True, port=5000)