
import React from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  PlayCircle, 
  PieChart, 
  Target, 
  X, 
  Trophy,
  Settings
} from "lucide-react";
import { NavItem, UserProfile } from "../types/index";

interface SidebarProps {
  active: NavItem;
  setActive: (i: NavItem) => void;
  mobileOpen: boolean;
  setMobileOpen: (b: boolean) => void;
  user: UserProfile;
  onOpenSettings: () => void;
}

const Sidebar = ({ active, setActive, mobileOpen, setMobileOpen, user, onOpenSettings }: SidebarProps) => {
  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard size={20} /> },
    { id: "cronograma", label: "Cronograma", icon: <Calendar size={20} /> },
    { id: "materias", label: "Matérias", icon: <BookOpen size={20} /> },
    { id: "simulados", label: "Simulados", icon: <PlayCircle size={20} /> },
    { id: "desempenho", label: "Desempenho", icon: <PieChart size={20} /> },
  ];

  // XP calculation for display
  const xpForNextLevel = 1000;
  const currentLevelProgress = user.xp % xpForNextLevel;
  const progressPercent = (currentLevelProgress / xpForNextLevel) * 100;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-2xl tracking-tight">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
              <Target size={20} />
            </div>
            EtecPrep
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActive(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active === item.id
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Gamification Widget */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-200 text-slate-700 rounded-full">
                <Trophy size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Nível {user.level}</p>
                <p className="text-sm font-bold text-slate-800">
                  {user.level < 5 ? "Iniciante" : user.level < 10 ? "Estudante Focado" : "Mestre da ETEC"}
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden" title={`${currentLevelProgress} / ${xpForNextLevel} XP`}>
              <div 
                className="bg-slate-800 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-center mt-2 text-slate-400 font-medium">
              {currentLevelProgress} / {xpForNextLevel} XP para subir
            </p>
          </div>

          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
