import React from 'react';
import { CheckCircle2, XCircle, Sun, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { ImageQualityMetrics } from '@/types/patient';

interface FaceValidationIndicatorProps {
  metrics: ImageQualityMetrics | null;
}

export const FaceValidationIndicator: React.FC<FaceValidationIndicatorProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
        <Sparkles className="w-5 h-5 text-slate-400" />
        <span>Aguardando captura da foto para validação prévia de biometria...</span>
      </div>
    );
  }

  const {
    brightness,
    contrast,
    facesDetected,
    isValidBrightness,
    isValidContrast,
    isValidFaceCount,
    overallValid,
    issues,
  } = metrics;

  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-all ${
      overallValid
        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        : 'bg-amber-50/70 border-amber-200 text-amber-950'
    }`}>
      {/* Header Result */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {overallValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <h4 className="font-bold text-sm">
            {overallValid
              ? 'Validação Biométrica Prévia Aprovada'
              : 'Ajustes Necessários na Foto do Paciente'}
          </h4>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border text-center inline-flex items-center justify-center shrink-0 ${
          overallValid
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}>
          {overallValid ? 'Foto Pronta' : 'Atenção'}
        </span>
      </div>

      {/* Metrics Checklist Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Face Count */}
        <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
          isValidFaceCount ? 'bg-white border-emerald-200 text-slate-800' : 'bg-white border-red-200 text-red-900'
        }`}>
          <UserCheck className={`w-4 h-4 ${isValidFaceCount ? 'text-emerald-600' : 'text-red-500'}`} />
          <div className="flex-1">
            <div className="text-[11px] text-slate-500 font-normal">Detecção Facial</div>
            <div className="font-semibold">
              {facesDetected === 1 ? '1 Rosto Detectado' : `${facesDetected} Rostos Detectados`}
            </div>
          </div>
        </div>

        {/* 2. Brightness */}
        <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
          isValidBrightness ? 'bg-white border-emerald-200 text-slate-800' : 'bg-white border-amber-200 text-amber-900'
        }`}>
          <Sun className={`w-4 h-4 ${isValidBrightness ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div className="flex-1">
            <div className="text-[11px] text-slate-500 font-normal">Iluminação</div>
            <div className="font-semibold">{brightness} / 255 {isValidBrightness ? '(OK)' : '(Inadequada)'}</div>
          </div>
        </div>

        {/* 3. Nitidez / Blur */}
        <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
          isValidContrast ? 'bg-white border-emerald-200 text-slate-800' : 'bg-white border-amber-200 text-amber-900'
        }`}>
          <Sparkles className={`w-4 h-4 ${isValidContrast ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div className="flex-1">
            <div className="text-[11px] text-slate-500 font-normal">Nitidez/Contraste</div>
            <div className="font-semibold">Nível {contrast} {isValidContrast ? '(Focado)' : '(Borrado)'}</div>
          </div>
        </div>
      </div>

      {/* Issues list if any */}
      {issues.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-semibold text-amber-900">Recomendações para a recepção:</p>
          <ul className="space-y-1 text-xs">
            {issues.map((issue, idx) => (
              <li key={idx} className="flex items-start space-x-1.5 text-amber-800">
                <XCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
