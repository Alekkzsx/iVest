
import React, { useEffect, useState, useRef } from "react";
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trophy, 
  LayoutDashboard, 
  Calendar, 
  BookOpen,
  Loader2,
  ExternalLink,
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  Globe
} from "lucide-react";
import { SUBJECTS, TASKS } from "../data/mockData";
import { fetchRealEtecData, askEtecTutor, ChatHistoryItem } from "../services/aiService";
import { EtecEvent, GroundingSource, NavItem } from "../types/index";

interface DashboardHomeProps {
  onNavigate: (tab: NavItem) => void;
}

const SUGGESTIONS = [
  "O que mais cai em Matemática?",
  "Dicas de interpretação de texto",
  "Como funcionam os Simulados?",
  "Resolva uma equação de 2º grau"
];

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EtecEvent[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [examDateObj, setExamDateObj] = useState<Date | null>(null);
  const [tip, setTip] = useState("Carregando dica inspiradora...");
  const [sources, setSources] = useState<GroundingSource[]>([]);
  
  // Tutor State
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<ChatHistoryItem[]>(() => {
    // Lista de mensagens motivacionais/boas-vindas
    const welcomeOptions = [
      "Olá! Sou seu Tutor Virtual. Estou aqui para te ajudar a passar na ETEC! O que vamos estudar hoje?",
      "E aí, futuro Etecano! 🚀 Estou pronto para tirar suas dúvidas de Matemática, Português e muito mais. Qual é a boa de hoje?",
      "Bem-vindo! A disciplina é a ponte entre metas e realizações. Como posso te ajudar a chegar mais perto da sua vaga na ETEC agora?"
    ];
    // Escolhe uma aleatoriamente
    const randomWelcome = welcomeOptions[Math.floor(Math.random() * welcomeOptions.length)];
    
    return [{ role: 'ai', text: randomWelcome }];
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data, sources } = await fetchRealEtecData();
      
      setEvents(data.events);
      setTip(data.tipOfTheDay);
      setSources(sources);

      if (data.examDate) {
        const exam = new Date(data.examDate);
        const today = new Date();
        // Ajusta para meia-noite para calcular dias cheios
        exam.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        
        const diffTime = exam.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysRemaining(diffDays > 0 ? diffDays : 0);
        setExamDateObj(exam);
      } else {
        setDaysRemaining(null);
        setExamDateObj(null);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatting]);

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim() || isChatting) return;

    const userMsg: ChatHistoryItem = {
      role: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);

    const currentHistory = [...messages, userMsg];
    
    const answer = await askEtecTutor(textToSend, currentHistory);

    const aiMsg: ChatHistoryItem = {
      role: 'ai',
      text: answer
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsChatting(false);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Bom dia, Vestibulando! 🚀</h1>
          <p className="text-slate-300 text-lg mb-6 max-w-xl">
            Hoje é um ótimo dia para dominar a Matemática. Você já completou 40% da meta semanal. Mantenha o ritmo!
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate("materias")}
              className="bg-white text-slate-900 px-6 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <BookOpen size={18} />
              Continuar Estudos
            </button>
            
            <button 
              onClick={() => onNavigate("simulados")}
              className="bg-slate-700/50 text-white border border-white/20 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-700/70 transition-colors flex items-center gap-2 backdrop-blur-sm"
            >
              <PlayCircle size={18} />
              Fazer Simulado
            </button>

            <button 
              onClick={() => onNavigate("cronograma")}
              className="bg-transparent text-white border border-white/20 px-6 py-2.5 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Ver Plano de Estudo
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Stats & Tasks) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Questões", value: "1.2k", icon: <CheckCircle2 className="text-slate-700" />, bg: "bg-slate-100" },
              { label: "Horas/Estudo", value: "42h", icon: <Clock className="text-slate-700" />, bg: "bg-slate-100" },
              { label: "Simulados", value: "4", icon: <FileText className="text-slate-700" />, bg: "bg-slate-100" },
              { label: "Média Geral", value: "7.5", icon: <Trophy className="text-slate-700" />, bg: "bg-slate-100" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:border-slate-200 transition-colors">
                <div className={`p-3 rounded-full ${stat.bg} mb-1`}>
                  {stat.icon}
                </div>
                <div>
                  <span className="block text-2xl font-bold text-slate-800">{stat.value}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Plan */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="text-slate-500" size={20} />
                Plano de Hoje
              </h2>
              <span className="text-sm text-slate-500">3 tarefas restantes</span>
            </div>
            <div className="p-4">
              {TASKS.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer border-b border-slate-50 last:border-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.done ? 'bg-slate-800 border-slate-800' : 'border-slate-300 group-hover:border-slate-500'}`}>
                    {task.done && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</p>
                    <span className="text-xs text-slate-400 inline-block px-2 py-0.5 bg-slate-100 rounded-full mt-1">{task.subject}</span>
                  </div>
                  <button className="text-slate-300 group-hover:text-slate-800 transition-colors">
                    <PlayCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Progress */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Progresso por Área</h2>
              <button 
                onClick={() => onNavigate("materias")}
                className="text-sm text-slate-900 font-medium hover:underline"
              >
                Ver Detalhes
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SUBJECTS.map((sub, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="text-lg grayscale">{sub.icon}</span> {sub.name}
                    </span>
                    <span className="text-slate-500 font-bold">{sub.progress}%</span>
                  </div>
                  
                  {/* Progress Bar with Tooltip */}
                  <div className="relative group cursor-default">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sub.color}`} style={{ width: `${sub.progress}%` }}></div>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-20">
                      <div className="bg-slate-800 text-white text-xs font-medium rounded py-1.5 px-3 shadow-xl whitespace-nowrap relative animate-in fade-in zoom-in duration-200">
                        {sub.studiedHours}h de {sub.totalHours}h planejadas
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>

          {/* AI Tutor Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white rounded-t-xl">
              <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-sm shadow-slate-200">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Tutor Virtual
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">ONLINE</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Tire dúvidas sobre matérias, provas e simulados</p>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-800 shrink-0 shadow-sm mt-1">
                      <Bot size={16} />
                    </div>
                  )}
                  
                  <div className={`
                    max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}
                  `}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className="min-h-[1rem]">
                        {line.split('**').map((part, j) => 
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              
              {isChatting && (
                <div className="flex gap-3 justify-start animate-pulse">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-800 shrink-0 shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            {!isChatting && (
              <div className="px-4 py-2 bg-slate-50/50 flex gap-2 overflow-x-auto no-scrollbar">
                {SUGGESTIONS.map((sug, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(undefined, sug)}
                    className="whitespace-nowrap text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <Lightbulb size={12} className="text-slate-500" />
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={(e) => handleSendMessage(e)} className="p-3 border-t border-slate-200 bg-white rounded-b-xl">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100 rounded-xl py-3 pl-4 pr-12 text-sm transition-all outline-none placeholder:text-slate-400"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isChatting}
                  className="absolute right-1.5 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors shadow-sm"
                >
                  <Send size={18} className={isChatting ? "opacity-0" : "opacity-100"} />
                  {isChatting && <Loader2 size={18} className="absolute top-2 right-2 animate-spin" />}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-8">
          
          {/* Countdown Widget */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg text-center relative overflow-hidden min-h-[250px] flex flex-col justify-center">
            <div className="absolute inset-0 bg-slate-600/20 blur-3xl rounded-full scale-150 translate-y-10"></div>
            
            {loading ? (
              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="animate-spin text-white" size={32} />
                <p className="text-slate-400 text-sm">Buscando edital oficial...</p>
              </div>
            ) : (
              <div className="relative z-10 animate-in fade-in duration-500">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-2">
                  {examDateObj ? "Prova da ETEC" : "Situação do Edital"}
                </p>
                
                {daysRemaining !== null ? (
                   <>
                    <div className="text-5xl font-bold mb-1">{daysRemaining}</div>
                    <p className="text-slate-300">dias restantes</p>
                   </>
                ) : (
                   <>
                     <div className="text-xl font-bold mb-2 text-white border border-white/30 bg-white/10 p-3 rounded-lg">
                       Aguardando Divulgação
                     </div>
                     <p className="text-slate-300 text-xs max-w-[200px] mx-auto">
                       As datas para o próximo semestre ainda não foram publicadas oficialmente.
                     </p>
                   </>
                )}

                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="block text-lg font-bold">
                      {examDateObj ? examDateObj.getDate() : "?"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {examDateObj ? examDateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '') : "Mês"}
                    </span>
                  </div>
                   <div>
                    <span className="block text-lg font-bold">13:30</span>
                    <span className="text-xs text-slate-500">Previsto</span>
                  </div>
                   <div>
                    <span className={`block text-lg font-bold ${daysRemaining !== null ? 'text-white' : 'text-slate-300'}`}>
                       {daysRemaining !== null ? "Ativo" : "Breve"}
                    </span>
                    <span className="text-xs text-slate-500">Status</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar / Events */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              Cronograma Oficial
            </h3>
            
            {loading ? (
              <div className="space-y-4 opacity-50">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                 ))}
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {events.length > 0 ? events.map((event, idx) => (
                  <div key={idx} className="relative pl-10 flex flex-col animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className={`absolute left-[15px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 ${event.type === 'exam' ? 'bg-slate-900' : event.type === 'deadline' ? 'bg-slate-500' : 'bg-slate-300'}`}></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">{event.date}</span>
                    <span className="text-sm font-medium text-slate-700">{event.title}</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 pl-4">Nenhum evento encontrado.</p>
                )}
              </div>
            )}

            {/* Sources Display - IMPORTANT: Show real sources */}
            {!loading && sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
                  <Globe size={10} />
                  Dados reais obtidos de:
                </p>
                <div className="flex flex-col gap-1.5">
                  {sources.slice(0, 3).map((source, i) => (
                     <a 
                       key={i} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-xs flex items-center gap-2 text-slate-600 hover:underline hover:text-slate-900 transition-colors truncate"
                       title={source.title}
                     >
                       <ExternalLink size={10} className="shrink-0" />
                       <span className="truncate">{source.title}</span>
                     </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestion/Tip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex gap-3">
              <div className="bg-slate-200 text-slate-700 p-2 rounded-lg h-fit shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Dica do Dia</h4>
                {loading ? (
                   <div className="h-10 bg-slate-200 rounded animate-pulse w-full"></div>
                ) : (
                   <p className="text-xs text-slate-600 leading-relaxed animate-in fade-in">
                     {tip}
                   </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
