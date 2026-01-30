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
            return jsonify({"error": "No valid answer detected."}), 400

        # 1. FILLER WORD ANALYSIS (The "Hesitation" factor)
        fillers = ["um", "uh", "like", "basically", "actually", "you know", "i mean", "sort of"]
        words = answer.lower().split()
        filler_count = sum(1 for word in words if word in fillers)
        
        # 2. CALCULATE CONFIDENCE SCORE (Math-based)
        # We start at 100 and subtract 5 points for every filler word used
        base_confidence = 100 - (filler_count * 5)
        # Ensure it doesn't go below 10
        final_confidence_score = max(10, base_confidence)

        # 3. AI TECHNICAL EVALUATION
        # We use Gemini-2.0-flash as you mentioned it works for you
        ai_model = genai.GenerativeModel('gemini-2.5-flash') 
        prompt = f"""
        Question: {question}
        User Answer: {answer}
        
        Task:
        1. Rate technical accuracy (1-10).
        2. Provide 15-word feedback.
        3. Rate how "Confident" the phrasing sounds (1-10).
        
        Return ONLY JSON:
        {{
          "technical_score": number,
          "feedback": "string",
          "ai_confidence_rating": number
        }}
        """
        response = ai_model.generate_content(prompt)
        # Use your clean_ai_json helper here
        evaluation = json.loads(clean_ai_json(response.text))

        # 4. COMBINE EVERYTHING
        return jsonify({
            "technical_score": evaluation['technical_score'],
            "feedback": evaluation['feedback'],
            "filler_count": filler_count,
            "confidence_score": final_confidence_score, # Our math score
            "ai_confidence_rating": evaluation['ai_confidence_rating'] # Gemini's opinion
        })

    except Exception as e:
        print(f"Error in evaluation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)