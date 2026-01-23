import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    cgpa: '', internships: 0, projects: 0, workshops: 0,
    aptitudeScore: 0, softSkills: 0, extracurricular: 0,
    placementTraining: 0, ssc_marks: 0, hsc_marks: 0
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Talking to Person A's server (Port 5000)
      const response = await axios.post('http://127.0.0.1:5000/predict', formData);
      setResult(response.data);
    } catch (error) {
      alert("Backend not responding! Is Person A's server running?");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold italic">CareerPulse AI</h1>
          <p className="opacity-80">Smart Placement Predictor</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Numeric Inputs */}
          {[
            { label: "CGPA", name: "cgpa", step: "0.01" },
            { label: "SSC Marks (%)", name: "ssc_marks", step: "0.1" },
            { label: "HSC Marks (%)", name: "hsc_marks", step: "0.1" },
            { label: "Aptitude Score", name: "aptitudeScore", step: "1" },
            { label: "Internships", name: "internships", step: "1" },
            { label: "Projects", name: "projects", step: "1" },
            { label: "Workshops/Certs", name: "workshops", step: "1" },
            { label: "Soft Skills (1-5)", name: "softSkills", step: "0.1" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700">{field.label}</label>
              <input type="number" name={field.name} step={field.step} onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
          ))}

          {/* Dropdowns */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Extracurricular?</label>
            <select name="extracurricular" onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Placement Training?</label>
            <select name="placementTraining" onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>

          <button type="submit" className="md:col-span-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
            Check Placement Probability
          </button>
        </form>

        {result && (
          <div className="p-8 bg-blue-50 border-t border-blue-100 text-center animate-pulse">
            <h2 className="text-4xl font-black text-blue-900">{result.probability}%</h2>
            <p className="text-lg text-blue-700 font-medium">Predicted Probability of Placement</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;