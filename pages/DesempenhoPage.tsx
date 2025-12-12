
import React, { useEffect, useState } from "react";
import { PastExam } from "../types/index";
import { Trophy, Clock, Calendar, ChevronRight, BarChart2, History, AlertCircle } from "lucide-react";

interface DesempenhoPageProps {
  onReviewExam: (exam: PastExam) => void;
}

const HISTORY_KEY = "etec_exam_history";

const DesempenhoPage = ({ onReviewExam }: DesempenhoPageProps) => {
  const [history, setHistory] = useState<PastExam[]>([]);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsedHistory: PastExam[] = JSON.parse(saved);
        setHistory(parsedHistory);

        if (parsedHistory.length > 0) {
          const totalPct = parsedHistory.reduce((acc, exam) => {
            return acc + ((exam.score / exam.totalQuestions) * 100);
          }, 0);
          setAverageScore(Math.round(totalPct / parsedHistory.length));
        }
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      }
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m}m`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Header com Resumo */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="text-slate-800" />
            Seu Desempenho
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe sua evolução rumo à ETEC.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 text-center">
            <span className="block text-2xl font-bold text-slate-800">{history.length}</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Simulados</span>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 text-center">
            <span className="block text-2xl font-bold text-slate-800">
              {averageScore}%
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Média Geral</span>
          </div>
        </div>
      </div>

      {/* Lista de Histórico */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-1">
          <History size={20} /> Histórico de Provas
        </h2>

        {history.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <History size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-1">Nenhum simulado realizado ainda</h3>
            <p className="text-slate-500 text-sm">Faça seu primeiro simulado para ver suas estatísticas aqui.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {history.map((exam) => {
              const percentage = Math.round((exam.score / exam.totalQuestions) * 100);
              const isGood = percentage >= 70;
              
              // Use grayscale styling for success/failure but maintain visual hierarchy
              const gradeStyle = isGood 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-800 border-slate-300';

              return (
                <div 
                  key={exam.id}
                  onClick={() => onReviewExam(exam)}
                  className="group bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:border-slate-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border-2 ${gradeStyle}`}>
                      {percentage}%
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-slate-800">{exam.subject}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(exam.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formatTime(exam.durationSeconds)}
                        </span>
                         <span className="flex items-center gap-1">
                          <Trophy size={12} /> {exam.score}/{exam.totalQuestions}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 group-hover:text-slate-900 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesempenhoPage;
