import React, { useEffect, useState } from 'react';
import { Radio, Siren, CheckCircle2, Info, AlertTriangle, Zap } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

const tones = {
  success: { Icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'text-emerald-500', bar: 'bg-emerald-500' },
  info: { Icon: Info, chip: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'text-blue-500', bar: 'bg-blue-500' },
  warning: { Icon: AlertTriangle, chip: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'text-amber-500', bar: 'bg-amber-500' },
  critical: { Icon: Siren, chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'text-rose-500', bar: 'bg-rose-500' },
};

const age = (seconds) => (seconds < 1 ? 'now' : seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`);

export default function LiveEventRail() {
  const { activity, connected, latestEvent } = useHospital();
  const [, force] = useState(0);
  const latest = activity[0];

  useEffect(() => {
    if (!latest) return undefined;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [latest?.id]);

  const type = latestEvent?.payload?.type;
  const tone = tones[latest?.tone] || tones.info;
  const Icon = tone.Icon;
  const seconds = latest ? Math.floor((Date.now() - latest.at) / 1000) : 0;

  return (
    <div
      className="cc-rail relative rounded-card border border-slate-200 bg-white shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${connected ? tone.bar : 'bg-slate-300'}`}
      />
      {connected && <span aria-hidden="true" className="cc-rail-scan" />}

      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-4 pr-3 py-2.5">
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] ${
            connected ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          <span className={`relative flex h-2 w-2 ${connected ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span className={`cc-halo ${connected ? '' : 'hidden'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 cc-beat' : 'bg-rose-500'}`} />
          </span>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>

        {latest ? (
          <>
            <span
              key={latest.id}
              className="cc-rail-in flex items-center gap-2 min-w-0 flex-1"
            >
              <span className={`inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded border text-[9.5px] font-extrabold tracking-wider ${tone.chip}`}>
                <Icon size={10} />
                {String(type || latest.topic.replace('/topic/', '')).replace(/_/g, ' ')}
              </span>
              <span className="text-[13px] font-semibold text-slate-800 truncate">{latest.text}</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <time className="text-[10.5px] font-bold text-slate-400 cc-metric-value">{age(seconds)} ago</time>
              <span className="w-10 h-1 rounded-full bg-slate-200 overflow-hidden">
                <span
                  key={latest.id}
                  className={`cc-rail-age block h-full w-full ${tone.bar}`}
                />
              </span>
            </span>
          </>
        ) : (
          <span className="flex items-center gap-2 text-[13px] text-slate-400 min-w-0 flex-1">
            <Zap size={13} className="shrink-0" />
            {connected ? 'Listening for bed, patient and ambulance events…' : 'Reconnecting to the live feed…'}
          </span>
        )}
      </div>
    </div>
  );
}
