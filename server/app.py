from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)  # This allows your React app to talk to this API

# Load the brain we just trained
model = pickle.load(open('model.pkl', 'rb'))

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Extract the 10 features in the EXACT order they were trained
        features = [
            float(data['cgpa']),
            int(data['internships']),
            int(data['projects']),
            int(data['workshops']),
            float(data['aptitudeScore']),
            float(data['softSkills']),
            int(data['extracurricular']), # 1 for Yes, 0 for No
            int(data['placementTraining']), # 1 for Yes, 0 for No
            float(data['ssc_marks']),
            float(data['hsc_marks'])
        ]
        
        # Predict probability
        prediction = model.predict([features])[0]
        probability = model.predict_proba([features])[0][1] # Get probability of "Placed"
        
        return jsonify({
            'placed': int(prediction),
            'probability': round(probability * 100, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)