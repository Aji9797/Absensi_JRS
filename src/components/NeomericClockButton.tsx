import React, { useEffect, useState } from 'react';
import {
  Fingerprint,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  Home,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  FastForward,
} from 'lucide-react';
import { OfficeLocation, WorkMode, RotationDay } from '../types/attendance';

interface NeomericClockButtonProps {
  isClockedIn: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  onTriggerAttendance: () => void;
  activeOffice: OfficeLocation;
  isWithinGeofence: boolean;
  distanceMeters: number;
  workMode: WorkMode;
  onToggleWorkMode: () => void;
  shiftEndTime?: string; // e.g. "17:00"
  currentDay: RotationDay;
  onSelectDay: (day: RotationDay) => void;
  employeeWfhDay: RotationDay;
  isWfhTurnToday: boolean;
  employeeName: string;
}

const ROTATION_DAYS: RotationDay[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const NeomericClockButton: React.FC<NeomericClockButtonProps> = ({
  isClockedIn,
  clockInTime,
  clockOutTime,
  onTriggerAttendance,
  activeOffice,
  isWithinGeofence,
  distanceMeters,
  workMode,
  onToggleWorkMode,
  shiftEndTime = '17:00',
  currentDay,
  onSelectDay,
  employeeWfhDay,
  isWfhTurnToday,
  employeeName,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [workingDuration, setWorkingDuration] = useState<string>('00h 00m');
  const [isEarlyUnlock, setIsEarlyUnlock] = useState<boolean>(false);
  const [showLockedModal, setShowLockedModal] = useState<boolean>(false);
  const [timeUntilClockOut, setTimeUntilClockOut] = useState<string>('');
  const [isSimulatedAfterHours, setIsSimulatedAfterHours] = useState<boolean>(false);

  // Check if current time is before shift end time (17:00)
  const [endH, endM] = shiftEndTime.split(':').map(Number);
  const currentHours = isSimulatedAfterHours ? 17 : currentTime.getHours();
  const currentMinutes = isSimulatedAfterHours ? 15 : currentTime.getMinutes();
  const isBeforeShiftEnd =
    !isSimulatedAfterHours && (currentHours < endH || (currentHours === endH && currentMinutes < endM));

  // Clock Out is locked if clocked in, before 17:00, and not explicitly unlocked
  const isClockOutLocked = isClockedIn && isBeforeShiftEnd && !isEarlyUnlock;

  // Real-time ticking clock & duration
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate countdown to shift end (17:00)
      const targetDate = new Date();
      targetDate.setHours(endH, endM, 0, 0);

      const diffToTarget = targetDate.getTime() - now.getTime();
      if (diffToTarget > 0 && !isSimulatedAfterHours) {
        const totalMin = Math.floor(diffToTarget / (1000 * 60));
        const remH = Math.floor(totalMin / 60);
        const remM = totalMin % 60;
        setTimeUntilClockOut(`${remH}j ${remM}m`);
      } else {
        setTimeUntilClockOut('0j 0m (Jam Pulang Tiba)');
      }

      if (isClockedIn && clockInTime) {
        // Calculate dynamic working duration
        const [h, m] = clockInTime.replace(/(am|pm|wib)/i, '').trim().split(':').map(Number);
        const isPM = clockInTime.toLowerCase().includes('pm') && h !== 12;
        const hour24 = isPM ? h + 12 : h;

        const clockInDate = new Date();
        clockInDate.setHours(hour24, m, 0, 0);

        const diffMs = Math.max(0, now.getTime() - clockInDate.getTime());
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        setWorkingDuration(
          `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isClockedIn, clockInTime, endH, endM, isSimulatedAfterHours]);

  const timeFormatted = isSimulatedAfterHours
    ? '17:15'
    : currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

  const dateFormatted = currentTime.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleClickButton = () => {
    if (isClockOutLocked) {
      setShowLockedModal(true);
      return;
    }
    onTriggerAttendance();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ==============================================================
          WFH ROTATION (GILIRAN WFH) INTERACTIVE SCHEDULE BANNER
          ============================================================== */}
      <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 mb-4 shadow-2xs flex flex-col gap-2.5">
        {/* Day of Week Selector Pills */}
        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold">Simulasi Hari:</span>
          </div>

          <div className="flex items-center gap-1">
            {ROTATION_DAYS.map((day) => {
              const isSelected = currentDay === day;
              const isEmployeeWfhDay = employeeWfhDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all relative ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                  title={`${day}: ${isEmployeeWfhDay ? 'Giliran WFH Anda' : 'Jadwal WFO'}`}
                >
                  {day}
                  {isEmployeeWfhDay && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Rotation Status Result */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                isWfhTurnToday ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              {isWfhTurnToday ? <Home className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900">
                  {isWfhTurnToday
                    ? `Hari ${currentDay}: Giliran WFH Anda!`
                    : `Hari ${currentDay}: Jadwal WFO Kantor Pusat`}
                </span>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                    isWfhTurnToday
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isWfhTurnToday ? 'WFH AKTIF' : 'WFO AKTIF'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {isWfhTurnToday
                  ? `Jadwal giliran WFH Anda (${employeeWfhDay}). Presensi bebas lokasi dengan foto wajah.`
                  : `Giliran WFH Anda setiap hari ${employeeWfhDay}. Hari ini wajib absen di Kantor Pusat.`}
              </p>
            </div>
          </div>

          {/* Manual Mode Override Button */}
          <button
            type="button"
            onClick={onToggleWorkMode}
            className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-700 transition-colors shrink-0"
            title="Ubah mode manual WFO / WFH"
          >
            Tukar Mode
          </button>
        </div>
      </div>

      {/* Time & Date Header (Neomeric style) */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-mono tabular-nums">
          {timeFormatted}
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {currentDay}, {dateFormatted}
        </p>
      </div>

      {/* Neomeric Circular Clock In / Clock Out Button */}
      <div className="relative my-2 flex items-center justify-center">
        {/* Ambient background glow ring */}
        <div
          className={`absolute w-56 h-56 rounded-full transition-all duration-700 blur-2xl opacity-40 ${
            !isClockedIn
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 animate-ripple-glow'
              : isClockOutLocked
              ? 'bg-gradient-to-tr from-amber-600 to-slate-700'
              : 'bg-gradient-to-tr from-rose-500 to-red-600 animate-ripple-glow-red'
          }`}
        />

        {/* Outer concentric subtle border */}
        <div className="relative w-52 h-52 rounded-full p-2 bg-gradient-to-b from-white/80 to-slate-100 shadow-xl border border-white/60 flex items-center justify-center">
          {/* Main Interactive Button */}
          <button
            type="button"
            onClick={handleClickButton}
            className={`w-44 h-44 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 transform active:scale-95 shadow-2xl relative overflow-hidden group ${
              !isClockedIn
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-indigo-600/40 hover:shadow-indigo-600/60'
                : isClockOutLocked
                ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-amber-900 shadow-slate-900/40 cursor-pointer'
                : 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 shadow-rose-500/40 hover:shadow-rose-500/60'
            }`}
          >
            {/* Gloss highlight on button */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none" />

            {/* Central Icon */}
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 border border-white/20">
              {isClockOutLocked ? (
                <Lock className="w-6 h-6 text-amber-300 animate-pulse" />
              ) : (
                <Fingerprint className="w-7 h-7 text-white" />
              )}
            </div>

            {/* Button Label */}
            <span className="text-base font-bold tracking-wider uppercase drop-shadow-sm">
              {!isClockedIn ? 'CLOCK IN' : isClockOutLocked ? 'CLOCK OUT' : 'CLOCK OUT'}
            </span>

            {/* Subtitle */}
            <span className="text-[10px] text-white/80 tracking-wide mt-1 text-center px-2">
              {!isClockedIn
                ? 'Verifikasi Wajah & GPS'
                : isClockOutLocked
                ? `Terkunci s/d ${shiftEndTime}`
                : 'Verifikasi Wajah Pulang'}
            </span>
          </button>
        </div>
      </div>

      {/* Lock Status / Location Status Message */}
      <div className="mt-4 mb-5 text-center px-4 w-full max-w-sm">
        {isClockOutLocked ? (
          <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Absen Pulang Terkunci hingga {shiftEndTime} WIB</span>
            </span>
            <p className="text-[11px] text-amber-700">
              Sisa waktu jam kerja: <strong>{timeUntilClockOut}</strong>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsSimulatedAfterHours(!isSimulatedAfterHours)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold flex items-center gap-1"
                title="Simulasi waktu setelah jam 17:00"
              >
                <FastForward className="w-3 h-3" />
                <span>{isSimulatedAfterHours ? 'Kembali ke Jam Normal' : 'Uji Lewat Jam 17:00'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLockedModal(true)}
                className="text-[10px] text-blue-700 hover:underline font-semibold"
              >
                Izin Pulang Awal
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-medium text-slate-600 flex items-center justify-center gap-1.5">
              {workMode === 'WFH' ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mode WFH Aktif (Presensi Bebas Lokasi)</span>
                </span>
              ) : isWithinGeofence ? (
                <span className="text-slate-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Di Kantor Pusat ({distanceMeters}m dari pusat radius)</span>
                </span>
              ) : (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Di Luar Jangkauan Kantor Pusat ({distanceMeters}m)</span>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Three Summary Metric Cards */}
      <div className="w-full grid grid-cols-3 gap-2 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
        {/* Clock In */}
        <div className="flex flex-col items-center text-center p-1">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 font-mono tabular-nums">
            {clockInTime || '--:--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Clock In</span>
        </div>

        {/* Clock Out */}
        <div className="flex flex-col items-center text-center p-1 border-x border-slate-100">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 font-mono tabular-nums">
            {clockOutTime || (isClockOutLocked ? 'Terkunci' : '--:--')}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Clock Out ({shiftEndTime})
          </span>
        </div>

        {/* Working Hr's */}
        <div className="flex flex-col items-center text-center p-1">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 font-mono tabular-nums">
            {isClockedIn ? workingDuration : clockOutTime ? '08h 15m' : '--:--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Working Hr's</span>
        </div>
      </div>

      {/* Modal: Clock Out Locked Alert & Early Checkout Simulator */}
      {showLockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Absen Pulang Sedang Terkunci
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Jam kerja resmi operasional kantor selesai pada pukul{' '}
              <strong className="text-slate-800">{shiftEndTime} WIB</strong>. Saat ini tombol Clock Out dikunci sistem untuk memastikan kepatuhan jam kerja karyawan.
            </p>

            <div className="w-full bg-amber-50 border border-amber-200/80 rounded-2xl p-3 my-4 text-xs text-amber-800 font-mono">
              Sisa waktu hingga jam pulang: <strong>{timeUntilClockOut}</strong>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEarlyUnlock(true);
                  setShowLockedModal(false);
                  onTriggerAttendance();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Kunci (Izin Pulang Awal / Mode Demo)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLockedModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Tutup &amp; Lanjutkan Bekerja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
