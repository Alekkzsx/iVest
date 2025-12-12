
import React from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import { UserProfile } from "../types/index";

interface HeaderProps {
  setMobileOpen: (b: boolean) => void;
  user?: UserProfile;
}

const Header = ({ setMobileOpen, user }: HeaderProps) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar matéria, simulado..."
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-slate-200 focus:outline-none w-64 text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-slate-900 border-2 border-white rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name || "Estudante"}</p>
            <p className="text-xs text-slate-500">{user?.targetCourse || "Candidato ETEC"}</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 border-2 border-white shadow-sm overflow-hidden">
             <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
