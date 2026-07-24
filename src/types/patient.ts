export interface PatientFormData {
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
}

export interface LgpdConsent {
  accepted: boolean;
  timestamp: string | null; // ISO string
}

export interface ImageQualityMetrics {
  brightness: number; // 0 to 255
  contrast: number; // Variance standard deviation
  facesDetected: number; // Number of faces detected
  isValidBrightness: boolean; // Between ~40 and ~220
  isValidContrast: boolean; // Sharpness threshold
  isValidFaceCount: boolean; // Exactly 1 face
  overallValid: boolean;
  issues: string[];
}

export type FacialAngle = 'frente' | 'direita' | 'esquerda' | 'cima' | 'baixo';

export interface FacialAngleStep {
  id: FacialAngle;
  title: string;
  instruction: string;
  iconDirection: 'center' | 'right' | 'left' | 'up' | 'down';
}

export interface CapturedAnglePhoto {
  angle: FacialAngle;
  base64: string;
  metrics: ImageQualityMetrics;
}

export type CapturedPhotosMap = Partial<Record<FacialAngle, CapturedAnglePhoto>>;

export interface PatientRecord {
  id: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  fotoBiometricaUrl: string;
  consentTimestamp: string;
  atualizadoEm: string;
}

export type TabMode = 'cadastro' | 'recadastro';
