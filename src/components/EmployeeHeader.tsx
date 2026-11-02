import React, { useState } from 'react';
import { Shield, Sparkles, User, LogOut, Check, Building, Phone, Mail, X } from 'lucide-react';
import { EmployeeProfile } from '../types/attendance';

interface EmployeeHeaderProps {
  employee: EmployeeProfile;
  onOpenAdmin: () => void;
  isAdminAvailable?: boolean;
  onLogout?: () => void;
}

export const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  employee,
  onOpenAdmin,
  isAdminAvailable = false,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Status / App Bar */}
      <div className="w-full px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
        {/* Brand wordmark matching Neomeric reference */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-xs tracking-tighter">
            JRS
          </div>
          <span className="text-sm font-extrabold tracking-widest text-slate-800 uppercase font-mono">
            JRS NEOMERIC
          </span>
        </div>

        {/* Right side profile avatar & Admin switcher */}
        <div className="flex items-center gap-2">
          {isAdminAvailable && (
            <button
              onClick={onOpenAdmin}
              className="py-1 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
              title="Masuk ke Portal Admin / HR"
            >
              <Shield className="w-3 h-3 text-indigo-600" />
              <span>HR Admin</span>
            </button>
          )}

          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform"
          >
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center relative">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative mb-3">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <h3 className="text-base font-bold text-slate-900">{employee.name}</h3>
            <p className="text-xs text-blue-600 font-semibold">{employee.role}</p>
            <p className="text-[11px] text-slate-400">{employee.department}</p>

            <div className="w-full bg-slate-50 rounded-2xl p-3.5 my-4 text-xs space-y-2 border border-slate-100 text-left">
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{employee.employeeIdNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{employee.phone}</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              {isAdminAvailable && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  <span>Buka Dashboard Superadmin</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
