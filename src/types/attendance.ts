export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isMainBranch?: boolean;
}

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'OVERTIME' | 'ABSENT' | 'SICK_LEAVE';
export type NavTab = 'HOME' | 'TEAMS' | 'ATTENDANCE' | 'NOTIFICATIONS' | 'LEAVES' | 'CHAT';
export type WorkMode = 'WFO' | 'WFH';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeAvatar: string;
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Wednesday"
  dayNumber: number; // e.g. 12
  clockInTime: string; // e.g. "09:10"
  clockOutTime?: string; // e.g. "18:20"
  workDurationHours?: string; // e.g. "08h 15m"
  status: AttendanceStatus;
  workMode?: WorkMode; // WFO or WFH
  officeId: string;
  officeName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  faceSnapshot?: string; // Base64 data URL
  isVerifiedFace: boolean;
  notes?: string;
  editedBy?: string;
  editedAt?: string;
  originalStatus?: AttendanceStatus;
  checkpoints?: {
    time: string;
    location: string;
    label: string;
  }[];
}

export type UserRole = 'EMPLOYEE' | 'ADMIN';
export type RotationDay = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';

export interface WfhRosterItem {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  avatar: string;
  wfhDay: RotationDay;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  userRole: UserRole;
  department: string;
  avatar: string;
  employeeIdNumber: string;
  wfhRotationDay?: RotationDay;
}

export interface UserAccount extends AuthUser {
  password: string;
  phone?: string;
  description?: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
  employeeIdNumber: string;
  phone: string;
  wfhRotationDay?: RotationDay; // Giliran hari WFH mingguan
  totalLeave: number;
  usedLeave: number;
  casualLeave: number;
  medicalLeave: number;
  annualLeave: number;
  maternityLeave: number;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'MATERNITY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'ATTENDANCE' | 'LEAVE' | 'UPDATE_REQUEST' | 'SYSTEM';
  isRead: boolean;
  actionRequired?: boolean;
  applicantName?: string;
  applicantAvatar?: string;
  leaveId?: string;
}

export interface GeoLocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  error: string | null;
  activeOffice: OfficeLocation;
  distanceToActiveOffice: number;
  isWithinGeofence: boolean;
  isSimulated: boolean;
}

export type ChatChannelType = 'CHANNEL' | 'DIRECT' | 'GROUP';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar: string;
  text: string;
  timestamp: string; // e.g. "09:42" or ISO string
  dateGroup?: string; // e.g. "Hari Ini", "Kemarin"
  isRead?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  likes?: string[]; // user IDs who liked
}

export interface ChatConversation {
  id: string;
  name: string;
  type: ChatChannelType;
  avatar?: string;
  description?: string;
  participantIds?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  category?: 'OFFICIAL' | 'TEAM' | 'DM';
  memberCount?: number;
}

export type DiscussionCategory = 'PENGUMUMAN' | 'KERJA' | 'WFH_WFO' | 'IDE' | 'SANTAI';

export interface DiscussionComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  createdAt: string; // e.g. "10 menit yang lalu"
  likes: string[];
}

export interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  category: DiscussionCategory;
  createdAt: string;
  isPinned?: boolean;
  likes: string[];
  comments: DiscussionComment[];
  tags?: string[];
}
