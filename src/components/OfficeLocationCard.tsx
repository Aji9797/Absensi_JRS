import React from 'react';
import {
  MapPin,
  CheckCircle,
  AlertCircle,
  Building2,
  Sliders,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { OfficeLocation, WorkMode } from '../types/attendance';
import { formatDistance } from '../utils/geoUtils';

interface OfficeLocationCardProps {
  activeOffice: OfficeLocation;
  distanceMeters: number;
  isWithinGeofence: boolean;
  isSimulated: boolean;
  onSetSimulationState: (withinGeofence: boolean) => void;
  onUseRealGPS: () => void;
  latitude: number;
  longitude: number;
  workMode: WorkMode;
  onToggleWorkMode: () => void;
}

export const OfficeLocationCard: React.FC<OfficeLocationCardProps> = ({
  activeOffice,
  distanceMeters,
  isWithinGeofence,
  isSimulated,
  onSetSimulationState,
  onUseRealGPS,
  latitude,
  longitude,
  workMode,
  onToggleWorkMode,
}) => {
  const isWFH = workMode === 'WFH';

  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
      {/* Top Office Header (Kantor Pusat Tunggal - Tanpa Kantor Cabang) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isWFH ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {isWFH ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block">
              {isWFH ? 'Status Presensi Hari Ini' : 'Titik Kantor Resmi'}
            </span>
            <h3 className="text-xs font-bold text-slate-800 truncate">
              {isWFH ? 'Work From Home (Dari Rumah)' : activeOffice.name}
            </h3>
          </div>
        </div>

        {/* Status Geofence Tag */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 ${
            isWFH
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : isWithinGeofence
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
          }`}
        >
          {isWFH ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>WFH Aktif</span>
            </>
          ) : isWithinGeofence ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dalam Radius</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Luar Radius</span>
            </>
          )}
        </div>
      </div>

      {/* Address & Live Distance Info */}
      <div className="flex items-start gap-2 bg-slate-50/70 rounded-xl p-2.5 text-xs text-slate-600">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500 leading-tight truncate">
            {isWFH
              ? 'Kebijakan 4 WFO / 1 WFH: Presensi bebas lokasi dengan verifikasi wajah'
              : activeOffice.address}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            {isWFH ? (
              <span className="font-semibold text-emerald-700">
                Mode WFH: Radius Geofence Bebas
              </span>
            ) : (
              <>
                <span className="font-semibold text-slate-800">
                  Jarak ke Kantor Pusat:{' '}
                  <span className="font-mono">{formatDistance(distanceMeters)}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  Maks Toleransi:{' '}
                  <span className="font-mono">{activeOffice.radiusMeters}m</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mini Radar / Geofence Graphic */}
      <div className="relative h-20 w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:12px_12px]" />

        {isWFH ? (
          /* WFH Radar Graphic */
          <div className="flex flex-col items-center justify-center text-center z-10">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center mb-1 text-emerald-400">
              <Home className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-white font-medium">
              Siklus 5 Hari Kerja: 4 Hari WFO + 1 Hari WFH
            </p>
          </div>
        ) : (
          /* WFO Kantor Pusat Radar Graphic */
          <>
            <div className="absolute w-28 h-28 rounded-full border border-blue-500/20 animate-ping opacity-30" />
            <div className="absolute w-24 h-24 rounded-full border border-blue-400/30" />
            <div
              className={`absolute w-16 h-16 rounded-full border-2 transition-colors duration-500 flex items-center justify-center ${
                isWithinGeofence
                  ? 'border-emerald-500/80 bg-emerald-500/10'
                  : 'border-amber-500/80 bg-amber-500/10'
              }`}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>

            {/* User GPS Pin */}
            <div
              className={`absolute flex items-center gap-1 transition-all duration-700 ${
                isWithinGeofence
                  ? 'translate-x-3 -translate-y-2'
                  : 'translate-x-20 -translate-y-4'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-lg shadow-indigo-500/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
              <span className="text-[9px] font-mono text-white/90 bg-slate-800/90 px-1 py-0.5 rounded shadow">
                Anda ({formatDistance(distanceMeters)})
              </span>
            </div>
          </>
        )}

        {/* Bottom Coordinates Overlay */}
        <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400">
          GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)} {isSimulated ? '(Simulasi)' : '(Live)'}
        </div>
      </div>

      {/* Location Simulation Quick Bar (Allows testing with 1 click) */}
      <div className="pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
          <span className="flex items-center gap-1 font-medium">
            <Sliders className="w-3 h-3 text-slate-400" />
            Uji Skenario Lokasi &amp; Hari Kerja:
          </span>
          {isSimulated && (
            <button
              onClick={onUseRealGPS}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-[10px]"
            >
              Kembali ke GPS Asli
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onSetSimulationState(true)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
              isWithinGeofence && !isWFH
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Di Kantor Pusat (25m)
          </button>
          <button
            type="button"
            onClick={() => onSetSimulationState(false)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
              !isWithinGeofence && !isWFH
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Luar Kantor (850m)
          </button>
        </div>
      </div>
    </div>
  );
};
