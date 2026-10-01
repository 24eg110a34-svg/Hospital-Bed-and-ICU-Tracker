import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { patientService, errorMessage } from '../services/api';
import { useHospital } from '../context/HospitalContext';
import { buildClinicalRecord } from '../data/clinicalRecords';
import { downloadPatientRecord, downloadJson, downloadHtml, toJsonString, slugify } from '../utils/download';
import { buildReportHtml } from '../utils/report';
import { formatDateTime, formatWait } from '../utils/constants';
import Modal from '../components/Modal';
import PatientReport from '../components/PatientReport';
import {
  PageHeader, Loading, ErrorState, EmptyState, Panel, PanelHeader,
  PatientStatusBadge, TriageBadge,
} from '../components/ui';
import {
  FileHeart, Download, Printer, Copy, Check, Search, ChevronLeft,
  User, Contact, Droplet, Phone, MapPin, HeartPulse, Thermometer, Wind, Activity,
  Stethoscope, Pill, FlaskConical, ClipboardList, ShieldAlert, ScrollText,
  Syringe, BedDouble, Braces, UserRound, FileText, LayoutGrid,
} from 'lucide-react';

const FLAG_TONES = {
  NORMAL: 'bg-slate-100 text-slate-600 border-slate-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
  ABNORMAL: 'bg-violet-50 text-violet-700 border-violet-200',
};

const MED_TONES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
};

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon size={13} className="text-slate-400 mt-0.5 shrink-0" />}
      <span className="text-[11px] font-semibold text-slate-500 w-[104px] shrink-0">{label}</span>
      <span className="text-[12.5px] text-slate-800 font-semibold break-words min-w-0">{value ?? '-'}</span>
    </div>
  );
}

function Vital({ label, value, unit, tone = 'text-slate-900' }) {
  const abnormal = ['CRITICAL', 'HIGH', 'LOW'].includes(tone);
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={`rounded-card border p-2.5 ${abnormal ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-white'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-lg font-extrabold leading-tight cc-metric-value ${abnormal ? 'text-rose-700' : tone}`}>
        {empty ? <span className="text-slate-300">-</span> : value}
        {!empty && unit && <span className="text-[10px] font-semibold text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function RecordSkeleton({ record, patient }) {
  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <User size={26} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">{record.identity.fullName}</h2>
              <div className="text-[12px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1 font-mono"><Contact size={12} /> {record.identity.medicalRecordNumber}</span>
                <span>{record.identity.age} yrs</span>
                <span>{record.identity.gender}</span>
                <span className="inline-flex items-center gap-1"><Droplet size={12} /> {record.identity.bloodType}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <TriageBadge level={patient?.triageLevel} category={patient?.triageCategory} />
                <PatientStatusBadge status={patient?.admissionStatus} />
                {record.bedAssignment.bedNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    <BedDouble size={11} /> {record.bedAssignment.bedNumber} · {record.bedAssignment.ward}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="Vital signs" subtitle="Latest recorded observations" icon={<HeartPulse size={15} />} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Vital label="Heart rate" value={record.vitals.current.heartRate} unit="bpm" />
          <Vital label="SpO2" value={record.vitals.current.spo2} unit="%" tone={record.vitals.current.spo2 < 92 ? 'text-rose-700' : 'text-slate-900'} />
          <Vital label="Temperature" value={record.vitals.current.temperature} unit="°C" />
          <Vital label="Resp rate" value={record.vitals.current.respiratoryRate} unit="/min" />
          <Vital label="BP" value={record.vitals.current.bloodPressure} unit="mmHg" />
          <Vital label="Support" value={<span className="text-[12px]">{record.vitals.current.oxygenSupport}</span>} />
        </div>
        {record.vitals.history.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[440px] table-fixed text-[11.5px]">
              <thead className="text-slate-500 uppercase tracking-wide text-[10px]">
                <tr className="border-b border-slate-200">
                  {['Recorded', 'HR', 'SpO2', 'Temp', 'RR', 'BP', 'By'].map((h) => (
                    <th key={h} className="text-left py-1.5 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {record.vitals.history.slice(0, 6).map((v, i) => (
                  <tr key={v.id || i}>
                    <td className="py-1.5 text-slate-600">{formatDateTime(v.recordedAt)}</td>
                    <td className="py-1.5 font-bold text-slate-800 cc-metric-value">{v.heartRate ?? '-'}</td>
                    <td className="py-1.5 font-bold text-slate-800 cc-metric-value">{v.spo2 ?? '-'}</td>
                    <td className="py-1.5 font-bold text-slate-800 cc-metric-value">{v.temperature ?? '-'}</td>
                    <td className="py-1.5 font-bold text-slate-800 cc-metric-value">{v.respiratoryRate ?? '-'}</td>
                    <td className="py-1.5 font-bold text-slate-800 cc-metric-value">{v.systolicBP != null ? `${v.systolicBP}/${v.diastolicBP}` : '-'}</td>
                    <td className="py-1.5 text-slate-500">{v.recordedBy || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Panel className="p-5">
            <PanelHeader title="Presentation" icon={<Stethoscope size={15} />} />
            <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">Chief complaint</div>
            <p className="text-[13px] text-slate-800 leading-relaxed">{record.encounter.chiefComplaint || 'Not recorded'}</p>
            <div className="cc-divider my-3" />
            <div className="space-y-1.5">
              {record.symptoms.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 cc-dot-ping text-blue-500 shrink-0" />
                  <span className="text-[12.5px] text-slate-800 font-semibold flex-1 min-w-0">{s.symptom}</span>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{s.severity} · {s.onset}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Allergies" icon={<ShieldAlert size={15} />} />
            <div className="flex flex-wrap gap-1.5">
              {record.allergies.map((a) => (
                <span key={a} className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
                  {a}
                </span>
              ))}
            </div>
            <div className="cc-divider my-3" />
            <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">Past medical history</div>
            <ul className="space-y-1">
              {record.pastMedicalHistory.map((h) => (
                <li key={h} className="text-[12.5px] text-slate-700 flex gap-1.5">
                  <span className="text-slate-300">-</span>{h}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Care plan" icon={<ClipboardList size={15} />} />
            <ol className="space-y-2">
              {record.carePlan.map((c) => (
                <li key={c.step} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{c.step}</span>
                  <span className="text-[12.5px] text-slate-700 flex-1 min-w-0">{c.action}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                    c.status === 'IN PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>{c.status}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Encounter details" icon={<Contact size={15} />} />
            <Row label="Hospital" value={record.identity.hospital} icon={Activity} />
            <Row label="Doctor" value={record.identity.attendingDoctor} icon={UserRound} />
            <Row label="Phone" value={record.identity.phoneNumber} icon={Phone} />
            <Row label="Email" value={record.identity.email} />
            <Row label="Address" value={record.identity.address} icon={MapPin} />
            <Row label="Emergency" value={record.identity.emergencyContact.name ? `${record.identity.emergencyContact.name} · ${record.identity.emergencyContact.phone || 'n/a'}` : null} />
            <div className="cc-divider my-3" />
            <Row label="Arrival" value={formatDateTime(record.encounter.arrivalTime)} />
            <Row label="Triage" value={record.encounter.triageCategory || `Level ${record.encounter.triageLevel ?? '-'}`} />
            <Row label="Waiting" value={formatWait(record.encounter.waitingMinutes)} />
            <Row label="Treatment" value={formatDateTime(record.encounter.treatmentStartTime)} />
            <Row label="Discharge" value={formatDateTime(record.encounter.dischargeTime)} />
            <div className="cc-divider my-3" />
            <Row label="Bed" value={record.bedAssignment.bedNumber} icon={BedDouble} />
            <Row label="Ward" value={record.bedAssignment.ward} />
            <Row label="Needs" value={`${record.bedAssignment.requiredBedType || '-'} · ${record.bedAssignment.requiredWardType || '-'}`} />
            <Row label="Equipment" value={record.bedAssignment.requiredEquipment.join(', ')} />
            <Row label="Isolation" value={record.bedAssignment.requiresIsolation ? 'Required' : 'Not required'} icon={ShieldAlert} />
            {record.encounter.notes && (
              <>
                <div className="cc-divider my-3" />
                <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">Clinical notes</div>
                <p className="text-[12.5px] text-slate-700 leading-relaxed">{record.encounter.notes}</p>
              </>
            )}
          </Panel>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Panel className="p-5">
            <PanelHeader title="Medicines" subtitle="Current and completed prescriptions" icon={<Pill size={15} />} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] table-fixed">
                <thead className="text-slate-500 uppercase tracking-wide text-[10px]">
                  <tr className="border-b border-slate-200">
                    <th className="w-[26%] text-left py-2 font-bold">Medicine</th>
                    <th className="w-[17%] text-left py-2 font-bold">Dose</th>
                    <th className="w-[12%] text-left py-2 font-bold">Route</th>
                    <th className="w-[14%] text-left py-2 font-bold">Frequency</th>
                    <th className="w-[19%] text-left py-2 font-bold">Duration</th>
                    <th className="w-[12%] text-left py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.medications.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2 pr-2">
                        <div className="text-[12.5px] font-bold text-slate-800 leading-tight">{m.name}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{m.category}</div>
                      </td>
                      <td className="py-2 pr-2 text-[12px] font-semibold text-slate-700 cc-metric-value leading-tight">{m.dose}</td>
                      <td className="py-2 pr-2 text-[11.5px] text-slate-600 leading-tight">{m.route}</td>
                      <td className="py-2 pr-2 text-[11.5px] text-slate-600 leading-tight">{m.frequency}</td>
                      <td className="py-2 pr-2 text-[11.5px] text-slate-600 leading-tight">{m.duration}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${MED_TONES[m.status] || MED_TONES.ACTIVE}`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel className="p-5">
              <PanelHeader title="Diagnoses" icon={<Activity size={15} />} />
              <ul className="space-y-2">
                {record.diagnoses.map((d) => (
                  <li key={d.code} className="p-2.5 rounded-card border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold font-mono">{d.code}</span>
                      <span className="text-[9px] font-bold tracking-wider text-slate-400 ml-auto">{d.type}</span>
                    </div>
                    <div className="text-[12.5px] font-semibold text-slate-800 mt-1">{d.description}</div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">{d.confirmedBy} · {formatDateTime(d.diagnosedAt)}</div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-5">
              <PanelHeader title="Procedures" icon={<Syringe size={15} />} />
              <ul className="space-y-1.5">
                {record.procedures.map((p) => (
                  <li key={p.name} className="flex items-center gap-2 text-[12.5px]">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 font-semibold flex-1 min-w-0">{p.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{p.performedBy}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel className="p-5">
            <PanelHeader title="Laboratory results" icon={<FlaskConical size={15} />} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] table-fixed">
                <thead className="text-slate-500 uppercase tracking-wide text-[10px]">
                  <tr className="border-b border-slate-200">
                    <th className="w-[32%] text-left py-2 font-bold">Test</th>
                    <th className="w-[14%] text-left py-2 font-bold">Result</th>
                    <th className="w-[16%] text-left py-2 font-bold">Unit</th>
                    <th className="w-[24%] text-left py-2 font-bold">Reference</th>
                    <th className="w-[14%] text-left py-2 font-bold">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.laboratoryResults.map((l) => (
                    <tr key={l.test} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2 pr-2 text-[12.5px] font-semibold text-slate-800 leading-tight">{l.test}</td>
                      <td className="py-2 pr-2 text-[12.5px] font-extrabold text-slate-900 cc-metric-value leading-tight">{l.value}</td>
                      <td className="py-2 pr-2 text-[11.5px] text-slate-500 leading-tight">{l.unit}</td>
                      <td className="py-2 pr-2 text-[11.5px] text-slate-500 cc-metric-value leading-tight">{l.reference}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${FLAG_TONES[l.flag] || FLAG_TONES.NORMAL}`}>{l.flag}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Clinical timeline" icon={<ScrollText size={15} />} />
            {record.timeline.length === 0 ? (
              <EmptyState title="No events recorded" hint="Events appear as the patient is triaged, allocated and treated" />
            ) : (
              <div className="relative border-l-2 border-slate-200 pl-5 space-y-4">
                {record.timeline.map((e, i) => (
                  <div key={e.id || i} className="relative">
                    <span className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {String(e.eventType || '').replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10.5px] text-slate-400">{formatDateTime(e.timestamp)}</span>
                    </div>
                    <p className="text-[12.5px] text-slate-700 mt-0.5">{e.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function PatientRecord() {
  const [params, setParams] = useSearchParams();
  const { pushToast } = useHospital();
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState('report');
  const [generatedAt] = useState(() => new Date().toISOString());

  const selectedId = params.get('patientId');

  const loadPatients = useCallback(async () => {
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

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setPatient(null); setTimeline([]); setVitals([]); return; }
    setDetailLoading(true);
    const [detail, tl, vt] = await Promise.all([
      patientService.getById(id).then((r) => r.data).catch(() => null),
      patientService.getTimeline(id).then((r) => r.data || []).catch(() => []),
      patientService.getVitalsHistory(id).then((r) => r.data || []).catch(() => []),
    ]);
    setPatient(detail || patients.find((p) => String(p.id) === String(id)) || null);
    setTimeline([...tl].sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || ''))));
    setVitals(vt);
    setDetailLoading(false);
  }, [patients]);

  useEffect(() => { loadDetail(selectedId); }, [selectedId, loadDetail]);

  const record = useMemo(
    () => (patient ? buildClinicalRecord(patient, { timeline, vitals }) : null),
    [patient, timeline, vitals],
  );

  const select = (id) => {
    const next = new URLSearchParams(params);
    next.set('patientId', id);
    setParams(next, { replace: true });
  };

  const handleDownload = () => {
    if (!record) return;
    downloadPatientRecord(patient, record, timeline);
    pushToast(`JSON record downloaded for ${record.identity.fullName}`, 'SUCCESS', 'Patient record');
  };

  const handleDownloadAll = () => {
    downloadJson(`patient-records-all-${new Date().toISOString().slice(0, 10)}.json`, {
      schemaVersion: '1.0.0',
      documentType: 'PATIENT_RECORDS_BUNDLE',
      generatedAt: new Date().toISOString(),
      generatedBy: 'BedTracker Hospital Command Center',
      count: patients.length,
      records: patients.map((p) => buildClinicalRecord(p)),
    });
    pushToast(`Exported ${patients.length} patient records`, 'SUCCESS', 'Patient records');
  };

  const handleReport = () => {
    if (!record) return;
    downloadHtml(
      `clinical-report-${slugify(record.identity.medicalRecordNumber || record.identity.fullName)}-${generatedAt.slice(0, 10)}.html`,
      buildReportHtml(record, generatedAt),
    );
    pushToast(`Report downloaded for ${record.identity.fullName}`, 'SUCCESS', 'Patient report');
  };

  const handleCopy = async () => {
    if (!record) return;
    try {
      await navigator.clipboard.writeText(toJsonString({
        schemaVersion: '1.0.0',
        documentType: 'PATIENT_CLINICAL_RECORD',
        generatedAt: new Date().toISOString(),
        ...record,
        timeline,
      }));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast('Clipboard unavailable in this browser', 'ERROR');
    }
  };

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q
      || p.fullName?.toLowerCase().includes(q)
      || p.medicalRecordNumber?.toLowerCase().includes(q);
  });

  if (loading) return <Loading label="Loading patient records" />;
  if (error && patients.length === 0) return <ErrorState message={error} onRetry={loadPatients} />;

  return (
    <div className="space-y-5">
      <div className="cc-no-print">
        <PageHeader
          title="Patient Record"
          subtitle="Human-readable clinical report, printable to PDF, with full JSON export"
          actions={(
            <>
              {record && (
                <Link
                  to="/patients"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] font-bold text-slate-700 hover:bg-white transition-colors"
                >
                  <ChevronLeft size={14} /> All patients
                </Link>
              )}
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] font-bold text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <Download size={14} /> Export all ({patients.length})
              </button>
            </>
          )}
        />
      </div>

      {record && (
        <div className="cc-no-print flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
            {[
              { key: 'report', label: 'Report', Icon: FileText },
              { key: 'clinical', label: 'Clinical view', Icon: LayoutGrid },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-bold transition-colors cursor-pointer ${
                  view === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {view === 'report' ? (
            <>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
              <button
                onClick={handleReport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download size={14} /> Download report (.html)
              </button>
              <button
                onClick={() => setJsonOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Braces size={14} /> View JSON
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                <Download size={14} /> Download JSON
              </button>
              <button
                onClick={() => setJsonOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Braces size={14} /> View JSON
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 cc-no-print">
          <Panel className="p-4 lg:sticky lg:top-20">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient..."
                aria-label="Search patient"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-3 space-y-1 max-h-[62vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyState icon={<FileHeart size={40} />} title="No patients found" />
              ) : filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => select(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer ${
                    String(selectedId) === String(p.id) ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold truncate">{p.fullName}</div>
                  <div className={`text-[11px] truncate ${String(selectedId) === String(p.id) ? 'text-blue-100' : 'text-slate-400'}`}>
                    {p.medicalRecordNumber} · L{p.triageLevel} · {p.age}y
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-3">
          {detailLoading && !record ? (
            <Loading label="Loading clinical record" />
          ) : !record ? (
            <Panel className="p-5">
              <EmptyState
                icon={<FileHeart size={48} />}
                title="Select a patient"
                hint="Pick someone from the list to generate their printable clinical report and JSON record"
              />
            </Panel>
          ) : view === 'report' ? (
            <PatientReport record={record} patient={patient} generatedAt={generatedAt} />
          ) : (
            <RecordSkeleton record={record} patient={patient} />
          )}
        </div>
      </div>

      <Modal isOpen={jsonOpen} onClose={() => setJsonOpen(false)} title={`JSON · ${record?.identity.fullName || ''}`} size="xl">
        {record && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy JSON'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors cursor-pointer"
              >
                <Download size={14} /> Download
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                patient-record-{slugify(record.identity.medicalRecordNumber)}.json
              </span>
            </div>
            <div className="relative rounded-card overflow-hidden border border-slate-800">
              <div className="cc-cine-scanlines" />
              <pre className="relative text-[11px] leading-relaxed bg-slate-950/90 text-emerald-200 p-3.5 max-h-[55vh] overflow-auto">
                {toJsonString({
                  schemaVersion: '1.0.0',
                  documentType: 'PATIENT_CLINICAL_RECORD',
                  generatedAt: new Date().toISOString(),
                  ...record,
                  timeline,
                })}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
