import React, { useState, useCallback } from 'react';
import { reservationService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, MetricCard } from '../components/ui';
import { formatDateTime, formatWait } from '../utils/constants';
import { CalendarClock, Check, X, RefreshCw, Timer } from 'lucide-react';

const styles = {
  ACTIVE: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function Reservations() {
  const { can, pushToast } = useHospital();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const { data } = await reservationService.getAll();
      setReservations(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load reservations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  const confirm = async (reservation) => {
    if (!window.confirm(`Confirm reservation for ${reservation.patientName}? This will admit the patient to ${reservation.bedNumber}.`)) return;
    try {
      await reservationService.confirm(reservation.id);
      pushToast(`${reservation.patientName} admitted to ${reservation.bedNumber}`, 'SUCCESS', 'Reservation confirmed');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Confirm failed'), 'ERROR');
    }
  };

  const cancel = async (reservation) => {
    if (!window.confirm(`Cancel the reservation for ${reservation.bedNumber}? The bed will become available.`)) return;
    try {
      await reservationService.cancel(reservation.id);
      pushToast(`Reservation cancelled, ${reservation.bedNumber} released`, 'SUCCESS');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Cancel failed'), 'ERROR');
    }
  };

  if (loading) return <Loading label="Loading reservations" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const filtered = filter === 'ALL' ? reservations : reservations.filter((r) => r.status === filter);
  const active = reservations.filter((r) => r.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed Reservations"
        subtitle="Two-hour holds that expire automatically and release the bed"
        actions={(
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Active Holds" value={active.length} tone="amber" />
        <MetricCard label="Confirmed" value={reservations.filter((r) => r.status === 'CONFIRMED').length} tone="green" />
        <MetricCard label="Expired" value={reservations.filter((r) => r.status === 'EXPIRED').length} tone="slate" />
        <MetricCard label="Cancelled" value={reservations.filter((r) => r.status === 'CANCELLED').length} tone="red" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['ALL', 'ACTIVE', 'CONFIRMED', 'EXPIRED', 'CANCELLED'].map((f) => (
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

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={48} />}
            title="No reservations found"
            hint="Create one from Bed Management by choosing an available bed and a waiting patient"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Bed', 'Patient', 'Ward', 'Created', 'Expires', 'Created By', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{r.bedNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">{r.patientName}</div>
                      <div className="text-xs text-slate-500">{r.patientMrn}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.wardName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(r.expiresAt)}
                      {r.status === 'ACTIVE' && r.minutesRemaining > 0 && (
                        <div className="flex items-center gap-1 text-amber-700 font-semibold mt-0.5">
                          <Timer size={11} /> {formatWait(r.minutesRemaining)} left
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.createdBy}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[r.status] || 'bg-slate-100 text-slate-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'ACTIVE' && (
                        <div className="flex gap-1">
                          {can('ADMIN', 'DOCTOR', 'NURSE') && (
                            <button
                              onClick={() => confirm(r)}
                              title="Confirm and admit"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                            >
                              <Check size={15} />
                            </button>
                          )}
                          {can('ADMIN', 'DOCTOR', 'STAFF') && (
                            <button
                              onClick={() => cancel(r)}
                              title="Cancel reservation"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
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
