

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Clock, PlayCircle, CheckCircle2, MoreHorizontal, FileText, ChevronRight, ChevronDown, Search, Filter, X, Lightbulb, GraduationCap, Check, Loader2, ArrowRight, Calculator, FlaskConical, Globe2, BookType, Youtube, ExternalLink, HelpCircle, Send, MessageCircle, User, Bot } from "lucide-react";
import { SUBJECTS } from "../data/mockData";
import { explainStudyTopic, recommendVideoLessons, askStudyTutor, StudyContent, VideoRecommendation, ChatHistoryItem } from "../services/aiService";

// --- Tipos & Dados Iniciais ---

interface Topic {
  id: string;
  title: string;
  type: "video" | "exercise" | "text";
  done: boolean;
}

const INITIAL_MOCK_TOPICS: Record<string, Topic[]> = {
  "Português": [
    { id: "pt-1", title: "Interpretação de Texto e Gêneros", type: "video", done: true },
    { id: "pt-2", title: "Figuras de Linguagem", type: "video", done: true },
    { id: "pt-3", title: "Sintaxe: Período Composto", type: "exercise", done: false },
    { id: "pt-4", title: "Literatura: Modernismo", type: "text", done: false },
    { id: "pt-5", title: "Gramática: Verbos", type: "exercise", done: false },
    { id: "pt-6", title: "Redação: Estrutura Dissertativa", type: "video", done: false },
    { id: "pt-7", title: "Acentuação Gráfica", type: "text", done: false },
    { id: "pt-8", title: "Barroco e Arcadismo", type: "video", done: false },
  ],
  "Matemática": [
    { id: "mt-1", title: "Razão e Proporção", type: "video", done: true },
    { id: "mt-2", title: "Equações de 1º e 2º Grau", type: "exercise", done: true },
    { id: "mt-3", title: "Geometria Plana: Áreas", type: "video", done: false },
    { id: "mt-4", title: "Trigonometria Básica", type: "exercise", done: false },
    { id: "mt-5", title: "Funções: Afim e Quadrática", type: "video", done: false },
    { id: "mt-6", title: "Probabilidade", type: "text", done: false },
    { id: "mt-7", title: "Juros Simples e Compostos", type: "exercise", done: false },
    { id: "mt-8", title: "Teorema de Pitágoras", type: "video", done: false },
  ],
  "Ciências Naturais": [
    { id: "cn-1", title: "Cinemática: Velocidade Média", type: "video", done: true },
    { id: "cn-2", title: "Tabela Periódica", type: "text", done: false },
    { id: "cn-3", title: "Ecologia e Sustentabilidade", type: "video", done: false },
    { id: "cn-4", title: "Genética Básica", type: "exercise", done: false },
    { id: "cn-5", title: "Leis de Newton", type: "video", done: false },
    { id: "cn-6", title: "Reações Químicas", type: "exercise", done: false },
    { id: "cn-7", title: "Sistemas do Corpo Humano", type: "text", done: false },
    { id: "cn-8", title: "Eletricidade e Magnetismo", type: "video", done: false },
  ],
  "Ciências Humanas": [
    { id: "ch-1", title: "Era Vargas", type: "video", done: true },
    { id: "ch-2", title: "Geopolítica Mundial", type: "text", done: true },
    { id: "ch-3", title: "Urbanização Brasileira", type: "video", done: false },
    { id: "ch-4", title: "Revolução Industrial", type: "exercise", done: false },
    { id: "ch-5", title: "Primeira Guerra Mundial", type: "video", done: false },
    { id: "ch-6", title: "Cartografia Básica", type: "text", done: false },
    { id: "ch-7", title: "Climas e Biomas do Brasil", type: "video", done: false },
    { id: "ch-8", title: "Guerra Fria", type: "exercise", done: false },
  ]
};

const STORAGE_KEY_TOPICS = "etec_study_topics";
const CHAT_SUGGESTIONS = [
  "Me explique melhor",
  "Não entendi, pode simplificar?",
  "Dê um exemplo prático",
  "O que é mais importante decorar?",
  "Resuma em tópicos"
];

interface MateriasPageProps {
  onTopicComplete?: (xp: number) => void;
}

const MateriasPage = ({ onTopicComplete }: MateriasPageProps) => {
  // --- Estados de Dados ---
  const [topics, setTopics] = useState<Record<string, Topic[]>>(INITIAL_MOCK_TOPICS);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);

  // --- Estados de UI/Filtros ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // --- Estados do Modal de Estudo ---
  const [activeTopic, setActiveTopic] = useState<{title: string, subject: string, id: string, type: string} | null>(null);
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null);
  const [videoRecs, setVideoRecs] = useState<VideoRecommendation[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [modalTab, setModalTab] = useState<'concept' | 'application' | 'video' | 'quiz' | 'chat'>('concept');
  const [quizSelected, setQuizSelected] = useState<number | null>(null);

  // --- Estados do Chat de Dúvidas ---
  const [chatMessages, setChatMessages] = useState<ChatHistoryItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Efeitos (Persistência) ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TOPICS);
    if (saved) {
      try {
        setTopics(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar tópicos salvos", e);
      }
    }
  }, []);

  const saveTopics = (newTopics: Record<string, Topic[]>) => {
    setTopics(newTopics);
    localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(newTopics));
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (modalTab === 'chat' && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, modalTab]);

  // --- Ações ---

  const toggleExpand = (subjectName: string) => {
    setExpandedSubjects(prev => 
      prev.includes(subjectName) 
        ? prev.filter(s => s !== subjectName) 
        : [...prev, subjectName]
    );
  };

  const toggleTopicDone = (subjectName: string, topicId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Previne abrir o modal ao clicar no checkbox
    const newTopics = { ...topics };
    const topicIndex = newTopics[subjectName].findIndex(t => t.id === topicId);
    
    if (topicIndex >= 0) {
      const isCompleting = !newTopics[subjectName][topicIndex].done;
      newTopics[subjectName][topicIndex].done = isCompleting;
      saveTopics(newTopics);

      // Award XP if completing
      if (isCompleting && onTopicComplete) {
         onTopicComplete(150); // 150 XP per topic
      }
    }
  };

  const openStudyModal = async (topicTitle: string, subjectName: string, topicId: string, topicType: string) => {
    setActiveTopic({ title: topicTitle, subject: subjectName, id: topicId, type: topicType });
    setStudyContent(null);
    setVideoRecs([]);
    setLoadingContent(true);
    setModalTab('concept');
    setQuizSelected(null);
    setChatMessages([{ role: 'ai', text: `Olá! Sou seu tutor para "${topicTitle}". Leia o conteúdo nas outras abas e, se tiver dúvida, me pergunte aqui!` }]);
    setChatInput("");

    // Carrega conteúdo de texto e vídeos em paralelo
    const [content, videos] = await Promise.all([
      explainStudyTopic(topicTitle, subjectName),
      recommendVideoLessons(topicTitle, subjectName)
    ]);
    
    setStudyContent(content);
    setVideoRecs(videos);
    setLoadingContent(false);
  };

  const closeStudyModal = () => {
    setActiveTopic(null);
    setStudyContent(null);
    setVideoRecs([]);
  };

  const markActiveTopicAsDone = () => {
    if (activeTopic) {
        // Encontra se já está feito
        const currentDone = topics[activeTopic.subject].find(t => t.id === activeTopic.id)?.done;
        if (!currentDone) {
            // Fake event para reusar lógica
            toggleTopicDone(activeTopic.subject, activeTopic.id, { stopPropagation: () => {} } as React.MouseEvent);
        }
        closeStudyModal();
    }
  };

  const handleSendChat = async (textOverride?: string) => {
    const text = textOverride || chatInput;
    if (!text.trim() || !activeTopic || !studyContent) return;

    const userMsg: ChatHistoryItem = { role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const response = await askStudyTutor(
        activeTopic.title, 
        activeTopic.subject, 
        text, 
        studyContent.concept, 
        chatMessages
    );

    setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    setChatLoading(false);
  };

  const generateYoutubeLink = (title: string, channel: string) => {
    const query = encodeURIComponent(`${title} ${channel} aula etec`);
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  // --- Helper de Ícones ---
  const getSubjectIcon = (subjectName: string) => {
    switch (subjectName) {
      case "Matemática": return <Calculator size={24} />;
      case "Português": return <BookType size={24} />;
      case "Ciências Naturais": return <FlaskConical size={24} />;
      case "Ciências Humanas": return <Globe2 size={24} />;
      default: return <BookOpen size={24} />;
    }
  };

  // --- Filtragem ---
  const getFilteredTopics = (subjectName: string) => {
    let list = topics[subjectName] || [];
    
    // Filtro de Texto
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(lowerTerm));
    }

    // Filtro de Status
    if (filterStatus === 'pending') {
      list = list.filter(t => !t.done);
    } else if (filterStatus === 'completed') {
      list = list.filter(t => t.done);
    }

    return list;
  };

  // Se houver busca ativa, expande automaticamente todos os cards que tem resultados
  useEffect(() => {
    if (searchTerm.trim()) {
      const allSubjects = Object.keys(topics);
      setExpandedSubjects(allSubjects);
    }
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12 relative">
      
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-slate-800" />
            Conteúdos ETEC
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize seus estudos e domine o edital.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Buscar tópico..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
             />
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-lg">
             {[
               { id: 'all', label: 'Todos' },
               { id: 'pending', label: 'Pendentes' },
               { id: 'completed', label: 'Concluídos' }
             ].map(opt => (
               <button
                 key={opt.id}
                 onClick={() => setFilterStatus(opt.id as any)}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterStatus === opt.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 {opt.label}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Grid de Matérias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SUBJECTS.map((subject, idx) => {
          const filteredTopics = getFilteredTopics(subject.name);
          const allTopicsCount = topics[subject.name]?.length || 0;
          const doneCount = topics[subject.name]?.filter(t => t.done).length || 0;
          const progress = allTopicsCount > 0 ? Math.round((doneCount / allTopicsCount) * 100) : 0;
          
          const isExpanded = expandedSubjects.includes(subject.name);
          const visibleTopics = isExpanded ? filteredTopics : filteredTopics.slice(0, 3);
          
          // Se estamos buscando e não há resultados neste card, não exibe o card (opcional, mas limpa a tela)
          if (searchTerm && filteredTopics.length === 0) return null;

          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-all flex flex-col h-full">
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4 w-full">
                    {/* Ícone com Cor de Destaque */}
                    <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center text-white shadow-md ${subject.color}`}>
                      {getSubjectIcon(subject.name)}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-800">{subject.name}</h2>
                      
                      {/* Visual Progress Indicator */}
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1.5">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} className={progress === 100 ? "text-slate-800" : "text-slate-400"} />
                            {doneCount}/{allTopicsCount} concluídos
                          </span>
                          <span className="text-slate-800 font-bold">{progress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${subject.color}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics List */}
              <div className="flex-1 p-2">
                {visibleTopics.length > 0 ? visibleTopics.map((topic, tIdx) => (
                  <div 
                    key={topic.id} 
                    onClick={() => openStudyModal(topic.title, subject.name, topic.id, topic.type)}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg group transition-colors cursor-pointer border border-transparent hover:border-slate-100 relative"
                  >
                    {/* Checkbox Customizado */}
                    <button 
                      onClick={(e) => toggleTopicDone(subject.name, topic.id, e)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors z-10
                        ${topic.done 
                          ? 'bg-slate-800 border-slate-800 text-white' 
                          : 'bg-white border-slate-300 text-transparent hover:border-slate-500'}
                      `}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    
                    <div className="flex-1">
                      <p className={`text-sm font-medium transition-colors ${topic.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {topic.title}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        {topic.type === 'video' ? <PlayCircle size={10} /> : topic.type === 'exercise' ? <CheckCircle2 size={10} /> : <FileText size={10} />}
                        {topic.type === 'video' ? 'Videoaula' : topic.type === 'exercise' ? 'Prática' : 'Leitura'}
                      </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 bg-white px-2 py-1 rounded text-xs border border-slate-200 shadow-sm">
                      Estudar
                    </div>
                  </div>
                )) : (
                   <div className="p-8 text-center text-slate-400 text-sm">
                     Nenhum tópico encontrado.
                   </div>
                )}
              </div>

              {/* Expand/Collapse Footer */}
              {filteredTopics.length > 3 && (
                <button 
                  onClick={() => toggleExpand(subject.name)}
                  className="w-full py-3 bg-white border-t border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1"
                >
                  {isExpanded ? (
                    <>Ver Menos <ChevronDown size={14} className="rotate-180" /></>
                  ) : (
                    <>Ver mais {filteredTopics.length - 3} tópicos <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* --- SMART STUDY MODAL --- */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeStudyModal}></div>
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  {activeTopic.subject}
                </span>
                <h2 className="text-xl font-bold text-slate-800">{activeTopic.title}</h2>
              </div>
              <button onClick={closeStudyModal} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-0 bg-white">
              {loadingContent ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="animate-spin mb-3 text-slate-800" size={32} />
                  <p className="text-sm font-medium">A IA está preparando seu material...</p>
                </div>
              ) : studyContent ? (
                <div className="flex flex-col h-full">
                   {/* Tabs */}
                   <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10 px-6 pt-2 overflow-x-auto no-scrollbar">
                     {[
                       { id: 'concept', label: 'Conceito', icon: <BookOpen size={16} /> },
                       { id: 'application', label: 'Na ETEC', icon: <GraduationCap size={16} /> },
                       { id: 'video', label: 'Vídeos', icon: <Youtube size={16} /> },
                       { id: 'quiz', label: 'Quiz Rápido', icon: <CheckCircle2 size={16} /> },
                       { id: 'chat', label: 'Tira-Dúvidas', icon: <HelpCircle size={16} /> }
                     ].map(tab => (
                       <button
                         key={tab.id}
                         onClick={() => setModalTab(tab.id as any)}
                         className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap
                           ${modalTab === tab.id ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}
                         `}
                       >
                         {tab.icon} {tab.label}
                       </button>
                     ))}
                   </div>

                   {/* Tab Content */}
                   <div className="p-8 min-h-[300px]">
                      {modalTab === 'concept' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <Lightbulb className="text-yellow-500 fill-yellow-500" size={20} /> Resumo Teórico
                           </h3>
                           <p className="text-slate-600 leading-relaxed text-lg">
                             {studyContent.concept}
                           </p>
                           <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Dica de Ouro</p>
                              <p className="text-sm text-slate-700 italic">"Concentre-se nas palavras-chave deste conceito para associar rapidamente na hora da prova."</p>
                           </div>
                        </div>
                      )}

                      {modalTab === 'application' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <GraduationCap className="text-slate-800" size={20} /> Contexto de Prova
                           </h3>
                           <p className="text-slate-600 leading-relaxed">
                             {studyContent.application}
                           </p>
                           <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                             {/* Mock tags of common ETEC themes related */}
                             <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap">Interpretação</span>
                             <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap">Contexto Social</span>
                             <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap">Interdisciplinaridade</span>
                           </div>
                        </div>
                      )}

                      {modalTab === 'video' && (
                        <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
                           <div className="flex items-center gap-2 mb-4">
                              <Youtube className="text-red-600" size={24} />
                              <h3 className="text-lg font-bold text-slate-800">Recomendações da IA</h3>
                           </div>
                           
                           {videoRecs.length > 0 ? (
                             videoRecs.map((video, idx) => (
                               <a 
                                 key={idx}
                                 href={generateYoutubeLink(video.title, video.channelName)}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="block bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 hover:border-slate-300 transition-all group"
                               >
                                 <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 group-hover:text-red-700 transition-colors flex items-center gap-2">
                                        {video.title} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </h4>
                                      <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">{video.channelName}</p>
                                      <p className="text-sm text-slate-600 mt-2">{video.description}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-red-600 shadow-sm group-hover:shadow-md transition-all">
                                      <PlayCircle size={24} />
                                    </div>
                                 </div>
                               </a>
                             ))
                           ) : (
                             <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                               <p className="text-slate-500">Nenhuma recomendação específica encontrada.</p>
                               <a 
                                 href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeTopic.title + " aula etec")}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-slate-900 font-bold hover:underline mt-2 inline-block"
                               >
                                 Pesquisar manualmente no YouTube
                               </a>
                             </div>
                           )}
                           
                           <p className="text-[10px] text-slate-400 text-center mt-4">
                             Os links redirecionam para a busca do YouTube para garantir que você encontre o vídeo ativo.
                           </p>
                        </div>
                      )}

                      {modalTab === 'quiz' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                           <h3 className="text-lg font-bold text-slate-800 mb-6">Teste seu conhecimento</h3>
                           <p className="text-slate-700 font-medium mb-6 text-lg">{studyContent.quiz.question}</p>
                           
                           <div className="space-y-3">
                             {studyContent.quiz.options.map((opt, idx) => {
                               const isSelected = quizSelected === idx;
                               const isCorrect = studyContent.quiz.correctIndex === idx;
                               const showResult = quizSelected !== null;
                               
                               let style = "border-slate-200 hover:border-slate-400 bg-white text-slate-700";
                               
                               if (showResult) {
                                  if (isCorrect) style = "border-slate-800 bg-slate-800 text-white";
                                  else if (isSelected && !isCorrect) style = "border-slate-300 bg-slate-100 text-slate-400";
                                  else style = "border-slate-100 bg-white text-slate-400 opacity-50";
                               } else if (isSelected) {
                                  style = "border-slate-800 ring-1 ring-slate-800 bg-slate-50";
                               }

                               return (
                                 <button
                                   key={idx}
                                   disabled={showResult}
                                   onClick={() => setQuizSelected(idx)}
                                   className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${style}`}
                                 >
                                   <span className="font-medium">{opt}</span>
                                   {showResult && isCorrect && <CheckCircle2 size={20} />}
                                 </button>
                               );
                             })}
                           </div>

                           {quizSelected !== null && (
                             <div className={`mt-6 p-4 rounded-xl text-center font-bold animate-in zoom-in ${quizSelected === studyContent.quiz.correctIndex ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-500'}`}>
                                {quizSelected === studyContent.quiz.correctIndex ? "🎉 Correto! Você dominou isso." : "🤔 Ops! Revise a teoria e tente de novo."}
                             </div>
                           )}
                        </div>
                      )}

                      {modalTab === 'chat' && (
                        <div className="flex flex-col h-[400px]">
                           <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                             {chatMessages.map((msg, idx) => (
                               <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><Bot size={16} /></div>}
                                 
                                 <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                   {msg.text}
                                 </div>
                                 
                                 {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><User size={16} /></div>}
                               </div>
                             ))}
                             {chatLoading && (
                               <div className="flex gap-3 justify-start">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><Bot size={16} /></div>
                                 <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl rounded-tl-none">
                                   <Loader2 size={16} className="animate-spin text-slate-400" />
                                 </div>
                               </div>
                             )}
                             <div ref={chatEndRef}></div>
                           </div>

                           <div className="space-y-3">
                              {/* Suggestions Chips */}
                              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {CHAT_SUGGESTIONS.map((sug, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleSendChat(sug)}
                                    disabled={chatLoading}
                                    className="whitespace-nowrap px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>

                              {/* Input Area */}
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                  placeholder="Digite sua dúvida sobre o assunto..."
                                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
                                  disabled={chatLoading}
                                />
                                <button 
                                  onClick={() => handleSendChat()}
                                  disabled={!chatInput.trim() || chatLoading}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
                                >
                                  <Send size={16} />
                                </button>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="p-8 text-center text-red-500">Erro ao carregar conteúdo. Tente novamente.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
               <button 
                 onClick={closeStudyModal}
                 className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium text-sm"
               >
                 Fechar
               </button>
               
               {modalTab !== 'quiz' ? (
                 <button 
                   onClick={() => {
                      if (modalTab === 'concept') setModalTab('application');
                      else if (modalTab === 'application') setModalTab('video');
                      else if (modalTab === 'video') setModalTab('chat');
                      else if (modalTab === 'chat') setModalTab('quiz');
                      else setModalTab('quiz');
                   }}
                   className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 transition-colors flex items-center gap-2"
                 >
                   Próximo <ArrowRight size={16} />
                 </button>
               ) : (
                 <button 
                   onClick={markActiveTopicAsDone}
                   className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center gap-2 shadow-lg"
                 >
                   <Check size={16} /> Concluir Tópico
                 </button>
               )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MateriasPage;