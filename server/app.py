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

# --- CONFIGURATION (PHASE 2) ---
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- LOAD ML MODEL (PHASE 1) ---
model = pickle.load(open('model.pkl', 'rb'))

# ---------------------------------------------------------
# ROUTE 1: PLACEMENT PREDICTOR (PHASE 1)
# ---------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # ... (Your existing prediction logic here) ...
    return jsonify({'probability': 85}) # Example response


# ---------------------------------------------------------
# ROUTE 2: SKILL GAP ANALYZER (PHASE 2)
# ---------------------------------------------------------
@app.route('/analyze-skills', methods=['POST'])
def analyze_skills():
    try:
        data = request.json
        target_role = data.get('targetRole')
        user_skills = data.get('userSkills')

        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""
        Act as a professional technical recruiter. 
        Target Role: {target_role}
        Current Skills: {user_skills}
        
        Identify 5 missing skills for 2025. 
        Return ONLY a raw JSON object. No markdown, no triple backticks.
        Structure:
        {{
          "missing_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
          "advice": "one short sentence"
        }}
        """

        response = model.generate_content(prompt)
        
        # --- NEW SAFER PARSING ---
        text = response.text.strip()
        
        # Remove markdown code blocks if the AI included them
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        # Clean up any remaining whitespace
        text = text.strip()
        
        # Convert string to actual JSON
        ai_json = json.loads(text)
        return jsonify(ai_json)

    except Exception as e:
        # This will print the EXACT error in your terminal so you can see it
        print("Detailed Error:", str(e))
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True, port=5000)