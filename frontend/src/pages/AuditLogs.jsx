import React, { useState, useCallback } from 'react';
import { auditService, errorMessage } from '../services/api';
import { PageHeader, Loading, ErrorState, EmptyState } from '../components/ui';
import { formatDateTime } from '../utils/constants';
import { ScrollText, Search, RefreshCw, User } from 'lucide-react';

const actionTones = {
  PATIENT_CREATED: 'bg-blue-100 text-blue-800',
  PATIENT_UPDATED: 'bg-blue-100 text-blue-800',
  TRIAGE_CHANGED: 'bg-purple-100 text-purple-800',
  BED_ALLOCATED: 'bg-emerald-100 text-emerald-800',
  BED_RESERVED: 'bg-amber-100 text-amber-800',
  BED_RELEASED: 'bg-rose-100 text-rose-800',
  BED_CLEANING: 'bg-orange-100 text-orange-800',
  BED_AVAILABLE: 'bg-emerald-100 text-emerald-800',
  BED_STATUS_CHANGED: 'bg-slate-200 text-slate-700',
  RESERVATION_CONFIRMED: 'bg-emerald-100 text-emerald-800',
  RESERVATION_CANCELLED: 'bg-rose-100 text-rose-800',
  RESERVATION_EXPIRED: 'bg-slate-200 text-slate-700',
  PATIENT_DISCHARGED: 'bg-rose-100 text-rose-800',
  PATIENT_STATUS_CHANGED: 'bg-slate-200 text-slate-700',
  AMBULANCE_UPDATED: 'bg-blue-100 text-blue-800',
  LOGIN: 'bg-slate-100 text-slate-600',
  LOGOUT: 'bg-slate-100 text-slate-600',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await auditService.getAll();
      setLogs(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) return <Loading label="Loading audit logs" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !q
      || l.user?.toLowerCase().includes(q)
      || l.action?.toLowerCase().includes(q)
      || l.entityName?.toLowerCase().includes(q)
      || l.description?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle={`${logs.length} recorded actions — administrator only`}
        actions={(
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user, action, entity..."
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<ScrollText size={48} />} title="No audit records found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Entity', 'Change', 'Description'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                        <User size={13} className="text-slate-400" /> {log.user}
                      </div>
                      {log.userRole && <div className="text-[10px] text-slate-400">{log.userRole}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${actionTones[log.action] || 'bg-slate-100 text-slate-700'}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{log.entityName} #{log.entityId ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {log.oldValue || '-'} <span className="text-slate-400">→</span> <span className="font-medium">{log.newValue || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
