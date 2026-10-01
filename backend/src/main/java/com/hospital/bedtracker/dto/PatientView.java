package com.hospital.bedtracker.dto;

import com.hospital.bedtracker.entity.Patient;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PatientView {
    private Long id;
    private String medicalRecordNumber;
    private String fullName;
    private Integer age;
    private String gender;
    private String phoneNumber;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String bloodType;
    private String chiefComplaint;
    private String currentSymptoms;
    private String pastMedicalHistory;
    private String allergies;
    private String notes;
    private Double temperature;
    private Integer heartRate;
    private Integer respiratoryRate;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Integer spo2;
    private Integer triageLevel;
    private String triageCategory;
    private LocalDateTime arrivalTime;
    private String admissionStatus;
    private String assignedBedNumber;
    private String assignedWardName;
    private String requiredBedType;
    private String requiredWardType;
    private boolean requiresVentilator;
    private boolean requiresOxygen;
    private boolean requiresIsolation;
    private boolean requiresDialysis;
    private boolean requiresCardiacMonitor;
    private String doctorName;
    private String hospitalName;
    private Long hospitalId;
    private LocalDateTime treatmentStartTime;
    private LocalDateTime dischargeTime;
    private LocalDateTime createdAt;
    private Long waitingMinutes;
    private String requiredEquipmentSummary;
    private Integer score;
    private String scoreLabel;

    public static PatientView from(Patient patient) {
        PatientView view = new PatientView();
        view.id = patient.getId();
        view.medicalRecordNumber = patient.getMedicalRecordNumber();
        view.fullName = patient.getFullName();
        view.age = patient.getAge();
        view.gender = patient.getGender();
        view.phoneNumber = patient.getPhoneNumber();
        view.email = patient.getEmail();
        view.address = patient.getAddress();
        view.emergencyContactName = patient.getEmergencyContactName();
        view.emergencyContactPhone = patient.getEmergencyContactPhone();
        view.bloodType = patient.getBloodType();
        view.chiefComplaint = patient.getChiefComplaint();
        view.currentSymptoms = patient.getCurrentSymptoms();
        view.pastMedicalHistory = patient.getPastMedicalHistory();
        view.allergies = patient.getAllergies();
        view.notes = patient.getNotes();
        view.temperature = patient.getTemperature();
        view.heartRate = patient.getHeartRate();
        view.respiratoryRate = patient.getRespiratoryRate();
        view.systolicBP = patient.getSystolicBP();
        view.diastolicBP = patient.getDiastolicBP();
        view.spo2 = patient.getSpo2();
        view.triageLevel = patient.getTriageLevel();
        view.triageCategory = patient.getTriageCategory();
        view.arrivalTime = patient.getArrivalTime();
        view.admissionStatus = patient.getAdmissionStatus();
        view.assignedBedNumber = patient.getAssignedBedNumber();
        view.assignedWardName = patient.getAssignedWardName();
        view.requiredBedType = patient.getRequiredBedType() == null ? null : patient.getRequiredBedType().name();
        view.requiredWardType = patient.getRequiredWardType();
        view.requiresVentilator = patient.isRequiresVentilator();
        view.requiresOxygen = patient.isRequiresOxygen();
        view.requiresIsolation = patient.isRequiresIsolation();
        view.requiresDialysis = patient.isRequiresDialysis();
        view.requiresCardiacMonitor = patient.isRequiresCardiacMonitor();
        view.doctorName = patient.getDoctor() == null ? null : patient.getDoctor().getFullName();
        view.hospitalName = patient.getHospital() == null ? null : patient.getHospital().getName();
        view.hospitalId = patient.getHospital() == null ? null : patient.getHospital().getId();
        view.treatmentStartTime = patient.getTreatmentStartTime();
        view.dischargeTime = patient.getDischargeTime();
        view.createdAt = patient.getCreatedAt();
        if (patient.getArrivalTime() != null) {
            LocalDateTime end = patient.getDischargeTime() != null ? patient.getDischargeTime() : LocalDateTime.now();
            view.waitingMinutes = java.time.Duration.between(patient.getArrivalTime(), end).toMinutes();
        }
        StringBuilder equipment = new StringBuilder();
        if (patient.isRequiresVentilator()) equipment.append("Ventilator, ");
        if (patient.isRequiresOxygen()) equipment.append("Oxygen, ");
        if (patient.isRequiresCardiacMonitor()) equipment.append("Cardiac Monitor, ");
        if (patient.isRequiresIsolation()) equipment.append("Isolation, ");
        if (patient.isRequiresDialysis()) equipment.append("Dialysis, ");
        view.requiredEquipmentSummary = equipment.length() == 0 ? "Basic" : equipment.substring(0, equipment.length() - 2);
        return view;
    }

    public Long getId() { return id; }
    public String getMedicalRecordNumber() { return medicalRecordNumber; }
    public String getFullName() { return fullName; }
    public Integer getAge() { return age; }
    public String getGender() { return gender; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public String getBloodType() { return bloodType; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getCurrentSymptoms() { return currentSymptoms; }
    public String getPastMedicalHistory() { return pastMedicalHistory; }
    public String getAllergies() { return allergies; }
    public String getNotes() { return notes; }
    public Double getTemperature() { return temperature; }
    public Integer getHeartRate() { return heartRate; }
    public Integer getRespiratoryRate() { return respiratoryRate; }
    public Integer getSystolicBP() { return systolicBP; }
    public Integer getDiastolicBP() { return diastolicBP; }
    public Integer getSpo2() { return spo2; }
    public Integer getTriageLevel() { return triageLevel; }
    public String getTriageCategory() { return triageCategory; }
    public LocalDateTime getArrivalTime() { return arrivalTime; }
    public String getAdmissionStatus() { return admissionStatus; }
    public String getAssignedBedNumber() { return assignedBedNumber; }
    public String getAssignedWardName() { return assignedWardName; }
    public String getRequiredBedType() { return requiredBedType; }
    public String getRequiredWardType() { return requiredWardType; }
    public boolean isRequiresVentilator() { return requiresVentilator; }
    public boolean isRequiresOxygen() { return requiresOxygen; }
    public boolean isRequiresIsolation() { return requiresIsolation; }
    public boolean isRequiresDialysis() { return requiresDialysis; }
    public boolean isRequiresCardiacMonitor() { return requiresCardiacMonitor; }
    public String getDoctorName() { return doctorName; }
    public String getHospitalName() { return hospitalName; }
    public Long getHospitalId() { return hospitalId; }
    public LocalDateTime getTreatmentStartTime() { return treatmentStartTime; }
    public LocalDateTime getDischargeTime() { return dischargeTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getWaitingMinutes() { return waitingMinutes; }
    public String getRequiredEquipmentSummary() { return requiredEquipmentSummary; }
    public Integer getScore() { return score; }
    public void setScore(Integer v) { this.score = v; }
    public String getScoreLabel() { return scoreLabel; }
    public void setScoreLabel(String v) { this.scoreLabel = v; }
}
