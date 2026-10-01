const MED_DB = {
  sepsis: [
    { name: 'Piperacillin / Tazobactam', dose: '4.5 g', route: 'IV', frequency: 'q6h', duration: '7 days', category: 'Antibiotic', status: 'ACTIVE' },
    { name: 'Vancomycin', dose: '1 g', route: 'IV', frequency: 'q12h', duration: '5 days', category: 'Antibiotic', status: 'ACTIVE' },
    { name: 'Noradrenaline', dose: '0.05 mcg/kg/min', route: 'IV infusion', frequency: 'Continuous', duration: 'Titrate to MAP > 65', category: 'Vasopressor', status: 'ACTIVE' },
    { name: 'Paracetamol', dose: '1 g', route: 'IV', frequency: 'q6h', duration: 'PRN', category: 'Analgesia', status: 'ACTIVE' },
  ],
  asthma: [
    { name: 'Salbutamol', dose: '2.5 mg', route: 'Nebulised', frequency: 'q4h', duration: 'PRN', category: 'Bronchodilator', status: 'ACTIVE' },
    { name: 'Ipratropium bromide', dose: '500 mcg', route: 'Nebulised', frequency: 'q6h', duration: '48 hours', category: 'Bronchodilator', status: 'ACTIVE' },
    { name: 'Prednisolone', dose: '40 mg', route: 'Oral', frequency: 'OD', duration: '5 days', category: 'Corticosteroid', status: 'ACTIVE' },
    { name: 'Hydrocortisone', dose: '200 mg', route: 'IV', frequency: 'q12h', duration: '72 hours', category: 'Corticosteroid', status: 'COMPLETED' },
  ],
  copd: [
    { name: 'Salbutamol', dose: '100 mcg', route: 'Inhaled', frequency: 'q4-6h', duration: 'PRN', category: 'Bronchodilator', status: 'ACTIVE' },
    { name: 'Ipratropium / Tiotropium', dose: '18 mcg', route: 'Inhaled', frequency: 'OD', duration: 'Ongoing', category: 'Bronchodilator', status: 'ACTIVE' },
    { name: 'Doxycycline', dose: '100 mg', route: 'Oral', frequency: 'BD', duration: '5 days', category: 'Antibiotic', status: 'ACTIVE' },
    { name: 'Methylprednisolone', dose: '32 mg', route: 'Oral', frequency: 'OD', duration: '14 days', category: 'Corticosteroid', status: 'ACTIVE' },
  ],
  cva: [
    { name: 'Alteplase', dose: '0.9 mg/kg', route: 'IV', frequency: 'Single dose', duration: 'One off', category: 'Thrombolytic', status: 'COMPLETED' },
    { name: 'Aspirin', dose: '300 mg', route: 'Oral', frequency: 'Single dose', duration: 'One off', category: 'Antiplatelet', status: 'COMPLETED' },
    { name: 'Atorvastatin', dose: '80 mg', route: 'Oral', frequency: 'ON', duration: 'Ongoing', category: 'Statin', status: 'ACTIVE' },
    { name: 'Clopidogrel', dose: '75 mg', route: 'Oral', frequency: 'OD', duration: '90 days', category: 'Antiplatelet', status: 'ACTIVE' },
    { name: 'Enoxaparin', dose: '40 mg', route: 'SC', frequency: 'OD', duration: '14 days', category: 'Anticoagulant', status: 'ACTIVE' },
  ],
  chf: [
    { name: 'Furosemide', dose: '40 mg', route: 'IV', frequency: 'BD', duration: 'Until euvolaemia', category: 'Diuretic', status: 'ACTIVE' },
    { name: 'Bisoprolol', dose: '2.5 mg', route: 'Oral', frequency: 'OD', duration: 'Ongoing', category: 'Beta blocker', status: 'ACTIVE' },
    { name: 'Ramipril', dose: '2.5 mg', route: 'Oral', frequency: 'OD', duration: 'Ongoing', category: 'ACE inhibitor', status: 'ACTIVE' },
    { name: 'Spironolactone', dose: '25 mg', route: 'Oral', frequency: 'OD', duration: 'Ongoing', category: 'Aldosterone blocker', status: 'ACTIVE' },
  ],
  ckd: [
    { name: 'Sevelamer carbonate', dose: '2400 mg', route: 'Oral', frequency: 'TDS', duration: 'Ongoing', category: 'Phosphate binder', status: 'ACTIVE' },
    { name: 'Erythropoietin', dose: '6000 IU', route: 'SC', frequency: 'Weekly', duration: 'Ongoing', category: 'ESA', status: 'ACTIVE' },
    { name: 'Sodium bicarbonate', dose: '650 mg', route: 'Oral', frequency: 'TDS', duration: 'Ongoing', category: 'Metabolic', status: 'ACTIVE' },
  ],
  mi: [
    { name: 'Aspirin', dose: '300 mg', route: 'Oral', frequency: 'Single dose', duration: 'One off', category: 'Antiplatelet', status: 'COMPLETED' },
    { name: 'Ticagrelor', dose: '180 mg', route: 'Oral', frequency: 'BD then OD', duration: '12 months', category: 'Antiplatelet', status: 'ACTIVE' },
    { name: 'Atorvastatin', dose: '80 mg', route: 'Oral', frequency: 'ON', duration: 'Ongoing', category: 'Statin', status: 'ACTIVE' },
    { name: 'Bisoprolol', dose: '2.5 mg', route: 'Oral', frequency: 'OD', duration: 'Ongoing', category: 'Beta blocker', status: 'ACTIVE' },
    { name: 'Enoxaparin', dose: '40 mg', route: 'SC', frequency: 'BD', duration: '5 days', category: 'Anticoagulant', status: 'ACTIVE' },
  ],
  fracture: [
    { name: 'Paracetamol', dose: '1 g', route: 'Oral', frequency: 'QDS', duration: 'PRN', category: 'Analgesia', status: 'ACTIVE' },
    { name: 'Ibuprofen', dose: '400 mg', route: 'Oral', frequency: 'TDS', duration: 'PRN', category: 'NSAID', status: 'ACTIVE' },
    { name: 'Enoxaparin', dose: '40 mg', route: 'SC', frequency: 'OD', duration: '28 days', category: 'Anticoagulant', status: 'ACTIVE' },
    { name: 'Morphine', dose: '5 mg', route: 'IV', frequency: 'q4h', duration: 'PRN', category: 'Opioid', status: 'ACTIVE' },
  ],
  pediatric: [
    { name: 'Paracetamol', dose: '15 mg/kg', route: 'Oral', frequency: 'QDS', duration: 'PRN', category: 'Analgesia', status: 'ACTIVE' },
    { name: 'Amoxicillin', dose: '25 mg/kg', route: 'Oral', frequency: 'TDS', duration: '5 days', category: 'Antibiotic', status: 'ACTIVE' },
    { name: 'Salbutamol', dose: '2.5 mg', route: 'Nebulised', frequency: 'q4h', duration: 'PRN', category: 'Bronchodilator', status: 'ACTIVE' },
  ],
  default: [
    { name: 'Paracetamol', dose: '1 g', route: 'Oral', frequency: 'QDS', duration: 'PRN', category: 'Analgesia', status: 'ACTIVE' },
    { name: 'Ondansetron', dose: '4 mg', route: 'IV', frequency: 'q8h', duration: 'PRN', category: 'Antiemetic', status: 'ACTIVE' },
    { name: 'Enoxaparin', dose: '40 mg', route: 'SC', frequency: 'OD', duration: 'Inpatient stay', category: 'Anticoagulant', status: 'ACTIVE' },
  ],
};

const CONDITION_KEYWORDS = [
  ['sepsis', ['sepsis', 'septic', 'fever', 'infection', 'respiratory distress', 'ventilator', 'hypoxia', 'hypoxic', 'ards', 'cough']],
  ['cva', ['stroke', 'cva', 'hemiparesis', 'seizure', 'unconscious']],
  ['mi', ['mi', 'myocardial', 'chest pain', 'stemi', 'nstemi', 'heart attack']],
  ['chf', ['heart failure', 'chf', 'oedema', 'edema', 'pulmonary oedema', 'pulmonary edema']],
  ['asthma', ['asthma', 'wheez', 'bronchospasm', 'breathless']],
  ['copd', ['copd', 'chronic obstructive']],
  ['ckd', ['renal', 'kidney', 'dialysis', 'creatinine']],
  ['fracture', ['fracture', 'fall', 'trauma', 'injury']],
  ['pediatric', ['child', 'paediatric', 'pediatric', 'infant', 'toddler']],
];

const pick = (list, seed) => list[Math.abs(seed) % list.length];

const asTime = (hoursAgo) => {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

const buildSymptoms = (patient) => {
  const text = `${patient?.chiefComplaint || ''} ${patient?.currentSymptoms || ''}`.toLowerCase();
  const list = (patient?.currentSymptoms || patient?.chiefComplaint || 'Presentation documented by triage')
    .split(/[,;\/]|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return (list.length ? list : ['Presentation documented by triage']).map((symptom, i) => ({
    symptom,
    severity: pick(['Mild', 'Moderate', 'Severe'], (patient?.id || i) + i),
    onset: i === 0 ? 'Today' : `${i + 1} day${i > 0 ? 's' : ''} ago`,
    recordedAt: asTime((patient?.id || 2) * 2 + i * 3),
  })).concat(text ? [] : []);
};

const matchKey = (patient) => {
  const text = `${patient?.chiefComplaint || ''} ${patient?.currentSymptoms || ''} ${patient?.pastMedicalHistory || ''}`.toLowerCase();
  for (const [key, words] of CONDITION_KEYWORDS) {
    if (words.some((w) => text.includes(w))) return key;
  }
  if ((patient?.age || 0) > 0 && patient.age < 16) return 'pediatric';
  return 'default';
};

const buildDiagnoses = (key, patient) => {
  const catalogue = {
    sepsis: [{ code: 'A41.9', description: 'Sepsis, unspecified organism', type: 'PRIMARY' }, { code: 'J18.9', description: 'Pneumonia, unspecified', type: 'SECONDARY' }],
    asthma: [{ code: 'J45.9', description: 'Asthma, unspecified', type: 'PRIMARY' }, { code: 'J45.2', description: 'Moderate persistent asthma', type: 'HISTORY' }],
    copd: [{ code: 'J44.1', description: 'COPD with acute exacerbation', type: 'PRIMARY' }, { code: 'J96.2', description: 'Acute respiratory failure', type: 'COMPLICATION' }],
    cva: [{ code: 'I63', description: 'Cerebral infarction, unspecified', type: 'PRIMARY' }, { code: 'E11', description: 'Type 2 diabetes mellitus', type: 'COMORBID' }],
    chf: [{ code: 'I50.0', description: 'Congestive heart failure', type: 'PRIMARY' }, { code: 'I10', description: 'Essential hypertension', type: 'COMORBID' }],
    ckd: [{ code: 'N18.5', description: 'Chronic kidney disease stage 5', type: 'PRIMARY' }, { code: 'D64.9', description: 'Anaemia, unspecified', type: 'COMORBID' }],
    mi: [{ code: 'I21.4', description: 'Non-ST elevation myocardial infarction', type: 'PRIMARY' }, { code: 'E11', description: 'Type 2 diabetes mellitus', type: 'COMORBID' }],
    fracture: [{ code: 'S72.0', description: 'Fracture of neck of femur', type: 'PRIMARY' }, { code: 'E11', description: 'Type 2 diabetes mellitus', type: 'COMORBID' }],
    pediatric: [{ code: 'J06.9', description: 'Acute upper respiratory infection', type: 'PRIMARY' }],
    default: [{ code: 'R69', description: 'Illness, unspecified', type: 'PROVISIONAL' }],
  };
  return (catalogue[key] || catalogue.default).map((d, i) => ({
    ...d,
    status: i === 0 ? 'ACTIVE' : 'HISTORY',
    confirmedBy: patient?.doctorName || 'Dr. A. Menon',
    diagnosedAt: asTime((patient?.id || 1) * 4 + i * 6),
  }));
};

const buildLabs = (key, patient) => {
  const catalogue = {
    sepsis: [
      { test: 'Hemoglobin', value: 10.2, unit: 'g/dL', reference: '13.0 - 17.0', flag: 'LOW' },
      { test: 'White cell count', value: 19.4, unit: 'x10^9/L', reference: '4.0 - 11.0', flag: 'HIGH' },
      { test: 'C-reactive protein', value: 168, unit: 'mg/L', reference: '< 5', flag: 'CRITICAL' },
      { test: 'Lactate', value: 3.8, unit: 'mmol/L', reference: '0.5 - 2.2', flag: 'HIGH' },
      { test: 'Creatinine', value: 132, unit: 'micromol/L', reference: '62 - 106', flag: 'HIGH' },
    ],
    asthma: [
      { test: 'White cell count', value: 9.8, unit: 'x10^9/L', reference: '4.0 - 11.0', flag: 'NORMAL' },
      { test: 'Eosinophils', value: 0.9, unit: 'x10^9/L', reference: '0.0 - 0.5', flag: 'HIGH' },
      { test: 'IgE (total)', value: 412, unit: 'kU/L', reference: '< 100', flag: 'HIGH' },
      { test: 'C-reactive protein', value: 6, unit: 'mg/L', reference: '< 5', flag: 'HIGH' },
    ],
    copd: [
      { test: 'ABG pH', value: 7.31, unit: '', reference: '7.35 - 7.45', flag: 'LOW' },
      { test: 'PaCO2', value: 58, unit: 'mmHg', reference: '35 - 45', flag: 'HIGH' },
      { test: 'PaO2', value: 68, unit: 'mmHg', reference: '80 - 100', flag: 'LOW' },
      { test: 'Hemoglobin', value: 15.6, unit: 'g/dL', reference: '13.0 - 17.0', flag: 'NORMAL' },
    ],
    cva: [
      { test: 'Glucose', value: 8.4, unit: 'mmol/L', reference: '3.9 - 5.5', flag: 'HIGH' },
      { test: 'INR', value: 1.1, unit: '', reference: '0.8 - 1.2', flag: 'NORMAL' },
      { test: 'CT brain (no bleed)', value: 1, unit: 'report', reference: 'Negative', flag: 'NORMAL' },
      { test: 'Lipid profile LDL', value: 4.1, unit: 'mmol/L', reference: '< 3.0', flag: 'HIGH' },
    ],
    chf: [
      { test: 'BNP', value: 1840, unit: 'pg/mL', reference: '< 100', flag: 'CRITICAL' },
      { test: 'Creatinine', value: 148, unit: 'micromol/L', reference: '62 - 106', flag: 'HIGH' },
      { test: 'Potassium', value: 4.4, unit: 'mmol/L', reference: '3.5 - 5.1', flag: 'NORMAL' },
      { test: 'Albumin', value: 31, unit: 'g/L', reference: '35 - 50', flag: 'LOW' },
    ],
    ckd: [
      { test: 'Creatinine', value: 486, unit: 'micromol/L', reference: '62 - 106', flag: 'CRITICAL' },
      { test: 'eGFR', value: 11, unit: 'mL/min', reference: '> 90', flag: 'CRITICAL' },
      { test: 'Hemoglobin', value: 8.4, unit: 'g/dL', reference: '13.0 - 17.0', flag: 'LOW' },
      { test: 'Potassium', value: 5.8, unit: 'mmol/L', reference: '3.5 - 5.1', flag: 'HIGH' },
    ],
    mi: [
      { test: 'Troponin I', value: 4.8, unit: 'ng/mL', reference: '< 0.04', flag: 'CRITICAL' },
      { test: 'CK-MB', value: 62, unit: 'U/L', reference: '< 25', flag: 'HIGH' },
      { test: 'ECG', value: 1, unit: 'report', reference: 'ST depression', flag: 'ABNORMAL' },
      { test: 'Glucose', value: 9.6, unit: 'mmol/L', reference: '3.9 - 5.5', flag: 'HIGH' },
    ],
    fracture: [
      { test: 'Hemoglobin', value: 11.2, unit: 'g/dL', reference: '13.0 - 17.0', flag: 'LOW' },
      { test: 'X-ray hip', value: 1, unit: 'report', reference: 'No fracture', flag: 'ABNORMAL' },
      { test: 'Calcium', value: 2.24, unit: 'mmol/L', reference: '2.1 - 2.6', flag: 'NORMAL' },
      { test: 'Creatinine', value: 88, unit: 'micromol/L', reference: '62 - 106', flag: 'NORMAL' },
    ],
    pediatric: [
      { test: 'White cell count', value: 12.1, unit: 'x10^9/L', reference: '5.0 - 15.5', flag: 'NORMAL' },
      { test: 'C-reactive protein', value: 14, unit: 'mg/L', reference: '< 5', flag: 'HIGH' },
      { test: 'Hemoglobin', value: 12.8, unit: 'g/dL', reference: '11.5 - 15.5', flag: 'NORMAL' },
    ],
    default: [
      { test: 'Hemoglobin', value: 13.8, unit: 'g/dL', reference: '13.0 - 17.0', flag: 'NORMAL' },
      { test: 'White cell count', value: 8.4, unit: 'x10^9/L', reference: '4.0 - 11.0', flag: 'NORMAL' },
      { test: 'C-reactive protein', value: 4, unit: 'mg/L', reference: '< 5', flag: 'NORMAL' },
      { test: 'Creatinine', value: 79, unit: 'micromol/L', reference: '62 - 106', flag: 'NORMAL' },
    ],
  };
  return (catalogue[key] || catalogue.default).map((l) => ({ ...l, collectedAt: asTime((patient?.id || 1) * 2 + 4) }));
};

const CONDITIONS = [
  ['Hypertension', 'I10'],
  ['Type 2 diabetes mellitus', 'E11'],
  ['Asthma', 'J45'],
  ['Chronic kidney disease stage 3', 'N18.3'],
  ['Ischaemic heart disease', 'I25'],
  ['Hypothyroidism', 'E03'],
];

const ALLERGENS = ['Penicillin', 'Latex', 'Iodinated contrast', 'Peanut', 'Sulfa drugs', 'No known allergies'];

const PROCEDURES = [
  { name: 'IV cannulation', performedBy: 'Nurse on duty', status: 'COMPLETED' },
  { name: '12-lead ECG', performedBy: 'Triage nurse', status: 'COMPLETED' },
  { name: 'Urinary catheterisation', performedBy: 'Senior nurse', status: 'COMPLETED' },
  { name: 'Arterial blood gas', performedBy: 'Respiratory therapist', status: 'COMPLETED' },
];

const round1 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : (v ?? null));

/**
 * Clinical sample data layered on top of the live patient record from the
 * backend. Anything the API does not model (medicines, diagnoses, labs,
 * procedures, past history) is filled from this catalogue so the resume and
 * the JSON export always have a complete clinical picture.
 */
export function buildClinicalRecord(patient, extra = {}) {
  const key = matchKey(patient);
  const seed = patient?.id || 0;
  const history = patient?.pastMedicalHistory
    ? String(patient.pastMedicalHistory).split(/[,;\/]/).map((s) => s.trim()).filter(Boolean)
    : (patient?.age > 55
      ? [CONDITIONS[seed % CONDITIONS.length], CONDITIONS[(seed + 2) % CONDITIONS.length], CONDITIONS[(seed + 4) % CONDITIONS.length]]
      : [CONDITIONS[(seed + 1) % CONDITIONS.length], CONDITIONS[(seed + 3) % CONDITIONS.length]]
    ).map((c) => `${c[0]} (${c[1]})`);

  const allergies = patient?.allergies && patient.allergies.trim()
    ? String(patient.allergies).split(/[,;\/]/).map((s) => s.trim()).filter(Boolean)
    : [pick(ALLERGENS.slice(0, 5), seed + 1)];

  return {
    identity: {
      medicalRecordNumber: patient?.medicalRecordNumber || 'MRN-UNKNOWN',
      fullName: patient?.fullName || 'Unknown patient',
      age: patient?.age ?? null,
      ageUnit: 'years',
      gender: patient?.gender || null,
      bloodType: patient?.bloodType || null,
      phoneNumber: patient?.phoneNumber || null,
      email: patient?.email || null,
      address: patient?.address || null,
      emergencyContact: {
        name: patient?.emergencyContactName || null,
        phone: patient?.emergencyContactPhone || null,
      },
      hospital: patient?.hospitalName || 'Medicare Hospital',
      attendingDoctor: patient?.doctorName || null,
    },
    encounter: {
      arrivalTime: patient?.arrivalTime || null,
      triageLevel: patient?.triageLevel ?? null,
      triageCategory: patient?.triageCategory || null,
      triageScore: patient?.score ?? null,
      admissionStatus: patient?.admissionStatus || null,
      waitingMinutes: patient?.waitingMinutes ?? null,
      treatmentStartTime: patient?.treatmentStartTime || null,
      dischargeTime: patient?.dischargeTime || null,
      chiefComplaint: patient?.chiefComplaint || null,
      notes: patient?.notes || null,
    },
    bedAssignment: {
      bedNumber: patient?.assignedBedNumber || null,
      ward: patient?.assignedWardName || null,
      requiredBedType: patient?.requiredBedType || null,
      requiredWardType: patient?.requiredWardType || null,
      requiredEquipment: (patient?.requiredEquipmentSummary || 'Basic').split(', ').filter(Boolean),
      requiresVentilator: Boolean(patient?.requiresVentilator),
      requiresOxygen: Boolean(patient?.requiresOxygen),
      requiresIsolation: Boolean(patient?.requiresIsolation),
      requiresDialysis: Boolean(patient?.requiresDialysis),
      requiresCardiacMonitor: Boolean(patient?.requiresCardiacMonitor),
    },
    vitals: {
      current: {
        temperature: round1(patient?.temperature),
        heartRate: patient?.heartRate ?? null,
        respiratoryRate: patient?.respiratoryRate ?? null,
        bloodPressure: patient?.systolicBP != null && patient?.diastolicBP != null
          ? `${patient.systolicBP}/${patient.diastolicBP}`
          : null,
        systolicBP: patient?.systolicBP ?? null,
        diastolicBP: patient?.diastolicBP ?? null,
        spo2: patient?.spo2 ?? null,
        oxygenSupport: patient?.requiresOxygen ? 'Nasal cannula 4 L/min' : 'Room air',
      },
      history: extra.vitals || [],
    },
    symptoms: buildSymptoms(patient),
    allergies,
    pastMedicalHistory: history,
    diagnoses: buildDiagnoses(key, patient),
    medications: MED_DB[key] || MED_DB.default,
    laboratoryResults: buildLabs(key, patient),
    procedures: PROCEDURES,
    carePlan: [
      { step: 1, action: 'Continuous cardiac and SpO2 monitoring', status: 'IN PROGRESS' },
      { step: 2, action: 'Escalate to consultant on any deterioration', status: 'PENDING' },
      { step: 3, action: 'Review medications for renal dosing', status: 'PENDING' },
      { step: 4, action: 'Plan discharge and follow-up', status: 'PENDING' },
    ],
    timeline: extra.timeline || [],
  };
}
