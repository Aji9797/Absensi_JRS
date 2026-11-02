/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Shield,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Compass,
  Building,
  LogOut,
  User,
} from 'lucide-react';
import {
  OfficeLocation,
  AttendanceRecord,
  EmployeeProfile,
  LeaveRequest,
  AppNotification,
  NavTab,
  AuthUser,
  WorkMode,
  RotationDay,
  WfhRosterItem,
  UserAccount,
  ChatConversation,
  ChatMessage,
  DiscussionPost,
} from './types/attendance';
import {
  DEFAULT_OFFICES,
  calculateHaversineDistance,
  formatDistance,
} from './utils/geoUtils';
import {
  CURRENT_EMPLOYEE,
  INITIAL_ATTENDANCE_HISTORY,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_NOTIFICATIONS,
  DEMO_ACCOUNTS,
  INITIAL_WFH_ROSTER,
  INITIAL_CONVERSATIONS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_DISCUSSIONS,
} from './data/mockData';
import { EmployeeHeader } from './components/EmployeeHeader';
import { NeomericClockButton } from './components/NeomericClockButton';
import { OfficeLocationCard } from './components/OfficeLocationCard';
import { FaceScannerModal } from './components/FaceScannerModal';
import { TeamsView } from './components/TeamsView';
import { AttendanceCalendarView } from './components/AttendanceCalendarView';
import { LeavesView } from './components/LeavesView';
import { NotificationsView } from './components/NotificationsView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HRAdminDashboard } from './components/HRAdminDashboard';
import { LoginScreen } from './components/LoginScreen';
import { ChatDiscussionView } from './components/ChatDiscussionView';

export default function App() {
  // User Authentication State (defaults to null or saved user from localStorage)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('geoface_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Dynamic User Accounts (Persistent in localStorage, initialized with DEMO_ACCOUNTS)
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('geoface_accounts');
    return saved ? JSON.parse(saved) : (DEMO_ACCOUNTS as UserAccount[]);
  });

  useEffect(() => {
    localStorage.setItem('geoface_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Role Based Access Control
  const isSuperAdmin = currentUser?.userRole === 'ADMIN';

  // Navigation & View mode
  const [appMode, setAppMode] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [currentTab, setCurrentTab] = useState<NavTab>('HOME');
  const [previewFrame, setPreviewFrame] = useState<'MOBILE_FRAME' | 'FULL_WIDTH'>('MOBILE_FRAME');

  // Security Guard: Prevent non-admin users from accessing HR Admin Dashboard
  useEffect(() => {
    if (appMode === 'ADMIN' && !isSuperAdmin) {
      setAppMode('EMPLOYEE');
      setToast({
        title: 'Akses Dibatasi',
        message: 'Portal HR Superadmin hanya dapat diakses oleh akun Administrator (HR).',
        type: 'WARNING',
      });
    }
  }, [appMode, isSuperAdmin]);

  // Core Data - Kantor Pusat Tunggal (Persistent in localStorage)
  const [employee, setEmployee] = useState<EmployeeProfile>(CURRENT_EMPLOYEE);
  const [offices, setOffices] = useState<OfficeLocation[]>(() => {
    const saved = localStorage.getItem('geoface_offices');
    return saved ? JSON.parse(saved) : DEFAULT_OFFICES;
  });
  const [activeOffice, setActiveOffice] = useState<OfficeLocation>(() => {
    const saved = localStorage.getItem('geoface_offices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return DEFAULT_OFFICES[0];
  });

  // Work Mode: 4 Hari WFO & 1 Hari WFH Bergilir
  const [workMode, setWorkMode] = useState<WorkMode>('WFO');

  // Weekly WFH Roster State
  const [wfhRoster, setWfhRoster] = useState<WfhRosterItem[]>(() => {
    const saved = localStorage.getItem('geoface_wfh_roster');
    return saved ? JSON.parse(saved) : INITIAL_WFH_ROSTER;
  });

  // Calculate real Indonesian day of the week
  const getTodayRotationDay = (): RotationDay => {
    const day = new Date().getDay();
    switch (day) {
      case 1:
        return 'Senin';
      case 2:
        return 'Selasa';
      case 3:
        return 'Rabu';
      case 4:
        return 'Kamis';
      case 5:
        return 'Jumat';
      default:
        return 'Rabu';
    }
  };

  const [currentDay, setCurrentDay] = useState<RotationDay>(getTodayRotationDay);

  // Sync roster to local storage
  useEffect(() => {
    localStorage.setItem('geoface_wfh_roster', JSON.stringify(wfhRoster));
  }, [wfhRoster]);

  // Determine current employee's assigned WFH day from roster or profile
  const currentRosterItem = wfhRoster.find(
    (r) => r.employeeId === (currentUser?.id || employee.id)
  );
  const employeeWfhDay: RotationDay =
    currentRosterItem?.wfhDay || currentUser?.wfhRotationDay || employee.wfhRotationDay || 'Rabu';

  const isWfhTurnToday = currentDay === employeeWfhDay;

  // Automatically sync workMode to WFH if today is employee's turn, else WFO
  useEffect(() => {
    setWorkMode(isWfhTurnToday ? 'WFH' : 'WFO');
  }, [currentDay, employeeWfhDay, isWfhTurnToday]);

  const handleUpdateEmployeeWfhDay = (employeeId: string, newDay: RotationDay) => {
    setWfhRoster((prev) =>
      prev.map((item) => (item.employeeId === employeeId ? { ...item, wfhDay: newDay } : item))
    );
    if (employee.id === employeeId) {
      setEmployee((prev) => ({ ...prev, wfhRotationDay: newDay }));
    }
    showToast(
      'Giliran WFH Diperbarui',
      `Jadwal WFH karyawan berhasil diubah ke hari ${newDay}.`,
      'SUCCESS'
    );
  };

  // Attendance Shift State
  const [isClockedIn, setIsClockedIn] = useState<boolean>(() => {
    return localStorage.getItem('geoface_is_clocked_in') === 'true';
  });
  const [clockInTime, setClockInTime] = useState<string | null>(() => {
    return localStorage.getItem('geoface_clock_in_time') || null;
  });
  const [clockOutTime, setClockOutTime] = useState<string | null>(() => {
    return localStorage.getItem('geoface_clock_out_time') || null;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('geoface_records');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_HISTORY;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('geoface_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('geoface_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Diskusi & Chat State (Persistent in localStorage)
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const saved = localStorage.getItem('geoface_conversations');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('geoface_chat_messages');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => {
    const saved = localStorage.getItem('geoface_discussions');
    return saved ? JSON.parse(saved) : INITIAL_DISCUSSIONS;
  });

  const [targetChatId, setTargetChatId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('geoface_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('geoface_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('geoface_discussions', JSON.stringify(discussions));
  }, [discussions]);

  // GPS Coordinates & Geofencing
  const [userLat, setUserLat] = useState<number>(activeOffice.latitude + 0.0002);
  const [userLon, setUserLon] = useState<number>(activeOffice.longitude + 0.0002);
  const [isSimulatedLocation, setIsSimulatedLocation] = useState<boolean>(true);
  const [distanceMeters, setDistanceMeters] = useState<number>(28);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(true);

  // Modals & Feedback
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerMode, setScannerMode] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN');
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: 'SUCCESS' | 'WARNING';
  } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('geoface_offices', JSON.stringify(offices));
  }, [offices]);

  useEffect(() => {
    localStorage.setItem('geoface_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('geoface_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('geoface_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('geoface_is_clocked_in', String(isClockedIn));
    if (clockInTime) localStorage.setItem('geoface_clock_in_time', clockInTime);
    if (clockOutTime) localStorage.setItem('geoface_clock_out_time', clockOutTime);
  }, [isClockedIn, clockInTime, clockOutTime]);

  // Try real browser geolocation on initial load if supported
  useEffect(() => {
    if (navigator.geolocation && !isSimulatedLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
        },
        (err) => {
          console.log('GPS browser not permitted, defaulting to simulated:', err.message);
          setIsSimulatedLocation(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isSimulatedLocation]);

  // Recalculate distance and geofence status
  useEffect(() => {
    const dist = calculateHaversineDistance(
      userLat,
      userLon,
      activeOffice.latitude,
      activeOffice.longitude
    );
    setDistanceMeters(dist);
    setIsWithinGeofence(dist <= activeOffice.radiusMeters);
  }, [userLat, userLon, activeOffice]);

  // Switch simulation scenario
  const handleSetSimulation = (inside: boolean) => {
    setIsSimulatedLocation(true);
    if (inside) {
      // 25 meters inside radius
      setUserLat(activeOffice.latitude + 0.00015);
      setUserLon(activeOffice.longitude + 0.0001);
      showToast('Lokasi Terupdate', `Anda berada di dalam radius ${activeOffice.name} (25m)`, 'SUCCESS');
    } else {
      // 850 meters outside
      setUserLat(activeOffice.latitude + 0.0075);
      setUserLon(activeOffice.longitude + 0.0055);
      showToast('Di Luar Jangkauan', `Posisi Anda 850m dari kantor ${activeOffice.name}`, 'WARNING');
    }
  };

  const handleUseRealGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsSimulatedLocation(false);
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
          showToast('GPS Browser Aktif', 'Menggunakan koordinat satelit asli perangkat Anda.', 'SUCCESS');
        },
        (err) => {
          showToast('GPS Gagal', 'Izin lokasi tidak diberikan. Kembali ke mode simulasi.', 'WARNING');
        }
      );
    }
  };

  const showToast = (title: string, message: string, type: 'SUCCESS' | 'WARNING' = 'SUCCESS') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Diskusi & Chat Handlers
  const handleSendMessage = (msgData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeFormatted,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleLikeMessage = (msgId: string) => {
    const userId = currentUser?.id || employee.id;
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const currentLikes = m.likes || [];
        const hasLiked = currentLikes.includes(userId);
        return {
          ...m,
          likes: hasLiked ? currentLikes.filter((id) => id !== userId) : [...currentLikes, userId],
        };
      })
    );
  };

  const handleCreateDiscussion = (
    postData: Omit<DiscussionPost, 'id' | 'createdAt' | 'likes' | 'comments'>
  ) => {
    const newPost: DiscussionPost = {
      ...postData,
      id: `post-${Date.now()}`,
      createdAt: 'Baru saja',
      likes: [currentUser?.id || employee.id],
      comments: [],
    };
    setDiscussions((prev) => [newPost, ...prev]);
    showToast('Topik Diterbitkan', `Diskusi "${newPost.title}" berhasil dipublikasikan.`, 'SUCCESS');
  };

  const handleLikeDiscussion = (postId: string) => {
    const userId = currentUser?.id || employee.id;
    setDiscussions((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes.includes(userId);
        return {
          ...p,
          likes: hasLiked ? p.likes.filter((id) => id !== userId) : [...p.likes, userId],
        };
      })
    );
  };

  const handleAddDiscussionComment = (postId: string, content: string) => {
    const user = currentUser || employee;
    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: user.avatar,
      content,
      createdAt: 'Baru saja',
      likes: [],
    };
    setDiscussions((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
    showToast('Komentar Terkirim', 'Tanggapan Anda berhasil ditambahkan ke diskusi.', 'SUCCESS');
  };

  const handleLikeDiscussionComment = (postId: string, commentId: string) => {
    const userId = currentUser?.id || employee.id;
    setDiscussions((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            const hasLiked = c.likes.includes(userId);
            return {
              ...c,
              likes: hasLiked ? c.likes.filter((id) => id !== userId) : [...c.likes, userId],
            };
          }),
        };
      })
    );
  };

  const handleOpenChatWithMember = (memberId: string) => {
    const targetAccount = accounts.find((a) => a.id === memberId);
    const existing = conversations.find(
      (c) => c.type === 'DIRECT' && c.participantIds?.includes(memberId)
    );

    if (existing) {
      setTargetChatId(existing.id);
    } else if (targetAccount) {
      const newConvId = `dm-${targetAccount.id}`;
      const newConv: ChatConversation = {
        id: newConvId,
        name: targetAccount.name,
        type: 'DIRECT',
        category: 'DM',
        participantIds: [targetAccount.id, currentUser?.id || employee.id],
        avatar: targetAccount.avatar,
        description: targetAccount.role,
        lastMessage: 'Percakapan baru dimulai',
        lastMessageTime: 'Baru saja',
        unreadCount: 0,
        isOnline: true,
      };
      setConversations((prev) => [newConv, ...prev]);
      setTargetChatId(newConvId);
    }
    setCurrentTab('CHAT');
  };

  const handleToggleWorkMode = () => {
    const next = workMode === 'WFO' ? 'WFH' : 'WFO';
    setWorkMode(next);
    showToast(
      next === 'WFH' ? 'Mode WFH Aktif' : 'Mode WFO Aktif',
      next === 'WFH'
        ? 'Jadwal hari ini WFH (1 hari per minggu). Bebas presensi dari mana saja.'
        : 'Jadwal hari ini WFO (4 hari per minggu). Wajib berada dalam radius 100m Kantor Pusat.',
      'SUCCESS'
    );
  };

  // Clock In / Clock Out button pressed
  const handleTriggerClock = () => {
    // If WFO mode, verify geofence. If WFH mode, geofence is waived!
    if (workMode === 'WFO' && !isWithinGeofence) {
      showToast(
        'Di Luar Jangkauan Kantor Pusat',
        `Presensi WFO ditolak. Anda berada ${formatDistance(distanceMeters)} dari Kantor Pusat (Maks: ${activeOffice.radiusMeters}m). Gunakan tombol "Di Kantor Pusat (25m)" atau ubah mode ke WFH.`,
        'WARNING'
      );
      return;
    }

    setScannerMode(isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN');
    setIsScannerOpen(true);
  };

  // Face Scanner Success callback
  const handleScannerSuccess = (snapshotUrl: string) => {
    setIsScannerOpen(false);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dateFormatted = now.toISOString().slice(0, 10);
    const officeDisplayName = workMode === 'WFH' ? 'Work From Home (WFH)' : activeOffice.name;

    if (scannerMode === 'CLOCK_IN') {
      setIsClockedIn(true);
      setClockInTime(timeFormatted);
      setClockOutTime(null);

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRole: employee.role,
        employeeAvatar: employee.avatar,
        date: dateFormatted,
        dayName: now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: now.getDate(),
        clockInTime: `${timeFormatted} WIB`,
        clockOutTime: '--:--',
        workDurationHours: '00h 01m',
        status: 'ON_TIME',
        workMode: workMode,
        officeId: activeOffice.id,
        officeName: officeDisplayName,
        distanceMeters: workMode === 'WFH' ? 0 : distanceMeters,
        latitude: userLat,
        longitude: userLon,
        faceSnapshot: snapshotUrl,
        isVerifiedFace: true,
        checkpoints: [
          {
            time: `${timeFormatted} WIB`,
            location: officeDisplayName,
            label: `Clock In (${workMode} - Wajah & GPS Terverifikasi)`,
          },
        ],
      };

      setAttendanceRecords([newRecord, ...attendanceRecords]);

      // Add notification
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Clock In Berhasil',
        message: `Presensi masuk tercatat di ${officeDisplayName} pada ${timeFormatted} WIB dengan verifikasi wajah biometrik.`,
        timestamp: 'Baru saja',
        type: 'ATTENDANCE',
        isRead: false,
      };
      setNotifications([newNotif, ...notifications]);

      showToast(
        'Clock In Berhasil!',
        `Selamat bekerja, ${employee.name}. Presensi ${workMode} Anda telah tervalidasi.`,
        'SUCCESS'
      );
    } else {
      setIsClockedIn(false);
      setClockOutTime(timeFormatted);

      // Update today's record
      setAttendanceRecords((prev) =>
        prev.map((rec, idx) => {
          if (idx === 0) {
            let calculatedDuration = '08h 15m';
            if (rec.clockInTime) {
              const inParts = rec.clockInTime.replace(/(am|pm|wib)/i, '').trim().split(':').map(Number);
              const inH = inParts[0] || 9;
              const inM = inParts[1] || 0;
              const nowH = now.getHours();
              const nowM = now.getMinutes();
              const totalMins = Math.max(1, (nowH * 60 + nowM) - (inH * 60 + inM));
              const diffH = Math.floor(totalMins / 60);
              const diffM = totalMins % 60;
              calculatedDuration = `${diffH.toString().padStart(2, '0')}h ${diffM.toString().padStart(2, '0')}m`;
            }
            return {
              ...rec,
              clockOutTime: `${timeFormatted} WIB`,
              workDurationHours: calculatedDuration,
            };
          }
          return rec;
        })
      );

      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Clock Out Berhasil',
        message: `Presensi pulang tercatat pada ${timeFormatted} WIB. Terima kasih atas kerja keras Anda hari ini.`,
        timestamp: 'Baru saja',
        type: 'ATTENDANCE',
        isRead: false,
      };
      setNotifications([newNotif, ...notifications]);

      showToast(
        'Clock Out Berhasil!',
        `Presensi pulang tercatat pukul ${timeFormatted} WIB. Selamat beristirahat!`,
        'SUCCESS'
      );
    }
  };

  // Leave submission handler
  const handleApplyLeave = (newLeave: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => {
    const created: LeaveRequest = {
      ...newLeave,
      id: `leave-${Date.now()}`,
      appliedDate: 'Baru saja',
      status: 'PENDING',
    };
    setLeaveRequests([created, ...leaveRequests]);

    // Send notification to HR
    const newNotif: AppNotification = {
      id: `notif-leave-${Date.now()}`,
      title: `Pengajuan Cuti: ${newLeave.employeeName}`,
      message: `${newLeave.employeeName} mengajukan ${newLeave.type} Leave (${newLeave.totalDays} hari: ${newLeave.startDate} s/d ${newLeave.endDate}): "${newLeave.reason}"`,
      timestamp: 'Baru saja',
      type: 'LEAVE',
      isRead: false,
      actionRequired: true,
      applicantName: newLeave.employeeName,
      applicantAvatar: newLeave.employeeAvatar,
      leaveId: created.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(
      'Pengajuan Terkirim',
      `Pengajuan ${newLeave.type} Leave selama ${newLeave.totalDays} hari berhasil dikirim ke HR.`,
      'SUCCESS'
    );
  };

  // Admin leave approval
  const handleUpdateLeaveStatus = (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    const target = leaveRequests.find((l) => l.id === leaveId);
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status } : l))
    );

    if (target && status === 'APPROVED') {
      // Deduct leave balance if it matches the current logged in employee
      if (target.employeeId === employee.id) {
        setEmployee((prev) => {
          const newUsed = prev.usedLeave + target.totalDays;
          let newAnnual = prev.annualLeave;
          let newCasual = prev.casualLeave;
          let newMedical = prev.medicalLeave;
          let newMaternity = prev.maternityLeave;

          if (target.type === 'ANNUAL') newAnnual = Math.max(0, newAnnual - target.totalDays);
          else if (target.type === 'CASUAL') newCasual = Math.max(0, newCasual - target.totalDays);
          else if (target.type === 'SICK') newMedical = Math.max(0, newMedical - target.totalDays);
          else if (target.type === 'MATERNITY') newMaternity = Math.max(0, newMaternity - target.totalDays);

          return {
            ...prev,
            usedLeave: newUsed,
            annualLeave: newAnnual,
            casualLeave: newCasual,
            medicalLeave: newMedical,
            maternityLeave: newMaternity,
          };
        });
      }

      // Add approval notification
      const approvedNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Cuti Disetujui HR',
        message: `Pengajuan ${target.type} Leave ${target.employeeName} (${target.totalDays} hari: ${target.startDate} s/d ${target.endDate}) telah disetujui.`,
        timestamp: 'Baru saja',
        type: 'LEAVE',
        isRead: false,
      };
      setNotifications((prev) => [approvedNotif, ...prev]);
    } else if (target && status === 'REJECTED') {
      const rejectedNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Cuti Ditolak HR',
        message: `Pengajuan ${target.type} Leave ${target.employeeName} (${target.startDate} s/d ${target.endDate}) tidak disetujui HR.`,
        timestamp: 'Baru saja',
        type: 'LEAVE',
        isRead: false,
      };
      setNotifications((prev) => [rejectedNotif, ...prev]);
    }

    showToast(
      'Status Cuti Diperbarui',
      `Permohonan cuti telah diubah menjadi ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}.`,
      status === 'APPROVED' ? 'SUCCESS' : 'WARNING'
    );
  };

  // Admin add office
  const handleAddOffice = (newOffice: Omit<OfficeLocation, 'id'>) => {
    const created: OfficeLocation = {
      ...newOffice,
      id: `off-${Date.now()}`,
    };
    setOffices([...offices, created]);
    showToast('Kantor Ditambahkan', `${created.name} berhasil terdaftar dalam sistem geofencing.`, 'SUCCESS');
  };

  const handleUpdateOfficeRadius = (officeId: string, newRadius: number) => {
    setOffices((prev) =>
      prev.map((o) => (o.id === officeId ? { ...o, radiusMeters: newRadius } : o))
    );
    if (activeOffice.id === officeId) {
      setActiveOffice((prev) => ({ ...prev, radiusMeters: newRadius }));
    }
    showToast('Radius Diperbarui', `Toleransi radius kantor disesuaikan menjadi ${newRadius}m.`, 'SUCCESS');
  };

  // Super Admin: Update Attendance Record (koreksi jam / status / catatan)
  const handleUpdateAttendanceRecord = (updatedRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.id === updatedRecord.id ? updatedRecord : rec))
    );
    showToast(
      'Presensi Diperbarui',
      `Data presensi untuk ${updatedRecord.employeeName} berhasil dikoreksi HR.`,
      'SUCCESS'
    );
  };

  // Super Admin: Delete Attendance Record
  const handleDeleteAttendanceRecord = (recordId: string) => {
    setAttendanceRecords((prev) => prev.filter((rec) => rec.id !== recordId));
    showToast('Presensi Dihapus', 'Catatan presensi berhasil dihapus dari sistem.', 'SUCCESS');
  };

  // Super Admin: Update Full Office Details (Nama, Alamat, Koordinat GPS, Radius)
  const handleUpdateOfficeDetails = (updatedOffice: OfficeLocation) => {
    setOffices([updatedOffice]);
    setActiveOffice(updatedOffice);
    showToast(
      'Kantor Pusat Diperbarui',
      `Informasi dan titik GPS kantor ${updatedOffice.name} berhasil disimpan.`,
      'SUCCESS'
    );
  };

  // Super Admin: Update Employee Roster Item
  const handleUpdateEmployeeRosterItem = (updatedItem: WfhRosterItem) => {
    setWfhRoster((prev) =>
      prev.map((item) => (item.employeeId === updatedItem.employeeId ? updatedItem : item))
    );
    if (employee.id === updatedItem.employeeId) {
      setEmployee((prev) => ({
        ...prev,
        name: updatedItem.employeeName,
        role: updatedItem.role,
        department: updatedItem.department,
        wfhRotationDay: updatedItem.wfhDay,
      }));
    }
    showToast(
      'Profil Karyawan Diperbarui',
      `Data profil & jadwal WFH ${updatedItem.employeeName} berhasil diperbarui.`,
      'SUCCESS'
    );
  };

  // Super Admin: Add New User Account (Employee or Admin)
  const handleAddAccount = (newAccount: UserAccount) => {
    setAccounts((prev) => [newAccount, ...prev]);

    // If new account is an EMPLOYEE, also add to WFH roster
    if (newAccount.userRole === 'EMPLOYEE') {
      const newRosterItem: WfhRosterItem = {
        employeeId: newAccount.id,
        employeeName: newAccount.name,
        role: newAccount.role,
        department: newAccount.department,
        avatar: newAccount.avatar,
        wfhDay: newAccount.wfhRotationDay || 'Senin',
      };
      setWfhRoster((prev) => [...prev, newRosterItem]);
    }

    showToast(
      'Akun Berhasil Didaftarkan',
      `Akun ${newAccount.name} (${newAccount.userRole === 'ADMIN' ? 'Super Admin' : 'Karyawan'}) siap digunakan untuk login.`,
      'SUCCESS'
    );
  };

  // Super Admin: Update Existing User Account
  const handleUpdateAccount = (updatedAccount: UserAccount) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
    );

    // Sync with wfhRoster if employee
    setWfhRoster((prev) =>
      prev.map((r) =>
        r.employeeId === updatedAccount.id
          ? {
              ...r,
              employeeName: updatedAccount.name,
              role: updatedAccount.role,
              department: updatedAccount.department,
              avatar: updatedAccount.avatar,
              wfhDay: updatedAccount.wfhRotationDay || r.wfhDay,
            }
          : r
      )
    );

    // If currently logged in user is this account, update currentUser & employee
    if (currentUser?.id === updatedAccount.id) {
      setCurrentUser(updatedAccount);
      localStorage.setItem('geoface_auth_user', JSON.stringify(updatedAccount));
      setEmployee((prev) => ({
        ...prev,
        name: updatedAccount.name,
        role: updatedAccount.role,
        department: updatedAccount.department,
        email: updatedAccount.email,
        phone: updatedAccount.phone || prev.phone,
        wfhRotationDay: updatedAccount.wfhRotationDay,
      }));
    }

    showToast(
      'Akun Diperbarui',
      `Data akun ${updatedAccount.name} berhasil disimpan.`,
      'SUCCESS'
    );
  };

  // Super Admin: Delete User Account
  const handleDeleteAccount = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    setWfhRoster((prev) => prev.filter((r) => r.employeeId !== accountId));

    showToast(
      'Akun Dihapus',
      `Akun ${target?.name || accountId} berhasil dihapus dari sistem.`,
      'SUCCESS'
    );
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('geoface_auth_user', JSON.stringify(user));
    if (user.userRole === 'ADMIN') {
      setAppMode('ADMIN');
    } else {
      setAppMode('EMPLOYEE');
      setEmployee((prev) => ({
        ...prev,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        employeeIdNumber: user.employeeIdNumber,
        wfhRotationDay: user.wfhRotationDay,
      }));
    }
    showToast('Login Berhasil', `Selamat datang kembali, ${user.name}`, 'SUCCESS');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('geoface_auth_user');
    showToast('Logout Berhasil', 'Anda telah keluar dari akun.', 'SUCCESS');
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const unreadChats = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // If not authenticated, show LoginScreen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} accounts={accounts} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center">
      {/* Universal Top Bar Switcher */}
      <header className="w-full bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-[10px] tracking-tight">
            JRS
          </div>
          <div className="leading-tight">
            <span className="text-xs font-bold text-slate-900">JRS GeoFace Absensi</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
              · Presensi Biometrik Wajah &amp; GPS Geofence PT JRS Indonesia
            </span>
          </div>
        </div>

        {/* User Profile & Mode Selector Buttons */}
        <div className="flex items-center gap-2">
          {/* Current Logged In User Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
              {currentUser.name}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isSuperAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isSuperAdmin ? 'Super Admin' : 'Karyawan'}
            </span>
          </div>

          {/* Mode Switcher: Only visible for Super Admin */}
          {isSuperAdmin && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setAppMode('EMPLOYEE')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  appMode === 'EMPLOYEE'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Karyawan</span>
              </button>
              <button
                onClick={() => setAppMode('ADMIN')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  appMode === 'ADMIN'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>HR Superadmin</span>
              </button>
            </div>
          )}

          {appMode === 'EMPLOYEE' && (
            <button
              onClick={() =>
                setPreviewFrame(previewFrame === 'MOBILE_FRAME' ? 'FULL_WIDTH' : 'MOBILE_FRAME')
              }
              className="hidden md:flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-600 transition-colors"
              title="Ganti Mode Frame Smartphone / Full-Width"
            >
              {previewFrame === 'MOBILE_FRAME' ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  <span>Full Screen</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mobile Frame</span>
                </>
              )}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-xs transition-colors"
            title="Keluar dari akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Floating Global Toast Notification */}
      {toast && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 animate-bounce max-w-sm w-full px-4">
          <div
            className={`p-3.5 rounded-2xl shadow-xl flex items-start gap-2.5 text-xs text-white ${
              toast.type === 'SUCCESS' ? 'bg-slate-900' : 'bg-amber-600'
            }`}
          >
            {toast.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight">{toast.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-white/60 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-0 md:p-6">
        {appMode === 'ADMIN' ? (
          /* ==============================================================
             HR / ADMIN DASHBOARD PORTAL
             ============================================================== */
          <div className="w-full max-w-6xl p-4 md:p-8 bg-slate-50 rounded-3xl min-h-[85vh]">
            <HRAdminDashboard
              offices={offices}
              onAddOffice={handleAddOffice}
              onUpdateOfficeRadius={handleUpdateOfficeRadius}
              onUpdateOfficeDetails={handleUpdateOfficeDetails}
              attendanceLogs={attendanceRecords}
              onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
              onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
              leaveRequests={leaveRequests}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onBackToEmployeeView={() => setAppMode('EMPLOYEE')}
              onLogout={handleLogout}
              wfhRoster={wfhRoster}
              onUpdateEmployeeWfhDay={handleUpdateEmployeeWfhDay}
              onUpdateEmployeeRosterItem={handleUpdateEmployeeRosterItem}
              onAddAccount={handleAddAccount}
              accounts={accounts}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              currentAdminName={currentUser.name}
            />
          </div>
        ) : (
          /* ==============================================================
             EMPLOYEE MOBILE-FIRST VIEW (Neomeric Absensi)
             ============================================================== */
          <div
            className={`w-full transition-all duration-300 ${
              previewFrame === 'MOBILE_FRAME'
                ? 'max-w-md my-0 md:my-4 shadow-2xl md:rounded-[40px] md:border-8 md:border-slate-800 bg-white min-h-[850px] overflow-hidden flex flex-col'
                : 'max-w-3xl my-0 md:my-4 shadow-md rounded-3xl bg-white min-h-[850px] overflow-hidden flex flex-col'
            }`}
          >
            {/* Top Phone Frame Speaker Notch (only shown in phone frame mode) */}
            {previewFrame === 'MOBILE_FRAME' && (
              <div className="hidden md:flex w-full items-center justify-center pt-2 pb-1 bg-white">
                <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>
              </div>
            )}

            {/* Employee Brand Header */}
            <EmployeeHeader
              employee={employee}
              isAdminAvailable={isSuperAdmin}
              onOpenAdmin={() => {
                if (isSuperAdmin) {
                  setAppMode('ADMIN');
                } else {
                  showToast('Akses Dibatasi', 'Hanya Super Admin HR yang memiliki izin akses.', 'WARNING');
                }
              }}
              onLogout={handleLogout}
            />

            {/* Scrollable View Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 scrollbar-none flex flex-col">
              {currentTab === 'HOME' && (
                <div className="flex flex-col gap-5">
                  {/* Central Neomeric Clock Button */}
                  <NeomericClockButton
                    isClockedIn={isClockedIn}
                    clockInTime={clockInTime}
                    clockOutTime={clockOutTime}
                    onTriggerAttendance={handleTriggerClock}
                    activeOffice={activeOffice}
                    isWithinGeofence={isWithinGeofence}
                    distanceMeters={distanceMeters}
                    workMode={workMode}
                    onToggleWorkMode={handleToggleWorkMode}
                    shiftEndTime="17:00"
                    currentDay={currentDay}
                    onSelectDay={(day) => {
                      setCurrentDay(day);
                      const isTurn = day === employeeWfhDay;
                      showToast(
                        `Simulasi Hari ${day}`,
                        isTurn
                          ? `Hari ${day} adalah giliran WFH Anda! Bebas presensi dari rumah.`
                          : `Hari ${day} adalah jadwal WFO di Kantor Pusat (Giliran WFH Anda: ${employeeWfhDay}).`,
                        'SUCCESS'
                      );
                    }}
                    employeeWfhDay={employeeWfhDay}
                    isWfhTurnToday={isWfhTurnToday}
                    employeeName={employee.name}
                  />

                  {/* Office Geofencing Radar & Scenario Simulator */}
                  <OfficeLocationCard
                    activeOffice={activeOffice}
                    distanceMeters={distanceMeters}
                    isWithinGeofence={isWithinGeofence}
                    isSimulated={isSimulatedLocation}
                    onSetSimulationState={handleSetSimulation}
                    onUseRealGPS={handleUseRealGPS}
                    latitude={userLat}
                    longitude={userLon}
                    workMode={workMode}
                    onToggleWorkMode={handleToggleWorkMode}
                  />
                </div>
              )}

              {currentTab === 'TEAMS' && (
                <TeamsView
                  onNavigateToOffice={() => setCurrentTab('HOME')}
                  wfhRoster={wfhRoster}
                  currentDay={currentDay}
                  onOpenChatWithMember={handleOpenChatWithMember}
                />
              )}

              {currentTab === 'CHAT' && currentUser && (
                <ChatDiscussionView
                  currentUser={currentUser}
                  conversations={conversations}
                  onUpdateConversations={setConversations}
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onLikeMessage={handleLikeMessage}
                  discussions={discussions}
                  onCreateDiscussion={handleCreateDiscussion}
                  onLikeDiscussion={handleLikeDiscussion}
                  onAddComment={handleAddDiscussionComment}
                  onLikeComment={handleLikeDiscussionComment}
                  accounts={accounts}
                  initialConversationId={targetChatId}
                  onClearInitialConversation={() => setTargetChatId(null)}
                />
              )}

              {currentTab === 'ATTENDANCE' && (
                <AttendanceCalendarView
                  records={attendanceRecords}
                  currentEmployeeId={currentUser?.id || employee.id}
                  currentEmployeeName={currentUser?.name || employee.name}
                />
              )}

              {currentTab === 'LEAVES' && (
                <LeavesView
                  employee={employee}
                  leaveRequests={leaveRequests}
                  onSubmitLeave={handleApplyLeave}
                />
              )}

              {currentTab === 'NOTIFICATIONS' && (
                <NotificationsView
                  notifications={notifications}
                  onApproveNotification={(id) => {
                    const target = notifications.find((n) => n.id === id);
                    if (target?.leaveId) {
                      handleUpdateLeaveStatus(target.leaveId, 'APPROVED');
                    }
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === id ? { ...n, actionRequired: false, isRead: true } : n
                      )
                    );
                    showToast('Permohonan Disetujui', 'Tindakan persetujuan berhasil dicatat.', 'SUCCESS');
                  }}
                  onRejectNotification={(id) => {
                    const target = notifications.find((n) => n.id === id);
                    if (target?.leaveId) {
                      handleUpdateLeaveStatus(target.leaveId, 'REJECTED');
                    }
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === id ? { ...n, actionRequired: false, isRead: true } : n
                      )
                    );
                    showToast('Permohonan Ditolak', 'Permohonan ditolak oleh atasan.', 'WARNING');
                  }}
                  onMarkAllAsRead={() => {
                    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    showToast('Notifikasi Terbaca', 'Semua notifikasi ditandai telah dibaca.', 'SUCCESS');
                  }}
                />
              )}
            </div>

            {/* Fixed Bottom Ergonomic Navigation Bar */}
            <MobileBottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => setCurrentTab(tab)}
              unreadNotifCount={unreadNotifs}
              unreadChatCount={unreadChats}
            />

            {/* Bottom Home Indicator Bar (for mobile phone frame aesthetic) */}
            {previewFrame === 'MOBILE_FRAME' && (
              <div className="hidden md:flex w-full items-center justify-center py-1 bg-white">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Face Scanner Modal with Live Webcam & Biometrics */}
      <FaceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={handleScannerSuccess}
        mode={scannerMode}
        employeeName={employee.name}
        activeOffice={activeOffice}
        currentLat={userLat}
        currentLon={userLon}
      />
    </div>
  );
}
