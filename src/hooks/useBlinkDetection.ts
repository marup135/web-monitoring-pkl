import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

const EAR_THRESHOLD = 0.25; // Adjusted threshold to a more standard value for closed eyes
const CONSECUTIVE_FRAMES = 2; // Increased to 2 to avoid false positives from noise

function getEuclideanDistance(p1: faceapi.Point, p2: faceapi.Point) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getEyeAspectRatio(eyeLandmarks: faceapi.Point[]) {
  const p1 = eyeLandmarks[0];
  const p2 = eyeLandmarks[1];
  const p3 = eyeLandmarks[2];
  const p4 = eyeLandmarks[3];
  const p5 = eyeLandmarks[4];
  const p6 = eyeLandmarks[5];

  const vertical1 = getEuclideanDistance(p2, p6);
  const vertical2 = getEuclideanDistance(p3, p5);
  const horizontal = getEuclideanDistance(p1, p4);

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export function useBlinkDetection(videoRef: React.RefObject<HTMLVideoElement | null>, isActive: boolean) {
  const [hasBlinked, setHasBlinked] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [instruction, setInstruction] = useState('Memuat deteksi kedipan...');
  
  const closedFramesRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const resetBlink = useCallback(() => {
    setHasBlinked(false);
    closedFramesRef.current = 0;
    setInstruction('Memuat deteksi kedipan...');
  }, []);

  const detectBlink = useCallback(async () => {
    if (!videoRef.current || !isActive || hasBlinked) return;

    try {
      const video = videoRef.current;
      if (video.readyState !== 4) {
        animationFrameRef.current = requestAnimationFrame(detectBlink);
        return;
      }

      setIsDetecting(true);
      if (!hasBlinked) setInstruction('Berkediplah untuk memverifikasi liveness...');

      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

      if (detection) {
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftEAR = getEyeAspectRatio(leftEye);
        const rightEAR = getEyeAspectRatio(rightEye);
        const avgEAR = (leftEAR + rightEAR) / 2.0;

        if (avgEAR < EAR_THRESHOLD) {
          closedFramesRef.current += 1;
        } else {
          if (closedFramesRef.current >= CONSECUTIVE_FRAMES) {
            // Blink detected!
            setHasBlinked(true);
            setInstruction('Kedipan terdeteksi! Silakan klik tombol foto.');
            closedFramesRef.current = 0;
            return; // Stop loop
          }
          closedFramesRef.current = 0;
        }
      } else {
        setInstruction('Wajah tidak terdeteksi. Posisikan wajah Anda di tengah kamera.');
      }
    } catch (error) {
      console.error('Error during blink detection:', error);
    }

    if (isActive && !hasBlinked) {
      // Loop as fast as possible to not miss blinks
      animationFrameRef.current = requestAnimationFrame(detectBlink);
    }
  }, [isActive, hasBlinked, videoRef]);

  useEffect(() => {
    if (isActive) {
      resetBlink();
    }
  }, [isActive, resetBlink]);

  useEffect(() => {
    if (isActive && !hasBlinked) {
      closedFramesRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(detectBlink);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, hasBlinked, detectBlink]);

  return {
    hasBlinked,
    isDetecting,
    instruction,
    resetBlink
  };
}
