import React, { useState } from 'react';
import { User, CreditCard, Calendar, Phone, ShieldCheck, Send, CheckCircle2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { PatientFormData, LgpdConsent, ImageQualityMetrics, CapturedPhotosMap, FacialAngle } from '@/types/patient';
import { formatCPF, validateCPF } from '@/utils/cpfValidation';
import { formatPhone, validatePhone } from '@/utils/phoneValidation';
import { CameraCaptureModal } from './CameraCaptureModal';
import { FaceValidationIndicator } from './FaceValidationIndicator';
import { dataURItoBlob } from '@/utils/imageAnalysis';

interface PatientFormProps {
  lgpdConsent: LgpdConsent;
  onOpenLgpdModal: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  lgpdConsent,
  onOpenLgpdModal,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    nomeCompleto: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
  });

  const [cpfTouched, setCpfTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [capturedPhotosMap, setCapturedPhotosMap] = useState<CapturedPhotosMap>({});
  const [imageMetrics, setImageMetrics] = useState<ImageQualityMetrics | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData((prev) => ({ ...prev, cpf: formatted }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, telefone: formatted }));
  };

  // Validações dos campos
  const isCpfValid = validateCPF(formData.cpf);
  const isPhoneValid = validatePhone(formData.telefone);
  const isNameValid = formData.nomeCompleto.trim().length >= 3;
  const isDobValid = !!formData.dataNascimento;
  const isAllPhotosCaptured = Object.keys(capturedPhotosMap).length === 5;

  const isPatientDataComplete = isNameValid && isCpfValid && isPhoneValid && isDobValid;
  const isCameraEnabled = isPatientDataComplete && lgpdConsent.accepted;

  let cameraDisabledReason = '';
  if (!isPatientDataComplete && !lgpdConsent.accepted) {
    cameraDisabledReason = 'Preencha os dados cadastrais (Nome, CPF válido, Data Nasc. e Telefone) e aceite o termo LGPD para ativar a câmera.';
  } else if (!isPatientDataComplete) {
    cameraDisabledReason = 'Preencha todos os dados cadastrais (Nome, CPF válido, Data Nasc. e Telefone) para ativar a câmera.';
  } else if (!lgpdConsent.accepted) {
    cameraDisabledReason = 'Aceite o termo LGPD abaixo para ativar a câmera da recepção.';
  }

  const isFormValid =
    isPatientDataComplete &&
    lgpdConsent.accepted &&
    isAllPhotosCaptured &&
    (imageMetrics?.overallValid ?? true);

  // Submissão do formulário via multipart/form-data com as 5 fotos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !isAllPhotosCaptured) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nomeCompleto', formData.nomeCompleto.trim());
      formDataToSend.append('cpf', formData.cpf);
      formDataToSend.append('dataNascimento', formData.dataNascimento);
      formDataToSend.append('telefone', formData.telefone);
      formDataToSend.append('consentTimestamp', lgpdConsent.timestamp || new Date().toISOString());

      const angles: FacialAngle[] = ['frente', 'direita', 'esquerda', 'cima', 'baixo'];
      const cleanCpfNum = formData.cpf.replace(/\D/g, '');

      angles.forEach((angle) => {
        const photoData = capturedPhotosMap[angle];
        if (photoData) {
          const blob = dataURItoBlob(photoData.base64);
          formDataToSend.append(`foto_${angle}`, blob, `paciente_${cleanCpfNum}_${angle}.jpg`);
        }
      });

      if (capturedPhotosMap['frente']) {
        const mainBlob = dataURItoBlob(capturedPhotosMap['frente'].base64);
        formDataToSend.append('fotoBiometrica', mainBlob, `paciente_${cleanCpfNum}_frente.jpg`);
      }

      const response = await fetch('/api/pacientes/cadastro', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.mensagem || 'Erro ao realizar cadastro do paciente.');
      }

      onSuccess(`Paciente ${formData.nomeCompleto} cadastrado com sucesso! Biometria facial registrada.`);
      
      setFormData({
        nomeCompleto: '',
        cpf: '',
        dataNascimento: '',
        telefone: '',
      });
      setCpfTouched(false);
      setPhoneTouched(false);
      setCapturedPhotosMap({});
      setImageMetrics(null);
    } catch (err: unknown) {
      console.error('Erro de rede/servidor:', err);
      const msg = err instanceof Error ? err.message : 'Ocorreu uma falha na conexão com o servidor do laboratório.';
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna da Esquerda (Dados do Paciente + LGPD) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-clinical-600" />
                <h3 className="font-bold text-slate-900 text-base">Dados Cadastrais do Paciente</h3>
              </div>

              {/* 1. Nome Completo */}
              <div className="space-y-1.5">
                <label htmlFor="nomeCompleto" className="block text-xs font-semibold text-slate-700">
                  Nome Completo do Paciente *
                </label>
                <div className="relative">
                  <input
                    id="nomeCompleto"
                    type="text"
                    required
                    placeholder="Ex: Maria Silva Santos"
                    value={formData.nomeCompleto}
                    onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinical-500 focus:bg-white focus:outline-none transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* 2. CPF com Máscara e Validação de DV */}
              <div className="space-y-1.5">
                <label htmlFor="cpf" className="block text-xs font-semibold text-slate-700">
                  CPF *
                </label>
                <div className="relative">
                  <input
                    id="cpf"
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    onBlur={() => setCpfTouched(true)}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:outline-none transition ${
                      cpfTouched && !isCpfValid
                        ? 'border-red-400 bg-red-50/50 focus:ring-red-400'
                        : 'border-slate-300 focus:ring-clinical-500 focus:bg-white'
                    }`}
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  {cpfTouched && (
                    <div className="absolute right-3 top-3">
                      {isCpfValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {cpfTouched && !isCpfValid && (
                  <p className="text-xs text-red-600 font-medium">CPF inválido. Verifique os dígitos informados.</p>
                )}
              </div>

              {/* 3. Data de Nascimento e Telefone (Responsivo para Celular) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label htmlFor="dataNascimento" className="block text-xs font-semibold text-slate-700">
                    Data de Nascimento *
                  </label>
                  <div className="relative">
                    <input
                      id="dataNascimento"
                      type="date"
                      required
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      className="w-full max-w-full min-w-0 pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-clinical-500 focus:bg-white focus:outline-none transition"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label htmlFor="telefone" className="block text-xs font-semibold text-slate-700">
                    Telefone / Celular *
                  </label>
                  <div className="relative">
                    <input
                      id="telefone"
                      type="text"
                      required
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={handlePhoneChange}
                      onBlur={() => setPhoneTouched(true)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:outline-none transition ${
                        phoneTouched && !isPhoneValid
                          ? 'border-red-400 bg-red-50/50 focus:ring-red-400'
                          : 'border-slate-300 focus:ring-clinical-500 focus:bg-white'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  {phoneTouched && !isPhoneValid && (
                    <p className="text-xs text-red-600 font-medium">Informe um telefone com DDD válido.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Banner de Aceite LGPD */}
            <div className={`rounded-2xl border p-5 transition-all ${
              lgpdConsent.accepted
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-amber-50/80 border-amber-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className={`w-5 h-5 mt-0.5 ${
                    lgpdConsent.accepted ? 'text-emerald-600' : 'text-amber-600'
                  }`} />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Consentimento LGPD para Biometria Facial
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {lgpdConsent.accepted
                        ? `Aceito e registrado em ${new Date(lgpdConsent.timestamp!).toLocaleString('pt-BR')}`
                        : 'Obrigatório o aceite antes de realizar a captura de foto.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenLgpdModal}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    lgpdConsent.accepted
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                  }`}
                >
                  {lgpdConsent.accepted ? 'Revisar Aceite' : 'Abrir Termo LGPD'}
                </button>
              </div>
            </div>
          </div>

          {/* Coluna da Direita (Card da Câmera + Botão de Modal) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-clinical-600" />
                  <h3 className="font-bold text-slate-900 text-base">Biometria Facial (5 Ângulos)</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isAllPhotosCaptured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isAllPhotosCaptured ? '5 de 5 Fotos Capturadas' : 'Pendente'}
                </span>
              </div>

              {!isAllPhotosCaptured ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-clinical-100 text-clinical-700 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Captura de 5 Fotos Biométricas</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {isCameraEnabled
                        ? 'Clique no botão abaixo para abrir a câmera em modo modal e registrar a biometria.'
                        : cameraDisabledReason}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!isCameraEnabled}
                    onClick={() => setIsCameraModalOpen(true)}
                    className={`w-full sm:w-auto flex items-center justify-center space-x-2 mx-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                      isCameraEnabled
                        ? 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/25 active:scale-[0.99]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Abrir Câmera para Biometria</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grid das 5 fotos já capturadas */}
                  <div className="grid grid-cols-5 gap-2">
                    {(['frente', 'direita', 'esquerda', 'cima', 'baixo'] as FacialAngle[]).map((angle) => {
                      const photo = capturedPhotosMap[angle];
                      if (!photo) return null;
                      return (
                        <div key={angle} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.base64} alt={angle} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[9px] text-center font-bold uppercase py-0.5">
                            {angle}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-600" />
                    <span>Recapturar / Editar Fotos Biométricas</span>
                  </button>
                </div>
              )}
            </div>

            <FaceValidationIndicator metrics={imageMetrics} />
          </div>
        </div>

        {/* Botão Principal de Confirmação (Ajustado e Responsivo) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 shadow-sm">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            * Todos os campos e a foto biométrica são obrigatórios.
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
              isFormValid && !isSubmitting
                ? 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/30 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <span>Enviando...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirmar e Cadastrar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal da Câmera */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        initialPhotosMap={capturedPhotosMap}
        onCaptureAll={(photosMap, metrics) => {
          setCapturedPhotosMap(photosMap);
          setImageMetrics(metrics);
        }}
      />
    </>
  );
};
