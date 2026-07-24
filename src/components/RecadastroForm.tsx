import React, { useState } from 'react';
import { Search, UserCheck, RefreshCw, CreditCard, User, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { PatientRecord, ImageQualityMetrics, LgpdConsent, CapturedPhotosMap, FacialAngle } from '@/types/patient';
import { formatCPF, validateCPF, cleanCPF } from '@/utils/cpfValidation';
import { formatPhone, validatePhone } from '@/utils/phoneValidation';
import { CameraCapture } from './CameraCapture';
import { FaceValidationIndicator } from './FaceValidationIndicator';
import { dataURItoBlob } from '@/utils/imageAnalysis';

interface RecadastroFormProps {
  lgpdConsent: LgpdConsent;
  onOpenLgpdModal: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const RecadastroForm: React.FC<RecadastroFormProps> = ({
  lgpdConsent,
  onOpenLgpdModal,
  onSuccess,
  onError,
}) => {
  const [searchCpf, setSearchCpf] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Formulário de edição
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');

  // Captura de novas fotos 5 ângulos
  const [isReplacingPhoto, setIsReplacingPhoto] = useState(false);
  const [capturedPhotosMap, setCapturedPhotosMap] = useState<CapturedPhotosMap>({});
  const [imageMetrics, setImageMetrics] = useState<ImageQualityMetrics | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCpf(formatCPF(e.target.value));
  };

  // Busca paciente existente por CPF na API
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = cleanCPF(searchCpf);
    if (!validateCPF(searchCpf)) {
      onError('Por favor, informe um CPF válido para buscar o paciente.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setPatientRecord(null);

    try {
      const response = await fetch(`/api/pacientes/buscar?cpf=${encodeURIComponent(clean)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensagem || 'Paciente não encontrado no cadastro do laboratório.');
      }

      setPatientRecord(data.paciente);
      setNomeCompleto(data.paciente.nomeCompleto);
      setDataNascimento(data.paciente.dataNascimento);
      setTelefone(formatPhone(data.paciente.telefone));
      setCapturedPhotosMap({});
      setImageMetrics(null);
      setIsReplacingPhoto(false);
    } catch (err: unknown) {
      console.error('Erro na busca de paciente:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao buscar paciente.';
      onError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const isAllPhotosCaptured = Object.keys(capturedPhotosMap).length === 5;
  const isPatientDataComplete =
    !!patientRecord &&
    validateCPF(searchCpf) &&
    nomeCompleto.trim().length >= 3 &&
    validatePhone(telefone) &&
    !!dataNascimento;

  const isCameraEnabled = isPatientDataComplete && lgpdConsent.accepted;

  let cameraDisabledReason = '';
  if (!isPatientDataComplete && !lgpdConsent.accepted) {
    cameraDisabledReason = 'Busque um paciente válido e aceite o termo LGPD para ativar a câmera.';
  } else if (!isPatientDataComplete) {
    cameraDisabledReason = 'Confirme o preenchimento de todos os dados do paciente para ativar a câmera.';
  } else if (!lgpdConsent.accepted) {
    cameraDisabledReason = 'Aceite o termo LGPD para habilitar a captura da nova foto.';
  }

  const isFormValid =
    isPatientDataComplete &&
    lgpdConsent.accepted &&
    (!isReplacingPhoto || (isAllPhotosCaptured && (imageMetrics?.overallValid ?? true)));

  // Atualização do recadastro
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !patientRecord) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id', patientRecord.id);
      formDataToSend.append('nomeCompleto', nomeCompleto.trim());
      formDataToSend.append('cpf', searchCpf);
      formDataToSend.append('dataNascimento', dataNascimento);
      formDataToSend.append('telefone', telefone);
      formDataToSend.append('consentTimestamp', lgpdConsent.timestamp || new Date().toISOString());

      if (isReplacingPhoto && isAllPhotosCaptured) {
        const angles: FacialAngle[] = ['frente', 'direita', 'esquerda', 'cima', 'baixo'];
        angles.forEach((angle) => {
          const photoData = capturedPhotosMap[angle];
          if (photoData) {
            const blob = dataURItoBlob(photoData.base64);
            formDataToSend.append(`foto_${angle}`, blob, `recadastro_${patientRecord.id}_${angle}.jpg`);
          }
        });
      }

      const response = await fetch('/api/pacientes/cadastro', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.mensagem || 'Erro ao atualizar recadastro do paciente.');
      }

      onSuccess(`Recadastro e biometria do paciente ${nomeCompleto} atualizados com sucesso!`);
      
      // Resetar estado
      setPatientRecord(null);
      setHasSearched(false);
      setSearchCpf('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao recadastrar paciente.';
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Box de Busca por CPF */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Search className="w-5 h-5 text-clinical-600" />
          <h3 className="font-bold text-slate-900 text-base">Buscar Paciente para Recadastro</h3>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Digite o CPF do paciente (000.000.000-00)"
              value={searchCpf}
              onChange={handleSearchCpfChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinical-500 focus:bg-white focus:outline-none transition"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={isSearching || !validateCPF(searchCpf)}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              validateCPF(searchCpf) && !isSearching
                ? 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Buscar Prontuário</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Resultado da Busca: Se encontrado */}
      {patientRecord && (
        <form onSubmit={handleUpdate} className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Esquerda: Dados do Paciente Existente */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-base">Prontuário Encontrado</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono">
                    ID: {patientRecord.id}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Nome Completo */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Nome Completo</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinical-500 focus:outline-none"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Data de Nascimento e Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Data de Nascimento</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinical-500 focus:outline-none"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Telefone / Celular</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={telefone}
                          onChange={(e) => setTelefone(formatPhone(e.target.value))}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinical-500 focus:outline-none"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Foto Cadastrada Atual vs Novas Fotos */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Fotos Biométricas do Paciente</h4>
                  <button
                    type="button"
                    onClick={() => setIsReplacingPhoto(!isReplacingPhoto)}
                    className="text-xs font-semibold text-clinical-600 hover:text-clinical-800 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isReplacingPhoto ? 'Manter Foto Atual' : 'Substituir por 5 Novas Fotos'}</span>
                  </button>
                </div>

                {!isReplacingPhoto ? (
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex-shrink-0 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={patientRecord.fotoBiometricaUrl}
                        alt="Foto Atual do Paciente"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-slate-600 space-y-2">
                      <p>Foto cadastrada em <strong>{new Date(patientRecord.atualizadoEm).toLocaleDateString('pt-BR')}</strong>.</p>
                      <p className="text-slate-500 leading-relaxed">
                        Clique em <strong>Substituir por 5 Novas Fotos</strong> para recapturar o conjunto biométrico de 5 ângulos (Frente, Direita, Esquerda, Cima, Baixo).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CameraCapture
                      disabled={!isCameraEnabled}
                      disabledReason={cameraDisabledReason}
                      onCaptureAll={(photosMap, metrics) => {
                        setCapturedPhotosMap(photosMap);
                        setImageMetrics(metrics);
                      }}
                      onResetAll={() => {
                        setCapturedPhotosMap({});
                        setImageMetrics(null);
                      }}
                    />
                    <FaceValidationIndicator metrics={imageMetrics} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botão de Envio de Recadastro */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-end shadow-sm">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                isFormValid && !isSubmitting
                  ? 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <span>Atualizando Recadastro...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Salvar Recadastro de Paciente</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {hasSearched && !patientRecord && !isSearching && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h4 className="font-bold text-amber-900 text-base">Nenhum Paciente Encontrado</h4>
          <p className="text-xs text-amber-800">
            Não encontramos nenhum registro ativo para o CPF <strong>{searchCpf}</strong>. Utilize a aba &quot;Novo Cadastro&quot; para registrar o paciente pela primeira vez.
          </p>
        </div>
      )}
    </div>
  );
};
