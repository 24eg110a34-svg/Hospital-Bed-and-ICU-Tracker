import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';
import { notificationService } from '../services/api';
import { Siren, Bell, ChevronDown, HeartPulse } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import EcgPulse from './EcgPulse';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function EcgTrace({ connected }) {
  return (
    <div
      className="hidden 2xl:block relative w-24 h-9 rounded-lg overflow-hidden border border-slate-800 bg-slate-950"
      title={connected ? 'Live telemetry' : 'Telemetry offline'}
    >
      <div className="cc-cine-scanlines" />
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-8">
          <EcgPulse tone={connected ? 'green' : 'rose'} />
        </div>
      </div>
      <span className="absolute top-0.5 right-1.5 text-[8px] font-bold tracking-[0.18em] text-slate-500">ECG</span>
    </div>
  );
}

function LivePill({ connected }) {
  return (
    <div
      className={`relative inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[11px] font-bold tracking-wider ${
        connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}
      title={connected ? 'Real-time feed connected' : 'Real-time feed disconnected'}
    >
      <span className={`relative flex h-2 w-2 ${connected ? 'text-emerald-500' : 'text-rose-500'}`}>
        <span className={`cc-halo ${connected ? '' : 'hidden'}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'} ${connected ? 'animate-live-pulse' : ''}`} />
      </span>
      {connected ? 'LIVE' : 'OFFLINE'}
    </div>
  );
}

function UserChip({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const initials = (user.fullName || user.username || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          {initials}
        </span>
        <span className="hidden lg:flex flex-col items-start leading-none">
          <span className="text-[12px] font-bold text-slate-800 max-w-[110px] truncate">{user.fullName || user.username}</span>
          <span className="text-[10px] font-semibold text-slate-400">{user.role}</span>
        </span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {open && (
        <>
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div role="menu" className="absolute right-0 top-11 z-20 w-56 bg-white rounded-xl border border-slate-200 shadow-panel p-1.5 animate-modal-in">
            <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
              <div className="text-[13px] font-bold text-slate-800 truncate">{user.fullName || user.username}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.email || user.username}</div>
              {user.hospitalName && <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.hospitalName}</div>}
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Account settings
            </Link>
            <button
              onClick={onLogout}
              role="menuitem"
              className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Topbar({ onLogout }) {
  const { user, connected, latestEvent } = useHospital();
  const now = useClock();
  const [unread, setUnread] = useState(0);
  const [critical, setCritical] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = () => {
      notificationService.getUnreadCount()
        .then((r) => {
          if (cancelled) return;
          setUnread(r.data?.unread ?? 0);
          setCritical(r.data?.critical ?? 0);
        })
        .catch(() => {});
    };
    fetchCounts();
    const poll = setInterval(fetchCounts, 60000);
    return () => { cancelled = true; clearInterval(poll); };
  }, []);

  useEffect(() => {
    if (latestEvent?.topic === '/topic/notifications') {
      notificationService.getUnreadCount()
        .then((r) => {
          setUnread(r.data?.unread ?? 0);
          setCritical(r.data?.critical ?? 0);
        })
        .catch(() => {});
    }
  }, [latestEvent?.receivedAt, latestEvent?.topic]);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <header className="cc-topbar-theme sticky top-0 z-30 h-16 backdrop-blur-md border-b border-slate-200/80">
      <div className="h-full px-4 lg:px-6 flex items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <span className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <HeartPulse size={19} />
          </span>
          <div className="min-w-0 leading-none">
            <div className="text-[13px] font-extrabold text-slate-900 tracking-tight truncate">
              {user?.hospitalName || 'Medicare Hospital'}
            </div>
            <div className="text-[10px] font-bold text-blue-600 tracking-wider mt-1">COMMAND CENTER</div>
          </div>
        </div>

        <div className="flex-1 flex justify-center min-w-0">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {critical > 0 && (
            <Link
              to="/notifications"
              title={`${critical} critical alert${critical > 1 ? 's' : ''}`}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold animate-alert-pulse"
            >
              <Siren size={14} />
              {critical > 99 ? '99+' : critical}
            </Link>
          )}

          <EcgTrace connected={connected} />

          <LivePill connected={connected} />

          <Link
            to="/notifications"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            className="relative p-2 h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          <div className="hidden md:flex flex-col items-end leading-none px-2.5 border-l border-slate-200">
            <span className="text-[13px] font-bold text-slate-800 cc-metric-value">{time}</span>
            <span className="text-[10px] font-semibold text-slate-400 mt-1">{date}</span>
          </div>

          <UserChip user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
