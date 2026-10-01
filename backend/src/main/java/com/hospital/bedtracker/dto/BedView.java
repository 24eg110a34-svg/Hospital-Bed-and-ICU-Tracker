package com.hospital.bedtracker.dto;

import com.hospital.bedtracker.entity.Bed;
import java.time.LocalDateTime;

public class BedView {
    private Long id;
    private String bedNumber;
    private String status;
    private String bedType;
    private Integer floor;
    private String room;
    private String features;
    private String notes;
    private LocalDateTime lastStatusChange;
    private boolean hasVentilator;
    private boolean hasCardiacMonitor;
    private boolean hasOxygen;
    private boolean highDependency;
    private boolean isolation;
    private boolean hasDialysis;
    private Long wardId;
    private String wardName;
    private String wardType;
    private Integer wardFloor;
    private Long hospitalId;
    private String hospitalName;
    private Long currentPatientId;
    private String currentPatientName;
    private Integer currentPatientTriageLevel;

    public static BedView from(Bed bed) {
        BedView view = new BedView();
        view.id = bed.getId();
        view.bedNumber = bed.getBedNumber();
        view.status = bed.getStatus() == null ? null : bed.getStatus().name();
        view.bedType = bed.getBedType() == null ? null : bed.getBedType().name();
        view.floor = bed.getFloor();
        view.room = bed.getRoom();
        view.features = bed.getFeatures();
        view.notes = bed.getNotes();
        view.lastStatusChange = bed.getLastStatusChange();
        view.hasVentilator = bed.isHasVentilator();
        view.hasCardiacMonitor = bed.isHasCardiacMonitor();
        view.hasOxygen = bed.isHasOxygen();
        view.highDependency = bed.isHighDependency();
        view.isolation = bed.isIsolation();
        view.hasDialysis = bed.isHasDialysis();
        if (bed.getWard() != null) {
            view.wardId = bed.getWard().getId();
            view.wardName = bed.getWard().getName();
            view.wardType = bed.getWard().getWardType();
            view.wardFloor = bed.getWard().getFloor();
            if (bed.getWard().getHospital() != null) {
                view.hospitalId = bed.getWard().getHospital().getId();
                view.hospitalName = bed.getWard().getHospital().getName();
            }
        }
        if (bed.getCurrentPatient() != null) {
            view.currentPatientId = bed.getCurrentPatient().getId();
            view.currentPatientName = bed.getCurrentPatient().getFullName();
            view.currentPatientTriageLevel = bed.getCurrentPatient().getTriageLevel();
        }
        return view;
    }

    public Long getId() { return id; }
    public String getBedNumber() { return bedNumber; }
    public String getStatus() { return status; }
    public String getBedType() { return bedType; }
    public Integer getFloor() { return floor; }
    public String getRoom() { return room; }
    public String getFeatures() { return features; }
    public String getNotes() { return notes; }
    public LocalDateTime getLastStatusChange() { return lastStatusChange; }
    public boolean isHasVentilator() { return hasVentilator; }
    public boolean isHasCardiacMonitor() { return hasCardiacMonitor; }
    public boolean isHasOxygen() { return hasOxygen; }
    public boolean isHighDependency() { return highDependency; }
    public boolean isIsolation() { return isolation; }
    public boolean isHasDialysis() { return hasDialysis; }
    public Long getWardId() { return wardId; }
    public String getWardName() { return wardName; }
    public String getWardType() { return wardType; }
    public Integer getWardFloor() { return wardFloor; }
    public Long getHospitalId() { return hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public Long getCurrentPatientId() { return currentPatientId; }
    public String getCurrentPatientName() { return currentPatientName; }
    public Integer getCurrentPatientTriageLevel() { return currentPatientTriageLevel; }
}
