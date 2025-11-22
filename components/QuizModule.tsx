import React, { useState } from 'react';
import { generateQuiz } from '../services/geminiService';
import { Question, Subject, ExamType, QuizResult } from '../types';
import { Brain, Check, X, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';

const QuizModule: React.FC = () => {
  const [status, setStatus] = useState<'SETUP' | 'LOADING' | 'ACTIVE' | 'RESULTS'>('SETUP');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Setup State
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
  const [selectedExam, setSelectedExam] = useState<ExamType>(ExamType.ENEM);

  const startQuiz = async () => {
    setStatus('LOADING');
    try {
      const qs = await generateQuiz(selectedSubject, selectedExam, 5);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(-1));
      setCurrentQIndex(0);
      setStatus('ACTIVE');
    } catch (e) {
      alert("Erro ao gerar simulado. Tente novamente.");
      setStatus('SETUP');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const finishQuiz = () => {
    let score = 0;
    const details = questions.map((q, idx) => {
      const isCorrect = userAnswers[idx] === q.correctIndex;
      if (isCorrect) score++;
      return { questionId: q.id, correct: isCorrect, userAnswer: userAnswers[idx] };
    });
    setResult({ score, total: questions.length, details });
    setStatus('RESULTS');
  };

  // --- SETUP VIEW ---
  if (status === 'SETUP') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Brain className="text-emerald-600" />
          Simulado Inteligente
        </h2>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-2">Matéria</label>
            <select 
              className="w-full p-3 border rounded-lg bg-gray-50"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            >
              {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="mb-8">
            <label className="block font-medium text-gray-700 mb-2">Estilo da Prova</label>
            <select 
              className="w-full p-3 border rounded-lg bg-gray-50"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value as ExamType)}
            >
              {Object.values(ExamType).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button 
            onClick={startQuiz}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            Iniciar Desafio
          </button>
        </div>
      </div>
    );
  }

  // --- LOADING VIEW ---
  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 animate-pulse">A IA está elaborando suas questões...</p>
      </div>
    );
  }

  // --- ACTIVE QUIZ VIEW ---
  if (status === 'ACTIVE') {
    const q = questions[currentQIndex];
    const progress = ((currentQIndex + 1) / questions.length) * 100;

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
           <div className="w-full bg-gray-200 rounded-full h-2.5">
             <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
           </div>
           <div className="flex justify-between mt-2 text-sm text-gray-500">
             <span>Questão {currentQIndex + 1} de {questions.length}</span>
             <span>{selectedSubject}</span>
           </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <p className="text-lg font-medium text-gray-800 mb-6 leading-relaxed">
            {q.statement}
          </p>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  userAnswers[currentQIndex] === idx 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium' 
                    : 'border-gray-100 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="inline-block w-6 h-6 rounded-full bg-white border border-gray-300 text-center text-xs leading-6 mr-3 shadow-sm">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
            disabled={currentQIndex === 0}
            className="px-6 py-2 text-gray-600 font-medium disabled:opacity-30"
          >
            Anterior
          </button>
          
          {currentQIndex < questions.length - 1 ? (
             <button 
               onClick={() => setCurrentQIndex(currentQIndex + 1)}
               className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black flex items-center"
             >
               Próxima <ChevronRight size={16} className="ml-1"/>
             </button>
          ) : (
            <button 
              onClick={finishQuiz}
              disabled={userAnswers.includes(-1)}
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finalizar Simulado
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- RESULTS VIEW ---
  return (
    <div className="p-6 max-w-4xl mx-auto">
       <div className="text-center mb-10">
         <h2 className="text-3xl font-bold text-gray-900 mb-2">Resultado</h2>
         <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white border-8 border-emerald-100 text-4xl font-bold text-emerald-600 shadow-sm">
           {result?.score}/{result?.total}
         </div>
         <p className="mt-4 text-gray-600">
           {result?.score === result?.total ? "Excelente! Você gabaritou!" : "Bom trabalho! Veja as explicações abaixo."}
         </p>
         <button onClick={() => setStatus('SETUP')} className="mt-4 text-emerald-600 font-semibold hover:underline flex items-center justify-center gap-1 w-full">
           <RefreshCw size={16}/> Novo Simulado
         </button>
       </div>

       <div className="space-y-6">
         {questions.map((q, idx) => {
           const isCorrect = result?.details[idx].correct;
           const userAnswerIdx = result?.details[idx].userAnswer;

           return (
             <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`mt-1 p-1 rounded-full ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isCorrect ? <Check size={16} /> : <X size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{q.statement}</p>
                  </div>
                </div>

                <div className="space-y-2 ml-9 mb-4 text-sm">
                   {q.options.map((opt, optIdx) => {
                     let style = "text-gray-600 p-2 rounded";
                     if (optIdx === q.correctIndex) style = "bg-green-100 text-green-800 font-medium border border-green-200";
                     else if (optIdx === userAnswerIdx && !isCorrect) style = "bg-red-100 text-red-800 line-through opacity-75";
                     
                     return <div key={optIdx} className={style}>{String.fromCharCode(65+optIdx)}) {opt}</div>
                   })}
                </div>

                <div className="ml-9 bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-700 flex gap-3">
                  <AlertCircle size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-600 block mb-1">Explicação:</span>
                    {q.explanation}
                  </div>
                </div>
             </div>
           );
         })}
       </div>
    </div>
  );
};

export default QuizModule;