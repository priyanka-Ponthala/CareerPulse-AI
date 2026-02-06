import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Target, Mic, CheckCircle2, ArrowRight, RefreshCcw, LayoutDashboard, MessageSquare, UserCircle, Briefcase, Award, ChevronRight, MicOff, BookOpen, AlertCircle } from 'lucide-react';

function App() {
  const [appStep, setAppStep] = useState('input'); 
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cgpa: '', ssc_marks: '', hsc_marks: '', aptitudeScore: '', 
    workshops: 0, internships: 0, softSkills: 0, 
    targetRole: '', userSkills: '', projectDesc: ''
  });

  const [result, setResult] = useState(null);
  const [profileAnalysis, setProfileAnalysis] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [interviewFeedback, setInterviewFeedback] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapDuration, setRoadmapDuration] = useState("30");

  // --- NEW: TEXT TO SPEECH ---
  const speak = (text) => {
    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- NEW: FRONTEND VALIDATION ---
  const validate = () => {
    if (formData.cgpa > 10 || formData.cgpa < 0) return "CGPA must be between 0 and 10";
    if (formData.ssc_marks > 100 || formData.hsc_marks > 100) return "Percentages cannot exceed 100%";
    if (formData.aptitudeScore > 100) return "Aptitude score must be 0-100";
    if (formData.targetRole.length < 3) return "Please enter a valid Job Role";
    if (formData.projectDesc.split(' ').length < 10) return "Please describe your project in at least 10 words";
    return null;
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return alert(error);

    setLoading(true);
    try {
      const resPredict = await axios.post('http://127.0.0.1:5000/predict', formData);
      const resProfile = await axios.post('http://127.0.0.1:5000/analyze-profile', formData);
      setResult(resPredict.data);
      setProfileAnalysis(resProfile.data);
      setAppStep('analysis');
    } catch (err) { alert("Error connecting to server. Ensure Flask is active."); }
    setLoading(false);
  };

  const startInterviewFlow = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/generate-questions', { targetRole: profileAnalysis.corrected_role });
      setQuestions(res.data);
      setAppStep('interview');
      speak(res.data[0]); // AI reads first question
    } catch (err) { alert("AI could not generate questions."); }
    setLoading(false);
  };

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) text += event.results[i][0].transcript;
      setTranscript(text);
      if (text.toLowerCase().includes("thank you")) recognition.stop();
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleNextQuestion = async () => {
    if (!transcript.trim()) return alert("Speak your answer first!");
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/evaluate-interview', { question: questions[currentQuestionIdx], answer: transcript });
      setInterviewFeedback([...interviewFeedback, res.data]);
      setTranscript("");
      if (currentQuestionIdx < questions.length - 1) {
        const nextQ = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextQ);
        speak(questions[nextQ]); // AI reads next question
      } else {
        setAppStep('report');
      }
    } catch (err) { alert("Evaluation failed."); }
    setLoading(false);
  };

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/generate-roadmap', { targetRole: profileAnalysis.corrected_role, missingSkills: profileAnalysis.missing_skills, duration: roadmapDuration });
      setRoadmap(res.data);
      setAppStep('roadmap');
    } catch (err) { alert("Roadmap error."); }
    setLoading(false);
  };

  const pageVariants = { initial: { opacity: 0, x: 20 }, in: { opacity: 1, x: 0 }, out: { opacity: 0, x: -20 } };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><BrainCircuit size={24} /></div>
            <span className="text-xl font-bold tracking-tight">CareerPulse <span className="text-indigo-600"></span></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{appStep} Mode</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {appStep === 'input' && (
            <motion.div key="input" variants={pageVariants} initial="initial" animate="in" exit="out">
              <div className="text-center mb-10"><h2 className="text-3xl font-black">Profile Builder</h2><p className="text-slate-500">Provide accurate details for a precise roadmap.</p></div>
              <form onSubmit={handleInitialSubmit} className="bg-white shadow-xl rounded-[2.5rem] p-8 md:p-12 space-y-8 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SectionHeader icon={<UserCircle size={18}/>} title="Academic Scores" />
                   <FormInput label="CGPA (Max 10)" name="cgpa" placeholder="9.5" onChange={handleChange} />
                   <FormInput label="10th Marks (%)" name="ssc_marks" placeholder="98" onChange={handleChange} />
                   <FormInput label="12th Marks (%)" name="hsc_marks" placeholder="95" onChange={handleChange} />
                   <FormInput label="Aptitude (0-100)" name="aptitudeScore" placeholder="85" onChange={handleChange} />
                   
                   <SectionHeader icon={<Briefcase size={18}/>} title="Background" />
                   <FormInput label="Certifications Count" name="workshops" type="number" onChange={handleChange} />
                   <FormInput label="Internships Count" name="internships" type="number" onChange={handleChange} />
                   <FormInput label="Soft Skills (1-5)" name="softSkills" type="number" onChange={handleChange} />
                   <FormInput label="Target Job Role" name="targetRole" placeholder="e.g. Full Stack" onChange={handleChange} />

                   <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Current Technical Skills</label>
                    <input name="userSkills" onChange={handleChange} placeholder="React, Python, SQL..." className="w-full mt-2 bg-slate-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                   </div>

                   <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Describe your Best Project</label>
                    <textarea name="projectDesc" onChange={handleChange} placeholder="What did you build? What tech was used?" className="w-full mt-2 bg-slate-50 border p-4 rounded-2xl outline-none h-32 focus:ring-2 focus:ring-indigo-500" required />
                   </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">{loading ? <RefreshCcw className="animate-spin" /> : "Analyze My Readiness →"}</button>
              </form>
            </motion.div>
          )}

          {appStep === 'analysis' && (
            <motion.div key="analysis" variants={pageVariants} initial="initial" animate="in" exit="out" className="space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center gap-10">
                <div className="text-center"><h3 className="text-5xl font-black text-indigo-600">{result?.probability}%</h3><p className="text-[10px] font-bold uppercase text-slate-400">Placement Chance</p></div>
                <div><h3 className="text-2xl font-bold">Role: {profileAnalysis?.corrected_role}</h3><p className="text-slate-500">Based on your academic profile and skills.</p></div>
              </div>

              <div className="bg-amber-50 p-10 rounded-[2.5rem] border border-amber-200">
                <h4 className="text-xl font-black mb-6 flex items-center gap-2 text-amber-900"><AlertCircle /> Missing Skills</h4>
                <div className="flex flex-wrap gap-2 mb-4">{profileAnalysis?.missing_skills.map(s => <span key={s} className="bg-white px-4 py-2 rounded-xl text-amber-700 font-bold border border-amber-200 shadow-sm">+ {s}</span>)}</div>
                <p className="italic text-amber-700">"{profileAnalysis?.advice}"</p>
              </div>

              {/* PROJECT EVALUATION SECTION */}
              <div className="bg-indigo-50 p-10 rounded-[2.5rem] border border-indigo-200">
                <h4 className="text-xl font-black mb-4 flex items-center gap-2 text-indigo-900"><BookOpen /> Project Evaluation</h4>
                <p className="text-indigo-800 font-medium mb-4">{profileAnalysis?.project_evaluation}</p>
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-indigo-400">Suggested Improvements:</p>
                    {profileAnalysis?.project_suggestions.map((s, i) => <li key={i} className="text-sm text-indigo-700 font-medium list-none flex items-center gap-2"><CheckCircle2 size={14}/> {s}</li>)}
                </div>
              </div>

              <button onClick={startInterviewFlow} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2rem] shadow-2xl hover:bg-emerald-700">Start Voice Interview 🎤</button>
            </motion.div>
          )}

          {appStep === 'interview' && (
            <motion.div key="interview" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-2xl mx-auto text-center">
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative border border-slate-800">
                <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-10 inline-block tracking-widest">Question {currentQuestionIdx + 1} / 3</div>
                <h3 className="text-2xl md:text-3xl font-semibold leading-snug mb-16 italic">"{questions[currentQuestionIdx]}"</h3>
                <button onClick={startSpeech} disabled={isListening} className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600 shadow-lg'}`}>{isListening ? <MicOff size={36}/> : <Mic size={36}/>}</button>
                {transcript && <div className="mt-8 p-6 bg-slate-800/40 rounded-2xl text-slate-300 italic">"{transcript}"</div>}
                {transcript && !isListening && <button onClick={handleNextQuestion} disabled={loading} className="mt-8 bg-emerald-500 px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 mx-auto">{loading ? <RefreshCcw className="animate-spin" /> : "Submit Answer →"}</button>}
              </div>
            </motion.div>
          )}

          {appStep === 'report' && (
            <motion.div key="report" variants={pageVariants} initial="initial" animate="in" exit="out" className="space-y-10">
              <div className="text-center"><Award className="mx-auto text-indigo-600 mb-4" size={48}/><h2 className="text-4xl font-black">Performance Report</h2></div>
              <div className="grid gap-6">{interviewFeedback.map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4"><span className="text-indigo-600 font-black text-xs">QUESTION {idx + 1}</span><span className="text-2xl font-black text-indigo-600">{item.score}/10</span></div>
                    <p className="text-slate-800 font-bold mb-4 italic">"{questions[idx]}"</p>
                    <p className="text-slate-600 text-sm mb-4"><strong>Feedback:</strong> {item.feedback}</p>
                    <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">⚠️ {item.filler_count} Hesitations</span>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-600 p-10 rounded-[3rem] text-white text-center shadow-2xl">
                <h3 className="text-2xl font-bold mb-2">Final Step: Roadmap 🚀</h3>
                <div className="flex justify-center gap-4 my-6">{["30"].map(d => <button key={d} onClick={() => setRoadmapDuration(d)} className={`px-8 py-3 rounded-xl font-bold ${roadmapDuration === d ? 'bg-white text-indigo-600' : 'bg-indigo-500'}`}>{d} Days</button>)}</div>
                <button onClick={handleGenerateRoadmap} disabled={loading} className="w-full bg-slate-900 py-5 rounded-2xl font-black">{loading ? <RefreshCcw className="animate-spin mx-auto"/> : "Get My Custom Plan →"}</button>
              </div>
            </motion.div>
          )}

          {appStep === 'roadmap' && (
             <motion.div key="roadmap" variants={pageVariants} initial="initial" animate="in" className="space-y-12">
               <div className="text-center"><h2 className="text-4xl font-black text-slate-900">{roadmap?.title}</h2></div>
               <div className="max-w-3xl mx-auto space-y-8 border-l-2 border-indigo-100 ml-4 pl-8">
                {roadmap?.weeks.map((w, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[41px] top-0 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white"></div>
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                      <h4 className="text-indigo-600 font-black text-xs mb-2">WEEK {w.week}</h4>
                      <h3 className="text-xl font-bold mb-4">{w.goal}</h3>
                      <ul className="space-y-2">{w.tasks.map((t, i) => <li key={i} className="text-slate-500 text-sm flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> {t}</li>)}</ul>
                    </div>
                  </div>
                ))}
               </div>
               <button onClick={() => window.location.reload()} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl">Restart New Session</button>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const SectionHeader = ({ icon, title }) => (<div className="md:col-span-2 flex items-center gap-2 text-indigo-600 font-black border-b border-slate-100 pb-3 mb-2 mt-6">{icon} <span className="uppercase tracking-[0.2em] text-[10px] font-black">{title}</span></div>);
const FormInput = ({ label, name, type = "text", placeholder, onChange }) => (
  <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
  <input type={type} name={name} onChange={onChange} placeholder={placeholder} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" required /></div>
);

export default App;