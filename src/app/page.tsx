'use client';

import React, { useState } from 'react';
import { TabMode, LgpdConsent } from '@/types/patient';
import { Header } from '@/components/Header';
import { PatientForm } from '@/components/PatientForm';
import { RecadastroForm } from '@/components/RecadastroForm';
import { LgpdConsentModal } from '@/components/LgpdConsentModal';
import { NotificationToast } from '@/components/NotificationToast';
import { ShieldCheck, Info } from 'lucide-react';

export default function ReceptionDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabMode>('cadastro');

  // Estado do consentimento LGPD mantido estritamente em memória do componente (sem localStorage)
  const [lgpdConsent, setLgpdConsent] = useState<LgpdConsent>({
    accepted: false,
    timestamp: null,
  });

  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState<boolean>(false);

  // Sistema de Notificações Toast para o atendente
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({
    type: null,
    message: null,
  });

  const showSuccess = (message: string) => {
    setToast({ type: 'success', message });
  };

  const showError = (message: string) => {
    setToast({ type: 'error', message });
  };

  const handleAcceptLgpd = (consent: LgpdConsent) => {
    setLgpdConsent(consent);
    setIsLgpdModalOpen(false);
    showSuccess('Termo LGPD aceito com sucesso! Câmera liberada para captura.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Cabeçalho da Recepção */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        lgpdAccepted={lgpdConsent.accepted}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner Informativo para a Recepção */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3 text-xs text-slate-600">
            <Info className="w-5 h-5 text-clinical-600 flex-shrink-0" />
            <span>
              <strong>Orientação ao Atendente:</strong> Certifique-se de posicionar o paciente centralizado na moldura da câmera com boa luz ambiente. Os dados biométricos não são salvos em navegadores locais.
            </span>
          </div>

          {!lgpdConsent.accepted && (
            <button
              type="button"
              onClick={() => setIsLgpdModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex-shrink-0 w-full sm:w-auto justify-center"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Coletar Aceite LGPD</span>
            </button>
          )}
        </div>

        {/* Alternância de Abas: Novo Cadastro vs Recadastro */}
        {activeTab === 'cadastro' ? (
          <PatientForm
            lgpdConsent={lgpdConsent}
            onOpenLgpdModal={() => setIsLgpdModalOpen(true)}
            onSuccess={showSuccess}
            onError={showError}
          />
        ) : (
          <RecadastroForm
            lgpdConsent={lgpdConsent}
            onOpenLgpdModal={() => setIsLgpdModalOpen(true)}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}
      </main>

      {/* Footer da Aplicação Interna */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        CedroID &copy; {new Date().getFullYear()} &bull; Módulo Interno de Recepção &bull; Conformidade LGPD Art. 7º e 11º
      </footer>

      {/* Modal Termo de Consentimento LGPD */}
      <LgpdConsentModal
        isOpen={isLgpdModalOpen}
        onAccept={handleAcceptLgpd}
        onCancel={() => setIsLgpdModalOpen(false)}
      />

      {/* Toast Feedback */}
      <NotificationToast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: null, message: null })}
      />
    </div>
  );
}
