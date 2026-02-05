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

# --- CONFIGURATION ---
load_dotenv()
print(f"DEBUG: Using API Key starting with: {os.getenv('GEMINI_API_KEY')[:10]}...")
genai.configure(api_key="AIzaSyDWgOG6lvURRiEWB_6Bm3OIxDxUnyovjh4")

# Use a stable model name to avoid 404/500 errors
AI_MODEL = 'gemini-flash-latest'

# --- LOAD ML MODEL ---
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ ML Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model.pkl: {e}")

# --- ROBUST HELPER FUNCTION FOR CLEANING AI JSON ---
def clean_ai_json(text):
    # Removes markdown blocks like ```json ... ``` or ``` ... ```
    text = re.sub(r'```(?:json)?\s?|```', '', text)
    return text.strip()

# ---------------------------------------------------------
# ROUTE 1: PLACEMENT PREDICTOR (PHASE 1)
# ---------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Feature names must match exactly what the model was trained on
        feature_names = ['cgpa', 'internships', 'projects', 'workshops', 
                         'aptitudeScore', 'softSkills', 'extracurricular', 
                         'placementTraining', 'ssc_marks', 'hsc_marks']
        
        features_list = [
            float(data.get('cgpa', 0)), int(data.get('internships', 0)),
            int(data.get('projects', 0)), int(data.get('workshops', 0)),
            float(data.get('aptitudeScore', 0)), float(data.get('softSkills', 0)),
            int(data.get('extracurricular', 0)), int(data.get('placementTraining', 0)),
            float(data.get('ssc_marks', 0)), float(data.get('hsc_marks', 0))
        ]
        
        # Convert to DataFrame to avoid "Feature Name" warnings
        df = pd.DataFrame([features_list], columns=feature_names)
        probability = model.predict_proba(df)[0][1]
        
        return jsonify({'probability': round(probability * 100, 2)})
    except Exception as e:
        print(f"Predict Error: {e}")
        return jsonify({'error': str(e)}), 500

# ---------------------------------------------------------
# ROUTE 2: SKILL GAP ANALYZER (PHASE 2)
# ---------------------------------------------------------
@app.route('/analyze-skills', methods=['POST'])
def analyze_skills():
    try:
        data = request.json
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Target Role: {data.get('targetRole')}. Skills: {data.get('userSkills')}. Identify 5 missing skills for 2025. Return ONLY JSON: {{'missing_skills': [], 'advice': ''}}"
        response = model_ai.generate_content(prompt)
        return jsonify(json.loads(clean_ai_json(response.text)))
    except Exception as e:
        print(f"AI Skill Error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# ROUTE 3: GENERATE INTERVIEW QUESTIONS (PHASE 3)
# ---------------------------------------------------------
@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"Hiring for {data.get('targetRole')}. Provide 3 technical questions (medium difficulty, 15-25 words). Return ONLY a JSON list of strings."
        response = model_ai.generate_content(prompt)
        return jsonify(json.loads(clean_ai_json(response.text)))
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

        if len(answer) < 5:
            return jsonify({"score": 1, "feedback": "Answer too short.", "filler_count": 0})

        # 1. Filler count
        fillers = ["um", "uh", "like", "basically", "actually"]
        f_count = sum(1 for w in answer.lower().split() if w in fillers)

        # 2. AI Prompt (Added "Double Quotes" instruction)
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"""
        Question: {question}
        User Answer: {answer}
        Evaluate technical accuracy. 
        IMPORTANT: Use ONLY double quotes for keys and string values.
        Return ONLY this JSON structure:
        {{"score": 7, "feedback": "concise feedback"}}
        """

        response = model_ai.generate_content(prompt)
        raw_text = response.text.strip()
        
        # 3. ROBUST CLEANING
        # Remove markdown backticks
        cleaned_text = re.sub(r'```(?:json)?\s?|```', '', raw_text).strip()
        
        # FIX: If AI used single quotes, convert them to double quotes
        # (This solves the specific error you got)
        cleaned_text = cleaned_text.replace("'", '"')

        try:
            evaluation = json.loads(cleaned_text)
        except Exception as e:
            # Fallback if JSON is still broken
            print(f"JSON Parse Retry failed: {cleaned_text}")
            return jsonify({
                "score": 5, 
                "feedback": "Technical answer received. AI had trouble formatting score.",
                "filler_count": f_count
            })
        
        if "rating" in evaluation: evaluation["score"] = evaluation["rating"]
        evaluation['filler_count'] = f_count
        return jsonify(evaluation)

    except Exception as e:
        print(f"Critical Evaluation Error: {e}")
        return jsonify({"error": str(e)}), 500
# ---------------------------------------------------------
# ROUTE 5: GENERATE ROADMAP (PHASE 4 - NEW FEATURE)
# ---------------------------------------------------------
@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    try:
        data = request.json
        model_ai = genai.GenerativeModel(AI_MODEL)
        prompt = f"""
        Act as a Career Coach. Create a {data.get('duration')}-day learning roadmap for a {data.get('targetRole')}.
        Missing Skills: {data.get('missingSkills')}.
        Return ONLY a JSON object with this structure:
        {{
          "title": "Roadmap Title",
          "weeks": [
            {{ "week": 1, "goal": "Topic Name", "tasks": ["Task 1", "Task 2"] }}
          ]
        }}
        """
        response = model_ai.generate_content(prompt)
        return jsonify(json.loads(clean_ai_json(response.text)))
    except Exception as e:
        print(f"Roadmap Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)