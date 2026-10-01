package com.hospital.bedtracker.service;
import com.hospital.bedtracker.dto.PatientView;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Demo mode. Every action routes through the real PatientService / BedAllocationService /
 * BedReservationService so the same database rows, audit entries and WebSocket events are produced
 * as manual operations. Nothing is faked in the frontend.
 */
@Service
public class SimulationService {
    private final Random random = new Random();
    private final String[] firstNames = {"Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sneha", "Arjun", "Kavya", "Neha", "Karan"};
    private final String[] lastNames = {"Sharma", "Verma", "Gupta", "Singh", "Reddy", "Patel", "Nair", "Iyer", "Khan", "Das"};

    @Autowired private PatientService patientService;
    @Autowired private BedAllocationService allocationService;
    @Autowired private BedReservationService reservationService;
    @Autowired private PatientRepository patientRepository;
    @Autowired private BedRepository bedRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private AmbulanceRepository ambulanceRepository;
    @Autowired private HospitalRepository hospitalRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private AuditService auditService;
    @Autowired private RealtimeEventPublisher events;
    @Autowired private PatientTimelineService patientTimelineService;

    @Transactional
    public Patient emergencyPatient() {
        String name = firstNames[random.nextInt(firstNames.length)] + " " + lastNames[random.nextInt(lastNames.length)];
        int triage = random.nextInt(100) < 60 ? 1 : 2;
        boolean needsVentilator = triage == 1 && random.nextBoolean();

        Patient patient = new Patient();
        patient.setFullName(name);
        patient.setGender(random.nextBoolean() ? "Male" : "Female");
        patient.setAge(18 + random.nextInt(70));
        patient.setPhoneNumber("9" + (100000000 + random.nextInt(899999999)));
        patient.setMedicalRecordNumber("MRN-" + System.currentTimeMillis());
        patient.setChiefComplaint(needsVentilator
                ? "Severe respiratory distress, requires ventilator support"
                : "Chest pain and breathlessness");
        patient.setArrivalTime(LocalDateTime.now());
        patient.setTriageLevel(triage);
        patient.setTriageCategory(triage == 1 ? "CRITICAL" : "EMERGENCY");
        patient.setAdmissionStatus("REGISTERED");
        patient.setRequiredBedType(triage == 1 ? BedType.ICU : BedType.EMERGENCY);
        patient.setRequiredWardType(triage == 1 ? "ICU" : "EMERGENCY");
        patient.setRequiresVentilator(needsVentilator);
        patient.setRequiresOxygen(true);
        patient.setSpo2(needsVentilator ? 84 + random.nextInt(5) : 90 + random.nextInt(6));
        patient.setHeartRate(100 + random.nextInt(40));
        patient.setRespiratoryRate(22 + random.nextInt(10));
        patient.setTemperature(37.0 + random.nextDouble() * 2);
        patient.setPrimaryDiagnosis("Simulated emergency presentation");
        patient.setCreatedBy("simulation");
        patient.setUpdatedBy("simulation");
        hospitalRepository.findAll().stream().findFirst().ifPresent(patient::setHospital);
        Patient saved = patientService.createPatient(patient, "simulation");

        patientTimelineService.addEvent(saved.getId(), "REGISTERED",
                "Emergency patient " + saved.getFullName() + " registered by simulation", "simulation");
        auditService.log("simulation", "SYSTEM", "PATIENT_REGISTERED", "Patient", saved.getId(), null, "REGISTERED");
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_REGISTERED")
                .with("patientId", saved.getId())
                .with("patientName", saved.getFullName())
                .with("triageLevel", triage)
                .with("admissionStatus", "REGISTERED"));
        events.commandCenterUpdated("PATIENT_REGISTERED");
        notificationService.create("Simulated Emergency Arrival",
                "Simulation registered " + triage + "-triage patient " + saved.getFullName() + ".",
                triage == 1 ? "CRITICAL" : "WARNING", "NEW_CRITICAL_PATIENT");

        patientService.applyTriage(saved.getId(), triage, "simulation");
        patientTimelineService.addEvent(saved.getId(), "TRIAGE_COMPLETED",
                "Patient " + saved.getFullName() + " triaged to level " + triage + " by simulation", "simulation");

        return saved;
    }

    @Transactional
    public Map<String, Object> occupyRandomBed() {
        List<Bed> available = bedRepository.findByStatus(BedStatus.AVAILABLE);
        for (Bed bed : available) {
            List<Patient> waiting = patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("WAITING_FOR_BED");
            for (Patient patient : waiting) {
                List<PatientView> suitable = allocationService.findSuitablePatients(bed.getId());
                if (suitable.stream().anyMatch(p -> p.getId().equals(patient.getId()))) {
                    try {
                        return allocationService.allocatePatientToBed(patient.getId(), bed.getId(), "simulation");
                    } catch (IllegalStateException e) {
                        break;
                    }
                }
            }
        }
        throw new IllegalStateException("No suitable bed available for any waiting patient");
    }

    @Transactional
    public Map<String, Object> reserveRandomBed() {
        List<Patient> waiting = patientRepository.findByAdmissionStatusOrderByArrivalTimeDesc("WAITING_FOR_BED");
        if (waiting.isEmpty()) throw new IllegalStateException("No patients waiting for a bed");
        Patient patient = waiting.get(0);
        for (var eligibility : allocationService.checkEligibility(patient.getId())) {
            if (eligibility.isEligible()) {
                BedReservation reservation = reservationService.reserve(eligibility.getBedId(), patient.getId(), "simulation");
                return Map.of("patient", patient.getFullName(), "bed", eligibility.getBedNumber(),
                        "reservationId", reservation.getId(), "message", "Simulation reserved a bed for 2 hours");
            }
        }
        throw new IllegalStateException("No suitable bed available for reservation");
    }

    @Transactional
    public Map<String, Object> dischargeRandomPatient() {
        List<Allocation> active = allocationRepository.findAll().stream()
                .filter(a -> a.getDischargeTime() == null).toList();
        if (active.isEmpty()) throw new IllegalStateException("No active allocations to discharge");
        Allocation allocation = active.get(random.nextInt(active.size()));
        String patientName = allocation.getPatient().getFullName();
        String bedNumber = allocation.getBed().getBedNumber();
        allocationService.releaseBed(allocation.getId());
        return Map.of("patient", patientName, "bed", bedNumber, "message", "Simulation discharged a patient");
    }

    @Transactional
    public Map<String, Object> startCleaningRandomBed() {
        var occupied = allocationRepository.findAll().stream()
                .filter(a -> a.getDischargeTime() != null)
                .toList();
        if (occupied.isEmpty()) throw new IllegalStateException("No recently discharged bed to clean");
        Allocation latest = occupied.stream()
                .max((a, b) -> b.getDischargeTime().compareTo(a.getDischargeTime()))
                .orElseThrow();
        Long bedId = latest.getBed().getId();
        allocationService.markAvailable(bedId);
        return Map.of("bed", latest.getBed().getBedNumber(), "message", "Simulation completed cleaning, bed is AVAILABLE");
    }

    @Transactional
    public Map<String, Object> ambulanceArrival() {
        List<Ambulance> available = ambulanceRepository.findAll().stream()
                .filter(a -> "AVAILABLE".equals(a.getStatus())).toList();
        if (available.isEmpty()) {
            Ambulance ambulance = new Ambulance();
            ambulance.setVehicleNumber("KA-SIM-" + (1000 + random.nextInt(9000)));
            ambulance.setDriverName("Simulation Driver");
            ambulance.setStatus("EN_ROUTE");
            ambulance.setCurrentLocation("Inbound, 4.5 km away");
            ambulance.setDestination("City General Hospital - Emergency");
            ambulance.setEta(LocalDateTime.now().plusMinutes(7));
            ambulance.setHospitalName("City General Hospital");
            ambulance.setLastUpdated(LocalDateTime.now());
            Ambulance saved = ambulanceRepository.save(ambulance);
            notificationService.create("Ambulance Inbound",
                    "Simulation dispatched ambulance " + saved.getVehicleNumber() + ", ETA 7 minutes.",
                    "INFO", "AMBULANCE_INCOMING");
            return Map.of("ambulance", saved.getVehicleNumber(), "status", saved.getStatus());
        }
        Ambulance ambulance = available.get(0);
        ambulance.setStatus("EN_ROUTE");
        ambulance.setCurrentLocation("Inbound, 3.0 km away");
        ambulance.setDestination("City General Hospital - Emergency");
        ambulance.setEta(LocalDateTime.now().plusMinutes(6));
        ambulance.setLastUpdated(LocalDateTime.now());
        ambulanceRepository.save(ambulance);
        events.publish(RealtimeEventPublisher.AMBULANCES, RealtimeEvent.of("AMBULANCE_UPDATED")
                .with("ambulanceId", ambulance.getId())
                .with("vehicleNumber", ambulance.getVehicleNumber())
                .with("newStatus", "EN_ROUTE"));
        notificationService.create("Ambulance Inbound",
                "Ambulance " + ambulance.getVehicleNumber() + " is en route, ETA 6 minutes.",
                "INFO", "AMBULANCE_INCOMING");
        return Map.of("ambulance", ambulance.getVehicleNumber(), "status", "EN_ROUTE");
    }
}
