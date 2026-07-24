import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CameraOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  User,
  RotateCcw,
} from 'lucide-react';
import {
  ImageQualityMetrics,
  FacialAngle,
  FacialAngleStep,
  CapturedPhotosMap,
} from '@/types/patient';
import { analyzeFacialImage } from '@/utils/imageAnalysis';

export const FACIAL_ANGLES: FacialAngleStep[] = [
  {
    id: 'frente',
    title: '1. Olhar de Frente',
    instruction: 'Mantenha a cabeça reta e olhe fixamente para a câmera',
    iconDirection: 'center',
  },
  {
    id: 'direita',
    title: '2. Vire para Direita',
    instruction: 'Vire levemente a cabeça para a DIREITA (ângulo de 45°)',
    iconDirection: 'right',
  },
  {
    id: 'esquerda',
    title: '3. Vire para Esquerda',
    instruction: 'Vire levemente a cabeça para a ESQUERDA (ângulo de 45°)',
    iconDirection: 'left',
  },
  {
    id: 'cima',
    title: '4. Olhe para Cima',
    instruction: 'Incline levemente o queixo para CIMA',
    iconDirection: 'up',
  },
  {
    id: 'baixo',
    title: '5. Olhe para Baixo',
    instruction: 'Incline levemente a cabeça para BAIXO',
    iconDirection: 'down',
  },
];

interface CameraCaptureProps {
  onCaptureAll: (photosMap: CapturedPhotosMap, mainMetrics: ImageQualityMetrics) => void;
  onResetAll?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCaptureAll,
  onResetAll,
  disabled = false,
  disabledReason = 'Aceite o termo LGPD para habilitar a câmera',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhotosMap>({});
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const currentStep = FACIAL_ANGLES[currentStepIndex];
  const completedCount = Object.keys(capturedPhotos).length;
  const isAllCaptured = completedCount === 5;

  // Inicia o fluxo da webcam
  const startCamera = useCallback(async () => {
    if (disabled) return;
    setIsInitializing(true);
    setCameraError(null);

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 960 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.error('Erro ao acessar webcam:', err);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Permissão da câmera negada no navegador. Habilite o acesso na barra de endereços.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('Nenhuma câmera foi encontrada no dispositivo.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError('A câmera já está sendo utilizada por outra aplicação.');
        } else {
          setCameraError(`Erro na câmera: ${err.message}`);
        }
      } else {
        setCameraError('Não foi possível conectar à webcam.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [disabled, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (!disabled && !isAllCaptured) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [disabled, isAllCaptured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Captura o frame para o ângulo atual
  const handleTakeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Espelhamento horizontal para visão natural
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const metrics = await analyzeFacialImage(canvas);

    const updatedPhotos: CapturedPhotosMap = {
      ...capturedPhotos,
      [currentStep.id]: {
        angle: currentStep.id,
        base64: dataUrl,
        metrics,
      },
    };

    setCapturedPhotos(updatedPhotos);
    setIsAnalyzing(false);

    // Se ainda há ângulos pendentes, avança automaticamente para o próximo
    if (currentStepIndex < 4) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (Object.keys(updatedPhotos).length === 5) {
      // Todas as 5 fotos foram capturadas!
      const frenteMetrics = updatedPhotos['frente']?.metrics || metrics;
      onCaptureAll(updatedPhotos, frenteMetrics);
    }
  };

  // Reiniciar a sequência completa
  const handleResetAll = () => {
    setCapturedPhotos({});
    setCurrentStepIndex(0);
    if (onResetAll) onResetAll();
    startCamera();
  };

  // Selecionar um ângulo específico para recapturar
  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    if (isAllCaptured) {
      startCamera();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col space-y-4">
      {/* Header com progresso dos 5 ângulos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-clinical-600" />
          <h3 className="font-bold text-slate-900 text-base">Captura Biométricas 5 Ângulos</h3>
        </div>

        <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
          isAllCaptured
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-clinical-50 text-clinical-800 border-clinical-200'
        }`}>
          {isAllCaptured ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>5 de 5 Concluídos</span>
            </>
          ) : (
            <span>Progresso: {completedCount}/5 Fotos</span>
          )}
        </span>
      </div>

      {/* Carrossel / Grade de status dos 5 Ângulos */}
      <div className="grid grid-cols-5 gap-2">
        {FACIAL_ANGLES.map((angleStep, idx) => {
          const captured = capturedPhotos[angleStep.id];
          const isCurrent = idx === currentStepIndex && !isAllCaptured;

          return (
            <button
              key={angleStep.id}
              type="button"
              onClick={() => handleSelectStep(idx)}
              className={`relative rounded-xl p-2 text-center transition-all flex flex-col items-center border ${
                isCurrent
                  ? 'bg-clinical-50 border-clinical-500 ring-2 ring-clinical-400/40 shadow-sm'
                  : captured
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {captured ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-300 relative mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={captured.base64} alt={angleStep.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                  </div>
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 text-xs font-bold ${
                  isCurrent ? 'bg-clinical-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx + 1}
                </div>
              )}

              <span className="text-[11px] font-semibold tracking-tight truncate w-full">
                {angleStep.id.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Frame Principal da Câmera / Preview */}
      <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
        
        {/* Desabilitado por LGPD */}
        {disabled && (
          <div className="p-6 text-center space-y-3 max-w-md">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto border border-slate-700">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">{disabledReason}</p>
          </div>
        )}

        {/* Erro de Câmera */}
        {!disabled && cameraError && (
          <div className="p-6 text-center space-y-4 max-w-md">
            <div className="w-14 h-14 rounded-full bg-red-950/80 text-red-400 flex items-center justify-center mx-auto border border-red-800">
              <CameraOff className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Câmera Indisponível</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        {/* Câmera Ao Vivo com Orientação Direcional Visual */}
        {!disabled && !cameraError && !isAllCaptured && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Overlay com Setas de Orientação */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Badge com a instrução do ângulo atual */}
              <div className="bg-slate-900/90 text-white px-4 py-2 rounded-full border border-slate-700 text-xs font-bold shadow-lg flex items-center space-x-2 mb-3 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-clinical-400" />
                <span>{currentStep.title}: {currentStep.instruction}</span>
              </div>

              {/* Moldura de Enquadramento 4:3 Retangular com Cantos Arredondados */}
              <div className="relative w-64 sm:w-80 aspect-[4/3] border-2 border-dashed border-clinical-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] flex flex-col items-center justify-center">
                
                {/* Seta Direcional Animada Conforme o Ângulo Exigido */}
                {currentStep.iconDirection === 'center' && (
                  <User className="w-12 h-12 text-clinical-400 opacity-60 animate-pulse" />
                )}

                {currentStep.iconDirection === 'right' && (
                  <div className="flex items-center space-x-2 text-clinical-400 animate-bounce">
                    <span className="text-xs font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">Vire →</span>
                    <ArrowRight className="w-10 h-10" />
                  </div>
                )}

                {currentStep.iconDirection === 'left' && (
                  <div className="flex items-center space-x-2 text-clinical-400 animate-bounce">
                    <ArrowLeft className="w-10 h-10" />
                    <span className="text-xs font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">← Vire</span>
                  </div>
                )}

                {currentStep.iconDirection === 'up' && (
                  <div className="flex flex-col items-center space-y-1 text-clinical-400 animate-bounce">
                    <ArrowUp className="w-10 h-10" />
                    <span className="text-xs font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">Para Cima ↑</span>
                  </div>
                )}

                {currentStep.iconDirection === 'down' && (
                  <div className="flex flex-col items-center space-y-1 text-clinical-400 animate-bounce">
                    <span className="text-xs font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">Para Baixo ↓</span>
                    <ArrowDown className="w-10 h-10" />
                  </div>
                )}
              </div>
            </div>

            {isInitializing && (
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-clinical-400" />
                <span>Iniciando câmera...</span>
              </div>
            )}
          </>
        )}

        {/* Visão Final: Todas as 5 fotos foram capturadas */}
        {isAllCaptured && (
          <div className="w-full h-full bg-slate-950 p-4 flex flex-col items-center justify-center space-y-3">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                ✓ 5 Fotos Biométricas Capturadas com Sucesso
              </span>
              <p className="text-xs text-slate-400">
                Você pode clicar em qualquer foto acima para recapturá-la individualmente.
              </p>
            </div>

            {/* Grid dos 5 previews capturados */}
            <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
              {FACIAL_ANGLES.map((step) => {
                const item = capturedPhotos[step.id];
                if (!item) return null;
                return (
                  <div key={step.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.base64} alt={step.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[9px] text-center font-bold uppercase py-0.5">
                      {step.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-1">
        {!isAllCaptured ? (
          <button
            type="button"
            disabled={disabled || !!cameraError || isInitializing || isAnalyzing}
            onClick={handleTakeSnapshot}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              disabled || !!cameraError || isInitializing || isAnalyzing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/25 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando foto...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Capturar Foto ({currentStepIndex + 1}/5: {currentStep.id.toUpperCase()})</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-3 w-full">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>Recapturar Todas as 5 Fotos</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
