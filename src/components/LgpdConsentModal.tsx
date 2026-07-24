import React, { useState } from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LgpdConsent } from '@/types/patient';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onAccept: (consent: LgpdConsent) => void;
  onCancel?: () => void;
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({
  isOpen,
  onAccept,
  onCancel,
}) => {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!checked) return;
    onAccept({
      accepted: true,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-cedro-950 text-white p-6 flex items-center space-x-3">
          <div className="p-3 bg-clinical-600/30 rounded-xl text-clinical-400 border border-clinical-500/30">
            <ShieldCheck className="w-6 h-6 text-clinical-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Termo de Consentimento LGPD</h2>
            <p className="text-xs text-slate-400">Tratamento de Dados Biométricos Sensíveis (Lei nº 13.709/2018)</p>
          </div>
        </div>

        {/* Scrollable Terms Text */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed bg-slate-50/50 flex-1">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-900 text-xs font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Atenção Atendente da Recepção:</strong> De acordo com os Artigos 7º e 11º da LGPD, a coleta e processamento da biometria facial do paciente exigem o consentimento livre, informado e inequívoco. Apresente este documento ao paciente antes da captura da foto.
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 font-semibold text-slate-900 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-clinical-600" />
              <span>Finalidade do Tratamento Biométrico</span>
            </div>
            <p>
              Os dados biométricos faciais coletados serão utilizados <strong>exclusivamente para a identificação segura e confirmação de identidade do paciente</strong> no momento da realização de exames clínicos, prevencao de fraudes e garantia da segurança em prontuários laboratoriais.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 font-semibold text-slate-900 border-b border-slate-100 pb-2">
              <Lock className="w-4 h-4 text-clinical-600" />
              <span>Segurança e Armazenamento</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600">
              <li>Dados armazenados em servidores seguros com criptografia de ponta a ponta.</li>
              <li>Uso estritamente interno na recepção e laboratório clínico, sem compartilhamento com terceiros não autorizados.</li>
              <li>O paciente pode solicitar a revogação do consentimento ou exclusão de acordo com as diretrizes regulatórias da ANVISA/LGPD.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer / Action */}
        <div className="p-6 bg-white border-t border-slate-200 space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 w-5 h-5 text-clinical-600 border-slate-300 rounded focus:ring-clinical-500 transition cursor-pointer"
            />
            <span className="text-xs text-slate-800 font-medium leading-tight group-hover:text-slate-900">
              O paciente leu, compreendeu e concorda expressamente com a coleta e tratamento da sua foto e biometria facial para fins laboratoriais.
            </span>
          </label>

          <div className="flex items-center justify-end space-x-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-sm transition"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              disabled={!checked}
              onClick={handleConfirm}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
                checked
                  ? 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Consentimento e Liberar Captura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
