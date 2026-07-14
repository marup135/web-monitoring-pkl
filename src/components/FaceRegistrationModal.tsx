'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { registerFaceAction } from '../app/actions/profile';

interface FaceRegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function FaceRegistrationModal({ onClose, onSuccess }: FaceRegistrationModalProps) {
  const [loadingModels, setLoadingModels] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        if (isMounted) setLoadingModels(false);
      } catch (err) {
        console.error('Failed to load face-api models', err);
        if (isMounted) setErrorMsg('Gagal memuat model pengenalan wajah.');
      }
    };
    loadModels();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setErrorMsg("Akses kamera ditolak atau tidak tersedia.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (!loadingModels && !errorMsg) {
      startCamera();
    }
    return () => stopCamera();
  }, [loadingModels]);

  const handleRegisterFace = async () => {
    if (!videoRef.current) return;
    
    setDetecting(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (!detection) {
        setErrorMsg('Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan wajah terlihat jelas.');
        setDetecting(false);
        return;
      }
      
      const descriptorArray = Array.from(detection.descriptor);
      const descriptorStr = JSON.stringify(descriptorArray);
      
      const res = await registerFaceAction(descriptorStr);
      if (res.success) {
        setSuccessMsg('Wajah berhasil didaftarkan!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Gagal mendaftarkan wajah ke server.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses wajah.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-800 dark:text-white">Registrasi Wajah</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 font-medium">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}
          
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] flex items-center justify-center border border-gray-200 dark:border-gray-700">
            {loadingModels ? (
              <div className="flex flex-col items-center text-white">
                <RefreshCw className="animate-spin mb-2" size={24} />
                <span className="text-sm">Memuat AI Model...</span>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>
          <p className="text-xs text-slate-500 text-center">
            Posisikan wajah Anda tepat di tengah layar dengan pencahayaan yang cukup. Data wajah Anda digunakan untuk absen masuk.
          </p>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1E293B]">
          <button
            onClick={handleRegisterFace}
            disabled={loadingModels || detecting || !!successMsg}
            className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 ${
              loadingModels || detecting || !!successMsg
                ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover text-white shadow-md'
            }`}
          >
            {detecting ? (
              <><RefreshCw size={18} className="animate-spin" /> Memindai Wajah...</>
            ) : (
              <><Camera size={18} /> Daftarkan Wajah</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
