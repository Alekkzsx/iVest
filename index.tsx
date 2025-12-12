
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Target, X, Save, RotateCcw, User as UserIcon, BookOpen } from "lucide-react";

// Import Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardHome from "./pages/DashboardHome";
import SimuladosPage from "./pages/SimuladosPage";
import DesempenhoPage from "./pages/DesempenhoPage";
import CronogramaPage from "./pages/CronogramaPage";
import MateriasPage from "./pages/MateriasPage";

// Import Types
import { NavItem, PastExam, UserProfile } from "./types/index";

const PROFILE_STORAGE_KEY = "etec_user_profile";

const INITIAL_PROFILE: UserProfile = {
  name: "Estudante",
  targetCourse: "Ensino Médio + Técnico",
  xp: 0,
  level: 1,
  streakDays: 1
};

const App = () => {
  const [activeTab, setActiveTab] = useState<NavItem>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reviewExamData, setReviewExamData] = useState<PastExam | null>(null);
  
  // User State
  const [user, setUser] = useState<UserProfile>(INITIAL_PROFILE);
  const [showSettings, setShowSettings] = useState(false);

  // Settings Form State
  const [editName, setEditName] = useState("");
  const [editCourse, setEditCourse] = useState("");

  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        setUser(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Erro ao carregar perfil", e);
      }
    }
  }, []);

  const saveUser = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newUser));
  };

  const handleAddXp = (amount: number) => {
    const newXp = user.xp + amount;
    // Lógica simples de nível: Nível sobe a cada 1000 XP
    const newLevel = Math.floor(newXp / 1000) + 1;
    
    saveUser({
      ...user,
      xp: newXp,
      level: newLevel
    });
  };

  const handleNavigate = (tab: NavItem) => {
    setActiveTab(tab);
    if (tab !== "simulados") {
      setReviewExamData(null);
    }
  };

  const handleReviewExam = (exam: PastExam) => {
    setReviewExamData(exam);
    setActiveTab("simulados");
  };

  const handleOpenSettings = () => {
    setEditName(user.name);
    setEditCourse(user.targetCourse);
    setShowSettings(true);
    setMobileOpen(false);
  };

  const handleSaveSettings = () => {
    saveUser({
      ...user,
      name: editName,
      targetCourse: editCourse
    });
    setShowSettings(false);
  };

  const handleResetData = () => {
    if (confirm("ATENÇÃO: Isso apagará TODO seu histórico, cronograma e progresso. Deseja continuar?")) {
      localStorage.clear();
      setUser(INITIAL_PROFILE);
      setShowSettings(false);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar 
        active={activeTab} 
        setActive={handleNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header setMobileOpen={setMobileOpen} user={user} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth relative">
          <div className="max-w-6xl mx-auto">
            {activeTab === "dashboard" ? (
              <DashboardHome onNavigate={handleNavigate} />
            ) : activeTab === "simulados" ? (
              <SimuladosPage 
                onBack={() => handleNavigate("dashboard")} 
                initialReviewData={reviewExamData}
                onFinishExam={(xpEarned) => handleAddXp(xpEarned)}
              />
            ) : activeTab === "desempenho" ? (
              <DesempenhoPage onReviewExam={handleReviewExam} />
            ) : activeTab === "cronograma" ? (
              <CronogramaPage />
            ) : activeTab === "materias" ? (
              <MateriasPage onTopicComplete={(xpEarned) => handleAddXp(xpEarned)} />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                 {/* Fallback */}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-800">Configurações de Perfil</h2>
               <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={24} />
               </button>
             </div>
             
             <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Seu Nome</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Curso Alvo (ETEC)</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      placeholder="Ex: Enfermagem, Informática..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4">
                   <button 
                     onClick={handleResetData}
                     className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                   >
                     <RotateCcw size={12} /> Resetar todos os dados e progresso
                   </button>
                </div>
             </div>

             <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex justify-end gap-2">
               <button 
                 onClick={() => setShowSettings(false)}
                 className="px-4 py-2 text-slate-500 font-medium hover:text-slate-800"
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleSaveSettings}
                 className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
               >
                 <Save size={16} /> Salvar
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
