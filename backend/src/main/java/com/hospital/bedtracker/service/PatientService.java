package com.hospital.bedtracker.service;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.entity.Patient;
import com.hospital.bedtracker.entity.VitalSigns;
import com.hospital.bedtracker.repository.PatientEventRepository;
import com.hospital.bedtracker.repository.PatientRepository;
import com.hospital.bedtracker.repository.VitalSignsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PatientService {
    static final List<String> TRIAGE_QUEUE_STATUSES =
            List.of("TRIAGE", "REGISTERED", "WAITING", "WAITING_FOR_BED");

    @Autowired private PatientRepository patientRepository;
    @Autowired private VitalSignsRepository vitalSignsRepository;
    @Autowired private PatientEventRepository patientEventRepository;
    @Autowired private RealtimeEventPublisher events;
    @Autowired private AuditService auditService;
    @Autowired private PatientTimelineService timelineService;
    @Autowired private NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<Patient> getPatients(int page, int size, String sortBy, String sortDir) {
        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return patientRepository.findAll(PageRequest.of(page, size, sort));
    }

    @Transactional(readOnly = true)
    public List<Patient> getAllPatients() {
        return patientRepository.findAll(Sort.by(Sort.Direction.DESC, "arrivalTime"));
    }

    @Transactional(readOnly = true)
    public Page<Patient> searchPatients(String search, String status, Integer triageLevel,
                                        LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        return patientRepository.searchPatients(search, status, triageLevel, startDate, endDate,
                PageRequest.of(page, size, Sort.by("arrivalTime").descending()));
    }

    @Transactional(readOnly = true)
    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Patient> getPatientByMRN(String mrn) {
        return patientRepository.findByMedicalRecordNumber(mrn);
    }

    @Transactional
    public Patient createPatient(Patient patient, String createdBy) {
        if (patient.getFullName() == null || patient.getFullName().isBlank()) {
            throw new IllegalArgumentException("Patient full name is required");
        }
        patient.setCreatedBy(createdBy);
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedBy(createdBy);
        patient.setUpdatedAt(LocalDateTime.now());
        if (patient.getArrivalTime() == null) patient.setArrivalTime(LocalDateTime.now());
        if (patient.getAdmissionStatus() == null || patient.getAdmissionStatus().isBlank()
                || "REGISTERED".equals(patient.getAdmissionStatus())) {
            patient.setAdmissionStatus("TRIAGE");
        }
        patient.setAdmitted(false);
        if (patient.getMedicalRecordNumber() == null || patient.getMedicalRecordNumber().isBlank()) {
            patient.setMedicalRecordNumber("MRN-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (patient.getTriageLevel() != null) {
            patient.setTriageCategory(triageCategory(patient.getTriageLevel()));
        }
        patient.normaliseRequirements();
        Patient saved = patientRepository.save(patient);
        timelineService.addEvent(saved.getId(), "REGISTERED", "Patient registered by " + createdBy, createdBy);
        auditService.log(createdBy, "STAFF", "PATIENT_CREATED", "Patient", saved.getId(), null, saved.getAdmissionStatus());
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_REGISTERED")
                .with("patientId", saved.getId())
                .with("patientName", saved.getFullName())
                .with("triageLevel", saved.getTriageLevel())
                .with("admissionStatus", saved.getAdmissionStatus()));
        events.commandCenterUpdated("PATIENT_REGISTERED");
        if (saved.getTriageLevel() != null && saved.getTriageLevel() == 1) {
            notificationService.create("Critical Patient Arrived",
                    "Critical patient " + saved.getFullName() + " registered and waiting for triage.",
                    "CRITICAL", "NEW_CRITICAL_PATIENT");
        }
        return saved;
    }

    @Transactional
    public Patient updatePatient(Long id, Patient updated, String updatedBy) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        Integer oldTriage = patient.getTriageLevel();
        String oldStatus = patient.getAdmissionStatus();

        if (updated.getFullName() != null) patient.setFullName(updated.getFullName());
        if (updated.getGender() != null) patient.setGender(updated.getGender());
        if (updated.getAge() != null) patient.setAge(updated.getAge());
        if (updated.getPhoneNumber() != null) patient.setPhoneNumber(updated.getPhoneNumber());
        if (updated.getEmail() != null) patient.setEmail(updated.getEmail());
        if (updated.getAddress() != null) patient.setAddress(updated.getAddress());
        if (updated.getEmergencyContactName() != null) patient.setEmergencyContactName(updated.getEmergencyContactName());
        if (updated.getEmergencyContactPhone() != null) patient.setEmergencyContactPhone(updated.getEmergencyContactPhone());
        if (updated.getBloodType() != null) patient.setBloodType(updated.getBloodType());
        if (updated.getMedicalRecordNumber() != null) patient.setMedicalRecordNumber(updated.getMedicalRecordNumber());
        if (updated.getChiefComplaint() != null) patient.setChiefComplaint(updated.getChiefComplaint());
        if (updated.getPastMedicalHistory() != null) patient.setPastMedicalHistory(updated.getPastMedicalHistory());
        if (updated.getAllergies() != null) patient.setAllergies(updated.getAllergies());
        if (updated.getCurrentSymptoms() != null) patient.setCurrentSymptoms(updated.getCurrentSymptoms());
        if (updated.getNotes() != null) patient.setNotes(updated.getNotes());

        if (updated.getTemperature() != null) patient.setTemperature(updated.getTemperature());
        if (updated.getHeartRate() != null) patient.setHeartRate(updated.getHeartRate());
        if (updated.getRespiratoryRate() != null) patient.setRespiratoryRate(updated.getRespiratoryRate());
        if (updated.getSystolicBP() != null) patient.setSystolicBP(updated.getSystolicBP());
        if (updated.getDiastolicBP() != null) patient.setDiastolicBP(updated.getDiastolicBP());
        if (updated.getSpo2() != null) patient.setSpo2(updated.getSpo2());

        if (updated.getTriageLevel() != null) {
            patient.setTriageLevel(updated.getTriageLevel());
            patient.setTriageCategory(triageCategory(updated.getTriageLevel()));
        }
        if (updated.getRequiredBedType() != null) patient.setRequiredBedType(updated.getRequiredBedType());
        if (updated.getRequiredWardType() != null) patient.setRequiredWardType(updated.getRequiredWardType());
        if (updated.optionalRequiresVentilator() != null) patient.setRequiresVentilator(updated.optionalRequiresVentilator());
        if (updated.optionalRequiresOxygen() != null) patient.setRequiresOxygen(updated.optionalRequiresOxygen());
        if (updated.optionalRequiresIsolation() != null) patient.setRequiresIsolation(updated.optionalRequiresIsolation());
        if (updated.optionalRequiresDialysis() != null) patient.setRequiresDialysis(updated.optionalRequiresDialysis());
        if (updated.optionalRequiresCardiacMonitor() != null) patient.setRequiresCardiacMonitor(updated.optionalRequiresCardiacMonitor());

        if (updated.getAdmissionStatus() != null) patient.setAdmissionStatus(updated.getAdmissionStatus());
        if (updated.getPrimaryDiagnosis() != null) patient.setPrimaryDiagnosis(updated.getPrimaryDiagnosis());
        if (updated.getTreatmentPlan() != null) patient.setTreatmentPlan(updated.getTreatmentPlan());
        if (updated.getDoctor() != null) patient.setDoctor(updated.getDoctor());
        patient.setUpdatedBy(updatedBy);
        patient.setUpdatedAt(LocalDateTime.now());
        Patient saved = patientRepository.save(patient);

        if (updated.getTriageLevel() != null && !updated.getTriageLevel().equals(oldTriage)) {
            timelineService.addEvent(id, "TRIAGE",
                    "Triage changed from " + oldTriage + " to " + updated.getTriageLevel(), updatedBy);
            auditService.log(updatedBy, "STAFF", "TRIAGE_CHANGED", "Patient", id,
                    String.valueOf(oldTriage), String.valueOf(updated.getTriageLevel()));
            events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_TRIAGE_CHANGED")
                    .with("patientId", id)
                    .with("patientName", saved.getFullName())
                    .with("oldTriageLevel", oldTriage)
                    .with("newTriageLevel", updated.getTriageLevel()));
        }
        if (updated.getAdmissionStatus() != null && !updated.getAdmissionStatus().equals(oldStatus)) {
            auditService.log(updatedBy, "STAFF", "PATIENT_STATUS_CHANGED", "Patient", id, oldStatus, updated.getAdmissionStatus());
        }
        if (saved.getRequiredBedType() != null) {
            timelineService.addEvent(id, "BED_RECOMMENDED",
                    "Bed requirements updated: " + saved.getRequiredBedType()
                            + (saved.getRequiredWardType() == null ? "" : " in " + saved.getRequiredWardType() + " ward"), updatedBy);
        }
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_UPDATED")
                .with("patientId", id)
                .with("admissionStatus", saved.getAdmissionStatus())
                .with("triageLevel", saved.getTriageLevel()));
        events.commandCenterUpdated("PATIENT_UPDATED");
        return saved;
    }

    @Transactional
    public Patient updateVitals(Long id, VitalSigns vitals, String recordedBy) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        vitals.setPatient(patient);
        vitals.setRecordedBy(recordedBy);
        vitals.setRecordedAt(LocalDateTime.now());
        vitalSignsRepository.save(vitals);
        if (vitals.getTemperature() != null) patient.setTemperature(vitals.getTemperature());
        if (vitals.getHeartRate() != null) patient.setHeartRate(vitals.getHeartRate());
        if (vitals.getRespiratoryRate() != null) patient.setRespiratoryRate(vitals.getRespiratoryRate());
        if (vitals.getSystolicBP() != null) patient.setSystolicBP(vitals.getSystolicBP());
        if (vitals.getDiastolicBP() != null) patient.setDiastolicBP(vitals.getDiastolicBP());
        if (vitals.getSpo2() != null) patient.setSpo2(vitals.getSpo2());
        patient.setVitalsRecordedAt(LocalDateTime.now());
        patient.setUpdatedBy(recordedBy);
        patient.setUpdatedAt(LocalDateTime.now());
        Patient saved = patientRepository.save(patient);
        timelineService.addEvent(id, "VITALS", "Vitals recorded", recordedBy);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_VITALS_UPDATED")
                .with("patientId", id)
                .with("spo2", saved.getSpo2())
                .with("heartRate", saved.getHeartRate()));
        return saved;
    }

    @Transactional
    public Patient updateStatus(Long id, String newStatus, String actor) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        if (newStatus == null) throw new IllegalArgumentException("Status is required");
        String oldStatus = patient.getAdmissionStatus();
        if (oldStatus != null && oldStatus.equals(newStatus)) {
            throw new IllegalStateException("Patient is already " + newStatus);
        }
        if ("ADMITTED".equals(newStatus)) {
            throw new IllegalStateException("Use the allocation or reservation endpoint to admit a patient");
        }
        patient.setAdmissionStatus(newStatus);
        if ("UNDER_TREATMENT".equals(newStatus)) {
            patient.setTreatmentStartTime(LocalDateTime.now());
        }
        patient.setUpdatedBy(actor);
        patient.setUpdatedAt(LocalDateTime.now());
        Patient saved = patientRepository.save(patient);
        timelineService.addEvent(id, "STATUS", "Status changed from " + oldStatus + " to " + newStatus, actor);
        auditService.log(actor, "STAFF", "PATIENT_STATUS_CHANGED", "Patient", id, oldStatus, newStatus);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_STATUS_CHANGED")
                .with("patientId", id)
                .with("oldStatus", oldStatus)
                .with("newStatus", newStatus));
        events.commandCenterUpdated("PATIENT_STATUS_CHANGED");
        return saved;
    }

    @Transactional
    public Patient applyTriage(Long patientId, Integer triageLevel, String actor) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        String oldStatus = patient.getAdmissionStatus();
        String newStatus = "WAITING_FOR_BED";
        patient.setTriageLevel(triageLevel);
        patient.setTriageCategory(triageCategory(triageLevel));
        patient.setAdmissionStatus(newStatus);
        patient.setUpdatedBy(actor);
        patient.setUpdatedAt(LocalDateTime.now());
        Patient saved = patientRepository.save(patient);
        timelineService.addEvent(patientId, "TRIAGE_COMPLETED",
                "Patient triaged to level " + triageLevel + ". Moved to WAITING_FOR_BED.", actor);
        timelineService.addEvent(patientId, "WAITING_FOR_BED",
                "Patient " + patient.getFullName() + " is waiting for a bed.", actor);
        auditService.log(actor, "STAFF", "TRIAGE_COMPLETED", "Patient", patientId, oldStatus, newStatus);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_TRIAGE_COMPLETED")
                .with("patientId", patientId)
                .with("patientName", patient.getFullName())
                .with("triageLevel", triageLevel)
                .with("admissionStatus", newStatus));
        events.commandCenterUpdated("TRIAGE_COMPLETED");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Patient> getWaitingPatients() {
        return patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("WAITING_FOR_BED");
    }

    @Transactional(readOnly = true)
    public List<Patient> getTriageQueue() {
        return patientRepository.findQueueByStatuses(TRIAGE_QUEUE_STATUSES);
    }

    @Transactional(readOnly = true)
    public List<Patient> getPatientsByStatus(String status) {
        return patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc(status);
    }

    @Transactional(readOnly = true)
    public List<VitalSigns> getVitalSignsHistory(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return vitalSignsRepository.findByPatientOrderByRecordedAtDesc(patient);
    }

    private String triageCategory(int level) {
        return switch (level) {
            case 1 -> "CRITICAL";
            case 2 -> "EMERGENCY";
            case 3 -> "URGENT";
            case 4 -> "SEMI-URGENT";
            default -> "NON-URGENT";
        };
    }
}
