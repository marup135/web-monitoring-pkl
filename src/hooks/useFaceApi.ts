import { useState, useEffect, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

export function useFaceApi() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [savedFaceDescriptor, setSavedFaceDescriptor] = useState<Float32Array | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (e) {
        console.error('Failed to load face models', e);
      }
    };
    loadModels();
  }, []);

  const loadSavedDescriptor = useCallback((descriptorString: string) => {
    try {
      const parsedArr = JSON.parse(descriptorString);
      setSavedFaceDescriptor(new Float32Array(parsedArr));
    } catch (e) {
      console.error("Failed to parse face descriptor", e);
      setSavedFaceDescriptor(null);
    }
  }, []);

  const verifyFace = async (photoDataUrl: string): Promise<{ success: boolean; error?: string; distance?: number }> => {
    if (!savedFaceDescriptor) {
      return { success: false, error: 'Wajah Anda belum terdaftar. Silakan daftar wajah di menu Pengaturan terlebih dahulu.' };
    }

    try {
      setVerifyingFace(true);
      const img = document.createElement('img');
      img.src = photoDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      
      if (!detection) {
        return { success: false, error: 'Wajah tidak terdeteksi pada foto. Silakan ulangi.' };
      }

      const distance = faceapi.euclideanDistance(detection.descriptor, savedFaceDescriptor);
      
      if (distance > 0.5) { // Threshold
        return { success: false, error: `Wajah tidak cocok dengan data pendaftaran (Distance: ${distance.toFixed(2)}).` };
      }

      return { success: true, distance };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || 'Terjadi kesalahan saat verifikasi wajah.' };
    } finally {
      setVerifyingFace(false);
    }
  };

  return {
    modelsLoaded,
    verifyingFace,
    savedFaceDescriptor,
    loadSavedDescriptor,
    verifyFace
  };
}
