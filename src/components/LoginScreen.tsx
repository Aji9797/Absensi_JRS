import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  Fingerprint,
  CheckCircle,
  AlertCircle,
  Camera,
  ArrowRight,
  Building,
} from 'lucide-react';
import { DEMO_ACCOUNTS } from '../data/mockData';
import { AuthUser, UserAccount } from '../types/attendance';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  accounts?: UserAccount[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, accounts }) => {
  const activeAccounts = accounts && accounts.length > 0 ? accounts : (DEMO_ACCOUNTS as UserAccount[]);
  const [email, setEmail] = useState<string>('natasha.k@company.com');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFaceAuthModal, setIsFaceAuthModal] = useState<boolean>(false);
  const [faceAuthProgress, setFaceAuthProgress] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const found = activeAccounts.find(
        (acc) =>
          (acc.email.toLowerCase() === email.trim().toLowerCase() ||
            acc.employeeIdNumber.toLowerCase() === email.trim().toLowerCase()) &&
          acc.password === password
      );

      if (found) {
        setIsLoading(false);
        onLoginSuccess({
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
          userRole: found.userRole,
          department: found.department,
          avatar: found.avatar,
          employeeIdNumber: found.employeeIdNumber,
          wfhRotationDay: found.wfhRotationDay,
        });
      } else {
        setIsLoading(false);
        setErrorMessage('Email / NIK atau Password salah. Anda dapat menggunakan tombol Akun Demo di bawah.');
      }
    }, 600);
  };

  const handleQuickDemoLogin = (account: UserAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        userRole: account.userRole,
        department: account.department,
        avatar: account.avatar,
        employeeIdNumber: account.employeeIdNumber,
        wfhRotationDay: account.wfhRotationDay,
      });
    }, 400);
  };

  // Biometric Face Login Simulator
  const handleFaceLoginTrigger = () => {
    setIsFaceAuthModal(true);
    setFaceAuthProgress(10);

    const interval = setInterval(() => {
      setFaceAuthProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFaceAuthModal(false);
            // Default to first account or Natasha Kirovska
            const account = activeAccounts.find(a => a.id === 'emp-001') || activeAccounts[0];
            onLoginSuccess({
              id: account.id,
              name: account.name,
              email: account.email,
              role: account.role,
              userRole: account.userRole,
              department: account.department,
              avatar: account.avatar,
              employeeIdNumber: account.employeeIdNumber,
              wfhRotationDay: account.wfhRotationDay,
            });
          }, 500);
          return 100;
        }
        return prev + 30;
      });
    }, 350);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 flex flex-col z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-3">
            <Fingerprint className="w-8 h-8 text-white" />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span className="text-lg font-extrabold tracking-widest text-slate-800 uppercase font-mono">
              JRS GEOFACE
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              ABSENSI
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            PT JRS INDONESIA · Presensi Geofencing GPS &amp; Verifikasi Wajah Real-Time
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Perusahaan / NIK Karyawan
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@company.com atau EMP-98241"
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => alert('Gunakan password demo: password123 (karyawan) atau admin123 (admin)')}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Ingat sesi masuk</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Memverifikasi Akun...</span>
            ) : (
              <>
                <span>Masuk ke Akun</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Face ID Quick Login Button */}
          <button
            type="button"
            onClick={handleFaceLoginTrigger}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Masuk Cepat dengan Face Recognition</span>
          </button>
        </form>

        {/* Quick Demo Access Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Akses Demo Instan (1-Klik)
          </p>

          <div className="flex flex-col gap-2">
            {activeAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickDemoLogin(acc)}
                className="w-full p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-700 truncate">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{acc.role}</p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      acc.userRole === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {acc.userRole === 'ADMIN' ? 'HR Admin' : 'Karyawan'}
                  </span>
                  {acc.wfhRotationDay && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      WFH: {acc.wfhRotationDay}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Face Biometric Login Modal Simulator */}
      {isFaceAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
            <div className="relative w-36 h-36 rounded-full border-4 border-indigo-500/80 p-2 mb-4 flex items-center justify-center overflow-hidden bg-slate-900 shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:10px_10px] opacity-30" />
              <img
                src={DEMO_ACCOUNTS[0].avatar}
                alt="Face Auth"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute left-0 right-0 h-1 bg-emerald-400 animate-scanline shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Verifikasi Wajah Biometrik</h3>
            <p className="text-xs text-slate-500 mt-1">
              Mendeteksi fitur biometrik wajah pengguna...
            </p>

            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
                style={{ width: `${faceAuthProgress}%` }}
              />
            </div>

            <span className="text-xs font-mono font-bold text-indigo-600 mt-2">
              {faceAuthProgress}% Terverifikasi
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
