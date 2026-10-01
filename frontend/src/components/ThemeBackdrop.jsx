import React from 'react';
import EcgPulse from './EcgPulse';

const GLOWS = [
  { top: '-12%', left: '-6%', size: 620, color: 'rgba(37,99,235,.16)' },
  { top: '8%', right: '-10%', size: 540, color: 'rgba(8,145,178,.14)' },
  { bottom: '-16%', left: '28%', size: 700, color: 'rgba(16,185,129,.09)' },
  { bottom: '4%', right: '6%', size: 420, color: 'rgba(225,29,72,.05)' },
];

export default function ThemeBackdrop() {
  return (
    <div className="cc-theme fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="cc-theme-base" />
      <div className="cc-theme-grid cc-theme-drift" />
      {GLOWS.map((g, i) => (
        <span
          key={i}
          className="cc-theme-glow cc-bokeh"
          style={{
            top: g.top, left: g.left, bottom: g.bottom, right: g.right,
            width: g.size, height: g.size,
            background: `radial-gradient(circle, ${g.color}, transparent 70%)`,
            animationDelay: `${i * 2.6}s`,
            animationDuration: `${15 + i * 3}s`,
          }}
        />
      ))}
      <div className="cc-theme-ecg">
        <div className="w-full h-20">
          <EcgPulse tone="blue" duration={7} />
        </div>
      </div>
      <div className="cc-cine-grain" />
      <div className="cc-cine-vignette cc-theme-vignette" />
    </div>
  );
}
