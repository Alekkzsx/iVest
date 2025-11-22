import React from 'react';
import { BookOpen, PenTool, Brain, Calculator, TrendingUp } from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao VestiBot</h1>
        <p className="text-gray-600 mt-2">Seu assistente pessoal para conquistar a vaga na universidade.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <button 
          onClick={() => onChangeView(AppView.PLAN)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <BookOpen size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">Plano de Estudos</h3>
          <p className="text-sm text-gray-500 mt-1">Gere um cronograma personalizado baseado no seu tempo.</p>
        </button>

        <button 
          onClick={() => onChangeView(AppView.QUIZ)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Brain size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">Simulados & Questões</h3>
          <p className="text-sm text-gray-500 mt-1">Pratique com questões estilo ENEM e FUVEST geradas por IA.</p>
        </button>

        <button 
          onClick={() => onChangeView(AppView.ESSAY)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="bg-rose-100 w-12 h-12 rounded-lg flex items-center justify-center text-rose-600 mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <PenTool size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">Corretor de Redação</h3>
          <p className="text-sm text-gray-500 mt-1">Receba feedback detalhado e nota baseada nas competências.</p>
        </button>

        <button 
          onClick={() => onChangeView(AppView.TUTOR)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Calculator size={24} />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">Tutor Virtual</h3>
          <p className="text-sm text-gray-500 mt-1">Tire dúvidas de qualquer matéria instantaneamente.</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600"/>
            Dicas do Dia
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
             <h4 className="font-bold text-blue-800">Matemática</h4>
             <p className="text-sm text-blue-600 mt-1">Revise Regra de Três e Porcentagem. São 15% da prova do ENEM.</p>
           </div>
           <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
             <h4 className="font-bold text-green-800">Redação</h4>
             <p className="text-sm text-green-600 mt-1">Use repertórios socioculturais legítimos para garantir 200 pontos na C2.</p>
           </div>
           <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
             <h4 className="font-bold text-purple-800">Bem-estar</h4>
             <p className="text-sm text-purple-600 mt-1">Pausas de 10 minutos a cada 50 minutos de estudo aumentam a retenção.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;