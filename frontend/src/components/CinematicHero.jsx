import React, { useId } from 'react';
import EcgPulse from './EcgPulse';

const BOKEH = [
  { top: '18%', left: '12%', size: 96, delay: '0s', dur: 13 },
  { top: '52%', left: '68%', size: 72, delay: '3.4s', dur: 16 },
  { top: '68%', left: '26%', size: 118, delay: '6.2s', dur: 18 },
  { top: '30%', left: '84%', size: 56, delay: '1.8s', dur: 15 },
];

const STEAM = [
  { left: '17%', size: 74, delay: '0s', dur: 9 },
  { left: '24%', size: 54, delay: '3s', dur: 11 },
  { left: '35%', size: 90, delay: '5.6s', dur: 12 },
];

function Bed() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = `ccBedBody${uid}`;
  const sheet = `ccBedSheet${uid}`;
  const rim = `ccBedRim${uid}`;

  return (
    <svg viewBox="0 0 640 360" className="w-full h-auto" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24466f" />
          <stop offset="100%" stopColor="#0a1a2e" />
        </linearGradient>
        <linearGradient id={sheet} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef6ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#8ab6e8" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#bae6fd" stopOpacity="0" />
          <stop offset="50%" stopColor="#f0f9ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d="M560 208 V54" stroke="#9fc6e8" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      <path d="M560 54 h20" stroke="#9fc6e8" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      <path d="M560 72 h-16" stroke="#9fc6e8" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
      <path d="M556 208 h8 v34 h-8 z" fill={`url(#${body})`} />

      <rect x="150" y="92" width="252" height="10" rx="5" fill={`url(#${body})`} />
      <rect x="158" y="100" width="9" height="72" rx="4" fill={`url(#${body})`} />
      <rect x="386" y="100" width="9" height="72" rx="4" fill={`url(#${body})`} />
      <rect x="176" y="104" width="200" height="6" rx="3" fill="#bcd9f5" fillOpacity="0.35" />

      <rect x="44" y="118" width="15" height="112" rx="7" fill={`url(#${body})`} />
      <rect x="581" y="134" width="15" height="96" rx="7" fill={`url(#${body})`} />

      <rect x="86" y="140" width="112" height="34" rx="17" fill={`url(#${sheet})`} />
      <rect x="60" y="168" width="520" height="42" rx="14" fill={`url(#${sheet})`} />
      <rect x="212" y="158" width="368" height="20" rx="10" fill="#ffffff" fillOpacity="0.28" />

      <rect x="50" y="206" width="540" height="16" rx="8" fill={`url(#${body})`} />
      <rect x="112" y="218" width="14" height="88" rx="6" fill={`url(#${body})`} />
      <rect x="514" y="218" width="14" height="88" rx="6" fill={`url(#${body})`} />
      <circle cx="119" cy="312" r="12" fill="#0b1c31" />
      <circle cx="521" cy="312" r="12" fill="#0b1c31" />

      <path
        d="M60 168 h520"
        stroke={`url(#${rim})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export default function CinematicHero({ className = '', children, bed = true }) {
  return (
    <div className={`cc-cine relative overflow-hidden ${className}`}>
      <div className="cc-cine-scene cc-dolly" />

      {BOKEH.map((b, i) => (
        <span
          key={i}
          className="cc-bokeh absolute"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: 'radial-gradient(circle, rgba(191,225,255,.7), transparent 68%)',
            animationDelay: b.delay,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-[8%] flex items-center overflow-hidden opacity-[0.12]">
        <div className="w-full h-16">
          <EcgPulse tone="green" duration={5} />
        </div>
      </div>

      <div
        className="hidden sm:block absolute top-[7%] left-[6%] w-[clamp(140px,20%,260px)] rounded-xl p-2 border border-sky-200/20"
        style={{
          background: 'linear-gradient(160deg, rgba(226,240,255,.16), rgba(148,197,255,.05))',
          animation: 'cc-monitor-glow 6s ease-in-out infinite alternate',
        }}
      >
        <div className="flex items-center justify-between px-1 pb-1.5">
          <span className="text-[9px] font-bold tracking-[0.18em] text-sky-200/70">BED MONITOR</span>
          <span className="cc-indicator !text-[8px] !px-1.5 !py-[3px] !tracking-[0.14em]">BED AVAILABLE</span>
        </div>
        <div className="relative h-20 overflow-hidden rounded-lg bg-slate-950/85 border border-sky-400/20">
          <div className="cc-cine-scanlines" />
          <div className="cc-cine-scanline top-0" />
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-14">
              <EcgPulse tone="green" />
            </div>
          </div>
        </div>
      </div>

      {bed && (
        <div className="cc-cine-bed">
          <Bed />
        </div>
      )}

      {STEAM.map((s, i) => (
        <span
          key={i}
          className="cc-steam absolute bottom-[26%]"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}

      <div className="cc-cine-sweep" />
      <div className="cc-cine-scanlines" />
      <div className="cc-cine-grain" />
      <div className="cc-cine-vignette" />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
