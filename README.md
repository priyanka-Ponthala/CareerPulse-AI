# CareerPulse 🚀
**A Holistic Ecosystem for Placement Prediction & Intelligent Mock Training**

CareerPulse is a comprehensive, end-to-end career coaching ecosystem designed for the modern job market. It moves beyond basic data tracking to provide a personalized "Success Loop": **Predictive Assessment ➔ Dynamic Diagnosis ➔ Immersive Practice ➔ Actionable Roadmap.** 

By integrating **Machine Learning** for predictive analytics, **Generative AI** for technical auditing, and **Speech Processing** for mock interviews, this platform provides students with a data-driven edge in their professional journey.

---

## 🔍 Core Technical Features

### 1. Intelligent Placement Predictor (ML) ✅
A high-precision predictive engine that evaluates a student's technical and academic standing.
*   **Engine:** Random Forest Classifier trained on 10,000+ candidate data points.
*   **Analysis:** Processes 10 key metrics including CGPA, Aptitude scores, Internships, and Technical certifications.
*   **Result:** Provides a real-time placement probability percentage using a custom Radial Progress Dashboard.

### 2. Smart Profile Audit & Project Critic (GenAI) ✅
Powered by **Google Gemini 1.5**, this module performs a deep technical scan of the user's current profile.
*   **Dynamic Skill-Gap:** Compares current skills against 2025 industry standards based specifically on the user's **Target Job Role**.
*   **Project Evaluation:** Analyzes the user's "Best Project" description, providing a technical critique and 3-5 specific architectural improvements.
*   **NLP Correction:** Automatically standardizes job titles and corrects spelling mistakes in user input.

### 3. Voice-Interactive Mock Interview 🎤 ✅
A realistic technical screening experience using a "Human-in-the-Loop" approach.
*   **Interviewer:** Generates role-specific, medium-difficulty technical questions on core concepts.
*   **Text-to-Speech (TTS):** The AI "speaks" the questions to the user using the `SpeechSynthesis` API.
*   **Voice-to-Text (STT):** Captures spoken answers in real-time using the **Web Speech API**.
*   **Keyword Stop Logic:** Implements sophisticated "Thank You" trigger detection to automatically finalize spoken responses.

### 4. Technical & Communication Performance Audit ✅
A multi-dimensional report card that analyzes technical accuracy and communication fluency.
*   **Accuracy Scoring:** The system evaluates technical depth and correctness on a 1-10 scale with qualitative feedback.
*   **Confidence Scorer:** Tracks "Filler Words" (um, uh, like, basically) to provide feedback on vocal confidence and professional presence.

### 5. Personalized 2025 Success Roadmap 🗺️ ✅
An actionable growth plan designed to bridge identified technical gaps.
*   **Paced Learning:** Users select between an intensive **30-day** mastery plan.
*   **Vertical Timeline UI:** A week-by-week breakdown of goals and tasks specific to the user's missing skills, visualized through a modern timeline component.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Framer Motion (Animations), Lucide-React |
| **Backend** | Python, Flask, Flask-CORS |
| **Machine Learning** | Scikit-learn (Random Forest), Pandas, Pickle |
| **Generative AI** | Google Gemini-Flash-Latest API, Advanced Prompt Engineering |
| **Speech** | Web Speech API (Speech-to-Text), SpeechSynthesis (Text-to-Speech) |
| **Environment** | Dotenv (Secure API Key Management) |

---

## 🏗️ Application Architecture
CareerPulse follows a **State-Driven Multi-Page Flow** to provide a focused User Experience:
1.  **Assessment Center:** Detailed profile and project input with robust frontend validation.
2.  **Dashboard Analysis:** Visual breakdown of placement probability and missing skill tags.
3.  **Interview Room:** High-focus, dark-mode environment for voice interaction.
4.  **Performance Audit:** Detailed scoring and feedback on technical and communication skills.
5.  **Mastery Roadmap:** Actionable week-by-week timeline for skill acquisition.

---

## 🚀 How to Run

### 1. Backend Setup (Flask)
```bash
cd server
python -m venv venv
# Activate venv: .\venv\Scripts\activate (Windows)
pip install -r requirements.txt
# Ensure model.pkl and .env (GEMINI_API_KEY) are in the /server folder
python app.py
 ```

---

### 2. Frontend Setup (React)
 ```bash
 cd client
 npm install
 npm start
 npm run dev
 ```