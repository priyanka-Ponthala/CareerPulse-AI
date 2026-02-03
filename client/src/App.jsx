import React, { useState } from 'react';
import axios from 'axios';

function App() {
  // --- STATES ---
  const [formData, setFormData] = useState({
    cgpa: '', internships: 0, projects: 0, workshops: 0,
    aptitudeScore: 0, softSkills: 0, extracurricular: 0,
    placementTraining: 0, ssc_marks: 0, hsc_marks: 0,
    targetRole: '', 
    userSkills: ''  
  });

  const [result, setResult] = useState(null);
  const [skillGap, setSkillGap] = useState(null); 
  const [loading, setLoading] = useState(false);

  // Phase 3 States
  const [questions, setQuestions] = useState([]); 
  const [currentStep, setCurrentStep] = useState(0); 
  const [isListening, setIsListening] = useState(false); 
  const [transcript, setTranscript] = useState(""); 
  const [interviewFeedback, setInterviewFeedback] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSkillGap(null);
    setQuestions([]); // Reset interview if re-running
    try {
      const resPredict = await axios.post('http://127.0.0.1:5000/predict', formData);
      setResult(resPredict.data);

      const resSkills = await axios.post('http://127.0.0.1:5000/analyze-skills', {
        targetRole: formData.targetRole,
        userSkills: formData.userSkills
      });
      setSkillGap(resSkills.data);
    } catch (error) {
      alert("Error: Backend server is not responding!");
    }
    setLoading(false);
  };

  // --- PHASE 3 FUNCTIONS (VOICE & INTERVIEW) ---
  
  const startInterview = async () => {
    setInterviewLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/generate-questions', {
        targetRole: formData.targetRole
      });
      setQuestions(res.data);
      setCurrentStep(0);
      setInterviewFeedback([]);
    } catch (error) {
      alert("Failed to generate interview questions.");
    }
    setInterviewLoading(false);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.start();
  };

  const submitAnswer = async () => {
    setInterviewLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/evaluate-interview', {
        question: questions[currentStep],
        answer: transcript
      });
      
      setInterviewFeedback([...interviewFeedback, res.data]);
      setTranscript("");
      setCurrentStep(currentStep + 1);
    } catch (error) {
      alert("Error evaluating answer. Make sure you spoke clearly!");
    }
    setInterviewLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-4xl font-extrabold tracking-tight italic">CareerPulse AI</h1>
          <p className="mt-2 text-blue-100 font-medium text-lg">AI-Powered Placement Prediction & Mock Interview</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-blue-700">Academic & Technical Profile</h2>
          </div>

          {[
            { label: "Current CGPA", name: "cgpa", step: "0.01", placeholder: "e.g. 8.5" },
            { label: "SSC Marks (%)", name: "ssc_marks", step: "0.1", placeholder: "10th Grade %" },
            { label: "HSC Marks (%)", name: "hsc_marks", step: "0.1", placeholder: "12th Grade %" },
            { label: "Aptitude Score (0-100)", name: "aptitudeScore", step: "1", placeholder: "Test Score" },
            { label: "Internships Count", name: "internships", step: "1", placeholder: "No. of internships" },
            { label: "Projects Completed", name: "projects", step: "1", placeholder: "No. of projects" },
            { label: "Workshops/Certs", name: "workshops", step: "1", placeholder: "No. of certifications" },
            { label: "Soft Skills Rating (1-5)", name: "softSkills", step: "0.1", placeholder: "Rate yourself" },
          ].map((field) => (
            <div key={field.name} className="group">
              <label className="block text-sm font-bold text-gray-700">{field.label}</label>
              <input 
                type="number" name={field.name} step={field.step} onChange={handleChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" 
                required 
              />
            </div>
          ))}

          <div className="group">
            <label className="block text-sm font-bold text-gray-700">Extracurricular?</label>
            <select name="extracurricular" onChange={handleChange} className="w-full mt-1 p-3 border border-gray-300 rounded-xl bg-slate-50">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-bold text-gray-700">Placement Training?</label>
            <select name="placementTraining" onChange={handleChange} className="w-full mt-1 p-3 border border-gray-300 rounded-xl bg-slate-50">
              <option value="0">No Training</option>
              <option value="1">Completed Training</option>
            </select>
          </div>

          <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
            <h2 className="text-lg font-bold text-blue-700">Career Aspirations (AI Analysis)</h2>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700">Target Job Role</label>
            <input type="text" name="targetRole" onChange={handleChange} placeholder="e.g. Frontend Developer" className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700">Current Skills</label>
            <input type="text" name="userSkills" onChange={handleChange} placeholder="e.g. Java, React, SQL" className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg disabled:bg-slate-400 mt-4">
            {loading ? "Analyzing Profile..." : "Analyze Placement & Skill-Gap"}
          </button>
        </form>

        {/* Phase 1 & 2 Result Display */}
        {result && (
          <div className="p-8 bg-blue-50 border-t-2 border-dashed border-blue-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-5xl font-black text-blue-600">{result.probability}%</h2>
            <p className="text-xl text-blue-800 font-semibold italic">Placement Probability</p>
          </div>
        )}

        {skillGap && (
          <div className="p-8 bg-amber-50 border-t-2 border-amber-200 animate-in fade-in duration-700">
            <h3 className="text-xl font-black text-amber-900 mb-4">🤖 AI Skill-Gap Analysis</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {skillGap.missing_skills.map((skill, index) => (
                <span key={index} className="bg-white border border-amber-300 text-amber-700 px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                  + {skill}
                </span>
              ))}
            </div>
            <p className="p-4 bg-white rounded-xl italic text-amber-700 text-sm border border-amber-200">" {skillGap.advice} "</p>
            
            {/* START INTERVIEW BUTTON */}
            {questions.length === 0 && (
              <button onClick={startInterview} disabled={interviewLoading} className="mt-6 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all">
                {interviewLoading ? "Generating Questions..." : "Start Voice Mock Interview 🎤"}
              </button>
            )}
          </div>
        )}

        {/* PHASE 3: INTERVIEW INTERFACE */}
        {questions.length > 0 && currentStep < questions.length && (
          <div className="p-8 bg-slate-900 text-white animate-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm">Question {currentStep + 1} of 3</h3>
               <div className="h-2 w-32 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{width: `${((currentStep + 1) / 3) * 100}%`}}></div>
               </div>
            </div>
            
            <p className="text-2xl font-medium mb-10 leading-relaxed">"{questions[currentStep]}"</p>
            
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={handleVoiceInput} 
                disabled={isListening || interviewLoading}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                <span className="text-3xl">{isListening ? "⋯" : "🎤"}</span>
              </button>
              
              <p className="text-slate-400 text-sm font-medium">{isListening ? "Listening to your answer..." : "Click to start speaking"}</p>

              {transcript && (
                <div className="w-full p-4 bg-slate-800 rounded-2xl border border-slate-700 animate-in fade-in">
                  <p className="text-slate-300 italic text-center">" {transcript} "</p>
                </div>
              )}

              {transcript && !isListening && (
                <button onClick={submitAnswer} disabled={interviewLoading} className="bg-green-500 text-white px-10 py-3 rounded-full font-bold hover:bg-green-400 transition-all">
                  {interviewLoading ? "Evaluating..." : "Submit Answer →"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 3: FINAL REPORT CARD */}
        {currentStep >= questions.length && interviewFeedback.length > 0 && (
          <div className="p-8 bg-white border-t-4 border-blue-600 animate-in slide-in-from-bottom-10 duration-1000">
            <h2 className="text-3xl font-black text-center text-blue-800 mb-8 underline decoration-blue-200">Interview Performance Report 📊</h2>
            <div className="space-y-6">
              {interviewFeedback.map((item, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-slate-500 text-xs uppercase tracking-tighter">Question {idx + 1}</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-lg">{item.score}/10</span>
                  </div>
                  <p className="text-slate-800 font-medium mb-3 italic">"{questions[idx]}"</p>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed"><span className="font-bold text-blue-600">Feedback:</span> {item.feedback}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-600 rounded-full">
                      ⚠️ {item.filler_count} Filler Words (um, uh, like)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => window.location.reload()} className="mt-8 w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black transition-all">Retake Interview</button>
          </div>
        )}

      </div>

      <footer className="mt-12 py-8 text-slate-500 text-sm text-center border-t border-slate-200 w-full max-w-4xl">
        <p className="font-medium">© 2026 CareerPulse AI - Built with React & Flask</p>
        <p className="mt-1 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Machine Learning • GenAI • Voice Processing</p>
      </footer>
    </div>
  );
}

export default App;