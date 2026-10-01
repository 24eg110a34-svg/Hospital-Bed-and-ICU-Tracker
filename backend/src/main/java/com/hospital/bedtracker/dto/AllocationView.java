package com.hospital.bedtracker.dto;

import com.hospital.bedtracker.entity.Allocation;
import java.time.LocalDateTime;

public class AllocationView {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientMrn;
    private Integer triageLevel;
    private Long bedId;
    private String bedNumber;
    private String wardName;
    private String bedType;
    private LocalDateTime allocationTime;
    private LocalDateTime dischargeTime;
    private String dischargeBedStatus;
    private String allocatedBy;
    private String notes;
    private String status;
    private Long lengthOfStayMinutes;

    public static AllocationView from(Allocation allocation) {
        AllocationView view = new AllocationView();
        view.id = allocation.getId();
        view.patientId = allocation.getPatient() == null ? null : allocation.getPatient().getId();
        view.patientName = allocation.getPatient() == null ? null : allocation.getPatient().getFullName();
        view.patientMrn = allocation.getPatient() == null ? null : allocation.getPatient().getMedicalRecordNumber();
        view.triageLevel = allocation.getPatient() == null ? null : allocation.getPatient().getTriageLevel();
        view.bedId = allocation.getBed() == null ? null : allocation.getBed().getId();
        view.bedNumber = allocation.getBed() == null ? null : allocation.getBed().getBedNumber();
        view.wardName = allocation.getBed() == null || allocation.getBed().getWard() == null
                ? null : allocation.getBed().getWard().getName();
        view.bedType = allocation.getBed() == null || allocation.getBed().getBedType() == null
                ? null : allocation.getBed().getBedType().name();
        view.allocationTime = allocation.getAllocationTime();
        view.dischargeTime = allocation.getDischargeTime();
        view.dischargeBedStatus = allocation.getDischargeBedStatus();
        view.allocatedBy = allocation.getAllocatedBy();
        view.notes = allocation.getNotes();
        view.status = allocation.getDischargeTime() == null ? "ACTIVE" : "DISCHARGED";
        if (allocation.getAllocationTime() != null) {
            LocalDateTime end = allocation.getDischargeTime() == null ? LocalDateTime.now() : allocation.getDischargeTime();
            view.lengthOfStayMinutes = java.time.Duration.between(allocation.getAllocationTime(), end).toMinutes();
        }
        return view;
    }

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public String getPatientName() { return patientName; }
    public String getPatientMrn() { return patientMrn; }
    public Integer getTriageLevel() { return triageLevel; }
    public Long getBedId() { return bedId; }
    public String getBedNumber() { return bedNumber; }
    public String getWardName() { return wardName; }
    public String getBedType() { return bedType; }
    public LocalDateTime getAllocationTime() { return allocationTime; }
    public LocalDateTime getDischargeTime() { return dischargeTime; }
    public String getDischargeBedStatus() { return dischargeBedStatus; }
    public String getAllocatedBy() { return allocatedBy; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public Long getLengthOfStayMinutes() { return lengthOfStayMinutes; }
}
