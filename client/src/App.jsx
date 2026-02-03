import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Target, Mic, ArrowRight, RefreshCcw, LayoutDashboard, MessageSquare, UserCircle, Briefcase, Award, MicOff } from 'lucide-react';

function App() {
  const [appStep, setAppStep] = useState('input'); // 'input', 'analysis', 'interview', 'report'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cgpa: '', internships: 0, projects: 0, workshops: 0, aptitudeScore: 0, softSkills: 0, extracurricular: 0, placementTraining: 0, ssc_marks: 0, hsc_marks: 0, targetRole: '', userSkills: '', projectDesc: ''
  });

  const [result, setResult] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState([]);
  const [startTime, setStartTime] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resP = await axios.post('http://127.0.0.1:5000/predict', formData);
      const resS = await axios.post('http://127.0.0.1:5000/analyze-skills', formData);
      setResult(resP.data); setSkillGap(resS.data);
      setAppStep('analysis');
    } catch { alert("Backend Error!"); }
    setLoading(false);
  };

  const startInterviewFlow = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/generate-questions', formData);
      setQuestions(res.data);
      setInterviewFeedback([]); setCurrentQuestionIdx(0);
      setAppStep('interview');
    } catch { alert("AI Interview Error!"); }
    setLoading(false);
  };

  const startSpeech = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US'; recognition.continuous = true; recognition.interimResults = true;
    recognition.onstart = () => { setIsListening(true); setTranscript(""); setStartTime(Date.now()); };
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
    if (transcript.trim().split(" ").length < 3) { alert("Please provide a real answer."); return; }
    setLoading(true);
    const wpm = Math.round((transcript.split(" ").length / ((Date.now() - startTime) / 1000)) * 60);
    try {
      const res = await axios.post('http://127.0.0.1:5000/evaluate-interview', {
        question: questions[currentQuestionIdx], answer: transcript, wpm: wpm
      });
      const updated = [...interviewFeedback, res.data];
      setInterviewFeedback(updated);
      setTranscript("");
      if (currentQuestionIdx >= 2) setAppStep('report'); // Stops at 3 questions
      else setCurrentQuestionIdx(prev => prev + 1);
    } catch { alert("Evaluation failed!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <nav className="bg-white border-b px-10 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <BrainCircuit className="text-indigo-600" /> <span className="font-bold text-xl">CareerPulse AI</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {appStep === 'input' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
              <form onSubmit={handleInitialSubmit} className="bg-white shadow-2xl rounded-[2rem] p-10 space-y-8 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SectionHeader icon={<UserCircle/>} title="Academia" />
                   <FormInput label="CGPA" name="cgpa" step="0.01" onChange={handleChange} />
                   <FormInput label="Aptitude Score" name="aptitudeScore" onChange={handleChange} />
                   <FormInput label="10th Marks %" name="ssc_marks" onChange={handleChange} />
                   <FormInput label="12th Marks %" name="hsc_marks" onChange={handleChange} />
                   
                   <SectionHeader icon={<Briefcase/>} title="Experience" />
                   <FormInput label="Internships" name="internships" type="number" onChange={handleChange} />
                   <FormInput label="Soft Skills (1-5)" name="softSkills" type="number" step="0.1" onChange={handleChange} />
                   
                   <SectionHeader icon={<Target/>} title="Role & Project" />
                   <div className="md:col-span-2 space-y-4">
                    <input name="targetRole" onChange={handleChange} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Target Job Role (e.g. Frontend Dev)" required />
                    <textarea name="projectDesc" onChange={handleChange} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Describe your main project briefly..." required />
                   </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">
                  {loading ? <RefreshCcw className="animate-spin inline mr-2"/> : "Analyze My Profile"}
                </button>
              </form>
            </motion.div>
          )}

          {appStep === 'analysis' && (
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="space-y-8">
               <div className="bg-white p-12 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center gap-10 border border-indigo-50">
                  <h2 className="text-7xl font-black text-indigo-600">{result?.probability}%</h2>
                  <p className="text-xl text-slate-500 leading-relaxed text-center md:text-left">Probability of securing a <strong>{formData.targetRole}</strong> role based on your profile analytics.</p>
               </div>
               <div className="bg-amber-50 p-10 rounded-[2.5rem] border border-amber-200">
                  <h4 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2"><LayoutDashboard/> AI Skill-Gap Analysis</h4>
                  <div className="flex flex-wrap gap-3 mb-8">{skillGap?.missing_skills.map(s => <span key={s} className="bg-white px-5 py-2 rounded-2xl text-sm font-bold text-amber-700 border border-amber-200 shadow-sm">+ {s}</span>)}</div>
                  <p className="text-amber-800 italic bg-white/50 p-5 rounded-2xl border border-amber-100">" {skillGap?.advice} To improve your project: {skillGap?.project_fix} "</p>
               </div>
               <button onClick={startInterviewFlow} className="w-full bg-emerald-600 text-white font-black py-6 rounded-3xl shadow-2xl hover:bg-emerald-700 transition-all">Start AI Technical Interview 🎤</button>
            </motion.div>
          )}

          {appStep === 'interview' && (
            <motion.div initial={{x:20}} animate={{x:0}} className="bg-slate-900 text-white p-16 rounded-[3rem] text-center shadow-2xl border border-slate-800">
               <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-10">Question {currentQuestionIdx+1} / 3</p>
               <h3 className="text-3xl font-medium mb-20 italic">"{questions[currentQuestionIdx]}"</h3>
               <div className="flex flex-col items-center gap-10">
                  <button onClick={startSpeech} disabled={isListening} className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${isListening?'bg-rose-500 animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.5)]':'bg-indigo-600'}`}>
                    {isListening ? <MicOff size={40}/> : <Mic size={40}/>}
                  </button>
                  {transcript && <div className="w-full p-8 bg-slate-800 rounded-3xl italic text-slate-300 border border-slate-700">" {transcript} "</div>}
                  {transcript && !isListening && <button onClick={handleNextQuestion} className="w-full bg-emerald-500 py-5 rounded-2xl font-bold text-xl">Evaluate & Continue →</button>}
               </div>
            </motion.div>
          )}

          {appStep === 'report' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-10">
               <h2 className="text-4xl font-black text-center text-slate-800">Interview Performance Audit</h2>
               {interviewFeedback.map((item, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                    <div className="flex justify-between items-center"><span className="text-indigo-600 font-bold uppercase text-xs tracking-widest">Question {i+1} Analytics</span><span className="text-2xl font-black">{item.score}/10</span></div>
                    <p className="text-slate-800 font-medium italic">"{questions[i]}"</p>
                    <p className="text-sm text-slate-500 bg-slate-50 p-5 rounded-2xl border"><strong>AI Feedback:</strong> {item.feedback}</p>
                    <div className="flex gap-4"><span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold border border-rose-100 uppercase">Hesitations: {item.filler_count}</span><span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 uppercase">Fluency: {item.wpm} WPM</span></div>
                 </div>
               ))}
               <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-bold py-6 rounded-3xl">Restart Assessment</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const SectionHeader = ({ icon, title }) => <div className="md:col-span-2 flex items-center gap-2 text-indigo-600 font-bold border-b border-slate-50 pb-2 mb-2 mt-4">{icon} <span className="uppercase text-[10px] tracking-widest">{title}</span></div>;
const FormInput = ({ label, name, type="text", step, onChange }) => <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</label><input type={type} name={name} step={step} onChange={onChange} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all" required /></div>;

export default App;