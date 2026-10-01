import React, { useState, useCallback } from 'react';
import { resourceService, errorMessage } from '../services/api';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, MetricCard, ProgressBar } from '../components/ui';
import { PackageSearch, RefreshCw, AlertTriangle } from 'lucide-react';

const statusStyles = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  LOW: 'bg-amber-100 text-amber-800',
  CRITICAL: 'bg-rose-100 text-rose-700',
  MAINTENANCE: 'bg-slate-200 text-slate-700',
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await resourceService.getAll();
      setResources(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load resources'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  if (loading) return <Loading label="Loading resources" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const shortages = resources.filter((r) => r.shortage);
  const critical = resources.filter((r) => r.status === 'CRITICAL');
  const totalUnits = resources.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
  const availableUnits = resources.reduce((sum, r) => sum + (r.availableQuantity || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Resources"
        subtitle="Equipment and consumables tracked against live availability"
        actions={(
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Resource Types" value={resources.length} tone="blue" />
        <MetricCard label="Shortages" value={shortages.length} tone={shortages.length ? 'red' : 'green'} />
        <MetricCard label="Critical" value={critical.length} tone={critical.length ? 'red' : 'green'} />
        <MetricCard
          label="Overall Availability"
          value={`${totalUnits ? Math.round((availableUnits / totalUnits) * 100) : 0}%`}
          tone="teal"
        />
      </div>

      {shortages.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {shortages.length} resource{shortages.length > 1 ? 's are' : ' is'} at or below 15% availability:
          {' '}{shortages.map((r) => r.name).join(', ')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {resources.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-slate-200">
            <EmptyState icon={<PackageSearch size={48} />} title="No resources configured" />
          </div>
        ) : resources.map((resource) => {
          const total = resource.totalQuantity || 0;
          const available = resource.availableQuantity || 0;
          const used = resource.usedQuantity || 0;
          const pct = total ? Math.round((used / total) * 100) : 0;
          return (
            <div key={resource.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${resource.shortage ? 'border-rose-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{resource.name}</div>
                  <div className="text-xs text-slate-500">{resource.category?.replace(/_/g, ' ')}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${statusStyles[resource.status] || 'bg-slate-100 text-slate-700'}`}>
                  {resource.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{used} in use</span>
                  <span className="font-semibold">{available} / {total} available</span>
                </div>
                <ProgressBar
                  value={pct}
                  tone={resource.shortage ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}
                />
              </div>

              {resource.shortage && (
                <div className="mt-2 text-xs text-rose-700 font-medium flex items-center gap-1">
                  <AlertTriangle size={12} /> Low stock
                </div>
              )}
              {resource.lastUpdated && (
                <div className="mt-2 text-[10px] text-slate-400">Updated {new Date(resource.lastUpdated).toLocaleString()}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
