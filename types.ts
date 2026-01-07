
export interface Message {
  role: 'user' | 'model';
  text: string;
  time?: string;
  contacts?: Contact[]; // 用於在對話中顯示聯絡人卡片
}

export interface User {
  email: string;
  name: string;
  uid?: string;
}

export enum Screen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  SOCIAL = 'SOCIAL',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  CONTACT_DETAIL = 'CONTACT_DETAIL',
  HISTORY = 'HISTORY' // 新增歷史紀錄分頁
}

export interface LogEntry {
  id: string;
  action: string;
  contactName: string;
  timestamp: string;
  details: string;
  type: 'create' | 'update' | 'photo' | 'interaction' | 'delete';
}

export interface Interaction {
  id: string;
  type: 'meeting' | 'call' | 'email';
  title: string;
  description: string;
  date: string;
  timeLabel: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  initials?: string;
  tags?: string[];
  lastInteraction?: string;
  phone?: string;
  email?: string;
  notes?: string;
  linkedin?: string;
  facebook?: string;
  birthday?: string;
  twitter?: string;
  interactions?: Interaction[];
  photos?: string[]; // 新增：活動照片
  actionIcon?: string;
}

export interface Tag {
  id: string;
  name: string;
  icon?: string;
  createdAt?: any; // Firestore Timestamp
}
