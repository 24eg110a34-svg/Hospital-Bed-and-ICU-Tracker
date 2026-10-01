export const slugify = (value) =>
  String(value || 'record')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'record';

export function toJsonString(data) {
  return JSON.stringify(data, null, 2);
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(filename, data) {
  downloadBlob(filename, new Blob([toJsonString(data)], { type: 'application/json' }));
}

export function downloadPatientRecord(patient, clinical, timeline = []) {
  const payload = {
    schemaVersion: '1.0.0',
    documentType: 'PATIENT_CLINICAL_RECORD',
    generatedAt: new Date().toISOString(),
    generatedBy: 'BedTracker Hospital Command Center',
    source: {
      system: 'Hospital Bed & ICU Tracker',
      live: true,
      clinicalSections: 'Sample clinical dataset',
    },
    patientId: patient?.id ?? null,
    ...clinical,
    timeline,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  downloadJson(`patient-record-${slugify(patient?.medicalRecordNumber || patient?.fullName)}-${stamp}.json`, payload);
  return payload;
}

export function downloadHtml(filename, html) {
  downloadBlob(filename, new Blob([html], { type: 'text/html;charset=utf-8' }));
}
