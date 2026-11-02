import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Send,
  Bell,
  Search,
  CheckCircle,
  BarChart3,
  Building,
  Home,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { TEAM_MEMBERS, INITIAL_WFH_ROSTER } from '../data/mockData';
import { WfhRosterItem, RotationDay } from '../types/attendance';

interface TeamsViewProps {
  onNavigateToOffice: () => void;
  wfhRoster?: WfhRosterItem[];
  currentDay?: RotationDay;
  onOpenChatWithMember?: (memberId: string) => void;
}

const ROTATION_DAYS: RotationDay[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const TeamsView: React.FC<TeamsViewProps> = ({
  onNavigateToOffice,
  wfhRoster = INITIAL_WFH_ROSTER,
  currentDay = 'Rabu',
  onOpenChatWithMember,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alertSentId, setAlertSentId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ROSTER' | 'MEMBERS'>('ROSTER');

  const departments = ['ALL', 'Sales & Marketing', 'Engineering & Product', 'Operations'];

  // Combine static TEAM_MEMBERS with dynamic wfhRoster so all registered employees show up
  const allMembers = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Seed with TEAM_MEMBERS
    TEAM_MEMBERS.forEach((m) => {
      map.set(m.id, { ...m });
    });

    // 2. Add or update with dynamic wfhRoster
    wfhRoster.forEach((r) => {
      const existing = map.get(r.employeeId);
      if (existing) {
        map.set(r.employeeId, {
          ...existing,
          name: r.employeeName,
          role: r.role,
          department: r.department,
          avatar: r.avatar,
        });
      } else {
        map.set(r.employeeId, {
          id: r.employeeId,
          name: r.employeeName,
          role: r.role,
          department: r.department,
          clockIn: '09:00am',
          clockOut: '--:--',
          status: 'PRESENT',
          avatar: r.avatar,
          workingHours: '7h 30m',
          progressPct: 80,
        });
      }
    });

    return Array.from(map.values());
  }, [wfhRoster]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'ALL' || m.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [allMembers, searchQuery, selectedDept]);

  const handleSendAlert = (id: string, name: string) => {
    setAlertSentId(id);
    setTimeout(() => {
      setAlertSentId(null);
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-slate-800">Tim &amp; Roster</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              JRS
            </span>
          </div>
          <p className="text-xs text-slate-400">Status Kehadiran &amp; Roster WFH Tim PT JRS Indonesia</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Hari Ini: {currentDay}</span>
        </div>
      </div>

      {/* Quick Action Category Tiles */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('MEMBERS')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all border text-center group ${
            activeSubTab === 'MEMBERS'
              ? 'bg-blue-100/80 border-blue-300 text-blue-700'
              : 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-600 border-blue-100'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold leading-tight text-slate-700">Daftar Tim</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ROSTER')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all border text-center group ${
            activeSubTab === 'ROSTER'
              ? 'bg-amber-100/80 border-amber-300 text-amber-800'
              : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-600 border-amber-100'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold leading-tight text-slate-700">Roster WFH</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToOffice}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-50/80 hover:bg-purple-100/80 text-purple-600 transition-all border border-purple-100 text-center group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
            <Building className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold leading-tight text-slate-700">Kantor Pusat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ROSTER')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-600 transition-all border border-emerald-100 text-center group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold leading-tight text-slate-700">Siklus 4/1</span>
        </button>
      </div>

      {/* Roster WFH Mingguan Section */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Jadwal Giliran WFH Tim Mingguan (4 WFO / 1 WFH)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">1 Hari/Minggu</span>
        </div>

        <p className="text-[11px] text-slate-500 leading-tight">
          Giliran WFH dijadwalkan berbeda untuk tiap karyawan agar Kantor Pusat tetap beroperasi normal dengan kehadiran rata-rata 80% setiap hari kerja.
        </p>

        {/* 5-Day Roster Week Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          {ROTATION_DAYS.map((day) => {
            const isToday = currentDay === day;
            const dayEmployees = wfhRoster.filter((r) => r.wfhDay === day);
            return (
              <div
                key={day}
                className={`p-2.5 rounded-xl border transition-all ${
                  isToday
                    ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[11px] font-bold ${
                      isToday ? 'text-blue-800' : 'text-slate-800'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                      HARI INI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1 rounded bg-slate-200 text-slate-600">
                      {dayEmployees.length} WFH
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayEmployees.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">Semua WFO</span>
                  ) : (
                    dayEmployees.map((emp) => (
                      <div key={emp.employeeId} className="flex items-center gap-1.5">
                        <img
                          src={emp.avatar}
                          alt={emp.employeeName}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="text-[10px] font-medium text-slate-800 truncate">
                          {emp.employeeName.split(' ')[0]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Filter Departemen:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs font-semibold text-blue-600 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Departemen</option>
              {departments
                .filter((d) => d !== 'ALL')
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">PT JRS Indonesia</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div>
            <span className="text-lg font-bold text-slate-800 font-mono">
              {allMembers.filter((m) => m.status === 'PRESENT').length}/{allMembers.length}
            </span>
            <p className="text-[10px] text-slate-400">Hadir Hari Ini</p>
          </div>
          <div className="border-x border-slate-100">
            <span className="text-lg font-bold text-emerald-600 font-mono">09:12</span>
            <p className="text-[10px] text-slate-400">Rata-rata Clock In</p>
          </div>
          <div>
            <span className="text-lg font-bold text-indigo-600 font-mono">17:00</span>
            <p className="text-[10px] text-slate-400">Jam Pulang Resmi</p>
          </div>
        </div>
      </div>

      {/* Member Attendance List with WFH Rotation Badges */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800">
            Daftar Anggota &amp; Giliran WFH ({filteredMembers.length})
          </span>
          <div className="relative w-36">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] pl-7 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {filteredMembers.map((member) => {
            const rosterItem = wfhRoster.find((r) => r.employeeId === member.id);
            const wfhDay = rosterItem?.wfhDay || 'Rabu';
            const isWfhToday = wfhDay === currentDay;

            return (
              <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isWfhToday
                          ? 'bg-emerald-500'
                          : member.status === 'PRESENT'
                          ? 'bg-emerald-500'
                          : member.status === 'LATE'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                        {member.name}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        WFH: {wfhDay}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500">
                      <span className="text-emerald-600">IN {member.clockIn}</span>
                      <span>OUT {member.clockOut}</span>
                    </div>
                  </div>
                </div>

                {/* Status Action */}
                <div className="shrink-0 flex items-center gap-2">
                  {onOpenChatWithMember && (
                    <button
                      type="button"
                      onClick={() => onOpenChatWithMember(member.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 transition-colors"
                      title={`Chat dengan ${member.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {member.status === 'ABSENT' ? (
                    <button
                      type="button"
                      onClick={() => handleSendAlert(member.id, member.name)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      {alertSentId === member.id ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Terkirim</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Kirim Alert</span>
                        </>
                      )}
                    </button>
                  ) : member.status === 'ON_LEAVE' ? (
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Cuti Disetujui
                    </span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-bold text-slate-700 font-mono">
                        {member.workingHours}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-medium">
                        {isWfhToday ? 'WFH Aktif' : 'WFO Kantor'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
