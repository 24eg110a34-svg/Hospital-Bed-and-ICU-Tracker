import React, { useState, useCallback } from 'react';
import { notificationService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, MetricCard } from '../components/ui';
import { formatDateTime } from '../utils/constants';
import { Bell, RefreshCw, Check, CheckCheck, Siren, AlertTriangle, Info } from 'lucide-react';

const severity = {
  CRITICAL: { style: 'bg-rose-50 border-rose-200', text: 'text-rose-800', icon: Siren, iconClass: 'text-rose-600', label: 'CRITICAL' },
  WARNING: { style: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: AlertTriangle, iconClass: 'text-amber-600', label: 'WARNING' },
  INFO: { style: 'bg-slate-50 border-slate-200', text: 'text-slate-800', icon: Info, iconClass: 'text-slate-500', label: 'INFO' },
};

export default function Notifications() {
  const { pushToast } = useHospital();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const { data } = await notificationService.getAll();
      setNotifications(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Could not mark as read'), 'ERROR');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      pushToast('All notifications marked as read', 'SUCCESS');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Could not mark all as read'), 'ERROR');
    }
  };

  if (loading) return <Loading label="Loading notifications" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const unread = notifications.filter((n) => !n.read_);
  const filtered = filter === 'ALL' ? notifications
    : filter === 'UNREAD' ? unread
      : notifications.filter((n) => n.read_);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Notifications"
        subtitle={`${unread.length} unread of ${notifications.length} total`}
        actions={(
          <>
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
              <RefreshCw size={15} /> Refresh
            </button>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <CheckCheck size={16} /> Mark all read
              </button>
            )}
          </>
        )}
      />

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total" value={notifications.length} tone="blue" />
        <MetricCard label="Unread" value={unread.length} tone={unread.length ? 'amber' : 'green'} />
        <MetricCard label="Critical" value={notifications.filter((n) => n.type === 'CRITICAL' && !n.read_).length} tone="red" />
      </div>

      <div className="flex gap-1.5">
        {['ALL', 'UNREAD', 'READ'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={<Bell size={48} />} title="No notifications" hint="Alerts appear here when capacity, waiting time or resources need attention" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const style = severity[n.type] || severity.INFO;
            const Icon = style.icon;
            return (
              <div key={n.id} className={`rounded-2xl border p-4 flex items-start gap-3 ${style.style} ${n.read_ ? 'opacity-70' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                  <Icon size={16} className={style.iconClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{n.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/70">{style.label}</span>
                    {n.category && <span className="text-[10px] text-slate-500">{n.category.replace(/_/g, ' ')}</span>}
                    {!n.read_ && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-sm mt-0.5">{n.message}</p>
                  <p className="text-[11px] opacity-60 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.read_ && (
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg hover:bg-white/70 transition-colors cursor-pointer shrink-0"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
