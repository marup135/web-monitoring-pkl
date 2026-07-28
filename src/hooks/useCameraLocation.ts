import { useState, useRef, useCallback } from 'react';
import { usePKL } from '../context/PKLContext';

export function useCameraLocation() {
  const { currentUser } = usePKL();
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'in' | 'out'>('in');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState<string | null>(null);
  const [activityNotes, setActivityNotes] = useState<string>('');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setLocError("Akses kamera ditolak atau tidak tersedia.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation tidak didukung oleh browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error("Location error:", error);
        if (error.code === error.TIMEOUT) {
          setLocError("Pencarian lokasi terlalu lama (timeout). Pastikan koneksi atau izin lokasi Anda aktif.");
        } else {
          setLocError("Akses lokasi ditolak atau bermasalah. Mohon izinkan akses lokasi di pengaturan browser.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const addWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const dateStr = new Date().toLocaleString('id-ID');
    const locStr = location ? `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}` : 'Lokasi tidak tersedia';
    const nameStr = currentUser?.name || 'User';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(width - 260, height - 70, 260, 70);

    ctx.fillStyle = 'white';
    ctx.font = '13px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(nameStr, width - 10, height - 50);
    ctx.fillText(dateStr, width - 10, height - 32);
    ctx.font = '11px Arial';
    ctx.fillText(locStr, width - 10, height - 15);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        addWatermark(ctx, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        if (dataUrl.length * 0.75 > 1048576) {
           alert("Ukuran foto melebihi 1MB meskipun telah dikompres. Silakan coba lagi.");
           return;
        }
        setPhotoCaptured(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            addWatermark(ctx, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            if (dataUrl.length * 0.75 > 1048576) {
               alert("Ukuran foto melebihi 1MB meskipun telah dikompres. Silakan pilih foto dengan ukuran lebih kecil.");
               return;
            }
            setPhotoCaptured(dataUrl);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = async (mode: 'in' | 'out') => {
    setCameraMode(mode);
    setPhotoCaptured(null);
    setLocation(null);
    setLocError('');
    setIsCameraModalOpen(true);
    fetchLocation();
    startCamera();
  };

  const closeModal = useCallback(() => {
    stopCamera();
    setIsCameraModalOpen(false);
  }, [stopCamera]);

  return {
    isCameraModalOpen,
    cameraMode,
    location,
    locError,
    videoRef,
    canvasRef,
    fileInputRef,
    photoCaptured,
    setPhotoCaptured,
    activityNotes,
    setActivityNotes,
    capturePhoto,
    handleFileUpload,
    openModal,
    closeModal,
    startCamera
  };
}
