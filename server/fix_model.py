import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle
import numpy as np

# These are the EXACT names your React app and app.py use
feature_names = [
    'cgpa', 'internships', 'projects', 'workshops', 'aptitudeScore', 
    'softSkills', 'extracurricular', 'placementTraining', 'ssc_marks', 'hsc_marks'
]

# Create synthetic data for training
data = []
for _ in range(1000):
    cgpa = np.random.uniform(6, 10)
    interns = np.random.randint(0, 3)
    proj = np.random.randint(1, 5)
    work = np.random.randint(0, 3)
    apt = np.random.uniform(50, 100)
    soft = np.random.uniform(1, 5)
    extra = np.random.randint(0, 2)
    train = np.random.randint(0, 2)
    ssc = np.random.uniform(60, 100)
    hsc = np.random.uniform(60, 100)
    
    # Logic: Higher CGPA and Internships = Higher Placement Chance
    placed = 1 if (cgpa * 0.6 + interns * 2 + proj * 0.5) > 8 else 0
    data.append([cgpa, interns, proj, work, apt, soft, extra, train, ssc, hsc, placed])

df = pd.DataFrame(data, columns=feature_names + ['placed'])

X = df[feature_names]
y = df['placed']

# Train the model
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Save it
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("✅ Model retrained with correct feature names!")