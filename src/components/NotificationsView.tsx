import React from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Building,
} from 'lucide-react';
import { AppNotification } from '../types/attendance';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onApproveNotification: (id: string) => void;
  onRejectNotification: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onApproveNotification,
  onRejectNotification,
  onMarkAllAsRead,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          <p className="text-xs text-slate-400">Pembaruan Sistem &amp; Permohonan Tim</p>
        </div>
        <button
          onClick={onMarkAllAsRead}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
        >
          Tandai Dibaca
        </button>
      </div>

      {/* Notifications Feed */}
      <div className="flex flex-col gap-3">
        {notifications.map((notif) => {
          return (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all ${
                notif.isRead
                  ? 'bg-white border-slate-100'
                  : 'bg-blue-50/40 border-blue-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar / Icon */}
                {notif.applicantAvatar ? (
                  <img
                    src={notif.applicantAvatar}
                    alt={notif.applicantName || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {notif.applicantName ? notif.applicantName : notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-snug">{notif.message}</p>

                  {/* Interactive Action Area (mirrors Absensi.jpg) */}
                  {notif.actionRequired ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => onApproveNotification(notif.id)}
                        className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors text-center"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => onRejectNotification(notif.id)}
                        className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors text-center"
                      >
                        REJECT
                      </button>
                    </div>
                  ) : notif.type === 'SYSTEM' ? (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium text-center shadow-sm">
                      3 Feb 2026 - Closed for Renovation
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
