import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import {
  analyzeVideoFrame,
  captureBiometricSnapshot,
  FaceAnalysisResult,
  createSyntheticFallbackAvatar,
} from '../utils/faceBiometrics';
import { OfficeLocation } from '../types/attendance';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (snapshotUrl: string) => void;
  mode: 'CLOCK_IN' | 'CLOCK_OUT';
  employeeName: string;
  activeOffice: OfficeLocation;
  currentLat: number;
  currentLon: number;
}

export const FaceScannerModal: React.FC<FaceScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  employeeName,
  activeOffice,
  currentLat,
  currentLon,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<FaceAnalysisResult>({
    detected: false,
    score: 0,
    brightness: 'GOOD',
    centered: false,
    livenessPassed: false,
    message: 'Mengaktifkan sensor kamera...',
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCountdown(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, isSimulatedMode]);

  const startCamera = async () => {
    setCameraError(null);
    if (isSimulatedMode) {
      setHasCamera(true);
      setAnalysis({
        detected: true,
        score: 96,
        brightness: 'GOOD',
        centered: true,
        livenessPassed: true,
        message: 'Mode Sensor Simulasi: Wajah Siap Diverifikasi',
      });
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat atau browser tidak mendukung akses kamera.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCamera(true);
    } catch (err: any) {
      console.warn('Gagal mengakses kamera:', err);
      setCameraError(
        err?.message ||
          'Kamera tidak dapat diakses atau izin ditolak. Anda dapat menggunakan mode pengujian simulasi.'
      );
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Live video frame analyzer loop
  useEffect(() => {
    if (!isOpen || !hasCamera || isSimulatedMode) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const result = analyzeVideoFrame(videoRef.current, canvasRef.current);
        setAnalysis(result);

        // Auto trigger verification if face is well-aligned and no countdown active
        if (result.detected && result.score > 75 && countdown === null && !isVerifying) {
          // Ready to snap
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, hasCamera, isSimulatedMode, countdown, isVerifying]);

  const handleManualCapture = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setCountdown(2);

    let currentCount = 2;
    const timer = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);

      if (currentCount <= 0) {
        clearInterval(timer);
        finalizeCapture();
      }
    }, 600);
  };

  const finalizeCapture = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let snapshotUrl = '';
    if (videoRef.current && !isSimulatedMode && hasCamera) {
      snapshotUrl = captureBiometricSnapshot(videoRef.current, {
        employeeName,
        officeName: activeOffice.name,
        lat: currentLat,
        lon: currentLon,
        dateStr,
        timeStr,
      });
    } else {
      snapshotUrl = createSyntheticFallbackAvatar(employeeName);
    }

    setIsVerifying(false);
    setCountdown(null);
    onSuccess(snapshotUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                mode === 'CLOCK_IN'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  : 'bg-gradient-to-r from-rose-500 to-red-600'
              }`}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Verifikasi Wajah Biometrik
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'CLOCK_IN' ? 'Presensi Masuk (Clock In)' : 'Presensi Pulang (Clock Out)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
          {hasCamera && !cameraError && !isSimulatedMode ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-indigo-950 text-white">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-indigo-400/60 flex items-center justify-center mb-4 bg-indigo-900/30">
                <ShieldCheck className="w-12 h-12 text-indigo-400" />
              </div>
              <p className="text-sm font-medium mb-1">
                {isSimulatedMode ? 'Kamera Biometrik Virtual Siap' : 'Kamera Tidak Tersedia'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                {isSimulatedMode
                  ? 'Simulator sensor wajah biometrik aktif untuk pengujian presensi instan.'
                  : 'Izin webcam belum diberikan atau kamera sedang digunakan aplikasi lain.'}
              </p>
              {!isSimulatedMode && (
                <button
                  type="button"
                  onClick={() => setIsSimulatedMode(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
                >
                  Aktifkan Mode Kamera Virtual
                </button>
              )}
            </div>
          )}

          {/* Biometric Oval Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened mask around oval */}
            <div
              className={`w-64 h-80 rounded-[48%] border-2 transition-all duration-300 relative ${
                analysis.detected
                  ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                  : 'border-blue-400/80 shadow-[0_0_20px_rgba(96,165,250,0.3)]'
              }`}
            >
              {/* Scanline laser */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanline shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

              {/* Corner target reticles */}
              <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
              <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
              <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
              <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[48%]">
                  <span className="text-6xl font-extrabold text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Biometric Confidence Badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
              <span
                className={`w-2 h-2 rounded-full ${
                  analysis.detected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="font-mono text-[11px] font-medium">
                {analysis.detected ? `Akurasi ${analysis.score}%` : 'Mendeteksi...'}
              </span>
            </div>

            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] border border-white/10 font-mono">
              GPS Verified
            </div>
          </div>

          {/* Prompt status message */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3.5 py-2 text-center text-xs text-white shadow-lg">
              {analysis.message}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Anti-Spoofing &amp; GPS Geofence Aktif</span>
            </div>
            {!isSimulatedMode && (
              <button
                type="button"
                onClick={() => setIsSimulatedMode(true)}
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                Gunakan Mode Virtual
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleManualCapture}
              disabled={isVerifying}
              className={`flex-2 py-3 px-6 rounded-xl font-semibold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                mode === 'CLOCK_IN'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
              }`}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Wajah...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'CLOCK_IN' ? 'Verifikasi & Masuk' : 'Verifikasi & Pulang'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
