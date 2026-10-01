package com.hospital.bedtracker.service;
import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CommandCenterService {
    @Autowired private BedRepository bedRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private AmbulanceRepository ambulanceRepository;
    @Autowired private WardRepository wardRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        List<Bed> beds = bedRepository.findAll();
        List<Patient> patients = patientRepository.findAll();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBeds", beds.size());
        stats.put("availableBeds", count(beds, BedStatus.AVAILABLE));
        stats.put("reservedBeds", count(beds, BedStatus.RESERVED));
        stats.put("occupiedBeds", count(beds, BedStatus.OCCUPIED));
        stats.put("cleaningBeds", count(beds, BedStatus.CLEANING));
        stats.put("maintenanceBeds", count(beds, BedStatus.MAINTENANCE));
        stats.put("blockedBeds", count(beds, BedStatus.BLOCKED));

        List<Bed> icuBeds = beds.stream()
                .filter(b -> b.getWard() != null && "ICU".equalsIgnoreCase(b.getWard().getWardType()))
                .toList();
        long icuTotal = icuBeds.size();
        long icuAvailable = icuBeds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();
        long icuOccupied = icuBeds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
        stats.put("icuTotal", icuTotal);
        stats.put("icuAvailable", icuAvailable);
        stats.put("icuOccupied", icuOccupied);
        stats.put("icuOccupancyPercentage", percentage(icuOccupied, icuTotal));

        long hduTotal = beds.stream().filter(b -> b.getWard() != null && "HDU".equalsIgnoreCase(b.getWard().getWardType())).count();
        stats.put("hduTotal", hduTotal);

        long occupied = count(beds, BedStatus.OCCUPIED);
        stats.put("occupancyPercentage", percentage(occupied, beds.size()));
        stats.put("bedUtilizationPercentage", percentage(beds.size() - count(beds, BedStatus.BLOCKED) - count(beds, BedStatus.MAINTENANCE), beds.size()));

        List<Patient> emergency = patients.stream()
                .filter(p -> p.getAdmissionStatus() != null
                        && (p.getAdmissionStatus().equals("WAITING_FOR_BED") || p.getAdmissionStatus().equals("WAITING")
                        || p.getAdmissionStatus().equals("TRIAGE")))
                .toList();
        LocalDateTime now = LocalDateTime.now();
        stats.put("totalPatients", patients.size());
        stats.put("emergencyPatients", emergency.size());
        stats.put("criticalPatients", patients.stream().filter(p -> p.getTriageLevel() != null && p.getTriageLevel() <= 2).count());
        stats.put("criticalPatientsWaiting", emergency.stream().filter(p -> p.getTriageLevel() != null && p.getTriageLevel() == 1).count());
        stats.put("patientsWaitingForBed", emergency.size());
        stats.put("patientsWaitingOver30Mins", emergency.stream().filter(p -> waitedMinutes(p, now) >= 30).count());
        stats.put("patientsWaitingOver60Mins", emergency.stream().filter(p -> waitedMinutes(p, now) >= 60).count());
        stats.put("admittedPatients", patients.stream().filter(p -> "ADMITTED".equals(p.getAdmissionStatus()) || "UNDER_TREATMENT".equals(p.getAdmissionStatus())).count());
        stats.put("underTreatmentPatients", patients.stream().filter(p -> "UNDER_TREATMENT".equals(p.getAdmissionStatus())).count());
        stats.put("dischargedToday", patients.stream().filter(p -> p.getDischargeTime() != null && p.getDischargeTime().toLocalDate().equals(now.toLocalDate())).count());

        List<Ambulance> ambulances = ambulanceRepository.findAll();
        stats.put("ambulancesIncoming", ambulances.stream().filter(a -> "EN_ROUTE".equals(a.getStatus()) || "TRANSPORTING".equals(a.getStatus())).count());
        stats.put("ambulancesArrived", ambulances.stream().filter(a -> "ARRIVED".equals(a.getStatus())).count());
        stats.put("ambulancesAvailable", ambulances.stream().filter(a -> "AVAILABLE".equals(a.getStatus())).count());
        stats.put("totalAmbulances", ambulances.size());

        stats.put("activeAllocations", allocationRepository.findAll().stream().filter(a -> a.getDischargeTime() == null).count());
        stats.put("totalAllocations", allocationRepository.count());

        List<Notification> notifications = notificationRepository.findAll();
        stats.put("unreadAlerts", notifications.stream().filter(n -> !n.isRead()).count());
        stats.put("criticalAlerts", notifications.stream().filter(n -> "CRITICAL".equals(n.getType()) && !n.isRead()).count());

        List<Resource> resources = resourceRepository.findAll();
        stats.put("resourceShortages", resources.stream().filter(Resource::isShortage).count());
        stats.put("totalResources", resources.size());

        stats.put("wardUtilization", wardUtilization(beds));
        stats.put("generatedAt", now.toString());
        return stats;
    }

    private long waitedMinutes(Patient patient, LocalDateTime now) {
        if (patient.getArrivalTime() == null) return 0;
        return java.time.Duration.between(patient.getArrivalTime(), now).toMinutes();
    }

    private List<Map<String, Object>> wardUtilization(List<Bed> beds) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Ward ward : wardRepository.findAll()) {
            List<Bed> wardBeds = beds.stream().filter(b -> b.getWard() != null && b.getWard().getId().equals(ward.getId())).toList();
            long total = wardBeds.size();
            long occupied = wardBeds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
            long available = wardBeds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("wardId", ward.getId());
            item.put("wardName", ward.getName());
            item.put("wardType", ward.getWardType());
            item.put("floor", ward.getFloor());
            item.put("total", total);
            item.put("occupied", occupied);
            item.put("available", available);
            item.put("reserved", wardBeds.stream().filter(b -> b.getStatus() == BedStatus.RESERVED).count());
            item.put("cleaning", wardBeds.stream().filter(b -> b.getStatus() == BedStatus.CLEANING).count());
            item.put("occupancy", percentage(occupied, total));
            result.add(item);
        }
        result.sort(Comparator.comparingDouble(m -> -((Number) m.get("occupancy")).doubleValue()));
        return result;
    }

    private long count(List<Bed> beds, BedStatus status) {
        return beds.stream().filter(b -> b.getStatus() == status).count();
    }

    private double percentage(long part, long total) {
        return total == 0 ? 0.0 : Math.round((part * 10000.0) / total) / 100.0;
    }
}
