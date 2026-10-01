import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BedDouble, Building2, CornerDownLeft, Loader2 } from 'lucide-react';
import { patientService, bedService } from '../services/api';
import { bedToken } from '../utils/constants';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    setQuery('');
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || cache || loading) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      patientService.getAll().then((r) => r.data || []).catch(() => []),
      bedService.getAll().then((r) => r.data || []).catch(() => []),
    ]).then(([patients, beds]) => {
      if (!cancelled) setCache({ patients, beds });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, cache, loading]);

  const results = useMemo(() => {
    if (!cache) return { patients: [], beds: [], wards: [] };
    const q = query.trim().toLowerCase();
    const wards = [...new Set(cache.beds.map((b) => b.wardName).filter(Boolean))];

    if (!q) {
      return {
        patients: cache.patients.slice(0, 4),
        beds: cache.beds.filter((b) => b.status === 'AVAILABLE').slice(0, 4),
        wards: wards.slice(0, 3),
      };
    }
    return {
      patients: cache.patients.filter((p) =>
        p.fullName?.toLowerCase().includes(q)
        || p.medicalRecordNumber?.toLowerCase().includes(q)
        || p.chiefComplaint?.toLowerCase().includes(q)).slice(0, 5),
      beds: cache.beds.filter((b) =>
        b.bedNumber?.toLowerCase().includes(q)
        || b.wardName?.toLowerCase().includes(q)).slice(0, 5),
      wards: wards.filter((w) => w.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [cache, query]);

  const flat = useMemo(() => [
    ...results.patients.map((p) => ({ kind: 'patient', id: p.id, label: p.fullName, meta: p.medicalRecordNumber, to: `/patients?patientId=${p.id}` })),
    ...results.beds.map((b) => ({ kind: 'bed', id: b.id, label: b.bedNumber, meta: `${b.wardName || 'Unassigned'} · ${bedToken(b.status).label}`, to: `/beds?bedId=${b.id}` })),
    ...results.wards.map((w) => ({ kind: 'ward', id: w, label: w, meta: 'Ward', to: '/wards' })),
  ], [results]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && flat[index]) {
        e.preventDefault();
        navigate(flat[index].to);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, index, navigate]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${index}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const go = (to) => {
    navigate(to);
    setOpen(false);
  };

  const groups = [
    { key: 'patients', title: 'Patients', Icon: Users, items: results.patients, render: (p) => ({ label: p.fullName, meta: `${p.medicalRecordNumber} · ${p.age ?? '?'} yrs` }) },
    { key: 'beds', title: 'Beds', Icon: BedDouble, items: results.beds, render: (b) => ({ label: b.bedNumber, meta: `${b.wardName || 'Unassigned'} · ${bedToken(b.status).label}` }) },
    { key: 'wards', title: 'Wards', Icon: Building2, items: results.wards, render: (w) => ({ label: w, meta: 'Ward' }) },
  ];

  let running = -1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-400 text-[13px] transition-colors cursor-pointer w-56 lg:w-72"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search patients, beds, wards</span>
        <kbd className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">Ctrl K</kbd>
      </button>

      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <Search size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          <button
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
          />
          <div role="dialog" aria-modal="true" aria-label="Global search" className="relative w-full max-w-xl bg-white rounded-panel shadow-panel border border-slate-200 overflow-hidden animate-modal-in">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
              {loading ? <Loader2 size={17} className="text-slate-400 animate-spin" /> : <Search size={17} className="text-slate-400" />}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients, beds, wards..."
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
              />
              <kbd className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {flat.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">
                  {loading ? 'Loading index...' : `No matches for "${query}"`}
                </p>
              )}

              {groups.map(({ key, title, Icon, items, render }) => items.length > 0 && (
                <div key={key} className="mb-1.5">
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Icon size={11} /> {title}
                  </div>
                  {items.map((item) => {
                    running += 1;
                    const idx = running;
                    const { label, meta } = render(item);
                    const to = key === 'patients' ? `/patients?patientId=${item.id}`
                      : key === 'beds' ? `/beds?bedId=${item.id}` : '/wards';
                    return (
                      <button
                        key={`${key}-${item.id}`}
                        data-idx={idx}
                        onMouseEnter={() => setIndex(idx)}
                        onClick={() => go(to)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${idx === index ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        {key === 'beds' && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bedToken(item.status).dot}`} />}
                        <span className="text-[13px] font-semibold text-slate-800 truncate">{label}</span>
                        <span className="text-[11px] text-slate-500 truncate">{meta}</span>
                        {idx === index && <CornerDownLeft size={12} className="ml-auto text-slate-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
