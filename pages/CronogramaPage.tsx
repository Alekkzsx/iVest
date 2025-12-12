
import React, { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, CheckCircle2, RotateCcw, Brain, Loader2, Target, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { StudyPlan, StudyDay } from "../types/index";
import { generateStudyPlan } from "../services/aiService";

const STORAGE_KEY = "etec_study_plan";

const SUBJECTS = ["Matemática", "Português", "Ciências", "História", "Geografia"];

const CronogramaPage = () => {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Setup State
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [selectedWeakness, setSelectedWeakness] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlan(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleCreatePlan = async () => {
    if (!selectedWeakness) return;
    
    setLoading(true);
    try {
      const days = await generateStudyPlan(hoursPerDay, selectedWeakness);
      
      const newPlan: StudyPlan = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        dailyHours: hoursPerDay,
        weakness: selectedWeakness,
        days: days
      };
      
      setPlan(newPlan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlan));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Tem certeza? Isso apagará seu progresso atual.")) {
      localStorage.removeItem(STORAGE_KEY);
      setPlan(null);
      setSelectedWeakness("");
    }
  };

  const toggleTask = (dayIndex: number, taskId: string) => {
    if (!plan) return;

    const newDays = [...plan.days];
    const day = newDays[dayIndex];
    const taskIndex = day.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0) {
      day.tasks[taskIndex].completed = !day.tasks[taskIndex].completed;
      
      const updatedPlan = { ...plan, days: newDays };
      setPlan(updatedPlan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
    }
  };

  const calculateProgress = () => {
    if (!plan) return 0;
    let total = 0;
    let completed = 0;
    plan.days.forEach(day => {
      day.tasks.forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center animate-in fade-in">
        <Loader2 className="animate-spin text-slate-800 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">Criando seu Cronograma Personalizado...</h2>
        <p className="text-slate-500 mt-2">A IA está organizando suas matérias com foco em {selectedWeakness}.</p>
      </div>
    );
  }

  // View: Setup (No Plan)
  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-800">
            <Calendar size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vamos organizar seus estudos?</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Responda a duas perguntas rápidas e criaremos um plano semanal perfeito para sua rotina.
          </p>

          <div className="space-y-8 text-left max-w-lg mx-auto">
            
            {/* Input: Hours */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Clock size={18} />
                Quantas horas você pode estudar por dia?
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  value={hoursPerDay} 
                  onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
                <span className="font-bold text-xl text-slate-900 min-w-[3rem] text-center bg-slate-100 py-1 rounded-lg">
                  {hoursPerDay}h
                </span>
              </div>
            </div>

            {/* Input: Weakness */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Target size={18} />
                Qual matéria você tem mais dificuldade?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUBJECTS.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedWeakness(sub)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border
                      ${selectedWeakness === sub 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}
                    `}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreatePlan}
              disabled={!selectedWeakness}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Brain size={20} />
              Gerar Cronograma com IA
            </button>

          </div>
        </div>
      </div>
    );
  }

  // View: The Plan
  const progress = calculateProgress();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 pb-12">
      
      {/* Header Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Seu Plano Semanal</h2>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <Clock size={14} /> Meta: {plan.dailyHours}h/dia • Foco: {plan.weakness}
          </p>
        </div>

        <div className="flex items-center gap-6 w-full sm:w-auto">
          <div className="flex-1 sm:w-48">
             <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
               <span>Progresso</span>
               <span>{progress}%</span>
             </div>
             <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-slate-900 transition-all duration-500" 
                 style={{ width: `${progress}%` }}
               ></div>
             </div>
          </div>
          
          <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Recriar plano"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Days List */}
      <div className="grid gap-4">
        {plan.days.map((day, dIdx) => (
          <div key={dIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{day.dayName}</h3>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Foco: {day.focus}
                </span>
              </div>
              <div className="text-slate-300">
                {day.tasks.every(t => t.completed) ? (
                   <CheckCircle2 size={24} className="text-slate-800" />
                ) : (
                   <div className="text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200">
                     {day.tasks.filter(t => t.completed).length}/{day.tasks.length}
                   </div>
                )}
              </div>
            </div>

            <div className="p-2">
              {day.tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(dIdx, task.id)}
                  className={`flex items-start gap-4 p-3 rounded-lg cursor-pointer transition-colors group
                    ${task.completed ? 'bg-slate-50' : 'hover:bg-slate-50'}
                  `}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${task.completed ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 group-hover:border-slate-500'}
                  `}>
                    {task.completed && <CheckCircle2 size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.topic}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {task.subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CronogramaPage;
