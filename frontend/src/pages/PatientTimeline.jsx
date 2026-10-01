import React, { useState, useCallback, useEffect } from 'react';
import { patientService, errorMessage } from '../services/api';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, PatientStatusBadge, TriageBadge } from '../components/ui';
import { formatDateTime, formatWait } from '../utils/constants';
import { ScrollText, Search, RefreshCw, Phone, Droplet, HeartPulse } from 'lucide-react';

export default function PatientTimeline() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      const { data } = await patientService.getAll();
      setPatients(data || []);
      setError('');
      setSelectedId((current) => current || (data && data[0] ? data[0].id : null));
    } catch (err) {
      setError(errorMessage(err, 'Failed to load patients'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(loadPatients);

  const loadEvents = useCallback(async (patientId) => {
    if (!patientId) { setEvents([]); return; }
    setEventsLoading(true);
    try {
      const { data } = await patientService.getTimeline(patientId);
      setEvents([...(data || [])].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || '')));
    } catch (err) {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(selectedId); }, [selectedId, loadEvents]);

  if (loading) return <Loading label="Loading patients" />;
  if (error) return <ErrorState message={error} onRetry={loadPatients} />;

  const filtered = patients.filter((p) => !search
    || p.fullName?.toLowerCase().includes(search.toLowerCase())
    || p.medicalRecordNumber?.toLowerCase().includes(search.toLowerCase()));
  const patient = patients.find((p) => p.id === selectedId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Timeline"
        subtitle="Database-stored events from registration through discharge"
        actions={(
          <button onClick={() => { loadPatients(); loadEvents(selectedId); }} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:col-span-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No patients found</p>
            ) : filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
                  selectedId === p.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'
                }`}
              >
                <div className="font-medium truncate">{p.fullName}</div>
                <div className={`text-xs truncate ${selectedId === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  {p.medicalRecordNumber} · L{p.triageLevel}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-3">
          {!patient ? (
            <EmptyState icon={<ScrollText size={48} />} title="Select a patient" hint="Choose a patient from the list to see their timeline" />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{patient.fullName}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {patient.medicalRecordNumber} · {patient.age} yrs · {patient.gender} · {patient.bloodType}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <TriageBadge level={patient.triageLevel} category={patient.triageCategory} />
                    <PatientStatusBadge status={patient.admissionStatus} />
                    {patient.assignedBedNumber && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        Bed {patient.assignedBedNumber} · {patient.assignedWardName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <HeartPulse size={13} className="text-slate-400" />
                    HR {patient.heartRate ?? '-'} · SpO2 {patient.spo2 ?? '-'}%
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Droplet size={13} className="text-slate-400" />
                    {patient.bloodType}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone size={13} className="text-slate-400" />
                    {patient.phoneNumber || '-'}
                  </div>
                  <div className="text-slate-500">Waiting: {formatWait(patient.waitingMinutes)}</div>
                </div>
              </div>

              {eventsLoading ? (
                <Loading label="Loading timeline" />
              ) : events.length === 0 ? (
                <EmptyState
                  icon={<ScrollText size={40} />}
                  title="No timeline events yet"
                  hint="Events are recorded when the patient is triaged, allocated, admitted, treated and discharged"
                />
              ) : (
                <div className="mt-5 relative border-l-2 border-slate-200 pl-6 space-y-5">
                  {events.map((event, index) => (
                    <div key={event.id || index} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                          {String(event.eventType || '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</span>
                        {event.createdBy && <span className="text-xs text-slate-400">by {event.createdBy}</span>}
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
