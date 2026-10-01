import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';
import {
  commandCenterService, notificationService, simulationService, bedService,
  patientService, errorMessage,
} from '../services/api';
import {
  PageHeader, Loading, ErrorState, ProgressBar, EmptyState, MetricCard,
  Panel, PanelHeader, AlertBanner, TriageBadge, PatientStatusBadge, OccupancyRing,
} from '../components/ui';
import WardMap3D from '../components/WardMap3D';
import ActivityFeed from '../components/ActivityFeed';
import LiveEventRail from '../components/LiveEventRail';
import {
  BedDouble, Users, Activity, Siren, AlertTriangle, Bell, Truck,
  UserPlus, Sparkles, Zap, Clock, ArrowRight, Wind,
} from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const severityIcon = { CRITICAL: Siren, WARNING: AlertTriangle, INFO: Bell };

export default function Dashboard() {
  const { can, pushToast, resyncTick, latestEvent, user } = useHospital();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [beds, setBeds] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bedsLoading, setBedsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const [statsRes, notifRes, queueRes] = await Promise.all([
        commandCenterService.getStats(),
        notificationService.getAll(),
        patientService.getTriageQueue(),
      ]);
      setStats(statsRes.data);
      setNotifications((notifRes.data || []).slice(0, 5));
      setQueue(queueRes.data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Backend unavailable'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBeds = useCallback(async () => {
    try {
      const r = await bedService.getAll();
      setBeds(r.data || []);
    } catch {
      setBeds([]);
    } finally {
      setBedsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, resyncTick]);
  useEffect(() => { loadBeds(); }, [loadBeds]);

  useEffect(() => {
    if (!latestEvent) return;
    if (['/topic/beds', '/topic/allocations', '/topic/command-center'].includes(latestEvent.topic)) loadBeds();
  }, [latestEvent?.receivedAt, loadBeds]);

  const runSimulation = async (name, fn, successMessage) => {
    setBusy(name);
    try {
      const { data } = await fn();
      pushToast(data?.message || data?.fullName || successMessage, 'SUCCESS', 'Simulation');
      load();
      loadBeds();
    } catch (err) {
      pushToast(errorMessage(err, 'Simulation failed'), 'ERROR', 'Simulation');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Loading label="Loading command center" />;
  if (error && !stats) return <ErrorState message={error} onRetry={load} />;

  const s = stats || {};
  const isAdmin = can('ADMIN');
  const occupancy = s.occupancyPercentage ?? 0;
  const icu = s.icuOccupancyPercentage ?? 0;
  const criticalWaiting = s.criticalPatientsWaiting ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting()}, ${(user?.fullName || user?.username || 'team').split(' ')[0]}`}
        subtitle="Hospital operations overview across beds, ICU, triage and fleet"
        actions={(
          <Link
            to="/triage"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
          >
            Open triage queue <ArrowRight size={14} />
          </Link>
        )}
      />

      {error && <AlertBanner tone="warning">{error}</AlertBanner>}

      <LiveEventRail />

      {criticalWaiting > 0 && (
        <AlertBanner tone="critical" title={`${criticalWaiting} critical patient${criticalWaiting > 1 ? 's' : ''} waiting`}>
          Level 1 patients are waiting for a bed. Review the triage queue to allocate.
        </AlertBanner>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Available beds"
          value={s.availableBeds ?? 0}
          tone="green"
          icon={<Activity size={15} />}
          sub={`of ${s.totalBeds ?? 0} total capacity`}
        />
        <MetricCard
          label="Occupied"
          value={s.occupiedBeds ?? 0}
          tone="blue"
          icon={<Users size={15} />}
          sub={`${occupancy.toFixed(1)}% hospital occupancy`}
        />
        <MetricCard
          label="Waiting for bed"
          value={s.patientsWaitingForBed ?? 0}
          tone="amber"
          icon={<Clock size={15} />}
          sub={criticalWaiting > 0 ? `${criticalWaiting} critical` : 'No critical waiting'}
        />
        <MetricCard
          label="ICU occupancy"
          value={`${icu.toFixed(1)}%`}
          tone={icu > 85 ? 'red' : 'teal'}
          icon={<Wind size={15} />}
          sub={`${s.icuAvailable ?? 0} of ${s.icuTotal ?? 0} ICU beds free`}
        />
      </section>

      <WardMap3D beds={beds} loading={bedsLoading} onChanged={() => { load(); loadBeds(); }} />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Panel className="p-5">
            <PanelHeader
              title="Critical care"
              subtitle="ICU and high dependency capacity"
              icon={<Wind size={15} />}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="ICU total" value={s.icuTotal ?? 0} tone="purple" />
              <MetricCard label="ICU available" value={s.icuAvailable ?? 0} tone="green" />
              <MetricCard label="ICU occupied" value={s.icuOccupied ?? 0} tone="blue" />
              <MetricCard label="HDU beds" value={s.totalBeds ? Math.max(0, (s.totalBeds ?? 0) - (s.icuTotal ?? 0)) : 0} tone="slate" />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <OccupancyRing
                value={occupancy}
                size={104}
                thickness={10}
                sublabel="Occupied"
                color={occupancy > 85 ? '#e11d48' : occupancy > 70 ? '#d97706' : '#059669'}
              />
              <div className="flex-1 w-full space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                  <span>Hospital occupancy</span>
                  <span className="cc-metric-value">{occupancy.toFixed(1)}%</span>
                </div>
                <ProgressBar
                  value={occupancy}
                  tone={occupancy > 85 ? 'bg-rose-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500'}
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                  <span>Bed utilisation</span>
                  <span className="cc-metric-value">{(s.bedUtilizationPercentage ?? 0).toFixed(1)}%</span>
                </div>
                <ProgressBar value={s.bedUtilizationPercentage ?? 0} tone="bg-blue-600" />
              </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeader
              title="Waiting patients"
              subtitle="Priority ordered from the live triage queue"
              icon={<Activity size={15} />}
              actions={(
                <Link to="/triage" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  View all
                </Link>
              )}
            />
            {queue.length === 0 ? (
              <EmptyState title="Queue is clear" hint="No patients are waiting for triage or a bed" />
            ) : (
              <ul className="space-y-1.5 max-h-80 overflow-y-auto">
                {queue.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-2.5 rounded-card border border-slate-200 bg-white cc-lift cursor-pointer">
                    <span className={`w-8 h-8 rounded-lg text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                      p.triageLevel === 1 ? 'bg-rose-600'
                        : p.triageLevel === 2 ? 'bg-orange-500'
                          : p.triageLevel === 3 ? 'bg-amber-400 text-slate-900' : 'bg-slate-500'
                    }`}>
                      L{p.triageLevel}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-bold text-slate-800 truncate">{p.fullName}</span>
                        <PatientStatusBadge status={p.admissionStatus} />
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {p.age} yrs · {p.gender} · {p.medicalRecordNumber} · waiting {p.waitingMinutes ?? 0}m
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0">
                      <TriageBadge level={p.triageLevel} category={p.triageCategory} />
                      <span className="text-[10px] text-slate-400 mt-0.5">{p.requiredBedType || 'GENERAL'}</span>
                    </div>
                    <Link
                      to={`/beds?patientId=${p.id}`}
                      aria-label={`Find a bed for ${p.fullName}`}
                      className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 transition-colors"
                    >
                      <BedDouble size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <ActivityFeed />

          <Panel className="p-5">
            <PanelHeader title="Ambulances" icon={<Truck size={15} />} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <MetricCard label="Incoming" value={s.ambulancesIncoming ?? 0} tone="blue" />
              <MetricCard label="Available" value={s.ambulancesAvailable ?? 0} tone="green" />
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Total fleet</span><span className="font-bold text-slate-700 cc-metric-value">{s.totalAmbulances ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Arrived</span><span className="font-bold text-slate-700 cc-metric-value">{s.ambulancesArrived ?? 0}</span></div>
            </div>
            <Link
              to="/ambulances"
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View fleet <ArrowRight size={13} />
            </Link>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Recent alerts" icon={<Bell size={15} />} />
            {notifications.length === 0 ? (
              <EmptyState title="No alerts" hint="System is nominal" />
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = severityIcon[n.type] || Bell;
                  return (
                    <li key={n.id} className={`flex gap-2.5 p-2.5 rounded-card border ${
                      n.type === 'CRITICAL' ? 'bg-rose-50 border-rose-200'
                        : n.type === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <Icon size={14} className="shrink-0 mt-0.5 text-slate-500" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800">{n.title}</div>
                        <div className="text-[11px] text-slate-600 leading-snug">{n.message}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              to="/notifications"
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              All alerts <ArrowRight size={13} />
            </Link>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Demonstration mode" subtitle="Same services as manual operations" icon={<Sparkles size={15} />} />
            {!isAdmin ? (
              <p className="text-[11px] text-slate-500 p-3 bg-slate-50 rounded-card border border-slate-200">
                Simulation is restricted to administrators.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <SimButton icon={<UserPlus size={14} />} label="New patient" loading={busy === 'patient'}
                  onClick={() => runSimulation('patient', simulationService.emergencyPatient, 'Emergency patient registered')} />
                <SimButton icon={<Truck size={14} />} label="Ambulance" loading={busy === 'ambulance'}
                  onClick={() => runSimulation('ambulance', simulationService.ambulanceArrival, 'Ambulance dispatched')} />
                <SimButton icon={<BedDouble size={14} />} label="Occupy bed" loading={busy === 'occupy'}
                  onClick={() => runSimulation('occupy', simulationService.occupyBed, 'Bed allocated')} />
                <SimButton icon={<Siren size={14} />} label="Discharge" loading={busy === 'discharge'}
                  onClick={() => runSimulation('discharge', simulationService.dischargePatient, 'Patient discharged')} />
                <SimButton icon={<Sparkles size={14} />} label="Finish cleaning" loading={busy === 'clean'}
                  onClick={() => runSimulation('clean', simulationService.cleanBed, 'Bed available')} />
                <SimButton icon={<Zap size={14} />} label="Reserve bed" loading={busy === 'reserve'}
                  onClick={() => runSimulation('reserve', simulationService.reserveBed, 'Bed reserved')} />
              </div>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function SimButton({ icon, label, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
    >
      {loading ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : icon}
      {label}
    </button>
  );
}
