import React from 'react';
import { TabMode } from '@/types/patient';
import { UserPlus, UserCheck, ShieldCheck, TreeDeciduous } from 'lucide-react';

interface HeaderProps {
  activeTab: TabMode;
  onTabChange: (tab: TabMode) => void;
  lgpdAccepted: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, lgpdAccepted }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        
        {/* Brand & Context */}
        <div className="flex items-center justify-between w-full sm:w-auto space-x-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-clinical-600 text-white flex items-center justify-center shadow-md shadow-clinical-600/25 flex-shrink-0">
              <TreeDeciduous className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">CedroID</h1>
                <span className="bg-clinical-100 text-clinical-800 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-clinical-200">
                  Recepção Interna
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Biometria Facial para Laboratório Clínico</p>
            </div>
          </div>

          {/* Badge LGPD no Mobile */}
          <div className="sm:hidden flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <ShieldCheck className={`w-3.5 h-3.5 ${lgpdAccepted ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span className={lgpdAccepted ? 'text-emerald-700' : 'text-amber-600'}>
              {lgpdAccepted ? 'LGPD OK' : 'LGPD Pendente'}
            </span>
          </div>
        </div>

        {/* Tab Selection (Adaptado com flex-1 no Celular) */}
        <div className="w-full sm:w-auto flex items-center space-x-1.5 sm:space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onTabChange('cadastro')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
              activeTab === 'cadastro'
                ? 'bg-white text-clinical-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cadastro</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('recadastro')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
              activeTab === 'recadastro'
                ? 'bg-white text-clinical-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Recadastro</span>
          </button>
        </div>

        {/* Status LGPD no Desktop */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <ShieldCheck className={`w-4 h-4 ${lgpdAccepted ? 'text-emerald-600' : 'text-amber-500'}`} />
          <span className="text-slate-600">
            LGPD: <strong className={lgpdAccepted ? 'text-emerald-700' : 'text-amber-600'}>
              {lgpdAccepted ? 'Consentimento Ativo' : 'Pendente Aceite'}
            </strong>
          </span>
        </div>
      </div>
    </header>
  );
};
