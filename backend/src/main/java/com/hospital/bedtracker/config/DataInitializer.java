package com.hospital.bedtracker.config;

import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataInitializer {
    @Autowired private WardRepository wardRepository;
    @Autowired private BedRepository bedRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private HospitalRepository hospitalRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private PatientEventRepository patientEventRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AmbulanceDataSeeder ambulanceDataSeeder;
    @Autowired private PatientDataSeeder patientDataSeeder;

    @Bean
    public CommandLineRunner initData() {
        return args -> seed();
    }

    @Transactional
    public void seed() {
        Hospital hospital = hospitalRepository.findAll().stream().findFirst().orElseGet(() -> {
                    Hospital h = new Hospital("City General Hospital", "MG Road, Bengaluru");
                    h.setContact("+91-80-4000-1200");
                    h.setTotalCapacity(100);
                    h.setActive(true);
                    return hospitalRepository.save(h);
                });

        seedUsers(hospital);

        if (wardRepository.count() == 0) {
            Ward icu = ward("ICU - Critical Care", "ICU", 3, 10, hospital);
            Ward er = ward("Emergency Department", "EMERGENCY", 0, 12, hospital);
            Ward general = ward("General Ward", "GENERAL", 2, 15, hospital);
            Ward hdu = ward("HDU - High Dependency", "HDU", 3, 6, hospital);
            Ward isolation = ward("Isolation Ward", "ISOLATION", 1, 6, hospital);
            Ward pediatrics = ward("Pediatrics", "PEDIATRICS", 2, 8, hospital);
            Ward cardiology = ward("Cardiology", "CARDIOLOGY", 4, 6, hospital);
            Ward surgery = ward("Surgery", "SURGERY", 4, 8, hospital);

            int total = 0;
            total += seedBeds(icu, "ICU", BedType.ICU, 10, 6, 0, 0, 0, true, true, true, false, false, 3);
            total += seedBeds(er, "ER", BedType.EMERGENCY, 12, 8, 0, 0, 0, false, false, true, false, false, 0);
            total += seedBeds(general, "GEN", BedType.GENERAL, 15, 11, 0, 1, 3, false, false, false, false, false, 2);
            total += seedBeds(hdu, "HDU", BedType.HDU, 6, 4, 0, 0, 2, false, true, true, false, false, 3);
            total += seedBeds(isolation, "ISO", BedType.ISOLATION, 6, 4, 0, 0, 2, false, false, true, false, true, 1);
            total += seedBeds(pediatrics, "PED", BedType.GENERAL, 8, 8, 0, 0, 0, false, false, false, false, false, 2);
            total += seedBeds(cardiology, "CAR", BedType.GENERAL, 6, 4, 0, 0, 2, false, false, true, true, false, 4);
            total += seedBeds(surgery, "SUR", BedType.GENERAL, 8, 5, 0, 0, 3, false, false, false, false, false, 4);
            System.out.println("Seeded " + total + " beds across 8 wards");
        }

        seedResources();

        patientDataSeeder.seedPatients(hospital);
        patientDataSeeder.backfillRequirements(hospital);
        reconcileOccupiedBeds();

        try {
            ambulanceDataSeeder.seedAmbulances(hospital.getName());
        } catch (Exception e) {
            System.out.println("Ambulance seeder skipped: " + e.getMessage());
        }
    }

    private void seedUsers(Hospital hospital) {
        if (userRepository.count() > 0) {
            userRepository.findAll().forEach(user -> {
                if (user.getPassword() != null && !user.getPassword().startsWith("$2")) {
                    user.setPassword(passwordEncoder.encode(user.getPassword()));
                    user.setHospital(hospital);
                    user.setActive(true);
                    userRepository.save(user);
                }
            });
            return;
        }
        createUser("admin", "admin123", "ADMIN", "System Administrator", hospital);
        createUser("doctor", "doc123", "DOCTOR", "Dr. Ananya Rao", hospital);
        createUser("nurse", "nurse123", "NURSE", "Nurse Kavya Menon", hospital);
        createUser("staff", "staff123", "STAFF", "Reception Staff", hospital);
        System.out.println("Seeded 4 demo users with BCrypt hashed passwords");
    }

    private void createUser(String username, String password, String role, String fullName, Hospital hospital) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setFullName(fullName);
        user.setHospital(hospital);
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private Ward ward(String name, String type, int floor, int capacity, Hospital hospital) {
        Ward ward = new Ward(name, "Floor " + floor, type);
        ward.setFloor(floor);
        ward.setCapacity(capacity);
        ward.setHospital(hospital);
        return wardRepository.save(ward);
    }

    private int seedBeds(Ward ward, String prefix, BedType type, int count, int available,
                         int cleaning, int maintenance, int blocked,
                         boolean ventilator, boolean monitor, boolean oxygen,
                         boolean isolation, boolean dialysis, int floor) {
        int roomCount = Math.max(1, (count + 2) / 3);
        for (int i = 1; i <= count; i++) {
            Bed bed = new Bed();
            bed.setBedNumber(prefix + "-" + i);
            bed.setWard(ward);
            bed.setFloor(floor);
            bed.setRoom(prefix + "-R" + ((i - 1) / 3 + 1));
            bed.setBedType(type);
            bed.setHasVentilator(ventilator);
            bed.setHasCardiacMonitor(monitor);
            bed.setHasOxygen(oxygen);
            bed.setIsIsolation(isolation);
            bed.setHasDialysis(dialysis);
            bed.setHighDependency(type == BedType.HDU);
            bed.setLastStatusChange(LocalDateTime.now());
            StringBuilder features = new StringBuilder();
            if (ventilator) features.append("Ventilator, ");
            if (monitor) features.append("Cardiac Monitor, ");
            if (oxygen) features.append("Oxygen, ");
            if (isolation) features.append("Isolation, ");
            if (dialysis) features.append("Dialysis, ");
            bed.setFeatures(features.length() == 0 ? "Basic" : features.substring(0, features.length() - 2));
            if (i <= available) bed.setStatus(BedStatus.AVAILABLE);
            else if (i <= available + cleaning) bed.setStatus(BedStatus.CLEANING);
            else if (i <= available + cleaning + maintenance) bed.setStatus(BedStatus.MAINTENANCE);
            else if (i <= available + cleaning + maintenance + blocked) bed.setStatus(BedStatus.BLOCKED);
            else bed.setStatus(BedStatus.OCCUPIED);
            bedRepository.save(bed);
        }
        return count;
    }

    private void seedResources() {
        if (resourceRepository.count() > 0) return;
        createResource("Ventilators - ICU", ResourceCategory.VENTILATOR, 12, 4, ResourceStatus.AVAILABLE);
        createResource("Portable Ventilators", ResourceCategory.VENTILATOR, 6, 2, ResourceStatus.LOW);
        createResource("Oxygen Cylinders", ResourceCategory.OXYGEN, 40, 9, ResourceStatus.LOW);
        createResource("Cardiac Monitors", ResourceCategory.CARDIAC_MONITOR, 25, 18, ResourceStatus.AVAILABLE);
        createResource("Dialysis Machines", ResourceCategory.DIALYSIS_MACHINE, 4, 1, ResourceStatus.CRITICAL);
        createResource("PPE Kits", ResourceCategory.PPE, 200, 64, ResourceStatus.AVAILABLE);
        createResource("Isolation Kits", ResourceCategory.ISOLATION_KIT, 18, 3, ResourceStatus.LOW);
        createResource("Trauma Kits", ResourceCategory.TRAUMA_KIT, 10, 8, ResourceStatus.AVAILABLE);
        createResource("Infusion Pumps", ResourceCategory.VENTILATOR, 30, 12, ResourceStatus.AVAILABLE);
        System.out.println("Seeded 9 hospital resources");
    }

    private void createResource(String name, ResourceCategory category, int total, int available, ResourceStatus status) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setCategory(category);
        resource.setTotalQuantity(total);
        resource.setAvailableQuantity(available);
        resource.setStatus(status);
        resource.setLastUpdated(LocalDateTime.now());
        resourceRepository.save(resource);
    }

    @Transactional
    public void reconcileOccupiedBeds() {
        List<Bed> occupied = bedRepository.findByStatus(BedStatus.OCCUPIED);
        List<Allocation> allAllocations = allocationRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Allocation allocation : allAllocations) {
            if (allocation.getDischargeTime() == null
                    && (allocation.getBed() == null || allocation.getBed().getStatus() != BedStatus.OCCUPIED)) {
                allocation.setDischargeTime(now);
                allocation.setDischargedBy("system");
                allocationRepository.save(allocation);
            }
        }

        int created = 0;
        for (Bed bed : occupied) {
            boolean alreadyAllocated = allAllocations.stream()
                    .anyMatch(a -> a.getBed() != null && a.getBed().getId().equals(bed.getId())
                            && a.getDischargeTime() == null);
            if (alreadyAllocated) continue;

            Patient patient = patientRepository
                    .findByAdmissionStatusOrderByArrivalTimeDesc("WAITING_FOR_BED").stream()
                    .findFirst().orElse(null);
            if (patient == null) {
                bed.setStatus(BedStatus.AVAILABLE);
                bed.setLastStatusChange(now);
                bedRepository.save(bed);
                continue;
            }
            patient.setAdmitted(true);
            patient.setAdmissionStatus("ADMITTED");
            patient.setAssignedBedNumber(bed.getBedNumber());
            if (bed.getWard() != null) patient.setAssignedWardName(bed.getWard().getName());
            patient.setUpdatedBy("system");
            patient.setUpdatedAt(now);
            patientRepository.save(patient);
            bed.setCurrentPatient(patient);
            bed.setLastStatusChange(now);
            bedRepository.save(bed);

            Allocation allocation = new Allocation();
            allocation.setPatient(patient);
            allocation.setBed(bed);
            allocation.setAllocationTime(now.minusHours(4 + (created % 24)));
            allocation.setAllocatedBy("doctor");
            allocation.setNotes("Seeded active allocation");
            allocationRepository.save(allocation);

            PatientEvent event = new PatientEvent(patient, "ADMISSION",
                    "Admitted to " + bed.getBedNumber() + " (" + bed.getWard().getName() + ")", "system");
            patientEventRepository.save(event);
            created++;
        }
        if (created > 0) {
            System.out.println("Reconciled " + created + " occupied beds with Allocation records");
        }
        reconcileUnassignedPatients();
    }

    @Transactional
    public void reconcileUnassignedPatients() {
        List<Bed> occupiedBeds = bedRepository.findByStatus(BedStatus.OCCUPIED);
        java.util.Set<String> occupiedBedNumbers = occupiedBeds.stream()
                .map(Bed::getBedNumber)
                .collect(java.util.stream.Collectors.toSet());
        int released = 0;
        for (Patient patient : patientRepository.findAll()) {
            if (patient.getAssignedBedNumber() != null
                    && !occupiedBedNumbers.contains(patient.getAssignedBedNumber())) {
                patient.setAssignedBedNumber(null);
                patient.setAssignedWardName(null);
                patient.setAdmitted(false);
                patient.setAdmissionStatus("WAITING_FOR_BED");
                patient.setUpdatedBy("system");
                patient.setUpdatedAt(LocalDateTime.now());
                patientRepository.save(patient);
                released++;
            }
        }
        if (released > 0) {
            System.out.println("Released " + released + " patients whose beds were no longer occupied");
        }
    }
}
