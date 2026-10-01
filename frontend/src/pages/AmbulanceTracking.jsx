import React, { useState, useCallback } from 'react';
import { ambulanceService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, MetricCard } from '../components/ui';
import { AMBULANCE_STATUSES, formatTime } from '../utils/constants';
import { Truck, MapPin, Clock, User, RefreshCw, Navigation } from 'lucide-react';

const styles = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  EN_ROUTE: 'bg-amber-100 text-amber-800 border-amber-300',
  ARRIVED: 'bg-purple-100 text-purple-800 border-purple-200',
  TRANSPORTING: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-slate-200 text-slate-700 border-slate-300',
};

export default function AmbulanceTracking() {
  const { can, pushToast } = useHospital();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await ambulanceService.getAll();
      setAmbulances(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load ambulances'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  const updateStatus = async (ambulance, status) => {
    setSavingId(ambulance.id);
    try {
      await ambulanceService.update(ambulance.id, { ...ambulance, status });
      pushToast(`${ambulance.vehicleNumber} is now ${status}`, 'SUCCESS');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Status update rejected'), 'ERROR');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Loading label="Loading fleet" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const incoming = ambulances.filter((a) => ['EN_ROUTE', 'TRANSPORTING'].includes(a.status));
  const available = ambulances.filter((a) => a.status === 'AVAILABLE');
  const arrived = ambulances.filter((a) => a.status === 'ARRIVED');
  const canUpdate = can('ADMIN', 'STAFF', 'NURSE');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambulance Fleet"
        subtitle="Incoming and available units, updated live"
        actions={(
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Fleet" value={ambulances.length} tone="blue" />
        <MetricCard label="Incoming" value={incoming.length} tone="amber" />
        <MetricCard label="Arrived" value={arrived.length} tone="purple" />
        <MetricCard label="Available" value={available.length} tone="green" />
      </div>

      {ambulances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={<Truck size={48} />} title="No ambulances registered" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ambulances.map((amb) => (
            <div key={amb.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Truck size={17} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{amb.vehicleNumber}</div>
                    <div className="text-xs text-slate-500 truncate">{amb.driverName}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border shrink-0 ${styles[amb.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {amb.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{amb.currentLocation || 'Stationed at base'}</span>
                </div>
                {amb.destination && (
                  <div className="flex items-center gap-2">
                    <Navigation size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">To: {amb.destination}</span>
                  </div>
                )}
                {amb.eta && (
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>ETA {formatTime(amb.eta)}</span>
                  </div>
                )}
                {amb.patientId && (
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-400 shrink-0" />
                    <span>Patient #{amb.patientId}</span>
                  </div>
                )}
                {amb.lastUpdated && (
                  <div className="text-[10px] text-slate-400 pt-1">
                    Updated {new Date(amb.lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>

              {canUpdate && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Update status</label>
                  <select
                    value={amb.status}
                    disabled={savingId === amb.id}
                    onChange={(e) => updateStatus(amb, e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white disabled:opacity-50 cursor-pointer"
                  >
                    {AMBULANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
