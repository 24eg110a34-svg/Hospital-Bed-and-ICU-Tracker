import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wind, HeartPulse, Droplets, Shield, Activity, Users,
  Sparkles, ArrowRight, Loader2, Check,
} from 'lucide-react';
import { bedService, errorMessage } from '../services/api';
import { bedToken } from '../utils/constants';
import { useHospital } from '../context/HospitalContext';
import Modal from './Modal';
import { TriageBadge } from './ui';

const features = [
  { key: 'hasVentilator', label: 'Ventilator', Icon: Wind },
  { key: 'hasOxygen', label: 'Oxygen', Icon: Activity },
  { key: 'hasCardiacMonitor', label: 'Monitor', Icon: HeartPulse },
  { key: 'isolation', label: 'Isolation', Icon: Shield },
  { key: 'hasDialysis', label: 'Dialysis', Icon: Droplets },
];

function BedDetailModal({ bed, onClose, onAllocated }) {
  const { can, pushToast } = useHospital();
  const [patients, setPatients] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(0);

  useEffect(() => {
    if (!bed || bed.status !== 'AVAILABLE') {
      setPatients(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    bedService.suitablePatients(bed.id)
      .then((r) => { if (!cancelled) setPatients(r.data || []); })
      .catch((err) => { if (!cancelled) { setPatients([]); pushToast(errorMessage(err, 'Could not load matching patients'), 'ERROR'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bed, pushToast]);

  if (!bed) return null;

  const token = bedToken(bed.status);

  const allocate = async (patient) => {
    setBusy(patient.id);
    try {
      await bedService.allocatePatient(bed.id, patient.id);
      pushToast(`${patient.fullName} allocated to ${bed.bedNumber}`, 'SUCCESS', 'Bed allocated');
      setPatients((prev) => (prev || []).filter((p) => p.id !== patient.id));
      onAllocated();
    } catch (err) {
      pushToast(errorMessage(err, 'Allocation rejected'), 'ERROR');
    } finally {
      setBusy(0);
    }
  };

  const active = features.filter((f) => bed[f.key]);

  return (
    <Modal isOpen={Boolean(bed)} onClose={onClose} title={`Bed ${bed?.bedNumber || ''}`} size="md">
      {bed && (
        <div className="space-y-4">
          <div className={`rounded-card border p-3.5 ${token.tile}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-slate-900">{bed.bedNumber}</div>
                <div className="text-xs text-slate-600">{bed.wardName || 'Unassigned ward'} · {bed.bedType}{bed.room ? ` · Room ${bed.room}` : ''}</div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${token.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${token.dot}`} />
                {token.label}
              </span>
            </div>
            {bed.currentPatientName && (
              <div className="mt-2.5 pt-2.5 border-t border-white/60 text-xs text-slate-700">
                Current occupant: <span className="font-bold">{bed.currentPatientName}</span>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Equipment</div>
            <div className="flex flex-wrap gap-1.5">
              {active.length === 0 ? (
                <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Sparkles size={12} /> Basic equipment</span>
              ) : active.map(({ key, label, Icon }) => (
                <span key={key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <Icon size={12} className="text-slate-500" /> {label}
                </span>
              ))}
            </div>
          </div>

          {bed.status === 'AVAILABLE' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suitable patients</div>
                {patients && <span className="text-[11px] font-bold text-slate-500">{patients.length} matched</span>}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-4 justify-center">
                  <Loader2 size={14} className="animate-spin" /> Matching against live queue...
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-5 bg-slate-50 rounded-card border border-slate-200">
                  <Users size={18} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">No compatible patients waiting</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Requirements are matched on bed type, ward and equipment.</p>
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {patients.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-card border border-slate-200 bg-white">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-bold text-slate-800 truncate">{p.fullName}</span>
                          <TriageBadge level={p.triageLevel} category={p.triageCategory} />
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {p.medicalRecordNumber} · needs {p.requiredBedType || 'GENERAL'}
                          {p.requiredWardType ? ` · ${p.requiredWardType}` : ''}
                        </div>
                      </div>
                      {can('ADMIN', 'DOCTOR') ? (
                        <button
                          onClick={() => allocate(p)}
                          disabled={busy === p.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                        >
                          {busy === p.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Allocate
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">View only</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <Link
              to="/beds"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-card border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Manage this bed <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}

function VitalSpark({ status }) {
  const color = status === 'OCCUPIED' ? 'text-emerald-500' : 'text-amber-500';
  return (
    <span className={`cc-eq ${color} ml-auto shrink-0`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <i key={i} style={{ animationDelay: `${i * 0.17}s`, animationDuration: `${0.7 + i * 0.13}s` }} />
      ))}
    </span>
  );
}

function FloorTile({ bed, index, onSelect, changed }) {
  const token = bedToken(bed?.status);
  const isMuted = bed?.status === 'MAINTENANCE' || bed?.status === 'BLOCKED';
  const delay = Math.min(index * 14, 420);
  const live = bed?.status === 'AVAILABLE' || bed?.status === 'OCCUPIED' || bed?.status === 'CLEANING';
  if (!bed) return null;

  return (
    <button
      onClick={() => onSelect(bed)}
      title={`${bed.bedNumber} · ${token.label}${bed.wardName ? ` · ${bed.wardName}` : ''}`}
      className={`cc-bed-tile group relative rounded-lg border ${token.tile} ${token.glow} ${isMuted ? 'opacity-70 saturate-50' : ''} px-2 py-2 text-left ${changed ? 'animate-bed-flip' : 'animate-tile-in'}`}
      style={{ animationDelay: changed ? '0ms' : `${delay}ms` }}
    >
      <span className={`block w-full h-1 rounded-full ${token.bar} ${bed.status === 'CLEANING' ? 'cc-sweep relative overflow-hidden' : ''}`} aria-hidden="true" />
      <span className="block text-[10px] font-extrabold text-slate-800 truncate mt-1.5">{bed.bedNumber}</span>
      <span className="flex items-center gap-1 mt-0.5">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${token.dot} ${live ? 'cc-dot-ping' : ''} ${token.ping}`}
          style={live ? { animationDelay: `${(index * 130) % 1900}ms` } : undefined}
          aria-hidden="true"
        />
        <span className={`text-[9px] font-bold uppercase tracking-wide truncate ${token.text}`}>{token.label}</span>
        {bed.currentPatientName && <VitalSpark status={bed.status} />}
      </span>
      {bed.currentPatientName && (
        <span className="block text-[9px] text-slate-500 truncate mt-0.5">{bed.currentPatientName}</span>
      )}
      <span className="sr-only">{bed.bedNumber}, {token.label}{bed.currentPatientName ? `, occupied by ${bed.currentPatientName}` : ''}</span>
    </button>
  );
}

export default function WardMap3D({ beds, loading, onChanged }) {
  const { can, pushToast, latestEvent } = useHospital();
  const [selected, setSelected] = useState(null);
  const [changed, setChanged] = useState({});

  useEffect(() => {
    const evt = latestEvent;
    if (!evt || !['/topic/beds', '/topic/allocations'].includes(evt.topic)) return;
    const bedId = evt.payload?.data?.bedId;
    if (bedId == null) return;
    setChanged((prev) => ({ ...prev, [bedId]: (prev[bedId] || 0) + 1 }));
    const t = setTimeout(() => {
      setChanged((prev) => {
        const next = { ...prev };
        delete next[bedId];
        return next;
      });
    }, 1400);
    return () => clearTimeout(t);
  }, [latestEvent?.receivedAt]);

  const wards = useMemo(() => {
    const map = new Map();
    beds.forEach((b) => {
      const key = b.wardName || 'Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return [...map.entries()]
      .map(([name, list]) => ({ name, list, type: list[0]?.wardType }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [beds]);

  const counts = useMemo(() => beds.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {}), [beds]);

  if (loading) {
    return (
      <div className="cc-panel p-5">
        <div className="h-3 w-40 cc-skeleton rounded mb-4" />
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {Array.from({ length: 16 }).map((_, i) => <div key={i} className="h-14 cc-skeleton rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cc-panel overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Ward floor</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click a bed to inspect and match patients</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {Object.entries(counts).map(([status, n]) => {
              const t = bedToken(status);
              return (
                <span key={status} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <span className={`w-2 h-2 rounded-full ${t.dot} ${t.ping} cc-dot-ping`} aria-hidden="true" />
                  {t.label}
                  <span className="text-slate-400 cc-metric-value">{n}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="cc-scene p-4 lg:p-5 relative">
          <div
            aria-hidden="true"
            className="cc-map-pan absolute pointer-events-none opacity-70"
            style={{
              inset: '-8%',
              backgroundImage:
                'linear-gradient(to right, rgba(37,99,235,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,.05) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
              maskImage: 'radial-gradient(120% 100% at 50% 40%, #000 20%, transparent 78%)',
              WebkitMaskImage: 'radial-gradient(120% 100% at 50% 40%, #000 20%, transparent 78%)',
            }}
          />
          <div className="cc-floor space-y-4 relative">
            {wards.map((ward, wi) => (
              <div key={ward.name}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-extrabold text-slate-700 tracking-wide uppercase">{ward.name}</span>
                  {ward.type && <span className="text-[10px] font-semibold text-slate-400">{ward.type}</span>}
                  <span className="text-[10px] font-bold text-slate-400 ml-auto">{ward.list.length} beds</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                  {ward.list.map((bed, i) => (
                    <FloorTile
                      key={bed.id}
                      bed={bed}
                      index={i + wi * 3}
                      onSelect={setSelected}
                      changed={Boolean(changed[bed.id])}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BedDetailModal
        bed={selected}
        onClose={() => setSelected(null)}
        onAllocated={() => { onChanged?.(); }}
      />
    </>
  );
}
