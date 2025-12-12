

import React, { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Brain, RotateCcw, Award, GraduationCap, Loader2, Image as ImageIcon, Zap, Volume2, StopCircle, Sparkles, Settings, Save, Trash2, History, Filter, Check, X as XIcon, ListOrdered, Hourglass, BookOpen, Layers, BarChart, PenTool, FileText } from "lucide-react";
import { MOCK_EXAM_QUESTIONS, Question } from "../data/mockData";
import { explainQuestion, generateExamImage, generateMockExam, getWordDefinition } from "../services/aiService";
import { PastExam } from "../types/index";

interface SimuladosPageProps {
  onBack: () => void;
  initialReviewData?: PastExam | null;
  onFinishExam?: (xpEarned: number) => void;
}

const SUBJECT_OPTIONS = [
  "Mix Geral",
  "Matemática",
  "Português",
  "Ciências Naturais",
  "Ciências Humanas",
  "Tema Personalizado"
];

const DURATION_OPTIONS = [
  { label: "Rápido (30m)", value: 30 },
  { label: "Padrão (1h)", value: 60 },
  { label: "Longo (2h)", value: 120 },
  { label: "Etec Real (4h)", value: 240 },
];

const QUESTION_COUNT_OPTIONS = [5, 10, 20, 40, 50];

const GRADE_OPTIONS = ["Todos", "6º Ano", "7º Ano", "8º Ano", "9º Ano"];

const DIFFICULTY_OPTIONS = ["Misto", "Fácil", "Médio", "Difícil"];

const STORAGE_KEY = "etec_simulado_progress";
const HISTORY_KEY = "etec_exam_history";

interface SavedExamState {
  questions: Question[];
  selectedAnswers: number[];
  timer: number;
  currentQuestionIndex: number;
  selectedSubject: string;
  customTopic?: string;
  selectedDuration: number;
  selectedQuestionCount: number;
  selectedGrade: string;
  selectedDifficulty: string;
  questionImages: Record<number, string>;
  timestamp: number;
}

interface TextSelectionState {
  text: string;
  x: number;
  y: number;
}

interface DefinitionState {
  word: string;
  definition: string;
  loading: boolean;
}

const SimuladosPage = ({ onBack, initialReviewData, onFinishExam }: SimuladosPageProps) => {
  // Estados do Fluxo
  const [isPreparing, setIsPreparing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Configuração do Exame
  const [selectedSubject, setSelectedSubject] = useState("Mix Geral");
  const [customTopic, setCustomTopic] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60); // Minutos
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10); // Quantidade
  const [selectedGrade, setSelectedGrade] = useState("Todos");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Misto");
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingStep, setLoadingStep] = useState<string>("");

  // Estados do Exame
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timer, setTimer] = useState(0); // em segundos
  
  // Cache de Imagens (Map: questionId -> base64Url)
  const [questionImages, setQuestionImages] = useState<Record<number, string>>({});
  
  // Estado da Explicação IA
  const [explanation, setExplanation] = useState<{id: number, text: string} | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Estado do Text-to-Speech
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Estado para Sessão Salva
  const [savedSession, setSavedSession] = useState<SavedExamState | null>(null);

  // Estado do Filtro de Revisão
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');

  // Estado para Seleção de Texto e Definição
  const [textSelection, setTextSelection] = useState<TextSelectionState | null>(null);
  const [definition, setDefinition] = useState<DefinitionState | null>(null);
  const questionTextRef = useRef<HTMLDivElement>(null);
  
  // Estado XP ganho na sessão
  const [xpGained, setXpGained] = useState(0);

  // Inicialização (Verifica se é revisão de histórico ou novo)
  useEffect(() => {
    if (initialReviewData) {
      // Modo Revisão de Histórico
      setQuestions(initialReviewData.questions);
      setSelectedAnswers(initialReviewData.userAnswers);
      setTimer(initialReviewData.durationSeconds);
      setSelectedSubject(initialReviewData.subject);
      setHasStarted(true);
      setIsFinished(true);
      return;
    }

    // Modo Normal: Verifica localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: SavedExamState = JSON.parse(savedData);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          setSavedSession(parsed);
        }
      } catch (e) {
        console.error("Erro ao carregar simulado salvo:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [initialReviewData]);

  // Timer Effect e Salvamento Automático do Timer
  useEffect(() => {
    let interval: any;
    if (hasStarted && !isFinished && !initialReviewData) { // Não roda timer se for revisão
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev + 1;
          
          // Verifica se o tempo acabou
          if (newTime >= selectedDuration * 60) {
            clearInterval(interval);
            handleFinish();
            return newTime;
          }

          // Salva a cada 5 segundos
          if (newTime % 5 === 0) {
            saveProgressToStorage(
              questions, 
              selectedAnswers, 
              newTime, 
              currentQuestionIndex, 
              selectedSubject,
              customTopic,
              selectedDuration,
              selectedQuestionCount,
              selectedGrade,
              selectedDifficulty,
              questionImages
            );
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, isFinished, questions, selectedAnswers, currentQuestionIndex, selectedSubject, customTopic, selectedDuration, selectedQuestionCount, selectedGrade, selectedDifficulty, questionImages, initialReviewData]);

  // Salva sempre que mudar resposta ou questão (apenas se não for revisão)
  useEffect(() => {
    if (hasStarted && !isFinished && questions.length > 0 && !initialReviewData) {
      saveProgressToStorage(
        questions, 
        selectedAnswers, 
        timer, 
        currentQuestionIndex, 
        selectedSubject,
        customTopic,
        selectedDuration,
        selectedQuestionCount,
        selectedGrade,
        selectedDifficulty,
        questionImages
      );
    }
  }, [selectedAnswers, currentQuestionIndex, isFinished]);

  // Cleanup Text-to-Speech e Definições ao mudar questão ou desmontar
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTextSelection(null);
    setDefinition(null);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentQuestionIndex, isFinished]);

  const saveProgressToStorage = (
    qs: Question[], 
    ans: number[], 
    tm: number, 
    idx: number, 
    subj: string,
    custTopic: string,
    dur: number, 
    count: number,
    grade: string,
    diff: string,
    imgs: Record<number, string>
  ) => {
    const state: SavedExamState = {
      questions: qs,
      selectedAnswers: ans,
      timer: tm,
      currentQuestionIndex: idx,
      selectedSubject: subj,
      customTopic: custTopic,
      selectedDuration: dur,
      selectedQuestionCount: count,
      selectedGrade: grade,
      selectedDifficulty: diff,
      questionImages: imgs,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Não foi possível salvar o progresso (provavelmente limite de cota devido às imagens).", e);
    }
  };

  const saveToHistory = () => {
    const currentScore = selectedAnswers.reduce((acc, ans, idx) => {
      return ans === questions[idx].correctIndex ? acc + 1 : acc;
    }, 0);
    
    // Calcula XP
    // Base: 50 XP por acerto + 100 XP por concluir
    const xp = (currentScore * 50) + 100;
    setXpGained(xp);
    if (onFinishExam) {
      onFinishExam(xp);
    }
    
    // Se for tema personalizado, salva o tema no subject do histórico para fácil identificação
    const subjectName = selectedSubject === "Tema Personalizado" && customTopic 
      ? `Tema: ${customTopic}` 
      : selectedSubject;

    const historyItem: PastExam = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      subject: subjectName,
      score: currentScore,
      totalQuestions: questions.length,
      durationSeconds: timer,
      questions: questions,
      userAnswers: selectedAnswers
    };

    try {
      const existingHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const newHistory = [historyItem, ...existingHistory].slice(0, 50); // Mantém os últimos 50
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error("Erro ao salvar histórico", e);
    }
  };

  const clearSavedSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedSession(null);
  };

  const handleResumeExam = () => {
    if (!savedSession) return;
    
    setQuestions(savedSession.questions);
    setSelectedAnswers(savedSession.selectedAnswers);
    setTimer(savedSession.timer);
    setCurrentQuestionIndex(savedSession.currentQuestionIndex);
    setSelectedSubject(savedSession.selectedSubject);
    setCustomTopic(savedSession.customTopic || "");
    setSelectedDuration(savedSession.selectedDuration || 60); 
    setSelectedQuestionCount(savedSession.selectedQuestionCount || savedSession.questions.length);
    setSelectedGrade(savedSession.selectedGrade || "Todos");
    setSelectedDifficulty(savedSession.selectedDifficulty || "Misto");
    setQuestionImages(savedSession.questionImages);
    
    setHasStarted(true);
    setSavedSession(null); 
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartPreparation = async () => {
    clearSavedSession();

    setIsPreparing(true);
    setLoadingStep(`Criando ${selectedQuestionCount} questões inéditas...`);
    
    let newQuestions: Question[] = [];
    try {
      newQuestions = await generateMockExam(
        selectedSubject, 
        selectedQuestionCount,
        selectedGrade,
        selectedDifficulty,
        customTopic // Passa o tema personalizado
      );
    } catch (e) {
      console.error("Fallback para mock", e);
      newQuestions = MOCK_EXAM_QUESTIONS.slice(0, selectedQuestionCount);
    }
    
    setQuestions(newQuestions);
    setSelectedAnswers(new Array(newQuestions.length).fill(-1));

    setLoadingStep("Desenhando diagramas e ilustrações...");
    
    const questionsWithImages = newQuestions.filter(q => !!q.imagePrompt);
    const newImages: Record<number, string> = {};

    const imagePromises = questionsWithImages.map(async (q) => {
      if (q.imagePrompt) {
        try {
          const imgUrl = await generateExamImage(q.imagePrompt);
          if (imgUrl) {
            newImages[q.id] = imgUrl;
          }
        } catch (error) {
          console.error(`Falha ao gerar imagem para questão ${q.id}`, error);
        }
      }
    });

    await Promise.all(imagePromises);

    setQuestionImages(newImages);
    setIsPreparing(false);
    setHasStarted(true);
    setTimer(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    // Se já finalizou (revisão), não permite mudar
    if (isFinished) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleFinish = () => {
    // Importante: Marcar como finalizado ANTES de salvar histórico
    // para garantir que o estado esteja correto
    setIsFinished(true);
    localStorage.removeItem(STORAGE_KEY); 
    if (!initialReviewData) {
      saveToHistory();
    }
  };

  const handleExplain = async (question: Question, userIndex: number) => {
    setLoadingExplanation(true);
    setExplanation(null);
    
    const correctText = question.alternatives[question.correctIndex];
    const userText = userIndex === -1 ? "Não respondeu" : question.alternatives[userIndex];
    
    const text = await explainQuestion(question.text, correctText, userText);
    
    setExplanation({ id: question.id, text });
    setLoadingExplanation(false);
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const context = questions[currentQuestionIndex].contextText || "";
      const text = questions[currentQuestionIndex].text;
      const utterance = new SpeechSynthesisUtterance(`${context ? "Texto de apoio: " + context + ". Pergunta: " : ""}` + text);
      utterance.lang = 'pt-BR';
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // --- Lógica de Seleção de Texto para Definição ---
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      // Se clicou fora ou seleção vazia, fecha, a menos que esteja lendo a definição
      if (!definition) {
          setTextSelection(null);
      }
      return;
    }

    const selectedText = selection.toString().trim();
    // Limita tamanho para evitar definições de frases inteiras (max 5 palavras)
    if (selectedText.split(' ').length > 5) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Ajuste para coordenadas relativas ao viewport
    setTextSelection({
      text: selectedText,
      x: rect.left + (rect.width / 2),
      y: rect.top
    });
    
    // Reseta definição anterior se houver nova seleção
    if (definition?.word !== selectedText) {
        setDefinition(null);
    }
  };

  const handleGetDefinition = async () => {
    if (!textSelection) return;
    
    const word = textSelection.text;
    setDefinition({
      word,
      definition: "",
      loading: true
    });
    
    const context = questions[currentQuestionIndex].text;
    const def = await getWordDefinition(word, context);
    
    setDefinition({
      word,
      definition: def,
      loading: false
    });
  };

  const score = selectedAnswers.reduce((acc, ans, idx) => {
    return ans === questions[idx].correctIndex ? acc + 1 : acc;
  }, 0);

  const resetExam = () => {
    if (initialReviewData) {
      onBack();
      return;
    }
    
    setHasStarted(false); 
    setIsFinished(false); 
    setIsPreparing(false);
    
    setQuestions([]);
    setSelectedAnswers([]);
    setTimer(0);
    setCurrentQuestionIndex(0);
    setQuestionImages({});
    
    setExplanation(null);
    setLoadingExplanation(false);
    setLoadingStep("");
    setIsSpeaking(false);
    setReviewFilter('all');
    setTextSelection(null);
    setDefinition(null);
    setSelectedGrade("Todos");
    setSelectedDifficulty("Misto");
    setCustomTopic("");
    setSelectedSubject("Mix Geral");
    setXpGained(0);

    clearSavedSession();
    window.speechSynthesis.cancel();
  };

  // --- TELA DE PREPARAÇÃO (LOADING) ---
  if (isPreparing) {
    return (
      <div className="max-w-4xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
          <Loader2 className="text-slate-800 animate-spin" size={48} />
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full animate-ping opacity-20"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Preparando seu Simulado</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Nossa IA está trabalhando para criar uma experiência única para você.
        </p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs transition-all">
          <div className={`flex items-center gap-3 text-sm p-3 rounded-lg border shadow-sm transition-all ${loadingStep.includes("questões") ? "bg-white border-slate-400 text-slate-800 font-medium" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
            {loadingStep.includes("questões") ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            <span>Gerando {selectedQuestionCount} questões inéditas</span>
          </div>
          <div className={`flex items-center gap-3 text-sm p-3 rounded-lg border shadow-sm transition-all ${loadingStep.includes("diagramas") ? "bg-white border-slate-400 text-slate-800 font-medium" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
            {loadingStep.includes("diagramas") ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            <span>Criando ilustrações com IA</span>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA INICIAL (CONFIGURAÇÃO) ---
  if (!hasStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-900 transition-colors" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Voltar ao Dashboard</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Simulado Inteligente</h1>
          
          {savedSession ? (
             <div className="max-w-md mx-auto bg-slate-50 border border-slate-300 rounded-xl p-5 text-left animate-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-200 p-2 rounded-full text-slate-700 mt-1">
                    <History size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">Simulado em Andamento</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Você tem um simulado de <strong>{savedSession.selectedSubject === "Tema Personalizado" ? savedSession.customTopic : savedSession.selectedSubject}</strong> não finalizado.
                      <br/>
                      <span className="text-xs opacity-80">
                        Progresso: {savedSession.selectedAnswers.filter(a => a !== -1).length}/{savedSession.questions.length} respondidas • Tempo: {formatTime(savedSession.timer)}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleResumeExam}
                        className="flex-1 bg-slate-900 text-white text-sm font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={14} /> Continuar
                      </button>
                      <button 
                        onClick={clearSavedSession}
                        className="px-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Descartar simulado salvo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          ) : (
            <p className="text-slate-600 max-w-lg mx-auto">
              A Inteligência Artificial criará uma prova <strong>inédita e exclusiva</strong> para você agora. 
              Configure o foco, tempo e tamanho do seu desafio.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            
            {/* Seletor de Matéria */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 md:row-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Settings size={16} />
                Foco do Estudo
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SUBJECT_OPTIONS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                        setSelectedSubject(subject);
                        if (subject !== "Tema Personalizado") setCustomTopic("");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex justify-between items-center
                      ${selectedSubject === subject 
                        ? 'bg-slate-800 text-white shadow-md shadow-slate-200 font-medium' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400 hover:bg-slate-50'}
                    `}
                  >
                    {subject}
                    {selectedSubject === subject && <CheckCircle size={16} />}
                  </button>
                ))}
              </div>

              {/* Input para Tema Personalizado */}
              {selectedSubject === "Tema Personalizado" && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-1">
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block flex items-center gap-1">
                        <PenTool size={12} /> Qual assunto você quer treinar?
                    </label>
                    <input 
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="Ex: Segunda Guerra Mundial, Frações, Harry Potter..."
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 placeholder:text-slate-400 shadow-sm"
                        autoFocus
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                        A IA irá gerar questões estilo ETEC contextualizadas com este tema.
                    </p>
                </div>
              )}
            </div>

            {/* Configurações Adicionais */}
            <div className="space-y-6">
               
               {/* Série/Ano (Opcional) */}
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Layers size={16} />
                    Série/Ano Escolar (Opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_OPTIONS.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setSelectedGrade(grade)}
                        className={`flex-1 min-w-[4rem] px-2 py-2 rounded-lg text-xs transition-all text-center border
                          ${selectedGrade === grade 
                            ? 'bg-slate-800 text-white border-slate-800 font-medium' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}
                        `}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Dificuldade (Opcional) */}
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <BarChart size={16} />
                    Nível de Desafio (Opcional)
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs transition-all text-center border
                          ${selectedDifficulty === diff 
                            ? 'bg-slate-800 text-white border-slate-800 font-medium' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}
                        `}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Quantidade de Questões */}
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <ListOrdered size={16} />
                    Número de Questões
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <button
                        key={count}
                        onClick={() => setSelectedQuestionCount(count)}
                        className={`flex-1 min-w-[3rem] px-3 py-2 rounded-lg text-sm transition-all text-center
                          ${selectedQuestionCount === count 
                            ? 'bg-slate-800 text-white font-medium shadow-sm' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}
                        `}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Duração */}
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Hourglass size={16} />
                    Tempo Limite
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedDuration(opt.value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all text-center
                          ${selectedDuration === opt.value 
                            ? 'bg-slate-800 text-white font-medium shadow-sm' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}
                        `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
               </div>

            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 flex items-center justify-center gap-2 max-w-lg mx-auto">
            <Zap size={16} />
            <span>Dica: Treine com 50 questões para simular o cansaço real da prova.</span>
          </div>

          <button 
            onClick={handleStartPreparation}
            disabled={selectedSubject === "Tema Personalizado" && customTopic.trim().length < 2}
            className="bg-slate-900 text-white text-lg font-bold px-12 py-4 rounded-xl hover:bg-slate-800 transition-transform hover:scale-105 shadow-xl w-full max-w-md mx-auto block disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {savedSession ? "Começar Novo Simulado" : "Gerar Prova com IA"}
          </button>
        </div>
      </div>
    );
  }

  // --- TELA DE RESULTADOS (MODO REVISÃO) ---
  if (isFinished) {
    const questionsToReview = reviewFilter === 'all' 
      ? questions 
      : questions.filter((_, idx) => selectedAnswers[idx] !== questions[idx].correctIndex);

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
             {initialReviewData && (
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                  <ArrowLeft size={20} />
                </button>
             )}
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Award className="text-slate-500" /> {initialReviewData ? "Revisão de Histórico" : "Resultado Final"}
             </h2>
          </div>
          
          <button onClick={resetExam} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
            <RotateCcw size={16} /> {initialReviewData ? "Fechar" : "Novo Simulado"}
          </button>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg col-span-1 md:col-span-1 relative overflow-hidden">
             {/* XP Badge Animation if just finished */}
             {xpGained > 0 && !initialReviewData && (
               <div className="absolute top-2 right-2 bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                 +{xpGained} XP
               </div>
             )}
             
             <div className="relative w-32 h-32 flex items-center justify-center mb-4">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="64" cy="64" r="56" stroke="#334155" strokeWidth="8" fill="transparent" />
                 <circle 
                   cx="64" cy="64" r="56" 
                   stroke={score >= (questions.length * 0.7) ? "#f8fafc" : "#94a3b8"} 
                   strokeWidth="8" 
                   fill="transparent" 
                   strokeDasharray={351} 
                   strokeDashoffset={351 - (351 * (score / questions.length))} 
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-4xl font-bold">{score}</span>
                 <span className="text-xs text-slate-400">de {questions.length}</span>
               </div>
            </div>
            <p className="font-bold text-lg">
              {score === questions.length ? "Excelente! 🏆" : score >= (questions.length / 2) ? "Bom Trabalho! 👏" : "Vamos Revisar 💪"}
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
             {/* Stats Cards */}
             <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                   <div className="flex items-center gap-3 mb-2 text-slate-500">
                     <Clock size={20} />
                     <span className="text-sm font-medium">Tempo Total</span>
                   </div>
                   <p className="text-3xl font-bold text-slate-800">{formatTime(timer)}</p>
                   {!initialReviewData && <p className="text-xs text-slate-400 mt-1">Limite era {selectedDuration} min</p>}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                   <div className="flex items-center gap-3 mb-2 text-slate-500">
                     <Brain size={20} />
                     <span className="text-sm font-medium">Precisão</span>
                   </div>
                   <p className="text-3xl font-bold text-slate-800">{questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%</p>
                   <p className="text-xs text-slate-400 mt-1">{selectedSubject === "Tema Personalizado" ? customTopic : selectedSubject}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Review Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-slate-400" size={20} />
            Gabarito Detalhado
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button 
              onClick={() => setReviewFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${reviewFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{questions.length}</span>
            </button>
            <button 
              onClick={() => setReviewFilter('wrong')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${reviewFilter === 'wrong' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Filter size={14} /> Erros e Pulos
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${reviewFilter === 'wrong' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {questions.length - score}
              </span>
            </button>
          </div>
        </div>

        {/* Questões Review List */}
        <div className="space-y-6">
          {questionsToReview.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="inline-block p-4 bg-slate-200 text-slate-600 rounded-full mb-3">
                <CheckCircle size={32} />
              </div>
              <p className="text-slate-600 font-medium">
                {reviewFilter === 'wrong' 
                  ? "Parabéns! Você não cometeu erros." 
                  : "Nenhuma questão encontrada para exibir."}
              </p>
              {reviewFilter === 'wrong' && (
                <button onClick={() => setReviewFilter('all')} className="text-sm text-slate-900 hover:underline mt-2">
                  Ver todas as questões
                </button>
              )}
            </div>
          ) : (
            questionsToReview.map((q) => {
              // Encontrar o índice original da questão para buscar a resposta correta e a imagem
              const originalIndex = questions.findIndex(orig => orig.id === q.id);
              const isCorrect = selectedAnswers[originalIndex] === q.correctIndex;
              const hasImage = !!questionImages[q.id];
              const userAnswer = selectedAnswers[originalIndex];
              const isUnanswered = userAnswer === -1;

              return (
                <div 
                  key={q.id} 
                  className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md
                  ${!isCorrect ? 'ring-1 ring-slate-100' : ''}`}
                >
                  {/* Review Header */}
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${isCorrect ? 'bg-slate-50 border-slate-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                        {originalIndex + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{q.subject}</span>
                        {q.competency && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Layers size={10} /> {q.competency}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCorrect ? (
                       <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                         <Check size={14} /> ACERTOU
                       </span>
                    ) : (
                       <span className="flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-300 shadow-sm">
                         {isUnanswered ? (
                           <>
                              <AlertCircle size={14} /> NÃO RESPONDEU
                           </>
                         ) : (
                           <>
                              <XIcon size={14} /> ERROU
                           </>
                         )}
                       </span>
                    )}
                  </div>

                  <div className="p-6">
                     <div className="flex gap-6 mb-6">
                       <div className="flex-1">
                         {/* Display Context Text in Review */}
                         {q.contextText && (
                            <div className="mb-4 p-4 bg-slate-50 border-l-4 border-slate-300 italic text-slate-600 text-sm font-serif">
                               <p className="font-bold text-[10px] uppercase text-slate-400 mb-1 not-italic font-sans">Texto de Apoio</p>
                               {q.contextText}
                            </div>
                         )}

                         <h4 className="font-medium text-slate-800 text-lg mb-4 leading-relaxed">{q.text}</h4>
                         {hasImage && (
                            <div className="mb-4 max-w-sm rounded-lg overflow-hidden border border-slate-100">
                              <img src={questionImages[q.id]} alt="Contexto" className="w-full h-auto object-cover grayscale" />
                            </div>
                         )}
                       </div>
                     </div>

                     <div className="space-y-3">
                        {q.alternatives.map((alt, altIdx) => {
                          const isSelected = userAnswer === altIdx;
                          const isTheCorrectAnswer = q.correctIndex === altIdx;
                          
                          let cardStyle = "border-slate-100 text-slate-500 bg-white";
                          let icon = <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-xs">{String.fromCharCode(65 + altIdx)}</span>;

                          if (isTheCorrectAnswer) {
                            cardStyle = "border-slate-800 bg-slate-800 text-white ring-1 ring-slate-800";
                            icon = <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center"><Check size={14} /></div>;
                          } else if (isSelected && !isTheCorrectAnswer) {
                            cardStyle = "border-slate-300 bg-white text-slate-900";
                            icon = <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center"><XIcon size={14} /></div>;
                          }

                          return (
                            <div key={altIdx} className={`p-3 rounded-lg border flex items-center justify-between ${cardStyle}`}>
                              <div className="flex items-center gap-3">
                                {icon}
                                <span className="text-sm font-medium">{alt}</span>
                              </div>
                              {isTheCorrectAnswer && <span className="text-xs font-bold uppercase">Resposta Correta</span>}
                              {isSelected && !isTheCorrectAnswer && <span className="text-xs font-bold text-slate-500 uppercase">Sua Resposta</span>}
                            </div>
                          );
                        })}
                     </div>

                     {/* AI Explanation Area - Always show button regardless of isCorrect */}
                     <div className="mt-6">
                       {explanation?.id === q.id ? (
                          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-200 pb-2">
                              <Brain size={18} />
                              Explicação do Professor Virtual
                            </div>
                            <div className="prose prose-sm text-slate-700 max-w-none leading-relaxed whitespace-pre-line">
                              {explanation.text}
                            </div>
                            <div className="mt-3 text-right">
                              <span className="text-[10px] text-slate-400">Gerado por Gemini AI</span>
                            </div>
                          </div>
                       ) : (
                          <button 
                            onClick={() => handleExplain(q, userAnswer)}
                            disabled={loadingExplanation}
                            className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            {loadingExplanation ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            {loadingExplanation ? "Analisando questão..." 
                              : isCorrect ? "Ver comentário do professor (Reforço)" 
                              : isUnanswered ? "Ver explicação da resposta" 
                              : "Entender por que errei"}
                          </button>
                       )}
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- TELA DO EXAME (QUESTÕES) ---
  const currentQ = questions[currentQuestionIndex];
  
  if (!currentQ) return <div className="p-8 text-center">Carregando questão...</div>;
  
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQImage = questionImages[currentQ.id];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col relative">
      {/* Popover de Definição (sem alterações no código visual, apenas mantendo a lógica) */}
      {textSelection && (
        <div 
           className="absolute z-50 transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in duration-200"
           style={{ left: textSelection.x, top: textSelection.y - 10 }}
        >
          {definition ? (
             <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-64 text-left relative">
               <button 
                 onClick={() => { setTextSelection(null); setDefinition(null); }}
                 className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
               >
                 <XIcon size={14} />
               </button>
               <h4 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1 flex items-center gap-2">
                 <BookOpen size={14} /> {definition.word}
               </h4>
               {definition.loading ? (
                 <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                   <Loader2 size={12} className="animate-spin" /> Buscando significado...
                 </div>
               ) : (
                 <p className="text-xs text-slate-600 leading-relaxed">
                   {definition.definition}
                 </p>
               )}
               <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
             </div>
          ) : (
             <button
                onClick={handleGetDefinition}
                className="bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
             >
               <BookOpen size={12} /> Definir "{textSelection.text}"
               <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform rotate-45"></div>
             </button>
          )}
        </div>
      )}

      {/* Header do Simulado */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
         <div className="flex items-center gap-4">
           <div className={`bg-slate-100 p-2 rounded-lg font-mono font-bold w-32 text-center flex items-center justify-center gap-2 ${timer > (selectedDuration * 60) * 0.9 ? 'text-slate-900 bg-slate-200' : 'text-slate-700'}`}>
             <Clock size={16} />
             {formatTime(timer)} {!initialReviewData && `/ ${formatTime(selectedDuration * 60)}`}
           </div>
           <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
             <div className="h-full bg-slate-800 transition-all duration-300" style={{ width: `${progress}%` }}></div>
           </div>
           <span className="text-sm text-slate-500 font-medium">Questão {currentQuestionIndex + 1} / {questions.length}</span>
           {!initialReviewData && (
             <span className="text-xs text-slate-600 flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded-full">
               <Save size={10} /> Salvo
             </span>
           )}
           {initialReviewData && (
             <span className="text-xs text-slate-600 flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded-full">
               <History size={10} /> Modo Revisão
             </span>
           )}
         </div>
         <button 
            onClick={() => setIsFinished(true)} 
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium"
         >
           Finalizar Prova
         </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Coluna Esquerda: Questão */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-y-auto flex flex-col">
          
          <div className="flex flex-col flex-1 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide">
                {currentQ.subject}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-semibold">
                <GraduationCap size={12} />
                {currentQ.source}
              </span>
            </div>
            
            {/* TEXTO DE APOIO (CONTEXT TEXT) - ETEC STYLE */}
            {currentQ.contextText && (
               <div className="mb-6 p-6 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg">
                 <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Texto para a questão</span>
                 </div>
                 <p className="font-serif text-slate-700 leading-relaxed text-sm md:text-base italic">
                   "{currentQ.contextText}"
                 </p>
               </div>
            )}

            {/* Imagem da Questão */}
            {currentQImage && (
              <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-h-64 bg-slate-50 flex items-center justify-center">
                <img src={currentQImage} alt="Ilustração da questão" className="w-full h-full object-contain grayscale" />
              </div>
            )}
            
            {/* Enunciado Interativo para Seleção */}
            <div className="flex gap-4 items-start mb-8 relative">
              {!currentQImage && (
                <button
                  onClick={handleReadAloud}
                  className={`mt-1 p-2 rounded-full transition-colors shrink-0 ${isSpeaking ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                  title={isSpeaking ? "Parar leitura" : "Ouvir questão"}
                >
                  {isSpeaking ? <StopCircle size={20} /> : <Volume2 size={20} />}
                </button>
              )}
              <div 
                 ref={questionTextRef}
                 onMouseUp={handleTextSelection}
                 onTouchEnd={handleTextSelection}
                 className="text-xl font-medium text-slate-800 leading-relaxed cursor-text selection:bg-slate-200 selection:text-slate-900"
              >
                {currentQ.text}
              </div>
            </div>
            
            <div className="space-y-3 mt-auto">
              {currentQ.alternatives.map((alt, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ease-in-out flex items-center gap-4 group relative
                      ${isSelected 
                        ? 'border-slate-800 bg-slate-50 text-slate-900 shadow-md scale-[1.01] ring-2 ring-slate-100 z-10' 
                        : 'border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50 active:scale-[0.99]'}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${isSelected 
                        ? 'border-slate-800 bg-slate-800 text-white scale-110 shadow-sm' 
                        : 'border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'}
                    `}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium">{alt}</span>
                    
                    {isSelected && (
                      <div className="ml-auto animate-in zoom-in fade-in duration-300">
                        <CheckCircle size={20} className="text-slate-800" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Coluna Direita: Navegação */}
        <div className="w-64 hidden lg:flex flex-col gap-4">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
             <h3 className="font-bold text-slate-800 mb-4">Mapa da Prova</h3>
             <div className="grid grid-cols-4 gap-2">
               {questions.map((q, idx) => (
                 <button
                   key={idx}
                   onClick={() => setCurrentQuestionIndex(idx)}
                   className={`w-10 h-10 rounded-lg text-sm font-bold transition-all relative
                     ${currentQuestionIndex === idx ? 'ring-2 ring-slate-800 ring-offset-2' : ''}
                     ${selectedAnswers[idx] !== -1 
                        ? 'bg-slate-800 text-white' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                   `}
                 >
                   {idx + 1}
                   {questionImages[q.id] && (
                     <span className="absolute -top-1 -right-1 w-2 h-2 bg-slate-400 rounded-full border border-white"></span>
                   )}
                 </button>
               ))}
             </div>
             <div className="mt-4 text-[10px] text-slate-400 flex gap-2 items-center flex-wrap">
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-400 rounded-full"></span> Imagem</div>
             </div>
           </div>

           <div className="flex gap-2">
             <button 
               onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
               disabled={currentQuestionIndex === 0}
               className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
             >
               Anterior
             </button>
             {currentQuestionIndex === questions.length - 1 ? (
                <button 
                  onClick={handleFinish}
                  className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 shadow-md shadow-slate-200 transition-colors"
                >
                  Finalizar
                </button>
             ) : (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 shadow-md shadow-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  Próxima <ArrowRight size={18} />
                </button>
             )}
           </div>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className="lg:hidden mt-4 flex gap-4">
         <button 
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="p-3 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
         >
           <ArrowLeft />
         </button>
         <button 
            onClick={currentQuestionIndex === questions.length - 1 ? handleFinish : () => setCurrentQuestionIndex(prev => prev + 1)}
            className={`flex-1 font-bold rounded-lg text-white shadow-sm ${currentQuestionIndex === questions.length - 1 ? 'bg-slate-800' : 'bg-slate-800'}`}
         >
           {currentQuestionIndex === questions.length - 1 ? "Entregar Prova" : "Próxima Questão"}
         </button>
      </div>
    </div>
  );
};

export default SimuladosPage;