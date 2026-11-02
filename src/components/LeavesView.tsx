import React, { useState, useMemo } from 'react';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  X,
  User,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { EmployeeProfile, LeaveRequest, LeaveType } from '../types/attendance';

interface LeavesViewProps {
  employee: EmployeeProfile;
  leaveRequests: LeaveRequest[];
  onSubmitLeave: (newLeave: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  employee,
  leaveRequests,
  onSubmitLeave,
}) => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState<string>('');
  const [filterScope, setFilterScope] = useState<'MINE' | 'ALL'>('MINE');

  const remainingLeave = Math.max(0, employee.totalLeave - employee.usedLeave);
  const progressPercent = Math.min(
    100,
    Math.round((remainingLeave / Math.max(1, employee.totalLeave)) * 100)
  );

  const displayedRequests = useMemo(() => {
    if (filterScope === 'MINE') {
      return leaveRequests.filter((r) => r.employeeId === employee.id);
    }
    return leaveRequests;
  }, [leaveRequests, filterScope, employee.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      alert('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onSubmitLeave({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeAvatar: employee.avatar,
      type: leaveType,
      startDate,
      endDate,
      totalDays: Math.max(1, totalDays),
      reason,
    });

    setIsApplyModalOpen(false);
    setReason('');
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-slate-800">Saldo &amp; Cuti</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              JRS
            </span>
          </div>
          <p className="text-xs text-slate-400">Saldo Hak Cuti Karyawan &amp; Formulir Pengajuan</p>
        </div>
        <button
          type="button"
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajukan Cuti</span>
        </button>
      </div>

      {/* Big Circular Leave Balance Ring */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex flex-col items-center">
        <div
          onClick={() => setIsApplyModalOpen(true)}
          className="relative w-48 h-48 cursor-pointer group transition-transform duration-300 hover:scale-105"
          title="Klik untuk mengajukan cuti baru"
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#f1f5f9"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Active progress ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#0284c7"
              strokeWidth="7"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text in Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-slate-800 font-mono tracking-tight">
              {remainingLeave < 10 ? `0${remainingLeave}` : remainingLeave}
            </span>
            <span className="text-xs font-semibold text-slate-600">Sisa Hari Cuti</span>
            <span className="text-[10px] text-blue-600 font-medium mt-1 group-hover:underline">
              + Ajukan Sekarang
            </span>
          </div>
        </div>

        {/* Total Leaves vs Leaves Used Metrics */}
        <div className="w-full grid grid-cols-2 pt-6 mt-4 border-t border-slate-100 text-center">
          <div className="pr-4 border-r border-slate-100">
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {employee.totalLeave}
            </span>
            <p className="text-[11px] text-slate-400">Total Hak Cuti Tahunan</p>
          </div>
          <div className="pl-4">
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {employee.usedLeave}
            </span>
            <p className="text-[11px] text-slate-400">Cuti Terpakai</p>
          </div>
        </div>

        {/* 4 Leave Subtypes Strip */}
        <div className="w-full grid grid-cols-4 gap-2 pt-5 text-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border border-blue-200 text-blue-700 bg-blue-50/50 flex items-center justify-center font-bold text-xs font-mono mb-1">
              {employee.casualLeave}
            </div>
            <span className="text-[10px] text-slate-500 leading-tight">Casual Leave</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border border-rose-200 text-rose-700 bg-rose-50/50 flex items-center justify-center font-bold text-xs font-mono mb-1">
              {employee.medicalLeave}
            </div>
            <span className="text-[10px] text-slate-500 leading-tight">Medical Leave</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border border-amber-200 text-amber-700 bg-amber-50/50 flex items-center justify-center font-bold text-xs font-mono mb-1">
              {employee.annualLeave}
            </div>
            <span className="text-[10px] text-slate-500 leading-tight">Annual Leave</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border border-purple-200 text-purple-700 bg-purple-50/50 flex items-center justify-center font-bold text-xs font-mono mb-1">
              {employee.maternityLeave}
            </div>
            <span className="text-[10px] text-slate-500 leading-tight">Maternity Leave</span>
          </div>
        </div>
      </div>

      {/* Riwayat Permohonan Cuti */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Riwayat Pengajuan Cuti
          </h3>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFilterScope('MINE')}
              className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                filterScope === 'MINE'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuti Saya
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('ALL')}
              className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                filterScope === 'ALL'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tim ({leaveRequests.length})
            </button>
          </div>
        </div>

        {displayedRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">Belum ada pengajuan cuti</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Gunakan tombol "Ajukan Cuti" di atas untuk membuat permohonan baru.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {displayedRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">
                        {req.type} Leave ({req.totalDays} Hari)
                      </h4>
                      {filterScope === 'ALL' && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          · {req.employeeName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {req.startDate} s/d {req.endDate}
                    </p>
                    <p className="text-[10px] text-slate-400 italic truncate mt-0.5">
                      "{req.reason}"
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}
                  >
                    {req.status === 'APPROVED' ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Disetujui HR</span>
                      </>
                    ) : req.status === 'REJECTED' ? (
                      <>
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Ditolak HR</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Menunggu HR</span>
                      </>
                    )}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">{req.appliedDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form Pengajuan Cuti Baru */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Form Pengajuan Cuti Baru</h3>
                <p className="text-xs text-slate-500">PT JRS Indonesia · Portal Karyawan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jenis Cuti
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ANNUAL">Annual Leave (Cuti Tahunan)</option>
                  <option value="CASUAL">Casual Leave (Izin Keperluan Pribadi)</option>
                  <option value="SICK">Medical / Sick Leave (Sakit)</option>
                  <option value="MATERNITY">Maternity Leave (Cuti Melahirkan)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Selesai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Alasan / Keterangan Cuti
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Keperluan keluarga mendesak dan renovasi rumah..."
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
