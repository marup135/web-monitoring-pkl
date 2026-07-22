import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

const EAR_THRESHOLD = 0.30; // Adjusted threshold to a more standard value for closed eyes
const CONSECUTIVE_FRAMES = 1; // Decreased to 1 to make it more sensitive

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

  useEffect(() => {
    if (isActive) {
      // Async state update to prevent synchronous cascading render warning
      Promise.resolve().then(() => {
        setHasBlinked(false);
        setInstruction('Memuat deteksi kedipan...');
      });
      closedFramesRef.current = 0;
    }
  }, [isActive]);

  useEffect(() => {
    let isMounted = true;

    const detectBlink = async () => {
      if (!videoRef.current || !isActive || hasBlinked || !isMounted) return;

      try {
        const video = videoRef.current;
        if (video.readyState !== 4) {
          if (isMounted) animationFrameRef.current = requestAnimationFrame(detectBlink);
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
              if (isMounted) {
                setHasBlinked(true);
                setInstruction('Kedipan terdeteksi! Silakan klik tombol foto.');
              }
              closedFramesRef.current = 0;
              return; // Stop loop
            }
            closedFramesRef.current = 0;
          }
        } else {
          if (isMounted && !hasBlinked) setInstruction('Wajah tidak terdeteksi. Posisikan wajah Anda di tengah kamera.');
        }
      } catch (error) {
        console.error('Error during blink detection:', error);
      }

      if (isActive && !hasBlinked && isMounted) {
        animationFrameRef.current = requestAnimationFrame(detectBlink);
      }
    };

    if (isActive && !hasBlinked) {
      closedFramesRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(detectBlink);
    }

    return () => {
      isMounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive, hasBlinked, videoRef]);

  return { hasBlinked, isDetecting, instruction, resetBlink };
}
