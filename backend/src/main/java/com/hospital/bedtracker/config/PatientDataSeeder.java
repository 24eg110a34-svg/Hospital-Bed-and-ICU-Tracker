package com.hospital.bedtracker.config;

import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.PatientEventRepository;
import com.hospital.bedtracker.repository.PatientRepository;
import com.hospital.bedtracker.repository.VitalSignsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class PatientDataSeeder {
    @Autowired private PatientRepository patientRepository;
    @Autowired private PatientEventRepository patientEventRepository;
    @Autowired private VitalSignsRepository vitalSignsRepository;

    public void seedPatients(Hospital hospital) {
        if (patientRepository.count() > 0) {
            attachHospitalToExisting(hospital);
            return;
        }
        create(hospital, "Aarav Mehta", "Male", 67, "A+", "9876543210", "Chest pain, severe breathlessness, sweating", 1,
                BedType.ICU, "ICU", true, true, false, false, true, 88, 112, 24, "Acute Coronary Syndrome", "system");
        create(hospital, "Priya Sharma", "Female", 34, "O+", "9876543211", "High fever with chills and body ache", 2,
                BedType.EMERGENCY, "EMERGENCY", false, true, false, false, false, 94, 98, 22, "Viral fever with dehydration", "system");
        create(hospital, "Rohan Verma", "Male", 45, "B+", "9876543212", "Road traffic accident, head injury, unconscious", 1,
                BedType.ICU, "ICU", true, true, false, false, true, 86, 128, 20, "Moderate traumatic brain injury", "system");
        create(hospital, "Ananya Gupta", "Female", 28, "AB+", "9876543213", "Severe abdominal pain with vomiting", 2,
                BedType.EMERGENCY, "EMERGENCY", false, false, false, false, false, 96, 102, 20, "Acute pancreatitis", "system");
        create(hospital, "Vikram Singh", "Male", 52, "O-", "9876543214", "Breathlessness, wheezing, chest tightness", 2,
                BedType.HDU, "HDU", false, true, true, false, true, 90, 126, 26, "COPD exacerbation", "system");
        create(hospital, "Sneha Reddy", "Female", 41, "A-", "9876543215", "Palpitations and chest discomfort", 3,
                BedType.GENERAL, "CARDIOLOGY", false, false, false, false, true, 97, 105, 19, "Atrial fibrillation", "system");
        create(hospital, "Arjun Patel", "Male", 38, "B-", "9876543216", "High-grade fever with rash and joint pain", 3,
                BedType.ISOLATION, "ISOLATION", false, true, false, true, false, 96, 92, 20, "Dengue fever with warning signs", "system");
        create(hospital, "Kavya Nair", "Female", 29, "O+", "9876543217", "Active labour, full term pregnancy", 1,
                BedType.EMERGENCY, "EMERGENCY", false, true, false, false, true, 98, 108, 18, "Active labour", "system");
        create(hospital, "Mohammed Ali", "Male", 60, "AB-", "9876543218", "Sudden right-side weakness, slurred speech", 1,
                BedType.ICU, "ICU", false, true, false, false, true, 95, 78, 16, "Acute ischemic stroke", "system");
        create(hospital, "Divya Krishnan", "Female", 47, "B+", "9876543219", "Persistent cough with blood in sputum", 3,
                BedType.ISOLATION, "ISOLATION", false, true, false, true, false, 93, 84, 22, "Suspected pulmonary TB relapse", "system");
        create(hospital, "Suresh Kumar", "Male", 55, "A+", "9876543220", "Severe lower back pain radiating to leg", 5,
                BedType.GENERAL, "GENERAL", false, false, false, false, false, 98, 72, 16, "Lumbar radiculopathy", "system");
        create(hospital, "Meera Desai", "Female", 62, "O+", "9876543221", "Confusion, fever, burning urination", 2,
                BedType.EMERGENCY, "EMERGENCY", false, true, false, false, false, 96, 98, 20, "Urosepsis", "system");
        create(hospital, "Aditya Joshi", "Male", 24, "A-", "9876543222", "Severe acute asthma attack", 2,
                BedType.HDU, "HDU", false, true, true, false, true, 89, 118, 28, "Severe bronchospasm with hypoxia", "system");
        create(hospital, "Pooja Malhotra", "Female", 31, "B+", "9876543223", "Vomiting, loose stools, dehydration", 4,
                BedType.GENERAL, "GENERAL", false, false, false, false, false, 98, 88, 18, "Acute gastroenteritis", "system");
        create(hospital, "Rajesh Khanna", "Male", 70, "O-", "9876543224", "Fall at home, hip pain, cannot walk", 3,
                BedType.GENERAL, "SURGERY", false, true, false, false, false, 97, 80, 16, "Fracture neck of femur", "system");
        create(hospital, "Neha Singh", "Female", 26, "AB+", "9876543225", "High fever, severe headache, neck stiffness", 1,
                BedType.ISOLATION, "ISOLATION", false, true, false, true, false, 98, 102, 18, "Suspected meningitis", "system");
        create(hospital, "Amitabh Rao", "Male", 48, "A+", "9876543226", "Epigastric pain with vomiting blood", 1,
                BedType.ICU, "ICU", true, true, false, false, true, 92, 108, 20, "Upper gastrointestinal bleed", "system");
        create(hospital, "Sunita Yadav", "Female", 53, "B-", "9876543227", "Leg swelling, reduced urine, breathlessness", 2,
                BedType.GENERAL, "GENERAL", false, true, false, false, true, 94, 88, 22, "CKD with fluid overload", "system");
        create(hospital, "Karan Kapoor", "Male", 19, "O+", "9876543228", "Sports injury, knee swelling and pain", 5,
                BedType.GENERAL, "PEDIATRICS", false, false, false, false, false, 99, 68, 16, "ACL tear", "system");
        create(hospital, "Lakshmi Pillai", "Female", 58, "A-", "9876543229", "Chest pain radiating to arm with sweating", 1,
                BedType.ICU, "ICU", true, true, false, false, true, 93, 96, 19, "Acute myocardial infarction", "system");
        create(hospital, "George Mathew", "Male", 66, "O+", "9876543230", "Post-dialysis weakness, nausea", 3,
                BedType.GENERAL, "GENERAL", false, true, false, false, true, 95, 82, 18, "Post-dialysis observation", "system");
        create(hospital, "Tanvi Joshi", "Female", 42, "B+", "9876543231", "Severe tooth infection with facial swelling", 4,
                BedType.GENERAL, "GENERAL", false, false, false, false, false, 99, 90, 17, "Dental abscess", "system");
        System.out.println("Seeded 22 patients with explicit allocation requirements");
    }

    private void attachHospitalToExisting(Hospital hospital) {
        patientRepository.findAll().forEach(patient -> {
            if (patient.getHospital() == null) {
                patient.setHospital(hospital);
                patientRepository.save(patient);
            }
        });
    }

    /**
     * Rows created by older versions of the seeder have no allocation requirements, which would make
     * the eligibility algorithm treat them as "no special requirements". Backfill a sensible default
     * from the triage level so every patient is allocatable.
     */
    public void backfillRequirements(Hospital hospital) {
        int updated = 0;
        for (Patient patient : patientRepository.findAll()) {
            boolean changed = false;
            if (patient.getHospital() == null) {
                patient.setHospital(hospital);
                changed = true;
            }
            if (patient.getTriageLevel() != null && patient.getTriageCategory() == null) {
                patient.setTriageCategory(categoryFor(patient.getTriageLevel()));
                changed = true;
            }
            if (patient.getTriageLevel() != null) {
                int level = patient.getTriageLevel();
                if (level <= 2) {
                    if (patient.getRequiredBedType() == null) {
                        patient.setRequiredBedType(level == 1 ? BedType.ICU : BedType.EMERGENCY);
                        changed = true;
                    }
                    if (patient.getRequiredWardType() == null) {
                        patient.setRequiredWardType(level == 1 ? "ICU" : "EMERGENCY");
                        changed = true;
                    }
                } else if (patient.getRequiredBedType() == null) {
                    patient.setRequiredBedType(BedType.GENERAL);
                    changed = true;
                }
            }
            if (patient.getCurrentSymptoms() == null && patient.getChiefComplaint() != null) {
                patient.setCurrentSymptoms(patient.getChiefComplaint());
                changed = true;
            }
            if (patient.getAdmissionStatus() == null || patient.getAdmissionStatus().isBlank()) {
                patient.setAdmissionStatus(patient.isAdmitted() ? "ADMITTED" : "WAITING_FOR_BED");
                changed = true;
            }
            if (changed) {
                patientRepository.save(patient);
                updated++;
            }
        }
        if (updated > 0) {
            System.out.println("Backfilled allocation requirements on " + updated + " existing patients");
        }
    }

    private void create(Hospital hospital, String name, String gender, int age, String bloodType, String phone,
                        String complaint, int triageLevel, BedType requiredBedType, String requiredWardType,
                        boolean requiresVentilator, boolean requiresOxygen, boolean requiresCardiacMonitor,
                        boolean requiresIsolation, boolean requiresDialysis, int spo2, int heartRate,
                        int respiratoryRate, String diagnosis, String createdBy) {
        Patient patient = new Patient();
        patient.setFullName(name);
        patient.setGender(gender);
        patient.setAge(age);
        patient.setDateOfBirth(java.time.LocalDate.now().minusYears(age).minusMonths(1 + (int) (Math.random() * 11)));
        patient.setPhoneNumber(phone);
        patient.setEmail(name.toLowerCase().replace(" ", ".") + "@example.com");
        patient.setAddress((100 + (int) (Math.random() * 900)) + " MG Road, Bengaluru - 560001");
        patient.setEmergencyContactName(gender.equals("Male") ? "Sunita " + name.split(" ")[1] : "Rajesh " + name.split(" ")[1]);
        patient.setEmergencyContactPhone("98" + (10000000 + (int) (Math.random() * 89999999)));
        patient.setBloodType(bloodType);
        patient.setMedicalRecordNumber("MRN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        patient.setChiefComplaint(complaint);
        patient.setHistoryOfPresentIllness(complaint + ". Onset " + (1 + (int) (Math.random() * 12)) + " hours ago.");
        patient.setPastMedicalHistory("Nil significant");
        patient.setSurgicalHistory("None");
        patient.setFamilyHistory("None reported");
        patient.setSocialHistory("Non-smoker");
        patient.setAllergies("None known");
        patient.setCurrentMedications("As per clinical record");
        patient.setImmunizationStatus("Up to date");
        patient.setTemperature(36.5 + (Math.random() * 3));
        patient.setHeartRate(heartRate);
        patient.setRespiratoryRate(respiratoryRate);
        patient.setSystolicBP(90 + (int) (Math.random() * 80));
        patient.setDiastolicBP(55 + (int) (Math.random() * 45));
        patient.setSpo2(spo2);
        patient.setWeight(45 + Math.random() * 40);
        patient.setHeight(150 + Math.random() * 30);
        patient.setVitalsRecordedAt(LocalDateTime.now());
        patient.setTriageLevel(triageLevel);
        patient.setTriageCategory(categoryFor(triageLevel));
        patient.setArrivalTime(LocalDateTime.now().minusMinutes(10 + (int) (Math.random() * 300)));
        patient.setAdmitted(false);
        patient.setAdmissionStatus("WAITING_FOR_BED");
        patient.setRequiredBedType(requiredBedType);
        patient.setRequiredWardType(requiredWardType);
        patient.setRequiresVentilator(requiresVentilator);
        patient.setRequiresOxygen(requiresOxygen);
        patient.setRequiresCardiacMonitor(requiresCardiacMonitor);
        patient.setRequiresIsolation(requiresIsolation);
        patient.setRequiresDialysis(requiresDialysis);
        patient.setPrimaryDiagnosis(diagnosis);
        patient.setSecondaryDiagnoses("Under evaluation");
        patient.setTreatmentPlan("Per protocol: triage, bed allocation, treatment");
        patient.setPhysicianNotes("Patient examined. Triage level " + triageLevel + ".");
        patient.setNursingNotes("IV access secured, vitals monitored.");
        patient.setCreatedBy(createdBy);
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedBy(createdBy);
        patient.setUpdatedAt(LocalDateTime.now());
        patient.setHospital(hospital);
        Patient saved = patientRepository.save(patient);

        PatientEvent event = new PatientEvent(saved, "REGISTERED", "Patient registered at emergency", createdBy);
        patientEventRepository.save(event);
        PatientEvent triageEvent = new PatientEvent(saved, "TRIAGE",
                "Triage level " + triageLevel + " (" + categoryFor(triageLevel) + ") assigned", createdBy);
        patientEventRepository.save(triageEvent);
    }

    private String categoryFor(int level) {
        return switch (level) {
            case 1 -> "CRITICAL";
            case 2 -> "EMERGENCY";
            case 3 -> "URGENT";
            case 4 -> "SEMI-URGENT";
            default -> "NON-URGENT";
        };
    }
}
