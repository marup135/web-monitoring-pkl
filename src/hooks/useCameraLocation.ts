import { useState, useRef, useCallback } from 'react';
import { usePKL } from '../context/PKLContext';
import { applyWatermark } from '../utils/watermark';

export function useCameraLocation() {
  const { currentUser } = usePKL();
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'in' | 'out'>('in');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            const address = data.address;
            let shortName = address 
              ? (address.amenity || address.building || address.road || address.village || data.name || data.display_name?.split(',')[0]) 
              : (data.name || data.display_name?.split(',')[0]);
            
            // Perbaikan khusus untuk area Telkom yang berdekatan
            if (shortName && typeof shortName === 'string' && shortName.toLowerCase().includes('telkom corporate university')) {
              shortName = 'Telkom Test House';
            }
            
            if (shortName) {
              setLocationName(shortName);
            }
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }
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

  const capturePhoto = (overrideType?: string) => {
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
        applyWatermark(canvas, {
          type: overrideType || (cameraMode === 'in' ? 'Absen Masuk' : 'Absen Pulang'),
          userName: currentUser?.name || 'User',
          lat: location?.lat,
          lng: location?.lng,
          locationName: locationName || undefined
        });
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        if (dataUrl.length * 0.75 > 1048576) {
           alert("Ukuran foto melebihi 1MB meskipun telah dikompres. Silakan coba lagi.");
           return;
        }
        setPhotoCaptured(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, overrideType?: string) => {
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
            applyWatermark(canvas, {
              type: overrideType || (cameraMode === 'in' ? 'Absen Masuk' : 'Bukti Kegiatan'),
              userName: currentUser?.name || 'User',
              lat: location?.lat,
              lng: location?.lng,
              locationName: locationName || undefined
            });
            
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
    setLocationName(null);
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
    locationName,
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
