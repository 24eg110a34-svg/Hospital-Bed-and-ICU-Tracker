const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const dash = (v) => (v === null || v === undefined || v === '' ? '\u2014' : String(v));

const dt = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

const rows = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
const heads = (labels) => `<tr>${labels.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;

const fields = (items) =>
  `<dl>${items
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${dash(v)}</dd></div>`)
    .join('')}</dl>`;

const section = (no, title, body) =>
  `<section><h2><span>${no}</span>${esc(title)}</h2>${body}</section>`;

export function buildReportHtml(record, generatedAt = new Date().toISOString()) {
  const v = record.vitals.current;
  const ec = record.identity.emergencyContact;

  const vitals = [
    ['Heart rate', v.heartRate, 'bpm'],
    ['Blood pressure', v.bloodPressure, 'mmHg'],
    ['Respiratory rate', v.respiratoryRate, '/min'],
    ['Temperature', v.temperature, '&deg;C'],
    ['SpO2', v.spo2 === null ? null : `${v.spo2}%`, ''],
    ['Oxygen support', v.oxygenSupport, ''],
  ]
    .map(
      ([l, val, u]) =>
        `<div class="v"><span>${esc(l)}</span><b>${dash(val)}${val != null && u ? `<i>${u}</i>` : ''}</b></div>`,
    )
    .join('');

  const body = [
    section(
      1,
      'Patient particulars',
      fields([
        ['Patient name', record.identity.fullName],
        ['Medical record no.', record.identity.medicalRecordNumber],
        ['Age / Sex', `${record.identity.age ?? '—'} yrs · ${record.identity.gender || '—'}`],
        ['Blood group', record.identity.bloodType],
        ['Phone', record.identity.phoneNumber],
        ['Email', record.identity.email],
        ['Address', record.identity.address],
        ['Emergency contact', ec.name ? `${ec.name}${ec.phone ? ` (${ec.phone})` : ''}` : null],
        ['Attending doctor', record.identity.attendingDoctor],
      ]),
    ),
    section(
      2,
      'Encounter summary',
      fields([
        ['Arrival time', dt(record.encounter.arrivalTime)],
        ['Time waited', record.encounter.waitingMinutes != null ? `${record.encounter.waitingMinutes} min` : null],
        ['Treatment started', dt(record.encounter.treatmentStartTime)],
        ['Discharge time', dt(record.encounter.dischargeTime)],
        ['Triage category', record.encounter.triageCategory],
        ['Current status', (record.encounter.admissionStatus || '').replace(/_/g, ' ') || null],
      ]),
    ),
    section(
      3,
      'Presenting complaint and symptoms',
      `<p><b>Chief complaint:</b> ${dash(record.encounter.chiefComplaint)}</p>`
      + `<table>${heads(['Symptom', 'Severity', 'Onset', 'Recorded'])}${record.symptoms
        .map((s) => rows([esc(s.symptom), esc(s.severity), esc(s.onset), dt(s.recordedAt)]))
        .join('')}</table>`,
    ),
    section(
      4,
      'Allergies and past medical history',
      `<p><b>Known allergies:</b> ${record.allergies.length ? esc(record.allergies.join(', ')) : 'None recorded'}</p>`
      + `<p><b>Past medical history:</b> ${esc(record.pastMedicalHistory.join('; '))}</p>`
      + (record.encounter.notes ? `<p><b>Clinical notes:</b> ${esc(record.encounter.notes)}</p>` : ''),
    ),
    section(5, 'Vital signs', `<div class="vitals">${vitals}</div>`),
    section(
      6,
      'Provisional diagnosis',
      `<table>${heads(['Code', 'Diagnosis', 'Type', 'Confirmed'])}${record.diagnoses
        .map((d) => rows([`<code>${esc(d.code)}</code>`, esc(d.description), esc(d.type), `${esc(d.confirmedBy)} · ${dt(d.diagnosedAt)}`]))
        .join('')}</table>`,
    ),
    section(
      7,
      'Investigations — laboratory results',
      `<table>${heads(['Test', 'Result', 'Unit', 'Reference', 'Flag'])}${record.laboratoryResults
        .map((l) => rows([esc(l.test), `<b>${esc(l.value)}</b>`, dash(l.unit), esc(l.reference), esc(l.flag)]))
        .join('')}</table>`,
    ),
    section(
      8,
      'Treatment — medicines prescribed',
      `<table>${heads(['Medicine', 'Dose', 'Route', 'Frequency', 'Duration', 'Status'])}${record.medications
        .map((m) => rows([`<b>${esc(m.name)}</b><i>${esc(m.category)}</i>`, esc(m.dose), esc(m.route), esc(m.frequency), esc(m.duration), esc(m.status)]))
        .join('')}</table>`,
    ),
    section(
      9,
      'Procedures performed',
      `<ul>${record.procedures.map((p) => `<li>${esc(p.name)} <span>— ${esc(p.performedBy)}</span></li>`).join('')}</ul>`,
    ),
    section(
      10,
      'Bed and equipment allocation',
      fields([
        ['Bed', record.bedAssignment.bedNumber],
        ['Ward', record.bedAssignment.ward],
        ['Required bed type', record.bedAssignment.requiredBedType],
        ['Required ward type', record.bedAssignment.requiredWardType],
        ['Equipment', record.bedAssignment.requiredEquipment.join(', ')],
        ['Isolation', record.bedAssignment.requiresIsolation ? 'Required' : 'Not required'],
      ]),
    ),
    section(
      11,
      'Care plan',
      `<ol>${record.carePlan.map((c) => `<li><b>${esc(c.action)}</b> <span>— ${esc(c.status.replace(/_/g, ' '))}</span></li>`).join('')}</ol>`,
    ),
    section(
      12,
      'Progress notes and clinical timeline',
      record.timeline.length
        ? `<ol class="tl">${record.timeline
            .map((e) => `<li><em>${esc(String(e.eventType || '').replace(/_/g, ' '))} · ${dt(e.timestamp)}${e.createdBy ? ` · ${esc(e.createdBy)}` : ''}</em><p>${esc(e.description)}</p></li>`)
            .join('')}</ol>`
        : '<p class="muted">No events have been recorded for this encounter yet.</p>',
    ),
    section(
      13,
      'Conclusion and disposition',
      `<p>${esc(record.identity.fullName)} presented with ${esc(String(record.encounter.chiefComplaint || 'the symptoms recorded above').toLowerCase())} `
      + `and was triaged as <b>${esc(record.encounter.triageCategory || `level ${record.encounter.triageLevel}`)}</b>. `
      + `Current status is <b>${esc((record.encounter.admissionStatus || 'unknown').replace(/_/g, ' ').toLowerCase())}</b>`
      + `${record.bedAssignment.bedNumber ? `, allocated to bed ${esc(record.bedAssignment.bedNumber)} in ${esc(record.bedAssignment.ward)}` : ''}. `
      + 'Treatment is as tabulated in section 8 and the plan in section 11 remains in force.</p>',
    ),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clinical Report · ${esc(record.identity.fullName)} · ${esc(record.identity.medicalRecordNumber)}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; background: #f1f5f9; color: #0f172a;
    font: 12.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .sheet { max-width: 860px; margin: 0 auto; background: #fff; padding: 30px 34px;
    border-radius: 14px; box-shadow: 0 4px 18px rgba(15,23,42,.10); }
  header { border-bottom: 2px solid #1d4ed8; padding-bottom: 14px; display: flex;
    justify-content: space-between; gap: 18px; flex-wrap: wrap; align-items: flex-start; }
  .brand { display: flex; gap: 12px; align-items: center; }
  .mark { width: 44px; height: 44px; border-radius: 12px; background: #1d4ed8; color: #fff;
    display: grid; place-items: center; font-size: 20px; font-weight: 700; }
  .brand b { display: block; font-size: 15px; font-weight: 800; }
  .brand span { font-size: 10.5px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: #1d4ed8; }
  .meta { text-align: right; font-size: 10.5px; color: #64748b; line-height: 1.6; }
  .meta b { color: #0f172a; letter-spacing: .1em; text-transform: uppercase; }
  .banner { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 12px; padding: 6px 10px;
    background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px;
    font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #475569; }
  h1.title { text-align: center; margin: 18px 0 4px; font-size: 15px; font-weight: 800;
    letter-spacing: .22em; text-transform: uppercase; }
  h1.title span { display: inline-block; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
  section { margin-top: 20px; break-inside: avoid; page-break-inside: avoid; }
  h2 { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 800;
    letter-spacing: .1em; text-transform: uppercase; color: #1e3a8a;
    border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 0 0 9px; }
  h2 span { width: 17px; height: 17px; border-radius: 4px; background: #1d4ed8; color: #fff;
    font-size: 9.5px; display: grid; place-items: center; }
  dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
  dl > div { display: flex; gap: 8px; padding: 3px 0; border-bottom: 1px dotted #e2e8f0; }
  dt { width: 118px; flex-shrink: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; color: #64748b; }
  dd { margin: 0; font-weight: 600; word-break: break-word; }
  p { margin: 0 0 6px; color: #1e293b; }
  p.muted, .muted { color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 2px; font-size: 11.5px; }
  th { text-align: left; font-size: 9.5px; font-weight: 800; letter-spacing: .09em;
    text-transform: uppercase; color: #475569; background: #f8fafc;
    border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 5px 7px; }
  td { padding: 5px 7px; border-bottom: 1px solid #eef2f6; vertical-align: top; }
  td i, td i { display: block; font-style: normal; font-size: 10.5px; color: #64748b; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; }
  .vitals { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .vitals .v { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #fbfdff; }
  .vitals .v span { display: block; font-size: 9px; font-weight: 800; letter-spacing: .07em;
    text-transform: uppercase; color: #64748b; }
  .vitals .v b { font-size: 15px; }
  .vitals .v i { font-style: normal; font-size: 9.5px; font-weight: 700; color: #94a3b8; margin-left: 3px; }
  ul, ol { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
  ul { list-style: disc; }
  ol.tl { border-left: 2px solid #e2e8f0; padding-left: 16px; list-style: none; }
  ol.tl em { font-style: normal; font-size: 10.5px; color: #64748b; }
  ol.tl span { color: #64748b; }
  footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;
    margin-top: 26px; padding-top: 12px; border-top: 1px solid #cbd5e1; }
  .sign { min-width: 190px; }
  .sign .line { height: 1px; background: #94a3b8; margin-bottom: 5px; }
  .sign b { font-size: 10.5px; }
  .sign span, .foot-note { font-size: 10px; color: #64748b; }
  .foot-note { text-align: right; line-height: 1.6; }
  .noprint { max-width: 860px; margin: 0 auto 16px; text-align: right; }
  .noprint button { font: inherit; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 8px;
    border: 1px solid #cbd5e1; background: #fff; color: #0f172a; cursor: pointer; }
  .noprint button:hover { background: #f8fafc; }
  @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; border-radius: 0; padding: 0; max-width: none; } .noprint { display: none; } }
</style>
</head>
<body>
<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="sheet">
  <header>
    <div class="brand">
      <div class="mark">&#9829;</div>
      <div>
        <b>${esc(record.identity.hospital)}</b>
        <span>Department of Emergency &amp; Critical Care</span>
      </div>
    </div>
    <div class="meta">
      <b>Patient Clinical Record</b><br />
      Report no. ${esc(record.identity.medicalRecordNumber)}<br />
      Generated ${dt(generatedAt)}
    </div>
  </header>

  <div class="banner">
    <span>Confidential medical document</span>
    <span>Triage L${record.encounter.triageLevel ?? '-'} · ${esc(record.encounter.triageCategory || 'Unclassified')}</span>
    <span>${esc((record.encounter.admissionStatus || 'Status unknown').replace(/_/g, ' '))}</span>
  </div>

  <h1 class="title"><span>Clinical Resume &amp; Progress Report</span></h1>

  ${body}

  <footer>
    <div class="sign">
      <div class="line"></div>
      <b>${esc(record.identity.attendingDoctor || 'Authorising clinician')}</b><br />
      <span>Signature &amp; stamp</span>
    </div>
    <div class="foot-note">
      BedTracker Hospital Command Center<br />
      Report generated ${dt(generatedAt)}<br />
      Clinical sections populated from the sample clinical dataset
    </div>
  </footer>
</div>
</body>
</html>`;
}
