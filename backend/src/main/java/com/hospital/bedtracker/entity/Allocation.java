package com.hospital.bedtracker.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Allocation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "patient_id")
    @JsonIgnore
    private Patient patient;
    @ManyToOne @JoinColumn(name = "bed_id")
    private Bed bed;
    private LocalDateTime allocationTime;
    private LocalDateTime dischargeTime;
    private String dischargeBedStatus;
    private String allocatedBy;
    private String dischargedBy;
    private String notes;

    public Allocation() {}
    public Allocation(Long id, Patient patient, Bed bed, LocalDateTime allocationTime, LocalDateTime dischargeTime, String allocatedBy, String notes) {
        this.id = id; this.patient = patient; this.bed = bed; this.allocationTime = allocationTime;
        this.dischargeTime = dischargeTime; this.allocatedBy = allocatedBy; this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public Bed getBed() { return bed; }
    public void setBed(Bed bed) { this.bed = bed; }
    public LocalDateTime getAllocationTime() { return allocationTime; }
    public void setAllocationTime(LocalDateTime allocationTime) { this.allocationTime = allocationTime; }
    public LocalDateTime getDischargeTime() { return dischargeTime; }
    public void setDischargeTime(LocalDateTime dischargeTime) { this.dischargeTime = dischargeTime; }
    public String getDischargeBedStatus() { return dischargeBedStatus; }
    public void setDischargeBedStatus(String dischargeBedStatus) { this.dischargeBedStatus = dischargeBedStatus; }
    public String getDischargedBy() { return dischargedBy; }
    public void setDischargedBy(String dischargedBy) { this.dischargedBy = dischargedBy; }
    public String getAllocatedBy() { return allocatedBy; }
    public void setAllocatedBy(String allocatedBy) { this.allocatedBy = allocatedBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
