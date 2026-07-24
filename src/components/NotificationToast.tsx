import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | null;
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  message,
  onClose,
  duration = 6000,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message || !type) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slideUp">
      <div className={`rounded-2xl p-4 shadow-2xl border flex items-start space-x-3 backdrop-blur-md ${
        isSuccess
          ? 'bg-emerald-900/95 text-white border-emerald-700 shadow-emerald-900/30'
          : 'bg-red-900/95 text-white border-red-700 shadow-red-900/30'
      }`}>
        <div className={`p-2 rounded-xl flex-shrink-0 ${
          isSuccess ? 'bg-emerald-800 text-emerald-300' : 'bg-red-800 text-red-300'
        }`}>
          {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>

        <div className="flex-1 text-sm font-medium leading-snug">
          <div className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-80">
            {isSuccess ? 'Sucesso' : 'Atenção / Erro'}
          </div>
          <p>{message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
