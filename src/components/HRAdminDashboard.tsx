import React, { useState } from 'react';
import {
  Users,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  EyeOff,
  X,
  MapPin,
  Clock,
  FileSpreadsheet,
  FileText,
  Printer,
  LogOut,
  Home,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Pencil,
  Trash2,
  Save,
  Settings,
  Navigation,
  UserPlus,
} from 'lucide-react';
import {
  OfficeLocation,
  AttendanceRecord,
  LeaveRequest,
  WfhRosterItem,
  RotationDay,
  UserAccount,
} from '../types/attendance';
import {
  exportAttendanceToCSV,
  exportAttendanceToExcel,
  exportAttendanceToPDF,
} from '../utils/exportUtils';

interface HRAdminDashboardProps {
  offices: OfficeLocation[];
  onAddOffice?: (office: Omit<OfficeLocation, 'id'>) => void;
  onUpdateOfficeRadius: (officeId: string, newRadius: number) => void;
  onUpdateOfficeDetails?: (updatedOffice: OfficeLocation) => void;
  attendanceLogs: AttendanceRecord[];
  onUpdateAttendanceRecord?: (updatedRecord: AttendanceRecord) => void;
  onDeleteAttendanceRecord?: (recordId: string) => void;
  leaveRequests: LeaveRequest[];
  onUpdateLeaveStatus: (leaveId: string, status: 'APPROVED' | 'REJECTED') => void;
  onBackToEmployeeView: () => void;
  onLogout?: () => void;
  wfhRoster: WfhRosterItem[];
  onUpdateEmployeeWfhDay: (employeeId: string, newDay: RotationDay) => void;
  onUpdateEmployeeRosterItem?: (updatedItem: WfhRosterItem) => void;
  onAddAccount?: (newAccount: UserAccount) => void;
  accounts?: UserAccount[];
  onUpdateAccount?: (updatedAccount: UserAccount) => void;
  onDeleteAccount?: (accountId: string) => void;
  currentAdminName?: string;
}

const ROTATION_DAYS: RotationDay[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const HRAdminDashboard: React.FC<HRAdminDashboardProps> = ({
  offices,
  onUpdateOfficeRadius,
  onUpdateOfficeDetails,
  attendanceLogs,
  onUpdateAttendanceRecord,
  onDeleteAttendanceRecord,
  leaveRequests,
  onUpdateLeaveStatus,
  onBackToEmployeeView,
  onLogout,
  wfhRoster,
  onUpdateEmployeeWfhDay,
  onUpdateEmployeeRosterItem,
  onAddAccount,
  accounts = [],
  onUpdateAccount,
  onDeleteAccount,
  currentAdminName = 'Super Admin HR',
}) => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'ROSTER' | 'OFFICES' | 'LEAVES' | 'ACCOUNTS'>('LOGS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedWorkModeFilter, setSelectedWorkModeFilter] = useState<'ALL' | 'WFO' | 'WFH'>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [isVerifiedOnly, setIsVerifiedOnly] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<AttendanceRecord | null>(null);

  // Accounts Tab state
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<'ALL' | 'EMPLOYEE' | 'ADMIN'>('ALL');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccNIK, setEditAccNIK] = useState('');
  const [editAccEmail, setEditAccEmail] = useState('');
  const [editAccPassword, setEditAccPassword] = useState('');
  const [editAccRole, setEditAccRole] = useState('');
  const [editAccDept, setEditAccDept] = useState('');
  const [editAccUserRole, setEditAccUserRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [editAccWfhDay, setEditAccWfhDay] = useState<RotationDay>('Senin');
  const [editAccPhone, setEditAccPhone] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Roster Tab search & day filter
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterDayFilter, setRosterDayFilter] = useState<string>('ALL');

  // Edit Attendance Modal State
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editAttClockIn, setEditAttClockIn] = useState('');
  const [editAttClockOut, setEditAttClockOut] = useState('');
  const [editAttStatus, setEditAttStatus] = useState<AttendanceRecord['status']>('ON_TIME');
  const [editAttWorkMode, setEditAttWorkMode] = useState<'WFO' | 'WFH'>('WFO');
  const [editAttNotes, setEditAttNotes] = useState('');

  // Edit Office Modal State
  const [isEditingOffice, setIsEditingOffice] = useState(false);
  const [editOfficeName, setEditOfficeName] = useState('');
  const [editOfficeCity, setEditOfficeCity] = useState('');
  const [editOfficeAddress, setEditOfficeAddress] = useState('');
  const [editOfficeLat, setEditOfficeLat] = useState(0);
  const [editOfficeLon, setEditOfficeLon] = useState(0);
  const [editOfficeRadius, setEditOfficeRadius] = useState(100);

  // Edit Employee Modal State
  const [editingEmployee, setEditingEmployee] = useState<WfhRosterItem | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('');
  const [editEmpDept, setEditEmpDept] = useState('');
  const [editEmpWfhDay, setEditEmpWfhDay] = useState<RotationDay>('Senin');

  const openEditAttendance = (log: AttendanceRecord) => {
    setEditingAttendance(log);
    setEditAttClockIn(log.clockInTime);
    setEditAttClockOut(log.clockOutTime || '');
    setEditAttStatus(log.status);
    setEditAttWorkMode(log.workMode || 'WFO');
    setEditAttNotes(log.notes || '');
  };

  const handleSaveAttendanceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance || !onUpdateAttendanceRecord) return;
    onUpdateAttendanceRecord({
      ...editingAttendance,
      clockInTime: editAttClockIn,
      clockOutTime: editAttClockOut || undefined,
      status: editAttStatus,
      workMode: editAttWorkMode,
      notes: editAttNotes,
      editedBy: currentAdminName,
      editedAt: new Date().toISOString(),
      originalStatus: editingAttendance.originalStatus || editingAttendance.status,
    });
    setEditingAttendance(null);
  };

  const openEditOffice = (office: OfficeLocation) => {
    setIsEditingOffice(true);
    setEditOfficeName(office.name);
    setEditOfficeCity(office.city);
    setEditOfficeAddress(office.address);
    setEditOfficeLat(office.latitude);
    setEditOfficeLon(office.longitude);
    setEditOfficeRadius(office.radiusMeters);
  };

  const handleSaveOfficeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateOfficeDetails) return;
    onUpdateOfficeDetails({
      id: offices[0]?.id || 'office-hq-01',
      name: editOfficeName,
      city: editOfficeCity,
      address: editOfficeAddress,
      latitude: Number(editOfficeLat),
      longitude: Number(editOfficeLon),
      radiusMeters: Number(editOfficeRadius),
      isMainBranch: true,
    });
    setIsEditingOffice(false);
  };

  const openEditEmployee = (emp: WfhRosterItem) => {
    setEditingEmployee(emp);
    setEditEmpName(emp.employeeName);
    setEditEmpRole(emp.role);
    setEditEmpDept(emp.department);
    setEditEmpWfhDay(emp.wfhDay);
  };

  const handleSaveEmployeeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !onUpdateEmployeeRosterItem) return;
    onUpdateEmployeeRosterItem({
      ...editingEmployee,
      employeeName: editEmpName,
      role: editEmpRole,
      department: editEmpDept,
      wfhDay: editEmpWfhDay,
    });
    setEditingEmployee(null);
  };

  // Add Account Modal State
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('password123');
  const [newAccNIK, setNewAccNIK] = useState('');
  const [newAccRole, setNewAccRole] = useState('');
  const [newAccDept, setNewAccDept] = useState('Sales & Marketing');
  const [newAccUserRole, setNewAccUserRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [newAccWfhDay, setNewAccWfhDay] = useState<RotationDay>('Senin');
  const [newAccAvatar, setNewAccAvatar] = useState('');

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAccount) return;

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    ];
    const assignedAvatar =
      newAccAvatar.trim() || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newId =
      newAccUserRole === 'ADMIN'
        ? `adm-${Date.now().toString().slice(-4)}`
        : `emp-${Date.now().toString().slice(-4)}`;

    const generatedNIK =
      newAccNIK.trim() ||
      (newAccUserRole === 'ADMIN'
        ? `HR-${Math.floor(1000 + Math.random() * 9000)}`
        : `EMP-${Math.floor(10000 + Math.random() * 90000)}`);

    const accountToCreate: UserAccount = {
      id: newId,
      name: newAccName,
      email: newAccEmail.trim().toLowerCase(),
      password: newAccPassword.trim() || 'password123',
      role: newAccRole.trim() || (newAccUserRole === 'ADMIN' ? 'HR Operations Specialist' : 'Staff Associate'),
      userRole: newAccUserRole,
      department: newAccDept,
      employeeIdNumber: generatedNIK,
      wfhRotationDay: newAccWfhDay,
      avatar: assignedAvatar,
      description: `Giliran WFH: ${newAccWfhDay} (Didaftarkan HR Superadmin)`,
    };

    onAddAccount(accountToCreate);
    setIsAddingAccount(false);
    // Reset form
    setNewAccName('');
    setNewAccEmail('');
    setNewAccPassword('password123');
    setNewAccNIK('');
    setNewAccRole('');
    setNewAccAvatar('');
  };

  const openEditAccount = (acc: UserAccount) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccNIK(acc.employeeIdNumber);
    setEditAccEmail(acc.email);
    setEditAccPassword(acc.password);
    setEditAccRole(acc.role);
    setEditAccDept(acc.department);
    setEditAccUserRole(acc.userRole);
    setEditAccWfhDay(acc.wfhRotationDay || 'Senin');
    setEditAccPhone(acc.phone || '');
  };

  const handleSaveAccountEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !onUpdateAccount) return;

    onUpdateAccount({
      ...editingAccount,
      name: editAccName,
      employeeIdNumber: editAccNIK,
      email: editAccEmail.trim().toLowerCase(),
      password: editAccPassword,
      role: editAccRole,
      department: editAccDept,
      userRole: editAccUserRole,
      wfhRotationDay: editAccWfhDay,
      phone: editAccPhone,
    });
    setEditingAccount(null);
  };

  const handleDeleteAccountConfirm = (id: string) => {
    if (onDeleteAccount) {
      onDeleteAccount(id);
    }
    setDeletingAccountId(null);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter logs according to active filters
  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesSearch =
      log.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.officeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.employeeRole.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOffice =
      selectedOfficeFilter === 'ALL' || log.officeName === selectedOfficeFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || log.status === selectedStatusFilter;

    const matchesVerified = !isVerifiedOnly || log.isVerifiedFace;

    const matchesWorkMode =
      selectedWorkModeFilter === 'ALL' || (log.workMode || 'WFO') === selectedWorkModeFilter;

    const matchesStartDate = !startDateFilter || log.date >= startDateFilter;
    const matchesEndDate = !endDateFilter || log.date <= endDateFilter;

    return (
      matchesSearch &&
      matchesOffice &&
      matchesStatus &&
      matchesVerified &&
      matchesWorkMode &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const q = accountSearch.toLowerCase();
    const matchesSearch =
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.employeeIdNumber.toLowerCase().includes(q) ||
      acc.role.toLowerCase().includes(q) ||
      acc.department.toLowerCase().includes(q);

    const matchesRole =
      accountRoleFilter === 'ALL' || acc.userRole === accountRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Filter roster
  const filteredRoster = wfhRoster.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      item.role.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      item.department.toLowerCase().includes(rosterSearch.toLowerCase());
    const matchesDay = rosterDayFilter === 'ALL' || item.wfhDay === rosterDayFilter;
    return matchesSearch && matchesDay;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    setExportFeedback('Mengekspor CSV...');
    exportAttendanceToCSV(
      filteredLogs,
      `Rekap_Presensi_Payroll_${selectedOfficeFilter === 'ALL' ? 'Semua' : selectedOfficeFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;
    setExportFeedback('Mengekspor Excel (.xlsx)...');
    exportAttendanceToExcel(
      filteredLogs,
      `Rekap_Presensi_Payroll_${selectedOfficeFilter === 'ALL' ? 'Semua' : selectedOfficeFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      {
        officeFilter: selectedOfficeFilter === 'ALL' ? 'Kantor Pusat' : selectedOfficeFilter,
        statusFilter: selectedStatusFilter === 'ALL' ? 'Semua Status' : selectedStatusFilter,
      }
    );
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportPDF = () => {
    if (filteredLogs.length === 0) return;
    setExportFeedback('Menghasilkan Laporan PDF...');
    exportAttendanceToPDF(
      filteredLogs,
      `Laporan_Presensi_Payroll_${selectedOfficeFilter === 'ALL' ? 'Semua' : selectedOfficeFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      {
        officeFilter: selectedOfficeFilter === 'ALL' ? 'Kantor Pusat' : selectedOfficeFilter,
        statusFilter: selectedStatusFilter === 'ALL' ? 'Semua Status' : selectedStatusFilter,
        searchFilter: searchQuery || undefined,
      }
    );
    setTimeout(() => setExportFeedback(null), 2500);
  };

  // Kantor Pusat Tunggal
  const mainOffice = offices[0];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Portal HR &amp; Superadmin
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">Payroll Ready</span>
            {exportFeedback && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-pulse">
                ✓ {exportFeedback}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Dashboard Manajemen Presensi &amp; Roster WFH
          </h1>
          <p className="text-xs text-slate-500">
            Kantor Pusat Tunggal · Kebijakan 4 Hari WFO &amp; 1 Hari WFH Bergilir · Ekspor data ke CSV, Excel (.xlsx), atau PDF.
          </p>
        </div>

        {/* Global Export Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Download berkas CSV untuk import ke sistem payroll"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            title="Download format Microsoft Excel (.xlsx) dengan lembar ringkasan payroll"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            title="Download Laporan Resmi PDF siap cetak dengan lembar pengesahan"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-700" />
            <span>PDF Resmi</span>
          </button>

          <button
            onClick={onBackToEmployeeView}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Tampilan Karyawan</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-xs transition-colors"
              title="Keluar dari sesi HR Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Fully Dynamic) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Karyawan</p>
          <p className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
            {accounts.length > 0 ? accounts.filter((a) => a.userRole === 'EMPLOYEE').length : wfhRoster.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {accounts.length} Total Akun Terdaftar
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Hadir Tepat Waktu</p>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {attendanceLogs.filter((l) => l.status === 'ON_TIME').length}
          </p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Wajah &amp; GPS Valid</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Terlambat</p>
          <p className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
            {attendanceLogs.filter((l) => l.status === 'LATE').length}
          </p>
          <p className="text-[10px] text-amber-700 mt-0.5">Toleransi 15 mnt</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-semibold text-rose-500 uppercase">Cuti &amp; Izin</p>
          <p className="text-2xl font-extrabold text-rose-500 font-mono mt-1">
            {leaveRequests.filter((l) => l.status === 'APPROVED').length}
          </p>
          <p className="text-[10px] text-rose-700 mt-0.5">
            {leaveRequests.filter((l) => l.status === 'PENDING').length} Menunggu Persetujuan
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[11px] font-semibold text-indigo-600 uppercase">Titik Kantor</p>
          <p className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">
            {offices.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{offices[0]?.name?.split(' ')[0] || 'Kantor Pusat'}</p>
        </div>
      </div>

      {/* Navigation Tabs (Logs, Roster WFH, Offices, Leaves, Accounts) */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'LOGS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit Log Presensi &amp; Foto Biometrik ({attendanceLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'ROSTER'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Jadwal Giliran WFH Mingguan ({wfhRoster.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'ACCOUNTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Kelola Akun Pengguna ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('OFFICES')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'OFFICES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Konfigurasi Kantor Pusat &amp; Geofence
        </button>
        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'LEAVES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Persetujuan Pengajuan Cuti ({leaveRequests.length})
        </button>
      </div>

      {/* TAB 1: AUDIT LOGS & BIOMETRIC PHOTOS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama karyawan, jabatan, atau mode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Dropdowns & Checkboxes */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {/* Work Mode Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Mode:</span>
                <select
                  value={selectedWorkModeFilter}
                  onChange={(e) => setSelectedWorkModeFilter(e.target.value as 'ALL' | 'WFO' | 'WFH')}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Mode</option>
                  <option value="WFO">WFO (Kantor)</option>
                  <option value="WFH">WFH (Rumah)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ON_TIME">Tepat Waktu (On-Time)</option>
                  <option value="LATE">Terlambat</option>
                  <option value="OVERTIME">Lembur</option>
                  <option value="SICK_LEAVE">Izin Sakit</option>
                </select>
              </div>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-[10px] text-slate-400 font-medium">Tgl:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="text-[11px] font-mono text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                  title="Tanggal Mulai"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="text-[11px] font-mono text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                  title="Tanggal Selesai"
                />
              </div>

              {/* Liveness Checkbox */}
              <label className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={isVerifiedOnly}
                  onChange={(e) => setIsVerifiedOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-700">Wajah Valid Saja</span>
              </label>

              {/* Reset Filters button if any active */}
              {(searchQuery ||
                selectedStatusFilter !== 'ALL' ||
                selectedWorkModeFilter !== 'ALL' ||
                startDateFilter ||
                endDateFilter ||
                isVerifiedOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatusFilter('ALL');
                    setSelectedWorkModeFilter('ALL');
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setIsVerifiedOnly(false);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Quick Export Summary Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <p className="text-xs text-slate-500">
              Menampilkan <strong className="text-slate-800 font-mono">{filteredLogs.length}</strong> rekaman presensi terfilter siap ekspor untuk payroll.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Ekspor Terfilter:</span>
              <button
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <FileText className="w-3 h-3 text-slate-500" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredLogs.length === 0}
                className="py-1 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredLogs.length === 0}
                className="py-1 px-2.5 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-[11px] font-bold text-indigo-800 flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <Printer className="w-3 h-3 text-indigo-700" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Karyawan</th>
                  <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                  <th className="py-3 px-3">Lokasi / Mode</th>
                  <th className="py-3 px-3">Jarak Geofence</th>
                  <th className="py-3 px-3">Verifikasi Wajah</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={log.employeeAvatar}
                          alt={log.employeeName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{log.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{log.employeeRole}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-800">{log.date}</p>
                        {log.editedBy && (
                          <span
                            className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-semibold border border-purple-200"
                            title={`Diedit oleh ${log.editedBy}${log.notes ? ': ' + log.notes : ''}`}
                          >
                            Diedit HR
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        IN: <span className="text-emerald-600 font-bold">{log.clockInTime}</span> | OUT:{' '}
                        <span className="text-rose-500 font-bold">{log.clockOutTime || '--:--'}</span>
                      </p>
                    </td>

                    {/* Office / Mode */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{log.officeName}</span>
                        {log.workMode === 'WFH' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            WFH
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        GPS: {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                      </p>
                    </td>

                    {/* Distance */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.workMode === 'WFH'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.distanceMeters <= (mainOffice?.radiusMeters || 100)
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        {log.workMode === 'WFH' ? 'Bebas (WFH)' : `${log.distanceMeters} m`}
                      </span>
                    </td>

                    {/* Face Verification */}
                    <td className="py-3 px-3">
                      {log.isVerifiedFace ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Liveness Passed</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Izin Khusus</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditAttendance(log)}
                          className="py-1 px-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Koreksi / Edit data presensi ini"
                        >
                          <Edit2 className="w-3 h-3 text-amber-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setSelectedPhotoRecord(log)}
                          className="py-1 px-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Lihat foto snapshot wajah & GPS"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Bukti</span>
                        </button>

                        {onDeleteAttendanceRecord && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus rekaman presensi ${log.employeeName} pada ${log.date}?`)) {
                                onDeleteAttendanceRecord(log.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs inline-flex items-center transition-colors"
                            title="Hapus rekaman presensi"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JADWAL GILIRAN WFH MINGGUAN (ROSTER 4 WFO / 1 WFH) */}
      {activeTab === 'ROSTER' && (
        <div className="flex flex-col gap-5">
          {/* Roster Explanation & Policy Box */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                  Kebijakan Giliran Kerja Bergilir
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Aturan 4 Hari WFO di Kantor Pusat &amp; 1 Hari WFH Bergilir
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap karyawan mendapatkan 1 hari WFH dalam seminggu secara bergiliran agar kapasitas Kantor Pusat tetap optimal dan merata (~80% kehadiran setiap hari).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 bg-emerald-50 text-emerald-800 font-semibold px-3 py-1 rounded-xl border border-emerald-200">
                  Total: {wfhRoster.length} Karyawan Terdaftar
                </span>
              </div>
            </div>

            {/* 5 Day Distribution Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4">
              {ROTATION_DAYS.map((day) => {
                const employeesOnDay = wfhRoster.filter((r) => r.wfhDay === day);
                const wfoCount = wfhRoster.length - employeesOnDay.length;
                return (
                  <div
                    key={day}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">{day}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {employeesOnDay.length} WFH
                        </span>
                      </div>

                      <div className="space-y-1.5 my-2">
                        {employeesOnDay.map((emp) => (
                          <div key={emp.employeeId} className="flex items-center gap-1.5 text-[11px]">
                            <img
                              src={emp.avatar}
                              alt={emp.employeeName}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                            <span className="text-slate-800 font-medium truncate">{emp.employeeName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 flex justify-between">
                      <span>WFO di Kantor:</span>
                      <strong className="text-slate-800 font-mono">{wfoCount} org</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Roster Table & Modification */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Kelola Giliran Hari WFH Per Karyawan</h4>
                <p className="text-xs text-slate-400">
                  Ubah hari giliran WFH karyawan secara instan melalui dropdown di bawah ini.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari karyawan / jabatan..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Day Filter */}
                <select
                  value={rosterDayFilter}
                  onChange={(e) => setRosterDayFilter(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Semua Hari</option>
                  {ROTATION_DAYS.map((d) => (
                    <option key={d} value={d}>
                      Hari {d}
                    </option>
                  ))}
                </select>

                {/* Add Account Button */}
                {onAddAccount && (
                  <button
                    type="button"
                    onClick={() => setIsAddingAccount(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                    title="Tambah akun pengguna atau karyawan baru"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Akun</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Karyawan</th>
                    <th className="py-3 px-3">Departemen</th>
                    <th className="py-3 px-3">Jadwal WFO (4 Hari)</th>
                    <th className="py-3 px-3">Giliran WFH (1 Hari)</th>
                    <th className="py-3 px-3 text-right">Ubah Giliran WFH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoster.map((item) => {
                    const wfoDays = ROTATION_DAYS.filter((d) => d !== item.wfhDay).join(', ');
                    return (
                      <tr key={item.employeeId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.avatar}
                              alt={item.employeeName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">
                                {item.employeeName}
                              </p>
                              <p className="text-[10px] text-slate-400">{item.role}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {item.department}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                            {wfoDays}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <Home className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Hari {item.wfhDay}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <select
                              value={item.wfhDay}
                              onChange={(e) =>
                                onUpdateEmployeeWfhDay(item.employeeId, e.target.value as RotationDay)
                              }
                              className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-300 bg-white hover:border-blue-500 text-slate-800 focus:outline-none cursor-pointer"
                            >
                              {ROTATION_DAYS.map((d) => (
                                <option key={d} value={d}>
                                  Hari {d}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => openEditEmployee(item)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                              title="Edit Profil & Jabatan Karyawan"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MANAJEMEN AKUN PENGGUNA */}
      {activeTab === 'ACCOUNTS' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Manajemen Akun Pengguna &amp; Hak Akses ({filteredAccounts.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola kredensial login, kata sandi, NIK, peran Super Admin HR, dan karyawan PT JRS Indonesia.
              </p>
            </div>

            {onAddAccount && (
              <button
                type="button"
                onClick={() => setIsAddingAccount(true)}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Daftarkan Akun Baru</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Cari nama, NIK, email, jabatan, atau departemen..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {accountSearch && (
                <button
                  type="button"
                  onClick={() => setAccountSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Peran:</span>
              <select
                value={accountRoleFilter}
                onChange={(e) => setAccountRoleFilter(e.target.value as any)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Peran ({accounts.length})</option>
                <option value="EMPLOYEE">Karyawan ({accounts.filter((a) => a.userRole === 'EMPLOYEE').length})</option>
                <option value="ADMIN">Super Admin ({accounts.filter((a) => a.userRole === 'ADMIN').length})</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Karyawan / Pengguna</th>
                  <th className="py-3 px-3">NIK &amp; Departemen</th>
                  <th className="py-3 px-3">Jabatan &amp; Peran</th>
                  <th className="py-3 px-3">Giliran WFH</th>
                  <th className="py-3 px-3">Kata Sandi</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Tidak ada akun yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const isVisible = !!showPasswordMap[acc.id];
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 leading-tight truncate">
                                {acc.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                              {acc.phone && (
                                <p className="text-[10px] text-slate-400">{acc.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono font-semibold text-slate-800 text-[11px] block">
                            {acc.employeeIdNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {acc.department}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-medium text-slate-800 leading-tight">{acc.role}</p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                              acc.userRole === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {acc.userRole === 'ADMIN' ? 'Super Admin HR' : 'Karyawan'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {acc.wfhRotationDay ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Hari {acc.wfhRotationDay}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded-md w-fit">
                            <span>{isVisible ? acc.password : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(acc.id)}
                              className="text-slate-400 hover:text-slate-700 ml-1"
                              title={isVisible ? 'Sembunyikan' : 'Lihat kata sandi'}
                            >
                              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditAccount(acc)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Edit rincian akun"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteAccount && accounts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDeletingAccountId(acc.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                                title="Hapus akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EDIT AKUN PENGGUNA */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Akun: {editingAccount.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingAccount.employeeIdNumber} · {editingAccount.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountEdit} className="p-6 flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editAccName}
                    onChange={(e) => setEditAccName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIK / ID Karyawan</label>
                  <input
                    type="text"
                    required
                    value={editAccNIK}
                    onChange={(e) => setEditAccNIK(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Perusahaan</label>
                  <input
                    type="email"
                    required
                    value={editAccEmail}
                    onChange={(e) => setEditAccEmail(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kata Sandi (Password)</label>
                  <input
                    type="text"
                    required
                    value={editAccPassword}
                    onChange={(e) => setEditAccPassword(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jabatan / Posisi</label>
                  <input
                    type="text"
                    required
                    value={editAccRole}
                    onChange={(e) => setEditAccRole(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={editAccPhone}
                    onChange={(e) => setEditAccPhone(e.target.value)}
                    placeholder="+62 812-..."
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Departemen</label>
                  <select
                    value={editAccDept}
                    onChange={(e) => setEditAccDept(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sales & Marketing">Sales &amp; Marketing</option>
                    <option value="IT & Engineering">IT &amp; Engineering</option>
                    <option value="Human Resources & Payroll">Human Resources &amp; Payroll</option>
                    <option value="Finance & Accounting">Finance &amp; Accounting</option>
                    <option value="Operations & Logistics">Operations &amp; Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Peran Akses</label>
                  <select
                    value={editAccUserRole}
                    onChange={(e) => setEditAccUserRole(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Karyawan (Mobile Presensi)</option>
                    <option value="ADMIN">Super Admin HR (Portal Dashboard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Giliran Hari WFH Mingguan (Skema 4 WFO / 1 WFH)
                </label>
                <select
                  value={editAccWfhDay}
                  onChange={(e) => setEditAccWfhDay(e.target.value as RotationDay)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 font-semibold text-emerald-800 focus:outline-none focus:border-indigo-500"
                >
                  {ROTATION_DAYS.map((d) => (
                    <option key={d} value={d}>
                      Hari {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS AKUN */}
      {deletingAccountId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Akun Pengguna?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Akun pengguna ini akan dihapus dari sistem presensi dan jadwal roster WFH. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="w-full flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeletingAccountId(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccountConfirm(deletingAccountId)}
                className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KANTOR PUSAT TUNGGAL & GEOFENCE */}
      {activeTab === 'OFFICES' && (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-slate-500">
            Sistem menggunakan <strong>Kantor Pusat Tunggal</strong> (tanpa kantor cabang maupun lapangan) sesuai kebijakan terpadu.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Kartu Kantor Pusat Tunggal */}
            {mainOffice && (
              <div
                key={mainOffice.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Kantor Pusat Resmi (Tunggal)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {mainOffice.city}
                      </span>
                      <button
                        onClick={() => openEditOffice(mainOffice)}
                        className="py-1 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                        title="Edit nama kantor, alamat, koordinat GPS, dan radius geofence"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Kantor</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{mainOffice.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{mainOffice.address}</p>

                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Titik Koordinat GPS:</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        {mainOffice.latitude.toFixed(4)}, {mainOffice.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400">Radius Geofence Kantor:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {mainOffice.radiusMeters} Meter
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Ubah Radius Geofence:</span>
                  <div className="flex items-center gap-1.5">
                    {[50, 80, 100, 150].map((rad) => (
                      <button
                        key={rad}
                        onClick={() => onUpdateOfficeRadius(mainOffice.id, rad)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-colors ${
                          mainOffice.radiusMeters === rad
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {rad}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Kartu Kebijakan 4 Hari WFO + 1 Hari WFH Bergilir & Kunci Jam Pulang */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Kebijakan Jam Kerja &amp; WFH Bergilir
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">5 Hari Kerja</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Aturan 4 Hari WFO &amp; 1 Hari WFH Bergilir
                </h3>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900">4 Hari WFO di Kantor Pusat</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        Wajib berada di dalam radius toleransi 100 meter Kantor Pusat + verifikasi wajah biometrik liveness.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                    <Home className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900">1 Hari WFH Bergilir</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Bebas radius geofence kantor (presensi dari rumah) dengan jadwal hari yang berbeda untuk setiap karyawan.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Kunci Jam Pulang (Clock Out Lock: 17:00 WIB)</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Tombol absen pulang terkunci otomatis sebelum pukul 17:00 WIB untuk mencegah pulang dini tanpa izin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVES APPROVAL DESK */}
      {activeTab === 'LEAVES' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Daftar Permohonan Cuti Karyawan Menunggu Persetujuan
          </h3>

          <div className="flex flex-col divide-y divide-slate-100">
            {leaveRequests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src={req.employeeAvatar}
                    alt={req.employeeName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{req.employeeName}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {req.type} Leave
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Periode: <strong>{req.startDate}</strong> s/d <strong>{req.endDate}</strong> ({req.totalDays} Hari)
                    </p>
                    <p className="text-xs text-slate-500 italic mt-0.5">Alasan: "{req.reason}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => onUpdateLeaveStatus(req.id, 'APPROVED')}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        Setujui (Approve)
                      </button>
                      <button
                        onClick={() => onUpdateLeaveStatus(req.id, 'REJECTED')}
                        className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        Tolak
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: INSPECT PHOTO SNAPSHOT AUDIT */}
      {selectedPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Verifikasi Wajah Biometrik
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPhotoRecord.employeeName} · {selectedPhotoRecord.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhotoRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-slate-900 shadow-lg border-2 border-emerald-500/80 relative">
                {selectedPhotoRecord.faceSnapshot ? (
                  <img
                    src={selectedPhotoRecord.faceSnapshot}
                    alt="Biometric Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                    <ShieldCheck className="w-16 h-16 text-emerald-400 mb-2" />
                    <p className="text-xs font-semibold">Snapshot Otentik Terverifikasi</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <CheckCircle className="w-3 h-3" />
                  <span>Valid Face Match</span>
                </div>
              </div>

              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Titik Kantor:</span>
                  <span className="font-semibold text-slate-800">{selectedPhotoRecord.officeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jarak saat Clock In:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {selectedPhotoRecord.workMode === 'WFH'
                      ? '0 Meter (Presensi Rumah - WFH)'
                      : `${selectedPhotoRecord.distanceMeters} Meter (Dalam Radius Kantor)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Koordinat GPS:</span>
                  <span className="font-mono text-slate-700">
                    {selectedPhotoRecord.latitude.toFixed(6)}, {selectedPhotoRecord.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stempel Waktu:</span>
                  <span className="font-mono text-slate-800">
                    {selectedPhotoRecord.clockInTime} WIB
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPhotoRecord(null)}
                className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT ATTENDANCE RECORD */}
      {editingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Koreksi Data Presensi Karyawan
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingAttendance.employeeName} · {editingAttendance.date} ({editingAttendance.dayName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAttendance(null)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceEdit} className="p-6 flex flex-col gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">ID Presensi:</span>{' '}
                  <span className="font-mono text-slate-700 font-semibold">{editingAttendance.id}</span>
                </div>
                <div>
                  <span className="text-slate-400">Lokasi:</span>{' '}
                  <span className="font-semibold text-slate-800">{editingAttendance.officeName}</span>
                </div>
              </div>

              {/* Status Kehadiran */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Status Kehadiran</label>
                <select
                  value={editAttStatus}
                  onChange={(e) => setEditAttStatus(e.target.value as AttendanceRecord['status'])}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-semibold text-slate-800"
                >
                  <option value="ON_TIME">Tepat Waktu (ON_TIME)</option>
                  <option value="LATE">Terlambat (LATE)</option>
                  <option value="OVERTIME">Lembur (OVERTIME)</option>
                  <option value="SICK_LEAVE">Sakit / Izin (SICK_LEAVE)</option>
                  <option value="ABSENT">Alpa / Tidak Hadir (ABSENT)</option>
                </select>
              </div>

              {/* Jam Datang & Jam Pulang */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Jam Masuk (Clock In)</label>
                  <input
                    type="time"
                    required
                    value={editAttClockIn}
                    onChange={(e) => setEditAttClockIn(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Jam Pulang (Clock Out)</label>
                  <input
                    type="time"
                    value={editAttClockOut}
                    onChange={(e) => setEditAttClockOut(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Mode Kerja */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Mode Kerja</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAttWorkMode('WFO')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      editAttWorkMode === 'WFO'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>WFO (Kantor Pusat)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAttWorkMode('WFH')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      editAttWorkMode === 'WFH'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>WFH (Rumah)</span>
                  </button>
                </div>
              </div>

              {/* Catatan Koreksi HR */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Catatan Koreksi Super Admin <span className="text-slate-400 font-normal">(Audit Payroll)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Dispensasi dinas luar, penyesuaian jam masuk telah disetujui HRD..."
                  value={editAttNotes}
                  onChange={(e) => setEditAttNotes(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAttendance(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT OFFICE DETAILS & GEOFENCE */}
      {isEditingOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Konfigurasi Titik &amp; Geofence Kantor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pembaruan nama, alamat, koordinat GPS, dan radius presensi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingOffice(false)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficeEdit} className="p-6 flex flex-col gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Gedung / Kantor</label>
                <input
                  type="text"
                  required
                  value={editOfficeName}
                  onChange={(e) => setEditOfficeName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kota / Wilayah</label>
                  <input
                    type="text"
                    required
                    value={editOfficeCity}
                    onChange={(e) => setEditOfficeCity(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Radius Geofence (Meter)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={5000}
                    value={editOfficeRadius}
                    onChange={(e) => setEditOfficeRadius(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-emerald-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  value={editOfficeAddress}
                  onChange={(e) => setEditOfficeAddress(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Koordinat GPS */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Koordinat Titik Kantor (GPS)</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setEditOfficeLat(Number(pos.coords.latitude.toFixed(6)));
                            setEditOfficeLon(Number(pos.coords.longitude.toFixed(6)));
                          },
                          (err) => alert('Gagal membaca GPS: ' + err.message),
                          { enableHighAccuracy: true }
                        );
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Gunakan GPS Saya Saat Ini</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Latitude (Lintang)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={editOfficeLat}
                      onChange={(e) => setEditOfficeLat(Number(e.target.value))}
                      className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Longitude (Bujur)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={editOfficeLon}
                      onChange={(e) => setEditOfficeLon(Number(e.target.value))}
                      className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingOffice(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Konfigurasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT EMPLOYEE PROFILE */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/60">
              <div className="flex items-center gap-2.5">
                <img
                  src={editingEmployee.avatar}
                  alt={editingEmployee.employeeName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Profil Karyawan
                  </h3>
                  <p className="text-xs text-slate-500">ID: {editingEmployee.employeeId}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeEdit} className="p-6 flex flex-col gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Jabatan / Posisi</label>
                <input
                  type="text"
                  required
                  value={editEmpRole}
                  onChange={(e) => setEditEmpRole(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Departemen / Divisi</label>
                <input
                  type="text"
                  required
                  value={editEmpDept}
                  onChange={(e) => setEditEmpDept(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Giliran Hari WFH</label>
                <select
                  value={editEmpWfhDay}
                  onChange={(e) => setEditEmpWfhDay(e.target.value as RotationDay)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-emerald-800 focus:outline-none focus:border-blue-500"
                >
                  {ROTATION_DAYS.map((d) => (
                    <option key={d} value={d}>
                      Hari {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW USER / EMPLOYEE ACCOUNT */}
      {isAddingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Akun Pengguna Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan karyawan atau admin baru ke dalam sistem
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingAccount(false)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAccount} className="p-6 overflow-y-auto flex flex-col gap-3.5 text-xs">
              {/* Role Selection Switcher */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Tipe Peran (Akses Akun)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccUserRole('EMPLOYEE')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      newAccUserRole === 'EMPLOYEE'
                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Karyawan (Mobile Presensi)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccUserRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      newAccUserRole === 'ADMIN'
                        ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Super Admin HR (Dashboard)</span>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap & NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    NIK / ID Karyawan <span className="text-slate-400 font-normal">(Otomatis jika kosong)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={newAccUserRole === 'ADMIN' ? 'HR-0002' : 'EMP-98246'}
                    value={newAccNIK}
                    onChange={(e) => setNewAccNIK(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Perusahaan *</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@company.com"
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kata Sandi (Password) *</label>
                  <input
                    type="text"
                    required
                    value={newAccPassword}
                    onChange={(e) => setNewAccPassword(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Departemen & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Departemen / Divisi</label>
                  <select
                    value={newAccDept}
                    onChange={(e) => setNewAccDept(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sales & Marketing">Sales &amp; Marketing</option>
                    <option value="IT & Engineering">IT &amp; Engineering</option>
                    <option value="Human Resources & Payroll">Human Resources &amp; Payroll</option>
                    <option value="Finance & Accounting">Finance &amp; Accounting</option>
                    <option value="Operations & Logistics">Operations &amp; Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jabatan / Posisi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Frontend Developer"
                    value={newAccRole}
                    onChange={(e) => setNewAccRole(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Giliran Hari WFH */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Giliran Hari WFH Mingguan <span className="text-slate-400 font-normal">(Skema 4 WFO / 1 WFH)</span>
                </label>
                <select
                  value={newAccWfhDay}
                  onChange={(e) => setNewAccWfhDay(e.target.value as RotationDay)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-emerald-800 focus:outline-none focus:border-indigo-500"
                >
                  {ROTATION_DAYS.map((d) => (
                    <option key={d} value={d}>
                      Hari {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL Avatar (Opsional) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  URL Foto Profil <span className="text-slate-400 font-normal">(Opsional, otomatis jika kosong)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newAccAvatar}
                  onChange={(e) => setNewAccAvatar(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
