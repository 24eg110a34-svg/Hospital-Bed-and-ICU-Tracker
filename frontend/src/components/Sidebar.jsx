import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';
import EcgPulse from './EcgPulse';
import {
  LayoutDashboard, BedDouble, Users, Activity, History, Bell, BarChart3,
  Truck, CalendarClock, Building2, ScrollText, Settings as SettingsIcon, PackageSearch,
  Radio, HeartPulse, LogOut, ShieldCheck, FileHeart,
} from 'lucide-react';

const ALL_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'STAFF'];

const sections = [
  {
    title: 'Command',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/beds', label: 'Beds', icon: BedDouble, roles: ALL_ROLES },
      { path: '/triage', label: 'Triage Queue', icon: Activity, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
      { path: '/patients', label: 'Patients', icon: Users, roles: ALL_ROLES },
      { path: '/allocations', label: 'Allocations', icon: History, roles: ALL_ROLES },
      { path: '/reservations', label: 'Reservations', icon: CalendarClock, roles: ALL_ROLES },
      { path: '/wards', label: 'Wards', icon: Building2, roles: ALL_ROLES },
      { path: '/resources', label: 'Resources', icon: PackageSearch, roles: ALL_ROLES },
      { path: '/ambulances', label: 'Ambulances', icon: Truck, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Insight',
    items: [
      { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
      { path: '/records', label: 'Patient Records', icon: FileHeart, roles: ALL_ROLES },
      { path: '/timeline', label: 'Timeline', icon: ScrollText, roles: ALL_ROLES },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/notifications', label: 'Alerts', icon: Bell, roles: ALL_ROLES },
      { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['ADMIN'] },
      { path: '/settings', label: 'Settings', icon: SettingsIcon, roles: ALL_ROLES },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, connected, can } = useHospital();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="cc-nav-theme fixed left-0 top-0 h-screen w-60 text-slate-300 flex flex-col z-40 border-r border-slate-800/80 overflow-hidden">
      <div className="cc-nav-ecg"><EcgPulse tone="green" duration={6} /></div>

      <div className="relative px-4 h-16 flex items-center gap-2.5 border-b border-slate-700/60 shrink-0">
        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
          <HeartPulse size={17} />
        </span>
        <div className="min-w-0 leading-none">
          <div className="text-[12px] font-extrabold text-white tracking-tight truncate">BEDTRACKER</div>
          <div className="text-[10px] font-bold text-blue-400 tracking-wider mt-1">COMMAND CENTER</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {sections.map((section) => {
          const items = section.items.filter((item) => can(...item.roles));
          if (items.length === 0) return null;
          return (
            <div key={section.title}>
              <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-150 cursor-pointer ${
                        active ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-blue-500 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="relative p-2.5 border-t border-slate-700/60 space-y-2 shrink-0">
        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-bold ${
          connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
          <Radio size={13} className={connected ? 'animate-live-pulse' : ''} />
          {connected ? 'FEED CONNECTED' : 'FEED OFFLINE'}
        </div>
        {user && (
          <div className="px-2.5 py-1 min-w-0">
            <div className="text-[12px] font-bold text-white truncate">{user.fullName || user.username}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.role}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
