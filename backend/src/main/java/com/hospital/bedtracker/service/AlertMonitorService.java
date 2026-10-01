package com.hospital.bedtracker.service;

import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AlertMonitorService {
    private static final int WAIT_WARNING_MINUTES = 30;
    private static final int WAIT_CRITICAL_MINUTES = 60;
    private static final double ICU_THRESHOLD = 80.0;

    @Autowired private BedRepository bedRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private RealtimeEventPublisher events;

    private volatile Set<String> lastAlertKeys = Set.of();

    @Scheduled(fixedRate = 120000, initialDelay = 15000)
    @Transactional
    public void evaluate() {
        Set<String> currentKeys = new java.util.HashSet<>();
        LocalDateTime now = LocalDateTime.now();

        List<Bed> allBeds = bedRepository.findAll();
        List<Bed> icuBeds = allBeds.stream()
                .filter(b -> b.getWard() != null && "ICU".equalsIgnoreCase(b.getWard().getWardType()))
                .toList();
        long icuAvailable = icuBeds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();
        long icuTotal = icuBeds.size();
        double icuOccupancy = icuTotal == 0 ? 0 : (icuTotal - icuAvailable) * 100.0 / icuTotal;

        if (icuAvailable == 0 && icuTotal > 0) {
            String key = "NO_ICU_BEDS";
            if (isNew(key, currentKeys)) {
                notificationService.create("No ICU Beds Available",
                        "All " + icuTotal + " ICU beds are occupied, reserved, or unavailable.",
                        "CRITICAL", "NO_ICU_BEDS");
            }
        }
        if (icuOccupancy >= ICU_THRESHOLD) {
            String key = "ICU_THRESHOLD";
            if (isNew(key, currentKeys)) {
                notificationService.create("ICU Capacity Alert",
                        String.format("ICU occupancy is %.0f%%, above the %d%% threshold.", icuOccupancy, (int) ICU_THRESHOLD),
                        "CRITICAL", "ICU_CAPACITY");
            }
        }

        List<Patient> waiting = patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("WAITING_FOR_BED");
        waiting.addAll(patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("WAITING"));
        waiting.addAll(patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("TRIAGE"));

        for (Patient patient : waiting) {
            if (patient.getArrivalTime() == null) continue;
            long minutes = java.time.Duration.between(patient.getArrivalTime(), now).toMinutes();
            if (minutes >= WAIT_CRITICAL_MINUTES) {
                String key = "WAIT_60_" + patient.getId();
                if (isNew(key, currentKeys)) {
                    notificationService.create("Patient Waiting Over 60 Minutes",
                            patient.getFullName() + " (" + patient.getMedicalRecordNumber() + ") has been waiting "
                                    + minutes + " minutes for a bed.",
                            "CRITICAL", "LONG_WAIT");
                }
            } else if (minutes >= WAIT_WARNING_MINUTES) {
                String key = "WAIT_30_" + patient.getId();
                if (isNew(key, currentKeys)) {
                    notificationService.create("Patient Waiting Over 30 Minutes",
                            patient.getFullName() + " has been waiting " + minutes + " minutes for a bed.",
                            "WARNING", "LONG_WAIT");
                }
            }
            if (patient.getTriageLevel() != null && patient.getTriageLevel() == 1) {
                String key = "CRITICAL_WAIT_" + patient.getId();
                if (isNew(key, currentKeys)) {
                    notificationService.create("Critical Patient Waiting",
                            "Critical patient " + patient.getFullName() + " is waiting for a bed.",
                            "CRITICAL", "CRITICAL_WAITING");
                }
            }
        }

        for (Resource resource : resourceRepository.findAll()) {
            if (resource.isShortage()) {
                String key = "RESOURCE_" + resource.getId();
                if (isNew(key, currentKeys)) {
                    notificationService.create("Resource Shortage",
                            resource.getName() + ": only " + resource.getAvailableQuantity()
                                    + " of " + resource.getTotalQuantity() + " remaining.",
                            "WARNING", "RESOURCE_SHORTAGE");
                }
            }
        }

        long blocked = bedRepository.countByStatus(BedStatus.BLOCKED);
        if (blocked > 0) {
            String key = "BLOCKED_BEDS";
            if (isNew(key, currentKeys)) {
                notificationService.create("Beds Blocked",
                        blocked + " bed(s) are currently blocked and unavailable for allocation.",
                        "INFO", "BLOCKED_BEDS");
            }
        }

        lastAlertKeys = currentKeys;
        events.commandCenterUpdated("ALERT_MONITOR");
    }

    private boolean isNew(String key, Set<String> currentKeys) {
        if (lastAlertKeys.contains(key)) return false;
        currentKeys.add(key);
        return true;
    }
}
