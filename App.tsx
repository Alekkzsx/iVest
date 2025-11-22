import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import StudyPlanModule from './components/StudyPlanModule';
import QuizModule from './components/QuizModule';
import EssayModule from './components/EssayModule';
import TutorModule from './components/TutorModule';
import { AppView } from './types';
import { GraduationCap, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} />;
      case AppView.PLAN:
        return <StudyPlanModule />;
      case AppView.QUIZ:
        return <QuizModule />;
      case AppView.ESSAY:
        return <EssayModule />;
      case AppView.TUTOR:
        return <TutorModule />;
      default:
        return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
          >
            <div className="bg-indigo-600 text-white p-2 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">VestiBot</h1>
          </div>
          
          {currentView !== AppView.DASHBOARD && (
            <button 
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Voltar ao Início</span>
            </button>
          )}
        </div>
      </header>
      
      <main className="flex-1 animate-fade-in">
        {renderView()}
      </main>
    </div>
  );
};

export default App;