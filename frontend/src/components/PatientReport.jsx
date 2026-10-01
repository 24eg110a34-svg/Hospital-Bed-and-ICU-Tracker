import React from 'react';
import { formatDateTime, formatWait } from '../utils/constants';

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const SEV_CLASS = {
  Mild: 'text-slate-600',
  Moderate: 'text-amber-700',
  Severe: 'text-rose-700',
};

const FLAG_CLASS = {
  NORMAL: 'text-slate-600',
  HIGH: 'text-amber-700',
  LOW: 'text-blue-700',
  CRITICAL: 'text-rose-700',
  ABNORMAL: 'text-violet-700',
};

function Section({ no, title, children }) {
  return (
    <section className="cc-rpt-section">
      <h2 className="cc-rpt-h2">
        <span className="cc-rpt-num">{no}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fields({ items, cols = 2 }) {
  const grid = cols === 3 ? 'grid-cols-3 cc-rpt-fields-3' : cols === 1 ? 'grid-cols-1' : 'grid-cols-2';
  return (
    <dl className={`grid gap-x-6 gap-y-0 ${grid}`}>
      {items.map(([label, value]) => (
        <div key={label} className="cc-rpt-field">
          <dt>{label}</dt>
          <dd>{dash(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function PatientReport({ record, patient, generatedAt }) {
  const v = record.vitals.current;
  const bpCritical = v.systolicBP != null && (v.systolicBP > 180 || v.systolicBP < 90);
  const spo2Critical = v.spo2 != null && v.spo2 < 90;

  const vitals = [
    { label: 'Heart rate', value: v.heartRate, unit: 'bpm', critical: v.heartRate != null && (v.heartRate > 120 || v.heartRate < 50) },
    { label: 'Blood pressure', value: v.bloodPressure, unit: 'mmHg', critical: bpCritical },
    { label: 'Respiratory rate', value: v.respiratoryRate, unit: '/min', critical: v.respiratoryRate != null && v.respiratoryRate > 24 },
    { label: 'Temperature', value: v.temperature, unit: '°C', critical: v.temperature != null && v.temperature >= 38 },
    { label: 'SpO2', value: v.spo2, unit: '%', critical: spo2Critical },
    { label: 'Oxygen support', value: v.oxygenSupport, unit: '', critical: false, small: true },
  ];

  return (
    <article className="cc-rpt">
      <header className="cc-rpt-head">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l2-5 4 10 2-5h6" />
              </svg>
            </span>
            <div>
              <div className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-tight">
                {record.identity.hospital}
              </div>
              <div className="text-[10.5px] font-bold text-blue-700 tracking-[0.16em] uppercase mt-0.5">
                Department of Emergency &amp; Critical Care
              </div>
            </div>
          </div>
          <div className="text-right text-[10.5px] text-slate-500 leading-relaxed">
            <div className="font-bold text-slate-700 uppercase tracking-wider">Patient Clinical Record</div>
            <div>Report no. {record.identity.medicalRecordNumber}</div>
            <div>Generated {formatDateTime(generatedAt)}</div>
          </div>
        </div>
        <div className="cc-rpt-banner">
          <span>Confidential medical document</span>
          <span>Triage L{record.encounter.triageLevel ?? '-'} · {record.encounter.triageCategory || 'Unclassified'}</span>
          <span>{record.encounter.admissionStatus?.replace(/_/g, ' ') || 'Status unknown'}</span>
        </div>
      </header>

      <div className="cc-rpt-title">
        <h1>Clinical Resume &amp; Progress Report</h1>
      </div>

      <Section no="1" title="Patient particulars">
        <Fields
          cols={3}
          items={[
            ['Patient name', record.identity.fullName],
            ['Medical record no.', record.identity.medicalRecordNumber],
            ['Age / Sex', `${dash(record.identity.age)} yrs · ${dash(record.identity.gender)}`],
            ['Blood group', record.identity.bloodType],
            ['Phone', record.identity.phoneNumber],
            ['Email', record.identity.email],
            ['Address', record.identity.address],
            ['Emergency contact', record.identity.emergencyContact.name
              ? `${record.identity.emergencyContact.name}${record.identity.emergencyContact.phone ? ` (${record.identity.emergencyContact.phone})` : ''}`
              : null],
            ['Attending doctor', record.identity.attendingDoctor],
          ]}
        />
      </Section>

      <Section no="2" title="Encounter summary">
        <Fields
          cols={3}
          items={[
            ['Arrival time', formatDateTime(record.encounter.arrivalTime)],
            ['Time waited', formatWait(record.encounter.waitingMinutes)],
            ['Treatment started', formatDateTime(record.encounter.treatmentStartTime)],
            ['Discharge time', formatDateTime(record.encounter.dischargeTime)],
            ['Triage category', record.encounter.triageCategory],
            ['Current status', record.encounter.admissionStatus?.replace(/_/g, ' ')],
          ]}
        />
      </Section>

      <Section no="3" title="Presenting complaint and symptoms">
        <p className="cc-rpt-text">
          <span className="cc-rpt-label">Chief complaint: </span>
          {dash(record.encounter.chiefComplaint)}
        </p>
        <table className="cc-rpt-table">
          <thead>
            <tr><th style={{ width: '42%' }}>Symptom</th><th style={{ width: '22%' }}>Severity</th><th style={{ width: '18%' }}>Onset</th><th>Recorded</th></tr>
          </thead>
          <tbody>
            {record.symptoms.map((s, i) => (
              <tr key={i}>
                <td>{s.symptom}</td>
                <td className={SEV_CLASS[s.severity] || ''}>{s.severity}</td>
                <td>{s.onset}</td>
                <td>{formatDateTime(s.recordedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section no="4" title="Allergies and past medical history">
        <p className="cc-rpt-text">
          <span className="cc-rpt-label">Known allergies: </span>
          {record.allergies.length ? record.allergies.join(', ') : 'None recorded'}
        </p>
        <p className="cc-rpt-text">
          <span className="cc-rpt-label">Past medical history: </span>
          {record.pastMedicalHistory.join('; ')}
        </p>
        {record.encounter.notes && (
          <p className="cc-rpt-text">
            <span className="cc-rpt-label">Clinical notes: </span>
            {record.encounter.notes}
          </p>
        )}
      </Section>

      <Section no="5" title="Vital signs">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {vitals.map((x) => (
            <div key={x.label} className={`cc-rpt-vital ${x.critical ? 'is-critical' : ''}`}>
              <div className="cc-rpt-vital-label">{x.label}</div>
              <div className={`cc-rpt-vital-value ${x.small ? 'cc-rpt-vital-sm' : ''}`}>
                {dash(x.value)}{x.unit && x.value != null && <span className="cc-rpt-vital-unit">{x.unit}</span>}
              </div>
            </div>
          ))}
        </div>
        {record.vitals.history.length > 0 && (
          <table className="cc-rpt-table mt-3">
            <thead>
              <tr>
                <th>Recorded</th><th>HR</th><th>BP</th><th>RR</th><th>Temp</th><th>SpO2</th><th>Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {record.vitals.history.slice(0, 8).map((x, i) => (
                <tr key={x.id || i}>
                  <td>{formatDateTime(x.recordedAt)}</td>
                  <td>{dash(x.heartRate)}</td>
                  <td>{x.systolicBP != null ? `${x.systolicBP}/${x.diastolicBP}` : '—'}</td>
                  <td>{dash(x.respiratoryRate)}</td>
                  <td>{dash(x.temperature)}</td>
                  <td>{x.spo2 != null ? `${x.spo2}%` : '—'}</td>
                  <td>{dash(x.recordedBy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section no="6" title="Provisional diagnosis">
        <table className="cc-rpt-table">
          <thead>
            <tr><th style={{ width: '16%' }}>Code</th><th>Diagnosis</th><th style={{ width: '16%' }}>Type</th><th style={{ width: '26%' }}>Confirmed</th></tr>
          </thead>
          <tbody>
            {record.diagnoses.map((d) => (
              <tr key={d.code}>
                <td className="font-mono font-bold">{d.code}</td>
                <td>{d.description}</td>
                <td>{d.type}</td>
                <td>{d.confirmedBy} · {formatDateTime(d.diagnosedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section no="7" title="Investigations — laboratory results">
        <table className="cc-rpt-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Test</th>
              <th style={{ width: '14%' }}>Result</th>
              <th style={{ width: '18%' }}>Unit</th>
              <th style={{ width: '20%' }}>Reference</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {record.laboratoryResults.map((l) => (
              <tr key={l.test}>
                <td>{l.test}</td>
                <td className="font-bold cc-metric-value">{l.value}</td>
                <td>{dash(l.unit)}</td>
                <td>{l.reference}</td>
                <td className={`font-bold ${FLAG_CLASS[l.flag] || ''}`}>{l.flag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section no="8" title="Treatment — medicines prescribed">
        <table className="cc-rpt-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Medicine</th>
              <th style={{ width: '18%' }}>Dose</th>
              <th style={{ width: '12%' }}>Route</th>
              <th style={{ width: '16%' }}>Frequency</th>
              <th style={{ width: '14%' }}>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {record.medications.map((m, i) => (
              <tr key={i}>
                <td><span className="font-bold">{m.name}</span><span className="block text-[10.5px] text-slate-500">{m.category}</span></td>
                <td>{m.dose}</td>
                <td>{m.route}</td>
                <td>{m.frequency}</td>
                <td>{m.duration}</td>
                <td>{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section no="9" title="Procedures performed">
        <ul className="cc-rpt-list">
          {record.procedures.map((p) => (
            <li key={p.name}>
              <span className="cc-rpt-bullet" />
              <span className="font-semibold">{p.name}</span>
              <span className="cc-rpt-muted"> — performed by {p.performedBy}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section no="10" title="Bed and equipment allocation">
        <Fields
          cols={3}
          items={[
            ['Bed', record.bedAssignment.bedNumber],
            ['Ward', record.bedAssignment.ward],
            ['Required bed type', record.bedAssignment.requiredBedType],
            ['Required ward type', record.bedAssignment.requiredWardType],
            ['Equipment', record.bedAssignment.requiredEquipment.join(', ')],
            ['Isolation', record.bedAssignment.requiresIsolation ? 'Required' : 'Not required'],
          ]}
        />
      </Section>

      <Section no="11" title="Care plan">
        <ol className="cc-rpt-list">
          {record.carePlan.map((c) => (
            <li key={c.step}>
              <span className="cc-rpt-step">{c.step}</span>
              <span className="font-semibold">{c.action}</span>
              <span className="cc-rpt-muted"> — {c.status.replace(/_/g, ' ')}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section no="12" title="Progress notes and clinical timeline">
        {record.timeline.length === 0 ? (
          <p className="cc-rpt-text cc-rpt-muted">No events have been recorded for this encounter yet.</p>
        ) : (
          <ol className="cc-rpt-timeline">
            {record.timeline.map((e, i) => (
              <li key={e.id || i}>
                <span className="cc-rpt-tl-dot" />
                <div>
                  <div className="cc-rpt-tl-meta">
                    <span className="cc-rpt-chip">{String(e.eventType || '').replace(/_/g, ' ')}</span>
                    <span>{formatDateTime(e.timestamp)}</span>
                    {e.createdBy && <span>by {e.createdBy}</span>}
                  </div>
                  <p className="cc-rpt-text">{e.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section no="13" title="Conclusion and disposition">
        <p className="cc-rpt-text">
          {record.identity.fullName} presented with {String(record.encounter.chiefComplaint || 'the symptoms recorded above').toLowerCase()}
          {' '}and was triaged as <strong>{record.encounter.triageCategory || `level ${record.encounter.triageLevel}`}</strong>.
          {' '}Current status is <strong>{(record.encounter.admissionStatus || 'unknown').replace(/_/g, ' ').toLowerCase()}</strong>
          {record.bedAssignment.bedNumber ? `, allocated to bed ${record.bedAssignment.bedNumber} in ${record.bedAssignment.ward}` : ''}.
          {' '}Treatment is as tabulated in section 8 and the plan in section 11 remains in force.
        </p>
      </Section>

      <footer className="cc-rpt-foot">
        <div className="cc-rpt-sign">
          <div className="cc-rpt-sign-line" />
          <div className="text-[10.5px] font-bold text-slate-700">{record.identity.attendingDoctor || 'Authorising clinician'}</div>
          <div className="text-[10px] text-slate-500">Signature &amp; stamp</div>
        </div>
        <div className="text-right text-[10px] text-slate-400 leading-relaxed">
          <div>BedTracker Hospital Command Center</div>
          <div>Report generated {formatDateTime(generatedAt)}</div>
          <div>Clinical sections populated from the sample clinical dataset</div>
        </div>
      </footer>
    </article>
  );
}
