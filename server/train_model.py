# --- STEP 1: IMPORTING THE TOOLKIT ---
# pandas: used to read and manipulate the spreadsheet (CSV)
import pandas as pd 
# LabelEncoder: used to turn words like "Yes/No" into numbers like 1/0
from sklearn.preprocessing import LabelEncoder
# RandomForestClassifier: The actual AI algorithm (the "Brain")
from sklearn.ensemble import RandomForestClassifier
# train_test_split: used to set aside some data to test the AI's accuracy
from sklearn.model_selection import train_test_split
# pickle: used to save the trained model to a file
import pickle

# --- STEP 2: LOADING THE DATA ---
# We tell Python to open your CSV file and look at it
df = pd.read_csv('placementdata.csv') 

# --- STEP 3: PREPROCESSING (TRANSLATION) ---
# Machine Learning models cannot understand words like "Yes", "No", or "Placed".
# We must turn them into 1s and 0s.
le = LabelEncoder()

# Change "Yes/No" to 1/0 for these specific columns
df['ExtracurricularActivities'] = le.fit_transform(df['ExtracurricularActivities'])
df['PlacementTraining'] = le.fit_transform(df['PlacementTraining'])
# Change "Placed/NotPlaced" to 1/0
df['PlacementStatus'] = le.fit_transform(df['PlacementStatus'])

# --- STEP 4: DEFINING FEATURES (X) AND TARGET (y) ---
# X = The "Questions" (Factors that affect placement)
X = df[['CGPA', 'Internships', 'Projects', 'Workshops/Certifications', 
        'AptitudeTestScore', 'SoftSkillsRating', 'ExtracurricularActivities', 
        'PlacementTraining', 'SSC_Marks', 'HSC_Marks']]

# y = The "Answer" (What we want the AI to predict)
y = df['PlacementStatus']

# --- STEP 5: SPLITTING THE DATA ---
# We take 80% of the data to teach the AI, and 20% to test it later
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- STEP 6: TRAINING (THE LEARNING PHASE) ---
# We create an instance of the Random Forest "Brain"
model = RandomForestClassifier(n_estimators=100)
# We give the "Questions" (X) and "Answers" (y) to the model to find patterns
model.fit(X_train, y_train)

# --- STEP 7: EXPORTING (SAVING THE BRAIN) ---
# Why: We don't want to "teach" the AI every time a user visits the website.
# How: We "pickle" it (save it as a file).
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Success: model.pkl has been created in the server folder!")