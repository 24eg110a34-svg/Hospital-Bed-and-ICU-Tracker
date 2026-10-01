import React, { useEffect, useState } from 'react';
import { ServerCrash, PlugZap, Check, Terminal, X } from 'lucide-react';
import { API_BASE, isBackendDown, onBackendStatus, pingBackend } from '../services/api';

const POLL_MS = 6000;

export default function BackendBanner() {
  const [down, setDown] = useState(isBackendDown);
  const [recovered, setRecovered] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => onBackendStatus((isDown) => {
    setDown(isDown);
    if (!isDown) {
      setRecovered(true);
      setTimeout(() => setRecovered(false), 4000);
    }
  }), []);

  useEffect(() => {
    const t = setInterval(pingBackend, POLL_MS);
    return () => clearInterval(t);
  }, []);

  const retry = async () => {
    setChecking(true);
    await pingBackend();
    setChecking(false);
  };

  if (!down && !recovered) return null;

  if (!down) {
    return (
      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-card border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13px] animate-panel-in">
        <Check size={15} className="shrink-0" />
        <span className="font-semibold">Reconnected to the backend</span>
        <span className="ml-auto font-mono text-[11px] text-emerald-600">{API_BASE}</span>
      </div>
    );
  }

  return (
    <div role="alert" className="mb-4 rounded-card border border-rose-200 bg-rose-50 p-3.5 text-rose-900 animate-panel-in">
      <div className="flex items-start gap-2.5">
        <ServerCrash size={18} className="shrink-0 mt-0.5 text-rose-600" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-extrabold">Backend unreachable</div>
          <p className="text-[12.5px] text-rose-800 leading-snug mt-0.5">
            Nothing is answering at <code className="px-1 py-0.5 rounded bg-rose-100 font-mono text-[11.5px]">{API_BASE}</code>.
            Live data, bed map and reports will stay empty until the server is back.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 text-rose-200 text-[11px] font-mono">
              <Terminal size={11} /> cd backend &amp;&amp; mvn spring-boot:run
            </span>
            <button
              onClick={retry}
              disabled={checking}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[11.5px] font-bold transition-colors cursor-pointer"
            >
              <PlugZap size={12} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking...' : 'Retry now'}
            </button>
            <span className="text-[11px] text-rose-600 font-semibold">auto-checks every {POLL_MS / 1000}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
