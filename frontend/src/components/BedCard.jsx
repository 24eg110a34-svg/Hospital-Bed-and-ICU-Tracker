import { useEffect, useRef, useState } from 'react';
import { Wind, HeartPulse, Droplets, Shield, Activity, Sparkles, User } from 'lucide-react';
import { bedToken } from '../utils/constants';

const features = [
  { key: 'hasVentilator', label: 'Ventilator', Icon: Wind },
  { key: 'hasOxygen', label: 'Oxygen', Icon: Activity },
  { key: 'hasCardiacMonitor', label: 'Monitor', Icon: HeartPulse },
  { key: 'isolation', label: 'Isolation', Icon: Shield },
  { key: 'hasDialysis', label: 'Dialysis', Icon: Droplets },
];

export default function BedCard({ bed, actions, onSelect }) {
  const prevStatus = useRef(bed?.status);
  const [flip, setFlip] = useState(0);

  useEffect(() => {
    if (prevStatus.current !== bed?.status) {
      prevStatus.current = bed?.status;
      setFlip((n) => n + 1);
    }
  }, [bed?.status]);

  const isCleaning = bed?.status === 'CLEANING';
  const isMuted = bed?.status === 'MAINTENANCE' || bed?.status === 'BLOCKED';
  if (!bed) return null;

  const token = bedToken(bed.status);
  const activeFeatures = features.filter((f) => bed[f.key]);

  return (
    <div
      onClick={onSelect ? () => onSelect(bed) : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(bed); } } : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={`cc-bed-tile relative rounded-card border ${token.tile} ${token.glow} ${isMuted ? 'opacity-75 saturate-50' : ''} ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div key={flip} className={flip > 0 ? 'animate-bed-flip' : ''}>
      <div className="absolute left-3 right-3 top-0 h-[3px] rounded-b-full opacity-80" style={{ background: 'currentColor' }} aria-hidden="true">
        <span className={`block h-full w-full rounded-b-full ${token.bar} ${isCleaning ? 'cc-sweep relative overflow-hidden' : ''}`} />
      </div>

      <div className="p-3.5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold text-slate-900 truncate">{bed.bedNumber}</div>
            <div className="text-[11px] text-slate-500 truncate">{bed.wardName || 'Unassigned ward'}</div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600 shrink-0">
            {bed.bedType}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${token.dot} ${isCleaning ? 'animate-live-pulse' : ''}`} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${token.text}`}>{token.label}</span>
        </div>

        {bed.currentPatientName && (
          <div className="mt-2.5 p-2 rounded-lg bg-white/70 border border-slate-100 flex items-center gap-1.5">
            <User size={11} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-400">Occupant</div>
              <div className="text-[11px] font-bold text-slate-800 truncate">{bed.currentPatientName}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-2.5 min-h-[22px]">
          {activeFeatures.length === 0 ? (
            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
              <Sparkles size={10} /> Basic equipment
            </span>
          ) : activeFeatures.map(({ key, label, Icon }) => (
            <span key={key} title={label} aria-label={label} className="p-1 rounded bg-white/80 border border-slate-100 text-slate-600">
              <Icon size={11} />
            </span>
          ))}
        </div>

        {isCleaning && bed.cleaningProgress != null && (
          <div className="mt-2.5">
            <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-[width] duration-500 ease-calm" style={{ width: `${Math.min(100, Math.max(0, bed.cleaningProgress))}%` }} />
            </div>
            <div className="text-[10px] text-amber-700 font-semibold mt-1">
              Cleaning {Math.round(bed.cleaningProgress)}%
            </div>
          </div>
        )}

        {bed.lastStatusChange && (
          <div className="text-[10px] text-slate-400 mt-2">
            Updated {new Date(bed.lastStatusChange).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {actions && <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1">{actions}</div>}
      </div>
      </div>
    </div>
  );
}
