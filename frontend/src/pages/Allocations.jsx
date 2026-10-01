import React, { useState, useCallback } from 'react';
import { allocationService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, TriageBadge } from '../components/ui';
import { formatDateTime, formatWait } from '../utils/constants';
import { History, LogOut, RefreshCw, BedDouble, User } from 'lucide-react';

export default function Allocations() {
  const { can, pushToast } = useHospital();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await allocationService.getAll();
      setAllocations(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load allocations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  const discharge = async (allocation) => {
    if (!window.confirm(`Discharge ${allocation.patientName} from ${allocation.bedNumber}? The bed will move to CLEANING.`)) return;
    try {
      await allocationService.discharge(allocation.id);
      pushToast(`${allocation.patientName} discharged, ${allocation.bedNumber} sent for cleaning`, 'SUCCESS', 'Discharge complete');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Discharge failed'), 'ERROR');
    }
  };

  if (loading) return <Loading label="Loading allocations" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const filtered = allocations.filter((a) => {
    const matchStatus = filter === 'ALL' || a.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || a.patientName?.toLowerCase().includes(q)
      || a.patientMrn?.toLowerCase().includes(q)
      || a.bedNumber?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const active = allocations.filter((a) => a.status === 'ACTIVE').length;
  const discharged = allocations.filter((a) => a.status === 'DISCHARGED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed Allocations"
        subtitle={`${active} active · ${discharged} discharged · ${allocations.length} total records`}
        actions={(
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient, MRN or bed..."
          className="flex-1 min-w-[220px] px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1.5">
          {['ALL', 'ACTIVE', 'DISCHARGED'].map((f) => (
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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<History size={48} />} title="No allocation records found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Patient', 'Triage', 'Bed', 'Ward', 'Allocated', 'Discharged', 'Stay', 'Status', 'Reason', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User size={13} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{a.patientName}</div>
                          <div className="text-xs text-slate-500">{a.patientMrn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{a.triageLevel ? <TriageBadge level={a.triageLevel} /> : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                        <BedDouble size={14} className="text-slate-400" /> {a.bedNumber}
                      </div>
                      <div className="text-xs text-slate-400">{a.bedType}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.wardName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(a.allocationTime)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{a.dischargeTime ? formatDateTime(a.dischargeTime) : '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatWait(a.lengthOfStayMinutes)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {a.status}
                      </span>
                      {a.dischargeBedStatus && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Bed → {a.dischargeBedStatus}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">
                      <span className="line-clamp-2">{a.notes || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'ACTIVE' && can('ADMIN', 'DOCTOR') ? (
                        <button
                          onClick={() => discharge(a)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <LogOut size={13} /> Discharge
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Closed</span>
                      )}
                    </td>
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
