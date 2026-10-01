package com.hospital.bedtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Patient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic Demographics
    private String fullName;
    private String gender;
    private Integer age;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String bloodType;
    private String medicalRecordNumber;

    // Clinical Information
    private String chiefComplaint;
    private String historyOfPresentIllness;
    private String pastMedicalHistory;
    private String surgicalHistory;
    private String familyHistory;
    private String socialHistory;
    private String allergies;
    private String currentMedications;
    private String immunizationStatus;

    // Vitals
    private Double temperature;
    private Integer heartRate;
    private Integer respiratoryRate;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Integer spo2;
    private Double weight;
    private Double height;
    private LocalDateTime vitalsRecordedAt;

    // Triage & Status
    private Integer triageLevel; // 1=CRITICAL, 2=EMERGENCY, 3=URGENT, 4=SEMI-URGENT, 5=NON-URGENT
    private String triageCategory; // CRITICAL, EMERGENCY, URGENT, SEMI-URGENT, NON-URGENT
    private LocalDateTime arrivalTime;
    private boolean isAdmitted;
    private String admissionStatus; // WAITING, TRIAGE, WAITING_FOR_BED, ADMITTED, UNDER_TREATMENT, DISCHARGED, TRANSFERRED
    private String assignedBedNumber;
    private String assignedWardName;
    private String currentSymptoms;
    private String notes;

    // Allocation requirements (used by the real eligibility algorithm)
    private BedType requiredBedType;
    private String requiredWardType;
    private Boolean requiresVentilator;
    private Boolean requiresOxygen;
    private Boolean requiresIsolation;
    private Boolean requiresDialysis;
    private Boolean requiresCardiacMonitor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_doctor_id")
    private User doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    private LocalDateTime treatmentStartTime;

    // Clinical Assessment
    private String primaryDiagnosis;
    private String secondaryDiagnoses;
    private String treatmentPlan;
    private String physicianNotes;
    private String nursingNotes;

    // Discharge
    private LocalDateTime dischargeTime;
    private String dischargeDisposition; // HOME, TRANSFERRED, EXPIRED, LEFT_AMA
    private String dischargeInstructions;
    private String followUpInstructions;

    // Audit
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    // Relationships
    @JsonIgnore
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Allocation> allocations = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<VitalSigns> vitalSignsHistory = new ArrayList<>();

    public Patient() {
        this.arrivalTime = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.isAdmitted = false;
        this.admissionStatus = "REGISTERED";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getBloodType() { return bloodType; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }

    public String getMedicalRecordNumber() { return medicalRecordNumber; }
    public void setMedicalRecordNumber(String medicalRecordNumber) { this.medicalRecordNumber = medicalRecordNumber; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getHistoryOfPresentIllness() { return historyOfPresentIllness; }
    public void setHistoryOfPresentIllness(String historyOfPresentIllness) { this.historyOfPresentIllness = historyOfPresentIllness; }

    public String getPastMedicalHistory() { return pastMedicalHistory; }
    public void setPastMedicalHistory(String pastMedicalHistory) { this.pastMedicalHistory = pastMedicalHistory; }

    public String getSurgicalHistory() { return surgicalHistory; }
    public void setSurgicalHistory(String surgicalHistory) { this.surgicalHistory = surgicalHistory; }

    public String getFamilyHistory() { return familyHistory; }
    public void setFamilyHistory(String familyHistory) { this.familyHistory = familyHistory; }

    public String getSocialHistory() { return socialHistory; }
    public void setSocialHistory(String socialHistory) { this.socialHistory = socialHistory; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }

    public String getImmunizationStatus() { return immunizationStatus; }
    public void setImmunizationStatus(String immunizationStatus) { this.immunizationStatus = immunizationStatus; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

    public Integer getRespiratoryRate() { return respiratoryRate; }
    public void setRespiratoryRate(Integer respiratoryRate) { this.respiratoryRate = respiratoryRate; }

    public Integer getSystolicBP() { return systolicBP; }
    public void setSystolicBP(Integer systolicBP) { this.systolicBP = systolicBP; }

    public Integer getDiastolicBP() { return diastolicBP; }
    public void setDiastolicBP(Integer diastolicBP) { this.diastolicBP = diastolicBP; }

    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer spo2) { this.spo2 = spo2; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }

    public LocalDateTime getVitalsRecordedAt() { return vitalsRecordedAt; }
    public void setVitalsRecordedAt(LocalDateTime vitalsRecordedAt) { this.vitalsRecordedAt = vitalsRecordedAt; }

    public Integer getTriageLevel() { return triageLevel; }
    public void setTriageLevel(Integer triageLevel) { this.triageLevel = triageLevel; }

    public String getTriageCategory() { return triageCategory; }
    public void setTriageCategory(String triageCategory) { this.triageCategory = triageCategory; }

    public LocalDateTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; }

    public boolean isAdmitted() { return isAdmitted; }
    public void setAdmitted(boolean admitted) { this.isAdmitted = admitted; }

    public String getAdmissionStatus() { return admissionStatus; }
    public void setAdmissionStatus(String admissionStatus) { this.admissionStatus = admissionStatus; }

    public String getAssignedBedNumber() { return assignedBedNumber; }
    public void setAssignedBedNumber(String assignedBedNumber) { this.assignedBedNumber = assignedBedNumber; }

    public String getAssignedWardName() { return assignedWardName; }
    public void setAssignedWardName(String assignedWardName) { this.assignedWardName = assignedWardName; }
    public String getCurrentSymptoms() { return currentSymptoms; }
    public void setCurrentSymptoms(String currentSymptoms) { this.currentSymptoms = currentSymptoms; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public BedType getRequiredBedType() { return requiredBedType; }
    public void setRequiredBedType(BedType requiredBedType) { this.requiredBedType = requiredBedType; }
    public String getRequiredWardType() { return requiredWardType; }
    public void setRequiredWardType(String requiredWardType) { this.requiredWardType = requiredWardType; }
    public boolean isRequiresVentilator() { return Boolean.TRUE.equals(requiresVentilator); }
    public void setRequiresVentilator(Boolean requiresVentilator) { this.requiresVentilator = requiresVentilator; }
    public boolean isRequiresOxygen() { return Boolean.TRUE.equals(requiresOxygen); }
    public void setRequiresOxygen(Boolean requiresOxygen) { this.requiresOxygen = requiresOxygen; }
    public boolean isRequiresIsolation() { return Boolean.TRUE.equals(requiresIsolation); }
    public void setRequiresIsolation(Boolean requiresIsolation) { this.requiresIsolation = requiresIsolation; }
    public boolean isRequiresDialysis() { return Boolean.TRUE.equals(requiresDialysis); }
    public void setRequiresDialysis(Boolean requiresDialysis) { this.requiresDialysis = requiresDialysis; }
    public boolean isRequiresCardiacMonitor() { return Boolean.TRUE.equals(requiresCardiacMonitor); }
    public void setRequiresCardiacMonitor(Boolean requiresCardiacMonitor) { this.requiresCardiacMonitor = requiresCardiacMonitor; }

    public Boolean optionalRequiresVentilator() { return requiresVentilator; }
    public Boolean optionalRequiresOxygen() { return requiresOxygen; }
    public Boolean optionalRequiresIsolation() { return requiresIsolation; }
    public Boolean optionalRequiresDialysis() { return requiresDialysis; }
    public Boolean optionalRequiresCardiacMonitor() { return requiresCardiacMonitor; }

    public void normaliseRequirements() {
        if (requiresVentilator == null) requiresVentilator = Boolean.FALSE;
        if (requiresOxygen == null) requiresOxygen = Boolean.FALSE;
        if (requiresIsolation == null) requiresIsolation = Boolean.FALSE;
        if (requiresDialysis == null) requiresDialysis = Boolean.FALSE;
        if (requiresCardiacMonitor == null) requiresCardiacMonitor = Boolean.FALSE;
    }
    public User getDoctor() { return doctor; }
    public void setDoctor(User doctor) { this.doctor = doctor; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public LocalDateTime getTreatmentStartTime() { return treatmentStartTime; }
    public void setTreatmentStartTime(LocalDateTime treatmentStartTime) { this.treatmentStartTime = treatmentStartTime; }

    public String getPrimaryDiagnosis() { return primaryDiagnosis; }
    public void setPrimaryDiagnosis(String primaryDiagnosis) { this.primaryDiagnosis = primaryDiagnosis; }

    public String getSecondaryDiagnoses() { return secondaryDiagnoses; }
    public void setSecondaryDiagnoses(String secondaryDiagnoses) { this.secondaryDiagnoses = secondaryDiagnoses; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public String getPhysicianNotes() { return physicianNotes; }
    public void setPhysicianNotes(String physicianNotes) { this.physicianNotes = physicianNotes; }

    public String getNursingNotes() { return nursingNotes; }
    public void setNursingNotes(String nursingNotes) { this.nursingNotes = nursingNotes; }

    public LocalDateTime getDischargeTime() { return dischargeTime; }
    public void setDischargeTime(LocalDateTime dischargeTime) { this.dischargeTime = dischargeTime; }

    public String getDischargeDisposition() { return dischargeDisposition; }
    public void setDischargeDisposition(String dischargeDisposition) { this.dischargeDisposition = dischargeDisposition; }

    public String getDischargeInstructions() { return dischargeInstructions; }
    public void setDischargeInstructions(String dischargeInstructions) { this.dischargeInstructions = dischargeInstructions; }

    public String getFollowUpInstructions() { return followUpInstructions; }
    public void setFollowUpInstructions(String followUpInstructions) { this.followUpInstructions = followUpInstructions; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Allocation> getAllocations() { return allocations; }
    public void setAllocations(List<Allocation> allocations) { this.allocations = allocations; }

    public List<VitalSigns> getVitalSignsHistory() { return vitalSignsHistory; }
    public void setVitalSignsHistory(List<VitalSigns> vitalSignsHistory) { this.vitalSignsHistory = vitalSignsHistory; }

    // Helper methods
    public String getBloodPressure() {
        if (systolicBP != null && diastolicBP != null) {
            return systolicBP + "/" + diastolicBP;
        }
        return "N/A";
    }

    public String getTriageLabel() {
        if (triageLevel == 1) return "CRITICAL";
        if (triageLevel == 2) return "URGENT";
        return "NORMAL";
    }

    public String getTriageColor() {
        if (triageLevel == 1) return "red";
        if (triageLevel == 2) return "orange";
        return "green";
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}