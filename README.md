# CareerPulse-AI 🚀

CareerPulse-AI is an AI-powered career coaching platform designed to help students and fresh graduates evaluate their placement readiness, identify skill gaps, and practice interviews using Artificial Intelligence.

Unlike basic placement predictors, CareerPulse-AI works as a **complete career preparation ecosystem** — predicting outcomes, diagnosing weaknesses, and helping users improve through guided practice.

---

## 🔍 Features & Functionalities

### 1. Placement Predictor (Machine Learning) ✅ *Completed*
Uses a **Random Forest Classifier** trained on academic and professional data to analyze:
- CGPA, SSC, and HSC Marks
- Internships and Projects
- Aptitude and Soft Skill ratings

📊 **Result:** Provides a real-time placement probability percentage.

---

### 2. Skill-Gap Analysis (Generative AI) ✅ *Completed*
Powered by the **Google Gemini 1.5 API**, this feature provides personalized coaching:
- Users input their **Target Role** and **Current Skills**.
- AI identifies the top 5 missing skills based on **2025 industry trends**.
- Provides a personalized career advice snippet to bridge the gap.

🛠️ **Result:** A clear roadmap of what technical skills to learn next.

---

### 3. AI Mock Interview (Generative AI) 🚧 *Planned*
A voice-based mock interview system where:
- Users select an interview topic.
- AI "listens" to spoken answers via Web Speech API.
- Responses are evaluated for technical accuracy and relevance.

🎤 **Upcoming:** Real-time feedback using Generative AI.

---

### 4. Confidence Scoring (Speech Analysis) 🚧 *Planned*
Analyzes the user’s speech patterns during the mock interview to evaluate:
- Filler words (um, uh, etc.)
- Words Per Minute (WPM) speed.
- Overall vocal confidence.

🧠 **Upcoming:** A "Confidence ScoreCard" to help users perform better in real interviews.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Axios.
- **Backend**: Python, Flask, Flask-CORS.
- **Machine Learning**: Scikit-learn (Random Forest), Pandas.
- **Generative AI**: Google Gemini API (google-generativeai).
- **Environment**: Dotenv for secure API key management.

---

## 📌 Project Status

✅ **Phase 1 Complete**: ML Model trained, Backend API built, and Predictor UI finished.  
✅ **Phase 2 Complete**: Gemini AI integrated for real-time Skill-Gap Analysis.  
🚧 **Phase 3 (Next)**: Voice-based Mock Interview system.

---

## 📄 How to Run
1. **Backend**: Navigate to `/server`, activate `venv`, and run `python app.py`.
2. **Frontend**: Navigate to `/client`, run `npm install`, then `npm run dev`.

---

## 📄 License
This project is for academic and learning purposes.
© 2026 CareerPulse AI Team