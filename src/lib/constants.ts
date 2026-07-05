export const ROLES = {
  ADMIN: 'ADMIN',
  HR: 'HR',
  MANAGER: 'MANAGER',
  TL: 'TL',
  AGENT: 'AGENT',
} as const;

export const DISPOSITIONS = {
  FOLLOW_UP: 'FOLLOW_UP',
  SALE_DONE: 'SALE_DONE',
  DELIVERED: 'DELIVERED',
  NOT_RECEIVED: 'NOT_RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export const DISPOSITION_LABELS: Record<string, string> = {
  FOLLOW_UP: 'Follow Up / Call Back',
  SALE_DONE: 'Sale Done / Booking Confirmed',
  DELIVERED: 'Product Delivered',
  NOT_RECEIVED: 'Not Received by CX',
  CANCELLED: 'Cancelled / Rejected',
};

export const ATTENDANCE_STATUSES = {
  TIME_IN: 'TIME_IN',
  TIME_OUT: 'TIME_OUT',
  BIO_BREAK: 'BIO_BREAK',
  LUNCH_BREAK: 'LUNCH_BREAK',
  TRAINING_BREAK: 'TRAINING_BREAK',
  MEETING_BREAK: 'MEETING_BREAK',
} as const;

export const ATTENDANCE_LABELS: Record<string, string> = {
  TIME_IN: 'Time In',
  TIME_OUT: 'Time Out',
  BIO_BREAK: 'Bio Break',
  LUNCH_BREAK: 'Lunch Break',
  TRAINING_BREAK: 'Training Break',
  MEETING_BREAK: 'Meeting Break',
};

export const PAYMENT_TYPES = {
  COD: 'COD',
  PREPAID: 'PREPAID',
} as const;

export const LOGISTICS_STATUSES = {
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELLED_RETURNED: 'CANCELLED_RETURNED',
} as const;

export const LOGISTICS_LABELS: Record<string, string> = {
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED_RETURNED: 'Cancelled / Returned',
};

export const DAY_STATUSES = {
  PRESENT: 'PRESENT',
  HALF_DAY: 'HALF_DAY',
  ABSENT: 'ABSENT',
  FLAG_FOR_REVIEW: 'FLAG_FOR_REVIEW',
  AUTO_TIMEOUT: 'AUTO_TIMEOUT',
} as const;

export const DAY_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  HALF_DAY: 'Half Day',
  ABSENT: 'Absent',
  FLAG_FOR_REVIEW: 'Flag for Review',
  AUTO_TIMEOUT: 'System Auto-Timeout',
};

// Navigation menu items per role
export const NAV_ITEMS: Record<string, Array<{ label: string; href: string; icon: string }>> = {
  ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Users', href: '/users', icon: '👥' },
    { label: 'Organization Tree', href: '/hierarchy', icon: '🌳' },
    { label: 'Leads', href: '/leads', icon: '📋' },
    { label: 'Upload Leads', href: '/leads/upload', icon: '📤' },
    { label: 'Attendance', href: '/attendance', icon: '🕐' },
    { label: 'HR Calendar', href: '/hr-calendar', icon: '📅' },
    { label: 'Commissions', href: '/commissions', icon: '💸' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
    { label: 'TL Monitor', href: '/tl-monitor', icon: '🎯' },
    { label: 'Order Tracking', href: '/logistics', icon: '🚚' },
    { label: 'Delhivery Portal', href: '/delhivery', icon: '📦' },
  ],
  MANAGER: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Organization Tree', href: '/hierarchy', icon: '🌳' },
    { label: 'Leads', href: '/leads', icon: '📋' },
    { label: 'Upload Leads', href: '/leads/upload', icon: '📤' },
    { label: 'Attendance', href: '/attendance', icon: '🕐' },
    { label: 'Commissions', href: '/commissions', icon: '💸' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
    { label: 'TL Monitor', href: '/tl-monitor', icon: '🎯' },
    { label: 'Order Tracking', href: '/logistics', icon: '🚚' },
    { label: 'Delhivery Portal', href: '/delhivery', icon: '📦' },
  ],
  HR: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Users', href: '/users', icon: '👥' },
    { label: 'Organization Tree', href: '/hierarchy', icon: '🌳' },
    { label: 'HR Calendar', href: '/hr-calendar', icon: '📅' },
    { label: 'Attendance', href: '/attendance', icon: '🕐' },
    { label: 'Commissions', href: '/commissions', icon: '💸' },
  ],

  TL: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Organization Tree', href: '/hierarchy', icon: '🌳' },
    { label: 'Leads', href: '/leads', icon: '📋' },
    { label: 'Attendance', href: '/attendance', icon: '🕐' },
    { label: 'TL Monitor', href: '/tl-monitor', icon: '🎯' },
    { label: 'Order Tracking', href: '/logistics', icon: '🚚' },
  ],
  AGENT: [
    { label: 'My Leads', href: '/leads', icon: '📋' },
    { label: 'Organization Tree', href: '/hierarchy', icon: '🌳' },
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Attendance', href: '/attendance', icon: '🕐' },
    { label: 'Order Tracking', href: '/logistics', icon: '🚚' },
  ],
};

export const DEFAULT_CALL_THRESHOLD = 80;
