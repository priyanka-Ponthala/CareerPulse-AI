from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re
import sqlite3
from datetime import datetime

# --- DATABASE INITIALIZATION ---
def init_db():
    conn = sqlite3.connect('career_pulse.db')
    cursor = conn.cursor()
    # Table to track session history over time
    cursor.execute('''CREATE TABLE IF NOT EXISTS history 
        (id INTEGER PRIMARY KEY AUTOINCREMENT, 
         date TEXT, 
         role TEXT, 
         probability REAL, 
         avg_interview_score REAL)''')
    conn.commit()
    conn.close()

init_db()

# --- APP CONFIGURATION ---
app = Flask(__name__)
CORS(app)
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- LOAD ML MODEL ---
try:
    model = pickle.load(open('model.pkl', 'rb'))
except Exception as e:
    print(f"Error loading model.pkl: {e}")

# --- HELPER FUNCTIONS ---
def clean_ai_json(text):
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()

# ---------------------------------------------------------
# ROUTE 1: PLACEMENT PREDICTOR (PHASE 1)
# ---------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        features = [
            float(data['cgpa']),
            int(data['internships']),
            int(data['projects']),
            int(data['workshops']),
            float(data['aptitudeScore']),
            float(data['softSkills']),
            int(data['extracurricular']),
            int(data['placementTraining']),
            float(data['ssc_marks']),
            float(data['hsc_marks'])
        ]
        prediction = model.predict([features])[0]
        probability = model.predict_proba([features])[0][1]
        
        return jsonify({
            'placed': int(prediction),
            'probability': round(probability * 100, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ---------------------------------------------------------
# ROUTE 2: SKILL GAP ANALYZER (PHASE 2)
# ---------------------------------------------------------
@app.route('/analyze-skills', methods=['POST'])
def analyze_skills():
    try:
        data = request.json
        target_role = data.get('targetRole')
        user_skills = data.get('userSkills')

        ai_model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        Act as a tech recruiter. Target Role: {target_role}. Skills: {user_skills}.
        Identify 5 missing skills for 2025. Return ONLY JSON:
        {{
          "missing_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
          "advice": "one short sentence"
        }}
        """
        response = ai_model.generate_content(prompt)
        return jsonify(json.loads(clean_ai_json(response.text)))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 3: GENERATE QUESTIONS (PHASE 3)
# ---------------------------------------------------------
@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        role = data.get('targetRole')
        prompt = f"Conduct a screening for {role}. Give 3 technical questions (15-25 words each). Return ONLY JSON list of strings."
        
        ai_model = genai.GenerativeModel('gemini-1.5-flash')
        response = ai_model.generate_content(prompt, generation_config={"temperature": 0.4})
        return jsonify(json.loads(clean_ai_json(response.text)))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 4: EVALUATE ANSWER + WPM (PHASE 3 & 4)
# ---------------------------------------------------------
@app.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer', '').strip()
        duration = data.get('duration', 1) # Duration in seconds from frontend

        if not answer or len(answer) < 5:
            return jsonify({"score": 0, "feedback": "Answer too short.", "filler_count": 0, "wpm": 0}), 200

        # 1. ANALYTICS: WPM & FILLERS
        words = answer.split()
        filler_words = ["um", "uh", "like", "basically", "actually", "you know"]
        filler_count = sum(1 for w in words if w.lower() in filler_words)
        
        # WPM Calculation: (Words / Seconds) * 60
        wpm = round((len(words) / duration) * 60) if duration > 0 else 0
        
        # 2. AI EVALUATION
        ai_model = genai.GenerativeModel('gemini-1.5-flash') 
        prompt = f"Question: {question}. Answer: {answer}. Evaluate accuracy (1-10). Return ONLY JSON: {{'score': 7, 'feedback': 'string'}}"
        
        response = ai_model.generate_content(prompt)
        evaluation = json.loads(clean_ai_json(response.text))

        return jsonify({
            "score": evaluation.get('score', 5),
            "feedback": evaluation.get('feedback', ''),
            "filler_count": filler_count,
            "wpm": wpm
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 5: 30-DAY ROADMAP (PHASE 4)
# ---------------------------------------------------------
@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    try:
        data = request.json
        skills = data.get('missing_skills', [])
        role = data.get('targetRole')
        
        prompt = f"""
        Role: {role}. Missing Skills: {skills}. 
        Create a 30-day plan. Return ONLY JSON with keys: week1, week2, week3, week4.
        """
        
        ai_model = genai.GenerativeModel('gemini-1.5-flash')
        response = ai_model.generate_content(prompt)
        return jsonify(json.loads(clean_ai_json(response.text)))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 6: PERSISTENCE (SAVE HISTORY)
# ---------------------------------------------------------
@app.route('/save-session', methods=['POST'])
def save_session():
    try:
        data = request.json
        role = data.get('role')
        prob = data.get('probability')
        score = data.get('avg_score')

        conn = sqlite3.connect('career_pulse.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO history (date, role, probability, avg_interview_score) VALUES (?, ?, ?, ?)",
                       (datetime.now().strftime("%Y-%m-%d %H:%M"), role, prob, score))
        conn.commit()
        conn.close()
        return jsonify({"status": "Session Saved"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)