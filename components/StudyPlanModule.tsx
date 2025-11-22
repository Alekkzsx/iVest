import React, { useState } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { StudyPlan, ExamType, Subject } from '../types';
import { Calendar, Clock, CheckCircle, Loader2, Book } from 'lucide-react';

const StudyPlanModule: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  
  // Form State
  const [exam, setExam] = useState<ExamType>(ExamType.ENEM);
  const [hours, setHours] = useState<number>(4);
  const [selectedWeaknesses, setSelectedWeaknesses] = useState<string[]>([]);

  const toggleWeakness = (sub: string) => {
    if (selectedWeaknesses.includes(sub)) {
      setSelectedWeaknesses(selectedWeaknesses.filter(s => s !== sub));
    } else {
      setSelectedWeaknesses([...selectedWeaknesses, sub]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateStudyPlan(exam, hours, selectedWeaknesses);
      setPlan(result);
    } catch (error) {
      alert("Erro ao gerar plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calendar className="text-indigo-600" />
        Gerador de Cronograma
      </h2>

      {!plan ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qual seu foco?</label>
              <select 
                value={exam} 
                onChange={(e) => setExam(e.target.value as ExamType)}
                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Object.values(ExamType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">Horas disponíveis por dia?</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  value={hours} 
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-bold text-indigo-600 min-w-[3rem]">{hours}h</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenho mais dificuldade em:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Subject).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => toggleWeakness(sub)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                      selectedWeaknesses.includes(sub)
                        ? 'bg-red-100 border-red-300 text-red-700 font-semibold'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
              Gerar Cronograma
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-semibold text-gray-700">Plano Semanal: {plan.targetExam}</h3>
             <button onClick={() => setPlan(null)} className="text-sm text-gray-500 hover:text-indigo-600 underline">
               Gerar Novo
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {plan.weeklySchedule.map((day, idx) => (
               <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                 <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                   <span className="font-bold text-lg text-gray-800">{day.day}</span>
                   <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{day.focus}</span>
                 </div>
                 <div className="flex-1">
                   <ul className="space-y-2 mb-4">
                     {day.tasks.map((task, tIdx) => (
                       <li key={tIdx} className="flex items-start gap-2 text-sm text-gray-600">
                         <Book size={14} className="mt-1 text-gray-400 flex-shrink-0" />
                         <span>{task}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
                 <div className="mt-auto bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 italic flex gap-2">
                   <Clock size={14} className="flex-shrink-0 mt-0.5" />
                   {day.tips}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanModule;