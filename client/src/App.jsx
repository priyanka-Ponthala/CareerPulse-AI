import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    cgpa: '', internships: 0, projects: 0, workshops: 0,
    aptitudeScore: 0, softSkills: 0, extracurricular: 0,
    placementTraining: 0, ssc_marks: 0, hsc_marks: 0,
    targetRole: '', // NEW Phase 2
    userSkills: ''  // NEW Phase 2
  });
  const [result, setResult] = useState(null);
  const [skillGap, setSkillGap] = useState(null); // NEW Phase 2
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSkillGap(null);
    try {
      // 1. Prediction Request (Phase 1)
      const resPredict = await axios.post('http://127.0.0.1:5000/predict', formData);
      setResult(resPredict.data);

      // 2. AI Skill Gap Request (Phase 2)
      const resSkills = await axios.post('http://127.0.0.1:5000/analyze-skills', {
        targetRole: formData.targetRole,
        userSkills: formData.userSkills
      });
      setSkillGap(resSkills.data);

    } catch (error) {
      alert("Error: Make sure the Backend server and Gemini API are active!");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans flex flex-col items-center">
      {/* Main Container */}
      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-4xl font-extrabold tracking-tight italic">CareerPulse AI</h1>
          <p className="mt-2 text-blue-100 font-medium text-lg">AI-Powered Placement Prediction & Skill Analysis</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section Title: Academic & Soft Skills */}
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
              <label className="block text-sm font-bold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                {field.label}
              </label>
              <input 
                type="number" 
                name={field.name} 
                step={field.step} 
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50" 
                required 
              />
            </div>
          ))}

          <div className="group">
            <label className="block text-sm font-bold text-gray-700">Extracurricular?</label>
            <select name="extracurricular" onChange={handleChange} className="w-full mt-1 p-3 border border-gray-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="0">No / None</option>
              <option value="1">Yes, Active</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-bold text-gray-700">Placement Training?</label>
            <select name="placementTraining" onChange={handleChange} className="w-full mt-1 p-3 border border-gray-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="0">No Training</option>
              <option value="1">Completed Training</option>
            </select>
          </div>

          {/* NEW PHASE 2: Career Goals Section */}
          <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
            <h2 className="text-lg font-bold text-blue-700">Career Aspirations (AI Analysis)</h2>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700">Target Job Role</label>
            <input 
              type="text" name="targetRole" onChange={handleChange}
              placeholder="e.g. Full Stack Developer"
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" 
              required 
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700">Current Skills</label>
            <input 
              type="text" name="userSkills" onChange={handleChange}
              placeholder="e.g. Java, React, SQL (comma separated)"
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="md:col-span-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transform hover:-translate-y-1 transition-all shadow-lg active:scale-95 disabled:bg-slate-400 mt-4"
          >
            {loading ? "AI is Analyzing your profile..." : "Generate AI Career Roadmap"}
          </button>
        </form>

        {/* Results Section (Phase 1) */}
        {result && (
          <div className="p-8 bg-blue-50 border-t-2 border-dashed border-blue-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-block p-4 bg-white rounded-full shadow-inner mb-2">
               <h2 className="text-5xl font-black text-blue-600">{result.probability}%</h2>
            </div>
            <p className="text-xl text-blue-800 font-semibold italic">Predicted Chance of Placement</p>
          </div>
        )}

        {/* AI Skill Gap Section (Phase 2) */}
        {skillGap && (
          <div className="p-8 bg-amber-50 border-t-2 border-amber-200 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-xl font-black text-amber-900">AI Skill-Gap Analysis</h3>
            </div>
            
            <p className="text-amber-800 font-medium mb-3">To succeed as a <span className="font-bold underline">{formData.targetRole}</span>, you are missing:</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {skillGap.missing_skills.map((skill, index) => (
                <span key={index} className="bg-white border border-amber-300 text-amber-700 px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                  + {skill}
                </span>
              ))}
            </div>
            
            <div className="p-4 bg-white rounded-xl border border-amber-200 italic text-amber-700 text-sm shadow-inner">
              " {skillGap.advice} "
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-12 py-8 text-slate-500 text-sm text-center border-t border-slate-200 w-full max-w-4xl">
        <p className="font-medium">© 2026 CareerPulse AI - Intelligent Career Coaching</p>
        <p className="mt-1 text-slate-400">Powered by Random Forest & Google Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;