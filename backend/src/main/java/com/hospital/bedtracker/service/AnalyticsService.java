package com.hospital.bedtracker.service;
import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    @Autowired private BedRepository bedRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private AmbulanceRepository ambulanceRepository;
    @Autowired private WardRepository wardRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics() {
        List<Bed> beds = bedRepository.findAll();
        List<Patient> patients = patientRepository.findAll();
        List<Allocation> allocations = allocationRepository.findAll();
        List<Ambulance> ambulances = ambulanceRepository.findAll();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalBeds", beds.size());
        result.put("bedStatusDistribution", bedStatusDistribution(beds));
        result.put("bedTypeDistribution", bedTypeDistribution(beds));
        result.put("triageDistribution", triageDistribution(patients));
        result.put("patientStatusDistribution", patientStatusDistribution(patients));
        result.put("wardUtilization", wardUtilization(beds));
        result.put("dailyActivity", dailyActivity(patients, allocations, ambulances));
        result.put("bedOccupancyOverTime", bedOccupancyOverTime(allocations, beds.size()));
        result.put("icuOccupancyOverTime", icuOccupancyOverTime(allocations));
        result.put("averageWaitingMinutes", averageWaitingMinutes(patients));
        result.put("averageLengthOfStayHours", averageLengthOfStayHours(allocations));
        result.put("bedTurnoverRate", bedTurnoverRate(allocations, beds.size()));
        result.put("allocationTotals", Map.of(
                "total", allocations.size(),
                "active", allocations.stream().filter(a -> a.getDischargeTime() == null).count(),
                "discharged", allocations.stream().filter(a -> a.getDischargeTime() != null).count()));
        result.put("ambulanceStatusDistribution", ambulanceStatusDistribution(ambulances));
        result.put("resourceUtilization", resourceUtilization());
        result.put("alertDistribution", alertDistribution());
        result.put("dataAvailability", dataAvailability(patients, allocations));
        result.put("generatedAt", LocalDateTime.now().toString());
        return result;
    }

    private Map<String, Long> bedStatusDistribution(List<Bed> beds) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (BedStatus status : BedStatus.values()) {
            map.put(status.name(), beds.stream().filter(b -> b.getStatus() == status).count());
        }
        return map;
    }

    private Map<String, Long> bedTypeDistribution(List<Bed> beds) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (BedType type : BedType.values()) {
            map.put(type.name(), beds.stream().filter(b -> b.getBedType() == type).count());
        }
        return map;
    }

    private Map<String, Long> triageDistribution(List<Patient> patients) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (int level = 1; level <= 5; level++) {
            final int l = level;
            map.put("LEVEL_" + l, patients.stream().filter(p -> p.getTriageLevel() != null && p.getTriageLevel() == l).count());
        }
        return map;
    }

    private Map<String, Long> patientStatusDistribution(List<Patient> patients) {
        return patients.stream()
                .filter(p -> p.getAdmissionStatus() != null)
                .collect(Collectors.groupingBy(Patient::getAdmissionStatus, LinkedHashMap::new, Collectors.counting()));
    }

    private List<Map<String, Object>> wardUtilization(List<Bed> beds) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Ward ward : wardRepository.findAll()) {
            List<Bed> wardBeds = beds.stream()
                    .filter(b -> b.getWard() != null && b.getWard().getId().equals(ward.getId())).toList();
            long total = wardBeds.size();
            long occupied = wardBeds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("wardName", ward.getName());
            item.put("wardType", ward.getWardType());
            item.put("total", total);
            item.put("occupied", occupied);
            item.put("utilization", percent(occupied, total));
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> dailyActivity(List<Patient> patients, List<Allocation> allocations, List<Ambulance> ambulances) {
        List<Map<String, Object>> days = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int offset = 13; offset >= 0; offset--) {
            LocalDate day = today.minusDays(offset);
            String label = day.format(DateTimeFormatter.ISO_LOCAL_DATE);
            long admissions = patients.stream()
                    .filter(p -> p.getArrivalTime() != null && p.getArrivalTime().toLocalDate().equals(day)).count();
            long discharges = allocations.stream()
                    .filter(a -> a.getDischargeTime() != null && a.getDischargeTime().toLocalDate().equals(day)).count();
            long ambulanceArrivals = ambulances.stream()
                    .filter(a -> a.getEta() != null && a.getEta().toLocalDate().equals(day)).count();
            long waiting = patients.stream()
                    .filter(p -> p.getArrivalTime() != null && p.getArrivalTime().toLocalDate().equals(day)
                            && p.getDischargeTime() == null && p.getAdmissionStatus() != null
                            && (p.getAdmissionStatus().equals("WAITING") || p.getAdmissionStatus().equals("WAITING_FOR_BED")
                            || p.getAdmissionStatus().equals("TRIAGE"))).count();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", label);
            row.put("admissions", admissions);
            row.put("discharges", discharges);
            row.put("ambulanceArrivals", ambulanceArrivals);
            row.put("waiting", waiting);
            days.add(row);
        }
        return days;
    }

    private List<Map<String, Object>> bedOccupancyOverTime(List<Allocation> allocations, int totalBeds) {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> points = new ArrayList<>();
        for (int offset = 13; offset >= 0; offset--) {
            LocalDate day = today.minusDays(offset);
            LocalDateTime endOfDay = day.atTime(23, 59);
            long active = allocations.stream()
                    .filter(a -> a.getAllocationTime() != null
                            && !a.getAllocationTime().isAfter(endOfDay)
                            && (a.getDischargeTime() == null || a.getDischargeTime().isAfter(endOfDay)))
                    .count();
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.format(DateTimeFormatter.ISO_LOCAL_DATE));
            point.put("occupancy", percent(active, totalBeds));
            point.put("occupiedBeds", active);
            points.add(point);
        }
        return points;
    }

    private List<Map<String, Object>> icuOccupancyOverTime(List<Allocation> allocations) {
        int icuTotal = (int) bedRepository.findAll().stream()
                .filter(b -> b.getWard() != null && "ICU".equalsIgnoreCase(b.getWard().getWardType())).count();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> points = new ArrayList<>();
        for (int offset = 13; offset >= 0; offset--) {
            LocalDate day = today.minusDays(offset);
            LocalDateTime endOfDay = day.atTime(23, 59);
            long active = allocations.stream()
                    .filter(a -> a.getAllocationTime() != null && !a.getAllocationTime().isAfter(endOfDay)
                            && (a.getDischargeTime() == null || a.getDischargeTime().isAfter(endOfDay))
                            && a.getBed() != null && a.getBed().getWard() != null
                            && "ICU".equalsIgnoreCase(a.getBed().getWard().getWardType()))
                    .count();
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.format(DateTimeFormatter.ISO_LOCAL_DATE));
            point.put("icuOccupancy", percent(active, icuTotal));
            points.add(point);
        }
        return points;
    }

    private double averageWaitingMinutes(List<Patient> patients) {
        return round(patients.stream()
                .filter(p -> p.getArrivalTime() != null)
                .filter(p -> "ADMITTED".equals(p.getAdmissionStatus()) || "UNDER_TREATMENT".equals(p.getAdmissionStatus())
                        || "DISCHARGED".equals(p.getAdmissionStatus()))
                .filter(p -> p.getArrivalTime() != null)
                .mapToLong(p -> {
                    LocalDateTime end = p.getDischargeTime() != null ? p.getDischargeTime() : p.getUpdatedAt();
                    return end == null ? 0 : java.time.Duration.between(p.getArrivalTime(), end).toMinutes();
                })
                .average().orElse(0.0));
    }

    private Double averageLengthOfStayHours(List<Allocation> allocations) {
        List<Double> stays = allocations.stream()
                .filter(a -> a.getAllocationTime() != null && a.getDischargeTime() != null)
                .map(a -> (double) java.time.Duration.between(a.getAllocationTime(), a.getDischargeTime()).toMinutes() / 60.0)
                .filter(v -> v > 0)
                .toList();
        if (stays.isEmpty()) return null;
        return round(stays.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
    }

    private Double bedTurnoverRate(List<Allocation> allocations, int totalBeds) {
        LocalDate start = LocalDate.now().minusDays(30);
        long discharged = allocations.stream()
                .filter(a -> a.getDischargeTime() != null && a.getDischargeTime().toLocalDate().isAfter(start))
                .count();
        if (totalBeds == 0) return null;
        return round((double) discharged / totalBeds);
    }

    private Map<String, Long> ambulanceStatusDistribution(List<Ambulance> ambulances) {
        return ambulances.stream()
                .filter(a -> a.getStatus() != null)
                .collect(Collectors.groupingBy(Ambulance::getStatus, LinkedHashMap::new, Collectors.counting()));
    }

    private List<Map<String, Object>> resourceUtilization() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Resource resource : resourceRepository.findAll()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", resource.getName());
            item.put("category", resource.getCategory() == null ? null : resource.getCategory().name());
            item.put("total", resource.getTotalQuantity());
            item.put("available", resource.getAvailableQuantity());
            item.put("used", resource.getUsedQuantity());
            item.put("utilization", percent(resource.getUsedQuantity(), resource.getTotalQuantity()));
            list.add(item);
        }
        return list;
    }

    private Map<String, Long> alertDistribution() {
        return notificationRepository.findAll().stream()
                .filter(n -> n.getType() != null)
                .collect(Collectors.groupingBy(Notification::getType, LinkedHashMap::new, Collectors.counting()));
    }

    private Map<String, Object> dataAvailability(List<Patient> patients, List<Allocation> allocations) {
        long admitted = patients.stream().filter(p -> p.getAdmissionStatus() != null
                && (p.getAdmissionStatus().equals("ADMITTED") || p.getAdmissionStatus().equals("UNDER_TREATMENT")
                || p.getAdmissionStatus().equals("DISCHARGED"))).count();
        long discharged = allocations.stream().filter(a -> a.getDischargeTime() != null).count();
        Map<String, Object> availability = new LinkedHashMap<>();
        availability.put("patientsWithAdmissionOutcome", admitted);
        availability.put("completedAllocations", discharged);
        availability.put("hasLengthOfStayData", discharged > 0);
        availability.put("hasTrendData", patients.stream().anyMatch(p -> p.getArrivalTime() != null
                && p.getArrivalTime().isBefore(LocalDate.now().atStartOfDay())));
        availability.put("note", discharged == 0
                ? "No completed discharges recorded yet. Length of stay and discharge trend charts will populate after patients are discharged."
                : "Charts use recorded database history only.");
        return availability;
    }

    private double percent(long part, long total) {
        return total == 0 ? 0.0 : Math.round((part * 10000.0) / total) / 100.0;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
