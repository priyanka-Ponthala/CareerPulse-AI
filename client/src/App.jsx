import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Target, Mic, CheckCircle2, 
  ArrowRight, RefreshCcw, LayoutDashboard, 
  MessageSquare, UserCircle, Briefcase, Award,
  Sparkles, ChevronRight, MicOff
} from 'lucide-react';

function App() {
  // --- NAVIGATION STATE ---
  const [appStep, setAppStep] = useState('input'); // 'input', 'analysis', 'interview', 'report'

  // --- DATA STATES ---
  const [formData, setFormData] = useState({
    cgpa: '', internships: 0, projects: 0, workshops: 0,
    aptitudeScore: 0, softSkills: 0, extracurricular: 0,
    placementTraining: 0, ssc_marks: 0, hsc_marks: 0,
    targetRole: '', userSkills: ''
  });

  const [result, setResult] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- INTERVIEW STATES ---
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState([]);

  // --- HANDLERS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resPredict = await axios.post('http://127.0.0.1:5000/predict', formData);
      const resSkills = await axios.post('http://127.0.0.1:5000/analyze-skills', {
        targetRole: formData.targetRole, userSkills: formData.userSkills
      });
      setResult(resPredict.data);
      setSkillGap(resSkills.data);
      setAppStep('analysis');
      window.scrollTo(0, 0);
    } catch (error) { alert("Backend unavailable. Check Flask server."); }
    setLoading(false);
  };

  const startInterviewFlow = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/generate-questions', { targetRole: formData.targetRole });
      setQuestions(res.data);
      setAppStep('interview');
      window.scrollTo(0, 0);
    } catch (error) { alert("AI could not generate questions"); }
    setLoading(false);
  };

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let currentText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);

      // TRIGGER WORD STOP: "Thank you"
      if (currentText.toLowerCase().includes("thank you")) {
        recognition.stop();
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleNextQuestion = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/evaluate-interview', {
        question: questions[currentQuestionIdx], answer: transcript
      });
      setInterviewFeedback([...interviewFeedback, res.data]);
      setTranscript("");
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
      } else {
        setAppStep('report');
      }
    } catch (error) { alert("Evaluation failed"); }
    setLoading(false);
  };

  // --- UI COMPONENTS ---
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      {/* PROFESSIONAL NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <BrainCircuit size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              CareerPulse <span className="text-indigo-600 font-black">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {['Profile', 'Analysis', 'Interview', 'Report'].map((label, i) => {
              const steps = ['input', 'analysis', 'interview', 'report'];
              const isActive = steps.indexOf(appStep) === i;
              const isPast = steps.indexOf(appStep) > i;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : isPast ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {label}
                  </span>
                  {i < 3 && <div className={`h-1 w-6 rounded-full ${isPast ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: MODERN INPUT FORM */}
          {appStep === 'input' && (
            <motion.div key="input" variants={pageVariants} initial="initial" animate="in" exit="out" transition={{ duration: 0.4 }}>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Assessment Center</h2>
                <p className="text-slate-500 text-lg">Your data-driven path to a professional career begins here.</p>
              </div>

              <form onSubmit={handleInitialSubmit} className="bg-white shadow-2xl shadow-slate-200/60 rounded-[2.5rem] border border-slate-100 p-8 md:p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                   <SectionHeader icon={<UserCircle size={20}/>} title="Academic Foundation" />
                   <FormInput label="CGPA" name="cgpa" placeholder="0.00" onChange={handleChange} />
                   <FormInput label="10th Marks (%)" name="ssc_marks" placeholder="85" onChange={handleChange} />
                   <FormInput label="12th Marks (%)" name="hsc_marks" placeholder="88" onChange={handleChange} />
                   <FormInput label="Aptitude Score" name="aptitudeScore" placeholder="0-100" onChange={handleChange} />

                   <SectionHeader icon={<Briefcase size={20}/>} title="Experience & Soft Skills" />
                   <FormInput label="Internships" name="internships" type="number" onChange={handleChange} />
                   <FormInput label="Major Projects" name="projects" type="number" onChange={handleChange} />
                   <FormInput label="Soft Skills (1-5)" name="softSkills" type="number" step="0.1" onChange={handleChange} />
                   <FormInput label="Workshops/Certs" name="workshops" type="number" onChange={handleChange} />

                   <SectionHeader icon={<Target size={20}/>} title="Career Objectives" />
                   <div className="md:col-span-2 grid grid-cols-1 md:col-span-2 gap-6">
                    <FormInput label="Target Job Role" name="targetRole" placeholder="e.g. Data Analyst" onChange={handleChange} />
                    <FormInput label="Skills You Know" name="userSkills" placeholder="e.g. Python, SQL, Tableau" onChange={handleChange} />
                   </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 group">
                  {loading ? <RefreshCcw className="animate-spin" /> : <>Evaluate My Profile <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20}/></>}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: RESULTS DASHBOARD */}
          {appStep === 'analysis' && (
            <motion.div key="analysis" variants={pageVariants} initial="initial" animate="in" exit="out" className="space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-12">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="85" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-50" />
                    <circle cx="96" cy="96" r="85" stroke="currentColor" strokeWidth="14" fill="transparent" strokeDasharray={534} strokeDashoffset={534 - (534 * result?.probability) / 100} className="text-indigo-600 transition-all duration-1000" strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-4xl font-black text-slate-800">{result?.probability}%</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready</p>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
                    <Sparkles size={16}/> Prediction Result
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-4 leading-tight">Placement Probability</h3>
                  <p className="text-slate-500 text-lg leading-relaxed">Your profile has been benchmarked against 10,000+ candidate records. You have a high likelihood of securing your role as a <span className="text-slate-900 font-bold">{formData.targetRole}</span>.</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-[2.5rem] p-10 border border-amber-200/50 shadow-inner">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-amber-400 p-2 rounded-lg text-white"><LayoutDashboard size={20}/></div>
                  <h4 className="text-2xl font-black text-amber-900 tracking-tight">AI Skill Gap Analysis</h4>
                </div>
                <div className="flex flex-wrap gap-3 mb-8">
                  {skillGap?.missing_skills.map(skill => (
                    <span key={skill} className="bg-white px-5 py-2.5 rounded-2xl text-amber-800 font-bold border border-amber-200 shadow-sm text-sm transition-transform hover:scale-105">
                      + {skill}
                    </span>
                  ))}
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-amber-100 text-amber-900 italic text-md leading-relaxed">
                  <span className="text-amber-400 text-3xl font-serif mr-2">“</span>
                  {skillGap?.advice}
                </div>
              </div>

              <button onClick={startInterviewFlow} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-emerald-100 flex items-center justify-center gap-4 group">
                {loading ? <RefreshCcw className="animate-spin" /> : <>Enter AI Mock Interview Room <Mic className="group-hover:scale-110 transition-transform" size={24}/></>}
              </button>
            </motion.div>
          )}

          {/* STEP 3: FOCUSED INTERVIEW ROOM */}
          {appStep === 'interview' && (
            <motion.div key="interview" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-3xl mx-auto">
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="flex justify-between items-center mb-16">
                   <div className="bg-indigo-500/10 text-indigo-400 px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border border-indigo-500/20">Technical Screening • {currentQuestionIdx + 1} / 3</div>
                   <div className="flex gap-1.5">
                      {[1,2,3].map(i => <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= currentQuestionIdx + 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />)}
                   </div>
                </div>

                <h3 className="text-2xl md:text-4xl font-semibold leading-snug mb-20 text-indigo-50">"{questions[currentQuestionIdx]}"</h3>

                <div className="flex flex-col items-center">
                  <div className="relative">
                    {isListening && <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20" />}
                    <button onClick={startSpeech} disabled={isListening} className={`w-28 h-28 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${isListening ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] scale-110' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                      {isListening ? <MicOff size={36} /> : <Mic size={36} />}
                    </button>
                  </div>
                  
                  <p className="mt-8 text-slate-400 font-bold tracking-wide text-sm uppercase">
                    {isListening ? "Listening... Say 'Thank You' to stop" : "Click microphone to start speaking"}
                  </p>

                  <AnimatePresence>
                    {transcript && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 w-full p-8 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 text-slate-300 text-center italic text-lg leading-relaxed shadow-inner">
                        "{transcript}"
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {transcript && !isListening && (
                    <button onClick={handleNextQuestion} className="mt-12 w-full bg-emerald-500 py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20">
                      {loading ? <RefreshCcw className="animate-spin" /> : <>Evaluate & Move Forward <ChevronRight size={20}/></>}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: FINAL REPORT CARD */}
          {appStep === 'report' && (
            <motion.div key="report" variants={pageVariants} initial="initial" animate="in" exit="out" className="space-y-10">
              <div className="text-center">
                <div className="inline-block bg-indigo-100 text-indigo-600 p-3 rounded-2xl mb-4">
                    <Award size={32}/>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Interview Performance Audit</h2>
                <p className="text-slate-500 mt-2">Comprehensive feedback generated by Gemini AI</p>
              </div>

              <div className="grid gap-8">
                {interviewFeedback.map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                        <MessageSquare size={16} /> Question {idx + 1}
                      </div>
                      <div className="text-3xl font-black text-indigo-600">
                        {item.score}<span className="text-slate-300 text-sm font-normal">/10</span>
                      </div>
                    </div>
                    <p className="text-slate-800 font-bold mb-6 italic text-xl leading-tight">"{questions[idx]}"</p>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 text-slate-600 leading-relaxed font-medium">
                      <strong>AI Review:</strong> {item.feedback}
                    </div>
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl w-fit text-xs font-black border border-rose-100 uppercase tracking-tighter">
                      ⚠️ {item.filler_count} Filler Words (Hesitations) Detected
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 group">
                <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" /> Start New Assessment
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="mt-20 py-12 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">CareerPulse AI • Data Science & Generative AI Ecosystem</p>
      </footer>
    </div>
  );
}

// --- HELPER COMPONENTS ---
const SectionHeader = ({ icon, title }) => (
  <div className="md:col-span-2 flex items-center gap-2 text-indigo-600 font-black border-b border-slate-100 pb-3 mb-2 mt-6">
    {icon} <span className="uppercase tracking-[0.2em] text-[10px]">{title}</span>
  </div>
);

const FormInput = ({ label, name, type = "text", placeholder, onChange, step }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} name={name} step={step} onChange={onChange} placeholder={placeholder}
      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 shadow-sm" 
      required 
    />
  </div>
);

export default App;