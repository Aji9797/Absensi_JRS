import React from 'react';
import { Home, Users, Calendar, Bell, Briefcase, MessageSquare } from 'lucide-react';
import { NavTab } from '../types/attendance';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadNotifCount: number;
  unreadChatCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadNotifCount,
  unreadChatCount = 0,
}) => {
  const tabs = [
    { id: 'HOME' as NavTab, label: 'Home', icon: Home },
    { id: 'TEAMS' as NavTab, label: 'Tim', icon: Users },
    { id: 'ATTENDANCE' as NavTab, label: 'Absen', icon: Calendar },
    { id: 'CHAT' as NavTab, label: 'Diskusi & Chat', icon: MessageSquare, badge: unreadChatCount },
    { id: 'NOTIFICATIONS' as NavTab, label: 'Notif', icon: Bell, badge: unreadNotifCount },
    { id: 'LEAVES' as NavTab, label: 'Cuti', icon: Briefcase },
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg px-1 py-1.5 flex items-center justify-around shrink-0 z-30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 transition-all relative group"
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              ) : null}
            </div>

            <span
              className={`text-[9.5px] font-medium tracking-tight mt-1 transition-colors truncate max-w-[58px] ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            >
              {tab.label}
            </span>

            {/* Subtle active dot */}
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5 animate-fade-in" />
            )}
          </button>
        );
      })}
    </div>
  );
};
