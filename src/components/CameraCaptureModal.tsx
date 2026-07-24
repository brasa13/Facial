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
  X,
  Check,
} from 'lucide-react';
import {
  ImageQualityMetrics,
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
    instruction: 'Vire levemente a cabeça para a DIREITA (45°)',
    iconDirection: 'right',
  },
  {
    id: 'esquerda',
    title: '3. Vire para Esquerda',
    instruction: 'Vire levemente a cabeça para a ESQUERDA (45°)',
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

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureAll: (photosMap: CapturedPhotosMap, mainMetrics: ImageQualityMetrics) => void;
  initialPhotosMap?: CapturedPhotosMap;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureAll,
  initialPhotosMap = {},
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhotosMap>(initialPhotosMap);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhotos(initialPhotosMap);
      setCurrentStepIndex(0);
    }
  }, [isOpen, initialPhotosMap]);

  const currentStep = FACIAL_ANGLES[currentStepIndex];
  const completedCount = Object.keys(capturedPhotos).length;
  const isAllCaptured = completedCount === 5;

  // Inicia webcam
  const startCamera = useCallback(async () => {
    if (!isOpen) return;
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
          setCameraError('Permissão da câmera negada no navegador. Permita o acesso para continuar.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('Nenhuma câmera foi encontrada no dispositivo.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError('A câmera já está sendo utilizada por outro programa.');
        } else {
          setCameraError(`Erro na câmera: ${err.message}`);
        }
      } else {
        setCameraError('Não foi possível conectar à webcam.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [isOpen, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !isAllCaptured) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, isAllCaptured]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // Captura o frame
  const handleTakeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    if (currentStepIndex < 4) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleConfirmAndClose = () => {
    const frenteMetrics = capturedPhotos['frente']?.metrics || {
      brightness: 120,
      contrast: 30,
      facesDetected: 1,
      isValidBrightness: true,
      isValidContrast: true,
      isValidFaceCount: true,
      overallValid: true,
      issues: [],
    };
    onCaptureAll(capturedPhotos, frenteMetrics);
    stopCamera();
    onClose();
  };

  const handleResetAll = () => {
    setCapturedPhotos({});
    setCurrentStepIndex(0);
    startCamera();
  };

  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    if (isAllCaptured) {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-cedro-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-clinical-600/30 rounded-lg text-clinical-400 border border-clinical-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Captura Biometria Facial</h3>
              <p className="text-[11px] sm:text-xs text-slate-300">Seqüência de 5 Ângulos (CedroID)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {/* Carrossel de 5 Ângulos */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {FACIAL_ANGLES.map((angleStep, idx) => {
              const captured = capturedPhotos[angleStep.id];
              const isCurrent = idx === currentStepIndex && !isAllCaptured;

              return (
                <button
                  key={angleStep.id}
                  type="button"
                  onClick={() => handleSelectStep(idx)}
                  className={`relative rounded-xl p-1.5 sm:p-2 text-center transition-all flex flex-col items-center border ${
                    isCurrent
                      ? 'bg-clinical-50 border-clinical-500 ring-2 ring-clinical-400/40 shadow-sm'
                      : captured
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {captured ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-emerald-300 relative mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={captured.base64} alt={angleStep.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1 text-xs font-bold ${
                      isCurrent ? 'bg-clinical-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>
                  )}

                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full">
                    {angleStep.id.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Viewport 4:3 da Câmera */}
          <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
            {cameraError && (
              <div className="p-6 text-center space-y-3 max-w-md">
                <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 flex items-center justify-center mx-auto border border-red-800">
                  <CameraOff className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {!cameraError && !isAllCaptured && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3">
                  <div className="bg-slate-900/90 text-white px-3 sm:px-4 py-1.5 rounded-full border border-slate-700 text-[11px] sm:text-xs font-bold shadow-lg flex items-center space-x-1.5 mb-2 backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-clinical-400" />
                    <span>{currentStep.title}: {currentStep.instruction}</span>
                  </div>

                  <div className="relative w-52 sm:w-72 aspect-[4/3] border-2 border-dashed border-clinical-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] flex flex-col items-center justify-center">
                    {currentStep.iconDirection === 'center' && (
                      <User className="w-10 h-10 text-clinical-400 opacity-60 animate-pulse" />
                    )}

                    {currentStep.iconDirection === 'right' && (
                      <div className="flex items-center space-x-1.5 text-clinical-400 animate-bounce">
                        <span className="text-[10px] font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">Vire →</span>
                        <ArrowRight className="w-8 h-8" />
                      </div>
                    )}

                    {currentStep.iconDirection === 'left' && (
                      <div className="flex items-center space-x-1.5 text-clinical-400 animate-bounce">
                        <ArrowLeft className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">← Vire</span>
                      </div>
                    )}

                    {currentStep.iconDirection === 'up' && (
                      <div className="flex flex-col items-center space-y-1 text-clinical-400 animate-bounce">
                        <ArrowUp className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">Para Cima ↑</span>
                      </div>
                    )}

                    {currentStep.iconDirection === 'down' && (
                      <div className="flex flex-col items-center space-y-1 text-clinical-400 animate-bounce">
                        <span className="text-[10px] font-bold uppercase bg-slate-900/80 px-2 py-0.5 rounded">Para Baixo ↓</span>
                        <ArrowDown className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {isInitializing && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-clinical-400" />
                    <span>Conectando câmera...</span>
                  </div>
                )}
              </>
            )}

            {isAllCaptured && (
              <div className="w-full h-full bg-slate-950 p-4 flex flex-col items-center justify-center space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                  ✓ 5 Fotos Biométricas Concluídas
                </span>

                <div className="grid grid-cols-5 gap-2 w-full max-w-md">
                  {FACIAL_ANGLES.map((step) => {
                    const item = capturedPhotos[step.id];
                    if (!item) return null;
                    return (
                      <div key={step.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.base64} alt={step.title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[8px] text-center font-bold uppercase py-0.5">
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          {!isAllCaptured ? (
            <button
              type="button"
              disabled={!!cameraError || isInitializing || isAnalyzing}
              onClick={handleTakeSnapshot}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                !!cameraError || isInitializing || isAnalyzing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-clinical-600 hover:bg-clinical-700 text-white shadow-clinical-600/25'
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
            <div className="flex items-center space-x-2.5 w-full">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refazer Fotos</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndClose}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-clinical-600 hover:bg-clinical-700 text-white shadow-md shadow-clinical-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Concluir e Salvar Biometria</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
