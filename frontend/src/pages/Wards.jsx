import React, { useState, useCallback } from 'react';
import { commandCenterService, wardService, errorMessage } from '../services/api';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, ProgressBar, MetricCard } from '../components/ui';
import { Building2, RefreshCw, MapPin } from 'lucide-react';

export default function Wards() {
  const [wards, setWards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [wardRes, statsRes] = await Promise.all([
        wardService.getAll(),
        commandCenterService.getStats(),
      ]);
      setWards(wardRes.data || []);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load wards'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  if (loading) return <Loading label="Loading wards" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const utilization = stats?.wardUtilization || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ward Management"
        subtitle={`${wards.length} wards with live occupancy`}
        actions={(
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Wards" value={wards.length} tone="blue" />
        <MetricCard label="Total Beds" value={stats?.totalBeds ?? 0} tone="slate" />
        <MetricCard label="Available" value={stats?.availableBeds ?? 0} tone="green" />
        <MetricCard label="Occupancy" value={`${(stats?.occupancyPercentage ?? 0).toFixed(1)}%`} tone="teal" />
      </div>

      {wards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={<Building2 size={48} />} title="No wards configured" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wards.map((ward) => {
            const live = utilization.find((u) => u.wardId === ward.id);
            const occupancy = live?.occupancy ?? 0;
            return (
              <div key={ward.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={18} className="text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{ward.name}</div>
                      <div className="text-xs text-slate-500">{ward.wardType}</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 shrink-0">
                    {ward.capacity ?? '-'} beds
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={12} />
                  {ward.location}{ward.floor != null ? ` · Floor ${ward.floor}` : ''}
                </div>
                {ward.hospitalName && (
                  <div className="text-xs text-slate-400 mt-0.5">{ward.hospitalName}</div>
                )}

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Occupancy</span>
                    <span className="font-semibold">{occupancy.toFixed(0)}%</span>
                  </div>
                  <ProgressBar
                    value={occupancy}
                    tone={occupancy > 85 ? 'bg-rose-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500'}
                  />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ['Total', live?.total ?? 0, 'text-slate-700'],
                    ['Avail', live?.available ?? 0, 'text-emerald-700'],
                    ['Occ', live?.occupied ?? 0, 'text-rose-700'],
                    ['Resv', live?.reserved ?? 0, 'text-amber-700'],
                  ].map(([label, value, cls]) => (
                    <div key={label} className="py-1.5 bg-slate-50 rounded-lg">
                      <div className={`text-sm font-bold ${cls}`}>{value}</div>
                      <div className="text-[10px] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
