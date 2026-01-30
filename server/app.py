from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- LOAD ML MODEL (PHASE 1) ---
try:
    # Ensure model.pkl is in the same folder as app.py
    model = pickle.load(open('model.pkl', 'rb'))
except Exception as e:
    print(f"Error loading model.pkl: {e}")

# --- HELPER FUNCTION FOR CLEANING AI JSON ---
def clean_ai_json(text):
    text = text.strip()
    # Remove markdown code blocks if present
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

        ai_model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""
        Act as a professional technical recruiter. 
        Target Role: {target_role}
        Current Skills: {user_skills}
        Identify 5 missing skills for 2025 industry standards. 
        Return ONLY a raw JSON object. Structure:
        {{
          "missing_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
          "advice": "one short sentence"
        }}
        """
        response = ai_model.generate_content(prompt)
        clean_text = clean_ai_json(response.text)
        return jsonify(json.loads(clean_text))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 3: GENERATE INTERVIEW QUESTIONS (PHASE 3)
# ---------------------------------------------------------
@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        target_role = data.get('targetRole')

        ai_model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Act as a technical interviewer for a {target_role} position. 
        Generate 3 challenging technical interview questions. 
        Return ONLY a JSON list of strings. Example: ["question1", "question2", "question3"]
        """
        response = ai_model.generate_content(prompt)
        clean_text = clean_ai_json(response.text)
        return jsonify(json.loads(clean_text))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 4: EVALUATE INTERVIEW ANSWER (PHASE 3)
# ---------------------------------------------------------
@app.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer', '').strip()

        if not answer or len(answer) < 5:
            return jsonify({
                "score": 0,
                "feedback": "Answer was too short to evaluate.",
                "filler_count": 0
            }), 200

        # 1. FILLER WORD ANALYSIS
        fillers = ["um", "uh", "like", "basically", "actually", "you know", "i mean", "sort of"]
        words = answer.lower().split()
        filler_count = sum(1 for word in words if word in fillers)
        
        # 2. AI EVALUATION
        # Using 1.5-flash for stability, or 2.0-flash if your environment supports it
        ai_model = genai.GenerativeModel('gemini-2.5-flash') 
        prompt = f"""
        Question: {question}
        User Answer: {answer}
        
        Evaluate this technical answer.
        Return ONLY a JSON object with this exact structure:
        {{
          "score": number (1 to 10),
          "feedback": "string (max 20 words)"
        }}
        """
        response = ai_model.generate_content(prompt)
        evaluation = json.loads(clean_ai_json(response.text))

        # 3. SAFETY CHECK: Ensure key is 'score' for React
        final_score = evaluation.get('score', 0)
        if 'technical_score' in evaluation:
            final_score = evaluation['technical_score']

        return jsonify({
            "score": final_score, # Matches item.score in React
            "feedback": evaluation.get('feedback', 'No feedback provided'),
            "filler_count": filler_count
        })

    except Exception as e:
        print(f"Error in evaluation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)