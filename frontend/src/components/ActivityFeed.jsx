import React from 'react';
import { Radio, Siren, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

const tones = {
  success: { dot: 'bg-emerald-500', Icon: CheckCircle2, text: 'text-emerald-700' },
  info: { dot: 'bg-blue-500', Icon: Info, text: 'text-slate-700' },
  warning: { dot: 'bg-amber-500', Icon: AlertTriangle, text: 'text-amber-800' },
  critical: { dot: 'bg-rose-500', Icon: Siren, text: 'text-rose-800' },
};

const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ActivityFeed({ limit = 12 }) {
  const { activity, connected } = useHospital();

  return (
    <div className="cc-panel p-5 flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Live activity</h2>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider ${connected ? 'text-emerald-600' : 'text-rose-600'}`}>
          <Radio size={11} className={connected ? 'animate-live-pulse' : ''} />
          {connected ? 'STREAMING' : 'PAUSED'}
        </span>
      </div>

      {activity.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <Radio size={20} className="text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-600">No events yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
            Bed, patient and ambulance activity will stream here as it happens.
          </p>
        </div>
      ) : (
        <ol className="flex-1 space-y-0.5 overflow-y-auto -mx-1 px-1" aria-live="polite">
          {activity.slice(0, limit).map((item) => {
            const t = tones[item.tone] || tones.info;
            const { Icon } = t;
            return (
              <li key={item.id} className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors animate-feed-in">
                <span className="relative mt-1 shrink-0">
                  <span className={`block w-1.5 h-1.5 rounded-full ${t.dot}`} />
                </span>
                <Icon size={12} className={`shrink-0 mt-0.5 ${t.text}`} aria-hidden="true" />
                <span className="text-xs text-slate-700 leading-snug flex-1 min-w-0">{item.text}</span>
                <time className="text-[10px] text-slate-400 cc-metric-value shrink-0 mt-0.5">{clock(item.at)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
