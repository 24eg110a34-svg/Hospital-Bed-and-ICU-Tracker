import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { patientService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import Modal from '../components/Modal';
import { PageHeader, Loading, ErrorState, EmptyState, PatientStatusBadge, TriageBadge } from '../components/ui';
import { ADMISSION_STATUSES, BED_TYPES, WARD_TYPES, TRIAGE_LABELS, formatWait, formatDateTime } from '../utils/constants';
import { buildClinicalRecord } from '../data/clinicalRecords';
import { downloadJson, downloadPatientRecord } from '../utils/download';
import { Users, Search, Plus, RefreshCw, Activity, BedDouble, History, FileHeart, Download } from 'lucide-react';

const emptyForm = {
  fullName: '', age: '', gender: 'Male', bloodType: 'O+', phoneNumber: '',
  emergencyContactName: '', emergencyContactPhone: '', address: '', chiefComplaint: '',
  currentSymptoms: '', pastMedicalHistory: '', allergies: '', notes: '',
  triageLevel: 3, admissionStatus: 'WAITING_FOR_BED', requiredBedType: 'GENERAL',
  requiredWardType: 'GENERAL', spo2: '', heartRate: '',
  requiresVentilator: false, requiresOxygen: false, requiresIsolation: false,
  requiresDialysis: false, requiresCardiacMonitor: false,
};

export default function Patients() {
  const { can, pushToast } = useHospital();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [triageFilter, setTriageFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await patientService.getAll();
      setPatients(data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load patients'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (patient) => {
    setEditing(patient);
    setForm({
      fullName: patient.fullName || '',
      age: patient.age ?? '',
      gender: patient.gender || 'Male',
      bloodType: patient.bloodType || 'O+',
      phoneNumber: patient.phoneNumber || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      address: patient.address || '',
      chiefComplaint: patient.chiefComplaint || '',
      currentSymptoms: patient.currentSymptoms || '',
      pastMedicalHistory: patient.pastMedicalHistory || '',
      allergies: patient.allergies || '',
      notes: patient.notes || '',
      triageLevel: patient.triageLevel || 3,
      admissionStatus: patient.admissionStatus || 'WAITING_FOR_BED',
      requiredBedType: patient.requiredBedType || 'GENERAL',
      requiredWardType: patient.requiredWardType || 'GENERAL',
      spo2: patient.spo2 ?? '',
      heartRate: patient.heartRate ?? '',
      requiresVentilator: Boolean(patient.requiresVentilator),
      requiresOxygen: Boolean(patient.requiresOxygen),
      requiresIsolation: Boolean(patient.requiresIsolation),
      requiresDialysis: Boolean(patient.requiresDialysis),
      requiresCardiacMonitor: Boolean(patient.requiresCardiacMonitor),
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      age: form.age === '' ? null : Number(form.age),
      spo2: form.spo2 === '' ? null : Number(form.spo2),
      heartRate: form.heartRate === '' ? null : Number(form.heartRate),
    };
    try {
      if (editing) {
        await patientService.update(editing.id, payload);
        pushToast('Patient updated', 'SUCCESS');
      } else {
        await patientService.create(payload);
        pushToast('Patient registered', 'SUCCESS');
      }
      setShowModal(false);
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Could not save patient'), 'ERROR');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (patient, status) => {
    try {
      await patientService.updateStatus(patient.id, status);
      pushToast(`${patient.fullName} is now ${status}`, 'SUCCESS');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Status change rejected'), 'ERROR');
    }
  };

  const exportAll = () => {
    downloadJson(`patient-records-all-${new Date().toISOString().slice(0, 10)}.json`, {
      schemaVersion: '1.0.0',
      documentType: 'PATIENT_RECORDS_BUNDLE',
      generatedAt: new Date().toISOString(),
      generatedBy: 'BedTracker Hospital Command Center',
      count: patients.length,
      records: patients.map((p) => buildClinicalRecord(p)),
    });
    pushToast(`Exported ${patients.length} patient records as JSON`, 'SUCCESS', 'Patient records');
  };

  const exportOne = (patient) => {
    downloadPatientRecord(patient, buildClinicalRecord(patient));
    pushToast(`JSON record downloaded for ${patient.fullName}`, 'SUCCESS', 'Patient record');
  };

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.fullName?.toLowerCase().includes(q)
      || p.medicalRecordNumber?.toLowerCase().includes(q)
      || p.phoneNumber?.includes(q);
    const matchStatus = statusFilter === 'ALL' || p.admissionStatus === statusFilter;
    const matchTriage = triageFilter === 'ALL' || String(p.triageLevel) === triageFilter;
    return matchSearch && matchStatus && matchTriage;
  });

  if (loading) return <Loading label="Loading patients" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const canEdit = can('ADMIN', 'DOCTOR', 'NURSE');
  const canCreate = can('ADMIN', 'DOCTOR', 'NURSE', 'STAFF');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Management"
        subtitle={`${patients.length} patients · ${patients.filter((p) => p.admissionStatus === 'WAITING_FOR_BED').length} waiting for a bed`}
        actions={(
          <>
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer">
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              onClick={exportAll}
              disabled={patients.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Download size={15} /> Export JSON
            </button>
            {canCreate && (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <Plus size={16} /> Register Patient
              </button>
            )}
          </>
        )}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, MRN or phone..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm">
          <option value="ALL">All statuses</option>
          {ADMISSION_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={triageFilter} onChange={(e) => setTriageFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm">
          <option value="ALL">All triage</option>
          {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Level {l} - {TRIAGE_LABELS[l]}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title="No patients match your filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Patient', 'Contact', 'Triage', 'Status', 'Bed / Ward', 'Requirements', 'Waiting', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{p.fullName}</div>
                      <div className="text-xs text-slate-500">{p.medicalRecordNumber} · {p.age} yrs · {p.gender} · {p.bloodType}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.phoneNumber || '-'}
                      {p.emergencyContactName && <div className="text-slate-400">Emg: {p.emergencyContactName}</div>}
                    </td>
                    <td className="px-4 py-3"><TriageBadge level={p.triageLevel} category={p.triageCategory} /></td>
                    <td className="px-4 py-3"><PatientStatusBadge status={p.admissionStatus} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.assignedBedNumber || '-'}
                      {p.assignedWardName && <div className="text-slate-400">{p.assignedWardName}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                      <div className="truncate">{p.requiredBedType || '-'}{p.requiredWardType ? ` · ${p.requiredWardType}` : ''}</div>
                      <div className="text-slate-400 truncate">{p.requiredEquipmentSummary}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatWait(p.waitingMinutes)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/records?patientId=${p.id}`}
                          title="Open clinical record"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer"
                        >
                          <FileHeart size={15} />
                        </Link>
                        <button
                          onClick={() => exportOne(p)}
                          title="Download this record as JSON"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                        >
                          <Download size={15} />
                        </button>
                        <Link
                          to={`/timeline?patientId=${p.id}`}
                          title="View timeline"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                        >
                          <History size={15} />
                        </Link>
                        {['WAITING_FOR_BED', 'ADMITTED'].includes(p.admissionStatus) && (
                          <Link
                            to={`/beds?patientId=${p.id}`}
                            title="Find a bed"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer"
                          >
                            <BedDouble size={15} />
                          </Link>
                        )}
                        {p.admissionStatus === 'ADMITTED' && can('ADMIN', 'DOCTOR', 'NURSE') && (
                          <button
                            onClick={() => setStatus(p, 'UNDER_TREATMENT')}
                            title="Start treatment"
                            className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 cursor-pointer"
                          >
                            <Activity size={15} />
                          </button>
                        )}
                        {p.admissionStatus === 'UNDER_TREATMENT' && can('ADMIN', 'DOCTOR', 'NURSE') && (
                          <button
                            onClick={() => setStatus(p, 'DISCHARGED')}
                            title="Mark discharged"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => openEdit(p)}
                            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Patient' : 'Register Patient'} size="lg">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
              <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint</label>
              <textarea rows={2} value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Symptoms</label>
              <textarea rows={2} value={form.currentSymptoms} onChange={(e) => setForm({ ...form, currentSymptoms: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medical History</label>
              <input value={form.pastMedicalHistory} onChange={(e) => setForm({ ...form, pastMedicalHistory: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
              <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
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
                {ADMISSION_STATUSES.filter((s) => !['ADMITTED', 'DISCHARGED'].includes(s)).map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-sm font-semibold text-slate-700">Bed Matching Requirements</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                ['requiresCardiacMonitor', 'Cardiac Monitor'],
                ['requiresIsolation', 'Isolation'],
                ['requiresDialysis', 'Dialysis'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 (%)</label>
              <input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate</label>
              <input type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : editing ? 'Update Patient' : 'Register Patient'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
