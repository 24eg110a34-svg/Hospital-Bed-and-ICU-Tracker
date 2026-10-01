package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "beds")
public class Bed {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String bedNumber;
    @Enumerated(EnumType.STRING)
    private BedStatus status;
    @ManyToOne @JoinColumn(name = "ward_id")
    private Ward ward;
    private Integer floor;
    private String room;
    private boolean hasVentilator;
    private boolean hasCardiacMonitor;
    private boolean hasOxygen;
    private boolean isHighDependency;
    private boolean isIsolation;
    private boolean hasDialysis;

    @Enumerated(EnumType.STRING)
    private BedType bedType = BedType.GENERAL;

    private String features;
    private String notes;
    private LocalDateTime lastStatusChange = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "current_patient_id")
    private Patient currentPatient;

    @Version
    private Long version;

    public Bed() {}
    public Bed(Long id, String bedNumber, BedStatus status, Ward ward, Integer floor, String room, boolean hasVentilator, boolean hasCardiacMonitor, boolean hasOxygen, boolean isHighDependency, boolean isIsolation) {
        this.id = id; this.bedNumber = bedNumber; this.status = status; this.ward = ward;
        this.floor = floor; this.room = room; this.hasVentilator = hasVentilator;
        this.hasCardiacMonitor = hasCardiacMonitor; this.hasOxygen = hasOxygen;
        this.isHighDependency = isHighDependency; this.isIsolation = isIsolation;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }
    public BedStatus getStatus() { return status; }
    public void setStatus(BedStatus status) { this.status = status; }
    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }
    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public boolean isHasVentilator() { return hasVentilator; }
    public void setHasVentilator(boolean hasVentilator) { this.hasVentilator = hasVentilator; }
    public boolean isHasCardiacMonitor() { return hasCardiacMonitor; }
    public void setHasCardiacMonitor(boolean hasCardiacMonitor) { this.hasCardiacMonitor = hasCardiacMonitor; }
    public boolean isHasOxygen() { return hasOxygen; }
    public void setHasOxygen(boolean hasOxygen) { this.hasOxygen = hasOxygen; }
    public boolean isHighDependency() { return isHighDependency; }
    public void setHighDependency(boolean highDependency) { this.isHighDependency = highDependency; }
    public boolean isIsolation() { return isIsolation; }
    public void setIsIsolation(boolean isolation) { isIsolation = isolation; }
    public boolean isHasDialysis() { return hasDialysis; }
    public void setHasDialysis(boolean hasDialysis) { this.hasDialysis = hasDialysis; }
    public BedType getBedType() { return bedType; }
    public void setBedType(BedType bedType) { this.bedType = bedType; }
    public String getFeatures() { return features; }
    public void setFeatures(String f) { this.features=f; }
    public String getNotes() { return notes; }
    public void setNotes(String n) { this.notes=n; }
    public LocalDateTime getLastStatusChange() { return lastStatusChange; }
    public void setLastStatusChange(LocalDateTime t) { this.lastStatusChange=t; }
    public Patient getCurrentPatient() { return currentPatient; }
    public void setCurrentPatient(Patient p) { this.currentPatient=p; }
    public Long getVersion() { return version; }
    public void setVersion(Long v) { this.version=v; }
}
