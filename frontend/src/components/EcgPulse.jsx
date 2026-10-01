import React from 'react';

const BEAT = 'M0 50 H12 C15 50 17 44 20 44 C23 44 25 50 28 50 H34 L37 60 L42 10 L47 90 L50 50 H56 C61 50 63 41 67 41 C71 41 73 50 78 50 H100';
const BEATS = Array.from({ length: 8 }, (_, i) => (
  <g key={i} transform={`translate(${i * 100},0)`}>
    <path className="cc-ecg-line" d={BEAT} />
    <path className="cc-ecg-scan" d={BEAT} />
  </g>
));

const tones = {
  green: '#4ade80',
  blue: '#60a5fa',
  rose: '#fb7185',
  amber: '#fbbf24',
};

export default function EcgPulse({ tone = 'green', className = '', duration }) {
  const color = tones[tone] || tones.green;
  const speed = duration ? { animationDuration: `${duration}s` } : undefined;

  return (
    <div className={`cc-ecg-track ${className}`} style={speed} aria-hidden="true">
      <svg className="cc-ecg-svg" viewBox="0 0 800 100" preserveAspectRatio="none">
        <g style={{ color }} stroke={color}>{BEATS}</g>
      </svg>
      <svg className="cc-ecg-svg" viewBox="0 0 800 100" preserveAspectRatio="none">
        <g style={{ color }} stroke={color}>{BEATS}</g>
      </svg>
    </div>
  );
}
