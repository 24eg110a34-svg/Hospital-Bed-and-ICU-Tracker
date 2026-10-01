import React, { useEffect, useRef, useState } from 'react';
import { STATUS_STYLES, PATIENT_STATUS_STYLES, TRIAGE_STYLES, TRIAGE_LABELS } from '../utils/constants';
import { AlertTriangle, RotateCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold tracking-wide border ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {status}
    </span>
  );
}

export function PatientStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold tracking-wide ${PATIENT_STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function TriageBadge({ level, category }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold tracking-wide ${TRIAGE_STYLES[level] || 'bg-slate-200 text-slate-700'}`}>
      L{level} {category || TRIAGE_LABELS[level]}
    </span>
  );
}

export function CountUp({ value, duration = 550, decimals = 0, suffix = '' }) {
  const target = Number(value);
  const [display, setDisplay] = useState(Number.isFinite(target) ? 0 : 0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return undefined;
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) {
      setDisplay(target);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + delta * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return (
    <>
      {display.toFixed(decimals)}{suffix}
    </>
  );
}

export function Panel({ children, className = '', glass = false, lift = false, style, ...rest }) {
  return (
    <section
      className={`${glass ? 'cc-glass' : 'cc-panel'} ${lift ? 'cc-lift' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </section>
  );
}

export function PanelHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

const metricTones = {
  slate: { card: 'border-slate-200', icon: 'text-slate-600 bg-slate-100', accent: 'bg-slate-400' },
  blue: { card: 'border-blue-200', icon: 'text-blue-700 bg-blue-50', accent: 'bg-blue-500' },
  green: { card: 'border-emerald-200', icon: 'text-emerald-700 bg-emerald-50', accent: 'bg-emerald-500' },
  red: { card: 'border-rose-200', icon: 'text-rose-700 bg-rose-50', accent: 'bg-rose-500' },
  amber: { card: 'border-amber-200', icon: 'text-amber-700 bg-amber-50', accent: 'bg-amber-500' },
  purple: { card: 'border-violet-200', icon: 'text-violet-700 bg-violet-50', accent: 'bg-violet-500' },
  teal: { card: 'border-cyan-200', icon: 'text-cyan-700 bg-cyan-50', accent: 'bg-cyan-500' },
};

export function MetricCard({ label, value, sub, tone = 'slate', icon, trend }) {
  const t = metricTones[tone] || metricTones.slate;
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^-?[\d.]+%?$/.test(value));
  const numeric = typeof value === 'number' ? value : parseFloat(value);
  const decimals = typeof value === 'string' && value.includes('.') ? 1 : 0;
  const suffix = typeof value === 'string' && value.endsWith('%') ? '%' : '';

  const TrendIcon = trend == null ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return undefined;
    prevRef.current = value;
    setFlash(true);
    const t2 = setTimeout(() => setFlash(false), 850);
    return () => clearTimeout(t2);
  }, [value]);

  return (
    <div className={`relative overflow-hidden rounded-card border ${t.card} bg-white p-4 cc-lift ${flash ? 'cc-metric-flash' : ''}`}>
      <span className={`absolute left-0 top-0 h-full w-[3px] ${t.accent} opacity-70`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        {icon && <span className={`p-1.5 rounded-lg shrink-0 ${t.icon}`}>{icon}</span>}
      </div>
      <div className="pl-1.5 mt-1.5 flex items-end gap-2">
        <span className="text-[26px] leading-none font-extrabold text-slate-900 cc-metric-value">
          {isNumeric && Number.isFinite(numeric)
            ? <CountUp value={numeric} decimals={decimals} suffix={suffix} />
            : value}
        </span>
        {trend != null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold mb-0.5 ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            <TrendIcon size={12} />
            {Math.abs(trend)}
          </span>
        )}
      </div>
      {sub && <div className="pl-1.5 text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-0.5 text-[13px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AlertBanner({ tone = 'warning', title, children, action }) {
  const tones = {
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    critical: 'bg-rose-50 border-rose-200 text-rose-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 p-3 rounded-card border text-[13px] ${tones[tone] || tones.info} ${tone === 'critical' ? 'animate-alert-pulse' : ''}`}
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-bold">{title}</div>}
        <div className="leading-snug">{children}</div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, hint }) {
  return (
    <div className="text-center py-10 px-4">
      {icon && <div className="w-10 h-10 mx-auto mb-3 text-slate-300">{icon}</div>}
      <p className="text-slate-600 font-semibold text-sm">{title}</p>
      {hint && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="text-center py-10 px-6 bg-rose-50 border border-rose-200 rounded-panel">
      <AlertTriangle size={22} className="mx-auto text-rose-500 mb-2" />
      <p className="text-rose-800 font-bold text-sm">Could not load data</p>
      <p className="text-rose-600 text-xs mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-live="polite">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}...</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`cc-skeleton rounded-lg ${className}`} />;
}

export function ProgressBar({ value, max = 100, tone = 'bg-blue-600', showStripes = false }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-calm ${tone} ${showStripes ? 'relative overflow-hidden' : ''}`}
        style={{ width: `${pct}%` }}
      >
        {showStripes && <span className="cc-sweep absolute inset-0" />}
      </div>
    </div>
  );
}

export function VitalValue({ label, value, unit, changed, tone = 'text-slate-900' }) {
  const [flash, setFlash] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    if (changed) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [changed]);

  return (
    <div className={`rounded-lg px-2 py-1.5 ${flash ? 'animate-[cc-value-flash_.7s_ease-out]' : ''}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-sm font-bold cc-metric-value ${tone}`}>
        {value ?? '-'}
        {unit && <span className="text-[10px] font-semibold text-slate-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <span className={`cc-spinner inline-block ${className}`} role="status" aria-label="Loading" />;
}

export function Stagger({ children, step = 38, cap = 14, className = '' }) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              style: { ...child.props.style, '--i': Math.min(i, cap) },
            })
          : child
      )}
    </div>
  );
}

export function Collapse({ open, children, className = '' }) {
  return (
    <div className={`cc-collapse ${className}`} data-open={open ? 'true' : 'false'}>
      <div>{children}</div>
    </div>
  );
}

export function OccupancyRing({ value, max = 100, size = 96, thickness = 9, color, label, sublabel }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="cc-ring shrink-0"
      style={{ width: size, height: size, '--ring-pct': pct, '--ring-w': `${thickness}px`, ...(color ? { '--ring-color': color } : {}) }}
      role="img"
      aria-label={`${label || 'Occupancy'} ${Math.round(pct)} percent`}
    >
      <div className="relative z-10 text-center leading-none">
        <div className="text-xl font-black text-slate-900 tabular-nums">{Math.round(pct)}%</div>
        {sublabel && <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">{sublabel}</div>}
      </div>
    </div>
  );
}

export function Pressable({ children, className = '', ...rest }) {
  return (
    <button type="button" className={`cc-press ${className}`} {...rest}>
      {children}
    </button>
  );
}
