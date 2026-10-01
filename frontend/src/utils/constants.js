export const STATUS_STYLES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RESERVED: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  OCCUPIED: 'bg-rose-100 text-rose-800 border-rose-200',
  CLEANING: 'bg-orange-100 text-orange-900 border-orange-300',
  MAINTENANCE: 'bg-slate-200 text-slate-700 border-slate-300',
  BLOCKED: 'bg-slate-800 text-slate-200 border-slate-900',
};

export const PATIENT_STATUS_STYLES = {
  WAITING: 'bg-amber-100 text-amber-800',
  TRIAGE: 'bg-blue-100 text-blue-800',
  WAITING_FOR_BED: 'bg-purple-100 text-purple-800',
  ADMITTED: 'bg-emerald-100 text-emerald-800',
  UNDER_TREATMENT: 'bg-teal-100 text-teal-800',
  DISCHARGED: 'bg-slate-200 text-slate-700',
  TRANSFERRED: 'bg-indigo-100 text-indigo-800',
};

export const TRIAGE_STYLES = {
  1: 'bg-rose-600 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-amber-400 text-slate-900',
  4: 'bg-sky-500 text-white',
  5: 'bg-slate-400 text-white',
};

export const TRIAGE_LABELS = {
  1: 'CRITICAL',
  2: 'EMERGENCY',
  3: 'URGENT',
  4: 'SEMI-URGENT',
  5: 'NON-URGENT',
};

export const BED_STATUSES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];

export const BED_STATUS_TOKENS = {
  AVAILABLE: {
    label: 'Available',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    ping: 'text-emerald-500',
    text: 'text-emerald-700',
    tile: 'border-emerald-300 bg-emerald-50/60',
    bar: 'bg-emerald-500',
    glow: 'shadow-[0_0_0_1px_rgba(16,185,129,.18),0_6px_18px_-8px_rgba(16,185,129,.45)]',
    alert: false,
  },
  RESERVED: {
    label: 'Reserved',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    dot: 'bg-violet-500',
    ping: 'text-violet-500',
    text: 'text-violet-700',
    tile: 'border-violet-300 bg-violet-50/50',
    bar: 'bg-violet-500',
    glow: 'shadow-[0_0_0_1px_rgba(139,92,246,.16),0_6px_18px_-8px_rgba(139,92,246,.4)]',
    alert: false,
  },
  OCCUPIED: {
    label: 'Occupied',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    ping: 'text-blue-500',
    text: 'text-blue-700',
    tile: 'border-blue-300 bg-blue-50/50',
    bar: 'bg-blue-500',
    glow: 'shadow-[0_0_0_1px_rgba(59,130,246,.14),0_6px_18px_-8px_rgba(59,130,246,.35)]',
    alert: false,
  },
  CLEANING: {
    label: 'Cleaning',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    ping: 'text-amber-500',
    text: 'text-amber-700',
    tile: 'border-amber-300 bg-amber-50/50',
    bar: 'bg-amber-500',
    glow: 'shadow-[0_0_0_1px_rgba(245,158,11,.16),0_6px_18px_-8px_rgba(245,158,11,.4)]',
    alert: false,
  },
  MAINTENANCE: {
    label: 'Maintenance',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-500',
    ping: 'text-slate-500',
    text: 'text-slate-600',
    tile: 'border-slate-300 bg-slate-100/70',
    bar: 'bg-slate-500',
    glow: '',
    alert: false,
  },
  BLOCKED: {
    label: 'Blocked',
    badge: 'bg-slate-800 text-slate-100 border-slate-900',
    dot: 'bg-slate-800',
    ping: 'text-slate-800',
    text: 'text-slate-800',
    tile: 'border-slate-400 bg-slate-200/70',
    bar: 'bg-slate-800',
    glow: '',
    alert: false,
  },
};

export const bedToken = (status) => BED_STATUS_TOKENS[status] || {
  label: status || 'Unknown',
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  dot: 'bg-slate-400',
  ping: 'text-slate-400',
  text: 'text-slate-600',
  tile: 'border-slate-300 bg-white',
  bar: 'bg-slate-400',
  glow: '',
  alert: false,
};

export const STATUS_SUMMARY = {
  AVAILABLE: { label: 'Available beds', tone: 'text-emerald-700', bar: 'bg-emerald-500' },
  OCCUPIED: { label: 'Occupied beds', tone: 'text-blue-700', bar: 'bg-blue-500' },
  RESERVED: { label: 'Reserved beds', tone: 'text-violet-700', bar: 'bg-violet-500' },
  CLEANING: { label: 'In cleaning', tone: 'text-amber-700', bar: 'bg-amber-500' },
  MAINTENANCE: { label: 'In maintenance', tone: 'text-slate-600', bar: 'bg-slate-500' },
  BLOCKED: { label: 'Blocked', tone: 'text-slate-700', bar: 'bg-slate-700' },
};
export const BED_TYPES = ['GENERAL', 'EMERGENCY', 'ICU', 'HDU', 'ISOLATION'];
export const ADMISSION_STATUSES = ['WAITING', 'TRIAGE', 'WAITING_FOR_BED', 'ADMITTED', 'UNDER_TREATMENT', 'DISCHARGED', 'TRANSFERRED'];
export const AMBULANCE_STATUSES = ['AVAILABLE', 'EN_ROUTE', 'ARRIVED', 'TRANSPORTING', 'MAINTENANCE'];
export const WARD_TYPES = ['EMERGENCY', 'ICU', 'GENERAL', 'PEDIATRICS', 'CARDIOLOGY', 'SURGERY', 'ISOLATION', 'HDU'];

export const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '-');
export const formatTime = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');
export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

export const formatWait = (minutes) => {
  if (minutes == null) return '-';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};
