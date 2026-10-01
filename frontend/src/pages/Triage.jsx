import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import Modal from '../components/Modal';
import { PageHeader, Loading, ErrorState, EmptyState, MetricCard, TriageBadge, PatientStatusBadge } from '../components/ui';
import { TRIAGE_LABELS, formatWait, formatTime, formatDateTime, BED_TYPES, WARD_TYPES } from '../utils/constants';
import { Activity, Clock, BedDouble, AlertTriangle, Plus, RefreshCw, Search } from 'lucide-react';

const emptyForm = {
  fullName: '', age: '', gender: 'Male', bloodType: 'O+', phoneNumber: '',
  emergencyContactName: '', emergencyContactPhone: '', address: '', chiefComplaint: '',
  currentSymptoms: '', triageLevel: 3, admissionStatus: 'WAITING_FOR_BED',
  requiredBedType: 'GENERAL', requiredWardType: 'GENERAL',
  requiresVentilator: false, requiresOxygen: false, requiresCardiacMonitor: false,
  requiresIsolation: false, requiresDialysis: false,
};

export default function Triage() {
  const { can, pushToast } = useHospital();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triageFilter, setTriageFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [triageTarget, setTriageTarget] = useState(null);
  const [newLevel, setNewLevel] = useState(3);

  const load = useCallback(async () => {
    try {
      const { data } = await patientService.getTriageQueue();
      setPatients(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load triage queue'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientService.create({
        ...form,
        age: form.age === '' ? null : Number(form.age),
      });
      pushToast('Emergency patient registered', 'SUCCESS');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Registration failed'), 'ERROR');
    } finally {
      setSaving(false);
    }
  };

  const applyTriage = async () => {
    if (!triageTarget) return;
    try {
      await patientService.applyTriage(triageTarget.id, newLevel);
      pushToast(`${triageTarget.fullName} triaged to level ${newLevel}`, 'SUCCESS');
      setTriageTarget(null);
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Triage update failed'), 'ERROR');
    }
  };

  if (loading) return <Loading label="Loading triage queue" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const sorted = [...patients]
    .filter((p) => {
      const matchTriage = triageFilter === 'ALL' || String(p.triageLevel) === triageFilter;
      const q = search.toLowerCase();
      const matchSearch = !q
        || p.fullName?.toLowerCase().includes(q)
        || p.medicalRecordNumber?.toLowerCase().includes(q);
      return matchTriage && matchSearch;
    })
    .sort((a, b) => (a.triageLevel || 99) - (b.triageLevel || 99) || (a.arrivalTime || '') .localeCompare(b.arrivalTime || ''));

  const counts = {
    total: patients.length,
    critical: patients.filter((p) => p.triageLevel === 1).length,
    emergency: patients.filter((p) => p.triageLevel === 2).length,
    urgent: patients.filter((p) => (p.triageLevel || 0) >= 3).length,
    longWait: patients.filter((p) => (p.waitingMinutes || 0) > 60).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Triage Queue"
        subtitle="Priority ordered, live-updated from the database"
        actions={(
          <>
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
              <RefreshCw size={15} /> Refresh
            </button>
            {can('ADMIN', 'DOCTOR', 'NURSE', 'STAFF') && (
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <Plus size={16} /> Register Emergency
              </button>
            )}
          </>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Total Waiting" value={counts.total} tone="blue" />
        <MetricCard label="Level 1 Critical" value={counts.critical} tone="red" />
        <MetricCard label="Level 2 Emergency" value={counts.emergency} tone="amber" />
        <MetricCard label="Level 3-5" value={counts.urgent} tone="slate" />
        <MetricCard label="Waiting > 60m" value={counts.longWait} tone="red" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['ALL', '1', '2', '3', '4', '5'].map((level) => (
            <button
              key={level}
              onClick={() => setTriageFilter(level)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                triageFilter === level ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {level === 'ALL' ? 'All' : `L${level}`}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={<Activity size={48} />} title="Triage queue is empty" hint="No patients are currently waiting for triage or a bed" />
        </div>
      ) : (
        <div className="space-y-2 cc-stagger">
          {sorted.map((patient, index) => {
            const isLongWait = (patient.waitingMinutes || 0) > 60;
            const isWarning = (patient.waitingMinutes || 0) > 30;
            return (
              <div
                key={patient.id}
                style={{ '--i': Math.min(index, 12) }}
                className={`bg-white rounded-2xl border p-4 flex flex-wrap lg:flex-nowrap gap-4 items-center justify-between ${
                  isLongWait ? 'border-rose-300 bg-rose-50/40' : isWarning ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    patient.triageLevel === 1 ? 'bg-rose-600'
                      : patient.triageLevel === 2 ? 'bg-orange-500'
                        : patient.triageLevel === 3 ? 'bg-amber-400 text-slate-900' : 'bg-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{patient.fullName}</span>
                      <TriageBadge level={patient.triageLevel} category={patient.triageCategory} />
                      <PatientStatusBadge status={patient.admissionStatus} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {patient.age} yrs · {patient.gender} · {patient.medicalRecordNumber} · {patient.phoneNumber}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 truncate">{patient.chiefComplaint}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Needs: {patient.requiredBedType || 'GENERAL'}
                      {patient.requiredWardType ? ` · ${patient.requiredWardType} ward` : ''} · {patient.requiredEquipmentSummary}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={`flex items-center justify-end gap-1 text-sm ${isLongWait ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
                      <Clock size={14} /> {formatWait(patient.waitingMinutes)}
                      {isLongWait && <AlertTriangle size={14} />}
                    </div>
                    <div className="text-xs text-slate-400">Arrived {formatTime(patient.arrivalTime)}</div>
                  </div>
                  {can('ADMIN', 'DOCTOR') && (
                    <button
                      onClick={() => { setTriageTarget(patient); setNewLevel(patient.triageLevel || 3); }}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                    >
                      Triage
                    </button>
                  )}
                  <Link
                    to={`/beds?patientId=${patient.id}`}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <BedDouble size={13} /> Bed
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Emergency Patient" size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age *</label>
              <input type="number" required min="0" max="130" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
              <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms / Chief Complaint *</label>
            <textarea required rows={2} value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Triage Level *</label>
              <select value={form.triageLevel} onChange={(e) => setForm({ ...form, triageLevel: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm">
                {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Level {l} - {TRIAGE_LABELS[l]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admission Status</label>
              <select value={form.admissionStatus} onChange={(e) => setForm({ ...form, admissionStatus: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm">
                <option value="TRIAGE">TRIAGE</option>
                <option value="WAITING_FOR_BED">WAITING FOR BED</option>
                <option value="WAITING">WAITING</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-sm font-semibold text-slate-700">Bed Matching Requirements</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Required Bed Type</label>
                <select value={form.requiredBedType} onChange={(e) => setForm({ ...form, requiredBedType: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  {BED_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Required Ward</label>
                <select value={form.requiredWardType} onChange={(e) => setForm({ ...form, requiredWardType: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  {WARD_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                ['requiresVentilator', 'Ventilator'],
                ['requiresOxygen', 'Oxygen'],
                ['requiresCardiacMonitor', 'Monitor'],
                ['requiresIsolation', 'Isolation'],
                ['requiresDialysis', 'Dialysis'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors cursor-pointer">
            {saving ? 'Registering...' : 'Register Emergency Patient'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(triageTarget)} onClose={() => setTriageTarget(null)} title="Update Triage" size="sm">
        {triageTarget && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="font-semibold text-slate-900">{triageTarget.fullName}</div>
              <div className="text-xs text-slate-500">{triageTarget.medicalRecordNumber} · current level {triageTarget.triageLevel}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New triage level</label>
              <select value={newLevel} onChange={(e) => setNewLevel(Number(e.target.value))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm">
                {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Level {l} - {TRIAGE_LABELS[l]}</option>)}
              </select>
            </div>
            <button onClick={applyTriage} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer">
              Apply Triage
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
