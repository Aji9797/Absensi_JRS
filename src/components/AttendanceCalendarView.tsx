import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  ChevronLeft,
  X,
  Building,
  Download,
  Filter,
  User,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { AttendanceRecord } from '../types/attendance';
import { exportAttendanceToExcel, exportAttendanceToPDF } from '../utils/exportUtils';

interface AttendanceCalendarViewProps {
  records: AttendanceRecord[];
  currentEmployeeId?: string;
  currentEmployeeName?: string;
}

const MONTH_OPTIONS = [
  { label: 'Semua Bulan', key: 'ALL' },
  { label: 'Oktober 2026', key: '10' },
  { label: 'November 2026', key: '11' },
  { label: 'Desember 2026', key: '12' },
  { label: 'Januari 2027', key: '01' },
];

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  records,
  currentEmployeeId,
  currentEmployeeName,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<'MINE' | 'ALL'>(
    currentEmployeeId ? 'MINE' : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Filter records based on scope (Mine vs All), Month, and Search Query
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Employee Scope Filter
      if (selectedScope === 'MINE' && currentEmployeeId) {
        if (rec.employeeId !== currentEmployeeId) return false;
      }

      // 2. Month Filter
      if (selectedMonth !== 'ALL') {
        const recordMonth = rec.date ? rec.date.split('-')[1] : '';
        if (recordMonth !== selectedMonth) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = rec.date?.toLowerCase().includes(q);
        const matchesName = rec.employeeName?.toLowerCase().includes(q);
        const matchesOffice = rec.officeName?.toLowerCase().includes(q);
        const matchesStatus = rec.status?.toLowerCase().includes(q);
        if (!matchesDate && !matchesName && !matchesOffice && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedScope, currentEmployeeId, selectedMonth, searchQuery]);

  // Dynamic Statistics derived from filtered records
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const onTime = filteredRecords.filter((r) => r.status === 'ON_TIME').length;
    const late = filteredRecords.filter((r) => r.status === 'LATE').length;
    const sick = filteredRecords.filter((r) => r.status === 'SICK_LEAVE').length;
    const wfh = filteredRecords.filter((r) => r.workMode === 'WFH').length;
    const wfo = filteredRecords.filter((r) => r.workMode === 'WFO' || !r.workMode).length;

    return { total, onTime, late, sick, wfh, wfo };
  }, [filteredRecords]);

  const handleExportPersonalExcel = () => {
    if (filteredRecords.length === 0) return;
    setExportFeedback('Mengunduh Excel...');
    exportAttendanceToExcel(
      filteredRecords,
      `Rekap_Presensi_${currentEmployeeName ? currentEmployeeName.replace(/\s+/g, '_') : 'Saya'}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportPersonalPDF = () => {
    if (filteredRecords.length === 0) return;
    setExportFeedback('Mengunduh PDF...');
    exportAttendanceToPDF(
      filteredRecords,
      `Slip_Presensi_${currentEmployeeName ? currentEmployeeName.replace(/\s+/g, '_') : 'Saya'}_${new Date().toISOString().slice(0, 10)}.pdf`,
      {
        officeFilter: 'Semua Titik',
        statusFilter: 'Semua Status',
        searchFilter: currentEmployeeName || undefined,
      }
    );
    setTimeout(() => setExportFeedback(null), 2500);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-slate-800">Riwayat Presensi</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              JRS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Log Kehadiran, Jam Masuk / Pulang &amp; Verifikasi Wajah Biometrik
          </p>
        </div>

        {/* Export Personal Report Actions */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {exportFeedback && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md animate-pulse">
              ✓ {exportFeedback}
            </span>
          )}
          <button
            type="button"
            onClick={handleExportPersonalExcel}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
            title="Download Slip Presensi Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPersonalPDF}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
            title="Download Slip Presensi PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Scope Switcher (Presensi Saya vs Seluruh Tim) */}
      {currentEmployeeId && (
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setSelectedScope('MINE')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedScope === 'MINE'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Presensi Saya</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedScope('ALL')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedScope === 'ALL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Seluruh Tim ({records.length})</span>
          </button>
        </div>
      )}

      {/* Monthly KPI Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
            Total Hadir
          </span>
          <span className="text-lg font-bold font-mono text-slate-800">{stats.total}</span>
        </div>
        <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-semibold text-emerald-600 block uppercase">
            Tepat Waktu
          </span>
          <span className="text-lg font-bold font-mono text-emerald-600">{stats.onTime}</span>
        </div>
        <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-semibold text-amber-600 block uppercase">
            Terlambat
          </span>
          <span className="text-lg font-bold font-mono text-amber-600">{stats.late}</span>
        </div>
        <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-semibold text-indigo-600 block uppercase">
            WFH / WFO
          </span>
          <span className="text-sm font-bold font-mono text-indigo-600 mt-1 block">
            {stats.wfh} / {stats.wfo}
          </span>
        </div>
      </div>

      {/* Month Horizontal Selector (Actually filters records!) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MONTH_OPTIONS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelectedMonth(m.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedMonth === m.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search Input Filter */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tanggal, nama karyawan, atau status..."
          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200/80 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Attendance Table / List Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
          <div className="col-span-4 sm:col-span-3">Tanggal</div>
          <div className="col-span-3">Jam Masuk</div>
          <div className="col-span-3">Jam Pulang</div>
          <div className="col-span-2 sm:col-span-3 text-right">Durasi Kerja</div>
        </div>

        {/* Rows */}
        {filteredRecords.length === 0 ? (
          <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">Tidak ada data presensi</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Silakan pilih bulan lain atau ubah kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {filteredRecords.map((rec) => {
              const isSick = rec.status === 'SICK_LEAVE';
              const isWfh = rec.workMode === 'WFH' || rec.dayName === 'FRI';

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className="grid grid-cols-12 items-center py-3.5 hover:bg-slate-50/80 rounded-xl px-1 transition-colors cursor-pointer group"
                >
                  {/* Date Col with WFO / WFH indicator */}
                  <div className="col-span-4 sm:col-span-3 flex flex-col pr-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {rec.dayNumber < 10 ? `0${rec.dayNumber}` : rec.dayNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{rec.dayName}</span>
                    </div>
                    {selectedScope === 'ALL' && (
                      <span className="text-[10px] text-slate-700 font-medium truncate max-w-[100px]">
                        {rec.employeeName}
                      </span>
                    )}
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded w-fit mt-0.5 ${
                        isWfh
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isWfh ? 'WFH (Rumah)' : 'WFO (Kantor)'}
                    </span>
                  </div>

                  {/* Clock In */}
                  <div className="col-span-3">
                    {isSick ? (
                      <span className="text-xs text-rose-500 font-medium italic">Izin Sakit</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-rose-500 font-mono">
                          {rec.clockInTime}
                        </span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{rec.officeName.split(' ')[0]}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Clock Out */}
                  <div className="col-span-3">
                    {isSick ? (
                      <span className="text-xs text-slate-300">--:--</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-600 font-mono">
                          {rec.clockOutTime || '--:--'}
                        </span>
                        {rec.clockOutTime && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                            <span>Terverifikasi</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Working Duration */}
                  <div className="col-span-2 sm:col-span-3 text-right flex items-center justify-end gap-1">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isSick ? 'text-rose-500' : 'text-slate-700'
                      }`}
                    >
                      {rec.workDurationHours || '-'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4 WFO / 1 WFH Schedule Policy & Weekend Banner */}
      <div className="flex flex-col gap-2">
        <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-center">
          <p className="text-xs text-emerald-800 font-medium">
            Jadwal Kerja Resmi PT JRS Indonesia: <strong>4 Hari WFO</strong> (Kantor Pusat) &amp;{' '}
            <strong>1 Hari WFH Bergilir</strong> per minggu.
          </p>
        </div>
        <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Weekend: Sabtu &amp; Minggu (Libur Resmi Operasional)
          </p>
        </div>
      </div>

      {/* Selected Day Timeline Detail Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rincian Presensi {selectedRecord.dayName}, {selectedRecord.date}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.employeeName} · {selectedRecord.officeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Face Snapshot Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                {selectedRecord.faceSnapshot ? (
                  <img
                    src={selectedRecord.faceSnapshot}
                    alt="Verifikasi Wajah"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-800">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Biometrik Wajah Terverifikasi</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Masuk: <strong>{selectedRecord.clockInTime}</strong> · Pulang:{' '}
                  <strong>{selectedRecord.clockOutTime || 'Aktif'}</strong>
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  GPS: {selectedRecord.latitude.toFixed(4)}, {selectedRecord.longitude.toFixed(4)} (
                  {selectedRecord.distanceMeters}m dari pusat radius)
                </p>
                {selectedRecord.notes && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
                    Catatan: {selectedRecord.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Daily Timeline Checkpoints */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Linimasa Aktivitas Harian
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(selectedRecord.checkpoints || [
                  {
                    time: selectedRecord.clockInTime,
                    location: selectedRecord.officeName,
                    label: `Clock In (${selectedRecord.workMode || 'WFO'} - Wajah & GPS Terverifikasi)`,
                  },
                  {
                    time: '12:00 WIB',
                    location: selectedRecord.officeName,
                    label: 'Istirahat Siang',
                  },
                  {
                    time: selectedRecord.clockOutTime || '17:00 WIB',
                    location: selectedRecord.officeName,
                    label: selectedRecord.clockOutTime ? 'Clock Out (Selesai Bekerja)' : 'Sedang Bekerja',
                  },
                ]).map((cp, idx) => (
                  <div key={idx} className="relative flex items-start justify-between text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div>
                      <p className="font-semibold text-slate-800">{cp.label}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {cp.location}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-600">{cp.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
