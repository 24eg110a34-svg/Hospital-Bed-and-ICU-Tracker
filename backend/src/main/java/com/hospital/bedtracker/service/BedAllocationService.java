package com.hospital.bedtracker.service;
import com.hospital.bedtracker.dto.BedEligibilityDTO;
import com.hospital.bedtracker.dto.PatientView;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.AllocationRepository;
import com.hospital.bedtracker.repository.BedRepository;
import com.hospital.bedtracker.repository.BedStatusHistoryRepository;
import com.hospital.bedtracker.repository.PatientEventRepository;
import com.hospital.bedtracker.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BedAllocationService {
    @Autowired private BedRepository bedRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private BedStatusHistoryRepository bedStatusHistoryRepository;
    @Autowired private PatientEventRepository patientEventRepository;
    @Autowired private AuditService auditService;
    @Autowired private PatientTimelineService patientTimelineService;
    @Autowired private RealtimeEventPublisher events;
    @Autowired private NotificationService notificationService;

    public Patient requirePatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
    }

    public Bed requireBed(Long bedId) {
        return bedRepository.findById(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
    }

    @Transactional(readOnly = true)
    public List<Bed> listBeds() {
        return bedRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Bed> listAvailableBeds() {
        return bedRepository.findByStatus(BedStatus.AVAILABLE);
    }

    public List<BedEligibilityDTO> checkEligibility(Long patientId) {
        Patient patient = requirePatient(patientId);
        if (allocationRepository.existsByPatientIdAndDischargeTimeIsNull(patientId)) {
            throw new IllegalStateException("Patient already has an active bed allocation");
        }
        List<BedEligibilityDTO> result = new ArrayList<>();
        for (Bed bed : bedRepository.findAll()) {
            BedEligibilityDTO dto = evaluate(patient, bed);
            result.add(dto);
        }
        result.sort(Comparator
                .comparing(BedEligibilityDTO::isEligible).reversed()
                .thenComparing(dto -> dto.getScore() == null ? Integer.MIN_VALUE : -dto.getScore())
                .thenComparing(BedEligibilityDTO::getBedNumber));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> buildEligibilityResponse(Long patientId) {
        Patient patient = requirePatient(patientId);
        List<BedEligibilityDTO> ranked = checkEligibility(patientId);
        List<Map<String, Object>> allBeds = ranked.stream().map(this::toBedMap).toList();
        List<Map<String, Object>> eligibleBeds = ranked.stream()
                .filter(BedEligibilityDTO::isEligible)
                .map(this::toBedMap)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("patientId", patientId);
        response.put("patientName", patient.getFullName());
        response.put("triageLevel", patient.getTriageLevel());
        response.put("triageCategory", patient.getTriageCategory());
        response.put("requiredBedType", patient.getRequiredBedType() == null ? null : patient.getRequiredBedType().name());
        response.put("requiredWardType", patient.getRequiredWardType());
        response.put("requirements", Map.of(
                "ventilator", patient.isRequiresVentilator(),
                "oxygen", patient.isRequiresOxygen(),
                "isolation", patient.isRequiresIsolation(),
                "dialysis", patient.isRequiresDialysis(),
                "cardiacMonitor", patient.isRequiresCardiacMonitor()));
        response.put("eligible", !eligibleBeds.isEmpty());
        if (!eligibleBeds.isEmpty()) {
            Map<String, Object> recommended = eligibleBeds.get(0);
            response.put("recommendedBed", recommended.get("bedId"));
            response.put("recommendedBedNumber", recommended.get("bedNumber"));
            response.put("reason", recommended.get("reason"));
            response.put("alternativeBeds", eligibleBeds.subList(1, Math.min(eligibleBeds.size(), 11)));
        } else {
            response.put("recommendedBed", null);
            response.put("reason", firstBlocker(ranked));
            response.put("alternativeBeds", List.of());
        }
        response.put("allBeds", allBeds);
        response.put("eligibleBedCount", eligibleBeds.size());
        return response;
    }

    private String firstBlocker(List<BedEligibilityDTO> ranked) {
        for (BedEligibilityDTO dto : ranked) {
            if (!dto.isEligible() && dto.getReason() != null
                    && !dto.getReason().startsWith("Bed status")) {
                return "No matching bed available. " + dto.getReason();
            }
        }
        return "No matching bed is currently available for this patient";
    }

    private Map<String, Object> toBedMap(BedEligibilityDTO dto) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("bedId", dto.getBedId());
        map.put("bedNumber", dto.getBedNumber());
        map.put("eligible", dto.isEligible());
        map.put("reason", dto.getReason());
        map.put("score", dto.getScore());
        map.put("scoreLabel", dto.getScoreLabel());
        map.put("bedType", dto.getBedType());
        map.put("wardType", dto.getWardType());
        map.put("wardName", dto.getWardName());
        map.put("status", dto.getStatus());
        map.put("features", dto.getFeatures());
        return map;
    }

    BedEligibilityDTO evaluate(Patient patient, Bed bed) {
        String wardType = bed.getWard() == null || bed.getWard().getWardType() == null
                ? "" : bed.getWard().getWardType().toUpperCase(Locale.ROOT);
        List<String> reasons = new ArrayList<>();
        List<String> blockers = new ArrayList<>();
        int score = 0;

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            blockers.add("Bed status is " + bed.getStatus() + ", not AVAILABLE");
        }
        if (allocationRepository.existsByBedIdAndDischargeTimeIsNull(bed.getId())) {
            blockers.add("Bed already has an active allocation");
        }

        BedType requiredType = patient.getRequiredBedType();
        if (requiredType != null && requiredType != bed.getBedType()) {
            blockers.add("Requires " + requiredType + " bed type, this bed is " + bed.getBedType());
        }

        if (patient.isRequiresVentilator() && !bed.isHasVentilator()) {
            blockers.add("Patient requires ventilator support");
        } else if (bed.isHasVentilator()) {
            score += 15;
        }

        if (patient.isRequiresOxygen() && !bed.isHasOxygen()) {
            blockers.add("Patient requires oxygen support");
        } else if (bed.isHasOxygen()) {
            score += 10;
        }

        if (patient.isRequiresIsolation() && !bed.isIsolation()) {
            blockers.add("Patient requires isolation capability");
        } else if (bed.isIsolation()) {
            score += 15;
        }

        if (patient.isRequiresDialysis() && !bed.isHasDialysis()) {
            blockers.add("Patient requires dialysis support");
        } else if (bed.isHasDialysis()) {
            score += 15;
        }

        if (patient.isRequiresCardiacMonitor() && !bed.isHasCardiacMonitor()) {
            blockers.add("Patient requires cardiac monitor");
        } else if (bed.isHasCardiacMonitor()) {
            score += 10;
        }

        String requiredWard = patient.getRequiredWardType();
        if (requiredWard != null && !requiredWard.isBlank()) {
            if (requiredWard.equalsIgnoreCase(wardType)) {
                score += 60;
                reasons.add("Ward type matches required " + requiredWard);
            } else {
                blockers.add("Requires ward type " + requiredWard + ", this is " + wardType);
            }
        } else {
            int triage = patient.getTriageLevel() == null ? 5 : patient.getTriageLevel();
            if (triage == 1) {
                if ("ICU".equals(wardType)) {
                    score += 100;
                    reasons.add("Level 1 critical patient prioritised for ICU");
                } else {
                    score -= 80;
                    blockers.add("Level 1 critical patient should be placed in ICU");
                }
            } else if (triage == 2) {
                if ("EMERGENCY".equals(wardType) || "ICU".equals(wardType) || "HDU".equals(wardType)) {
                    score += 40;
                    reasons.add("Level 2 emergency patient prioritised for acute ward");
                } else {
                    score -= 30;
                    reasons.add("General ward recommended for level 2 with monitoring");
                }
            } else {
                if ("ICU".equals(wardType)) {
                    score -= 70;
                    reasons.add("ICU bed is not recommended for a stable patient, conserving scarce capacity");
                } else {
                    score += 30;
                    reasons.add("General/emergency bed is appropriate for this patient");
                }
            }
        }

        if (bed.getWard() != null && patient.getHospital() != null && bed.getWard().getHospital() != null
                && !bed.getWard().getHospital().getId().equals(patient.getHospital().getId())) {
            blockers.add("Bed belongs to a different hospital");
        }

        boolean eligible = blockers.isEmpty();
        String reason;
        if (!eligible) {
            reason = String.join("; ", blockers);
        } else if (reasons.isEmpty()) {
            reason = "Meets all requirements and is available";
            score += 5;
        } else {
            reason = String.join("; ", reasons);
        }
        if (bed.isHasVentilator() && bed.isHasOxygen() && "ICU".equals(wardType)) {
            score += 5;
        }

        BedEligibilityDTO dto = new BedEligibilityDTO(bed.getId(), bed.getBedNumber(), eligible, reason);
        dto.setScore(score);
        dto.setBedType(bed.getBedType() == null ? null : bed.getBedType().name());
        dto.setWardType(bed.getWard() == null ? null : bed.getWard().getWardType());
        dto.setWardName(bed.getWard() == null ? null : bed.getWard().getName());
        dto.setStatus(bed.getStatus() == null ? null : bed.getStatus().name());
        dto.setFeatures(featuresOf(bed));
        dto.setScoreLabel(score >= 120 ? "RECOMMENDED" : score >= 60 ? "SUITABLE" : score >= 0 ? "ACCEPTABLE" : "POOR_MATCH");
        return dto;
    }

    private String featuresOf(Bed bed) {
        StringBuilder sb = new StringBuilder();
        if (bed.isHasVentilator()) sb.append("Ventilator, ");
        if (bed.isHasOxygen()) sb.append("Oxygen, ");
        if (bed.isHasCardiacMonitor()) sb.append("Cardiac Monitor, ");
        if (bed.isIsolation()) sb.append("Isolation, ");
        if (bed.isHasDialysis()) sb.append("Dialysis, ");
        if (bed.isHighDependency()) sb.append("High Dependency, ");
        return sb.length() == 0 ? "Basic" : sb.substring(0, sb.length() - 2);
    }

    public List<PatientView> findSuitablePatients(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is not AVAILABLE");
        }
        List<Patient> waiting = patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("WAITING_FOR_BED");
        List<PatientView> result = new ArrayList<>();
        for (Patient patient : waiting) {
            BedEligibilityDTO eval = evaluate(patient, bed);
            if (eval.isEligible()) {
                PatientView view = PatientView.from(patient);
                view.setScore(eval.getScore());
                view.setScoreLabel(eval.getScoreLabel());
                result.add(view);
            }
        }
        result.sort((a, b) -> {
            int scoreA = a.getScore() != null ? a.getScore() : 0;
            int scoreB = b.getScore() != null ? b.getScore() : 0;
            return Integer.compare(scoreB, scoreA);
        });
        return result;
    }

    @Transactional
    public Map<String, Object> allocatePatientToBed(Long patientId, Long bedId, String actor) {
        Patient patient = requirePatient(patientId);
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is no longer available");
        }
        if (allocationRepository.existsByBedIdAndDischargeTimeIsNull(bedId)) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " already has an active allocation");
        }
        if (allocationRepository.findByPatientIdAndDischargeTimeIsNull(patientId).isPresent()) {
            throw new IllegalStateException("Patient already has an active bed allocation");
        }

        BedEligibilityDTO evaluation = evaluate(patient, bed);
        if (!evaluation.isEligible()) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is not suitable: " + evaluation.getReason());
        }

        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setCurrentPatient(patient);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        bedStatusHistoryRepository.save(new BedStatusHistory(bed, oldStatus.name(), BedStatus.OCCUPIED.name(),
                "Allocation for " + patient.getFullName(), actor));

        patient.setAdmissionStatus("ADMITTED");
        patient.setAdmitted(true);
        patient.setAssignedBedNumber(bed.getBedNumber());
        patient.setAssignedWardName(bed.getWard() != null ? bed.getWard().getName() : null);
        patient.setUpdatedBy(actor);
        patient.setUpdatedAt(LocalDateTime.now());
        patientRepository.save(patient);

        patientTimelineService.addEvent(patientId, "BED_ALLOCATED",
                "Bed " + bed.getBedNumber() + " allocated to " + patient.getFullName() + ". " + evaluation.getReason(), actor);
        patientTimelineService.addEvent(patientId, "PATIENT_ADMITTED",
                "Patient " + patient.getFullName() + " admitted to bed " + bed.getBedNumber(), actor);

        Allocation allocation = new Allocation();
        allocation.setPatient(patient);
        allocation.setBed(bed);
        allocation.setAllocationTime(LocalDateTime.now());
        allocation.setAllocatedBy(actor);
        allocation.setNotes(evaluation.getReason());
        Allocation saved = allocationRepository.save(allocation);

        auditService.log(actor, "STAFF", "ALLOCATE_BED", "Bed", bed.getId(),
                oldStatus == null ? null : oldStatus.name(), BedStatus.OCCUPIED.name());
        patientTimelineService.addEvent(patientId, "ALLOCATION",
                "Bed " + bed.getBedNumber() + " allocated. " + evaluation.getReason(), actor);

        events.bedStatusChanged(bed, oldStatus, BedStatus.OCCUPIED, actor);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_ADMITTED")
                .with("patientId", patient.getId())
                .with("patientName", patient.getFullName())
                .with("bedNumber", bed.getBedNumber())
                .with("admissionStatus", patient.getAdmissionStatus()));
        events.publish(RealtimeEventPublisher.ALLOCATIONS, RealtimeEvent.of("BED_ALLOCATED")
                .with("allocationId", saved.getId())
                .with("patientId", patient.getId())
                .with("bedId", bed.getId())
                .with("bedNumber", bed.getBedNumber()));
        events.commandCenterUpdated("BED_ALLOCATED");
        notificationService.create("Bed Allocated",
                "Bed " + bed.getBedNumber() + " allocated to " + patient.getFullName(),
                "INFO", "BED_ALLOCATED");

        return Map.of("patient", patient.getFullName(), "bed", bed.getBedNumber(),
                "allocationId", saved.getId(), "message", "Bed allocated successfully");
    }

    @Transactional
    public Map<String, Object> dischargeToCleaning(Long allocationId, String actor) {
        Allocation allocation = allocationRepository.findByIdForUpdate(allocationId)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found"));
        if (allocation.getDischargeTime() != null) {
            throw new IllegalStateException("Allocation is already closed");
        }
        Bed bed = bedRepository.findByIdForUpdate(allocation.getBed().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        Patient patient = allocation.getPatient();

        if (bed.getStatus() != BedStatus.OCCUPIED) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is not occupied");
        }

        LocalDateTime now = LocalDateTime.now();
        BedStatus oldStatus = bed.getStatus();

        allocation.setDischargeTime(now);
        allocation.setDischargeBedStatus(BedStatus.CLEANING.name());
        allocationRepository.save(allocation);

        bed.setStatus(BedStatus.CLEANING);
        bed.setCurrentPatient(null);
        bed.setLastStatusChange(now);
        bedRepository.save(bed);

        bedStatusHistoryRepository.save(new BedStatusHistory(bed, oldStatus.name(), BedStatus.CLEANING.name(),
                "Discharge initiated by " + actor, actor));

        patient.setAdmitted(false);
        patient.setAdmissionStatus("DISCHARGED");
        patient.setDischargeTime(now);
        patient.setAssignedBedNumber(null);
        patient.setUpdatedAt(now);
        patientRepository.save(patient);

        patientTimelineService.addEvent(patient.getId(), "DISCHARGE",
                "Patient discharged. Bed " + bed.getBedNumber() + " moved to CLEANING.", actor);
        patientTimelineService.addEvent(patient.getId(), "BED_CLEANING",
                "Bed " + bed.getBedNumber() + " sent for cleaning.", actor);

        auditService.log("system", "SYSTEM", "BED_RELEASED", "Bed", bed.getId(), oldStatus.name(), BedStatus.CLEANING.name());
        auditService.log("system", "SYSTEM", "PATIENT_DISCHARGED", "Patient", patient.getId(), "ADMITTED", "DISCHARGED");

        events.bedStatusChanged(bed, oldStatus, BedStatus.CLEANING, actor);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_DISCHARGED")
                .with("patientId", patient.getId())
                .with("patientName", patient.getFullName())
                .with("bedNumber", bed.getBedNumber()));
        events.publish(RealtimeEventPublisher.ALLOCATIONS, RealtimeEvent.of("BED_RELEASED")
                .with("allocationId", allocation.getId())
                .with("patientId", patient.getId())
                .with("bedId", bed.getId())
                .with("bedNumber", bed.getBedNumber()));
        events.commandCenterUpdated("PATIENT_DISCHARGED");
        notificationService.create("Bed Cleaning Required",
                "Bed " + bed.getBedNumber() + " is ready for cleaning after discharge of " + patient.getFullName(),
                "INFO", "BED_CLEANING");

        return Map.of("bed", bed.getBedNumber(), "patient", patient.getFullName(),
                "message", "Patient discharged, bed moved to CLEANING");
    }

    @Transactional
    public Map<String, Object> completeCleaning(Long bedId, String actor) {
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        if (bed.getStatus() != BedStatus.CLEANING) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is not in CLEANING status");
        }
        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.AVAILABLE);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        bedStatusHistoryRepository.save(new BedStatusHistory(bed, oldStatus.name(), BedStatus.AVAILABLE.name(),
                "Cleaning completed by " + actor, actor));

        auditService.log("system", "SYSTEM", "BED_AVAILABLE", "Bed", bed.getId(), oldStatus.name(), "AVAILABLE");
        events.bedStatusChanged(bed, oldStatus, BedStatus.AVAILABLE, actor);
        events.commandCenterUpdated("BED_AVAILABLE");
        notificationService.create("Bed Available", "Bed " + bed.getBedNumber() + " is now available.", "INFO", "BED_AVAILABLE");
        return Map.of("bed", bed.getBedNumber(), "message", "Bed is now AVAILABLE");
    }

    @Transactional
    public Allocation allocateBed(Long patientId, Long bedId, String staffId) {
        Patient patient = requirePatient(patientId);
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is no longer available");
        }
        if (allocationRepository.existsByBedIdAndDischargeTimeIsNull(bedId)) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " already has an active allocation");
        }
        if (allocationRepository.findByPatientIdAndDischargeTimeIsNull(patientId).isPresent()) {
            throw new IllegalStateException("Patient already has an active bed allocation");
        }

        BedEligibilityDTO evaluation = evaluate(patient, bed);
        if (!evaluation.isEligible()) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is not suitable: " + evaluation.getReason());
        }

        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setCurrentPatient(patient);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        patient.setAdmitted(true);
        patient.setAdmissionStatus("ADMITTED");
        patient.setAssignedBedNumber(bed.getBedNumber());
        if (bed.getWard() != null) {
            patient.setAssignedWardName(bed.getWard().getName());
        }
        patient.setUpdatedBy(staffId);
        patient.setUpdatedAt(LocalDateTime.now());
        patientRepository.save(patient);

        Allocation allocation = new Allocation();
        allocation.setPatient(patient);
        allocation.setBed(bed);
        allocation.setAllocationTime(LocalDateTime.now());
        allocation.setAllocatedBy(staffId);
        allocation.setNotes(evaluation.getReason());
        Allocation saved = allocationRepository.save(allocation);

        auditService.log(staffId, "STAFF", "BED_ALLOCATED", "Bed", bed.getId(),
                oldStatus == null ? null : oldStatus.name(), BedStatus.OCCUPIED.name());
        patientTimelineService.addEvent(patientId, "ADMISSION",
                "Bed " + bed.getBedNumber() + " allocated. " + evaluation.getReason(), staffId);

        events.bedStatusChanged(bed, oldStatus, BedStatus.OCCUPIED, staffId);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_ADMITTED")
                .with("patientId", patient.getId())
                .with("patientName", patient.getFullName())
                .with("bedNumber", bed.getBedNumber())
                .with("admissionStatus", patient.getAdmissionStatus()));
        events.publish(RealtimeEventPublisher.ALLOCATIONS, RealtimeEvent.of("BED_ALLOCATED")
                .with("allocationId", saved.getId())
                .with("patientId", patient.getId())
                .with("bedId", bed.getId())
                .with("bedNumber", bed.getBedNumber()));
        events.commandCenterUpdated("BED_ALLOCATED");
        return saved;
    }

    @Transactional
    public void releaseBed(Long allocationId) {
        Allocation allocation = allocationRepository.findByIdForUpdate(allocationId)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found"));
        if (allocation.getDischargeTime() != null) {
            throw new IllegalStateException("Allocation is already closed");
        }
        Bed bed = bedRepository.findByIdForUpdate(allocation.getBed().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        Patient patient = allocation.getPatient();

        if (bed.getStatus() != BedStatus.OCCUPIED) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is not occupied, cannot discharge");
        }
        if (patient.getAdmissionStatus().equals("DISCHARGED")) {
            throw new IllegalStateException("Patient is already discharged");
        }

        LocalDateTime now = LocalDateTime.now();
        BedStatus oldStatus = bed.getStatus();

        allocation.setDischargeTime(now);
        allocation.setDischargeBedStatus(BedStatus.CLEANING.name());
        allocationRepository.save(allocation);

        bed.setStatus(BedStatus.CLEANING);
        bed.setCurrentPatient(null);
        bed.setLastStatusChange(now);
        bedRepository.save(bed);

        patient.setAdmitted(false);
        patient.setAdmissionStatus("DISCHARGED");
        patient.setDischargeTime(now);
        patient.setAssignedBedNumber(null);
        patient.setUpdatedAt(now);
        patientRepository.save(patient);

        auditService.log("system", "SYSTEM", "BED_RELEASED", "Bed", bed.getId(), oldStatus.name(), BedStatus.CLEANING.name());
        auditService.log("system", "SYSTEM", "PATIENT_DISCHARGED", "Patient", patient.getId(), "ADMITTED", "DISCHARGED");
        patientTimelineService.addEvent(patient.getId(), "DISCHARGE",
                "Patient discharged. Bed " + bed.getBedNumber() + " moved to CLEANING.", "system");
        patientTimelineService.addEvent(patient.getId(), "BED_CLEANING",
                "Bed " + bed.getBedNumber() + " sent for cleaning.", "system");

        events.bedStatusChanged(bed, oldStatus, BedStatus.CLEANING, "system");
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_DISCHARGED")
                .with("patientId", patient.getId())
                .with("patientName", patient.getFullName())
                .with("bedNumber", bed.getBedNumber()));
        events.publish(RealtimeEventPublisher.ALLOCATIONS, RealtimeEvent.of("BED_RELEASED")
                .with("allocationId", allocation.getId())
                .with("patientId", patient.getId())
                .with("bedId", bed.getId())
                .with("bedNumber", bed.getBedNumber()));
        events.commandCenterUpdated("PATIENT_DISCHARGED");
        notificationService.create("Bed Cleaning Required",
                "Bed " + bed.getBedNumber() + " is ready for cleaning after discharge of " + patient.getFullName(),
                "INFO", "BED_CLEANING");
    }

    @Transactional
    public void markAvailable(Long bedId) {
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        if (bed.getStatus() != BedStatus.CLEANING && bed.getStatus() != BedStatus.MAINTENANCE) {
            throw new IllegalStateException("Only CLEANING or MAINTENANCE beds can be marked AVAILABLE");
        }
        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.AVAILABLE);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        auditService.log("system", "SYSTEM", "BED_AVAILABLE", "Bed", bed.getId(), oldStatus.name(), "AVAILABLE");
        events.bedStatusChanged(bed, oldStatus, BedStatus.AVAILABLE, "system");
        events.commandCenterUpdated("BED_AVAILABLE");
        notificationService.create("Bed Available", "Bed " + bed.getBedNumber() + " is now available.", "INFO", "BED_AVAILABLE");
        if (bed.getCurrentPatient() != null) {
            patientTimelineService.addEvent(bed.getCurrentPatient().getId(), "BED_AVAILABLE",
                    "Bed " + bed.getBedNumber() + " returned to available pool.", "system");
        }
    }

    @Transactional
    public void changeStatus(Long bedId, BedStatus newStatus, String notes, String actor, String role) {
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        BedStatus oldStatus = bed.getStatus();
        if (oldStatus == newStatus) {
            throw new IllegalStateException("Bed is already " + newStatus);
        }
        if (oldStatus == BedStatus.OCCUPIED && newStatus != BedStatus.CLEANING) {
            throw new IllegalStateException("Occupied beds must be discharged before changing status");
        }
        if (newStatus == BedStatus.OCCUPIED) {
            throw new IllegalStateException("Use the allocation endpoint to occupy a bed");
        }
        if (newStatus == BedStatus.AVAILABLE && allocationRepository.existsByBedIdAndDischargeTimeIsNull(bedId)) {
            throw new IllegalStateException("Bed has an active allocation and cannot be made available");
        }
        bed.setStatus(newStatus);
        bed.setLastStatusChange(LocalDateTime.now());
        if (notes != null && !notes.isBlank()) {
            bed.setNotes(notes);
        }
        bedRepository.save(bed);
        auditService.log(actor, role, "BED_STATUS_CHANGED", "Bed", bed.getId(), oldStatus.name(), newStatus.name());
        events.bedStatusChanged(bed, oldStatus, newStatus, actor);
        events.commandCenterUpdated("BED_STATUS_CHANGED");
    }

    public List<Allocation> getActiveAllocationsForBed(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        return allocationRepository.findByBedIdAndDischargeTimeIsNull(bedId);
    }

    public List<BedStatusHistory> getBedHistory(Long bedId) {
        return bedStatusHistoryRepository.findByBedIdOrderByTimestampDesc(bedId);
    }
}
