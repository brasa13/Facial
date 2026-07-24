import { ImageQualityMetrics } from '@/types/patient';

/**
 * Analisa uma imagem capturada em um elemento HTMLCanvasElement ou HTMLImageElement
 * para verificar qualidade de iluminação, contraste (borrado) e quantidade de rostos.
 */
export async function analyzeFacialImage(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<ImageQualityMetrics> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth || source.width;
  const height = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight || source.height;

  canvas.width = width;
  canvas.height = height;

  if (!ctx) {
    return {
      brightness: 120,
      contrast: 30,
      facesDetected: 1,
      isValidBrightness: true,
      isValidContrast: true,
      isValidFaceCount: true,
      overallValid: true,
      issues: [],
    };
  }

  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Cálculo de Iluminação (Brilho Médio)
  let totalLuminance = 0;
  const pixelCount = width * height;
  const luminances = new Float32Array(pixelCount);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Fórmula de Luminância NTSC / Rec. 601
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    luminances[i / 4] = lum;
    totalLuminance += lum;
  }

  const avgBrightness = totalLuminance / pixelCount;

  // 2. Cálculo de Contraste / Nitidez (Desvio Padrão da Luminância)
  let varianceSum = 0;
  for (let i = 0; i < pixelCount; i++) {
    const diff = luminances[i] - avgBrightness;
    varianceSum += diff * diff;
  }
  const variance = varianceSum / pixelCount;
  const contrast = Math.sqrt(variance);

  // 3. Detecção de Rosto
  let facesCount = 1; // padrão
  try {
    // Tenta usar a API nativa do navegador FaceDetector se disponível (Chromium)
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      // @ts-expect-error Experimental FaceDetector API
      const detector = new window.FaceDetector({ maxDetectedFaces: 5, fastMode: true });
      const detectedFaces = await detector.detect(canvas);
      facesCount = detectedFaces.length;
    } else {
      // Fallback inteligente: análise estatística de tonalidade de pele na região central
      facesCount = estimateFaceCountFromSkinTone(data, width, height);
    }
  } catch (err) {
    console.warn('Erro ao utilizar FaceDetector nativo:', err);
    facesCount = estimateFaceCountFromSkinTone(data, width, height);
  }

  const isValidBrightness = avgBrightness >= 45 && avgBrightness <= 215;
  const isValidContrast = contrast >= 14;
  const isValidFaceCount = facesCount === 1;

  const issues: string[] = [];
  if (avgBrightness < 45) {
    issues.push('Iluminação muito baixa (foto muito escura). Melhore a luz do ambiente.');
  } else if (avgBrightness > 215) {
    issues.push('Iluminação muito alta (foto estourada/muito clara). Reduza o excesso de luz.');
  }

  if (!isValidContrast) {
    issues.push('Imagem com pouca nitidez ou borrada. Mantenha a cabeça firme e limpe a lente.');
  }

  if (facesCount === 0) {
    issues.push('Nenhum rosto detectado na imagem. Centralize o paciente na tela.');
  } else if (facesCount > 1) {
    issues.push('Múltiplos rostos detectados. Apenas o paciente deve aparecer na foto.');
  }

  const overallValid = isValidBrightness && isValidContrast && isValidFaceCount;

  return {
    brightness: Math.round(avgBrightness),
    contrast: Math.round(contrast),
    facesDetected: facesCount,
    isValidBrightness,
    isValidContrast,
    isValidFaceCount,
    overallValid,
    issues,
  };
}

/**
 * Algoritmo heurístico para contagem aproximada de regiões faciais no centro da imagem
 */
function estimateFaceCountFromSkinTone(data: Uint8ClampedArray, width: number, height: number): number {
  let skinPixels = 0;
  const startX = Math.floor(width * 0.25);
  const endX = Math.floor(width * 0.75);
  const startY = Math.floor(height * 0.15);
  const endY = Math.floor(height * 0.85);
  const regionPixelCount = (endX - startX) * (endY - startY);

  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Verificação em espaço de cor RGB para tons de pele comuns
      if (r > 45 && g > 30 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
        skinPixels += 4; // incrementa pelo passo
      }
    }
  }

  const ratio = skinPixels / regionPixelCount;
  if (ratio < 0.08) {
    return 0; // Nenhum rosto visível na região central
  }
  if (ratio > 0.85) {
    return 2; // Rosto colado demais ou mais de um ocupando o quadro
  }
  return 1;
}

/**
 * Converte Data URI (base64) para objeto Blob
 */
export function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
